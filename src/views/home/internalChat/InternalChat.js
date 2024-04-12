import {useEffect, useState, useRef} from 'react';
import { useSocket } from '../../../controladores/InternalChatContext';
import { Input } from 'semantic-ui-react'
import { toast } from 'react-toastify';
import BubbleIternalChat from './BubbleIternalChat';
import { Message } from 'semantic-ui-react';
import { Table, Icon } from 'semantic-ui-react';

import axios from 'axios';
import {
    DropdownMenu,
    DropdownItem,
    DropdownHeader,
    Dropdown,
  } from 'semantic-ui-react'
import InternalUploadFile from './InternalUploadFile';

export default function InternalChat({userInfo}) {

    const {socket, inboxList, unreadMessages, setUnreadMessages, activitiesUsers} = useSocket();
    const [findUser, setFindUser] = useState('');
    const [contactList, setContactList] = useState([]);
    const [viewChat, setViewChat] = useState(null);
    const [message, setMessage] = useState('');
    const messageContainerRef = useRef(null);
    const [loading, setLoading] = useState(false);

    const [myActivitie, setMyActivitie] = useState('2-listo');
    const defaultActivitie = '2-listo';
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
        socket.emit('getContactList', {contact, service : userInfo.service.id}, (data) => {
            console.log({data});
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
            console.log({openChat : data});
            setLoading(false);
            if(data.body.success){
                setViewChat(data.body.chat);
                setTimeout(() => {
                    messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
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
            
            socket.on('incomingMessage', (data) => {
                console.log({incomingMessage : data});
                setViewChat((prevViewChat) => {

                    setUnreadMessages((prevUnreadMessages) => {
                        return {...prevUnreadMessages, [data.body.chatId] : prevUnreadMessages[data.body.chatId] ? prevUnreadMessages[data.body.chatId] + 1 : 1};
                    })

                    // Si prevViewChat es null, devuelve prevViewChat directamente
                    if (!prevViewChat) {
                        // Si no esta en pantallam actualizamos los contadores de no leido
                        console.log('llego per no esta en pantalla');
                        return prevViewChat
                    };
                    
                    // Si el chatId del mensaje entrante coincide con el chatId actual
                    if (prevViewChat._id === data.body.chatId) {
                        // Actualiza el estado con el nuevo mensaje agregado
                        console.log('bajando chat');
                        setTimeout(() => {
                            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
                        }, 10);
                        return {...prevViewChat, messages: [...prevViewChat.messages, data.body.message]};
                    }
                    // Si no coincide, devuelve el estado sin cambios
                    return prevViewChat;
                });
            });

            socket.on('newReader', (data) => {
                setViewChat((prevViewChat) => {
                    if (!prevViewChat) return prevViewChat;
                    if (prevViewChat._id !== data.body.chatId) {
                        return prevViewChat;
                    }

                    let chatIndex = prevViewChat.messages.findIndex((x) => x._id === data.body.message._id);
                    prevViewChat.messages[chatIndex] = data.body.message;

                    // Actualizamos el contador de no leídos
                    // Validamos si el chat existe
                    const isExists = inboxList.find((x) => {
                        return x._id === data.body.chatId;
                    });

                    if(isExists){
                        // Validamos si el reader es el mismo usuario de la sesión
                        const isReaderForMe = data.body.message.readers.find((x) => {
                            return x.user === userInfo._id;
                        });

                        if(isReaderForMe){
                            setUnreadMessages((prevUnreadMessages) => {
                                return {...prevUnreadMessages, [data.body.chatId] : prevUnreadMessages[data.body.chatId] === 0 ? 0 : prevUnreadMessages[data.body.chatId] - 1};
                            });
                        }
                    }

                    return {...prevViewChat};
                })
            });

            socket.on('newReaction',(data) => {
                console.log('newReaction', data);
                setViewChat((prevViewChat) => {
                    if (!prevViewChat) return prevViewChat;
                    if (prevViewChat._id !== data.body.chatId) {return prevViewChat;}

                    let chatIndex = prevViewChat.messages.findIndex((x) => x._id === data.body.message._id);
                    prevViewChat.messages[chatIndex] = data.body.message;
                    return {...prevViewChat};
                })
            });

            socket.on('reconnect',() => {
                console.log('Reconectado al servidor de TeamChat');
                // Enviamos el último estado
                setMyActivitie((prevMyActivitie) => {
                    console.log('úlimo estado', prevMyActivitie)
                    setActivitie(prevMyActivitie);
                    return prevMyActivitie;
                })
                
            })
        }
    }, [socket]);

    const readMessage = (id) => {
        console.log('leido enviando');
        socket.emit('readMessage', {chatId: viewChat._id,messageId : id, token: window.localStorage.getItem('sdToken')}, (data) => {
            console.log({readMessage : data});
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

    // useEffect(() => {
    //     if(viewChat){
    //         messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    //     }
    // }, [viewChat]);
    const [clickedId, setClickedId] = useState(null);

  return (<>
                 
<div style={{margin : 20}}>
        <Message
            attached
            icon="chat"
            header='TeamChat - Versión Beta 0.1'
            content='Comunicate con tu equipo de trabajo. Selecciona un contacto para continuar con la conversación.'
        /> </div>
    <div className="internal-chat-container" style={{height:'calc(100% - 140px)'}}>
   
        <div className="internal-chat-list">
            <div style={{marginBottom : 5}}>
                <div>
                    Mi estado: {listActivites.find((x) => {return x.id === myActivitie}).emoji}
                </div>
                <Dropdown text='Cambiar estado'>
                    <DropdownMenu>
                        {
                            listActivites.map((activity) => {
                                return <DropdownItem onClick={() => {
                                    setActivitie(activity.id);
                                }} key={activity.id} text={`${activity.emoji} ${activity.label}`} />
                            })
                        }
                    </DropdownMenu>
                </Dropdown>
            </div>
            <div style={{ position: 'relative' }}>
                <Input icon='search' placeholder='Buscar usuario' variant='large' style={{ width: '100%', marginBottom: '10px'}}
                    value={findUser}
                    onChange={(e) => {
                        setFindUser(e.target.value);
                        getContactList(e.target.value);
                    }}
                />
                {contactList.length > 0 && <div style={{ position: 'absolute', top: '40px', left: '0', width: '100%', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '10px', borderRadius: '4px' }}>
                    Usuarios Encontrados:
                    {contactList.map((user) => (
                        <div className="internal-chat-item" key={user._id} onClick={() => {
                            createChat(user);
                        }}>
                            {user.profile.name}
                        </div>
                    ))}
                </div>}
            </div>
                {
                    inboxList.map((chat) => {
                        return <div className="internal-chat-item" key={chat._id} onClick={() => {
                            setClickedId(chat._id);
                            openChat(chat._id);
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '10px',
                            borderBottom: '1px solid #ccc',
                            cursor: 'pointer',
                            backgroundColor: clickedId === chat._id ? 'lightgray' : 'white', // Change the background color when clicked
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <img
                                src='https://cdn1.iconfinder.com/data/icons/user-avatar-20/64/18-man-256.png'
                                style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '50%',
                                    marginRight: '10px'
                                }}
                            />
                            {getActivitie(chat.isPrivate, chat.members)}
                        </div>
                        <div style={{ flex: 1, margin: 5}}>
                            {getNames(chat.isPrivate, chat.members, chat.label)}
                        </div>
                        <div style={{ marginLeft: '10px' }}>
                            <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                backgroundColor: unreadMessages && unreadMessages[chat._id] ? 'red' : 'gray',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: 'white',
                                fontSize: '12px'
                            }}>
                                {unreadMessages && unreadMessages[chat._id] ? unreadMessages[chat._id] : 0}
                            </div>
                        </div>
                    </div>
                    })
                }
        </div>
        {viewChat ? <div className="internal-chat-messages">
            
            <div style={{borderBottom: '1px solid #ccc',
                paddingBottom: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',}}
            >
                <div style={{ fontSize: '30px' }}><strong>{getNames(viewChat.isPrivate, viewChat.members, viewChat.label)}</strong></div>
                <div style={{marginLeft:10}}>
                    <Dropdown
                        text='Miembros'
                        icon='users'
                        floating
                        labeled
                        button
                        className='icon'
                    >
                        <DropdownMenu>
                        <DropdownHeader content='Miembros en el chat' />
                        {viewChat.members.map((member) => (
                            <DropdownItem key={member.user._id}>{member.user.profile.name}</DropdownItem>
                        ))}
                        </DropdownMenu>
                    </Dropdown>
                </div>
            </div>
            <div className="internal-chat-message-container"  ref={messageContainerRef}>
                { 
                    loading && (
                        <div style={{display: 'flex', justifyContent: 'center', padding: '10px', alignItems:'center', height: '60vh' }}>
                        <Table.Row>
                            <Table.Cell collapsing={true} colSpan={6}>
                                <Icon name='spinner' size='large'/>
                                Cargando chat . . .
                            </Table.Cell>
                        </Table.Row>
                        </div>
                    )
                }
                {
                    viewChat.messages.map((msg) => {
                        return <BubbleIternalChat key={'component-'+msg._id} infoChat={viewChat} msg={msg} userInfo={userInfo} readMessage={(idMsg) => {
                            readMessage(idMsg);
                        }}/>
                    })
                }
            </div>
            <div className="internal-chat-input-container">

                <textarea 
                    rows="4" 
                    cols="50" 
                    placeholder="Escribe tu mensaje aquí..." 
                    onChange={(e) => setMessage(e.target.value)}
                    value={message}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                        }
                    }}
                    style={{
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px',
                        resize: 'none',
                        outline: 'none',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        width: '100%',
                        marginBottom: '5px'
                    }}
                />
                <button 
                    onClick={sendMessage}
                    style={{
                        marginLeft:  5,
                        backgroundColor: '#25D366',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px',
                        cursor: 'pointer',
                        height: '100%' 
                    }}
                >
                    Enviar
                </button>
                <div className="internal-chat-file-container" style={{ padding: '10px',
                        cursor: 'pointer',
                        height: '100%'  }}>
                    <InternalUploadFile sendFile={sendFile}/>
                    {/* <input type="file" onChange={handleFileChange} />
                    <button onClick={sendFile}>Enviar Archivo</button> */}
                </div>
            </div>

        </div>:<div className="internal-chat-messages">Selecciona un chat</div>}
    </div>
  </>)
}
