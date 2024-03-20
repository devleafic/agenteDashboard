import moment from 'moment';
import { Image, Icon, Dropdown, Label , Divider, Message,  ListItem, ListIcon, ListContent, List } from 'semantic-ui-react';

const Mail = ({message, responseToMessage, reactToMessage, allMsg, typeFolio}) => {

    // const equivalenciasAck = {
    //     'deliveryToServers' : 'Enviado',
    //     'deliveryToRecipeint' : 'Entregado',
    //     'readByRecipeint' : 'Leído'
    // }

    const equivalenciasAck = {
        'deliveryToServers' : <Icon name='telegram plane'/>,
        'deliveryToRecipient' : <div><Icon name='check'/>  <Icon name='check'/></div>,
        'readByRecipient' :    <div><Icon color='blue' name='check'/><Icon  color='blue'  name='check'/></div>,
        'failedDelivery' : 'Sin enviar',
        'failedOutofWindows' : 'Sin enviar. Han pasado más de 24 horas desde el cliente ha enviado el mensaje. Usa una plantilla para contactar al cliente.',
        'rejectedByAPI' : 'Sin enviar. El mensaje fue rechazado por el API.',
        'accepted' : 'Mensaje aceptado',
        'pending' : 'Pendiente de envio',
        'opened' : 'Mensaje fue abierto',
        'unknown' : 'Se desconece el estado del mensaje',
    }

    const getResponseTo = (id) => {
        if (!allMsg) {
            let nocontent = "El mensaje referenciado no se pudo recuperar o no se encuentra e el folio en curso"
            return    <Label style={{background : '#0b93f6'}}>{nocontent}</Label> 
        }
        let originaMsg = allMsg.find((x) => {
            return x.externalId === id;
        })
        if (!originaMsg){
            let nocontent = "El mensaje referenciado no se pudo recuperar o no se encuentra e el folio en curso"
            return    <Label style={{background : '#0b93f6'}}>{nocontent}</Label> 
        } else{
            switch(originaMsg.class){
                case 'text':
                    return  <Label>{originaMsg.content}</Label> 
                case 'image':
                    return <Image src={originaMsg.content} size='tiny' />;
                case 'audio':
                    return (<audio controls><source src={originaMsg.content} type='audio/ogg'/><source src={originaMsg.content} type='audio/mpeg' />  </audio>)
                case 'video':  
                    return (<video controls><source src={originaMsg.content } type='video/mp4'/></video>) 
                case 'document':
                    return (<a target='blank' href={originaMsg.content}><Icon name='folder open outline'></Icon>{originaMsg.caption ? originaMsg.caption : ' Abrir Archivo'}</a>);
                case 'location':
                    const apikeyMAP = process.env.REACT_APP_MAPS_APIKEY;
                    return (<><Image  style={{borderRadius: '15px'}}  src={'https://maps.googleapis.com/maps/api/staticmap?center='+originaMsg.content+'&zoom=16&size=400x400&key='+apikeyMAP+'&markers=purple|'+originaMsg.content} /> {originaMsg.caption && <div style={{marginTop:15,marginBottom:15}}>{originaMsg.caption}</div>}</>);
                }
        }
    }

    const getResponseFrom = (id) => {
        console.log(id)
        if (!allMsg) {
            let nocontent = "El mensaje referenciado no se pudo recuperar o no se encuentra e el folio en curso"
            return    <Label style={{background : '#0b93f6'}}>{nocontent}</Label> 
        }        
        let originaMsg = allMsg.find((x) => {
            return x.externalId === id;
        })
        if (!originaMsg){
            let nocontent = "El mensaje referenciado no se encuentra en el folio en curso"
            return <Label style={{background : '#0b93f6', color :'#FFF' }}>{nocontent}</Label>;
        } else{
            switch(originaMsg.class){
                case 'text':
                    return <Label style={{background : '#0b93f6', color :'#FFF'}} >{originaMsg.content}</Label>;
                case 'image':
                      return <Image  src={originaMsg.content} size='tiny' />
                case 'audio':
                    return (<audio controls><source src={originaMsg.content} type='audio/ogg'/><source src={originaMsg.content} type='audio/mpeg' />  </audio>)
                case 'video':  
                    return (<video controls><source src={originaMsg.content} type='video/mp4'/></video>) 
                case 'document':
                    return (<a target='blank' href={originaMsg.content}><Icon name='folder open outline'></Icon>{originaMsg.caption ? originaMsg.caption : ' Abrir Archivo'}</a>);
                case 'location':
                    const apikeyMAP = process.env.REACT_APP_MAPS_APIKEY;
                    return (<><Image  style={{borderRadius: '15px'}}  src={'https://maps.googleapis.com/maps/api/staticmap?center='+originaMsg.content+'&zoom=16&size=400x400&key='+apikeyMAP+'&markers=purple|'+originaMsg.content} /> {originaMsg.caption && <div style={{marginTop:15,marginBottom:15}}>{originaMsg.caption}</div>}</>);
                }
        }
    }

    const convertContent = (msg) => {
        const type = msg.class;
        const content = msg.content;
        const caption = msg.caption;

        switch(type){
            case 'text':
                return (<div style={{whiteSpace:'pre-line'}}>{msg.responseTo && msg.direction === 'out' ? (<div>{getResponseTo(msg.responseTo)}</div>) : null} {msg.responseFromId && msg.direction === 'incoming' ? (<div>{getResponseFrom(msg.responseFromId)}</div>) : null}  {content}</div>);
            case 'mtm':
                return (<div style={{whiteSpace:'pre-line'}}>{msg.responseTo && msg.direction === 'out' ? (<div>{getResponseTo(msg.responseTo)}</div>) : null} {msg.responseFromId && msg.direction === 'incoming' ? (<div>{getResponseFrom(msg.responseFromId)}</div>) : null} <b>Plantilla: {content} </b>{caption && <p>{caption}</p>}</div>);                
            case 'document':
                return (<a target='blank' href={content}><Icon name='folder open outline'></Icon>{caption ? caption : ' Abrir Archivo'}</a>);
            case 'image':
               return (<><a href={content} target='_blank'><Image style={{borderRadius: '15px'}} size='medium' src={content}  />{caption && <p >{caption}</p>}</a></>);
            case 'sticker':
                return (<><a href={content} target='_blank'><Image src={content} style={{borderRadius: '15px'}} size='small' />{caption && <p >{caption}</p>}</a></>);
            case 'video':
                return (<video controls><source src={content} type='video/mp4' style={{borderRadius: '15px' }}  reload='auto'/></video>)
            case 'location':
                const apikeyMAP = process.env.REACT_APP_MAPS_APIKEY;
                return (<><Image  style={{borderRadius: '15px'}}  src={'https://maps.googleapis.com/maps/api/staticmap?center='+content+'&zoom=16&size=400x400&key='+apikeyMAP+'&markers=purple|'+content} /> {caption && <div style={{marginTop:15,marginBottom:15}}>{caption}</div>}</>);
            case 'ptt':
            case 'audio':
            case 'voice':
                return (<audio controls >   
                    <source src={content} type='audio/ogg' />   
                    <source src={content} type='audio/mpeg' />   
                </audio>)
            case 'externalAttachment' :
                return (<video controls><source src={content} type='video/mp4' style={{borderRadius: '15px' }}  reload='auto'/></video>)
            case 'notify':
                return <Label color="red"> <Icon name='x' />{content}<Label.Detail>FINALIZA LA CONVERSACIÓN</Label.Detail></Label>          
            case 'errors':
                return (<>[{type}] - {content}</>);      
            case 'html':
                return (<div style={{whiteSpace:'pre-line'}}>{msg.responseTo && msg.direction === 'out' ? (<div>{getResponseTo(msg.responseTo)}</div>) : null} {msg.responseFromId && msg.direction === 'incoming' ? (<div>{getResponseFrom(msg.responseFromId)}</div>) : null}  <div dangerouslySetInnerHTML={{__html: content }}></div></div>);
            default:
                return (<>[La clase {type} no esta soportada] - {content}</>);
        }
    }
    
    const getNameAuthor = (element) => {
        if(!element){return '';}
        if(element.sys && element.sys == 'BOT') {element.sys = '🤖'}
        return element.agent ? element.agent.user 
            : (element.sys ? element.sys : '');
    }

    const getAck = (ack) => {
        if(!ack){return '';}

        const lastEvent = Object.keys(ack)[Object.keys(ack).length-1];
        return (equivalenciasAck[lastEvent] ? equivalenciasAck[lastEvent] : '')
    }

    const getReaction = (reaction) => {
        if(!reaction || reaction.length === 0){return '';}

        const lastEvent = reaction[reaction.length-1]
        return (lastEvent ? lastEvent.event : '')
        console.log(lastEvent.event)
    }

    const getAttachments = (files) => {
        if(!files){return '';}
        const lastEvent = Object.keys(files)[Object.keys(files).length-1];
        return lastEvent ? lastEvent : 'Sin adjuntos.'
    }

    return ( <>
    {
        message.direction === 'out' ? 
        
            (<>
               <Divider horizontal>Mi Correo. {moment(message.createdAt).fromNow()} </Divider>
                <div key={message._id}>
                <div style={{float:'right'}}>
                    <Message size='mini' color='blue'
                        content={convertContent(message)}                        
                    />
                     <Message  size='mini'  >
                       
                       <List >
                           {
                              message?.email?.attachments && message.email?.attachments.length > 0 ? message.email.attachments.map((item) => {
                                  return (
                                   <ListItem>
                                   <ListIcon  name='linkify' />
                                   <ListContent>
                                     <a href={item?.url} target="_blank" rel="noopener noreferrer" >{item.file.originalFilename} - {item.file.mimetype} </a>
                                   </ListContent>
                                 </ListItem>
                           )}) : 'Sin adjuntos'
                           }
                       </List>
                   </Message>
                </div>
            </div> 
            <p className='from-me-meta'>{moment(message.createdAt).fromNow()} {getNameAuthor(message.origin)} <br/> {getAck(message.ack)}   </p>
        </>) : 
            (
            <div key={message._id}>
                   <Divider horizontal>Correo Cliente. {moment(message.createdAt).fromNow()} </Divider>
                <div style={{float:'left'}}>
                    <Message size='mini'
                      content={convertContent(message)}
                    />
                    <Message  size='mini'  >
                       
                        <List >
                            {
                               message?.email?.attachments && message.email?.attachments.length > 0 ? message.email.attachments.map((item) => {
                                   return (
                                    <ListItem>
                                    <ListIcon  name='linkify' />
                                    <ListContent>
                                      <a href={item?.url} target="_blank" rel="noopener noreferrer" >{item.id} - {item.type} </a>
                                    </ListContent>
                                  </ListItem>
                            )}) : 'Sin adjuntos'
                            }
                        </List>
                    </Message>
                    
                </div>
                {/* Boton para poder hacer reply */}
                {/* <p className='from-them-meta'>{moment(message.createdAt).fromNow()} <a href="#" onClick={() => {responseToMessage(message._id)}}><Icon name='reply'></Icon></a></p> */}
                <p className='from-them-meta'>
                
                    <Dropdown text={moment(message.createdAt).format('LLL')} style={{marginLeft : 1}}>
                        <Dropdown.Menu>
                          {/*  <Dropdown.Item text='Responder'  onClick={() => {responseToMessage(message._id)}}/>*/}
                          {/*  <Dropdown.Item text='Reaccionar'  onClick={() => {reactToMessage(message.externalId)}} /> */}
                        </Dropdown.Menu>
                    </Dropdown>
                </p>
                
            </div>)
    }
    </> );
}
 
export default Mail;