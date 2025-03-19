import React, {useRef, useState, useContext, useCallback, useEffect} from 'react';
import { Icon, Loader, Button, Image, Modal, Header, Message, Dimmer } from 'semantic-ui-react';
import axios, {post} from 'axios';
import SocketContext from './../../../controladores/SocketContext';
import ListFoliosContext from '../../../controladores/FoliosContext';
import Dropzone  from 'react-dropzone';


const InternalUploadFile = ({sendFile}) => {
    
    const [onPushFile, setOnPushFile] = useState(false);
    
    const [contentShow, setContentShow] = useState(null);
    const [nameFileSend, setNameFileSend ] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const [urlFile, setUrlFile ] = useState(null);
    const [urlFileType, setUrlFileType ] = useState(null);

    useEffect(() => {
        const mimeToExt = {
            'image/png': 'png',
            'image/jpeg': 'jpg',
            'application/pdf': 'pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
            'application/vnd.ms-excel': 'xls',
            'text/plain': 'txt',
            'application/zip': 'zip',
            'application/x-zip-compressed': 'zip',
            'application/msword': 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
        };

        const handlePaste = (e) => {
            if (!e.clipboardData) return;
            
            const items = e.clipboardData.items || [];
            for (let i = 0; i < items.length; i++) {
                try {
                    if (items[i].kind !== 'file' || !items[i].getAsFile()) continue;
                    
                    const blob = items[i].getAsFile();
                    const mimeType = blob.type;
                    const supportedTypes = [
                        'image/',
                        'application/pdf',
                        'application/vnd.openxmlformats',
                        'application/vnd.ms-excel',
                        'text/plain',
                        'application/zip',
                        'application/x-zip-compressed',
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml'
                    ];

                    if (!supportedTypes.some(type => mimeType.startsWith(type))) {
                        alert(`Formato no soportado: ${mimeType.split('/')[1]}`);
                        return;
                    }

                    if (blob.size > 20 * 1024 * 1024) {
                        alert("El archivo es demasiado grande. Máximo 20MB");
                        return;
                    }

                    const ext = mimeToExt[mimeType] || mimeType.split('/')[1];
                    const file = new File([blob], `archivo-${Date.now()}.${ext}`, { type: mimeType });
                    fileUpload(file);
                } catch (error) {
                    console.error('Error processing pasted file:', error);
                    alert('Error al procesar archivo del portapapeles');
                }
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, []);

    const fileUpload = file => {
        
        setContentShow(null);
        setShowModal(true);
        const url = process.env.REACT_APP_CENTRALITA+'/sendFile/interlchat/file';
        const formData = new FormData();
        formData.append("file", file);
        
        const config = {
          headers: {
            "Content-type": "multipart/form-data"
          }
        };
        setOnPushFile(true);
        return post(url, formData, config).then((data) => {
            
            setOnPushFile(false);
            setNameFileSend(data.data.file.originalFilename)
            setUrlFile(data.data.url);
            let classFile = data.data.file.mimetype.split('/');
            

            if(classFile[0] === 'image'){
                setUrlFileType(classFile[0]);
            }else{
                setUrlFileType('document');
            }

            if(classFile[0] === 'image'){
                setContentShow(<Image centered size='medium' src={data.data.url}/>)
            }else{
                setContentShow(<a color='blue'target='blank' href={data.data.url}><Icon name='folder open'></Icon>{data.data.file.originalFilename}</a>)
            }
            
            // setShowModal(true)

            
        });
    };
    return (<>
        <Dropzone maxFiles={1} onDrop={acceptedFiles => {
            //console.log(acceptedFiles);
            
            fileUpload(acceptedFiles[0]);
        }} >
        {({getRootProps, getInputProps}) => (
            
            <div {...getRootProps()} className='dndInternalChat' style={{ display: 'flex', justifyContent: 'center', alignItems: 'left' }}>
            <input {...getInputProps()} />
            <Icon name='attach' />
            </div>
            
        )}
        </Dropzone>

        <Modal
        basic
        open={showModal}
        size='small'
        >
            <Header icon>
                <Icon name={onPushFile ? 'cloud upload' : 'archive'} />
                {onPushFile ? 'Cargando Archivo...' : '¿Quiere enviar el archivo "'+nameFileSend+'"?' }
            </Header>
            <Modal.Content>
                <Message style={{minHeight : 100}}>
                {onPushFile && <Dimmer active inverted>
                    <Loader inverted>Cargando Archivo</Loader>
                </Dimmer>}
                {contentShow}
                </Message>
            </Modal.Content>
            <Modal.Actions>
                <Button basic color='red' inverted onClick={() => {setShowModal(false);}} loading={onPushFile} disabled={onPushFile}>
                <Icon name='remove' /> No
                </Button>
                <Button color='blue' inverted onClick={() => {
                    let urlFixed = urlFile.startsWith('http') ? urlFile : 'https://'+urlFile;
                    //console.log(urlFixed, urlFileType);
                    sendFile({
                        url : urlFixed,
                        typeFile : urlFileType
                    });
                    setShowModal(false);
                }} loading={onPushFile} disabled={onPushFile}>
                <Icon name='checkmark'  /> Enviar
                </Button>
            </Modal.Actions>
        </Modal>
        
    </>);
}
 
export default InternalUploadFile;