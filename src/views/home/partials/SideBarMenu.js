import { Button, Popup, Image, Icon } from 'semantic-ui-react';

/* Recursos */
import avatar from './../../../img/ico.png';
import { Link } from "react-router-dom";

const SideBarMenu = ({page, selectedComponent, setOnConnect, isConnected, unReadMessages}) => {

    const closeSession = () => {
        window.localStorage.removeItem('sdToken');
        window.localStorage.removeItem('myName');
        window.location = '/login'
    }

    const parseName = (fullName) => {
        if(!fullName){return '';}
        return fullName.split(' ')[0]
    }

    const getButton = () => {
        if(unReadMessages){
            return (

                <Button disabled={isConnected === -1 ? true : false} icon={<Icon.Group>
                    <Icon loading name='envelope' color='red'  />
                   {/* <Icon name='inbox' />*/}
                    </Icon.Group>}  onClick={() => selectedComponent('inbox')} color={page === 'inbox' ? 'teal' : null} />
            )
        }else{
            return <Button disabled={isConnected === -1 ? true : false} icon='inbox' onClick={() => selectedComponent('inbox')} color={page === 'inbox' ? 'teal' : null}/>

        }
        
    }


    return (<>
        <div style={{marginTop:20, textAlign:'center'}}>
            <div><b>{parseName(window.localStorage.getItem('myName'))}</b></div>
               {/*  <div>{process.env.REACT_APP_SYSTEM_VERSION}</div>
            <Image src={avatar} alt='inbox Central' centered style={{height:25}}/> */} 

            <Popup
                    content='Inbox Central'
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
                    <Popup content='Inicio' trigger={<Button icon='home' onClick={() => selectedComponent('home')} color={page === 'home' ? 'blue' : null}/>} position='right center'/>
                </div>
                <div className='mb-3'>
                    <Popup content='Inbox' trigger={getButton()} position='right center'/>
                </div>
                {/* <div className='mb-3'>
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