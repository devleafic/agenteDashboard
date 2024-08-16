import {useEffect, useState} from 'react'
import { Button, Popup, Image, Icon } from 'semantic-ui-react';

/* Recursos */
import avatar from './../../../img/ico.png';
import { useSocket } from '../../../controladores/InternalChatContext';
import { toast } from 'react-toastify';
import '../../../SideBarMenu.css'; 

const SideBarMenu = ({page, selectedComponent, setOnConnect, isConnected, unReadMessages}) => {
    useEffect(() => {
        // Asegúrate de que el estado se inicialice correctamente
        if (!page) {
            console.log('no hay pagina');
            page('home'); // O cualquier valor predeterminado que tenga sentido
        }
        console.log('page',page);
    }, [page]);
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
        const isSelected = page === option;
        const buttonClass = isSelected ? 'sidebar-button selected' : 'sidebar-button';
    
        switch (option){
            case 'home':
                return <Button   className={buttonClass}
                disabled={isConnected === -1 ? true : false} icon='comments' onClick={() => selectedComponent('home')} color={page == 'home' ? 'blue' : null}/>
            case 'inbox':
                if(unReadMessages){
                    return (
        
                        <Button disabled={isConnected === -1 ? true : false} icon={<Icon.Group>
                            <Icon loading name='envelope' color='red'  />
                           {/* <Icon name='inbox' />*/}
                            </Icon.Group>}  onClick={() => selectedComponent('inbox')} color={page === 'inbox' ? 'blue' : null} />
                    )
                }else{
                    return <Button className="sidebar-item" disabled={isConnected === -1 ? true : false} icon='inbox' onClick={() => selectedComponent('inbox')} color={page === 'inbox' ? 'blue' : null}/>
        
                }
            case 'follow':
                return <Button disabled={isConnected === -1 ? true : false} icon='filter' onClick={() => selectedComponent('follow')} color={page === 'follow' ? 'blue' : null}/>
            case 'contacts':
                return <Button disabled={isConnected === -1 ? true : false} icon='id card' onClick={() => selectedComponent('contacts')} color={page === 'contacts' ? 'blue' : null}/>
            case 'calendar':
                return <Button disabled={isConnected === -1 ? true : false} icon='calendar alternate' onClick={() => selectedComponent('calendar')} color={page === 'calendar' ? 'blue' : null}/>                
            case 'InternalChat':
                return  <Button className="sidebar-item"  icon='chat' onClick={() => selectedComponent('InternalChat')} color={page === 'InternalChat' ? 'blue' : (hasUnread > 0 ? 'red' : null)}/>  
        }
    }
    useEffect(() => {
        // Asegúrate de que los estilos CSS se carguen correctamente
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '../../../SideBarMenu.css'; // Reemplaza con la ruta correcta a tu archivo CSS
        document.head.appendChild(link);

        return () => {
            document.head.removeChild(link);
        };
    }, []);

    return (<>
        <div style={{marginTop:20, textAlign:'center'}}>
            <div><b>{parseName(window.localStorage.getItem('myName'))}</b></div>
              <Popup
                    content='Inbox Central, powered by BotDynamics.'
                    key={process.env.REACT_APP_SYSTEM_VERSION}
                    header={process.env.REACT_APP_SYSTEM_VERSION}
                    trigger={<Image src={avatar} centered style={{height:28}}/>}
            />
        </div>
        <div style={{height:'100%',position: 'relative'}}>

        <div className="sidebar-container">
            <div className="sidebar-content">
                <div className="sidebar-item">
                    <Popup content='Mis Conversaciones en curso' trigger={getButton('home')} position='right center'/>
                </div>
                <div className="sidebar-item">
                    <Popup content='Mis conversaciones privadas' trigger={getButton('inbox')} position='right center'/>
                </div>
                <div className="sidebar-item">
                    <Popup content='Mis seguimientos en pipeline' trigger={getButton('follow')} position='right center'/>
                </div>
                <div className="sidebar-item">
                    <Popup content='Contactos' trigger={getButton('contacts')} position='right center'/>
                </div>
                <div className="sidebar-item">
                    <Popup content='TeamChat (Beta 0.6) Comunicate con tu equipo de trabajo.' trigger={getButton('InternalChat')} position='right center'/>
                </div>
                <div className="sidebar-item logout">
                    <Popup content='Cerrar Sesión' trigger={<Button icon='log out' onClick={closeSession}/>} position='right center'/>
                </div>
            </div>
        </div>
        </div>
    </>);
}
 
export default SideBarMenu;