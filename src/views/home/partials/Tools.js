import React, {useState, useContext, useEffect} from 'react';
import {List, Accordion, Icon, Button, Modal, Select, Form, Divider, Input, Message } from 'semantic-ui-react';

// Contextos
import SocketContext from './../../../controladores/SocketContext';
import ListFoliosContext from '../../../controladores/FoliosContext';

// Componentes
import CRM from './CRM';
import Alerts from './Alerts';
import ViewTicket from './ViewTicket';
import FindTicket from './FindTicket';
import HistoryFolios from './HistoryFolios';
import TransferFolio from './TransferFolio';
import TransferFolioPrivado from './TranferirFolioPrivado';
import TransferFolioQueueGlobal from './TransferFolioQueueGlobal';
import TransferFolioQueueGeneric from './TransferFolioQueueGeneric';
import TransferirFolioQueueGlobal_QueueLocal from './TransferirFolioQueueGlobal_QueueLocal'
import Mtm from './Mtm'

// Plugins
import Zohocrm from './plugins/zohocrm/Zohocrm'

const Tools = ({quicklyAnswer, crm, person, folio, setRefresh, areas, tickets, setMessageToSend, historyFolios, userInfo, mtm, service:infoService}) => {
    console.log(folio);
    const historyFoliosReverse = historyFolios.reverse(); //ordered most recent at top
    const [indexPane, setIndexPane] = useState(-1);
    const socket = useContext(SocketContext);
    const [isEndingFolio, setIsEndingFolio] = useState(false);
    const listFolios = useContext(ListFoliosContext);
    const [typeClose, setTypeClose] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [classification, setClassification] = useState(-1);
    const [openModalTicket, setOpenModalTicket] = useState(false);
    const [openAlert, setOpenAlert] = useState(false);
    const [messageAlert, setMessageAlert] = useState('');
    const [listClassification, setListClassification] = useState([]);

    const [openViewTicket, setOpenViewTicket] = useState(false);
    const [ticketSelected, setTicketSelected] = useState(null);
    const [openFindTicket, setOpenFindTicket] = useState(false);

    const [allQA, setAllQA] = useState([]);

    const pluginsToTools = folio.folio.service.plugins.filter((x) => {
        return ['zohocrm'].includes(x.plugin) && x.isActive ? true : false;
    });

    const initializeTicket = {
        area : null,
        message : ''
    };
    const [dataTicket, setDataTicket] = useState(initializeTicket);

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
            folio : folio.folio._id,
            token : window.localStorage.getItem('sdToken'),
            actionClose,
            classification
        }, (result) => {
            let index = listFolios.current.findIndex((x) => {return x.folio._id === folio.folio._id});
            delete listFolios.current[index];
            setRefresh(Math.random());
            setOpenModal(false);
            setIsEndingFolio(false);
        });
    }

    const openPane = (e, {index}) => {
        let newIndex = indexPane === index ? -1 : index;
        setIndexPane(newIndex)
        
    }

    const createTicket = () => {

        if(!dataTicket.area){
            alert('Seleccione un área');
            return false;
        }
        if(dataTicket.message.trim() === ''){
            alert('Agregue un mensaje');
            return false;
        }

        socket.connection.emit('createTicket', {
            folio : folio.folio._id,
            person : person._id,
            token : window.localStorage.getItem('sdToken'),
            service : folio.folio.service._id,
            ticket : dataTicket
        }, (result) => {
            if(result.success){
                setMessageAlert('El ticket ha sido enviado a las áreas correspondientes, el número de ticket es #'+result.ticket._id+'')
                setOpenAlert(true)
                setOpenModalTicket(false);
            }else{
                alert('Ocurrio un error al crear el ticket');
            }
        });
    }

    const areasArray = []
    for(let item of areas){
        areasArray.push({
            key: item._id,
            value: item._id,
            text: item.name
        })
    }

    const [textFilter, setTextFilter]= useState('');
    const findQA = (filter) => {
        setTextFilter(filter)
        if(filter.length <= 3){
            setAllQA(quicklyAnswer);
            return false;
        }

        const filterValues = quicklyAnswer.filter((x) => {
            return x.text.toLowerCase().includes(filter.toLowerCase());
        });
        setAllQA(filterValues)

    }

    const sendFile = (e) => {
        console.log(e)
        socket.connection.emit('sendMessage', {
            token : window.localStorage.getItem('sdToken'),
            folio : folio.folio._id,
            message : e.url,
            caption : e.name,
            class : e.mimeType === 'application/pdf' ? 'document' : 'image'
        }, (result) => {
            let index = listFolios.current.findIndex((x) => {return x.folio._id === folio.folio._id});
            listFolios.current[index].folio.message.push(result.body.lastMessage);
            setRefresh(Math.random());
        });
    }

    useEffect(  () => {
        
        const loadListClassifications = async () => {
            const tmpClass = [];
            for(let item of folio.clasifications){
                tmpClass.push({
                    key: item._id,
                    value: item._id,
                    text: item.name
                })
            }
            setListClassification(tmpClass);
            setAllQA(quicklyAnswer)
        }
        //return 
        loadListClassifications();
    }, []);

    const loadPlugins = (x) => {
        switch(x.plugin){
            case 'zohocrm':
                return (<div key={`accordion-${x.plugin}`}>
                    <Accordion.Title index={'zohocrm'} active={indexPane === 'zohocrm'} onClick={openPane}>
                        <Icon name='address card outline' />
                        Zoho CRM (Preview)
                    </Accordion.Title>
                    <Accordion.Content active={indexPane === 'zohocrm'}>
                        {folio && <Zohocrm template={crm} person={person} folio={folio} setRefresh={setRefresh}/>}
                    </Accordion.Content>
                </div>)
                
            default :
                return <div>Plugin no soportado</div>
        }
    }

    const getIcon = (type) => {
        switch (type) {
            case 'image/png':
                return 'image outline'
            case 'image/jpeg':
                return 'image outline'
            case 'application/pdf':
                return 'file pdf'
            default:
                return 'file pdf'
        }
    }
    
    return ( <div style={{maxHeight:'100%', overflowY:'auto', border : '1px solid rgba(34,36,38,.15)'}}>
        <Accordion fluid styled>
            <Accordion.Title index={1} active={indexPane === 1} onClick={openPane}>
                <Icon name='address book outline' />
                CRM
            </Accordion.Title>
            <Accordion.Content active={indexPane === 1}>
                {folio && <CRM template={crm} person={person} folio={folio} setRefresh={setRefresh}/>}
            </Accordion.Content>
            {/* ----- plugins ----- */}
            {
                
                pluginsToTools.map((x) => {
                    console.log('cargando plugins')
                    return loadPlugins(x);
                    
                })
            }
            {/* ------------ */}             
            <Accordion.Title index={10} active={indexPane === 10} onClick={openPane}>
                <Icon name='paper plane' />
                Plantillas de mensajes
            </Accordion.Title>
            <Accordion.Content active={indexPane === 10}>
                < Mtm mtm={mtm} person={folio.folio.person} setRefresh={setRefresh} folio={folio}/>
            </Accordion.Content>      
           
            {/* ------------ */}
            <Accordion.Title index={5} active={indexPane === 5} onClick={openPane}>
                <Icon name='archive' />
                Historial de Folios
            </Accordion.Title>
            <Accordion.Content active={indexPane === 5}>
                < HistoryFolios historyFolios={historyFoliosReverse}/>
            </Accordion.Content>
            {/* ------------ */}
            {
                folio && folio.folio.channel !== 'call' && (<>
                    <Accordion.Title index={2} active={indexPane === 2} onClick={openPane}>
                        <Icon name='edit' />
                        Respuestas Rápidas
                    </Accordion.Title>
                    <Accordion.Content active={indexPane === 2}>
                        <div style={{margin:5, marginBottom : 20}}>
                            <Input placeholder='Buscar' fluid onChange={(e) => {findQA(e.target.value)}} action={{ icon: 'close', onClick : () => {findQA(''); setTextFilter('')} }} value={textFilter}/>
                        </div>
                        <div style={{height:250, overflowY:'scroll'}}>
                        {
                            allQA.map((item) => {
                                return <div><a key={item._id} href='#' onClick={e => {
                                    setMessageToSend(item.text);
                                }}>{item.text}</a><Divider/></div>
                            })
                        }
                        </div>
                    </Accordion.Content>
                </>)
            }
            {/* ------------ transferencia Folio */}
            {
                folio  && !folio.folio.fromInbox  && !folio.folio.isGlobalQueue && folio.folio.channel !== 'call' &&  (<>
                    <Accordion.Title index={6} active={indexPane === 6} onClick={openPane}>
                        <Icon name='exchange' />
                        Transferir Folio
                    </Accordion.Title>
                    <Accordion.Content active={indexPane === 6}>
                        <TransferFolio folio={folio} setRefresh={setRefresh} userInfo={userInfo}/>
                    </Accordion.Content>
                </>)
            }
            {/* ------------ */}
            {/* ------------ transferencia folio privado */}
            {
                folio  && folio.folio.fromInbox && folio.folio.channel  !== 'call' &&  (<>
                    <Accordion.Title index={7} active={indexPane === 7} onClick={openPane}>
                        <Icon name='comment outline' />
                        Transferir Conversación Privada 
                    </Accordion.Title>
                    <Accordion.Content active={indexPane === 7}>
                        <TransferFolioPrivado folio={folio} setRefresh={setRefresh} userInfo={userInfo}/>
                    </Accordion.Content>
                </>)
            }
            {/* ------------ */}  
            {/* ------------ transferencia folio en queue global */}
            {
                folio  && folio.folio.isGlobalQueue &&  !folio.folio.isGlobalDistributor && !folio.folio.fromInbox && folio.folio.channel !== 'call' &&  (<>
                    <Accordion.Title index={8} active={indexPane === 8} onClick={openPane}>
                        <Icon name='exchange' />
                        Transferir a Bandeja Global
                    </Accordion.Title>
                    <Accordion.Content active={indexPane === 8}>
                        <TransferFolioQueueGlobal folio={folio} setRefresh={setRefresh} userInfo={userInfo}/>
                    </Accordion.Content>
                </>)
            }

            {/* ------------ transferencia Folio */}
            {
                folio  && !folio.folio.fromInbox  && folio.folio.isGlobalQueue && folio.folio.channel !== 'call' &&  (<>
                    <Accordion.Title index={9} active={indexPane === 9} onClick={openPane}>
                        <Icon name='exchange' />
                        Transferir a Bandeja de Canal 
                    </Accordion.Title>
                    <Accordion.Content active={indexPane === 9}>
                        <TransferirFolioQueueGlobal_QueueLocal folio={folio} setRefresh={setRefresh} userInfo={userInfo}/>
                    </Accordion.Content>
                </>)
            }
            {/* ------------ */}

            {/* ------------ transferencia Folio generic*/}
            {
                folio  && !folio.folio.fromInbox  && folio.folio.isGlobalQueue && folio.folio.isGlobalDistributor && folio.folio.channel !== 'call' &&  (<>
                    <Accordion.Title index={11} active={indexPane === 11} onClick={openPane}>
                        <Icon name='exchange' />
                        Transferir a Bandeja Genérica 
                    </Accordion.Title>
                    <Accordion.Content active={indexPane === 11}>
                        <TransferFolioQueueGeneric folio={folio} setRefresh={setRefresh} userInfo={userInfo}/>
                    </Accordion.Content>
                </>)
            }
            {/* ------------ */}
       
            {/* ------------ */}                

            <Accordion.Title index={3} active={indexPane === 3} onClick={openPane}>
                <Icon name='ticket' />
                Tickets
            </Accordion.Title>
            <Accordion.Content active={indexPane === 3}>
                <div style={{height:250, overflowY:'scroll'}}>
                    <List bulleted>
                    {
                        tickets.map((item) => {
                            return (<List.Item key={item._id} href='#' onClick={(e) => {setTicketSelected(item._id);setOpenViewTicket(true);}}>#{item._id}</List.Item>);
                        })
                    }
                    </List>
                </div>
                <p>
                    <Button color='blue' onClick={() => setOpenModalTicket(true)}>Generar Ticket.</Button>
                    <Button color='yellow' icon='search' onClick={() => {setOpenFindTicket(true)}}/>
                </p>
            </Accordion.Content>
            {/* ------------ */}
            {folio.folio.typeFolio === '_MESSAGES_' && <>
            <Accordion.Title index={4} active={indexPane === 4} onClick={openPane}>
                <Icon name='cloud' />
               Catálogo de archivos
            </Accordion.Title>
             <Accordion.Content active={indexPane === 4}>
             <div style={{height:250, overflowY:'scroll'}}>
                {
                    infoService.repoFiles && infoService.repoFiles.length > 0 && infoService.repoFiles.map((item) => {
                        return <div>
                            <Button
                                icon='eye'
                                size='mini'
                                style={{marginRight:5}}
                                target='_blank'
                                href={item.url}
                            ></Button>
                            <Button key={item._id}
                                size='mini'
                                color='green'
                                onClick={() => {
                                    if(window.confirm('¿Deseas enviar el archivo "'+item.name+'"?')){
                                        sendFile(item)
                                    }
                                }}
                            >
                                <Icon name={getIcon(item.mimeType)} />
                                {item.name}
                            </Button>
                        <Divider/></div>
                    })
                }
                </div>
            </Accordion.Content></>}

                        {/* ------------ salesforce*/}
                        {
                folio  && !folio.folio.fromInbox  && folio.folio.isGlobalQueue && folio.folio.isGlobalDistributor && folio.folio.channel !== 'call' &&  (<>
                    <Accordion.Title index={12} active={indexPane === 12} onClick={openPane}>
                        <Icon name='skyatlas' />
                        SalesForce CRM
                    </Accordion.Title>
                    <Accordion.Content active={indexPane === 12}>
                    <   Form error>
                            <Form.Input label='ID' placeholder='' />
                            <Form.Input label='Nombre' placeholder='' />
                            <Form.Input label='Apellido' placeholder='' />
                            <Form.Input label='Email' placeholder='' />
                            <Form.Input label='NIT' placeholder='' />
                            <Form.Input label='Canal' placeholder='' />
                            <Form.Input label='Origne' placeholder='' />
                            {/*<Message
                            error
                            header='Conacto de SF'
                            content=''
                            />*/}
                            <Button>Submit</Button>
                        </Form>
                    </Accordion.Content>
                </>)
            }
            {/* ------------ */}

            </Accordion>
            

        <div>
            {/* <Button key={'btnsave-'+folio} fluid color='orange' basic style={{marginBottom:15, marginTop: 15}} onClick={e => {prepareCloseFolio('save')}} loading={isEndingFolio} disabled={isEndingFolio}><Icon name='save' />Guardar Folio</Button>
            <Button key={'btnend-'+folio} fluid color='blue' basic onClick={e => {prepareCloseFolio('end')}} loading={isEndingFolio} disabled={isEndingFolio}><Icon name='sign-out'  />Finalizar Folio</Button> */}
        </div> 

                {
                    folio && (
                        <Modal
                            dimmer={'blurring'}
                            open={openModal}
                        >
                            <Modal.Header>¿Deseas {typeClose} el folio #{folio.folio._id}?</Modal.Header>
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

        <Modal
            dimmer={'blurring'}
            open={openModalTicket}
        >
            <Modal.Header>Levantar un ticket.</Modal.Header>
            <Modal.Content>
                <Form>
                    <Form.Field>
                        <label>Selecciona el area al que se le enviará el ticket:</label>
                        <div style={{marginTop:15}}>
                            <Select placeholder='Área' options={areasArray} onChange={(e, {value}) => {
                                setDataTicket({...dataTicket, area : value})
                            }}/>
                        </div>
                    </Form.Field>
                    <Form.Field>
                        <label>Escribe un mensaje que acompañe al ticket.:</label>
                        <Form.TextArea key={'msg-'+folio} style={{height:100}} onChange={(e) => {
                            setDataTicket({...dataTicket, message : e.target.value})
                        }}/>
                    </Form.Field>
                </Form>
                
                
            </Modal.Content>
            <Modal.Actions>
            <Button negative onClick={e=> setOpenModalTicket(false)}>
                Cancelar
            </Button>
            <Button positive onClick={() => {console.log('Crear');createTicket();}}>
                <label style={{textTransform:'capitalize'}}>Generar Ticket</label>
            </Button>
            </Modal.Actions>
        </Modal>

        
        {
            openAlert && <Alerts message={messageAlert} setOpenAlert={setOpenAlert}/>
        }
        {
            openViewTicket && <ViewTicket ticket={ticketSelected} setOpenViewTicket={setOpenViewTicket}/>
        }
        {
            openFindTicket && <FindTicket setTicketSelected={setTicketSelected} setOpenViewTicket={setOpenViewTicket} setOpenFindTicket={setOpenFindTicket}/>
        }
    </div> );
}
 
export default Tools;