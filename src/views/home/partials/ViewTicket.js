import React, {useContext, useEffect, useState} from 'react';
import moment from 'moment';
import {Message, Label, Modal, Button, Icon, Table, Divider, Feed, TextArea, Form } from 'semantic-ui-react';

// Contextos
import SocketContext from './../../../controladores/SocketContext';

const ViewTicket = ({ticket, setOpenViewTicket}) => {
    const [onLoadingData, setOnLoadingData] = useState(true);
    const socket = useContext(SocketContext)
    const [infoTicket, setInfoTicket] = useState({});
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messageError, setMessageError] = useState(null);
    const [successTicket, setSuccessTicket] = useState(false);

    const addMessageTicket = () => {
        if(newMessage.trim() === ''){return false;}
        setIsLoading(true);
        socket.connection.emit('addMessageTicket', {
            message : newMessage,
            ticket : ticket,
            token : window.localStorage.getItem('sdToken')
        }, (result) => {
            setIsLoading(false);
            setInfoTicket(result.ticket);
            setNewMessage('');
        })
    }


    useEffect(() => {
        function getTicket (){
            setOnLoadingData(true);
            socket.connection.emit('getTicket', {ticket : ticket, token : window.localStorage.getItem('sdToken')}, (result) => {
                if(!result.success){
                    setOnLoadingData(false);
                    setMessageError(true);
                    return false;
                }
                setInfoTicket(result.ticket);
                setSuccessTicket(true);
                setOnLoadingData(false);
            })
        }
        getTicket();
        return ()=>{console.log('Eliminando viewTicket');}
    },[]);

    const getLabelSate = (item) => {
        let diffTime = moment(item.createdAt).diff(moment(item.expire), 'seconds');
        if(diffTime <= 0){
            return <Label as='a' color='red' tag>Fuera de tiempo</Label>;
        }else if(diffTime > 0){
            return <Label as='a' color='green' tag>En tiempo</Label>;
        }
    }

    return ( <>
        <Modal
            open={true}
        >
            <Modal.Header><Icon name='ticket'/> Ticket #{ticket}</Modal.Header>
            <Modal.Content>
            
            {
                onLoadingData && (<div style={{textAlign:'center'}}><Icon loading name='spinner' size='huge'/><div style={{marginTop:15}}>Recuperando datos del ticket.</div></div>) 
            }
            {
                messageError && (<Message
                    icon='coffee'
                    header='No logramos encontrar el número de folio.'
                    color='yellow'
                  />)
            }
            {
                successTicket && (<>
                    <Table definition>
                        <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell />
                            <Table.HeaderCell>Número</Table.HeaderCell>
                            <Table.HeaderCell>Área</Table.HeaderCell>
                            <Table.HeaderCell>Estado</Table.HeaderCell>
                            <Table.HeaderCell>Fecha de Creación</Table.HeaderCell>
                            <Table.HeaderCell>SLA</Table.HeaderCell>
                            <Table.HeaderCell>Fecha de expiración</Table.HeaderCell>
                        </Table.Row>
                        </Table.Header>

                        <Table.Body>
                            <Table.Row>
                                <Table.Cell>Ticket</Table.Cell>
                                <Table.Cell>{infoTicket._id}</Table.Cell>
                                <Table.Cell>{infoTicket.area.name}</Table.Cell>
                                <Table.Cell>{getLabelSate(infoTicket)}</Table.Cell>
                                <Table.Cell>{moment(infoTicket.createdAt).format('MMMM Do YYYY, h:mm:ss a')}</Table.Cell>
                                <Table.Cell>{infoTicket.sla.number+' '+infoTicket.sla.unit}</Table.Cell>
                                <Table.Cell>{moment(infoTicket.expire).format('MMMM Do YYYY, h:mm:ss a')}</Table.Cell>
                            </Table.Row>
                        </Table.Body>
                    </Table>
                    <Divider horizontal style={{marginTop:25}}>Mensajes</Divider>
                    <Feed >
                        {
                            infoTicket.messages.map((msg) => {
                                return (
                                    <Feed.Event key={msg._id}>
                                        <Feed.Content>
                                            <Feed.Summary>
                                                <a>{msg.from === 'agent' ? msg.agent.profile.name : (<Label color='orange' ribbon>{msg.producer}</Label>)}</a> {msg.from === 'agent' && msg.agent.user}
                                                <Feed.Date>{moment(msg.createdAt).fromNow()}</Feed.Date>
                                            </Feed.Summary>
                                            <Feed.Extra text>{msg.text}</Feed.Extra>
                                        </Feed.Content>
                                        <Divider/>
                                    </Feed.Event>
                                )
                            })
                        }
                    </Feed>
                    {
                                infoTicket.status === 4 ? (<>
                                    <Message
                                        color='yellow'
                                        icon='inbox'
                                        header='El ticket, ha sido finalizado'
                                        content={'Cerrado desde : '+moment(infoTicket.closeAt).format('MMMM Do YYYY, h:mm:ss a')}
                                    />
                                </>)
                                :
                                (<>
                                    <Form>
                                        <TextArea placeholder='Escribe un mensaje' style={{ minHeight: 100 }} value={newMessage} onChange={(e)=> {setNewMessage(e.target.value)}}/>
                                        <div style={{marginTop:15, textAlign:'right'}}>
                                            <Button icon labelPosition='right' color='blue' onClick={addMessageTicket} loading={isLoading} disabled={isLoading}>Responder <Icon name='reply' /></Button>
                                        </div>
                                    </Form>
                                </>)
                            }
                    
                </>)
            }
            </Modal.Content>
            <Modal.Actions>
                <Button onClick={() => setOpenViewTicket(false)}>
                    Cerrar
                </Button>
            </Modal.Actions>
        </Modal>
    </> );
}
 
export default ViewTicket;