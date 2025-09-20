import React, { useEffect, useState, useRef, useContext } from 'react';
import * as api from '../../services/apiService';
import { AuthContext } from '../../src/context/AuthContext';

type ChatBoxProps = {
  currentUserId: string;
  otherUserId: string;
  serviceId?: string;
  onClose?: () => void;
};
export default function ChatBox({ currentUserId, otherUserId, serviceId, onClose }: ChatBoxProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll para última mensagem
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Carregar mensagens do backend
  useEffect(() => {
    let ignore = false;
    async function fetchMessages() {
      setLoading(true);
      setError(null);
      try {
        let all: any[] = [];
        if (serviceId) {
          all = await api.getMessagesForService(serviceId) as any[];
        } else {
          all = await api.getRecentMessagesForMe() as any[];
        }
        // Filtra apenas entre os participantes atuais
        const filtered = all.filter((m: any) =>
          (m.senderEmail === currentUserId && m.recipientEmail === otherUserId) ||
          (m.senderEmail === otherUserId && m.recipientEmail === currentUserId)
        );
        if (!ignore) setMessages(filtered.reverse ? filtered.reverse() : filtered);
      } catch (e: any) {
        if (!ignore) setError(e.message || 'Erro ao buscar mensagens');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchMessages();
    // Não implementa realtime para evitar flood de requests
    return () => { ignore = true; };
  }, [currentUserId, otherUserId]);

  async function handleSend() {
    if (!text.trim()) return;
    setSending(true);
    setError(null);
    try {
      let url = '';
      if (typeof window !== 'undefined' && (window as any).API_BASE_URL) {
        url = (window as any).API_BASE_URL + '/messages';
      } else {
        url = '/api/messages';
      }
      // Use API service which adds Authorization header
      await api.sendMessage(serviceId || '', otherUserId, text.trim());
      setText('');
      // Recarrega mensagens após envio
      const all = serviceId ? await api.getMessagesForService(serviceId) : await api.getRecentMessagesForMe();
      const filtered = (all as any[]).filter((m: any) =>
        (m.senderEmail === currentUserId && m.recipientEmail === otherUserId) ||
        (m.senderEmail === otherUserId && m.recipientEmail === currentUserId)
      );
      setMessages(filtered.reverse ? filtered.reverse() : filtered);
    } catch (e: any) {
      setError(e.message || 'Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4 w-full max-w-md min-w-[320px] flex flex-col" style={{ minHeight: 320 }}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-brand-navy text-lg">Chat com o prestador</span>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-brand-red text-sm font-semibold">Fechar</button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto mb-2 px-1" style={{ maxHeight: 260 }}>
        {loading ? (
          <div className="text-center text-gray-400 py-8">Carregando mensagens...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">Nenhuma mensagem ainda.</div>
        ) : (
          messages.map((m, idx) => (
            <div key={m.id || idx} className={`flex flex-col ${m.from_id === currentUserId ? 'items-end' : 'items-start'}`} style={{ marginBottom: 8 }}>
              <div className={`px-3 py-2 rounded-lg text-sm ${m.from_id === currentUserId ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-800'}`}>{m.text}</div>
              <span className="text-xs text-gray-400 mt-1">{new Date(m.created_at || '').toLocaleString('pt-BR')}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form className="flex gap-2 mt-2" onSubmit={e => { e.preventDefault(); handleSend(); }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue"
          placeholder="Digite sua mensagem..."
          disabled={sending || loading}
        />
        <button
          type="submit"
          className={`px-4 py-2 rounded-lg font-semibold text-white ${sending || loading ? 'bg-brand-blue/60 cursor-not-allowed' : 'bg-brand-blue hover:bg-brand-blue/90'}`}
          disabled={sending || loading || !text.trim()}
        >Enviar</button>
      </form>
    </div>
  );
}
