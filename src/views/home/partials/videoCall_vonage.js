import {Message, Card, Button, Icon } from 'semantic-ui-react';
import React, {useState, useContext, useEffect, useRef} from 'react';
import SocketContext from './../../../controladores/SocketContext';
//import CallContext from '../../controladores/CallContext';
import CallContext from '../../../controladores/CallContext';

//only vonage call control

import '@vonage/video-publisher/video-publisher.js';
import '@vonage/video-subscribers/video-subscribers.js';
import '@vonage/screen-share/screen-share.js';

const VideoCall = ({currentFolio, onCall, setOnCall, setRefresh, sidCall, setSidCall}) => {
    
   
    const [beep] = useState(new Audio(process.env.REACT_APP_CENTRALITA+'/cdn/sound/beepCalling.mp3'))
    
    //video componentes

  // Get references to Web Components
  const publisher = useRef(null);
  const subscribers = useRef(null);
  const screenshare = useRef(null);
  //const [searchParams, setSearchParams] = useSearchParams();
  //const myParam = searchParams.get('session');

  // These values normally come from the backend in a production application, but for this demo, they are hardcoded
 

  

  const apiKey = '47794111';
  const sessionId =
    '2_MX40Nzc5NDExMX5-MTY5NzQ5NDU2NjkxN345b3I4dXlFVTJZbnJ3S1BlMmhNNUtKZE9-fn4';
  const token =
    'T1==cGFydG5lcl9pZD00Nzc5NDExMSZzaWc9MjZmMTU1OWIwNDc5ODVkOTM3NWY2ZDE3Mzg0NDNkNzNkNmFlOWI4MDpzZXNzaW9uX2lkPTJfTVg0ME56YzVOREV4TVg1LU1UWTVOelE1TkRVMk5qa3hOMzQ1YjNJNGRYbEZWVEpaYm5KM1MxQmxNbWhOTlV0S1pFOS1mbjQmY3JlYXRlX3RpbWU9MTY5NzUxNjQ2MSZub25jZT0wLjYzMzU5OTUxOTkyODE5NDMmcm9sZT1wdWJsaXNoZXImZXhwaXJlX3RpbWU9MTcwMDExMjA2MSZpbml0aWFsX2xheW91dF9jbGFzc19saXN0PQ==';
  
  const toggleVideo = () => {
    publisher.current.toggleVideo();
  };

  const toggleAudio = () => {
    publisher.current.toggleAudio();
  };
  const disconnectVideocall = () => {
    
    session.disconnect()
  


  };
  //const OT = window.OT;
  const OT = require('@opentok/client');
  // Initialize an OpenTok Session object
  let session = null;

  useEffect(() => {
    if (OT.initSession)  {
    session = OT.initSession(apiKey, sessionId);
    // Set session and token (and optionally properties) for Web Components
    publisher.current.session = session;
    publisher.current.token = token;
    publisher.current.properties = {
      fitMode: 'cover',
      height: '100%',
      resolution: '1920x1080',
      videoContentHint: 'detail',
      width: '100%',
    };
    subscribers.current.session = session;
    subscribers.current.token = token;
    screenshare.current.session = session;
    screenshare.current.token = token;
    subscribers.current.properties = {
      fitMode: 'cover',
      height: '600',
      width: '480',
      videoContentHint: 'detail',
    };
}
    

},[currentFolio]);

    
    return ( <>
        <div className="App">
        <header className="App-header">
        </header>
        <div className="App-container">
          <section className="App-section-publisher">
            <fieldset>
              <legend>Agente</legend>
              <video-publisher ref={publisher}></video-publisher>
            </fieldset>


            <Button  key={'btnvideo-'+currentFolio}  color='warning' basic  onClick={toggleVideo}><label className='hideText'><Icon name='camera' />On/OFF Cam</label></Button>
            <Button  key={'btnmic-'+currentFolio}  color='warning' basic  onClick={toggleAudio}><label className='hideText'><Icon name='microphone' />On/OFF Mic</label></Button>
            <Button  key={'btnhung-'+currentFolio}  color='red' basic  onClick={disconnectVideocall}><label className='hideText'><Icon name='call' />Colgar</label></Button>
                     
            <br />
            <br />
            <screen-share
              start-text="Compartir Pantalla"
              stop-text="Detener Compartir"
              width="600px"
              height="480px"
              ref={screenshare}
            ></screen-share>
          </section>
          <section className="App-section-subscribers">
            <fieldset>
              <legend>Cliente / Usuario</legend>
              <video-subscribers ref={subscribers}></video-subscribers>
            </fieldset>
          </section>
        </div>
        </div>
        
       
    </> );
}
 
export default VideoCall;