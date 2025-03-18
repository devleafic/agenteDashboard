import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';

// Contexto para manejar las notificaciones en toda la aplicación
const NotificationContext = createContext();

// Límites y configuraciones para prevenir problemas de rendimiento
const MAX_QUEUE_SIZE = 50; // Previene problemas de memoria con muchas notificaciones
const NOTIFICATION_DEBOUNCE = 1000; // 1 segundo entre grupos de notificaciones
const SOUND_DEBOUNCE = 300; // 300ms entre sonidos para evitar superposición

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  // Cargar configuraciones guardadas de localStorage o usar valores predeterminados
  const loadSettings = useCallback(() => {
    try {
      const savedSettings = localStorage.getItem('chatNotificationSettings');
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
    } catch (error) {
      console.error('Error al cargar configuraciones de notificación:', error);
    }
    return {
      soundEnabled: true,
      browserNotificationsEnabled: false,
      notificationVolume: 80
    };
  }, []);

  // Estados para manejar las configuraciones de notificaciones
  const [soundEnabled, setSoundEnabled] = useState(loadSettings().soundEnabled);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(loadSettings().browserNotificationsEnabled);
  const [notificationVolume, setNotificationVolume] = useState(loadSettings().notificationVolume);
  
  // Referencias para manejar el estado sin causar re-renderizados
  const notificationSoundRef = useRef(null);
  const [notificationQueue, setNotificationQueue] = useState([]);
  const processingRef = useRef(false);
  const notificationTimeoutRef = useRef(null);
  const lastSoundPlayedRef = useRef(0);
  const soundInitializedRef = useRef(false);

  // Inicializar el sonido de notificación y verificar permisos
  useEffect(() => {
    // Función para inicializar el sonido
    const initializeSound = () => {
      if (!notificationSoundRef.current) {
        notificationSoundRef.current = new Audio('/notification-sound.mp3');
        notificationSoundRef.current.preload = 'auto';
      }
      soundInitializedRef.current = true;
    };

    // Verificar permisos de notificación del navegador
    const checkNotificationPermission = async () => {
      if ("Notification" in window) {
        try {
          const permission = await Notification.requestPermission();
          setBrowserNotificationsEnabled(permission === "granted" ? loadSettings().browserNotificationsEnabled : false);
        } catch (error) {
          console.error('Error al solicitar permisos de notificación:', error);
          setBrowserNotificationsEnabled(false);
        }
      } else {
        setBrowserNotificationsEnabled(false);
      }
    };
    
    // Inicializar sonido en respuesta a interacción del usuario
    const handleUserInteraction = () => {
      initializeSound();
      // Remover listeners después de la inicialización
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    // Agregar listeners para detectar interacción del usuario
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    checkNotificationPermission();
    
    // Limpieza al desmontar el componente
    return () => {
      if (notificationSoundRef.current) {
        notificationSoundRef.current.pause();
        notificationSoundRef.current.src = '';
      }
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [loadSettings]);

  // Reproducir sonido de notificación con límite de frecuencia
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled || !soundInitializedRef.current) return;

    const now = Date.now();
    if (now - lastSoundPlayedRef.current < SOUND_DEBOUNCE) {
      return;
    }

    try {
      const audio = notificationSoundRef.current;
      if (audio) {
        audio.volume = notificationVolume / 100;
        audio.currentTime = 0;
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Error al reproducir sonido:", error);
            // Si falla por falta de interacción, intentamos inicializar de nuevo
            soundInitializedRef.current = false;
          });
        }
        lastSoundPlayedRef.current = now;
      }
    } catch (error) {
      console.error("Error crítico al reproducir sonido:", error);
      soundInitializedRef.current = false;
    }
  }, [soundEnabled, notificationVolume]);

  // Mostrar notificación en el navegador
  const showBrowserNotification = useCallback((title, body, icon) => {
    if (!browserNotificationsEnabled || 
        !("Notification" in window) || 
        Notification.permission !== "granted" || 
        document.visibilityState === "visible") {
      return;
    }
    
    try {
      const notification = new Notification(title, {
        body: body,
        icon: icon || 'https://inboxcentralcdn.sfo3.cdn.digitaloceanspaces.com/assets/profilepic.jpg',
        silent: true // Manejamos el sonido por separado
      });
      
      notification.onclick = function() {
        window.focus();
        this.close();
      };
      
      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error("Error al mostrar notificación en el navegador:", error);
    }
  }, [browserNotificationsEnabled]);

  // Procesar cola de notificaciones
  const processNotificationQueue = useCallback(() => {
    if (notificationQueue.length === 0 || processingRef.current) {
      return;
    }

    processingRef.current = true;

    try {
      // Agrupar notificaciones similares
      const groups = notificationQueue.reduce((acc, notification) => {
        const key = notification.type || 'default';
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(notification);
        return acc;
      }, {});

      // Crear configuración para toast
      const toastConfig = {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      };

      // Procesar cada grupo
      Object.entries(groups).forEach(([type, notifications]) => {
        if (notifications.length === 1) {
          const notification = notifications[0];
          playNotificationSound();
          showBrowserNotification(
            notification.title,
            notification.body,
            notification.icon
          );
          
          toast.info(
            <div>
              <strong>{notification.title}</strong>
              <p>{notification.body}</p>
            </div>,
            toastConfig
          );
        } else {
          const groupTitle = `${notifications.length} nuevas notificaciones`;
          const groupBody = type === 'message' 
            ? `Tienes ${notifications.length} nuevos mensajes`
            : `Tienes ${notifications.length} notificaciones pendientes`;
          
          playNotificationSound();
          showBrowserNotification(groupTitle, groupBody);
          
          toast.info(
            <div>
              <strong>{groupTitle}</strong>
              <p>{groupBody}</p>
            </div>,
            toastConfig
          );
        }
      });
    } catch (error) {
      console.error("Error al procesar cola de notificaciones:", error);
    } finally {
      setNotificationQueue([]);
      processingRef.current = false;
    }
  }, [notificationQueue, playNotificationSound, showBrowserNotification]);

  // Procesar cola con límite de frecuencia
  useEffect(() => {
    if (notificationQueue.length > 0 && !processingRef.current) {
      notificationTimeoutRef.current = setTimeout(() => {
        processNotificationQueue();
      }, NOTIFICATION_DEBOUNCE);

      return () => {
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
        }
      };
    }
  }, [notificationQueue, processNotificationQueue]);

  // Agregar notificación a la cola con límite de tamaño
  const queueNotification = useCallback((title, body, type = 'default', icon) => {
    setNotificationQueue(prev => {
      if (prev.length >= MAX_QUEUE_SIZE) {
        console.warn('Se alcanzó el límite de tamaño de la cola de notificaciones, se elimina la notificación más antigua');
        return [...prev.slice(1), { title, body, type, icon }];
      }
      return [...prev, { title, body, type, icon }];
    });
  }, []);

  return (
    <NotificationContext.Provider value={{
      soundEnabled,
      setSoundEnabled,
      browserNotificationsEnabled,
      setBrowserNotificationsEnabled,
      notificationVolume,
      setNotificationVolume,
      queueNotification,
      playNotificationSound
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;