import React, {useState, useEffect, useContext} from 'react';
import SideBarMenu from "./partials/SideBarMenu";
import Toolbar from './partials/Toolbar';
import io from 'socket.io-client';
import axios from 'axios';
import {Device} from 'twilio-client';
import { ToastContainer, toast } from 'react-toastify';
import { Modal, Header, Icon, Button } from 'semantic-ui-react';

/* Contexto */
import ListFoliosContext from './../../controladores/FoliosContext';
import SocketContext from '../../controladores/SocketContext';
import CallContext from '../../controladores/CallContext';

/* Componentes */
import HomeViewer from './partials/HomeViewer';
import Inbox from './partials/Inbox';

const Home = () => {
    const initializeComponent = {
        home : false,
        Inbox : false
    };

    const [component, setComponent] = useState(initializeComponent);
    const [page, setPage] = useState('home');
    const [ refresh, setRefresh ] = useState(0);
    const [onCall, setOnCall] = useState('disconnect');
    const [isReady, setIsReady] = useState(false);
    const [userInfo, setUserInfo ] = useState(false);

    const listFolios = useContext(ListFoliosContext);
    const socketC = useContext(SocketContext);
    const callC = useContext(CallContext);

    const [onConnect, setOnConnect] = useState(true);
    const [isInbound, setIsUnbound] = useState(true);

    const [open,setOpen] = useState(false);
    const [message,setMessage] = useState('');

    const [isConnected, setIsConnected] = useState(-1);
    
    const [unRead, setUnRead ] = useState({});

    const [sidCall, setSidCall] = useState(null);
    const [connCall, setConnCall] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState(null);
    const [openInComingCall, setOpenInComingCall] = useState(false);
    const [unReadMessages, setUnReadMessages] = useState(false);
    

    const CallController = {
        setup : (token) => {
            return new Promise((resolve, reject) => {
                socketC.connection.emit('authCall', {token : window.localStorage.getItem('sdToken')},(data) => {

                    if(!data.success){
                        toast.error(data.message);
                        return false;
                    }

                    callC.connection = new Device();
                    callC.connection.setup(data.token, {
                        sounds: {
                            outgoing: process.env.REACT_APP_CENTRALITA+'/cdn/sound/beepCalling.mp3',
                        }
                    });

                    resolve(true);
                })

                
            });
        },
        answercall : (sid) => {
            socketC.connection.emit('answerCall', {sid, token : window.localStorage.getItem('sdToken')}, (data) =>{
                if(!data.success){
                    setOnCall('disconnect');
                }
            });
        }
    }

    const notificationsSetup = () => {
        Notification.requestPermission();
    }

    const showMessage = (message) => {
        if(window.localStorage.getItem('tabIsActive') === 'true'){return false;}
        var notification = new Notification(message);
        notification.onclick = function(){window.focus();this.close();}
    }

    const SocketActions = {
        acceptCall : () => {
            connCall.accept();
            setOpenInComingCall(false);
        },
        rejectCall : () => {
            connCall.reject();
            setOnCall('disconnect')
            setConnCall(null);
            setOpenInComingCall(false);
            setRefresh(Math.random());
        },
        connectToSocket : () => {
            socketC.connection = io(process.env.REACT_APP_CENTRALITA, { transports : ['websocket'], reconnect : true,  });

            socketC.connection.on('disconnect', () => {
                setOpen(true);
                setMessage('Se rompio la conexión con el servidor, intente en unos minutos nuevamente.');
            });

            socketC.connection.on('connect', () => {
                if(isReady){
                    window.location.reload(false);
                }
            });




            socketC.connection.emit('handShakeToSocket', {
                token : window.localStorage.getItem('sdToken')
            },(data) => {
                if(data.success){
                    toast.success('Se ha conectado al servidor correctamente');
                    setUserInfo(data.user);
                    setIsReady(true);

                    socketC.connection.emit('loadInbox', {
                        token : window.localStorage.getItem('sdToken')
                    },(data) => {         
                        let hasUnread = data.inboxes.find((x) => {
                            return x.status === 1 ? true : false;
                        })
                        setUnReadMessages(hasUnread?true:false);
                    });
        
                }else{
                    setOpen(true);
                    setMessage(data.message);
                }
            });

            socketC.connection.on('newFolio', async (data) => {
                listFolios.current = {...listFolios.current, [data.body.folio._id] : data.body};
                if(data.body.folio.channel.name === 'call'){
                    if(Object.keys(callC.connection).length <= 0){
                        await CallController.setup(data.token);

                        callC.connection.on('ready',() => {
                            console.log('Usuario listo para recibir llamadas');
                            toast.success('Listo para recibir llamadas.');
                            setRefresh(Math.random());
                        });
        
                        callC.connection.on('connect',() => {
                            setOnCall('connect')
                            setRefresh(Math.random());
                        });
        
                        callC.connection.on('disconnect',() => {
                            console.log('disconnect');
                            setOnCall('disconnect');
                            setConnCall(null);
                            setRefresh(Math.random());
                        });
        
                        callC.connection.on('error',(err) => {
                            console.log('error',err);
                            alert('Ocurrio un error');
                            setRefresh(Math.random());
                        });
        
                        callC.connection.on('incoming',(conn) => {
                            setOnCall('incoming');
                            setConnCall(conn);
                            setPhoneNumber(conn.parameters.From);
                            setOpenInComingCall(true)
                            //conn.accept();
                            setRefresh(Math.random());
                        });
        
                        callC.connection.on('offline',() => {
                            alert('Se ha desconectado de la línea telefónica, refreste el navegador.');
                        });
                    }
                    setSidCall(data.body.folio.message[data.body.folio.message.length-1].externalId);
                    CallController.answercall(data.body.folio.message[data.body.folio.message.length-1].externalId);
                    
                }

                setRefresh(Math.random());
                showMessage('Nuevo Folio Asignado #'+data.body.folio._id);
            });

            socketC.connection.on('infoAck', (data) => {
                let msgAck = data.result;
                let copyFolio = {...listFolios.current[msgAck.folio]};
                for(let i = (copyFolio.folio.message.length-1) ; i >= 0 ; i--){
                    if(copyFolio.folio.message[i]._id === msgAck.message._id){
                        copyFolio.folio.message[i] = msgAck.message;
                        break;
                    }
                }
                listFolios.current = {...listFolios.current, [msgAck.folio] : copyFolio};
                setRefresh(Math.random());
                console.log(data);
            });

            socketC.connection.on('newMessage', (data) => {
                let copyFolio = {...listFolios.current[data.folio]};
                if(!copyFolio.folio){return false;}
                copyFolio.folio.message.push(data.lastMessage);
                listFolios.current = {...listFolios.current, [data.folio] : copyFolio};

                if(window.localStorage.getItem('vFolio') != data.folio){
                    setUnRead({...unRead, [data.folio] : true});
                }

                if(data.lastMessage.class === 'call'){
                    CallController.answercall(data.lastMessage.externalId);
                    setSidCall(data.lastMessage.externalId);
                }
                
                setRefresh(Math.random());
                showMessage('Nuevo Mensaje de #'+data.folio);
                
                
            });

            socketC.connection.on('newInbox', (data) => {
                toast.warning('Nuevo Inbox de '+data.anchor);
                showMessage('Nuevo Inbox de '+data.anchor);
                setUnReadMessages(true);
            })
            

            
        },
        sendMessage : () => {

        }
    }

    const onFocus = () => {window.localStorage.setItem('tabIsActive', true);};
    
    const onBlur = () => {window.localStorage.setItem('tabIsActive', false);};

    const getColorStatusBar = () => {
        switch (isConnected){
            case -1:
                return 'statusBar';
            case 1:
                return 'statusBarGreen';
            case 2:
                return 'statusBarOff';
            default:
                return 'statusBar';
        }
    }

    useEffect(() => {
        window.addEventListener("focus", onFocus);
        window.addEventListener("blur", onBlur);
        onFocus();

        async function loadData(){
            try{
                const result = await axios(process.env.REACT_APP_CENTRALITA+'/agent/me/service');
                if(result.status === 200 && isInbound){
                    setComponent({...initializeComponent, home : true});
                    SocketActions.connectToSocket();
                }else{
                    return window.location.href = '/login';   
                }
            }catch(err){
                return window.location.href = '/login';
            }
        }
        if(onConnect){loadData();}
        notificationsSetup()
        return () => {console.log('desmontando')}
    },[]);

    useEffect(() => {
        console.log('refrescando');
        return () => {
            console.log('desmontando')
        }
    }, [refresh])

    const selectedComponent = (option) => {
        setComponent({...initializeComponent, [option] : true});
        setPage(option);
    }

    return ( <>
        <div className={getColorStatusBar()}></div>
        <div className='sideBar'>
            <SideBarMenu page={page} selectedComponent={selectedComponent} setOnConnect={setOnConnect} onConnect={onConnect} unReadMessages={unReadMessages}/>
        </div>
        <div className='contentDashboard'>
            <Toolbar isInbound={isInbound} setIsUnbound={setIsUnbound} isReady={isReady} userInfo={userInfo} setIsReady={setIsReady} setIsConnected={setIsConnected} isConnected={isConnected}/>
            {
                component.home && <HomeViewer sidCall={sidCall} setSidCall={setSidCall} unRead={unRead} setUnRead={setUnRead} isConnected={isConnected} userInfo={userInfo} show={component.home} listFolios={listFolios} refresh={refresh} setRefresh={setRefresh} onCall={onCall} setOnCall={setOnCall}/>
            }
            {
                component.inbox && <Inbox show={component.inbox} lsetRefresh={setRefresh} onCall={onCall} selectedComponent={selectedComponent} setUnReadMessages={setUnReadMessages}/>
            }
        </div>
        <ToastContainer />


        <Modal
            basic
            open={open}
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

        <Modal
            basic
            open={openInComingCall}
            size='small'
            >
            <Header icon>
                <Icon name='phone volume' />
                ¿Deseas Contestar la Llamada de {phoneNumber}?
            </Header>
            <Modal.Content>
                
            </Modal.Content>
            <Modal.Actions>
                <Button basic color='red' inverted onClick={() => {
                    SocketActions.rejectCall()
                }}>
                    <Icon name='remove' /> Colgar
                </Button>
                <Button color='green' inverted onClick={() => {SocketActions.acceptCall()}}>
                    <Icon name='checkmark'/> Contestar
                </Button>
            </Modal.Actions>
            </Modal>
    </> );
}
 
export default Home;