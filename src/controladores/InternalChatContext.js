import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [inboxList, setInboxList] = useState([]);

  const getInboxChat = (newSocket) => {
    newSocket.emit('getInboxChat', {token: window.localStorage.getItem('sdToken')}, (data) => {
        console.log({data});
        setInboxList(data.body.chats)
    });
}

  useEffect(() => {
    console.log('iniciando chat interno')
    const newSocket = io('http://localhost:3000', {
        transports : ['websocket'],
        query : {
            token : window.localStorage.getItem('sdToken')
        }
    });

    newSocket.on('connect', () => {
        console.log('Conectado al servidor de Socket.IO');
        setSocket(newSocket);
        getInboxChat(newSocket);
    });

    newSocket.on('newChat',(data) => {
      // Buscamos si ya existe
      const isExists = inboxList.find((x) => {
        return x._id === data.body.chat._id;
      });

      if(!isExists){
        setInboxList([...inboxList, data.body.chat]);
      }

    })
    
    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={{socket : socket, inboxList : inboxList}}>
      {children}
    </SocketContext.Provider>
  );
};
