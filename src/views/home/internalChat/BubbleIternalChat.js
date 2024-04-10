import { useRef, useEffect, useState } from 'react';
import {Dropdown} from 'semantic-ui-react';
import { useSocket } from '../../../controladores/InternalChatContext';

export default function BubbleIternalChat({infoChat, msg, userInfo, readMessage}) {

    const {socket, inboxList} = useSocket();

    const isReaderForMe = msg.readers.find((x) => {
        return x.user === userInfo._id;
    });
    const messageRef = useRef(null);

    const sendReaction = (e, { name, value }) => {
        console.log({ name, value });
        socket.emit('sendReaction', {reaction : value, token: window.localStorage.getItem('sdToken'), chatId : infoChat._id, messageId : msg._id}, (data) => {
            console.log('Reacción enviada y recibida por el servidor');
        });
    }

    const renderAndCountReactions = (reactions, direcction) => {
        const reactionCount = {};
        reactions.forEach((reaction) => {
            if(reactionCount[reaction.emoji]){
                reactionCount[reaction.emoji] += 1;
            }else{
                reactionCount[reaction.emoji] = 1;
            }
        });

        return <div style={{display:'flex', justifyContent: direcction === 'left' ? 'end' : 'start'}}>{Object.keys(reactionCount).map((reaction) => {
            return <div key={reaction} style={{marginRight:5}}>{reaction} {reactionCount[reaction]}</div>
        })}</div>;
    
    }

    useEffect(() => {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.5
        };

        const callback = (entries) => {
            entries.forEach(entry => {
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


  return (<>
    <div key={msg._id} className={userInfo._id !== msg.createdBy ? 'internal-chat-received' : 'internal-chat-sent'} ref={messageRef} data-message-id={msg._id}>
        <div className="message" dangerouslySetInnerHTML={{ __html: formatMessage(msg.message) }}></div>
        {userInfo._id === msg.createdBy && (msg.readers.length > 1) && <div>Leido</div>}
        <div>
            {
                renderAndCountReactions(msg.reactions, userInfo._id !== msg.createdBy ? 'right' : 'left')
            }
        </div>
        <Dropdown text='Reaccionar' onChange={sendReaction} options={[
            {key : 'emoji-1', text : '🤔', value : '🤔'},
            {key : 'emoji-2', text : '😁', value : '😁'},
            {key : 'emoji-3', text : '👍', value : '👍'},
        ]} name='reaction'/>
    </div>
    </>)
}