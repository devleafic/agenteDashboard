import React, {useState, useContext} from 'react';
import {List, Image, Icon, Loader, Modal, Segment, Dimmer } from 'semantic-ui-react';
import moment from 'moment';
import SocketContext from './../../../controladores/SocketContext';
import shortParagraph from './../../../img/short-paragraph.png';
import MessageBubble from './MessageBubble';

const HistoryFolios = ({historyFolios}) => {

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

    const getFolioMessages = (folio) => {
        setTitleModal('Historial de Folio #'+folio)
        setOpenModal(!openModal);

        socket.connection.emit('getMessageHist', {folio}, (res) => {
            if(res.success){
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
                )
            }else{

            }
        })
    }

    return (<>
        <div style={{maxheight:250, overflowY:'scroll'}}>
            <List bulleted>
                {
                    historyFolios.map((item) => {
                        return (<List.Item key={'hs-'+item._id} href='#' onClick={(e) => {getFolioMessages(item._id);}} title={item.createdAt}>#{item._id}</List.Item>);
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
 
export default HistoryFolios;