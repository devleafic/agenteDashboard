import React, { useEffect, useContext, useState, useCallback } from 'react';
import { 
  Button, 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Spinner, 
  Card, 
  CardBody,
  Avatar,
  Badge,
  Tooltip,
  Select,
  SelectItem
} from '@heroui/react';
import { Mail, Eye, FolderOpen, ArrowRight, Filter, MoreVertical, Plus, X, RefreshCw, ArrowRightLeftIcon } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import SocketContext from '../../../controladores/SocketContext';
import { toast } from 'react-toastify';
import moment from 'moment';
import MessageBubble from './MessageBubble';

// Estilo para el área de arrastre
const getListStyle = isDraggingOver => ({
  background: isDraggingOver ? '#f0f5ff' : '#f8f9fa',
  padding: 8,
  minHeight: '70vh',
  borderRadius: 6,
  flex: 1,
  overflowY: 'auto'
});

// Estilo para las tarjetas arrastrables
const getItemStyle = (isDragging, draggableStyle) => ({
  userSelect: 'none',
  margin: '0 0 8px 0',
  background: '#fff',
  borderRadius: 8,
  borderLeft: isDragging ? '4px solid #4f46e5' : '1px solid #e2e8f0',
  boxShadow: isDragging ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
  ...draggableStyle
});

// Estilo para las columnas
const columnStyle = {
  backgroundColor: '#f8f9fa',
  borderRadius: 8,
  width: 300,
  margin: '0 8px',
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '80vh',
  border: '1px solid #e2e8f0'
};

// Estilo para el encabezado de la columna
const columnHeaderStyle = {
  padding: '12px 16px',
  borderBottom: '1px solid #e2e8f0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#f8f9fa',
  borderTopLeftRadius: 8,
  borderTopRightRadius: 8
};

const Follow = ({ selectedComponent, setUnReadMessages, vFolio, setVFolio }) => {
    const socketC = useContext(SocketContext);
    const [inboxes, setInboxes] = useState({});
    const [isLoadInbox, setIsLoadInbox] = useState(false);
    const [listPipeline, setListPipeline] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [openModalTransfer, setOpenModalTransfer] = useState(false);
    const [folioToTransfer, setFolioToTransfer] = useState(null);
    const [destinyPipeline, setDestinyPipeline] = useState(null);
    const [titleModal, setTitleModal] = useState('');
    const [contentMessage, setContentMessage] = useState(
        <div className="flex flex-col items-center justify-center p-8">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-600">Cargando mensajes...</p>
        </div>
    );
    const [isLoadTransfer, setIsLoadInboxFolio] = useState(false);
    const [pendingTransfer, setPendingTransfer] = useState(null);

    const initLoadModal = useCallback(() => {
        setOpenModal(false);
        setContentMessage(
            <div className="flex flex-col items-center justify-center p-8">
                <Spinner size="lg" />
                <p className="mt-4 text-gray-600">Cargando mensajes...</p>
            </div>
        );
    }, []);

    const onDragEnd = useCallback((result) => {
        const { source, destination, draggableId } = result;

        if (!destination || 
            (source.droppableId === destination.droppableId && 
             source.index === destination.index)) {
            return;
        }

        const sourceStage = source.droppableId;
        const destinationStage = destination.droppableId;

        let folioToMove = null;
        let sourceStageItems = [];

        if (inboxes[sourceStage]) {
            const foundIndex = inboxes[sourceStage].findIndex(item => item._id === draggableId);
            if (foundIndex !== -1) {
                folioToMove = { ...inboxes[sourceStage][foundIndex] };
                sourceStageItems = [...inboxes[sourceStage]];
            }
        }

        if (!folioToMove) return;

        setPendingTransfer({
            folio: folioToMove,
            sourceStage,
            destinationStage,
            sourceIndex: source.index,
            destinationIndex: destination.index
        });
        setFolioToTransfer(folioToMove);
        setDestinyPipeline(destinationStage);
        setOpenModalTransfer(true);
    }, [inboxes]);

    const confirmTransfer = useCallback(() => {
        if (!folioToTransfer || !destinyPipeline) {
            toast.error('Folio o etapa de destino no válidos');
            return;
        }

        // Si hay un pendingTransfer (flujo de arrastre), actualizar inboxes
        if (pendingTransfer) {
            const { folio, sourceStage, destinationStage, sourceIndex, destinationIndex } = pendingTransfer;

            const newInboxes = { ...inboxes };
            const newSourceItems = [...inboxes[sourceStage]];
            const newDestinationItems = destinationStage in newInboxes 
                ? [...newInboxes[destinationStage]] 
                : [];

            newSourceItems.splice(sourceIndex, 1);
            const updatedFolio = {
                ...folio,
                pipelineStage: destinyPipeline
            };
            newDestinationItems.splice(destinationIndex, 0, updatedFolio);

            setInboxes({
                ...newInboxes,
                [sourceStage]: newSourceItems,
                [destinationStage]: newDestinationItems
            });
        }

        sendTrasnfer(destinyPipeline);
        setOpenModalTransfer(false);
        setPendingTransfer(null);
        setFolioToTransfer(null);
        setDestinyPipeline(null);
    }, [pendingTransfer, inboxes, folioToTransfer, destinyPipeline]);

    const cancelTransfer = useCallback(() => {
        setOpenModalTransfer(false);
        setPendingTransfer(null);
        setFolioToTransfer(null);
        setDestinyPipeline(null);
    }, []);

    const transferPipeline = (folio, destinationStage = null) => {
        if (!folio) return;

        setFolioToTransfer(folio);
        setOpenModalTransfer(true);
        setDestinyPipeline(destinationStage || folio.pipelineStage || null);
    };

    const sendTrasnfer = async (newStage = null) => {
        if (!socketC?.connection || !folioToTransfer) {
            toast.error('Error de conexión o folio no válido');
            return;
        }

        const stageId = newStage || destinyPipeline;
        if (!stageId) {
            toast.error('Selecciona una etapa de destino');
            return;
        }

        const token = window.localStorage.getItem('sdToken');
        if (!token) {
            toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
            return;
        }

        const previousInboxes = { ...inboxes };

        // Depuración: Mostrar los parámetros enviados
        console.log('Enviando transferencia:', {
            folio: folioToTransfer,
            newStage: stageId,
            token
        });

        try {
            socketC.connection.emit('transferStage', {
                folio: folioToTransfer,
                newStage: stageId,
                token
            }, (res) => {
                console.log('Respuesta del servidor:', res);

                if (!res) {
                    toast.error('No se recibió respuesta del servidor');
                    setInboxes(previousInboxes);
                    return;
                }

                if (res.success) {
                    toast.success('Folio transferido correctamente');
                    loadInbox();
                } else {
                    toast.error(res.message || 'Error al transferir el folio');
                    setInboxes(previousInboxes);
                }

                setOpenModalTransfer(false);
                setFolioToTransfer(null);
                setDestinyPipeline(null);
            });
        } catch (error) {
            console.error('Error en sendTrasnfer:', error);
            toast.error('Error al procesar la transferencia');
            setInboxes(previousInboxes);
            setOpenModalTransfer(false);
        }
    };

    const sortInboxes = (inb, mapSort) => {
        if (!inb || !mapSort) return {};

        const tmpSort = {};

        mapSort.forEach(x => {
            if (x?._id) {
                tmpSort[x._id] = [];
            }
        });

        inb.forEach(x => {
            if (x?.pipelineStage) {
                if (!tmpSort[x.pipelineStage]) {
                    tmpSort[x.pipelineStage] = [];
                }
                tmpSort[x.pipelineStage].push(x);
            }
        });

        inb.forEach(x => {
            if (!x?.pipelineStage && x?.folio?.fromPipeline) {
                const firstStage = mapSort[0]?._id;
                if (firstStage) {
                    if (!tmpSort[firstStage]) {
                        tmpSort[firstStage] = [];
                    }
                    const exists = tmpSort[firstStage].some(item => item._id === x._id);
                    if (!exists) {
                        tmpSort[firstStage].push(x);
                    }
                }
            }
        });

        return tmpSort;
    };

    const RenderFolioCard = React.memo(({ item, index }) => {
        if (!item || !item.folio) return null;

        return (
            <Draggable key={item._id} draggableId={item._id} index={index}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={getItemStyle(
                            snapshot.isDragging,
                            provided.draggableProps.style
                        )}
                        className="bg-white rounded-md p-3 mb-2 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-sm text-gray-900 truncate">
                                        {item.aliasUser || 'Sin alias'}
                                    </h4>
                                    <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                                        {item.folio.updatedAt ? moment(item.folio.updatedAt).fromNow() : 'Recién'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">
                                    <span className="font-medium">Folio:</span> {item.folio._id || 'N/A'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    <span className="font-medium">Tipo:</span> {item.folio.typeFolio || 'No especificado'}
                                </p>
                                {item.channel && (
                                    <p className="text-xs text-gray-500">
                                        <span className="font-medium">Canal:</span> {item.channel}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                            <div className="flex space-x-1">
                                <Tooltip content="Abrir conversación">
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        onPress={() => {
                                            openItemInbox(item.folio, item, '');
                                            setUnReadMessages(false);
                                        }}
                                        className="text-blue-600 hover:bg-blue-50"
                                    >
                                        <FolderOpen className="w-3.5 h-3.5" />
                                    </Button>
                                </Tooltip>
                                <Tooltip content="Vista previa">
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        onPress={() => getFolioMessages(item.folio._id)}
                                        className="text-gray-600 hover:bg-gray-100"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                    </Button>
                                </Tooltip>
                            </div>
                            {item.folio?.status === 3 ? (
                                <Badge color="danger" size="sm">Finalizado</Badge>
                            ) : (
                                <div onClick={(e) => e.stopPropagation()}>
                                    <Tooltip content="Transferir a otra etapa">
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            onPress={() => transferPipeline(item)}
                                            className="text-purple-600 hover:bg-purple-50"
                                        >
                                            <ArrowRightLeftIcon className="w-3.5 h-3.5" />
                                        </Button>
                                    </Tooltip>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Draggable>
        );
    }, (prevProps, nextProps) => prevProps.item._id === nextProps.item._id && prevProps.index === nextProps.index);

    const renderPipelineColumn = (pipe) => {
        if (!pipe) return null;

        const items = inboxes[pipe._id] || [];
        const itemCount = items.length;

        return (
            <div key={pipe._id} style={{ ...columnStyle, borderTop: `4px solid ${pipe.color || '#3b82f6'}` }}>
                <div style={columnHeaderStyle}>
                    <div className="flex items-center">
                        <span className="font-medium text-sm text-gray-800">{pipe.name}</span>
                        <span className="ml-2 bg-gray-200 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full">
                            {itemCount}
                        </span>
                    </div>
                    <Button isIconOnly size="sm" variant="light" className="text-gray-500">
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                </div>
                <Droppable droppableId={pipe._id} type="CARD">
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            style={getListStyle(snapshot.isDraggingOver)}
                            {...provided.droppableProps}
                            className="flex-1 overflow-y-auto"
                        >
                            {items.length > 0 ? (
                                items.map((item, index) => (
                                    <RenderFolioCard item={item} index={index} key={item._id} />
                                ))
                            ) : (
                                <div className="text-center p-4 text-sm text-gray-500">
                                    No hay elementos en esta etapa
                                </div>
                            )}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>
        );
    };

    const loadInbox = async () => {
        if (!socketC?.connection) {
            toast.error('No hay conexión con el servidor');
            return;
        }

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
                    setInboxes({});
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

                setListPipeline(pipelineConfig.pipelines || []);
                const sortedInboxes = sortInboxes(filteredArray, pipelineConfig.pipelines);
                setInboxes(sortedInboxes || {});
                setUnReadMessages(filteredArray.some(x => x.status === 1));
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
        return () => {};
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

    return (
        <div className="p-4 bg-gray-100 min-h-screen">
            <div className="mb-6 bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Filter className="w-5 h-5 text-blue-600 mr-2" />
                        <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
                            Tablero de Seguimiento
                         </h2>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button 
                            color="primary" 
                            startContent={<RefreshCw className="w-4 h-4" />}
                            size="sm"
                            onPress={loadInbox}
                            isLoading={isLoadInbox}
                        >
                            Actualizar
                        </Button>
                    </div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                    Arrastra y suelta los contactos entre etapas para gestionar tu flujo de trabajo.
                </p>
            </div>

            {isLoadInbox && Object.keys(inboxes).length === 0 ? (
                <div className="flex items-center justify-center p-12 bg-white rounded-lg shadow">
                    <Spinner size="lg" />
                    <span className="ml-3 text-gray-600">Cargando tu tablero...</span>
                </div>
            ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex overflow-x-auto pb-4 -mx-2">
                        {listPipeline
                            .filter(pipe => pipe.status === true)
                            .map(pipe => renderPipelineColumn(pipe))
                        }
                    </div>
                </DragDropContext>
            )}

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

            <Modal isOpen={openModalTransfer} onClose={cancelTransfer}>
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
                            onPress={cancelTransfer}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            color="primary" 
                            onPress={confirmTransfer}
                            isDisabled={!destinyPipeline || !folioToTransfer}
                        >
                            Transferir
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
};

export default Follow;