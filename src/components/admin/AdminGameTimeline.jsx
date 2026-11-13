import React, { useEffect, useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import { base44 } from '@/api/base44Client';

const FIELD_LABELS = {
  stage: 'Στάδιο',
  players: 'Παίκτες',
  stopActive: 'Παύση / συνέχεια',
  activeCard: 'Κάρτα',
  history: 'Ιστορικό',
  mobileVotes: 'Ψηφοφορίες κινητών',
  juryTrial: 'Δοκιμασία κριτικής επιτροπής',
  grandJury: 'Grand Jury',
  privateMessages: 'Προσωπικά μηνύματα',
  mg: 'Ενέργειες Mode',
  pajama: 'Ενέργειες Pajama',
  timer: 'Χρονόμετρο',
};

const labelOf = (event) => {
  const fields = (event.changedFields || []).map((field) => FIELD_LABELS[field] || field);
  return fields.length ? fields.join(' · ') : event.summary || 'Ενημέρωση παιχνιδιού';
};

export default function AdminGameTimeline({ session }) {
  const [live, setLive] = useState(session || null);
  const [events, setEvents] = useState([]);
  useEffect(() => {
    setLive(session || null);
    setEvents([]);
    if (!session?.id) return undefined;
    let active = true;
    base44.entities.GameSessionEvent.filter({ sessionId: session.id }, { sort: '-created_date', limit: 100 })
      .then(({ items }) => { if (active) setEvents(items || []); })
      .catch((error) => console.error('Timeline load failed', error));
    const unsubscribe = base44.entities.GameSessionEvent.subscribe((event) => {
      if (event.type === 'delete') {
        setEvents((current) => current.filter((item) => item.id !== event.id));
        return;
      }
      if (event.data?.sessionId !== session.id) return;
      setEvents((current) => [event.data, ...current.filter((item) => item.id !== event.data.id)].slice(0, 100));
    });
    const unsubscribeSession = base44.entities.GameSession.subscribe((event) => {
      if (event.id !== session.id || event.type === 'delete') return;
      setLive((current) => ({ ...current, ...event.data }));
    }, { sessionCode: session.sessionCode });
    return () => { active = false; unsubscribe(); unsubscribeSession(); };
  }, [session?.id, session?.sessionCode]);
  const state = live?.state || {};
  const legacy = Array.isArray(state.history) ? state.history : [];
  return (
    <div className="space-y-3">
      <ComicPanel className="bg-card">
        <div className="font-heading text-xl text-primary">LIVE GAME TIMELINE</div>
        <p className="text-xs text-foreground/65 mt-1">Ζωντανό ιστορικό ενεργειών παρουσιαστή και παικτών, χωρίς αλλαγή στη ροή του παιχνιδιού.</p>
        {live ? <div className="text-xs font-bold mt-2">{live.sessionCode} · {state.mode || live.mode || '—'} · Στάδιο {state.stage ?? 0}</div> : <div className="text-sm mt-3">Δεν υπάρχει επιλεγμένη συνεδρία.</div>}
      </ComicPanel>
      {live && (events.length ? events.map((event) => (
        <ComicPanel key={event.id} className="bg-card">
          <div className="flex items-start gap-3">
            <div className="font-heading text-primary text-sm shrink-0">{event.actorType === 'host' ? 'HOST' : 'PLAYER'}</div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold">{labelOf(event)}</div>
              <div className="text-[11px] text-foreground/55 mt-1">{event.actorType === 'host' ? 'Παρουσιαστής' : 'Παίκτης'} · Στάδιο {event.stage} · {event.created_date ? new Date(event.created_date).toLocaleString('el-GR') : ''}</div>
            </div>
          </div>
        </ComicPanel>
      )) : legacy.length ? legacy.map((event, index) => (
        <ComicPanel key={event.id || event.timestamp || index} className="bg-card">
          <div className="text-sm font-bold">{event.description || event.message || event.text || event.type || 'Γεγονός'}</div>
          <div className="text-[11px] text-foreground/55 mt-1">{event.playerName || event.player || ''}{event.timestamp ? ` · ${new Date(event.timestamp).toLocaleString('el-GR')}` : ''}</div>
        </ComicPanel>
      )) : <ComicPanel className="bg-card text-sm text-foreground/60">Δεν έχουν καταγραφεί ακόμη ενέργειες στη συνεδρία.</ComicPanel>)}
    </div>
  );
}
