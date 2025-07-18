import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import SocketContext from '../../../controladores/SocketContext';
import ERRORS from './../../ErrorList';
import ListFoliosContext from '../../../controladores/FoliosContext';
import { useNotificationCenter } from "react-toastify/addons/use-notification-center";
import { FiClock } from "react-icons/fi";
import {
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Chip,
    Badge,
    Spacer,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button as HeroButton,
    Input,
    Select,
    SelectItem,
    Tooltip,
    addToast,
    ToastProvider,
} from "@heroui/react";

// Helper function to format time
const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Helper function to get today's date key for local storage
const getTodayKey = (activityId) => {
  const today = new Date().toISOString().split('T')[0];
  return `activity_timer_${activityId}_${today}`;
};


const Toolbar = ({ userInfo, isInbound, setIsUnbound, isReady, setIsReady, setIsConnected, isConnected }) => {
  // Timer related state
  const [activityTimer, setActivityTimer] = useState(0);
  const [currentActivityId, setCurrentActivityId] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const intervalRef = React.useRef(null);

  // Component state
  const [listFilesOubounds, setListFilesOubounds] = useState([]);
  const socketC = useContext(SocketContext);
  const [activities, setActivities] = useState([]);
  const [fullActivities, setFullActivities] = useState([]);
  const [currentActivity, setCurrentActivity] = useState(1);
  const [outboundAva, setOutboundAva] = useState(false);
  const listFolios = useContext(ListFoliosContext);
  const avatar = 'https://inboxcentralcdn.sfo3.cdn.digitaloceanspaces.com/assets/profilepic.jpg';
  const [userDetail, setUserDetail] = useState({ name: "Esperando..", prefetch: "Esperando...", profilePicture: avatar });
  const [automaticActivity, setAutomaticActivity] = useState(null);
  const [agentList, setAgentList] = useState(null);
  const [timing, setTiming] = useState(null);
  const [inAtention, setInAtention] = useState(null);
  const { notifications, clear, markAllAsRead, markAsRead, unreadCount } = useNotificationCenter();
  const [analytics, setAnalytics] = useState({ foliosOnHoldAll: '°°°', foliosOnBotAt: '°°°' });

  // State for Blank Folio Modal
  const [showBlankFolio, setShowBlankFolio] = useState(false);
  const [infoBlankFolio, setInfoBlankFolio] = useState(null);
  const initialBlankFolioState = { anchor: '', channel: '', queue: '', crm: {} };
  const [dataToBlank, setDataToBlank] = useState(initialBlankFolioState);
  const [onCreateBlank, setOnCreateBlank] = useState(false);
  const [placement, setPlacement] = useState('top-right'); // heroui toast
  
  // Timer functions
  const loadTimerData = useCallback((activityId) => {
    if (!activityId) return 0;
    const savedTimer = localStorage.getItem(getTodayKey(activityId));
    return savedTimer ? parseInt(savedTimer, 10) : 0;
  }, []);

  const saveTimerData = useCallback((activityId, seconds) => {
    if (!activityId) return;
    localStorage.setItem(getTodayKey(activityId), seconds.toString());
  }, []);

  const startTimer = useCallback((activityId) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setCurrentActivityId(activityId);
    const savedTime = loadTimerData(activityId);
    setActivityTimer(savedTime);
    
    intervalRef.current = setInterval(() => {
      setActivityTimer(prev => {
        const newTime = prev + 1;
        saveTimerData(activityId, newTime);
        return newTime;
      });
    }, 1000);
    
    setIsTimerRunning(true);
  }, [loadTimerData, saveTimerData]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsTimerRunning(false);
  }, []);
  
  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

    const getAgentActivitie = () => {
        socketC.connection.emit('activitieAgent', { agent: userInfo._id }, (result) => {
            setInAtention(result.inAtention);
            setTiming(result.timing);
            setAgentList(result.agentList);
        });
    };

    const getAnalytics = () => {
        if (userInfo) {
            socketC.connection.emit('getAnalyticsAgent', { proccess: '/folio/all', date: 'today', service: userInfo.service.id }, (result) => {
                setAnalytics(result.data)
            });
            getAgentActivitie()
        }
    };

    const changeConnection = () => {
        if (isConnected === -1) return false;
        const value = !isInbound;
        setIsUnbound(value);
        addToast({
            title: 'Se cambio el tipo de conexión',
            description: 'Se cambio el tipo de conexión a ' + (isInbound ? 'Outbound' : 'Inbound'),
            color: 'success'
        });
        setIsReady(false);
        if (!value) {
            socketC.connection.emit('disconnectToQueue', { token: window.localStorage.getItem('sdToken') }, (result) => {
                setIsReady(true);
            });
        } else if (value) {
            socketC.connection.emit('connecToQueue', { token: window.localStorage.getItem('sdToken') }, () => {
                setIsReady(true);
            });
        }
    };

    const createFolioBlank = () => {
        if (!dataToBlank.anchor || !dataToBlank.channel) {
            addToast({
                title: 'Error al crear el folio',
                description: 'El identificador y el canal son obligatorios.',
                color: 'warning'
            });
            return;
        }
        setOnCreateBlank(true);
        socketC.connection.emit('createBlankFolio', {
            token: window.localStorage.getItem('sdToken'),
            ...dataToBlank
        }, (response) => {
            setOnCreateBlank(false);
            if (response.success) {
                addToast({
                    title: 'Folio creado exitosamente',
                    description: 'Folio creado exitosamente.',
                    color: 'success'
                });
                setShowBlankFolio(false);
                setDataToBlank(initialBlankFolioState);
            } else {
                addToast({
                    title: 'Error al crear el folio',
                    description: (ERRORS[response.codeError] || "Error al crear el folio."),
                    color: 'danger'
                });
            }
        });
    };

    // Check for new day and reset timer if needed
    useEffect(() => {
        const checkForNewDay = () => {
            if (!currentActivityId) return;
            const today = new Date().toISOString().split('T')[0];
            const lastUpdated = localStorage.getItem(`activity_timer_${currentActivityId}_last_updated`);
            
            if (lastUpdated !== today) {
                // It's a new day, reset the timer
                setActivityTimer(0);
                saveTimerData(currentActivityId, 0);
                localStorage.setItem(`activity_timer_${currentActivityId}_last_updated`, today);
            }
        };

        // Check every minute if it's a new day
        const dayCheckInterval = setInterval(checkForNewDay, 60000);
        checkForNewDay(); // Initial check

        return () => clearInterval(dayCheckInterval);
    }, [currentActivityId, saveTimerData]);

    useEffect(() => {
        async function getInfo() {
            if (userInfo && !isInbound) {
                const responseOutbounds = await axios.get(process.env.REACT_APP_CENTRALITA + '/service/' + userInfo.service.id + '/outbound/list');
                const tmpList = responseOutbounds.data.outboundFiles.map((x) => ({ key: x._id, text: x.nameList, value: x._id }));
                setListFilesOubounds(tmpList);
            }
        }
        getInfo();
    }, [isInbound, userInfo]);

    useEffect(() => {
        const getPlugin = async () => {
            const resPlugin = await axios.get(process.env.REACT_APP_CENTRALITA + '/plugins/available');
            const outboundPlugin = resPlugin.data.plugins.find((x) => x.id === 'outbound');
            if (outboundPlugin) { setOutboundAva(true) }
        }
        getPlugin();
    }, []);



    useEffect(() => {
        const loadActivitiesAndConfig = async () => {
            if (!userInfo) return;
            const resService = await axios.get(process.env.REACT_APP_CENTRALITA + '/service/' + userInfo.service.id);
            const serviceData = resService.data.body.service;
            const acti = serviceData.activities;
            const availableAc = acti.filter((x) => x.status === true);
            const toActivities = availableAc.map((x) => ({ key: x._id, value: x._id, text: x.label, description: x.isConnect ? 'Recibe interacciones' : 'No recibe interacciones' }));
            const checkAutomaticActivity = acti.find((x) => (x.status === true && x.setAutomaticActivity === true));
            setFullActivities(acti);
            setActivities(toActivities);
            setAutomaticActivity(checkAutomaticActivity);

            if (serviceData) {
                const blankFolioConfig = {
                    channels: serviceData.channels?.filter(ch => ch.status && ch.allowCreateBlank) || [],
                    crm: serviceData.crm || []
                }
                setInfoBlankFolio(blankFolioConfig);
            }
        }

        if (userInfo) {
            const analyticsInterval = setInterval(getAnalytics, 8000);
            setUserDetail({ ...userDetail, name: userInfo.profile.name, prefetch: userInfo.service.prefetch });
            loadActivitiesAndConfig();
            return () => clearInterval(analyticsInterval);
        }
    }, [isReady, userInfo]);

    const requestItemList = async (e, { value }) => {
        socketC.connection.emit('outboundItem', { token: window.localStorage.getItem('sdToken'), service: userInfo.service.id, list: value }, (responseItem) => {
            if (!responseItem.success) {
                setPlacement('top-right');
                addToast({
                    title: 'Error al obtener la lista',
                    description: (ERRORS[responseItem.codeError] || responseItem.message),
                    color: 'danger'
                });
            }
        });
    }

    useEffect(() => {
        if (!userInfo.onlyteamchat && automaticActivity && isInbound) { 
            changeActivity(automaticActivity._id);
            startTimer(automaticActivity._id);
        }
    }, [automaticActivity, isInbound, userInfo, startTimer]);

    const changeActivity = async (key) => {
        if (userInfo.onlyteamchat) {
            setPlacement('top-right');
            addToast({
                title: 'No puedes cambiar de actividad',
                description: 'Solo tienes acceso a TeamChat, no puedes cambiar de actividad',
                color: 'warning',
            });
            return false;
        }
        let value = key;
        let activityObj = fullActivities.find((x) => x._id === value);
        if (activityObj) {
            if (listFolios.current.length > 1 && activityObj.isConnect) {
                addToast({
                    title: 'Finaliza ó Guarda los folios en pantalla para poder cambiar a "' + activityObj.label + '"',
                    description: 'Finaliza ó Guarda los folios en pantalla para poder cambiar a "' + activityObj.label + '"',
                    type: 'warning',
                    duration: 5000,
                    position: 'top-right'
                });
                setCurrentActivity(-1);
                return false;
            }
            
            // Stop current timer if running
            if (isTimerRunning) {
                stopTimer();
            }
            
            socketC.connection.emit('changeActivity', { token: window.localStorage.getItem('sdToken'), activity: activityObj }, (result) => {
                if (!result.success) {
                    addToast({
                        title: 'Error al cambiar de actividad',
                        description: 'La actividad no es válida',
                        color: 'danger'
                    });
                    return false;
                }
                
                // Start timer for the new activity
                if (value !== currentActivity) {
                    startTimer(value);
                }
                
                setIsConnected(activityObj.isConnect ? 1 : 2);
                setCurrentActivity(value);
                addToast({
                    title: 'Se cambió la actividad',
                    description: 'Se cambió la actividad a "' + activityObj.label + '"',
                    color: 'success'
                });
            });
        }
    }

    const selectedActivity = activities.find(act => act.key === currentActivity);

    return (
        <><div className="fixed z-[100]">
            <ToastProvider placement={placement} toastProps={{ timeout: 2000 }} />
         </div>
            <Navbar isBordered maxWidth="full" className="bg-gray-800 text-white h-16 shadow-md">
                <NavbarBrand className="mr-4">
                <Tooltip color="success" content= {"Asignación automática: " + userDetail.prefetch} placement="bottom">
                    <Chip color="primary" classNames={{
                            base: "bg-gradient-to-br from-indigo-500 to-pink-500 border-small border-white/50 shadow-pink-500/30",
                            content: "drop-shadow shadow-black text-white",
                        }} variant="shadow">{userDetail.name}
                        </Chip>
                    </Tooltip>
                        <Spacer x={4} />
                </NavbarBrand>

                <NavbarContent className="hidden sm:flex gap-4" justify="start">
                    {currentActivity && (
                        <NavbarItem className="flex items-center">
                            <Chip color="primary" startContent={<FiClock className="text-white" />} variant="flat" className="flex items-center gap-2">
                                <span className="font-mono text-white"> Tiempo en actividad: {formatTime(activityTimer)}</span>
                            </Chip>
                        </NavbarItem>
                    )}
                    <NavbarItem>
                        <Dropdown>
                            <DropdownTrigger>
                                <Chip color={isConnected === 1 ? "success" : isConnected === 2 ? "warning" : "default"} variant="shadow" className="cursor-pointer hover:scale-105 transition-transform">
                                    {selectedActivity ? selectedActivity.text : 'Seleccionar...'}
                                </Chip>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Agent Activities" items={activities} onAction={changeActivity}>
                                {(item) => (<DropdownItem key={item.key} description={item.description}>{item.text}</DropdownItem>)}
                            </DropdownMenu>
                        </Dropdown>
                    </NavbarItem>
                    <NavbarItem>
                        <Badge color="primary" content={analytics.foliosOnHoldAll} shape="circle"><span className="mr-2">Pendientes de Asignación</span></Badge>
                    </NavbarItem>
                    <NavbarItem>
                        <Badge color="secondary" content={analytics.foliosOnBotAt} shape="circle"><span className="mr-2">Bot Atendiendo</span></Badge>
                    </NavbarItem>
       

                </NavbarContent>

                <NavbarContent justify="end">

                    {!isInbound && (
                        <NavbarItem>
                            <Dropdown>
                                <DropdownTrigger>
                                    <Chip color="primary" variant="bordered" className="cursor-pointer">Campañas</Chip>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="Outbound Campaigns" items={listFilesOubounds} onAction={(key) => requestItemList(null, { value: key })}>
                                    {(item) => (<DropdownItem key={item.key}>{item.text}</DropdownItem>)}
                                </DropdownMenu>
                            </Dropdown>
                        </NavbarItem>
                    )}
                    <NavbarItem>

                        <Chip color="primary" classNames={{
                            base: "bg-gradient-to-br from-indigo-500 to-pink-500 border-small border-white/50 shadow-pink-500/30",
                            content: "drop-shadow shadow-black text-white",
                        }} variant="shadow">Inbox Central v.{process.env.REACT_APP_SYSTEM_VERSION}</Chip>
                    </NavbarItem>
                </NavbarContent>
            </Navbar>

            <Modal isOpen={showBlankFolio} onOpenChange={setShowBlankFolio} size="2xl" scrollBehavior="inside">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Nuevo Folio en Blanco</ModalHeader>
                            <ModalBody>
                                <h3 className="font-semibold text-lg mb-2">Datos del Folio</h3>
                                <div className="flex flex-col gap-4">
                                    <Input
                                        isRequired
                                        label="Identificador"
                                        placeholder="Teléfono, Email, etc."
                                        value={dataToBlank.anchor}
                                        onValueChange={(value) => setDataToBlank({ ...dataToBlank, anchor: value, queue: userInfo.service.queue })}
                                    />
                                    <Select
                                        isRequired
                                        label="Canal"
                                        placeholder="Selecciona un canal"
                                        items={infoBlankFolio?.channels || []}
                                        selectedKeys={dataToBlank.channel ? [dataToBlank.channel] : []}
                                        onChange={(e) => setDataToBlank({ ...dataToBlank, channel: e.target.value })}
                                    >
                                        {(channel) => <SelectItem key={channel._id} value={channel._id}>{channel.title}</SelectItem>}
                                    </Select>
                                    <Input
                                        isReadOnly
                                        label="Queue"
                                        value={userInfo.service.queue}
                                    />
                                </div>
                                <hr className="my-4"/>
                                <h3 className="font-semibold text-lg mb-2">Datos de Contacto</h3>
                                <div className="flex flex-col gap-4">
                                    {infoBlankFolio?.crm.map((field) => (
                                        <Input
                                            key={field._id}
                                            label={field.name}
                                            placeholder={field.name}
                                            value={dataToBlank.crm[field._id] || ''}
                                            onValueChange={(value) => {
                                                const tempCrm = { ...dataToBlank.crm };
                                                tempCrm[field._id] = value;
                                                setDataToBlank({ ...dataToBlank, crm: tempCrm });
                                            }}
                                        />
                                    ))}
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <HeroButton color="danger" variant="light" onPress={() => { setDataToBlank(initialBlankFolioState); onClose(); }}>
                                    Cancelar
                                </HeroButton>
                                <HeroButton color="primary" isLoading={onCreateBlank} onPress={createFolioBlank}>
                                    Crear Folio
                                </HeroButton>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}

export default Toolbar;