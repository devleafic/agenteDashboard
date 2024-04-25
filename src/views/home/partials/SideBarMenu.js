import {useEffect, useState} from 'react'
import { Button, Popup, Image, Icon } from 'semantic-ui-react';

/* Recursos */
import avatar from './../../../img/ico.png';
import { useSocket } from '../../../controladores/InternalChatContext';
import { toast } from 'react-toastify';

const SideBarMenu = ({page, selectedComponent, setOnConnect, isConnected, unReadMessages}) => {


    const {unreadMessages : unReadMessagesIC} = useSocket();
    const [hasUnread, setHasUnread] = useState(0);

    useEffect(() => {
        // console.log('nuevo un read',unreadMessages);
        // Contamos cuantos mensajes no leidos hay

        let count = 0;
        for (const key in unReadMessagesIC) {
            if (unReadMessagesIC.hasOwnProperty(key)) {
                count += unReadMessagesIC[key];
            }
        }
        console.log({count});
        if(count > 0){
            toast.info('Nuevo mensaje en TeamChat', {
                position: "top-center",
                autoClose: 1000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: "dark",
                });
        }
        setHasUnread(count);

    },[unReadMessagesIC])


    const closeSession = () => {
        window.localStorage.removeItem('sdToken');
        window.localStorage.removeItem('myName');
        window.location = '/login'
    }
    const parseName = (fullName) => {
        if(!fullName){return '';}
        return fullName.length >= 9 ? fullName.split(' ')[0].substr(0,7) + '...' : fullName.split(' ')[0].substr(0,8)
    }

    const getButton = (option) => {
       
        switch (option){
            case 'inbox':
                if(unReadMessages){
                    return (
        
                        <Button disabled={isConnected === -1 ? true : false} icon={<Icon.Group>
                            <Icon loading name='envelope' color='red'  />
                           {/* <Icon name='inbox' />*/}
                            </Icon.Group>}  onClick={() => selectedComponent('inbox')} color={page === 'inbox' ? 'blue' : null} />
                    )
                }else{
                    return <Button disabled={isConnected === -1 ? true : false} icon='inbox' onClick={() => selectedComponent('inbox')} color={page === 'inbox' ? 'blue' : null}/>
        
                }
            case 'follow':
                return <Button disabled={isConnected === -1 ? true : false} icon='filter' onClick={() => selectedComponent('follow')} color={page === 'follow' ? 'blue' : null}/>
            case 'contacts':
                return <Button disabled={isConnected === -1 ? true : false} icon='id card' onClick={() => selectedComponent('contacts')} color={page === 'contacts' ? 'blue' : null}/>
            case 'calendar':
                return <Button disabled={isConnected === -1 ? true : false} icon='calendar alternate' onClick={() => selectedComponent('calendar')} color={page === 'calendar' ? 'blue' : null}/>                
            case 'InternalChat':
                return <Button basic icon='chat' onClick={() => selectedComponent('InternalChat')} color={page === 'InternalChat' ? 'blue' : (hasUnread > 0 ? 'red' : null)}/>
        }
    }

    return (<>
        <div style={{marginTop:20, textAlign:'center'}}>
            <div><b>{parseName(window.localStorage.getItem('myName'))}</b></div>
              <Popup
                    content='Inbox Central, powered by BotDynamics.'
                    key={process.env.REACT_APP_SYSTEM_VERSION}
                    header={process.env.REACT_APP_SYSTEM_VERSION}
                    trigger={<Image src={avatar} centered style={{height:30}}/>}
            />
        </div>
        <div style={{height:'100%',position: 'relative'}}>
            <div className='vertical-center'>
                {/* <div className='mb-3'>
                    <Popup content='Conectar' trigger={<Button icon='code branch' onClick={() => {setOnConnect(!onConnect)}} color={page === 'code branch' ? 'blue' : null}/>} position='right center'/>
                </div> */}
                <div className='mb-3'>
                    <Popup content='Conversaciones Asignadas' trigger={<Button icon='comments' onClick={() => selectedComponent('home')} color={page === 'home' ? 'blue' : null}/>} position='right center'/>
                </div>
                <div className='mb-3'>
                    <Popup content='Mis conversaciones privadas' trigger={getButton('inbox')} position='right center'/>
                </div>
                <div className='mb-3'>
                    <Popup content='Mis seguimientos en pipeline' trigger={getButton('follow')} position='right center'/>
                </div>
                <div className='mb-3'>
                    <Popup content='Contactos' trigger={getButton('contacts')} position='right center'/>
                </div>
                <div className='mb-3'>
                    <Popup content='TeamChat (Beta 0.3) Comunicate con tu equipo de trabajo.' trigger={getButton('InternalChat')} position='right center'/>
                </div>
                {/*<div className='mb-3'>
                    <Popup content='Calendario' trigger={getButton('calendar')} position='right center'/>
                </div>
                 <div className='mb-3'>
                    <Popup content='Informes' trigger={<Button icon='chart bar' onClick={() => selectedComponent('reports')} color={page === 'reports' ? 'blue' : null}/>} position='right center'/>
                </div>
                <div className='mb-3'>
                    <Popup content='Busqueda' trigger={<Link to='/dashboard/search'><Button icon='search' color={page === 'search' ? 'blue' : null}/></Link>} position='right center'/>
                </div>
                <div className='mb-3'>
                    <Popup content='Cloud SDrive' trigger={<Link to='/dashboard/cloud'><Button icon='cloud' color={page === 'cloud' ? 'blue' : null}/></Link>} position='right center'/>
                </div> */}
                <div className='mb-3' style={{marginTop:100}}>
                    <Popup content='Cerrar Sesión' trigger={<Button icon='log out' onClick={closeSession}/>} position='right center'/>
                </div>
            </div>
        </div>
    </>);
}
 
export default SideBarMenu;