import React, { useState, useContext, useEffect } from 'react';
import { Button, Modal, Select, Input, Card, CardBody, CardHeader, Divider, Chip, Image, Loader, Icon, Message, Dimmer } from '@heroui/react';
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
import TransferirFolioQueueGlobal_QueueLocal from './TransferirFolioQueueGlobal_QueueLocal';
import TransferFolioQueueGeneric from './TransferFolioQueueGeneric';
import HistoryFolios from './HistoryFolios';
import TransferFolio from './TransferFolio';
import TransferFolioPrivado from './TranferirFolioPrivado';
import TransferFolioQueueGlobal from './TransferFolioQueueGlobal';

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
  const [openAccordion, setOpenAccordion] = useState(null);
  const socket = useContext(SocketContext);
  const listFolios = useContext(ListFoliosContext);

  const [isEndingFolio, setIsEndingFolio] = useState(false);
  const [typeClose, setTypeClose] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [classification, setClassification] = useState(-1);
  const [openModalTicket, setOpenModalTicket] = useState(false);
  const [openViewTicket, setOpenViewTicket] = useState(false);
  const [ticketSelected, setTicketSelected] = useState(null);
  const [openFindTicket, setOpenFindTicket] = useState(false);
  const [allQA, setAllQA] = useState([]);
  const [textFilter, setTextFilter] = useState('');
  const [listClassification, setListClassification] = useState([]);

  const toggleAccordion = (id) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  useEffect(() => {
    if (folio?.clasifications) {
      const tmpClass = folio.clasifications.map(item => ({
        key: item._id,
        value: item._id,
        text: item.name
      }));
      setListClassification(tmpClass);
    }
    setAllQA(quicklyAnswer);
  }, [folio, quicklyAnswer]);

  const findQA = (filter) => {
    setTextFilter(filter);
    if (filter.length <= 2) {
      setAllQA(quicklyAnswer);
      return;
    }
    const filtered = quicklyAnswer.filter(qa =>
      qa.text.toLowerCase().includes(filter.toLowerCase())
    );
    setAllQA(filtered);
  };

  const sendFile = (file) => {
    
      socket.connection.emit('sendMessage', {
        token: window.localStorage.getItem('sdToken'),
        folio: folio.folio._id,
        message: file.url,
        caption: file.name,
        class: file.mimeType.includes('pdf') ? 'document' : 'image'
      }, (result) => {
          const index = listFolios.current.findIndex(x => x.folio._id === folio.folio._id);
          if (index !== -1) {
            listFolios.current[index].folio.message.push(result.body.lastMessage);
            setRefresh(Math.random());
          }
        
      });
    
  };

  const renderCrmSection = () => (
    <>{folio && <CRM template={crm} person={person} folio={folio} setRefresh={setRefresh} />}</>
  );

  const renderPluginsSection = () => {
    const pluginsToTools = folio.folio.service.plugins.filter(p => ['zohocrm', 'mailingTemplate'].includes(p.plugin) && p.isActive);
    return (
      <div className="space-y-4">
        {pluginsToTools.map((plugin) => {
          switch (plugin.plugin) {
            case 'zohocrm':
              return <Zohocrm key={plugin.plugin} template={crm} person={person} folio={folio} setRefresh={setRefresh} />;
            case 'mailingTemplate':
              return (
                <MailingTemplate
                  key={plugin.plugin}
                  template={crm}
                  person={person}
                  folio={_.cloneDeep(folio)}
                  setRefresh={setRefresh}
                  setMessageToSend={setMessageToSend}
                  onClick={(htmlMail) => setInsertHtml(htmlMail)}
                />
              );
            default: return null;
          }
        })}
      </div>
    );
  };

  const renderTemplatesSection = () => (
    <Mtm mtm={mtm} person={folio.folio.person} setRefresh={setRefresh} folio={folio} />
  );

  const renderHistorySection = () => (
    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
      {historyFolios && historyFolios.length > 0 ? (
        historyFolios.map((item) => {
          const personName = item.person?.name || item.person || 'Sin nombre';
          return (
            <Card key={item._id} className="p-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-grow min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate" title={personName}>
                    {personName}
                  </p>
                  <p className="text-xs text-gray-600 truncate">{item.subject || 'Sin asunto'}</p>
                </div>
                <Chip size="sm" variant="flat" color={item.status === 'SOLVED' ? 'success' : 'default'} className="ml-2 flex-shrink-0">
                  {item.status}
                </Chip>
              </div>
              <Divider className="my-2" />
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">#{item.ticketNumber}</p>
                <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
            </Card>
          );
        })
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">No hay historial disponible</p>
      )}
    </div>
  );

  const renderQuickResponsesSection = () => (
    <>
      <Input
        aria-label="Search"
        placeholder="Buscar respuestas..."
        value={textFilter}
        onChange={(e) => findQA(e.target.value)}
        className="w-full mb-4"
        endContent={<FiX onClick={() => findQA('')} className="cursor-pointer text-gray-400 hover:text-gray-600" />}
      />
      <div className="space-y-1 max-h-60 overflow-y-auto pr-2">
        {allQA.map((item) => (
          <div
            key={item._id}
            className="p-2.5 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
            onClick={() => setMessageToSend(item.text)}
          >
            <p className="text-sm font-medium text-gray-800">{item.text}</p>
          </div>
        ))}
      </div>
    </>
  );

  // Handle accordion item click
  const handleAccordionClick = (id) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  // Close folio handler
  const closeFolio = async () => {
    if (classification === -1) return;
    
    setIsEndingFolio(true);
    try {
      // Implement your close folio logic here
      // await someApiCall({ folioId: folio.folio._id, classification });
      setOpenModal(false);
      setRefresh(prev => prev + 1);
    } catch (error) {
      console.error('Error closing folio:', error);
    } finally {
      setIsEndingFolio(false);
    }
  };

  // Open create ticket modal
  const openCreateTicket = () => {
    // Implement open create ticket logic
    console.log('Open create ticket');
  };

  // Handle open view ticket
  const handleOpenViewTicket = (ticket) => {
    setTicketSelected(ticket);
    setOpenViewTicket(true);
  };

  // Close view ticket
  const closeViewTicket = () => {
    setOpenViewTicket(false);
    setTicketSelected(null);
  };

  // Render tickets section
  const renderTicketsSection = () => (
    <div className="space-y-4">
      <Button color="primary" variant="light" onClick={openCreateTicket} className="w-full">
        <FiFileText className="mr-2" />
        Crear Ticket
      </Button>
      <Button color="primary" variant="bordered" onClick={() => setOpenFindTicket(true)} className="w-full">
        <FiSearch className="mr-2" />
        Buscar Ticket
      </Button>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {tickets?.map((ticket) => (
          <Card key={ticket._id} isPressable onPress={() => handleOpenViewTicket(ticket)} className="p-3">
            <p className="font-semibold text-sm">{ticket.subject}</p>
            <p className="text-xs text-gray-500">#{ticket.ticketNumber}</p>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderFilesSection = () => {
    if (!folio?.folio?.typeFolio || folio.folio.typeFolio !== '_MESSAGES_') return null;
    const files = infoService?.repoFiles || [];
    
    return (
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {files.length > 0 ? (
          files.map((file) => (
            <Card key={file._id} className="p-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0">
                  {getFileIcon(file.mimeType)}
                  <span className="text-sm text-gray-700 truncate" title={file.name}>{file.name}</span>
                </div>
                <div className="flex items-center flex-shrink-0 ml-2">
                  <Button isIconOnly auto size="sm" variant="light" as="a" href={file.url} target="_blank">
                    <FiEye className="text-lg" />
                  </Button>
                  <Button 
                    isIconOnly 
                    auto 
                    size="sm" 
                    variant="light" 
                    onPress={() => { 
                      const recipientName = folio.folio.person?.aliasId || folio.folio.person?.anchor || 'Contacto';
                      if (window.confirm(`¿Deseas enviar el archivo "${file.name}" a ${recipientName}?`)) { 
                        sendFile(file); 
                      } 
                    }}
                  >
                    <FiSend className="text-lg text-blue-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No hay archivos disponibles</p>
        )}
      </div>
    );
  };

  const renderTransferSection = () => {
    if (folio.folio.channel === 'call') return null;
    if (!folio.folio.fromInbox && !folio.folio.isGlobalQueue) {
      return <TransferFolio folio={folio} setRefresh={setRefresh} userInfo={userInfo} />;
    }
    if (folio.folio.fromInbox) {
      return <TransferFolioPrivado folio={folio} setRefresh={setRefresh} userInfo={userInfo} />;
    }
    if (folio.folio.isGlobalQueue && !folio.folio.isGlobalDistributor && !folio.folio.fromInbox) {
      return <TransferFolioQueueGlobal folio={folio} setRefresh={setRefresh} userInfo={userInfo} />;
    }
    return null;
  };

  const sections = [
    { id: 'crm', title: 'CRM', icon: FiUser, content: renderCrmSection },
    { id: 'plugins', title: 'Plugins', icon: FiGrid, content: renderPluginsSection },
    { id: 'templates', title: 'Plantillas de mensajes', icon: FiMessageSquare, content: renderTemplatesSection },
    { id: 'history', title: 'Historial de folios', icon: FiClock, content: renderHistorySection },
    { id: 'quickResponses', title: 'Respuestas Rápidas', icon: FiMessageCircle, content: renderQuickResponsesSection, condition: folio.folio.channel !== 'call' },
    { id: 'files', title: 'Catálogo de archivos', icon: FiFolder, content: renderFilesSection },
    { id: 'tickets', title: 'Tickets', icon: FiFileText, content: renderTicketsSection },
    { id: 'transfer', title: 'Transferir', icon: FiArrowRight, content: renderTransferSection, condition: folio.folio.channel !== 'call' },
  ];

  return (
    <div className="h-full flex flex-col p-2 bg-white overflow-y-auto">
   

      {sections.map(section => (
        (section.condition !== false) &&
        <AccordionItem
          key={section.id}
          title={{ text: section.title, icon: section.icon }}
          isOpen={openAccordion === section.id}
          onClick={() => handleAccordionClick(section.id)}
        >
          {section.content()}
        </AccordionItem>
      ))}

      {folio && !folio.folio.fromInbox && folio.folio.isGlobalQueue && folio.folio.channel !== 'call' && (
        <AccordionItem
          title={{ text: 'Transferir a Bandeja de Canal', icon: FiArrowRight }}
          isOpen={openAccordion === 'transferChannel'}
          onClick={() => handleAccordionClick('transferChannel')}
        >
          <TransferirFolioQueueGlobal_QueueLocal folio={folio} setRefresh={setRefresh} userInfo={userInfo} />
        </AccordionItem>
      )}

      {folio && !folio.folio.fromInbox && folio.folio.isGlobalQueue && folio.folio.isGlobalDistributor && folio.folio.channel !== 'call' && (
        <AccordionItem
          title={{ text: 'Transferir a Bandeja Genérica', icon: FiArrowRight }}
          isOpen={openAccordion === 'transferGeneric'}
          onClick={() => handleAccordionClick('transferGeneric')}
        >
          <TransferFolioQueueGeneric folio={folio} setRefresh={setRefresh} userInfo={userInfo} />
        </AccordionItem>
      )}

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
