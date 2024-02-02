import React, {useEffect, useContext, useState} from 'react';
import { Container, Table, Label, Header, Icon, Button, Segment, Dimmer, Image, Loader, Modal, Message, Card, CardGroup, CardContent, CardHeader, CardMeta, CardDescription } from 'semantic-ui-react';
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


    const sortInboxes = (inb) => {
        let tmpSort = {};
        inb.map((x) => {
            if(!tmpSort[x.pipelineStage]){
                tmpSort[x.pipelineStage] = [];
            }
            tmpSort[x.pipelineStage].push(x);
            return x;
        });

        return tmpSort;
    }

    const cardPipeline = (pipe, list) => {
        
        return <Card key={`card-${pipe._id}`} style={{padding:10, border : `solid 3px ${pipe.color}`}}>
            <div
                style={{
                    textAlign : 'center',
                    fontSize : 18,
                    padding : 10,
                }}
            >{pipe.name}</div>
            {
                list.map((x) => {
                    return <Card key={x._id} >
                    <CardContent>
                      <CardHeader>{x.aliasUser}</CardHeader>
                      <CardMeta>{x.folio._id}</CardMeta>
                      <CardDescription>{x.anchor}</CardDescription>
                        <div style={{width : 80, margin : '10px auto 0px auto'}}>
                        {
                            x.folio?.status === 3 ? (<label>Folio finalizado</label>) : (<>
                                <Button circular color='facebook' icon='folder open outline' onClick={() => {
                                    openItemInbox(x.folio, x);
                                    setUnReadMessages(false)
                                    setIsLoadInboxFolio({...isLoadInboxFolio, [x.folio._id] : true});
                                }} loading={isLoadInboxFolio[x.folio._id]} disabled={isLoadInboxFolio[x.folio._id]}></Button>
                            </>)
                        }
                        {
                                <Button  key={'hs-'+x.folio._id} href='#' circular color='facebook' icon='eye' onClick={() => {
                                    getFolioMessages(x.folio._id)
                                }} ></Button>
                        }
                        </div>
                    </CardContent>
                  </Card>
                })
            }
        </Card>
    }

    useEffect ( () => {
        const loadInbox = async () => {
            setIsLoadInbox(true);
            //setInboxes([]);
            socketC.connection.emit('loadInbox', {
                token : window.localStorage.getItem('sdToken')
            },(data) => {
                
                setIsLoadInbox(false);
                let sortedInb = sortInboxes(data.inboxes);
                
                setInboxes(sortedInb);
                
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

    

    return ( <div style={{padding : 40, overflow: 'auto', height:'calc(100vh - 10px)', background:'#dde1e7'}}>
        <Message
            attached
            icon="inbox"
            header='Pipeline de conversaciones'
            content='Selecciona uno contacto para continuar con la conversación.'
        />
        {
            isLoadInbox && (
                <div>
                    <Icon name='spinner' loading/>
                    Cargando . . .
                </div>
            )
        }
        <div style={{
            marginTop : 20,
        }}>
            <CardGroup style={{height : '100%',
            overflow : 'auto'}}>
            {
                Object.keys(inboxes).map((x) => {
                    
                    let pipelineId = inboxes[x][0].pipeline;
                    let infoPipe = inboxes[x][0].service.pipelines.find((y) => {
                        return pipelineId === y._id
                    });
                    let infoStage = infoPipe.pipelines.find((y) => {
                        return x === y._id
                    })
                    return cardPipeline(infoStage, inboxes[x]);
                })
            }
            </CardGroup>
        </div>
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