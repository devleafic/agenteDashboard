import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useReducer,
} from 'react';
import { addToast, ToastProvider } from '@heroui/toast';

/*******************************
 * Constants & Defaults
 ******************************/
const DEFAULT_SETTINGS = {
  soundEnabled: true,
  browserNotificationsEnabled: false,
  notificationVolume: 80,
};

const MAX_QUEUE_SIZE = 50; // Previene problemas de memoria
const NOTIFICATION_DEBOUNCE = 1000; // ms entre grupos de notificaciones
const SOUND_DEBOUNCE = 300; // ms entre sonidos para evitar superposición

/*******************************
 * Context Helpers
 ******************************/
const NotificationContext = createContext(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications debe usarse dentro de NotificationProvider');
  }
  return ctx;
};

/*******************************
 * LocalStorage Utils
 ******************************/
const loadSettings = () => {
  try {
    const saved = localStorage.getItem('chatNotificationSettings');
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch (err) {
    console.error('Error al cargar configuraciones de notificación:', err);
  }
  return DEFAULT_SETTINGS;
};

const saveSettings = (settings) => {
  try {
    localStorage.setItem('chatNotificationSettings', JSON.stringify(settings));
  } catch (err) {
    console.error('Error al guardar configuraciones de notificación:', err);
  }
};

/*******************************
 * Reducer para la cola
 ******************************/
const queueReducer = (state, action) => {
  switch (action.type) {
    case 'ADD': {
      const newState =
        state.length >= MAX_QUEUE_SIZE ? [...state.slice(1), action.payload] : [...state, action.payload];
      return newState;
    }
    case 'CLEAR':
      return [];
    default:
      return state;
  }
};

/*******************************
 * Hooks personalizados
 ******************************/
const useNotificationSound = (enabled, volume) => {
  const audioRef = useRef(null);
  const initializedRef = useRef(false);
  const lastPlayedRef = useRef(0);

  // Inicializar el audio tras la primera interacción del usuario
  useEffect(() => {
    const init = () => {
      if (!audioRef.current) {
        audioRef.current = new Audio('/notification-sound.mp3');
        audioRef.current.preload = 'auto';
      }
      initializedRef.current = true;
      document.removeEventListener('click', init);
      document.removeEventListener('touchstart', init);
    };
    document.addEventListener('click', init);
    document.addEventListener('touchstart', init);
    return () => {
      document.removeEventListener('click', init);
      document.removeEventListener('touchstart', init);
    };
  }, []);

  // Función para reproducir sonido
  const play = useCallback(() => {
    if (!enabled || !initializedRef.current) return;
    const now = Date.now();
    if (now - lastPlayedRef.current < SOUND_DEBOUNCE) return;

    try {
      const audio = audioRef.current;
      if (audio) {
        audio.volume = volume / 100;
        audio.currentTime = 0;
        audio.play().catch((e) => console.error('Error al reproducir sonido:', e));
        lastPlayedRef.current = now;
      }
    } catch (err) {
      addToast({ title: 'Error', description: 'Error al reproducir sonido', color: 'warning' });
      console.error('Error crítico al reproducir sonido:', err);
    }
  }, [enabled, volume]);

  return play;
};

const useBrowserNotification = (enabled) => {
  return useCallback(
    (title, body, icon) => {
      if (
        !enabled ||
        !('Notification' in window) ||
        Notification.permission !== 'granted' ||
        document.visibilityState === 'visible'
      ) {
        return;
      }

      try {
        const notification = new Notification(title, {
          body,
          icon: icon ||
            'https://inboxcentralcdn.sfo3.cdn.digitaloceanspaces.com/assets/profilepic.jpg',
          silent: true, // sonido manejado aparte
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
        setTimeout(() => notification.close(), 5000);
      } catch (err) {
        console.error('Error al mostrar notificación en el navegador:', err);
      }
    },
    [enabled]
  );
};

/*******************************
 * Provider
 ******************************/
export const NotificationProvider = ({ children }) => {
  // Configuración proveniente de LocalStorage
  const [settings, setSettings] = useState(loadSettings);
  const { soundEnabled, browserNotificationsEnabled, notificationVolume } = settings;

  // Persistencia automática
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Setters expuestos
  const setSoundEnabled = (v) => setSettings((s) => ({ ...s, soundEnabled: v }));
  const setBrowserNotificationsEnabled = (v) =>
    setSettings((s) => ({ ...s, browserNotificationsEnabled: v }));
  const setNotificationVolume = (v) => setSettings((s) => ({ ...s, notificationVolume: v }));

  // Cola de notificaciones
  const [queue, dispatch] = useReducer(queueReducer, []);

  // Helpers
  const playSound = useNotificationSound(soundEnabled, notificationVolume);
  const showBrowserNotification = useBrowserNotification(browserNotificationsEnabled);

  /*******************************
   * Procesamiento de la cola
   ******************************/
  const processingRef = useRef(false);
  const debounceRef = useRef(null);

  const processQueue = useCallback(() => {
    if (!queue.length || processingRef.current) return;
    processingRef.current = true;

    try {
      // Agrupar por tipo
      const groups = queue.reduce((acc, n) => {
        const key = n.type || 'default';
        acc[key] = acc[key] ? [...acc[key], n] : [n];
        return acc;
      }, {});

      Object.values(groups).forEach((notifications) => {
        if (notifications.length === 1) {
          const [n] = notifications;
          playSound();
          showBrowserNotification(n.title, n.body, n.icon);
          addToast({ title: n.title, description: n.body, color: 'secondary' });
        } else {
          const groupTitle = `${notifications.length} nuevas notificaciones`;
          const groupBody =
            notifications[0].type === 'message'
              ? `Tienes ${notifications.length} nuevos mensajes`
              : `Tienes ${notifications.length} notificaciones pendientes`;
          playSound();
          showBrowserNotification(groupTitle, groupBody);
          addToast({ title: groupTitle, description: groupBody, color: 'secondary' });
        }
      });
    } finally {
      dispatch({ type: 'CLEAR' });
      processingRef.current = false;
    }
  }, [queue, playSound, showBrowserNotification]);

  // Debounce al procesar la cola
  useEffect(() => {
    if (!queue.length) return;
    debounceRef.current = setTimeout(processQueue, NOTIFICATION_DEBOUNCE);
    return () => clearTimeout(debounceRef.current);
  }, [queue, processQueue]);

  /*******************************
   * API pública
   ******************************/
  const queueNotification = useCallback((title, body, type = 'default', icon) => {
    if (typeof title !== 'string' || typeof body !== 'string') {
      console.warn('Notificación inválida:', { title, body });
      return;
    }
    dispatch({ type: 'ADD', payload: { title, body, type, icon } });
  }, []);

  const contextValue = {
    soundEnabled,
    setSoundEnabled,
    browserNotificationsEnabled,
    setBrowserNotificationsEnabled,
    notificationVolume,
    setNotificationVolume,
    queueNotification,
    playSound,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
