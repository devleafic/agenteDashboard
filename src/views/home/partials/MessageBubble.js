import React, { useState } from 'react';
import { useTextSize } from '../../../contexts/TextSizeContext';
import moment from 'moment';
import { Avatar, Button, Card, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Popover, PopoverTrigger, PopoverContent, Image, Snippet, Tooltip, CardBody, CardFooter } from '@heroui/react';
//import { PaperclipIcon, DownloadIcon, ReplyIcon, SmileIcon, ClockIcon, ExclamationCircleIcon, ExternalLinkIcon } from '@heroui/icons';
import ContactsRender from './ContactsRender';
import AudioPlayer from './AudioPlayer';
import MapPreview from './MapPreview';

// --- SVG Icons ---
const PaperclipIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.122 2.122l7.81-7.81" /></svg>;
const DownloadIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const ReplyIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>;
const SmileIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ClockIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ExclamationCircleIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>;
const ExternalLinkIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>;

// SVGs precisos que imitan el estilo de WhatsApp
const CheckIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10.9583 3.96875L6.04167 8.88542L3.95833 6.80208" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const DoubleCheckIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10.5 3.5L5.5 8.5L3.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13.5 3.5L8.5 8.5L7.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Función para truncar texto con puntos suspensivos en el medio
const truncateMiddle = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text;
    const half = Math.floor(maxLength / 2) - 1;
    return `${text.substring(0, half)}...${text.substring(text.length - half)}`;
};

// Función para resaltar texto en un mensaje
const highlightText = (text, highlight) => {
    if (!highlight || !text) return text;
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() 
            ? <mark key={i} className="bg-yellow-400 text-current">{part}</mark> 
            : part
    );
};

const convertirURL = (url) => {
    let alternateUrl = '';
    try {

      const dominioPermitido = 'inboxcentralcdn.sfo3.digitaloceanspaces.com';
      const parsedUrl = new URL(url);
  
      // Verifica que la URL pertenezca al dominio permitido
    //  if (parsedUrl.hostname !== dominioPermitido || parsedUrl.hostname !== 'localhost') {
    //    console.warn('La URL no pertenece al dominio permitido.');
    //    return url;
    //  }
  
      // Obtiene el nombre del archivo
      const nombreArchivo = parsedUrl.pathname.split('/').pop();
  
      // Verifica que el archivo tenga extensión .pdf
      //if (!nombreArchivo.toLowerCase().endsWith('.pdf')) {
      //  console.warn('El archivo no es un PDF.');
      //  return url;
      //}
      console.log(`https://artemisv1.botdynamics.app/cdn/cloud/${nombreArchivo}`);
      alternateUrl = `https://artemisv1.botdynamics.app/cdn/cloud/${nombreArchivo}`;

      return alternateUrl;
    } catch (error) {
      console.error('Error al procesar la URL:', error);
      return url;
    }
  }

// Common reactions array
const REACTIONS = [
    '👍', '👎', '❤️', '😂', '😮', '😢', '😡', '👏', '🙏', '🔥',
    '🎉', '🤔', '👀', '🤯', '😎', '🤩', '😍', '🥳', '😭', '🤬'
];

// Simple Emoji Picker Component
const EmojiPicker = ({ onSelect }) => (
    <div className="flex flex-wrap gap-1 p-2 bg-content1 rounded-lg shadow-lg w-48">
        {REACTIONS.map((emoji, index) => (
            <Button
                key={index}
                isIconOnly
                variant="light"
                size="sm"
                className="text-xl hover:scale-125 transition-transform"
                onPress={() => onSelect(emoji)}
            >
                {emoji}
            </Button>
        ))}
    </div>
);

const MessageBubble = ({ message, responseToMessage, reactToMessage, allMsg, contact, highlight = '' }) => {
    const { textSizeValue } = useTextSize();

    const isOutgoing = message.direction === 'out';

    const getNameAuthor = (element) => {
        if (!element) return 'Agente';
        if (element.sys && element.sys === 'BOT') return '🤖 Bot';
        return element.agent ? (element.agent.profile?.name || element.agent.user) : (element.sys || 'Agente');
    };

    const getAck = (ack, isNewMessage = false) => {
        // Para mensajes nuevos o sin ack, mostramos un reloj por defecto
        if (!ack || Object.keys(ack).length === 0) {
            return (
                <div className="bg-gray-100 p-1.5 rounded-full shadow-md flex items-center justify-center">
                    <ClockIcon className="w-6 h-6 text-gray-700" />
                </div>
            );
        }

        // Mostrar el estado actual del mensaje en la consola para depuración
        console.log('Estado del mensaje (ack):', ack);

        const failureObject = ack.failedDelivery ? { type: 'delivery', data: ack.failedDelivery } : 
                              ack.failedOutofWindows ? { type: 'window', data: ack.failedOutofWindows } : 
                              null;

        if (failureObject) {
            let reason = 'Razón desconocida, vuelve a intentar';
            if (failureObject.type === 'delivery') {
                reason = 'Error general de entrega';
            } else if (failureObject.type === 'window') {
                reason = 'Fuera de la ventana de 24 horas';
            }

            return (
                <Tooltip content={`Fallo en la entrega: ${reason}`} placement="top">
                    <div className="bg-red-100 p-1.5 rounded-full shadow-md flex items-center justify-center">
                        <ExclamationCircleIcon className="w-6 h-6 text-red-600" />
                    </div>
                </Tooltip>
            );
        }

        if (ack.readByRecipient) return (
            <Tooltip content="Mensaje leído por el destinatario" placement="top">
                <div className="bg-blue-100 p-1.5 rounded-full shadow-md flex items-center justify-center">
                    <DoubleCheckIcon className="w-6 h-6 text-blue-600" />
                </div>
            </Tooltip>
        );
        if (ack.deliveryToRecipient) return (
            <Tooltip content="Mensaje entregado al dispositivo del destinatario" placement="top">
                <div className="bg-gray-100 p-1.5 rounded-full shadow-md flex items-center justify-center">
                    <DoubleCheckIcon className="w-6 h-6 text-gray-700" />
                </div>
            </Tooltip>
        );
        if (ack.deliveryToServers || ack.sent) return (
            <Tooltip content="Mensaje enviado al servidor" placement="top">
                <div className="bg-gray-100 p-1.5 rounded-full shadow-md flex items-center justify-center">
                    <CheckIcon className="w-6 h-6 text-gray-700" />
                </div>
            </Tooltip>
        );
        if (ack.enqueued) return (
            <Tooltip content="Mensaje en cola para ser enviado" placement="top">
                <div className="bg-gray-100 p-1.5 rounded-full shadow-md flex items-center justify-center">
                    <ClockIcon className="w-6 h-6 text-gray-700" />
                </div>
            </Tooltip>
        );
        
        // Si llegamos aquí, no se reconoció ningún estado específico
        // Mostramos un reloj como estado predeterminado
        return (
            <Tooltip content="Mensaje no enviado, vuelve a intentar" placement="top">
                <div className="bg-gray-100 p-1.5 rounded-full shadow-md flex items-center justify-center">
                    <ClockIcon className="w-6 h-6 text-gray-700" />
                </div>
            </Tooltip>
        );
    };

    const generateButtons = (botones) => {
        
        if (botones && botones.length > 0) {

            return (
                <div className='botones-container'>
                
                        {botones.map((boton) => (
                            <Button  color='gray' key={boton.reply.id}>{boton.reply.title}</Button>
                        ))}
                    
                </div>
            );
        } else {
            return '';
        }

    }

    const responseButton = (id, text) => { //response from the client
        console.log(text)

        if (text && text.length > 0) {

            return (
            <div className='botones-container'>
                <Button  color='green' key={id}>{text}</Button>
            </div>
            );
        }
    };

    // Get all reactions for a message with user info
    const getReaction = (reaction) => {
        if (!reaction) return null;
        
        // If it's an array, process as before
        if (Array.isArray(reaction)) {
            // Group reactions by emoji
            return reaction.reduce((acc, r) => {
                if (!r?.event) return acc;
                if (!acc[r.event]) {
                    acc[r.event] = [];
                }
                const userName = r.userName || 'Usuario';
                if (!acc[r.event].includes(userName)) {
                    acc[r.event].push(userName);
                }
                return acc;
            }, {});
        } 
        // If it's an object, it might be a single reaction from agent
        else if (typeof reaction === 'object' && reaction !== null) {
            if (reaction.event) {
                return { [reaction.event]: ['Agente'] };
            }
        }
        
        return null;
    };

    const getRepliedMessage = (id, allMessages, contact) => {
        if (!id || !allMessages) return null;
        const originalMsg = allMessages.find(m => m.externalId === id);
        if (!originalMsg) return <Snippet size="sm" color="warning">Mensaje no disponible</Snippet>;

        const renderPreview = () => {
            switch (originalMsg.class) {
                case 'text':
                case 'buttonreply':
                case 'interactive':
                case 'button':
                    return (
                        <p className="whitespace-pre-wrap break-words" style={{ fontSize: textSizeValue }}>
                            {highlight ? highlightText(originalMsg.content, highlight) : originalMsg.content}
                        </p>
                    );
                case 'image':
                    return (
                        <a href={originalMsg.content} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                            <Image src={originalMsg.content} width={40} height={40} alt="Imagen respondida" className="rounded-md object-cover" />
                            <span className="text-sm italic text-current">{originalMsg.caption || 'Imagen'}</span>
                        </a>
                    );
                case 'document':
                case 'video':
                case 'audio':
                    const iconMap = {
                        document: <PaperclipIcon className="w-5 h-5 text-gray-500" />,
                        audio: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" /></svg>,
                        video: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm14.553 1.106a1 1 0 00-1.447.894L15 8v4l.106.001a1 1 0 001.447-.894l2-4A1 1 0 0017.553 6L15.553 7.106z" /></svg>
                    };
                    const textMap = {
                        document: 'Documento',
                        audio: 'Mensaje de voz',
                        video: 'Video'
                    };
                    return (
                        <a href={originalMsg.content} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                            {iconMap[originalMsg.class]}
                            <span className="text-sm italic text-current">{originalMsg.caption || textMap[originalMsg.class]}</span>
                        </a>
                    );
                case 'location':
                     return (
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                            <span className="text-sm italic">Ubicación</span>
                        </div>
                    );
                default:
                    return <p className="text-sm italic">[{originalMsg.class}]</p>;
            }
        };

        return (
            <div className="bg-black/10 p-2 rounded-lg mb-2 border-l-2 border-primary cursor-pointer">
                <p className="text-xs font-bold">{originalMsg.direction === 'out' ? getNameAuthor(originalMsg.origin) : (contact?.aliasId || contact?.name || contact?.alias || 'Desconocido')}</p>
                {renderPreview()}
            </div>
        );
    };

    // const getResponseFrom = (id) => {
    //     if (!allMsg) {
    //         return <Snippet color="warning" size="sm">El mensaje referenciado no se pudo recuperar.</Snippet>;
    //     }

    //     const originaMsg = allMsg.find((x) => x.externalId === id);

    //     if (!originaMsg) {
    //         return <Snippet color="warning" size="sm">El mensaje referenciado no se encuentra en este folio.</Snippet>;
    //     }

    //     switch (originaMsg.class) {
    //         case 'text':
    //         case 'buttonreply':
    //             return <p className="text-sm italic">{originaMsg.content}</p>;
            
    //         case 'image':
    //             return <Image src={originaMsg.content} width={80} height={80} alt="Imagen respondida" className="rounded-md object-cover" />;
            
    //         case 'audio':
    //             return <AudioPlayer src={originaMsg.content} minimal />;

    //         case 'video':
    //             return <video controls src={originaMsg.content} className="w-full max-w-xs rounded-md" />;

    //         case 'document':
    //             return (
    //                 <a href={originaMsg.content} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
    //                     <PaperclipIcon className="w-4 h-4" />
    //                     <span>{originaMsg.caption || 'Ver Archivo Adjunto'}</span>
    //                 </a>
    //             );

    //         case 'location':
    //             const isValidCoordinate = (coord) => {
    //                 if (typeof coord !== 'string') return false;
    //                 const [lat, lng] = coord.split(',').map(Number);
    //                 return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    //             };

    //             if (!isValidCoordinate(originaMsg.content)) {
    //                 return (
    //                     <Snippet color="danger" size="sm" className="w-full">
    //                         Ubicación no válida
    //                     </Snippet>
    //                 );
    //             }

    //             const [lat, lng] = originaMsg.content.split(',');
    //             return <MapPreview lat={lat} lng={lng} />;

    //         default:
    //             return <Snippet size="sm">[Tipo de mensaje no soportado: {originaMsg.class}]</Snippet>;
    //     }
    // };

    // const getResponseTo = (id) => {
    //     if (!allMsg) {
    //         return <Snippet color="warning" size="sm">El mensaje referenciado no se pudo recuperar.</Snippet>;
    //     }

    //     const originaMsg = allMsg.find((x) => x.externalId === id);

    //     if (!originaMsg) {
    //         return <Snippet color="warning" size="sm">El mensaje referenciado no se encuentra en este folio.</Snippet>;
    //     }

    //     switch (originaMsg.class) {
    //         case 'text':
    //             return <p className="text-sm italic">{originaMsg.content}</p>;

    //         case 'image':
    //             return <Image src={originaMsg.content} width={80} height={80} alt="Imagen respondida" className="rounded-md object-cover" />;

    //         case 'audio':
    //             return <AudioPlayer src={originaMsg.content} minimal />;

    //         case 'video':
    //             return <video controls src={originaMsg.content} className="w-full max-w-xs rounded-md" />;

    //         case 'document':
    //             return (
    //                 <a href={originaMsg.content} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
    //                     <PaperclipIcon className="w-4 h-4" />
    //                     <span>{originaMsg.caption || 'Ver Archivo Adjunto'}</span>
    //                 </a>
    //             );

    //         case 'location':
    //             const [lat, lng] = originaMsg.content.split(',');
    //             return <MapPreview lat={lat} lng={lng} />;

    //         default:
    //             return <Snippet size="sm">[Tipo de mensaje no soportado: {originaMsg.class}]</Snippet>;
    //     }
    // };

    const renderContent = (msg) => {
        const repliedToId = msg.direction === 'out' ? msg.responseTo : msg.responseFromId;
        const repliedMessage = getRepliedMessage(repliedToId, allMsg, contact);

        const mainContent = (() => {
            switch (msg.class) {
                case 'text':
                    return (
                        <div className="whitespace-pre-wrap break-words" style={{ fontSize: textSizeValue }}>
                            {highlight 
                                ? highlightText(msg.content, highlight) 
                                : msg.content
                            }
                        </div>
                    );
                case 'interactive':
                case 'buttonreply':
                case 'button':
                    return (
                        <div className="flex flex-col gap-2">
                            <div className="whitespace-pre-wrap break-words" style={{ fontSize: textSizeValue }}>
                                {highlight ? highlightText(msg.content, highlight) : msg.content}
                            </div>
                            {msg.class === 'buttonreply' && msg.interaction && generateButtons(msg.interaction)}
                            {msg.class === 'button' && responseButton(msg.externalId, msg.content)}
                            {msg.class === 'interactive' && <Button  color='primary' key={msg._id}>{msg.content}</Button>}
                        </div>
                    );
    
                case 'mtm':
                    return (
                        <div>
                            <p className="font-bold text-sm">
                                Plantilla: {highlight ? highlightText(msg.content, highlight) : msg.content}
                            </p>
                            {msg.caption && <p className="text-sm mt-1">{msg.caption}</p>}
                        </div>
                    );
                case 'image':
                case 'sticker':
                    return (
                        <Card className="border-none w-full h-[300px] group relative overflow-hidden">
                            <a 
                                href={msg.content} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block w-full h-full"
                            >
                                <Image 
                                    removeWrapper 
                                    alt={msg.caption || 'Imagen'} 
                                    className="z-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                    src={msg.content} 
                                />
                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    <div className="bg-black/50 text-white rounded-full p-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </div>
                                </div>
                            </a>
                            {msg.caption && (
                                <CardFooter className="absolute bg-black/40 bottom-0 z-10 border-t-1 border-default-600 dark:border-default-100 w-full">
                                    <p className="text-tiny text-white/80">
                                        {highlight && msg.caption 
                                            ? highlightText(msg.caption, highlight) 
                                            : msg.caption
                                        }
                                    </p>
                                </CardFooter>
                            )}
                        </Card>
                    );
                case 'video':
                case 'externalAttachment':
                    return <video controls src={msg.content} className="rounded-lg max-w-full" />;
                case 'audio':
                case 'voice':
                case 'ptt':
                case 'call':
                    return <AudioPlayer src={msg.callRecordUrl || msg.content} />;
                case 'document':
                    try {
                        let alternateUrl = '';
                        let showAlternateUrl = false;
                        if (msg.originalUrl) {
                            alternateUrl = msg.originalUrl;
                            showAlternateUrl = !isOutgoing && msg.content !== alternateUrl;
                        } else {
                            alternateUrl = convertirURL(msg.content);
                            const hasExtension = typeof msg.content === 'string' && /\.[^/.]+$/.test(msg.content);
                            showAlternateUrl = !isOutgoing && msg.content !== alternateUrl && hasExtension;
                        }
                        return (
                            <div className="space-y-3 w-full">
                                <Card shadow="sm" className="w-full">
                                    <CardBody className="flex flex-row items-center gap-3 p-3">
                                        <PaperclipIcon className="w-8 h-8 text-gray-500" />
                                        <div className="flex-grow min-w-0">
                                            <p className="text-sm font-semibold truncate">
                                                {highlight && msg.caption
                                                    ? highlightText(msg.caption, highlight)
                                                    : (msg.caption || 'Archivo adjunto')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button isIconOnly as="a" href={msg.content} target="_blank" download variant="light">
                                                <DownloadIcon className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </CardBody>
                                </Card>

                                {showAlternateUrl && (
                                    <Card shadow="sm" className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                        <CardBody className="p-2">
                                            <div className="flex items-center gap-2">
                                                <ExternalLinkIcon className="w-4 h-4 text-gray-500" />
                                                <p className="text-xs text-gray-700 dark:text-gray-300 flex-grow truncate">
                                                    <a href={alternateUrl} target="_blank" rel="noopener noreferrer" className="hover:underline" title={alternateUrl}>
                                                        {truncateMiddle(alternateUrl, 40)}
                                                    </a>
                                                </p>
                                            </div>
                                        </CardBody>
                                    </Card>
                                )}
                            </div>
                        );
                    } catch (error) {
                        console.error("Error rendering document message:", error);
                        return (
                            <div className="flex items-center gap-2 text-red-500">
                                <ExclamationCircleIcon className="w-5 h-5" />
                                <span>Error al mostrar documento</span>
                            </div>
                        );
                    }
                case 'location':
                    // Validar que el contenido sea una coordenada válida
                    const isValidCoordinate = (coord) => {
                        if (typeof coord !== 'string') return false;
                        const [lat, lng] = coord.split(',').map(Number);
                        return !isNaN(lat) && !isNaN(lng) && 
                               lat >= -90 && lat <= 90 && 
                               lng >= -180 && lng <= 180;
                    };

                    if (!isValidCoordinate(msg.content)) {
                        return (
                            <Snippet color="warning" className="w-full">
                                Ubicación no válida: {String(msg.content).substring(0, 30)}{String(msg.content).length > 30 ? '...' : ''}
                            </Snippet>
                        );
                    }

                    const [lat, lng] = msg.content.split(',');
                    return <MapPreview lat={lat} lng={lng} />;
                case 'notify':
                    return <Snippet color="danger" className="w-full">{msg.content}</Snippet>;
                case 'notify-success':
                    return <Snippet color="success" className="w-full">{msg.content}</Snippet>;
                case 'html':
                    return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: msg.content }} />;
                case 'contacts':
                    try {
                        // Parse the content if it's a string, otherwise use as is
                        const content = typeof msg.content === 'string' 
                            ? JSON.parse(msg.content || '[]')
                            : msg.content;
                        
                        // Normalize to array and transform to match our expected format
                        const vcardData = (Array.isArray(content) ? content : [content]).map(contact => ({
                            name: contact.name?.formatted_name || contact.name?.first_name || 'Contacto sin nombre',
                            tel: (contact.phones || []).map(phone => ({
                                type: phone.type || 'CELL',
                                number: phone.phone
                            })),
                            // Add other fields as needed, mapping from the input format
                            ...(contact.emails && { 
                                email: contact.emails.map(email => ({
                                    type: email.type || 'WORK',
                                    address: email.email
                                }))
                            }),
                            ...(contact.addresses && {
                                address: contact.addresses.map(addr => ({
                                    street: addr.street,
                                    city: addr.city,
                                    region: addr.region,
                                    postalCode: addr.postal_code,
                                    country: addr.country
                                }))
                            })
                        }));
                        
                        return <ContactsRender contacts={vcardData} />;
                    } catch (error) {
                        console.error('Error rendering vCard:', error);
                        return <Snippet color="warning" className="w-full">[Error al mostrar la tarjeta de contacto]</Snippet>;
                    }
                    
                default:
                    return <Snippet color="warning" className="w-full">[Tipo de mensaje no soportado: {msg.class}]</Snippet>;
            }
        })();

        return <div>{repliedMessage}{mainContent}</div>;
    };

    // Aseguramos que authorName siempre tenga un valor válido para evitar errores con charAt
    const authorName = isOutgoing 
        ? (getNameAuthor(message.origin) || 'Agente') 
        : (contact?.aliasId || contact?.name || contact?.alias || 'Desconocido');

    const messageTime = moment(message.createdAt).format('DD/MM/YY h:mm a');
    const ackStatus = getAck(message.ack);
    const reactions = getReaction(message.reaction);

    return (
        <div 
            id={`message-${message._id}`}
            key={message._id} 
            className={`flex items-start gap-2.5 my-2 ${isOutgoing ? 'flex-row-reverse' : ''}`}
        >
            {isOutgoing ? (
                <div className="flex flex-col items-center">
                    <Avatar
                        src={message.origin?.agent?.profilePic}
                        name={authorName ? authorName.charAt(0) : 'A'}
                        size="sm"
                        className="mt-1 flex-shrink-0"
                    />
                    <div className="mt-2">
                        {ackStatus}
                    </div>
                </div>
            ) : (
                <Avatar
                    src={contact?.profilePic || message.origin?.profilePic}
                    name={authorName ? authorName.charAt(0) : 'U'}
                    size="sm"
                    className="mt-1 flex-shrink-0"
                />
            )}
            <div className={`flex flex-col w-full max-w-md ${isOutgoing ? 'items-end' : 'items-start'}`}>
                <div className="group relative flex flex-col gap-1">
                    <div className={`w-fit rounded-xl px-3 py-2 ${isOutgoing ? 'bg-green-200 text-black rounded-br-none' : 'bg-content2 text-content2-foreground rounded-bl-none'}`}>
                        <p className={`text-xs font-bold mb-1 ${isOutgoing ? 'text-right text-black/90' : 'text-primary'}`}>{authorName}</p>
                        {renderContent(message)}
                    </div>
                    {reactions && (
                        <div className={`absolute bottom-[-10px] flex gap-1 ${isOutgoing ? 'left-2' : 'right-2'}`}>
                            {Object.entries(reactions).map(([emoji, users], index) => {
                                const userList = users.join('\n');
                                return (
                                    <Tooltip 
                                        key={index} 
                                        content={
                                            <div className="max-w-xs">
                                                <p className="font-semibold">{emoji} {users.length} {users.length === 1 ? 'reacción' : 'reacciones'}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{userList}</p>
                                            </div>
                                        }
                                        placement="top"
                                        showArrow
                                    >
                                        <div className="bg-background p-0.5 rounded-full text-lg shadow hover:scale-110 transition-transform cursor-default">
                                            {emoji}
                                        </div>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    )}
                    {!isOutgoing && (
                        <div className="absolute top-0 right-[-40px] opacity-0 group-hover:opacity-100 transition-opacity">
                            <Dropdown placement="bottom-end">
                                <DropdownTrigger>
                                    <Button isIconOnly size="sm" variant="light" className="react-dropdown-trigger">...</Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="Message Actions" disabledKeys={["react"]}>
                                    <DropdownItem key="reply" startContent={<ReplyIcon className="w-4 h-4"/>} onPress={() => responseToMessage(message._id)}>Responder</DropdownItem>
                                    <DropdownItem 
                                        key="react" 
                                        startContent={<SmileIcon className="w-4 h-4"/>}
                                        onPress={(e) => {
                                            // Close the dropdown first
                                            const dropdownTrigger = e.target.closest('.react-dropdown-trigger') || 
                                                                 document.querySelector('.react-dropdown-trigger');
                                            if (dropdownTrigger) {
                                                dropdownTrigger.click();
                                            }
                                            
                                            // Check if there's already a picker and remove it
                                            const existingPicker = document.querySelector('.emoji-picker-container');
                                            if (existingPicker) {
                                                document.body.removeChild(existingPicker);
                                            }
                                            
                                            // Create a new picker
                                            const picker = document.createElement('div');
                                            picker.className = 'emoji-picker-container fixed z-50 bg-content1 rounded-lg shadow-lg p-2';
                                            
                                            // Position the picker near the message
                                            const rect = e.target.getBoundingClientRect();
                                            picker.style.top = `${rect.bottom + window.scrollY}px`;
                                            picker.style.left = `${rect.left + window.scrollX}px`;
                                            
                                            // Create emoji buttons
                                            const emojiPicker = document.createElement('div');
                                            emojiPicker.className = 'flex flex-wrap gap-1 w-48';
                                            
                                            REACTIONS.forEach((emoji) => {
                                                const btn = document.createElement('button');
                                                btn.className = 'text-xl hover:scale-125 transition-transform p-1';
                                                btn.textContent = emoji;
                                                btn.onclick = (clickEvent) => {
                                                    clickEvent.stopPropagation();
                                                    reactToMessage(message.externalId, emoji);
                                                    if (document.body.contains(picker)) {
                                                        document.body.removeChild(picker);
                                                    }
                                                };
                                                emojiPicker.appendChild(btn);
                                            });
                                            
                                            picker.appendChild(emojiPicker);
                                            document.body.appendChild(picker);
                                            
                                            // Close picker when clicking outside
                                            const closePicker = (clickEvent) => {
                                                if (picker && document.body.contains(picker) && !picker.contains(clickEvent.target)) {
                                                    document.body.removeChild(picker);
                                                    document.removeEventListener('click', closePicker);
                                                }
                                            };
                                            
                                            // Add a small delay to avoid immediate closing
                                            setTimeout(() => {
                                                document.addEventListener('click', closePicker);
                                            }, 50);
                                            
                                            // Clean up on unmount
                                            return () => {
                                                if (document.body.contains(picker)) {
                                                    document.body.removeChild(picker);
                                                }
                                                document.removeEventListener('click', closePicker);
                                            };
                                        }}
                                    >
                                        Reaccionar
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        </div>
                    )}
                </div>
                                <div className="flex justify-end mt-1 text-xs text-foreground-500">
                    <span>{messageTime}</span>
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;