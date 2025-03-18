import React, {useRef, useState, useContext, useCallback, useEffect} from 'react';
import { Icon, Loader, Button, Image, Modal, Header, Message, Dimmer } from 'semantic-ui-react';
import axios, {post} from 'axios';
import SocketContext from './../../../controladores/SocketContext';
import ListFoliosContext from '../../../controladores/FoliosContext';
import Dropzone from 'react-dropzone';

const UploadFile = ({folio, channel, setRefresh}) => {
    const listFolios = useContext(ListFoliosContext);
    const socket = useContext(SocketContext);
    
    const [onPushFile, setOnPushFile] = useState(false);
    const fileInputRef = useRef();
    const [toUpload, setToUpload] = useState(null);
    const [onUpload, setOnUpload] = useState(false);
    const [nameFile, setNameFile] = useState(null);
    const [contentShow, setContentShow] = useState(null);
    const [nameFileSend, setNameFileSend] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [urlFile, setUrlFile] = useState(null);
    const [urlFileType, setUrlFileType] = useState(null);

    // Clipboard paste handler
    useEffect(() => {
        const mimeToExt = {
            'image/png': 'png',
            'image/jpeg': 'jpg',
            'application/pdf': 'pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
            'application/vnd.ms-excel': 'xls'
        };

        const handlePaste = (e) => {
            if (!e.clipboardData) return;
            
            const items = e.clipboardData.items || [];
            for (let i = 0; i < items.length; i++) {
                try {
                    if (items[i].kind !== 'file' || !items[i].getAsFile) continue;
                    
                    const blob = items[i].getAsFile();
                    if (!blob) {
                        console.warn('Invalid clipboard file');
                        continue;
                    }

                    const mimeType = blob.type;
                    const supportedTypes = [
                        'image/',
                        'application/pdf',
                        'application/vnd.openxmlformats',
                        'application/vnd.ms-excel'
                    ];

                    if (!supportedTypes.some(type => mimeType.startsWith(type))) {
                        alert(`Formato no soportado: ${mimeType.split('/')[1]}`);
                        return;
                    }

                    const ext = mimeToExt[mimeType] || mimeType.split('/')[1].split(';')[0];
                    const fileName = `archivo-${Date.now()}.${ext}`;
                    const file = new File([blob], fileName, { type: mimeType });
                    
                    setNameFile(file.name);
                    setToUpload(file);
                    fileUpload(file);
                } catch (error) {
                    console.error('Error processing pasted file:', error);
                    alert('Error al procesar archivo del portapapeles');
                }
            }
        };

        document.addEventListener('paste', handlePaste, { passive: true });
        return () => document.removeEventListener('paste', handlePaste);
    }, []);

    const fileUpload = file => {
        const maxFileSize = 20 * 1024 * 1024;
        const supportedTypes = [
            'image/',
            'application/pdf',
            'application/vnd.openxmlformats',
            'application/vnd.ms-excel'
        ];

        if (!supportedTypes.some(type => file.type.startsWith(type))) {
            alert(`Tipo de archivo no soportado: ${file.type.split('/')[1]}`);
            return;
        }

        if (file.size > maxFileSize) {
            alert("El archivo es demasiado grande. Máximo 20MB");
            return;
        }

        setOnUpload(true);
        setContentShow(null);
        setShowModal(true);
        
        const url = process.env.REACT_APP_CENTRALITA + '/sendFile/' + channel + '/' + folio;
        const formData = new FormData();
        formData.append("file", file);

        setOnPushFile(true);
        post(url, formData, {
            headers: { "Content-type": "multipart/form-data" }
        }).then((data) => {
            setToUpload(null);
            setOnPushFile(false);
            setNameFileSend(data.data.file.originalFilename);
            setUrlFile(data.data.url);
            
            const [fileType] = data.data.file.mimetype.split('/');
            setUrlFileType(fileType === 'image' ? fileType : 'document');

            setContentShow(
                fileType === 'image' 
                    ? <Image centered size='medium' src={data.data.url} />
                    : <a href={data.data.url} target="_blank" rel="noopener noreferrer">
                        <Icon name='file' /> {data.data.file.originalFilename}
                      </a>
            );
        }).catch(error => {
            console.error('Upload error:', error);
            alert('Error al subir archivo');
            setOnPushFile(false);
            setShowModal(false);
        });
    };

    return (
        <>
            <Dropzone maxFiles={2} onDrop={acceptedFiles => {
                setNameFile(acceptedFiles[0].name);
                setToUpload(acceptedFiles[0]);
                fileUpload(acceptedFiles[0]);
            }}>
                {({getRootProps, getInputProps}) => (
                    <div {...getRootProps()} className='dnd'>
                        <input {...getInputProps()} />
                        <a className="camera icon">Arrastra archivo o haz clic</a>
                    </div>
                )}
            </Dropzone>

            <Modal
                basic
                open={showModal}
                size='small'
                onClose={() => setShowModal(false)}
            >
                <Header icon>
                    <Icon name={onPushFile ? 'cloud upload' : 'archive'} />
                    {onPushFile ? 'Subiendo archivo...' : `Enviar "${nameFileSend}"?`}
                </Header>
                <Modal.Content>
                    <Message style={{minHeight: 100}}>
                        {onPushFile && <Dimmer active inverted>
                            <Loader inverted>Procesando archivo</Loader>
                        </Dimmer>}
                        {contentShow}
                    </Message>
                </Modal.Content>
                <Modal.Actions>
                    <Button basic color='red' inverted 
                        onClick={() => {
                            setShowModal(false);
                            setOnUpload(false);
                            setNameFile('Archivo');
                        }}
                        disabled={onPushFile}
                    >
                        <Icon name='remove' /> Cancelar
                    </Button>
                    <Button color='blue' inverted 
                        onClick={() => {
                            setOnPushFile(true);
                            const urlFixed = urlFile.startsWith('http') 
                                ? urlFile 
                                : `https://${urlFile}`;
                            
                            socket.connection.emit('sendMessage', {
                                token: localStorage.getItem('sdToken'),
                                folio,
                                message: urlFixed,
                                caption: nameFile,
                                class: urlFileType
                            }, (result) => {
                                const index = listFolios.current.findIndex(x => x.folio._id === folio);
                                listFolios.current[index].folio.message.push(result.body.lastMessage);
                                setRefresh(Math.random());
                                setShowModal(false);
                                setOnUpload(false);
                                setToUpload(null);
                                setNameFile(null);
                                setContentShow(null);
                                setNameFileSend(null);
                                setUrlFile(null);
                                setUrlFileType(null);
                                setOnPushFile(false);
                            });
                        }}
                        disabled={onPushFile}
                    >
                        <Icon name='checkmark' /> Enviar
                    </Button>
                </Modal.Actions>
            </Modal>
        </>
    );
};

export default UploadFile;