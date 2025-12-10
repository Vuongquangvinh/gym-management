import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Đăng ký service worker cho FCM
// TODO: Uncomment khi cần sử dụng FCM push notifications
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/firebase-messaging-sw.js', { scope: '/' })
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope);
        return registration;
      })
      .catch((err) => {
        console.error('Service Worker registration failed:', err);
        console.error('Error details:', err.message);
      });
  });
}
*/

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
