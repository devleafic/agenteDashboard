import React, {useState, useEffect, useContext} from 'react';
import {Modal, Checkbox, Icon, Dropdown, Button, Select, Header, Form, Divider, Segment, Popup, Image, Grid} from 'semantic-ui-react';
import {toast } from 'react-toastify';
import axios from 'axios';
import SocketContext from '../../../controladores/SocketContext';
import ERRORS from './../../ErrorList';
import avatar from './../../../img/avatars/matt.jpg';

import ListFoliosContext from '../../../controladores/FoliosContext';

import { useNotificationCenter } from "react-toastify/addons/use-notification-center";

const Toolbar = ({userInfo, isInbound, setIsUnbound, isReady, setIsReady, setIsConnected, isConnected}) => {

    const [listFilesOubounds, setListFilesOubounds] = useState([]);
    const socketC = useContext(SocketContext);
    const [showBlankFolio, setShowBlankFolio] = useState(false);
    const [infoBlankFolio, seteInfoBlankFolio] = useState(null);

    const [activities, setActivities] = useState([]);
    const [fullActivities, setFullActivities ] = useState([]);
    const [currentActivity, setCurrentActivity] = useState(1);
    const [outboundAva, setOutboundAva] = useState(false);

    const listFolios = useContext(ListFoliosContext);

    const [userDetail, setUserDetail] = useState({name : "Esperando..", prefetch:"Esperando..."});
    const [automaticActivity, setAutomaticActivity ] = useState(null);

    //notification center
    const {
        notifications,
        clear,
        markAllAsRead,
        markAsRead,
        unreadCount
    } = useNotificationCenter();
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const showToast = () => {
        toast('Hello World', {
            data: {
                title: 'Hello World Again',
                text: 'We are here again with another article'
            }
        });
    };     
    //notificaction center -----------------
    //const [lastActivity, setlastActivity] = useState(currentActivity); //save last activity, before change a new one
    const iniatilaze = {
        anchor : null,
        channel : null,
        queue : null,
        crm : {}
    }
    const [dataToBlank, setDataToBlank] = useState(iniatilaze);
    const [onCreateBlank, setOnCreateBlank] = useState(false);


    const [analytics, setAnalytics] = useState({
        //foliosPerDay : '-',
        //foliosEndPerDay : '-',
        //foliosSavePerDay: '-',
        foliosOnHoldAll: '°°°',
        foliosOnBotAt: '°°°'
    })

    const getAnalytics = () => {
        
        if (userInfo) {
            socketC.connection.emit('getAnalyticsAgent', {
            proccess : '/folio/all',
            date : 'today',
            service : userInfo.service.id
            },(result) => {
                setAnalytics(result.data)
            });
        }
    };

    const getIcon = (option) => {
       
        switch (option){
            case 'queue':
                if( analytics.foliosOnHoldAll > 0){
                    return (
                        <Icon.Group>
                            <Icon circular name='stack exchange' />
                            <Icon corner name='circle' color='red'/>
                        </Icon.Group>        
                    )
                }else{
                    return (
                        <Icon circular name='stack exchange' />
                    )
                }
            break;
            case 'notification': 
                return (
                    <Icon.Group>
                        <Icon circular name='bell' />
                        <Icon corner name='circle' color='red'   />
                    </Icon.Group> 
                )
            break;
        }
    }    

    const createFolioBlank = () => {

        setOnCreateBlank(true);
        socketC.connection.emit('createFolioBlank', {
            token : window.localStorage.getItem('sdToken'),
            blank : dataToBlank
        }, (result) => {
            setOnCreateBlank(false);
            setShowBlankFolio(false);
        })
    }

    const changeConnection = () => {
        if(isConnected === -1){
            return false
        }
        const value = !isInbound;
        setIsUnbound(value);
        toast.success('Se cambio el tipo de conexión a '+(isInbound ? 'Outbound' : 'Inbound'));
        setIsReady(false);
        if(!value){
            socketC.connection.emit('disconnectToQueue', {
                token : window.localStorage.getItem('sdToken')
            }, (result) => {
                console.log(result);
                setIsReady(true);
            })
        }else if (value){
            socketC.connection.emit('connecToQueue', {
                token : window.localStorage.getItem('sdToken')
            },() => {
                setIsReady(true);
            });
        }
    }

    const getToFolioBlank = () => {
        seteInfoBlankFolio(null);
        socketC.connection.emit('getToFolioBlank', {
            token : window.localStorage.getItem('sdToken'),
            service : userInfo.service.id
        },(result) => {
            setShowBlankFolio(true)
            seteInfoBlankFolio(result);
            
            if(result.channels.length === 0){
                
            }

            const temp = {};
            result.crm.map((x) => {
                temp[x._id] = '';
            })
            setDataToBlank({...dataToBlank, crm : temp})
        });
    }

    useEffect( () => {

        
        async function getInfo (){
        if(userInfo && !isInbound){
            const responseOutbounds = await axios.get(process.env.REACT_APP_CENTRALITA+'/service/'+userInfo.service.id+'/outbound/list');
            console.log(responseOutbounds.data);
            const tmpList = responseOutbounds.data.outboundFiles.map((x) => {
                
                return {
                    key: x._id,
                    text: x.nameList,
                    value: x._id,
                    icon : 'hand paper outline',
                    onClick : requestItemList
                }
            });
            setListFilesOubounds(tmpList);
            
        }
        }
        

    },[isInbound]);

    useEffect( () => {
        const getPlugin = async () => {
            
            const resPlugin = await axios.get(process.env.REACT_APP_CENTRALITA+'/plugins/available')
            
            const outboundPlugin = resPlugin.data.plugins.find((x) => {
                return x.id === 'outbound';
            });
            if(outboundPlugin){setOutboundAva(true)}
        }

         getPlugin();
    },[])

    useEffect(  () => {
        const loadActivities = async () => {
            const resService = await axios.get(process.env.REACT_APP_CENTRALITA+'/service/'+userInfo.service.id);
            const acti = resService.data.body.service.activities;

            const availableAc = acti.filter((x) => {return x.status === true});
            const toActivities = availableAc.map((x) => {
                return {key : x._id, value : x._id, text : x.label}
            });

            const checkAutomaticActivity = acti.find((x) => {return (x.status === true && x.setAutomaticActivity === true)});


            setFullActivities(acti);
            setActivities(toActivities);
            setAutomaticActivity(checkAutomaticActivity)


 
        }
        async function validateUser (){
            if(userInfo){
                setInterval(getAnalytics, 8000);
                setUserDetail({...userDetail, name: userInfo.profile.name, prefetch : 'Asignación automatica: ' + userInfo.service.prefetch})
                loadActivities();
            }
        }
        validateUser()

    }, [isReady]);

    const requestItemList = async (e, {value}) => {
        console.time('asignando')
        socketC.connection.emit('outboundItem', {
            token : window.localStorage.getItem('sdToken'),
            service : userInfo.service.id,
            list : value
        }, (responseItem) => {
            if(!responseItem.success){
                toast.error((ERRORS[responseItem.codeError]||responseItem.message));
            }
            console.timeEnd('asignando')
        });
    }

    useEffect( () => {
        if (automaticActivity && isInbound ){changeActivity()}
    }, [automaticActivity]);

    const changeActivity = async (e) => {    
        let value = e ?  e.target.value : automaticActivity._id
        let activityObj = fullActivities.find((x) => {
            return x._id === value;
        });

        if (activityObj) { 
          if(listFolios.current.length > 1 && activityObj.isConnect){
              toast.warning('Finaliza ó Guarda los folios en pantalla para poder cambiar a "'+activityObj.label+'"',{
                position: "top-right",
                autoClose: 5000,
                closeOnClick: true,
                pauseOnHover: false,
                });
                setCurrentActivity(-1)
              return false;
          }
          socketC.connection.emit('changeActivity', {
                token : window.localStorage.getItem('sdToken'),
                activity : activityObj
            }, (result) => {
                if(!result.success){
                    toast.error('La actividad no es válida');
                    return false;
                }
                setIsConnected(activityObj.isConnect ? 1 : 2);
                setCurrentActivity(value);
                //setlastActivity(value)
                toast.success('Se cambió la actividad a "'+activityObj.label+'"',{
                    position: "top-right",
                    autoClose: 1500,
                    closeOnClick: true,
                    pauseOnHover: false,
                    });
            })
        }

    }

    //<Button basic color='blue' onClick={getToFolioBlank}>Folio en Blanco</Button>
    return (
        <div className="toolbar" style={{textAlign:'right', margintRight: '20px'}} >
            {
                <div style={{float: 'left'}}  >
                  {/*  <Popup trigger={getIcon("notification")} flowing hoverable>
                        <Grid centered divided columns={2}>
                        <Grid.Column textAlign='center'>
                            <Header as='h4'>En pila de espera</Header>
                            <p>
                            <b>{analytics.foliosOnHoldAll}</b> usuarios
                            </p>
                            <p>
                            <b>Pendientes de asignación acumulados en pilas configuradas.</b>
                            </p>
                        </Grid.Column>
                        <Grid.Column textAlign='center'>
                            <Header as='h4'>Bot</Header>
                            <p>
                            <b>{analytics.foliosOnBotAt}</b> usuarios
                            </p>
                            <p>
                            <b>En atención por Bot 🤖</b>
                            </p>
                        </Grid.Column>
                        </Grid>
            </Popup>   */}                 
                  <Popup trigger={getIcon("queue")} flowing hoverable>
                    <Grid centered divided columns={2}>
                    <Grid.Column textAlign='center'>
                        <Header as='h4'>En pila de espera</Header>
                        <p>
                        <b>{analytics.foliosOnHoldAll}</b> usuarios
                        </p>
                        <p>
                        <b>Pendientes de asignación acumulados en pilas configuradas.</b>
                        </p>
                    </Grid.Column>
                    <Grid.Column textAlign='center'>
                        <Header as='h4'>Bot</Header>
                        <p>
                        <b>{analytics.foliosOnBotAt}</b> usuarios
                        </p>
                        <p>
                        <b>En atención por Bot 🤖</b>
                        </p>
                    </Grid.Column>
                    </Grid>
                </Popup>
               </div>
               
            }
            {
                isReady && !isInbound && (<><Dropdown
                    button
                    className='icon'
                    floating
                    labeled
                    icon='list alternate outline'
                    options={listFilesOubounds}
                    search
                    text='Listas de Outbounds'
                    style={{marginRight : 20}}
                /></>)
            }
            {
                !isReady ? <>Conectando . . . <Icon loading name='spinner' size='large'/></> : (outboundAva && <Checkbox toggle color='blue' checked={isInbound} onClick={changeConnection} disabled={isConnected === -1 ? true : false}/> )
            }
            
            {
                
                isReady && (
                    <select name='selectedAtivity' onChange={changeActivity} className='selectActivity'>
                        <option value={-1} selected={currentActivity === -1}>Selecciona una actividad</option>
                        {
                            activities.map((x) => {return <option value={x.value} key={x.key} selected={currentActivity === x.key}>{x.text}</option>})
                        }
                    </select>
                )
            }
            {

            isReady && (


                    <Popup href="#"
                    content={userDetail.prefetch}
                    key={userDetail.name}
                    header={userDetail.name}
                    trigger={<Image src={avatar} avatar />}
                    />


                )
            }   
            {
                showBlankFolio && infoBlankFolio && (<>
                    <Modal
                    onClose={() => setShowBlankFolio(false)}
                    onOpen={() => setShowBlankFolio(true)}
                    open={showBlankFolio}
                    closeOnEscape={false}
                    closeOnDimmerClick={false}
                    trigger={<Button>Show Modal</Button>}
                    >
                    <Modal.Header>Nuevo Folio en Blanco</Modal.Header>
                    <Modal.Content>
                        <Modal.Description>
                            
                            
                            <Form key={'form-blank'}>
                                <Segment>
                                    <Header as='h3'>
                                        <Icon name='ticket alternate' />
                                        <Header.Content>Datos del Folio</Header.Content>
                                    </Header>
                                    <Form.Field key={'field-blank-anchor'}>
                                        <label>Identificador</label>
                                        <input key={'blank-anchor'} placeholder={'(Télefono, Whatsapp)'} value={dataToBlank.anchor} onChange={(e) => {
                                            setDataToBlank({...dataToBlank, anchor : e.target.value, queue : userInfo.service.queue})
                                        }}/>
                                    </Form.Field>
                                    <Form.Field key={'field-blank-channel'}>
                                        <label>Canal</label>
                                        <Select placeholder='Selecciona un canal' options={infoBlankFolio.channels.map((x) => {
                                            return {
                                                key : x._id,
                                                value : x._id,
                                                text : x.title
                                            }
                                        })} onChange={(e, {value}) => {
                                            setDataToBlank({...dataToBlank, channel : value})
                                        }}/>
                                    </Form.Field>
                                    <Form.Field key={'field-blank-queue'}>
                                        <label>Queue</label>
                                        <input readOnly={true} key={'blank-anchor'} value={userInfo.service.queue}/>
                                    </Form.Field>
                                    <Divider section />
                                    
                                    <Header as='h3'>
                                        <Icon name='address book' />
                                        <Header.Content>Datos de contacto</Header.Content>
                                    </Header>
                                    {
                                    infoBlankFolio.crm.map((x) => {
                                        return (
                                            <Form.Field key={'field-blank-'+x._id}>
                                                <label>{x.name}</label>
                                                <input key={'blank-'+x._id} placeholder={x.name} value={dataToBlank.crm[x._id]} onChange={(e) => {
                                                    const tempCrm = {...dataToBlank.crm}
                                                    tempCrm[x._id] = e.target.value;
                                                    setDataToBlank({...dataToBlank, crm : tempCrm});
                                                }}/>
                                            </Form.Field>
                                        )
                                    })
                                    }
                                </Segment>
                                
                                
                            </Form>
                        </Modal.Description>
                    </Modal.Content>
                    <Modal.Actions>
                        <Button color='black' loading={onCreateBlank} disabled={onCreateBlank} onClick={() => {setDataToBlank(iniatilaze); setShowBlankFolio(false)}}>Cancelar</Button>
                        <Button
                        loading={onCreateBlank} disabled={onCreateBlank}
                        content="Crear"
                        labelPosition='right'
                        icon='file text'
                        onClick={() => {createFolioBlank(); }}
                        positive
                        />
                    </Modal.Actions>
                    </Modal>
                </>)
            }
        </div>)
}
 
export default Toolbar;