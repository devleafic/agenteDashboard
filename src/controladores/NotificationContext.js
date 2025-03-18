import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  // Load saved settings from localStorage or use defaults
  const loadSettings = () => {
    const savedSettings = localStorage.getItem('chatNotificationSettings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    return {
      soundEnabled: true,
      browserNotificationsEnabled: false,
      notificationVolume: 80
    };
  };

  const [soundEnabled, setSoundEnabled] = useState(loadSettings().soundEnabled);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(loadSettings().browserNotificationsEnabled);
  const [notificationVolume, setNotificationVolume] = useState(loadSettings().notificationVolume);
  const [notificationSound] = useState(new Audio('/notification-sound.mp3'));
  const [notificationQueue, setNotificationQueue] = useState([]);
  const processingRef = useRef(false);
  const notificationTimeoutRef = useRef(null);

  // Initialize notification sound
  useEffect(() => {
    notificationSound.preload = 'auto';
    
    if ("Notification" in window && Notification.permission === "granted") {
      setBrowserNotificationsEnabled(loadSettings().browserNotificationsEnabled);
    } else {
      setBrowserNotificationsEnabled(false);
    }
    
    return () => {
      notificationSound.pause();
      notificationSound.currentTime = 0;
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (soundEnabled) {
      notificationSound.volume = notificationVolume / 100;
      notificationSound.currentTime = 0;
      notificationSound.play().catch(error => console.error("Error playing notification sound:", error));
    }
  }, [soundEnabled, notificationVolume, notificationSound]);

  // Show browser notification
  const showBrowserNotification = useCallback((title, body, icon) => {
    if (browserNotificationsEnabled && 
        "Notification" in window && 
        Notification.permission === "granted" && 
        document.visibilityState !== "visible") {
      
      const notification = new Notification(title, {
        body: body,
        icon: icon || 'https://inboxcentralcdn.sfo3.cdn.digitaloceanspaces.com/assets/profilepic.jpg',
        silent: true // We'll handle sound separately
      });
      
      notification.onclick = function() {
        window.focus();
        this.close();
      };
      
      setTimeout(() => notification.close(), 5000);
    }
  }, [browserNotificationsEnabled]);

  // Process notification queue
  const processNotificationQueue = useCallback(() => {
    if (notificationQueue.length === 0 || processingRef.current) {
      return;
    }

    processingRef.current = true;

    // Group similar notifications
    const groups = notificationQueue.reduce((acc, notification) => {
      const key = notification.type || 'default';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(notification);
      return acc;
    }, {});

    // Process each group
    Object.entries(groups).forEach(([type, notifications]) => {
      if (notifications.length === 1) {
        const notification = notifications[0];
        playNotificationSound();
        showBrowserNotification(
          notification.title,
          notification.body,
          notification.icon
        );
      } else {
        const groupTitle = `${notifications.length} nuevas notificaciones`;
        const groupBody = type === 'message' 
          ? `Tienes ${notifications.length} nuevos mensajes`
          : `Tienes ${notifications.length} notificaciones pendientes`;
        
        playNotificationSound();
        showBrowserNotification(groupTitle, groupBody);
      }
    });

    setNotificationQueue([]);
    processingRef.current = false;
  }, [notificationQueue, playNotificationSound, showBrowserNotification]);

  // Queue processor with debounce
  useEffect(() => {
    if (notificationQueue.length > 0 && !processingRef.current) {
      notificationTimeoutRef.current = setTimeout(() => {
        processNotificationQueue();
      }, 1000);

      return () => {
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
        }
      };
    }
  }, [notificationQueue, processNotificationQueue]);

  // Queue a new notification
  const queueNotification = useCallback((title, body, type = 'default', icon) => {
    setNotificationQueue(prev => [...prev, { title, body, type, icon }]);
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
      playNotificationSound,
      showBrowserNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;