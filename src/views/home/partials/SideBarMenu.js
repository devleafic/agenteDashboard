import { Button, Popup, Image, Icon } from 'semantic-ui-react';

/* Recursos */
import avatar from './../../../img/ico.png';
import { Link } from "react-router-dom";

const SideBarMenu = ({page, selectedComponent, setOnConnect, onConnect, unReadMessages}) => {

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
                <Button icon={<Icon.Group>
                    <Icon name='inbox' />
                    <Icon corner name='circle' color='red'/>
                </Icon.Group>}  onClick={() => selectedComponent('inbox')} color={page === 'inbox' ? 'blue' : null} />
            )
        }else{
            return <Button icon='inbox' onClick={() => selectedComponent('inbox')} color={page === 'inbox' ? 'blue' : null}/>
        }
        
    }


    return (<>
        <div style={{marginTop:20, textAlign:'center'}}>
            <Image src={avatar} alt='inbox Central' centered style={{height:25}}/>
            <div>{parseName(window.localStorage.getItem('myName'))}</div>
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