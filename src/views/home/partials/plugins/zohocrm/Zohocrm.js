import {useEffect, useState, useContext} from 'react';
import SocketContext from '../../../../../controladores/SocketContext';
import { Button, Input, Select, Loader, Segment, Dimmer, Image } from 'semantic-ui-react';
import axios from 'axios';
import { toast } from 'react-toastify';


const Zohocrm = ({folio, setRefresh}) => {
    const [isLoading, setIsLoading] = useState(true);
    const socket = useContext(SocketContext)
    const [contact,setContact] = useState(null);
    const [isExistContact, setIsExistContact] = useState(false);
    const [contactRoute, setContactRoute] = useState(null);
    const plugin = folio.folio.service.plugins.find((x) => {return x.plugin === 'zohocrm';});

    useEffect(() => {
        getLastInfo();
    }, []);

    if(!plugin.isActive){
        return false;
    }

    const mergeCRM = (crmIBC, infoContact, route) => {
        Object.keys(infoContact).map((x) => {
            const fieldId = route.fields.find((y) => y.label === x);
            crmIBC[fieldId.ibc] = infoContact[fieldId.label];
        });
        return {...crmIBC};
    }

    const upsertContact = async ()  => {
        try{

            //Validamos que contengan todos los campos del contact al menos un valor
            let isValid = true;
            Object.keys(contact).map((x) => {
                if(!isExistContact && x.toUpperCase() === 'ID'){
                    return;
                }
                if(contact[x].trim() === ''){
                    isValid = false;
                }
            });

            if(!isValid){
                return toast.error('Todos los campos son requeridos en el plugin de ZOHO');
            }

            setIsLoading(true);
            const result = await fetch(`${process.env.REACT_APP_CENTRALITA}/zoho/upsertContact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    isExistContact,
                    contact,
                    serviceId : folio.folio.service._id,
                    channel : folio.folio.channel._id,
                    contactRoute
                }),
            });
            const data = await result.json();
            setIsLoading(false);
            if(data.success){
                toast.success('CRM guardado');
                setIsExistContact(true);
            }else{
                toast.error(data.message);    
            }
            
        }catch(err){
            console.log(err)
            setIsLoading(false);
            return toast.error('Error al guardar CRM');
        }
    }
    

    const getLastInfo = async () => {
        try{
            // let tmpPhone = folio.folio.person.anchor;
            let tmpPhone = '5215550437563';
            setContactRoute(null);
            const {data} = await axios.get(`${process.env.REACT_APP_CENTRALITA}/zoho/findContact?phone=${tmpPhone}&serviceId=${folio.folio.service._id}&channel=${folio.folio.channel._id}`);
            setIsLoading(false)
            if(!data.success){

            }else{
                if(plugin.dataConfig.autoSave){
                    let toSend = {...folio.folio.person.fields};
                    toSend = mergeCRM(toSend, data.contact, data.route)
                    toSend.idPerson = folio.folio.person._id;
                    toSend.token = localStorage.getItem('sdToken');
                    socket.connection.emit('saveCrm', toSend, (result) => {
                        setRefresh(Math.random())
                    });
                }

                if(data.isExist){
                    setContactRoute(data.route.name);
                }
                
                setContact(data.contact);
                setIsExistContact(data.isExist);
                
            }
        }catch(err){
            setIsLoading(false)
            alert(err);
        }
    }

    return (isLoading ? 
        <Segment >
            <Dimmer active inverted style={{marginTop : 5}}>
                <Loader inverted content='Cargando Información' />
            </Dimmer>

            <Image src='https://react.semantic-ui.com/images/wireframe/short-paragraph.png' />
        </Segment>
     : <div>
        {
            !isExistContact && (<>
                <Segment color='blue'>El contacto no existe en Zoho</Segment>
                <Select
                    placeholder='Selecciona una ruta para guardar'
                    style={{width : '100%'}}
                    options={plugin.dataConfig.routes.map((x) => {
                        return {key : x.name, value : x.name, text : x.name}
                    })}
                    value={contactRoute}
                    onChange={(e, {value}) => {
                        const tmpContact = {
                            [plugin.dataConfig.criterials[folio.folio.channel._id].criterial.split(':')[0]] : '',
                            ...contact
                        };
                        setContact(tmpContact);
                        setContactRoute(value);
                    }}
                /> 
            </>)
        }
        {contact && Object.keys(contact).map((x) => {
            if(!isExistContact && x.toUpperCase() === 'ID'){
                return <></>;
            }
            return <Input key={`input-zoho-${x}`}
                label={x}
                style={{marginTop : 10, width : '100%'}}
                value={contact[x]}
                onChange={(e) => {
                    const tmpContact = {...contact};
                    tmpContact[x] = e.target.value;
                    setContact(tmpContact);
                }}
            />
        })}
        <Button style={{marginTop : 10}} color='green' onClick={() => {upsertContact();}}>Guardar</Button>
    </div>)
}

export default Zohocrm;