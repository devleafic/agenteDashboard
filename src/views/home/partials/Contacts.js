import shortParagraph from './../../../img/short-paragraph.png';
import MessageBubble from './MessageBubble';
import React, {useContext, useState, useEffect} from 'react';
import axios from 'axios';
import { Button, Form,  Message, Label, Table, Menu, Icon, Pagination, Input, Segment , Dimmer, Loader, Image, List, Modal, Select } from 'semantic-ui-react';
import { toast } from 'react-toastify';
import SocketContext from '../../../controladores/SocketContext';

const Contacts =  ({selectedComponent, setUnReadMessages, vFolio, setVFolio, userInfo}) => {
    console.log(userInfo)
    const Socket = useContext(SocketContext);
    const [report,setReport] = useState(null);
    const [onLoad, setOnLoad] = useState(false);
    const [numRows, setNumRows] = useState(10);
    const [currentPag, setCurrentPag] = useState(1)
    const [showRows,setShowRows] = useState([]);
    const [query, setQuery] = useState("");
    const [isLoadInboxFolio, setIsLoadInboxFolio] = useState(false);
    const [titleModal, setTitleModal ] = useState('');
    const [contentMessage, setContentMessage] = useState(
        <Segment>
            <Dimmer active inverted>
                <Loader inverted>Cargando</Loader>
            </Dimmer>

            <Image src={shortParagraph} />
        </Segment>
    );    
    const [open,setOpen] = useState(false);
    const [onLoading, setOnLoading] = useState(false);
    const [infoService, setInfoService ] = useState({});

    const initialStateForm = {
        service : userInfo.service.id,
        isNew : true,
        anchorUser : '',
        alias : '',
        idChannel : '',
        idQueue : userInfo.service.queue,
        createdByAgent : userInfo._id
    }

    const [createContact, setCreateContact ] = useState(false);
    const [formToContact, setFormToContact ] = useState(initialStateForm)
    const [showModalContact,setShowModalContact]  =  useState(false);
    

    const [showErrorMsg, setShowErrorMsg] = useState(false);
    const [messageError, setMessageError] = useState('Todos los campos son requeridos.');

    const setDataForm = (e) => {
        let id = e.target.id;
        let value = e.target.value;
        setShowErrorMsg(false);
        setFormToContact({...formToContact, [id] : value});
    }

    const setDataFormCombo = (e, {value,id}) => {
        setShowErrorMsg(false);
        setFormToContact({...formToContact, [id] : value});
    }   

    const clearForm = () => {
        setFormToContact(initialStateForm)
    }

    const onContactJSON = async () => {

        setReport(null);
        setOnLoad(true);
        setShowRows([]);

        let serviceId = userInfo.service.id
        const result = await axios.get(process.env.REACT_APP_CENTRALITA+'/searchData/json/'+serviceId,{
            params : {
                typeReport : 'r_crmData',
                query : query
            // startDate : '2022-08-02',
            // endDate : '2022-09-02'
            }
        });
        setOnLoad(false);
        setReport(result.data.report);
        console.log(result.data.report.result)
        setShowRows(result.data.report.result.slice(0,numRows))
    }

    const openSavedFolio = (folio, anchorPerson, aliasIdPerson,channel,queue) => {
        console.time('openSavedFolio');
        setIsLoadInboxFolio(true)
        Socket.connection.emit('openSavedFolio', {
            token : window.localStorage.getItem('sdToken'),
            folio : folio,
            anchorPerson,
            aliasIdPerson,
            channel,
            queue
        },(data) => {
            setVFolio(folio._id)
            toast.success(<label>Abriendo folio <b>#{folio._id}</b> - <b>{aliasIdPerson}</b></label>);
            if(!data.success){
                toast.error(data.message);
                return false;
            }
            selectedComponent('home')
            console.timeEnd('openSavedFolio')
            setIsLoadInboxFolio(false)
        });
    }

    const createNewFolio = (folio, anchorPerson, aliasIdPerson,channel,queue,fromClosedFolio,personId) => { //new folio from a finished folio
        console.time('createNewFolio');
        setIsLoadInboxFolio(true)
        Socket.connection.emit('createNewFolio', {
            token : window.localStorage.getItem('sdToken'),
            folio : folio,
            anchorPerson,
            aliasIdPerson,
            channel,
            queue,
            messages : "Conversación creada. Para contactar al cliente debes enviar una - Plantilla de Mensaje -. Espera que el cliente responda el mensaje para seguir chateando.",
            fromClosedFolio,
            personId
        },(data) => {
            setVFolio(data.folio)
            toast.success(<label>Creando folio <b>#{data.folio}</b> - <b>{aliasIdPerson}</b></label>);
            if(!data.success){
                toast.error(data.message);
                return false;
            }
            selectedComponent('home')
            console.timeEnd('createNewFolio')
            setIsLoadInboxFolio(false)

            setCreateContact(false);
            setShowModalContact(false);
        });
    }

    const changePage = (e, { activePage, preNumRows }) => {
        var toShow = [];
        const nr = preNumRows ? preNumRows : numRows;

        if(activePage<=1){toShow = report.result.slice(0, nr)}
        if(activePage>1){
            toShow = report.result.slice(((nr*(activePage-1))),(activePage*nr))
        }
        setShowRows(toShow)
    }

    useEffect( () => {
        return console.log('refrescando numRows')
    },[numRows, showRows]);

    useEffect( () =>
    {
        console.log("Load Contacts")
        if (query.length === 0 || query.length > 2)  onContactJSON();
    },[query]);

    const initLoadModal = () => { //reset values for Modal 
        setOpen(false)
        setContentMessage(
            <Segment>
                <Dimmer active inverted>
                    <Loader inverted>Cargando</Loader>
                </Dimmer>
    
                <Image src={shortParagraph} />
            </Segment>
        );    

    }
    const getPersonDetail = (person, template) => {
        setOnLoading(true);
        setTitleModal('Contacto  #'+ person.aliasId )
        //console.log(template)
        setOpen(true);
                setContentMessage(
                    <div style={{textAlign: 'center', marginBottom : 20}}>
                        <List>
                        <List.Item>
                            <List.Icon name='user' />
                            <List.Content>{person.aliasId}</List.Content>
                        </List.Item>
                        <List.Item>
                            <List.Icon name='pin' />
                            <List.Content>{person.anchor}</List.Content>
                        </List.Item>
                        </List>
                    </div>
                );    
        setOnLoading(false);
    }

    const getFolioMessages = (folio,anchorPerson,aliasIdPerson,channel,queue) => {
        setOnLoading(true);
        setTitleModal('Historial de Folio #'+folio + " - " + aliasIdPerson)
        setOpen(true);
       
        Socket && Socket.connection && Socket.connection.emit('getMessageHist', {folio}, (res) => {
            if(res.success){
                let histFolioStatus = res.folio.status
                let histFolioFromInbox = res.folio.fromInbox
                let histFolioFromUser = res.folio.agentAssign ? res.folio.agentAssign.profile.name  : null
                let fromClosedFolio = true;

                //setIsLoadInboxFolio(res.folio);
                setContentMessage(

                    <div className='imessage'>
                        {histFolioStatus === 3 ? 
                              <Button circular color='red' icon='folder open outline' onClick={() => {
                                    createNewFolio(res.folio,anchorPerson,aliasIdPerson,channel,queue,fromClosedFolio); //this action will create a new folio
                                    setUnReadMessages(false);
                                    setOnLoading(true);
                                    setContentMessage(
                                        <Segment>
                                            <Dimmer active inverted>
                                                <Loader inverted>Creando la Conversación, espera un momento</Loader>
                                            </Dimmer>
                                
                                            <Image src={shortParagraph} />
                                        </Segment>
                                    );    
                                }} loading={isLoadInboxFolio} disabled={isLoadInboxFolio}>Folio Finalizado - ¿Crear nueva conversación?</Button>                         
                            : 
                            (histFolioStatus === 2 && !histFolioFromInbox) || ( histFolioStatus === 1 && !histFolioFromUser )  ? //folio General, or failed folio in attention without agent
                                <Button circular color='green' icon='folder open outline' onClick={() => {
                                    openSavedFolio(res.folio,anchorPerson,aliasIdPerson,channel,queue); //this action will convert saved folio to inbox folio
                                    setUnReadMessages(false);
                                    setOnLoading(true);
                                    setContentMessage(
                                        <Segment>
                                            <Dimmer active inverted>
                                                <Loader inverted>Abriendo la Conversación, espera un momento</Loader>
                                            </Dimmer>
                                
                                            <Image src={shortParagraph} />
                                        </Segment>
                                    );    
                                }} loading={isLoadInboxFolio} disabled={isLoadInboxFolio}>Folio Guardado: ¿Continuar Conversación?</Button> : 
                            histFolioStatus === 2 && histFolioFromInbox  ? <Label  as='a' color='green' pointing='below'>Inbox Privado de Agente: {histFolioFromUser}</Label> :
                            histFolioStatus === 1 && histFolioFromUser ? <Label  as='a' color='blue' pointing='below'>En Atención por: {histFolioFromUser}</Label>  :
                            histFolioStatus === 10 ? <Label  as='a' color='blue' pointing='below'>Se encuentra en bandeja de espera:  {queue}</Label>  : ""
                        } 
                        {
                            res.folio.message.map((msg) => {
                                return (
                                    <MessageBubble key={msg._id} message={msg}/>
                                );
                            })
                        }
                    </div> 
                )
                
            }else{
                setContentMessage(
                    <Segment>
                        <Dimmer active inverted>
                            <Label inverted>No se ha podido consultar el folio. Vuelve a intentarlo.</Label>
                        </Dimmer>
            
                        <Image src={shortParagraph} />
                    </Segment>
                );    
            }
        })


        setOnLoading(false);
    }

    const sendForm = async () => {
        setCreateContact(true)
        for(let i in formToContact){
            if(typeof formToContact[i] === 'string' && formToContact[i].trim() === ''){
                /*if(i === 'passwordNewUser'){
                    continue;
                }*/

                /*if(i === 'idChannel' && formToContact.isGlobal){
                    continue;
                }*/
               
                setCreateContact(false)
                setShowErrorMsg(true)
                return false;
            } 
            if ((formToContact.anchorUser.length <= 7 || formToContact.anchorUser.length >13) || isNaN(formToContact.anchorUser)){
                setMessageError("Télefono debe ser solo números, y debe ser mayor a 7 digitos.")
                setCreateContact(false)
                setShowErrorMsg(true)
                return false;              
            }

            if (formToContact.alias.length <= 2 || formToContact.alias.length >25 ){
                setMessageError("Debes cologar un nombre mas largo.")
                setCreateContact(false)
                setShowErrorMsg(true)
                return false;                 
            }
            
        }

        try{
            Socket.connection.emit('createOrGetPerson', {
                formToContact : formToContact,
            },(data) => {
                console.log(data)
                if(data.body.success){
                    setCreateContact(true);
                    setShowModalContact(true);
                    clearForm();
                    //create folio and open 
                    let person = data.body.person
                    let fromClosedFolio = false
                    userInfo.service.idChannel = formToContact.idChannel
                    createNewFolio(userInfo.service,person.anchor,person.aliasId,userInfo.service.id,userInfo.service.queue,fromClosedFolio,person._id); //this action will create a new folio
                        setUnReadMessages(false);
                        setOnLoading(true);
                        setContentMessage(
                            <Segment>
                                <Dimmer active inverted>
                                    <Loader inverted>Creando la Conversación, espera un momento...</Loader>
                                </Dimmer>
                    
                                <Image src={shortParagraph} />
                            </Segment>
                        );    
                }else{
                    toast.error(data.body.message);
                    setShowErrorMsg(true);
                    setMessageError(data.body.message || 'Ocurrio un error al crear el usuario. Intenta mas tarde.')    
                    setCreateContact(false);
                    clearForm();
                }

            });
        }catch(err){
            setShowErrorMsg(true)
            clearForm();
            setMessageError('Ocurrio un error al crear el usuario. Intenta mas tarde.'+err.message)
            console.error(err)
        }
    }

    useEffect(  () => {

        async function getInfoService(){
            try{
                const {data} = await axios(process.env.REACT_APP_CENTRALITA+'/service/'+userInfo.service.id);
                if(data.body.success){
                    setInfoService(data.body.service);
                   }else{
                    toast.warning(<label>No se pudo recuperar información, reinicia tu sesión</label>);
                }
    
            }catch(err){
                toast.warning(<label>No se pudo recuperar información, reinicia tu sesión</label>);
                //return window.location.href = '/login';
            }
        }

        getInfoService();

        return () => {
            console.log('Componente desmontado')
        }
        
    }, []);

    {/*const isNumber = (evt) {
        evt = (evt) ? evt : window.event;
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    } */}
    return ( <>
        <div>
            <div style={{padding:30}}>
                <Message
                    attached
                    icon="address book"
                    header='Contactos'
                    content='Selecciona un contacto para crear o continuar una conversación'
                />
                <Form  className='attached fluid segment' >
                    <Form.Group widths='equal'>
                        <input  style={{marginLeft: 50, marginRight: 50}}
                        icon='users' iconPosition='left' 
                        placeholder="Buscar..."
                        onChange={(e) => setQuery(e.target.value.toLowerCase())}
                        />
                        <Button color='blue' icon='search' loading={onLoad} disabled={onLoad} onClick={onContactJSON}></Button>
                        <Button icon labelPosition='left' color='green' size='small' disabled={onLoad} onClick={() => { setShowModalContact(!showModalContact); }}>
                            <Icon name='id badge' /> Nuevo contacto
                        </Button>  
                    </Form.Group>
    
                </Form>
                {
                    onLoad  && contentMessage //when loading contacts
                }
                {
                    report && report.result.length <= 0 && (
                        <Message
                            icon='warning circle'
                            header='No se encontraron datos con los criterios seleccionados'
                            negative
                        />
                    )
                }
                {
                    report && report.result.length > 0 && (
                        <div style={{marginTop: 40}}>
                            {/*<Header as='h2'>Resultado</Header> */}
                            <Table celled>
                                <Table.Header>
                                <Table.Row>
                                    {
                                        Object.keys(report.dictionary).map((x) => {
                                            return <Table.HeaderCell key={x}>{report.dictionary[x]}</Table.HeaderCell>
                                        })
                                    }
                                </Table.Row>
                                </Table.Header>

                                <Table.Body>
                                    {
                                        showRows.map((x, i) => {
                                            return (<Table.Row key={i+'-'+x._id}>{Object.keys(x).map((row, col) => {
                                                return row == '_id' && col === 0 ? (<Table.Cell><a href='#' key={i+'-'+x._id+'-'+row} onClick={() => getPersonDetail(x)}><Icon name='address card'/></a></Table.Cell>) :  
                                                row == 'profilePic' && x[row].startsWith('https') ? (<Table.Cell key={i+'-'+x._id+'-'+row}><Image src={x[row]} rounded size='mini' /></Table.Cell>) : 
                                                row == 'lastFolio' ? (<Table.Cell><a href='#' key={i+'-'+x._id+'-'+row} onClick={() => getFolioMessages(x.lastFolio,x.anchor, x.aliasId, x.channel, x.queue)}><Icon name='folder open'/></a>{x[row]}</Table.Cell>) :(<Table.Cell key={i+'-'+x._id+'-'+row}>{x[row]}</Table.Cell>)
                                            })}</Table.Row>)
                                        })
                                    }
                                </Table.Body>

                                <Table.Footer>
                                    <Table.Row>
                                        <Table.HeaderCell colSpan={Object.keys(report.dictionary).length}>
                                            <Input icon={<Icon name='check circle' inverted circular link />} placeholder='Contactos por página' type='number' value={numRows} onChange={(e) => {
                                                setNumRows(e.target.value);
                                                changePage(null, {activePage:0, preNumRows : e.target.value});
                                            }} min={1}/>
                                            <Menu floated='right' pagination>
                                                {
                                                    <Pagination
                                                        boundaryRange={2}
                                                        pointing
                                                        secondary
                                                        defaultActivePage={currentPag} totalPages={Math.ceil(report.result.length / numRows)}
                                                        onPageChange={changePage}
                                                    />
                                                }
                                            </Menu>
                                        </Table.HeaderCell>
                                    </Table.Row>
                                </Table.Footer>
                            </Table>
                        </div>
                    ) 
                }                {
                    showModalContact && (
                        <Modal
                            onClose={() => {setShowModalContact(false);clearForm();}}
                            onOpen={() => {setShowModalContact(true);clearForm();}}
                            size='tiny'
                            closeOnEscape={false}
                            closeOnDimmerClick={false}
                            open={showModalContact}
                            >
                            <Modal.Header>{formToContact.isNew ? 'Crear nuevo Contacto' : 'Editar Contacto'}</Modal.Header>
                            <Modal.Content>
                                <Form>
                                    <Form.Field error={false}>
                                        <label>Nombre del contacto</label>
                                        <input placeholder='Nombre del Contacto' id='alias'  value={formToContact.alias} onChange={setDataForm}/>
                                    </Form.Field>
                                    <Form.Field error={false}>
                                        <label>Télefono / Obligatorio código de país y área (50255170000)</label>
                                        <input placeholder='Télefono'  type='number'  id='anchorUser' value={formToContact.anchorUser} onChange={setDataForm} disabled={!formToContact.isNew }/>
                                    </Form.Field>
                                    <Form.Field error={false}>
                                        <label>Selecciona un canal</label>
                                        <Select placeholder='Selecciona un canal'id='idChannel' options={infoService.channels.filter((x) => {
                                            return x.status && x.name.includes("wab",0) 
                                        }).map((x) => {
                                            return {key : x._id, value:x._id, text: x.title}
                                        })} onChange={(e, {value, id}) => {
                                            setDataFormCombo(e, {value, id})
                                            //fillQueues(value)
                                        }} value={formToContact.idChannel} disabled={false}/>
                                    </Form.Field>
                                </Form>
                            <Message
                                negative
                                hidden={!showErrorMsg}
                                icon='ban'
                                header='¡Error!'
                                content={messageError}/>
                            </Modal.Content>
                            <Modal.Actions>
                                <Button color='black' onClick={()=>{setShowModalContact(false);clearForm();}} disabled={createContact}>Cancelar</Button>
                                <Button content="Crear Contacto y Conversar" labelPosition='right' icon='checkmark' positive onClick={sendForm} disabled={createContact} loading={createContact}/>
                            </Modal.Actions>
                        </Modal>
                    )
                }

            </div>
            
        </div>
        <Modal
            onClose={() => initLoadModal()}
            onOpen={() => setOpen(true)}
            open={open}
            header={titleModal}
            scrolling
            content={contentMessage}
            actions={[{ key: 'Aceptar', content: 'Aceptar', positive: true, onClick: ()=> { initLoadModal() } }]} //setOpenModal(!openModal);
            />        
    </> );



}
 
export default Contacts;