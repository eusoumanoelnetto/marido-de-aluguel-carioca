import { collection, addDoc, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db, isConfigured } from './firebaseConfig';

if (!isConfigured) {
  // eslint-disable-next-line no-console
  console.warn('Firebase não configurado. Usando fallback para API.');
}

export const sendMessageFirebase = async (serviceId: string, senderEmail: string, recipientEmail: string, content: string) => {
  if (!isConfigured) throw new Error('Firebase não configurado');
  const col = collection(db, 'messages');
  const doc = {
    serviceId,
    senderEmail,
    recipientEmail,
    content,
    createdAt: new Date(),
  };
  // eslint-disable-next-line no-console
  console.debug('sendMessageFirebase: adding doc to Firestore', { serviceId, senderEmail, recipientEmail, length: content?.length });
  return await addDoc(col, doc);
};

export const subscribeMessages = (serviceId: string, callback: (msgs: any[]) => void) => {
  if (!isConfigured) throw new Error('Firebase não configurado');
  const q = query(collection(db, 'messages'), where('serviceId', '==', serviceId), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    callback(msgs);
  });
};

export const fetchMessagesOnce = async (serviceId: string) => {
  if (!isConfigured) throw new Error('Firebase não configurado');
  const q = query(collection(db, 'messages'), where('serviceId', '==', serviceId), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
};