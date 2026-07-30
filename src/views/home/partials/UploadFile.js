import React, { useRef, useState, useContext, useCallback, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Image, Spinner } from '@heroui/react';
import { Upload, X, Check, File as FileIcon, Image as ImageIcon } from 'lucide-react';
import axios, { post } from 'axios';
import SocketContext from './../../../controladores/SocketContext';
import ListFoliosContext from '../../../controladores/FoliosContext';
import { useDropzone } from 'react-dropzone';

const UploadFile = ({folio, channel, setRefresh, children}) => {
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
            'application/vnd.ms-excel': 'xls',
            'video/quicktime': 'mov',
            'video/x-msvideo': 'avi'
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
                        'video/',
                        'application/pdf',
                        'application/vnd.openxmlformats',
                        'application/vnd.ms-excel',
                        'video/quicktime',
                        'video/x-msvideo'
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
            'video/',
            'application/pdf',
            'application/vnd.openxmlformats',
            'application/vnd.ms-excel',
            'video/quicktime',
            'video/x-msvideo'
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
                    ? (
                        <div className="flex justify-center p-2">
                            <Image 
                                src={data.data.url} 
                                alt="Preview"
                                className="max-h-48 rounded-lg object-contain"
                            />
                        </div>
                    ) : (
                        <a 
                            href={data.data.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 rounded-lg border border-hair hover:bg-cream-100 transition-colors"
                        >
                            <FileIcon className="text-info flex-shrink-0" />
                            <span className="truncate">{data.data.file.originalFilename}</span>
                        </a>
                    )
            );
        }).catch(error => {
            console.error('Upload error:', error);
            alert('Error al subir archivo');
            setOnPushFile(false);
            setShowModal(false);
        });
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        maxFiles: 2,
        onDrop: acceptedFiles => {
            setNameFile(acceptedFiles[0].name);
            setToUpload(acceptedFiles[0]);
            fileUpload(acceptedFiles[0]);
        }
    });

    return (
        <>
            {/* En el composer esto convive con el boton de enviar, asi que ocupa
                los mismos 40px y lleva un solo hairline punteado en vez del recuadro
                de 2px que flotaba suelto en la esquina. */}
            <div
                {...getRootProps()}
                className={`w-10 h-10 flex items-center justify-center border border-dashed cursor-pointer transition-colors ${
                    isDragActive ? 'border-flame-ember bg-cream-200' : 'border-hair hover:border-flame-ember'
                }`}
            >
                <input {...getInputProps()} />
                {children ? (
                    children
                ) : (
                    <Upload className="w-4 h-4 text-ink-500" />
                )}
            </div>

            <Modal 
                isOpen={showModal} 
                onOpenChange={setShowModal}
                size="md"
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            {onPushFile ? (
                                <Upload className="text-info" />
                            ) : (
                                <FileIcon className="text-info" />
                            )}
                            <span>{onPushFile ? 'Subiendo archivo...' : `Enviar "${nameFileSend}"`}</span>
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        <div className="relative min-h-[120px] flex items-center justify-center rounded-lg border border-hair p-4">
                            {onPushFile ? (
                                <div className="flex flex-col items-center justify-center space-y-4">
                                    <Spinner size="lg" />
                                    <p className="text-sm text-ink-600">Procesando archivo...</p>
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
                            onPress={() => {
                                setShowModal(false);
                                setOnUpload(false);
                                setNameFile('Archivo');
                            }}
                            isDisabled={onPushFile}
                            startContent={<X />}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            color="primary"
                            onPress={() => {
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
                            isDisabled={onPushFile}
                            startContent={<Check />}
                        >
                            Enviar
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default UploadFile;