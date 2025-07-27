import React, { useState } from 'react';
import LogoImage from './../img/logo.png';
import axios from 'axios';
import { 
    Button, 
    Input, 
    Card, 
    CardBody, 
    CardHeader,
    Image,
    Divider,
    Chip,
    Spacer,
    Link,
    Tooltip
} from "@heroui/react";

// Simple SVG Icons with improved styling
const UserIcon = () => (
    <svg className="w-5 h-5 text-default-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const LockIcon = () => (
    <svg className="w-5 h-5 text-default-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const EyeIcon = () => (
    <svg className="w-5 h-5 text-default-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const EyeSlashIcon = () => (
    <svg className="w-5 h-5 text-default-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
    </svg>
);

const Login = () => {
    const [onLoading, setOnLoading] = useState(false);
    const [user, setUser] = useState('');
    const [password, setPassword] = useState('');
    const [msgError, setMsgError] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const isBeta = process.env.REACT_APP_ISBETA === 'true';

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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 overflow-hidden">
            <div className="w-full max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 ease-out">
                {/* Main Login Card */}
                <Card className="w-full shadow-xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:shadow-primary/20">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                    
                    <CardHeader className="flex flex-col items-center pb-2 pt-8 px-8">
                        <div className="mb-4 p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-inner border border-blue-100">
                            <Image
                                src={LogoImage}
                                alt="Logo"
                                width={100}
                                height={100}
                                className="object-contain hover:scale-105 transition-transform duration-300"
                                style={{ maxWidth: '100px', maxHeight: '100px' }}
                            />
                        </div>
                        <div className="text-center space-y-1">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
                                Iniciar Sesión
                            </h1>
                            
                            <p className="text-sm text-default-500">
                                Ingresa tus credenciales para continuar
                            </p>
                            <p className="text-xs text-default-400">
                                Livechat, Llamadas y más en una bandeja para equipos
                            </p>
                            {isBeta && (
                                <div className="pt-1">
                                    <Chip color="danger" variant="flat" size="sm" className="font-medium">
                                        VERSIÓN BETA 4
                                    </Chip>
                                </div>
                            )}
                        </div>
                    </CardHeader>

                    <CardBody className="px-8 pt-4 pb-8">
                        <form onSubmit={onSubmitForm} className="space-y-5">
                            {/* Usuario Input */}
                            <Input
                                type="text"
                                label="Usuario"
                                placeholder="Ingrese su usuario"
                                value={user}
                                onChange={(e) => { setUser(e.target.value.replace(/\s/g, '')); setMsgError(''); }}
                                startContent={
                                    <div className="pointer-events-none flex items-center">
                                        <UserIcon />
                                    </div>
                                }
                                variant="bordered"
                                size="lg"
                                classNames={{
                                    input: "text-base",
                                    inputWrapper: "h-14 border-default-200 hover:border-primary/50 focus-within:!border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300",
                                    label: "text-foreground/70"
                                }}
                                isRequired
                                radius="lg"
                            />

                            {/* Contraseña Input */}
                            <Input
                                label="Contraseña"
                                placeholder="Ingrese su contraseña"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setMsgError(''); }}
                                startContent={
                                    <div className="pointer-events-none flex items-center">
                                        <LockIcon />
                                    </div>
                                }
                                endContent={
                                    <button
                                        className="focus:outline-none hover:opacity-80 transition-opacity"
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
                                    inputWrapper: "h-14 border-default-200 hover:border-primary/50 focus-within:!border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300",
                                    label: "text-foreground/70"
                                }}
                                isRequired
                                radius="lg"
                            />

                            {/* Forgot Password Link */}
                            <div className="flex justify-end -mt-2">
                                <Link href="#" size="sm" className="text-sm text-primary hover:opacity-80">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>

                            {/* Error Message */}
                            {msgError && (
                                <div className="bg-danger-50 border border-danger-200 rounded-xl p-3 animate-fade-in">
                                    <p className="text-danger-700 text-sm font-medium text-center">{msgError}</p>
                                </div>
                            )}

                            <Spacer y={1} />

                            {/* Login Button */}
                            <Button
                                type="submit"
                                color="primary"
                                size="lg"
                                className="w-full font-medium h-12 text-base bg-gradient-to-r from-blue-600 to-purple-600 shadow-md hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
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
                                radius="lg"
                            >
                                {onLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                            </Button>
                        </form>
                    </CardBody>
                </Card>

                {/* System Info Card */}
                <Card className="w-full bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                    <CardBody className="p-3">
                        <div className="flex items-center justify-around">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <Tooltip content="Versión actual del sistema" placement="top">
                                    <Chip
                                        color="primary"
                                        variant="flat"
                                        size="sm"
                                        className="font-medium cursor-help"
                                    >
                                        v{process.env.REACT_APP_SYSTEM_VERSION}
                                    </Chip>
                                </Tooltip>
                            </div>
                            
                            <Divider orientation="vertical" className="h-5" />
                            
                            <div className="flex items-center space-x-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                <span className="text-xs text-default-600 font-medium">
                                    {process.env.REACT_APP_SYSTEM_REACTOR || 'Sistema de gestión'}
                                </span>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-xs text-default-500">
                        &copy; {new Date().getFullYear()} IBC. Todos los derechos reservados
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;