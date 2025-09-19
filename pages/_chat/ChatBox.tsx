import React, { useEffect, useState, useRef, useContext } from 'react';
import supabase, { SupabaseMessage, signInWithMagicLink, getUser, signOut } from '../../services/supabaseClient';
import { AuthContext } from '../../src/context/AuthContext';

type ChatBoxProps = {
  currentUserId: string;
  otherUserId: string;
};

export default function ChatBox({ currentUserId, otherUserId }: ChatBoxProps) {
  const [authUser, setAuthUser] = useState<any>(null);
  const authCtx = useContext(AuthContext);
  const [messages, setMessages] = useState<SupabaseMessage[]>([]);
  const [text, setText] = useState('');
  const mounted = useRef(false);

  useEffect(() => {
    let mountedLocal = true;
    (async () => {
      // prefer app's AuthContext user if available
      if (authCtx?.user) {
        setAuthUser({ id: authCtx.user.email, email: authCtx.user.email });
        return;
      }
      const user = await getUser();
      if (mountedLocal) setAuthUser(user);
    })();
    return () => { mountedLocal = false; };
  }, []);

  useEffect(() => {
    let sub: any;
    async function load() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`participants.cs.{${currentUserId}}`)
        .order('created_at', { ascending: true });

      if (data) setMessages(data as SupabaseMessage[]);

      sub = supabase
        .channel('public:messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const newMsg = payload.new as SupabaseMessage;
          const participants = newMsg.participants || [newMsg.from_id, newMsg.to_id];
          if (participants.includes(otherUserId) && participants.includes(currentUserId)) {
            setMessages((m) => [...m, newMsg]);
          }
        })
        .subscribe();
    }

    if (!mounted.current) {
      mounted.current = true;
      load();
    }

    return () => {
      try { sub?.unsubscribe(); } catch (e) {}
    };
  }, [currentUserId, otherUserId]);

  async function handleSend() {
    const senderId = authUser?.id || currentUserId;
    if (!text.trim()) return;
    await supabase.from('messages').insert({ from_id: senderId, to_id: otherUserId, participants: [senderId, otherUserId], text });
    setText('');
  }

  async function handleLogin(email: string) {
    await signInWithMagicLink(email);
    // magic link sent — in production you'd show a toast informing the user
  }

  async function handleSignOut() {
    await signOut();
    setAuthUser(null);
  }

  return (
    <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, width: 360 }}>
      <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 8 }}>
        {messages.map((m) => (
          <div key={m.id} style={{ padding: 6, background: m.from_id === currentUserId ? '#e6f7ff' : '#f7f7f7', borderRadius: 6, marginBottom: 6 }}>
            <div style={{ fontSize: 12, color: '#333' }}>{m.text}</div>
            <div style={{ fontSize: 10, color: '#666' }}>{m.created_at}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {!authUser ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <input placeholder="seu-email@exemplo.com" id="supabase-email-input" style={{ flex: 1 }} />
            <button onClick={() => handleLogin((document.getElementById('supabase-email-input') as HTMLInputElement).value)}>Entrar</button>
          </div>
        ) : (
          <>
            <input value={text} onChange={(e) => setText(e.target.value)} style={{ flex: 1 }} />
            <button onClick={handleSend}>Enviar</button>
            <button onClick={handleSignOut}>Sair</button>
          </>
        )}
      </div>
    </div>
  );
}
