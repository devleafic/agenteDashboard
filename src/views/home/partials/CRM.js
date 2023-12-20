import { Button, Form, Label, Select} from 'semantic-ui-react';
import React, {useState, useContext, useEffect} from 'react';
import SocketContext from './../../../controladores/SocketContext';
import ListFoliosContext from '../../../controladores/FoliosContext';
import { toast } from 'react-toastify';

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
            toSend.token = localStorage.getItem('sdToken');
            socket.connection.emit('saveCrm', toSend, (result) => {
                setIsLoading(false);
                toast.success('CRM guardado');
            });
        }catch(err){
            console.log(err)
            setIsLoading(false);
            toast.error('Error al guardar CRM');
        }
    }

    useEffect( () => {
        setDataPerson(folio.folio.person);
    },[folio]);

    function twoDecimals(valor) {
        const regex = /^\d+(\.\d{1,2})?$/;
        return regex.test(valor);
      }

    const renderFields = (item) => {
        switch(item.class){
            case 'text':
                return (<Form.Field key={'field-'+item._id} style={{paddingRight:5}}>
                    <label>{item.name}</label>
                    <input key={item._id} placeholder={item.name} value={folio.folio.person.fields && folio.folio.person.fields[item._id] ? folio.folio.person.fields[item._id] : ''} onChange={(e) => {
                        if(!folio.folio.person.fields){folio.folio.person.fields={}}
                        if(!folio.folio.person.fields[item._id]){folio.folio.person.fields[item._id]=null}
                        folio.folio.person.fields[item._id] = e.target.value;
                        setRefresh(Math.random());
                    }}/>
                </Form.Field>);
            case 'currency':
                return (<Form.Field key={'field-'+item._id} style={{paddingRight:5}}>
                    <label>{item.name}</label>
                    <input type="number" min={0} key={item._id} placeholder={item.name} value={folio.folio.person.fields && folio.folio.person.fields[item._id] ? folio.folio.person.fields[item._id] : ''} onChange={(e) => {
                        const isCheck = twoDecimals(e.target.value);
                        if(!isCheck)return false;

                        if(!folio.folio.person.fields){folio.folio.person.fields={}}
                        if(!folio.folio.person.fields[item._id]){folio.folio.person.fields[item._id]=null}
                        folio.folio.person.fields[item._id] = e.target.value;
                        setRefresh(Math.random());
                    }}/>
                </Form.Field>);
            case 'number':
                return (<Form.Field key={'field-'+item._id} style={{paddingRight:5}}>
                    <label>{item.name}</label>
                    <input type="number" key={item._id} placeholder={item.name} value={folio.folio.person.fields && folio.folio.person.fields[item._id] ? folio.folio.person.fields[item._id] : ''} onChange={(e) => {
                        if(!folio.folio.person.fields){folio.folio.person.fields={}}
                        if(!folio.folio.person.fields[item._id]){folio.folio.person.fields[item._id]=null}
                        folio.folio.person.fields[item._id] = e.target.value;
                        setRefresh(Math.random());
                    }}/>
                </Form.Field>);
            case 'date':
                return (<Form.Field key={'field-'+item._id} style={{paddingRight:5}}>
                    <label>{item.name}</label>
                    <input type='date' key={item._id} placeholder={item.name} value={folio.folio.person.fields && folio.folio.person.fields[item._id] ? folio.folio.person.fields[item._id] : ''} onChange={(e) => {
                        if(!folio.folio.person.fields){folio.folio.person.fields={}}
                        if(!folio.folio.person.fields[item._id]){folio.folio.person.fields[item._id]=null}
                        folio.folio.person.fields[item._id] = e.target.value;
                        setRefresh(Math.random());
                    }}/>
                </Form.Field>);
            case 'select':
                return (<Form.Field key={'field-'+item._id} style={{paddingRight:5}}>
                    <label>{item.name}</label>
                    <Select placeholder={item.name} value={folio.folio.person.fields && folio.folio.person.fields[item._id] ? folio.folio.person.fields[item._id] : ''} options={item.options.map((op) => {
                        return { key: op._id, value: op.value, text: op.label };
                    })} onChange={(e, {value, id}) => {
                        console.log('select',value);
                        if(!folio.folio.person.fields){folio.folio.person.fields={}}
                        if(!folio.folio.person.fields[item._id]){folio.folio.person.fields[item._id]=null}
                        folio.folio.person.fields[item._id] = value;
                        setRefresh(Math.random());
                    }}/>
                </Form.Field>)
                
            case 'checkbox':
                return (<Form.Field key={'field-'+item._id} style={{paddingRight:5}}>
                <label>{item.name}</label>
                <Select multiple selection placeholder={item.name} value={folio.folio.person.fields && folio.folio.person.fields[item._id] ? folio.folio.person.fields[item._id] : ''} options={item.options.map((op) => {
                    return { key: op._id, value: op.value, text: op.label };
                })} onChange={(e, {value, id}) => {
                    console.log('select',value);
                    if(!folio.folio.person.fields){folio.folio.person.fields={}}
                    if(!folio.folio.person.fields[item._id]){folio.folio.person.fields[item._id]=null}
                    folio.folio.person.fields[item._id] = value;
                    setRefresh(Math.random());
                }}/>
            </Form.Field>)
            
            default :
                    return <div>Campo no soportado</div>

        }
    }

    return ( <>
        
            <Form key={'form-crm-'+folio}>
                <div>    
                    <img src={folio.folio.person.profilePic ? folio.folio.person.profilePic : 'https://inbox.sfo3.digitaloceanspaces.com/assets/noprofilepic.jpeg' } alt="profile" className='profilePic' />
                </div>
                <div className='label-t'> 
                    <Label as='a' pointing>  
                        {folio.folio.person.aliasId ? folio.folio.person.aliasId.substr(0,20) : 'Anónimo'}
                    </Label>
                </div>
                <div style={{height:250, overflowY:'scroll'}}>
                {
                    template.map((item) => {
                        return renderFields(item);
                    })
                }
                </div>
                <div style={{marginTop : 5}}>
                    <Button color='blue' onClick={saveCrm} loading={isLoading} disabled={isLoading}>Guardar</Button>
                </div>
            </Form>
        
    </> );
}
 
export default CRM;