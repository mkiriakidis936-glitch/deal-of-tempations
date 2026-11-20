import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

const EVENT_TYPES = [
  { id: 'one_night', label: 'ONE NIGHT', firstPhase: 'arrival' },
  { id: 'villa_48h', label: '48H VILLA', firstPhase: 'arrival' },
];
const choiceLabel = (choice) => choice === 'yes' ? 'ΘΕΛΩ ΝΑ ΣΥΜΜΕΤΕΧΩ' : 'ΔΕΝ ΜΠΟΡΩ ΝΑ ΣΥΜΜΕΤΕΧΩ';
const makeRoomCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(4);
  globalThis.crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => alphabet[byte % alphabet.length]).join('');
};

export default function AdminInterestParticipation() {
  const [interests, setInterests] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [responses, setResponses] = useState([]);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function loadAll() {
    try {
      const [interestResult, eventResult] = await Promise.all([
        base44.entities.Interest.filter({}, { sort: '-created_date', limit: 500 }),
        base44.entities.DotEvent.filter({}, { sort: '-created_date', limit: 200 }),
      ]);
      setInterests(interestResult.items || []);
      setEvents(eventResult.items || []);
      setSelectedEventId((current) => current || eventResult.items?.[0]?.id || '');
    } catch (error) {
      setMessage(error.message || 'Δεν φορτώθηκαν οι δηλώσεις.');
    }
  }

  async function loadResponses(eventId = selectedEventId, eventRows = events) {
    const event = eventRows.find((item) => item.id === eventId);
    if (!event?.room_code) { setResponses([]); return; }
    try {
      const { items } = await base44.entities.Participation.filter({ roomCode: event.room_code }, { sort: '-created_date', limit: 500 });
      setResponses(items || []);
    } catch (error) {
      setMessage(error.message || 'Δεν φορτώθηκαν οι συμμετοχές του Event.');
    }
  }

  useEffect(() => {
    loadAll();
    const offInterest = base44.entities.Interest.subscribe(() => loadAll());
    const offEvents = base44.entities.DotEvent.subscribe(() => loadAll());
    const offParticipation = base44.entities.Participation.subscribe(() => loadAll());
    return () => { offInterest?.(); offEvents?.(); offParticipation?.(); };
  }, []);

  useEffect(() => { loadResponses(); }, [selectedEventId, events]);

  const selectedInterests = interests.filter((item) => selectedIds.includes(item.id));
  const selectedTypes = [...new Set(selectedInterests.map((item) => item.eventType))];
  const canCreateEvent = selectedInterests.length > 0 && selectedTypes.length === 1 && selectedInterests.every((item) => item.declaration === 'yes' && !item.dotEventId);
  const selectedEvent = events.find((item) => item.id === selectedEventId) || null;
  const filteredInterests = interests.filter((item) => {
    const q = search.trim().toLocaleLowerCase('el-GR');
    return !q || String(item.name || '').toLocaleLowerCase('el-GR').includes(q) || String(item.eventType || '').includes(q);
  });
  const yesCount = responses.filter((item) => item.choice === 'yes').length;
  const noCount = responses.filter((item) => item.choice === 'no').length;
  const respondedNames = new Set(responses.map((item) => String(item.name || '').trim().toLocaleLowerCase('el-GR')).filter(Boolean));
  const noResponseCount = Math.max(0, Number(selectedEvent?.expectedCount || 0) - respondedNames.size);

  async function createEventFromInterests() {
    if (!canCreateEvent) return;
    setBusy(true);
    setMessage('');
    try {
      const type = selectedTypes[0];
      let roomCode = '';
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const candidate = makeRoomCode();
        const { items } = await base44.entities.DotEvent.filter({ room_code: candidate }, { limit: 1 });
        if (!items?.length) { roomCode = candidate; break; }
      }
      if (!roomCode) throw new Error('Δεν δημιουργήθηκε μοναδικός κωδικός χώρου.');
      const event = await base44.entities.DotEvent.create({
        title: EVENT_TYPES.find((item) => item.id === type)?.label || type,
        type,
        status: 'prep',
        phase: 'arrival',
        room_code: roomCode,
        notes: '',
        interestIds: selectedInterests.map((item) => item.id),
        expectedCount: selectedInterests.length,
      });
      for (const item of selectedInterests) {
        await base44.entities.Interest.update(item.id, { dotEventId: event.id });
      }
      setSelectedIds([]);
      setSelectedEventId(event.id);
      setMessage(`Δημιουργήθηκε το Event ${event.title} με ${selectedInterests.length} αναμενόμενες συμμετοχές.`);
      await loadAll();
    } catch (error) {
      setMessage(error.message || 'Δεν δημιουργήθηκε το Event.');
    } finally {
      setBusy(false);
    }
  }

  async function copyInterestLink() {
    const url = `${window.location.origin}/deal`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage('Ο σύνδεσμος αρχικής δήλωσης ενδιαφέροντος αντιγράφηκε.');
    } catch {
      setMessage('Άνοιξε τον σύνδεσμο /deal για να τον αντιγράψεις χειροκίνητα.');
    }
  }

  async function copyParticipationLink() {
    if (!selectedEvent?.room_code) return;
    const url = `${window.location.origin}/deal/${selectedEvent.room_code}`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage('Ο σύνδεσμος συμμετοχής αντιγράφηκε.');
    } catch {
      setMessage('Δεν ήταν δυνατή η αντιγραφή. Χρησιμοποίησε τον σύνδεσμο που εμφανίζεται παρακάτω.');
    }
  }

  async function copyModeFormLink() {
    if (!selectedEvent?.id || !selectedEvent?.room_code) return;
    const params = new URLSearchParams({ event: selectedEvent.room_code, eventId: selectedEvent.id, roomCode: selectedEvent.room_code });
    const url = `${window.location.origin}/modes-form?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage('Ο σύνδεσμος επιλογής Mode αντιγράφηκε.');
    } catch {
      setMessage('Χρησιμοποίησε τον σύνδεσμο επιλογής Mode που εμφανίζεται παρακάτω.');
    }
  }

  async function updateParticipation(item, choice) {
    setBusy(true);
    try {
      const updated = await base44.entities.Participation.update(item.id, { choice, submittedAt: new Date().toISOString() });
      setResponses((current) => current.map((row) => row.id === item.id ? updated : row));
    } catch (error) {
      setMessage(error.message || 'Δεν ενημερώθηκε η δήλωση.');
    } finally { setBusy(false); }
  }

  async function deleteParticipation(item) {
    if (!window.confirm(`Να διαγραφεί η δήλωση της/του ${item.name};`)) return;
    setBusy(true);
    try {
      await base44.entities.Participation.delete(item.id);
      setResponses((current) => current.filter((row) => row.id !== item.id));
    } catch (error) {
      setMessage(error.message || 'Δεν διαγράφηκε η δήλωση.');
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <ComicPanel className="bg-card space-y-3">
        <h2 className="font-heading text-2xl text-primary">ΕΝΔΙΑΦΕΡΟΝ & ΣΥΜΜΕΤΟΧΗ</h2>
        <p className="text-sm text-foreground/70">Οι αρχικές δηλώσεις ενδιαφέροντος αποθηκεύονται ανεξάρτητα από Event, πρόσκληση και GameSession.</p>
        <div className="rounded-lg border border-[#b99a45]/40 bg-background/60 p-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-primary">ΣΥΝΔΕΣΜΟΣ ΑΡΧΙΚΗΣ ΔΗΛΩΣΗΣ ΕΝΔΙΑΦΕΡΟΝΤΟΣ</div>
            <a className="text-sm underline underline-offset-2" href="/deal" target="_blank" rel="noreferrer">{window.location.origin}/deal</a>
          </div>
          <ComicButton size="sm" variant="dark" onClick={copyInterestLink}>ΑΝΤΙΓΡΑΦΗ</ComicButton>
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Αναζήτηση ονόματος ή τύπου…" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
        <div className="space-y-2">
          {filteredInterests.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
              <div className="flex min-w-0 items-start gap-2">
                {item.declaration === 'yes' && !item.dotEventId && <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={(e) => setSelectedIds((current) => e.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} aria-label={`Επιλογή ${item.name}`} />}
                <div>
                  <div className="font-bold">{item.name}</div>
                  <div className="text-xs text-foreground/55">{EVENT_TYPES.find((type) => type.id === item.eventType)?.label || item.eventType} · {choiceLabel(item.declaration)}</div>
                  <div className="text-[10px] text-foreground/40">{item.submittedAt ? new Date(item.submittedAt).toLocaleString('el-GR') : item.created_date ? new Date(item.created_date).toLocaleString('el-GR') : ''}{item.dotEventId ? ' · Συνδεδεμένο με Event' : ''}</div>
                </div>
              </div>
            </div>
          ))}
          {filteredInterests.length === 0 && <div className="text-sm text-foreground/55">Δεν υπάρχουν δηλώσεις.</div>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <span className="text-xs text-foreground/60">Επιλεγμένες θετικές δηλώσεις: {selectedInterests.length}</span>
          <ComicButton disabled={!canCreateEvent || busy} onClick={createEventFromInterests}>ΔΗΜΙΟΥΡΓΙΑ EVENT ΑΠΟ ΣΥΜΜΕΤΟΧΕΣ</ComicButton>
        </div>
        {selectedInterests.length > 0 && selectedTypes.length > 1 && <p className="text-xs text-destructive">Επίλεξε δηλώσεις ίδιου τύπου Event.</p>}
      </ComicPanel>

      <ComicPanel className="bg-card space-y-3">
        <h2 className="font-heading text-2xl text-primary">ΣΥΜΜΕΤΟΧΕΣ ΑΝΑ EVENT</h2>
        <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground">
          <option value="">Επίλεξε Event</option>
          {events.map((event) => <option key={event.id} value={event.id}>{event.title} · {event.room_code}</option>)}
        </select>
        {selectedEvent && <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg border border-border p-3"><div className="text-[10px] text-foreground/50">ΑΝΑΜΕΝΟΜΕΝΕΣ</div><div className="font-heading text-2xl">{selectedEvent.expectedCount ?? 0}</div></div>
            <div className="rounded-lg border border-emerald-700/40 p-3"><div className="text-[10px] text-foreground/50">ΘΑ</div><div className="font-heading text-2xl">{yesCount}</div></div>
            <div className="rounded-lg border border-red-700/40 p-3"><div className="text-[10px] text-foreground/50">ΔΕΝ ΘΑ</div><div className="font-heading text-2xl">{noCount}</div></div>
            <div className="rounded-lg border border-amber-700/40 p-3"><div className="text-[10px] text-foreground/50">ΧΩΡΙΣ ΑΠΑΝΤΗΣΗ</div><div className="font-heading text-2xl">{noResponseCount}</div></div>
          </div>
          <div className="text-xs text-foreground/55">Θετικές επιβεβαιώσεις: {yesCount} / {selectedEvent.expectedCount ?? 0} · Κωδικός Event: {selectedEvent.room_code}</div>
          <div className="rounded-lg border border-[#b99a45]/40 bg-background/60 p-3 space-y-2">
            <div className="text-xs font-bold text-primary">ΣΥΝΔΕΣΜΟΣ ΔΗΛΩΣΗΣ ΣΥΜΜΕΤΟΧΗΣ</div>
            <a className="block break-all text-sm underline underline-offset-2" href={`/deal/${selectedEvent.room_code}`} target="_blank" rel="noreferrer">{window.location.origin}/deal/{selectedEvent.room_code}</a>
            <ComicButton size="sm" variant="dark" onClick={copyParticipationLink}>ΑΝΤΙΓΡΑΦΗ ΣΥΝΔΕΣΜΟΥ</ComicButton>
          </div>
          <div className="rounded-lg border border-[#b99a45]/40 bg-background/60 p-3 space-y-2">
            <div className="text-xs font-bold text-primary">ΣΥΝΔΕΣΜΟΣ ΦΟΡΜΑΣ ΕΠΙΛΟΓΗΣ MODE</div>
            <a className="block break-all text-sm underline underline-offset-2" href={`/modes-form?event=${selectedEvent.room_code}&eventId=${selectedEvent.id}&roomCode=${selectedEvent.room_code}`} target="_blank" rel="noreferrer">{window.location.origin}/modes-form?event={selectedEvent.room_code}&eventId={selectedEvent.id}&roomCode={selectedEvent.room_code}</a>
            <ComicButton size="sm" variant="dark" onClick={copyModeFormLink}>ΑΝΤΙΓΡΑΦΗ ΣΥΝΔΕΣΜΟΥ MODE</ComicButton>
          </div>
          <div className="space-y-2">
            {responses.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
                <div><div className="font-bold">{item.name}</div><div className="text-[10px] text-foreground/45">{item.submittedAt ? new Date(item.submittedAt).toLocaleString('el-GR') : item.created_date ? new Date(item.created_date).toLocaleString('el-GR') : ''}</div></div>
                <div className="flex items-center gap-2">
                  <select value={item.choice} disabled={busy} onChange={(e) => updateParticipation(item, e.target.value)} className="rounded-lg border border-border bg-background px-2 py-2 text-xs text-foreground">
                    <option value="yes">ΘΑ ΣΥΜΜΕΤΕΧΩ</option>
                    <option value="no">ΔΕΝ ΘΑ ΣΥΜΜΕΤΕΧΩ</option>
                  </select>
                  <ComicButton size="sm" variant="red" disabled={busy} onClick={() => deleteParticipation(item)}>ΔΙΑΓΡΑΦΗ</ComicButton>
                </div>
              </div>
            ))}
            {responses.length === 0 && <div className="text-sm text-foreground/55">Δεν υπάρχουν ακόμη απαντήσεις για αυτό το Event.</div>}
          </div>
        </>}
      </ComicPanel>
      {message && <ComicPanel className="bg-secondary p-3"><p role="status" className="text-sm">{message}</p></ComicPanel>}
    </div>
  );
}
