// firebase-messaging-sw.js
// Service Worker for Firebase Cloud Messaging (FCM)
// Handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

// Firebase configuration - must match your project
const firebaseConfig = {
  apiKey: "AIzaSyAz8pGLqKvjb0pEawKBKyxXJUMf_UuZuJA",
  authDomain: "gym-managment-aa0a1.firebaseapp.com",
  projectId: "gym-managment-aa0a1",
  storageBucket: "gym-managment-aa0a1.firebasestorage.app",
  messagingSenderId: "629747056853",
  appId: "1:629747056853:web:c0edc45cc8c2be74dbb7d9",
  measurementId: "G-HJXZPXM0CX"
};

// Initialize Firebase in Service Worker
firebase.initializeApp(firebaseConfig);

// Retrieve Firebase Messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  // Extract notification data
  const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new notification',
    icon: payload.notification?.icon || payload.data?.icon || '/logo.png',
    badge: '/logo.png',
    tag: payload.data?.tag || 'default',
    data: payload.data,
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  // Add action buttons based on notification type
  if (payload.data?.type) {
    switch (payload.data.type) {
      case 'new_message':
        notificationOptions.actions = [
          { action: 'view', title: 'Xem tin nhắn' },
          { action: 'close', title: 'Đóng' }
        ];
        break;
      case 'payment_success':
      case 'payment_cancel':
        notificationOptions.actions = [
          { action: 'view', title: 'Xem chi tiết' },
          { action: 'close', title: 'Đóng' }
        ];
        break;
      case 'pt_schedule_reminder':
        notificationOptions.actions = [
          { action: 'view', title: 'Xem lịch' },
          { action: 'close', title: 'Đóng' }
        ];
        break;
      case 'employee_checkin':
      case 'employee_checkout':
        notificationOptions.actions = [
          { action: 'view', title: 'Xem chi tiết' },
          { action: 'close', title: 'Đóng' }
        ];
        break;
      default:
        notificationOptions.actions = [
          { action: 'view', title: 'Xem' },
          { action: 'close', title: 'Đóng' }
        ];
    }
  }

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  
  event.notification.close();

  // Handle different actions
  if (event.action === 'close') {
    return;
  }

  // Get notification data
  const notificationData = event.notification.data;
  let urlToOpen = '/';

  // Determine URL based on notification type
  if (notificationData) {
    switch (notificationData.type) {
      case 'new_message':
        urlToOpen = `/pt/chat/${notificationData.chatId || ''}`;
        break;
      case 'payment_success':
      case 'payment_cancel':
        urlToOpen = `/admin/packages`;
        break;
      case 'pt_schedule_reminder':
        urlToOpen = `/pt/schedule`;
        break;
      case 'employee_checkin':
      case 'employee_checkout':
        urlToOpen = `/admin/checkins`;
        break;
      case 'pending_request':
        urlToOpen = `/admin/pending-requests?requestId=${notificationData.relatedId || ''}`;
        break;
      default:
        if (notificationData.url) {
          urlToOpen = notificationData.url;
        }
    }
  }

  // Open or focus the app window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Focus existing window and navigate
            return client.focus().then(() => {
              if ('navigate' in client) {
                return client.navigate(urlToOpen);
              }
            });
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle push event (alternative to onBackgroundMessage)
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event received:', event);
  
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('[firebase-messaging-sw.js] Push data:', data);
    } catch (e) {
      console.log('[firebase-messaging-sw.js] Push data (text):', event.data.text());
    }
  }
});

console.log('[firebase-messaging-sw.js] Service Worker loaded and ready');
