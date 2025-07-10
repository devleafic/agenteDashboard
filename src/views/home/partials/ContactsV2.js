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
  Divider,Tooltip
} from "@heroui/react";
import { SearchIcon, CheckIcon, PlusIcon, UserCircle, Phone, Check, Calendar, User, X, MessageSquare, FolderOpen, XCircle } from 'lucide-react';
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
  const [isSearching, setIsSearching] = useState(false);
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
  
  // Función para limpiar el formulario
  const clearForm = () => {
    setFormToContact(initialStateForm);
    setShowErrorMsg(false);
  };
  
  const [formToContact, setFormToContact] = useState(initialStateForm);
  const [infoService, setInfoService] = useState({ });
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Cargar información del servicio al montar el componente
  useEffect(() => {
    const getInfoService = async () => {
      try {
        const result = await axios.get(`${process.env.REACT_APP_CENTRALITA}/service/${userInfo.service.id}`);
        if (result.data) {
          setInfoService(result.data.body.service);
        }
      } catch (error) {
        console.error('Error al cargar la información del servicio:', error);
        toast.error('Error al cargar la información del servicio');
      }
    };
    
    getInfoService();
  }, [userInfo.service.id]);
  
  // Manejar cambios en los inputs del formulario
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormToContact(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  // Realizar búsqueda cuando cambia el query
  useEffect(() => {
    const searchTimer = setTimeout(() => {
      onContactJSON();
    }, 500); // Debounce de 500ms
    
    return () => clearTimeout(searchTimer);
  }, [query]);

  // Función para realizar la búsqueda
  // const handleSearch = async () => {
  //   if (!query.trim()) return;
    
  //   setIsSearching(true);
  //   try {
  //     const serviceId = userInfo.service.id;
  //     const result = await axios.get(`${process.env.REACT_APP_CENTRALITA}/searchData/json/${serviceId}`, {
  //       params: {
  //         typeReport: 'r_crmData',
  //         query: query
  //       }
  //     });
      
  //     setReport(result.data.report.result);
  //     setShowRows(result.data.report.result.slice(0, numRows));
  //     setCurrentPag(1); // Resetear a la primera página
  //   } catch (error) {
  //     console.error('Error al realizar la búsqueda:', error);
  //     toast.error('Error al realizar la búsqueda');
  //   } finally {
  //     setIsSearching(false);
  //   }
  // };

      // useEffect( () =>
      // {
      //     console.log("Load Contacts")
      //     if (query.length === 0 || query.length > 2)  onContactJSON();
      // },[query]);

  // Manejar cambios en los selects
  const handleSelectChange = (e) => {
    const { id, value } = e.target;
    setFormToContact(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  // Validar el formulario
  const validateForm = () => {
    if (!formToContact.alias.trim() || !formToContact.anchorUser || !formToContact.idChannel) {
      setMessageError('Todos los campos son obligatorios');
      setShowErrorMsg(true);
      return false;
    }
    
    // Validar formato de teléfono (números únicamente, mínimo 10 dígitos)
    const phoneRegex = /^[0-9]{10,}$/;
    if (!phoneRegex.test(formToContact.anchorUser)) {
      setMessageError('El teléfono debe contener al menos 10 dígitos numéricos');
      setShowErrorMsg(true);
      return false;
    }
    
    return true;
  };
  
  // Enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setCreateContact(true);
    setShowErrorMsg(false);
    
    
            try{
                Socket.connection.emit('createOrGetPerson', {
                    formToContact : formToContact,
                },(data) => {
                    console.log(data)
                    if(data.body.success){
                        setCreateContact(true);
                        setShowModalContact(true);
                        clearForm();
                        //create folio and open 
                        let person = data.body.person
                        let fromClosedFolio = false
                        userInfo.service.idChannel = formToContact.idChannel
                        createNewFolio(
                            userInfo.service,
                            person.anchor,
                            person.aliasId,
                            userInfo.service.id,
                            userInfo.service.queue,
                            false,
                            person._id
                        );
                        setUnReadMessages(false);
                        setOnLoad(true);
                        // Mostrar notificación toast
                        toast.info('Creando la conversación, por favor espera...', {
                            position: "top-right",
                            autoClose: 3000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        });
                            
                  

                    }else{
                        toast.error(data.body.message);
                        setShowErrorMsg(true);
                        setMessageError(data.body.message || 'Ocurrio un error al crear el usuario. Intenta mas tarde.')    
                        setCreateContact(false);
                        clearForm();
                    }
    
                });
           
            } catch (error) {
            console.error('Error al crear el contacto:', error);
            setMessageError(error.response?.data?.message || 'Error al crear el contacto');
            setShowErrorMsg(true);
            clearForm();
            } finally {
            setCreateContact(false);
            }
  };

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

 const getFolioInfo = async (folio, anchorPerson, aliasIdPerson, status, channel, queue) => {
    
    try { 
      const data = await new Promise((resolve) => {
        Socket.connection.emit('getMessageHist', { folio }, resolve);
      });
      console.log(data);

      if (data.success) {
        const { folio: folioData } = data;
        const fromInbox = folioData.fromInbox;
        const agentName = folioData.agentAssign?.profile?.name || 'Sin asignar';
        const contactData = {
          lastFolio: folioData,
          inboxPrivado: fromInbox, //text for info
          agentName: agentName, //text for info
          queue: queue, //text for info
          channel: channel, //text for info
          anchor: anchorPerson, //text for info
          aliasId: aliasIdPerson,//text for info
          statusFolio: status, //text for info
        };
        setSelectedContact(contactData);
        return contactData;
      }
      return null;
    } catch (error) {
      console.error('Error al obtener el historial del folio:', error);
      return null;
    } finally {
      console.timeEnd('getFolioInfo');
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
      toast.success(`Abriendo conversación con ${aliasIdPerson}`);
      
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
              <TableColumn>ID CLIENTE</TableColumn>
              <TableColumn>ÚLTIMO FOLIO</TableColumn>
              <TableColumn>STATUS FOLIO</TableColumn>
              <TableColumn>ÚLTIMA BANDEJA</TableColumn>
              <TableColumn>DISPONIBILIDAD</TableColumn>
              <TableColumn>OTROS FOLIOS</TableColumn>
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
                  <span>{row.originalData.fromInbox ? 'Privado' : 'General' }</span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                      row.statusFolio === 'Atención' || row.statusFolio === 'Atención Agente' 
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 
                      row.statusFolio === 'Guardado' 
                        ? 'bg-green-100 text-green-800 border border-green-200' : 
                      row.statusFolio === 'Finalizado' 
                        ? 'bg-red-100 text-red-800 border border-red-200' :
                      row.statusFolio === 'Bot' 
                        ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      row.statusFolio === 'Fuera de horario' 
                        ? 'bg-gray-100 text-gray-600 border border-gray-200' :
                      'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {row.statusFolio === 'Atención Agente' ? 'Atención' : row.statusFolio || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell>{row.queue || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(row.originalData?.otherFolios) ? (
                        <>
                          {row.originalData.otherFolios.slice(0, 3).map((folio, idx) => {
                            // Asegurarnos de que folio es un string válido
                            const folioStr = String(folio || '').trim();
                            return folioStr ? (
                              <Tooltip key={idx} content={`Ver folio ${folioStr}`}>
                                <span 
                                  className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md whitespace-nowrap hover:bg-blue-100 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    getFolioMessages(folioStr, row.anchor, row.aliasId, row.channel, row.queue);
                                  }}
                                >
                                  {folioStr}
                                </span>
                              </Tooltip>
                            ) : null;
                          })}
                          {row.originalData.otherFolios.length > 3 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-md">
                              +{row.originalData.otherFolios.length - 3} más
                            </span>
                          )}
                          {row.originalData.otherFolios.length === 0 && 'N/A'}
                        </>
                      ) : (
                        'N/A'
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{row.channel || 'N/A'}</TableCell>
                  <TableCell>{row.channelAnchor || 'N/A'}</TableCell>
                  <TableCell>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        color="primary"
                        variant="flat"
                        onPress={() => {
                          getFolioMessages(row.lastFolio, row.anchor, row.aliasId, row.channel, row.queue);
                        }}
                        startContent={<FolderOpen className="h-4 w-4" />}
                      >
                        Historial
                      </Button>
                      <Tooltip 
                        content={
                          row.originalData.fromInbox  === true || row.originalData.fromInbox === 'true' 
                            ? 'No se puede chatear con un contacto de inbox privado' 
                            : row.statusFolio === 'Atención Agente' 
                              ? 'No se puede chatear con un folio en estado "Atención Agente"' 
                              : 'Iniciar conversación con este contacto'
                        }
                        placement="top"
                      >
                        <div className="inline-block">
                          <Button 
                            size="sm" 
                            color="secondary"
                            isDisabled={
                              row.originalData.fromInbox === true || 
                              row.originalData.fromInbox === 'true' || 
                              row.statusFolio === 'Atención Agente'
                            }
                            onPress={() =>  getFolioInfo(row.lastFolio, row.anchor, row.aliasId, row.statusFolio, row.channel, row.queue)}
                            startContent={<MessageSquare className="h-4 w-4" />}
                          >
                            Chatear
                          </Button>
                        </div>
                      </Tooltip>
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
    
    const { lastFolio, statusFolio, inboxPrivado, aliasId, anchor, channel, queue } = selectedContact;
    
    // Only check for null/undefined, not falsy values like empty string or 0
    if (
      lastFolio == null || 
      statusFolio == null || 
      inboxPrivado == null || 
      aliasId == null || 
      anchor == null || 
      channel == null || 
      queue == null
    ) {
      console.log('Missing required fields:', { lastFolio, statusFolio, inboxPrivado, aliasId, anchor, channel, queue });
      setSelectedContact(null);
      toast.error('No se pudo obtener la información del folio');
      return null;
    }
    
    const openModalAction = true;
    const isOpen = statusFolio === 'Guardado' && inboxPrivado === false;  
    const isInboxPrivado = inboxPrivado === true || inboxPrivado === 'true';
    
    const dontAllowOpenChat = lastFolio && (
      lastFolio.fromInbox === true || 
      lastFolio.fromInbox === 'true' || 
      lastFolio.status === 5 || 
      lastFolio.status === 10
    );
    return (
      <Modal isOpen={openModalAction} onClose={() => setSelectedContact(null)}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {dontAllowOpenChat
              ? 'Acción no permitida' 
              : !dontAllowOpenChat && (lastFolio.status === 2 || lastFolio.status === 11)
                ? 'Continuar conversación' 
                : 'Nueva conversación'}
          </ModalHeader>
          <ModalBody>
            {isInboxPrivado ? (
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                <div className="flex-shrink-0">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-red-800">No se puede iniciar una conversación</h3>
                  <p className="text-sm text-red-700 mt-1">
                    No es posible iniciar una conversación con un contacto de inbox privado.
                  </p>
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              color={isInboxPrivado ? "danger" : "default"} 
              variant="light" 
              onPress={() => setSelectedContact(null)}
            >
              {isInboxPrivado ? 'Cerrar' : 'Cancelar'}
            </Button>
            
            {!isInboxPrivado && !dontAllowOpenChat && (
              <Button 
                color="primary" 
                onPress={() => {
                  if (lastFolio.status === 2 || lastFolio.status === 11 && !lastFolio.fromInbox) {
                    openSavedFolio(
                      lastFolio,
                      anchor,
                      aliasId,
                      channel,
                      queue
                    );
                  } else if (lastFolio.status ===3) {
                    createNewFolio(
                      lastFolio,
                      anchor,
                      aliasId,
                      channel,
                      queue,
                      true,
                      lastFolio._id
                    );
                  }
                  setSelectedContact(null);
                }}
              >
                {isOpen ? 'Continuar' : 'Nueva conversación'}
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  return (
    <div className="p-6">
      {renderHistoryModal()}
      {renderActionModal()}
      
      {/* Modal de Nuevo Contacto */}
      <Modal isOpen={showModalContact} onClose={() => {
        setShowModalContact(false);
        clearForm();
      }} size="md">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {formToContact.isNew ? 'Crear nuevo Contacto' : 'Editar Contacto'}
          </ModalHeader>
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <div className="space-y-4">
                <div>
                  <label htmlFor="alias" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del contacto
                  </label>
                  <Input
                    id="alias"
                    placeholder="Nombre del Contacto"
                    value={formToContact.alias}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="anchorUser" className="block text-sm font-medium text-gray-700 mb-1">
                    Télefono / Obligatorio código de país y área (50255170000)
                  </label>
                  <Input
                    id="anchorUser"
                    type="number"
                    placeholder="Télefono"
                    value={formToContact.anchorUser}
                    onChange={handleInputChange}
                    disabled={!formToContact.isNew}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="idChannel" className="block text-sm font-medium text-gray-700 mb-1">
                    Selecciona un canal
                  </label>
                  <select
                    id="idChannel"
                    value={formToContact.idChannel}
                    onChange={handleSelectChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecciona un canal</option>
                    {Array.isArray(infoService?.channels) && infoService.channels
                      .filter(channel => channel?.status && channel?.name?.toLowerCase()?.includes("wab",0))
                      .map(channel => (
                        <option key={channel?._id} value={channel?._id}>
                          {channel?.title || 'Canal sin nombre'}
                        </option>
                      ))}
                    {(!infoService?.channels || infoService.channels.length === 0) && (
                      <option value="" disabled>No hay canales disponibles</option>
                    )}
                  </select>
                </div>
                
                {showErrorMsg && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                    <div className="flex items-center">
                      <XCircle className="h-5 w-5 mr-2" />
                      <span>{messageError}</span>
                    </div>
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button 
                color="danger" 
                variant="light" 
                onPress={() => {
                  setShowModalContact(false);
                  clearForm();
                }}
                disabled={createContact}
              >
                Cancelar
              </Button>
              <Button 
                color="primary" 
                type="submit"
                isLoading={createContact}
                startContent={!createContact && <CheckIcon className="h-4 w-4" />}
              >
                {formToContact.isNew ? 'Crear Contacto' : 'Guardar Cambios'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
      
      <Card className="shadow-sm">
        <CardHeader className="border-b border-gray-200 px-6 py-4">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Contactos</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Selecciona un contacto para crear o continuar una conversación
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-64">
                  <Input
                    isClearable
                    placeholder="Buscar por nombre, teléfono..."
                    startContent={<SearchIcon className="h-4 w-4 text-gray-400" />}
                    value={query}
                    onValueChange={setQuery}
                    onClear={() => setQuery("")}
                    isDisabled={!userInfo.allowFindFolios}
                    className="w-full"
                  />
                </div>
                <Button 
                  color="primary" 
                  startContent={<PlusIcon className="h-4 w-4" />}
                  onPress={() => setShowModalContact(true)}
                >
                  Nuevo Contacto
                </Button>
              </div>
            </div>
            
            {userInfo.allowFindFolios && (
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300 mr-2"></span>
                  <span>Atención</span>
                </div>
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-100 border border-green-300 mr-2"></span>
                  <span>Guardado</span>
                </div>
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full bg-red-100 border border-red-300 mr-2"></span>
                  <span>Finalizado</span>
                </div>
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-100 border border-blue-300 mr-2"></span>
                  <span>Bot</span>
                </div>
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full bg-gray-200 border border-gray-300 mr-2"></span>
                  <span>Fuera de horario</span>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardBody className="p-6">
          {renderContent()}
        </CardBody>
      </Card>

  
    </div>
  );
};

export default ContactsV2;
