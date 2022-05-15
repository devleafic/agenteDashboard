import React, {useContext} from 'react';
import io from 'socket.io-client';
var Socket;


export const connectToSocket = (listFolios, setRefresh) => {

    

    Socket = io(process.env.REACT_APP_CENTRALITA, { transports : ['websocket'] });

    Socket.emit('handShakeToSocket', {
        token : window.localStorage.getItem('sdToken')
    });

    Socket.on('start', () => {
        console.log('Socket Iniciado');
    });

    Socket.on('newFolio', (data) => {
        console.log('Nuevo Folio');
        listFolios = {...listFolios, [data.body.folio._id] : data.body};
        setRefresh(Math.random())
    })

    Socket.on('newMessage', (data) => {
        console.log(data);
        let copyFolio = {...listFolios[data.folio]};
        if(!copyFolio.folio){
            return false;
        }
        copyFolio.folio.message.push(data.lastMessage);
        listFolios = {...listFolios, [data.folio] : copyFolio};
        setRefresh(Math.random())
        scrollToBottom();
    });
};

export const sendMessage = (data) => {
    let payload = data;
    Socket.emit('sendMessage', payload);
}

const scrollToBottom = () =>{ 

  }; 