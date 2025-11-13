import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
// Prevent unhandled errors from causing page reloads
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  event.preventDefault(); // Prevent default error handling
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevent default error handling
});

// Temporarily disable StrictMode to prevent double-rendering issues
root.render(
  <App />
);

// Register service worker for offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use process.env.PUBLIC_URL if available, otherwise use root
    const swPath = `${process.env.PUBLIC_URL || ''}/service-worker.js`;
    navigator.serviceWorker.register(swPath, { scope: '/' })
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope);
        
        // Check for updates periodically - but don't auto-reload
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New service worker available, but don't auto-reload
                  console.log('New service worker available. Will activate on next page load.');
                } else {
                  // First time installation
                  console.log('Service worker installed for the first time.');
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
