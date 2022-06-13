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
    

    const CallController = {
        setup : (token) => {
            callC.connection = new Device();
            callC.connection.setup(token, {
                sounds: {
                    outgoing: process.env.REACT_APP_CENTRALITA+'/cdn/sound/beepCalling.mp3',
                }
            });

            callC.connection.on('ready',() => {
                console.log('Usuario listo para recibir llamadas');
                toast.success('Listo para recibir llamadas.');
            });

            callC.connection.on('connect',() => {
                setOnCall('connect')
            });

            callC.connection.on('disconnect',() => {
                console.log('disconnect');
                setOnCall('disconnect');
            });

            callC.connection.on('error',(err) => {
                console.log('error',err);
                alert('Ocurrio un error');
            });

            callC.connection.on('incoming',(conn) => {
                setOnCall('incoming');
                conn.accept();
            });

            callC.connection.on('offline',() => {
                alert('Se ha desconectado de la línea telefónica, refreste el navegador.');
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
                    socketC.connection.emit('authCall', {token : window.localStorage.getItem('sdToken')},(data) => {
                        //if(data.success){
                            setIsReady(true);
                            
                        //}
                    });
                }else{
                    setOpen(true);
                    setMessage(data.message);
                }
            });

            socketC.connection.on('newFolio', (data) => {
                listFolios.current = {...listFolios.current, [data.body.folio._id] : data.body};
                if(data.body.folio.channel.name === 'call'){
                    if(Object.keys(callC.connection).length <= 0){
                        CallController.setup(data.token);
                    }
                    
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

                setRefresh(Math.random());
                showMessage('Nuevo Mensaje de #'+data.folio);
                
            });

            
        },
        sendMessage : () => {

        }
    }

    const onFocus = () => {window.localStorage.setItem('tabIsActive', true);console.log('activada')};
    
    const onBlur = () => {window.localStorage.setItem('tabIsActive', false);console.log('desactivada')};

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
            <SideBarMenu page={page} selectedComponent={selectedComponent} setOnConnect={setOnConnect} onConnect={onConnect}/>
        </div>
        <div className='contentDashboard'>
            <Toolbar isInbound={isInbound} setIsUnbound={setIsUnbound} isReady={isReady} userInfo={userInfo} setIsReady={setIsReady} setIsConnected={setIsConnected}/>
            {
                component.home && <HomeViewer isConnected={isConnected} userInfo={userInfo} show={component.home} listFolios={listFolios} refresh={refresh} setRefresh={setRefresh} onCall={onCall} setOnCall={setOnCall}/>
            }
            {
                component.inbox && <Inbox show={component.inbox} lsetRefresh={setRefresh} onCall={onCall}/>
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
    </> );
}
 
export default Home;