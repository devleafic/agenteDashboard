import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import SocketContext from '../../../controladores/SocketContext';
import ERRORS from './../../ErrorList';
import ListFoliosContext from '../../../controladores/FoliosContext';
import { useNotificationCenter } from "react-toastify/addons/use-notification-center";
import {
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    User,
    Chip,
    Switch,
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
    SelectItem
} from "@heroui/react";

const Toolbar = ({ userInfo, isInbound, setIsUnbound, isReady, setIsReady, setIsConnected, isConnected }) => {

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
        toast.success('Se cambio el tipo de conexión a ' + (isInbound ? 'Outbound' : 'Inbound'));
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
            toast.warning("El identificador y el canal son obligatorios.");
            return;
        }
        setOnCreateBlank(true);
        socketC.connection.emit('createBlankFolio', {
            token: window.localStorage.getItem('sdToken'),
            ...dataToBlank
        }, (response) => {
            setOnCreateBlank(false);
            if (response.success) {
                toast.success("Folio creado exitosamente.");
                setShowBlankFolio(false);
                setDataToBlank(initialBlankFolioState);
            } else {
                toast.error(ERRORS[response.codeError] || "Error al crear el folio.");
            }
        });
    };

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
                toast.error((ERRORS[responseItem.codeError] || responseItem.message));
            }
        });
    }

    useEffect(() => {
        if (!userInfo.onlyteamchat && automaticActivity && isInbound) { changeActivity(automaticActivity._id) }
    }, [automaticActivity, isInbound, userInfo]);

    const changeActivity = async (key) => {
        if (userInfo.onlyteamchat) {
            toast.warning('No puedes cambiar de actividad, solo tienes acceso a TeamChat');
            return false;
        }
        let value = key;
        let activityObj = fullActivities.find((x) => x._id === value);
        if (activityObj) {
            if (listFolios.current.length > 1 && activityObj.isConnect) {
                toast.warning('Finaliza ó Guarda los folios en pantalla para poder cambiar a "' + activityObj.label + '"');
                setCurrentActivity(-1);
                return false;
            }
            socketC.connection.emit('changeActivity', { token: window.localStorage.getItem('sdToken'), activity: activityObj }, (result) => {
                if (!result.success) {
                    toast.error('La actividad no es válida');
                    return false;
                }
                setIsConnected(activityObj.isConnect ? 1 : 2);
                setCurrentActivity(value);
                toast.success('Se cambió la actividad a "' + activityObj.label + '"');
            });
        }
    }

    const selectedActivity = activities.find(act => act.key === currentActivity);

    return (
        <>
            <Navbar isBordered maxWidth="full" className="bg-gray-800 text-white h-16 shadow-md">
                <NavbarBrand className="mr-4">
                <Chip color="primary" classNames={{
                            base: "bg-gradient-to-br from-indigo-500 to-pink-500 border-small border-white/50 shadow-pink-500/30",
                            content: "drop-shadow shadow-black text-white",
                        }} variant="shadow">{userDetail.name}
                        </Chip>
                        <Spacer x={4} />
                    <NavbarItem>
                        <Badge color="secondary" content={userDetail.prefetch} shape="circle"><span className="mr-2"> Asignación automática</span></Badge>
                    </NavbarItem>
                </NavbarBrand>

                <NavbarContent className="hidden sm:flex gap-4" justify="start">
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