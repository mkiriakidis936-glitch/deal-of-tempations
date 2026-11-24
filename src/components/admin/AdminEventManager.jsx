import React, { useEffect, useState } from 'react';
import { appApi } from '@/api/apiClient';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

const PHASES = {
  one_night: [
    ['arrival', 'Άφιξη'],
    ['preparation', 'Προετοιμασία'],
    ['start', 'Έναρξη'],
    ['show_game_1', 'Show / Παιχνίδι 1'],
    ['break', 'Διάλειμμα'],
    ['show_game_2', 'Show / Παιχνίδι 2'],
    ['final_round', 'Τελικός γύρος'],
    ['close', 'Κλείσιμο'],
  ],
  villa_48h: [
    ['arrival', 'Άφιξη / Check-in'],
    ['day_1', 'Ημέρα 1'],
    ['afternoon', 'Απόγευμα'],
    ['night_1', 'Νύχτα 1'],
    ['dawn_morning', 'Αυγή / Πρωί'],
    ['day_2', 'Ημέρα 2'],
    ['final_show', 'Τελικό Show'],
    ['finale', 'Φινάλε'],
    ['close', 'Κλείσιμο'],
  ],
};
const STATUSES = [
  ['prep', 'Προετοιμασία'],
  ['arrival', 'Άφιξη'],
  ['active', 'Σε εξέλιξη'],
  ['closing', 'Κλείσιμο'],
  ['completed', 'Ολοκληρώθηκε'],
];
const phaseLabel = (event) => (PHASES[event.type] || []).find(([id]) => id === event.phase)?.[1] || event.phase || '—';
const typeLabel = (type) => type === 'villa_48h' ? '48H VILLA' : 'ONE NIGHT';

export default function AdminEventManager() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [savingId, setSavingId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('one_night');
  const [creating, setCreating] = useState(false);

  async function createEvent() {
    setCreating(true);
    setMessage('');
    try {
      let roomCode = '';
      for (let attempt = 0; attempt < 12 && !roomCode; attempt += 1) {
        const candidate = Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
        const { items } = await appApi.entities.DotEvent.filter({ room_code: candidate }, { limit: 1 });
        if (!items?.length) roomCode = candidate;
      }
      if (!roomCode) throw new Error('Δεν δημιουργήθηκε μοναδικός κωδικός.');
      await appApi.entities.DotEvent.create({ title: newTitle.trim() || (newType === 'villa_48h' ? '48H VILLA' : 'ONE NIGHT'), type: newType, status: 'prep', phase: 'arrival', room_code: roomCode, notes: '', interestIds: [], expectedCount: 0 });
      setNewTitle('');
      setMessage(`Δημιουργήθηκε νέο Event με κωδικό ${roomCode}.`);
      await loadEvents();
    } catch (error) {
      setMessage(error.message || 'Δεν δημιουργήθηκε το Event.');
    } finally {
      setCreating(false);
    }
  }

  async function loadEvents() {
    try {
      const { items } = await appApi.entities.DotEvent.filter({}, { sort: '-created_date', limit: 200 });
      setEvents(items || []);
    } catch (error) {
      setMessage(error.message || 'Δεν φορτώθηκαν τα Events.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
    const off = appApi.entities.DotEvent.subscribe(() => loadEvents());
    return () => off?.();
  }, []);

  async function updateEvent(event, patch) {
    setSavingId(event.id);
    setMessage('');
    try {
      const updated = await appApi.entities.DotEvent.update(event.id, patch);
      setEvents((current) => current.map((item) => item.id === event.id ? updated : item));
      setMessage('Το Event ενημερώθηκε.');
    } catch (error) {
      setMessage(error.message || 'Δεν αποθηκεύτηκε η αλλαγή.');
    } finally {
      setSavingId('');
    }
  }

  async function nextPhase(event) {
    const phases = PHASES[event.type] || [];
    const index = phases.findIndex(([id]) => id === event.phase);
    const next = phases[Math.min(index + 1, phases.length - 1)];
    if (next && next[0] !== event.phase) await updateEvent(event, { phase: next[0] });
  }

  return (
    <div className="space-y-4">
      <ComicPanel className="bg-card space-y-2">
        <h2 className="font-heading text-2xl text-primary">ΔΙΑΧΕΙΡΙΣΗ EVENT</h2>
        <div className="flex flex-wrap gap-2">
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Τίτλος (π.χ. Βραδιά Σαββάτου)" className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <select value={newType} onChange={(e) => setNewType(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="one_night">ONE NIGHT</option>
            <option value="villa_48h">48H VILLA</option>
          </select>
          <ComicButton size="sm" disabled={creating} onClick={createEvent}>{creating ? 'Δημιουργία…' : '+ ΝΕΟ EVENT'}</ComicButton>
        </div>
      </ComicPanel>

      {message && <ComicPanel className="bg-secondary p-3"><p role="status" className="text-sm">{message}</p></ComicPanel>}
      {loading ? <ComicPanel>Φόρτωση Events…</ComicPanel> : events.length === 0 ? (
        <ComicPanel className="text-center text-sm text-foreground/60">Δεν υπάρχει ακόμη Event. Πάτα «+ ΝΕΟ EVENT» ή δημιούργησέ το από τις δηλώσεις ενδιαφέροντος.</ComicPanel>
      ) : events.map((event) => {
        const phases = PHASES[event.type] || [];
        const url = `${window.location.origin}/deal/${event.room_code}`;
        return (
          <ComicPanel key={event.id} className="bg-card space-y-3 border border-[#b99a45]/40">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-[10px] tracking-[.25em] text-[#b99a45]">{typeLabel(event.type)}</div>
                <input aria-label="Τίτλος Event" defaultValue={event.title} key={`${event.id}-${event.title}`} maxLength={100} className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1 font-heading text-xl text-[#E8C26B]" onBlur={(e) => { if (e.target.value.trim() && e.target.value.trim() !== event.title) updateEvent(event, { title: e.target.value.trim() }); }} />
                <div className="text-xs text-foreground/50">{event.created_date ? new Date(event.created_date).toLocaleString('el-GR') : ''}</div>
              </div>
              <span className="rounded-full border border-[#b99a45]/60 px-3 py-1 text-xs">{STATUSES.find(([id]) => id === event.status)?.[1] || event.status}</span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="space-y-1 text-xs font-bold text-[#E8C26B]">ΚΑΤΑΣΤΑΣΗ
                <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" value={event.status} disabled={savingId === event.id} onChange={(e) => updateEvent(event, { status: e.target.value })}>
                  {STATUSES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-xs font-bold text-[#E8C26B]">ΤΡΕΧΟΥΣΑ ΦΑΣΗ
                <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" value={event.phase} disabled={savingId === event.id} onChange={(e) => updateEvent(event, { phase: e.target.value })}>
                  {phases.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </select>
              </label>
            </div>

            <div className="rounded-xl border border-[#b99a45]/30 bg-black/40 p-3">
              <div className="text-[10px] tracking-widest text-[#b99a45]">ΤΡΕΧΟΥΣΑ ΦΑΣΗ</div>
              <div className="font-heading text-lg text-[#F7E3A8]">{phaseLabel(event)}</div>
              <ComicButton size="sm" disabled={savingId === event.id || event.phase === phases.at(-1)?.[0]} onClick={() => nextPhase(event)}>ΕΠΟΜΕΝΗ ΦΑΣΗ</ComicButton>
            </div>

            <label className="block space-y-1 text-xs font-bold text-[#E8C26B]">ΣΥΝΤΟΝΙΣΤΙΚΕΣ ΣΗΜΕΙΩΣΕΙΣ
              <textarea defaultValue={event.notes || ''} key={`${event.id}-${event.notes || ''}`} rows={2} maxLength={3000} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" onBlur={(e) => { if (e.target.value !== (event.notes || '')) updateEvent(event, { notes: e.target.value }); }} />
            </label>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-3">
                <div className="text-[10px] text-foreground/50">ΚΩΔΙΚΟΣ ΔΩΜΑΤΙΟΥ</div>
                <div className="font-mono text-xl tracking-[.2em] text-[#E8C26B]">{event.room_code}</div>
                <div className="text-xs text-foreground/60">Αναμενόμενες συμμετοχές: {event.expectedCount ?? event.interestIds?.length ?? 0}</div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-[10px] text-foreground/50">ΣΥΝΔΕΣΗ GAMESESSION · ΜΟΝΟ ΑΝΑΓΝΩΣΗ</div>
                <div className="font-mono text-sm text-foreground">{event.gameSessionCode || 'Δεν έχει ξεκινήσει παιχνίδι'}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <ComicButton size="sm" onClick={() => navigator.clipboard.writeText(url)}>ΑΝΤΙΓΡΑΦΗ ΣΥΝΔΕΣΜΟΥ ΣΥΜΜΕΤΟΧΗΣ</ComicButton>
              <a href={`/deal/${event.room_code}`} target="_blank" rel="noreferrer" className="self-center text-xs underline text-[#E8C26B]">Άνοιγμα φόρμας Event</a>
            </div>
          </ComicPanel>
        );
      })}
    </div>
  );
}
