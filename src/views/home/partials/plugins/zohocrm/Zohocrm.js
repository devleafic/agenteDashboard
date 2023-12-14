import {useEffect, useState} from 'react';
import axios from 'axios';

const Zohocrm = ({folio}) => {
    const [contact,setContact] = useState(null)
    const plugin = folio.folio.service.plugins.find((x) => {return x.plugin === 'zohocrm';});
    if(!plugin.isActive){
        return false;
    }
    console.log('cargando zoho', folio.folio.service);

    const getLastInfo = async () => {
        try{
            let tmpPhone = '50250198751';
            console.log('plugingo');
            const {data} = await axios.get(`${process.env.REACT_APP_CENTRALITA}/zoho/findContact?phone=${tmpPhone}&serviceId=${folio.folio.service._id}`);
            console.log(data);
        }catch(err){
            alert(err);
        }
    }

    getLastInfo();

    return (<div>Zoho</div>)
}

export default Zohocrm;