// Firebase helpers para mensagens em tempo real
// Certifique-se de instalar firebase: npm install firebase
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';

// Carregar config do Firebase das variáveis de ambiente
const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app;
let db;
try {
	if (!getApps().length) {
		app = initializeApp(firebaseConfig);
	} else {
		app = getApps()[0];
	}
	db = getFirestore(app);
} catch (e) {
	// Firebase não configurado corretamente
	db = null;
}

export async function sendMessageFirebase(requestId, senderEmail, recipientEmail, content) {
	if (!db) throw new Error('Firebase não configurado. Usando fallback para API.');
	const ref = collection(db, 'serviceRequests', requestId, 'messages');
	const doc = await addDoc(ref, {
		senderEmail,
		recipientEmail,
		content,
		createdAt: Date.now(),
	});
	return { id: doc.id, senderEmail, recipientEmail, content, createdAt: Date.now() };
}

export async function fetchMessagesOnce(requestId) {
	if (!db) throw new Error('Firebase não configurado. Usando fallback para API.');
	const ref = collection(db, 'serviceRequests', requestId, 'messages');
	const q = query(ref, orderBy('createdAt', 'asc'));
	const snap = await getDocs(q);
	return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export function subscribeMessages(requestId, callback) {
	if (!db) throw new Error('Firebase não configurado. Usando fallback para API.');
	const ref = collection(db, 'serviceRequests', requestId, 'messages');
	const q = query(ref, orderBy('createdAt', 'asc'));
	const unsub = onSnapshot(q, (snap) => {
		const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
		callback(msgs);
	});
	return unsub;
}
