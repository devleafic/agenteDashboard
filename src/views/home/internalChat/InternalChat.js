import { useEffect, useState, useRef } from 'react';
import { useSocket } from '../../../controladores/InternalChatContext';
import { toast } from 'react-toastify';
import BubbleIternalChat from './BubbleIternalChat';
import NotificationSettings from './NotificationSettings';
import InternalUploadFile from './InternalUploadFile';
import ModalFiles from '../../../componentes/internalChat/ModalFiles';

export default function InternalChat({ userInfo }) {
  const { socket, inboxList, unreadMessages, setUnreadMessages, activitiesUsers, setInboxList, archivedChats, archiveChat, unarchiveChat } = useSocket();
  const [findUser, setFindUser] = useState('');
  const [contactList, setContactList] = useState([]);
  const [viewChat, setViewChat] = useState(null);
  const [message, setMessage] = useState('');
  const messageContainerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [avatarUser, setAvatarUser] = useState('https://inboxcentralcdn.sfo3.cdn.digitaloceanspaces.com/assets/profilepic.jpg');
  const [groupAvatar, setGroupAvatar] = useState('https://inboxcentralcdn.sfo3.cdn.digitaloceanspaces.com/assets/gropuchat.jpg');
  const [myActivitie, setMyActivitie] = useState('2-listo');
  const defaultActivitie = '2-listo';
  const [activeTab, setActiveTab] = useState(0);
  const [clickedId, setClickedId] = useState(null);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [openFileMedia, setOpenFileMedia] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [pageMsg, setPageMsg] = useState(1);

  const listActivites = [
    { id: '2-listo', label: 'Listo', emoji: '🟢' },
    { id: '2-ocupado', label: 'Ocupado', emoji: '🔴' },
    { id: '2-ausente', label: 'Ausente', emoji: '🟡' },
    { id: '1-comida', label: 'Comida', emoji: '🍔' },
    { id: '2-banio', label: 'Baño', emoji: '🚽' },
  ];

  const setActivitie = (idAct) => {
    socket.emit('setActivitie', { activitie: idAct, token: window.localStorage.getItem('sdToken') }, (data) => {
      window.sessionStorage.setItem('lastActivitie', idAct);
      setMyActivitie(data);
    });
  };

  const sendMessage = () => {
    const messageToSend = message.trim();
    socket.emit('sendMessage', { message: messageToSend, token: window.localStorage.getItem('sdToken'), chatId: viewChat._id, type: 'text' }, () => {
      console.log('Mensaje enviado y recibido por el servidor');
    });
    setMessage('');
  };

  const sendFile = (fileToSend) => {
    try {
      socket.emit('sendMessage', { message: fileToSend.url, token: window.localStorage.getItem('sdToken'), chatId: viewChat._id, type: fileToSend.typeFile }, () => {
        console.log('Archivo enviado y recibido por el servidor');
      });
    } catch (error) {
      console.error('Error al enviar el archivo:', error);
      toast.error('Error al enviar el archivo');
    }
  };

  const getContactList = (contact) => {
    if (contact.length < 3) {
      setContactList([]);
      return false;
    }
    socket.emit('getContactList', { contact, service: userInfo.service.id, token: window.localStorage.getItem('sdToken') }, (data) => {
      setContactList(data.body.list);
    });
  };

  const createChat = (contactToOpen) => {
    socket.emit('createChat', { contact: contactToOpen._id, token: window.localStorage.getItem('sdToken') }, () => {
      setContactList([]);
      setFindUser('');
    });
  };

  const openChat = (chatId) => {
    setLoading(true);
    socket.emit('openChat', { chatId, token: window.localStorage.getItem('sdToken') }, (data) => {
      setLoading(false);
      if (data.body.success) {
        setViewChat(data.body.chat);
        setTimeout(() => {
          if (messageContainerRef.current)
            messageContainerRef.current.scrollTop = messageContainerRef.current?.scrollHeight;
        }, 100);
      } else {
        toast.error('Ocurrió un error al abrir el chat');
      }
    });
  };

  useEffect(() => {
    if (socket) {
      setActivitie(defaultActivitie);
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
            requestAnimationFrame(() => {
              if (messageContainerRef.current) {
                messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
              }
            });
            return { ...prevViewChat, messages: [...prevViewChat.messages, data.body.message] };
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
          return { ...prevViewChat, messages: updatedMessages };
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
                [data.body.chatId]: currentCount === 0 ? 0 : currentCount - 1,
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
          return { ...prevViewChat, messages: updatedMessages };
        });
      };

      const handleReconnect = () => {
        console.log('Reconectado al servidor de TeamChat');
        setMyActivitie((prevMyActivitie) => {
          setActivitie(prevMyActivitie);
          return prevMyActivitie;
        });
      };

      socket.on('incomingMessage', handleIncomingMessage);
      socket.on('newReader', handleNewReader);
      socket.on('newReaction', handleNewReaction);
      socket.on('reconnect', handleReconnect);
    }
  }, [socket, userInfo._id]);

  const readMessage = (id) => {
    socket.emit('readMessage', { chatId: viewChat._id, messageId: id, token: window.localStorage.getItem('sdToken') }, (data) => {});
  };

  const getNames = (isPrivate, members, title) => {
    if (isPrivate) {
      const member = members.find((member) => member.user._id !== userInfo._id);
      return member.user.profile.name;
    }
    return title;
  };

  const getPictures = (isPrivate, members, groupPicture) => {
    if (isPrivate) {
      const member = members.find((member) => member.user._id !== userInfo._id);
      return (
        <img
          src={member.user.profile.picture && member.user.profile.picture.length > 0 ? member.user.profile.picture : avatarUser}
          alt="User Icon"
          className="w-10 h-10 rounded-full mr-2 border-2 border-gray-200 dark:border-gray-700 object-cover"
        />
      );
    }
    return (
      <img
        src={groupPicture && groupPicture.length > 0 ? groupPicture : groupAvatar}
        alt="Group Icon"
        className="w-10 h-10 rounded-full mr-2 border-2 border-gray-200 dark:border-gray-700 object-cover"
      />
    );
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

  };

  const handleArchiveChat = (chatId, e) => {
    e.stopPropagation();
    archiveChat(chatId);
    if (viewChat && viewChat._id === chatId) {
      setViewChat(null);
    }
  };

  const handleUnarchiveChat = (chatId, e) => {
    e.stopPropagation();
    unarchiveChat(chatId);
  };

  const loadOlderMessages = async () => {
    if (isLoadingOlder) return;
    setIsLoadingOlder(true);
    const currentScrollHeight = messageContainerRef.current.scrollHeight;

    try {
      const resOlder = await getOlderMessages(viewChat._id, pageMsg);
      const olderMessages = resOlder.body.chat.messages;
      if (olderMessages.length > 0) {
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

  const getOlderMessages = async (chatId, page) => {
    return new Promise((resolve, reject) => {
      socket.emit('getOlderMessages', { chatId, page, token: window.localStorage.getItem('sdToken') }, (data) => {
        resolve(data);
      });
    });
  };

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
      div.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (div) {
        div.removeEventListener('scroll', handleScroll);
      }
    };
  }, [viewChat, isLoadingOlder]);

  const renderChatItem = (chat, isArchived) => (
    <div
      key={chat._id}
      onClick={() => {
        setClickedId(chat._id);
        openChat(chat._id);
      }}
      className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${
        clickedId === chat._id ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <div className="relative">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700">
          {getPictures(chat.isPrivate, chat.members, chat.picture)}
        </div>
        <div className="absolute bottom-0 right-0 text-sm">{getActivitie(chat.isPrivate, chat.members)}</div>
      </div>
      <div className="flex-1 mx-3 overflow-hidden">
        <div className="font-semibold text-gray-800 dark:text-gray-200 truncate">
          {getNames(chat.isPrivate, chat.members, chat.label)}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
          {chat.lastMessage ? (chat.lastMessage.length > 30 ? chat.lastMessage.substring(0, 30) + '...' : chat.lastMessage) : 'No hay mensajes'}
        </div>
      </div>
      <div className="flex items-center">
        <button
          onClick={(e) => (isArchived ? handleUnarchiveChat(chat._id, e) : handleArchiveChat(chat._id, e))}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
          title={isArchived ? 'Desarchivar chat' : 'Archivar chat'}
        >
          <svg
            className="w-5 h-5 text-gray-600 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isArchived ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M15 20H9m6 0h6M4 4l16 16" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            )}
          </svg>
        </button>
        {unreadMessages && unreadMessages[chat._id] ? (
          <div className="min-w-[24px] h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">
            {unreadMessages[chat._id]}
          </div>
        ) : (
          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-lg m-2 border border-gray-200 dark:border-gray-800">
        <div className="relative overflow-hidden p-3 mx-2 mt-2 rounded-2xl shadow-md bg-gradient-to-r from-indigo-50 to-pink-50 dark:from-zinc-800 dark:to-zinc-900 border border-indigo-100 dark:border-indigo-900/30">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-sm mr-4 ring-2 ring-indigo-200 dark:ring-indigo-900/30">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" style={{stopColor: '#4F46E5'}} />
                                    <stop offset="100%" style={{stopColor: '#EC4899'}} />
                                </linearGradient>
                            </defs>
                            <path d="M8 12H8.01M12 12H12.01M16 12H16.01M21 12C21 16.4183 16.9706 20 12 20C9.82354 20 7.80233 19.1539 6.255 17.749L3 20L4.395 16.28C3.51196 15.0424 3 13.5743 3 12C3 7.58172 7.02944 4 12 4C16.9706 4 21 7.58172 21 12Z" stroke="url(#icon-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center">
                            <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
                                TeamChat
                            </h2>
                            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-gradient-to-br from-indigo-100 to-pink-50 dark:from-indigo-900/40 dark:to-pink-900/30 text-indigo-800 dark:text-indigo-300 rounded-full border-small border-indigo-200/50 dark:border-indigo-700/30">
                                1.0
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Comunicación en tiempo real para tu equipo interno.
                        </p>
                    </div>
                </div>
                
            </div>

            
            {/* Elementos decorativos */}
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-pink-200/30 dark:bg-pink-900/10 rounded-full blur-2xl"></div>
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-indigo-200/30 dark:bg-indigo-900/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-4 left-1/3 w-20 h-20 bg-indigo-100/20 dark:bg-indigo-800/10 rounded-full blur-lg"></div>
        </div>
      <div className="flex h-[calc(100vh-220px)] gap-2 mt-2">
        <div className="w-1/3 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mi estado:</span>
              <span className="text-lg">{listActivites.find((x) => x.id === myActivitie)?.emoji}</span>
              <select
                value={myActivitie}
                onChange={(e) => setActivitie(e.target.value)}
                className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {listActivites.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.emoji} {activity.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowNotificationSettings(true)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Configuración de notificaciones"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar usuario"
              value={findUser}
              onChange={(e) => {
                setFindUser(e.target.value);
                getContactList(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {contactList.length > 0 && (
              <div className="absolute w-full mt-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg max-h-80 overflow-y-auto z-10 border border-gray-200 dark:border-gray-700">
                <div className="p-3 font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">Usuarios Encontrados</div>
                {contactList.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => {
                      createChat(user);
                      setFindUser('');
                      setContactList([]);
                    }}
                    className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-all duration-200"
                  >
                    <img
                      src={user.profile.picture && user.profile.picture.length > 0 ? user.profile.picture : avatarUser}
                      alt="User Icon"
                      className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-700 object-cover"
                    />
                    <div className="ml-3">
                      <div className="font-semibold text-gray-800 dark:text-gray-200">{user.profile.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{user.user}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 flex border-b border-gray-200 dark:border-gray-600">
            <button
              onClick={() => setActiveTab(0)}
              className={`flex-1 py-2 text-center ${activeTab === 0 ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
            >
              Chats <span className="ml-1">({inboxList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab(1)}
              className={`flex-1 py-2 text-center ${activeTab === 1 ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
            >
              Archivados <span className="ml-1">({archivedChats.length})</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto mt-4">
            {activeTab === 0 ? (
              inboxList.length > 0 ? (
                inboxList.map((chat) => renderChatItem(chat, false))
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">No hay chats activos</div>
              )
            ) : archivedChats.length > 0 ? (
              archivedChats.map((chat) => renderChatItem(chat, true))
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">No hay chats archivados</div>
            )}
          </div>
        </div>
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-4">
          {viewChat ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-600 pb-3">
                <div className="flex items-center">
                  <img
                    src={!viewChat.isPrivate && viewChat.picture && viewChat.picture.length > 0 ? viewChat.picture : avatarUser}
                    alt="User Icon"
                    className="w-12 h-12 rounded-full mr-3 border-2 border-gray-200 dark:border-gray-700 object-cover"
                  />
                  <div className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                    {getNames(viewChat.isPrivate, viewChat.members, viewChat.label)}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative group">
                    <button className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600">
                      Miembros
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-lg z-10 border border-gray-200 dark:border-gray-700 hidden group-hover:block">
                      <div className="p-3 font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">Miembros en el chat</div>
                      {viewChat.members.map((member) => (
                        <div key={member.user._id} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700">
                          {member.user.profile.name}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setOpenFileMedia(!openFileMedia)}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Contenido Compartido
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4" ref={messageContainerRef}>
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando chat...</span>
                  </div>
                ) : (
                  viewChat.messages.map((msg) => (
                    <BubbleIternalChat
                      key={'component-' + msg._id}
                      infoChat={viewChat}
                      msg={msg}
                      userInfo={userInfo}
                      readMessage={(idMsg) => readMessage(idMsg)}
                    />
                  ))
                )}
              </div>
              <div className="p-4 bg-white dark:bg-zinc-800/50 border-t border-gray-200 dark:border-zinc-700 flex items-end gap-3">
                <InternalUploadFile sendFile={sendFile} />
                <div className="flex-1 relative flex items-stretch">
                    <textarea
                        rows="2"
                        placeholder="Escribe tu mensaje..."
                        value={message}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (message.trim()) sendMessage();
                            }
                        }}
                        className="w-full p-3 pr-14 rounded-2xl border border-gray-300 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all duration-200"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!message.trim()}
                        className="absolute right-2.5 bottom-2.5 w-10 h-10 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-full text-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-zinc-800 transition-all duration-200 disabled:opacity-50 disabled:scale-100 flex items-center justify-center"
                        aria-label="Enviar mensaje"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z"></path>
                        </svg>
                    </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              Selecciona un chat o busca un contacto
            </div>
          )}
        </div>
      </div>
      <NotificationSettings open={showNotificationSettings} onClose={() => setShowNotificationSettings(false)} />
      {viewChat && <ModalFiles open={openFileMedia} setOpen={setOpenFileMedia} chatId={viewChat._id} />}
    </div>
  );
}