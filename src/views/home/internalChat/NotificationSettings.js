import React, { useState, useEffect } from 'react';
import { Modal, Header, Button, Icon, Checkbox, Segment, Divider } from 'semantic-ui-react';
import { useNotifications } from '../../../controladores/NotificationContext';

const NotificationSettings = ({ open, onClose }) => {
  const { 
    soundEnabled, 
    setSoundEnabled, 
    browserNotificationsEnabled, 
    setBrowserNotificationsEnabled,
    notificationVolume,
    setNotificationVolume
  } = useNotifications();
  
  const [tempSettings, setTempSettings] = useState({
    soundEnabled: soundEnabled,
    browserNotificationsEnabled: browserNotificationsEnabled,
    notificationVolume: notificationVolume
  });
  
  // Update local state when context values change
  useEffect(() => {
    setTempSettings({
      soundEnabled,
      browserNotificationsEnabled,
      notificationVolume
    });
  }, [soundEnabled, browserNotificationsEnabled, notificationVolume]);

  const handleSave = () => {
    setSoundEnabled(tempSettings.soundEnabled);
    setBrowserNotificationsEnabled(tempSettings.browserNotificationsEnabled);
    setNotificationVolume(tempSettings.notificationVolume);
    
    // Save to localStorage for persistence
    localStorage.setItem('chatNotificationSettings', JSON.stringify({
      soundEnabled: tempSettings.soundEnabled,
      browserNotificationsEnabled: tempSettings.browserNotificationsEnabled,
      notificationVolume: tempSettings.notificationVolume
    }));
    
    onClose();
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("Este navegador no soporta notificaciones de escritorio");
      return;
    }
    
    const permission = await Notification.requestPermission();
    
    if (permission === "granted") {
      setTempSettings({
        ...tempSettings,
        browserNotificationsEnabled: true
      });
    } else {
      alert("Se requieren permisos para mostrar notificaciones");
      setTempSettings({
        ...tempSettings,
        browserNotificationsEnabled: false
      });
    }
  };

  const playTestSound = () => {
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = tempSettings.notificationVolume / 100;
    audio.play();
  };

  return (
    <Modal open={open} onClose={onClose} size="tiny">
      <Header icon="bell" content="Configuración de Notificaciones" />
      <Modal.Content>
        <Segment>
          <Header as="h4">Sonidos</Header>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <Checkbox 
              toggle 
              checked={tempSettings.soundEnabled} 
              onChange={() => setTempSettings({...tempSettings, soundEnabled: !tempSettings.soundEnabled})}
              label="Activar sonidos de notificación"
            />
            {tempSettings.soundEnabled && (
              <Button 
                icon="play" 
                size="mini" 
                circular 
                color="blue" 
                style={{ marginLeft: '10px' }} 
                onClick={playTestSound}
                title="Probar sonido"
              />
            )}
          </div>
          
          {tempSettings.soundEnabled && (
            <div>
              <label>Volumen: {tempSettings.notificationVolume}%</label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Icon name="volume down" />
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={tempSettings.notificationVolume} 
                  onChange={(e) => setTempSettings({...tempSettings, notificationVolume: parseInt(e.target.value)})}
                  style={{ flex: 1, margin: '0 10px' }}
                />
                <Icon name="volume up" />
              </div>
            </div>
          )}
        </Segment>
        
        <Divider />
        
        <Segment>
          <Header as="h4">Notificaciones del Navegador</Header>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Checkbox 
              toggle 
              checked={tempSettings.browserNotificationsEnabled} 
              onChange={() => {
                if (!tempSettings.browserNotificationsEnabled) {
                  requestNotificationPermission();
                } else {
                  setTempSettings({...tempSettings, browserNotificationsEnabled: false});
                }
              }}
              label="Mostrar notificaciones cuando la aplicación esté minimizada"
            />
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            Las notificaciones del navegador te alertarán de nuevos mensajes cuando no estés viendo la aplicación.
          </p>
        </Segment>
      </Modal.Content>
      <Modal.Actions>
        <Button color="red" onClick={onClose}>
          <Icon name="remove" /> Cancelar
        </Button>
        <Button color="green" onClick={handleSave}>
          <Icon name="checkmark" /> Guardar
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

export default NotificationSettings;