// Firebase helpers para mensagens em tempo real
// Certifique-se de instalar firebase: npm install firebase
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';

// Load config from Vite env
const VITE = (import.meta && (import.meta.env as any)) || {};
const firebaseConfig = {
	apiKey: VITE.VITE_FIREBASE_API_KEY,
	authDomain: VITE.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: VITE.VITE_FIREBASE_PROJECT_ID,
	storageBucket: VITE.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: VITE.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: VITE.VITE_FIREBASE_APP_ID,
};

const hasAllVars = firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId;
export const isFirebaseConfigured = Boolean(hasAllVars);

let db: ReturnType<typeof getFirestore> | null = null;
if (isFirebaseConfigured) {
	try {
		if (!getApps().length) {
			initializeApp(firebaseConfig);
		}
		db = getFirestore();
	} catch (e) {
		// if initialization fails, mark as not configured
		// eslint-disable-next-line no-console
		console.error('firebaseMessages: erro ao inicializar Firebase:', e);
		db = null;
	}
}

const ensureDb = () => {
	if (!db) throw new Error('Firebase não configurado. Usando fallback para API.');
};

export async function sendMessageFirebase(requestId: string, senderEmail: string, recipientEmail: string, content: string) {
	ensureDb();
	if (!requestId || !senderEmail || !recipientEmail || !content) throw new Error('Parâmetros de mensagem inválidos para Firebase.');
	const ref = collection(db as any, 'serviceRequests', requestId, 'messages');
	const ts = Date.now();
	const doc = await addDoc(ref, {
		senderEmail,
		recipientEmail,
		content,
		createdAt: ts,
	});
	return { id: (doc && (doc as any).id) || null, senderEmail, recipientEmail, content, createdAt: ts };
}

export async function fetchMessagesOnce(requestId: string) {
	ensureDb();
	if (!requestId) return [];
	const ref = collection(db as any, 'serviceRequests', requestId, 'messages');
	const q = query(ref, orderBy('createdAt', 'asc'));
	const snap = await getDocs(q);
	return snap.docs.map(doc => ({ id: doc.id, ...(doc.data() || {}) }));
}

export function subscribeMessages(requestId: string, callback: (msgs: any[]) => void) {
	ensureDb();
	if (!requestId) throw new Error('requestId é obrigatório para subscribeMessages');
	const ref = collection(db as any, 'serviceRequests', requestId, 'messages');
	const q = query(ref, orderBy('createdAt', 'asc'));
	const unsub = onSnapshot(q, (snap) => {
		const msgs = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() || {}) }));
		callback(msgs);
	}, (err) => {
		// Log errors and swallow so subscriber can fallback
		// eslint-disable-next-line no-console
		console.error('subscribeMessages: erro no snapshot:', err);
	});
	return unsub;
}
