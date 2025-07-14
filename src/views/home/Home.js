import React, {useState, useEffect, useContext, useReducer} from 'react';
import SideBarMenu from "./partials/SideBarMenu";
import Toolbar from './partials/Toolbar';
import io from 'socket.io-client';
import axios from 'axios';
import { Device, Call } from '@twilio/voice-sdk';
import { toast } from 'react-toastify';
import { Modal, Header, Icon, Button, Popup} from 'semantic-ui-react';

/* Contexto */
import ListFoliosContext from './../../controladores/FoliosContext';
import SocketContext from '../../controladores/SocketContext';
import CallContext from '../../controladores/CallContext';

/* Componentes */
import HomeViewer from './partials/HomeViewer';
import Inbox from './partials/Inbox';
import Follow from './partials/Follow';
import Contacts from './partials/Contacts';
import Calendar from './partials/Calendar';
import InternalChat from './internalChat/InternalChat';

window.mobileAndTabletCheck = function() {
    let check = false;
    //eslint-disable-next-line
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
  };

const Home = () => {
        
    const initializeComponent = {
        home : false,
        Inbox : false,
        follow : false,
        contacts :  false,
        calendar :  false,
        InternalChat : false
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

    function countMessage(state, action){
        switch (action.type) {
            case 'unRead':
                let copyC = !state[action.folio] ? (action.init ? action.init : 0 ) : state[action.folio];
                return {...state, [action.folio] : copyC+1}
            case 'read':
                let copy = {...state}
                delete copy[action.folio];
                return copy;
            default:
            throw new Error();
        }
    } 
    const [countunReadMsg, dispatchCount ] = useReducer(countMessage, {});


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
    
    

    const [sidCall, setSidCall] = useState(null);
    const [connCall, setConnCall] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState(null);
    const [openInComingCall, setOpenInComingCall] = useState(false);
    const [unReadMessages, setUnReadMessages] = useState(false);

    const [vFolio, setVFolio] = useState(null);

    const closeSession = () => {
        window.localStorage.removeItem('sdToken');
        window.localStorage.removeItem('myName');
        window.location = '/login'
    }

    const CallController = {
        setup : () => { // Token parameter removed as it's fetched internally
            return new Promise((resolve, reject) => {
                socketC.connection.emit('authCall', {token : window.localStorage.getItem('sdToken')},(authData) => {
                    if(!authData.success){
                        toast.error(authData.message);
                        reject(new Error(authData.message));
                        return;
                    }

                    try {
                        callC.connection = new Device(authData.token, {
                            logLevel: 'debug', // Enable SDK debug logging for @twilio/voice-sdk
                            // Example: edge: ['ashburn', 'frankfurt'], // Optional: specify edge locations
                            iceServers: [{ urls: 'stun:global.stun.twilio.com:3478?transport=udp' }],
                            codecPreferences: ['pcmu'], // Prioritize PCMU (G.711u)
                            forceAggressiveIceNomination: true // May help in restrictive networks
                        });

                        callC.connection.on(Device.EventName.Registered, () => {
                            console.log("Twilio Device Registered");
                            setIsReady(true); // Set application ready state
                            resolve(true);
                        });

                        callC.connection.on(Device.EventName.Error, (error) => {
                            console.error("Twilio Device Registration Error:", error);
                            toast.error(`Twilio Device Error: ${error.message}`);
                            // Consider setting isReady to false or other UI updates
                            reject(error);
                        });
                        
                        // Optional: Listen for unregistration if needed
                        // callC.connection.on(Device.EventName.Unregistered, () => {
                        //     console.log("Twilio Device Unregistered");
                        //     setIsReady(false);
                        // });

                        callC.connection.register();

                    } catch (error) {
                        console.error("Error initializing Twilio Device:", error);
                        toast.error("Failed to initialize Twilio Device.");
                        reject(error);
                    }
                });
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

    // useEffect for Twilio Device event listeners
    useEffect(() => {
        // Ensure callC.connection is the new Device instance and the device is registered (isReady)
        if (callC.connection && callC.connection instanceof Device && isReady) {
            const device = callC.connection;

            const handleIncomingCall = (callInstance) => {
                console.log(`Incoming call from ${callInstance.callerInfo?.from}`);
                toast.info(`Llamada entrante de ${callInstance.callerInfo?.from || 'Desconocido'}`);
                setOnCall('incoming');
                setConnCall(callInstance); // connCall now holds a @twilio/voice-sdk Call object
                setPhoneNumber(callInstance.callerInfo?.from || 'Unknown caller');

                // Attach listeners to this specific call object
                callInstance.on('accept', (acceptedCall) => {
                    console.log('Call accepted by SDK');
                    setOnCall('connect');
                    setRefresh(prev => prev + 1);
                });

                callInstance.on('disconnect', () => {
                    console.log('Call disconnected');
                    toast.warn('Llamada desconectada.');
                    setOnCall('disconnect');
                    setConnCall(null);
                    setOpenInComingCall(false); // Ensure incoming call modal is closed
                    setRefresh(prev => prev + 1);
                    window.localStorage.setItem('autoAccept', 'false');
                });

                callInstance.on('error', (error) => {
                    console.error('Call Error:', error);
                    toast.error(`Error en llamada: ${error.message}`);
                    setOnCall('disconnect'); 
                    setConnCall(null);
                    setOpenInComingCall(false); // Ensure incoming call modal is closed
                    setRefresh(prev => prev + 1);
                    window.localStorage.setItem('autoAccept', 'false');
                });
                
                if (window.localStorage.getItem('autoAccept') === 'true') {
                    console.log('Auto-accepting call');
                    callInstance.accept();
                } else {
                    console.log('Showing incoming call modal');
                    setOpenInComingCall(true);
                }
                setRefresh(prev => prev + 1);
            };

            // The general Device.EventName.Error is already handled in CallController.setup's registration attempt.
            // If additional general device errors need handling post-registration, another listener can be added here.

            device.on(Device.EventName.Incoming, handleIncomingCall);

            // Cleanup listeners when component unmounts or dependencies change
            return () => {
                device.removeListener(Device.EventName.Incoming, handleIncomingCall);
                // If connCall (the active callInstance) exists and has listeners, 
                // they are typically managed by the SDK when the call ends.
                // Explicit removal can be done if needed: 
                // if (connCall && typeof connCall.removeAllListeners === 'function') { connCall.removeAllListeners(); }
            };
        }
    }, [callC.connection, isReady, setOnCall, setConnCall, setPhoneNumber, setOpenInComingCall, setRefresh, toast]); // Added toast to dependencies

    const notificationsSetup = async () => {
        if(window.mobileAndTabletCheck()){
            console.log('Es un mobile');
            return false;
        }
        try {
            Notification.requestPermission();
        }catch(err){
            console.log(err)
            return false
        }
    }

    const showMessage = (message, ignore) => {
        if(window.mobileAndTabletCheck()){
            console.log('Es un mobile');
            return false;
        }
        //console.log('------------',window.localStorage.getItem('tabIsActive'));
        if(!ignore && window.localStorage.getItem('tabIsActive') === 'true'){return false;}
        try {
            var notification = new Notification(message);
            //console.log('se envió el mensaje al navegador '+ message)
            notification.onclick = function(){window.focus();this.close();}
        }catch(err){
            console.log(err)
            return false
        }
    }

    const SocketActions = {
        acceptCall : () => {
            if (connCall && typeof connCall.accept === 'function') {
                console.log('SocketActions: Accepting call via connCall.accept()');
                connCall.accept();
                // UI state like onCall will be updated by the Call.EventName.Accept listener
            } else {
                console.warn('SocketActions.acceptCall: connCall not available or not a valid Call object.');
            }
            setOpenInComingCall(false); // Close the incoming call modal immediately
        },
        rejectCall : () => {
            if (connCall && typeof connCall.reject === 'function') {
                console.log('SocketActions: Rejecting call via connCall.reject()');
                connCall.reject();
                // UI state like onCall, connCall will be updated by the Call.EventName.Disconnect listener
            } else {
                console.warn('SocketActions.rejectCall: connCall not available or not a valid Call object.');
            }
            setOpenInComingCall(false); // Close the incoming call modal immediately
            // Setting onCall and connCall here might be redundant if Call.EventName.Disconnect handles it,
            // but can provide faster UI feedback if desired. For consistency, let's rely on the event listener.
            // setOnCall('disconnect'); 
            // setConnCall(null);
            // setRefresh(Math.random());
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

                    
                    toast.success('Se ha conectado al servidor correctamente', {
                        position: "top-right",
                        autoClose: 1000,
                        hideProgressBar: true,
                        closeOnClick: true,
                        pauseOnHover: false,
                        draggable: true,
                        progress: undefined,
                        theme: "colored",
                        });

                    // let pulgins = window.localStorage.getItem('plugins')
                    // let chCall = pulgins.find((x) => {
                    //     return x.id === 'call'
                    // })

                    if(window.localStorage.getItem('event')){
                        showMessage('Selecciona una actividad nuevamente', true);
                        window.localStorage.removeItem('event');
                    }

                    setUserInfo(data.user);
                    await window.localStorage.setItem('userId', data.user._id);
                    setIsReady(true);
                    window.localStorage.setItem('autoAccept', false);

                    socketC.connection.emit('loadInbox', {
                        token : window.localStorage.getItem('sdToken')
                    },(data) => {         
                        let hasUnread = data.inboxes.find((x) => {
                            return x.status === 1 && !x.pipeline ? true : false;
                        })
                        setUnReadMessages(hasUnread?true:false);
                    });
        
                }else{
                    setOpen(true);
                    setMessage(data.message);
                }
            });

            socketC.connection.on('newFolio', async (data) => {

                const isOpenFolio = listFolios.current.find((x) => {
                    return x.folio._id === data.body.folio._id;
                })

                if(isOpenFolio){
                    toast.info('El folio ya se encuentra abierto');
                    return false;
                }
                
                listFolios.current.push(data.body);
                dispatchCount({type : 'unRead', folio : data.body.folio._id, init : 0});
                if(window.localStorage.getItem('vFolio') !== data.body.folio._id){
                    dispatch({type : 'unRead', folio : data.body.folio._id});
                }

                if(data.body.folio.channel.typeChannel === '_CALL_'){
                    // Check if the Twilio Device needs to be set up (e.g., if not already ready)
                    // The new SDK's Device events (incoming, error, etc.) are handled by the dedicated useEffect or in CallController.setup.
                    // The primary action here for a new call folio is to ensure the device is ready and then potentially
                    // trigger an outgoing call or handle an incoming call that's signaled via this 'newFolio' socket event.

                    const setupAndProcessCall = async () => {
                        if (!isReady) { // isReady is set to true when Device is registered
                            try {
                                console.log("'newFolio' event: Twilio Device not ready, attempting setup.");
                                await CallController.setup(); // Setup will try to register the device
                                // After setup, isReady should become true, and the new useEffect will handle incoming calls.
                                // If this 'newFolio' implies an *outgoing* call initiated by the server, that logic would go here.
                            } catch (error) {
                                console.error("'newFolio' event: Error during CallController.setup:", error);
                                toast.error('Error al configurar el dispositivo de llamadas para el nuevo folio.');
                                return; // Stop processing if setup fails
                            }
                        }
                        
                        // At this point, the device should be ready or attempting to become ready.
                        // The new useEffect handles Device.EventName.Incoming.
                        // If this 'newFolio' event is for an *existing* call that this client needs to join or an *outgoing* call:
                        const callSid = data.body.folio.message[data.body.folio.message.length-1]?.externalId;
                        if (callSid) {
                            setSidCall(callSid);
                            // The CallController.answercall might need to be re-evaluated.
                            // If it's an inbound call, the new useEffect should handle it via Device.EventName.Incoming.
                            // If it's an instruction to make an OUTBOUND call or connect to an existing conference, that's different.
                            // For now, let's assume 'answercall' was specific to the old SDK's flow for server-initiated calls.
                            // We might need to make an outgoing call here if that's the intent:
                            // e.g., if (callC.connection && isReady) { callC.connection.connect({ params_for_outgoing_call }); }
                            console.log(`'newFolio' (CALL): SID ${callSid}. Incoming calls are handled by Device.EventName.Incoming listener.`);
                            // If CallController.answercall was to trigger TwiML or server-side logic for an incoming call, it might still be relevant.
                            // CallController.answercall(callSid); // This line's relevance needs to be confirmed based on its original purpose.
                        } else {
                            console.warn("'newFolio' (CALL): No externalId (Call SID) found in message.");
                        }
                    };

                    setupAndProcessCall();
                }

                setRefresh(Math.random());
                showMessage('Nuevo Folio Asignado #'+data.body.folio._id);
            });

            socketC.connection.on('infoAck', (data) => {
                try{   
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

                }catch(err){
                   console.log(err);
                };
            });

            socketC.connection.on('newMessage', (data) => {
                
                let index = listFolios.current.findIndex((x) => {return x.folio._id === data.folio});
                let copyFolio = listFolios.current[index];
                if(!copyFolio || !copyFolio.folio){return false;}
                copyFolio.folio.message.push(data.lastMessage);
                
                listFolios.current[index] = copyFolio;
                if(window.localStorage.getItem('vFolio') !== data.folio){
                    dispatch({type : 'unRead', folio : data.folio});
                }

                if(data.lastMessage.class === 'call'){
                    CallController.answercall(data.lastMessage.externalId);
                    setSidCall(data.lastMessage.externalId);
                }

                window.localStorage.setItem('lastMessage', data.folio)
                
                setRefresh(Math.random());
                showMessage('Nuevo Mensaje de #'+data.folio);
                console.log(countunReadMsg)
                dispatchCount({type : 'unRead', folio : data.folio});
                
            });

            socketC.connection.on('newInbox', (data) => {
                toast.warning('Nuevo Inbox de '+data.aliasId + ' #'+data.anchor);
                showMessage('Nuevo Inbox de  '+data.aliasId + ' #'+data.anchor);
                setUnReadMessages(true);
                //Automatic assign 
                console.log("data.fullFolio" , data.fullFolio)
                openItemInbox(data.fullFolio, data.item)
            })
            

            
        },
        sendMessage : () => {

        }
    }
    const openItemInbox = (folio, item) => {
        console.time('openItemInbox');
        //setIsLoadInboxFolio(true)
        socketC.connection.emit('openItemInbox', {
            fromNotification :  true, //trying to open an inbox after notificaction 
            token : window.localStorage.getItem('sdToken'),
            folio : folio,
            item
        },(data) => {
           
            //setIsLoadInboxFolio(false);
            if(!data.success && data.automaticAssign){
                toast.error(data.message);
                return false;
            } else if (!data.success && !data.automaticAssign){
                return false;
            }

            //setVFolio(folio._id)
            toast.success(<label>Se abrió el folio <b>#{folio._id}</b></label>);
            //selectedComponent('home')
            const isOpenFolio = listFolios.current.find((x) => {
                return x.folio._id === folio._id;
            })

            if(isOpenFolio){
                toast.info('El folio ya se encuentra abierto');
                return false;
            }
            
            listFolios.current.push(folio);
            dispatchCount({type : 'unRead', folio :folio._id, init : 0});
            if(window.localStorage.getItem('vFolio') !== data.body.folio._id){
                dispatch({type : 'unRead', folio : data.body.folio._id});
            }
            console.timeEnd('openItemInbox')
        });
    }

    const onFocus = () => {window.localStorage.setItem('tabIsActive', true);/*console.log('Ventana activa')*/};
    
const onBlur = () => {window.localStorage.setItem('tabIsActive', false);/*console.log('Ventana desactivada')*/};

    const getColorStatusBar = () => {
        switch (isConnected){
            case -1:
                return 'statusBar';
            case 1:
                return 'statusBarblue';
            case 2:
                return 'statusBarOff';
            default:
                return 'statusBar';
        }
    }

    useEffect( () => {


        async function getLocalStream () {
            navigator.mediaDevices.getUserMedia({video: false, audio: true}).then( stream => {
                window.localStream = stream; // A
                window.localAudio.srcObject = stream; // B
                window.localAudio.autoplay = true; // C
            }).catch( err => {
                console.log("u got an error:" + err)
            });
        }
        getLocalStream();

    },[]);    
    useEffect( () => {
        notificationsSetup()
    },[]);

    // useEffect to update the CallContext with the active @twilio/voice-sdk Call object
    useEffect(() => {
        if (callC) { // Ensure callC from context is available
            callC.activeCall = connCall; // connCall is the state variable holding the active Call object
        }
    }, [callC, connCall]);

    useEffect( () => {

      async function loadData(){
            if(onConnect){
                try{
                    window.addEventListener("focus", onFocus);
                    window.addEventListener("blur", onBlur);
                    window.localStorage.setItem('tabIsActive', false)
                    onFocus();
                
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
        }
       //loadData();}
        //
        loadData();
        //return   loadData();// () => {console.log('desmontando')}
    },[]);

    useEffect( () => {
        async function data () {
            console.log('refrescando');
            //return () => {
                console.log('desmontando not function')
            //}
        }
        data();
    }, [refresh])

    const selectedComponent = (option) => {
        setComponent({...initializeComponent, [option] : true});
        setPage(option);
    }

    return ( <>
        
        <div className={getColorStatusBar()}></div>
        <div className='sideBarHome'>
            <SideBarMenu page={page} selectedComponent={selectedComponent} setOnConnect={setOnConnect} onConnect={onConnect} unReadMessages={unReadMessages} isConnected={isConnected}/>
        </div>
        <div className='contentDashboard'>
            <Toolbar isInbound={isInbound} setIsUnbound={setIsUnbound} isReady={isReady} userInfo={userInfo} setIsReady={setIsReady} setIsConnected={setIsConnected} isConnected={isConnected}/>
            {
                component.home && <HomeViewer vFolio={vFolio} setVFolio={setVFolio} dispatch={dispatch} countunReadMsg={countunReadMsg} dispatchCount={dispatchCount} unReadFolios={unReadFolios} sidCall={sidCall} setSidCall={setSidCall} isConnected={isConnected} userInfo={userInfo} show={component.home} listFolios={listFolios} refresh={refresh} setRefresh={setRefresh} onCall={onCall} setOnCall={setOnCall}/>
            }
            {
                component.inbox && <Inbox  vFolio={vFolio} setVFolio={setVFolio} show={component.inbox} lsetRefresh={setRefresh} onCall={onCall} selectedComponent={selectedComponent} setUnReadMessages={setUnReadMessages}/>
            }
                        {
                component.follow && <Follow  vFolio={vFolio} setVFolio={setVFolio} show={component.follow} lsetRefresh={setRefresh} onCall={onCall} selectedComponent={selectedComponent} setUnReadMessages={setUnReadMessages}/>
            }
            {
                component.contacts && <Contacts  vFolio={vFolio} setVFolio={setVFolio} show={component.contacts} lsetRefresh={setRefresh} onCall={onCall} selectedComponent={selectedComponent} setUnReadMessages={setUnReadMessages}  userInfo={userInfo} />
            } 
            {
                component.calendar && <Calendar  vFolio={vFolio} setVFolio={setVFolio} show={component.contacts} lsetRefresh={setRefresh} onCall={onCall} selectedComponent={selectedComponent} setUnReadMessages={setUnReadMessages}/>
            }
            {
                component.InternalChat && <InternalChat  show={component.InternalChat} selectedComponent={selectedComponent} userInfo={userInfo}/>
            }        
        </div>
        


        <Modal
            basic
            open={open}
            size='small'
            >
            <Header icon>
                <Icon name='unlinkify' />
                Aviso
            </Header>
            <Modal.Content>
                <center>{message} <br></br>
                <Popup content='Iniciar Sesión con otro usuario' trigger={<Button icon='log out' onClick={closeSession}/>} position='right center'/></center>
                
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