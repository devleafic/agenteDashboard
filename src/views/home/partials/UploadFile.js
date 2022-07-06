import React, {useRef, useState, useContext, useCallback} from 'react';
import { Icon, Button, Image, Modal, Header, Message } from 'semantic-ui-react';
import axios, {post} from 'axios';
import SocketContext from './../../../controladores/SocketContext';
import ListFoliosContext from '../../../controladores/FoliosContext';
import Dropzone  from 'react-dropzone';


const UploadFile = ({folio, channel, setRefresh}) => {

    const listFolios = useContext(ListFoliosContext);
    const socket = useContext(SocketContext);

    
    const [onPushFile, setOnPushFile] = useState(false);
    const fileInputRef = useRef();
    const [toUpload, setToUpload] = useState(null);
    const [onUpload, setOnUpload] = useState(false);
    const [nameFile, setNameFile] = useState(null);
    const [contentShow, setContentShow] = useState(null);
    const [nameFileSend, setNameFileSend ] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const [urlFile, setUrlFile ] = useState(null);
    const [urlFileType, setUrlFileType ] = useState(null);

    const fileChange = e => {
        if(!e.target.files[0]){
            return false;
        }

        setNameFile(e.target.files[0].name);
        setToUpload(e.target.files[0])
        fileUpload(e.target.files[0]);
    };

    const sendFileMessage = () => {
        setOnPushFile(true);
        socket.connection.emit('sendMessage', {
            token : window.localStorage.getItem('sdToken'),
            folio : folio,
            message : urlFile,
            caption : nameFile,
            class : urlFileType
        }, (result) => {
            let index = listFolios.current.findIndex((x) => {return x.folio._id === folio});
            listFolios.current[index].folio.message.push(result.body.lastMessage);
            setShowModal(false);
            setRefresh(Math.random());
            setOnUpload(false);
            setToUpload(null);
            setNameFile(null);
            setContentShow(null);
            setNameFileSend(null);
            setUrlFile(null);
            setUrlFileType(null);
            setOnPushFile(false);
        });
    }
    

    const fileUpload = file => {
        setOnUpload(true);
        const url = process.env.REACT_APP_CENTRALITA+'/sendFile/'+channel+'/'+folio;
        const formData = new FormData();
        formData.append("file", file);
        
        const config = {
          headers: {
            "Content-type": "multipart/form-data"
          }
        };
        
        return post(url, formData, config).then((data) => {
            
            setToUpload(null)
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
            
            setShowModal(true)

            
        });
    };
    return (<>
        <Dropzone maxFiles={2} onDrop={acceptedFiles => {
            console.log(acceptedFiles);
            setNameFile(acceptedFiles[0].name);
            setToUpload(acceptedFiles[0])
            fileUpload(acceptedFiles[0]);
        }} >
        {({getRootProps, getInputProps}) => (
            
            <div {...getRootProps()} className='dnd'>
                <input {...getInputProps()} />
                <p>Clic o arrastra tu archivo a enviar.</p>
            </div>
            
        )}
        </Dropzone>
        {/* <Button
            content={nameFile ? nameFile : 'Archivo'}
            labelPosition="left"
            icon="file"
            disabled={onUpload}
            loading={onUpload}
            onClick={() => fileInputRef.current.click()}
        />
        <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={fileChange}
            multiple={false}
        /> */}

        <Modal
        basic
        //onClose={() => setOpen(false)}
        //onOpen={() => setOpen(true)}
        open={showModal}
        size='small'
        >
            <Header icon>
                <Icon name='archive' />
                ¿Quiere enviar el archivo "{nameFileSend}" ?
            </Header>
            <Modal.Content>
                <Message>
                {contentShow}
                </Message>
            </Modal.Content>
            <Modal.Actions>
                <Button basic color='red' inverted onClick={() => {setShowModal(false); setOnUpload(false); setNameFile('Archivo')}} loading={onPushFile} disabled={onPushFile}>
                <Icon name='remove' /> No
                </Button>
                <Button color='blue' inverted onClick={sendFileMessage} loading={onPushFile} disabled={onPushFile}>
                <Icon name='checkmark'  /> Enviar
                </Button>
            </Modal.Actions>
        </Modal>
        
    </>);
}
 
export default UploadFile;