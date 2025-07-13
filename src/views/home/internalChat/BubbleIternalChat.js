import { useRef, useEffect, useState } from 'react';
import { 
    Dropdown, 
    DropdownTrigger, 
    DropdownMenu, 
    DropdownItem, 
    Button, 
    Image, 
    Tooltip, 
    Chip, 
    Popover, 
    PopoverTrigger, 
    PopoverContent, 
    Spinner 
} from '@heroui/react';
import { Check, CheckCheck, Eye, User, FolderOpen, X } from 'lucide-react';
import { useSocket } from '../../../controladores/InternalChatContext';
import moment from 'moment';
moment.locale('es');

export default function BubbleIternalChat({infoChat, msg, userInfo, readMessage}) {
    const {socket, inboxList} = useSocket();
    const messageRef = useRef(null);

    const sendReaction = (value) => {
        console.log('leyendo');
        socket.emit('sendReaction', { 
            reaction: value, 
            token: window.localStorage.getItem('sdToken'), 
            chatId: infoChat._id, 
            messageId: msg._id 
        }, (data) => {
            console.log('Reacción enviada y recibida por el servidor');
        });
    }

    const renderAndCountReactions = (idMsg, reactions, direction) => {
        const reactionCount = {};
        let reactionAgents = []
        reactions.forEach((reaction) => {
            if (reactionCount[reaction.emoji]) {
                reactionCount[reaction.emoji] += 1;
            } else {
                reactionCount[reaction.emoji] = 1;
            }
        });

        reactions.forEach((reader) => {
            if (reader.user._id === userInfo._id) {
                reactionAgents.push('' + reader.emoji + 'Tú');
            } else {
                infoChat.members.forEach((member) => {
                    if (member.user._id === reader.user._id || member.user._id === reader.user) {
                        reactionAgents.push(member.user.profile.name ? '' + reader.emoji + ' ' + member.user.profile.name : 'Miembro expulsado');
                    }
                });
            }
        });

        const reactionLogHtml = reactionAgents.map((reader, index) => (
            <div key={`reaction-${idMsg}-${index}`} className="py-1"> {reader}</div>
        ));

        const content = reactionLogHtml.length > 0 ? reactionLogHtml : 'Sin reacciones';

        return (
            <div className={`flex ${direction === 'left' ? 'justify-end' : 'justify-start'}`}> 
                {reactionCount && Object.keys(reactionCount).length > 0 ? (
                    <Popover>
                        <PopoverTrigger>
                            <Button isIconOnly size="sm" color="primary" variant="flat" className="rounded-full p-0 min-w-0 h-6 w-6 mx-1">
                                <Eye className="h-3 w-3" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-2">
                            <div className="p-2">{content}</div>
                        </PopoverContent>
                    </Popover>
                ) : null}

                {Object.keys(reactionCount).map((reaction, index) => (
                    <div key={`${idMsg}-${reaction}-${index}`} className="text-sm mx-1">
                        {reaction} {reactionCount[reaction]}
                    </div>
                ))}
            </div>
        );
    }

    const renderReadCheck = (readers, direction) => { //for private chat
        const reader = readers.find((reader) => reader.user._id !== msg.createdBy);
        if (!reader) return null;
     return (
         <div className={`flex ${direction === 'left' ? 'justify-end' : 'justify-start'}`}> 
         <Tooltip content={`Lectura confirmada a ${moment(reader.createdAt).format('DD/MM/YYYY HH:mm:ss')}`}>
            <div className="flex justify-end">
                <CheckCheck className="h-6 w-6 text-blue-500" />
            </div>
            </Tooltip>
        </div>
    )   
    }

    const renderGroupReaders = (readers, direction) => {   
        let readerslog = [];
        readers.forEach((reader) => {
            if(reader.user._id === userInfo._id){
                readerslog.push('Tú');
            } else {
                infoChat.members.forEach((member) => {  
                    if(member.user._id === reader.user._id || member.user._id === reader.user){
                        readerslog.push(member.user.profile.name ? member.user.profile.name : 'Miembro expulsado');
                    }
                }); 
            }
        });

        const readersLogHtml = readerslog.map((reader, index) => (
            <div key={`reader-${index}`} className="flex items-center gap-1">
                <Check className="h-3 w-3 text-blue-500" />
                {reader}
            </div>
        ));

        const content = readersLogHtml.length > 0 ? readersLogHtml : 'Sin lectores';
        
        return (
            <div className={`flex items-center ${direction === 'left' ? 'justify-end' : 'justify-start'}`}>
                <Popover>
                    <PopoverTrigger>
                        <Button isIconOnly size="sm" color="primary" variant="flat" className="rounded-full p-0 min-w-0 h-6 w-6 mx-1">
                            <Eye className="h-3 w-3" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                        <div className="p-2">{content}</div>
                    </PopoverContent>
                </Popover>
                <em className="text-xs text-gray-500">Lectores #{readers.length}</em>
            </div>
        );
    }

    useEffect(() => {

        // Configuración del observer, para saber si el mensaje es visible en la pantalla
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.5
        };

        const callback = (entries) => {
            entries.forEach(entry => {
                const isReaderForMe = msg.readers.find((x) => {return x.user._id === userInfo._id;});
                if (!isReaderForMe && entry.isIntersecting) {
                    const idBubble = entry.target.getAttribute('data-message-id');
                    readMessage(idBubble);
                }else{
                }
            });
        };

        const observer = new IntersectionObserver(callback, options);
        if (messageRef.current) {
            observer.observe(messageRef.current);
        }

        return () => {
            if (messageRef.current) {
                observer.unobserve(messageRef.current);
            }
        };
    }, []);

    const formatMessage = (text) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, (url) => `<a href="${url}" target="_blank">${url}</a>`);
    };

    const convertContent = (msg) => {
        const type = msg.typeMessage;
        const content = msg.message;
       
        switch(type){
            case 'text':
                return <div className="internal-chat-message" dangerouslySetInnerHTML={{ __html: formatMessage(content) }}></div>;
            case 'document':
                return (
                    <a 
                        href={content} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                        Documento - <FolderOpen className="h-4 w-4" />
                    </a>
                );
            case 'image':
               return (
                    <div className="internal-chat-message">
                        <a href={content} target="_blank" rel="noopener noreferrer">
                            <Image 
                                className="rounded-lg max-w-full" 
                                src={content}
                                alt="Imagen compartida"
                            />
                        </a>
                    </div>
                );
            case 'sticker':
                return (
                    <a href={content} target="_blank" rel="noopener noreferrer">
                        <Image 
                            className="rounded-lg max-w-[150px]" 
                            src={content}
                            alt="Sticker"
                        />
                    </a>
                );
            case 'video':
                return (
                    <video controls className="rounded-lg max-w-full">
                        <source src={content} type="video/mp4" reload="auto"/>
                    </video>
                );
            case 'voice':
                return (
                    <audio controls className="w-full max-w-[250px]">
                        <source src={content} type="audio/ogg" />
                        <source src={content} type="audio/mpeg" />
                    </audio>
                );
            case 'call':
                return (
                    <audio controls className="w-full max-w-[250px]">
                        <source src={content} type="audio/ogg" />
                        <source src={content} type="audio/mpeg" />
                    </audio>
                );                
            case 'externalAttachment':
                return (
                    <video controls className="rounded-xl max-w-full">
                        <source src={content} type="video/mp4" reload="auto"/>
                    </video>
                );
            case 'notify':
                return (
                    <Chip 
                        color="danger" 
                        variant="flat" 
                        startContent={<X className="h-4 w-4" />}
                        endContent={<span className="text-xs font-bold">FINALIZAR LA CONVERSACIÓN</span>}
                    >
                        {content}
                    </Chip>
                );         
            case 'notify-success':
                return (
                    <Chip 
                        color="success" 
                        variant="flat" 
                        startContent={<Check className="h-4 w-4" />}
                        endContent={<span className="text-xs font-bold">ACTUALIZACIÓN DE LA CONVERSACIÓN</span>}
                    >
                        {content}
                    </Chip>
                );          
            case 'errors':
                return (<span className="text-red-500">[{type}] - {content}</span>);      
            default:
                return (<span className="text-amber-500">[La clase {type} no esta soportada] - {content}</span>);
        }
    }

    const getAuthor = (id, members) => { // Obtiene el nombre del autor del mensaje para grupos
        const author = members.find((x) => {return x.user._id === id;});
        if (author && author.user && author.user.profile) {
            return (
                <div className="text-xs text-gray-500 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {author.user.profile.name}
                </div>
            );
        } else {
            return (
                <div className="text-xs text-gray-500 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Unknown
                </div>
            );
        }
    }

  return (
        <div 
            key={msg._id} 
            className={userInfo._id !== msg.createdBy ? 'internal-chat-received' : 'internal-chat-sent'} 
            ref={messageRef} 
            data-message-id={msg._id}
        >
            {convertContent(msg)}
            {userInfo._id !== msg.createdBy && !infoChat.isPrivate && getAuthor(msg.createdBy, infoChat.members)}
            
            <div>
                {!infoChat.isPrivate && renderGroupReaders(msg.readers, userInfo._id !== msg.createdBy ? 'right' : 'left')}
                {renderAndCountReactions(msg._id, msg.reactions, userInfo._id !== msg.createdBy ? 'right' : 'left')}
                {userInfo._id === msg.createdBy && infoChat.isPrivate && (msg.readers.length > 1) && renderReadCheck(msg.readers, userInfo._id !== msg.createdBy ? 'right' : 'left')}
            </div>

            <Dropdown>
                <DropdownTrigger>
                    <Button 
                        size="sm" 
                        variant="light" 
                        className="text-xs text-gray-500 p-1 min-w-0 h-auto"
                    >
                        {moment(msg.createdAt).format('lll')} 💬
                    </Button>
                </DropdownTrigger>
                <DropdownMenu 
                    aria-label="Reacciones" 
                    onAction={(key) => sendReaction(key)}
                    className="min-w-0"
                >
                    <DropdownItem key="🙂">🙂</DropdownItem>
                    <DropdownItem key="🤔">🤔</DropdownItem>
                    <DropdownItem key="😡">😡</DropdownItem>
                    <DropdownItem key="😳">😳</DropdownItem>
                    <DropdownItem key="👍">👍</DropdownItem>
                    <DropdownItem key="👎">👎</DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </div>
    )
}