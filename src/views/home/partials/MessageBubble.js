import React from 'react';
import moment from 'moment';
import { Avatar, Button, Card, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Image, Snippet, Tooltip, CardBody, CardFooter } from '@heroui/react';

// --- SVG Icons ---
const PaperclipIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.122 2.122l7.81-7.81" /></svg>;
const DownloadIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const ReplyIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>;
const SmileIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ClockIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ExclamationCircleIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>;


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

const MessageBubble = ({ message, responseToMessage, reactToMessage, allMsg, contact }) => {

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
            <div className="bg-blue-100 p-1.5 rounded-full shadow-md flex items-center justify-center">
                <DoubleCheckIcon className="w-6 h-6 text-blue-600" />
            </div>
        );
        if (ack.deliveryToRecipient) return (
            <div className="bg-gray-100 p-1.5 rounded-full shadow-md flex items-center justify-center">
                <DoubleCheckIcon className="w-6 h-6 text-gray-700" />
            </div>
        );
        if (ack.deliveryToServers || ack.sent) return (
            <div className="bg-gray-100 p-1.5 rounded-full shadow-md flex items-center justify-center">
                <CheckIcon className="w-6 h-6 text-gray-700" />
            </div>
        );
        if (ack.enqueued) return (
            <div className="bg-gray-100 p-1.5 rounded-full shadow-md flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-gray-700" />
            </div>
        );
        
        // Si llegamos aquí, no se reconoció ningún estado específico
        // Mostramos un reloj como estado predeterminado
        return (
            <div className="bg-gray-100 p-1.5 rounded-full shadow-md flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-gray-700" />
            </div>
        );
    };

    const getReaction = (reaction) => {
        if (!reaction || reaction.length === 0) return null;
        const lastEvent = reaction[reaction.length - 1];
        return lastEvent ? lastEvent.event : null;
    };

    const getRepliedMessage = (id, allMessages, contact) => {
        if (!id || !allMessages) return null;
        const originalMsg = allMessages.find(m => m.externalId === id);
        if (!originalMsg) return <Snippet size="sm" color="warning">Mensaje no disponible</Snippet>;

        let contentPreview = originalMsg.content;
        if (originalMsg.class !== 'text') {
            contentPreview = `[${originalMsg.class}]`;
        }

        return (
            <div className="bg-black/10 p-2 rounded-lg mb-2 border-l-2 border-primary">
                <p className="text-xs font-bold">{originalMsg.direction === 'out' ? getNameAuthor(originalMsg.origin) : (contact?.aliasId || contact?.name || contact?.alias || 'Desconocido')}</p>
                <p className="text-sm truncate">{contentPreview}</p>
            </div>
        );
    };

    const renderContent = (msg) => {
        const repliedToId = msg.direction === 'out' ? msg.responseTo : msg.responseFromId;
        const repliedMessage = getRepliedMessage(repliedToId, allMsg, contact);

        const mainContent = (() => {
            switch (msg.class) {
                case 'text':
                case 'interactive':
                case 'button':
                case 'buttonreply':
                    return (
                        <div className="whitespace-pre-wrap break-words">
                            {msg.content}
                        </div>
                    );
                case 'mtm':
                    return (
                        <div>
                            <p className="font-bold text-sm">Plantilla: {msg.content}</p>
                            {msg.caption && <p className="text-sm mt-1">{msg.caption}</p>}
                        </div>
                    );
                case 'image':
                case 'sticker':
                    return (
                        <Card isPressable isFooterBlurred className="border-none w-full h-[300px]">
                            <Image removeWrapper alt={msg.caption || 'Imagen'} className="z-0 w-full h-full object-cover" src={msg.content} />
                            {msg.caption && (
                                <CardFooter className="absolute bg-black/40 bottom-0 z-10 border-t-1 border-default-600 dark:border-default-100">
                                    <p className="text-tiny text-white/80">{msg.caption}</p>
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
                    return <audio controls src={msg.callRecordUrl || msg.content} className="w-full" />;
                case 'document':
                    return (
                        <Card shadow="sm" className="w-full">
                            <CardBody className="flex flex-row items-center gap-3 p-3">
                                <PaperclipIcon className="w-8 h-8 text-gray-500" />
                                <div className="flex-grow">
                                    <p className="text-sm font-semibold truncate">{msg.caption || 'Archivo adjunto'}</p>
                                </div>
                                <Button isIconOnly as="a" href={msg.content} target="_blank" download variant="light">
                                    <DownloadIcon className="w-5 h-5" />
                                </Button>
                            </CardBody>
                        </Card>
                    );
                case 'location':
                    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${msg.content}&zoom=16&size=400x400&key=${process.env.REACT_APP_MAPS_APIKEY}&markers=purple|${msg.content}`;
                    return (
                        <Card isPressable onPress={() => window.open(`https://www.google.com/maps/search/?api=1&query=${msg.content}`, '_blank')}>
                            <Image removeWrapper src={mapUrl} alt="Ubicación" className="w-full h-auto object-cover" />
                        </Card>
                    );
                case 'notify':
                    return <Snippet color="danger" className="w-full">{msg.content}</Snippet>;
                case 'notify-success':
                    return <Snippet color="success" className="w-full">{msg.content}</Snippet>;
                case 'html':
                    return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: msg.content }} />;
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
    const reaction = getReaction(message.reaction);

    return (
        <div className={`flex items-start gap-2.5 my-2 ${isOutgoing ? 'flex-row-reverse' : ''}`}>
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
                    <div className={`w-fit rounded-xl px-3 py-2 ${isOutgoing ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-content2 text-content2-foreground rounded-bl-none'}`}>
                        <p className={`text-xs font-bold mb-1 ${isOutgoing ? 'text-right text-primary-foreground/80' : 'text-primary'}`}>{authorName}</p>
                        {renderContent(message)}
                    </div>
                    {reaction && (
                        <div className="absolute bottom-[-10px] right-2 bg-background p-0.5 rounded-full text-lg shadow">{reaction}</div>
                    )}
                    {!isOutgoing && (
                        <div className="absolute top-0 right-[-40px] opacity-0 group-hover:opacity-100 transition-opacity">
                            <Dropdown placement="bottom-end">
                                <DropdownTrigger>
                                    <Button isIconOnly size="sm" variant="light">...</Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="Message Actions">
                                    <DropdownItem key="reply" startContent={<ReplyIcon className="w-4 h-4"/>} onPress={() => responseToMessage(message._id)}>Responder</DropdownItem>
                                    <DropdownItem key="react" startContent={<SmileIcon className="w-4 h-4"/>} onPress={() => reactToMessage(message.externalId)}>Reaccionar</DropdownItem>
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