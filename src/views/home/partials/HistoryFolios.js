import React, {useState, useContext} from 'react';
import {List, Image, Icon, Loader, Modal, Segment, Dimmer } from 'semantic-ui-react';
import moment from 'moment';
import SocketContext from './../../../controladores/SocketContext';
import shortParagraph from './../../../img/short-paragraph.png';
import MessageBubble from './MessageBubble';
import MessageBubbleEmail from './MessageBubbleEmail';

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
                if (res.folio.typeFolio === '_EMAIL_'){
                    setContentMessage(
                        <div className='imessage'>
                            {
                                res.folio.message.map((msg) => {
                                    return (
                                        <MessageBubbleEmail key={msg._id} message={msg}/>
                                    );
                                })
                            }
                        </div> 
                    )
                } else {    
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
                )}
            }else{

            }
        })
    }

    return (<>
        <div style={{height:250, overflowY:'scroll'}}>
            <List >
                {
                    historyFolios.map((item) => {
                        return (
                            <List.Item 
                                key={'hs-'+item._id} 
                                href='#' 
                                onClick={(e) => {getFolioMessages(item._id);}} 
                                title={item.createdAt}
                            >
                                <List.Content>
                                    <List.Header>#{item._id}</List.Header>
                                    <List.Description>
                                        <Icon name='clock outline' />
                                        {moment(item.createdAt).utcOffset('-06:00').format('DD/MM/YYYY HH:mm')}
                                    </List.Description>
                                </List.Content>
                            </List.Item>
                        );
                    })
                }
            </List>
        </div>
        <Modal
            open={openModal}
            header={titleModal}
            size='fullscreen'
            scrolling
            content={contentMessage}
            actions={[{ key: 'Aceptar', content: 'Aceptar', positive: true, onClick: ()=> { setOpenModal(!openModal);} }]}
            />
    </>);
}
 
export default HistoryFolios;