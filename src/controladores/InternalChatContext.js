import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [inboxList, setInboxList] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [activitiesUsers, setActivitiesUsers] = useState({});

  const getInboxChat = (newSocket) => {
    newSocket.emit('getInboxChat', {token: window.localStorage.getItem('sdToken')}, (data) => {
        console.log({data});
        setInboxList(data.body.chats)
        setUnreadMessages(data.body.countUnread);
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
      // Buscamos si ya existe
      const isExists = inboxList.find((x) => {
        return x._id === data.body.chat._id;
      });

      if(!isExists){
        setInboxList((prevInboxList) => {
          return [...prevInboxList, data.body.chat]
        });
      }

    });

    // Validamos la actividad de mi inbox
    let timerActivities = setInterval(() => {
        setInboxList((prevInboxList) => {
          const myContacts = []
          prevInboxList.forEach((ch) => {
            ch.members.forEach((x) => {
              if(x.role === 'admin'){return;}
              myContacts.push(x.user._id);
            });
          })
          // console.log('Consultando actividad de mi inbox', {myContacts});
          
          // Vamos al server por las actividades
          newSocket.emit('getActivitiesInbox', {
            contacts : myContacts
          },(data) => {
            // console.log('contactos actividades',data);
            setActivitiesUsers(data);
          });

          return prevInboxList;
        });
    }, 5000);

    // Re-validación de nuvo mensaje
    newSocket.on('incomingMessage', async (data) => {
      const dataUserStorage = await window.localStorage.getItem('userId');
      if(data.body.message.createdBy !== dataUserStorage){
        setUnreadMessages((prevUnreadMessages) => {
            return {...prevUnreadMessages, [data.body.chatId] : prevUnreadMessages && prevUnreadMessages[data.body.chatId] ? prevUnreadMessages[data.body.chatId] + 1 : 1};
        });
      }
    });
    
    return () => {
      clearInterval(timerActivities);
      newSocket.close();
    }
  }, []);

  return (
    <SocketContext.Provider value={{socket : socket, inboxList : inboxList,setInboxList:setInboxList, unreadMessages : unreadMessages, setUnreadMessages:setUnreadMessages, activitiesUsers}}>
      {children}
    </SocketContext.Provider>
  );
};
