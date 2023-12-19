import {useEffect, useState, useContext} from 'react';
import SocketContext from '../../../../../controladores/SocketContext';
import { Input } from 'semantic-ui-react';
import axios from 'axios';

const Zohocrm = ({folio, setRefresh}) => {
    const socket = useContext(SocketContext)
    const [contact,setContact] = useState(null)
    const plugin = folio.folio.service.plugins.find((x) => {return x.plugin === 'zohocrm';});

    useEffect(() => {
        getLastInfo();
    }, []);

    if(!plugin.isActive){
        return false;
    }

    const mergeCRM = (crmIBC, infoContact, route) => {
        let dataMerge = {}
        Object.keys(infoContact).map((x) => {
            const fieldId = route.fields.find((y) => y.label === x);
            crmIBC[fieldId.ibc] = infoContact[fieldId.label];
        });
        return {...crmIBC};
    }
    

    const getLastInfo = async () => {
        try{
            let tmpPhone = '50250198751';
            const {data} = await axios.get(`${process.env.REACT_APP_CENTRALITA}/zoho/findContact?phone=${tmpPhone}&serviceId=${folio.folio.service._id}`);

            if(!data.success){

            }else{
                if(plugin.dataConfig.autoSave){
                    let toSend = {...folio.folio.person.fields};
                    toSend = mergeCRM(toSend, data.contact, data.route)
                    toSend.idPerson = folio.folio.person._id;
                    toSend.token = localStorage.getItem('sdToken');
                    socket.connection.emit('saveCrm', toSend, (result) => {
                        // setIsLoading(false);
                        // toast.success('CRM guardado');
                        setRefresh(Math.random())
                    });
                }
                setContact(data.contact);
            }
        }catch(err){
            alert(err);
        }
    }

    


    return (<div>
        {contact && Object.keys(contact).map((x) => {
            return <Input key={`input-zoho-${x}`} label={x} value={contact[x]}/>
        })}
    </div>)
}

export default Zohocrm;