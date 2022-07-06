import React, {useEffect, useContext, useState} from 'react';
import { Container, Table, Label, Header, Icon, Button } from 'semantic-ui-react';
import SocketContext from '../../../controladores/SocketContext';
import { toast } from 'react-toastify';

const Inbox = ({selectedComponent, setUnReadMessages}) => {
    const socketC = useContext(SocketContext);
    const [inboxes, setInboxes ] = useState([]);
    const [isLoadInbox, setIsLoadInbox ] = useState(false);



    useEffect(() => {
        const loadInbox = () => {
            setIsLoadInbox(true);
            //setInboxes([]);
            socketC.connection.emit('loadInbox', {
                token : window.localStorage.getItem('sdToken')
            },(data) => {
                
                setIsLoadInbox(false);
                setInboxes(data.inboxes);
                
                let hasUnread = data.inboxes.find((x) => {
                    return x.status === 1 ? true : false;
                })

                setUnReadMessages(hasUnread?true:false);
            });
        }
        return loadInbox();
    }, []);

    const openItemInbox = (folio, item) => {
        console.time('openItemInbox')
        socketC.connection.emit('openItemInbox', {
            token : window.localStorage.getItem('sdToken'),
            folio : folio,
            item
        },(data) => {
            toast.success(<label>Se abrió el folio <b>#{folio._id}</b></label>);
            if(!data.success){
                toast.error(data.message);
                return false;
            }
            selectedComponent('home')
            console.timeEnd('openItemInbox')
        });
    }

    return ( <div style={{margin : 40}}>
        <Header as='h2'>
            <Icon name='inbox' />
            <Header.Content>Inbox</Header.Content>
        </Header>
        <Table singleLine color='blue'>
            <Table.Header>
            <Table.Row>
                <Table.HeaderCell>Folio</Table.HeaderCell>
                <Table.HeaderCell>Item</Table.HeaderCell>
                <Table.HeaderCell>Identificador</Table.HeaderCell>
                <Table.HeaderCell>Canal</Table.HeaderCell>
                <Table.HeaderCell>Queue</Table.HeaderCell>
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
                        return x.status === 3 ? false : true;
                    }).map((x) => {
                        return (
                            <Table.Row key={x._id}>
                                <Table.Cell>{x.status === 1 && (<Icon name='circle' color='red'/>)} {x.folio?._id}</Table.Cell>
                                <Table.Cell>{x.item}</Table.Cell>
                                <Table.Cell>{x.anchor}</Table.Cell>
                                <Table.Cell>{x.channel}</Table.Cell>
                                <Table.Cell>{x.queue}</Table.Cell>
                                <Table.Cell textAlign='right'>
                                    {
                                        x.folio?.status === 3 ? (<label>Folio finalizado</label>) : (<>
                                            <Button color='olive' onClick={() => {
                                                openItemInbox(x.folio, x);
                                                setUnReadMessages(false)
                                            }}>Abrir</Button>
                                        </>)
                                    }
                                    
                                </Table.Cell>
                            </Table.Row>
                        )
                    })
                }
            </Table.Body>
        </Table>
        
    </div> );
}
 
export default Inbox;