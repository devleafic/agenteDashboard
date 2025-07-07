import React, {useContext, useState, useRef, useEffect, useCallback} from 'react';
import { Comment, Select, Segment, Dimmer, Loader, Image } from 'semantic-ui-react';
import { Textarea as textarea , Button as HeroButton, Chip, Modal as HeroModal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select as HeroSelect, SelectItem, Checkbox as HeroCheckbox, Divider as HeroDivider, Input, ButtonGroup} from "@heroui/react";
import { Paperclip, Send, XCircle, Save, LogOut, AlertTriangle, Mail, Globe, Box, Inbox } from 'lucide-react';
import shortParagraph from './../../../img/short-paragraph.png';


import SocketContext from './../../../controladores/SocketContext';
import MessageBubble from './MessageBubble';
import ListFoliosContext from '../../../controladores/FoliosContext';
import Call from './Call';
import UploadFile from './UploadFile';
import UploadMultipleFiles from './UploadMultipleFiles';

import { toast } from 'react-toastify';
import MessageBubbleEmail from './MessageBubbleEmail';
// import ClassificationForm from './Classification.From';
import { Editor } from '@tinymce/tinymce-react';

const CommentsV2 = ({folio, fullFolio, onCall, setOnCall, setRefresh, sidCall, setSidCall, boxMessage, vFolio, userInfo}) => {
    const listFolios = useContext(ListFoliosContext);
    const socket = useContext(SocketContext);
    const [isLoading, setIsLoading] = useState(false);
    console.log('boxMessage update',boxMessage)

    const [channel, setChannel] = useState(null);
    const [typeFolio, setTypeFolio] = useState(null);
    const [alias, setAlias] = useState(null)
    const [lastMessageFolio, setLastMessageFolio] = useState(null)
    const [channelEmail, setChannelEmail] =  useState(null)
    const [attachments, setAttachments] = useState([]);
    const [contador, setContador] = useState(0);
    const editorRef = useRef(null);
    const log = () => {
      if (editorRef.current) {
        console.log(editorRef.current.getContent());
      }
    };
    const textArea = useRef(null);
    const [hasTextContent, setHasTextContent] = useState(false);

    const [titleModal, setTitleModal ] = useState('');
    const [contentMessage, setContentMessage] = useState(
        <Segment>
            <Dimmer active inverted>
                <Loader inverted>Cargando</Loader>
            </Dimmer>

            <Image src={shortParagraph} />
        </Segment>
    );

    // Para finalizar folio
    const [typeClose, setTypeClose] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [openModalError, setOpenModalError] = useState(false);
    const [messageError, setMessageError] = useState('');
    const [openModalPreview, setOpenModalPreview] = useState(false);
    const [listClassification, setListClassification] = useState([]);
    const [classification, setClassification] = useState(-1);
    const [formClassification, setFormClassification] = useState({});
    const [isFolioAttachedAgent, setIsFolioAttachedAgent ] = useState(false); // Para saber si el folio esta asignado a un agente a su Inbox

    const [message, setMessage] = useState(null);
    const [isOpenError, setIsOpenError] = useState(false);

    const [infoForm, setInfoForm] = useState(null);
    const [showBtnUn, setShowBtnUn] = useState(false);



    const pipelineAssign = userInfo.service?.pipeline;
    const assignPrivateAlways = userInfo.assignPrivateAlways;
    const infoPipeline = folio.service.pipelines.find((x) => {return x._id === pipelineAssign});
    const [listStage] = useState(infoPipeline ? infoPipeline.pipelines : false);
    const [selectedStage, setSelectedStage] = useState(null);   
    
    const [openModalFolio, setOpenModalFolio] = useState(false);
    const [previewEmail, setPreviewEmail] = useState(null);
    const [previewEmailHTML, setPreviewEmailHTML] = useState(null);
    const [isEndingFolio, setIsEndingFolio] = useState(false);

    const [currentFolio, setCurrentFolio] = useState(null);
    const [messageToSend, setMessageToSend] = useState('');
    
    //Gestion de drafts 
    const [messageDrafts, setMessageDrafts] = useState(() => {
        // Try to load drafts from localStorage on component mount
        try {
            const savedDrafts = localStorage.getItem('messageDrafts');
            return savedDrafts ? JSON.parse(savedDrafts) : {};
        } catch (error) {
            console.error('Error loading drafts from localStorage:', error);
            return {};
        }
    });    
    const [previousFolioId, setPreviousFolioId] = useState(null);
    const [showAutoSaveIndicator, setShowAutoSaveIndicator] = useState(false);
    const [indicatorMessage, setIndicatorMessage] = useState("Guardado...");
    const [indicatorColor, setIndicatorColor] = useState("rgba(0, 128, 0, 0.7)"); // Default green color
    const debounceTimerRef = useRef(null);

    // Helper function to show indicator with specific message and color
    const showIndicator = (message, isRestoration = false) => {
        setIndicatorMessage(message);
        setIndicatorColor(isRestoration ? "rgba(0, 100, 200, 0.8)" : "rgba(0, 128, 0, 0.7)");
        setShowAutoSaveIndicator(true);
    };
    
    // Debounce function
    const debounce = useCallback((func, delay = 500) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        
        debounceTimerRef.current = setTimeout(() => {
            func();
        }, delay);
    }, []);

    useEffect(() => {
        const container = boxMessage.current;
        
        if (!container) {
          console.warn('Scroll container ref not attached');
          return;
        }
      
        if (folio?.message?.length) {
          // Scroll to bottom with smooth behavior
        //   container.scrollTo({
        //     top: container.scrollHeight,
        //     behavior: 'smooth'
        //   });
          
          // Only show "Nuevos mensajes" if not at bottom
          const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
          setShowBtnUn(prev => !isAtBottom);        
        }
      }, [folio?.message && folio?.message?.length]);
    
    // Function to save draft for a specific folio with debounce
    const saveDraftForFolio = useCallback((folioId) => {
        console.log('Attempting to save draft for folio:', folioId, 'Current typeFolio:', typeFolio);
        if (typeFolio === '_EMAIL_' && editorRef.current) {
            const emailContent = editorRef.current.getContent();
            if (emailContent && emailContent.trim() !== '' && emailContent !== '<p></p>') {
                debounce(() => {
                    setMessageDrafts(prevDrafts => {
                        const newDrafts = {...prevDrafts};
                        newDrafts[folioId] = emailContent;
                        console.log('Saved draft for folio:', folioId);
                        showIndicator("Guardado...");
                        // Save to localStorage
                        localStorage.setItem('messageDrafts', JSON.stringify(newDrafts));
                        return newDrafts;
                    });
                });
            }
        } else if (textArea.current && textArea.current.value && textArea.current.value.trim() !== '') {
            debounce(() => {
                setMessageDrafts(prevDrafts => {
                    const newDrafts = {...prevDrafts};
                    newDrafts[folioId] = textArea.current.value;
                    console.log('Saved draft for folio:', folioId);
                    showIndicator("Guardado...");
                    // Save to localStorage
                    localStorage.setItem('messageDrafts', JSON.stringify(newDrafts));
                    return newDrafts;
                });
            });
        }
    }, [typeFolio, debounce]);
    
    // Function to restore draft for a specific folio
    const restoreDraftForFolio = (folioId) => {
        console.log('Attempting to restore draft for folio:', folioId, 'Draft exists:', !!messageDrafts[folioId], 'Current typeFolio:', typeFolio);
        console.log('All drafts:', messageDrafts);
        
        if (messageDrafts[folioId]) {
            if (typeFolio === '_EMAIL_' && editorRef.current) {
                // For email type folios
                console.log('Restoring email draft:', messageDrafts[folioId]);
                editorRef.current.setContent(messageDrafts[folioId]);
                // Show indicator
                showIndicator("Borrador restaurado", true);
                setHasTextContent(true);
            } else if (textArea.current) {
                // For other types of folios
                console.log('Restoring text draft:', messageDrafts[folioId]);
                textArea.current.value = messageDrafts[folioId];
                // Show indicator
                showIndicator("Borrador restaurado", true);
                setHasTextContent(true);
                
                // Trigger an input event to ensure React knows about the change
                const event = new Event('input', { bubbles: true });
                textArea.current.dispatchEvent(event);
            }
        }
    };
    
    // Function to clear draft for a specific folio
    const clearDraftForFolio = (folioId) => {
        setMessageDrafts(prevDrafts => {
            const newDrafts = {...prevDrafts};
            delete newDrafts[folioId];
            
            // Update localStorage
            localStorage.setItem('messageDrafts', JSON.stringify(newDrafts));
            
            return newDrafts;
        });
    };

    useEffect(() => {
        if (showAutoSaveIndicator) {
            const timer = setTimeout(() => setShowAutoSaveIndicator(false), 1500);
            return () => clearTimeout(timer);
        }
    }, [showAutoSaveIndicator]);
    //historic folio 
    const getFolioMessages = (folio) => {
        setTitleModal('Historial de Folio #'+folio)
        setOpenModalFolio(!openModalFolio);

        socket.connection.emit('getMessageHist', {folio}, (res) => {
            if(res.success){
                if (res.folio.typeFolio === '_EMAIL_'){
                    setContentMessage(
                        <div className='imessage'>
                            {
                                res.folio.message.map((msg) => {
                                    if (typeFolio === '_EMAIL_') {
                                        return <MessageBubbleEmail key={msg._id} message={msg} />;
                                    }
                                    return (
                                        <MessageBubble key={msg._id} allMsg={folio.message} message={msg} responseToMessage={responseToMessage} reactToMessage={reactToMessage} typeFolio={typeFolio}/>
                                    );
                                })
                            }
                        </div> 
                    )
                } else {    
                setContentMessage(
                    <div className='imessage'>
                        {
                            res.folio.message.map((msg) => {
                                return (
                                    <MessageBubble key={msg._id} message={msg}/>
                                );
                            })
                        }
                    </div> 
                )}
            }else{

            }
        })
    }

    // para manejo de los archivos
    const [readyFiles, setReadyFiles] = useState([]);

    const [showResponseTo, setShowResponseTo] = useState(null);
    const [messageToResponse, setMessageToResponse] = useState('');
    const responseToMessage = (idMessage) => {

        let message = folio.message.find((x) => {
            return x._id === idMessage;
        })

        setShowResponseTo(message.externalId);
        setMessageToResponse('Responder al mensaje: '+ message.content);
        textArea.current.focus();
    }
    
    const removeResponseTo = () =>{
        setShowResponseTo(null);
        setMessageToResponse(null);
    }

    const reactToMessage = (idMessage) => {

        socket.connection.emit('reactToMessageAgent', {
            event : "😖",//messageToSend,
            externalId : idMessage,
        }, (result) => {

            if(!result.success){
                toast.error(result.body.message);
                return false;
            }
            toast.success("Reaccionaste");
            
        });
    }

      const prepareMessage = async (msg) => {
          
          let _msg = '' 
           
          if (msg && typeof msg === 'string') {_msg = msg} 
  
          if (_msg.trim() === '' ){
  
              if(messageToSend.trim() === ''){
                  toast.error('No se puede enviar un mensaje vacio');
                  return false;
              } else { 
                  _msg = messageToSend
              }
  
          }
  
          setIsLoading(true);
  
          socket.connection.emit('sendMessage', {
              token : window.localStorage.getItem('sdToken'),
              folio : folio._id,
              message : _msg,//messageToSend,
              responseTo : showResponseTo,
              class : 'text'
          }, (result) => {
  
              if(!result.body.success){
                  toast.error(result.body.message);
                  return false;
              }
              let index = listFolios.current.findIndex((x) => {return x.folio._id === folio._id});
              listFolios.current[index].folio.message.push(result.body.lastMessage);
              setIsLoading(false);
              setMessageToSend('');
              textArea.current.value='';
              textArea.current.focus();
              setShowResponseTo(null);
              setMessageToResponse(null);
              listFolios.currentBox.scrollTop = listFolios.currentBox.scrollHeight
              
              // Clear draft for current folio
              console.log('Message sent successfully, clearing draft for folio:', folio._id);
  
              if (folio && folio._id  ) {
                  clearDraftForFolio(folio._id);
                 
              }
              setHasTextContent(false);
  
          });
      }
    const previewEmailF = (content) => {
        if (content.length > 0) {
            setPreviewEmailHTML(content)
            content = <div dangerouslySetInnerHTML={{__html: content }}></div>
            setPreviewEmail(content);
            setOpenModalPreview(true);
        }
        else {
            toast.error('No hay contenido para enviar');
        }
    }

    const prepareEmail = async (msg) => {

        let _msg = '' 

        if (msg && typeof msg === 'string') {_msg = msg} 

        if (_msg.trim() === '' ){

            if(messageToSend.trim() === ''){
                return false;
            } else { 
                _msg = messageToSend
            }

        }

        const excludeEmail = channelEmail;

        const toFilteredEmails = folio.lastEmailProcessed.toRecipients.filter(recipient => recipient.email !== excludeEmail);
        const toEmailsString = toFilteredEmails.map(recipient => recipient.email).join(',');
        const ccEmailsString = folio.lastEmailProcessed.ccRecipients && folio.lastEmailProcessed.ccRecipients.length > 0 ? folio.lastEmailProcessed.ccRecipients.map(recipient => recipient.email).join(',') : [];

        setIsLoading(true);

        socket.connection.emit('sendEmail', {
            token : window.localStorage.getItem('sdToken'),
            folio : folio._id,
            subject : folio.lastEmailProcessed.subject,
            message : _msg,//messageToSend,
            responseTo : folio.lastEmailProcessed.externalId ? folio.lastEmailProcessed.externalId : null,
            to: toEmailsString,
            cc: ccEmailsString, // ? ccEmailsString : '',
            bcc: [],
            attachments: attachments.length > 0 ? attachments : null,
            class : 'html'
        }, (result) => {

            if(!result.body.success){
                toast.error(result.body.message);
                return false;
            }
            let index = listFolios.current.findIndex((x) => {return x.folio._id === folio._id});
            listFolios.current[index].folio.message.push(result.body.lastMessage);
            setIsLoading(false);
            setMessageToSend('');
            //clearEditor();
            editorRef.current.setContent("");
            //editorRef.current.insertContent('<div style="width: 80%; margin: 20px auto; border: 1px solid rgb(204, 204, 204); padding: 20px;"><div style="font-size: 1.5rem; line-height: 2rem; text-align: right;">node </div><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Node.js_logo_2015.svg/1024px-Node.js_logo_2015.svg.png" alt="Logo" id="logo" style="margin-top: 1rem; margin-bottom: 1rem; max-width: 100%;"><div style="border: 1px solid rgb(204, 204, 204); display: flex;"><div style="text-transform: capitalize; font-weight: 700; padding: 0.5rem;">Nombre</div><div style="color: rgb(34, 247, 137); padding: 0.5rem; flex: 1 1 0%; border-left-width: 1px;">222</div></div><div><table style="width: 100%;"><thead><tr><td style="padding: 0.5rem; border: 1px solid rgb(204, 204, 204); text-transform: capitalize; font-weight: 700;"><b>cantidad</b></td><td style="padding: 0.5rem; border: 1px solid rgb(204, 204, 204); text-transform: capitalize; font-weight: 700;"><b>descrip</b></td></tr></thead><tbody><tr><td style="padding: 0.5rem; border: 1px solid rgb(204, 204, 204); text-transform: capitalize;">rreer</td><td style="padding: 0.5rem; border: 1px solid rgb(204, 204, 204); text-transform: capitalize;">erere</td></tr></tbody></table></div></div>');
            setReadyFiles([]);
            setShowResponseTo(null);
            setMessageToResponse(null);
            listFolios.currentBox.scrollTop = listFolios.currentBox.scrollHeight

            // Clear draft for current folio and hide the clear text area button
            if (folio && folio._id) {
                clearDraftForFolio(folio._id);
                setHasTextContent(false);
            }
        });
    }
    useEffect(() => {
        if (messageToSend && editorRef.current) {
            editorRef.current.insertContent( '<div></div><div></div><div></div>'  +messageToSend + '<div></div><div></div><div></div>');
        }
    
    }, [setMessageToSend, messageToSend]);


    const prepareButtons = async (msg) => {
        
        let _msg = '' 
         
        if (msg && typeof msg === 'string') {_msg = msg} 

        if (_msg.trim() === '' ){

            if(messageToSend.trim() === ''){
                toast.error('No se puede enviar un mensaje vacio');
                return false;
            } else { 
                _msg = messageToSend
            }

        }



        setIsLoading(true);

        socket.connection.emit('sendMessage', {
            token : window.localStorage.getItem('sdToken'),
            folio : folio._id,
            message : _msg,//messageToSend,
            responseTo : showResponseTo,
            class : 'buttonreply',
           // header: 'header',
           // footer: 'footer',
            interaction :[
                {
                  type: 'reply',
                  reply: {
                    id: 'opt1',
                    title: 'First Button’s' 
                  }
                },
                {
                  type: 'reply',
                  reply: {
                    id: 'opt2',
                    title: 'Second Button’s' 
                  }
                }
              ]
        }, (result) => {

            if(!result.body.success){
                toast.error(result.body.message);
                return false;
            }
            let index = listFolios.current.findIndex((x) => {return x.folio._id === folio._id});
            listFolios.current[index].folio.message.push(result.body.lastMessage);
            setIsLoading(false);
            setMessageToSend('');
            textArea.current.value='';
            textArea.current.focus();
            setShowResponseTo(null);
            setMessageToResponse(null);
            listFolios.currentBox.scrollTop = listFolios.currentBox.scrollHeight
            
        });
    }

    const prepareCloseFolio = (tClose) => {
        if(tClose === 'save'){
            setTypeClose('guardar');
        }
        if(tClose === 'end'){
            setTypeClose('finalizar');
        }
        setOpenModal(true);

        //save last message from current folio
        if (listFolios?.current) {
            let index = listFolios.current.findIndex((x) => {return x.folio._id === folio._id});
            if (index !== -1 && listFolios.current[index]?.folio?.message) {
                let lastMessage = listFolios.current[index].folio.message[listFolios.current[index].folio.message.length-1];
                if (lastMessage) {setLastMessageFolio(lastMessage.content);} else {setLastMessageFolio(null)}
            } else {
                setLastMessageFolio(null);
            }
        } else {
            setLastMessageFolio(null);
        }
    }

    const closeFolio = () => {

        if(classification===-1){
            alert('Selecciona una clasificación');
            return false;
        }
       
        let validate = [];
        if(infoForm && infoForm.form && Array.isArray(infoForm.form)){
            let fRequire = infoForm.form.filter((x) => {return x.require && x.status});
            validate = fRequire.map((xField) => {
                let findContent = Object.keys(formClassification).find((x) => {return x === xField._id});
                if(!findContent){
                    return {success : false, id : xField, message : 'Agregue un valor al campo "'+xField.label+'"'}
                }

                console.log(findContent)

                if(xField.require){
                    switch(xField.rtype){
                        case 'text':
                            return formClassification[xField._id].trim() === '' ? {success : false, id : xField, message : 'Agregue un valor al campo "'+xField.label+'"'} : {success:true}
                        break;
                        case 'number':
                            return formClassification[xField._id].trim() === '' ? {success : false, id : xField, message : 'Agregue un valor al campo "'+xField.label+'"'} : {success:true}
                        break;
                        case 'select':
                            return formClassification[xField._id] === -1 ? {success : false, id : xField, message : 'Seleccione una opción en "'+xField.label+'"'} : {success:true}
                        break;
                    }
                }else{
                    return true;
                }
            })

            let localV = true;
            for(let i = 0; i < validate.length;i++){
                if(!validate[i].success){
                    alert(validate[i].message);
                    //toast.error(validate[i].message)
                    localV = false;
                    break;
                }
            }

            if(!localV){return false;}
        }

        setIsEndingFolio(true);
        let actionClose = '';
        let _channel = fullFolio.folio.channel.title //Para cuando se va a mandar a Inbox
        let _queue = getLabelQueue() //Para cuando se va a mandar a Inbox
        let _anchorPerson = fullFolio.folio.person.anchor ///Para cuando se va a mandar a Inbox
        let _aliasIdPerson = fullFolio.folio.person.aliasId ///Para cuando se va a mandar a Inbox
        let _fromInbox = fullFolio.folio.fromInbox //Para cuando se va a mandar a Inbox
        let _fromPipeline = fullFolio.folio.fromPipeline //Para cuando se va a mandar a pipline
        if(typeClose === 'guardar'){
            actionClose = 'save';
        }
        if(typeClose === 'finalizar'){
            actionClose = 'end';
        }

        let isFolioToPipeline = false;
        if (selectedStage) {    
            isFolioToPipeline = selectedStage;
        }
        socket.connection.emit('closeFolio', {
            folio : folio._id,
            token : window.localStorage.getItem('sdToken'),
            actionClose,
            classification,
            formClassification,
            isFolioAttachedAgent,
            _channel,
            _queue,
            _anchorPerson,
            _aliasIdPerson,
            _fromInbox,
            isFolioToPipeline,
            fromPipelineStage : selectedStage ? selectedStage : null,
            fromPipelineId : pipelineAssign ? pipelineAssign : null,
        }, (result) => {
            console.log(result)
            if(!result.success){
                setMessage(result.message);
                setIsOpenError(true);
                return false;
            }

            let index = listFolios.current.findIndex((x) => {
                return x.folio._id === folio._id
            });
            
            listFolios.current.splice(index,1)
            // Se limpian los formularios  del form de tipificación
            setFormClassification({})
            setRefresh(Math.random());
            setOpenModal(false);
            setInfoForm(null);
            setIsEndingFolio(false);
            setIsFolioAttachedAgent(false);
        });
    }


    useEffect(  () => {
        
        console.log('Folio change effect triggered. New folio:', folio._id, 'Previous folio:', previousFolioId);
        
        // First, save draft from previous folio before switching
        if (previousFolioId && previousFolioId !== folio._id) {
            console.log('Saving draft for previous folio before switching');
            saveDraftForFolio(previousFolioId);
        }
        
        // Set current folio as previous for next change - do this early
        setPreviousFolioId(folio._id);

        setCurrentFolio(folio._id);
        setChannel(folio.channel.name);
        setLastMessageFolio(null);
        setReadyFiles([]);
        setTypeFolio(folio.typeFolio)
        if (folio.typeFolio === '_EMAIL_') {setChannelEmail(folio.channel.token.public)}
        setAlias(folio.person.aliasId ? folio.person.aliasId : folio.person.anchor)
        if (editorRef && editorRef.current) {
            editorRef.current.setContent("");

        }

        const loadListClassifications = async () => {
            const tmpClass = [];
            for(let item of fullFolio.clasifications){
                tmpClass.push({
                    key: item._id,
                    value: item._id,
                    text: item.name
                })
            }
            setListClassification(tmpClass)
        }
        
        if(channel != 'call'){
            let fullHeight = boxMessage.current.scrollHeight;
            let pcPosition = ((boxMessage.current.scrollTop+boxMessage.current.clientHeight)*100)/fullHeight;

            if(pcPosition>=90){
                boxMessage.current.scrollTop = boxMessage.current.scrollHeight;
            }
        }
        
        // Restore draft with a delay to ensure inputs are ready
        setTimeout(() => {
            console.log('Attempting to restore draft after delay');
            restoreDraftForFolio(folio._id);
        }, 300);

        listFolios.currentBox = boxMessage.current;
        console.log('refrescando componente de comentarios')
         loadListClassifications();
    }, [folio]); // Remove messageDrafts from dependencies to prevent unnecessary re-renders

    useEffect(() => {
        console.log('Setting up auto-save interval');
        const intervalo = setInterval(() => {
            // Auto-save draft every 5 seconds if there's content
            setContador((prevContador) => prevContador + 1);
            console.log('Auto-save check for folio:', folio?._id, 'Type:', typeFolio);
            
            // Auto-save current draft if there's content
            if (folio && folio._id) {
                saveDraftForFolio(folio._id);
            }
        }, 5000);

        return () => {
            clearInterval(intervalo);
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [folio, typeFolio, saveDraftForFolio]);
    
    // Clean up debounce timer on unmount - single implementation
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const getLabelQueue = () => {


        if(folio.isGlobalQueue){
            let name = "Queue"
            if (folio.isGlobalDistributor)    {
                
                name = folio.service.genericQueues.find((x) => {
                    return x._id === folio.queue;
                });
                   
            } else {

                name = folio.service.globalQueues.find((x) => {
                    return x._id === folio.queue;
                });

            }



            return name.name
        }else{
            let chan = folio.service.channels.find((x) => {
                return x._id === folio.channel._id
            });
            let queu = chan.queues.find((x) => {
                return x._id === folio.queue;
            })
            return queu.name;
        }
    }

    const changeClassification = (idClass) => {
        const tmpClass = fullFolio.clasifications.find((x) => {
            return x._id === idClass;
        });

        if(tmpClass.form.length > 0){
            setInfoForm(tmpClass);
        }else{
            setInfoForm(null);
            setFormClassification({})
        }

        setClassification(idClass)
        
    }


    const renderForm = (formData) => {
        // Verificar que formData y formData.form existan y sean un array
        if (!formData || !formData.form || !Array.isArray(formData.form)) {
            return null;
        }
        
        const render = formData.form.filter((x) => x.status === true).map((x) => {
            const label = (
                <span className="flex items-center">
                    {x.label}
                    {x.require && <Chip color="danger" size="sm" className="ml-2">Obligatorio</Chip>}
                </span>
            );

            switch (x.rtype) {
                case 'text':
                case 'number':
                    return (
                        <Input
                            key={x._id}
                            label={label}
                            placeholder={x.lanel}
                            type={x.rtype}
                            onChange={(e) => {
                                const copy = { ...formClassification, [x._id]: e.target.value };
                                setFormClassification(copy);
                            }}
                            value={formClassification[x._id] || ''}
                            fullWidth
                            className="mb-4"
                        />
                    );
                case 'select':
                    return (
                        <div key={x._id} className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {label}
                            </label>
                            <select
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={formClassification[x._id] || -1}
                                onChange={(e) => {
                                    const copy = { ...formClassification, [x._id]: e.target.value };
                                    setFormClassification(copy);
                                }}
                            >
                                <option value={-1}>Selecciona una opción</option>
                                {x.options && Array.isArray(x.options) && x.options.map((option, index) => (
                                    <option key={index} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    );
                default:
                    return <div key={x._id}>Item no soportado</div>;
            }
        });

        return (
            <div>
                <p className="mb-4 text-foreground-500">Ingrese los datos del formulario</p>
                {render}
            </div>
        );
    };

    useEffect(  () => {
        if(typeFolio != '_CALL_'){
            boxMessage.current.scrollTop =boxMessage.current && boxMessage.current.scrollHeight ? boxMessage.current.scrollHeight : boxMessage.current.scrollTop

        }
        
    }, [vFolio]);

    useEffect( () => {
        if(typeFolio != '_CALL_'){
            boxMessage.current.addEventListener(
                'scroll',() => {
                    if (boxMessage && boxMessage.current) {
                        let fullHeight = boxMessage.current.scrollHeight;
                        let pcPosition = ((boxMessage.current.scrollTop+boxMessage.current.clientHeight)*100)/fullHeight;
                        if(pcPosition>=90){
                            setShowBtnUn(false);
    
                        }
                    }
                                          
                })
        }    
    },[])

    useEffect( () => {

        async function validations(){
            if(textArea.current && messageToSend.length > 0){
                textArea.current.value = messageToSend;
                setMessageToSend('')
            } 
        
            if(channel != 'call'){
                // Remove the call to showButton function that was deleted
                // showButton()

                if(openModal && lastMessageFolio){
                    let index = listFolios?.current.findIndex((x) => {return x.folio._id === folio._id});
                    let lastCurrentMessage = listFolios?.current[index].folio.message[listFolios.current[index].folio.message.length-1];
                    if(lastCurrentMessage.content !== lastMessageFolio){
                        toast.error(lastCurrentMessage.content &&  lastCurrentMessage.content.length >14 ? 'Nuevo mensaje: ' + lastCurrentMessage.content?.substring(0, 15) + '...' : 'Nuevo mensaje: ' + lastCurrentMessage?.content);    
                    }
                }

                let fullHeight = boxMessage.current.scrollHeight;
                let pcPosition = ((boxMessage.current.scrollTop+boxMessage.current.clientHeight)*100)/fullHeight;
    
                if(pcPosition>=90){
                    boxMessage.current.scrollTop = boxMessage.current.scrollHeight;
                }
                
            }   
        
        
        }
         validations()
        
 
    });

   const clearTextArea = () => {
        if (typeFolio === '_EMAIL_' && editorRef.current) {
            editorRef.current.setContent('');
        } else if (textArea.current) {
            textArea.current.value = '';
        }
        setHasTextContent(false);
        
        // Clear draft for current folio
        if (folio && folio._id) {
            setMessageDrafts(prevDrafts => {
                const newDrafts = {...prevDrafts};
                delete newDrafts[folio._id];
                
                // Update localStorage
                localStorage.setItem('messageDrafts', JSON.stringify(newDrafts));
                
                return newDrafts;
            });
            showIndicator("Borrador eliminado", true);
        }
    };

    const handleTextAreaChange = (e) => {
        setHasTextContent(e.target.value.trim() !== '');
    };
    
    const handleEditorChange = () => {
        if (editorRef.current) {
            const content = editorRef.current.getContent();
            setHasTextContent(content && content.trim() !== '' && content !== '<p></p>');
        }
    };

    useEffect(() => {
        // Check for content on component mount and when switching folios
        setTimeout(() => {
            if (typeFolio === '_EMAIL_' && editorRef.current) {
                const content = editorRef.current.getContent();
                setHasTextContent(content && content.trim() !== '' && content !== '<p></p>');
            } else if (textArea.current) {
                setHasTextContent(textArea.current.value.trim() !== '');
            }
        }, 100);
    }, [folio, typeFolio]);

    const fillStages = () =>{
        const options=listStage && listStage.
        filter(x => x.status === true).
        map((x) => {
            return {key: x._id, value: x._id, text: x.name }
        })
        options.unshift({key : -1, value:-1, text: 'Seleccione una etapa'})
        return options;
    }

    const fillRecipients = (ccRecipients, txt) => {
        if (ccRecipients && ccRecipients.length > 0) {
            const emails = ccRecipients.map(recipient => recipient.email);
            const emailsText = emails.join(', ');
            return (
                <div className="flex items-center gap-2 mb-2">
                    <Chip color="primary" variant="flat">{txt}</Chip>
                    <span className="text-sm text-foreground-600">{emailsText}</span>
                </div>
            );
        }
    }

    const toSendRecipients = (ccRecipients, txt) => {
        const excludeEmail = channelEmail;
        const toFilteredEmails = folio.lastEmailProcessed.toRecipients.filter(recipient => recipient.email !== excludeEmail);

        let emailsText;
        if (toFilteredEmails && toFilteredEmails.length > 0) {
            const emails = toFilteredEmails.map(recipient => recipient.email);
            emailsText = folio.person.anchor + ', ' + emails.join(', ');
        } else {
            emailsText = folio.person.anchor;
        }

        return (
            <div className="flex items-center gap-2 mb-2">
                <Chip color="primary" variant="flat">{txt}</Chip>
                <span className="text-sm text-foreground-600">{emailsText}</span>
            </div>
        );
    }


    useEffect(() => {
        console.log('Setting up auto-save interval');
        const intervalo = setInterval(() => {
            // Auto-save draft every 5 seconds if there's content
            setContador((prevContador) => prevContador + 1);
            console.log('Auto-save check for folio:', folio?._id, 'Type:', typeFolio);
            
            // Auto-save current draft if there's content
            if (folio && folio._id) {
                saveDraftForFolio(folio._id);
            }
        }, 5000);

        return () => {
        clearInterval(intervalo);
        };
    }, [folio, typeFolio, saveDraftForFolio]);

    const handlePaste = async (event) => {
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                event.preventDefault();
                const file = items[i].getAsFile();
                
                const fileName = `pasted-image-${Date.now()}.${file.type.split('/')[1]}`;
                const imageFile = new File([file], fileName, { type: file.type });

                toast.info('Subiendo imagen pegada...');
                await uploadPastedImage(imageFile);
            }
        }
    };

    const uploadPastedImage = async (file) => {
        if (!folio || !folio._id) {
            toast.error('No se puede subir la imagen, no hay un folio activo.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('channel', channel);

        try {
            const response = await socket.uploadFile(folio._id, formData);

            if (response.status === 'OK' || response.status === 200 || response.status === 201) {
                toast.success('Imagen subida y enviada con éxito!');
                if (setRefresh) {
                    setRefresh(true);
                }
            } else {
                throw new Error(response.message || 'Error al subir la imagen.');
            }
        } catch (error) {
            console.error('Error uploading pasted image:', error);
            toast.error(`Error al subir la imagen: ${error.message}`);
        }
    };

    return (
        <>
            <div className="flex flex-col h-full bg-gray-50">
                {/* Header */}
                <div className="p-4 border-b bg-white shadow-sm shrink-0">
                    <h2 className="text-xl font-bold text-gray-800">
                        {typeFolio === '_CALL_' ? 'Llamada' : typeFolio === '_EMAIL_' ? `Correo con: ${folio.person.anchor}` : typeFolio === '_MESSAGES_' ? `Conversación con: ${alias}` : 'Hilo'}
                    </h2>
                    {typeFolio === '_EMAIL_' && (
                        <div className="mt-2 text-sm text-gray-600">
                            <div className="font-semibold">{fillRecipients(folio?.lastEmailProcessed?.toRecipients, 'Para: ')}</div>
                            <div>{fillRecipients(folio?.lastEmailProcessed?.ccRecipients, 'CC: ')}</div>
                            <div className="mt-1">
                                <span className="font-semibold">Asunto:</span> {folio?.lastEmailProcessed?.subject}
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Chip color="primary" variant="bordered">#{folio._id}</Chip>
                        <Chip color="default" variant="flat">{folio.person.anchor}</Chip>
                        {folio.isGlobalQueue && <Chip color="secondary" variant="flat" startContent={<Globe className="w-4 h-4"/>}>Global</Chip>}
                        <Chip color="default" variant="flat">{folio.service.name}</Chip>
                        <Chip color="default" variant="flat" className='hidden sm:flex' startContent={<Box className="w-4 h-4"/>}>{folio.channel.title}</Chip>
                        <Chip color="default" variant="flat" className='hidden sm:flex' startContent={<Inbox className="w-4 h-4"/>}>{getLabelQueue()}</Chip>
                    </div>
                </div>
    
                {/* Scrollable Message Area */}
                <div className="flex-grow overflow-y-auto p-4" id={`boxMessage-${folio._id}`} ref={boxMessage}>
                    {typeFolio === '_CALL_' && fullFolio ? (
                        <Call 
                            currentFolio={fullFolio.folio} 
                            onCall={onCall} 
                            setOnCall={setOnCall} 
                            setRefresh={setRefresh} 
                            sidCall={sidCall} 
                            setSidCall={setSidCall}
                            onSave={() => prepareCloseFolio('save')}
                            onResolve={() => prepareCloseFolio('end')}
                            isEndingFolio={isEndingFolio}
                        />
                    ) : fullFolio ? (
                        folio.message.map((msg) => 
                            typeFolio === '_EMAIL_' ? (
                                <MessageBubbleEmail key={msg._id} message={msg} />
                            ) : (
                                <MessageBubble 
                                    key={msg._id} 
                                    allMsg={folio.message} 
                                    message={msg} 
                                    responseToMessage={responseToMessage} 
                                    reactToMessage={reactToMessage} 
                                    typeFolio={typeFolio}
                                    contact={folio.person}
                                />
                            )
                        )
                    ) : null}
                </div>
    
                {/* Footer / Input Area */}
                <div className="border-t bg-white shrink-0 p-4">
                    {typeFolio === '_MESSAGES_' && fullFolio ? (
                        <div>
                            <div className="flex justify-center mb-2 h-7">
                                {showBtnUn && <Chip color="secondary" variant="flat">Nuevos mensajes</Chip>}
                                {showResponseTo && (
                                    <Chip color="primary" variant="flat" onClose={() => removeResponseTo()}>
                                        {messageToResponse}
                                    </Chip>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <div className="flex-grow relative bg-gray-100 dark:bg-zinc-800 rounded-lg p-2 flex items-start">
                                    <div className="flex-grow relative">
                                        <textarea
                                            key={folio?._id || 'no-folio'}
                                            ref={textArea}
                                            placeholder="Escribe un mensaje..."
                                            defaultValue={messageToSend}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    if (e.shiftKey) {
                                                        // Allow new line when Shift+Enter is pressed
                                                        return;
                                                    } else {
                                                        // Send message when only Enter is pressed
                                                        e.preventDefault();
                                                        prepareMessage(e.target.value);
                                                    }
                                                }
                                            }}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setMessageToSend(value);
                                                setHasTextContent(value.trim() !== '');
                                

                                                // Limitar a 4 líneas con scroll
                                                e.target.style.height = 'auto';
                                                const maxHeight = 4 * 24; // 4 líneas * 24px por línea
                                                e.target.style.overflowY = e.target.scrollHeight > maxHeight ? 'auto' : 'hidden';
                                                
                                                // Save draft with debounce
                                                if (folio?._id) {
                                                    saveDraftForFolio(folio._id, e.target.value);
                                                }
                            
                                            }}

                                            onPaste={handlePaste}
                                            className="w-full bg-transparent focus:outline-none resize-none min-h-[40px] max-h-[6rem] overflow-y-auto p-2"
                                            rows={4}
                                            style={{
                                                display: 'block',
                                                width: '100%',
                                                maxHeight: '6rem',
                                                lineHeight: '1.25rem',
                                                overflowY: 'auto',
                                                scrollbarWidth: 'thin',
                                                scrollbarColor: '#cbd5e0 #f7fafc',
                                                '&::-webkit-scrollbar': {
                                                    width: '6px',
                                                },
                                                '&::-webkit-scrollbar-track': {
                                                    background: '#f7fafc',
                                                },
                                                '&::-webkit-scrollbar-thumb': {
                                                    backgroundColor: '#cbd5e0',
                                                    borderRadius: '3px',
                                                },
                                            }}
                                            disabled={isLoading}
                                        />
                                        {/* Auto-save indicator */}
                                        {showAutoSaveIndicator && (
                                            <div className="absolute -top-5 right-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded transition-opacity duration-300">
                                                <Save className="w-3 h-3" />
                                            </div>
                                        )}
                                        {hasTextContent && (
                                            <HeroButton 
                                                isIconOnly 
                                                variant="light" 
                                                color="danger" 
                                                size="sm" 
                                                onPress={clearTextArea}
                                                className="absolute bottom-1 right-1"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </HeroButton>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-center justify-start gap-1 ml-2">
                                        <HeroButton 
                                            isIconOnly 
                                            color="primary" 
                                            aria-label="Enviar mensaje"
                                            onPress={() => prepareMessage(textArea.current.value)}
                                            isLoading={isLoading}
                                            disabled={isLoading || !hasTextContent}
                                            size="md"
                                            className="m-0 w-10 h-10"
                                        >   
                                            <Send className="w-6 h-6" />
                                        </HeroButton>
                                        <div className="m-0 p-0">
                                            <UploadFile folio={folio._id} channel={channel} setRefresh={setRefresh}/>
                                        </div>
                                    </div>
                                    
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                                <div>
                                    {showAutoSaveIndicator && <span style={{ color: indicatorColor }}>{indicatorMessage}</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                <ButtonGroup>
                                    <HeroButton size="sm" variant='ghost' color="success" onPress={() => prepareCloseFolio('save')} isLoading={isEndingFolio} disabled={isEndingFolio}>
                                        <Save className="w-4 h-4 mr-1" />
                                        Continuar mas tarde
                                    </HeroButton>
                                    <HeroButton size="sm" variant='ghost' color="danger" onPress={() => prepareCloseFolio('end')} isLoading={isEndingFolio} disabled={isEndingFolio}>
                                        <LogOut className="w-4 h-4 mr-1" />
                                        Finalizar
                                    </HeroButton>
                                    </ButtonGroup>
                                </div>
                            </div>
                        </div>
                    ) : typeFolio === '_EMAIL_' && fullFolio ? (
                        <div>
                            <div className="flex justify-center mb-2 h-7">
                                {showBtnUn && <Chip color="warning" variant="flat">Nuevos correos</Chip>}
                                {showResponseTo && (
                                    <Chip color="primary" variant="flat" onClose={() => removeResponseTo()}>
                                        {messageToResponse}
                                    </Chip>
                                )}
                            </div>
                            <div className="relative">
                                <Editor
                                    tinymceScriptSrc={process.env.PUBLIC_URL + '/tinymce/tinymce.min.js'}
                                    onInit={(evt, editor) => {
                                        editorRef.current = editor;
                                        handleEditorChange();
                                        editor.getDoc().body.addEventListener('paste', handlePaste);
                                    }}
                                    onEditorChange={handleEditorChange}
                                    init={{
                                        license_key: 'gpl', min_height: 280, max_height: 600, menubar: false, branding: false,
                                        plugins: 'autosave', autosave_restore_when_empty: true, autosave_interval: '10s',
                                        autosave_retention: '30m', fullscreen_native: true, custom_undo_redo_levels: 10,
                                        language: 'es', browser_spellcheck: true,
                                        font_size_formats: '8pt 10pt 12pt 14pt 16pt 18pt 24pt 36pt 48pt',
                                        default_font_stack: ['-apple-system', 'Arial', 'Calibri'],
                                        preview_styles: 'font-size color',
                                        plugins: ['autoresize', 'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount', 'table', 'autosave'],
                                        toolbar: 'fontsize | undo redo | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | fullscreen | preview | searchreplace | table restoredraft',
                                        content_style: 'body { font-family:Arial; font-size:12px }'
                                    }}
                                />
                            </div>
                            <div className="flex justify-between items-center mt-4">
                                <div>
                                    {showAutoSaveIndicator && <span style={{ color: indicatorColor }}>{indicatorMessage}</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <UploadMultipleFiles readyFiles={readyFiles} setReadyFiles={setReadyFiles} folio={folio._id} channel={channel} setRefresh={setRefresh} onChange={(files) => setAttachments(files)}>
                                        <HeroButton variant="light" aria-label="Adjuntar archivos">
                                            <Paperclip className="w-5 h-5 text-gray-500 mr-2" />
                                            Adjuntar
                                        </HeroButton>
                                    </UploadMultipleFiles>
                                    
                                    <HeroButton 
                                        color="primary" 
                                        aria-label="Enviar correo"
                                        onPress={() => previewEmailF(editorRef.current.getContent())}
                                        isLoading={isLoading}
                                        disabled={isLoading || !hasTextContent}
                                        startContent={<Send className="w-4 h-4"/>}
                                    >
                                        Previsualizar y Enviar
                                    </HeroButton>
                                </div>
                            </div>
                            <div className="flex justify-end items-center mt-2 gap-2">
                                <HeroButton variant='ghost' onClick={() => prepareCloseFolio('save')} isLoading={isEndingFolio} disabled={isEndingFolio} aria-label="Guardar">
                                    <Save className="w-5 h-5 text-yellow-500 mr-2" />
                                    Guardar
                                </HeroButton>
                                <HeroButton variant='ghost' onClick={() => prepareCloseFolio('end')} isLoading={isEndingFolio} disabled={isEndingFolio} aria-label="Finalizar">
                                    <LogOut className="w-5 h-5 text-green-500 mr-2" />
                                    Finalizar
                                </HeroButton>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex justify-center mb-2 h-7">
                                {showBtnUn && <Chip color="secondary" variant="flat">Nuevos mensajes</Chip>}
                                {showResponseTo && (
                                    <Chip color="blue" variant="flat" onClose={() => removeResponseTo()}>
                                        {messageToResponse}
                                    </Chip>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <div className="flex-grow relative bg-gray-100 dark:bg-zinc-800 rounded-lg p-2 flex items-start">
                                    <UploadFile folio={folio._id} channel={channel} setRefresh={setRefresh}/>
                                    <div className="flex-grow relative">
                                        <textArea
                                            ref={textArea}
                                            placeholder="Escribe un mensaje..."
                                            value={messageToSend}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setHasTextContent(value.trim() !== '');
                                                e.target.style.height = 'auto';
                                                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                                                if (folio?._id) {
                                                    saveDraftForFolio(folio._id, value);
                                                }
                                                if(e.shiftKey && e.key==='Enter'){
                                                    prepareMessage(e.target.value)
                                                }
                                            }}
                                            onPaste={handlePaste}
                                            className="w-full bg-transparent focus:outline-none resize-none min-h-[40px] max-h-[200px] overflow-y-auto p-2"
                                            rows={1}
                                            style={{ display: 'block', width: '100%' }}
                                        />
                                        {hasTextContent && (
                                            <HeroButton 
                                                isIconOnly 
                                                variant="light" 
                                                color="danger" 
                                                size="sm" 
                                                onClick={() => clearDraftForFolio(folio._id)}
                                                className="absolute bottom-1 right-1"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </HeroButton>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 ml-2">
                                        <HeroButton 
                                            isIconOnly 
                                            color="primary" 
                                            aria-label="Enviar mensaje"
                                            onPress={() => prepareMessage(messageToSend)}
                                            isLoading={isLoading}
                                            disabled={isLoading || !hasTextContent}
                                            size="sm"
                                        >
                                            <Send className="w-5 h-5" />
                                        </HeroButton>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-1 text-xs text-gray-500">
                                    <div>
                                        {showAutoSaveIndicator && <span className="transition-opacity duration-300" style={{ color: indicatorColor }}>{indicatorMessage}</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <HeroButton size="sm" variant='ghost' onClick={() => prepareCloseFolio('save')} isLoading={isEndingFolio} disabled={isEndingFolio}>
                                            <Save className="w-4 h-4 mr-1" />
                                            Guardar y Cerrar
                                        </HeroButton>
                                        <HeroButton key={'btnend-'+folio} variant='ghost' onClick={() => prepareCloseFolio('end')} isLoading={isEndingFolio} disabled={isEndingFolio} isIconOnly aria-label="Finalizar">
                                            <LogOut className="w-5 h-5 text-green-500" />
                                        </HeroButton>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
    
            {/* Modals */}
            {folio && (
                <HeroModal isOpen={openModal} onOpenChange={setOpenModal} backdrop="blur">
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="flex flex-col gap-1">
                                    ¿Deseas {typeClose === 'guardar' ? 'continuar más tarde con' : 'finalizar'} el folio #{folio._id}?
                                </ModalHeader>
                                <ModalBody>
                                    <div className="flex flex-col gap-4">
                                        {typeClose === 'guardar' && (
                                            <div className="flex items-center gap-2">
                                                <HeroCheckbox
                                                    isSelected={assignPrivateAlways || isFolioAttachedAgent}
                                                    onValueChange={() => !assignPrivateAlways && setIsFolioAttachedAgent(!isFolioAttachedAgent)}
                                                    isDisabled={assignPrivateAlways}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="text-sm">Enviar a inbox privado</span>
                                                        <span className="text-xs text-gray-500">{assignPrivateAlways ? 'Se enviará a Inbox Privado' : 'Selecciona para asignar'}</span>
                                                    </div>
                                                </HeroCheckbox>
                                            </div>
                                        )}
                                        {!isFolioAttachedAgent && infoPipeline && typeClose === 'guardar' && (
                                            <HeroSelect
                                                label="Enviar a pipeline"
                                                placeholder="Seleccione una etapa"
                                                items={fillStages() || []}
                                                selectedKeys={selectedStage ? [selectedStage] : []}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setSelectedStage(value === '-1' || !value ? null : value);
                                                }}
                                            >
                                                {(stage) => <SelectItem key={stage.value} value={stage.value}>{stage.text}</SelectItem>}
                                            </HeroSelect>
                                        )}
                                        <HeroSelect
                                            label="Clasificación de la conversación"
                                            placeholder="Selecciona una clasificación"
                                            items={listClassification || []}
                                            isDisabled={isEndingFolio}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                changeClassification(value);
                                                if (assignPrivateAlways) {
                                                    setIsFolioAttachedAgent(assignPrivateAlways);
                                                }
                                            }}
                                        >
                                            {(classification) => <SelectItem key={classification._id} value={classification._id}>{classification.text}</SelectItem>}
                                        </HeroSelect>
                                        {infoForm && renderForm(infoForm)}
                                    </div>
                                </ModalBody>
                                <ModalFooter>
                                    <HeroButton color="danger" variant="light" onPress={onClose}>Cancelar</HeroButton>
                                    <HeroButton color="primary" onPress={() => closeFolio(onClose)} isLoading={isEndingFolio} disabled={isEndingFolio}>
                                        {typeClose === 'guardar' ? 'Guardar y Cerrar' : 'Finalizar'}
                                    </HeroButton>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </HeroModal>
            )}
            <HeroModal isOpen={openModalError} onOpenChange={setOpenModalError} backdrop="blur">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex items-center gap-2">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                                <span className="text-red-500">Error</span>
                            </ModalHeader>
                            <ModalBody><p>{messageError}</p></ModalBody>
                            <ModalFooter>
                                <HeroButton color="danger" onPress={onClose}>Cerrar</HeroButton>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </HeroModal>
            <HeroModal isOpen={openModalPreview} onOpenChange={setOpenModalPreview} size="4xl" backdrop="blur">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex items-center gap-2">
                                <Mail className="w-6 h-6 text-gray-500" />
                                <span>Vista Previa del Correo</span>
                            </ModalHeader>
                            <ModalBody>
                                {folio.lastEmailProcessed && (
                                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                        {toSendRecipients(folio.lastEmailProcessed.toRecipients, 'Para: ')}
                                        {fillRecipients(folio.lastEmailProcessed.ccRecipients, 'CC: ')}
                                        <div className="text-sm font-semibold"><span className="font-semibold">Asunto: </span>{folio.lastEmailProcessed.subject}</div>
                                    </div>
                                )}
                                <HeroDivider />
                                <div className="prose max-w-none mt-4" dangerouslySetInnerHTML={{ __html: previewEmailHTML }} />
                                <HeroDivider className="my-4"/>
                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Archivos adjuntos:</h4>
                                    {attachments && attachments.length > 0 ? (
                                        <ul className="list-disc list-inside">
                                            {attachments.map((file, index) => (
                                                <li key={index} className="text-sm">{file.name}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-gray-500">No hay archivos adjuntos.</p>
                                    )}
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <HeroButton variant="light" onPress={onClose}>Cancelar</HeroButton>
                                <HeroButton 
                                    color="primary" 
                                    onPress={() => { setOpenModalPreview(false); setPreviewEmail(null); prepareEmail(previewEmailHTML); }} 
                                    isLoading={isLoading} 
                                    disabled={isLoading}
                                    startContent={<Send className="w-4 h-4"/>}
                                >
                                    Enviar
                                </HeroButton>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </HeroModal>
        </>
    );
}
 
export default CommentsV2;      