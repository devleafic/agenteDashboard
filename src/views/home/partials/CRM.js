import React, {useState, useContext, useEffect} from 'react';
import { Button, Select, SelectItem } from '@heroui/react';
import SocketContext from './../../../controladores/SocketContext';
import ListFoliosContext from '../../../controladores/FoliosContext';
import { toast } from 'react-toastify';
import generateAvatarUrl from '../../../utils/avatarUtils';

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
        const fieldValue = folio.folio.person.fields && folio.folio.person.fields[item._id] !== undefined 
            ? folio.folio.person.fields[item._id] 
            : '';
            
        const handleFieldChange = (value) => {
            if (!folio.folio.person.fields) folio.folio.person.fields = {};
            folio.folio.person.fields[item._id] = value;
            setRefresh(Math.random());
        };

        const commonInputProps = {
            key: `field-${item._id}`,
            className: 'w-full p-2 border rounded-md focus:ring-2 focus:ring-info focus:border-transparent',
            value: fieldValue || '',
            placeholder: item.name,
            onChange: (e) => handleFieldChange(e.target.value)
        };

        switch(item.class) {
            case 'text':
                return (
                    <div key={`field-${item._id}`} className="mb-2 px-2">
                        <label className="block text-sm font-medium text-ink-600 mb-1">{item.name}</label>
                        <input 
                            type="text"
                            {...commonInputProps}
                        />
                    </div>
                );
                
            case 'currency':
                return (
                    <div key={`field-${item._id}`} className="mb-2 px-2">
                        <label className="block text-sm font-medium text-ink-600 mb-1">{item.name}</label>
                        <input 
                            type="number" 
                            min={0}
                            step="0.01"
                            {...commonInputProps}
                            onChange={(e) => {
                                const isCheck = twoDecimals(e.target.value);
                                if (isCheck) handleFieldChange(e.target.value);
                            }}
                        />
                    </div>
                );
                
            case 'number':
                return (
                    <div key={`field-${item._id}`} className="mb-2 px-2">
                        <label className="block text-sm font-medium text-ink-600 mb-1">{item.name}</label>
                        <input 
                            type="number"
                            {...commonInputProps}
                        />
                    </div>
                );
                
            case 'date':
                return (
                    <div key={`field-${item._id}`} className="mb-2 px-2">
                        <label className="block text-sm font-medium text-ink-600 mb-1">{item.name}</label>
                        <input 
                            type="date"
                            {...commonInputProps}
                        />
                    </div>
                );
                
            case 'select':
                return (
                    <div key={`field-${item._id}`} className="mb-2 px-2">
                        <label className="block text-sm font-medium text-ink-600 mb-1">{item.name}</label>
                        <Select 
                            selectedKeys={fieldValue ? [fieldValue] : []}
                            onSelectionChange={(keys) => handleFieldChange(Array.from(keys)[0])}
                            className="w-full"
                            placeholder={item.name}
                        >
                            {item.options.map((op) => (
                                <SelectItem key={op.value} value={op.value}>
                                    {op.label}
                                </SelectItem>
                            ))}
                        </Select>
                    </div>
                );
                
            case 'checkbox':
                return (
                    <div key={`field-${item._id}`} className="mb-2 px-2">
                        <label className="block text-sm font-medium text-ink-600 mb-1">{item.name}</label>
                        <Select
                            selectionMode="multiple"
                            selectedKeys={fieldValue || []}
                            onSelectionChange={(keys) => handleFieldChange(Array.from(keys))}
                            className="w-full"
                            placeholder={item.name}
                        >
                            {item.options.map((op) => (
                                <SelectItem key={op.value} value={op.value}>
                                    {op.label}
                                </SelectItem>
                            ))}
                        </Select>
                    </div>
                );
                
            default:
                return (
                    <div key={`field-${item._id}`} className="mb-4 px-2 text-critical">
                        Campo no soportado: {item.class}
                    </div>
                );
        }
    }

    return (
        <div key={`form-crm-${folio}`} className="flex flex-col h-full">
            <div className="flex flex-col items-center">
                <img 
                    src={folio?.folio?.person?.profilePic || generateAvatarUrl(folio?.folio?.person?.aliasId || 'User', folio?.folio?.person?.anchor || 'User')} 
                    alt="profile" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-hair"
                />
                <div className="mt-2 px-3 py-1 bg-info/10 text-info rounded-full text-sm font-medium">
                    {folio.folio.person.aliasId ? 
                        folio.folio.person.aliasId.length > 20 ? 
                            `${folio.folio.person.aliasId.substring(0, 20)}...` : 
                            folio.folio.person.aliasId : 
                        'Anónimo'}
                </div>
            </div>
            
            <div className="overflow-y-auto p-2" style={{ maxHeight: '190px' }}>
                {template.map((item) => renderFields(item))}
            </div>
            
            <div className="bottom-0 left-0 right-0 bg-cream-50 border-t border-hair z-10">
                <div className="w-full px-4 py-4">
                    <Button 
                        color="primary" 
                        onPress={saveCrm} 
                        isLoading={isLoading} 
                        isDisabled={isLoading}
                        className="w-full py-3 text-base font-medium"
                    >
                        {isLoading ? 'Actualizando...' : 'Actualizar'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
 
export default CRM;