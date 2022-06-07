import moment from 'moment';
import { Image, Icon } from 'semantic-ui-react';

const Message = ({message}) => {

    const convertContent = (msg) => {
        const type = msg.class;
        const content = msg.content;
        const caption = msg.caption;

        switch(type){
            case 'text':
                return (<div style={{whiteSpace:'pre-line'}}>{content}</div>);
            case 'document':
                return (<a target='blank' href={content}><Icon name='folder open'></Icon>{caption ? caption : ' Abrir Archivo'}</a>);
            case 'image':
               return (<><a href={content} target='_blank'><Image src={content} size='medium' />{caption && <p >{caption}</p>}</a></>);
            case 'sticker':
                return (<><a href={content} target='_blank'><Image src={content} size='small' />{caption && <p >{caption}</p>}</a></>);
            case 'video':
                return (<video controls><source src={content} type='video/mp4' reload='auto'/></video>)
            case 'location':
                const apikeyMAP = 'AIzaSyAEGyCAtnDP9muoGUr2gJm04cW6XD2dbAA';
                return (<><Image src={'https://maps.googleapis.com/maps/api/staticmap?center='+content+'&zoom=16&size=400x400&key='+apikeyMAP+'&markers=purple|'+content} /> {caption && <div style={{marginTop:15,marginBottom:15}}>{caption}</div>}</>);
            case 'ptt':
            case 'audio':
            case 'voice':
                return (<audio controls><source src={content} type='audio/ogg'/></audio>)
            case 'errors':
                return (<>[{type}] - {content}</>);      
            default:
                return (<>[Class {type} undefined] - {content}</>);
        }
    }
    
    const getNameAuthor = (element) => {
        if(!element){return '';}
        
        return element.agent ? element.agent.user 
            : (element.sys ? element.sys : '');
    }


    return ( <>
    {
        message.direction === 'out' ? (<><div key={message._id}>
            <div style={{float:'right'}}>
                <p className='from-me'>{convertContent(message)}</p>
            </div>
        </div>
        <p className='from-me-meta'>{moment(message.createdAt).fromNow()} <br/> {getNameAuthor(message.origin)}</p>
        </>) : (<div key={message._id}>
            <p className='from-them'>{convertContent(message)}</p>
            <p className='from-them-meta'>{moment(message.createdAt).fromNow()}</p>
        </div>)
    }
    </> );
}
 
export default Message;