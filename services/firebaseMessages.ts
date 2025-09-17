import { collection, addDoc, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';

export const sendMessageFirebase = async (serviceId: string, senderEmail: string, recipientEmail: string, content: string) => {
  const col = collection(db, 'messages');
  const doc = {
    serviceId,
    senderEmail,
    recipientEmail,
    content,
    createdAt: new Date(),
  };
  return await addDoc(col, doc);
};

export const subscribeMessages = (serviceId: string, callback: (msgs: any[]) => void) => {
  const q = query(collection(db, 'messages'), where('serviceId', '==', serviceId), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    callback(msgs);
  });
};

export const fetchMessagesOnce = async (serviceId: string) => {
  const q = query(collection(db, 'messages'), where('serviceId', '==', serviceId), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
};