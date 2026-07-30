import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { Button, Modal, Select, Input, Card, CardHeader, CardBody, Divider, Chip, Image, Loader, Icon, Message, Dimmer } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiMail, FiClock, FiFolder, FiSearch, FiX, FiMessageSquare, FiFileText, FiImage, FiFile, FiArrowRight, FiPaperclip, FiSend, FiChevronRight, FiChevronDown, FiGlobe, FiGrid, FiMessageCircle, FiEye } from 'react-icons/fi';
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

const AccordionItem = ({ title, isOpen, onClick, children, badge }) => {
  return (
    <Card className="ibc-accordion shadow-none mb-2 overflow-hidden" style={{ marginBottom: '6px' }}>
      <CardHeader className="ibc-accordion-header border-b cursor-pointer select-none" onClick={onClick} style={{ padding: '10px 14px' }}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {title.icon && <title.icon className="text-gray-400" style={{ fontSize: '1rem' }} />}
            <span className="ibc-accordion-title">{title.text}</span>
          </div>
          <div className="flex items-center gap-2">
            {badge}
            {isOpen ? <FiChevronDown className="text-gray-400" style={{ fontSize: '1rem' }} /> : <FiChevronRight className="text-gray-400" style={{ fontSize: '1rem' }} />}
          </div>
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
            <CardBody style={{ padding: '12px 14px' }}>{children}</CardBody>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

const SENTIMENT_CONFIG = {
  urgente:  { label: 'Urgente',  color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', dot: '#ef4444' },
  negativo: { label: 'Negativo', color: '#ea580c', bg: '#fff7ed', border: '#fdba74', dot: '#f97316' },
  positivo: { label: 'Positivo', color: '#16a34a', bg: '#f0fdf4', border: '#86efac', dot: '#22c55e' },
  neutro:   { label: 'Neutro',   color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', dot: '#9ca3af' },
};

const URGENT_WORDS   = ['urgente','emergencia','reclamo','supervisor','fraude','denuncia','abogado','cancelar contrato','queja formal'];
const NEGATIVE_WORDS = ['malo','mala','horrible','problema','falla','error','insatisfecho','demora','tardanza','no sirve','no funciona','pésimo','pesimo','molesto','molesta','enojado','frustrado','decepcionado'];
const POSITIVE_WORDS = ['gracias','perfecto','excelente','muy bien','genial','satisfecho','satisfecha','funcionó','resuelto','entendido','de acuerdo'];

function computeFolioSentiment(messages) {
  if (!messages?.length) return SENTIMENT_CONFIG.neutro;
  const clientText = messages
    .filter(m => m.direction !== 'out')
    .slice(-12)
    .map(m => (m.contentTxt || m.content || m.caption || '').toLowerCase())
    .join(' ');
  if (!clientText.trim()) return null;
  const urgentHits   = URGENT_WORDS.filter(w => clientText.includes(w)).length;
  const negativeHits = NEGATIVE_WORDS.filter(w => clientText.includes(w)).length;
  const positiveHits = POSITIVE_WORDS.filter(w => clientText.includes(w)).length;
  if (urgentHits >= 1)                      return SENTIMENT_CONFIG.urgente;
  if (negativeHits >= 2)                    return SENTIMENT_CONFIG.negativo;
  if (positiveHits >= 1 && negativeHits === 0) return SENTIMENT_CONFIG.positivo;
  return SENTIMENT_CONFIG.neutro;
}

const SentimentBadge = ({ sentiment }) => {
  if (!sentiment) return null;
  return (
    <span className={`ibc-sentiment ibc-sentiment-${sentiment.label.toLowerCase()}`}>
      <span className="ibc-sentiment-dot" style={{ background: sentiment.dot }} />
      {sentiment.label}
    </span>
  );
};

const getFileIcon = (mimeType) => {
  if (mimeType.includes('pdf')) return <FiFileText className="mr-2 text-red-500 flex-shrink-0" />;
  else if (mimeType.includes('image')) return <FiImage className="mr-2 text-chart-4 flex-shrink-0" />;
  return <FiFile className="mr-2 text-gray-500 flex-shrink-0" />;
};

const ToolsV2 = ({ quicklyAnswer, crm, person, folio, setRefresh, areas, tickets, setMessageToSend, historyFolios, userInfo, mtm, service: infoService, setInsertHtml, setHasTextContent }) => {
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
  const [windowState, setWindowState] = useState({ zoom: window.devicePixelRatio });

  const toggleAccordion = (id) => setOpenAccordion(openAccordion === id ? null : id);

  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotResult, setCopilotResult] = useState(null);
  const [copilotAlternatives, setCopilotAlternatives] = useState([]);
  const [copilotLimitations, setCopilotLimitations] = useState([]);
  const [copilotAction, setCopilotAction] = useState(null);
  const [copilotQuestion, setCopilotQuestion] = useState('');
  const [folioSentiment, setFolioSentiment] = useState(null);

  const clearCopilot = () => { setCopilotResult(null); setCopilotAlternatives([]); setCopilotLimitations([]); setCopilotAction(null); setCopilotQuestion(''); };

  const callCopilot = (action, question) => {
    const fId = folio?.folio?._id;
    const sId = folio?.folio?.service?._id || folio?.folio?.service;
    if (!fId || !sId) return;
    setCopilotAction(action);
    setCopilotResult(null);
    setCopilotAlternatives([]);
    setCopilotLimitations([]);
    setCopilotLoading(true);
    axios.post(`${process.env.REACT_APP_CENTRALITA}/ai/copilot/suggest`, { folioId: String(fId), serviceId: String(sId), action, question: question || null })
      .then(({ data }) => { const b = data?.body || data; setCopilotResult(b?.suggestion || null); setCopilotAlternatives(Array.isArray(b?.alternatives) ? b.alternatives : []); setCopilotLimitations(b?.limitations || []); })
      .catch(() => { setCopilotResult(null); setCopilotAlternatives([]); setCopilotLimitations([]); })
      .finally(() => setCopilotLoading(false));
  };

  const renderCopilotSection = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <button
          onClick={() => callCopilot('classify')}
          disabled={copilotLoading}
          style={{ padding: '7px 10px', fontSize: '12px', fontWeight: 500, background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ede9fe', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}
        >
          🏷 Clasificar
        </button>
        <button
          onClick={() => { clearCopilot(); setCopilotAction('ask'); }}
          disabled={copilotLoading}
          style={{ padding: '7px 10px', fontSize: '12px', fontWeight: 500, background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ede9fe', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}
        >
          ❓ Preguntar
        </button>
      </div>
      {copilotAction === 'ask' && !copilotResult && (
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            value={copilotQuestion}
            onChange={(e) => setCopilotQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && copilotQuestion.trim() && callCopilot('ask', copilotQuestion)}
            placeholder="Escribe tu pregunta sobre el folio…"
            style={{ flex: 1, padding: '6px 10px', fontSize: '12px', border: '1px solid #ebebeb', borderRadius: '8px', outline: 'none' }}
          />
          <button
            onClick={() => copilotQuestion.trim() && callCopilot('ask', copilotQuestion)}
            disabled={copilotLoading || !copilotQuestion.trim()}
            style={{ padding: '6px 12px', fontSize: '12px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: copilotQuestion.trim() ? 1 : 0.5 }}
          >
            →
          </button>
        </div>
      )}
      {copilotLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', fontSize: '12px', color: '#7c3aed' }}>
          <div style={{ width: '14px', height: '14px', border: '2px solid #e9d5ff', borderTop: '2px solid #7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          Analizando conversación…
        </div>
      )}
      {!copilotLoading && !copilotResult && copilotAction && copilotLimitations.length > 0 && (
        <div style={{ fontSize: '11px', color: '#9ca3af', padding: '6px 10px', background: '#fafafa', borderRadius: '6px', border: '1px solid #ebebeb' }}>
          {copilotLimitations[0]}
        </div>
      )}
      {copilotResult && !copilotLoading && copilotAction === 'classify' && (
        <div style={{ background: '#faf5ff', borderRadius: '8px', padding: '10px 12px', border: '1px solid #ede9fe' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Clasificaciones sugeridas</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {[copilotResult, ...copilotAlternatives].filter(Boolean).map((cat, i) => (
              <button
                key={i}
                onClick={() => navigator.clipboard?.writeText(cat)}
                title="Clic para copiar"
                style={{ padding: '4px 12px', fontSize: '11px', fontWeight: i === 0 ? 600 : 400, background: i === 0 ? '#7c3aed' : '#ffffff', color: i === 0 ? '#fff' : '#7c3aed', border: '1px solid #ede9fe', borderRadius: '20px', cursor: 'pointer' }}
              >
                {cat}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '6px' }}>Clic en una clasificación para copiarla</p>
          <button onClick={clearCopilot} style={{ marginTop: '6px', padding: '3px 10px', fontSize: '11px', background: 'transparent', color: '#9ca3af', border: '1px solid #ebebeb', borderRadius: '6px', cursor: 'pointer' }}>Limpiar</button>
        </div>
      )}
      {copilotResult && !copilotLoading && copilotAction !== 'classify' && (
        <div style={{ borderLeft: '3px solid #a78bfa', background: '#faf5ff', borderRadius: '0 8px 8px 0', padding: '10px 12px', fontSize: '12px', color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {copilotResult}
          <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
            <button
              onClick={() => { navigator.clipboard?.writeText(copilotResult); }}
              style={{ padding: '4px 10px', fontSize: '11px', background: 'transparent', color: '#7c3aed', border: '1px solid #ede9fe', borderRadius: '6px', cursor: 'pointer' }}
            >
              Copiar
            </button>
            <button
              onClick={clearCopilot}
              style={{ padding: '4px 10px', fontSize: '11px', background: 'transparent', color: '#9ca3af', border: '1px solid #ebebeb', borderRadius: '6px', cursor: 'pointer' }}
            >
              Limpiar
            </button>
          </div>
        </div>
      )}
    </div>
  );

  useEffect(() => {
    if (folio?.clasifications) {
      const tmpClass = folio.clasifications.map(item => ({ key: item._id, value: item._id, text: item.name }));
      setListClassification(tmpClass);
    }
    setAllQA(quicklyAnswer);
  }, [folio, quicklyAnswer]);

  useEffect(() => {
    const handleResize = () => setWindowState({ zoom: window.devicePixelRatio });
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    clearCopilot();
    const msgs = folio?.folio?.message;
    setFolioSentiment(msgs?.length ? computeFolioSentiment(msgs) : null);
    const fId = folio?.folio?._id;
    const sId = folio?.folio?.service?._id || folio?.folio?.service;
    if (fId && sId) {
      axios.post(`${process.env.REACT_APP_CENTRALITA}/ai/copilot/suggest`, {
        folioId: String(fId), serviceId: String(sId), action: 'sentiment',
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folio?.folio?._id]);

  const getZoomAdjustedStyles = () => ({
    fontSize: windowState.zoom < 1 ? '1.1rem' : windowState.zoom > 1.3 ? '0.9rem' : '1rem',
    padding: windowState.zoom < 1 ? '1rem' : windowState.zoom > 1.3 ? '0.5rem' : '0.75rem',
  });

  const findQA = (filter) => {
    setTextFilter(filter);
    if (filter.length <= 2) {
      setAllQA(quicklyAnswer);
      return;
    }
    const filtered = quicklyAnswer.filter(qa => qa.text.toLowerCase().includes(filter.toLowerCase()));
    setAllQA(filtered);
  };

  const sendFile = (file) => {
    socket.connection.emit('sendMessage', {
      token: window.localStorage.getItem('sdToken'),
      folio: folio.folio._id,
      message: file.url,
      caption: file.name,
      class: file.mimeType.includes('pdf') ? 'document' : 'image',
    }, (result) => {
      const index = listFolios.current.findIndex(x => x.folio._id === folio.folio._id);
      if (index !== -1) {
        listFolios.current[index].folio.message.push(result.body.lastMessage);
        setRefresh(Math.random());
      }
    });
  };

  const renderCrmSection = () => <>{folio && <CRM template={crm} person={person} folio={folio} setRefresh={setRefresh} />}</>;

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
            default:
              return null;
          }
        })}
      </div>
    );
  };

  const renderTemplatesSection = () => (
    <Mtm mtm={mtm} person={folio.folio.person} setRefresh={setRefresh} folio={folio} />
  );

  const renderHistorySection = () => {
    const historyFoliosReverse = historyFolios ? [...historyFolios].reverse() : [];
    return <HistoryFolios historyFolios={historyFoliosReverse} />;
  };

  const renderQuickResponsesSection = () => (
    <>
      <Input
        aria-label="Search"
        placeholder="Buscar respuestas..."
        value={textFilter}
        onChange={(e) => findQA(e.target.value)}
        className="w-full mb-4"
        style={{ fontSize: '1rem', ...getZoomAdjustedStyles() }}
        endContent={<FiX onClick={() => findQA('')} className="cursor-pointer text-gray-400 hover:text-gray-600" />}
      />
      <div className="flex flex-col overflow-hidden mb-4" style={{ height: 'calc(100vh - 20rem)', minHeight: '15rem', maxHeight: '40rem' }}>
        <div className="overflow-y-auto pr-2 flex-grow" style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
          {allQA.length > 0 ? (
            allQA.map((item, index) => (
              <div
                key={item._id}
                className="p-2.5 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors mb-2"
                onClick={() => {
                  setMessageToSend(item.text);
                  setHasTextContent(true);
                }}
                style={{ marginBottom: index === allQA.length - 1 ? '2rem' : '0.5rem', fontSize: '1rem' }}
              >
                <p className="text-lg font-medium text-gray-800 break-words">{item.text}</p>
              </div>
            ))
          ) : (
            <p className="text-base text-gray-500 text-center py-4">No hay respuestas rápidas disponibles</p>
          )}
        </div>
      </div>
    </>
  );

  const handleAccordionClick = (id) => setOpenAccordion(openAccordion === id ? null : id);

  const closeFolio = async () => {
    if (classification === -1) return;
    setIsEndingFolio(true);
    try {
      setOpenModal(false);
      setRefresh(prev => prev + 1);
    } catch (error) {
      console.error('Error closing folio:', error);
    } finally {
      setIsEndingFolio(false);
    }
  };

  const openCreateTicket = () => console.log('Open create ticket');

  const handleOpenViewTicket = (ticket) => {
    setTicketSelected(ticket);
    setOpenViewTicket(true);
  };

  const closeViewTicket = () => {
    setOpenViewTicket(false);
    setTicketSelected(null);
  };

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

  const ensureHttps = (url) => {
    if (!url) return '';
    if (url.startsWith('https://')) return url;
    if (url.startsWith('http://')) return url.replace('http://', 'https://');
    return `https://${url}`;
  };

  const renderFilesSection = () => {
    if (!folio?.folio?.typeFolio || folio.folio.typeFolio !== '_MESSAGES_') return null;
    const files = infoService?.repoFiles ? infoService.repoFiles.map(file => ({ ...file, url: ensureHttps(file.url) })) : [];
    return (
      <div className="space-y-2 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 20rem)', minHeight: '10rem', scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
        {files.length > 0 ? (
          files.map((file) => (
            <Card key={file._id} className="p-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0">
                  {getFileIcon(file.mimeType)}
                  <span className="text-md text-gray-700 truncate" title={file.name} style={{ fontSize: '0.875rem' }}>{file.name}</span>
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
                      if (window.confirm(`¿Deseas enviar el archivo "${file.name}" a ${recipientName}?`)) sendFile(file);
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
    if (!folio.folio.fromInbox && !folio.folio.isGlobalQueue) return <TransferFolio folio={folio} setRefresh={setRefresh} userInfo={userInfo} />;
    if (folio.folio.fromInbox) return <TransferFolioPrivado folio={folio} setRefresh={setRefresh} userInfo={userInfo} />;
    if (folio.folio.isGlobalQueue && !folio.folio.isGlobalDistributor && !folio.folio.fromInbox) return <TransferFolioQueueGlobal folio={folio} setRefresh={setRefresh} userInfo={userInfo} />;
    return null;
  };

  const sections = [
    { id: 'copilot', title: 'Copilot IA', icon: FiMessageCircle, content: renderCopilotSection, badge: <SentimentBadge sentiment={folioSentiment} /> },
    { id: 'crm', title: 'CRM', icon: FiUser, content: renderCrmSection },
    { id: 'plugins', title: 'Plugins', icon: FiGrid, content: renderPluginsSection },
    { id: 'templates', title: 'Plantillas de mensajes', icon: FiMessageSquare, content: renderTemplatesSection, condition: folio.folio.channel !== 'call' },
    { id: 'history', title: 'Historial de folios', icon: FiClock, content: renderHistorySection },
    { id: 'tickets', title: 'Tickets', icon: FiFileText, content: renderTicketsSection, condition: folio.folio.channel !== 'call' },
    { id: 'transfer', title: 'Transferir', icon: FiArrowRight, content: renderTransferSection, condition: folio.folio.channel !== 'call' },
    { id: 'quickResponses', title: 'Respuestas Rápidas', icon: FiMessageCircle, content: renderQuickResponsesSection, condition: folio.folio.channel !== 'call' },
    { id: 'files', title: 'Catálogo de archivos', icon: FiFolder, content: renderFilesSection, condition: folio.folio.channel !== 'call' },
  ];

  return (
    <div className="h-full flex flex-col p-2 bg-transparent overflow-y-auto" style={{ minHeight: '100vh', padding: '0.5rem' }}>
      {sections.map(section => (
        section.condition !== false && (
          <AccordionItem
            key={section.id}
            title={{ text: section.title, icon: section.icon }}
            isOpen={openAccordion === section.id}
            onClick={() => handleAccordionClick(section.id)}
            badge={section.badge}
          >
            {section.content()}
          </AccordionItem>
        )
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
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Modal.Header className="border-b px-6 py-4" style={{ padding: '1rem 1.5rem' }}>
          <h3 className="text-lg font-medium" style={{ fontSize: '1.125rem' }}>Confirmar acción</h3>
        </Modal.Header>
        <Modal.Body className="p-6" style={{ padding: '1.5rem' }}>
          <div className="space-y-4">
            <Select
              placeholder="Selecciona una clasificación"
              options={listClassification}
              value={classification}
              onChange={(e, { value }) => setClassification(value)}
              className="w-full"
              style={{ fontSize: '1rem' }}
            />
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg" style={{ padding: '1rem 1.5rem' }}>
          <Button variant="light" onClick={() => setOpenModal(false)}>Cancelar</Button>
          <Button color={typeClose === 'guardar' ? 'primary' : 'success'} onClick={closeFolio} loading={isEndingFolio} disabled={classification === -1}>
            {typeClose === 'guardar' ? 'Guardar' : 'Finalizar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ToolsV2;