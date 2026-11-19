import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { base44, request } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

const SOURCES = [
  ['PublicFormSubmission', 'Δημόσια φόρμα'],
  ['PlayerIntake', 'Αίτηση παίκτριας'],
  ['PajamaIntake', 'Pajama αίτηση'],
  ['BacheloretteIntake', 'Bachelorette αίτηση'],
  ['InvitationRSVP', 'Επιβεβαίωση πρόσκλησης'],
  ['VIPInvitationSubmission', 'VIP πρόσκληση'],
];
const STATUSES = ['Νέο', 'Επικοινωνία', 'Επιβεβαιώθηκε', 'Απορρίφθηκε'];
const labelFor = (entity) => SOURCES.find(([key]) => key === entity)?.[1] || entity;
const nameFor = (item) => item.name || item.displayName || item.legalName || 'Χωρίς όνομα';
const dateFor = (item) => item.submittedAt || item.created_date || item.updated_date || '';

export default function AdminInbox({ sessions = [] }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all(SOURCES.map(([entity]) =>
        base44.entities[entity].filter({}, { sort: '-created_date', limit: 500 })
          .then(({ items: rows }) => (rows || []).map((item) => ({ ...item, _entity: entity })))
          .catch((error) => { console.error('Inbox source failed:', entity, error); return []; })
      ));
      const rsvpIds = new Set((results[4] || []).map((item) => item.submissionId).filter(Boolean));
      const vipIds = new Set((results[5] || []).map((item) => item.submissionId).filter(Boolean));
      const combined = results.flat().filter((item) => item._entity !== 'PlayerIntake' || (!rsvpIds.has(item.submissionId) && !vipIds.has(item.vipSubmissionId)));
      setItems(combined.sort((a, b) => new Date(dateFor(b)).getTime() - new Date(dateFor(a)).getTime()));
      setMessage('');
    } catch (error) {
      setMessage(error.message || 'Δεν φορτώθηκαν οι αιτήσεις.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => items.filter((item) => {
    const haystack = [nameFor(item), item.contact, item.email, item.eventType, item.message, item.suggestion, item.sessionCode, item.gameMode]
      .filter(Boolean).join(' ').toLocaleLowerCase('el-GR');
    const rawStatus = item.status || (item.confirmed ? 'Επιβεβαιώθηκε' : 'Νέο');
    const status = ({ new: 'Νέο', contact: 'Επικοινωνία', confirmed: 'Επιβεβαιώθηκε', rejected: 'Απορρίφθηκε' })[rawStatus] || rawStatus;
    return (!search || haystack.includes(search.toLocaleLowerCase('el-GR')))
      && (eventFilter === 'all' || item.sessionCode === eventFilter)
      && (statusFilter === 'all' || status === statusFilter)
      && (!unreadOnly || !item.readAt);
  }), [items, search, eventFilter, statusFilter, unreadOnly]);

  async function updateItem(item, patch) {
    try {
      const updated = await base44.entities[item._entity].update(item.id, patch);
      setItems((current) => current.map((entry) => entry.id === item.id && entry._entity === item._entity ? { ...updated, _entity: item._entity } : entry));
    } catch (error) { setMessage(error.message || 'Η ενημέρωση απέτυχε.'); }
  }

  async function remove(item) {
    if (!window.confirm(`Να διαγραφεί οριστικά η εγγραφή «${nameFor(item)}» από το ${labelFor(item._entity)};`)) return;
    try {
      if (item._entity === 'VIPInvitationSubmission') {
        await request('DELETE', `/api/entities/vip-submissions/${item.id}`);
      } else if (item._entity === 'InvitationRSVP') {
        await request('DELETE', `/api/entities/invitation-rsvps/${item.id}`);
      } else if (item._entity === 'PlayerIntake') {
        await request('DELETE', `/api/entities/player-intakes/${item.id}`);
      } else {
        await base44.entities[item._entity].delete(item.id);
      }
      setItems((current) => current.filter((entry) => !(entry.id === item.id && entry._entity === item._entity)));
    } catch (error) { setMessage(error.message || 'Η διαγραφή απέτυχε.'); }
  }

  return <div className="space-y-3">
    <ComicPanel className="bg-card space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div><div className="font-heading text-2xl text-primary">ΚΕΝΤΡΙΚΟ ΕΙΣΕΡΧΟΜΕΝΟ</div><div className="text-xs text-foreground/60">Όλες οι αιτήσεις και οι δηλώσεις συμμετοχής σε μία λίστα.</div></div>
        <ComicButton size="sm" variant="dark" disabled={loading} onClick={load}>ΑΝΑΝΕΩΣΗ</ComicButton>
      </div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Αναζήτηση ονόματος, email, τηλεφώνου, Event..." className="w-full rounded-lg border border-border bg-background p-3 text-sm" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="rounded-lg border border-border bg-background p-2 text-sm"><option value="all">Όλα τα Events</option>{sessions.map((s) => <option key={s.id} value={s.sessionCode}>{s.sessionCode} · {s.mode}</option>)}</select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-border bg-background p-2 text-sm"><option value="all">Όλες οι καταστάσεις</option>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <label className="flex items-center gap-2 rounded-lg border border-border bg-background p-2 text-sm"><input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} /> Μόνο μη αναγνωσμένα</label>
      </div>
      <div className="text-xs text-foreground/60">{filtered.length} εγγραφές · {items.filter((item) => !item.readAt).length} μη αναγνωσμένες</div>
    </ComicPanel>
    {message && <ComicPanel className="bg-tarot-crimson"><div className="text-sm">{message}</div></ComicPanel>}
    {loading ? <ComicPanel className="bg-card text-center">Φόρτωση αιτήσεων…</ComicPanel> : filtered.length === 0 ? <ComicPanel className="bg-card text-center text-sm text-foreground/60">Δεν βρέθηκαν αιτήσεις με αυτά τα φίλτρα.</ComicPanel> : filtered.map((item) => {
      const rawStatus = item.status || (item.confirmed ? 'Επιβεβαιώθηκε' : 'Νέο');
      const status = ({ new: 'Νέο', contact: 'Επικοινωνία', confirmed: 'Επιβεβαιώθηκε', rejected: 'Απορρίφθηκε' })[rawStatus] || rawStatus;
      const contact = item.contact || item.phone || item.email || '';
      return <ComicPanel key={item._entity + item.id} className="bg-card space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0"><div className="font-heading text-lg">{nameFor(item)}</div><div className="text-[11px] text-primary">{labelFor(item._entity)} · {new Date(dateFor(item) || Date.now()).toLocaleString('el-GR')}</div></div>
          {!item.readAt && <span className="rounded-full bg-primary/20 px-2 py-1 text-[10px] font-bold">ΝΕΟ</span>}
        </div>
        <div className="text-sm text-foreground/75 break-words">{[item.eventType, item.gameMode, item.sessionCode, contact].filter(Boolean).join(' · ')}</div>
        {(item.message || item.suggestion) && <div className="rounded-lg bg-secondary p-2 text-sm whitespace-pre-wrap">{item.message || item.suggestion}</div>}
        <div className="flex flex-wrap items-center gap-2">
          <select value={status} onChange={(e) => updateItem(item, { status: e.target.value })} className="rounded border border-border bg-background p-2 text-xs">{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          {!item.readAt && <ComicButton size="sm" variant="dark" onClick={() => updateItem(item, { readAt: new Date().toISOString() })}>ΣΗΜΑΝΣΗ ΩΣ ΑΝΑΓΝΩΣΜΕΝΟ</ComicButton>}
          {contact && <a className="rounded border border-border px-3 py-2 text-xs font-bold" href={`https://wa.me/${String(contact).replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Γεια σου ' + nameFor(item) + ', επικοινωνώ σχετικά με το ενδιαφέρον σου για το Deal of Temptation.')}`} target="_blank" rel="noreferrer">WHATSAPP</a>}
          <ComicButton size="sm" variant="red" onClick={() => remove(item)}>ΔΙΑΓΡΑΦΗ</ComicButton>
        </div>
      </ComicPanel>;
    })}
  </div>;
}
