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
        setTitleModal('Vista previa de la plantilla')
        setOpenModal(!openModal);

        socket.connection.emit('getMtmDetail', {mtm}, (res) => {
            if(res.success){
                setMtmToSend({...mtmToSend, _id : res.mtm._id, name: res.mtm.name, text : res.mtm.previewtxt, locale : res.mtm.locale, service : res.mtm.service, channel : res.mtm.channel, parameters: res.mtm.parameters,  parametersHeader: res.mtm.parametersHeader })
                
                // Crear vista de WhatsApp
                const whatsappPreview = (
                    <div className="w-full max-w-xs mx-auto bg-gray-100 rounded-2xl overflow-hidden shadow-lg">
                        {/* Encabezado de WhatsApp */}
                        <div className="bg-emerald-600 p-3 flex items-center">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="text-white">
                                <div className="font-medium">+502 1234 5678</div>
                                <div className="text-xs opacity-80">En línea</div>
                            </div>
                        </div>
                        
                        {/* Cuerpo del chat */}
                        <div className="p-4 space-y-3 bg-[#e5ddd5] bg-opacity-30" style={{
                            backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NzVBRUUzOEI0QjM0MTFFQkE1QjVFNzNEMjUzQzJCMjMiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NzVBRUUzOEM0QjM0MTFFQkE1QjVFNzNEMjUzQzJCMjMiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo3NUFFRTM4OTRCMzQxMUVCQTVCNUU3M0QyNTNDMkIyMyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo3NUFFRTNBQTRCMzQxMUVCQTVCNUU3M0QyNTNDMkIyMyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Phz6lJkAAABgSURBVHjaYvz//z8DKeD//w9MTEwMDAy/f//+9+8fEwMDw9+/f//9+8fIyMjExMT4/z8jI+OfP3+YmZmZGRgY/v9nZGRkZGRkYGBgZGRkYGBgYGBgYABrBQswQjVgWYgFgJQDAwAA//8DAJfQA1nUcQbJAAAAAElFTkSuQmCC")',
                            backgroundRepeat: 'repeat',
                            minHeight: '200px',
                            maxHeight: '300px',
                            overflowY: 'auto'
                        }}>
                            {/* Mensaje de la plantilla */}
                            <div className="flex justify-end mb-2">
                                <div className="bg-green-100 rounded-lg p-2 max-w-[80%] shadow">
                                    <div className="text-sm text-gray-800">{res.mtm.previewtxt}</div>
                                    <div className="text-right">
                                        <span className="text-xs text-gray-500">Ahora</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline-block ml-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Pie de conversación */}
                            <div className="text-center text-xs text-gray-500 my-2">
                                {new Date().toLocaleTimeString('es-GT', {hour: '2-digit', minute:'2-digit'})}
                            </div>
                        </div>
                        
                        {/* Área de entrada de texto */}
                        <div className="bg-white p-2 flex items-center">
                            <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 mx-2 flex items-center">
                                <span className="text-gray-500 text-sm">Escribe un mensaje aquí</span>
                            </div>
                            <button className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                );
                
                setContentMessage(whatsappPreview);
            } else {
                setContentMessage(
                    <div className="mt-4 mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
                        <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">Error al cargar la plantilla</span>
                        </div>
                        <p className="mt-2 text-sm">{res.mtm?.messages || 'No se pudo cargar la información de la plantilla.'}</p>
                    </div>
                );
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

            <Modal isOpen={openModal} onClose={initLoadModal} size="2xl">
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            Vista previa de WhatsApp
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <div className="text-center">
                                <p className="text-sm text-gray-500 mb-2">Así se verá el mensaje para:</p>
                                <p className="font-medium">{person.aliasId || person.anchor || 'Usuario'}</p>
                            </div>
                            
                            <div className="border rounded-lg overflow-hidden shadow-lg">
                                {contentMessage}
                            </div>
                            
                            <div className="text-center text-sm text-gray-600">
                                <p>¿Deseas enviar esta plantilla?</p>
                                <p className="text-xs mt-1">Plantilla: <span className="font-medium">{mtmToSend.name || 'Sin nombre'}</span></p>
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="flat" onPress={initLoadModal} isDisabled={onLoading}>
                            Cancelar
                        </Button>
                        <Button 
                            color="success" 
                            onPress={() => execSendMtm(mtmToSend)} 
                            isLoading={onLoading} 
                            isDisabled={onLoading}
                            startContent={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                                </svg>
                            }
                        >
                            Enviar plantilla
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
 
export default Mtm;