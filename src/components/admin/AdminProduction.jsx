import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

const EMPTY = {
  title: '', format: 'Private Reality Game Night', host: '', venue: '', scheduledAt: '',
  status: 'planning', runtimeMinutes: 240, overnight: false, introScript: '',
  rundown: [
    { id: 'arrival', title: 'Άφιξη & υποδοχή', duration: 20, notes: '' },
    { id: 'opening', title: 'Opening & παρουσίαση', duration: 10, notes: '' },
    { id: 'cast', title: 'Παρουσίαση συμμετεχόντων', duration: 15, notes: '' },
    { id: 'game', title: 'Κύριο παιχνίδι', duration: 90, notes: '' },
    { id: 'break', title: 'Commercial Break', duration: 15, notes: '' },
    { id: 'finale', title: 'Finale & Winner’s Vault', duration: 20, notes: '' },
    { id: 'recap', title: 'Recap & ολοκλήρωση', duration: 10, notes: '' },
  ],
  cues: [
    { id: 'intro', label: 'Intro Video', kind: 'video', source: '', notes: '' },
    { id: 'theme', label: 'Sound Identity', kind: 'audio', source: '', notes: '' },
    { id: 'break', label: 'Commercial Break', kind: 'scene', source: '', notes: '' },
    { id: 'winner', label: 'Winner Reveal', kind: 'scene', source: '', notes: '' },
  ],
  winnerName: '', winnerNotes: '', recapNotes: '', recapMedia: [],
  recordingNotice: 'Η καταγραφή γίνεται μόνο κατόπιν ενημέρωσης και συγκατάθεσης των συμμετεχόντων.',
  privateNotes: '',
};

const STATUS = [
  ['planning', 'Προετοιμασία'], ['ready', 'Έτοιμο'], ['live', 'Σε εξέλιξη'],
  ['paused', 'Σε διάλειμμα'], ['completed', 'Ολοκληρώθηκε'],
];
const uid = () => globalThis.crypto?.randomUUID?.() || String(Date.now() + Math.random());

export default function AdminProduction({ sessions = [], selectedSession = null, onSelect }) {
  const [selectedId, setSelectedId] = useState(selectedSession?.id || sessions[0]?.id || '');
  const [record, setRecord] = useState(null);
  const [draft, setDraft] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [dirty, setDirty] = useState(false);
  const selected = useMemo(() => sessions.find((s) => s.id === selectedId) || selectedSession || null, [sessions, selectedId, selectedSession]);

  useEffect(() => {
    if (selectedSession?.id) setSelectedId(selectedSession.id);
  }, [selectedSession?.id]);

  const load = useCallback(async () => {
    if (!selected?.sessionCode) { setRecord(null); setDraft(EMPTY); return; }
    setLoading(true); setMessage('');
    try {
      const { items = [] } = await base44.entities.ShowProduction.filter(
        { sessionCode: selected.sessionCode }, { sort: '-updated_date', limit: 1 }
      );
      const found = items[0] || null;
      setRecord(found);
      setDraft({ ...EMPTY, ...(found || {}), rundown: Array.isArray(found?.rundown) ? found.rundown : EMPTY.rundown, cues: Array.isArray(found?.cues) ? found.cues : EMPTY.cues, recapMedia: Array.isArray(found?.recapMedia) ? found.recapMedia : [] });
      setDirty(false);
    } catch (error) {
      setMessage(error.message || 'Δεν ήταν δυνατή η φόρτωση της παραγωγής.');
    } finally { setLoading(false); }
  }, [selected?.sessionCode]);

  useEffect(() => { load(); }, [load]);

  const change = (patch) => { setDraft((current) => ({ ...current, ...patch })); setDirty(true); };
  const updateItem = (key, id, patch) => change({ [key]: draft[key].map((item) => item.id === id ? { ...item, ...patch } : item) });
  const addItem = (key, item) => change({ [key]: [...draft[key], { id: uid(), ...item }] });
  const removeItem = (key, id) => change({ [key]: draft[key].filter((item) => item.id !== id) });

  async function save() {
    if (!selected?.sessionCode) return;
    setSaving(true); setMessage('');
    try {
      const payload = { ...draft, sessionCode: selected.sessionCode, sessionId: selected.id, mode: selected.mode || '', eventTitle: selected.event?.title || selected.mode || 'DEAL OF TEMPTATIONS' };
      let saved;
      if (record?.id) saved = await base44.entities.ShowProduction.update(record.id, payload);
      else saved = await base44.entities.ShowProduction.create(payload);
      setRecord(saved); setDraft({ ...EMPTY, ...saved }); setDirty(false);
      setMessage('Η παραγωγή αποθηκεύτηκε.');
    } catch (error) { setMessage(error.message || 'Η αποθήκευση δεν ολοκληρώθηκε.'); }
    finally { setSaving(false); }
  }

  const field = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm';
  const label = 'block space-y-1 text-xs font-bold text-foreground/75';

  return <div className="space-y-3">
    <ComicPanel className="bg-card space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><div className="font-heading text-2xl text-primary">THE PRODUCTION ROOM</div><p className="text-xs text-foreground/60">Κεντρική οργάνωση της ιδιωτικής Reality Show εμπειρίας.</p></div>
        <span className="rounded-full border border-primary/40 px-3 py-1 text-[10px] font-bold text-primary">SHOW CONTROL</span>
      </div>
      <label className={label}>Επιλογή διοργάνωσης
        <select className={field} value={selected?.id || ''} onChange={(e) => { setSelectedId(e.target.value); const next = sessions.find((s) => s.id === e.target.value); if (next) onSelect?.(next); }}>
          <option value="">Επίλεξε υπάρχουσα διοργάνωση</option>
          {sessions.map((s) => <option key={s.id} value={s.id}>{s.event?.title || s.mode || 'Game'} · {s.sessionCode}</option>)}
        </select>
      </label>
      {!selected && <p className="text-sm text-foreground/60">Δεν υπάρχει ενεργή διοργάνωση. Η παραγωγή συνδέεται με υπάρχον Event και δεν δημιουργεί ή αλλάζει παρτίδες.</p>}
      {selected && <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div className="rounded-lg bg-secondary p-2"><div className="text-lg font-bold">{selected.sessionCode}</div><div className="text-[10px]">Κωδικός Event</div></div>
        <div className="rounded-lg bg-secondary p-2"><div className="text-lg font-bold">{(selected.state?.players || []).length}</div><div className="text-[10px]">Συμμετέχοντες</div></div>
        <div className="rounded-lg bg-secondary p-2"><div className="text-lg font-bold">{draft.rundown.length}</div><div className="text-[10px]">Στάδια ροής</div></div>
        <div className="rounded-lg bg-secondary p-2"><div className="text-lg font-bold">{draft.cues.length}</div><div className="text-[10px]">Σημεία παραγωγής</div></div>
      </div>}
    </ComicPanel>

    {message && <ComicPanel className="bg-secondary"><p className="text-sm font-bold">{message}</p></ComicPanel>}
    {selected && <>
      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg">ΤΑΥΤΟΤΗΤΑ ΠΑΡΑΓΩΓΗΣ</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className={label}>Τίτλος παραγωγής<input className={field} value={draft.title} onChange={(e) => change({ title: e.target.value })} placeholder="The Private Reality Game Night" /></label>
          <label className={label}>Παρουσιαστής / Host<input className={field} value={draft.host} onChange={(e) => change({ host: e.target.value })} /></label>
          <label className={label}>Ημερομηνία & ώρα<input type="datetime-local" className={field} value={draft.scheduledAt} onChange={(e) => change({ scheduledAt: e.target.value })} /></label>
          <label className={label}>Χώρος<input className={field} value={draft.venue} onChange={(e) => change({ venue: e.target.value })} /></label>
          <label className={label}>Συνολική διάρκεια (λεπτά)<input type="number" min="30" className={field} value={draft.runtimeMinutes} onChange={(e) => change({ runtimeMinutes: Math.max(30, Number(e.target.value) || 30) })} /></label>
          <label className={label}>Κατάσταση παραγωγής<select className={field} value={draft.status} onChange={(e) => change({ status: e.target.value })}>{STATUS.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!draft.overnight} onChange={(e) => change({ overnight: e.target.checked })} /> Μορφή Overnight Experience</label>
        <label className={label}>Κείμενο έναρξης / Intro Script<textarea rows={4} className={field} value={draft.introScript} onChange={(e) => change({ introScript: e.target.value })} placeholder="Κείμενο παρουσίασης της βραδιάς..." /></label>
      </ComicPanel>

      <ComicPanel className="bg-card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><div className="font-heading text-lg">RUN OF SHOW · ΠΡΟΓΡΑΜΜΑ</div><ComicButton size="sm" onClick={() => addItem('rundown', { title: 'Νέο στάδιο', duration: 10, notes: '' })}>+ ΣΤΑΔΙΟ</ComicButton></div>
        {draft.rundown.map((item, index) => <div key={item.id} className="rounded-xl border border-border/60 p-3 space-y-2">
          <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-primary">ΣΤΑΔΙΟ {index + 1}</span><button type="button" className="text-xs text-red-400" onClick={() => removeItem('rundown', item.id)}>Αφαίρεση</button></div>
          <div className="grid sm:grid-cols-[1fr_110px] gap-2"><input className={field} value={item.title} onChange={(e) => updateItem('rundown', item.id, { title: e.target.value })} /><input type="number" min="1" className={field} value={item.duration} onChange={(e) => updateItem('rundown', item.id, { duration: Math.max(1, Number(e.target.value) || 1) })} /></div>
          <input className={field} value={item.notes || ''} onChange={(e) => updateItem('rundown', item.id, { notes: e.target.value })} placeholder="Σημειώσεις / οδηγίες" />
        </div>)}
        <p className="text-[11px] text-foreground/50">Η σειρά και οι διάρκειες αφορούν την παραγωγή και δεν αλλάζουν τη ροή ή τους κανόνες του παιχνιδιού.</p>
      </ComicPanel>

      <ComicPanel className="bg-card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><div className="font-heading text-lg">CUE SHEET · ΣΗΜΕΙΑ ΠΑΡΑΓΩΓΗΣ</div><ComicButton size="sm" onClick={() => addItem('cues', { label: 'Νέο cue', kind: 'scene', source: '', notes: '' })}>+ CUE</ComicButton></div>
        {draft.cues.map((cue) => <div key={cue.id} className="grid sm:grid-cols-[1fr_130px] gap-2 rounded-xl border border-border/60 p-3">
          <div className="space-y-2"><input className={field} value={cue.label} onChange={(e) => updateItem('cues', cue.id, { label: e.target.value })} /><input className={field} value={cue.source || ''} onChange={(e) => updateItem('cues', cue.id, { source: e.target.value })} placeholder="Σύνδεσμος ή όνομα αρχείου" /><input className={field} value={cue.notes || ''} onChange={(e) => updateItem('cues', cue.id, { notes: e.target.value })} placeholder="Οδηγίες χειρισμού" /></div>
          <div className="space-y-2"><select className={field} value={cue.kind} onChange={(e) => updateItem('cues', cue.id, { kind: e.target.value })}><option value="video">Βίντεο</option><option value="audio">Ήχος</option><option value="scene">Σκηνή</option><option value="break">Διάλειμμα</option><option value="camera">Κάμερα</option></select><button type="button" className="text-xs text-red-400" onClick={() => removeItem('cues', cue.id)}>Αφαίρεση cue</button></div>
        </div>)}
      </ComicPanel>

      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg">WINNER’S VAULT & RECAP</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className={label}>Νικητής / νικήτρια<input className={field} value={draft.winnerName} onChange={(e) => change({ winnerName: e.target.value })} /></label>
          <label className={label}>Σημειώσεις τελικής ανακοίνωσης<input className={field} value={draft.winnerNotes} onChange={(e) => change({ winnerNotes: e.target.value })} /></label>
        </div>
        <label className={label}>Recap — επιλεγμένες στιγμές & περιγραφή<textarea rows={3} className={field} value={draft.recapNotes} onChange={(e) => change({ recapNotes: e.target.value })} /></label>
        <label className={label}>Σύνδεσμοι υλικού (ένας ανά γραμμή)<textarea rows={3} className={field} value={(draft.recapMedia || []).join('\n')} onChange={(e) => change({ recapMedia: e.target.value.split('\n').map((v) => v.trim()).filter(Boolean) })} placeholder="https://..." /></label>
      </ComicPanel>

      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg">ΕΝΗΜΕΡΩΣΗ & ΙΔΙΩΤΙΚΟΤΗΤΑ</div>
        <label className={label}>Ενημέρωση καταγραφής<textarea rows={3} className={field} value={draft.recordingNotice} onChange={(e) => change({ recordingNotice: e.target.value })} /></label>
        <p className="text-[11px] text-foreground/55">Η καταχώριση ενημέρωσης δεν αποτελεί απόδειξη συγκατάθεσης. Η καταγραφή ή δημοσίευση υλικού απαιτεί ξεχωριστή, πραγματική συγκατάθεση από κάθε συμμετέχοντα.</p>
        <label className={label}>Ιδιωτικές σημειώσεις παραγωγής<textarea rows={3} className={field} value={draft.privateNotes} onChange={(e) => change({ privateNotes: e.target.value })} /></label>
      </ComicPanel>

      <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/30 bg-card/95 p-3 shadow-xl backdrop-blur">
        <span className="text-xs text-foreground/60">{loading ? 'Φόρτωση…' : dirty ? 'Υπάρχουν μη αποθηκευμένες αλλαγές' : 'Οι αλλαγές είναι αποθηκευμένες'}</span>
        <div className="flex gap-2"><ComicButton variant="dark" size="sm" onClick={load} disabled={loading || saving}>ΕΠΑΝΑΦΟΡΤΩΣΗ</ComicButton><ComicButton size="sm" onClick={save} disabled={saving || loading}>{saving ? 'ΑΠΟΘΗΚΕΥΣΗ…' : 'ΑΠΟΘΗΚΕΥΣΗ ΠΑΡΑΓΩΓΗΣ'}</ComicButton></div>
      </div>
    </>}
  </div>;
}
