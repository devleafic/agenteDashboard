import React, {useEffect, useState} from 'react';
import { Modal, Button, Icon, Form, Input } from 'semantic-ui-react';

const FindTicket = ({setTicketSelected, setOpenViewTicket, setOpenFindTicket}) => {

    const [toFind, setToFind] = useState('')


    return ( <>
        <Modal
            size='mini'
            open={true}
        >
            <Modal.Header><Icon name='ticket'/> Buscar ticket.</Modal.Header>
            <Modal.Content>
            <p>Ingresa el número de ticket.</p>
            <Form>
                <Input placeholder='# Ticket' fluid onChange={(e) => {setToFind(e.target.value)}} value={toFind} onKeyDown={(e) => {
                    if(e.key === 'Enter'){
                        setOpenViewTicket(true);
                        setTicketSelected(toFind);
                        setOpenFindTicket(false);
                    }
                }}/> 
            </Form>
            </Modal.Content>
            <Modal.Actions>
            <Button onClick={() => setOpenFindTicket(false)}>Cerrar</Button>
            <Button color='yellow' onClick={() => {
                setOpenViewTicket(true);
                setTicketSelected(toFind);
                setOpenFindTicket(false);
            }}>Buscar</Button>
            
            </Modal.Actions>
        </Modal>
    </> );
}
 
export default FindTicket;