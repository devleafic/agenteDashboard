import React, {useEffect, useContext, useState} from 'react';
import { Container, Table, Label, Header, Icon, Button, Segment, Dimmer, Image, Loader, Modal, Message } from 'semantic-ui-react';
import SocketContext from '../../../controladores/SocketContext';
import { toast } from 'react-toastify';
import moment from 'moment';

import shortParagraph from './../../../img/short-paragraph.png';
import MessageBubble from './MessageBubble';

const Inbox = ({selectedComponent, setUnReadMessages, vFolio, setVFolio}) => {
    const socketC = useContext(SocketContext);
    const [inboxes, setInboxes ] = useState([]);
    const [isLoadInbox, setIsLoadInbox ] = useState(false);

    const [isLoadInboxFolio, setIsLoadInboxFolio ] = useState({});

    //preview modal 
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

    const initLoadModal = () => { //reset values for Modal 
        setOpenModal(!openModal)
        setContentMessage(<Segment>
            <Dimmer active inverted>
                <Loader inverted>Cargando</Loader>
            </Dimmer>

            <Image src={shortParagraph} />
        </Segment>)
    }

    useEffect ( () => {
        const loadInbox = async () => {
            setIsLoadInbox(true);
            //setInboxes([]);
            socketC.connection.emit('loadInbox', {
                token : window.localStorage.getItem('sdToken')
            },(data) => {
                
                setIsLoadInbox(false);
                setInboxes(data.inboxes);
                
                let hasUnread = data.inboxes.find((x) => {
                    return x.status === 1 ? true : false;
                });

                const folioList = {};
                data.inboxes.map((x) => {
                    folioList[x.folio._id] = false;
                    return x.folio._id;
                });
                setIsLoadInboxFolio(folioList);
                setUnReadMessages(hasUnread?true:false);
            });
        }
        //return
         loadInbox();
    }, []);

    const openItemInbox = (folio, item) => {
        console.time('openItemInbox');
        //setIsLoadInboxFolio(true)
        socketC.connection.emit('openItemInbox', {
            token : window.localStorage.getItem('sdToken'),
            folio : folio,
            item
        },(data) => {
            setVFolio(folio._id)
            toast.success(<label>Se abrió el folio <b>#{folio._id}</b></label>);
            //setIsLoadInboxFolio(false);
            if(!data.success){
                toast.error(data.message);
                return false;
            }
            selectedComponent('home')
            console.timeEnd('openItemInbox')
        });
    }
    const getFolioMessages = (folio) => {
        setTitleModal('Vista Previa #'+folio)
        setOpenModal(!openModal);

        socketC.connection.emit('getMessageHist', {folio}, (res) => {
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
    return ( <div style={{margin : 40}}>
        <Message
            attached
            icon="inbox"
            header='Inbox'
            content='Selecciona uno contacto para continuar con la conversación.'
        />
        <Table singleLine color='blue'>
            <Table.Header className='showHeader'>
                <Table.Row >
                    <Table.HeaderCell>Folio</Table.HeaderCell>
                    {/*<Table.HeaderCell>Item</Table.HeaderCell> */}
                    <Table.HeaderCell>Identificador</Table.HeaderCell>
                    <Table.HeaderCell>AliasId</Table.HeaderCell>
                    <Table.HeaderCell>Canal</Table.HeaderCell>
                    <Table.HeaderCell>Bandeja</Table.HeaderCell>
                    <Table.HeaderCell>Transferido Por</Table.HeaderCell>
                    <Table.HeaderCell>Última actual...</Table.HeaderCell>                    
                    <Table.HeaderCell></Table.HeaderCell>
                    <Table.HeaderCell></Table.HeaderCell>                    
                </Table.Row>
            </Table.Header>

            <Table.Body>
                {
                    isLoadInbox && (
                        <Table.Row warning={true}>
                            <Table.Cell collapsing={true} colSpan={6}>
                                <Icon name='spinner' loading/>
                                Cargando . . .
                            </Table.Cell>
                        </Table.Row>
                    )
                }
                {
                    !isLoadInbox && inboxes.length === 0 && (
                        <Table.Row warning={true}>
                            <Table.Cell collapsing={true} colSpan={6}>
                                <Icon name='mail outline'/>
                                No hay mensajes guardados
                            </Table.Cell>
                        </Table.Row>
                    )
                }
                {
                    inboxes.filter((x) => {
                        return x.status === 3 || x.folio?.status === 3 || x.folio?.fromPipeline == true ? false : true  
                    }).map((x) => {
                        return (
                            <Table.Row key={x._id}>
                                <Table.Cell><b className='showLabel'>Folio </b>{x.status === 1 && (<Icon name='circle' color='red'/>)} {x.folio?._id}</Table.Cell>
                               {/* <Table.Cell><b className='showLabel'>Item </b>{x.item}</Table.Cell> */}
                                <Table.Cell><b className='showLabel'>Identificador </b>{x.anchor}</Table.Cell>
                                <Table.Cell><b className='showLabel'>Alias </b>{x.aliasUser ? x.aliasUser : "Sin alias"}</Table.Cell>
                                <Table.Cell><b className='showLabel'>Canal </b>{x.channel}</Table.Cell>
                                <Table.Cell><b className='showLabel'>Bandeja </b>{x.queue}</Table.Cell>
                                <Table.Cell><b className='showLabel'>Transferido Por</b>{x.userFromName && x.transferDate? x.userFromName + ' - ' + x.transferDate : "N/A"}</Table.Cell>
                                <Table.Cell><b className='showLabel'>Última actual..</b>{moment(x.folio.updatedAt).fromNow()}</Table.Cell>
                                <Table.Cell textAlign='right'>
                                    {
                                        x.folio?.status === 3 ? (<label>Folio finalizado</label>) : (<>
                                            <Button circular color='facebook' icon='folder open outline' onClick={() => {
                                                openItemInbox(x.folio, x);
                                                setUnReadMessages(false)
                                                setIsLoadInboxFolio({...isLoadInboxFolio, [x.folio._id] : true});
                                            }} loading={isLoadInboxFolio[x.folio._id]} disabled={isLoadInboxFolio[x.folio._id]}></Button>
                                        </>)
                                    }
                                    
                                </Table.Cell>
                                <Table.Cell textAlign='right' key={'hs-'+x.folio._id} >
                                    {
                                            <Button  key={'hs-'+x.folio._id} href='#' circular color='facebook' icon='eye' onClick={() => {
                                                getFolioMessages(x.folio._id)
                                            }} ></Button>
                                    }
                                </Table.Cell>                               
                            </Table.Row>
                        )
                    })
                }
            </Table.Body>
        </Table>
        <Modal
            onClose={() => initLoadModal()}
            open={openModal}
            header={titleModal}
            scrolling
            content={contentMessage}
            actions={[{ key: 'Aceptar', content: 'Aceptar', positive: true, onClick: ()=> {initLoadModal()}}]}
            />  
    </div> );




}
 
export default Inbox;