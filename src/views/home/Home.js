import React, {useState, useEffect, useContext, useReducer} from 'react';
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

    function reducer(state, action) {
        switch (action.type) {
          case 'unRead':
            return {...state, [action.folio] : true}
          case 'read':
            let copy = {...state}
            delete copy[action.folio];
            return copy;
          default:
            throw new Error();
        }
      }

    const [unReadFolios, dispatch] = useReducer(reducer, {});

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
    
    //const [unRead, setUnRead ] = useState({});

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

    const showMessage = (message, ignore) => {
        console.log('------------',window.localStorage.getItem('tabIsActive'));
        if(!ignore && window.localStorage.getItem('tabIsActive') === 'true'){return false;}
        var notification = new Notification(message);
        console.log('se envió el mensaje al navegador '+ message)
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
            socketC.connection = io(process.env.REACT_APP_CENTRALITA, { transports : ['websocket']});

            socketC.connection.on('disconnect', () => {
                setOpen(true);
                setMessage('Se rompio la conexión con el servidor o fuiste desconectado por el supervisor, intente en unos minutos nuevamente.');
            });

            socketC.connection.on('connect', () => {
                if(isReady){
                    window.location.reload(false);
                }
            });

            socketC.connection.io.on("reconnect", () => {
                toast.info('Reconectando con el servidor');
                window.localStorage.setItem('event','reconnect');
                
                
                setTimeout(() => {
                    window.location.reload();
                },2000)
            });

            socketC.connection.emit('handShakeToSocket', {
                token : window.localStorage.getItem('sdToken')
            },async (data) => {
                if(data.success){
                    toast.success('Se ha conectado al servidor correctamente');

                    // let pulgins = window.localStorage.getItem('plugins')
                    // let chCall = pulgins.find((x) => {
                    //     return x.id === 'call'
                    // })

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
                        setRefresh(Math.random());
                    });
    
                    callC.connection.on('offline',() => {
                        alert('Se ha desconectado de la línea telefónica, refreste el navegador.');
                    });
                    
                    if(window.localStorage.getItem('event')){
                        showMessage('Selecciona una actividad nuevamente', true);
                        window.localStorage.removeItem('event');
                    }

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
                
                listFolios.current.push(data.body);
                if(window.localStorage.getItem('vFolio') != data.body.folio._id){
                    dispatch({type : 'unRead', folio : data.body.folio._id});
                }

                if(data.body.folio.channel.name === 'call'){
                    if(Object.keys(callC.connection).length <= 0){
                        // await CallController.setup(data.token);

                        
                    }
                    setSidCall(data.body.folio.message[data.body.folio.message.length-1].externalId);
                    CallController.answercall(data.body.folio.message[data.body.folio.message.length-1].externalId);
                    
                }

                setRefresh(Math.random());
                showMessage('Nuevo Folio Asignado #'+data.body.folio._id);
            });

            socketC.connection.on('infoAck', (data) => {
                let msgAck = data.result;
                
                let index = listFolios.current.findIndex((x) => {return x.folio._id === msgAck.folio});
                let copyFolio = listFolios.current[index];

                for(let i = (copyFolio.folio.message.length-1) ; i >= 0 ; i--){
                    if(copyFolio.folio.message[i]._id === msgAck.message._id){
                        copyFolio.folio.message[i] = msgAck.message;
                        break;
                    }
                }
                
                listFolios.current[index] = copyFolio;
                setRefresh(Math.random());
                console.log(data);
            });

            socketC.connection.on('newMessage', (data) => {
                
                let index = listFolios.current.findIndex((x) => {return x.folio._id === data.folio});
                let copyFolio = listFolios.current[index];
                if(!copyFolio.folio){return false;}
                copyFolio.folio.message.push(data.lastMessage);
                
                listFolios.current[index] = copyFolio;
                if(window.localStorage.getItem('vFolio') != data.folio){
                    dispatch({type : 'unRead', folio : data.folio});
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

    const onFocus = () => {window.localStorage.setItem('tabIsActive', true);console.log('Ventana activa')};
    
    const onBlur = () => {window.localStorage.setItem('tabIsActive', false);console.log('Ventana desactivada')};

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
        window.localStorage.setItem('tabIsActive', false)
        onFocus();

        function getLocalStream() {
            navigator.mediaDevices.getUserMedia({video: false, audio: true}).then( stream => {
                window.localStream = stream; // A
                window.localAudio.srcObject = stream; // B
                window.localAudio.autoplay = true; // C
            }).catch( err => {
                console.log("u got an error:" + err)
            });
        }
        getLocalStream();
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
                component.home && <HomeViewer dispatch={dispatch} unReadFolios={unReadFolios} sidCall={sidCall} setSidCall={setSidCall} isConnected={isConnected} userInfo={userInfo} show={component.home} listFolios={listFolios} refresh={refresh} setRefresh={setRefresh} onCall={onCall} setOnCall={setOnCall}/>
            }
            {
                component.inbox && <Inbox show={component.inbox} lsetRefresh={setRefresh} onCall={onCall} selectedComponent={selectedComponent} setUnReadMessages={setUnReadMessages}/>
            }
        </div>
        


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