'use client';

import { useEffect } from 'react';

export default function NotificationPermission() {
  useEffect(() => {
    // Request notification permission when app loads
    const requestNotificationPermission = async () => {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return;
      }

      // Check current permission status
      const currentPermission = Notification.permission;

      // If permission hasn't been granted or denied, request it
      if (currentPermission === 'default') {
        try {
          const permission = await Notification.requestPermission();
          
          if (permission === 'granted') {
            console.log('Notification permission granted for Learnix');
            // Show a welcome notification
            new Notification('Welcome to Learnix!', {
              body: 'You will now receive notifications about new topics and updates.',
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: 'learnix-welcome',
            });
          } else {
            console.log('Notification permission denied');
          }
        } catch (error) {
          console.error('Error requesting notification permission:', error);
        }
      } else if (currentPermission === 'granted') {
        console.log('Notification permission already granted');
      }
    };

    // Request permission after a short delay to not interfere with page load
    const timer = setTimeout(() => {
      requestNotificationPermission();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return null; // This component doesn't render anything
}
