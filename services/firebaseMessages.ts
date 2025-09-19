import { db } from './firebaseConfig';
import {
  collection,
  query,
  where,
  orderBy,
  addDoc,
  getDocs,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import type { Query } from 'firebase/firestore';

export type Message = {
  id?: string;
  fromId: string;
  toId: string;
  text: string;
  createdAt?: Date;
};

const MESSAGES_COLLECTION = 'messages_v2';

async function sendMessage(message: Message): Promise<void> {
  if (!message || !message.fromId || !message.toId || !message.text) {
    throw new Error('Invalid message payload');
  }

  const doc = {
    fromId: message.fromId,
    toId: message.toId,
    text: message.text,
    createdAt: Timestamp.now(),
  };

  await addDoc(collection(db, MESSAGES_COLLECTION), doc);
}

async function fetchMessagesBetween(userA: string, userB: string): Promise<Message[]> {
  if (!userA || !userB) return [];

  const col = collection(db, MESSAGES_COLLECTION);
  const q = query(
    col,
    where('participants', 'array-contains', userA),
    orderBy('createdAt', 'asc')
  );

  const snapshot = await getDocs(q);
  const messages: Message[] = [];
  snapshot.forEach((doc) => {
    const data = doc.data() as any;
    const participants: string[] = data.participants || [data.fromId, data.toId];
    if (participants.includes(userB)) {
      messages.push({
        id: doc.id,
        fromId: data.fromId,
        toId: data.toId,
        text: data.text,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : undefined,
      });
    }
  });

  return messages;
}

function subscribeToConversation(userA: string, userB: string, callback: (messages: Message[]) => void) {
  const col = collection(db, MESSAGES_COLLECTION);
  const q = query(col, where('participants', 'array-contains', userA), orderBy('createdAt', 'asc'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages: Message[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as any;
      const participants: string[] = data.participants || [data.fromId, data.toId];
      if (participants.includes(userB)) {
        messages.push({
          id: doc.id,
          fromId: data.fromId,
          toId: data.toId,
          text: data.text,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : undefined,
        });
      }
    });
    callback(messages);
  });

  return unsubscribe;
}

export { sendMessage, fetchMessagesBetween, subscribeToConversation };
