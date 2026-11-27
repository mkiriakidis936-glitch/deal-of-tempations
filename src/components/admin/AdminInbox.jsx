import { loadCalendar, calendarOptionsFor, syncCalendarBookings } from '@/lib/calendarBookings';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { appApi, request } from '@/api/apiClient';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { modeDisplayName } from '@/data/gameConfig';

const SOURCES = [
  ['PublicFormSubmission', 'Δημόσια φόρμα'],
  ['PlayerIntake', 'Αίτηση παίκτριας'],
  ['PajamaIntake', 'Αίτηση συμμετοχής'],
  ['InvitationRSVP', 'Επιβεβαίωση πρόσκλησης'],
  ['VIPInvitationSubmission', 'VIP πρόσκληση'],
];
const STATUSES = ['Νέο', 'Επικοινωνία', 'Επιβεβαιώθηκε', 'Απορρίφθηκε'];
const GAME_ENTITIES = new Set(['PlayerIntake', 'PajamaIntake', 'VIPInvitationSubmission']);
const modeName = (id) => modeDisplayName(id);
const modesFor = (item) => {
  if (Array.isArray(item.preferredModes) && item.preferredModes.length) return item.preferredModes;
  const single = item.vipGameMode || item.gameMode;
  return single ? [single] : item._entity === 'PajamaIntake' ? ['pajama'] : [];
};
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
        appApi.entities[entity].filter({}, { sort: '-created_date', limit: 500 })
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

  const [calendar, setCalendar] = useState([]);
  useEffect(() => { loadCalendar().then(setCalendar).catch(() => {}); }, []);
  const resync = () => syncCalendarBookings().catch(() => {});

  async function updateItem(item, patch) {
    try {
      const updated = await appApi.entities[item._entity].update(item.id, patch);
      setItems((current) => current.map((entry) => entry.id === item.id && entry._entity === item._entity ? { ...updated, _entity: item._entity } : entry));
    } catch (error) { setMessage(error.message || 'Η ενημέρωση απέτυχε.'); }
  }

  async function setApproval(item, approved) {
    try {
      await request('POST', `/api/entities/intake-approvals/${item._entity}/${encodeURIComponent(item.id)}`, approved ? {} : { approved: false });
      setItems((current) => current.map((entry) => entry.id === item.id && entry._entity === item._entity
        ? { ...entry, approved, approvalStatus: approved ? 'approved' : 'pending', status: approved ? 'Επιβεβαιώθηκε' : entry.status, readAt: entry.readAt || (approved ? new Date().toISOString() : entry.readAt) }
        : entry));
      if (approved && item.status !== 'Επιβεβαιώθηκε') appApi.entities[item._entity].update(item.id, { status: 'Επιβεβαιώθηκε', readAt: item.readAt || new Date().toISOString() }).catch(() => {});
      setMessage(approved ? `Η ${nameFor(item)} εγκρίθηκε και εμφανίζεται στο Tablet.` : `Η έγκριση της ${nameFor(item)} ανακλήθηκε.`);
      if (item.calendarDate) resync();
    } catch (error) { setMessage(error.message || 'Η έγκριση απέτυχε.'); }
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
        await appApi.entities[item._entity].delete(item.id);
      }
      setItems((current) => current.filter((entry) => !(entry.id === item.id && entry._entity === item._entity)));
    } catch (error) { setMessage(error.message || 'Η διαγραφή απέτυχε.'); }
  }

  return <div className="space-y-3">
    <ComicPanel className="bg-card space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div><div className="font-heading text-2xl text-primary">Κεντρικό εισερχόμενο</div><div className="text-xs text-foreground/60">Όλες οι αιτήσεις και οι δηλώσεις συμμετοχής σε μία λίστα.</div></div>
        <ComicButton size="sm" variant="dark" disabled={loading} onClick={load}>Ανανέωση</ComicButton>
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
          {!item.readAt && <span className="rounded-full bg-primary/20 px-2 py-1 text-[10px] font-bold">Νέο</span>}
        </div>
        <div className="text-sm text-foreground/75 break-words">{[item.eventType, ...modesFor(item).map(modeName), item.sessionCode, contact].filter(Boolean).join(' · ')}</div>
        {GAME_ENTITIES.has(item._entity) && (
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.approved ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>{item.approved ? '✓ Εγκεκριμένη για το παιχνίδι' : 'Αναμένει έγκριση'}</span>
            {item.approved
              ? <ComicButton size="sm" variant="dark" onClick={() => setApproval(item, false)}>Ακύρωση έγκρισης</ComicButton>
              : <ComicButton size="sm" variant="green" onClick={() => setApproval(item, true)}>Έγκριση για το παιχνίδι</ComicButton>}
            {calendarOptionsFor(calendar, item).length > 0 && (
              <select aria-label="Βραδιά" value={item.calendarDate || ''} onChange={async (e) => { await updateItem(item, { calendarDate: e.target.value || null }); resync(); }} className="rounded border border-border bg-background p-2 text-xs">
                <option value="">Βραδιά: —</option>
                {calendarOptionsFor(calendar, item).map((entry) => <option key={entry.date} value={entry.date}>Βραδιά: {new Date(entry.date).toLocaleString('el-GR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</option>)}
              </select>
            )}
          </div>
        )}
        {(item.message || item.suggestion) && <div className="rounded-lg bg-secondary p-2 text-sm whitespace-pre-wrap">{item.message || item.suggestion}</div>}
        <div className="flex flex-wrap items-center gap-2">
          <select value={status} onChange={(e) => updateItem(item, { status: e.target.value })} className="rounded border border-border bg-background p-2 text-xs">{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          {!item.readAt && <ComicButton size="sm" variant="dark" onClick={() => updateItem(item, { readAt: new Date().toISOString() })}>Σήμανση ως αναγνωσμένο</ComicButton>}
          {contact && (() => {
            // Μετά την έγκριση: έτοιμο μήνυμα επιβεβαίωσης θέσης (WhatsApp ή SMS / email).
            const text = item.approved
              ? `Γεια σου ${nameFor(item)}! Η θέση σου στο Deal of Temptation${modesFor(item).length ? ` (${modesFor(item).map(modeName).join(', ')})` : ''} επιβεβαιώθηκε ✨ Σύντομα θα λάβεις διεύθυνση, ώρα και τον κωδικό της βραδιάς.`
              : `Γεια σου ${nameFor(item)}, επικοινωνώ σχετικά με το ενδιαφέρον σου για το Deal of Temptation.`;
            const isMail = String(contact).includes('@');
            const href = isMail
              ? `mailto:${contact}?subject=${encodeURIComponent('Deal of Temptation')}&body=${encodeURIComponent(text)}`
              : `https://wa.me/${String(contact).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
            return <a className={`rounded px-3 py-2 text-xs font-bold ${item.approved ? 'bg-[#30D158] text-black' : 'border border-border'}`} href={href} target="_blank" rel="noreferrer">{item.approved ? (isMail ? '✉️ ΕΙΔΟΠΟΙΗΣΕ ΤΗΝ (EMAIL)' : '📲 ΕΙΔΟΠΟΙΗΣΕ ΤΗΝ (WHATSAPP)') : (isMail ? 'EMAIL' : 'WHATSAPP')}</a>;
          })()}
          <ComicButton size="sm" variant="red" onClick={() => remove(item)}>Διαγραφή</ComicButton>
        </div>
      </ComicPanel>;
    })}
  </div>;
}
