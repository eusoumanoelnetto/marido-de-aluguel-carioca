// Configuração do Firebase para mensagens em tempo real
// Substitua os valores abaixo pelo seu projeto Firebase

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Use environment variables injected by Vite for security and flexibility.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const isConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

let db = null as any;
if (isConfigured) {
  const app = initializeApp(firebaseConfig as any);
  db = getFirestore(app);
}
// In dev, expose the loaded config so we can inspect in the browser console.
try {
  if (!isConfigured && typeof window !== 'undefined' && import.meta.env.MODE !== 'production') {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.__MDAC_FIREBASE_CONFIG__ = firebaseConfig;
    // print masked config for convenience (avoid printing full apiKey in some contexts)
    // eslint-disable-next-line no-console
    console.debug('Firebase não configurado totalmente — vars carregadas (dev):', {
      apiKey: firebaseConfig.apiKey ? "(present)" : "(missing)",
      projectId: firebaseConfig.projectId || '(missing)',
      authDomain: firebaseConfig.authDomain || '(missing)',
      storageBucket: firebaseConfig.storageBucket || '(missing)'
    });
  }
} catch (e) {
  // ignore
}

export { db, isConfigured };