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

export { db, isConfigured };