import { useState } from 'react';
import {
  Button,
  Input,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Divider,
  Link,
  Tooltip
} from "@heroui/react";
import { motion } from 'framer-motion';
import LogoImage from './../img/logo.png';
import axios from 'axios';
import './Login.css';

const UserIcon = () => (
  <svg className="w-5 h-5 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-5 h-5 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg className="w-5 h-5 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
  </svg>
);

const CHANNELS = [
  { icon: '💬', name: 'WhatsApp', count: '8 activas' },
  { icon: '🌐', name: 'Chat Web', count: '3 activas' },
  { icon: '📞', name: 'Voz', count: '1 activa' },
];

const Login = () => {
  const [onLoading, setOnLoading] = useState(false);
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [msgError, setMsgError] = useState('');
  const [isVisible, setIsVisible] = useState(false);

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
  };

  return (
    <div className="login-root">

      {/* ── Left brand panel ── */}
      <div className="login-brand-panel grain">
        {/* Malla flame + rejilla: el fondo de marca, en lugar de los
            cuatro blobs sky/violet/emerald anteriores. */}
        <div className="flame-mesh flame-mesh--faint" />
        <div className="grid-lines grid-lines--dark" />

        <div className="login-brand-content">
          <div className="login-brand-logo-wrap">
            <img src={LogoImage} alt="Inbox Central" className="login-brand-logo" />
          </div>

          <h1 className="login-brand-title">Tu bandeja<br /><em>inteligente</em></h1>
          <p className="login-brand-tagline">
            Responde, gestiona y resuelve con el soporte de IA en tiempo real
          </p>

          <div className="login-channel-cards">
            {CHANNELS.map(ch => (
              <div key={ch.name} className="login-channel-card">
                <span className="login-channel-icon">{ch.icon}</span>
                <span className="login-channel-name">{ch.name}</span>
                <span className="login-channel-count">{ch.count}</span>
              </div>
            ))}
          </div>

          <div className="login-metrics-row">
            <div className="login-metric">
              <span className="login-metric-value">12</span>
              <span className="login-metric-label">Convs. activas</span>
            </div>
            <div className="login-metric-divider" />
            <div className="login-metric">
              <span className="login-metric-value">3</span>
              <span className="login-metric-label">En cola</span>
            </div>
            <div className="login-metric-divider" />
            <div className="login-metric">
              <span className="login-metric-value">45s</span>
              <span className="login-metric-label">T. respuesta</span>
            </div>
          </div>

          <div className="login-kortex-badge">
            <span className="login-kortex-dot" />
            Copiloto Kortex activo · IA asistente
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="login-form-panel">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="login-form-wrap"
        >
          <Card className="login-card">
            <CardHeader className="login-card-header">
              <div className="login-card-logo-wrap">
                <img src={LogoImage} alt="Inbox Central" className="login-card-logo" />
              </div>
              <h1 className="login-card-title">Iniciar sesión</h1>
              <p className="login-card-subtitle">Espacio de trabajo del agente</p>
            </CardHeader>

            <Divider />

            <CardBody className="login-card-body">
              <form onSubmit={onSubmitForm} className="login-card-form">
                <div>
                  <label className="login-field-label">Usuario</label>
                  <Input
                    type="text"
                    variant="bordered"
                    size="lg"
                    isRequired
                    autoComplete="username"
                    placeholder="Ingresa tu usuario"
                    value={user}
                    onChange={(e) => { setUser(e.target.value.replace(/\s/g, '')); setMsgError(''); }}
                    startContent={<div className="pointer-events-none flex items-center"><UserIcon /></div>}
                    classNames={{
                      input: ["text-base", "text-ink", "placeholder:text-ink-400"],
                      inputWrapper: ["bg-cream-50", "border-hair", "hover:border-ink-400", "group-data-[focus=true]:!border-flame-ember"],
                    }}
                    radius="none"
                  />
                </div>

                <div>
                  <div className="login-field-header">
                    <label className="login-field-label">Contraseña</label>
                    <Link href="#" size="sm" className="login-forgot-link">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <Input
                    type={isVisible ? "text" : "password"}
                    variant="bordered"
                    size="lg"
                    isRequired
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setMsgError(''); }}
                    startContent={<div className="pointer-events-none flex items-center"><LockIcon /></div>}
                    endContent={
                      <button
                        className="focus:outline-none hover:opacity-80 transition-opacity"
                        type="button"
                        onClick={() => setIsVisible(!isVisible)}
                        aria-label={isVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {isVisible ? <EyeSlashIcon /> : <EyeIcon />}
                      </button>
                    }
                    classNames={{
                      input: ["text-base", "text-ink", "placeholder:text-ink-400"],
                      inputWrapper: ["bg-cream-50", "border-hair", "hover:border-ink-400", "group-data-[focus=true]:!border-flame-ember"],
                    }}
                    radius="none"
                  />
                </div>

                {msgError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="login-error"
                  >
                    {msgError}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  isLoading={onLoading}
                  spinner={
                    <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" />
                    </svg>
                  }
                  className="w-full login-submit-btn"
                  radius="none"
                >
                  {onLoading ? 'Iniciando sesión...' : 'Ingresar al espacio de trabajo'}
                </Button>
              </form>
            </CardBody>

            <CardFooter className="login-card-footer">
              <div className="login-ai-badge">
                <span className="login-ai-dot" />
                Copiloto IA activo
              </div>
              <div className="login-version">
                <Tooltip content="Versión actual del sistema" placement="top">
                  <span className="login-version-chip">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    v{process.env.REACT_APP_SYSTEM_VERSION} · {process.env.REACT_APP_SYSTEM_REACTOR || 'IBC'}
                  </span>
                </Tooltip>
              </div>
              <div className="login-copyright">
                © {new Date().getFullYear()} IBC. Todos los derechos reservados.
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

    </div>
  );
};

export default Login;
