import React, { createContext, useContext, useEffect, useState } from 'react';
//import { toast } from 'react-toastify';
import io from 'socket.io-client';
import { useNotifications } from './NotificationContext';
import { ToastProvider, addToast } from "@heroui/react";

const SocketContext = createContext();


export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [inboxList, setInboxList] = useState([]);
  const [archivedChats, setArchivedChats] = useState([]); 
  const [unreadMessages, setUnreadMessages] = useState({});
  const [activitiesUsers, setActivitiesUsers] = useState({});
  const [placement, setPlacement] = useState('top-right');
  
// Get notification functions from context
const { queueNotification } = useNotifications();

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

  const goToMedia = (chatId) => {
    return new Promise((resolve, reject) => {
      console.log('Getting media for chat', chatId);
      socket.emit('getMedia', {token: window.localStorage.getItem('sdToken'), chatId}, (data) => {
        resolve(data);
      });
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
    
    addToast('Chat archivado');
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
    
    addToast({
        title: 'Chat desarchivado',
        description: 'Chat desarchivado',
        color: 'success'
    });
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
          addToast({
            title: 'Conectado a TeamChat',
            description: 'Conectado a TeamChat',
            color: 'secondary',
           
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
          addToast({
            title: 'No se pudo conectar al servidor de TeamChat',
            description: 'No se pudo conectar al servidor de TeamChat',
            color: 'danger',
            placement: 'top-center'
          });
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
        
         // Get sender information for notification
         const chatInfo = inboxList.find(chat => chat._id === data.body.chatId);
         let senderName = "TeamChat 💬";
         let messageContent = data.body.message?.message || "Nuevo mensaje recibido";
         
         if (chatInfo) {
           if (chatInfo.isPrivate) {
             const sender = chatInfo.members.find(member => member.user._id !== dataUserStorage);
             if (sender) {
               senderName = sender.user.profile.name;
             }
           } else {
             senderName = chatInfo.label;
           }
         }
         
         // Queue the notification with type 'message'
         queueNotification(senderName, messageContent, 'message');

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
              addToast({
                title: 'Chat desarchivado por nuevo mensaje',
                description: 'Chat desarchivado por nuevo mensaje',
                color: 'info',
                placement: 'top-center'
              });
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
  }, [queueNotification] );

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
      activitiesUsers,
      goToMedia
    }}>
    <div className="fixed z-[100]">
            <ToastProvider placement={placement} toastProps={{ timeout: 2000 }} />
    </div>
      {children}
    </SocketContext.Provider>
  );
};