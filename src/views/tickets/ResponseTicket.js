import React, {useEffect, useState} from 'react';
import {Message, Icon, Modal, Button, Form, Segment, Dimmer, Loader, Container, Comment, Header, Label, Table } from 'semantic-ui-react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';

const ResponseTicket = () => {
    const {idTicket} = useParams();
    const [infoTicket, setInfoTicket] = useState(null);
    const [onLoading, setOnLoding] = useState(true);
    const [message, setMessage] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [isLoading, setIsloading] = useState(false);

    useEffect(async () => {
        let {data} = await axios.get(process.env.REACT_APP_CENTRALITA+'/ticket/'+idTicket);
        if(data.body.success){
            setInfoTicket(data.body.ticket);
            setOnLoding(false);
        }else{
            alert(data.body.message);
        }
        console.log(data);
    },[]);

    const sendMessage = async () => {
        if(message.trim() === ''){return false;}
        let {data} = await axios.post(process.env.REACT_APP_CENTRALITA+'/ticket/response/'+idTicket, {message});
        setMessage('')
    }

    const closeTicket = async () => {
        setIsloading(true);
        let {data} = await axios.post(process.env.REACT_APP_CENTRALITA+'/ticket/close/'+idTicket);
        setIsloading(false);
        if(data.body.success){
            setInfoTicket(data.body.ticket);
            setShowAlert(false);
        }
    }

    const getLabelSate = (item) => {
        let diffTime = moment(item.createdAt).diff(moment(item.expire), 'seconds');
        if(diffTime <= 0){
            return <Label as='a' color='red' tag>Fuera de tiempo</Label>;
        }else if(diffTime > 0){
            return <Label as='a' color='green' tag>En tiempo</Label>;
        }
    }

    return ( <>
        <Dimmer active={onLoading} page={true}>
            <Loader indeterminate>Cargando. . . </Loader>
        </Dimmer>

        {
            infoTicket && (
                <Container>
                    <Segment>
                        <Comment.Group  size='mini'>
                            <Header as='h3' dividing>Historial de mensajes del folio #{infoTicket._id}</Header>
                            <div>
                                <Table definition>
                                    <Table.Header>
                                    <Table.Row>
                                        <Table.HeaderCell />
                                        <Table.HeaderCell>Id</Table.HeaderCell>
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
                            </div>
                            <div style={{height:500, overflowY: 'scroll', marginTop:20}}>
                            {
                                infoTicket.messages.map((item) => {
                                    return (
                                        <Comment key={item._id}>
                                            <Comment.Content>
                                                <Label as='a' color={item.from === 'agent' ? 'teal' : 'orange'}>{item.from === 'agent' ? item.agent.profile.name : item.producer}</Label>
                                                <Comment.Metadata>
                                                    <div style={{fontSize:12}}>{moment(item.createdAt).fromNow()}</div>
                                                </Comment.Metadata>
                                                <Comment.Text>{item.text}</Comment.Text>
                                            </Comment.Content>
                                        </Comment>
                                    )
                                })
                            }
                            </div>
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
                                    <Form reply>
                                        <Form.TextArea value={message} onChange={(e)=>{
                                            setMessage(e.target.value);
                                        }}/>
                                        <Button content='Responder' labelPosition='left' icon='edit' primary onClick={sendMessage}/>
                                        <Button content='Cerrar Ticket' labelPosition='left' icon='close' negative onClick={() => {setShowAlert(true)}} style={{float:'right'}}/>
                                    </Form>
                                </>)
                            }
                            
                        </Comment.Group>

                        
                    </Segment>
                </Container>
            )
        }

        <Modal
            size='mini'
            open={showAlert}
        >
        <Modal.Header><Icon name='warning'/>Aviso</Modal.Header>
        <Modal.Content>
          <b>¿Estas seguro de que quieres finalziar el ticket?</b><br/>
          <label>Esta acción no es revertible.</label>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setShowAlert(false)} loading={isLoading} disabled={isLoading}>
            Cancelar
          </Button>
          <Button color='orange' onClick={() => closeTicket()} loading={isLoading} disabled={isLoading}>
            Cerrar Ticket
          </Button>
        </Modal.Actions>
      </Modal>
        
    </> );
}
 
export default ResponseTicket;