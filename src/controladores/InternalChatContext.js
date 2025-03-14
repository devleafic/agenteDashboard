import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [inboxList, setInboxList] = useState([]);
  const [archivedChats, setArchivedChats] = useState([]); 
  const [unreadMessages, setUnreadMessages] = useState({});
  const [activitiesUsers, setActivitiesUsers] = useState({});

  const getInboxChat = (newSocket) => {
    newSocket.emit('getInboxChat', {token: window.localStorage.getItem('sdToken')}, (data) => {
        console.log({data});
      
        let arraychats = data.body.chats.map(chat => chat);
        
        const savedArchivedChats = localStorage.getItem('archivedChats');
        const archivedChatIds = savedArchivedChats ? JSON.parse(savedArchivedChats) : [];
        
        const activeChats = arraychats.filter(chat => !archivedChatIds.includes(chat._id));
        const archived = arraychats.filter(chat => archivedChatIds.includes(chat._id));
        
        setInboxList(activeChats);
        setArchivedChats(archived);
        setUnreadMessages(data.body.countUnread);
    });
  }

  const archiveChat = (chatId) => {
    const chatToArchive = inboxList.find(chat => chat._id === chatId);
    if (!chatToArchive) return;
    
    setArchivedChats(prev => [...prev, chatToArchive]);
    setInboxList(prev => prev.filter(chat => chat._id !== chatId));
    
    const savedArchivedChats = localStorage.getItem('archivedChats');
    const archivedChatIds = savedArchivedChats ? JSON.parse(savedArchivedChats) : [];
    localStorage.setItem('archivedChats', JSON.stringify([...archivedChatIds, chatId]));
    
    toast.info('Chat archivado');
  }
  
  const unarchiveChat = (chatId) => {
    const chatToUnarchive = archivedChats.find(chat => chat._id === chatId);
    if (!chatToUnarchive) return;
    
    setInboxList(prev => [...prev, chatToUnarchive]);
    setArchivedChats(prev => prev.filter(chat => chat._id !== chatId));
    
    const savedArchivedChats = localStorage.getItem('archivedChats');
    if (savedArchivedChats) {
      const archivedChatIds = JSON.parse(savedArchivedChats);
      localStorage.setItem('archivedChats', JSON.stringify(archivedChatIds.filter(id => id !== chatId)));
    }
    
    toast.info('Chat desarchivado');
  }

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_INTERNALCHAT, {
        transports : ['websocket'],
        query : {
            token : window.localStorage.getItem('sdToken')
        }
    });

    newSocket.on('connect', () => {
        if (newSocket.connected) {
          toast.success('Conectado a TeamChat', {
            position: "top-center",
            autoClose: 2000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
            theme: "dark",
            });
          console.log('Conectado al servidor de Socket.IO');

          let lastActivitie = window.sessionStorage.getItem('lastActivitie');
          if(lastActivitie){
            console.log('Enviando actividad al servidor', lastActivitie);
            newSocket.emit('setActivitie', {activitie : lastActivitie, token: window.localStorage.getItem('sdToken')}, (data) => {});
          }

          setSocket(newSocket);
          getInboxChat(newSocket);
        }else {
          console.log('No se pudo conectar al servidor de TeamChat');
          toast.error('No se pudo conectar al servidor de TeamChat');
        }
    });

    newSocket.on('newChat',(data) => {
      let inboxarray = [];
      newSocket.emit('getInboxChat', {token: window.localStorage.getItem('sdToken')}, (chats) => {
          const savedArchivedChats = localStorage.getItem('archivedChats');
          const archivedChatIds = savedArchivedChats ? JSON.parse(savedArchivedChats) : [];
          
          const activeChats = chats.body.chats.filter(chat => !archivedChatIds.includes(chat._id));
          const archived = chats.body.chats.filter(chat => archivedChatIds.includes(chat._id));
          
          setInboxList(activeChats);
          setArchivedChats(archived);
          setUnreadMessages(chats.body.countUnread); 
          inboxarray = activeChats;

          if (!archivedChatIds.includes(data.body.chat._id)) {
            const isExists = inboxarray.find((x) => {
              return x._id === data.body.chat._id;
            });

            if(!isExists){
              setInboxList((prevInboxList) => {
                return [...prevInboxList, data.body.chat]
              });
            }
          }
      });
    });

    let timerActivities = setInterval(() => {
        setInboxList((prevInboxList) => {
          const myContacts = []
          prevInboxList.forEach((ch) => {
            ch.members.forEach((x) => {
              myContacts.push(x.user._id);
            });
          })
          
          newSocket.emit('getActivitiesInbox', {
            contacts : myContacts
          },(data) => {
            setActivitiesUsers(data);
          });

          return prevInboxList;
        });
    }, 5000);

    newSocket.on('incomingMessage', async (data) => {
      const dataUserStorage = await window.localStorage.getItem('userId');
      if(data.body.message.createdBy !== dataUserStorage){
        setUnreadMessages((prevUnreadMessages) => {
            return {...prevUnreadMessages, [data.body.chatId] : prevUnreadMessages && prevUnreadMessages[data.body.chatId] ? prevUnreadMessages[data.body.chatId] + 1 : 1};
        });
      }
      
      const savedArchivedChats = localStorage.getItem('archivedChats');
      if (savedArchivedChats) {
        const archivedChatIds = JSON.parse(savedArchivedChats);
        if (archivedChatIds.includes(data.body.chatId)) {
          setArchivedChats(prev => {
            const chatToMove = prev.find(chat => chat._id === data.body.chatId);
            if (chatToMove) {
              setInboxList(prevInbox => [...prevInbox, chatToMove]);
              localStorage.setItem('archivedChats', JSON.stringify(archivedChatIds.filter(id => id !== data.body.chatId)));
              toast.info('Chat desarchivado por nuevo mensaje');
            }
            return prev.filter(chat => chat._id !== data.body.chatId);
          });
        }
      }
    });
    
    return () => {
      clearInterval(timerActivities);
      newSocket.close();
    }
  }, []);

  return (
    <SocketContext.Provider value={{
      socket, 
      inboxList, 
      setInboxList, 
      archivedChats, 
      setArchivedChats, 
      archiveChat, 
      unarchiveChat, 
      unreadMessages, 
      setUnreadMessages, 
      activitiesUsers
    }}>
      {children}
    </SocketContext.Provider>
  );
};