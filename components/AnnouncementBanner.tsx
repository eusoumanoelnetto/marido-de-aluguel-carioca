import React, { useEffect, useState } from 'react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  date?: string; // ISO
}

interface Props {
  role: 'client' | 'provider' | undefined;
}

// Banner de anúncios/atualizações: busca /announcements.json (gerado e versionado) e exibe itens não vistos.
// Persistência: localStorage chave mdac_seenAnnouncements (array de ids)
const AnnouncementBanner: React.FC<Props> = ({ role }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchAnnouncements = async () => {
      try {
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
            if (Array.isArray(json)) {
              data = json as Announcement[];
              break;
            }
          } catch (err) {
            // tentar próximo
          }
        }
        if (!data) return;
        if (cancelled) return;
        
        // Filtrar notificações que expiraram (7 dias após a data de criação)
        const now = new Date();
        const validItems = data.filter(item => {
          if (!item.date) return true; // Se não tem data, mantém
          const itemDate = new Date(item.date);
          const expirationDate = new Date(itemDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // +7 dias
          return now <= expirationDate;
        });
        
        const seenRaw = localStorage.getItem('mdac_seenAnnouncements');
        let seen: string[] = [];
        try { if (seenRaw) seen = JSON.parse(seenRaw); } catch(_) {}
        const notSeen = validItems.filter(a => !seen.includes(a.id));
        setAnnouncements(validItems);
        setVisibleIds(notSeen.map(a => a.id));
      } catch (e) {
        // silencioso
      }
    };
    fetchAnnouncements();
    return () => { cancelled = true; };
  }, []);

  if (!role) return null;
  if (!visibleIds.length) return null;

  const items = announcements.filter(a => visibleIds.includes(a.id));
  if (!items.length) return null;

  const dismiss = (id?: string) => {
    setVisibleIds(prev => {
      const next = id ? prev.filter(p => p !== id) : [];
      // persistir como vistos
      try {
        const seenRaw = localStorage.getItem('mdac_seenAnnouncements');
        let seen: string[] = [];
        try { if (seenRaw) seen = JSON.parse(seenRaw); } catch(_) {}
        const all = Array.from(new Set([...seen, ...(id ? [id] : prev)]));
        localStorage.setItem('mdac_seenAnnouncements', JSON.stringify(all));
      } catch(_) {}
      return next;
    });
  };

  const first = items[0];
  const multiple = items.length > 1;

  return (
    <div className={`w-full bg-gradient-to-r from-brand-blue to-sky-600 text-white shadow ${collapsed ? 'cursor-pointer' : ''}`}
         onClick={() => { if (collapsed) setCollapsed(false); }}>
      <div className="max-w-7xl mx-auto px-4 py-2 text-sm flex flex-col gap-1">
        <div className="flex items-start gap-3">
          <div className="pt-1"><i className="fa-solid fa-bullhorn" /></div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold leading-snug">{multiple ? `${items.length} novidades` : first.title}</div>
            {!collapsed && (
              <div className="mt-0.5 leading-snug">
                {multiple ? 'Clique para ver detalhes das atualizações mais recentes.' : first.message}
                {first.date && <span className="ml-2 opacity-80">({new Date(first.date).toLocaleDateString('pt-BR')})</span>}
              </div>
            )}
            {!collapsed && multiple && (
              <ul className="mt-1 list-disc pl-5 space-y-0.5">
                {items.slice(0,3).map(a => (
                  <li key={a.id} className="text-xs"><span className="font-medium">{a.title}:</span> {a.message}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 ml-2">
            <button onClick={(e) => { e.stopPropagation(); setCollapsed(c => !c); }} className="text-white/90 hover:text-white text-xs px-2 py-1 rounded bg-white/10">
              {collapsed ? 'Abrir' : 'Recolher'}
            </button>
            <button onClick={(e) => { e.stopPropagation(); dismiss(); }} className="text-white/70 hover:text-white text-xs px-2 py-1 rounded">
              Dispensar
            </button>
          </div>
        </div>
        {!collapsed && items.length === 1 && (
          <div className="flex justify-end">
            <button onClick={() => dismiss(first.id)} className="text-white/80 hover:text-white text-[11px] underline">Marcar como lido</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementBanner;