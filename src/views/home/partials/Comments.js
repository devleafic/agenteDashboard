import React, {useContext, useState, useRef, useEffect} from 'react';
import { Comment, Header, Form, Button, Label, Icon, Modal, Select, Divider, Message} from 'semantic-ui-react';


import SocketContext from './../../../controladores/SocketContext';
import MessageBubble from './MessageBubble';
import ListFoliosContext from '../../../controladores/FoliosContext';
import Call from './Call';
import UploadFile from './UploadFile';
import { toast } from 'react-toastify';
// import ClassificationForm from './Classification.From';


const Comments = ({folio, fullFolio, setMessageToSend, messageToSend, onCall, setOnCall, setRefresh, sidCall, setSidCall, boxMessage, refresh, vFolio, countunReadMsg, dispatchCount}) => {
    const listFolios = useContext(ListFoliosContext);
    const socket = useContext(SocketContext);
    const [isLoading, setIsLoading] = useState(false);
    
    const [currentFolio, setCurrentFolio] = useState(null);
    const [channel, setChannel] = useState(null);

    const textArea = useRef(null);

    // Para finalizar folio
    const [typeClose, setTypeClose] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [isEndingFolio, setIsEndingFolio] = useState(false);
    const [listClassification, setListClassification] = useState([]);
    const [classification, setClassification] = useState(-1);
    const [formClassification, setFormClassification] = useState({});

    const [message, setMessage] = useState(null);
    const [isOpenError, setIsOpenError] = useState(false);

    const [infoForm, setInfoForm] = useState(null);
    const [showBtnUn, setShowBtnUn] = useState(false);


    const [showResponseTo, setShowResponseTo] = useState(null);
    const [messageToResponse, setMessageToResponse] = useState('');
    const responseToMessage = (idMessage) => {

        let message = folio.message.find((x) => {
            return x._id === idMessage;
        })

        setShowResponseTo(message.externalId);
        setMessageToResponse('Estas respondiendo el mensaje '+ message.content);
    }
    
    const removeResponseTo = () =>{
        setShowResponseTo(null);
        setMessageToResponse(null);
    }

    const prepareMessage = async () => {
        
        if(messageToSend.trim() === ''){
            return false;
        }

        setIsLoading(true);

        socket.connection.emit('sendMessage', {
            token : window.localStorage.getItem('sdToken'),
            folio : folio._id,
            message : messageToSend,
            responseTo : showResponseTo,
            class : 'text'
        }, (result) => {

            if(!result.body.success){
                toast.error(result.body.message);
                return false;
            }
            let index = listFolios.current.findIndex((x) => {return x.folio._id === folio._id});
            listFolios.current[index].folio.message.push(result.body.lastMessage);
            setIsLoading(false);
            setMessageToSend('');
            textArea.current.value='';
            textArea.current.focus();
            setShowResponseTo(null);
            setMessageToResponse(null);
            listFolios.currentBox.scrollTop = listFolios.currentBox.scrollHeight
            
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
            alert('Selecciona una clasificaci??n');
            return false;
        }

        let validate;
        if(infoForm){
            let fRequire = infoForm.form.filter((x) => {return x.require});
            validate = fRequire.map((xField) => {
                let findContent = Object.keys(formClassification).find((x) => {return x === xField._id});
                if(!findContent){
                    return {success : false, id : xField, message : 'Agregue un valor al campo "'+xField.label+'"'}
                }

                console.log(findContent)

                if(xField.require){
                    switch(xField.rtype){
                        case 'text':
                            return formClassification[xField._id].trim() === '' ? {success : false, id : xField, message : 'Agregue un valor al campo "'+xField.label+'"'} : {success:true}
                        break;
                        case 'number':
                            return formClassification[xField._id].trim() === '' ? {success : false, id : xField, message : 'Agregue un valor al campo "'+xField.label+'"'} : {success:true}
                        break;
                        case 'select':
                            return formClassification[xField._id] === -1 ? {success : false, id : xField, message : 'Seleccione una opci??n en "'+xField.label+'"'} : {success:true}
                        break;
                    }
                }else{
                    return true;
                }
            })

            let localV = true;
            for(let i = 0; i < validate.length;i++){
                if(!validate[i].success){
                    alert(validate[i].message);
                    //toast.error(validate[i].message)
                    localV = false;
                    break;
                }
            }

            if(!localV){return false;}
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
            classification,
            formClassification
        }, (result) => {
            console.log(result)
            if(!result.success){
                setMessage(result.message);
                setIsOpenError(true);
                return false;
            }

            let index = listFolios.current.findIndex((x) => {
                return x.folio._id === folio._id
            });
            
            listFolios.current.splice(index,1)
            // Se limpian los formularios  del form de tipificaci??n
            setFormClassification({})
            setRefresh(Math.random());
            setOpenModal(false);
            setInfoForm(null);
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
            let fullHeight = boxMessage.current.scrollHeight;
            let pcPosition = ((boxMessage.current.scrollTop+boxMessage.current.clientHeight)*100)/fullHeight;

            if(pcPosition>=90){
                boxMessage.current.scrollTop = boxMessage.current.scrollHeight;
            }
            
        }
        listFolios.currentBox = boxMessage.current;
        return loadListClassifications();
    }, []);

    const getLabelQueue = () => {


        if(folio.isGlobalQueue){
            let name = folio.service.globalQueues.find((x) => {
                return x._id === folio.queue;
            });

            return name.name
        }else{
            let chan = folio.service.channels.find((x) => {
                return x._id === folio.channel._id
            });
            let queu = chan.queues.find((x) => {
                return x._id === folio.queue;
            })
            return queu.name;
        }
    }

    const changeClassification = (idClass) => {
        const tmpClass = fullFolio.clasifications.find((x) => {
            return x._id === idClass;
        });

        if(tmpClass.form.length > 0){
            setInfoForm(tmpClass);
        }else{
            setInfoForm(null);
            setFormClassification({})
        }

        setClassification(idClass)
        
    }


    const renderForm = (formData) => {
        const render = formData.form.map((x) => {
            switch(x.rtype){
                case 'text':
                    return (<Form.Field key={x._id}  width={6}>
                    <label>{x.label} {x.require && <Label size='mini' color='red' basic pointing='left'>Obligatorio</Label>}</label>
                    <input placeholder={x.lanel} type='text' onChange={(e) => {
                        const copy = {...formClassification, [x._id] : e.target.value} 
                        setFormClassification(copy);
                    }} value={formClassification[x._id]}/>
                  </Form.Field>)
                break;
                case 'number':
                    return (<Form.Field key={x._id} width={6}>
                    <label>{x.label} {x.require && <Label size='mini' color='red' basic pointing='left'>Obligatorio</Label>}</label>
                    <input placeholder={x.lanel} type='number' onChange={(e) => {
                        const copy = {...formClassification, [x._id] : e.target.value}
                        setFormClassification(copy);
                    }} value={formClassification[x._id]}/>
                  </Form.Field>)
                break;
                case 'select':
                    return (<Form.Field key={x._id} width={6}>
                    <label>{x.label} {x.require && <Label size='mini' color='red' basic pointing='left'>Obligatorio</Label>}</label>
                    <select className='selectActivity' style={{marginLeft:0}} onChange={(e) => {
                        const copy = {...formClassification, [x._id] : e.target.value}
                        setFormClassification(copy);
                    }}>
                        <option value={-1} >Selecciona una opci??n</option>
                        {
                            x.options.map((opt) => {
                                return <option value={opt.value} >{opt.label}</option>
                            })
                        }
                    </select>
                  </Form.Field>)
                break;
                default : 
                    return 'Item no soportado'
                break;
            }
            
        })

        return <Form><p>Ingrese los datos del formulario</p>{render}</Form>;
    }

    useEffect(() => {
        if(channel != 'call'){
            boxMessage.current.scrollTop = boxMessage.current.scrollHeight; 
        }
        
    }, [vFolio]);

    useEffect(() => {
        boxMessage.current.addEventListener(
            'scroll',() => {
                let fullHeight = boxMessage.current.scrollHeight;
                let pcPosition = ((boxMessage.current.scrollTop+boxMessage.current.clientHeight)*100)/fullHeight;
                if(pcPosition>=90){
                    setShowBtnUn(false);
                    
                }
            })
    },[])

    useEffect(() => {
        if(channel != 'call'){
            showButton()
            
            let fullHeight = boxMessage.current.scrollHeight;
            let pcPosition = ((boxMessage.current.scrollTop+boxMessage.current.clientHeight)*100)/fullHeight;

            if(pcPosition>=90){
                boxMessage.current.scrollTop = boxMessage.current.scrollHeight;
            }
            
        }
    });

    const showButton = () =>{
        if(!boxMessage.current){return null}

        let fullHeight = boxMessage.current.scrollHeight;
        let pcPosition = ((boxMessage.current.scrollTop+boxMessage.current.clientHeight)*100)/fullHeight;

        if(pcPosition<=90 && folio._id === window.localStorage.getItem('lastMessage')){
            setShowBtnUn(true);
        }
    }

    

    return ( <>
        <Comment.Group style={{margin:0, maxWidth:'none', height: '100%'}}>
            <Header as='h3' dividing>
                {(channel === 'call' ? 'Llamada ' : 'Mensajes ')}
                {/* <Label as='a' tag color='teal' style={{marginLeft:30}}>#{folio._id}</Label> */}
                <Label as='a' color='blue'>
                    #{folio._id}
                    <Label.Detail>{folio.person.anchor}</Label.Detail>
                </Label>
                {folio.isGlobalQueue ? <Label color='blue'><Icon name='globe' style={{marginRight:0}}/></Label> : null}
                <Label>Servicio : {folio.service.name}</Label>
                <Label>Canal : {folio.channel.title}</Label>
                <Label>Queue : {getLabelQueue()}</Label>
            </Header>
            
            {
                channel === 'call' && fullFolio ? (<>
                    <Call currentFolio={fullFolio.folio} onCall={onCall} setOnCall={setOnCall} setRefresh={setRefresh} sidCall={sidCall} setSidCall={setSidCall}/>    
                </>) : (
                    <div style={{height:'calc(100% - 234px)', overflowY:'scroll'}} id={'boxMessage-'+folio._id} className='imessage' ref={boxMessage}>
                        {folio.message.map((msg) => {return (<MessageBubble key={msg._id} message={msg} responseToMessage={responseToMessage} allMsg={folio.message}/>);})}
                    </div>
                ) 
            }
            
            {
                channel === 'call' && fullFolio ? (
                    <Form reply style={{textAlign:'right', marginTop:50}}>
                        <Divider/>
                        <Button key={'btnsave-'+folio} color='orange' basic onClick={e => {prepareCloseFolio('save')}} loading={isEndingFolio} disabled={(isEndingFolio || onCall === 'connect')}><Icon name='save' />Guardar</Button>
                        <Button key={'btnend-'+folio} color='green' basic onClick={e => {prepareCloseFolio('end')}} loading={isEndingFolio} disabled={(isEndingFolio || onCall === 'connect')}><Icon name='sign-out'  />Finalizar</Button>
                    </Form>
                ) : (
                    <Form reply style={{textAlign:'right'}}>
                        <div style={{textAlign: 'center', marginBottom : 3, height:24}}>
                            {showBtnUn && <Label circular icon='arrow circle down' color='orange' content='Nuevos mensajes'/>}
                            {showResponseTo && <Label onClick={() => {removeResponseTo()}} circular icon='arrow circle down' color='blue' content={messageToResponse}/>}
                        </div>
                        
                        <textArea key={'msg-'+folio._id} ref={textArea} style={{height:100, marginBottom:10}} onChange={(e) => {
                            setMessageToSend(e.target.value)
                        }} value={messageToSend} disabled={isLoading} onKeyDown={(e) => {
                            if(e.shiftKey && e.key==='Enter'){prepareMessage()}
                        }} />
                        <UploadFile folio={folio._id} channel={channel} setRefresh={setRefresh}/>
                        <Button content='Responder' labelPosition='left' icon='edit' color='green' onClick={prepareMessage} loading={isLoading} disabled={isLoading}/>
                        
                        <Button key={'btnsave-'+folio} color='orange' basic onClick={e => {prepareCloseFolio('save')}} loading={isEndingFolio} disabled={isEndingFolio}><Icon name='save' />Guardar</Button>
                        <Button key={'btnend-'+folio} color='green' basic onClick={e => {prepareCloseFolio('end')}} loading={isEndingFolio} disabled={isEndingFolio}><Icon name='sign-out'  />Finalizar</Button>
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
                    <Modal.Header>??Deseas {typeClose} el folio #{folio._id}?</Modal.Header>
                    <Modal.Content>
                        Selecciona una clasificaci??n para el folio :
                        <div style={{marginTop:15}}>
                            <Select placeholder='Clasificaci??n' options={listClassification} disabled={isEndingFolio} onChange={(e, {value}) => {
                                changeClassification(value);
                            }}/>
                        </div>
                        
                        {infoForm && renderForm(infoForm)}
                    </Modal.Content>
                    <Modal.Actions>
                    <Button negative onClick={e=> {setOpenModal(false); setInfoForm(null)}} disabled={isEndingFolio} >
                        Cancelar
                    </Button>
                    <Button positive onClick={closeFolio} disabled={isEndingFolio} loading={isEndingFolio}>
                        <label style={{textTransform:'capitalize'}}>{typeClose}</label>
                    </Button>
                    </Modal.Actions>
                </Modal>
            )
        }


        <Modal
            basic
            open={isOpenError}
            size='small'
            >
            <Header icon>
                <Icon name='unlinkify' />
                Error
            </Header>
            <Modal.Content>
                <center>{message}</center>
            </Modal.Content>
        </Modal>

    </> );
}
 
export default Comments;