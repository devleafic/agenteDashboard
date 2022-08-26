import React, {useState, useEffect, useContext} from 'react';
import { toast } from 'react-toastify';
import {Label, Message, Icon, Button, Modal, Dropdown, Header } from 'semantic-ui-react';

// Contexto 
import SocketContext from './../../../controladores/SocketContext';
import ListFoliosContext from '../../../controladores/FoliosContext';

const TransferFolioQueueGlobal = ({folio, setRefresh, userInfo}) => {

    console.log(folio.folio._id)
   

    const socket = useContext(SocketContext);
    const listFolios = useContext(ListFoliosContext);

    const clearQueues = folio.folio.service.globalQueues.filter((x) => {
        return x.status == false || userInfo.service.queue === x._id ? false : true;
    });

    const [queues] = useState(clearQueues);  
    const initializeQueue = {queue:null, name: null, folio : null};
    const [queueToSend, setQueueToSend ] = useState({queue: null, name: null, folio : null});
    const [errorQueueField, setErrorQueueField] = useState(false);
    const [open,setOpen] = useState(false);
    const [onLoading, setOnLoading] = useState(false);
    
   
    console.log(queueToSend)

    const initLoadModal = () => { //reset values for Modal 
        console.log(queueToSend)
        setOpen(!open)
        setQueueToSend(initializeQueue);
        console.log(queueToSend)
    }

    const checkToSend = () => {

        if(!queueToSend.queue){
            toast.error('Selecciona el queue al cual se transferira el folio.');
            setErrorQueueField(true);
            return false;
        }
        setErrorQueueField(false);
        setOpen(true)
    }

    const execTransfer = () => {
        setOnLoading(true);

        let actionClose = 'transfer';
        console.log("transferfolio " +folio.folio._id)
        console.log("transferir folio " +queueToSend.folio)
        socket.connection.emit('transferFolio', {
            folio : folio.folio._id,
            token : window.localStorage.getItem('sdToken'),
            actionClose,
            dataQueue : queueToSend
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

    useEffect(() => {
        setQueueToSend(initializeQueue);
        console.log('refrescando componente de transferir')},
    [folio])

    return ( <>
        {
            queues.length <= 0 && <Message icon='ban' compact floating negative content='No existen otras bandejas configurados'/>
        }
        <Dropdown placeholder='Escoge un queue' defaultOpen value={queueToSend.queue} error={errorQueueField} selection fluid options={queues.map((x) => {
            return { key: x._id, value: x._id, text: x.name }
        })} onChange={(e,{value}) => {
            setErrorQueueField(false);
            
            let queueName = queues.find((x) => {
                return x._id === value;
            })
            setQueueToSend({...queueToSend, queue : value, name : queueName.name, folio : folio.folio._id })
            
        }} disabled={queues.length <= 0}/>
        <div style={{marginTop:15}}>
            <Button color='blue' onClick={() => checkToSend()} disabled={queues.length <= 0}>Transferir Folio</Button>
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
                ¿Deseas transferir el folio <b>#{queueToSend.folio}</b> al queue <b>"{queueToSend.name}"</b> ?
                </center>
            </Modal.Content>
            <Modal.Actions>
                <Button basic color='red' inverted onClick={() => initLoadModal()}   loading={onLoading} disabled={onLoading} >
                    <Icon name='remove' /> No
                </Button>
                <Button color='blue' inverted onClick={() => execTransfer()} loading={onLoading} disabled={onLoading}>
                    <Icon name='checkmark' /> Transferir
                </Button>
            </Modal.Actions>
            </Modal>
    </>);
}
 
export default TransferFolioQueueGlobal;