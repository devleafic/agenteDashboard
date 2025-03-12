import React, { useState } from 'react';
import { useSocket } from '../../../controladores/InternalChatContext';
import { Checkbox, Dropdown, Form, Header, Icon, Segment, Button, Input, Slider } from 'semantic-ui-react';

const NotificationSettings = () => {
  const {
    notificationSettings,
    toggleBrowserNotifications,
    toggleNotificationSound,
    toggleNotificationGrouping,
    toggleDoNotDisturb,
    updateNotificationTimeout,
    updateNotificationVolume,
    notificationSoundRef
  } = useSocket();
  
  // State to track volume slider value
  const [volumeValue, setVolumeValue] = useState(notificationSettings.notificationVolume * 100);

  const timeoutOptions = [
    { key: '3000', text: '3 seconds', value: 3000 },
    { key: '5000', text: '5 seconds', value: 5000 },
    { key: '10000', text: '10 seconds', value: 10000 },
    { key: '15000', text: '15 seconds', value: 15000 },
  ];

  return (
    <Segment>
      <Header as='h3'>
        <Icon name='bell' />
        <Header.Content>
          Configuración de Notificaciones
          <Header.Subheader>Gestiona tus preferencias de notificaciones</Header.Subheader>
        </Header.Content>
      </Header>

      <Form>
        <Form.Field>
          <Checkbox 
            toggle
            label='Browser Notifications'
            checked={notificationSettings.browserNotifications}
            onChange={toggleBrowserNotifications}
          />
          <p style={{ fontSize: '0.8em', color: 'gray', marginLeft: '1.5em' }}>
            Recibe notificaciones incluso cuando el navegador está en segundo plano
          </p>
        </Form.Field>

        <Form.Field>
          <Checkbox 
            toggle
            label='Sonido de notificación'
            checked={notificationSettings.soundEnabled}
            onChange={toggleNotificationSound}
          />
          <p style={{ fontSize: '0.8em', color: 'gray', marginLeft: '1.5em' }}>
            Reproduce un sonido cuando llega un nuevo mensaje
          </p>
        </Form.Field>

        <Form.Field>
          <Checkbox 
            toggle
            label='Notificaciones agrupadas'
            checked={notificationSettings.groupNotifications}
            onChange={toggleNotificationGrouping}
          />
          <p style={{ fontSize: '0.8em', color: 'gray', marginLeft: '1.5em' }}>
            Agrupa varias notificaciones del mismo chat para reducir el desorden
          </p>
        </Form.Field>

        <Form.Field>
          <Checkbox 
            toggle
            label='Do Not Disturb'
            checked={notificationSettings.doNotDisturb}
            onChange={toggleDoNotDisturb}
          />
          <p style={{ fontSize: '0.8em', color: 'gray', marginLeft: '1.5em' }}>
            Temporalemente desactiva todas las notificaciones
          </p>
        </Form.Field>

        <Form.Field>
          <label>Duracion de la notificación</label>
          <Dropdown
            selection
            options={timeoutOptions}
            value={notificationSettings.notificationTimeout}
            onChange={(_, data) => updateNotificationTimeout(data.value)}
          />
        </Form.Field>

        {notificationSettings.soundEnabled && (
          <Form.Field>
            <label>Notification Volume: {volumeValue}%</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Icon name='volume down' />
              <div style={{ flex: 1, margin: '0 10px' }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volumeValue}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value);
                    setVolumeValue(newValue);
                    updateNotificationVolume(newValue / 100);
                  }}
                  style={{ width: '100%' }}
                />
              </div>
              <Icon name='volume up' />
              <Button 
                icon='play' 
                size='mini' 
                onClick={() => {
                  // Test the notification sound with current volume
                  notificationSoundRef.current.volume = notificationSettings.notificationVolume;
                  notificationSoundRef.current.currentTime = 0;
                  notificationSoundRef.current.play().catch(error => {
                    console.log('Error playing test notification sound:', error);
                  });
                }}
                style={{ marginLeft: '10px' }}
                content='Test'
              />
            </div>
          </Form.Field>
        )}
      </Form>
    </Segment>
  );
};

export default NotificationSettings;
