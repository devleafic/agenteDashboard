import React, { useState } from 'react';
import LogoImage from './../img/logo.png';
import axios from 'axios';
import './Login.css'; // Import custom CSS for additional styling
import { 
    Button, 
    Input, 
    Card, 
    CardBody, 
    CardHeader,
    Image,
    Divider,
    Chip,
    Spacer
} from "@heroui/react";

// Simple SVG Icons
const UserIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const LockIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const EyeIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const EyeSlashIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
    </svg>
);

const Login = () => {
    const [onLoading, setOnLoading] = useState(false);
    const [user, setUser] = useState('');
    const [password, setPassword] = useState('');
    const [msgError, setMsgError] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    const toggleVisibility = () => setIsVisible(!isVisible);

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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Main Login Card */}
                <Card className="w-full shadow-2xl border-0 bg-white/80 backdrop-blur-md">
                    <CardHeader className="flex flex-col items-center pb-0 pt-8">
                        <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-inner">
                            <Image
                                src={LogoImage}
                                alt="Logo"
                                width={120}
                                height={120}
                                className="object-contain hover:scale-105 transition-transform duration-300 drop-shadow-lg"
                                style={{ maxWidth: '120px', maxHeight: '120px' }}
                            />
                        </div>
                        <div className="text-center">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                                Bienvenido
                            </h1>
                            <p className="text-gray-600 text-sm mb-1">
                                WhatsApp for Business, Messenger, Instagram
                            </p>
                            <p className="text-gray-500 text-xs">
                                Livechat, Llamadas y más en una bandeja para equipos
                            </p>
                        </div>
                    </CardHeader>

                    <CardBody className="px-8 py-6">
                        <form onSubmit={onSubmitForm} className="space-y-6">
                            {/* Usuario Input */}
                            <Input
                                type="text"
                                label="Usuario"
                                placeholder="Ingrese su usuario"
                                value={user}
                                onChange={(e) => { setUser(e.target.value.replace(/\s/g, '')); setMsgError(''); }}
                                startContent={
                                    <div className="text-default-400">
                                        <UserIcon />
                                    </div>
                                }
                                variant="bordered"
                                size="lg"
                                classNames={{
                                    input: "text-base",
                                    inputWrapper: "border-gray-200 hover:border-blue-400 focus-within:border-blue-500 transition-colors"
                                }}
                                isRequired
                            />

                            {/* Contraseña Input */}
                            <Input
                                label="Contraseña"
                                placeholder="Ingrese su contraseña"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setMsgError(''); }}
                                startContent={
                                    <div className="text-default-400">
                                        <LockIcon />
                                    </div>
                                }
                                endContent={
                                    <button
                                        className="focus:outline-none text-default-400 hover:text-default-600 transition-colors"
                                        type="button"
                                        onClick={toggleVisibility}
                                    >
                                        {isVisible ? <EyeSlashIcon /> : <EyeIcon />}
                                    </button>
                                }
                                type={isVisible ? "text" : "password"}
                                variant="bordered"
                                size="lg"
                                classNames={{
                                    input: "text-base",
                                    inputWrapper: "border-gray-200 hover:border-blue-400 focus-within:border-blue-500 transition-colors"
                                }}
                                isRequired
                            />

                            {/* Error Message */}
                            {msgError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 animate-pulse">
                                    <p className="text-red-700 text-sm">{msgError}</p>
                                </div>
                            )}

                            <Spacer y={2} />

                            {/* Login Button */}
                            <Button
                                type="submit"
                                color="primary"
                                size="lg"
                                className="w-full font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                                isLoading={onLoading}
                                spinner={
                                    <svg
                                        className="animate-spin h-5 w-5 text-current"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                }
                            >
                                {onLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                            </Button>
                        </form>
                    </CardBody>
                </Card>

                <Spacer y={4} />

                {/* System Info Card */}
                <Card className="w-full bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                    <CardBody className="p-4">
                        <div className="flex flex-col items-center space-y-3">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <Chip
                                    color="primary"
                                    variant="flat"
                                    size="sm"
                                    className="font-medium"
                                >
                                    Versión UI {process.env.REACT_APP_SYSTEM_VERSION}
                                </Chip>
                            </div>
                            
                            <Divider className="w-16" />
                            
                            <div className="flex items-center space-x-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                <span className="text-xs text-gray-600 font-medium">
                                    Kernel {process.env.REACT_APP_SYSTEM_REACTOR}
                                </span>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default Login;