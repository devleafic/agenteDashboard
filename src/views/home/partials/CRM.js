import { Button, Form } from 'semantic-ui-react';
import React, {useState, useContext, useEffect} from 'react';
import SocketContext from './../../../controladores/SocketContext';
import ListFoliosContext from '../../../controladores/FoliosContext';

const CRM = ({template, folio, setRefresh}) => {
    
    const [isLoading, setIsLoading] = useState(false);
    const socket = useContext(SocketContext)
    const listFolios = useContext(ListFoliosContext);
    const [dataPerson, setDataPerson] = useState(folio.folio.person);

    const saveCrm = async () => {
        try{
            setIsLoading(true);
            let toSend = {...folio.folio.person.fields};
            toSend.idPerson = folio.folio.person._id;
            socket.connection.emit('saveCrm', toSend, (result) => {
                setIsLoading(false);
            });
        }catch(err){
            console.log(err)
        }
    }

    useEffect(() => {
        setDataPerson(folio.folio.person);
    },[folio]);

    return ( <>
        
            <Form key={'form-crm-'+folio}>
                <div style={{height:250, overflowY:'scroll'}}>
                {
                    template.map((item) => {
                        return (
                            <Form.Field key={'field-'+item._id}>
                                <label>{item.name}</label>
                                <input key={item._id} placeholder={item.name} value={folio.folio.person.fields ? folio.folio.person.fields[item._id] : ''} onChange={(e) => {
                                    if(!folio.folio.person.fields){folio.folio.person.fields={}}
                                    if(!folio.folio.person.fields[item._id]){folio.folio.person.fields[item._id]=null}
                                    folio.folio.person.fields[item._id] = e.target.value;
                                    setRefresh(Math.random());
                                }}/>
                            </Form.Field>
                        )
                    })
                }
                </div>
                <div>
                    <Button class="ui colorblue button" onClick={saveCrm} loading={isLoading} disabled={isLoading}>Guardar</Button>
                </div>
            </Form>
        
    </> );
}
 
export default CRM;