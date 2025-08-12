import React, { useContext, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Comment, Select, Segment, Dimmer, Loader, Image } from 'semantic-ui-react';
import { Snippet, Textarea as textarea, Button as HeroButton, Chip, Modal as HeroModal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select as HeroSelect, SelectItem, Checkbox as HeroCheckbox, Divider as HeroDivider, Input, ButtonGroup, addToast, ToastProvider, Tooltip } from "@heroui/react";
import { Paperclip, Send, XCircle, Save, LogOut, AlertTriangle, Mail, Globe, Box, Inbox, MessageCircle, PhoneCallIcon, MailOpen, Sparkles, MessageSquareText, Search, Calendar, Clock } from 'lucide-react';
import TextSizeControl from '../../../components/TextSizeControl';
import shortParagraph from './../../../img/short-paragraph.png';
import SocketContext from './../../../controladores/SocketContext';
import MessageBubble from './MessageBubble';
import ListFoliosContext from '../../../controladores/FoliosContext';
import Call from './Call';
import UploadFile from './UploadFile';
import UploadMultipleFiles from './UploadMultipleFiles';
import MessageBubbleEmail from './MessageBubbleEmail';
import { Editor } from '@tinymce/tinymce-react';
import moment from 'moment';
import ElapsedTime from './ElapsedTime';
import SlashCommandMenu from './SlashCommandMenu';

const CommentsV2 = ({ folio, fullFolio, onCall, setOnCall, setRefresh, sidCall, setSidCall, boxMessage, vFolio, userInfo, availableCh, setMessageToSend, messageToSend, assignmentTime: propAssignmentTime, removeFolioAssignmentTime, hasTextContent, setHasTextContent, quicklyAnswer }) => {
   console.log('messageToSend', messageToSend);
    const listFolios = useContext(ListFoliosContext);
    const socket = useContext(SocketContext);
    const [isLoading, setIsLoading] = useState(false);
    const [channel, setChannel] = useState(null);
    const [typeFolio, setTypeFolio] = useState(null);
    const [alias, setAlias] = useState(null);
    const [lastMessageFolio, setLastMessageFolio] = useState(null);
    const [channelEmail, setChannelEmail] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [contador, setContador] = useState(0);
    const editorRef = useRef(null);
    const textArea = useRef(null);

    const [titleModal, setTitleModal] = useState('');
    const [contentMessage, setContentMessage] = useState(
        <Segment>
            <Dimmer active inverted>
                <Loader inverted>Cargando</Loader>
            </Dimmer>
            <Image src={shortParagraph} />
        </Segment>
    );
    const [typeClose, setTypeClose] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const lastNotifiedMessage = useRef(null);
    const [openModalError, setOpenModalError] = useState(false);
    const [messageError, setMessageError] = useState('');
    const [openModalPreview, setOpenModalPreview] = useState(false);
    const [listClassification, setListClassification] = useState([]);
    const [classification, setClassification] = useState(-1);
    const [formClassification, setFormClassification] = useState({});
    const [isFolioAttachedAgent, setIsFolioAttachedAgent] = useState(false);
    const [message, setMessage] = useState(null);
    const [isOpenError, setIsOpenError] = useState(false);
    const [infoForm, setInfoForm] = useState(null);
    const [showBtnUn, setShowBtnUn] = useState(false);
    const pipelineAssign = userInfo.service?.pipeline;
    const assignPrivateAlways = userInfo.assignPrivateAlways;
    const infoPipeline = folio.service.pipelines.find((x) => x._id === pipelineAssign);
    const [listStage] = useState(infoPipeline ? infoPipeline.pipelines : false);
    const [selectedStage, setSelectedStage] = useState(null);
    const [openModalFolio, setOpenModalFolio] = useState(false);
    const [previewEmail, setPreviewEmail] = useState(null);
    const [previewEmailHTML, setPreviewEmailHTML] = useState(null);
    const [isEndingFolio, setIsEndingFolio] = useState(false);
    const [currentFolio, setCurrentFolio] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isSearchVisible, setIsSearchVisible] = useState(false); // New state for toggle

    const [messageDrafts, setMessageDrafts] = useState(() => {
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
    const [indicatorMessage, setIndicatorMessage] = useState('');
    const [indicatorColor, setIndicatorColor] = useState('green');
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiModalContent, setAiModalContent] = useState('');
    const debounceTimerRef = useRef(null);

    const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
    const matchesRef = useRef([]);

    const { messagesWithMatches, matchCount } = useMemo(() => {
        console.log('Processing messages...', {
            searchTerm,
            hasMessages: !!folio?.message,
            folioId: folio?._id
        });

        try {
            const messages = Array.isArray(folio?.message) ? folio.message : [];
            if (!searchTerm || !searchTerm.trim()) {
                console.log('No search term, returning all messages without highlighting');
                matchesRef.current = [];
                setCurrentMatchIndex(-1);
                return {
                    messagesWithMatches: messages.map(msg => ({ ...msg, _hasMatch: false })),
                    matchCount: 0
                };
            }

            const searchTermLower = searchTerm.toLowerCase();
            const matches = [];
            const processedMessages = messages.map(msg => {
                if (!msg) return { ...msg, _hasMatch: false };
                const content = String(msg.content || '').toLowerCase();
                const caption = String(msg.caption || '').toLowerCase();
                const subject = String(msg.subject || '').toLowerCase();
                const body = String(msg.body || '').toLowerCase();
                const hasMatch = [content, caption, subject, body].some(
                    text => text.includes(searchTermLower)
                );
                if (hasMatch) {
                    matches.push(msg._id);
                }
                return {
                    ...msg,
                    _hasMatch: hasMatch
                };
            });

            matchesRef.current = matches;
            setCurrentMatchIndex(matches.length > 0 ? 0 : -1);
            console.log(`Found ${matches.length} messages matching '${searchTerm}'`, matches);
            return {
                messagesWithMatches: processedMessages,
                matchCount: matches.length
            };
        } catch (error) {
            console.error('Error processing messages:', error);
            matchesRef.current = [];
            setCurrentMatchIndex(-1);
            return {
                messagesWithMatches: Array.isArray(folio?.message) ? folio.message : [],
                matchCount: 0
            };
        }
    }, [folio, searchTerm]);

    const navigateMatch = (direction) => {
        if (!searchTerm || matchesRef.current.length === 0) {
            console.log('Navigation prevented: No search term or no matches.');
            return;
        }

        const newIndex = direction === 'next'
            ? (currentMatchIndex + 1) % matchesRef.current.length
            : (currentMatchIndex - 1 + matchesRef.current.length) % matchesRef.current.length;

        const messageId = matchesRef.current[newIndex];
        console.log(`Navigating to ${direction}. Current index: ${currentMatchIndex}, New index: ${newIndex}, Message ID: ${messageId}`);

        setCurrentMatchIndex(newIndex);

        requestAnimationFrame(() => {
            const messageElement = document.getElementById(`message-${messageId}`);
            console.log(`Attempting to scroll to message-${messageId}. Element found:`, !!messageElement);

            if (messageElement) {
                try {
                    messageElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });

                    document.querySelectorAll('.search-match-highlight').forEach(el => {
                        el.classList.remove('search-match-highlight', 'ring-4', 'ring-blue-500', 'ring-offset-2', 'z-10', 'relative');
                    });
                    messageElement.classList.add('search-match-highlight', 'ring-4', 'ring-blue-500', 'ring-offset-2', 'z-10', 'relative', 'rounded-lg');

                    setTimeout(() => {
                        messageElement.classList.remove('search-match-highlight', 'ring-4', 'ring-blue-500', 'ring-offset-2', 'z-10', 'relative', 'rounded-lg');
                    }, 3000);
                } catch (error) {
                    console.error('Error scrolling to message:', error);
                }
            }
        });
    };

    useEffect(() => {
        if (!searchTerm) return;

        const handleKeyDown = (e) => {
            const isInputField = e.target.tagName === 'INPUT' ||
                e.target.tagName === 'TEXTAREA' ||
                e.target.isContentEditable;

            if (isInputField && e.target.placeholder !== 'Buscar en la conversación...') {
                return;
            }

            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                navigateMatch('next');
            } else if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                navigateMatch('prev');
            }
        };

        document.addEventListener('keydown', handleKeyDown, true);
        return () => document.removeEventListener('keydown', handleKeyDown, true);
    }, [searchTerm, navigateMatch]);

    const toggleSearchBar = (forceState = null) => {
        setIsSearchVisible(prev => {
            const newState = forceState !== null ? forceState : !prev;
            
            // Focus on search input when showing
            if (newState) {
                setTimeout(() => {
                    const searchInput = document.querySelector('input[placeholder="Buscar en la conversación..."]');
                    if (searchInput) searchInput.focus();
                }, 100);
            }
            
            return newState;
        });
    };
    
    // Global keyboard shortcuts for search
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            // Close search with Escape key when it's visible
            if (e.key === 'Escape' && isSearchVisible) {
                e.preventDefault();
                toggleSearchBar(false);
                // Clear any active element focus
                if (document.activeElement) {
                    document.activeElement.blur();
                }
            }
            
            // Open search with Ctrl+F or Cmd+F
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                toggleSearchBar(true);
            }
        };
        
        // Use capture phase to ensure we catch the event before other handlers
        document.addEventListener('keydown', handleGlobalKeyDown, true);
        return () => document.removeEventListener('keydown', handleGlobalKeyDown, true);
    }, [isSearchVisible]);

    const showIndicator = (message, isRestoration = false) => {
        setIndicatorMessage(message);
        setIndicatorColor(isRestoration ? "rgba(0, 100, 200, 0.8)" : "rgba(0, 128, 0, 0.7)");
        setShowAutoSaveIndicator(true);
    };

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
            const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
            setShowBtnUn(prev => !isAtBottom);
        }
    }, [folio?.message && folio?.message?.length]);

    const saveDraftForFolio = useCallback((folioId) => {
        console.log('Attempting to save draft for folio:', folioId, 'Current typeFolio:', typeFolio);
        if (typeFolio === '_EMAIL_' && editorRef.current) {
            const emailContent = editorRef.current.getContent();
            if (emailContent && emailContent.trim() !== '' && emailContent !== '<p></p>') {
                debounce(() => {
                    setMessageDrafts(prevDrafts => {
                        const newDrafts = { ...prevDrafts };
                        newDrafts[folioId] = emailContent;
                        console.log('Saved draft for folio:', folioId);
                        showIndicator("Guardado...");
                        localStorage.setItem('messageDrafts', JSON.stringify(newDrafts));
                        return newDrafts;
                    });
                });
            }
        } else if (textArea.current && textArea.current.value && textArea.current.value.trim() !== '') {
            debounce(() => {
                setMessageDrafts(prevDrafts => {
                    const newDrafts = { ...prevDrafts };
                    newDrafts[folioId] = textArea.current.value;
                    console.log('Saved draft for folio:', folioId);
                    showIndicator("Guardado...");
                    localStorage.setItem('messageDrafts', JSON.stringify(newDrafts));
                    return newDrafts;
                });
            });
        }
    }, [typeFolio, debounce]);

    const restoreDraftForFolio = (folioId) => {
        console.log('Attempting to restore draft for folio:', folioId, 'Draft exists:', !!messageDrafts[folioId], 'Current typeFolio:', typeFolio);
        console.log('All drafts:', messageDrafts);

        if (messageDrafts[folioId]) {
            if (typeFolio === '_EMAIL_' && editorRef.current) {
                console.log('Restoring email draft:', messageDrafts[folioId]);
                editorRef.current.setContent(messageDrafts[folioId]);
                showIndicator("Borrador restaurado", true);
                setHasTextContent(true);
            } else if (textArea.current) {
                console.log('Restoring text draft:', messageDrafts[folioId]);
                textArea.current.value = messageDrafts[folioId];
                showIndicator("Borrador restaurado", true);
                setHasTextContent(true);

                const event = new Event('input', { bubbles: true });
                textArea.current.dispatchEvent(event);
            }
        }
    };

    const clearDraftForFolio = (folioId) => {
        setMessageDrafts(prevDrafts => {
            const newDrafts = { ...prevDrafts };
            delete newDrafts[folioId];
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

    const getFolioMessages = (folio) => {
        setTitleModal('Historial de Folio #' + folio);
        setOpenModalFolio(!openModalFolio);

        socket.connection.emit('getMessageHist', { folio }, (res) => {
            if (res.success) {
                if (res.folio.typeFolio === '_EMAIL_') {
                    setContentMessage(
                        <div className='imessage'>
                            {res.folio.message.map((msg) => (
                                <MessageBubbleEmail key={msg._id} message={msg} />
                            ))}
                        </div>
                    );
                } else {
                    setContentMessage(
                        <div className='imessage'>
                            {res.folio.message.map((msg) => (
                                <MessageBubble key={msg._id} message={msg} />
                            ))}
                        </div>
                    );
                }
            }
        });
    };

    const [readyFiles, setReadyFiles] = useState([]);
    const [showResponseTo, setShowResponseTo] = useState(null);
    const [messageToResponse, setMessageToResponse] = useState('');

    const responseToMessage = (idMessage) => {
        let message = folio.message.find((x) => x._id === idMessage);
        setShowResponseTo(message.externalId);
        setMessageToResponse('Responder al mensaje: ' + message.content);
        textArea.current.focus();
    };

    const removeResponseTo = () => {
        setShowResponseTo(null);
        setMessageToResponse(null);
    };

    const reactToMessage = (idMessage, reactionToSend) => {
        socket.connection.emit('reactToMessageAgent', {
            event: reactionToSend,
            externalId: idMessage,
        }, (result) => {
            if (!result.success) {
                addToast({
                    title: 'Error',
                    description: result.body.message,
                    color: 'danger'
                });
                return false;
            }
            addToast({
                title: 'Reaccionaste',
                description: 'Reaccionaste',
                color: 'success'
            });
        });
    };

    const prepareMessage = async (msg) => {
        let _msg = '';
        if (msg && typeof msg === 'string') { _msg = msg; }

        if (_msg.trim() === '') {
            if (messageToSend.trim() === '') {
                addToast({
                    title: 'Error',
                    description: 'No se puede enviar un mensaje vacio',
                    color: 'danger'
                });
                return false;
            } else {
                _msg = messageToSend;
            }
        }

        setIsLoading(true);

        socket.connection.emit('sendMessage', {
            token: window.localStorage.getItem('sdToken'),
            folio: folio._id,
            message: _msg,
            responseTo: showResponseTo,
            class: 'text'
        }, (result) => {
            if (!result.body.success) {
                addToast({
                    title: 'Error',
                    description: result.body.message,
                    color: 'danger'
                });
                return false;
            }
            let index = listFolios.current.findIndex((x) => x.folio._id === folio._id);
            listFolios.current[index].folio.message.push(result.body.lastMessage);
            setIsLoading(false);
            setMessageToSend('');
            textArea.current.value = '';
            const textarea = textArea.current;
            textarea.blur();
            setTimeout(() => {
                if (textarea) {
                    textarea.focus({ preventScroll: true });
                }
            }, 0);
            setShowResponseTo(null);
            setMessageToResponse(null);
            setTimeout(() => {
                if (listFolios.currentBox) {
                    listFolios.currentBox.scrollTop = listFolios.currentBox.scrollHeight;
                }
            }, 0);
            console.log('Message sent successfully, clearing draft for folio:', folio._id);
            if (folio && folio._id) {
                clearDraftForFolio(folio._id);
            }
            setHasTextContent(false);
        });
    };

    const previewEmailF = (content) => {
        if (content.length > 0) {
            setPreviewEmailHTML(content);
            content = <div dangerouslySetInnerHTML={{ __html: content }}></div>;
            setPreviewEmail(content);
            setOpenModalPreview(true);
        } else {
            addToast({
                title: 'Error',
                description: 'No hay contenido para enviar',
                color: 'danger'
            });
        }
    };

    const prepareEmail = async (msg) => {
        let _msg = '';
        if (msg && typeof msg === 'string') { _msg = msg; }

        if (_msg.trim() === '') {
            if (messageToSend.trim() === '') {
                return false;
            } else {
                _msg = messageToSend;
            }
        }

        const excludeEmail = channelEmail;
        const toFilteredEmails = folio.lastEmailProcessed.toRecipients.filter(recipient => recipient.email !== excludeEmail);
        const toEmailsString = toFilteredEmails.map(recipient => recipient.email).join(',');
        const ccEmailsString = folio.lastEmailProcessed.ccRecipients && folio.lastEmailProcessed.ccRecipients.length > 0 ? folio.lastEmailProcessed.ccRecipients.map(recipient => recipient.email).join(',') : [];

        setIsLoading(true);

        socket.connection.emit('sendEmail', {
            token: window.localStorage.getItem('sdToken'),
            folio: folio._id,
            subject: folio.lastEmailProcessed.subject,
            message: _msg,
            responseTo: folio.lastEmailProcessed.externalId ? folio.lastEmailProcessed.externalId : null,
            to: toEmailsString,
            cc: ccEmailsString,
            bcc: [],
            attachments: attachments.length > 0 ? attachments : null,
            class: 'html'
        }, (result) => {
            if (!result.body.success) {
                addToast({
                    title: 'Error',
                    description: result.body.message,
                    color: 'danger'
                });
                return false;
            }
            let index = listFolios.current.findIndex((x) => x.folio._id === folio._id);
            listFolios.current[index].folio.message.push(result.body.lastMessage);
            setIsLoading(false);
            setMessageToSend('');
            editorRef.current.setContent("");
            setReadyFiles([]);
            setShowResponseTo(null);
            setMessageToResponse(null);
            listFolios.currentBox.scrollTop = listFolios.currentBox.scrollHeight;
            if (folio && folio._id) {
                clearDraftForFolio(folio._id);
                setHasTextContent(false);
            }
        });
    };

    useEffect(() => {
        if (messageToSend && editorRef.current) {
            editorRef.current.insertContent('<div></div><div></div><div></div>' + messageToSend + '<div></div><div></div><div></div>');
        }
    }, [setMessageToSend, messageToSend]);

    const prepareButtons = async (msg) => {
        let _msg = '';
        if (msg && typeof msg === 'string') { _msg = msg; }

        if (_msg.trim() === '') {
            if (messageToSend.trim() === '') {
                addToast({
                    title: 'Error',
                    description: 'No se puede enviar un mensaje vacio',
                    color: 'danger'
                });
                return false;
            } else {
                _msg = messageToSend;
            }
        }

        setIsLoading(true);

        socket.connection.emit('sendMessage', {
            token: window.localStorage.getItem('sdToken'),
            folio: folio._id,
            message: _msg,
            responseTo: showResponseTo,
            class: 'buttonreply',
            interaction: [
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
            if (!result.body.success) {
                addToast({
                    title: 'Error',
                    description: result.body.message,
                    color: 'danger'
                });
                return false;
            }
            let index = listFolios.current.findIndex((x) => x.folio._id === folio._id);
            listFolios.current[index].folio.message.push(result.body.lastMessage);
            setIsLoading(false);
            setMessageToSend('');
            textArea.current.value = '';
            textArea.current.focus();
            setShowResponseTo(null);
            setMessageToResponse(null);
            listFolios.currentBox.scrollTop = listFolios.currentBox.scrollHeight;
        });
    };

    const prepareCloseFolio = (tClose) => {
        if (tClose === 'save') {
            setTypeClose('guardar');
        }
        if (tClose === 'end') {
            setTypeClose('finalizar');
        }
        setOpenModal(true);

        if (listFolios?.current) {
            let index = listFolios.current.findIndex((x) => x.folio._id === folio._id);
            if (index !== -1 && listFolios.current[index]?.folio?.message) {
                let lastMessage = listFolios.current[index].folio.message[listFolios.current[index].folio.message.length - 1];
                if (lastMessage) {
                    setLastMessageFolio(lastMessage.content);
                } else {
                    setLastMessageFolio(null);
                }
            } else {
                setLastMessageFolio(null);
            }
        } else {
            setLastMessageFolio(null);
        }
    };

    const closeFolio = () => {
        if (classification === -1) {
            alert('Selecciona una clasificación');
            return false;
        }

        let validate = [];
        if (infoForm && infoForm.form && Array.isArray(infoForm.form)) {
            let fRequire = infoForm.form.filter((x) => x.require && x.status);
            validate = fRequire.map((xField) => {
                let findContent = Object.keys(formClassification).find((x) => x === xField._id);
                if (!findContent) {
                    return { success: false, id: xField, message: 'Agregue un valor al campo "' + xField.label + '"' };
                }

                if (xField.require) {
                    switch (xField.rtype) {
                        case 'text':
                            return formClassification[xField._id].trim() === '' ? { success: false, id: xField, message: 'Agregue un valor al campo "' + xField.label + '"' } : { success: true };
                        case 'number':
                            return formClassification[xField._id].trim() === '' ? { success: false, id: xField, message: 'Agregue un valor al campo "' + xField.label + '"' } : { success: true };
                        case 'select':
                            return formClassification[xField._id] === -1 ? { success: false, id: xField, message: 'Seleccione una opción en "' + xField.label + '"' } : { success: true };
                    }
                } else {
                    return true;
                }
            });

            let localV = true;
            for (let i = 0; i < validate.length; i++) {
                if (!validate[i].success) {
                    alert(validate[i].message);
                    localV = false;
                    break;
                }
            }

            if (!localV) { return false; }
        }

        setIsEndingFolio(true);
        let actionClose = '';
        let _channel = fullFolio.folio.channel.title;
        let _queue = getLabelQueue();
        let _anchorPerson = fullFolio.folio.person.anchor;
        let _aliasIdPerson = fullFolio.folio.person.aliasId;
        let _fromInbox = fullFolio.folio.fromInbox;
        let _fromPipeline = fullFolio.folio.fromPipeline;
        if (typeClose === 'guardar') {
            actionClose = 'save';
        }
        if (typeClose === 'finalizar') {
            actionClose = 'end';
        }

        let isFolioToPipeline = false;
        if (selectedStage) {
            isFolioToPipeline = selectedStage;
        }
        socket.connection.emit('closeFolio', {
            folio: folio._id,
            token: window.localStorage.getItem('sdToken'),
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
            fromPipelineStage: selectedStage ? selectedStage : null,
            fromPipelineId: pipelineAssign ? pipelineAssign : null,
        }, (result) => {
            if (!result.success) {
                setMessage(result.message);
                setIsOpenError(true);
                return false;
            }

            // Emit stats event for save/finalize after successful close
            try {
                const eventType = actionClose === 'end' ? 'folio:finalize' : 'folio:save';
                const nowISO = new Date().toISOString();

                const payload = {
                    token: window.localStorage.getItem('sdToken'),
                    type: eventType,
                    agentId: userInfo?._id,
                    folioId: folio?._id,
                    serviceId: userInfo?.service?.id,
                    eventAt: nowISO
                };
                if (eventType === 'folio:finalize') {
                    payload.finalizedAt = nowISO;
                } else {
                    payload.savedAt = nowISO;
                }

                socket.connection.emit('stats:event', payload);
            } catch (e) {
                console.warn('stats:event emit failed (closeFolio):', e);
            }

            // Remove the assignment time before updating the list
            if (removeFolioAssignmentTime) {
                removeFolioAssignmentTime(folio._id);
            }

            let index = listFolios.current.findIndex((x) => x.folio._id === folio._id);
            listFolios.current.splice(index, 1);
            setFormClassification({});
            setRefresh(Math.random());
            setOpenModal(false);
            setInfoForm(null);
            setIsEndingFolio(false);
            setIsFolioAttachedAgent(false);
        });
    };

    useEffect(() => {
        console.log('Folio change effect triggered. New folio:', folio._id, 'Previous folio:', previousFolioId);
        if (previousFolioId && previousFolioId !== folio._id) {
            console.log('Saving draft for previous folio before switching');
            saveDraftForFolio(previousFolioId);
        }

        setPreviousFolioId(folio._id);
        setCurrentFolio(folio._id);
        setChannel(folio.channel.name);
        setLastMessageFolio(null);
        setReadyFiles([]);
        setTypeFolio(folio.typeFolio);
        if (folio.typeFolio === '_EMAIL_') { setChannelEmail(folio.channel.token.public); }
        setAlias(folio.person.aliasId ? folio.person.aliasId : folio.person.anchor);
        if (editorRef && editorRef.current) {
            editorRef.current.setContent("");
        }

        const loadListClassifications = async () => {
            const tmpClass = [];
            for (let item of fullFolio.clasifications) {
                tmpClass.push({
                    key: item._id,
                    value: item._id,
                    text: item.name
                });
            }
            setListClassification(tmpClass);
        };

        if (channel != 'call') {
            let fullHeight = boxMessage.current.scrollHeight;
            let pcPosition = ((boxMessage.current.scrollTop + boxMessage.current.clientHeight) * 100) / fullHeight;

            if (pcPosition >= 90) {
                boxMessage.current.scrollTop = boxMessage.current.scrollHeight;
            }
        }

        setTimeout(() => {
            console.log('Attempting to restore draft after delay');
            restoreDraftForFolio(folio._id);
        }, 300);

        listFolios.currentBox = boxMessage.current;
        console.log('refrescando componente de comentarios');
        loadListClassifications();
    }, [folio]);

    useEffect(() => {
        console.log('Setting up auto-save interval');
        const intervalo = setInterval(() => {
            setContador((prevContador) => prevContador + 1);
            console.log('Auto-save check for folio:', folio?._id, 'Type:', typeFolio);
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

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const getLabelQueue = () => {
        if (folio.isGlobalQueue) {
            let name = "Queue";
            if (folio.isGlobalDistributor) {
                name = folio.service.genericQueues.find((x) => x._id === folio.queue);
            } else {
                name = folio.service.globalQueues.find((x) => x._id === folio.queue);
            }
            return name.name;
        } else {
            let chan = folio.service.channels.find((x) => x._id === folio.channel._id);
            let queu = chan.queues.find((x) => x._id === folio.queue);
            return queu.name;
        }
    };

    const changeClassification = (idClass) => {
        const tmpClass = fullFolio.clasifications.find((x) => x._id === idClass);
        if (tmpClass.form.length > 0) {
            setInfoForm(tmpClass);
        } else {
            setInfoForm(null);
            setFormClassification({});
        }
        setClassification(idClass);
    };

    const renderForm = (formData) => {
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

    useEffect(() => {
        if (typeFolio != '_CALL_') {
            boxMessage.current.scrollTop = boxMessage.current && boxMessage.current.scrollHeight ? boxMessage.current.scrollHeight : boxMessage.current.scrollTop;
        }
    }, [vFolio]);

    useEffect(() => {
        if (typeFolio != '_CALL_') {
            boxMessage.current.addEventListener(
                'scroll', () => {
                    if (boxMessage && boxMessage.current) {
                        let fullHeight = boxMessage.current.scrollHeight;
                        let pcPosition = ((boxMessage.current.scrollTop + boxMessage.current.clientHeight) * 100) / fullHeight;
                        if (pcPosition >= 90) {
                            setShowBtnUn(false);
                        }
                    }
                }
            );
        }
    }, []);

    // This effect handles notifications for new messages
    useEffect(() => {
        if (openModal && lastMessageFolio && folio?._id && channel !== 'call') {
            let index = listFolios?.current.findIndex((x) => x.folio._id === folio._id);
            if (index !== -1) {
                let lastCurrentMessage = listFolios.current[index]?.folio?.message?.slice(-1)[0];
                if (lastCurrentMessage?.content &&
                    lastCurrentMessage.content !== lastMessageFolio &&
                    lastCurrentMessage.content !== lastNotifiedMessage.current) {
                    lastNotifiedMessage.current = lastCurrentMessage.content;
                    let messagePreview = lastCurrentMessage.content.length > 30
                        ? `Nuevo mensaje: ${lastCurrentMessage.content.substring(0, 30)}...`
                        : lastCurrentMessage.content;
                    addToast({
                        title: 'Nuevo mensaje',
                        description: messagePreview,
                        color: 'danger',
                        timeout: 5000,
                    });
                }
            }
        }
    }, [lastMessageFolio, folio?._id, openModal, channel, listFolios]);


    // This effect handles the text area and message sending
    useEffect(() => {
        if (textArea.current && messageToSend.length > 0) {
            textArea.current.value = messageToSend;
            setMessageToSend('');
        }
    }, [messageToSend]);

    // This effect handles auto-scrolling when new messages arrive
    useEffect(() => {
        if (!boxMessage.current) return;

        const { scrollTop, scrollHeight, clientHeight } = boxMessage.current;
        const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 100;
        
        if (isNearBottom) {
            const timer = setTimeout(() => {
                if (boxMessage.current) {
                    boxMessage.current.scrollTop = boxMessage.current.scrollHeight;
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [folio?.message?.length]); // Only trigger when messages change

    const clearTextArea = () => {
        if (typeFolio === '_EMAIL_' && editorRef.current) {
            editorRef.current.setContent('');
        } else if (textArea.current) {
            textArea.current.value = '';
        }
        setHasTextContent(false);

        if (folio && folio._id) {
            setMessageDrafts(prevDrafts => {
                const newDrafts = { ...prevDrafts };
                delete newDrafts[folio._id];
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
        setTimeout(() => {
            if (typeFolio === '_EMAIL_' && editorRef.current) {
                const content = editorRef.current.getContent();
                setHasTextContent(content && content.trim() !== '' && content !== '<p></p>');
            } else if (textArea.current) {
                setHasTextContent(textArea.current.value.trim() !== '');
            }
        }, 100);
    }, [folio, typeFolio]);

    const fillStages = () => {
        const options = listStage && listStage
            .filter(x => x.status === true)
            .map((x) => {
                return { key: x._id, value: x._id, text: x.name };
            });
        options.unshift({ key: -1, value: -1, text: 'Seleccione una etapa' });
        return options;
    };

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
    };

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
    };

    const handlePaste = async (event) => {
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                event.preventDefault();
                const file = items[i].getAsFile();
                const fileName = `pasted-image-${Date.now()}.${file.type.split('/')[1]}`;
                const imageFile = new File([file], fileName, { type: file.type });

                addToast({
                    title: 'Subiendo imagen pegada...',
                    description: 'Subiendo imagen pegada...',
                    color: 'info'
                });
                await uploadPastedImage(imageFile);
            }
        }
    };

    const uploadPastedImage = async (file) => {
        if (!folio || !folio._id) {
            addToast({
                title: 'Error',
                description: 'No se puede subir la imagen, no hay un folio activo.',
                color: 'danger'
            });
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('channel', channel);

        try {
            const response = await socket.uploadFile(folio._id, formData);
            if (response.status === 'OK' || response.status === 200 || response.status === 201) {
                addToast({
                    title: 'Imagen',
                    description: 'Imagen cargada y enviada con éxito!',
                    color: 'success'
                });
                if (setRefresh) {
                    setRefresh(true);
                }
            } else {
                throw new Error(response.message || 'Error al subir la imagen.');
            }
        } catch (error) {
            console.error('Error uploading pasted image:', error);
            addToast({
                title: 'Error',
                description: `Error al subir la imagen: ${error.message}`,
                color: 'danger'
            });
        }
    };

    const getChannelIcon = (channelName) => {
        try {
            if (!channelName || typeof channelName !== 'string') {
                return <MessageCircle className="w-5 h-5 text-gray-400" />;
            }

            const ch = Array.isArray(availableCh)
                ? availableCh.find(c => c && c.id === channelName)
                : null;

            if (ch?.image) {
                return <img
                    src={ch.image}
                    alt={channelName}
                    className="w-5 h-5"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                    }}
                />;
            }

            const iconProps = {
                className: 'w-5 h-5 text-gray-400'
            };

            switch (channelName.toLowerCase()) {
                case 'voice':
                case 'call':
                    return <PhoneCallIcon {...iconProps} />;
                case 'email':
                    return <MailOpen {...iconProps} />;
                default:
                    return <MessageCircle {...iconProps} />;
            }
        } catch (error) {
            console.error('Error in getChannelIcon:', error);
            return <MessageCircle className="w-5 h-5 text-gray-400" />;
        }
    };

    return (
        <>
            <div className="flex flex-col h-full bg-gray-50">
                {/* Toggle Button for Search Bar */}
                <div className="absolute top-4 left-[60%] transform -translate-x-1/2 z-20">
                    <div className="flex items-center gap-2">
                        <Tooltip content={isSearchVisible ? 'Ocultar búsqueda' : 'Mostrar búsqueda'}>
                            <HeroButton
                                isIconOnly
                                color="primary"
                                variant="flat"
                                size="sm"
                                onPress={() => toggleSearchBar()}
                                aria-label={isSearchVisible ? 'Ocultar búsqueda' : 'Mostrar búsqueda'}
                                className={`bg-gradient-to-br from-indigo-500 to-pink-500 border-small border-white/50 shadow-pink-500/30 ${isSearchVisible ? 'ring-2 ring-offset-2 ring-blue-400' : ''}`}
                            >
                                <Search className="w-6 h-6 text-white" />
                            </HeroButton>
                        </Tooltip>
                        {/* Text Size Control */}
                        <TextSizeControl />
                    </div>
                </div>

                {/* Floating Search Bar */}
                <div
                    className={`fixed top-12 z-10 bg-default-50 border border-default-200 rounded-lg shadow-lg p-3 transition-all duration-300 ease-in-out max-w-md mx-auto left-0 right-0 ${
                        isSearchVisible ? 'opacity-100 translate-y-0 mt-10' : 'opacity-0 -translate-y-4 pointer-events-none'
                    }`}
                >
                    <div className="relative">
                        <div className="flex items-center gap-2">
                            <Input
                                type="text"
                                placeholder="Buscar en la conversación..."
                                className="flex-1 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setIsSearchFocused(false)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (searchTerm) {
                                            if (e.shiftKey) {
                                                navigateMatch('prev');
                                            } else {
                                                navigateMatch('next');
                                            }
                                        }
                                    }
                                }}
                                startContent={
                                    <svg className="w-4 h-4 text-default-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                }
                                endContent={
                                    searchTerm && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setSearchTerm('');
                                            }}
                                            className="text-default-400 hover:text-default-600"
                                            type="button"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    )
                                }
                                classNames={{
                                    input: 'text-sm',
                                    inputWrapper: 'bg-default-100 hover:bg-default-200 flex-grow',
                                }}
                            />
                            {searchTerm && matchCount > 0 && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log('Previous button clicked');
                                            navigateMatch('prev');
                                        }}
                                        disabled={matchCount === 0}
                                        className="p-1 rounded-md hover:bg-default-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Coincidencia anterior (Shift+Enter)"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <span className="text-xs text-default-500 mx-1">
                                        {currentMatchIndex + 1}/{matchCount}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log('Next button clicked');
                                            navigateMatch('next');
                                        }}
                                        disabled={matchCount === 0}
                                        className="p-1 rounded-md hover:bg-default-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Siguiente coincidencia (Enter)"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                        {searchTerm && (
                            <div className="mt-2 text-xs text-default-500 flex items-center gap-2 flex-wrap">
                                <span>
                                    {matchCount} {matchCount === 1 ? 'coincidencia' : 'coincidencias'}
                                    {matchCount > 0 && `(Enter siguiente, Shift+Enter anterior)`}
                                </span>
                                {searchTerm && (
                                    <Chip
                                        size="sm"
                                        color="primary"
                                        variant="flat"
                                        classNames={{
                                            base: 'ml-2',
                                            content: 'text-xs font-medium'
                                        }}
                                    >
                                        {searchTerm}
                                    </Chip>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Header */}
                <div className="p-2 border-b bg-white shadow-sm shrink-0">
                    <div className="flex items-baseline gap-4">
                        <h2 className="text-xl font-bold text-gray-800">
                            {typeFolio === '_CALL_'
                                ? 'Llamada'
                                : typeFolio === '_EMAIL_'
                                    ? `Correo con: ${folio.person.anchor}`
                                    : typeFolio === '_MESSAGES_'
                                        ? `Conversación con: ${alias}`
                                        : 'Hilo'}
                        </h2>
                        {typeFolio === '_MESSAGES_' && folio?.channel?.name && (
                            <div className="flex-shrink-0">
                                {getChannelIcon(folio.channel.name)}
                            </div>
                        )}
                    </div>
                    {typeFolio === '_EMAIL_' && (
                        <div className="mt-2 text-sm text-gray-600">
                            <div className="font-semibold">{fillRecipients(folio?.lastEmailProcessed?.toRecipients, 'Para: ')}</div>
                            <div>{fillRecipients(folio?.lastEmailProcessed?.ccRecipients, 'CC: ')}</div>
                            <div className="mt-1">
                                <span className="font-semibold">Asunto:</span> {folio?.lastEmailProcessed?.subject}
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {folio?._id && (
                            <Snippet color="primary" variant="flat">{folio._id}</Snippet>
                        )}
                        
                        {folio?.person?.anchor && (
                            <Snippet color="success" variant="flat">{folio.person.anchor}</Snippet>
                        )}
                        
                        {folio?.channel?.name && folio?.channel?.title && (
                            <Tooltip content="Canal de origen">
                            <Chip
                                color="default"
                                variant="flat"
                                className='hidden sm:flex items-center gap-1'
                                startContent={
                                    <div className="w-4 h-4 flex items-center justify-center">
                                        {getChannelIcon(folio.channel.name)}
                                    </div>
                                }
                            >
                                {folio.channel.title}
                            </Chip>
                            </Tooltip>
                        )}

                        {getLabelQueue() && (
                            <Tooltip content="Flujo de trabajo">
                            <Chip 
                                color="default" 
                                variant="flat" 
                                className='hidden sm:flex' 
                                startContent={<Inbox className="w-4 h-4"/>}
                            >
                                {getLabelQueue()}
                            </Chip>
                            </Tooltip>
                        )}
                        
                        {folio?.createdAt && (
                            <Tooltip content="Fecha de creación">
                                <Chip 
                                    color="default" 
                                    variant="flat" 
                                    className='hidden sm:flex' 
                                    startContent={<Calendar className="w-4 h-4"/>}
                                >
                                    {moment(folio.createdAt).isValid() 
                                        ? moment(folio.createdAt).format('DD/MM/YYYY HH:mm:ss')
                                        : 'Fecha inválida'}
                                </Chip>
                            </Tooltip>
                        )}
                        
                        <ElapsedTime assignmentTime={propAssignmentTime} />
                    </div>
                </div>

                {/* Scrollable Message Area */}
                <div
                    className="flex-grow overflow-y-auto p-4 relative"
                    id={`boxMessage-${folio._id}`}
                    ref={boxMessage}
                    style={{ scrollBehavior: 'smooth' }}
                >
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
                        folio.message.map((msg, index) => {
                            const matchedMessage = messagesWithMatches.find(m => m._id === msg._id);
                            const isMatch = matchedMessage?._hasMatch || false;
                            const isCurrentMatch = isMatch && matchesRef.current[matchedMessage?._matchIndex] === index;
                            const msgWithMatch = { ...msg, _hasMatch: isMatch };
                            const messageElement = typeFolio === '_EMAIL_' ? (
                                <MessageBubbleEmail
                                    key={`${msg._id}-${index}`}
                                    id={`message-${index}`}
                                    message={msgWithMatch}
                                    highlight={isMatch ? searchTerm : ''}
                                    className={`${isCurrentMatch ? 'bg-blue-50 dark:bg-blue-900/30 transition-colors duration-300' : ''} message-container`}
                                />
                            ) : (
                                <MessageBubble
                                    key={`${msg._id}-${index}`}
                                    id={`message-${index}`}
                                    allMsg={folio.message}
                                    message={msgWithMatch}
                                    responseToMessage={responseToMessage}
                                    reactToMessage={reactToMessage}
                                    typeFolio={typeFolio}
                                    contact={folio.person}
                                    highlight={isMatch ? searchTerm : ''}
                                    className={`${isCurrentMatch ? 'bg-blue-50 dark:bg-blue-900/30 transition-colors duration-300' : ''} message-container`}
                                />
                            );
                            return messageElement;
                        })
                    ) : null}
                </div>

                {/* Footer / Input Area */}
                <div className="border-t bg-white shrink-0 p-2">
                    {typeFolio === '_MESSAGES_' && fullFolio ? (
                        <div>   
                            <div className="flex justify-center mb-1 h-7">
                                {showBtnUn && <Chip color="danger" variant="flat">Nuevos mensajes</Chip>}
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
                                            placeholder="Escribe un mensaje o '/' para respuestas rápidas o ':' para emojis"
                                            defaultValue={messageToSend}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    if (e.shiftKey) {
                                                        return;
                                                    } else {
                                                        e.preventDefault();
                                                        prepareMessage(e.target.value);
                                                    }
                                                }
                                            }}
                                            onChange={(e) => {
                                                const value = e.target.value ;
                                                setMessageToSend(value);
                                                setHasTextContent(value.trim() !== '');
                                                e.target.style.height = 'auto';
                                                const maxHeight = 4 * 24;
                                                e.target.style.overflowY = e.target.scrollHeight > maxHeight ? 'auto' : 'hidden';
                                                if (folio?._id) {
                                                    saveDraftForFolio(folio._id);
                                                }
                                            }}
                                            onPaste={handlePaste}
                                            className="w-full bg-transparent focus:outline-none resize-none min-h-[40px] max-h-[6rem] overflow-y-auto p-2"
                                            autoFocus
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
                                        {/* Slash commands menu for quick answers (opens when typing "/") */}
                                        <SlashCommandMenu textareaRef={textArea} items={quicklyAnswer || []} />
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
                                        <div className="text-xs text-gray-500 text-right mt-1 pr-10">
                                            Enter para enviar mensaje / Shift+Enter para un salto de línea
                                        </div>
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
                                            <UploadFile folio={folio._id} channel={channel} setRefresh={setRefresh} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                                <div>
                                    {showAutoSaveIndicator && <span style={{ color: indicatorColor }}>{indicatorMessage}</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <HeroButton
                                            size="sm"
                                            variant="flat"
                                            startContent={<Sparkles className="w-4 h-4 text-purple-600" />}
                                            className="bg-white text-purple-700 hover:bg-purple-50 border border-purple-100 transition-colors"
                                            onPress={() => {
                                                setAiModalContent('Para activar la función de Resumir con IA, por favor consulta con tu supervisor.');
                                                setShowAIModal(true);
                                            }}
                                        >
                                            Resumir con IA
                                        </HeroButton>
                                        <HeroButton
                                            size="sm"
                                            variant="flat"
                                            startContent={<MessageSquareText className="w-4 h-4 text-blue-600" />}
                                            className="bg-white text-blue-700 hover:bg-blue-50 border border-blue-100 transition-colors"
                                            onPress={() => {
                                                setAiModalContent('Para activar la función de Contestar con IA, por favor consulta con tu supervisor.');
                                                setShowAIModal(true);
                                            }}
                                        >
                                            Contestar con IA
                                        </HeroButton>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <HeroButton
                                            size="sm"
                                            color="primary"
                                            variant="flat"
                                            startContent={<Save className="w-4 h-4" />}
                                            onPress={() => prepareCloseFolio('save')}
                                            isLoading={isEndingFolio}
                                            disabled={isEndingFolio}
                                            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:opacity-90 transition-opacity"
                                        >
                                            Continuar más tarde
                                        </HeroButton>
                                        <HeroButton
                                            size="sm"
                                            color="danger"
                                            variant="flat"
                                            startContent={<LogOut className="w-4 h-4" />}
                                            onPress={() => prepareCloseFolio('end')}
                                            isLoading={isEndingFolio}
                                            disabled={isEndingFolio}
                                            className="bg-gradient-to-r from-red-500 to-pink-600 text-white hover:opacity-90 transition-opacity"
                                        >
                                            Finalizar
                                        </HeroButton>
                                    </div>
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
                                        license_key: 'gpl',
                                        min_height: 280,
                                        max_height: 600,
                                        menubar: false,
                                        branding: false,
                                        plugins: 'autosave',
                                        autosave_restore_when_empty: true,
                                        autosave_interval: '10s',
                                        autosave_retention: '30m',
                                        fullscreen_native: true,
                                        custom_undo_redo_levels: 10,
                                        language: 'es',
                                        browser_spellcheck: true,
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
                                        startContent={<Send className="w-4 h-4" />}
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
                                {showBtnUn && <Chip color="warning" variant="flat">Nuevos mensajes</Chip>}
                                {showResponseTo && (
                                    <Chip color="blue" variant="flat" onClose={() => removeResponseTo()}>
                                        {messageToResponse}
                                    </Chip>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <div className="flex-grow relative bg-gray-100 dark:bg-zinc-800 rounded-lg p-2 flex items-start">
                                    <UploadFile folio={folio._id} channel={channel} setRefresh={setRefresh} />
                                    <div className="flex-grow relative">
                                        <textarea
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
                                                if (e.shiftKey && e.key === 'Enter') {
                                                    prepareMessage(e.target.value);
                                                }
                                            }}
                                            onPaste={handlePaste}
                                            className="w-full bg-transparent focus:outline-none resize-none min-h-[40px] max-h-[200px] overflow-y-auto p-2"
                                            rows={1}
                                            style={{ display: 'block', width: '100%' }}
                                        />
                                        {/* Slash commands menu for quick answers (opens when typing "/") */}
                                        <SlashCommandMenu textareaRef={textArea} items={quicklyAnswer || []} />
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
                                        <HeroButton
                                            size="sm"
                                            color="primary"
                                            variant="flat"
                                            startContent={<Save className="w-4 h-4" />}
                                            onClick={() => prepareCloseFolio('save')}
                                            isLoading={isEndingFolio}
                                            disabled={isEndingFolio}
                                            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:opacity-90 transition-opacity"
                                        >
                                            Guardar y Cerrar
                                        </HeroButton>
                                        <HeroButton
                                            key={'btnend-' + folio}
                                            color="success"
                                            variant="flat"
                                            startContent={<LogOut className="w-4 h-4" />}
                                            onClick={() => prepareCloseFolio('end')}
                                            isLoading={isEndingFolio}
                                            disabled={isEndingFolio}
                                            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90 transition-opacity"
                                        >
                                            Finaliza
                                        </HeroButton>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* AI Feature Modal */}
            <HeroModal isOpen={showAIModal} onOpenChange={setShowAIModal} backdrop="blur">
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">Función no disponible</ModalHeader>
                    <ModalBody>
                        <p>{aiModalContent}</p>
                    </ModalBody>
                    <ModalFooter>
                        <HeroButton color="primary" onPress={() => setShowAIModal(false)}>
                            Entendido
                        </HeroButton>
                    </ModalFooter>
                </ModalContent>
            </HeroModal>

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
                                        <div className="text-xs text-gray-400 text-right mt-1 pr-2">
                                            Presiona Shift+Enter para un salto de línea
                                        </div>
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
                                <HeroDivider className="my-4" />
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
                                    startContent={<Send className="w-4 h-4" />}
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
};

export default React.memo(CommentsV2);