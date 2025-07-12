import React, {useState, useEffect, useContext} from 'react';
import { toast } from 'react-toastify';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Spinner } from '@heroui/react';

// Contexto 
import SocketContext from './../../../controladores/SocketContext';
import ListFoliosContext from '../../../controladores/FoliosContext';

const initialMtmState = { _id: null, name: null, text: null, locale: null, service: null, channel: null, parameters: [], parametersHeader: [] };

const Mtm = ({ mtm, person, setRefresh, folio }) => {
    const [openModal, setOpenModal] = useState(false);
    const [titleModal, setTitleModal] = useState('');
    const [contentMessage, setContentMessage] = useState(
        <div className="flex items-center justify-center p-8">
            <Spinner size="lg" />
            <span className="ml-2">Cargando...</span>
        </div>
    );
    const [onLoading, setOnLoading] = useState(false);
    const socket = useContext(SocketContext);
    const listFolios = useContext(ListFoliosContext);
    const [mtmToSend, setMtmToSend] = useState(initialMtmState);

    const initLoadModal = () => { //reset values for Modal
        setOpenModal(!openModal);
        setMtmToSend(initialMtmState);
        setContentMessage(
            <div className="flex items-center justify-center p-8">
                <Spinner size="lg" />
                <span className="ml-2">Cargando...</span>
            </div>
        );
    }
    const getMtm = (mtm) => {
        setTitleModal('Plantillas de mensajes')
        setOpenModal(!openModal);

        socket.connection.emit('getMtmDetail', {mtm}, (res) => {
            if(res.success){
                setMtmToSend({...mtmToSend, _id : res.mtm._id, name: res.mtm.name, text : res.mtm.previewtxt, locale : res.mtm.locale, service : res.mtm.service, channel : res.mtm.channel, parameters: res.mtm.parameters,  parametersHeader: res.mtm.parametersHeader })
                setContentMessage(
                    <div className="mt-4 mb-4">
                        <span className="px-4 py-2 bg-blue-100 text-blue-800 text-lg font-medium rounded-lg">
                            {res.mtm.previewtxt}
                        </span>
                    </div>
                )
            } else {
                setContentMessage(
                    <div className="mt-4 mb-4 text-red-500 font-medium">
                        {res.mtm.messages}
                    </div>
                )
            }
        })
    }
    const execSendMtm = (mtm) => {
        setOnLoading(true);

        if(!mtm.name){
            return false;
        }
        //if parameters 
        let parameters= [], parametersHeader = {}
    /*if (mtm.parameters.length > 0){

        /*}parameters = [
                    {
                        type: "text",
                        text: "Gabriel"
                    }, {
                        type: "text",
                        text: "25OFF"
                    }, {
                        type: "text",
                        text: "Feliz tarde"
                    }
        ]
            parameters =   mtm.parameters.map((item) => {
                return {type: item.type, text: 'Mi variable' }
            })
        } 
        if (mtm.parametersHeader.length > 0){

            parametersHeader = 
                        {
                            headerType: mtm.parametersHeader[0].type,
                            header: "https://scontent.fgua3-4.fna.fbcdn.net/v/t45.1600-4/387468240_120201219876720170_7656494677333266014_n.jpg?stp=cp0_dst-jpg_q75_s1080x2048_spS444&_nc_cat=110&ccb=1-7&_nc_sid=528f85&_nc_ohc=AFXzlDjq8tsAX8XtEJJ&_nc_ht=scontent.fgua3-4.fna&oh=00_AfDy3UJUr2rcRkmsUFhsIiNFhsRqZduWQWgtmg3mp8TL_w&oe=6537021B"
                        }
            
               
        }

        
        */
        socket.connection.emit('sendMessage', {
            token : window.localStorage.getItem('sdToken'),
            folio :  folio.folio._id,
            message : mtm.name,
            caption : mtm.text,
            responseTo : null,
            locale :  mtm.locale,
            class : 'mtm',
            interaction : parameters,
            header : parametersHeader && parametersHeader.header ? parametersHeader.header : null,
            headerType : parametersHeader &&  parametersHeader.headerType ? parametersHeader.headerType : null,
            
        }, (result) => {

            if(!result.body.success){
                toast.error(result.body.message);
                initLoadModal();
                setMtmToSend(initialMtmState)
                setOnLoading(false);
                return false;
            }
            let index = listFolios.current.findIndex((x) => {return x.folio._id === folio.folio._id});
            listFolios.current[index].folio.message.push(result.body.lastMessage);
            setOnLoading(false);
            listFolios.currentBox.scrollTop = listFolios.currentBox.scrollHeight
            
        })
        setRefresh(Math.random());
        initLoadModal();
        setMtmToSend(initialMtmState)
        setOnLoading(false);
        //});
        toast.info('Enviando Plantilla... 📨', {

            position: "bottom-left",
            autoClose: 2700,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: false
            });
    }
    
    useEffect( () => {
        setMtmToSend(initialMtmState);
        console.log('refrescando componente de mtm')},
    [person])

   return (
        <div className="flex flex-col h-full">
            {mtm.length <= 0 && (
                <div className="p-4 mb-4 text-red-600 bg-red-100 rounded-lg flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    No existen plantillas configuradas.
                </div>
            )}
            
            <div className="flex-1 overflow-y-auto max-h-64 pr-2">
                <ul className="space-y-1">
                    {mtm.map((item) => (
                        <li 
                            key={'mtm-'+item._id}
                            className="px-4 py-2 hover:bg-gray-100 rounded-md cursor-pointer transition-colors"
                            onClick={() => getMtm(item._id)}
                            title={item.previewtxt}
                        >
                            {item.name}
                        </li>
                    ))}
                </ul>
            </div>

            <Modal isOpen={openModal} onClose={initLoadModal} size="md">
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Enviar Plantilla
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        <div className="text-center">
                            {contentMessage}
                            <p className="mt-4">
                                ¿Deseas enviar la plantilla <span className="font-bold">{mtmToSend.name}</span> al usuario 
                                <span className="font-bold"> "{person.aliasId ? person.aliasId : person.anchor}"</span>?
                            </p>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="flat" onPress={initLoadModal} isLoading={onLoading} isDisabled={onLoading}>
                            No
                        </Button>
                        <Button color="primary" onPress={() => execSendMtm(mtmToSend)} isLoading={onLoading} isDisabled={onLoading}>
                            Enviar
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
 
export default Mtm;