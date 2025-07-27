import React, { useContext, useEffect, useState, useRef, useMemo } from 'react';
import {Chip, Avatar, Badge, Button as HeroButton, Input, Switch, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Tooltip } from "@heroui/react";
import Comments from './CommentsV2';
import Tools from './ToolsV2';
import axios from 'axios';
import { loadFolioAssignmentTimes, clearFolioAssignmentTimes, saveFolioAssignmentTime } from './../../../utils/folioUtils';
import ListFoliosContext from '../../../controladores/FoliosContext';
import generateAvatarUrl from '../../../utils/avatarUtils';

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
    const [toolsOpen, setToolsOpen] = useState(true);
    const [availableCh, setAvailableCh] = useState(null);
    const [loadPage, setLoadPage] = useState(false);
    const [filterText, setFilterText] = useState('');
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const [sortBy, setSortBy] = useState('default');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [folioAssignmentTimes, setFolioAssignmentTimes] = useState(loadFolioAssignmentTimes());

    // Handle cleanup on unmount or page unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            // Only clear on actual page unload, not on component unmount
            clearFolioAssignmentTimes();
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        // Clear only on logout (when show becomes false)
        if (!show) {
            clearFolioAssignmentTimes();
        }
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [show]);

    // Track assignment times for folios
    useEffect(() => {
        if (!listFolios.current) return;
        
        const newAssignmentTimes = { ...folioAssignmentTimes };
        let hasUpdates = false;
        
        listFolios.current.forEach(item => {
            const folioId = item?.folio?._id;
            if (folioId && !newAssignmentTimes[folioId]) {
                // Use the save function to ensure proper storage
                const savedTime = saveFolioAssignmentTime(folioId);
                newAssignmentTimes[folioId] = savedTime;
                hasUpdates = true;
            }
        });
        
        if (hasUpdates) {
            setFolioAssignmentTimes(newAssignmentTimes);
        }
    }, [listFolios.current?.map(f => f.folio?._id).join(',')]); // Only run when folio IDs change

    const hideTools = () => {
        setToolsOpen(!toolsOpen);
    };

    // Load initial data
    useEffect(() => {
        // Only load times, don't clear them here
        setFolioAssignmentTimes(loadFolioAssignmentTimes());
        
        // Load initial data
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
                colorClass = 'bg-yellow-100 border-yellow-500 text-yellow-700';
                icon = '⚠️';
                break;
            case 1:
                header = 'Listo para recibir nuevos mensajes o llamadas.';
                colorClass = 'bg-green-100 border-green-500 text-green-700';
                icon = '✅';
                break;
            case 2:
                header = 'Continuas conectado, pero no recibiras nuevos mensajes o llamadas.';
                colorClass = 'bg-yellow-100 border-yellow-500 text-yellow-700';
                icon = '⏸️';
                break;
            default:
                return null;
        }
        return (
            <div className="flex items-center justify-center h-full p-6">
                <div className={`w-full max-w-2xl border-l-4 p-6 rounded-2xl shadow-md transition-all duration-300 transform hover:scale-[1.01] ${colorClass}`} role="alert">
                    <div className="flex items-center space-x-4">
                        <span className="text-2xl">{icon}</span>
                        <p className="text-lg font-semibold">{header}</p>
                    </div>
                    {isConnected === 1 && (
                        <p className="mt-3 text-base text-gray-700">
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
        <div style={{ display: show ? 'flex' : 'none' }} className="flex h-[calc(100vh-80px)] bg-gray-50 w-full overflow-hidden relative">
            {/* Collapse/Expand Button */}
            <Tooltip content={isSidebarCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}>
            <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-20 bg-gradient-to-br from-indigo-500 to-pink-500 border-small border-white/50 shadow-pink-500/30 rounded-r-lg p-2 shadow-md hover:bg-gray-50 transition-colors"
                aria-label={isSidebarCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
            >
                {isSidebarCollapsed ? (
                    <ChevronRightIcon className="w-4 h-4 text-white" />
                ) : (
                    <ChevronLeftIcon className="w-4 h-4 text-white" />
                )}
            </button>
            </Tooltip>
            {loadPage ? (
                <div className="flex items-center justify-center w-full"><p>Cargando...</p></div>
            ) : (
                <>
                    {/* Left Column: Chat List */}
                    <div 
                        className={`${isSidebarCollapsed ? 'w-20' : 'w-80'} border-r border-gray-200 bg-white flex flex-col overflow-hidden transition-all duration-300 ease-in-out`}
                    >
                        <div className={`p-4 sticky top-0 z-10 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100 shadow-sm ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
                            {!isSidebarCollapsed && (
                                <div className="flex flex-col items-start gap-2 mb-1 w-full">
                                    <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
                                        Conversaciones
                                    </h2>
                                    <Chip 
                                        color="primary" 
                                        variant="flat"
                                        classNames={{
                                            base: "bg-gradient-to-br from-indigo-100 to-pink-50 border-small border-indigo-200/50",
                                            content: "text-indigo-800 font-medium text-sm"
                                        }}
                                    >
                                        {processedFolios.length} {processedFolios.length === 1 ? 'conversación' : 'conversaciones'}
                                    </Chip>
                                </div>
                            )}
                            
                            {!isSidebarCollapsed && (
                                <>
                                    <Input
                                        isClearable
                                        variant="bordered"
                                        placeholder="Buscar conversaciones..."
                                        startContent={<SearchIcon className="text-gray-400" />}
                                        value={filterText}
                                        onValueChange={setFilterText}
                                        onClear={() => setFilterText('')}
                                        classNames={{
                                            input: "text-base",
                                            inputWrapper: "bg-white border-gray-200 hover:border-indigo-300 focus-within:!border-indigo-500",
                                        }}
                                        className="w-full shadow-sm"
                                    />
                                    
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3 bg-indigo-50/50 rounded-lg mt-1">
                                        <div className="flex items-center">
                                            <Switch
                                                isSelected={showUnreadOnly}
                                                onValueChange={setShowUnreadOnly}
                                                size="sm"
                                                classNames={{
                                                    wrapper: "group-data-[selected=true]:bg-gradient-to-r from-indigo-500 to-pink-500 mt-0.5",
                                                }}
                                            >
                                                <span className="text-sm font-medium text-gray-700">Solo no leídos</span>
                                            </Switch>
                                        </div>
                                        
                                        <div className="flex-shrink-0 flex flex-col items-end">
                                            <span className="text-xs font-medium text-gray-500 mb-1">Ordenar por</span>
                                            <Dropdown>
                                                <DropdownTrigger>
                                                    <HeroButton 
                                                        variant="flat" 
                                                        size="sm" 
                                                        className="w-[10px] justify-between bg-white border border-gray-200 hover:border-indigo-300 hover:bg-gray-50 transition-colors h-8 px-2"
                                                        endContent={<ChevronDownIcon className="w-3 h-3 text-gray-500 ml-1" />}
                                                    >
                                                        <span className="text-xs font-medium text-gray-700 text-left flex-1 truncate">
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
                                                        base: "border border-gray-100 shadow-lg rounded-lg overflow-hidden w-[120px] min-w-[120px] -ml-1"
                                                    }}
                                                >
                                                    <DropdownItem key="default" className="px-2 py-1.5 text-xs hover:bg-indigo-50">
                                                        Recientes
                                                    </DropdownItem>
                                                    <DropdownItem key="unread" className="px-2 py-1.5 text-xs hover:bg-indigo-50">
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
                                                channelIcon = <PhoneIcon className="w-5 h-5 text-gray-400" />;
                                                break;
                                            case 'email':
                                                channelIcon = <EnvelopeIcon className="w-5 h-5 text-gray-400" />;
                                                break;
                                            default:
                                                channelIcon = <ChatBubbleIcon className="w-5 h-5 text-gray-400" />;
                                                break;
                                        }
                                    }

                                   
                                    if (folio.fromInbox){
                                        inboxIcon = <InboxIcon className="w-5 h-5 text-red-500" />;
                                    }

                                    const secondaryText = folio.channel?.name === 'email' ? (folio.lastEmailProcessed?.subject || 'Sin asunto') : folio.person?.anchor;
                                    const channelname = folio.channel?.title || '-';
                                    return (
                                        <div
                                            key={folio._id}
                                            className={`flex items-start p-3 cursor-pointer border-l-4 transition-all duration-200 min-w-0 ${isActive ? 'border-purple-500 bg-purple-100/100 shadow-md scale-[1.02] ring-1 ring-purple-200/60 backdrop-blur-sm' : 'border-transparent hover:bg-gray-100'}`}
                                            onClick={() => {
                                                setVFolio(folio._id);
                                                setMessageToSend('');
                                                window.localStorage.setItem('vFolio', folio._id);
                                                dispatch({ type: 'read', folio: folio._id });
                                            }}
                                        >
                                            <div className="flex-shrink-0 relative">
                                                <Badge content="" color="danger" shape="circle" placement="top-right" isInvisible={!isUnread}>
                                                    <Avatar 
                                                        src={folio.person?.profilePic || generateAvatarUrl(folio.person?.aliasId, folio.person?.anchor)} 
                                                        className={`${isSidebarCollapsed ? 'w-10 h-10' : 'w-10 h-10'}`}
                                                    />
                                                </Badge>
                                            </div>
                                            {!isSidebarCollapsed && (
                                                <div className="min-w-0 flex-1 ml-3 overflow-hidden">
                                                    <div className="flex items-center justify-between w-full">
                                                        <p className="font-bold text-sm text-gray-800 truncate pr-2">
                                                            {folio.person?.aliasId || folio.person?.anchor}
                                                        </p>
                                                        <div className="flex-shrink-0">
                                                            {channelIcon}
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center w-full">
                                                        <p className="text-xs font-medium text-gray-600 truncate flex-1 pr-2">
                                                            {secondaryText}
                                                        </p>
                                                        {inboxIcon}
                                                    </div>
                                                    <div className="flex justify-between items-center w-full">
                                                        <p className="text-xs font-medium text-gray-600 truncate flex-1 pr-2">
                                                            {channelname}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-4 text-center text-sm text-gray-500">No hay conversaciones para mostrar.</div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Chat Panel */}
                    <div className="flex-grow flex flex-col relative">
                        {activeFolioData ? (
                            <div className="flex flex-grow h-full">
                                <div className="flex-grow h-full">
                                    <Comments
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
                                        assignmentTime={folioAssignmentTimes[activeFolioData.folio._id]}
                                    />
                                </div>
                                {toolsOpen && (
                                    <div className="w-96 border-l border-gray-200 bg-white h-full overflow-y-auto">
                                        <Tools
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
                                <HeroButton
                                    isIconOnly
                                    size="sm"
                                    color="primary"
                                    variant="shadow"
                                    className="absolute top-1/2 -translate-y-1/2 z-10 transition-all rounded-full"
                                    onPress={hideTools}
                                    style={{ right: toolsOpen ? 'calc(24rem - 1rem)' : '0.5rem' }}
                                >
                                    {toolsOpen ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
                                </HeroButton>
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