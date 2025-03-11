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
        <div className="login-page">
            <div className="login-container">
                <div className="login-card">
                    <div className="login-card-content">
                        <div className="login-logo-container">
                            <Image src={LogoImage} className="login-logo" />
                        </div>
                        
                        <div className="login-header">
                            <h1 className="login-title">Bienvenido</h1>
                            <p className="login-subtitle">WhatsApp for Business, Messenger, Instagram, Livechat, Llamadas y más...</p>
                            <p className="login-description">Combinados en una bandeja para equipos</p>
                        </div>
                        
                        <Form size='large' onSubmit={onSubmitForm} loading={onLoading} className="login-form">
                            <div className="form-group">
                                <label className="form-label">Usuario</label>
                                <div className="input-with-icon">
                                    <Icon name='user' className="input-icon" />
                                    <Form.Input
                                        fluid
                                        placeholder='Ingrese su usuario'
                                        value={user}
                                        className="hero-input"
                                        onChange={(e) => { setUser(e.target.value.replace(/\s/g, '')); setMsgError(''); }}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Contraseña</label>
                                <div className="input-with-icon">
                                    <Icon name='lock' className="input-icon" />
                                    <Form.Input
                                        fluid
                                        placeholder='Ingrese su contraseña'
                                        type='password'
                                        value={password}
                                        className="hero-input"
                                        onChange={(e) => { setPassword(e.target.value); setMsgError(''); }}
                                    />
                                </div>
                            </div>
                            
                            <Button className="hero-button" fluid size='large'>
                                Iniciar Sesión
                            </Button>
                            
                            {msgError && <div className="error-message">{msgError}</div>}
                        </Form>
                        
                        <div className="version-info">
                            <p>Versión UI {process.env.REACT_APP_SYSTEM_VERSION}</p>
                            <p>Kernel {process.env.REACT_APP_SYSTEM_REACTOR}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;