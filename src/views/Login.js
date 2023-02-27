import { Grid, Header, Form, Button, Image, Message } from 'semantic-ui-react';
import React, {useState} from 'react';
import LogoImage from './../img/logo.png';
import axios from 'axios';

const Login = () => {

    const [ onLoading, setOnLoading ] = useState(false);
    const [ user, setUser ] = useState('');
    const [ password, setPassword ] = useState('');
    const [ msgError, setMsgError ] = useState('');



    const onSubmitForm = async (event) => {
        event.preventDefault();
        if(user.trim() === ''){setMsgError('El usuario no debe ir vacio.');return false;}
        if(password.trim() === ''){setMsgError('La contraseña no debe ir vacia.');return false;}

        setOnLoading(true);

        try{
            console.log('iniciando')
            let resLogin = await axios.post(process.env.REACT_APP_CENTRALITA+'/agent/login',{user, password});    
            
            setOnLoading(false);
            if(!resLogin.data.body.success){
                setMsgError(resLogin.data.body.message);
                return false;
            }
            window.localStorage.setItem('sdToken', resLogin.data.body.token);
            window.localStorage.setItem('myName', resLogin.data.body.name);
            return window.location.href = '/';
        }catch(err){
            setMsgError('Ocurrio un error al intentar iniciar sesión, intente mas tarde.\n\n'+err.message);
            setOnLoading(false);
        }
        

    }

    return (<>
        <Grid columns={2} style={{height:'calc(100vh + 14px)'}}>
            <Grid.Column>
                <Grid textAlign='center' style={{ height: '100vh' }} verticalAlign='middle'>
                    <Grid.Column style={{ maxWidth: 450 }}> 
                        {/* <Header as='h1' style={{color:'#FFF'}}>Bienvenido a SD.2</Header> */}
                        <Image src={LogoImage}/>
                        <Header as='h2'>WhatsApp Business, Facebook Messenger, Instagram, Email, Llamadas y más...</Header>
                        <Header as='h3'>Combinados en una bandeja de entrada.</Header>
                    </Grid.Column>
                </Grid>
            </Grid.Column>
            <Grid.Column>
                <Grid textAlign='center' style={{ height: '100vh' }} verticalAlign='middle'>
                    <Grid.Column style={{ maxWidth: 450 }}> 
                        <Form size='large' onSubmit={onSubmitForm}>
                            <Header as='h2'>Una Bandeja. Todos los Canales.</Header>
                            <Header as='h4'>Versión {process.env.REACT_APP_SYSTEM_VERSION}</Header>
                            <p>Ingresa tus credenciales para poder acceder</p>
                            {msgError.trim() !== '' &&(<Message negative>
                                <p>{msgError}</p>
                            </Message>)}
                            <Form.Input
                                fluid icon='user'
                                iconPosition='left'
                                placeholder='Usuario'
                                value={user}
                                onChange={(e) => {setUser(e.target.value); setMsgError('')}}
                            />
                            <Form.Input
                                fluid
                                icon='lock'
                                iconPosition='left'
                                placeholder='Contraseña'
                                type='password'
                                value={password}
                                onChange={(e)=> {setPassword(e.target.value); setMsgError('')}}
                            />
                            
                            <Button color='blue' loading={onLoading} disabled={onLoading}>
                                Iniciar Sesión
                            </Button>
                        </Form>
                    </Grid.Column>
                </Grid>
                
            </Grid.Column>
        </Grid>          
    </>);
}
 
export default Login;