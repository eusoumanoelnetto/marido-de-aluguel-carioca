import React from 'react';
import { ServiceRequest } from '../types';

interface NewRequestAlertProps {
  requests: ServiceRequest[];
  onClose: () => void;
  // if id is provided, view that specific request; otherwise view all
  onView: (id?: string) => void;
}

const NewRequestAlert = ({ requests, onClose, onView }: any) => {
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

        {/* Lista curta de pedidos para acesso rápido */}
        <div className="mt-3 space-y-2">
          {requests.slice(0, 4).map(r => {
            const hasQuote = r.quote !== undefined && r.quote !== null && String(r.quote).trim() !== '';
            const isPending = r.status === 'Pendente';
            const formattedQuote = hasQuote ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(r.quote)) : null;
            return (
              <div key={r.id} className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-100 p-2 rounded-md">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-brand-navy truncate">{r.clientName}</div>
                    <div className="text-xs text-gray-500 px-2 py-0.5 rounded-md bg-white/60 border border-gray-100">{r.category}</div>
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {new Date(r.requestDate).toLocaleString()} {hasQuote && (<span className="ml-2 font-semibold text-gray-700">• {formattedQuote}</span>)}
                  </div>
                </div>
                <div className="ml-2 flex items-center gap-2">
                  {!isPending && (
                    <span className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-600">{r.status}</span>
                  )}
                  <button onClick={() => onView(r.id)} disabled={!isPending} className={`px-3 py-1.5 rounded-md text-sm ${isPending ? 'bg-brand-blue text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
                    {isPending ? 'Ver' : 'Visualizar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={() => onView()} className="flex-1 bg-brand-blue text-white text-sm font-medium py-2 rounded-lg hover:opacity-90">Ver todos</button>
          <button onClick={onClose} className="px-3 py-2 text-sm text-brand-navy font-medium hover:underline">Depois</button>
        </div>
      </div>
    </div>
  );
};

export default NewRequestAlert;
