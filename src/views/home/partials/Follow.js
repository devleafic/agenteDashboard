import React, {useEffect, useContext, useState} from 'react';
import { Container, Table, Label, Select, Icon, Button, Segment, Dimmer, Image, Loader, Modal, Message, Card, CardGroup, CardContent, CardHeader, CardMeta, CardDescription } from 'semantic-ui-react';
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
    const [openModalTransfer, setOpenModalTransfer] = useState(false);
    const [folioToTransfer, setFolioToTransfer] = useState(null);
    const [listPipeline, setListPipeline] = useState([]);
    const [destinyPipeline, setDestinyPipeline] = useState(null);

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

    const transferPipeline = (folio) => {
        setOpenModalTransfer(true);
        setFolioToTransfer(folio);
    }

    const sortInboxes = (inb, mapSort) => {
        let tmpSort = {};
        mapSort.forEach(x => {
            tmpSort[x._id] = []
        });
        inb.filter((x) => {
            return x.folio.fromPipeline === true;
        }).map((x) => {
            if(!tmpSort[x.pipelineStage]){
                tmpSort[x.pipelineStage] = [];
            }
            tmpSort[x.pipelineStage].push(x);
            return x;
        });

        return tmpSort;
    }

    const cardPipeline = (pipe, list) => {
        
        return <Card key={`card-${pipe._id}`} style={{ padding:10, border : `solid 4px ${pipe.color} `,  borderRadius: 15    }}>
            <div
                style={{
                    textAlign : 'center',
                    fontSize : 20,
                    padding : 10,
                }}
            >{pipe.name}</div>
            {
                list.map((x) => {
                    return <Card key={x._id} >
                    <CardContent >
                    <Image
                        floated='right'
                        size='mini'
                        src='https://react.semantic-ui.com/images/avatar/large/molly.png'
                    />
                      <CardHeader>{x.aliasUser}</CardHeader>
                      <CardMeta>Folio: {x.folio._id}</CardMeta>
                      <CardMeta>Ult. Mensaje: {moment(x.folio.updatedAt).fromNow()}</CardMeta>
                      <CardMeta>Tipo: {x.folio.typeFolio}</CardMeta>
                      <CardMeta>Canal: {x.channel}</CardMeta>
                      <CardDescription>ID: {x.anchor}</CardDescription>
                        <div style={{width : 120, margin : '10px auto 0px auto',}}>
                        {
                            x.folio?.status === 3 ? (<label>Folio finalizado</label>) : (<>
                                <Button circular color='facebook' icon='folder open outline' onClick={() => {
                                    openItemInbox(x.folio, x, pipe.name);
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
                        <Button  key={'ts-'+x.folio._id} href='#' circular color='facebook' icon='arrows alternate horizontal' onClick={() => {
                            transferPipeline(x)
                        }}></Button>
                        </div>
                    </CardContent>
                  </Card>
                })
            }
        </Card>
    }

    const loadInbox = async () => {
        setIsLoadInbox(true);
        //setInboxes([]);
        socketC.connection.emit('loadInbox', {
            token : window.localStorage.getItem('sdToken')
        },(data) => {
            if (data.success && data.inboxes && data.inboxes.length >= 0 ){

                const filteredArray = data.inboxes.filter(item => item.pipeline !== undefined);

                setIsLoadInbox(false);
                if (filteredArray.length <= 0){
                    setInboxes([]);
                    return false;
                }    
                let idPipe = filteredArray[0].pipeline//data.inboxes[0].pipeline;
                let mapSort =filteredArray[0].service.pipelines.find((x) => {
                    return x._id === idPipe
                });
                let sortedInb = sortInboxes(data.inboxes, mapSort.pipelines);
                
                setInboxes(sortedInb);
                
                let hasUnread =filteredArray.find((x) => {
                    return x.status === 1 ? true : false;
                });

                const folioList = {};
                filteredArray.map((x) => {
                    folioList[x.folio._id] = false;
                    return x.folio._id;
                });
                setIsLoadInboxFolio(folioList);
                setUnReadMessages(hasUnread?true:false);
            }
            else{
                setIsLoadInbox(false);
                setInboxes([]);
            }
        });
        
    }

    useEffect ( () => {
        //return
         loadInbox();
    }, []);

    const openItemInbox = (folio, item, pipe) => {
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

    const sendTrasnfer = () => {
        if(!destinyPipeline){
            toast.error('Selecciona una etapa a transferir');
            return false;
        }
        setOpenModalTransfer(false);
        socketC.connection.emit('transferStage', {folio: folioToTransfer, newStage : destinyPipeline}, (res) => {
            if(res.success){
                toast.success('Se transfirió el folio correctamente');
                
                setDestinyPipeline(null);
                setFolioToTransfer(null);
                // setInboxes([]);
                loadInbox();
                // loadInbox();
            }else{
                toast.error(res.message);
            }
        });

    }

    

    return ( <div style={{padding : 40, overflow: 'auto', height:'calc(100vh - 10px)', background:'#dde1e7'}}>
        <Message
            attached
            icon="filter"
            header='Pipeline de conversaciones'
            content='Selecciona un contacto para continuar con la conversación o moverla de etapa.'
        />
        <Table singleLine color='blue'>
            <Table.Header className='showHeader'>

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
               
  
            </Table.Body>
        </Table>
        <div style={{
            marginTop : 20,
        }}>
            <CardGroup style={{height : '100%',
            overflow : 'auto'}}>
            {
                Object.keys(inboxes).map((x) => {
                    if(inboxes[x].length <= 0){
                        return false;
                    }
                    let pipelineId = inboxes[x][0].pipeline;
                    let infoPipe = inboxes[x][0].service.pipelines.find((y) => {
                        return pipelineId === y._id
                    });
                    let infoStage = infoPipe.pipelines.find((y) => {
                        return x === y._id
                    })
                    //console.log(infoPipe.pipelines);
                    if(listPipeline.length <= 0){
                        setListPipeline(infoPipe.pipelines)
                    }
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

        <Modal
            // onClose={() => initLoadModal()}
            open={openModalTransfer}
            header={'Mover de Etapa: ' + folioToTransfer?.aliasUser}   
            size='tiny'
            content={<div style={{padding:10}}>
                {folioToTransfer && <><div style={{marginBottom:5}}>Selecciona la etapa a cual será transferido el folio <b>#{folioToTransfer.folio._id}</b> del usuario <b>{folioToTransfer.aliasUser}</b></div>
                <Select placeholder='Selecciona la etapa'
                    onChange={(e, data) => {
                        console.log({data});
                        setDestinyPipeline(data.value)
                    }}
                    options={listPipeline.filter((x) => {
                    return x._id !== folioToTransfer.pipelineStage && x.status == true ? true : false
                }).map((x) => {
                    return {
                        key : x._id,
                        value : x._id,
                        text : x.name
                    }
                })} /></>}
            </div>}
            actions={[
                { key: 'transfer-Cancelar', content: 'Cancelar', negative: true, onClick: ()=> {
                    setOpenModalTransfer(false)
                }},
                { key: 'transfer-Aceptar', content: 'Transferir', positive: true, onClick: ()=> {
                    if(window.confirm('¿Estás seguro de transferir el folio?')){
                        sendTrasnfer();
                    }
                }}
            ]}
            />

    </div> );




}
 
export default Inbox;