import {useEffect, useState, useRef} from 'react';
import { useSocket } from '../../../controladores/InternalChatContext';
import { Input } from 'semantic-ui-react'
import { toast } from 'react-toastify';
import BubbleIternalChat from './BubbleIternalChat';
import { Message } from 'semantic-ui-react';
import { Table, Icon, Menu, Tab, Button } from 'semantic-ui-react';
import NotificationSettings from './NotificationSettings';

import { useNotifications } from '../../../controladores/NotificationContext';

import axios from 'axios';
import {
    DropdownMenu,
    DropdownItem,
    DropdownHeader,
    Dropdown,
  } from 'semantic-ui-react'
import InternalUploadFile from './InternalUploadFile';

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
            
            socket.on('incomingMessage', (data) => {
                // console.log({incomingMessage : data});
                setViewChat((prevViewChat) => {

                    // if(data.body.message.createdBy !== userInfo._id){
                    //     setUnreadMessages((prevUnreadMessages) => {
                    //         return {...prevUnreadMessages, [data.body.chatId] : prevUnreadMessages && prevUnreadMessages[data.body.chatId] ? prevUnreadMessages[data.body.chatId] + 1 : 1};
                    //     });
                    // }

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
                            if(!messageContainerRef.current){return false;}
                            messageContainerRef.current.scrollTop = messageContainerRef.current ? messageContainerRef.current.scrollHeight : 0;
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
                    setInboxList((prevInboxList) => {
                        const isExists = prevInboxList.find((x) => {
                            return x._id === data.body.chatId;
                        });

                        if(isExists){
                            // Validamos si el reader es el mismo usuario de la sesión
                            const isReaderForMe = data.body.message.readers.find((x) => {
                                return x.user === userInfo._id;
                            });
    
                            if(isReaderForMe){
                                setUnreadMessages((prevUnreadMessages) => {
                                    if(!prevUnreadMessages){
                                        return {};
                                    }
                                    return {...prevUnreadMessages, [data.body.chatId] : prevUnreadMessages && prevUnreadMessages[data.body.chatId] === 0 ? 0 : prevUnreadMessages[data.body.chatId] - 1};
                                });
                            }
                        }
                        return prevInboxList;
                    })

                    return {...prevViewChat};
                })
            });

            socket.on('newReaction',(data) => {
                //console.log('newReaction', data);
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
            <div className="internal-chat-item" key={chat._id} onClick={() => {
                setClickedId(chat._id);
                openChat(chat._id);
            }}
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 15px',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                backgroundColor: clickedId === chat._id ? '#f5f8ff' : 'white',
                borderRadius: '8px',
                margin: '5px 0',
                transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
                if (clickedId !== chat._id) {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                }
            }}
            onMouseLeave={(e) => {
                if (clickedId !== chat._id) {
                    e.currentTarget.style.backgroundColor = 'white';
                }
            }}
            >
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    position: 'relative'
                }}>
                    <div style={{
                        width: '45px',
                        height: '45px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '2px solid #f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                    }}>
                        {getPictures(chat.isPrivate, chat.members, chat.picture)}
                    </div>
                    <div style={{
                        position: 'absolute',
                        bottom: '-2px',
                        right: '-2px',
                        fontSize: '14px'
                    }}>
                        {getActivitie(chat.isPrivate, chat.members)}
                    </div>
                </div>
                <div style={{ 
                    flex: 1, 
                    margin: '0 12px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        fontWeight: 'bold',
                        fontSize: '15px',
                        color: '#333',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {getNames(chat.isPrivate, chat.members, chat.label)}
                    </div>
                    <div style={{
                        fontSize: '13px',
                        color: '#666',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {chat.lastMessage ? (chat.lastMessage.length > 30 ? chat.lastMessage.substring(0, 30) + '...' : chat.lastMessage) : 'No hay mensajes'}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {!isArchived ? (
                        <Icon 
                            name="archive" 
                            style={{ 
                                marginRight: '10px', 
                                cursor: 'pointer',
                                color: '#888',
                                transition: 'color 0.2s',
                                ':hover': { color: '#333' }
                            }}
                            onClick={(e) => handleArchiveChat(chat._id, e)}
                            title="Archivar chat"
                            onMouseEnter={(e) => e.currentTarget.style.color = '#333'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
                        />
                    ) : (
                        <Icon 
                            name="undo" 
                            style={{ 
                                marginRight: '10px', 
                                cursor: 'pointer',
                                color: '#888',
                                transition: 'color 0.2s',
                                ':hover': { color: '#333' }
                            }}
                            onClick={(e) => handleUnarchiveChat(chat._id, e)}
                            title="Desarchivar chat"
                            onMouseEnter={(e) => e.currentTarget.style.color = '#333'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
                        />
                    )}
                    {unreadMessages && unreadMessages[chat._id] ? (
                        <div style={{
                            minWidth: '22px',
                            height: '22px',
                            borderRadius: '11px',
                            backgroundColor: '#25D366',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            padding: '0 6px'
                        }}>
                            {unreadMessages[chat._id]}
                        </div>
                    ) : (
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#ddd'
                        }}></div>
                    )}
                </div>
            </div>
        );
    };

    const panes = [
        {
            menuItem: (
                <Menu.Item key='chats'>
                    Chats <span style={{ marginLeft: '5px' }}>{inboxList.length}</span>
                </Menu.Item>
            ),
            render: () => (
                <Tab.Pane>
                    {inboxList.length > 0 ? (
                        inboxList.map(chat => renderChatItem(chat, false))
                    ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                            No hay chats activos
                        </div>
                    )}
                </Tab.Pane>
            ),
        },
        {
            menuItem: (
                <Menu.Item key='archived'>
                    Archivados <span style={{ marginLeft: '5px' }}>{archivedChats.length}</span>
                </Menu.Item>
            ),
            render: () => (
                <Tab.Pane>
                    {archivedChats.length > 0 ? (
                        archivedChats.map(chat => renderChatItem(chat, true))
                    ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                            No hay chats archivados
                        </div>
                    )}
                </Tab.Pane>
            ),
        },
    ];


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
                 
        <div style={{margin : 20}}>
            <Message
                attached
                icon="chat"
                header='TeamChat - Versión Beta 0.6' 
                content='Comunicate con tu equipo de trabajo. Selecciona o busca un contacto para conversar.'
            /> 
        </div>
        <div className="internal-chat-container" style={{height:'calc(100% - 140px)'}}>
   
            <div className="internal-chat-list">
                <div style={{marginBottom: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <div>
                            Mi estado: {listActivites.find((x) => {return x.id === myActivitie}).emoji}
                        </div>
                        <Dropdown text='Cambiar estado' style={{marginLeft: '10px'}}>
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
                    <Button 
                        icon="bell" 
                        size="small" 
                        onClick={() => setShowNotificationSettings(true)} 
                        title="Configuración de notificaciones"
                    />
                </div>
                <div style={{ position: 'relative' }}>
                    <Input icon='search' placeholder='Buscar usuario' variant='large' style={{ width: '100%', marginBottom: '10px'}}
                        value={findUser}
                        onChange={(e) => {
                            setFindUser(e.target.value);
                            getContactList(e.target.value);
                        }}
                    />
                    {contactList.length > 0 && <div style={{ 
                        position: 'absolute', 
                        top: '40px', 
                        left: '0', 
                        width: '100%', 
                        backgroundColor: '#fff', 
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)', 
                        padding: '12px', 
                        borderRadius: '8px',
                        zIndex: 1000,
                        maxHeight: '300px',
                        overflowY: 'auto',
                        border: '1px solid #f0f0f0'
                    }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '12px', color: '#333', fontSize: '14px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>Usuarios Encontrados</div>
                        {contactList.map((user) => (
                            <div className="internal-chat-item" key={user._id} onClick={() => {
                                createChat(user);
                                setFindUser(''); // Clear search after selection
                                setContactList([]); // Clear results after selection
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '10px 12px',
                                borderBottom: '1px solid #f5f5f5',
                                cursor: 'pointer',
                                borderRadius: '6px',
                                transition: 'all 0.2s ease',
                                backgroundColor: 'white',
                                marginBottom: '6px',
                                ':hover': {
                                    backgroundColor: '#f8f9fa'
                                }
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    marginRight: '12px',
                                    border: '2px solid #f0f0f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <img 
                                        src={user.profile.picture && user.profile.picture.length > 0 ? user.profile.picture : avatarUser} 
                                        alt="User Icon" 
                                        style={{ 
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                </div>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    <span style={{ 
                                        color: '#333', 
                                        fontSize: '15px', 
                                        fontWeight: 'bold',
                                        marginBottom: '2px'
                                    }}>
                                        {user.profile.name}
                                    </span>
                                    <span style={{
                                        color: '#666',
                                        fontSize: '13px'
                                    }}>
                                        {user.user}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>}
                </div>
                
                <Tab 
                    panes={panes} 
                    onTabChange={(e, { activeIndex }) => setActiveTab(activeIndex)}
                    activeIndex={activeTab}
                    style={{
                        marginTop: '15px',
                        borderRadius: '8px',
                        overflow: 'hidden'
                    }}
                    menu={{ 
                        secondary: true, 
                        pointing: true,
                        style: {
                            borderBottom: '1px solid #f0f0f0',
                            padding: '0 10px'
                        }
                    }}
                />
            </div>
            
            {viewChat ? <div className="internal-chat-messages">
                
                <div style={{borderBottom: '1px solid #ccc',
                    paddingBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',}}
                >
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '30px' }}>
                        <img 
                            src={!viewChat.isPrivate && viewChat.picture && viewChat.picture.length > 0 ? viewChat.picture : avatarUser} 
                            alt="User Icon" 
                            style={{ marginRight: '10px', width: '50px', height: '50px', borderRadius: '50%' }}
                        />
                        <strong>{getNames(viewChat.isPrivate, viewChat.members, viewChat.label)}</strong>
                    </div>
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
                            {viewChat && viewChat.members.map((member) => (
                                <DropdownItem key={member.user._id}>{member.user.profile.name}</DropdownItem>
                            ))}
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                </div>
                <div className="internal-chat-message-container" ref={messageContainerRef}>
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
                    viewChat.messages.map((msg) => (
                        <BubbleIternalChat
                        key={'component-'+msg._id}
                        infoChat={viewChat}
                        msg={msg}
                        userInfo={userInfo}
                        readMessage={(idMsg) => readMessage(idMsg)}
                        />
                    ))
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
                    </div>
                </div>

            </div>:<div className="internal-chat-messages">Selecciona un chat o busca un contacto</div>}
        </div>
        {/* Notification Settings Modal */}
<NotificationSettings 
    open={showNotificationSettings} 
    onClose={() => setShowNotificationSettings(false)} 
/>
    </>)
}