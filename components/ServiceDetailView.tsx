import React, { useEffect, useState, useRef } from 'react';
import { ServiceRequest, User } from '../types';
import ProviderPage from '../pages/ProviderPage'; // not actually used; avoid circular? We'll avoid this import.
import '../pages/ProviderPage'; // ensure global styles if any side effects (optional)

interface Props {
  request: ServiceRequest | null;
  onBack: () => void;
  updateRequestStatus: (id: string, status: ServiceRequest['status'], quote?: number, providerEmail?: string) => void;
  currentUser: User;
  getStatusDetails: (status: ServiceRequest['status']) => { text: string; className: string };
}

const ServiceDetailView: React.FC<Props> = ({ request, onBack, updateRequestStatus, currentUser, getStatusDetails }) => {
  const [draftQuote, setDraftQuote] = useState('');
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize / sync from external quote only when not editing
  useEffect(() => {
    if (!request) return;
    if (!editing) {
      const initial = request.quote != null ? request.quote.toString() : '';
      setDraftQuote(initial);
    }
  }, [request?.id, request?.quote, editing]);

  if (!request) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-20">Nenhum serviço selecionado.</div>
      </div>
    );
  }

  const status = getStatusDetails(request.status);

  const handleAccept = () => {
    const value = parseFloat(draftQuote.replace(',', '.'));
    if (isNaN(value) || value <= 0) {
      window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: 'Por favor, insira um valor de orçamento válido.', type: 'error' } }));
      return;
    }
    setEditing(false);
    try { window.dispatchEvent(new CustomEvent('mdac:resumePolling')); } catch {}
    updateRequestStatus(request.id, 'Orçamento Enviado', value, currentUser.email);
    onBack();
  };

  const handleDecline = () => {
    setEditing(false);
    try { window.dispatchEvent(new CustomEvent('mdac:resumePolling')); } catch {}
    updateRequestStatus(request.id, 'Recusado');
    onBack();
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
                type="number"
                value={draftQuote}
                onChange={(e) => { setDraftQuote(e.target.value); if (!editing) setEditing(true); }}
                onFocus={() => { setEditing(true); try { window.dispatchEvent(new CustomEvent('mdac:pausePolling')); } catch {} }}
                onBlur={() => { setEditing(false); try { window.dispatchEvent(new CustomEvent('mdac:resumePolling')); } catch {} }}
                placeholder="Ex: 150.00"
                className="p-3 bg-white border-2 border-gray-300 rounded-lg text-base w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                autoComplete="off"
                step="0.01"
                min="0"
              />
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto min-w-0">
                <button onClick={handleAccept} className="px-5 py-3 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 w-full sm:w-auto text-center">Enviar Orçamento</button>
                <button onClick={handleDecline} className="px-5 py-3 rounded-lg font-semibold bg-brand-red text-white hover:opacity-90 w-full sm:w-auto">Recusar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceDetailView;
