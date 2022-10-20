import React, {useState, useEffect, useContext} from 'react';
import { toast } from 'react-toastify';
import {Label, Message, Icon, Button, Modal, Dropdown, Header } from 'semantic-ui-react';

// Contexto 
import SocketContext from './../../../controladores/SocketContext';
import ListFoliosContext from '../../../controladores/FoliosContext';

const TransferirFolioQueueGlobal_QueueLocal = ({folio, setRefresh, userInfo}) => {
    const socket = useContext(SocketContext);
    const listFolios = useContext(ListFoliosContext);

    const clearQueues = folio.folio.channel.queues.filter((x) => {
        return x.status == 0 ||  userInfo.service.queue === x._id ? false : true;
    });
    const [queues] = useState(clearQueues);
    const initializeQueue = {queue:null, name: null, folio : folio.folio._id};
    const [queueToSend, setQueueToSend ] = useState({queue:null, name: null, folio : folio.folio._id});
    const [errorQueueField, setErrorQueueField] = useState(false);
    const [open,setOpen] = useState(false);
    const [onLoading, setOnLoading] = useState(false);

    const checkToSend = () => {

        if(!queueToSend.queue){
            toast.error('Selecciona la bandeja al cual se transferira el folio.');
            setErrorQueueField(true);
            return false;
        }
        setErrorQueueField(false);
        setOpen(true)
    }

    const execTransfer = () => {
        setOnLoading(true);

        let actionClose = 'transfer';

        socket.connection.emit('transferFromGlobaltoLocal', {
            folio : folio._id,
            token : window.localStorage.getItem('sdToken'),
            actionClose,
            dataQueue : queueToSend
        }, (result) => {

            if(!result.success){
                toast.error(result.message);

            }else{
                let index = listFolios.current.findIndex((x) => {return x.folio._id === folio._id})
                listFolios.current.splice(index,1);
            }

            
            setRefresh(Math.random());
            setOpen(false);
            setOnLoading(false);
        });

    }

    useEffect(() => {console.log('refrescando componente de transferir')},[])

    return ( <>
        {
            queues.length <= 0 && <Message icon='ban' compact floating negative content='No existen otras bandejas configurados'/>
        }
        <Label>Selecciona el queue a transferir</Label>
        <Dropdown placeholder='Escoge un queue' value={queueToSend.queue} error={errorQueueField} selection fluid options={queues.map((x) => {
            return { key: x._id, value: x._id, text: x.name }
        })} onChange={(e,{value}) => {
            setErrorQueueField(false);
            let queueName = queues.find((x) => {
                return x._id === value;
            })
            setQueueToSend({...queueToSend, queue : value, name : queueName.name})
            
        }} disabled={queues.length <= 0}/>
        <div style={{marginTop:15}}>
            <Button color='blue' onClick={() => checkToSend()} disabled={queues.length <= 0}>Transferir Folio</Button>
        </div>

        <Modal
            basic
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
                ¿Deseas transferir el folio <b>#{queueToSend.folio}</b> al queue <b>"{queueToSend.name}"</b> ?
                </center>
            </Modal.Content>
            <Modal.Actions>
                <Button basic color='red' inverted onClick={() => {setOpen(false); }} loading={onLoading} disabled={onLoading}>
                    <Icon name='remove' /> No
                </Button>
                <Button color='blue' inverted onClick={() => execTransfer()} loading={onLoading} disabled={onLoading}>
                    <Icon name='checkmark' /> Transferir
                </Button>
            </Modal.Actions>
            </Modal>
    </>);
}
 
export default TransferirFolioQueueGlobal_QueueLocal;