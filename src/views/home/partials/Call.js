import {Message, Card, Button, Icon } from 'semantic-ui-react';
import React, {useState, useContext} from 'react';
import SocketContext from './../../../controladores/SocketContext';
//import CallContext from '../../controladores/CallContext';
import CallContext from '../../../controladores/CallContext';
import { useEffect } from 'react/cjs/react.development';


const Call = ({currentFolio, onCall, setOnCall, setRefresh, sidCall, setSidCall}) => {
    
    const [onCalling, setOnCalling] = useState(false);

    const callC = useContext(CallContext);
    const socket = useContext(SocketContext);
    const [isMuted, setIsMuted] = useState(false);
    const [beep] = useState(new Audio(process.env.REACT_APP_CENTRALITA+'/cdn/sound/beepCalling.mp3'))
    

    const hangUp = () => {
        socket.connection.emit('hangUp', {sidCall : sidCall}, (data) => {
            console.log('llamada terminanda');
            setOnCall('disconnect');
            setRefresh(Math.random());
        });
    }

    useEffect(() => {
        if(onCall === 'connect' || onCall === 'disconnect'){
            beep.pause();
        }else if(onCall === 'calling'){
            beep.play();
        }
    },[onCall]);


    const makeCall = () => {
        setOnCalling(true);
        setOnCall('calling');
        setRefresh(Math.random());
        
        socket.connection.emit('makeCall', {folio : currentFolio._id, token : window.localStorage.getItem('sdToken')}, (data) => {
            setSidCall(data.call.sid);
            setOnCall('calling');
            setRefresh(Math.random());
        });
    }

    const muteCall = () => {
        let isMutedTemp = callC.connection.activeConnection().isMuted()
        setIsMuted(!isMutedTemp)
        callC.connection.activeConnection().mute(!isMutedTemp);
    }
    
    return ( <>
        {
            onCall === 'connect' && (<Message visible positive>La llamada esta en curso.</Message>)
        }
        {
            onCall === 'disconnect' && (<Message visible negative>La llamada ha finalizado.</Message>)
        }
        {
            onCall === 'calling' && (<Message visible color='orange'>Llamando . . .</Message>)
        }
        
        <Card style={{marginLeft : 'auto', marginRight : 'auto', width:'50%'}}>
            <Card.Content>
                <Card.Header>{currentFolio.person.anchor}</Card.Header>
                {/* <Card.Meta><Icon name='phone'/> 00:00</Card.Meta> */}
            </Card.Content>
            <Card.Content extra>
                <div className='ui three buttons'>
                    <Button basic={!isMuted} color='yellow' disabled={onCall === 'disconnect'} onClick={muteCall}>
                        <Icon name='mute'/>
                        Silenciar
                    </Button>
                    <Button basic color='red' disabled={onCall === 'disconnect'} onClick={hangUp}>
                        <Icon name='stop'/>
                        Colgar
                    </Button>
                    <Button color='green' disabled={!(onCall === 'disconnect')} onClick={makeCall}>
                        <Icon name='phone'/>
                        Llamar
                    </Button>
                </div>
            </Card.Content>
        </Card>
    </> );
}
 
export default Call;