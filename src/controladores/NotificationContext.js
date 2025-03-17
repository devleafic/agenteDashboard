import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // Initialize notification sound
  useEffect(() => {
    notificationSound.preload = 'auto';
    
    // Check browser notification permission on load
    if ("Notification" in window && Notification.permission === "granted") {
      setBrowserNotificationsEnabled(loadSettings().browserNotificationsEnabled);
    } else {
      setBrowserNotificationsEnabled(false);
    }
    
    return () => {
      notificationSound.pause();
      notificationSound.currentTime = 0;
    };
  }, [notificationSound]);

  // Play notification sound
  const playNotificationSound = () => {
    if (soundEnabled) {
      notificationSound.volume = notificationVolume / 100;
      notificationSound.currentTime = 0;
      notificationSound.play().catch(error => console.error("Error playing notification sound:", error));
    }
  };

  // Show browser notification
  const showBrowserNotification = (title, body, icon) => {
    if (browserNotificationsEnabled && 
        "Notification" in window && 
        Notification.permission === "granted" && 
        document.visibilityState !== "visible") {
      
      const notification = new Notification(title, {
        body: body,
        icon: icon || 'https://inboxcentralcdn.sfo3.cdn.digitaloceanspaces.com/assets/profilepic.jpg'
      });
      
      notification.onclick = function() {
        window.focus();
        this.close();
      };
      
      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    }
  };

  return (
    <NotificationContext.Provider value={{
      soundEnabled,
      setSoundEnabled,
      browserNotificationsEnabled,
      setBrowserNotificationsEnabled,
      notificationVolume,
      setNotificationVolume,
      playNotificationSound,
      showBrowserNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;