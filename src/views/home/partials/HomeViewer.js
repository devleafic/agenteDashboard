import React, { useContext, useEffect, useState, useRef, useMemo } from 'react';
import { Avatar, Badge, Button as HeroButton, Input, Switch, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Tooltip } from "@heroui/react";
import { Paperclip, Send, XCircle, Save, LogOut, AlertTriangle, Mail, Globe, Box, Inbox, MessageCircle, MessageCircleOff, PhoneCall, MailOpen, Sparkles, MessageSquare, Search, Calendar, Clock } from 'lucide-react';
import Comments from './CommentsV2';
import Tools from './ToolsV2';
import axios from 'axios';
import { loadFolioAssignmentTimes, saveFolioAssignmentTimes, clearFolioAssignmentTimes } from './../../../utils/folioUtils';
import ListFoliosContext from '../../../controladores/FoliosContext';
import generateAvatarUrl from '../../../utils/avatarUtils';
import ElapsedTime from './ElapsedTime';
import PageTitle from '../../../components/PageTitle';

// --- SVG Icon Components ---
const SearchIcon = (props) => (
  <svg aria-hidden="true" fill="none" focusable="false" height="1em" role="presentation" viewBox="0 0 24 24" width="1em" {...props}>
    <path d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
    <path d="M22 22L20 20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
  </svg>
);

const PhoneIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
);

const EnvelopeIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
);

const ChatBubbleIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.761 9.761 0 01-2.544-.467l-1.027.962a4.513 4.513 0 01-1.416.525V19.05a9.718 9.718 0 01-1.044-3.288A9.75 9.75 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
);

const ChevronLeftIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

const ChevronRightIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
);

const ChevronDownIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

const InboxIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z" />
    </svg>
);


const HomeViewer = ({ isConnected, show, refresh, setRefresh, onCall, setOnCall, userInfo, sidCall, setSidCall, dispatch, unReadFolios, countunReadMsg, dispatchCount, vFolio, setVFolio }) => {

    const boxMessage = useRef(null);
    const listFolios = useContext(ListFoliosContext);
    const [messageToSend, setMessageToSend] = useState('');
    const [hasTextContent, setHasTextContent] = useState(false);
    const [toolsOpen, setToolsOpen] = useState(true);
    const [availableCh, setAvailableCh] = useState(null);
    const [loadPage, setLoadPage] = useState(false);
    const [filterText, setFilterText] = useState('');
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const [sortBy, setSortBy] = useState('default');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [folioAssignmentTimes, setFolioAssignmentTimes] = useState(loadFolioAssignmentTimes());

    const removeFolioAssignmentTime = (folioId) => {
        setFolioAssignmentTimes(prevTimes => {
            const newTimes = { ...prevTimes };
            delete newTimes[folioId];
            return newTimes;
        });
    };

    // Persist assignment times to localStorage whenever they change.
    useEffect(() => {
        saveFolioAssignmentTimes(folioAssignmentTimes);
    }, [folioAssignmentTimes]);

    // Cleanup assignment times on logout or when the window is closed.
    useEffect(() => {
        const handleUnload = () => {
            clearFolioAssignmentTimes();
        };

        window.addEventListener('beforeunload', handleUnload);

        // Cleanup when the component is unmounted (e.g., on logout).
        return () => {
            window.removeEventListener('beforeunload', handleUnload);
            // The `show` prop becoming false indicates a logout.
            if (!show) {
                clearFolioAssignmentTimes();
            }
        };
    }, [show]);

    // Add assignment times for new folios that don't have one yet.
    useEffect(() => {
        if (!listFolios.current) return;

        const updatedTimes = { ...folioAssignmentTimes };
        let needsUpdate = false;

        listFolios.current.forEach(item => {
            const folioId = item?.folio?._id;
            if (folioId && !updatedTimes[folioId]) {
                updatedTimes[folioId] = new Date().toISOString();
                needsUpdate = true;
            }
        });

        if (needsUpdate) {
            setFolioAssignmentTimes(updatedTimes);
        }
        // We depend on the raw list of folios. The join is a stable dependency.
    }, [listFolios && listFolios.current && listFolios.current?.map(f => f.folio?._id).join(',')]);

    const hideTools = () => {
        setToolsOpen(!toolsOpen);
    };

    useEffect(() => {
        const loadInitialData = async () => {
            if (!availableCh) {
                setLoadPage(true);
                try {
                    const resPlugin = await axios.get(process.env.REACT_APP_CENTRALITA + '/plugins/available');
                    const plugins = resPlugin.data.plugins;
                    setAvailableCh(plugins);
                    window.localStorage.setItem('plugins', JSON.stringify(plugins));
                } catch (error) {
                    console.error("Failed to load plugins", error);
                }
                setLoadPage(false);
            }

            const folios = listFolios.current;
            if (folios.length > 0) {
                const folioIds = folios.map(x => x.folio._id);
                if (vFolio) {
                    const isExist = folioIds.includes(vFolio);
                    if (!isExist) {
                        setVFolio(folioIds[0]);
                    }
                } else {
                    setVFolio(folioIds[0]);
                }
            } else {
                setVFolio(null);
            }
        };
        loadInitialData();
    }, [refresh, listFolios.current, availableCh]);

    const getMessageEmpty = () => {
        let header, colorClass, icon;
        switch (isConnected) {
            case -1:
                header = userInfo.onlyteamchat ? 'Solo tienes acceso a TeamChat.' : 'Aun no estas conectado, selecciona una actividad.';
                colorClass = 'bd-status-warn border-warn';
                icon = '⚠️';
                break;
            case 1:
                header = 'Listo para recibir nuevos mensajes o llamadas.';
                colorClass = 'bd-status-good border-good';
                icon = '✅';
                break;
            case 2:
                header = 'Continuas conectado, pero no recibiras nuevos mensajes o llamadas.';
                colorClass = 'bd-status-warn border-warn';
                icon = '⏸️';
                break;
            default:
                return null;
        }
        return (
            <div className="flex items-center justify-center h-full p-6">
                <div className={`w-full max-w-2xl border border-l-4 p-6 transition-colors duration-300 ${colorClass}`} role="alert">
                    <div className="flex items-center space-x-4">
                        <span className="text-2xl">{icon}</span>
                        <p className="text-lg font-semibold">{header}</p>
                    </div>
                    {isConnected === 1 && (
                        <p className="mt-3 text-base text-ink-600">
                            Estamos listos para atender tus mensajes y llamadas. Te notificaremos cuando tengas una nueva conversación.
                        </p>
                    )}
                </div>
            </div>
        );
    };

    const activeFolioData = vFolio ? listFolios.current.find(f => f.folio._id === vFolio) : null;

    // Use a ref to store the previous unread state to stabilize sorting
    const prevUnreadRef = useRef(unReadFolios);
    useEffect(() => {
        prevUnreadRef.current = unReadFolios;
    });

    const foliosCount = listFolios.current ? listFolios.current.length : 0;

    const processedFolios = useMemo(() => {
        if (!listFolios.current) return [];

        // Use the unread state from the *previous* render for filtering and sorting to prevent jarring UI changes.
        const unreadSource = prevUnreadRef.current || unReadFolios;

        const filtered = listFolios.current.filter(item => {
            if (!item?.folio) return false;
            
            // When "Unread only" is active, use the stabilized unread list.
            if (showUnreadOnly && (!unreadSource || !unreadSource[item.folio._id])) {
                return false;
            }

            const searchTerm = filterText.toLowerCase();
            if (searchTerm) {
                const personInfo = (item.folio.person?.aliasId || item.folio.person?.anchor || '').toLowerCase();
                const subjectInfo = (item.folio.lastEmailProcessed?.subject || '').toLowerCase();
                if (!(personInfo.includes(searchTerm) || subjectInfo.includes(searchTerm))) {
                    return false;
                }
            }

            return true;
        });

        return [...filtered].sort((a, b) => {
            if (sortBy === 'unread') {
                // Use the same stabilized unread list for sorting.
                const aIsUnread = unreadSource && a.folio?._id ? !!unreadSource[a.folio._id] : false;
                const bIsUnread = unreadSource && b.folio?._id ? !!unreadSource[b.folio._id] : false;
                if (aIsUnread !== bIsUnread) {
                    return bIsUnread - aIsUnread;
                }
            }
            
            const dateA = new Date(a.folio?.lastMessage?.date || 0);
            const dateB = new Date(b.folio?.lastMessage?.date || 0);
            return dateB - dateA;
        });
    }, [foliosCount, filterText, showUnreadOnly, sortBy, unReadFolios]);

    return (
        <div style={{ display: show ? 'flex' : 'none' }} className="bd-workspace h-[calc(100vh-80px)] w-full overflow-hidden relative">
            {/* Tirador de colapso: vive sobre la canaleta, no encima del plano. */}
            <Tooltip content={isSidebarCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}>
            <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="bd-gutter-toggle absolute left-0 top-1/2 -translate-y-1/2 z-20"
                aria-label={isSidebarCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
            >
                {isSidebarCollapsed ? (
                    <ChevronRightIcon className="w-3 h-3" />
                ) : (
                    <ChevronLeftIcon className="w-3 h-3" />
                )}
            </button>
            </Tooltip>
            {loadPage ? (
                <div className="flex items-center justify-center w-full"><p>Cargando...</p></div>
            ) : (
                <>
                    {/* Left Column: Chat List */}
                    <div 
                        className={`bd-plane ${isSidebarCollapsed ? 'w-20' : 'w-80'} flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out`}
                    >
                        <div className={`bd-plane-header p-4 sticky top-0 z-10 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
                            {!isSidebarCollapsed && (
                                <div className="flex flex-col items-start gap-2 mb-1 w-full">
                                    <PageTitle lead="Conversaciones" />
                                    <span className="bd-pill">
                                        {processedFolios.length} {processedFolios.length === 1 ? 'conversación' : 'conversaciones'}
                                    </span>
                                </div>
                            )}
                            
                            {!isSidebarCollapsed && (
                                <>
                                    <Input
                                        isClearable
                                        variant="bordered"
                                        placeholder="Buscar conversaciones..."
                                        startContent={<SearchIcon className="text-ink-400" />}
                                        value={filterText}
                                        onValueChange={setFilterText}
                                        onClear={() => setFilterText('')}
                                        classNames={{
                                            input: "text-base",
                                            inputWrapper: "bg-cream-50 border-hair hover:border-ink-400 focus-within:!border-flame-ember",
                                        }}
                                        className="w-full shadow-none"
                                    />

                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3 bg-cream-100 hair mt-1">
                                        <div className="flex items-center">
                                            <Switch
                                                isSelected={showUnreadOnly}
                                                onValueChange={setShowUnreadOnly}
                                                size="sm"
                                                classNames={{
                                                    wrapper: "group-data-[selected=true]:bg-ink mt-0.5",
                                                }}
                                            >
                                                <span className="text-sm font-medium text-ink-600">Solo no leídos</span>
                                            </Switch>
                                        </div>
                                        
                                        <div className="flex-shrink-0 flex flex-col items-end">
                                            <span className="text-xs font-medium text-ink-500 mb-1">Ordenar por</span>
                                            <Dropdown>
                                                <DropdownTrigger>
                                                    <HeroButton 
                                                        variant="flat" 
                                                        size="sm" 
                                                        className="w-[112px] justify-between bg-cream-50 border border-hair hover:border-ink-400 hover:bg-cream-100 transition-colors h-8 px-2"
                                                        endContent={<ChevronDownIcon className="w-3 h-3 text-ink-500 ml-1" />}
                                                    >
                                                        <span className="text-xs font-medium text-ink-600 text-left flex-1 truncate">
                                                            {sortBy === 'unread' ? 'No leídos' : 'Recientes'}
                                                        </span>
                                                    </HeroButton>
                                                </DropdownTrigger>
                                                <DropdownMenu
                                                    aria-label="Opciones de orden"
                                                    variant="flat"
                                                    disallowEmptySelection
                                                    selectionMode="single"
                                                    selectedKeys={new Set([sortBy])}
                                                    onSelectionChange={(keys) => setSortBy(Array.from(keys)[0])}
                                                    classNames={{
                                                        base: "border border-hair-soft shadow-lg rounded-lg overflow-hidden w-[120px] min-w-[120px] -ml-1"
                                                    }}
                                                >
                                                    <DropdownItem key="default" className="px-2 py-1.5 text-xs hover:bg-cream-200">
                                                        Recientes
                                                    </DropdownItem>
                                                    <DropdownItem key="unread" className="px-2 py-1.5 text-xs hover:bg-cream-200">
                                                        No leídos
                                                    </DropdownItem>
                                                </DropdownMenu>
                                            </Dropdown>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex-grow overflow-y-auto overflow-x-hidden">
                            {processedFolios.length > 0 ? (
                                processedFolios.map(item => {
                                    if (!item?.folio) return null;

                                    const { folio } = item;
                                    const isActive = folio._id === vFolio;
                                    const isUnread = unReadFolios && unReadFolios[folio._id];

                                    const ch = availableCh && folio.channel?.name ? availableCh.find(c => c.id === folio.channel.name) : null;
                                    let channelIcon;
                                    let inboxIcon = null;
                                    if (ch?.image) {
                                        channelIcon = <img src={ch.image} alt={folio.channel?.name || 'channel'} className="w-5 h-5" />;
                                    } else {
                                        switch (folio.channel?.name) {
                                            case 'voice':
                                            case 'call':
                                                channelIcon = <PhoneIcon className="w-5 h-5 text-ink-400" />;
                                                break;
                                            case 'email':
                                                channelIcon = <EnvelopeIcon className="w-5 h-5 text-ink-400" />;
                                                break;
                                            default:
                                                channelIcon = <ChatBubbleIcon className="w-5 h-5 text-ink-400" />;
                                                break;
                                        }
                                    }

                                   
                                    if (folio.fromInbox){
                                        inboxIcon = <InboxIcon className="w-5 h-5 text-serious" />;
                                    }

                                    const secondaryText = folio.channel?.name === 'email' ? (folio.lastEmailProcessed?.subject || 'Sin asunto') : folio.person?.anchor;
                                    const channelname = folio.channel?.title || '-';
                                    return (
                                        <div
                                            key={folio._id}
                                            className={`bd-folio-item relative flex items-start p-3 cursor-pointer min-w-0 ${isActive ? 'bd-folio-item--active' : ''}`}
                                            onClick={() => {
                                                setVFolio(folio._id);
                                                setMessageToSend('');
                                                window.localStorage.setItem('vFolio', folio._id);
                                                dispatch({ type: 'read', folio: folio._id });
                                            }}
                                        > 
                                            <div className="flex-shrink-0 relative">
                                           
                                                <Badge content="" color="danger" shape="circle" placement="top-right" isInvisible={!isUnread}>
                                                <Tooltip content={
                                                    <div className="px-1 py-2">
                                                        <div className="text-small font-bold">{folio.person?.aliasId + ' - ' + folio.person?.anchor}</div>
                                                        <div className="text-tiny">{channelname}</div> 
                                                        <div className="text-tiny">  <ElapsedTime assignmentTime={folioAssignmentTimes[folio._id]} /></div>
                                                    </div>
                                                } 
                                                    placement="top" delayDuration={0}>
                                                    <Avatar 
                                                        src={folio.person?.profilePic || generateAvatarUrl(folio.person?.aliasId, folio.person?.anchor)} 
                                                        className={`${isSidebarCollapsed ? 'w-10 h-10' : 'w-10 h-10'}`}
                                                    />
                                                    </Tooltip>
                                                </Badge>
                                               
                                            </div>
                                            
                                            {!isSidebarCollapsed && (
                                                <div className="min-w-0 flex-1 ml-3 overflow-hidden">
                                                    <div className="flex items-center justify-between w-full">
                                                        <p className="bd-folio-name truncate pr-2">
                                                            {folio.person?.aliasId || folio.person?.anchor}
                                                        </p>
                                                        <div className="flex-shrink-0">
                                                            {channelIcon}
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center w-full">
                                                        <p className="text-xs font-medium text-ink-500 truncate flex-1 pr-2">
                                                            {secondaryText}
                                                        </p>
                                                        {inboxIcon}
                                                       

                                                    </div>
                                                    <div className="flex justify-between items-center w-full">
                                                        <p className="text-xs font-medium text-ink-500 truncate flex-1 pr-2">
                                                            {channelname}
                                                        </p>
                                                        <ElapsedTime assignmentTime={folioAssignmentTimes[folio._id]} />
                                                    </div> 
                                                    
                                                    
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-ink-400">
                                    <MessageCircleOff className="w-12 h-12 mb-2" />
                                    <p className="text-sm text-ink-500">
                                        {isSidebarCollapsed ? 'Sin chats' : 'No hay conversaciones para mostrar'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Chat Panel */}
                    <div className="flex-grow flex flex-col relative min-w-0">
                        {activeFolioData ? (
                            <div className="flex flex-grow h-full gap-2 min-w-0">
                                <div className="bd-plane bd-plane--focus flex-grow h-full min-w-0">
                                     <Comments
              hasTextContent={hasTextContent}
              setHasTextContent={setHasTextContent}
                                         userInfo={userInfo}
                                         person={activeFolioData.folio.person}
                                         messages={activeFolioData.folio.message}
                                         folio={activeFolioData.folio}
                                         fullFolio={activeFolioData}
                                         setMessageToSend={setMessageToSend}
                                         messageToSend={messageToSend}
                                         onCall={onCall}
                                         setOnCall={setOnCall}
                                         refresh={refresh}
                                         setRefresh={setRefresh}
                                         sidCall={sidCall}
                                         setSidCall={setSidCall}
                                         boxMessage={boxMessage}
                                         vFolio={vFolio}
                                         countunReadMsg={countunReadMsg}
                                         dispatchCount={dispatchCount}
                                         availableCh={availableCh}
                                         quicklyAnswer={activeFolioData.QuicklyAnswer}
                                         assignmentTime={folioAssignmentTimes[activeFolioData.folio._id]}
                                         removeFolioAssignmentTime={removeFolioAssignmentTime}
                                     />
                                </div>
                                {toolsOpen && (
                                    <div className="bd-plane w-96 flex-shrink-0 h-full overflow-y-auto">
                                        <Tools
              setHasTextContent={setHasTextContent}
                                            setMessageToSend={setMessageToSend}
                                            messageToSend={messageToSend}
                                            folio={activeFolioData}
                                            quicklyAnswer={activeFolioData.QuicklyAnswer}
                                            crm={activeFolioData.folio.service.crm}
                                            tickets={activeFolioData.tickets}
                                            areas={activeFolioData.areas}
                                            person={activeFolioData.folio.person}
                                            setRefresh={setRefresh}
                                            historyFolios={activeFolioData.historyFolios}
                                            userInfo={userInfo}
                                            mtm={activeFolioData.mtm}
                                            service={activeFolioData.folio.service}
                                        />
                                    </div>
                                )}
                                {/* Mismo tirador que el de la izquierda: centrado sobre la
                                    canaleta de 8px que separa conversacion de herramientas. */}
                                <button
                                    onClick={hideTools}
                                    aria-label={toolsOpen ? 'Ocultar herramientas' : 'Mostrar herramientas'}
                                    className="bd-gutter-toggle absolute top-1/2 -translate-y-1/2 z-10"
                                    style={{ right: toolsOpen ? 'calc(24rem - 5px)' : '4px' }}
                                >
                                    {toolsOpen ? <ChevronRightIcon className="w-3 h-3" /> : <ChevronLeftIcon className="w-3 h-3" />}
                                </button>
                            </div>
                        ) : (
                            getMessageEmpty()
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default HomeViewer;