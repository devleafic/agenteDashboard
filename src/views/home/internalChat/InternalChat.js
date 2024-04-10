import {useEffect, useState, useRef} from 'react';
import { useSocket } from '../../../controladores/InternalChatContext';
import { Input } from 'semantic-ui-react'
import { toast } from 'react-toastify';
import BubbleIternalChat from './BubbleIternalChat';
import axios from 'axios';
import {
    DropdownMenu,
    DropdownItem,
    DropdownHeader,
    Dropdown,
  } from 'semantic-ui-react'

export default function InternalChat({userInfo}) {

    const {socket, inboxList, unreadMessages, setUnreadMessages} = useSocket();
    const [findUser, setFindUser] = useState('');
    const [contactList, setContactList] = useState([]);
    const [viewChat, setViewChat] = useState(null);
    const [message, setMessage] = useState('');
    const messageContainerRef = useRef(null);

    const [file, setFile] = useState(null);

    const sendMessage = () => {
        const messageToSend = message.trim();
        socket.emit('sendMessage', {message : messageToSend, token: window.localStorage.getItem('sdToken'), chatId : viewChat._id ,type : 'text'}, (data) => {
            console.log('Mensaje enviado y recibido por el servidor');
        });
        setMessage('');
    };

    const getContactList = (contact) => {
        console.log(contact);
        if(contact.length < 3){
            setContactList([]);
            return false;
        }
        socket.emit('getContactList', {contact}, (data) => {
            console.log({data});
            setContactList(data.body.list);
        });
    }

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
        socket.emit('openChat', {chatId, token: window.localStorage.getItem('sdToken')}, (data) => {
            console.log({openChat : data});
            if(data.body.success){
                setViewChat(data.body.chat);
            }else{
                toast.error('Ocurrion un error al abrir el chat');
            }
        });
    }

    useEffect(() => {
        if (socket) {
            console.log('Conexión del socket establecida');

            socket.on('incomingMessage', (data) => {
                console.log({incomingMessage : data});
                setViewChat((prevViewChat) => {
                    // Si prevViewChat es null, devuelve prevViewChat directamente
                    if (!prevViewChat) return prevViewChat;
                    
                    // Si el chatId del mensaje entrante coincide con el chatId actual
                    if (prevViewChat._id === data.body.chatId) {
                        // Actualiza el estado con el nuevo mensaje agregado
                        console.log('bajando chat');
                        messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
                        return {...prevViewChat, messages: [...prevViewChat.messages, data.body.message]};
                    }
                    // Si no coincide, devuelve el estado sin cambios
                    return prevViewChat;
                });
            });

            socket.on('newReader', (data) => {
                setViewChat((prevViewChat) => {
                    if (!prevViewChat) return prevViewChat;
                    if (prevViewChat._id !== data.body.chatId) {return prevViewChat;}

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
                                return {...prevUnreadMessages, [data.body.chatId] : prevUnreadMessages[data.body.chatId] - 1};
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

    const sendFile = async () => {
        try {
            if (!selectedFile) {
                console.error('No se ha seleccionado ningún archivo');
                return;
            }

            const formData = new FormData();
            formData.append('file', selectedFile);

            const url = process.env.REACT_APP_CENTRALITA + '/sendFile/internalChat/cdn';
            const response = await axios.post(url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('Archivo enviado:', response.data);

            const typeFile = response.data.file.mimetype.includes('image') ? 'image' : 'file';
            console.log(typeFile);

            socket.emit('sendMessage', {message : response.data.url, token: window.localStorage.getItem('sdToken'), chatId : viewChat._id ,type : typeFile}, (data) => {
                console.log('Mensaje enviado y recibido por el servidor');
                setSelectedFile(null);
            });

        } catch (error) {
            console.error('Error al enviar el archivo:', error);
        }
    };

    useEffect(() => {
        if(viewChat){
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    }, [viewChat]);

  return (<>
    <div className="internal-chat-container">
        <div className="internal-chat-list">
            <div style={{ position: 'relative' }}>
                <Input icon='search' placeholder='Buscar contacto' variant='large' style={{ width: '100%' }}
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
                            openChat(chat._id);
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                        }}
                        >
                            <div>
                                <img src='https://cdn1.iconfinder.com/data/icons/user-avatar-20/64/18-man-256.png' style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '50%',
                                    marginRight: '10px'
                                }}/>
                            </div>
                            {getNames(chat.isPrivate, chat.members, chat.label)}
                            ({unreadMessages[chat._id]})
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
                <div><strong>{getNames(viewChat.isPrivate, viewChat.members, viewChat.label)}</strong></div>
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
                        <DropdownHeader content='Miembros del chat' />
                        {viewChat.members.map((member) => (
                            <DropdownItem key={member.user._id}>{member.user.profile.name}</DropdownItem>
                        ))}
                        </DropdownMenu>
                    </Dropdown>
                </div>
            </div>
            <div className="internal-chat-message-container" ref={messageContainerRef}>
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
                    rows="3" 
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
                />
                <button onClick={sendMessage}>Enviar Mensaje</button>
            </div>
            <div className="internal-chat-file-container">
                <input type="file" onChange={handleFileChange} />
                <button onClick={sendFile}>Enviar Archivo</button>
            </div>
        </div>:<div className="internal-chat-messages">Selecciona un chat</div>}
    </div>
  </>)
}
