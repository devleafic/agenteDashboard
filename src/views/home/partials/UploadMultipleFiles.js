import React, {useRef, useState, useContext, useEffect} from 'react';
import { Icon, Loader, Button, Image, Modal, Header, Message, Dimmer, Popup } from 'semantic-ui-react';
import axios, {post} from 'axios';
import SocketContext from './../../../controladores/SocketContext';
import ListFoliosContext from '../../../controladores/FoliosContext';
import Dropzone  from 'react-dropzone';


const UploadMultipleFiles = ({folio, channel, onChange}) => {

    useEffect(() => {
        const handleBeforeUnload = (event) => {
          const message = '¿Estás seguro de que deseas abandonar el sitio?';
          event.returnValue = message; 
          return message;
        };
    
        window.addEventListener('beforeunload', handleBeforeUnload);
    
        return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
        };
      }, [])

    const [onUpload, setOnUpload] = useState(false);
    // Multiples archivos
    const [readyFiles, setReadyFiles] = useState([]);
    

    const filesUpload = async (files) => {
        // ponemos en true el onUpload para que se muestre el loader
        setOnUpload(true);
        const url = process.env.REACT_APP_CENTRALITA+'/sendFile/'+channel+'/'+folio;
        const newFiles = [];

        // Iteramos los archivos para subirlos
        for(let i = 0; i < files.length; i++){
            let formData = new FormData();
            formData.append("file", files[i]);
            
            let {data} = await axios.post(url, formData, {headers: {"Content-type": "multipart/form-data"}});
            newFiles.push(data);
        };

        // nuevos archivos agregados
        return newFiles;
    }


    useEffect(() => {
        onChange(readyFiles);
    }, [readyFiles]);

    return (<div>
        <Dropzone onDrop={async (acceptedFiles) => {
            const currentFiles = readyFiles;
            const addFiles = await filesUpload(acceptedFiles);
            setReadyFiles([...currentFiles, ...addFiles]);
            setOnUpload(false);
        }} >
        {({getRootProps, getInputProps}) => (
            <div>
                <div {...getRootProps()} className='dnd' style={{ marginRight: 10 }}>
                    <input {...getInputProps()} />
                    {onUpload ? <div class="spinner"></div> : <a className="camera icon">Arrastra un archivo o Clic</a>}
                </div>
                <div className="readyFilesContainer" style={{
                display: 'flex',
                overflowX: 'auto',
                }}>
                {readyFiles.map((file, index) => (
                    <Popup key={`fileUpload-${index}-${file.file.originalFilename}`} content={file.file.originalFilename} trigger={
                        <div key={index} className='cardFileContainer' style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: 10,
                            border: '1px solid black',
                            marginRight: 2,
                            backgroundColor: '#f5f5f5',
                            }}>
                            <a href={file.url} target='_blank'>
                                <div className='cardFile' style={{
                                width: 100,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                }}>
                                {file.file.originalFilename}
                                </div>
                            </a>
                            <div style={{ marginLeft: 'auto', backgroundColor: '#f9f9f9' }}>
                                <Button size='tiny' style={{ height: 22, padding: 5 }} onClick={() => {
                                 if(window.confirm(`¿Estás seguro de eliminar el archivo "${file.file.originalFilename}"? `)){
                                    const newFiles = readyFiles.filter((f, i) => i !== index);
                                    setReadyFiles(newFiles);
                                 }
                                }}>X</Button>
                            </div>
                            </div>
                    }/>
                ))}
                </div>
            </div>
          
        )}
        </Dropzone>
        
    </div>);
}
 
export default UploadMultipleFiles;