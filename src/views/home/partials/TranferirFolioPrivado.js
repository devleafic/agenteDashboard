import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem } from '@heroui/react';
import { User, X, Check, ArrowRight, Users } from 'lucide-react';

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
    return ( 
        <div className="space-y-4 p-4 bg-cream-50 rounded-lg shadow-sm">
            {agents.length <= 0 ? (
                <div className="flex items-center gap-2 p-3 bg-critical/10 text-critical rounded-md">
                    <Users className="w-5 h-5" />
                    <span>Sin agentes disponibles</span>
                </div>
            ) : (
                <>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-ink-600">
                            Selecciona el agente a transferir
                        </label>
                        <Select
                            labelPlacement="outside"
                            placeholder="Elige un agente"
                            className="w-full"
                            selectedKeys={agentToSend.agent ? [agentToSend.agent] : []}
                            onSelectionChange={(keys) => {
                                const selectedKey = Array.from(keys)[0];
                                if (selectedKey) {
                                    const agent = agents.find(a => a._id === selectedKey);
                                    if (agent && folio?.folio) {
                                        setAgentToSend({ 
                                            agent: selectedKey, 
                                            name: agent.user, 
                                            folio: folio.folio._id 
                                        });
                                        setErrorAgentField(false);
                                    }
                                }
                            }}
                            isDisabled={agents.length === 0}
                        >
                            {agents.map((agent) => (
                                <SelectItem key={agent._id} value={agent._id}>
                                    {agent.user}
                                </SelectItem>
                            ))}
                        </Select>
                        
                        {errorAgentField && (
                            <p className="mt-1 text-sm text-critical">Selecciona un agente</p>
                        )}
                    </div>

                    <Button
                        color="primary"
                        className="w-full mt-4"
                        onPress={checkToSendAgent}
                        isDisabled={!agentToSend.agent}
                        startContent={<ArrowRight className="w-4 h-4" />}
                    >
                        Transferir Folio Privado
                    </Button>
                </>
            )}

            <Modal 
                isOpen={open} 
                onOpenChange={setOpen}
                backdrop="blur"
                classNames={{
                    base: "max-w-md",
                    header: "border-b border-default-200",
                    footer: "border-t border-default-200"
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary" />
                                    <span>Transferir folio</span>
                                </div>
                            </ModalHeader>
                            <ModalBody>
                                <p className="text-center text-ink-600">
                                    ¿Deseas transferir el folio privado <span className="font-semibold">#{agentToSend.folio}</span> al agente <span className="font-semibold">{agentToSend.name}</span>?
                                </p>
                            </ModalBody>
                            <ModalFooter>
                                <Button 
                                    color="danger" 
                                    variant="flat" 
                                    onPress={initLoadModal}
                                    isDisabled={onLoading}
                                    startContent={<X className="w-4 h-4" />}
                                >
                                    Cancelar
                                </Button>
                                <Button 
                                    color="primary" 
                                    onPress={execTransfer}
                                    isLoading={onLoading}
                                    startContent={!onLoading && <Check className="w-4 h-4" />}
                                >
                                    {onLoading ? 'Transfiriendo...' : 'Transferir'}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
 
export default TransferFolioPrivado;