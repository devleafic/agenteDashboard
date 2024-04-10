import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [inboxList, setInboxList] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState([]);

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
        toast.success('Conectado al servidor de TeamChat con éxito');  
        console.log('Conectado al servidor de Socket.IO');
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
    
    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={{socket : socket, inboxList : inboxList, unreadMessages : unreadMessages, setUnreadMessages:setUnreadMessages}}>
      {children}
    </SocketContext.Provider>
  );
};
