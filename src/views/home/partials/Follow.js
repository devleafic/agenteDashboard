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
  Card, 
  CardBody, 
  CardHeader as CardHeaderHUI,
  Select, 
  SelectItem,
  Image,
  Badge
} from '@heroui/react';
import { Mail, Eye, FolderOpen, ArrowRight, X, Filter, Check } from 'lucide-react';
import SocketContext from '../../../controladores/SocketContext';
import { toast } from 'react-toastify';
import moment from 'moment';
import MessageBubble from './MessageBubble';

const Follow = ({selectedComponent, setUnReadMessages, vFolio, setVFolio}) => {
    const socketC = useContext(SocketContext);
    const [inboxes, setInboxes ] = useState([]);
    const [isLoadInbox, setIsLoadInbox ] = useState(false);

    const [isLoadInboxFolio, setIsLoadInboxFolio ] = useState({});
    const [openModalTransfer, setOpenModalTransfer] = useState(false);
    const [folioToTransfer, setFolioToTransfer] = useState(null);
    const [listPipeline, setListPipeline] = useState([]);
    const [destinyPipeline, setDestinyPipeline] = useState(null);

    //preview modal 
    const [openModal, setOpenModal] = useState(false);
    const [titleModal, setTitleModal ] = useState('');
    const [contentMessage, setContentMessage] = useState(
        <div className="flex flex-col items-center justify-center p-8">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
    );

    const initLoadModal = () => {
        setOpenModal(!openModal);
        setContentMessage(
            <div className="flex flex-col items-center justify-center p-8">
                <Spinner size="lg" />
                <p className="mt-4 text-gray-600">Cargando...</p>
            </div>
        );
    }

    const transferPipeline = (folio) => {
        setOpenModalTransfer(true);
        setFolioToTransfer(folio);
    };

    const sortInboxes = (inb, mapSort) => {
        if (!inb || !mapSort) return {};
        
        const tmpSort = {};
        mapSort.forEach(x => {
            if (x?._id) {
                tmpSort[x._id] = [];
            }
        });
        
        inb
            .filter(x => x?.folio?.fromPipeline === true)
            .forEach(x => {
                if (x?.pipelineStage) {
                    if (!tmpSort[x.pipelineStage]) {
                        tmpSort[x.pipelineStage] = [];
                    }
                    tmpSort[x.pipelineStage].push(x);
                }
            });

        return tmpSort;
    }

    const cardPipeline = (pipe, list) => {
        if (!pipe || !list) return null;
        
        return (
            <div 
                key={`card-${pipe._id}`} 
                className="w-72 flex-shrink-0 bg-white rounded-lg shadow-md overflow-hidden m-4"
                style={{ borderLeft: `6px solid ${pipe.color || '#3b82f6'}` }}
            >
                <div className="p-4 bg-gray-50 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-center text-gray-800">{pipe.name || 'Sin nombre'}</h3>
                </div>
                <div className="p-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                    {list.map((x) => {
                        if (!x || !x.folio) return null;
                        
                        return (
                            <Card key={x._id} className="mb-3 shadow-sm hover:shadow-md transition-shadow">
                                <CardBody className="p-3">
                                    <div className="flex items-start mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium text-gray-900">{x.aliasUser || 'Sin alias'}</h4>
                                                <span className="text-xs text-gray-500">
                                                    {x.folio.updatedAt ? moment(x.folio.updatedAt).fromNow() : 'Recién'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">Folio: {x.folio._id || 'N/A'}</p>
                                            <p className="text-xs text-gray-500">Tipo: {x.folio.typeFolio || 'No especificado'}</p>
                                            <p className="text-xs text-gray-500">Canal: {x.channel || 'No especificado'}</p>
                                            {x.anchor && <p className="text-xs text-gray-500">ID: {x.anchor}</p>}
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-end space-x-2 mt-3">
                                        {x.folio?.status === 3 ? (
                                            <span className="px-2 py-1 text-xs text-red-600 bg-red-50 rounded">Finalizado</span>
                                        ) : (
                                            <>
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    onPress={() => {
                                                        openItemInbox(x.folio, x, pipe.name);
                                                        setUnReadMessages(false);
                                                        setIsLoadInboxFolio(prev => ({
                                                            ...prev,
                                                            [x.folio._id]: true
                                                        }));
                                                    }}
                                                    isLoading={isLoadInboxFolio[x.folio?._id]}
                                                    isDisabled={isLoadInboxFolio[x.folio?._id]}
                                                    className="text-blue-600 hover:bg-blue-50"
                                                >
                                                    <FolderOpen className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    onPress={() => getFolioMessages(x.folio._id)}
                                                    className="text-gray-600 hover:bg-gray-100"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    onPress={() => transferPipeline(x)}
                                                    className="text-purple-600 hover:bg-purple-50"
                                                >
                                                    <ArrowRight className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </CardBody>
                            </Card>
                        );
                    })}
                </div>
            </div>
        );
    }

    const loadInbox = async () => {
        if (!socketC?.connection) return;
        
        setIsLoadInbox(true);
        const token = window.localStorage.getItem('sdToken');
        
        if (!token) {
            toast.error('No se encontró el token de autenticación');
            setIsLoadInbox(false);
            return;
        }
        
        try {
            socketC.connection.emit('loadInbox', { token }, (data) => {
                setIsLoadInbox(false);
                
                if (!data || !data.success) {
                    toast.error(data?.message || 'Error al cargar el pipeline');
                    setInboxes([]);
                    return;
                }
                
                const filteredArray = (data.inboxes || []).filter(item => item?.pipeline !== undefined);
                
                if (filteredArray.length === 0) {
                    setInboxes({});
                    setUnReadMessages(false);
                    return;
                }
                
                const firstItem = filteredArray[0];
                if (!firstItem?.service?.pipelines) {
                    console.error('Datos de pipeline no encontrados');
                    setInboxes({});
                    return;
                }
                
                const idPipe = firstItem.pipeline;
                const pipelineConfig = firstItem.service.pipelines.find(x => x?._id === idPipe);
                
                if (!pipelineConfig?.pipelines) {
                    console.error('Configuración de pipeline no encontrada');
                    setInboxes({});
                    return;
                }
                
                const sortedInboxes = sortInboxes(data.inboxes, pipelineConfig.pipelines);
                setInboxes(sortedInboxes || {});
                
                const hasUnread = filteredArray.some(x => x.status === 1);
                setUnReadMessages(!!hasUnread);
                
                const folioList = {};
                filteredArray.forEach(x => {
                    if (x?.folio?._id) {
                        folioList[x.folio._id] = false;
                    }
                });
                setIsLoadInboxFolio(folioList);
            });
        } catch (error) {
            console.error('Error en loadInbox:', error);
            setIsLoadInbox(false);
            setInboxes({});
            toast.error('Error al cargar el pipeline');
        }
    };

    useEffect(() => {
        loadInbox();
        
        // Cleanup function
        return () => {
            // Cleanup if needed
        };
    }, []);

    const openItemInbox = (folio, item, pipe) => {
        if (!socketC?.connection || !folio?._id) {
            toast.error('Error: Conexión o folio no válido');
            return;
        }
        
        const token = window.localStorage.getItem('sdToken');
        if (!token) {
            toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
            return;
        }
        
        console.time('openItemInbox');
        
        try {
            socketC.connection.emit('openItemInbox', {
                token,
                folio,
                item
            }, (data) => {
                console.timeEnd('openItemInbox');
                
                if (!data) {
                    toast.error('No se recibió respuesta del servidor');
                    return;
                }
                
                if (data.success) {
                    setVFolio(folio._id);
                    toast.success(<label>Se abrió el folio <b>#{folio._id}</b></label>);
                    
                    if (typeof selectedComponent === 'function') {
                        selectedComponent('home');
                    }
                } else {
                    toast.error(data.message || 'Error al abrir el folio');
                }
            });
        } catch (error) {
            console.error('Error en openItemInbox:', error);
            toast.error('Error al procesar la solicitud');
        }
    };
    const getFolioMessages = (folioId) => {
        if (!socketC?.connection || !folioId) {
            toast.error('Error: Conexión o ID de folio no válido');
            return;
        }
        
        setTitleModal(`Vista Previa #${folioId}`);
        setOpenModal(true);
        
        // Set loading state
        setContentMessage(
            <div className="flex flex-col items-center justify-center p-8">
                <Spinner size="lg" />
                <p className="mt-4 text-gray-600">Cargando mensajes...</p>
            </div>
        );
        
        try {
            socketC.connection.emit('getMessageHist', { folio: folioId }, (res) => {
                if (!res) {
                    setContentMessage(
                        <div className="p-4 text-center text-red-600">
                            No se recibió respuesta del servidor
                        </div>
                    );
                    return;
                }
                
                if (!res.success) {
                    setContentMessage(
                        <div className="p-4 text-center text-red-600">
                            {res.message || 'Error al cargar los mensajes'}
                        </div>
                    );
                    return;
                }
                
                if (!res.folio?.message || !Array.isArray(res.folio.message)) {
                    setContentMessage(
                        <div className="p-4 text-center text-gray-600">
                            No hay mensajes para mostrar
                        </div>
                    );
                    return;
                }
                
                setContentMessage(
                    <div className="space-y-4 p-4">
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
            console.error('Error en getFolioMessages:', error);
            setContentMessage(
                <div className="p-4 text-center text-red-600">
                    Error al cargar los mensajes
                </div>
            );
        }
    };

    const sendTrasnfer = () => {
        if (!socketC?.connection) {
            toast.error('Error de conexión');
            return;
        }
        
        if (!destinyPipeline) {
            toast.error('Selecciona una etapa de destino');
            return;
        }
        
        if (!folioToTransfer) {
            toast.error('No se ha seleccionado ningún folio para transferir');
            return;
        }
        
        setOpenModalTransfer(false);
        
        const token = window.localStorage.getItem('sdToken');
        if (!token) {
            toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
            return;
        }
        
        try {
            socketC.connection.emit('transferStage', {
                folio: folioToTransfer, 
                newStage: destinyPipeline,
                token
            }, (res) => {
                if (!res) {
                    toast.error('No se recibió respuesta del servidor');
                    return;
                }
                
                if (res.success) {
                    toast.success('Se transfirió el folio correctamente');
                    setDestinyPipeline(null);
                    setFolioToTransfer(null);
                    loadInbox();
                } else {
                    toast.error(res.message || 'Error al transferir el folio');
                }
            });
        } catch (error) {
            console.error('Error en sendTrasnfer:', error);
            toast.error('Error al procesar la transferencia');
        }
    };

    return (
        <div className="p-6 bg-gray-100 h-screen overflow-auto">
            <div className="mb-6 bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                    <Filter className="w-5 h-5 text-blue-600 mr-2" />
                    <h2 className="text-xl font-semibold text-gray-800">Pipeline de conversaciones</h2>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                    Selecciona un contacto para continuar con la conversación o moverla de etapa.
                </p>
            </div>

            {isLoadInbox ? (
                <div className="flex items-center justify-center p-8">
                    <Spinner size="lg" />
                    <span className="ml-2">Cargando...</span>
                </div>
            ) : (
                <div className="flex overflow-x-auto pb-4 -mx-2">
                    {Object.keys(inboxes).map((x) => {
                        if (!inboxes[x] || inboxes[x].length <= 0) {
                            return null;
                        }
                        
                        const firstItem = inboxes[x][0];
                        if (!firstItem?.pipeline || !firstItem?.service?.pipelines) {
                            return null;
                        }
                        
                        const pipelineId = firstItem.pipeline;
                        const infoPipe = firstItem.service.pipelines.find(y => y?._id === pipelineId);
                        
                        if (!infoPipe) return null;
                        
                        const infoStage = infoPipe.pipelines?.find(y => x === y?._id);
                        if (!infoStage) return null;
                        
                        if (listPipeline.length <= 0 && Array.isArray(infoPipe.pipelines)) {
                            setListPipeline(infoPipe.pipelines);
                        }
                        
                        return cardPipeline(infoStage, inboxes[x]);
                    })}
                </div>
            )}
        {/* Message Preview Modal */}
        <Modal isOpen={openModal} onClose={() => setOpenModal(false)} size="3xl">
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    {titleModal}
                </ModalHeader>
                <ModalBody>
                    {contentMessage}
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onPress={() => setOpenModal(false)}>
                        Cerrar
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>

        {/* Transfer Modal */}
        <Modal isOpen={openModalTransfer} onClose={() => {
            setOpenModalTransfer(false);
            setDestinyPipeline(null);
        }}>
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    Mover de Etapa: {folioToTransfer?.aliasUser || 'Usuario'}
                </ModalHeader>
                <ModalBody>
                    {folioToTransfer && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                                Selecciona la etapa a la cual será transferido el folio 
                                <span className="font-semibold"> #{folioToTransfer.folio?._id || ''}</span> del usuario 
                                <span className="font-semibold"> {folioToTransfer.aliasUser || 'Usuario'}</span>
                            </p>
                            
                            <Select
                                label="Selecciona la etapa"
                                placeholder="Elige una etapa"
                                selectedKeys={destinyPipeline ? [destinyPipeline] : []}
                                onSelectionChange={(keys) => {
                                    const selectedKey = Array.from(keys)[0];
                                    setDestinyPipeline(selectedKey);
                                }}
                                className="w-full"
                                isDisabled={!folioToTransfer}
                            >
                                {listPipeline
                                    .filter((x) => x._id !== folioToTransfer?.pipelineStage && x.status === true)
                                    .map((x) => (
                                        <SelectItem key={x._id} value={x._id}>
                                            {x.name}
                                        </SelectItem>
                                    ))
                                }
                            </Select>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button 
                        color="danger" 
                        variant="light" 
                        onPress={() => {
                            setOpenModalTransfer(false);
                            setDestinyPipeline(null);
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        color="primary" 
                        onPress={() => {
                            if (window.confirm('¿Estás seguro de transferir el folio?')) {
                                sendTrasnfer();
                            }
                        }}
                        isDisabled={!destinyPipeline || !folioToTransfer}
                    >
                        Transferir
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
        </div>
    );
}

export default Follow;