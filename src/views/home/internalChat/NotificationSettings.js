import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../../controladores/NotificationContext';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Button } from '@heroui/button';
import { Switch } from '@heroui/switch';
import { Slider } from '@heroui/slider';
import { Divider } from '@heroui/divider';

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

  const handleBrowserNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("Este navegador no soporta notificaciones de escritorio");
      return;
    }
    
    if (!tempSettings.browserNotificationsEnabled) {
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
    } else {
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
    <Modal isOpen={open} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <i className="ri-notification-3-line text-xl"></i>
          <span className="text-lg font-semibold">Configuración de Notificaciones</span>
        </ModalHeader>
        <ModalBody className="space-y-4 p-4">
          <div className="rounded-lg border border-hair p-4">
            <h4 className="mb-4 text-sm font-medium text-ink-600">Sonidos</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Switch 
                  isSelected={tempSettings.soundEnabled}
                  onValueChange={(isSelected) => setTempSettings({...tempSettings, soundEnabled: isSelected})}
                  className={tempSettings.soundEnabled ? 'bg-primary-500' : 'bg-cream-300'}
                />
                <span className="ml-2 text-sm text-ink-600">
                  Activar sonidos de notificación
                </span>
              </div>
              
              {tempSettings.soundEnabled && (
                <div className="space-y-3 pl-10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ink-600">
                      Volumen: {tempSettings.notificationVolume}%
                    </span>
                    <Button 
                      size="sm"
                      variant="flat"
                      onPress={playTestSound}
                      startContent={<i className="ri-volume-up-line"></i>}
                      className="ml-2"
                    >
                      Probar
                    </Button>
                  </div>
                  <Slider
                    aria-label="Volumen"
                    value={tempSettings.notificationVolume}
                    onChange={(value) => setTempSettings({...tempSettings, notificationVolume: value})}
                    minValue={0}
                    maxValue={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-ink-500 px-1">
                    <span>Bajo</span>
                    <span>Alto</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <Divider className="my-2" />
          
          <div className="rounded-lg border border-hair p-4">
            <h4 className="mb-4 text-sm font-medium text-ink-600">Notificaciones del navegador</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Switch 
                  isSelected={tempSettings.browserNotificationsEnabled}
                  onValueChange={handleBrowserNotificationPermission}
                  className={tempSettings.browserNotificationsEnabled ? 'bg-primary-500' : 'bg-cream-300'}
                />
                <span className="ml-2 text-sm text-ink-600">
                  Mostrar notificaciones cuando la aplicación esté minimizada
                </span>
              </div>
              <p className="text-xs text-ink-500 pl-10">
                Las notificaciones del navegador te alertarán de nuevos mensajes cuando no estés viendo la aplicación.
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="flex justify-end gap-2 p-4 border-t border-hair">
          <Button variant="light" onPress={onClose} className="px-4">
            Cancelar
          </Button>
          <Button color="primary" onPress={handleSave} className="px-6">
            Guardar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default NotificationSettings;