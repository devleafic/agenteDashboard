import React, {useContext, useState, useRef, useEffect} from 'react';
import { Comment, Header, Form, Button, Label, Icon, Modal, Select} from 'semantic-ui-react';

import SocketContext from './../../../controladores/SocketContext';
import MessageBubble from './MessageBubble';
import ListFoliosContext from '../../../controladores/FoliosContext';
import Call from './Call';
import UploadFile from './UploadFile';


const Comments = ({folio, fullFolio, setMessageToSend, messageToSend, onCall, setOnCall, setRefresh}) => {
    const listFolios = useContext(ListFoliosContext);
    const socket = useContext(SocketContext);
    const [isLoading, setIsLoading] = useState(false);
    const boxMessage = useRef();
    const [currentFolio, setCurrentFolio] = useState(null);
    const [channel, setChannel] = useState(null);

    // Para finalizar folio
    const [typeClose, setTypeClose] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [isEndingFolio, setIsEndingFolio] = useState(false);
    const [listClassification, setListClassification] = useState([]);
    const [classification, setClassification] = useState(-1);
    
    const prepareMessage = async () => {
        
        if(messageToSend.trim() === ''){
            return false;
        }

        setIsLoading(true);

        socket.connection.emit('sendMessage', {
            token : window.localStorage.getItem('sdToken'),
            folio : folio._id,
            message : messageToSend,
            class : 'text'
        }, (result) => {
            listFolios.current[folio._id].folio.message.push(result.body.lastMessage);
            
            setIsLoading(false);
            setMessageToSend('');
            boxMessage.current.scrollTop = boxMessage.current.scrollHeight;
        });
        
    }

    const prepareCloseFolio = (tClose) => {
        if(tClose === 'save'){
            setTypeClose('guardar');
        }
        if(tClose === 'end'){
            setTypeClose('finalizar');
        }
        setOpenModal(true);
    }

    const closeFolio = () => {

        if(classification===-1){
            alert('Selecciona una clasificación');
            return false;
        }

        setIsEndingFolio(true);
        let actionClose = '';
        if(typeClose === 'guardar'){
            actionClose = 'save';
        }
        if(typeClose === 'finalizar'){
            actionClose = 'end';
        }

        socket.connection.emit('closeFolio', {
            folio : folio._id,
            token : window.localStorage.getItem('sdToken'),
            actionClose,
            classification
        }, (result) => {
            delete listFolios.current[folio._id];
            setRefresh(Math.random());
            setOpenModal(false);
            setIsEndingFolio(false);
        });
    }

    useEffect(() => {
        setCurrentFolio(folio._id);
        setChannel(folio.channel.name);

        const loadListClassifications = () => {
            const tmpClass = [];
            for(let item of fullFolio.clasifications){
                tmpClass.push({
                    key: item._id,
                    value: item._id,
                    text: item.name
                })
            }
            setListClassification(tmpClass)
        }
        
        if(channel != 'call'){
            boxMessage.current.scrollTop = boxMessage.current.scrollHeight;
        }

        return loadListClassifications();
    }, []);

    return ( <>
        <Comment.Group style={{margin:0, maxWidth:'none', height: '100%'}}>
            <Header as='h3' dividing>
                {(channel === 'call' ? 'Llamada ' : 'Mensajes ')}
                <Label as='a' tag color='teal' style={{marginLeft:30}}>#{folio._id}</Label>
            </Header>
            
            {
                channel === 'call' ? (<>
                    <Call currentFolio={listFolios.current[currentFolio].folio} onCall={onCall} setOnCall={setOnCall}/>    
                </>) : (
                    <div style={{height:'calc(100% - 203px)', overflowY:'scroll'}} id='boxMessage' className='imessage' ref={boxMessage}>
                        {
                            folio.message.map((msg) => {
                                return (
                                    <MessageBubble key={msg._id} message={msg}/>
                                );
                            })
                        }
                    </div>
                ) 
            }
            
            {
                channel === 'call' ? (
                    <></>
                ) : (
                    <Form reply style={{textAlign:'right'}}>
                        <Form.TextArea key={'msg-'+folio._id} style={{height:100}} onChange={(e) => {
                            setMessageToSend(e.target.value)
                        }} value={messageToSend} disabled={isLoading} onKeyDown={(e) => {
                            
                            if(e.shiftKey && e.key==='Enter'){prepareMessage()}
                        }}/>
                        <UploadFile folio={folio._id} channel={channel} setRefresh={setRefresh}/>
                        <Button content='Responder' labelPosition='left' icon='edit' color='green' onClick={prepareMessage} loading={isLoading} disabled={isLoading}/>
                        
                        <Button key={'btnsave-'+folio} color='orange' basic onClick={e => {prepareCloseFolio('save')}} loading={isEndingFolio} disabled={isEndingFolio}><Icon name='save' />Guardar Folio</Button>
                        <Button key={'btnend-'+folio} color='green' basic onClick={e => {prepareCloseFolio('end')}} loading={isEndingFolio} disabled={isEndingFolio}><Icon name='sign-out'  />Finalizar Folio</Button>
                    </Form>
                )
            }
            
        </Comment.Group>


        {
            folio && (
                <Modal
                    dimmer={'blurring'}
                    open={openModal}
                >
                    <Modal.Header>¿Deseas {typeClose} el folio #{folio._id}?</Modal.Header>
                    <Modal.Content>
                        Selecciona una clasificación para el folio :
                        <div style={{marginTop:15}}>
                            <Select placeholder='Clasificación' options={listClassification} disabled={isEndingFolio} onChange={(e, {value}) => {
                                setClassification(value)
                            }}/>
                        </div>
                        
                    </Modal.Content>
                    <Modal.Actions>
                    <Button negative onClick={e=> setOpenModal(false)} disabled={isEndingFolio} >
                        Cancelar
                    </Button>
                    <Button positive onClick={closeFolio} disabled={isEndingFolio} loading={isEndingFolio}>
                        <label style={{textTransform:'capitalize'}}>{typeClose}</label>
                    </Button>
                    </Modal.Actions>
                </Modal>
            )
        }

    </> );
}
 
export default Comments;