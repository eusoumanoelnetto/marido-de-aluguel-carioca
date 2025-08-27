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
  // Use Vite runtime env flags in the browser. `import.meta.env.PROD` is true in production builds.
  const isProd = Boolean(import.meta.env && (import.meta.env.PROD || import.meta.env.MODE === 'production'));
  if (!isProd) {
        for (const reg of registrations) {
          try { await reg.unregister(); } catch (e) { /* ignore */ }
        }
        console.log('Service workers unregistered (dev mode)');
        return;
      }

      // Register the service worker using base URL so it works under a repo subpath (GH Pages)
      // Compute SW path using BASE_URL when available; fall back to relative './sw.js'.
      const base = (import.meta.env && import.meta.env.BASE_URL) || './';
      let swPath = base.endsWith('/') ? base + 'sw.js' : base + '/sw.js';
      // If the base is just './', ensure a valid relative path
      if (base === './') swPath = './sw.js';
      try {
        // Use URL to normalize when base is absolute
        const normalized = (swPath.startsWith('http') || swPath.startsWith('/')) ? swPath : new URL(swPath, location.href).toString();
        await navigator.serviceWorker.register(normalized);
        console.log('Service worker registered (production) at', normalized);
      } catch (e) {
        console.log('Service worker registration failed:', e);
      }
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
