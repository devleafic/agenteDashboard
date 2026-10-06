import { useState } from 'react';
import {
  Button,
  Input,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Divider,
} from "@heroui/react";
import { MessageCircleQuestion, Smile, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import KortexFace from '../components/KortexFace';
import { CHANNEL_PALETTE } from '../styles/channelPalette';
import useLoginRequest from '../hooks/useLoginRequest';
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

/* Login IA-first: la protagonista es Kortex y lo que hace por el agente.
   Antes este panel mostraba "12 convs. activas", "3 en cola", "45s" y
   "8 activas" por canal, todos fijos en el codigo, mas un "Copiloto IA
   activo" que no consultaba nada: en una pantalla publica, numeros que
   parecen en vivo y no lo son mienten. Cada beneficio de abajo es una
   accion real del panel Copilot IA (Preguntar, Clasificar, tono). */
const BENEFITS = [
  { Icon: MessageCircleQuestion, label: 'Pregúntale a Kortex sobre cada conversación' },
  { Icon: Tag,                   label: 'Clasifica el motivo en un clic' },
  { Icon: Smile,                 label: 'El tono del cliente, a la vista' },
];

// Los puntos son colores de marcas ajenas; la voz es nuestra y va en flame.
const CHANNELS = [
  { label: 'WhatsApp',  color: CHANNEL_PALETTE.whatsapp },
  { label: 'Messenger', color: CHANNEL_PALETTE.messenger },
  { label: 'Instagram', color: CHANNEL_PALETTE.instagram },
  { label: 'Telegram',  color: CHANNEL_PALETTE.telegram },
  { label: 'Web',       color: CHANNEL_PALETTE.webchat },
  { label: 'Voz',       color: 'var(--f3)' },
];

const Login = () => {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  const { submitLogin, onLoading, retrySeconds, msgError, setMsgError } = useLoginRequest('/agent/login', (body) => {
    window.localStorage.setItem('sdToken', body.token);
    window.localStorage.setItem('myName', body.name);
    window.location.href = '/';
  });
  const onSubmitForm = async (event) => {
    event.preventDefault();
    if (!user.trim() || !password.length) {
      setMsgError('Ingresa tu usuario y contraseña.');
      return;
    }
    await submitLogin(user, password);
  };

  return (
    <div className="login-root">

      {/* ── Panel de marca: Kortex al frente ── */}
      <div className="login-brand-panel grain">
        <div className="flame-mesh flame-mesh--faint" />
        <div className="grid-lines grid-lines--dark" />

        <div className="login-brand-content">
          <span className="login-kortex-mark" aria-hidden="true"><KortexFace /></span>
          <p className="login-brand-eyebrow">Inbox Central · Espacio del agente</p>
          <h1 className="login-brand-title">Atiende con un <em>copiloto</em></h1>
          <p className="login-brand-tagline">
            Kortex te acompaña en cada conversación: entiende el caso, lee el tono del cliente y te sugiere cómo responder.
          </p>

          <figure className="login-demo">
            <figcaption className="login-demo-label">Ejemplo</figcaption>
            <p className="login-demo-customer">
              Mi pedido de ayer no ha llegado y ya pagué.
              <span className="login-demo-tone">Tono negativo</span>
            </p>
            <p className="login-demo-answer">
              <span className="login-demo-avatar" aria-hidden="true"><KortexFace /></span>
              <span>Discúlpate, confirma el número de pedido y comparte el estado de la entrega antes de cerrar.</span>
            </p>
          </figure>

          <ul className="login-benefits">
            {BENEFITS.map(({ Icon, label }) => (
              <li key={label}><Icon aria-hidden="true" />{label}</li>
            ))}
          </ul>

          <p className="login-channels-line">
            <span>Funciona en</span>
            {CHANNELS.map(({ label, color }) => (
              <span key={label} className="login-channel">
                <span className="login-channel-dot" style={{ background: color }} aria-hidden="true" />
                {label}
              </span>
            ))}
          </p>
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
              <p className="login-card-brand">
                <span className="login-card-mark" aria-hidden="true"><KortexFace /></span>
                Inbox Central
              </p>
              <h2 className="login-card-title">Espacio del agente</h2>
              <p className="login-card-subtitle">Inicia sesión para continuar</p>
            </CardHeader>

            <Divider />

            <CardBody className="login-card-body">
              <form onSubmit={onSubmitForm} className="login-card-form">
                <div>
                  <label htmlFor="agent-username" className="login-field-label">Usuario</label>
                  <Input
                    id="agent-username"
                    type="text"
                    variant="bordered"
                    size="lg"
                    isRequired
                    autoComplete="username"
                    maxLength={254}
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
                  {/* "¿Olvidaste tu contraseña?" apuntaba a "#": no hay flujo
                      de recuperacion. La ayuda honesta va en el pie. */}
                  <label htmlFor="agent-password" className="login-field-label">Contraseña</label>
                  <Input
                    id="agent-password"
                    type={isVisible ? "text" : "password"}
                    variant="bordered"
                    size="lg"
                    isRequired
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                    maxLength={1024}
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
                    role="alert"
                  >
                    {msgError}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  isLoading={onLoading}
                  isDisabled={onLoading || retrySeconds > 0}
                  spinner={
                    <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" />
                    </svg>
                  }
                  className="w-full login-submit-btn"
                  radius="none"
                >
                  {retrySeconds > 0 ? `Reintentar en ${retrySeconds} s` : onLoading ? 'Iniciando sesión...' : 'Ingresar al espacio de trabajo'}
                </Button>
              </form>
            </CardBody>

            <CardFooter className="login-card-footer">
              <p className="login-access-help">
                ¿Sin acceso? Pide a tu supervisor que restablezca tu contraseña.
              </p>
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
