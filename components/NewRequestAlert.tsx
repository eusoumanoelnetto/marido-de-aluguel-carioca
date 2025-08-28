import React from 'react';
import { ServiceRequest } from '../types';

interface NewRequestAlertProps {
  requests: ServiceRequest[];
  onClose: () => void;
  onView: () => void;
}

const NewRequestAlert: React.FC<NewRequestAlertProps> = ({ requests, onClose, onView }) => {
  if (!requests.length) return null;
  const count = requests.length;
  const first = requests[0];
  return (
    <div className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center p-4 pointer-events-none">
      <div className="w-full max-w-sm pointer-events-auto bg-white rounded-xl shadow-2xl border border-gray-200 p-5 animate-[fadeIn_.25s_ease]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-blue/10 flex items-center justify-center text-brand-blue">
            <i className="fa-solid fa-bell text-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-brand-navy text-sm mb-1">
              {count > 1 ? `${count} novos pedidos` : 'Novo pedido de serviço'}
            </h3>
            <p className="text-xs text-gray-600 leading-snug truncate">
              {count > 1 ? 'Você recebeu novos pedidos pendentes.' : `${first.clientName} solicitou ${first.category}.`}
            </p>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-600 transition text-sm">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onView} className="flex-1 bg-brand-blue text-white text-sm font-medium py-2 rounded-lg hover:opacity-90">Ver pedidos</button>
          <button onClick={onClose} className="px-3 py-2 text-sm text-brand-navy font-medium hover:underline">Depois</button>
        </div>
      </div>
    </div>
  );
};

export default NewRequestAlert;
