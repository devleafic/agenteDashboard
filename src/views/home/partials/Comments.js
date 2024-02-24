import React, {useContext, useState, useRef, useEffect} from 'react';
import { Comment, Header, Form, Button, Label, Icon, Modal, Select, Divider, Message, Checkbox} from 'semantic-ui-react';


import SocketContext from './../../../controladores/SocketContext';
import MessageBubble from './MessageBubble';
import ListFoliosContext from '../../../controladores/FoliosContext';
import Call from './Call';
import UploadFile from './UploadFile';
import { toast } from 'react-toastify';
import MessageBubbleEmail from './MessageBubbleEmail';
// import ClassificationForm from './Classification.From';



const Comments = ({folio, fullFolio, setMessageToSend, messageToSend, onCall, setOnCall, setRefresh, sidCall, setSidCall, boxMessage, vFolio, userInfo}) => {
    const listFolios = useContext(ListFoliosContext);
    const socket = useContext(SocketContext);
    const [isLoading, setIsLoading] = useState(false);
    
    const [currentFolio, setCurrentFolio] = useState(null);
    const [channel, setChannel] = useState(null);
    const [typeFolio, setTypeFolio] = useState(null);
    const [alias, setAlias] = useState(null)

    const textArea = useRef(null);

    // Para finalizar folio
    const [typeClose, setTypeClose] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [isEndingFolio, setIsEndingFolio] = useState(false);
    const [listClassification, setListClassification] = useState([]);
    const [classification, setClassification] = useState(-1);
    const [formClassification, setFormClassification] = useState({});
    const [isFolioAttachedAgent, setIsFolioAttachedAgent ] = useState(false); // Para saber si el folio esta asignado a un agente a su Inbox

    const [message, setMessage] = useState(null);
    const [isOpenError, setIsOpenError] = useState(false);

    const [infoForm, setInfoForm] = useState(null);
    const [showBtnUn, setShowBtnUn] = useState(false);

    const pipelineAssign = userInfo.service?.pipeline;
    const infoPipeline = folio.service.pipelines.find((x) => {return x._id === pipelineAssign});
    const [listStage] = useState(infoPipeline ? infoPipeline.pipelines : false);
    const [selectedStage, setSelectedStage] = useState(null);   


    const [showResponseTo, setShowResponseTo] = useState(null);
    const [messageToResponse, setMessageToResponse] = useState('');
    const responseToMessage = (idMessage) => {

        let message = folio.message.find((x) => {
            return x._id === idMessage;
        })

        setShowResponseTo(message.externalId);
        setMessageToResponse('Responder al mensaje: '+ message.content);
        textArea.current.focus();
    }
    
    const removeResponseTo = () =>{
        setShowResponseTo(null);
        setMessageToResponse(null);
    }

    const reactToMessage = (idMessage) => {

        socket.connection.emit('reactToMessageAgent', {
            event : "😖",//messageToSend,
            externalId : idMessage,
        }, (result) => {

            if(!result.success){
                toast.error(result.body.message);
                return false;
            }
            toast.success("Reaccionaste");
            
        });
    }

    const prepareMessage = async (msg) => {
        
        let _msg = '' 
         
        if (msg && typeof msg === 'string') {_msg = msg} 

        if (_msg.trim() === '' ){

            if(messageToSend.trim() === ''){
                return false;
            } else { 
                _msg = messageToSend
            }

        }



        setIsLoading(true);

        socket.connection.emit('sendMessage', {
            token : window.localStorage.getItem('sdToken'),
            folio : folio._id,
            message : _msg,//messageToSend,
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

    const prepareButtons = async (msg) => {
        
        let _msg = '' 
         
        if (msg && typeof msg === 'string') {_msg = msg} 

        if (_msg.trim() === '' ){

            if(messageToSend.trim() === ''){
                return false;
            } else { 
                _msg = messageToSend
            }

        }



        setIsLoading(true);

        socket.connection.emit('sendMessage', {
            token : window.localStorage.getItem('sdToken'),
            folio : folio._id,
            message : _msg,//messageToSend,
            responseTo : showResponseTo,
            class : 'buttonreply',
            interaction :[
                {
                  type: 'reply',
                  reply: {
                    id: 'opt1',
                    title: 'First Button’s' 
                  }
                },
                {
                  type: 'reply',
                  reply: {
                    id: 'opt2',
                    title: 'Second Button’s' 
                  }
                }
              ]
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
            alert('Selecciona una clasificación');
            return false;
        }
       
        let validate;
        if(infoForm){
            let fRequire = infoForm.form.filter((x) => {return x.require && x.status});
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
                            return formClassification[xField._id] === -1 ? {success : false, id : xField, message : 'Seleccione una opción en "'+xField.label+'"'} : {success:true}
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
        let _channel = fullFolio.folio.channel.title //Para cuando se va a mandar a Inbox
        let _queue = getLabelQueue() //Para cuando se va a mandar a Inbox
        let _anchorPerson = fullFolio.folio.person.anchor ///Para cuando se va a mandar a Inbox
        let _aliasIdPerson = fullFolio.folio.person.aliasId ///Para cuando se va a mandar a Inbox
        let _fromInbox = fullFolio.folio.fromInbox //Para cuando se va a mandar a Inbox
        let _fromPipeline = fullFolio.folio.fromPipeline //Para cuando se va a mandar a pipline
        if(typeClose === 'guardar'){
            actionClose = 'save';
        }
        if(typeClose === 'finalizar'){
            actionClose = 'end';
        }

        let isFolioToPipeline = false;
        if (selectedStage) {    
            isFolioToPipeline = selectedStage;
        }

        socket.connection.emit('closeFolio', {
            folio : folio._id,
            token : window.localStorage.getItem('sdToken'),
            actionClose,
            classification,
            formClassification,
            isFolioAttachedAgent,
            _channel,
            _queue,
            _anchorPerson,
            _aliasIdPerson,
            _fromInbox,
            isFolioToPipeline,
            fromPipelineStage : selectedStage ? selectedStage : null,
            fromPipelineId : pipelineAssign ? pipelineAssign : null,
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
            // Se limpian los formularios  del form de tipificación
            setFormClassification({})
            setRefresh(Math.random());
            setOpenModal(false);
            setInfoForm(null);
            setIsEndingFolio(false);
            setIsFolioAttachedAgent(false);
        });
    }

    useEffect(  () => {
        
        setCurrentFolio(folio._id);
        setChannel(folio.channel.name);

        setTypeFolio(folio.typeFolio)
        setAlias(folio.person.aliasId ? folio.person.aliasId : folio.person.anchor)

        const loadListClassifications = async () => {
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
        console.log('refrescando componente de comentarios')
         loadListClassifications();
    }, [folio]);

    const getLabelQueue = () => {


        if(folio.isGlobalQueue){
            let name = "Queue"
            if (folio.isGlobalDistributor)    {
                
                name = folio.service.genericQueues.find((x) => {
                    return x._id === folio.queue;
                });
                   
            } else {

                name = folio.service.globalQueues.find((x) => {
                    return x._id === folio.queue;
                });

            }



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
        const render = formData.form.filter((x) =>{return x.status === true}).map((x) => {
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
                        <option value={-1} >Selecciona una opción</option>
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

    useEffect(  () => {
        if(typeFolio != '_CALL_'){
            boxMessage.current.scrollTop = boxMessage.current.scrollHeight; 
        }
        
    }, [vFolio]);

    useEffect( () => {
        if(typeFolio != '_CALL_'){
            boxMessage.current.addEventListener(
                'scroll',() => {
                    let fullHeight = boxMessage.current.scrollHeight;
                    let pcPosition = ((boxMessage.current.scrollTop+boxMessage.current.clientHeight)*100)/fullHeight;
                    if(pcPosition>=90){
                        setShowBtnUn(false);
                        
                    }
                })
        }    
    },[])

    useEffect( () => {

        async function validations(){
            if(textArea.current && messageToSend.length > 0){
                textArea.current.value = messageToSend;
                setMessageToSend('')
            } 
        
            if(channel != 'call'){
                showButton()
                
                let fullHeight = boxMessage.current.scrollHeight;
                let pcPosition = ((boxMessage.current.scrollTop+boxMessage.current.clientHeight)*100)/fullHeight;
    
                if(pcPosition>=90){
                    boxMessage.current.scrollTop = boxMessage.current.scrollHeight;
                }
                
            }   
        
        
        }
         validations()
        
 
    });

    const showButton = () =>{
        if(!boxMessage.current){return null}

        let fullHeight = boxMessage.current.scrollHeight;
        let pcPosition = ((boxMessage.current.scrollTop+boxMessage.current.clientHeight)*100)/fullHeight;

        if(pcPosition<=90 && folio._id === window.localStorage.getItem('lastMessage')){
            setShowBtnUn(true);
        }
    }

    const fillStages = () =>{
        const options=listStage && listStage.
        filter(x => x.status === true).
        map((x) => {
            return {key: x._id, value: x._id, text: x.name }
        })
        options.unshift({key : -1, value:-1, text: 'Seleccione una etapa'})
        return options;
    }
return ( <>
        <Comment.Group style={{margin:0, maxWidth:'none', height: '100%'}}>
            <Header  as='h2' dividing>
                {(typeFolio === '_CALL_' ? 'Llamada ' : typeFolio === '_EMAIL_' ? 'Correo con: ' + folio.person.anchor : typeFolio === '_MESSAGES_' ? 'Conversación con: ' +  alias :   'Hilo')}
                {/* <Label as='a' tag color='teal' style={{marginLeft:30}}>#{folio._id}</Label> */} <br></br>
                <div  style={{marginTop:5}}>
                <Label as='a' color='blue' >
                    #{folio._id}
                    <Label.Detail>{folio.person.anchor}</Label.Detail>
                </Label>

                {folio.isGlobalQueue ? <Label color='blue'><Icon name='globe' style={{marginRight:0}}/></Label> : null}
                <Label>{folio.service.name}</Label>
                <Label className='ui tablet computer large monitor only'> <Icon name='box' />{folio.channel.title}</Label>
                <Label className='ui tablet computer large monitor only'> <Icon name='inbox'/>{getLabelQueue()}</Label>
                </div>
            </Header>
            {/*channel === 'call' && fullFolio ? (<> */}
            { //bumbles
                  typeFolio === '_CALL_' && fullFolio ? (<> 
                    <Call currentFolio={fullFolio.folio} onCall={onCall} setOnCall={setOnCall} setRefresh={setRefresh} sidCall={sidCall} setSidCall={setSidCall}/>    
                </>)
                : typeFolio === '_EMAIL_' && fullFolio ? 
                
                (
                    <div style={{height:'calc(100% - 234px)', overflowY:'scroll'}} id={'boxMessage-'+folio._id} className='imessage' ref={boxMessage}>
                        {folio.message.map((msg) => {return (<MessageBubbleEmail key={msg._id} message={msg} responseToMessage={responseToMessage}  reactToMessage={reactToMessage}  allMsg={folio.message} typeFolio={folio.typeFolio}/>);})}
                    </div>
                ) 
                
                : typeFolio === '_MESSAGES_' && fullFolio ? 
                
                (
                    <div style={{height:'calc(100% - 234px)', overflowY:'scroll'}} id={'boxMessage-'+folio._id} className='imessage' ref={boxMessage}>
                        {folio.message.map((msg) => {return (<MessageBubble key={msg._id} message={msg} responseToMessage={responseToMessage}  reactToMessage={reactToMessage}  allMsg={folio.message} typeFolio={folio.typeFolio}/>);})}
                    </div>
                ) :
                    <div style={{height:'calc(100% - 234px)', overflowY:'scroll'}} id={'boxMessage-'+folio._id} className='imessage' ref={boxMessage}>
                        {folio.message.map((msg) => {return (<MessageBubble key={msg._id} message={msg} responseToMessage={responseToMessage}  reactToMessage={reactToMessage}  allMsg={folio.message} typeFolio={folio.typeFolio}/>);})}
                    </div>

            }
            {/* channel === 'call' && fullFolio ? ( */}
            { 
                // INPUT, TEXT AREA   
                typeFolio === '_CALL_' && fullFolio ? (
                    <Form reply style={{textAlign:'right', marginTop:50}}>
                        <Divider/>
                        <Button key={'btnsave-'+folio} color='orange' basic onClick={e => {prepareCloseFolio('save')}} loading={isEndingFolio} disabled={(isEndingFolio || onCall === 'connect')}><Icon name='save' />Guardar</Button>
                        <Button key={'btnend-'+folio} color='blue' basic onClick={e => {prepareCloseFolio('end')}} loading={isEndingFolio} disabled={(isEndingFolio || onCall === 'connect')}><Icon name='sign-out'  />Resolver</Button>
                    </Form>
                ) : typeFolio === '_MESSAGES_' && fullFolio ? (
                    <Form reply style={{textAlign:'right'}}>
                        <div style={{textAlign: 'center', marginBottom : 3, height:24}}>
                            {showBtnUn && <Label circular icon='arrow circle down' color='orange' content='Nuevos mensajes'/>}
                            {showResponseTo && <Label onClick={() => {removeResponseTo()}} circular icon='arrow circle down' color='blue' content={messageToResponse}/>}
                        </div>
                        
                        <textarea key={'msg-'+folio._id} ref={textArea} rows={1} style={{marginBottom:10}} className='heightText' onChange={(e) => {
                            //setMessageToSend(e.target.value)
                        }} disabled={isLoading} onKeyDown={(e) => {
                            if(e.shiftKey && e.key==='Enter'){
                                //setMessageToSend(e.target.value)
                                prepareMessage(e.target.value)}
                        }} />

                        <UploadFile  folio={folio._id} channel={channel} setRefresh={setRefresh}/>
                        
                        <Button  color='blue' basic onClick={() => {prepareMessage(textArea.current.value)}} loading={isLoading} disabled={isLoading}><Icon name='paper plane' /><label className='hideText'>Enviar</label></Button>                        
                        {/*<Button  color='green' basic onClick={() => {prepareButtons(textArea.current.value)}} loading={isLoading} disabled={isLoading}><Icon name='button' /><Icon name='mail square' /><label className='hideText'>Enviar Boton</label></Button> */}                        
               
                        <Button key={'btnsave-'+folio} color='orange' basic onClick={e => {prepareCloseFolio('save')}} loading={isEndingFolio} disabled={isEndingFolio}><Icon name='sticky note' /><label className='hideText'>Continuar Después</label></Button>
                        <Button key={'btnend-'+folio} color='green' basic onClick={e => {prepareCloseFolio('end')}} loading={isEndingFolio} disabled={isEndingFolio}><Icon name='folder'  /><label className='hideText'>Finalizar</label></Button>

                    </Form> 
                ) : typeFolio === '_EMAIL_' && fullFolio ? (
                    <Form reply style={{textAlign:'right'}}>
                        <div style={{textAlign: 'center', marginBottom : 3, height:24}}>
                            {showBtnUn && <Label circular icon='arrow circle down' color='orange' content='Nuevos correos'/>}
                            {showResponseTo && <Label onClick={() => {removeResponseTo()}} circular icon='arrow circle down' color='blue' content={messageToResponse}/>}
                        </div>
  
                        <textArea key={'msg-'+folio._id} ref={textArea} rows={1} style={{marginBottom:10}} className='heightText' onChange={(e) => {
                            //setMessageToSend(e.target.value)
                        }} disabled={isLoading} onKeyDown={(e) => {
                            if(e.shiftKey && e.key==='Enter'){
                                //setMessageToSend(e.target.value)
                                prepareMessage(e.target.value)}
                        }} />

                        <UploadFile  folio={folio._id} channel={channel} setRefresh={setRefresh}/>
                        
                        <Button  color='blue' basic onClick={() => {prepareMessage(textArea.current.value)}} loading={isLoading} disabled={isLoading}><Icon name='paper plane' /><Icon name='mail square' /><label className='hideText'>Enviar Correo</label></Button>                        
                      
                        <Button key={'btnsave-'+folio} color='orange' basic onClick={e => {prepareCloseFolio('save')}} loading={isEndingFolio} disabled={isEndingFolio}><Icon name='save' /><label className='hideText'>Continuar después</label></Button>
                        <Button key={'btnend-'+folio} color='green' basic onClick={e => {prepareCloseFolio('end')}} loading={isEndingFolio} disabled={isEndingFolio}><Icon name='sign-out'  /><label className='hideText'>Resuelto</label></Button>

                    </Form> ): 
                    (
                        <Form reply style={{textAlign:'right'}}>
                            <div style={{textAlign: 'center', marginBottom : 3, height:24}}>
                                {showBtnUn && <Label circular icon='arrow circle down' color='orange' content='Nuevos mensajes'/>}
                                {showResponseTo && <Label onClick={() => {removeResponseTo()}} circular icon='arrow circle down' color='blue' content={messageToResponse}/>}
                            </div>
                            
                            <textArea key={'msg-'+folio._id} ref={textArea} rows={1} style={{marginBottom:10}} className='heightText' onChange={(e) => {
                                //setMessageToSend(e.target.value)
                            }} disabled={isLoading} onKeyDown={(e) => {
                                if(e.shiftKey && e.key==='Enter'){
                                    //setMessageToSend(e.target.value)
                                    prepareMessage(e.target.value)}
                            }} />
    
                            <UploadFile  folio={folio._id} channel={channel} setRefresh={setRefresh}/>
                            
                            <Button  color='blue' basic onClick={() => {prepareMessage(textArea.current.value)}} loading={isLoading} disabled={isLoading}><Icon name='paper plane' /><label className='hideText'>Enviar</label></Button>
                      
                            <Button key={'btnsave-'+folio} color='orange' basic onClick={e => {prepareCloseFolio('save')}} loading={isEndingFolio} disabled={isEndingFolio}><Icon name='save' /><label className='hideText'>Guardar</label></Button>
                            <Button key={'btnend-'+folio} color='green' basic onClick={e => {prepareCloseFolio('end')}} loading={isEndingFolio} disabled={isEndingFolio}><Icon name='sign-out'  /><label className='hideText'>Finalizar</label></Button>
    
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
                    <Modal.Header>¿Deseas {typeClose=== 'guardar' ? 'continuar mas tarde con' : 'finalizar' } el folio #{folio._id}?</Modal.Header>
                    <Modal.Content>
                        <div style={{textAlign: 'centers', marginBottom : 20}}>
                        {typeClose === 'guardar'  && <div><Label pointing='right' icon='inbox' color='blue' content='Enviar conversación a inbox privado '/> <Checkbox style={{marginLeft:20}} label='Selecciona' checked={isFolioAttachedAgent} onChange={() => setIsFolioAttachedAgent(!isFolioAttachedAgent)  }/> </div>}
                        </div>
                        {!isFolioAttachedAgent && infoPipeline && <div style={{textAlign: 'centers', marginBottom : 20}}>
                        {typeClose === 'guardar'  && <>
                        <div ><Label pointing='right' icon='filter' color='blue' content='Enviar conversación a pipeline'/>
                            <Select style={{marginLeft:20}} 
                                options={fillStages()}
                                placeholder='Etapa'
                                onChange={(e, {value}) => {
                                    
                                    if(value === -1){
                                        setSelectedStage(null)
                                    }else{
                                        setSelectedStage(value)
                                      
                                    }

                                }}

                        
                            /></div>
                            
                        </>}
                        </div>}
                        <Label  color='red' pointing='below' icon='sticky note'  content='Selecciona una clasificación para la conversación:'/>            
                        <div style={{marginTop:5}}>
                            <Select placeholder='Clasificación' options={listClassification} disabled={isEndingFolio} onChange={(e, {value}) => {
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
                Aviso
            </Header>
            <Modal.Content>
                <center>{message}</center>
            </Modal.Content>
        </Modal>

    </> );
}
 
export default Comments;