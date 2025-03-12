import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import { playNotificationSound } from '../views/home/internalChat/NotificationSound';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [inboxList, setInboxList] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [activitiesUsers, setActivitiesUsers] = useState({});
  const [notificationSettings, setNotificationSettings] = useState(() => {
    const savedSettings = localStorage.getItem('teamChatNotificationSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      browserNotifications: true,
      soundEnabled: true,
      groupNotifications: true,
      notificationTimeout: 5000, // 5 seconds
      doNotDisturb: false,
      mutedChats: [],
      lastNotificationTime: {}, // Track last notification time per chat
      notificationBuffer: {}, // Buffer for grouping notifications,
      notificationVolume: 0.5, // Default volume for notification sounds
    };
  });
  const [pendingNotifications, setPendingNotifications] = useState({});
  const notificationSoundRef = useRef(new Audio('/sounds/notification.mp3'));

  // Request permission for browser notifications when component mounts
  useEffect(() => {
    if (notificationSettings.browserNotifications && "Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          console.log('Notification permission:', permission);
        });
      }
    }
  }, [notificationSettings.browserNotifications]);
  
  // Track the number of sounds played in a short period to avoid sound spam
  const [recentSoundCount, setRecentSoundCount] = useState(0);
  
  // Reset the sound counter every 5 seconds
  useEffect(() => {
    const soundResetInterval = setInterval(() => {
      setRecentSoundCount(0);
    }, 5000);
    
    return () => clearInterval(soundResetInterval);
  }, []);

  // Save notification settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('teamChatNotificationSettings', JSON.stringify(notificationSettings));
  }, [notificationSettings]);
  
  // Process pending notifications every 2 seconds if grouping is enabled
  useEffect(() => {
    if (!notificationSettings.groupNotifications) return;
    
    const interval = setInterval(() => {
      // Process notifications
      setPendingNotifications(prev => {
        const now = Date.now();
        const updated = {...prev};
        let hasChanges = false;

        // Process each chat's pending notifications
        Object.keys(updated).forEach(chatId => {
          const notification = updated[chatId];
          const timeSinceUpdate = now - notification.timestamp;

          // If it's been more than 2 seconds since the last message in this chat
          if (timeSinceUpdate > 2000) {
            // Show grouped notification
            const notificationText = notification.count > 1 
              ? `${notification.count} new messages` 
              : notification.messageType === 'text' 
                ? notification.lastMessage 
                : `Sent a ${notification.messageType}`;

            // Show toast notification
            toast.info(`${notification.senderName}: ${notificationText}`, {
              position: "top-right",
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });

            // Check if browser notifications are enabled and not in Do Not Disturb mode
            if (notificationSettings.browserNotifications && !notificationSettings.doNotDisturb) {
              // Check if the chat is not muted
              if (!notificationSettings.mutedChats.includes(chatId)) {
                // Check if we have permission to show notifications
                if (Notification.permission === "granted") {
                  const notification = new Notification(notification && notification.senderName ? notification.senderName : 'New Msg', {
                    body: notificationText,
                    icon: '/logo192.png', // Add your app icon path here
                  });

                  // Close notification after timeout
                  setTimeout(() => notification.close(), notificationSettings.notificationTimeout);
                }
              }
            }
            
            // Play notification sound if enabled and not in Do Not Disturb mode
            // Limit to 3 sounds in a 5-second period
            if (notificationSettings.soundEnabled && !notificationSettings.doNotDisturb && recentSoundCount < 3) {
              // Set the volume based on user preference
              notificationSoundRef.current.volume = notificationSettings.notificationVolume;
              
              // Play the sound
              notificationSoundRef.current.currentTime = 0;
              notificationSoundRef.current.play().catch(error => {
                console.log('Error playing notification sound:', error);
              });
              
              // Increment the sound counter
              setRecentSoundCount(prev => prev + 1);
            }

            // Update last notification time
            setNotificationSettings(prev => ({
              ...prev,
              lastNotificationTime: {
                ...prev.lastNotificationTime,
                [chatId]: now
              }
            }));

            // Remove this chat from pending notifications
            delete updated[chatId];
            hasChanges = true;
          }
        });

        // Only update state if we made changes
        return hasChanges ? updated : prev;
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, [notificationSettings.groupNotifications, notificationSettings.browserNotifications, 
      notificationSettings.soundEnabled, notificationSettings.doNotDisturb, 
      notificationSettings.mutedChats, notificationSettings.notificationTimeout, 
      notificationSettings.notificationVolume]);

  const getInboxChat = (newSocket) => {
    newSocket.emit('getInboxChat', {token: window.localStorage.getItem('sdToken')}, (data) => {
        console.log({data});
      
        let arraychats = data.body.chats.map(chat => chat);
        setInboxList(arraychats)
        //setInboxList(data.body.chats)
        setUnreadMessages(data.body.countUnread);
    });
  }
/*
useEffect(() => { 
  console.log('InboxList', inboxList)
  console.log(inboxList.length > 0 ? 'InboxList tiene datos' : 'InboxList no tiene datos')
}
, [inboxList]); 
*/
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_INTERNALCHAT, {
        transports : ['websocket'],
        query : {
            token : window.localStorage.getItem('sdToken')
        }
    });

    newSocket.on('connect', () => {
        if (newSocket.connected) {
          toast.success('Conectado a TeamChat', {
            position: "top-center",
            autoClose: 2000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
            theme: "dark",
            });
          console.log('Conectado al servidor de Socket.IO');

          let lastActivitie = window.sessionStorage.getItem('lastActivitie');
          if(lastActivitie){
            console.log('Enviando actividad al servidor', lastActivitie);
            newSocket.emit('setActivitie', {activitie : lastActivitie, token: window.localStorage.getItem('sdToken')}, (data) => {});
          }

          setSocket(newSocket);
          getInboxChat(newSocket);
        }else {
          console.log('No se pudo conectar al servidor de TeamChat', );
          toast.error('No se pudo conectar al servidor de TeamChat');
        }
    });

    newSocket.on('newChat',(data) => {
      let inboxarray = [];
      newSocket.emit('getInboxChat', {token: window.localStorage.getItem('sdToken')}, (chats) => {
          //console.log({chats});
          setInboxList(chats.body.chats)
          setUnreadMessages(chats.body.countUnread); 
          inboxarray = chats.body.chats.map(chat => chat);

          // Buscamos si ya existe
        const isExists = inboxarray.find((x) => {
          return x._id === data.body.chat._id;
        });

        if(!isExists){
          setInboxList((prevInboxList) => {
            return [...prevInboxList, data.body.chat]
          });
        }
      });
     
     

    });

    // Validamos la actividad de mi inbox
    let timerActivities = setInterval(() => {
        setInboxList((prevInboxList) => {
          const myContacts = []
          prevInboxList.forEach((ch) => {
            ch.members.forEach((x) => {
              myContacts.push(x.user._id);
            });
          })
          // console.log('Consultando actividad de mi inbox', {myContacts});
          
          // Vamos al server por las actividades
          newSocket.emit('getActivitiesInbox', {
            contacts : myContacts
          },(data) => {
            // console.log('contactos actividades',data);
            setActivitiesUsers(data);
          });

          return prevInboxList;
        });
    }, 5000);

    // Function to play notification sound
    const playSound = () => {
      if (notificationSettings.soundEnabled && !notificationSettings.doNotDisturb && recentSoundCount < 3) {
        // Set the volume based on user preference
        notificationSoundRef.current.volume = notificationSettings.notificationVolume;
        
        // Play the sound
        notificationSoundRef.current.currentTime = 0;
        notificationSoundRef.current.play().catch(error => {
          console.log('Error playing notification sound:', error);
        });
        
        // Increment the sound counter
        setRecentSoundCount(prev => prev + 1);
      }
    };

    // Function to show browser notification
    const showBrowserNotification = (title, body, chatId) => {
      if (!notificationSettings.browserNotifications || notificationSettings.doNotDisturb) {
        return;
      }

      // Check if the chat is muted
      if (notificationSettings.mutedChats.includes(chatId)) {
        return;
      }

      // Check if we have permission to show notifications
      if (Notification.permission === "granted") {
        try {
          const notification = new Notification(title, {
            body: body,
            icon: '/logo192.png', // Add your app icon path here
            tag: chatId, // Use tag to replace existing notifications from the same chat
          });

          // Close notification after timeout
          setTimeout(() => notification.close(), notificationSettings.notificationTimeout);

          // Handle notification click - focus the window and open the chat
          notification.onclick = function() {
            window.focus();
            // You can add logic here to navigate to the specific chat
            notification.close();
          };
        } catch (error) {
          console.error('Error showing browser notification:', error);
        }
      } else if (Notification.permission !== "denied") {
        // If permission is not granted or denied, request it
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            // Try again after permission is granted
            showBrowserNotification(title, body, chatId);
          }
        });
      }
    };

    // Function to handle notifications with throttling and grouping
    const handleNotification = (chatId, senderName, message, messageType) => {
      const now = Date.now();
      const lastNotificationTime = notificationSettings.lastNotificationTime[chatId] || 0;
      const timeSinceLastNotification = now - lastNotificationTime;
      const THROTTLE_TIME = 3000; // 3 seconds between notifications from same chat

      // Update unread count regardless of notification settings
      setUnreadMessages((prevUnreadMessages) => {
        return {...prevUnreadMessages, [chatId]: (prevUnreadMessages && prevUnreadMessages[chatId] ? prevUnreadMessages[chatId] + 1 : 1)};
      });

      // Don't show notifications if do not disturb is on or chat is muted
      if (notificationSettings.doNotDisturb || notificationSettings.mutedChats.includes(chatId)) {
        return;
      }

      // If grouping is enabled, buffer notifications
      if (notificationSettings.groupNotifications) {
        setPendingNotifications(prev => {
          const updated = {...prev};
          if (!updated[chatId]) {
            updated[chatId] = {
              count: 1,
              senderName,
              lastMessage: message,
              messageType,
              timestamp: now
            };
          } else {
            updated[chatId].count += 1;
            updated[chatId].lastMessage = message;
            updated[chatId].timestamp = now;
          }
          return updated;
        });

        // If we should throttle this notification based on time
        if (timeSinceLastNotification < THROTTLE_TIME) {
          return;
        }
      } else {
        // If not grouping, show notification immediately if not throttled
        if (timeSinceLastNotification >= THROTTLE_TIME) {
          // Update last notification time
          setNotificationSettings(prev => ({
            ...prev,
            lastNotificationTime: {
              ...prev.lastNotificationTime,
              [chatId]: now
            }
          }));

          // Show toast notification
          toast.info(`${senderName}: ${messageType === 'text' ? message : `Sent a ${messageType}`}`, {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });

          // Show browser notification
          showBrowserNotification(senderName, messageType === 'text' ? message : `Sent a ${messageType}`, chatId);
          
          // Play notification sound
          playSound();
        }
      }
    };

    // Note: Notification processing is now handled in a separate useEffect hook

    // Re-validación de nuevo mensaje
    newSocket.on('incomingMessage', async (data) => {
      const dataUserStorage = await window.localStorage.getItem('userId');
      
      // If the message is not from the current user
      if(data.body.message.createdBy !== dataUserStorage){
        // Find sender information to display in notification
        const chat = inboxList.find(chat => chat._id === data.body.chatId);
        let senderName = "New message";
        
        if (chat) {
          if (chat.isPrivate) {
            // For private chats, get the other user's name
            const otherMember = chat.members.find(member => member.user._id !== dataUserStorage);
            if (otherMember && otherMember.user && otherMember.user.profile) {
              senderName = otherMember.user.profile.name;
            }
          } else {
            // For group chats, use the chat title and sender name
            const sender = chat.members.find(member => member.user._id === data.body.message.createdBy);
            senderName = chat.label + (sender && sender.user && sender.user.profile ? ` (${sender.user.profile.name})` : '');
          }
        }

        // Handle notification with the enhanced notification system
        handleNotification(
          data.body.chatId,
          senderName,
          data.body.message.message,
          data.body.message.typeMessage
        );
      }
    });
    
    return () => {
      clearInterval(timerActivities);
      newSocket.close();
    }
  }, []);

  // Function to toggle browser notifications
  const toggleBrowserNotifications = () => {
    setNotificationSettings(prev => {
      const updated = {
        ...prev,
        browserNotifications: !prev.browserNotifications
      };
      
      // If enabling notifications, request permission
      if (updated.browserNotifications && "Notification" in window) {
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
          Notification.requestPermission().then(permission => {
            // If permission is granted, show a test notification
            if (permission === "granted") {
              const testNotification = new Notification("Notificaciones activadas", {
                body: "Las notificaciones del chat están activadas correctamente.",
                icon: '/logo192.png'
              });
              
              setTimeout(() => testNotification.close(), 3000);
            }
          });
        } else if (Notification.permission === "granted") {
          // Show a test notification if permission is already granted
          const testNotification = new Notification("Notificaciones activadas", {
            body: "Las notificaciones del chat están activadas correctamente.",
            icon: '/logo192.png'
          });
          
          setTimeout(() => testNotification.close(), 3000);
        }
      }
      
      return updated;
    });
  };

  // Function to toggle sound for notifications
  const toggleNotificationSound = () => {
    setNotificationSettings(prev => ({
      ...prev,
      soundEnabled: !prev.soundEnabled
    }));
  };

  // Function to toggle notification grouping
  const toggleNotificationGrouping = () => {
    setNotificationSettings(prev => ({
      ...prev,
      groupNotifications: !prev.groupNotifications
    }));
  };

  // Function to toggle do not disturb mode
  const toggleDoNotDisturb = () => {
    setNotificationSettings(prev => ({
      ...prev,
      doNotDisturb: !prev.doNotDisturb
    }));
  };

  // Function to mute/unmute a specific chat
  const toggleMuteChat = (chatId) => {
    setNotificationSettings(prev => {
      const mutedChats = [...prev.mutedChats];
      const index = mutedChats.indexOf(chatId);
      
      if (index > -1) {
        mutedChats.splice(index, 1); // Unmute
      } else {
        mutedChats.push(chatId); // Mute
      }
      
      return {
        ...prev,
        mutedChats
      };
    });
  };

  // Function to update notification timeout
  const updateNotificationTimeout = (milliseconds) => {
    setNotificationSettings(prev => ({
      ...prev,
      notificationTimeout: milliseconds
    }));
  };
  
  // Function to update notification volume
  const updateNotificationVolume = (volume) => {
    setNotificationSettings(prev => ({
      ...prev,
      notificationVolume: volume
    }));
  };

  return (
    <SocketContext.Provider value={{
      socket,
      inboxList,
      setInboxList,
      unreadMessages,
      setUnreadMessages,
      activitiesUsers,
      notificationSettings,
      toggleBrowserNotifications,
      toggleNotificationSound,
      toggleNotificationGrouping,
      toggleDoNotDisturb,
      toggleMuteChat,
      updateNotificationTimeout,
      updateNotificationVolume,
      notificationSoundRef
    }}>
      {children}
      <audio 
        ref={notificationSoundRef} 
        src="/sounds/notification.mp3" 
        preload="auto" 
        style={{ display: 'none' }} 
      />
    </SocketContext.Provider>
  );
};