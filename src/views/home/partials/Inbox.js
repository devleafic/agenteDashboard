import React, { useEffect, useContext, useState } from 'react';
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell, 
  Button, 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Spinner, 
  Chip,
  addToast,
  ToastProvider,

} from '@heroui/react';
import { Mail, Eye, FolderOpen, Circle } from 'lucide-react';
import SocketContext from '../../../controladores/SocketContext';
//import { toast } from 'react-toastify';
import moment from 'moment';
import MessageBubble from './MessageBubble';

const Inbox = ({selectedComponent, setUnReadMessages, vFolio, setVFolio}) => {
    const socketC = useContext(SocketContext);
    const [inboxes, setInboxes] = useState([]);
    const [filteredInboxes, setFilteredInboxes] = useState([]);
    const [isLoadInbox, setIsLoadInbox] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        channel: 'all',
        status: 'all'
    });

    const [isLoadInboxFolio, setIsLoadInboxFolio] = useState({});

    //preview modal 
    const [openModal, setOpenModal] = useState(false);
    const [titleModal, setTitleModal ] = useState('');
    const [contentMessage, setContentMessage] = useState(
        <div className="flex flex-col items-center justify-center p-8">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
    );

    const initLoadModal = () => { //reset values for Modal 
        setOpenModal(!openModal);
        setContentMessage(
            <div className="flex flex-col items-center justify-center p-8">
                <Spinner size="lg" />
                <p className="mt-4 text-gray-600">Cargando...</p>
            </div>
        );
    }

    useEffect(() => {
        let isMounted = true;
        
        const loadInbox = async () => {
            if (!socketC?.connection) {
                console.error('Socket connection not available');
                return;
            }

            setIsLoadInbox(true);
            
            try {
                const token = window.localStorage.getItem('sdToken');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                socketC.connection.emit('loadInbox', { token }, (data) => {
                    if (!isMounted) return;
                    
                    setIsLoadInbox(false);
                    
                    if (!data || !Array.isArray(data.inboxes)) {
                        console.error('Invalid data received:', data);
                        addToast({
                            title: 'Error al cargar los mensajes',
                            description: 'Error al cargar los mensajes',
                            color: 'error'
                        });
                        return;
                    }

                    const inboxesData = Array.isArray(data.inboxes) ? data.inboxes : [];
                    setInboxes(inboxesData);
                    setFilteredInboxes(inboxesData);
                    
                    const hasUnread = inboxesData.some(x => x.status === 1);
                    setUnReadMessages(hasUnread);

                    const folioList = {};
                    inboxesData.forEach(x => {
                        if (x?.folio?._id) {
                            folioList[x.folio._id] = false;
                        }
                    });
                    setIsLoadInboxFolio(folioList);
                });
            } catch (error) {
                console.error('Error loading inbox:', error);
                if (isMounted) {
                    setIsLoadInbox(false);
                    addToast({
                        title: 'Error al cargar la bandeja de entrada',
                        description: 'Error al cargar la bandeja de entrada',
                        color: 'error'
                    });
                }
            }
        };
        
        loadInbox();
        
        return () => {
            isMounted = false;
        };
    }, [socketC]);

    // Auto-open folio when coming from ReminderCenter "Ver"
    useEffect(() => {
        try {
            const target = window.localStorage.getItem('openFolioFromReminder');
            if (!target) return;
            if (!Array.isArray(inboxes) || inboxes.length === 0) return;

            const match = inboxes.find(x => String(x?.folio?._id) === String(target));
            if (match?.folio?._id) {
                openItemInbox(match.folio, match);
                setUnReadMessages(false);
                setIsLoadInboxFolio(prev => ({ ...prev, [match.folio._id]: true }));
            } else {
                addToast({ title: 'Folio no encontrado en Inbox', color: 'warning' });
            }
            window.localStorage.removeItem('openFolioFromReminder');
        } catch (_) {
            // ignore
        }
    }, [inboxes]);

    const openItemInbox = (folio, item) => {
        if (!socketC?.connection) {
            addToast({
                title: 'Error de conexión',
                description: 'Error de conexión',
                color: 'error'
            });
            return;
        }

        if (!folio?._id) {
            console.error('Invalid folio data:', folio);
            addToast({
                title: 'Error al abrir el folio',
                description: 'Datos de folio inválidos',
                color: 'error'
            });
            return;
        }

        const token = window.localStorage.getItem('sdToken');
        if (!token) {
            addToast({
                title: 'Error al abrir el folio',
                description: 'Sesión expirada. Por favor, inicie sesión nuevamente.',
                color: 'error'
            });
            return;
        }

        try {
            console.time('openItemInbox');
            setIsLoadInboxFolio(prev => ({
                ...prev,
                [folio._id]: true
            }));

            socketC.connection.emit('openItemInbox', {
                token,
                folio,
                item
            }, (data) => {
                setVFolio(folio._id);
                
                if (!data) {
                    addToast({
                        title: 'Error al abrir el folio',
                        description: 'No se recibió respuesta del servidor',
                        color: 'error'
                    });
                    return;
                }

                if (!data.success) {
                    addToast({
                        title: 'Error al abrir el folio',
                        description: data.message || 'Error al abrir el folio',
                        color: 'error'
                    });
                    return;
                }

                addToast({
                    title: 'Se abrió el folio',
                    description: <label>Se abrió el folio <b>#{folio._id}</b></label>,
                    color: 'warning'
                });
                setUnReadMessages(false);
                
                if (typeof selectedComponent === 'function') {
                    selectedComponent('home');
                }
                
                console.timeEnd('openItemInbox');
            });
        } catch (error) {
            console.error('Error in openItemInbox:', error);
            addToast({
                title: 'Error al abrir el folio',
                description: 'Error al procesar la solicitud',
                color: 'error'
            });
            setIsLoadInboxFolio(prev => ({
                ...prev,
                [folio._id]: false
            }));
        }
    }
    const getFolioMessages = (folioId) => {
        if (!socketC?.connection) {
            addToast({
                title: 'Error de conexión',
                description: 'Error de conexión',
                color: 'error'
            });
            return;
        }

        if (!folioId) {
            console.error('No se proporcionó un ID de folio');
            addToast({
                title: 'Error al abrir el folio',
                description: 'Error: ID de folio no válido',
                color: 'error'
            });
            return;
        }

        setTitleModal(`Vista Previa #${folioId}`);
        setOpenModal(true);

        // Show loading state
        setContentMessage(
            <div className="flex flex-col items-center justify-center p-8">
                <Spinner size="lg" />
                <p className="mt-4 text-gray-600">Cargando mensajes...</p>
            </div>
        );

        try {
            socketC.connection.emit('getMessageHist', { folio: folioId }, (res) => {
                if (!res) {
                    throw new Error('No se recibió respuesta del servidor');
                }

                if (!res.success) {
                    throw new Error(res.message || 'Error al cargar los mensajes');
                }

                if (!res.folio?.message || !Array.isArray(res.folio.message)) {
                    throw new Error('Formato de datos inválido');
                }

                setContentMessage(
                    <div className='imessage'>
                        {res.folio.message.map((msg) => (
                            <MessageBubble 
                                key={msg?._id || Math.random().toString(36).substr(2, 9)}
                                message={msg}
                            />
                        ))}
                    </div>
                );
            });
        } catch (error) {
            console.error('Error loading messages:', error);
            setContentMessage(
                <div className="p-4 text-center text-red-600">
                    <p>Error al cargar los mensajes</p>
                    <p className="text-sm text-gray-500">{error.message}</p>
                </div>
            );
        }
    }
    // Apply filters
    useEffect(() => {
        if (!Array.isArray(inboxes)) {
            setFilteredInboxes([]);
            return;
        }

        try {
            let result = [...inboxes];
            const searchTerm = String(filters.search || '').toLowerCase();
            
            // Filter by search term
            if (searchTerm) {
                result = result.filter(item => {
                    if (!item) return false;
                    return (
                        String(item.folio?._id || '').toLowerCase().includes(searchTerm) ||
                        String(item.anchor || '').toLowerCase().includes(searchTerm) ||
                        String(item.aliasUser || '').toLowerCase().includes(searchTerm) ||
                        String(item.queue || '').toLowerCase().includes(searchTerm)
                    );
                });
            }
            
            // Filter by channel
            if (filters.channel && filters.channel !== 'all') {
                result = result.filter(item => item?.channel === filters.channel);
            }
            
            // Filter by status
            if (filters.status && filters.status !== 'all') {
                if (filters.status === 'unread') {
                    result = result.filter(item => item?.status === 1);
                } else if (filters.status === 'read') {
                    result = result.filter(item => item?.status !== 1);
                }
            }
            
            setFilteredInboxes(result);
        } catch (error) {
            console.error('Error applying filters:', error);
            setFilteredInboxes([]);
        }
    }, [filters, inboxes]);

    // Get unique channels for filter dropdown
    const uniqueChannels = React.useMemo(() => {
        try {
            if (!Array.isArray(inboxes)) return [];
            return [...new Set(
                inboxes
                    .map(item => item?.channel)
                    .filter(channel => channel != null && channel.trim() !== '')
            )];
        } catch (error) {
            console.error('Error getting unique channels:', error);
            return [];
        }
    }, [inboxes]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            channel: 'all',
            status: 'all'
        });
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 mb-6 bg-blue-50 rounded-t-lg border-b border-blue-100">
                <div className="flex items-center mb-4 md:mb-0">
                    <Mail className="w-6 h-6 mr-3 text-blue-600" />
                    <div>
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
                            Inbox Privado
                    </h2>
                        <p className="text-sm text-gray-600">Selecciona un contacto para continuar con la conversación.</p>
                    </div>
                </div>
                
                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            name="search"
                            placeholder="Buscar..."
                            value={filters.search}
                            onChange={handleFilterChange}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <svg 
                            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    
                    <select
                        name="channel"
                        value={filters.channel}
                        onChange={handleFilterChange}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">Todos los canales</option>
                        {uniqueChannels.map(channel => (
                            <option key={channel} value={channel}>
                                {channel}
                            </option>
                        ))}
                    </select>
                    
                    <select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="unread">No leídos</option>
                        <option value="read">Leídos</option>
                    </select>
                    
                    {(filters.search || filters.channel !== 'all' || filters.status !== 'all') && (
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <Table aria-label="Tabla de mensajes" className="min-w-full">
                    <TableHeader>
                        <TableColumn key="folio">FOLIO</TableColumn>
                        <TableColumn key="identificador">IDENTIFICADOR</TableColumn>
                        <TableColumn key="alias">ALIAS</TableColumn>
                        <TableColumn key="canal">CANAL</TableColumn>
                        <TableColumn key="bandeja">BANDEJA</TableColumn>
                        <TableColumn key="transferido">TRANSFERIDO POR</TableColumn>
                        <TableColumn key="actualizacion">ÚLTIMA ACTUALIZACIÓN</TableColumn>
                        <TableColumn key="accion1" width={50}></TableColumn>
                        <TableColumn key="accion2" width={50}></TableColumn>
                    </TableHeader>
                    <TableBody>
                        {isLoadInbox && (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-4">
                                    <div className="flex items-center justify-center">
                                        <Spinner size="sm" className="mr-2" />
                                        <span>Cargando...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                        
                        {!isLoadInbox && filteredInboxes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-4 text-gray-500">
                                    <div className="flex flex-col items-center">
                                        <Mail className="w-8 h-8 mb-2 text-gray-400" />
                                        <span>No hay mensajes guardados</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}

                        {filteredInboxes
                            .filter(x => !(x.status === 3 || x.folio?.status === 3 || x.folio?.fromPipeline === true))
                            .map((x) => (
                                <TableRow key={x._id} className="hover:bg-gray-50">
                                    <TableCell>
                                        <div className="flex items-center">
                                            {x.status === 1 && (
                                                <Circle className="w-3 h-3 mr-2 text-red-500 fill-current" />
                                            )}
                                            <span className="font-medium">{x.folio?._id}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{x.anchor}</TableCell>
                                    <TableCell>{x.aliasUser || "Sin alias"}</TableCell>
                                    <TableCell>
                                        <Chip size="sm" color="primary" variant="flat">
                                            {x.channel}
                                        </Chip>
                                    </TableCell>
                                    <TableCell>{x.queue}</TableCell>
                                    <TableCell className="text-sm">
                                        {x.userFromName && x.transferDate 
                                            ? `${x.userFromName} - ${x.transferDate}` 
                                            : "N/A"}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-500">
                                        {moment(x.folio.updatedAt).fromNow()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {x.folio?.status === 3 ? (
                                            <span className="text-sm text-gray-500">Finalizado</span>
                                        ) : (
                                            <Button
                                                isIconOnly
                                                color="primary"
                                                variant="light"
                                                onPress={() => {
                                                    openItemInbox(x.folio, x);
                                                    setUnReadMessages(false);
                                                    setIsLoadInboxFolio({
                                                        ...isLoadInboxFolio,
                                                        [x.folio._id]: true
                                                    });
                                                }}
                                                isLoading={isLoadInboxFolio[x.folio._id]}
                                                isDisabled={isLoadInboxFolio[x.folio._id]}
                                                className="text-blue-600 hover:bg-blue-50"
                                            >
                                                <FolderOpen className="w-5 h-5" />
                                            </Button>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            isIconOnly
                                            variant="light"
                                            onPress={() => getFolioMessages(x.folio._id)}
                                            className="text-gray-600 hover:bg-gray-100"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </div>

            <Modal isOpen={openModal} scrollBehavior="inside" onClose={initLoadModal} size="3xl">
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        {titleModal}
                    </ModalHeader>
                    <ModalBody>
                        {contentMessage}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onPress={initLoadModal}>
                            Cerrar
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );

}
 
export default Inbox;