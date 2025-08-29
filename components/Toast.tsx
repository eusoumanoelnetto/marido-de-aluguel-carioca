import React, { useEffect, useState } from 'react';

type NotifyDetail = { message: string; type?: 'success' | 'error' | 'info'; quoteId?: string };

const Toast: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'success' | 'error' | 'info'>('info');
  const [quoteId, setQuoteId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handler = (e: any) => {
      const detail: NotifyDetail = e.detail || { message: String(e) };
      setMessage(detail.message || '');
      setType(detail.type || 'info');
  setQuoteId(detail.quoteId);
  setVisible(true);
      // auto-hide after 3.5s
      setTimeout(() => setVisible(false), 3500);
    };

    window.addEventListener('mdac:notify', handler as EventListener);
    return () => window.removeEventListener('mdac:notify', handler as EventListener);
  }, []);

  if (!visible) return null;

  const bg = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-sky-600';

  // Não precisamos de useEffect duplicado aqui - App.tsx já escuta mdac:gotoLogin

  const clickable = Boolean(quoteId);
  return (
    <div className="fixed inset-0 flex items-start justify-center pointer-events-none z-50 p-6">
      <div
        className={`pointer-events-auto ${bg} text-white rounded-lg shadow-lg px-6 py-4 max-w-xl w-full ${clickable ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40' : ''}`}
        onClick={() => {
          if (quoteId) {
            // navegar para aba de orçamentos
            window.dispatchEvent(new CustomEvent('mdac:gotoQuotes'));
            setVisible(false);
          }
        }}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : -1}
        aria-label={clickable ? 'Ver orçamento recebido' : undefined}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold">{type === 'success' ? 'Sucesso' : type === 'error' ? 'Erro' : 'Informação'}</div>
            <div className="mt-1 text-sm">{message}</div>
            {type === 'error' && message.toLowerCase().includes('cadastrado') && (
              <button 
                onClick={() => {
                  setVisible(false);
                  window.dispatchEvent(new CustomEvent('mdac:gotoLogin'));
                }}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Clique aqui para fazer login
              </button>
            )}
            {quoteId && (
              <div className="mt-2 text-xs text-white/80 italic">Clique para ver detalhes do orçamento.</div>
            )}
          </div>
          <button onClick={() => setVisible(false)} className="text-white opacity-90 hover:opacity-100">✕</button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
