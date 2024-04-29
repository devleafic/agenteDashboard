import { useRef, useEffect, useState } from 'react';
import {Dropdown, Icon, Image, Label} from 'semantic-ui-react';
import { useSocket } from '../../../controladores/InternalChatContext';
import moment from 'moment';
moment.locale('es');

export default function BubbleIternalChat({infoChat, msg, userInfo, readMessage}) {

    const {socket, inboxList} = useSocket();

    const messageRef = useRef(null);

    const sendReaction = (e, { name, value }) => {
        console.log({ name, value });
        console.log('leyendo');
        socket.emit('sendReaction', {reaction : value, token: window.localStorage.getItem('sdToken'), chatId : infoChat._id, messageId : msg._id}, (data) => {
            console.log('Reacción enviada y recibida por el servidor');
        });
    }

    const renderAndCountReactions = (idMsg, reactions, direcction) => {
        const reactionCount = {};
        reactions.forEach((reaction) => {
            if(reactionCount[reaction.emoji]){
                reactionCount[reaction.emoji] += 1;
            }else{
                reactionCount[reaction.emoji] = 1;
            }
        });

        return <div style={{display:'flex', justifyContent: direcction === 'left' ? 'end' : 'start'}}>{Object.keys(reactionCount).map((reaction, index) => {
            return <div key={idMsg+'-'+reaction+'-'+index} style={{padding:10}}>{reaction} {reactionCount[reaction]}</div>
        })}</div>;
    
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
                return (<a target='blank' href={content}>Documento - <Icon name='folder open outline'></Icon></a>);
            case 'image':
               return (<div className="internal-chat-message" ><a href={content} target='_blank'><Image style={{borderRadius: '8px'}} size='medium' src={content}/></a></div>);
            case 'sticker':
                return (<><a href={content} target='_blank'><Image src={content} style={{borderRadius: '8px'}} size='small' /></a></>);
            case 'video':
                return (<video controls><source src={content} type='video/mp4' style={{borderRadius: '8px' }}  reload='auto'/></video>)
            case 'voice':
                return (<audio controls >   
                    <source src={content} type='audio/ogg' />   
                    <source src={content} type='audio/mpeg' />   
                </audio> )
            case 'call':   
            return (  (<audio controls >   
                <source src={content} type='audio/ogg' />   
                <source src={content} type='audio/mpeg' />   
            </audio>) )                 
            case 'externalAttachment' :
                return (<video controls><source src={content} type='video/mp4' style={{borderRadius: '15px' }}  reload='auto'/></video>)
            case 'notify':
                return <Label color="red"> <Icon name='x' />{content}<Label.Detail>FINALIZAR LA CONVERSACIÓN</Label.Detail></Label>          
            case 'errors':
                return (<>[{type}] - {content}</>);      
            default:
                return (<>[La clase {type} no esta soportada] - {content}</>);
        }
    }
  return (<>
    <div key={msg._id} className={userInfo._id !== msg.createdBy ? 'internal-chat-received' : 
                                                                'internal-chat-sent'} ref={messageRef} data-message-id={msg._id}>
                                                                {convertContent(msg)}
        {/*<div className="internal-chat-message" dangerouslySetInnerHTML={{ __html: formatMessage(msg.message) }}></div>*/}
        {userInfo._id !== msg.createdBy && !infoChat.isPrivate && <div style={{marginLeft:'5px'}}><div><Icon color='blue' name='user'/>{userInfo.profile.name}</div></div>}
        {userInfo._id === msg.createdBy && infoChat.isPrivate && (msg.readers.length > 1) && <div style={{marginRight:'5px'}}><div><Icon color='blue' name='check'/><Icon  color='blue'  name='check'/></div></div>}
        <div>
            {
                renderAndCountReactions(msg._id,msg.reactions, userInfo._id !== msg.createdBy ? 'right' : 'left')
            }
        </div>
        <Dropdown  style={{padding : 2, marginRight: 5}} text={moment(msg.createdAt).format('lll')+' 💬'} onChange={sendReaction} options={[
            {key : msg._id+'-'+Math.floor(Math.random() * 101)+'-emoji-0', text : '🙂', value : '🙂'},
            {key : msg._id+'-'+Math.floor(Math.random() * 101)+'-emoji-1', text : '🤔', value : '🤔'},
            {key : msg._id+'-'+Math.floor(Math.random() * 101)+'-emoji-2', text : '😡', value : '😡'},
            {key : msg._id+'-'+Math.floor(Math.random() * 101)+'-emoji-3', text : '😳', value : '😳'},
            {key : msg._id+'-'+Math.floor(Math.random() * 101)+'-emoji-4', text : '👍', value : '👍'},
            {key : msg._id+'-'+Math.floor(Math.random() * 101)+'-emoji-5', text : '👎', value : '👎'},
        ]} name='reaction'/>
    </div>
    </>)
}