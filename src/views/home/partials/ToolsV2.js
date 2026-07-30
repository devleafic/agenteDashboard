import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { Button, Modal, Select, Input, Card, CardHeader, CardBody, Divider, Chip, Image, Loader, Icon, Message, Dimmer } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Clock, Folder, Search, X, MessageSquare, FileText, Image as ImageIcon, File as FileIcon, ArrowRight, Send, ChevronRight, ChevronDown, Grid, MessageCircle, Eye } from 'lucide-react';
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
            {title.icon && <title.icon className="text-ink-400" style={{ fontSize: '1rem' }} />}
            <span className="ibc-accordion-title">{title.text}</span>
          </div>
          <div className="flex items-center gap-2">
            {badge}
            {isOpen ? <ChevronDown className="text-ink-400" style={{ fontSize: '1rem' }} /> : <ChevronRight className="text-ink-400" style={{ fontSize: '1rem' }} />}
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

/* El relleno, el texto y el borde los pinta .ibc-sentiment-* en index.css.
   Aqui solo queda el punto, que va inline, y apunta al token en vez de a un
   hex propio: antes eran los rojos/naranjas de Tailwind y quedaban fuera de
   la escala aunque la pastilla ya estuviera migrada. */
const SENTIMENT_CONFIG = {
  urgente:  { label: 'Urgente',  dot: 'var(--critical)' },
  negativo: { label: 'Negativo', dot: 'var(--serious)' },
  positivo: { label: 'Positivo', dot: 'var(--good)' },
  neutro:   { label: 'Neutro',   dot: 'var(--text-muted)' },
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
    .join('');
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
  if (mimeType.includes('pdf')) return <FileText className="mr-2 text-ink-500 flex-shrink-0" />;
  else if (mimeType.includes('image')) return <ImageIcon className="mr-2 text-ink-500 flex-shrink-0" />;
  return <FileIcon className="mr-2 text-ink-500 flex-shrink-0" />;
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
  const [copilotError, setCopilotError] = useState(null);

  const clearCopilot = () => { setCopilotResult(null); setCopilotAlternatives([]); setCopilotLimitations([]); setCopilotAction(null); setCopilotQuestion(''); setCopilotError(null); };

  /* El backend siempre responde 200 con success:true y explica los fallos en
     limitations[]. Pero si el bus de IA no contesta, response.body llega vacio
     y statusFromAIResponse cae al 502 por defecto: axios lanza y antes aqui el
     .catch dejaba todo en null sin pintar nada. De ahi el "hago la consulta y
     no veo respuesta": no era que se perdiera, es que no habia estado de error. */
  const callCopilot = (action, question) => {
    const fId = folio?.folio?._id;
    const sId = folio?.folio?.service?._id || folio?.folio?.service;
    if (!fId || !sId) {
      setCopilotAction(action);
      setCopilotError('No se pudo identificar el folio o el servicio. Reabre la conversación e intenta de nuevo.');
      return;
    }
    setCopilotAction(action);
    setCopilotResult(null);
    setCopilotAlternatives([]);
    setCopilotLimitations([]);
    setCopilotError(null);
    setCopilotLoading(true);
    axios.post(`${process.env.REACT_APP_CENTRALITA}/ai/copilot/suggest`, { folioId: String(fId), serviceId: String(sId), action, question: question || null })
      .then(({ data }) => {
        const b = data?.body || data;
        const suggestion = b?.suggestion || null;
        const limitations = b?.limitations || [];
        setCopilotResult(suggestion);
        setCopilotAlternatives(Array.isArray(b?.alternatives) ? b.alternatives : []);
        setCopilotLimitations(limitations);
        // 200 sin sugerencia y sin explicacion tampoco puede quedar en silencio.
        if (!suggestion && limitations.length === 0) {
          setCopilotError('El copiloto no devolvió una respuesta para esta consulta.');
        }
      })
      .catch((err) => {
        const status = err?.response?.status;
        const data = err?.response?.data;
        /* Aunque centralita responda 4xx/5xx, el cuerpo sigue trayendo el
           motivo real de aiServices. THROTTLE_EXCEEDED, por ejemplo, no esta
           en el switch de statusFromAIResponse y sale como 502: sin leer esto
           el agente veria "no respondió" cuando en realidad fue rechazado. */
        const reason = data?.limitations?.[0] || data?.message || data?.error;
        setCopilotResult(null);
        setCopilotAlternatives([]);
        setCopilotLimitations([]);
        setCopilotError(
          reason ? reason
          : status === 503 ? 'Los servicios de IA están desactivados por configuración.'
          : status === 502 ? 'El servicio de IA no respondió. Intenta de nuevo en unos segundos.'
          : 'No se pudo consultar al copiloto. Revisa tu conexión e intenta de nuevo.'
        );
      })
      .finally(() => setCopilotLoading(false));
  };

  /* Este bloque estaba escrito con style inline y la paleta violeta del diseño
     anterior (los violetas y sus tintes), por eso no lo veia el barrido de
     clases de Tailwind. Ahora usa las primitivas de brand.css. */
  const renderCopilotSection = () => (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-1.5">
        <button onClick={() => callCopilot('classify')} disabled={copilotLoading} className="bd-copilot-btn">
          🏷 Clasificar
        </button>
        <button onClick={() => { clearCopilot(); setCopilotAction('ask'); }} disabled={copilotLoading} className="bd-copilot-btn">
          ❓ Preguntar
        </button>
      </div>

      {copilotAction === 'ask' && !copilotResult && (
        <div className="flex gap-1.5">
          <input
            value={copilotQuestion}
            onChange={(e) => setCopilotQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && copilotQuestion.trim() && callCopilot('ask', copilotQuestion)}
            placeholder="Escribe tu pregunta sobre el folio…"
            className="flex-1 px-2.5 py-1.5 text-xs bg-cream-50 border border-hair focus:outline-none focus:border-flame-ember"
          />
          <button
            onClick={() => copilotQuestion.trim() && callCopilot('ask', copilotQuestion)}
            disabled={copilotLoading || !copilotQuestion.trim()}
            className="px-3 py-1.5 text-xs bg-ink text-cream hover:bg-ink-800 transition-colors disabled:opacity-50"
          >
            →
          </button>
        </div>
      )}

      {copilotLoading && (
        <div className="flex items-center gap-2 p-2 text-xs text-ink-500">
          <div className="w-3.5 h-3.5 border-2 border-hair border-t-flame-ember rounded-full animate-spin" />
          Analizando conversación…
        </div>
      )}

      {/* Fallo de transporte o respuesta vacia. Antes esto no existia y el
          copiloto se quedaba mudo. */}
      {copilotError && !copilotLoading && (
        <div className="bd-status-critical hair p-2 text-xs flex items-start gap-2">
          <span aria-hidden="true">⚠</span>
          <div className="flex-1">
            {copilotError}
            <button onClick={clearCopilot} className="block mt-1.5 text-ink-500 hover:text-ink underline">
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* El backend explica sus propios fallos aqui (LLM sin configurar,
          timeout, folio sin contexto). */}
      {!copilotLoading && !copilotResult && !copilotError && copilotAction && copilotLimitations.length > 0 && (
        <div className="bg-cream-100 hair p-2 text-xs text-ink-500">
          {copilotLimitations[0]}
        </div>
      )}

      {copilotResult && !copilotLoading && copilotAction === 'classify' && (
        <div className="bg-cream-100 hair p-3">
          <p className="ibc-section-label">Clasificaciones sugeridas</p>
          <div className="flex flex-wrap gap-1.5">
            {[copilotResult, ...copilotAlternatives].filter(Boolean).map((cat, i) => (
              <button
                key={i}
                onClick={() => navigator.clipboard?.writeText(cat)}
                title="Clic para copiar"
                className={`px-3 py-1 text-[11px] rounded-full border transition-colors ${
                  i === 0
                    ? 'bg-ink text-cream border-ink font-semibold'
                    : 'bg-cream-50 text-ink border-hair hover:border-flame-ember'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-ink-400 mt-1.5">Clic en una clasificación para copiarla</p>
          <button onClick={clearCopilot} className="mt-1.5 px-2.5 py-0.5 text-[11px] text-ink-500 border border-hair hover:border-ink-400 transition-colors">
            Limpiar
          </button>
        </div>
      )}

      {copilotResult && !copilotLoading && copilotAction !== 'classify' && (
        <div className="bd-copilot-panel">
          {copilotResult}
          <div className="mt-2 flex gap-1.5">
            <button
              onClick={() => { navigator.clipboard?.writeText(copilotResult); }}
              className="px-2.5 py-1 text-[11px] text-ink border border-hair hover:border-flame-ember transition-colors"
            >
              Copiar
            </button>
            <button
              onClick={clearCopilot}
              className="px-2.5 py-1 text-[11px] text-ink-500 border border-hair hover:border-ink-400 transition-colors"
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
    /* El sentimiento que se pinta sale de esta heuristica local, no del
       servidor. Aqui habia ademas un POST /ai/copilot/suggest con
       action:'sentiment' cuya respuesta se descartaba (.catch vacio, sin
       .then). Consumia una de las 20 llamadas por folio del throttle de
       AgentCopilot —que no caduca— y arrastraba dos consultas a dataStorage,
       una de ellas (/ai/service/config) que ese action ni siquiera usa.
       Se elimina: si algun dia se quiere el sentimiento del servidor, hay
       que leer la respuesta y sustituir computeFolioSentiment. */
    setFolioSentiment(msgs?.length ? computeFolioSentiment(msgs) : null);
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
        endContent={<X onClick={() => findQA('')} className="cursor-pointer text-ink-400 hover:text-ink-500" />}
      />
      <div className="flex flex-col overflow-hidden mb-4" style={{ height: 'calc(100vh - 20rem)', minHeight: '15rem', maxHeight: '40rem' }}>
        <div className="overflow-y-auto pr-2 flex-grow" style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
          {allQA.length > 0 ? (
            allQA.map((item, index) => (
              <div
                key={item._id}
                className="p-2.5 hover:bg-cream-200 cursor-pointer transition-colors mb-2"
                onClick={() => {
                  setMessageToSend(item.text);
                  setHasTextContent(true);
                }}
                style={{ marginBottom: index === allQA.length - 1 ? '2rem' : '0.5rem', fontSize: '1rem' }}
              >
                <p className="text-lg font-medium text-ink break-words">{item.text}</p>
              </div>
            ))
          ) : (
            <p className="text-base text-ink-500 text-center py-4">No hay respuestas rápidas disponibles</p>
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
        <FileText className="mr-2" />
        Crear Ticket
      </Button>
      <Button color="primary" variant="bordered" onClick={() => setOpenFindTicket(true)} className="w-full">
        <Search className="mr-2" />
        Buscar Ticket
      </Button>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {tickets?.map((ticket) => (
          <Card key={ticket._id} isPressable onPress={() => handleOpenViewTicket(ticket)} className="p-3">
            <p className="font-semibold text-sm">{ticket.subject}</p>
            <p className="text-xs text-ink-500">#{ticket.ticketNumber}</p>
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
            <Card key={file._id} shadow="none" className="p-2.5 bd-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0">
                  {getFileIcon(file.mimeType)}
                  <span className="text-md text-ink-600 truncate" title={file.name} style={{ fontSize: '0.875rem' }}>{file.name}</span>
                </div>
                <div className="flex items-center flex-shrink-0 ml-2">
                  <Button isIconOnly auto size="sm" variant="light" as="a" href={file.url} target="_blank">
                    <Eye className="text-lg" />
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
                    <Send className="text-lg text-ink" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <p className="text-sm text-ink-500 text-center py-4">No hay archivos disponibles</p>
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
    { id: 'copilot', title: 'Copilot IA', icon: MessageCircle, content: renderCopilotSection, badge: <SentimentBadge sentiment={folioSentiment} /> },
    { id: 'crm', title: 'CRM', icon: User, content: renderCrmSection },
    { id: 'plugins', title: 'Plugins', icon: Grid, content: renderPluginsSection },
    { id: 'templates', title: 'Plantillas de mensajes', icon: MessageSquare, content: renderTemplatesSection, condition: folio.folio.channel !== 'call' },
    { id: 'history', title: 'Historial de folios', icon: Clock, content: renderHistorySection },
    { id: 'tickets', title: 'Tickets', icon: FileText, content: renderTicketsSection, condition: folio.folio.channel !== 'call' },
    { id: 'transfer', title: 'Transferir', icon: ArrowRight, content: renderTransferSection, condition: folio.folio.channel !== 'call' },
    { id: 'quickResponses', title: 'Respuestas Rápidas', icon: MessageCircle, content: renderQuickResponsesSection, condition: folio.folio.channel !== 'call' },
    { id: 'files', title: 'Catálogo de archivos', icon: Folder, content: renderFilesSection, condition: folio.folio.channel !== 'call' },
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
          title={{ text: 'Transferir a Bandeja de Canal', icon: ArrowRight }}
          isOpen={openAccordion === 'transferChannel'}
          onClick={() => handleAccordionClick('transferChannel')}
        >
          <TransferirFolioQueueGlobal_QueueLocal folio={folio} setRefresh={setRefresh} userInfo={userInfo} />
        </AccordionItem>
      )}
      {folio && !folio.folio.fromInbox && folio.folio.isGlobalQueue && folio.folio.isGlobalDistributor && folio.folio.channel !== 'call' && (
        <AccordionItem
          title={{ text: 'Transferir a Bandeja Genérica', icon: ArrowRight }}
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
        <Modal.Footer className="bg-cream-100 hair-t px-6 py-4 flex justify-end space-x-3" style={{ padding: '1rem 1.5rem' }}>
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