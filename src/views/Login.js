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
                        
                        <div style={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            backgroundColor: '#f7fafc',
                            padding: '16px',
                            borderRadius: '8px',
                            marginTop: '16px',
                            border: '1px solid #e2e8f0'
                         }}>
                            <div style={{ 
                                textAlign: 'center',
                                paddingBottom: '12px',
                                borderBottom: '1px solid #e2e8f0'
                             }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2c5282" strokeWidth="2">
                                        <path d="M2 6h20v12H2V6zm2 12h16V8H4v10z"/>
                                    </svg>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2c5282' }}>
                                        Versión UI {process.env.REACT_APP_SYSTEM_VERSION}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4a5568" strokeWidth="1.8">
                                    <path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 14.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13z"/>
                                </svg>
                                <span style={{ fontSize: '0.95rem', color: '#4a5568' }}>
                                    Kernel {process.env.REACT_APP_SYSTEM_REACTOR}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;