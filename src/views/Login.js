import { Grid, Header, Form, Button, Image, Message, Segment, Icon } from 'semantic-ui-react';
import React, { useState } from 'react';
import LogoImage from './../img/logo.png';
import axios from 'axios';
import './Login.css'; // Import custom CSS for additional styling

const Login = () => {
    const [onLoading, setOnLoading] = useState(false);
    const [user, setUser] = useState('');
    const [password, setPassword] = useState('');
    const [msgError, setMsgError] = useState('');

    const onSubmitForm = async (event) => {
        event.preventDefault();
        if (user.trim() === '') { setMsgError('El usuario no debe ir vacío.'); return false; }
        if (password.trim() === '') { setMsgError('La contraseña no debe ir vacía.'); return false; }

        setOnLoading(true);

        try {
            let resLogin = await axios.post(process.env.REACT_APP_CENTRALITA + '/agent/login', { user, password });

            setOnLoading(false);
            if (!resLogin.data.body.success) {
                setMsgError(resLogin.data.body.message);
                return false;
            }
            window.localStorage.setItem('sdToken', resLogin.data.body.token);
            window.localStorage.setItem('myName', resLogin.data.body.name);
            return window.location.href = '/';
        } catch (err) {
            setMsgError('Ocurrió un error al intentar iniciar sesión, intente más tarde.\n\n' + err.message);
            setOnLoading(false);
        }
    }

    return (
        <div class="login-page">
        <div className="login-container">
            <Grid textAlign='center' verticalAlign='middle' className="login-grid">
                <Grid.Column style={{ maxWidth: 450 }}>
                    <Segment raised>
                        <Header as='h2' color='blue' textAlign='center'>
                            <Image src={LogoImage} style={{ width: 300, margin: '0 auto' }} />
                        </Header>
                        <Header as='h2'>WhatsApp for Business, Messenger, Instagram, Livechat, Llamadas y más...</Header>
                        <Header as='h3'>Combinados en una bandeja para equipos</Header>
                        <Header as='h4' color='grey' textAlign='center'>Versión UI {process.env.REACT_APP_SYSTEM_VERSION}</Header>
                        <Header as='h6' color='grey' textAlign='center'>Kernel {process.env.REACT_APP_SYSTEM_REACTOR}</Header>
                        <Form size='large' onSubmit={onSubmitForm} loading={onLoading}>
                            <Segment stacked>
                                <Form.Input
                                    fluid
                                    icon='user'
                                    iconPosition='left'
                                    placeholder='Usuario'
                                    value={user}
                                    onChange={(e) => { setUser(e.target.value.replace(/\s/g, '')); setMsgError(''); }}
                                />
                                <Form.Input
                                    fluid
                                    icon='lock'
                                    iconPosition='left'
                                    placeholder='Contraseña'
                                    type='password'
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setMsgError(''); }}
                                />
                                <Button color='blue' fluid size='large'>
                                    Iniciar Sesión
                                </Button>
                            </Segment>
                        </Form>
                        {msgError && <div className="ui message error">{msgError}</div>}
                    </Segment>
                </Grid.Column>
            </Grid>
        </div>
        </div>
    );
}

export default Login;