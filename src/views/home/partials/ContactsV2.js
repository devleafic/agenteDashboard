import React, { useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
//import { toast } from 'react-toastify';
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
  Divider,Tooltip, ToastProvider, addToast
} from "@heroui/react";
import { SearchIcon, CheckIcon, PlusIcon, UserCircle, Phone, Check, Calendar, User, X, MessageSquare, FolderOpen, XCircle } from 'lucide-react';
import MessageBubble from './MessageBubble';
import SocketContext from '../../../controladores/SocketContext';
import moment from 'moment';
import PageTitle from '../../../components/PageTitle';

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
  const [activeTab, setActiveTab] = useState('byAgent'); // 'search' | 'byAgent'
  const [loadingChatRowId, setLoadingChatRowId] = useState(null);
  const [loadingHistoryRowId, setLoadingHistoryRowId] = useState(null);
  const [loadingOtherFoliosRowId, setLoadingOtherFoliosRowId] = useState(null);
  const [loadingActionModal, setLoadingActionModal] = useState(false);
  const [byAgentClientIdFilter, setByAgentClientIdFilter] = useState('');
  const [byAgentFolioFilter, setByAgentFolioFilter] = useState('');
  const [filteredResult, setFilteredResult] = useState(null);
  const [sortCreatedAtFolio, setSortCreatedAtFolio] = useState(null); // 'asc' | 'desc' | null

  // Control de concurrencia para evitar parpadeos por respuestas tardías
  const requestSeq = useRef(0);
  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

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
        addToast(
          {
            title: 'Error al cargar la información del servicio',
            description: 'Error al cargar la información del servicio',
            color: 'danger'
          }
        );      }
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
      // Solo ejecutar búsqueda cuando estamos en la pestaña de búsqueda
      if (activeTab === 'search') {
        onContactJSON();
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(searchTimer);
  }, [query, activeTab]);

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
      }, async (data) => {
        console.log(data)
        if(data.body.success){
          setCreateContact(true);
          setShowModalContact(true);
          clearForm();
          //create folio and open 
          let person = data.body.person
          let fromClosedFolio = false
          userInfo.service.idChannel = formToContact.idChannel
          let createFolio = await createNewFolio(
            userInfo.service,
            person.anchor,
            person.aliasId,
            userInfo.service.id,
            userInfo.service.queue,
            false,
            person._id
          );
          console.log(createFolio)
          if(createFolio){
            setUnReadMessages(false);
            setOnLoad(false);
            // Mostrar notificación toast
            addToast(
              {
                title: 'Creando la conversación',
                description: 'Creando la conversación, por favor espera...',
                color: 'warning'
              }
            );
          }

        }else{
          addToast(
            {
              title: 'Error al crear el folio',
              description: 'Error al crear el folio',
              color: 'danger'
            }
          );
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
    const seq = ++requestSeq.current;
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

      // Si cambió la pestaña o hay una solicitud más reciente, no actualizar estado
      if (activeTabRef.current !== 'search' || seq !== requestSeq.current) return;

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
          createdAt: item.createdAt ? moment(item.createdAt).format('DD/MM/YYYY HH:mm:ss') : 'Sin fecha',
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
      addToast(
        {
          title: 'Error al cargar la lista de contactos',
          description: 'Error al cargar la lista de contactos',
          color: 'danger'
        }
      );    } finally {
      if (activeTabRef.current === 'search' && seq === requestSeq.current) {
        setOnLoad(false);
      }
    }
  };

  // Filtros cliente (ID Cliente y Folio) para vista byAgent
  useEffect(() => {
    if (activeTab !== 'byAgent') return;
    const base = report?.result || [];
    const clientTerm = (byAgentClientIdFilter || '').trim();
    const folioTerm = (byAgentFolioFilter || '').trim();

    let data = base;
    if (clientTerm) {
      const lower = clientTerm.toLowerCase();
      data = data.filter(r =>
        String(r.anchor || '').toLowerCase().includes(lower) ||
        String(r.aliasId || '').toLowerCase().includes(lower)
      );
    }
    if (folioTerm) {
      data = data.filter(r => {
        const last = r.lastFolio != null ? String(r.lastFolio) : '';
        const other = Array.isArray(r?.originalData?.otherFolios) ? r.originalData.otherFolios.map(f => String(f)) : [];
        return last.includes(folioTerm) || other.some(f => f.includes(folioTerm));
      });
    }

    // Aplicar orden por fecha de creación del folio si está activo
    if (sortCreatedAtFolio) {
      const getTime = (row) => {
        const val = row?.originalData?.createdAtFolio;
        if (!val) return 0;
        let t = moment(val, ['DD/MM/YYYY HH:mm:ss', moment.ISO_8601, 'LLL']).valueOf();
        if (isNaN(t)) {
          const tp = Date.parse(val);
          return isNaN(tp) ? 0 : tp;
        }
        return t;
      };
      const factor = sortCreatedAtFolio === 'asc' ? 1 : -1;
      data = [...data].sort((a, b) => (getTime(a) - getTime(b)) * factor);
    }

    setFilteredResult(data);
    setCurrentPag(1);
    setShowRows(data.slice(0, numRows));
  }, [byAgentClientIdFilter, byAgentFolioFilter, report, numRows, activeTab, sortCreatedAtFolio]);

  // Función para obtener el historial de mensajes de un folio
  const getFolioMessages = async (folio, anchorPerson, aliasIdPerson, channel, queue, originalFolios) => {
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
                isDisabled={isLoadInboxFolio || !!originalFolios}
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
                isDisabled={isLoadInboxFolio || !!originalFolios}
                className="w-full"
              >
                Folio Guardado: ¿Continuar Conversación?
              </Button>
            </div>
          );
        } else if (status === 2 && fromInbox) {
          statusInfo = (
            <div className="bd-folio-state--held border p-3 mb-4 text-center">
              Inbox Privado de Agente: {agentName}
            </div>
          );
        } else if (status === 1 && agentName) {
          statusInfo = (
            <div className="bd-folio-state--live border p-3 mb-4 text-center">
              En Atención por: {agentName}
            </div>
          );
        } else if (status === 10) {
          statusInfo = (
            <div className="bd-folio-state--wait border p-3 mb-4 text-center">
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
            {originalFolios && Array.isArray(originalFolios) && originalFolios.length > 0 && (
              <div>
                <Button 
                  color="secondary" 
                  variant="flat"
                  onPress={() => getListFolios(originalFolios, anchorPerson, aliasIdPerson, channel, queue, true)}
                >
                  Regresar a la lista de folios
                </Button>
              </div>
            )}
            {statusInfo}
            <div className="space-y-2 max-h-96 overflow-y-auto p-4 bg-cream-100 rounded-lg">
              {messages.length > 0 ? messages : 'No hay mensajes en este folio.'}
            </div>
          </div>
        );
      } else {
        setHistoryContent(
          <div className="text-critical text-center p-4">
            Error al cargar el historial del folio: {data.message}
          </div>
        );
      }
    } catch (error) {
      console.error('Error al obtener el historial del folio:', error);
      setHistoryContent(
        <div className="text-critical text-center p-4">
          Error al cargar el historial del folio. Por favor, intente nuevamente.
        </div>
      );
    } finally {
      console.timeEnd('getFolioMessages');
    }
  };

  // Listado de otros folios del contacto (reutiliza el modal de historial)
  const getListFolios = async (folios, anchorPerson, aliasIdPerson, channel, queue, isFromBackButton = false) => {
    setShowHistoryModal(true);
    setHistoryTitle('Conversaciones de #' + aliasIdPerson);
    setHistoryContent(
      <div className="flex justify-center items-center p-8">
        <Spinner size="lg" />
        <span className="ml-2">Cargando conversaciones...</span>
      </div>
    );

    try {
      let foliosToShow = folios;

      if (!isFromBackButton) {
        const result = await axios.get(`${process.env.REACT_APP_CENTRALITA}/person/getlistfolios/`, {
          params: { person: folios }
        });

        if (!result?.data?.body?.success) {
          addToast({
            title: 'No se pudo recuperar la lista de folios',
            description: 'Inténtalo nuevamente.',
            color: 'danger'
          });
          setShowHistoryModal(false);
          return;
        }

        foliosToShow = result.data.body.listFolios || [];
      }

      if (!foliosToShow || foliosToShow.length === 0) {
        setShowHistoryModal(false);
        return;
      }

      // Sort folios by createdAt desc (most recent first) when date is available
      const sortedFolios = Array.isArray(foliosToShow)
        ? [...foliosToShow].sort((a, b) => {
            const getTime = (it) => {
              if (it && typeof it === 'object' && it.createdAt) {
                const t = new Date(it.createdAt).getTime();
                return isNaN(t) ? 0 : t;
              }
              return 0;
            };
            return getTime(b) - getTime(a);
          })
        : foliosToShow;

      /* Ver .bd-folio-state en styles/brand.css. */
      const renderStatusBadge = (status) => {
        if (status === 3)  return (<span className="bd-folio-state bd-folio-state--closed">Finalizado</span>);
        if (status === 2)  return (<span className="bd-folio-state bd-folio-state--held">Guardado</span>);
        if (status === 1)  return (<span className="bd-folio-state bd-folio-state--live">En atención</span>);
        if (status === 10) return (<span className="bd-folio-state bd-folio-state--wait">En espera</span>);
        if (status === 11) return (<span className="bd-folio-state bd-folio-state--closed">Fuera de horario</span>);
        return null;
      };

      setHistoryContent(
        <div className="w-full space-y-2">
          {sortedFolios.map((item) => {
            const folioId = typeof item === 'string' ? item : item._id;
            const createdAt = typeof item === 'object' && item?.createdAt ? new Date(item.createdAt).toLocaleString() : null;
            const status = typeof item === 'object' ? item.status : undefined;
            return (
              <button
                key={folioId}
                onClick={() => getFolioMessages(folioId, anchorPerson, aliasIdPerson, channel, queue, sortedFolios)}
                className="w-full text-left p-3 rounded-lg bg-cream-50/60 hover:bg-cream-300/60 transition-colors duration-200 focus:outline-none focus:border-flame-ember"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-ink">Conversación #{folioId}</p>
                    {createdAt && (
                      <p className="text-sm text-ink-500">{createdAt}</p>
                    )}
                  </div>
                  {renderStatusBadge(status)}
                </div>
              </button>
            );
          })}
        </div>
      );
    } catch (error) {
      console.error('Error al listar folios:', error);
      setHistoryContent(
        <div className="text-critical text-center p-4">
          Error al cargar la lista de folios. Por favor, intente nuevamente.
        </div>
      );
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

  
      
      if (!data.success) {
        addToast(
          {
            title: 'Error al abrir el folio',
            description: 'Error al abrir el folio',
            color: 'danger'
          }
        );
        setIsLoadInboxFolio(false);
        setShowModalContact(false);
        return false;
      }

      setVFolio(folio._id);
      addToast(
        {
          title: 'Abriendo conversación',
          description: 'Abriendo conversación',
          color: 'success'
        }
      );
      // Emit stats event for resuming a folio
      try {
        const nowISO = new Date().toISOString();
        Socket.connection.emit('stats:event', {
          token: window.localStorage.getItem('sdToken'),
          type: 'folio:start',
          agentId: userInfo?._id,
          folioId: (folio && folio._id) ? folio._id : folio,
          serviceId: (folio && folio.service && (folio.service._id || folio.service.id)) || userInfo?.service?.id || userInfo?.service?._id,
          channelId: channel,
          queueId: queue,
          resumed: true,
          resumedAt: nowISO,
          eventAt: nowISO
        });
      } catch (e) {
        console.warn('stats:event emit failed (openSavedFolio):', e);
      }
      selectedComponent('home');
      console.timeEnd('openSavedFolio');

    } catch (error) {
      console.error('Error al abrir folio:', error);
      addToast(
        {
          title: 'Error al abrir el folio',
          description: 'Error al abrir el folio',
          color: 'danger'
        }
      );
    } finally {
      setIsLoadInboxFolio(false);
    }
  };

  // Función para crear un nuevo folio para un contacto existente
  const createNewFolio = async (service, anchorPerson, aliasIdPerson, channel, queue, fromClosedFolio, personId) => {
    console.time('createNewFolio');
    setIsLoadInboxFolio(true);

    try {
        // Wrap the socket.emit in a Promise
        const data = await new Promise((resolve) => {
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
            }, resolve); // Resolve the promise with the callback data
        });

        if (!data.success) {
            addToast({
                title: 'No se pudo crear el folio',
                description: 'El contacto ya tiene un folio en bandeja de espera o atención',
                color: 'warning'
            });
            setShowModalContact(false);
            setIsLoadInboxFolio(false);
            setOnLoad(false);
            selectedComponent('contacts');       
            return false;
        }

        setVFolio(data.folio);
        addToast({
            title: 'Folio creado',
            description: `Folio #${data.folio} creado con éxito`,
            color: 'success'
        });
        // Emit stats event for starting a new folio
        try {
          Socket.connection.emit('stats:event', {
            token: window.localStorage.getItem('sdToken'),
            type: 'folio:start',
            agentId: userInfo?._id,
            folioId: data.folio,
            serviceId: (typeof service === 'string' ? service : service?._id) || userInfo?.service?.id || userInfo?.service?._id,
            channelId: channel,
            queueId: queue,
            eventAt: new Date().toISOString()
          });
        } catch (e) {
          console.warn('stats:event emit failed (createNewFolio):', e);
        }
        
        selectedComponent('home');
        return true;
    } catch (error) {
        console.error('Error al crear el folio:', error);
        addToast({
            title: 'Error al crear el folio',
            description: 'Ocurrió un error al intentar crear el folio',
            color: 'danger'
        });
        return false;
    } finally {
        setIsLoadInboxFolio(false);
        console.timeEnd('createNewFolio');
    }
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
          addToast(
            {
              title: 'Contacto creado exitosamente',
              description: 'El contacto ya tiene un folio en bandeja de espera o atencion',
              color: 'success'
            }
          );          setShowModalContact(false);
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

      addToast(
        {
          title: 'Error al guardar el contacto',
          description: errorMessage,
          color: 'danger'
        }
      );
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
          addToast(
            {
              title: 'No se pudo cargar la información del servicio',
              description: 'No se pudo cargar la información del servicio',
              color: 'warning'
            }
          );
        }
      } catch (err) {
        console.error('Error al cargar la información del servicio:', err);
        addToast(
          {
            title: 'Error al cargar la información del servicio',
            description: 'Error al cargar la información del servicio',
            color: 'danger'
          }
        );
      }
    };

    // Limpiar la tabla de forma inmediata al cambiar de vista para evitar flicker
    setReport(null);
    setShowRows([]);
    setFilteredResult(null);
    setOnLoad(true);
    setCurrentPag(1);

    if (userInfo?.service?.id) {
      getInfoService();
      if (activeTab === 'search') {
        onContactJSON();
      } else if (activeTab === 'byAgent') {
        onContactByAgentJSON();
      }
    }
  }, [userInfo?.service?.id, activeTab]);

  // Cambiar de pestaña limpiando la tabla antes para evitar mostrar datos previos
  const handleSwitchTab = (tab) => {
    const isSameTab = activeTabRef.current === tab;

    // Limpiar tabla y estado de loaders
    setReport(null);
    setShowRows([]);
    setFilteredResult(null);
    setOnLoad(true);
    setCurrentPag(1);
    setSortCreatedAtFolio(null);
    setByAgentClientIdFilter('');
    setByAgentFolioFilter('');
    setLoadingHistoryRowId(null);
    setLoadingOtherFoliosRowId(null);
    setLoadingChatRowId(null);
    setLoadingActionModal(false);

    // Si es una pestaña diferente, actualizar activeTab y el efecto hará la carga
    if (!isSameTab) {
      setActiveTab(tab);
      return;
    }

    // Si es la misma pestaña, disparar la carga explícitamente para no quedarse en loading
    if (tab === 'search') {
      onContactJSON();
    } else if (tab === 'byAgent') {
      onContactByAgentJSON();
    }
  };

  // Función para cargar los contactos atendidos por el agente (últimos 5 días)
  const onContactByAgentJSON = async () => {
    const seq = ++requestSeq.current;
    setReport(null);
    setOnLoad(true);
    setShowRows([]);

    try {
      const serviceId = userInfo.service.id;
      const agentId = userInfo?._id;
      const result = await axios.get(`${process.env.REACT_APP_CENTRALITA}/searchByAgentFunction/json/${serviceId}`, {
        params: {
          typeReport: 'r_crmData',
          agentId
        }
      });

      if (result.data?.report) {
        const { report } = result.data;
        const { result: contacts = [], dictionary = {} } = report;

        const mappedData = Array.isArray(contacts) ? contacts.map(item => ({
          id: item._id,
          aliasId: item.aliasId || 'Sin nombre',
          anchor: item.anchor || 'Sin teléfono',
          channel: item.channel || 'Sin canal',
          channelAnchor: item.channelAnchor || 'N/A',
          createdAt: item.createdAt
            ? new Date(item.createdAt).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
            : 'Sin fecha',
          lastFolio: item.lastFolio || 'N/A',
          queue: item.queue || 'Sin cola',
          statusFolio: item.statusFolio || 'N/A',
          profilePic: item.profilePic || 'https://via.placeholder.com/40',
          originalData: item
        })) : [];

        setReport({
          ...report,
          result: mappedData,
          dictionary: dictionary
        });
        setFilteredResult(mappedData);
        setShowRows(mappedData.slice(0, numRows));
      } else {
        setReport({ 
          result: [],
          dictionary: {}
        });
        setShowRows([]);
      }
    } catch (error) {
      console.error('Error al cargar contactos por agente:', error);
      if (error.response) {
        console.error('Detalles del error:', error.response.data);
      }
      if (activeTabRef.current === 'byAgent' && seq === requestSeq.current) {
        addToast(
          {
            title: 'Error al cargar los contactos por agente',
            description: 'Error al cargar los contactos por agente',
            color: 'danger'
          }
        );
      }
    } finally {
      if (activeTabRef.current === 'byAgent' && seq === requestSeq.current) {
        setOnLoad(false);
      }
    }
  };

  // Renderizado condicional del contenido
  const renderContent = () => {
    if (!userInfo.allowFindFolios) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center p-6 max-w-sm mx-auto bg-cream-50 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-ink-600">No cuentas con acceso</h2>
            <p className="mt-2 text-ink-500">
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
        <div className="bd-status-critical border border-l-4 border-critical p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-critical" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-critical">
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
              <TableColumn>
                <Tooltip content="Ordenar por fecha de creación del folio">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 select-none"
                  onClick={() => setSortCreatedAtFolio(prev => (prev === 'desc' ? 'asc' : 'desc'))}
                  title="Ordenar por fecha de creación del folio"
                >
                  CREACIÓN FOLIO
                  <span className="text-xs">
                    {sortCreatedAtFolio === 'asc' ? '▲' : sortCreatedAtFolio === 'desc' ? '▼' : '↕︎'}
                  </span>
                </button>
                </Tooltip>
              </TableColumn>
              <TableColumn>STATUS FOLIO</TableColumn>
              <TableColumn>DISPONIBILIDAD</TableColumn>
              <TableColumn>ÚLTIMA BANDEJA</TableColumn>
              <TableColumn>OTROS FOLIOS</TableColumn>
              <TableColumn>CANAL</TableColumn>
              <TableColumn>IDENTIFICADOR CANAL</TableColumn>
              <TableColumn>CREACIÓN CONTACTO</TableColumn>
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
                        <UserCircle className="h-8 w-8 text-ink-400" />
                      )}
                      <span>{row.aliasId || 'Sin nombre'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>{row.anchor || 'Sin identificador'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div 
                      className="flex items-center text-ink underline underline-offset-2 cursor-pointer"
                      onClick={() => getFolioMessages(row.lastFolio, row.anchor, row.aliasId, row.channel, row.queue)}
                    >
                      <FolderOpen className="h-4 w-4 mr-1" />
                      {row.lastFolio || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                      <span>{row.originalData?.createdAtFolio ? moment(row.originalData?.createdAtFolio).format('DD/MM/YYYY HH:mm:ss') : 'N/A'}</span>
                  </TableCell>
                  <TableCell>
                  <span>{row.originalData.fromInbox ? 'Privado' : 'General' }</span>
                  </TableCell>
 
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                      row.statusFolio === 'Atención' || row.statusFolio === 'Atención Agente' 
                        ? 'bd-folio-state bd-folio-state--live' : 
                      row.statusFolio === 'Guardado' 
                        ? 'bd-folio-state bd-folio-state--held' : 
                      row.statusFolio === 'Finalizado' 
                        ? 'bd-folio-state bd-folio-state--closed' :
                      row.statusFolio === 'Bot' 
                        ? 'bd-folio-state bd-folio-state--bot' :
                      row.statusFolio === 'Fuera de horario' 
                        ? 'bd-folio-state bd-folio-state--closed' :
                      'bd-folio-state bd-folio-state--closed'
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
                                  className="px-2 py-1 text-xs bg-cream-200 text-ink border border-hair whitespace-nowrap hover:border-flame-ember cursor-pointer"
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
                            <span className="px-2 py-1 text-xs bg-cream-200 text-ink-500 rounded-md">
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
                  <TableCell>{row.createdAt || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        color="primary"
                        variant="flat"
                        isLoading={loadingHistoryRowId === row.id}
                        isDisabled={loadingHistoryRowId === row.id}
                        onPress={async () => {
                          setLoadingHistoryRowId(row.id);
                          try {
                            await getFolioMessages(row.lastFolio, row.anchor, row.aliasId, row.channel, row.queue);
                          } finally {
                            setLoadingHistoryRowId(null);
                          }
                        }}
                        startContent={<FolderOpen className="h-4 w-4" />}
                      >
                        Historial
                      </Button>
                      <Button
                        size="sm"
                        color="default"
                        variant="flat"
                        isLoading={loadingOtherFoliosRowId === row.id}
                        isDisabled={!row.originalData?.otherFolios || loadingOtherFoliosRowId === row.id}
                        onPress={async () => {
                          setLoadingOtherFoliosRowId(row.id);
                          try {
                            await getListFolios(row.originalData?.otherFolios || '', row.anchor, row.aliasId, row.channel, row.queue, false);
                          } finally {
                            setLoadingOtherFoliosRowId(null);
                          }
                        }}
                        startContent={<FolderOpen className="h-4 w-4" />}
                      >
                        Otros Folios
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
                            isLoading={loadingChatRowId === row.id}
                            isDisabled={
                              // Deshabilitar si está en 'Atención Agente' o si está cargando
                              row.statusFolio === 'Atención Agente' || loadingChatRowId === row.id
                            }
                            onPress={async () => {
                              setLoadingChatRowId(row.id);
                              try {
                                await getFolioInfo(row.lastFolio, row.anchor, row.aliasId, row.statusFolio, row.channel, row.queue);
                              } finally {
                                setLoadingChatRowId(null);
                              }
                            }}
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
                <span className="text-sm text-ink-500">Filas por página:</span>
                <Select 
                  size="sm" 
                  className="w-20"
                  selectedKeys={[numRows.toString()]}
                  onChange={(e) => {
                    const newNumRows = parseInt(e.target.value);
                    setNumRows(newNumRows);
                    setCurrentPag(1);
                    const dataSet = (activeTab === 'byAgent' && Array.isArray(filteredResult)) ? filteredResult : (report?.result || []);
                    setShowRows(dataSet.slice(0, newNumRows));
                  }}
                >
                  <SelectItem key="5" value="5">5</SelectItem>
                  <SelectItem key="10" value="10">10</SelectItem>
                  <SelectItem key="20" value="20">20</SelectItem>
                  <SelectItem key="50" value="50">50</SelectItem>
                </Select>
              </div>
              
              <Pagination
                total={Math.ceil(((activeTab === 'byAgent' && Array.isArray(filteredResult) ? filteredResult.length : report.result.length) / numRows))}
                page={currentPag}
                onChange={(page) => {
                  setCurrentPag(page);
                  const startIndex = (page - 1) * numRows;
                  const endIndex = startIndex + numRows;
                  const dataSet = (activeTab === 'byAgent' && Array.isArray(filteredResult)) ? filteredResult : (report?.result || []);
                  setShowRows(dataSet.slice(startIndex, endIndex));
                }}
              />
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-cream-200 rounded-full flex items-center justify-center mb-4">
          <User className="h-12 w-12 text-ink-400" />
        </div>
        <h3 className="text-lg font-medium text-ink">No hay contactos</h3>
        <p className="mt-1 text-sm text-ink-500">
          Comienza buscando contactos o crea uno nuevo.
        </p>
      </div>
    );
  };

  // Renderizar el modal de historial
  const renderHistoryModal = () => (
    <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} size="2xl" scrollBehavior="inside">
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
      addToast(
        {
          title: 'No se pudo obtener la información del folio',
          description: 'No se pudo obtener la información del folio',
          color: 'danger'
        }
      );
      return null;
    }
    
    const openModalAction = true;
    const isOpen = statusFolio === 'Guardado' && inboxPrivado === false;  
    const isInboxPrivado = inboxPrivado === true || inboxPrivado === 'true';
    
    const dontAllowOpenChat = 
      (lastFolio.fromInbox === true && lastFolio.status === 2) || 
      lastFolio.status === 10 || 
      lastFolio.status === 11 ||
      lastFolio.status === 5
    
    return (
      <Modal isOpen={openModalAction} onClose={() => setSelectedContact(null)}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {dontAllowOpenChat
              ? 'Acción no permitida' 
              : !dontAllowOpenChat
                ? 'Continuar conversación' 
                : 'Nueva conversación'}
          </ModalHeader>
          <ModalBody>
            {dontAllowOpenChat ? (
              <div className="flex items-center gap-3 p-4 bd-status-critical hair">
                <div className="flex-shrink-0">
                  <XCircle className="h-6 w-6 text-critical" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-critical">No se puede iniciar una conversación</h3>
                  <p className="text-sm text-critical mt-1">
                    No es posible iniciar una conversación con un contacto de inbox privado  o en atención agente.
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
                <div className="space-y-2 text-sm text-ink-500">
                  <p><strong>Teléfono:</strong> {anchor}</p>
                  <p><strong>Canal:</strong> {channel}</p>
                  <p><strong>Estado actual:</strong> {statusFolio}</p>
                </div>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              color={dontAllowOpenChat ? "danger" : "default"} 
              variant="light" 
              onPress={() => setSelectedContact(null)}
            >
              {dontAllowOpenChat ? 'Cerrar' : 'Cancelar'}
            </Button>
            
            {!dontAllowOpenChat && (
              <Button 
                color="primary" 
                isLoading={loadingActionModal}
                isDisabled={loadingActionModal}
                onPress={async () => {
                  setLoadingActionModal(true);
                  try {
                    if (lastFolio.status === 2 || lastFolio.status === 11 && !lastFolio.fromInbox) {
                      await openSavedFolio(
                        lastFolio,
                        anchor,
                        aliasId,
                        channel,
                        queue
                      );
                    } else if (lastFolio.status === 3) {
                      await createNewFolio(
                        lastFolio,
                        anchor,
                        aliasId,
                        channel,
                        queue,
                        true,
                        lastFolio._id
                      );
                    }
                  } finally {
                    setSelectedContact(null);
                    setLoadingActionModal(false);
                  }
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
                  <label htmlFor="alias" className="block text-sm font-medium text-ink-600 mb-1">
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
                  <label htmlFor="anchorUser" className="block text-sm font-medium text-ink-600 mb-1">
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
                  <label htmlFor="idChannel" className="block text-sm font-medium text-ink-600 mb-1">
                    Selecciona un canal
                  </label>
                  <select
                    id="idChannel"
                    value={formToContact.idChannel}
                    onChange={handleSelectChange}
                    className="w-full p-2 border border-hair bg-cream-50 focus:outline-none focus:border-flame-ember"
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
                  <div className="p-3 bd-status-critical hair text-sm">
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
        <CardHeader className="border-b border-hair px-6 py-4">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <PageTitle lead="Contactos" />
                <p className="mt-1 text-sm text-ink-500">
                  Selecciona un contacto para crear o continuar una conversación
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-64">
                  <Input
                    isClearable
                    placeholder="Buscar por nombre, teléfono..."
                    startContent={<SearchIcon className="h-4 w-4 text-ink-400" />}
                    value={query}
                    onValueChange={setQuery}
                    onClear={() => setQuery("")}
                    isDisabled={!userInfo.allowFindFolios || activeTab === 'byAgent'}
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

            {/* Tab selector for Search vs. By Agent */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                color="primary"
                variant={activeTab === 'search' ? 'solid' : 'flat'}
                onPress={() => handleSwitchTab('search')}
              >
                Buscar contactos
              </Button>
              <Button
                size="sm"
                color="secondary"
                variant={activeTab === 'byAgent' ? 'solid' : 'flat'}
                onPress={() => handleSwitchTab('byAgent')}
              >
                Atendidos por mí (Hoy)
              </Button>
            </div>
            {activeTab === 'byAgent' && (
              <p className="text-md text-ink-500">Mostrando contactos atendidos por ti en los últimos 5 días.</p>
            )}

            {activeTab === 'byAgent' && (
              <div className="flex items-center gap-3">
                <Input
                  isClearable
                  size="sm"
                  placeholder="Filtrar ID Cliente o Nombre..."
                  value={byAgentClientIdFilter}
                  onValueChange={setByAgentClientIdFilter}
                  onClear={() => setByAgentClientIdFilter('')}
                  className="w-56"
                />
                <Input
                  isClearable
                  size="sm"
                  placeholder="Filtrar Folio..."
                  value={byAgentFolioFilter}
                  onValueChange={setByAgentFolioFilter}
                  onClear={() => setByAgentFolioFilter('')}
                  className="w-56"
                />
              </div>
            )}

            {userInfo.allowFindFolios && (
              <div className="flex items-center space-x-4 text-sm text-ink-500">
                <div className="flex items-center">
                  <span className="bd-folio-dot bd-folio-state--live mr-2"></span>
                  <span>Atención</span>
                </div>
                <div className="flex items-center">
                  <span className="bd-folio-dot bd-folio-state--held mr-2"></span>
                  <span>Guardado</span>
                </div>
                <div className="flex items-center">
                  <span className="bd-folio-dot bd-folio-state--closed mr-2"></span>
                  <span>Finalizado</span>
                </div>
                <div className="flex items-center">
                  <span className="bd-folio-dot bd-folio-state--bot mr-2"></span>
                  <span>Bot</span>
                </div>
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full bg-cream-300 border border-hair mr-2"></span>
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
