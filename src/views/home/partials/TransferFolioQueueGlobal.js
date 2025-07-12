import React, {useState, useEffect, useContext} from 'react';
import { toast } from 'react-toastify';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem } from '@heroui/react';

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

    useEffect( () => {
        setQueueToSend(initializeQueue);
        console.log('refrescando componente de transferir')},
    [folio])

    return (
        <div className="space-y-4">
            {queues.length <= 0 && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    No existen otras bandejas configuradas
                </div>
            )}
            
            <Select
                label="Seleccionar bandeja"
                placeholder="Escoge un queue"
                selectedKeys={queueToSend.queue ? [queueToSend.queue] : []}
                onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0];
                    setErrorQueueField(false);
                    let queueName = queues.find((x) => x._id === value);
                    setQueueToSend({
                        ...queueToSend, 
                        queue: value, 
                        name: queueName?.name, 
                        folio: folio.folio._id 
                    });
                }}
                isDisabled={queues.length <= 0}
                className={errorQueueField ? 'border-red-500' : ''}
            >
                {queues.map((queue) => (
                    <SelectItem key={queue._id} value={queue._id}>
                        {queue.name}
                    </SelectItem>
                ))}
            </Select>
            
            <div className="pt-2">
                <Button 
                    color="primary" 
                    onPress={checkToSend} 
                    isDisabled={queues.length <= 0}
                    className="w-full"
                >
                    Transferir Folio
                </Button>
            </div>

            <Modal isOpen={open} onClose={initLoadModal} size="md">
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            Transferir folio
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        <div className="text-center py-4">
                            <p>¿Deseas transferir el folio <span className="font-bold">#{queueToSend.folio}</span> a la bandeja <span className="font-bold">{queueToSend.name}</span>?</p>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="flat" onPress={initLoadModal} isDisabled={onLoading}>
                            No
                        </Button>
                        <Button color="primary" onPress={execTransfer} isLoading={onLoading} isDisabled={onLoading}>
                            Transferir
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
 
export default TransferFolioQueueGlobal;