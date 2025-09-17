import React, { useEffect, useState, useRef } from 'react';
import { ServiceRequest, User } from '../types';
import * as api from '../services/apiService';
// Removidos imports circulares desnecessários para evitar bundles maiores / warnings

interface Props {
  request: ServiceRequest | null;
  onBack: () => void;
  updateRequestStatus: (id: string, status: ServiceRequest['status'], quote?: number, providerEmail?: string, initialMessage?: string) => void;
  currentUser: User;
  getStatusDetails: (status: ServiceRequest['status']) => { text: string; className: string };
}

const ServiceDetailView: React.FC<Props> = ({ request, onBack, updateRequestStatus, currentUser, getStatusDetails }) => {
  const [draftQuote, setDraftQuote] = useState('');
  const [editing, setEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<Array<any>>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastRequestIdRef = useRef<string | null>(null);

  // Initialize / sync from external quote only when not editing
  useEffect(() => {
    if (!request) return;
    // Se mudou o ID do request, resetar estado de edição e quote para refletir dado vindo do servidor
    if (lastRequestIdRef.current !== request.id) {
      lastRequestIdRef.current = request.id;
      setEditing(false);
      setIsSubmitting(false);
    }
    if (!editing) {
      const initial = request.quote != null ? request.quote.toString() : '';
      setDraftQuote(initial);
    }
  }, [request?.id, request?.quote, editing]);

  // Load messages when request is Aceito or provider/client views the service detail
  useEffect(() => {
    if (!request) return;
    let mounted = true;
    const load = async () => {
      try {
        const data = await api.getMessagesForService(request.id);
        if (!mounted) return;
        setMessages(data || []);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      } catch (err) {
        // ignore
      }
    };
    load();
    return () => { mounted = false; };
  }, [request?.id, request?.status]);

  // Se status mudou para algo diferente de 'Pendente' enquanto a tela está aberta, cancelar edição e garantir polling retomado
  useEffect(() => {
    if (request && request.status !== 'Pendente' && editing) {
      setEditing(false);
      try { window.dispatchEvent(new CustomEvent('mdac:resumePolling')); } catch {}
    }
  }, [request?.status, editing]);

  if (!request) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-20">Nenhum serviço selecionado.</div>
      </div>
    );
  }

  const status = getStatusDetails(request.status);

  const handleAccept = async () => {
    if (!request || isSubmitting) return;
    // Ler valor diretamente do input para evitar condições de corrida com onBlur/estado
    const rawInput = (inputRef.current && (inputRef.current.value ?? '')) || draftQuote || '';
    let cleaned = String(rawInput).trim();
    cleaned = cleaned.replace(/\s+/g, '');
    // Se contém ambos '.' e ',' assumimos que '.' é separador de milhar e ',' decimal (ex: 1.500,00)
    if (cleaned.indexOf('.') !== -1 && cleaned.indexOf(',') !== -1) {
      cleaned = cleaned.replace(/\./g, '');
      cleaned = cleaned.replace(/,/g, '.');
    } else {
      // Normaliza vírgulas para ponto e remove caracteres não numéricos
      cleaned = cleaned.replace(/,/g, '.');
      cleaned = cleaned.replace(/[^0-9.]/g, '');
      // Se houver mais de um ponto, manter apenas o primeiro como decimal
      cleaned = cleaned.replace(/\.(?=.*\.)/g, '');
    }
    const value = parseFloat(cleaned);
    if (isNaN(value) || value <= 0) {
      window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: 'Por favor, insira um valor de orçamento válido.', type: 'error' } }));
      return;
    }
    setIsSubmitting(true);
    setEditing(false);
    try { window.dispatchEvent(new CustomEvent('mdac:resumePolling')); } catch {}
    try {
      await updateRequestStatus(request.id, 'Orçamento Enviado', value, currentUser.email);
      window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: 'Orçamento enviado com sucesso.', type: 'success' } }));
      onBack();
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: err?.message || 'Falha ao enviar orçamento.', type: 'error' } }));
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!request || isSubmitting) return;
    setIsSubmitting(true);
    setEditing(false);
    try { window.dispatchEvent(new CustomEvent('mdac:resumePolling')); } catch {}
    try {
      await updateRequestStatus(request.id, 'Recusado');
      window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: 'Solicitação recusada.', type: 'info' } }));
      onBack();
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: err?.message || 'Erro ao recusar.', type: 'error' } }));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <button onClick={onBack} className="mb-4 text-sm font-semibold text-brand-navy hover:underline">Voltar</button>
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm relative">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-1 text-brand-navy">{request.category}</h1>
            <p className="text-gray-500">Solicitado por: {request.clientName}</p>
          </div>
          <span className={`px-4 py-1.5 text-sm font-medium rounded-full ${status.className}`}>{status.text}</span>
        </div>

        <div className="mt-6 border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold mb-3 text-brand-navy">Detalhes da Solicitação</h2>
            <p className="text-gray-600 mb-4">{request.description}</p>
            {request.photoBase64 && (
              <img src={`data:image/jpeg;base64,${request.photoBase64}`} alt="Foto do serviço" className="rounded-lg max-w-xs" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-3 text-brand-navy">Informações do Cliente</h2>
            <div className="space-y-2 text-gray-700">
              <p><i className="fas fa-user mr-2 w-4 text-center"></i>{request.clientName}</p>
              <p><i className="fas fa-map-marker-alt mr-2 w-4 text-center"></i>{request.address}</p>
              <p><i className="fas fa-phone mr-2 w-4 text-center"></i>{request.contact}</p>
            </div>
          </div>
        </div>

        {request.status === 'Pendente' && (
          <div className="mt-8 border-t pt-8" style={{ position: 'relative', zIndex: 1 }}>
            <h2 className="text-lg font-semibold mb-3 text-brand-navy">Enviar Orçamento</h2>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full min-w-0">
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                value={draftQuote}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9.,]/g, '');
                  setDraftQuote(raw);
                  if (!editing) setEditing(true);
                }}
                onFocus={() => { setEditing(true); try { window.dispatchEvent(new CustomEvent('mdac:pausePolling')); } catch {} }}
                onBlur={() => {
                  setEditing(false);
                  // Normaliza para formato 0.00 se número válido (mesma lógica usada no envio)
                  try {
                    let raw = (inputRef.current && (inputRef.current.value ?? '')) || draftQuote || '';
                    raw = String(raw).trim();
                    raw = raw.replace(/\s+/g, '');
                    if (raw.indexOf('.') !== -1 && raw.indexOf(',') !== -1) {
                      raw = raw.replace(/\./g, '');
                      raw = raw.replace(/,/g, '.');
                    } else {
                      raw = raw.replace(/,/g, '.');
                      raw = raw.replace(/[^0-9.]/g, '');
                      raw = raw.replace(/\.(?=.*\.)/g, '');
                    }
                    const normalizedNum = parseFloat(raw);
                    if (!isNaN(normalizedNum) && normalizedNum > 0) setDraftQuote(normalizedNum.toFixed(2));
                  } catch (e) {
                    // ignore normalization errors
                  }
                  try { window.dispatchEvent(new CustomEvent('mdac:resumePolling')); } catch {}
                }}
                placeholder="Ex: 150,00"
                className="p-3 bg-white border-2 border-gray-300 rounded-lg text-base w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                autoComplete="off"
              />
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto min-w-0">
                <button
                  onClick={handleAccept}
                  disabled={isSubmitting}
                  className={`px-5 py-3 rounded-lg font-semibold w-full sm:w-auto text-center text-white ${isSubmitting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                >{isSubmitting ? 'Enviando...' : 'Enviar Orçamento'}</button>
                <button
                  onClick={handleDecline}
                  disabled={isSubmitting}
                  className={`px-5 py-3 rounded-lg font-semibold text-white w-full sm:w-auto ${isSubmitting ? 'bg-brand-red/60 cursor-not-allowed' : 'bg-brand-red hover:opacity-90'}`}
                >Recusar</button>
              </div>
            </div>
          </div>
        )}

        {request.status === 'Aceito' && (
          <div className="mt-8 border-t pt-8">
            <h2 className="text-lg font-semibold mb-3 text-brand-navy">Mensagens</h2>
            <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-auto">
              {messages.length === 0 && <div className="text-gray-500">Nenhuma mensagem ainda.</div>}
              {messages.map((m, idx) => (
                <div key={m.id || idx} className={`py-2 ${m.senderEmail === currentUser.email ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block px-3 py-2 rounded-lg ${m.senderEmail === currentUser.email ? 'bg-brand-blue text-white' : 'bg-white text-gray-800'} shadow-sm`}>{m.content}</div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(m.createdAt).toLocaleString()}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="mt-3 flex gap-3">
              <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Escreva uma mensagem..." className="flex-1 p-3 border rounded-lg" disabled={isSendingMessage} />
              <button disabled={isSendingMessage} onClick={async () => {
                if (!newMessage.trim()) return;
                setIsSendingMessage(true);
                try {
                  // Escolher destinatário corretamente: prestador envia para cliente, cliente envia para prestador
                  const recipient = currentUser.role === 'provider' ? (request.clientEmail || '') : (request.providerEmail || '');
                  if (!recipient) {
                    console.warn('ServiceDetailView: recipient ausente ao tentar enviar mensagem para request', request.id, { currentUser: currentUser?.email, providerEmail: request.providerEmail, clientEmail: request.clientEmail });
                    window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: 'Destinatário da mensagem ausente. Não foi possível enviar.', type: 'error' } }));
                    setIsSendingMessage(false);
                    return;
                  }
                  const saved = await api.sendMessage(request.id, recipient, newMessage.trim());
                  setMessages(prev => [...prev, saved]);
                  setNewMessage('');
                  setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
                } catch (err: any) {
                  console.error('ServiceDetailView: erro ao enviar mensagem', err);
                  const msg = err?.message || 'Erro ao enviar mensagem';
                  if (String(msg).toLowerCase().includes('token') || String(msg).toLowerCase().includes('401') || String(msg).toLowerCase().includes('não autorizado') || String(msg).toLowerCase().includes('ausente')) {
                    try { window.dispatchEvent(new CustomEvent('mdac:logout')); } catch {}
                    window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: 'Sessão expirada ou token inválido. Faça login novamente.', type: 'error' } }));
                  } else {
                    window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: msg, type: 'error' } }));
                  }
                } finally {
                  setIsSendingMessage(false);
                }
              }} className={`px-4 py-2 bg-brand-blue text-white rounded-lg ${isSendingMessage ? 'opacity-60 cursor-not-allowed' : ''}`}>{isSendingMessage ? 'Enviando...' : 'Enviar'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceDetailView;
