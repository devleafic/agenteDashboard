import React, {useState, useContext} from 'react';
import {List, Image, Icon, Loader, Modal, Segment, Dimmer,Label } from 'semantic-ui-react';
import moment from 'moment';
import SocketContext from './../../../controladores/SocketContext';
import shortParagraph from './../../../img/short-paragraph.png';
import MessageBubble from './MessageBubble';

const Mtm = ({mtm}) => {

    const [openModal, setOpenModal] = useState(false);
    const [titleModal, setTitleModal ] = useState('');
    const [contentMessage, setContentMessage] = useState(
        <Segment>
            <Dimmer active inverted>
                <Loader inverted>Cargando</Loader>
            </Dimmer>

            <Image src={shortParagraph} />
        </Segment>
    );
    const socket = useContext(SocketContext);

    const getMtm = (mtm) => {
        setTitleModal('Plantillas de mensajes')
        setOpenModal(!openModal);

        socket.connection.emit('getMtmDetail', {mtm}, (res) => {
            if(res.success){
                setContentMessage(
                    <div className='imessage'>
                        {
               
                   
                            <Label as='a' color='blue' tag>{res.mtm.previewtxt}</Label>
                            
                  
                        }
                    </div> 
                )
            }else{
                {
                    res.map((mtm) => {
                        return (
                            <Label as='a' color='red' tag>{res.mtm.message}</Label>
                        );
                    })
                }
            }
        })
    }

   return (<>
        <div style={{height:250, overflowY:'scroll'}}>
            <List >
                {
                    mtm.map((item) => {
                        return (<List.Item key={'mtm-'+item._id} href='#' onClick={(e) => {getMtm(item._id);}} title={item.name}>{item.name}</List.Item>);
                    })
                }
            </List>
        </div>
        <Modal
            open={openModal}
            header={titleModal}
            scrolling
            content={contentMessage}
            actions={[{ key: 'Aceptar', content: 'Aceptar', positive: true, onClick: ()=> { setOpenModal(!openModal);} }]}
            />
    </>);
}
 
export default Mtm;