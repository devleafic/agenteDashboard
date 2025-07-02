import React, { useContext, useEffect, useState, useRef } from 'react';
import { Card, Avatar, Badge, Button as HeroButton, Input } from "@heroui/react";
import Comments from './Comments';
import Tools from './Tools';
import axios from 'axios';
import ListFoliosContext from '../../../controladores/FoliosContext';

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

const HomeViewer = ({ isConnected, show, refresh, setRefresh, onCall, setOnCall, userInfo, sidCall, setSidCall, dispatch, unReadFolios, countunReadMsg, dispatchCount, vFolio, setVFolio }) => {

    const boxMessage = useRef(null);
    const listFolios = useContext(ListFoliosContext);
    const [messageToSend, setMessageToSend] = useState('');
    const [toolsOpen, setToolsOpen] = useState(true);
    const [availableCh, setAvailableCh] = useState(null);
    const [loadPage, setLoadPage] = useState(false);
    const [filterText, setFilterText] = useState('');

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
            <div className="flex items-center justify-center h-full p-10">
                <div className={`border-l-4 p-4 rounded-r-lg ${colorClass}`} role="alert">
                    <p className="font-bold">{icon} {header}</p>
                </div>
            </div>
        );
    };

    const activeFolioData = vFolio ? listFolios.current.find(f => f.folio._id === vFolio) : null;

    return (
        <div style={{ display: show ? 'flex' : 'none' }} className="flex h-[calc(100vh-80px)] bg-gray-50">
            {loadPage ? (
                <div className="flex items-center justify-center w-full"><p>Cargando...</p></div>
            ) : (
                <>
                    {/* Left Column: Chat List */}
                    <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
                        <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10 shadow-sm">
                            <h2 className="text-xl font-extrabold text-gray-900 mb-4">Conversaciones</h2>
                            <Input
                                isClearable
                                variant="bordered"
                                placeholder="Buscar..."
                                startContent={<SearchIcon className="text-gray-400" />}
                                value={filterText}
                                onValueChange={setFilterText}
                                onClear={() => setFilterText('')}
                            />
                        </div>
                        <div className="flex-grow overflow-y-auto">
                            {listFolios.current.length > 0 ? (
                                listFolios.current
                                    .filter(item => {
                                        const searchTerm = filterText.toLowerCase();
                                        const personInfo = (item.folio.person.aliasId || item.folio.person.anchor).toLowerCase();
                                        const subjectInfo = (item.folio.lastEmailProcessed?.subject || '').toLowerCase();
                                        return personInfo.includes(searchTerm) || subjectInfo.includes(searchTerm);
                                    })
                                    .map(item => {
                                        const { folio } = item;
                                        const isActive = folio._id === vFolio;
                                        const isUnread = unReadFolios[folio._id];

                                        const ch = availableCh ? availableCh.find(c => c.id === folio.channel.name) : null;
                                        let channelIcon;
                                        if (ch?.image) {
                                            channelIcon = <img src={ch.image} alt={folio.channel.name} className="w-5 h-5" />;
                                        } else {
                                            switch (folio.channel.name) {
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

                                        const secondaryText = folio.channel.name === 'email' ? (folio.lastEmailProcessed?.subject || 'Sin asunto') : folio.person.anchor;

                                        return (
                                            <div
                                                key={folio._id}
                                                className={`flex items-start p-3 cursor-pointer border-l-4 ${isActive ? 'border-primary-500 bg-blue-50' : 'border-transparent hover:bg-gray-50'}`}
                                                onClick={() => {
                                                    setVFolio(folio._id);
                                                    setMessageToSend('');
                                                    window.localStorage.setItem('vFolio', folio._id);
                                                    dispatch({ type: 'read', folio: folio._id });
                                                }}
                                            >
                                                <Badge content="" color="danger" shape="circle" placement="top-right" isInvisible={!isUnread}>
                                                    <Avatar src={folio.person.profilePic || 'https://inboxcentralcdn.sfo3.cdn.digitaloceanspaces.com/assets/noprofilepic2.png'} />
                                                </Badge>
                                                <div className="flex-grow ml-3 overflow-hidden">
                                                    <div className="flex justify-between items-center">
                                                        <p className="font-bold text-sm text-gray-800 truncate">{folio.person.aliasId || folio.person.anchor}</p>
                                                        {channelIcon}
                                                    </div>
                                                    <p className="text-xs font-medium text-gray-600 truncate">{secondaryText}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                            ) : (
                                <div className="p-4 text-center text-sm text-gray-500">No hay conversaciones activas.</div>
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
                                    onClick={hideTools}
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