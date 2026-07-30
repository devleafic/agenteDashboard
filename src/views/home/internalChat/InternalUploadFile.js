import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Spinner, Image, Card, CardBody } from '@heroui/react';
import { Upload, X, Check, Paperclip, Folder } from 'lucide-react';
import axios, { post } from 'axios';
import Dropzone from 'react-dropzone';


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
                setContentShow(
                    <a 
                        href={data.data.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                        <Folder className="w-5 h-5" />
                        {data.data.file.originalFilename}
                    </a>
                )
            }
            
            // setShowModal(true)

            
        });
    };
    return (
        <div className="relative">
            <Dropzone maxFiles={1} onDrop={acceptedFiles => { fileUpload(acceptedFiles[0]); }} noClick>
                {({ getRootProps, getInputProps, open }) => (
                    <div {...getRootProps()}>
                        <input {...getInputProps()} />
                        <button
                            type="button"
                            onClick={open}
                            className="flex items-center justify-center w-10 h-10 text-gray-500 dark:text-gray-400 hover:text-flame-ember transition-colors duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700"
                            aria-label="Adjuntar archivo"
                        >
                            <Paperclip className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </Dropzone>

            <Modal isOpen={showModal} onClose={() => !onPushFile && setShowModal(false)}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    {onPushFile ? (
                                        <Upload className="w-5 h-5 text-blue-500" />
                                    ) : (
                                        <Paperclip className="w-5 h-5 text-blue-500" />
                                    )}
                                    {onPushFile ? 'Cargando Archivo...' : `¿Quiere enviar el archivo "${nameFileSend}"?`}
                                </div>
                            </ModalHeader>
                            <ModalBody>
                                <div className="min-h-[200px] flex items-center justify-center relative">
                                    {onPushFile ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-lg">
                                            <Spinner size="lg" />
                                            <span className="ml-2">Cargando archivo...</span>
                                        </div>
                                    ) : (
                                        <div className="w-full">
                                            {contentShow}
                                        </div>
                                    )}
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button 
                                    color="danger" 
                                    variant="light" 
                                    onPress={onClose}
                                    isDisabled={onPushFile}
                                    startContent={<X className="w-4 h-4" />}
                                >
                                    Cancelar
                                </Button>
                                <Button 
                                    color="primary" 
                                    onPress={() => {
                                        let urlFixed = urlFile.startsWith('http') ? urlFile : 'https://'+urlFile;
                                        sendFile({
                                            url: urlFixed,
                                            typeFile: urlFileType
                                        });
                                        onClose();
                                    }}
                                    isDisabled={onPushFile}
                                    startContent={<Check className="w-4 h-4" />}
                                >
                                    Enviar
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
 
export default InternalUploadFile;