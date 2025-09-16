import React, { useEffect, useState } from 'react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  date?: string;
  target?: 'all' | 'providers' | 'clients';
}

interface Props {
  limit?: number; // opcional: limitar quantidade exibida
  userRole?: 'provider' | 'client';
}

// Versão compacta de anúncios para dentro do dashboard do cliente.
const InlineAnnouncements: React.FC<Props> = ({ limit, userRole }) => {
  const [items, setItems] = useState<Announcement[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('mdac_seenAnnouncements');
      if (raw) return new Set(JSON.parse(raw));
    } catch(_) {}
    return new Set();
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Limpar cache antigo se necessário
        if (typeof window !== 'undefined') {
          console.log('🔍 InlineAnnouncements carregando...');
        }
        
        const candidates = [
          '/announcements.json',
          `${import.meta.env.BASE_URL}announcements.json`,
          `${import.meta.env.BASE_URL.replace(/\/$/, '')}/announcements.json`,
        ];
        let data: Announcement[] | null = null;
        for (const url of candidates) {
          try {
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) continue;
            const json = await res.json();
            if (Array.isArray(json)) { data = json as Announcement[]; break; }
          } catch (err) {
            // tentar próximo
          }
        }
        if (!data) throw new Error('Falha ao carregar');
        if (cancelled) return;
        
        // Filtrar notificações que expiraram (7 dias após a data de criação)
        const now = new Date();
        let validItems = data.filter(item => {
          if (!item.date) return true; // Se não tem data, mantém
          const itemDate = new Date(item.date);
          const expirationDate = new Date(itemDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // +7 dias
          return now <= expirationDate;
        });

        // Filtrar por target (destinatário)
        validItems = validItems.filter(item => {
          if (!item.target || item.target === 'all') return true;
          if (item.target === 'providers' && userRole === 'provider') return true;
          if (item.target === 'clients' && userRole === 'client') return true;
          return false;
        });

        setItems(validItems);
      } catch (e: any) {
        if (!cancelled) setError('Não foi possível carregar atualizações.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const markSeen = (id: string) => {
    setSeen(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem('mdac_seenAnnouncements', JSON.stringify(Array.from(next))); } catch(_) {}
      return next;
    });
  };

  const toggleItemExpanded = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const visible = items.slice(0, limit || items.length);
  const unseenCount = items.filter(a => !seen.has(a.id)).length;
  // Mesmo sem itens visíveis, manter a seção para dar feedback ao usuário
  if (loading) {
    return (
      <section aria-label="Atualizações" className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-brand-navy">Atualizações</h2>
        </div>
        <div className="text-xs text-gray-500">Carregando...</div>
      </section>
    );
  }
  if (error) {
    return (
      <section aria-label="Atualizações" className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-brand-navy">Atualizações</h2>
          <button onClick={() => window.location.reload()} className="text-xs font-medium text-brand-blue hover:underline">Recarregar</button>
        </div>
        <div className="text-xs text-red-500">Não foi possível carregar atualizações.</div>
      </section>
    );
  }

  return (
    <section aria-label="Atualizações" className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-brand-navy flex items-center gap-2">
          <span>Atualizações</span>
          {unseenCount > 0 && (
            <span className="inline-flex items-center justify-center text-[10px] px-1.5 py-0.5 rounded-full bg-brand-blue text-white font-medium">
              {unseenCount}
            </span>
          )}
        </h2>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-xs font-medium text-brand-blue hover:underline"
        >
          {expanded ? 'Recolher' : 'Detalhes'}
        </button>
      </div>
      {visible.length > 0 ? (
        <div className="space-y-3">
          {(expanded ? visible : visible.slice(0, 1)).map(a => {
            const isSeen = seen.has(a.id);
            const isItemExpanded = expandedItems.has(a.id);
            return (
              <div key={a.id} className={`border rounded-lg p-4 bg-white shadow-sm relative overflow-hidden`}> 
                {!isSeen && (
                  <span className="absolute top-2 right-2 text-[10px] bg-brand-red text-white px-1.5 py-0.5 rounded-full">novo</span>
                )}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-brand-blue"><i className="fa-solid fa-wrench" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-brand-navy leading-snug">{a.title}{a.date && <span className="ml-2 text-[11px] font-normal text-gray-500">{new Date(a.date).toLocaleDateString('pt-BR')}</span>}</div>
                    <div className={`text-xs text-gray-600 mt-1 ${isItemExpanded || !expanded ? 'line-clamp-2' : ''}`}>
                      {a.message}
                    </div>
                    <div className="mt-2 flex gap-3">
                      {!isSeen && (
                        <button onClick={() => markSeen(a.id)} className="text-[11px] text-brand-blue hover:underline">Marcar como lido</button>
                      )}
                      {expanded && (
                        <button 
                          onClick={() => toggleItemExpanded(a.id)} 
                          className="text-[11px] text-brand-blue hover:underline"
                        >
                          {isItemExpanded ? 'Menos detalhes' : 'Mais detalhes'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {!expanded && visible.length > 1 && (
            <div className="text-center py-2">
              <button 
                onClick={() => setExpanded(true)} 
                className="text-xs text-brand-blue hover:underline"
              >
                Ver mais {visible.length - 1} notificação{visible.length - 1 > 1 ? 'ões' : ''}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs text-gray-500 border rounded-lg p-4 bg-white shadow-sm">Nenhuma novidade no momento.</div>
      )}
    </section>
  );
};

export default InlineAnnouncements;