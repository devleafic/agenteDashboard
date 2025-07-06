import React, { useState, useContext, useEffect } from 'react';
import { Button, Modal, Select, Input, Card, CardBody, CardHeader, Divider } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUser, FiMail, FiClock, FiFolder, FiSearch, FiX, FiMessageSquare, 
  FiFileText, FiImage, FiFile, FiArrowRight, FiPaperclip, FiSend,
  FiChevronRight, FiChevronDown, FiGlobe, FiGrid, FiMessageCircle, FiEye
} from 'react-icons/fi';
import _ from 'lodash';
import SocketContext from './../../../controladores/SocketContext';
import ListFoliosContext from '../../../controladores/FoliosContext';
import CRM from './CRM';
import Alerts from './Alerts';
import ViewTicket from './ViewTicket';
import FindTicket from './FindTicket';
import HistoryFolios from './HistoryFolios';
import TransferFolio from './TransferFolio';
import TransferFolioPrivado from './TranferirFolioPrivado';
import TransferFolioQueueGlobal from './TransferFolioQueueGlobal';
import TransferFolioQueueGeneric from './TransferFolioQueueGeneric';
import TransferirFolioQueueGlobal_QueueLocal from './TransferirFolioQueueGlobal_QueueLocal';
import Mtm from './Mtm';
import Zohocrm from './plugins/zohocrm/Zohocrm';
import MailingTemplate from './plugins/mailingTemplate/MailingTemplate';

// Componente de Acordeón reutilizable con animación personalizada
const AccordionItem = ({ title, isOpen, onClick, children }) => {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow mb-2 overflow-hidden">
      <CardHeader 
        className="bg-gray-50 px-4 py-3 border-b cursor-pointer select-none"
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {title.icon && <title.icon className="mr-2 text-blue-500" />}
            <span className="font-medium">{title.text}</span>
          </div>
          {isOpen ? <FiChevronDown className="text-gray-500" /> : <FiChevronRight className="text-gray-500" />}
        </div>
      </CardHeader>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CardBody className="p-4">
              {children}
            </CardBody>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

const getFileIcon = (mimeType) => {
  if (mimeType.includes('pdf')) {
    return <FiFileText className="mr-2 text-red-500 flex-shrink-0" />;
  } else if (mimeType.includes('image')) {
    return <FiImage className="mr-2 text-purple-500 flex-shrink-0" />;
  }
  return <FiFile className="mr-2 text-gray-500 flex-shrink-0" />;
};



const ToolsV2 = ({
  quicklyAnswer,
  crm,
  person,
  folio,
  setRefresh,
  areas,
  tickets,
  setMessageToSend,
  historyFolios,
  userInfo,
  mtm,
  service: infoService,
  setInsertHtml
}) => {
  // Estado para controlar qué sección está abierta
  const [openSection, setOpenSection] = useState({
    crm: false,
    plugins: false,
    templates: false,
    history: false,
    quickResponses: false,
    transfer: false,
    tickets: false,
    files: false
  });

  // Función para alternar una sección
  const toggleSection = (section) => {
    setOpenSection(prev => ({
      ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
      [section]: !prev[section]
    }));
  };

  // Funciones para manejo de tickets
  const openCreateTicket = () => setOpenModalTicket(true);

  const handleOpenViewTicket = (ticket) => {
    setTicketSelected(ticket);
    setOpenViewTicket(true);
  };

  const closeViewTicket = () => {
    setOpenViewTicket(false);
    setTicketSelected(null);
  };
  // Estados
  const [indexPane, setIndexPane] = useState(-1);
  const socket = useContext(SocketContext);
  const [isEndingFolio, setIsEndingFolio] = useState(false);
  const listFolios = useContext(ListFoliosContext);
  const [typeClose, setTypeClose] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [classification, setClassification] = useState(-1);
  const [openModalTicket, setOpenModalTicket] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [messageAlert, setMessageAlert] = useState('');
  const [listClassification, setListClassification] = useState([]);
  const [openViewTicket, setOpenViewTicket] = useState(false);
  const [ticketSelected, setTicketSelected] = useState(null);
  const [openFindTicket, setOpenFindTicket] = useState(false);
  const [allQA, setAllQA] = useState([]);
  const [textFilter, setTextFilter] = useState('');
  
  // Filtrar plugins activos
  const pluginsToTools = folio.folio.service.plugins.filter((x) => {
    return ['zohocrm', 'mailingTemplate'].includes(x.plugin) && x.isActive;
  });

  // Inicializar datos del ticket
  const [dataTicket, setDataTicket] = useState({
    area: null,
    message: ''
  });

  // Cargar clasificaciones al montar el componente
  useEffect(() => {
    const loadListClassifications = async () => {
      const tmpClass = [];
      for (let item of folio.clasifications) {
        tmpClass.push({
          key: item._id,
          value: item._id,
          text: item.name
        });
      }
      setListClassification(tmpClass);
      setAllQA(quicklyAnswer);
    };
    
    loadListClassifications();
  }, [folio.clasifications, quicklyAnswer]);

  // Función para buscar en las respuestas rápidas
  const findQA = (filter) => {
    setTextFilter(filter);
    if (filter.length <= 3) {
      setAllQA(quicklyAnswer);
      return;
    }
    const filtered = quicklyAnswer.filter(qa => 
      qa.text.toLowerCase().includes(filter.toLowerCase())
    );
    setAllQA(filtered);
  };

  // Función para enviar archivo
  const sendFile = (file) => {
    socket.connection.emit('sendMessage', {
      token: window.localStorage.getItem('sdToken'),
      folio: folio.folio._id,
      message: file.url,
      caption: file.name,
      class: file.mimeType === 'application/pdf' ? 'document' : 'image'
    }, (result) => {
      const index = listFolios.current.findIndex(x => x.folio._id === folio.folio._id);
      if (index !== -1) {
        listFolios.current[index].folio.message.push(result.body.lastMessage);
        setRefresh(prev => prev + 1);
      }
    });
  };

  // Función para cerrar folio
  const closeFolio = () => {
    if (classification === -1) {
      alert('Selecciona una clasificación');
      return false;
    }

    setIsEndingFolio(true);
    const actionClose = typeClose === 'guardar' ? 'save' : 'end';

    socket.connection.emit('closeFolio', {
      folio: folio.folio._id,
      token: window.localStorage.getItem('sdToken'),
      actionClose,
      classification
    }, (result) => {
      const index = listFolios.current.findIndex(x => x.folio._id === folio.folio._id);
      if (index !== -1) {
        delete listFolios.current[index];
        setRefresh(prev => prev + 1);
      }
      setOpenModal(false);
      setIsEndingFolio(false);
    });
  };

  // Función para obtener el ícono según el tipo de archivo
  const getFileIcon = (type) => {
    switch (type) {
      case 'image/png':
      case 'image/jpeg':
        return <FiImage className="mr-2 text-gray-500" />;
      case 'application/pdf':
        return <FiFileText className="mr-2 text-gray-500" />;
      default:
        return <FiFile className="mr-2 text-gray-500" />;
    }
  };

  // Función para cargar plugins
  const loadPlugins = (plugin) => {
    switch (plugin.plugin) {
      case 'zohocrm':
        return (
          <div key={`accordion-${plugin.plugin}`} className="mb-4">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-gray-50 px-4 py-3 border-b">
                <div className="flex items-center">
                  <FiFileText className="mr-2 text-blue-500" />
                  <span className="font-medium">Zoho CRM (Preview)</span>
                </div>
              </CardHeader>
              <CardBody className="p-4">
                {folio && <Zohocrm template={crm} person={person} folio={folio} setRefresh={setRefresh} />}
              </CardBody>
            </Card>
          </div>
        );
      
      case 'mailingTemplate':
        const hasEnabledPlugin = folio.folio.service.plugins.find((p) => p.plugin === 'mailingTemplate');
        if (!hasEnabledPlugin) return null;
        
        return (
          <div key={`accordion-${plugin.plugin}`} className="mb-4">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-gray-50 px-4 py-3 border-b">
                <div className="flex items-center">
                  <FiMail className="mr-2 text-blue-500" />
                  <span className="font-medium">Plantillas de Correo</span>
                </div>
              </CardHeader>
              <CardBody className="p-4">
                <MailingTemplate 
                  template={crm} 
                  person={person} 
                  folio={_.cloneDeep(folio)} 
                  setRefresh={setRefresh} 
                  setMessageToSend={setMessageToSend} 
                  onClick={(htmlMail) => {
                    setMessageToSend(htmlMail);
                  }}
                />
              </CardBody>
            </Card>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Función para renderizar el contenido de respuestas rápidas
  const renderQuickResponsesContent = () => {
    return (
      <>
        <div className="mb-4">
          <Input 
            placeholder="Buscar respuestas..." 
            value={textFilter}
            onChange={(e) => findQA(e.target.value)}
            rightIcon={
              textFilter && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    findQA('');
                    setTextFilter('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX />
                </button>
              )
            }
            className="w-full"
          />
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {allQA.map((item) => (
            <div 
              key={item._id} 
              className="p-2 hover:bg-gray-100 rounded cursor-pointer"
              onClick={() => setMessageToSend(item.text)}
            >
              <p className="text-sm">{item.text}</p>
              <Divider className="my-2" />
            </div>
          ))}
        </div>
      </>
    );
  };

  // Función para renderizar la sección de tickets
  const renderTicketsSection = () => {
    return (
      <div className="space-y-4">
        <Button 
          color="primary" 
          variant="light" 
          onClick={openCreateTicket}
          className="w-full"
        >
          Crear Ticket
        </Button>
        <Button 
          color="primary" 
          variant="bordered" 
          onClick={() => setOpenFindTicket(true)}
          className="w-full"
        >
          Buscar Ticket
        </Button>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {tickets?.map((ticket) => (
            <div 
              key={ticket._id} 
              className="p-2 hover:bg-gray-100 rounded cursor-pointer"
              onClick={() => handleOpenViewTicket(ticket)}
            >
              <p className="text-sm font-medium">{ticket.subject}</p>
              <p className="text-xs text-gray-500">#{ticket.ticketNumber}</p>
              <Divider className="my-2" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Función para renderizar la sección de archivos
  const renderFilesSection = () => {
    if (folio.folio.typeFolio !== '_MESSAGES_') return null;
    
    return (
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {infoService.repoFiles && infoService.repoFiles.length > 0 ? (
          infoService.repoFiles.map((item) => (
            <div key={item._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
              <div className="flex items-center min-w-0">
                {getFileIcon(item.mimeType)}
                <span className="text-sm truncate">{item.name}</span>
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0">
                <Button 
                  size="sm" 
                  variant="light" 
                  isIconOnly
                  as="a"
                  href={item.url}
                  target="_blank"
                  aria-label="Preview File"
                >
                  <FiEye className="text-gray-500 hover:text-blue-500" />
                </Button>
                <Button 
                  size="sm" 
                  variant="light" 
                  isIconOnly
                  aria-label="Send File"
                  onClick={() => {
                    if (window.confirm(`¿Deseas enviar el archivo "${item.name}"?`)) {
                      sendFile(item);
                    }
                  }}
                >
                  <FiSend className="text-gray-500 hover:text-green-500" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No hay archivos disponibles</p>
        )}
      </div>
    );
  };

  // Función para renderizar la sección de transferencia
  const renderTransferSection = () => {
    if (folio?.folio?.channel === 'call') return null;

    // Transferir Folio (caso general)
    if (!folio?.folio?.fromInbox && !folio?.folio?.isGlobalQueue) {
      return <TransferFolio folio={folio} setRefresh={setRefresh} userInfo={userInfo} />;
    }

    // Transferir Conversación Privada
    if (folio?.folio?.fromInbox) {
      return <TransferFolioPrivado folio={folio} setRefresh={setRefresh} userInfo={userInfo} />;
    }

    // Transferir a Bandeja Global
    if (folio?.folio?.isGlobalQueue && !folio?.folio?.isGlobalDistributor && !folio?.folio?.fromInbox) {
      return <TransferFolioQueueGlobal folio={folio} setRefresh={setRefresh} userInfo={userInfo} />;
    }

    // Transferir a Bandeja de Canal
    if (!folio?.folio?.fromInbox && folio?.folio?.isGlobalQueue) {
      return <TransferirFolioQueueGlobal_QueueLocal folio={folio} setRefresh={setRefresh} userInfo={userInfo} />;
    }

    // Transferir a Bandeja Genérica
    if (!folio?.folio?.fromInbox && folio?.folio?.isGlobalQueue && folio?.folio?.isGlobalDistributor) {
      return <TransferFolioQueueGeneric folio={folio} setRefresh={setRefresh} userInfo={userInfo} />;
    }

    return null;
  };

  // Render principal
  return (
    <div className="h-full flex flex-col space-y-2 p-4 bg-gray-50 overflow-y-auto">
      {/* Sección de CRM */}
      <AccordionItem
        title={{ text: 'CRM', icon: FiUser }}
        isOpen={openSection.crm}
        onClick={() => toggleSection('crm')}
      >
        {folio && <CRM template={crm} person={person} folio={folio} setRefresh={setRefresh} />}
      </AccordionItem>

      {/* Sección de plugins */}
      <AccordionItem
        title={{ text: 'Plugins', icon: FiGrid }}
        isOpen={openSection.plugins}
        onClick={() => toggleSection('plugins')}
      >
        <div className="space-y-4">
          {pluginsToTools.map((plugin) => loadPlugins(plugin))}
        </div>
      </AccordionItem>

      {/* Sección de Plantillas de mensajes */}
      <AccordionItem
        title={{ text: 'Plantillas de mensajes', icon: FiFileText }}
        isOpen={openSection.templates}
        onClick={() => toggleSection('templates')}
      >
        <Mtm mtm={mtm} person={folio.folio.person} setRefresh={setRefresh} folio={folio} />
      </AccordionItem>

      {/* Sección de Historial de Folios */}
      <AccordionItem
        title={{ text: 'Historial de Folios', icon: FiClock }}
        isOpen={openSection.history}
        onClick={() => toggleSection('history')}
      >
        <HistoryFolios historyFolios={historyFolios} />
      </AccordionItem>

      {/* Sección de Respuestas Rápidas */}
      {folio?.folio?.channel !== 'call' && (
        <AccordionItem
          title={{ text: 'Respuestas Rápidas', icon: FiMessageCircle }}
          isOpen={openSection.quickResponses}
          onClick={() => toggleSection('quickResponses')}
        >
          {renderQuickResponsesContent()}
        </AccordionItem>
      )}

      {/* Sección de Transferencias */}
      {folio?.folio?.channel !== 'call' && (
        <AccordionItem
          title={{ text: 'Transferencias', icon: FiArrowRight }}
          isOpen={openSection.transfer}
          onClick={() => toggleSection('transfer')}
        >
          {renderTransferSection()}
        </AccordionItem>
      )}

      {/* Sección de Tickets */}
      <AccordionItem
        title={{ text: 'Tickets', icon: FiFileText }}
        isOpen={openSection.tickets}
        onClick={() => toggleSection('tickets')}
      >
        {renderTicketsSection()}
      </AccordionItem>

      {/* Sección de Archivos */}
      {folio?.folio?.typeFolio === '_MESSAGES_' && (
        <AccordionItem
          title={{ text: 'Catálogo de archivos', icon: FiFolder }}
          isOpen={openSection.files}
          onClick={() => toggleSection('files')}
        >
          {renderFilesSection()}
        </AccordionItem>
      )}

      {/* Modales de tickets */}
      <Modal open={openModalTicket} onClose={() => setOpenModalTicket(false)}>
        <Modal.Header>Crear Nuevo Ticket</Modal.Header>
        <Modal.Content>
          <ViewTicket 
            folio={folio} 
            onClose={() => setOpenModalTicket(false)} 
            onRefresh={setRefresh}
          />
        </Modal.Content>
      </Modal>

      <Modal open={openViewTicket} onClose={closeViewTicket}>
        <Modal.Header>Detalles del Ticket</Modal.Header>
        <Modal.Content>
          {ticketSelected && (
            <ViewTicket 
              ticketId={ticketSelected._id} 
              onClose={closeViewTicket}
              onRefresh={setRefresh}
            />
          )}
        </Modal.Content>
      </Modal>

      <Modal open={openFindTicket} onClose={() => setOpenFindTicket(false)}>
        <Modal.Header>Buscar Ticket</Modal.Header>
        <Modal.Content>
          <FindTicket 
            onSelectTicket={(ticket) => {
              setOpenFindTicket(false);
              handleOpenViewTicket(ticket);
            }}
          />
        </Modal.Content>
      </Modal>

      {/* Modal de confirmación para cerrar folio */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Modal.Header className="border-b px-6 py-4">
          <h3 className="text-lg font-medium">Confirmar acción</h3>
        </Modal.Header>
        <Modal.Body className="p-6">
          <div className="space-y-4">
            <Select
              placeholder="Selecciona una clasificación"
              options={listClassification}
              value={classification}
              onChange={(e, { value }) => setClassification(value)}
              className="w-full"
            />
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
          <Button variant="light" onClick={() => setOpenModal(false)}>
            Cancelar
          </Button>
          <Button 
            color={typeClose === 'guardar' ? 'primary' : 'success'} 
            onClick={closeFolio}
            loading={isEndingFolio}
            disabled={classification === -1}
          >
            {typeClose === 'guardar' ? 'Guardar' : 'Finalizar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ToolsV2;
