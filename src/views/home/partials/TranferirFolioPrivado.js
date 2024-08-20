import React, {useState, useEffect, useContext} from 'react';
import { toast } from 'react-toastify';
import {Label, Message, Icon, Button, Modal, Dropdown, Header } from 'semantic-ui-react';

// Contexto 
import SocketContext from './../../../controladores/SocketContext';
import ListFoliosContext from '../../../controladores/FoliosContext';

const TransferFolioPrivado = ({folio, setRefresh, userInfo}) => {
    const socket = useContext(SocketContext);
    const listFolios = useContext(ListFoliosContext);
    const [agents, setAgents] = useState([]);
    const [agentList, setAgentList ] = useState([]);
    const [isLoadAgentList, setIsLoadAgentList] = useState(false);
    const initializeQueue = {agent:null, name: null, folio : null};
    
    useEffect(  () => {
        const loadAgentList = () => {
            setIsLoadAgentList(true);
            socket.connection.emit('loadAgentList', {
                token : window.localStorage.getItem('sdToken')
            },(data) => {
              
                setIsLoadAgentList(false);
                //setAgentList(data.agentList);
               
                const clearAgents = data.agentList.filter((x) => {
                    return userInfo._id === x._id ? false : true
                });
                setAgents(clearAgents)
            });
        }
        //setRefresh(Math.random());

        return loadAgentList();
    }, []); //si es arreglo, solo lo ejectuta cuando carga el componente la primera vez

    const [agentToSend, setAgentToSend ] = useState({agent:null, name: null, folio : null});
    const [errorAgentField, setErrorAgentField] = useState(false);
   
    const initLoadModal = () => { //reset values for Modal 
        console.log(agentToSend)
        setOpen(!open)
        setAgentToSend(initializeQueue);
        console.log(agentToSend)
    }


    /*const [queueToSend, setQueueToSend ] = useState({queue:null, name: null, folio : folio.folio._id});
    const [errorQueueField, setErrorQueueField] = useState(false);*/
    const [open,setOpen] = useState(false);
    const [onLoading, setOnLoading] = useState(false);

    const checkToSendAgent = () => {

        if(!agentToSend.agent){
            toast.error('Selecciona el Agente al cual se transferira el folio.');
            setErrorAgentField(true);
            return false;
        }
        setErrorAgentField(false);
        setOpen(true)
    }

    
    const execTransfer = () => {
        setOnLoading(true);

        let actionClose = 'transfer';

        socket.connection.emit('transferFolioPrivate', {
            folio : folio.folio._id,
            token : window.localStorage.getItem('sdToken'),
            actionClose,
            dataAgent : agentToSend,
            agentFrom : userInfo
        }, (result) => {

            if(!result.success){
                toast.error(result.message);

            }else{
                let index = listFolios.current.findIndex((x) => {return x.folio._id === folio.folio._id})
                listFolios.current.splice(index,1);
            }

            
            setRefresh(Math.random());
            setOpen(false);
            setOnLoading(false);
        });

    }

    // useEffect(  () => {
    //     setAgentToSend(initializeQueue);
    //     console.log('refrescando componente de transferir')},
    // [folio])

    useEffect(() => {
        setAgentToSend({ agent: '', name: '', folio: '' });
        console.log('refrescando componente de transferir');
    }, [folio]);
    return ( <>
        {
            agents.length <= 0 && <Message icon='ban' compact floating negative content='Sin agentes disponibles'/>
        }
        <Label>Selecciona el agente a transferir</Label>
        <select
          className="modern-select" 
                value={agentToSend.agent}
                onChange={(e) => {
                    setErrorAgentField(false);
                    const value = e.target.value;
                    let agentName = agents.find((x) => x._id.toString() === value);
                    if (agentName && folio && folio.folio) {
                        setAgentToSend({ ...agentToSend, agent: value, name: agentName.user, folio: folio.folio._id });
                    } else {
                        console.error("Agent or folio information is missing");
                    }
                }}
                disabled={agents.length <= 0}
                style={agents.length > 5 ? { maxHeight: '200px', overflowY: 'auto' } : {}}
            >
                <option value="" disabled>Elige un agente</option>
                {agents.length > 0 && agents.map((x) => (
                    <option key={x._id} value={x._id.toString()}>{x.user}</option>
                ))}
            </select>
            {errorAgentField && <Message negative content='Selecciona un agente' />}
        <div style={{ marginTop: 15 }}>
            <Button 
                color='blue' 
                onClick={() => checkToSendAgent()} 
                disabled={agents.length <= 0}
            >
                Transferir Folio Privado
            </Button>
        </div>

        <Modal
            basic
            onClose={() => initLoadModal()}
            onOpen={() => setOpen(true)}
            open={open}
            size='small'
            >
            <Header icon>
                <Icon name='exchange' />
                Transferir
            </Header>
            <Modal.Content>
                <center>
                ¿Deseas transferir el folio privado <b>#{agentToSend.folio}</b> al agente <b>"{agentToSend.name}"</b> ?
                </center>
            </Modal.Content>
            <Modal.Actions>
                <Button basic color='red' inverted onClick={() => initLoadModal()}  loading={onLoading} disabled={onLoading}>
                    <Icon name='remove' /> No
                </Button>
                <Button color='blue' inverted onClick={() => execTransfer()} loading={onLoading} disabled={onLoading}>
                    <Icon name='checkmark' /> Transferir
                </Button>
            </Modal.Actions>
            </Modal>
    </>);
}
 
export default TransferFolioPrivado;