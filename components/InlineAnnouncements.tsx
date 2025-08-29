import React, { useEffect, useState } from 'react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  date?: string;
}

interface Props {
  limit?: number; // opcional: limitar quantidade exibida
}

// Versão compacta de anúncios para dentro do dashboard do cliente.
const InlineAnnouncements: React.FC<Props> = ({ limit }) => {
  const [items, setItems] = useState<Announcement[]>([]);
  const [expanded, setExpanded] = useState(false);
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
  const url = `/announcements.json`; // usar root absoluto para padronizar no Render
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('Falha ao carregar');
        const data: Announcement[] = await res.json();
        if (cancelled) return;
        setItems(data);
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

  const visible = items.slice(0, limit || items.length);
  if (loading) return null; // evitar flicker
  if (error) return null;
  if (!visible.length) return null;

  return (
    <section aria-label="Atualizações" className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-brand-navy">Atualizações</h2>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-xs font-medium text-brand-blue hover:underline"
        >
          {expanded ? 'Recolher' : 'Detalhes'}
        </button>
      </div>
      <div className="space-y-3">
        {visible.map(a => {
          const isSeen = seen.has(a.id);
          return (
            <div key={a.id} className={`border rounded-lg p-4 bg-white shadow-sm relative overflow-hidden`}> 
              {!isSeen && (
                <span className="absolute top-2 right-2 text-[10px] bg-brand-red text-white px-1.5 py-0.5 rounded-full">novo</span>
              )}
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-brand-blue"><i className="fa-solid fa-wrench" /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-brand-navy leading-snug">{a.title}{a.date && <span className="ml-2 text-[11px] font-normal text-gray-500">{new Date(a.date).toLocaleDateString('pt-BR')}</span>}</div>
                  <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {expanded ? a.message : a.message}
                  </div>
                  <div className="mt-2">
                    {!isSeen && (
                      <button onClick={() => markSeen(a.id)} className="text-[11px] text-brand-blue hover:underline">Marcar como lido</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default InlineAnnouncements;