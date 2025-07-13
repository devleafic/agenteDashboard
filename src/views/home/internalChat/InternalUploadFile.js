import React, {useRef, useState, useContext, useCallback, useEffect} from 'react';
import { Icon, Loader, Image, Modal, Header, Message, Dimmer } from 'semantic-ui-react';
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
        <Dropzone maxFiles={1} onDrop={acceptedFiles => { fileUpload(acceptedFiles[0]); }} noClick>
        {({ getRootProps, getInputProps, open }) => (
            <div {...getRootProps()}>
                <input {...getInputProps()} />
                <button
                  type="button"
                  onClick={open}
                  className="flex items-center justify-center w-10 h-10 text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700"
                  aria-label="Adjuntar archivo"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                </button>
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
                <button 
                  type="button"
                  className="flex items-center justify-center w-10 h-10 text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700"
                  aria-label="Cancelar"
                  onClick={() => {setShowModal(false);}}
                  disabled={onPushFile}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <button 
                  type="button"
                  className="flex items-center justify-center w-10 h-10 text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700"
                  aria-label="Enviar"
                  onClick={() => {
                    let urlFixed = urlFile.startsWith('http') ? urlFile : 'https://'+urlFile;
                    sendFile({
                        url : urlFixed,
                        typeFile : urlFileType
                    });
                    setShowModal(false);
                  }}
                  disabled={onPushFile}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </button>
            </Modal.Actions>
        </Modal>
        
    </>);
}
 
export default InternalUploadFile;