import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

export default function useLoginRequest(endpoint, onSuccess) {
  const pending = useRef(false);
  const retryUntil = useRef(0);
  const [onLoading, setOnLoading] = useState(false);
  const [retrySeconds, setRetrySeconds] = useState(0);
  const [msgError, setMsgError] = useState('');

  useEffect(() => {
    if (!retrySeconds) return undefined;
    const timer = setInterval(() => {
      setRetrySeconds(Math.max(0, Math.ceil((retryUntil.current - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [retrySeconds]);

  const submitLogin = async (user, password) => {
    if (pending.current || Date.now() < retryUntil.current) return;
    pending.current = true;
    setOnLoading(true);
    setMsgError('');
    try {
      const response = await axios.post(process.env.REACT_APP_CENTRALITA + endpoint,
        { user, password }, { timeout: 15000 });
      const body = response.data?.body;
      if (body?.success && typeof body.token === 'string' && body.token) {
        onSuccess(body);
      } else {
        setMsgError('Usuario o contraseña incorrectos.');
      }
    } catch (error) {
      if (error.response?.status === 429) {
        const seconds = Number(error.response.data?.body?.retryAfterSeconds
          || error.response.headers?.['retry-after']);
        const wait = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 60;
        retryUntil.current = Date.now() + wait * 1000;
        setRetrySeconds(wait);
        setMsgError('Demasiados intentos. Espera antes de volver a iniciar sesión.');
      } else {
        setMsgError('No fue posible iniciar sesión. Intenta más tarde.');
      }
    } finally {
      pending.current = false;
      setOnLoading(false);
    }
  };
  return { submitLogin, onLoading, retrySeconds, msgError, setMsgError };
}
