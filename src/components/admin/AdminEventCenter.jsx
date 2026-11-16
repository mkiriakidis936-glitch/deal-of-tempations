import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

const csvCell = (value) => '"' + String(value ?? '').replace(/"/g, '""') + '"';

export default function AdminEventCenter({ sessions: initialSessions = [], selectedSession = null, onDeleteSession, onRefreshSessions }) {
  const [sessions, setSessions] = useState(initialSessions);
  const [selectedId, setSelectedId] = useState(initialSessions[0]?.id || '');
  const [rsvps, setRsvps] = useState([]);
  const [vipInvitations, setVipInvitations] = useState([]);
  const [vipSubmissions, setVipSubmissions] = useState([]);
  const [publicSubmissions, setPublicSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestContact, setGuestContact] = useState('');
  const [draft, setDraft] = useState({ title: '', scheduledAt: '', venue: '', capacity: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => { setSessions(initialSessions); if (selectedSession?.id) setSelectedId(selectedSession.id); else if (!selectedId && initialSessions[0]) setSelectedId(initialSessions[0].id); }, [initialSessions, selectedSession?.id]);
  const selected = sessions.find((s) => s.id === selectedId) || null;
  const event = selected?.event || {};
  const guests = Array.isArray(event.guests) ? event.guests : [];
  useEffect(() => { setDraft({ title: event.title || selected?.mode || '', scheduledAt: event.scheduledAt || '', venue: event.venue || '', capacity: event.capacity ?? '' }); }, [selectedId]);

  const loadRelated = useCallback(async () => {
    if (!selected) { setRsvps([]); setVipInvitations([]); setVipSubmissions([]); return; }
    setLoading(true);
    try {
      const [r, v, vs, ps] = await Promise.all([
        base44.entities.InvitationRSVP.filter({ sessionCode: selected.sessionCode }, { sort: '-created_date', limit: 500 }),
        base44.entities.VIPInvitation.filter({ sessionCode: selected.sessionCode }, { sort: '-created_date', limit: 200 }),
        base44.entities.VIPInvitationSubmission.filter({ sessionCode: selected.sessionCode }, { sort: '-created_date', limit: 500 }),
        base44.entities.PublicFormSubmission.filter({ sessionCode: selected.sessionCode }, { sort: '-created_date', limit: 500 }),
      ]);
      setRsvps(r.items || []); setVipInvitations(v.items || []); setVipSubmissions(vs.items || []); setPublicSubmissions(ps.items || []);
      setMessage('');
    } catch (error) { setMessage(error.message || 'Δεν φορτώθηκαν οι συμμετοχές του Event.'); }
    finally { setLoading(false); }
  }, [selected?.id, selected?.sessionCode]);
  useEffect(() => { loadRelated(); }, [loadRelated]);

  const confirmed = useMemo(() => [
    ...rsvps.filter((r) => r.confirmed !== false).map((r) => ({ id: r.id, source: 'rsvp', name: r.name || 'Χωρίς όνομα', contact: r.contact || r.phone || '' })),
    ...vipSubmissions.filter((r) => r.confirmed !== false).map((r) => ({ id: r.id, source: 'vip', name: r.displayName || r.name || 'Χωρίς όνομα', contact: r.contact || '' })),
  ], [rsvps, vipSubmissions]);
  const capacity = Math.max(0, Number(event.capacity) || 0);
  const waitlist = capacity > 0 ? guests.slice(capacity) : [];

  async function saveEvent(patch) {
    if (!selected) return;
    setBusy(true); setMessage('');
    try {
      const updated = await base44.entities.GameSession.update(selected.id, { event: { ...event, ...patch, sessionCode: selected.sessionCode, createdFrom: 'game-setup' } });
      setSessions((current) => current.map((s) => s.id === selected.id ? updated : s));
      setDraft({ title: updated.event?.title || '', scheduledAt: updated.event?.scheduledAt || '', venue: updated.event?.venue || '', capacity: updated.event?.capacity ?? '' });
      setMessage('Οι πληροφορίες του Event αποθηκεύτηκαν.');
    } catch (error) { setMessage(error.message || 'Δεν αποθηκεύτηκαν οι πληροφορίες.'); }
    finally { setBusy(false); }
  }

  async function addGuest(name, contact = '') {
    const clean = String(name || '').trim();
    if (!clean || !selected) return;
    if (guests.some((g) => g.name.toLocaleLowerCase('el-GR') === clean.toLocaleLowerCase('el-GR'))) { setMessage('Το όνομα υπάρχει ήδη στη λίστα.'); return; }
    await saveEvent({ guests: [...guests, { id: globalThis.crypto?.randomUUID?.() || String(Date.now()), name: clean, contact, addedAt: new Date().toISOString(), source: 'manual' }] });
    setGuestName(''); setGuestContact('');
  }

  async function removeGuest(id) {
    if (!window.confirm('Να αφαιρεθεί αυτός ο καλεσμένος από το Event;')) return;
    await saveEvent({ guests: guests.filter((g) => g.id !== id) });
  }

  async function addConfirmedBatch() {
    if (!selected) return;
    const existing = new Set(guests.map((g) => g.name.toLocaleLowerCase('el-GR')));
    const additions = confirmed.filter((g) => !existing.has(g.name.toLocaleLowerCase('el-GR'))).map((g) => ({
      id: `${g.source}-${g.id}`, name: g.name, contact: g.contact, source: g.source, addedAt: new Date().toISOString(),
    }));
    if (!additions.length) { setMessage('Δεν υπάρχουν νέες επιβεβαιωμένες συμμετοχές για προσθήκη.'); return; }
    await saveEvent({ guests: [...guests, ...additions] });
  }

  function exportCsv() {
    if (!selected) return;
    const lines = [['Όνομα', 'Επικοινωνία', 'Πηγή', 'Event', 'Κωδικός'], ...guests.map((g) => [g.name, g.contact, g.source, event.title || selected.mode, selected.sessionCode])];
    const blob = new Blob(['\uFEFF' + lines.map((line) => line.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `deal-event-${selected.sessionCode}-guests.csv`; a.click(); URL.revokeObjectURL(url);
  }

  function printGuests() {
    if (!selected) return;
    const rows = guests.map((g, i) => `<tr><td>${i + 1}</td><td>${String(g.name || '').replace(/[&<>"]/g, '')}</td><td>${String(g.contact || '').replace(/[&<>"]/g, '')}</td></tr>`).join('');
    const w = window.open('', '_blank');
    if (!w) { setMessage('Ο browser μπλόκαρε το παράθυρο εκτύπωσης.'); return; }
    w.document.write(`<!doctype html><html lang="el"><meta charset="utf-8"><title>Καλεσμένοι ${selected.sessionCode}</title><style>body{font:14px Arial;padding:24px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #aaa;padding:8px;text-align:left}</style><h1>${event.title || selected.mode}</h1><p>${selected.sessionCode} · ${event.scheduledAt || ''} · ${event.venue || ''}</p><table><thead><tr><th>#</th><th>Όνομα</th><th>Επικοινωνία</th></tr></thead><tbody>${rows}</tbody></table><script>window.print()<\/script></html>`);
    w.document.close();
  }

  async function deleteEvent() {
    if (!selected || !window.confirm(`Να διαγραφεί οριστικά το Event ${event.title || selected.mode} (${selected.sessionCode}); Θα διαγραφούν και οι προσκλήσεις/συμμετοχές που είναι συνδεδεμένες με αυτό. Θα διατηρηθεί αντίγραφο της παρτίδας για ανάκτηση.`)) return;
    setBusy(true);
    try {
      for (const invitation of vipInvitations) {
        const submissions = await base44.entities.VIPInvitationSubmission.filter({ invitationId: invitation.id }, { limit: 500 });
        for (const submission of submissions.items || []) {
          const intakes = await base44.entities.PlayerIntake.filter({ vipSubmissionId: submission.submissionId }, { limit: 100 });
          for (const intake of intakes.items || []) await base44.entities.PlayerIntake.delete(intake.id);
          await base44.entities.VIPInvitationSubmission.delete(submission.id);
        }
        await base44.entities.VIPInvitation.delete(invitation.id);
      }
      for (const row of rsvps) await base44.entities.InvitationRSVP.delete(row.id);
      for (const row of publicSubmissions) await base44.entities.PublicFormSubmission.delete(row.id);
      const linkedIntakes = await base44.entities.PlayerIntake.filter({ sessionCode: selected.sessionCode }, { limit: 500 });
      for (const intake of linkedIntakes.items || []) await base44.entities.PlayerIntake.delete(intake.id);
      const snapshots = await base44.entities.GameSessionSnapshot.filter({ sessionId: selected.id }, { limit: 500 });
      for (const snapshot of snapshots.items || []) if (snapshot.label !== 'Αυτόματο αντίγραφο πριν από διαγραφή Event') await base44.entities.GameSessionSnapshot.delete(snapshot.id);
      await onDeleteSession?.(selected.id);
      setSelectedId('');
      await onRefreshSessions?.();
      setMessage('Το Event διαγράφηκε και δημιουργήθηκε αντίγραφο της παρτίδας.');
    } catch (error) { setMessage(error.message || 'Η διαγραφή του Event απέτυχε.'); }
    finally { setBusy(false); }
  }

  return <div className="space-y-3">
    <ComicPanel className="bg-card space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap"><div><div className="font-heading text-2xl text-primary">EVENTS & ΚΑΛΕΣΜΕΝΟΙ</div><div className="text-xs text-foreground/60">Κάθε Event δημιουργείται μόνο από την έναρξη Game και Mode.</div></div><ComicButton size="sm" variant="dark" onClick={onRefreshSessions}>ΑΝΑΝΕΩΣΗ</ComicButton></div>
      <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full rounded-lg border border-border bg-background p-3">{sessions.length === 0 && <option value="">Δεν υπάρχουν Events από παιχνίδια</option>}{sessions.map((s) => <option key={s.id} value={s.id}>{s.event?.title || s.mode || 'Game'} · {s.sessionCode}</option>)}</select>
      {selected && <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div className="rounded-lg bg-secondary p-2"><div className="text-xl font-bold">{guests.length}</div><div className="text-[10px]">Καλεσμένοι</div></div>
        <div className="rounded-lg bg-secondary p-2"><div className="text-xl font-bold">{capacity || '—'}</div><div className="text-[10px]">Θέσεις</div></div>
        <div className="rounded-lg bg-secondary p-2"><div className="text-xl font-bold">{capacity ? Math.max(0, capacity - guests.length) : '—'}</div><div className="text-[10px]">Διαθέσιμες</div></div>
        <div className="rounded-lg bg-secondary p-2"><div className="text-xl font-bold">{waitlist.length}</div><div className="text-[10px]">Αναμονή</div></div>
      </div>}
    </ComicPanel>
    {message && <ComicPanel className="bg-secondary"><div className="text-sm font-bold">{message}</div></ComicPanel>}
    {!selected ? <ComicPanel className="bg-card text-sm text-foreground/60">Δεν υπάρχει Event. Ξεκίνησε παιχνίδι από την κανονική επιλογή Game και Mode για να δημιουργηθεί.</ComicPanel> : <>
      <ComicPanel className="bg-card space-y-2">
        <div className="font-heading text-lg">ΣΤΟΙΧΕΙΑ EVENT</div>
        <label className="block text-xs font-bold">Τίτλος<input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} className="mt-1 w-full rounded border border-border bg-background p-2" /></label>
        <label className="block text-xs font-bold">Ημερομηνία / ώρα<input type="datetime-local" value={draft.scheduledAt} onChange={(e) => setDraft((d) => ({ ...d, scheduledAt: e.target.value }))} className="mt-1 w-full rounded border border-border bg-background p-2" /></label>
        <label className="block text-xs font-bold">Χώρος<input value={draft.venue} onChange={(e) => setDraft((d) => ({ ...d, venue: e.target.value }))} className="mt-1 w-full rounded border border-border bg-background p-2" /></label>
        <label className="block text-xs font-bold">Διαθέσιμες θέσεις<input type="number" min="0" value={draft.capacity} onChange={(e) => setDraft((d) => ({ ...d, capacity: e.target.value }))} className="mt-1 w-full rounded border border-border bg-background p-2" /></label>
        <ComicButton disabled={busy} onClick={() => saveEvent({ ...draft, capacity: draft.capacity === '' ? null : Number(draft.capacity) })}>ΑΠΟΘΗΚΕΥΣΗ ΣΤΟΙΧΕΙΩΝ EVENT</ComicButton><div className="text-[11px] text-foreground/50">Κωδικός σύνδεσης: {selected.sessionCode} · Mode: {selected.mode}</div>
      </ComicPanel>
      <ComicPanel className="bg-card space-y-2">
        <div className="font-heading text-lg">ΠΡΟΣΘΗΚΗ ΚΑΛΕΣΜΕΝΟΥ</div>
        <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Ονοματεπώνυμο" className="w-full rounded border border-border bg-background p-2" />
        <input value={guestContact} onChange={(e) => setGuestContact(e.target.value)} placeholder="Τηλέφωνο / WhatsApp (προαιρετικό)" className="w-full rounded border border-border bg-background p-2" />
        <div className="flex flex-wrap gap-2"><ComicButton disabled={busy || !guestName.trim()} onClick={() => addGuest(guestName, guestContact)}>ΠΡΟΣΘΗΚΗ</ComicButton><ComicButton variant="dark" disabled={busy || loading} onClick={addConfirmedBatch}>ΠΡΟΣΘΗΚΗ ΟΛΩΝ ΤΩΝ ΕΠΙΒΕΒΑΙΩΜΕΝΩΝ</ComicButton></div>
        <div className="text-xs text-foreground/55">Επιβεβαιωμένες αιτήσεις που βρέθηκαν: {confirmed.length}. Οι προσκλήσεις εμφανίζονται εδώ όταν έχουν τον ίδιο κωδικό Event.</div>
      </ComicPanel>
      <ComicPanel className="bg-card space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap"><div className="font-heading text-lg">ΛΙΣΤΑ ΚΑΛΕΣΜΕΝΩΝ ({guests.length})</div><div className="flex gap-2"><ComicButton size="sm" variant="dark" onClick={exportCsv}>CSV</ComicButton><ComicButton size="sm" variant="dark" onClick={printGuests}>ΕΚΤΥΠΩΣΗ</ComicButton></div></div>
        {loading && <div className="text-xs">Φόρτωση συμμετοχών…</div>}
        {guests.map((guest, index) => <div key={guest.id} className="flex items-center gap-2 border-b border-border/40 py-2"><div className="w-7 text-xs text-primary">{index + 1}</div><div className="min-w-0 flex-1"><div className="text-sm font-bold">{guest.name}</div><div className="text-[10px] text-foreground/50">{guest.contact || guest.source || 'Χωρίς στοιχεία επικοινωνίας'}{capacity && index >= capacity ? ' · ΛΙΣΤΑ ΑΝΑΜΟΝΗΣ' : ''}</div></div>{guest.contact && <a className="text-xs font-bold" href={`https://wa.me/${String(guest.contact).replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Γεια σου ' + guest.name + ', σχετικά με το ' + (event.title || selected.mode) + '.')}`} target="_blank" rel="noreferrer">WhatsApp</a>}<ComicButton size="sm" variant="red" onClick={() => removeGuest(guest.id)}>ΔΙΑΓΡΑΦΗ</ComicButton></div>)}
        {guests.length === 0 && <div className="text-sm text-foreground/50">Δεν έχουν προστεθεί καλεσμένοι σε αυτό το Event.</div>}
      </ComicPanel>
      <ComicPanel className="bg-card"><ComicButton variant="red" disabled={busy} onClick={deleteEvent}>ΔΙΑΓΡΑΦΗ EVENT</ComicButton></ComicPanel>
    </>}
  </div>;
}
