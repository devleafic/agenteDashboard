import React, { useRef } from 'react';

const NotificationSound = ({ soundUrl }) => {
  const audioRef = useRef(null);

  // Function to play the notification sound
  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Reset to start
      audioRef.current.play().catch(error => {
        // Handle any errors (e.g., user hasn't interacted with the page yet)
        console.log('Error playing notification sound:', error);
      });
    }
  };

  return (
    <audio ref={audioRef} src={soundUrl} preload="auto" style={{ display: 'none' }} />
  );
};

export default NotificationSound;

// Export the play function to be used outside the component
export const playNotificationSound = (audioRef) => {
  if (audioRef && audioRef.current) {
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(error => {
      console.log('Error playing notification sound:', error);
    });
  }
};
