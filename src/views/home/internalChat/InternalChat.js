import {useEffect, useState, useRef} from 'react';
import { useSocket } from '../../../controladores/InternalChatContext';
import { toast } from 'react-toastify';
import BubbleIternalChat from './BubbleIternalChat';
import NotificationSettings from './NotificationSettings';
import { useNotifications } from '../../../controladores/NotificationContext';
import ModalFiles from '../../../componentes/internalChat/ModalFiles';
import axios from 'axios';
import InternalUploadFile from './InternalUploadFile';

// HeroUI components
import { 
  Input, 
  Button, 
  Spinner, 
  Dropdown, 
  DropdownTrigger, 
  DropdownMenu, 
  DropdownItem, 
  Tabs, 
  Tab 
} from '@heroui/react';

export default function InternalChat({userInfo}) {

    const {socket, inboxList, unreadMessages, setUnreadMessages, activitiesUsers, setInboxList, archivedChats, archiveChat, unarchiveChat} = useSocket();
    const [findUser, setFindUser] = useState('');
    const [contactList, setContactList] = useState([]);
    const [viewChat, setViewChat] = useState(null);
    const [message, setMessage] = useState('');
    const messageContainerRef = useRef(null);
    const [loading, setLoading] = useState(false);
    let [avatarUser , setAvatarUser] = useState('https://inboxcentralcdn.sfo3.cdn.digitaloceanspaces.com/assets/profilepic.jpg')
    let [groupAvatar , setGroupAvatar] = useState('https://inboxcentralcdn.sfo3.cdn.digitaloceanspaces.com/assets/gropuchat.jpg')
    const [myActivitie, setMyActivitie] = useState('2-listo');
    const defaultActivitie = '2-listo';
    const [activeTab, setActiveTab] = useState(0); // 0 for chats, 1 for archived
    const [clickedId, setClickedId] = useState(null);
    const [showNotificationSettings, setShowNotificationSettings] = useState(false);

    const [openFileMedia, setOpenFileMedia] = useState(false);
    
    const listActivites = [
        {
            id: '2-listo',
            label: 'Listo',
            emoji : '🟢'
        },
        {
            id: '2-ocupado',
            label: 'Ocupado',
            emoji : '🔴'
        }, 
        {
            id: '2-ausente',
            label: 'Ausente',
            emoji : '🟡 '
        }, 
        {
            id: '1-comida',
            label: 'Comida',
            emoji : '🍔' 
        },
        {
            id: '2-banio',
            label: 'Baño',
            emoji : '🚽' 
        }
    ]

    // Función para cambiar el estado de la actividad
    const setActivitie = (idAct) => {
        socket.emit('setActivitie', {activitie : idAct, token: window.localStorage.getItem('sdToken')}, (data) => {
            console.log({data});
            window.sessionStorage.setItem('lastActivitie', idAct);
            setMyActivitie(data);
        });
    }    

    // Función para enviar un mensaje
    const sendMessage = () => {
        const messageToSend = message.trim();
        socket.emit('sendMessage', {message : messageToSend, token: window.localStorage.getItem('sdToken'), chatId : viewChat._id ,type : 'text'}, (data) => {
            console.log('Mensaje enviado y recibido por el servidor');
        });
        setMessage('');
    };


    // Función para obtener la lista de contactos
    const getContactList = (contact) => {
        // console.log(contact, userInfo);
        if(contact.length < 3){
            setContactList([]);
            return false;
        }
        socket.emit('getContactList', {contact, service : userInfo.service.id, 
            token: window.localStorage.getItem('sdToken')
        }, (data) => {
            //console.log({data});
            setContactList(data.body.list);
        });
    }

    // Función para crear un chat
    const createChat = (contactToOpen) => {
        // if(window.confirm(`¿Desea abrir el chat con este usuario "${contactToOpen.profile.name}"?`)){
            socket.emit('createChat', {contact : contactToOpen._id, token: window.localStorage.getItem('sdToken')}, (data) => {
                setContactList([])
                setFindUser('');
            });
        // }
    }

    // Función para abir un chat
    const openChat = (chatId) => {
        setLoading(true);
        socket.emit('openChat', {chatId, token: window.localStorage.getItem('sdToken')}, (data) => {
            //console.log({openChat : data});
            setLoading(false);
            if(data.body.success){
                setViewChat(data.body.chat);
                setTimeout(() => {
                    if(messageContainerRef.current)
                        messageContainerRef.current.scrollTop = messageContainerRef.current?.scrollHeight;
                }, 100);
            }
            else{
                   toast.error('Ocurrion un error al abrir el chat');
            }
        });
    }

    useEffect(() => {
        if (socket) {
            console.log('Conexión del socket establecida');

            setActivitie(defaultActivitie)
        }

        return () => {
            if (socket) {
                socket.off('incomingMessage');
                socket.off('newReader');
                socket.off('newReaction');
                socket.off('reconnect');
            }
        };
    }, [socket]);

    useEffect(() => {
        if (socket) {
            const handleIncomingMessage = (data) => {
                setViewChat((prevViewChat) => {
                    if (!prevViewChat) {
                        console.log('llego pero no esta en pantalla');
                        return prevViewChat;
                    }
                    
                    if (prevViewChat._id === data.body.chatId) {
                        console.log('bajando chat');
                        requestAnimationFrame(() => {
                            if (messageContainerRef.current) {
                                messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
                            }
                        });
                        return {...prevViewChat, messages: [...prevViewChat.messages, data.body.message]};
                    }
                    return prevViewChat;
                });
            };

            const handleNewReader = (data) => {
                setViewChat((prevViewChat) => {
                    if (!prevViewChat || prevViewChat._id !== data.body.chatId) {
                        return prevViewChat;
                    }

                    const updatedMessages = [...prevViewChat.messages];
                    const chatIndex = updatedMessages.findIndex((x) => x._id === data.body.message._id);
                    if (chatIndex !== -1) {
                        updatedMessages[chatIndex] = data.body.message;
                    }

                    return {...prevViewChat, messages: updatedMessages};
                });

                setInboxList((prevInboxList) => {
                    const isExists = prevInboxList.find((x) => x._id === data.body.chatId);
                    if (!isExists) return prevInboxList;

                    const isReaderForMe = data.body.message.readers.find((x) => x.user === userInfo._id);
                    if (isReaderForMe) {
                        setUnreadMessages((prevUnreadMessages) => {
                            if (!prevUnreadMessages) return {};
                            const currentCount = prevUnreadMessages[data.body.chatId] || 0;
                            return {
                                ...prevUnreadMessages,
                                [data.body.chatId]: currentCount === 0 ? 0 : currentCount - 1
                            };
                        });
                    }
                    return prevInboxList;
                });
            };

            const handleNewReaction = (data) => {
                setViewChat((prevViewChat) => {
                    if (!prevViewChat || prevViewChat._id !== data.body.chatId) {
                        return prevViewChat;
                    }

                    const updatedMessages = [...prevViewChat.messages];
                    const chatIndex = updatedMessages.findIndex((x) => x._id === data.body.message._id);
                    if (chatIndex !== -1) {
                        updatedMessages[chatIndex] = data.body.message;
                    }

                    return {...prevViewChat, messages: updatedMessages};
                });
            };

            const handleReconnect = () => {
                console.log('Reconectado al servidor de TeamChat');
                // Enviamos el último estado
                setMyActivitie((prevMyActivitie) => {
                    console.log('úlimo estado', prevMyActivitie)
                    setActivitie(prevMyActivitie);
                    return prevMyActivitie;
                })
            };

            socket.on('incomingMessage', handleIncomingMessage);
            socket.on('newReader', handleNewReader);
            socket.on('newReaction', handleNewReaction);
            socket.on('reconnect', handleReconnect);
        }
    }, [socket, userInfo._id]);

    const readMessage = (id) => {
        console.log('leido enviando');
        socket.emit('readMessage', {chatId: viewChat._id,messageId : id, token: window.localStorage.getItem('sdToken')}, (data) => {
            //console.log({readMessage : data});
        });
    }

    const getNames = (isPrivate, members, title) => {
        if(isPrivate){
            const member = members.find((member) => {
                return member.user._id !== userInfo._id
            })
            return member.user.profile.name;
        }
        return title;
        // return members.map((member) => member.user.profile.name).join(', ');
    
    }

    const getPictures = (isPrivate, members ,groupPicture) => {
        if(isPrivate){
            const member = members.find((member) => {
                return member.user._id !== userInfo._id
            }   )           
            return <img src={member.user.profile.picture && member.user.profile.picture.length > 0  ? member.user.profile.picture : avatarUser} alt="User Icon" style={{ marginRight: '10px', width: '30px', height: '30px', borderRadius: '50%' }}/>       
        }
        return <img src={groupPicture && groupPicture.length > 0 ? groupPicture : groupAvatar} alt="User Icon" style={{ marginRight: '10px', width: '30px', height: '30px', borderRadius: '50%' }}/>
    }

    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const sendFile = async (fileToSend) => {
        try {
            socket.emit('sendMessage', {message : fileToSend.url, token: window.localStorage.getItem('sdToken'), chatId : viewChat._id ,type : fileToSend.typeFile}, (data) => {
                console.log('Mensaje enviado y recibido por el servidor');
                setSelectedFile(null);
            });

        } catch (error) {
            console.error('Error al enviar el archivo:', error);
        }
    };

    const getActivitie = (isPrivate, members) => {
        if(isPrivate){
            const member = members.find((member) => {
                return member.user._id !== userInfo._id
            })
        
            const userList = listActivites.find((x) => {return x.id === activitiesUsers[member.user._id]});
            
            return userList ? userList.emoji : '⭕️';
        }
        return '';
    }

    // Function to handle archiving a chat
    const handleArchiveChat = (chatId, e) => {
        e.stopPropagation(); // Prevent opening the chat when clicking archive
        archiveChat(chatId);
        
        // If the archived chat is currently open, close it
        if (viewChat && viewChat._id === chatId) {
            setViewChat(null);
        }
    };

    // Function to handle unarchiving a chat
    const handleUnarchiveChat = (chatId, e) => {
        e.stopPropagation(); // Prevent opening the chat when clicking unarchive
        unarchiveChat(chatId);
    };

    // Render chat item with archive/unarchive option
    const renderChatItem = (chat, isArchived) => {
        return (
            <div 
                className={`flex items-center p-3 border-b border-gray-100 dark:border-zinc-700 cursor-pointer rounded-lg my-1 transition-colors duration-200 ${clickedId === chat._id ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700'}`}
                key={chat._id} 
                onClick={() => {
                    setClickedId(chat._id);
                    openChat(chat._id);
                }}
            >
                <div className="relative flex items-center">
                    <div className="w-[45px] h-[45px] rounded-full overflow-hidden border-2 border-gray-200 dark:border-zinc-600 flex items-center justify-center relative">
                        {getPictures(chat.isPrivate, chat.members, chat.picture)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 text-sm">
                        {getActivitie(chat.isPrivate, chat.members)}
                    </div>
                </div>
                <div className="flex-1 mx-3 overflow-hidden">
                    <div className="font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap overflow-hidden text-ellipsis">
                        {getNames(chat.isPrivate, chat.members, chat.label)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">
                        {chat.lastMessage ? (chat.lastMessage.length > 30 ? chat.lastMessage.substring(0, 30) + '...' : chat.lastMessage) : 'No hay mensajes'}
                    </div>
                </div>
                <div className="flex items-center">
                    {!isArchived ? (
                        <button 
                            className="mr-2 p-1.5 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors duration-200"
                            onClick={(e) => handleArchiveChat(chat._id, e)}
                            title="Archivar chat"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                        </button>
                    ) : (
                        <button 
                            className="mr-2 p-1.5 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors duration-200"
                            onClick={(e) => handleUnarchiveChat(chat._id, e)}
                            title="Desarchivar chat"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                        </button>
                    )}
                    {unreadMessages && unreadMessages[chat._id] ? (
                        <div className="min-w-[22px] h-[22px] rounded-full bg-green-500 flex justify-center items-center text-white text-xs font-bold px-1.5">
                            {unreadMessages[chat._id]}
                        </div>
                    ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                    )}
                </div>
            </div>
        );
    };

    // Los panes ahora están integrados directamente en el componente Tabs de HeroUI


    // Scroll infitinito
    // Estado para evitar cargas múltiples al estar ya cargando mensajes anteriores
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [pageMsg, setPageMsg] = useState(1);

    const loadOlderMessages = async () => {
        if (isLoadingOlder) return;
        setIsLoadingOlder(true);
        const currentScrollHeight = messageContainerRef.current.scrollHeight;

        try {
        const resOlder = await getOlderMessages(viewChat._id, pageMsg);
        
        const olderMessages = resOlder.body.chat.messages;
        if(olderMessages.length > 0){
            setPageMsg(pageMsg + 1);
        }
        setViewChat((prevViewChat) => ({
            ...prevViewChat,
            messages: [...olderMessages, ...prevViewChat.messages],
        }));

        setTimeout(() => {
            if (messageContainerRef.current) {
            const newScrollHeight = messageContainerRef.current.scrollHeight;
            messageContainerRef.current.scrollTop = newScrollHeight - currentScrollHeight;
            }
        }, 10);
        } catch (error) {
        console.error('Error al cargar mensajes anteriores', error);
        } finally {
        setIsLoadingOlder(false);
        }
    };

    const getOlderMessages = async (chatId,page) => {

        return new Promise((resolve, reject) => {
            socket.emit('getOlderMessages', {chatId,page, token: window.localStorage.getItem('sdToken')}, (data) => {
                resolve(data);
            });
        })
    }

    
    useEffect(() => {
        const handleScroll = () => {
        if (messageContainerRef.current) {
            if (messageContainerRef.current.scrollTop === 0 && viewChat && viewChat.messages.length > 0) {
            loadOlderMessages();
            }
        }
        };

        const div = messageContainerRef.current;
        if (div) {
        div.addEventListener("scroll", handleScroll);
        }

        return () => {
        if (div) {
            div.removeEventListener("scroll", handleScroll);
        }
        };
    }, [viewChat, isLoadingOlder]);

    return (<>
                 
        <div className="relative overflow-hidden p-6 mx-5 mt-5 rounded-2xl shadow-md bg-gradient-to-r from-indigo-50 to-pink-50 dark:from-zinc-800 dark:to-zinc-900 border border-indigo-100 dark:border-indigo-900/30">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-sm mr-4 ring-2 ring-indigo-200 dark:ring-indigo-900/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
                                TeamChat
                            </h2>
                            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-gradient-to-br from-indigo-100 to-pink-50 dark:from-indigo-900/40 dark:to-pink-900/30 text-indigo-800 dark:text-indigo-300 rounded-full border-small border-indigo-200/50 dark:border-indigo-700/30">
                                Beta 0.9
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            Comunicación en tiempo real para tu equipo
                        </p>
                    </div>
                </div>
                
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
                Comunícate con tu equipo de trabajo de forma segura y eficiente. Selecciona un contacto existente o busca uno nuevo para iniciar una conversación.
            </p>
            
            {/* Elementos decorativos */}
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-pink-200/30 dark:bg-pink-900/10 rounded-full blur-2xl"></div>
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-indigo-200/30 dark:bg-indigo-900/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-4 left-1/3 w-20 h-20 bg-indigo-100/20 dark:bg-indigo-800/10 rounded-full blur-lg"></div>
        </div>
        <div className="internal-chat-container" style={{height:'calc(100% - 200px)'}}>
   
            <div className="internal-chat-list px-5">
                <div className="flex justify-between items-center mb-2 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                            <span className="mr-2">Mi estado:</span>
                            <span className="text-lg">{listActivites.find((x) => x.id === myActivitie)?.emoji}</span>
                        </div>
                        <div className="relative">
                            <select
                                value={myActivitie}
                                onChange={(e) => setActivitie(e.target.value)}
                                className="appearance-none bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-lg pl-3 pr-8 py-1.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                            >
                                {listActivites.map((activity) => (
                                    <option key={activity.id} value={activity.id} className="flex items-center">
                                        {activity.emoji} {activity.label}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowNotificationSettings(true)}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors duration-200"
                        title="Configuración de notificaciones"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </button>
                </div>
                <div className="relative mb-3">
                    <Input
                        type="text"
                        placeholder="Buscar usuario"
                        value={findUser}
                        onChange={(e) => {
                            setFindUser(e.target.value);
                            getContactList(e.target.value);
                        }}
                        className="w-full"
                        startContent={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        }
                    />
                    {contactList.length > 0 && (
                        <div className="absolute top-12 left-0 w-full bg-white dark:bg-zinc-800 shadow-lg rounded-lg z-50 max-h-[300px] overflow-y-auto border border-gray-200 dark:border-zinc-700">
                            <div className="font-semibold p-3 border-b border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300">
                                Usuarios Encontrados
                            </div>
                            <div className="p-2">
                                {contactList.map((user) => (
                                    <div 
                                        className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-md cursor-pointer transition-colors duration-200 mb-1"
                                        key={user._id} 
                                        onClick={() => {
                                            createChat(user);
                                            setFindUser(''); // Clear search after selection
                                            setContactList([]); // Clear results after selection
                                        }}
                                    >
                                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 dark:border-zinc-600 flex-shrink-0 mr-3">
                                            <img 
                                                src={user.profile.picture && user.profile.picture.length > 0 ? user.profile.picture : avatarUser} 
                                                alt={user.profile.name} 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-800 dark:text-gray-200">
                                                {user.profile.name}
                                            </span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {user.user}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                <Tabs 
                    selectedKey={activeTab === 0 ? "chats" : "archived"}
                    onSelectionChange={(key) => setActiveTab(key === "chats" ? 0 : 1)}
                    className="mt-4 rounded-lg overflow-hidden"
                    variant="underlined"
                    color="primary"
                >
                    <Tab key="chats" title={
                        <div className="flex items-center">
                            <span>Chats</span>
                            <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 dark:bg-zinc-700 rounded-full">{inboxList.length}</span>
                        </div>
                    }>
                        <div className="py-2">
                            {inboxList.length > 0 ? (
                                inboxList.map(chat => renderChatItem(chat, false))
                            ) : (
                                <div className="p-5 text-center text-gray-500 dark:text-gray-400">
                                    No hay chats activos
                                </div>
                            )}
                        </div>
                    </Tab>
                    <Tab key="archived" title={
                        <div className="flex items-center">
                            <span>Archivados</span>
                            <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 dark:bg-zinc-700 rounded-full">{archivedChats.length}</span>
                        </div>
                    }>
                        <div className="py-2">
                            {archivedChats.length > 0 ? (
                                archivedChats.map(chat => renderChatItem(chat, true))
                            ) : (
                                <div className="p-5 text-center text-gray-500 dark:text-gray-400">
                                    No hay chats archivados
                                </div>
                            )}
                        </div>
                    </Tab>
                </Tabs>
            </div>
            
            {viewChat ? <div className="internal-chat-messages">
                
                <div className="border-b border-gray-200 dark:border-zinc-700 pb-3 mb-3 flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="relative w-12 h-12 mr-3">
                            <img 
                                src={!viewChat.isPrivate && viewChat.picture && viewChat.picture.length > 0 ? viewChat.picture : avatarUser} 
                                alt="User Icon" 
                                className="w-full h-full rounded-full object-cover border-2 border-gray-200 dark:border-zinc-600"
                            />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-zinc-800"></div>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">
                                {getNames(viewChat.isPrivate, viewChat.members, viewChat.label)}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {viewChat.isPrivate ? 'Chat privado' : 'Chat grupal'}
                            </p>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <Dropdown>
                            <DropdownTrigger>
                                <Button 
                                    variant="flat" 
                                    className="bg-gray-100 hover:bg-gray-200 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                                    startContent={
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    }
                                >
                                    Miembros
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Miembros del chat">
                                <DropdownItem key="header" className="font-semibold text-gray-700 dark:text-gray-300" isReadOnly>
                                    Miembros en el chat
                                </DropdownItem>
                                {viewChat && viewChat.members.map((member) => (
                                    <DropdownItem key={member.user._id}>
                                        {member.user.profile.name}
                                    </DropdownItem>
                                ))}
                            </DropdownMenu>
                        </Dropdown>

                        <Button 
                            onClick={() => setOpenFileMedia(!openFileMedia)}
                            variant="flat"
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-800/40 dark:text-blue-400"
                            startContent={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                            }
                        >
                            Contenido Compartido
                        </Button>
                    </div>
                </div>
                <div className="internal-chat-message-container h-[calc(100vh-350px)] overflow-y-auto p-4 bg-gray-50 dark:bg-zinc-900/50 rounded-lg" ref={messageContainerRef}>
                    { 
                    loading ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <Spinner size="lg" color="primary" className="mb-2" />
                            <p className="text-gray-600 dark:text-gray-400">Cargando mensajes...</p>
                        </div>
                    ) : viewChat.messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p>No hay mensajes en esta conversación</p>
                            <p className="text-sm mt-1">Envía un mensaje para comenzar a chatear</p>
                        </div>
                    ) : (
                        viewChat.messages.map((msg) => (
                            <BubbleIternalChat
                                key={'component-'+msg._id}
                                infoChat={viewChat}
                                msg={msg}
                                userInfo={userInfo}
                                readMessage={(idMsg) => readMessage(idMsg)}
                            />
                        ))
                    )}
                </div>
                <div className="flex items-center p-3 mt-3 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                    <div className="mr-2">
                        <InternalUploadFile sendFile={sendFile}/>
                    </div>

                    <div className="flex-1 relative bg-white dark:bg-zinc-700 rounded-full shadow-sm">
                        <textarea 
                            rows="1"
                            placeholder="Escribe tu mensaje aquí..."
                            onChange={(e) => {
                                setMessage(e.target.value);
                                // Auto-adjust height
                                e.target.style.height = 'auto';
                                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                            }}
                            value={message}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            className="w-full border-none rounded-full py-3 px-5 resize-none outline-none text-sm text-gray-800 dark:text-gray-200 dark:bg-zinc-700 max-h-[100px] font-sans"
                        />
                    </div>

                    <Button 
                        isIconOnly
                        onClick={sendMessage}
                        className="ml-2 bg-green-500 hover:bg-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center p-0 transition-colors duration-200"
                        aria-label="Enviar mensaje"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
                        </svg>
                    </Button>
                </div>

            </div>:
            <div className="flex flex-col items-center justify-center h-[calc(100vh-300px)] text-center p-6">
                <div className="mb-4 p-4 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">No hay chats activos</h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                    Selecciona un chat existente de la lista o busca un contacto para iniciar una nueva conversación.
                </p>
            </div>
            }
        </div>
        {/* Notification Settings Modal */}
<NotificationSettings 
    open={showNotificationSettings} 
    onClose={() => setShowNotificationSettings(false)} 
/>
        {/* Modal para ver los archivos */}
        {viewChat && <ModalFiles open={openFileMedia} setOpen={setOpenFileMedia} chatId={viewChat._id}/>}
    </>)
}