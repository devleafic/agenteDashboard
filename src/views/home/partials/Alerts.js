import React, {useEffect} from 'react';
import { Modal, Button, Icon } from 'semantic-ui-react';

const Alerts = ({ message, type, setOpenAlert}) => {
    useEffect(() => {
        return ()=>{console.log('Eliminando Alerta');}
    });
    return ( <>
        <Modal
            size='mini'
            open={true}
        >
            <Modal.Header><Icon name='warning sign'/> Aviso</Modal.Header>
            <Modal.Content>
            <p>{message}</p>
            </Modal.Content>
            <Modal.Actions>
            {/* <Button negative onClick={() => setOpenAlert({ type: 'close' })}>
                No
            </Button> */}
            <Button positive onClick={() => setOpenAlert(false)}>
                Aceptar
            </Button>
            </Modal.Actions>
        </Modal>
    </> );
}
 
export default Alerts;