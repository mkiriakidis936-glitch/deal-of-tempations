import React, { useEffect, useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import { base44 } from '@/api/base44Client';

const labelOf = (event) => {
  if (!event) return 'Ενημέρωση παιχνιδιού';
  return event.description || event.message || event.text || ({
    move: 'Μετακίνηση παίκτη',
    skip: 'Παράλειψη σειράς',
    command: 'Ενέργεια παρουσιαστή',
    truth: 'Truth',
    dare: 'Dare',
    confession: 'Εξομολόγηση',
    arrest: 'Σύλληψη',
    heist: 'Ληστεία',
    plot_twist: 'Ανατροπή',
    glitch: 'Glitch',
  }[event.type] || String(event.type || 'Γεγονός').replaceAll('_', ' '));
};

export default function AdminGameTimeline({ session }) {
  const [live, setLive] = useState(session || null);
  useEffect(() => {
    setLive(session || null);
    if (!session?.id) return undefined;
    return base44.entities.GameSession.subscribe((event) => {
      if (event.id !== session.id || event.type === 'delete') return;
      setLive((current) => ({ ...current, ...event.data }));
    }, { sessionCode: session.sessionCode });
  }, [session?.id, session?.sessionCode]);
  const state = live?.state || {};
  const events = Array.isArray(state.history) ? [...state.history] : [];
  return (
    <div className="space-y-3">
      <ComicPanel className="bg-card">
        <div className="font-heading text-xl text-primary">LIVE GAME TIMELINE</div>
        <p className="text-xs text-foreground/65 mt-1">Ζωντανή, μόνο για προβολή, καταγραφή των γεγονότων που υπάρχουν ήδη στη συνεδρία.</p>
        {live ? <div className="text-xs font-bold mt-2">{live.sessionCode} · {state.mode || live.mode || '—'} · Στάδιο {state.stage ?? 0}</div> : <div className="text-sm mt-3">Δεν υπάρχει επιλεγμένη συνεδρία.</div>}
      </ComicPanel>
      {live && (events.length ? events.map((event, index) => (
        <ComicPanel key={event.id || event.timestamp || index} className="bg-card">
          <div className="flex items-start gap-3">
            <div className="font-heading text-primary text-sm shrink-0">{String(events.length - index).padStart(2, '0')}</div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold">{labelOf(event)}</div>
              <div className="text-[11px] text-foreground/55 mt-1">{event.playerName || event.player || event.voter || ''}{event.timestamp ? ` · ${new Date(event.timestamp).toLocaleString('el-GR')}` : ''}</div>
            </div>
          </div>
        </ComicPanel>
      )) : <ComicPanel className="bg-card text-sm text-foreground/60">Δεν υπάρχουν καταγεγραμμένα γεγονότα στο ιστορικό αυτής της συνεδρίας.</ComicPanel>)}
    </div>
  );
}
