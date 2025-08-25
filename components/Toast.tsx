import React, { useEffect, useState } from 'react';

type NotifyDetail = { message: string; type?: 'success' | 'error' | 'info' };

const Toast: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'success' | 'error' | 'info'>('info');

  useEffect(() => {
    const handler = (e: any) => {
      const detail: NotifyDetail = e.detail || { message: String(e) };
      setMessage(detail.message || '');
      setType(detail.type || 'info');
      setVisible(true);
      // auto-hide after 3.5s
      setTimeout(() => setVisible(false), 3500);
    };

    window.addEventListener('mdac:notify', handler as EventListener);
    return () => window.removeEventListener('mdac:notify', handler as EventListener);
  }, []);

  if (!visible) return null;

  const bg = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-sky-600';

  return (
    <div className="fixed inset-0 flex items-start justify-center pointer-events-none z-50 p-6">
      <div className={`pointer-events-auto ${bg} text-white rounded-lg shadow-lg px-6 py-4 max-w-xl w-full`}> 
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold">{type === 'success' ? 'Sucesso' : type === 'error' ? 'Erro' : 'Informação'}</div>
            <div className="mt-1 text-sm">{message}</div>
          </div>
          <button onClick={() => setVisible(false)} className="text-white opacity-90 hover:opacity-100">✕</button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
