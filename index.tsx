import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './src/context/AuthContext';

// Patch global alert -> toast (evita popups nativos remanescentes de bundle antigo)
declare global {
  interface Window { __mdacAlertPatched?: boolean }
}
if (typeof window !== 'undefined' && !window.__mdacAlertPatched) {
  window.__mdacAlertPatched = true;
  const originalAlert = window.alert; // guard se quiser usar depois
  window.alert = (message?: any) => {
    try {
      window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: String(message ?? ''), type: 'error' } }));
    } catch {
      // fallback silencioso
      originalAlert(message);
    }
  };
}

// PWA Service Worker handling: unregister in dev to avoid cached old bundles; register only in production
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
  // In development, unregister all service workers to avoid stale cached bundles causing old alerts/popups
  const isProd = (process && process.env && process.env.NODE_ENV === 'production');
  if (!isProd) {
        for (const reg of registrations) {
          try { await reg.unregister(); } catch (e) { /* ignore */ }
        }
        console.log('Service workers unregistered (dev mode)');
        return;
      }

      // In production, register the service worker normally
      await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker registered (production)');
    } catch (err) {
      console.log('Service worker handling error:', err);
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
