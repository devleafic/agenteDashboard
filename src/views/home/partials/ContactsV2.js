import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Divider
} from "@heroui/react";
import { SearchIcon, PlusIcon, UserCircle, Phone, Mail, Calendar, User, X, Check, MessageSquare, FolderOpen } from 'lucide-react';
import MessageBubble from './MessageBubble';
import SocketContext from '../../../controladores/SocketContext';
import shortParagraph from './../../../img/short-paragraph.png';

const ContactsV2 = ({ selectedComponent, setUnReadMessages, vFolio, setVFolio, userInfo }) => {
  const Socket = useContext(SocketContext);
  const [report, setReport] = useState(null);
  const [onLoad, setOnLoad] = useState(false);
  const [numRows, setNumRows] = useState(10);
  const [currentPag, setCurrentPag] = useState(1);
  const [showRows, setShowRows] = useState([]);
  const [query, setQuery] = useState("");
  const [isLoadInboxFolio, setIsLoadInboxFolio] = useState(false);
  const [showModalContact, setShowModalContact] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [createContact, setCreateContact] = useState(false);
  const [historyContent, setHistoryContent] = useState(null);
  const [historyTitle, setHistoryTitle] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [showErrorMsg, setShowErrorMsg] = useState(false);
  const [messageError, setMessageError] = useState('Todos los campos son requeridos.');
  
  const initialStateForm = {
    service: userInfo.service.id,
    isNew: true,
    anchorUser: '',
    alias: '',
    idChannel: '',
    idQueue: userInfo.service.queue,
    createdByAgent: userInfo._id
  };
  
  const [formToContact, setFormToContact] = useState(initialStateForm);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Función para cargar los contactos
  const onContactJSON = async () => {
    setReport(null);
    setOnLoad(true);
    setShowRows([]);

    try {
      const serviceId = userInfo.service.id;
      console.log('Solicitando contactos para el servicio:', serviceId);
      console.log('Query de búsqueda:', query);
      
      const result = await axios.get(`${process.env.REACT_APP_CENTRALITA}/searchData/json/${serviceId}`, {
        params: {
          typeReport: 'r_crmData',
          query: query || ''
        }
      });
      
      console.log('Respuesta de la API:', result.data);
      
      if (result.data?.report) {
        const { report } = result.data;
        const { result: contacts = [], dictionary = {} } = report;
        
        console.log('Datos del reporte:', report);
        
        // Mapear los datos al formato esperado por la tabla
        const mappedData = Array.isArray(contacts) ? contacts.map(item => ({
          id: item._id,
          aliasId: item.aliasId || 'Sin nombre',
          anchor: item.anchor || 'Sin teléfono',
          channel: item.channel || 'Sin canal',
          channelAnchor: item.channelAnchor || 'N/A',
          createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Sin fecha',
          lastFolio: item.lastFolio || 'N/A',
          queue: item.queue || 'Sin cola',
          statusFolio: item.statusFolio || 'N/A',
          profilePic: item.profilePic || 'https://via.placeholder.com/40',
          originalData: item // Mantener los datos originales
        })) : [];
        
        console.log('Datos mapeados para la tabla:', mappedData);
        
        // Actualizar el estado con los datos mapeados y el diccionario
        setReport({
          ...report,
          result: mappedData,
          dictionary: dictionary
        });
        
        // Mostrar solo las primeras filas según la paginación
        setShowRows(mappedData.slice(0, numRows));
      } else {
        console.warn('La respuesta de la API no tiene el formato esperado:', result.data);
        setReport({ 
          result: [],
          dictionary: {}
        });
        setShowRows([]);
      }
    } catch (error) {
      console.error('Error al cargar contactos:', error);
      if (error.response) {
        console.error('Detalles del error:', error.response.data);
      }
      toast.error('Error al cargar la lista de contactos');
    } finally {
      setOnLoad(false);
    }
  };

  // Función para obtener el historial de mensajes de un folio
  const getFolioMessages = async (folio, anchorPerson, aliasIdPerson, channel, queue) => {
    console.time('getFolioMessages');
    setShowHistoryModal(true);
    setHistoryTitle(`Historial de Folio #${folio} - ${aliasIdPerson}`);
    setHistoryContent(
      <div className="flex justify-center items-center p-8">
        <Spinner size="lg" />
        <span className="ml-2">Cargando historial...</span>
      </div>
    );

    try {
      const data = await new Promise((resolve) => {
        Socket.connection.emit('getMessageHist', { folio }, resolve);
      });

      if (data.success) {
        const { folio: folioData } = data;
        const status = folioData.status;
        const fromInbox = folioData.fromInbox;
        const agentName = folioData.agentAssign?.profile?.name || 'Sin asignar';
        
        // Determinar el estado del folio
        let statusInfo = null;
        if (status === 3) {
          statusInfo = (
            <div className="mb-4 text-center">
              <Button 
                color="danger" 
                startContent={<FolderOpen className="h-4 w-4" />}
                onPress={() => {
                  createNewFolio(folioData, anchorPerson, aliasIdPerson, channel, queue, true);
                  setShowHistoryModal(false);
                }}
                isLoading={isLoadInboxFolio}
                isDisabled={isLoadInboxFolio}
                className="w-full"
              >
                Folio Finalizado - ¿Crear nueva conversación?
              </Button>
            </div>
          );
        } else if ((status === 2 && !fromInbox) || (status === 1 && !agentName)) {
          statusInfo = (
            <div className="mb-4 text-center">
              <Button 
                color="success" 
                startContent={<MessageSquare className="h-4 w-4" />}
                onPress={() => {
                  openSavedFolio(folioData, anchorPerson, aliasIdPerson, channel, queue);
                  setShowHistoryModal(false);
                }}
                isLoading={isLoadInboxFolio}
                isDisabled={isLoadInboxFolio}
                className="w-full"
              >
                Folio Guardado: ¿Continuar Conversación?
              </Button>
            </div>
          );
        } else if (status === 2 && fromInbox) {
          statusInfo = (
            <div className="bg-green-100 text-green-800 p-3 rounded-md mb-4 text-center">
              Inbox Privado de Agente: {agentName}
            </div>
          );
        } else if (status === 1 && agentName) {
          statusInfo = (
            <div className="bg-blue-100 text-blue-800 p-3 rounded-md mb-4 text-center">
              En Atención por: {agentName}
            </div>
          );
        } else if (status === 10) {
          statusInfo = (
            <div className="bg-yellow-100 text-yellow-800 p-3 rounded-md mb-4 text-center">
              Se encuentra en bandeja de espera: {queue}
            </div>
          );
        }

        // Mostrar los mensajes del folio usando el componente MessageBubble
        const messages = folioData.message?.map((msg, idx) => (
          <div key={idx} className="w-full">
             <MessageBubble key={msg._id} message={msg}/>
          </div>
        )) || [];

        setHistoryContent(
          <div className="space-y-4">
            {statusInfo}
            <div className="space-y-2 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg">
              {messages.length > 0 ? messages : 'No hay mensajes en este folio.'}
            </div>
          </div>
        );
      } else {
        setHistoryContent(
          <div className="text-red-500 text-center p-4">
            Error al cargar el historial del folio: {data.message}
          </div>
        );
      }
    } catch (error) {
      console.error('Error al obtener el historial del folio:', error);
      setHistoryContent(
        <div className="text-red-500 text-center p-4">
          Error al cargar el historial del folio. Por favor, intente nuevamente.
        </div>
      );
    } finally {
      console.timeEnd('getFolioMessages');
    }
  };

  // Función para abrir un folio existente
  const openSavedFolio = async (folio, anchorPerson, aliasIdPerson, channel, queue) => {
    console.time('openSavedFolio');
    setIsLoadInboxFolio(true);
    
    try {
      const data = await new Promise((resolve) => {
        Socket.connection.emit('openSavedFolio', {
          token: window.localStorage.getItem('sdToken'),
          folio: folio,
          anchorPerson,
          aliasIdPerson,
          channel,
          queue
        }, resolve);
      });

      setVFolio(folio._id);
      toast.success(`Abriendo folio #${folio._id} - ${aliasIdPerson}`);
      
      if (!data.success) {
        toast.error(data.message);
        return false;
      }
      
      selectedComponent('home');
      console.timeEnd('openSavedFolio');
    } catch (error) {
      console.error('Error al abrir folio:', error);
      toast.error('Error al abrir el folio');
    } finally {
      setIsLoadInboxFolio(false);
    }
  };

  // Función para crear un nuevo folio para un contacto existente
  const createNewFolio = (service, anchorPerson, aliasIdPerson, channel, queue, fromClosedFolio, personId) => {
    console.time('createNewFolio');
    setIsLoadInboxFolio(true);
    
    Socket.connection.emit('createNewFolio', {
      token: window.localStorage.getItem('sdToken'),
      folio: service,
      anchorPerson,
      aliasIdPerson,
      channel,
      queue,
      messages: "Conversación creada. Para contactar al cliente debes enviar una - Plantilla de Mensaje -. Espera que el cliente responda el mensaje para seguir chateando.",
      fromClosedFolio,
      personId
    }, (data) => {
      setVFolio(data.folio);
      toast.success(`Creando folio #${data.folio} - ${aliasIdPerson}`);
      
      if (!data.success) {
        toast.error(data.message);
        return false;
      }
      
      selectedComponent('home');
      console.timeEnd('createNewFolio');
      setIsLoadInboxFolio(false);

      setCreateContact(false);
      setShowModalContact(false);
    });
  };

  // Función para enviar el formulario de contacto
  const sendForm = async () => {
    console.log('Iniciando envío del formulario...');
    setCreateContact(true);
    
    // Validaciones de campos
    for (let i in formToContact) {
      if (typeof formToContact[i] === 'string' && formToContact[i].trim() === '' && i !== 'idQueue') {
        console.log('Campo vacío detectado:', i);
        setCreateContact(false);
        setShowErrorMsg(true);
        setMessageError('Todos los campos son obligatorios');
        return false;
      }
      
      // Validación de teléfono
      if (i === 'anchorUser') {
        if (!formToContact.anchorUser || 
            formToContact.anchorUser.length <= 7 || 
            formToContact.anchorUser.length > 13 || 
            isNaN(formToContact.anchorUser)) {
          console.log('Error en validación de teléfono:', formToContact.anchorUser);
          setMessageError("El teléfono debe contener solo números y tener entre 8 y 13 dígitos.");
          setCreateContact(false);
          setShowErrorMsg(true);
          return false;
        }
      }
      
      // Validación de nombre
      if (i === 'alias' && 
          (formToContact.alias.length <= 2 || 
           formToContact.alias.length > 25)) {
        console.log('Error en validación de nombre:', formToContact.alias);
        setMessageError("El nombre debe tener entre 3 y 25 caracteres.");
        setCreateContact(false);
        setShowErrorMsg(true);
        return false;
      }
    }

    try {
      console.log('Datos del formulario a enviar:', formToContact);
      
      // Crear un objeto con solo los datos necesarios para evitar problemas de serialización
      const formData = {
        service: formToContact.service,
        isNew: formToContact.isNew,
        anchorUser: formToContact.anchorUser,
        alias: formToContact.alias,
        idChannel: formToContact.idChannel,
        idQueue: formToContact.idQueue || userInfo.service.queue,
        createdByAgent: formToContact.createdByAgent
      };
      
      console.log('Datos preparados para enviar:', formData);
      
      // Usar el socket para crear o obtener la persona
      if (!Socket || !Socket.connection) {
        throw new Error('No se pudo establecer conexión con el servidor');
      }
      
      console.log('Enviando datos al servidor...');
      
      Socket.connection.emit('createOrGetPerson', {
        formToContact: formData
      }, (response) => {
        console.log('Respuesta del servidor:', response);
        
        if (!response) {
          throw new Error('No se recibió respuesta del servidor');
        }
        
        if (response.body?.success) {
          console.log('Contacto creado exitosamente:', response.body);
          toast.success('Contacto creado exitosamente');
          setShowModalContact(false);
          clearForm();
          onContactJSON();
          
          // Crear un nuevo folio para el contacto
          const person = response.body.person;
          
          // Crear un nuevo folio para este contacto
          const folioData = {
            _id: response.body.folio?._id || `temp-${Date.now()}`,
            anchor: person.anchor || formData.anchorUser,
            aliasId: person.aliasId || formData.alias,
            channel: formData.idChannel,
            queue: formData.idQueue || userInfo.service.queue
          };
          
          console.log('Abriendo folio con datos:', folioData);
          
          // Abrir el folio creado
          openSavedFolio(folioData, folioData.anchor, folioData.aliasId, folioData.channel, folioData.queue);
          
          // Actualizar el estado de mensajes no leídos
          setUnReadMessages(false);
        } else {
          const errorMsg = response.body?.message || 'Error al crear el contacto';
          console.error('Error en la respuesta del servidor:', errorMsg);
          throw new Error(errorMsg);
        }
      });
    } catch (error) {
      console.error('Error al guardar el contacto:', error);
      
      // Mostrar mensaje de error más descriptivo
      let errorMessage = 'Error al guardar el contacto';
      if (error.message.includes('Converting circular structure to JSON')) {
        errorMessage = 'Error: Se detectó una estructura de datos circular. Por favor, intente nuevamente.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setShowErrorMsg(true);
      setMessageError(errorMessage);
    } finally {
      setCreateContact(false);
      console.log('Finalizando envío del formulario');
    }
  };

  // Función para manejar cambios en el formulario
  const setDataForm = (e) => {
    const { id, value } = e.target;
    setShowErrorMsg(false);
    setFormToContact(prev => ({ ...prev, [id]: value }));
  };

  // Función para manejar cambios en los selects de HeroUI
  const setDataFormCombo = (value, fieldId = 'idChannel') => {
    setShowErrorMsg(false);
    
    setFormToContact(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Si es el campo de canal, también podemos cargar las colas correspondientes
    if (fieldId === 'idChannel' && value) {
      console.log('Canal seleccionado:', value);
      // Aquí puedes agregar la lógica para cargar las colas si es necesario
    }
  };

  // Función para limpiar el formulario
  const clearForm = () => {
    setFormToContact(initialStateForm);
  };

  // Efecto para cargar la información del servicio y los contactos al montar el componente
  useEffect(() => {
    const getInfoService = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_CENTRALITA}/service/${userInfo.service.id}`);
        if (data.body.success) {
          // Actualizar el estado con la información del servicio
          setFormToContact(prev => ({
            ...prev,
            idQueue: data.body.service.queue || userInfo.service.queue
          }));
        } else {
          toast.warning('No se pudo cargar la información del servicio');
        }
      } catch (err) {
        console.error('Error al cargar la información del servicio:', err);
        toast.error('Error al cargar la información del servicio');
      }
    };
    
    if (userInfo?.service?.id) {
      getInfoService();
      onContactJSON();
    }
  }, [userInfo?.service?.id]);

  // Renderizado condicional del contenido
  const renderContent = () => {
    if (!userInfo.allowFindFolios) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-700">No cuentas con acceso</h2>
            <p className="mt-2 text-gray-500">
              No tienes acceso a este apartado. Para hacer búsquedas, consulta a tu supervisor.
            </p>
          </div>
        </div>
      );
    }

    if (onLoad) {
      return (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
          <span className="ml-2">Cargando contactos...</span>
        </div>
      );
    }

    if (report && report.result.length === 0) {
      return (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                No se encontraron contactos con los criterios de búsqueda.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (report && report.result.length > 0) {
      return (
        <div className="mt-6">
          <Table aria-label="Tabla de contactos" className="min-w-full">
            <TableHeader>
              <TableColumn>#</TableColumn>
              <TableColumn>NOMBRE</TableColumn>
              <TableColumn>TELÉFONO</TableColumn>
              <TableColumn>ÚLTIMO FOLIO</TableColumn>
              <TableColumn>STATUS FOLIO</TableColumn>
              <TableColumn>ÚLTIMA BANDEJA</TableColumn>
              <TableColumn>CANAL</TableColumn>
              <TableColumn>IDENTIFICADOR CANAL</TableColumn>
              <TableColumn>FECHA DE CREACIÓN</TableColumn>
              <TableColumn>ACCIONES</TableColumn>
            </TableHeader>
            <TableBody>
              {showRows.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {row.profilePic ? (
                        <img 
                          src={row.profilePic} 
                          alt={row.aliasId} 
                          className="h-8 w-8 rounded-full"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/40';
                          }}
                        />
                      ) : (
                        <UserCircle className="h-8 w-8 text-gray-400" />
                      )}
                      <span>{row.aliasId || 'Sin nombre'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{row.anchor || 'Sin teléfono'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div 
                      className="flex items-center text-blue-600 hover:text-blue-800 cursor-pointer"
                      onClick={() => getFolioMessages(row.lastFolio, row.anchor, row.aliasId, row.channel, row.queue)}
                    >
                      <FolderOpen className="h-4 w-4 mr-1" />
                      {row.lastFolio || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      row.statusFolio === 'abierto' ? 'bg-green-100 text-green-800' : 
                      row.statusFolio === 'cerrado' ? 'bg-red-100 text-red-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {row.statusFolio || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell>{row.queue || 'N/A'}</TableCell>
                  <TableCell>{row.channel || 'N/A'}</TableCell>
                  <TableCell>{row.channelAnchor || 'N/A'}</TableCell>
                  <TableCell>{row.createdAt || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        color="primary"
                        variant="flat"
                        onPress={() => {
                          setSelectedContact(row);
                          getFolioMessages(row.lastFolio, row.anchor, row.aliasId, row.channel, row.queue);
                        }}
                        startContent={<FolderOpen className="h-4 w-4" />}
                      >
                        Historial
                      </Button>
                      <Button 
                        size="sm" 
                        color="secondary"
                        onPress={() => setSelectedContact(row)}
                        startContent={<MessageSquare className="h-4 w-4" />}
                      >
                        Chatear
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {report.result.length > 0 && (
            <div className="flex justify-between items-center mt-4 px-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Filas por página:</span>
                <Select 
                  size="sm" 
                  className="w-20"
                  selectedKeys={[numRows.toString()]}
                  onChange={(e) => {
                    const newNumRows = parseInt(e.target.value);
                    setNumRows(newNumRows);
                    setCurrentPag(1);
                    setShowRows(report.result.slice(0, newNumRows));
                  }}
                >
                  <SelectItem key="5" value="5">5</SelectItem>
                  <SelectItem key="10" value="10">10</SelectItem>
                  <SelectItem key="20" value="20">20</SelectItem>
                  <SelectItem key="50" value="50">50</SelectItem>
                </Select>
              </div>
              
              <Pagination
                total={Math.ceil(report.result.length / numRows)}
                page={currentPag}
                onChange={(page) => {
                  setCurrentPag(page);
                  const startIndex = (page - 1) * numRows;
                  const endIndex = startIndex + numRows;
                  setShowRows(report.result.slice(startIndex, endIndex));
                }}
              />
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <User className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">No hay contactos</h3>
        <p className="mt-1 text-sm text-gray-500">
          Comienza buscando contactos o crea uno nuevo.
        </p>
      </div>
    );
  };

  // Renderizar el modal de historial
  const renderHistoryModal = () => (
    <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} size="2xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">{historyTitle}</ModalHeader>
        <ModalBody>
          {historyContent}
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={() => setShowHistoryModal(false)}>
            Cerrar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

  // Renderizar el modal de confirmación de acción
  const renderActionModal = () => {
    if (!selectedContact) return null;
    
    const { lastFolio, anchor, aliasId, channel, queue, statusFolio } = selectedContact;
    const isOpen = statusFolio === 'abierto' || statusFolio === 'reabierto';
    
    return (
      <Modal isOpen={!!selectedContact} onClose={() => setSelectedContact(null)}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {isOpen ? 'Continuar conversación' : 'Nueva conversación'}
          </ModalHeader>
          <ModalBody>
            <p className="mb-4">
              {isOpen
                ? `¿Deseas continuar la conversación con ${aliasId}?`
                : `¿Deseas iniciar una nueva conversación con ${aliasId}?`}
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Teléfono:</strong> {anchor}</p>
              <p><strong>Canal:</strong> {channel}</p>
              <p><strong>Estado actual:</strong> {statusFolio}</p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={() => setSelectedContact(null)}>
              Cancelar
            </Button>
            <Button 
              color="primary" 
              onPress={() => {
                if (isOpen) {
                  openSavedFolio(
                    { _id: lastFolio },
                    anchor,
                    aliasId,
                    channel,
                    queue
                  );
                } else {
                  createNewFolio(
                    { _id: lastFolio },
                    anchor,
                    aliasId,
                    channel,
                    queue,
                    false,
                    selectedContact.originalData?._id
                  );
                }
                setSelectedContact(null);
              }}
            >
              {isOpen ? 'Continuar' : 'Nueva conversación'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  return (
    <div className="p-6">
      {renderHistoryModal()}
      {renderActionModal()}
      <Card className="shadow-sm">
        <CardHeader className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Contactos</h2>
              <p className="mt-1 text-sm text-gray-500">
                Selecciona un contacto para crear o continuar una conversación
              </p>
            </div>
            <Button 
              color="primary" 
              startContent={<PlusIcon className="h-4 w-4" />}
              onPress={() => setShowModalContact(true)}
            >
              Nuevo Contacto
            </Button>
          </div>
          
          <div className="mt-4">
            <Input
              isClearable
              placeholder="Buscar por nombre, teléfono..."
              startContent={<SearchIcon className="h-4 w-4 text-gray-400" />}
              value={query}
              onValueChange={setQuery}
              onClear={() => setQuery("")}
              className="max-w-md"
              isDisabled={!userInfo.allowFindFolios}
            />
          </div>
        </CardHeader>
        
        <CardBody className="p-6">
          {renderContent()}
        </CardBody>
      </Card>

      {/* Modal para nuevo contacto */}
      <Modal isOpen={showModalContact} onClose={() => setShowModalContact(false)} size="lg">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {formToContact.isNew ? 'Nuevo Contacto' : 'Editar Contacto'}
          </ModalHeader>
          <ModalBody>
            {showErrorMsg && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <X className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{messageError}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Nombre del contacto</label>
                <Input
                  id="alias"
                  placeholder="Nombre del contacto"
                  value={formToContact.alias}
                  onChange={setDataForm}
                  fullWidth
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <Input
                  id="anchorUser"
                  placeholder="Código de país + número (ej: 50255170000)"
                  value={formToContact.anchorUser}
                  onChange={setDataForm}
                  fullWidth
                />
                <p className="text-xs text-gray-500 mt-1">Formato: Código de país + número sin espacios ni caracteres especiales</p>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Canal</label>
                <Select
                  name="idChannel"
                  selectedKeys={formToContact.idChannel ? [formToContact.idChannel] : []}
                  onChange={(value) => setDataFormCombo(value, 'idChannel')}
                  className="w-full"
                  placeholder="Selecciona un canal"
                >
                  <SelectItem key="whatsapp" value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem key="messenger" value="messenger">Messenger</SelectItem>
                  <SelectItem key="instagram" value="instagram">Instagram</SelectItem>
                  <SelectItem key="web" value="web">Web</SelectItem>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Cola</label>
                <Select
                  name="idQueue"
                  selectedKeys={formToContact.idQueue ? [formToContact.idQueue] : []}
                  onChange={(value) => setDataFormCombo(value, 'idQueue')}
                  className="w-full"
                  isDisabled={!formToContact.idChannel}
                  placeholder="Selecciona una cola"
                >
                  <SelectItem key={userInfo.service.queue} value={userInfo.service.queue}>
                    {userInfo.service.queueName || 'Cola predeterminada'}
                  </SelectItem>
                </Select>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={() => {
              setShowModalContact(false);
              clearForm();
            }}>
              Cancelar
            </Button>
            <Button 
              color="primary" 
              onPress={sendForm}
              isLoading={createContact}
              startContent={!createContact && <Check className="h-4 w-4" />}
            >
              {formToContact.isNew ? 'Crear Contacto' : 'Guardar Cambios'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ContactsV2;
