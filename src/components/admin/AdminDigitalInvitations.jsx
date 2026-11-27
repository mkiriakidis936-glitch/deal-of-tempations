import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { appApi, request } from '@/api/apiClient';
import { GAME_MODES } from '@/data/gameConfig';

const KEY = 'digital_invitations';
const TARGETS = [
  { path: '/deal', label: 'Mini-Site — Δήλωση ενδιαφέροντος / συμμετοχής' },
  { path: '/forms', label: 'Ενιαία Φόρμα Modes' },
];

function isAllowedInvitationPath(value) {
  try {
    const pathname = new URL(value, window.location.origin).pathname;
    return pathname === '/forms' || pathname === '/deal' || pathname.startsWith('/deal/') || pathname.startsWith('/vip/');
  } catch {
    return false;
  }
}
const makeId = () => globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

export default function AdminDigitalInvitations() {
  const [record, setRecord] = useState(null);
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState(TARGETS[0].path);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [vipInvitations, setVipInvitations] = useState([]);
  const [vipSubmissions, setVipSubmissions] = useState({});
  const [vipBusy, setVipBusy] = useState(false);
  const [vipMessage, setVipMessage] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');

  useEffect(() => {
    appApi.entities.AppSetting.filter({ key: KEY }, { limit: 1 }).then(async ({ items: rows }) => {
      const rec = rows?.[0] || null;
      setRecord(rec);
      const savedItems = Array.isArray(rec?.value?.items) ? rec.value.items : [];
      const currentItems = savedItems.filter((item) => item?.path && isAllowedInvitationPath(item.path));
      setItems(currentItems);
      if (rec?.id && currentItems.length !== savedItems.length) {
        await appApi.entities.AppSetting.update(rec.id, { value: { items: currentItems } });
        setMessage('Οι παλιοί σύνδεσμοι καταργήθηκαν. Διατηρήθηκαν μόνο οι σύνδεσμοι της ενιαίας φόρμας και οι προσωπικές VIP προσκλήσεις.');
      }
    }).catch((e) => setMessage(e.message));
    loadVipInvitations();
    loadEvents();
    const offEvents = appApi.entities.DotEvent.subscribe(() => loadEvents());
    return () => offEvents?.();
  }, []);

  async function loadEvents() {
    try {
      const { items: rows } = await appApi.entities.DotEvent.filter({}, { sort: '-created_date', limit: 200 });
      setEvents(rows || []);
      setSelectedEventId((current) => current || rows?.find((event) => !['closing', 'completed'].includes(event.status))?.id || '');
    } catch (e) { setVipMessage(e.message || 'Δεν φορτώθηκαν τα Events.'); }
  }

  async function loadVipInvitations() {
    try {
      const { items: rows } = await appApi.entities.VIPInvitation.filter({}, { sort: '-created_date', limit: 30 });
      setVipInvitations(rows || []);
    } catch (e) { setVipMessage(e.message || 'Δεν φορτώθηκαν οι VIP προσκλήσεις.'); }
  }

  const save = async (next) => {
    setBusy(true);
    try {
      const value = { items: next };
      const rec = record?.id
        ? await appApi.entities.AppSetting.update(record.id, { value })
        : await appApi.entities.AppSetting.create({ key: KEY, value });
      setRecord(rec); setItems(next); setMessage('Αποθηκεύτηκε.');
    } catch (e) { setMessage(e.message); }
    finally { setBusy(false); }
  };

  const add = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    const selectedEvent = events.find((event) => event.id === selectedEventId);
    const linkedPath = target === '/deal' && selectedEvent ? `/deal/${selectedEvent.room_code}` : target;
    const next = [...items, { id: makeId(), title: cleanTitle, path: linkedPath, dotEventId: selectedEvent?.id || '', createdAt: new Date().toISOString() }];
    save(next).then(() => setTitle(''));
  };

  async function createVipInvitation() {
    setVipBusy(true);
    setVipMessage('');
    try {
      if (!selectedEventId) throw new Error('Επίλεξε πρώτα ένα Event.');
      const invitation = await request('POST', '/api/entities/vip-invitations', { dotEventId: selectedEventId });
      setVipInvitations((current) => [invitation, ...current]);
      setVipMessage('Η VIP πρόσκληση δημιουργήθηκε και είναι έτοιμη για αποστολή.');
    } catch (e) { setVipMessage(e.message || 'Δεν δημιουργήθηκε η VIP πρόσκληση.'); }
    finally { setVipBusy(false); }
  }

  async function toggleVipInvitation(invitation) {
    setVipBusy(true);
    try {
      const updated = await appApi.entities.VIPInvitation.update(invitation.id, { active: !invitation.active });
      setVipInvitations((current) => current.map((item) => item.id === invitation.id ? updated : item));
      setVipMessage(updated.active ? 'Η VIP πρόσκληση ενεργοποιήθηκε.' : 'Η VIP πρόσκληση απενεργοποιήθηκε.');
    } catch (e) { setVipMessage(e.message || 'Δεν ενημερώθηκε η πρόσκληση.'); }
    finally { setVipBusy(false); }
  }

  async function deleteVipInvitation(invitation) {
    if (!window.confirm('Να διαγραφεί οριστικά η VIP πρόσκληση μαζί με όλες τις απαντήσεις και τις εγγραφές συμμετεχόντων της;')) return;
    setVipBusy(true);
    setVipMessage('');
    try {
      await request('DELETE', `/api/entities/vip-invitations/${invitation.id}`);
      setVipInvitations((current) => current.filter((item) => item.id !== invitation.id));
      setVipSubmissions((current) => { const next = { ...current }; delete next[invitation.id]; return next; });
      setVipMessage('Η VIP πρόσκληση και όλα τα συνδεδεμένα στοιχεία διαγράφηκαν.');
    } catch (e) { setVipMessage(e.message || 'Δεν διαγράφηκε η VIP πρόσκληση.'); }
    finally { setVipBusy(false); }
  }

  async function deleteVipSubmission(invitation, response) {
    if (!window.confirm(`Να διαγραφεί οριστικά η απάντηση του/της ${response.displayName || response.name || 'συμμετέχοντα/ουσας'} και η συνδεδεμένη εγγραφή συμμετέχοντα;`)) return;
    setVipBusy(true);
    setVipMessage('');
    try {
      await request('DELETE', `/api/entities/vip-submissions/${response.id}`);
      setVipSubmissions((current) => ({
        ...current,
        [invitation.id]: (current[invitation.id] || []).filter((item) => item.id !== response.id),
      }));
      setVipMessage('Η απάντηση και η συνδεδεμένη εγγραφή συμμετέχοντα διαγράφηκαν.');
    } catch (e) { setVipMessage(e.message || 'Δεν διαγράφηκε η απάντηση.'); }
    finally { setVipBusy(false); }
  }

  async function approveVipSubmission(invitation, response) {
    setVipBusy(true);
    setVipMessage('');
    try {
      await request('POST', '/api/entities/intake-approvals/VIPInvitationSubmission/' + response.id, {});
      setVipSubmissions((current) => ({ ...current, [invitation.id]: (current[invitation.id] || []).map((item) => item.id === response.id ? { ...item, approved: true, approvalStatus: 'approved' } : item) }));
      setVipMessage('Η συμμετοχή εγκρίθηκε και δημιουργήθηκε προφίλ παίκτριας για το Setup.');
    } catch (e) { setVipMessage(e.message || 'Η έγκριση απέτυχε.'); }
    finally { setVipBusy(false); }
  }

  async function rejectVipSubmission(invitation, response) {
    if (!window.confirm(`Να απορριφθεί η συμμετοχή του/της ${response.displayName || response.name || 'συμμετέχοντα/ουσας'};`)) return;
    setVipBusy(true);
    setVipMessage('');
    try {
      const updated = await appApi.entities.VIPInvitationSubmission.update(response.id, {
        approved: false,
        approvalStatus: 'rejected',
        rejectedAt: new Date().toISOString(),
      });
      setVipSubmissions((current) => ({
        ...current,
        [invitation.id]: (current[invitation.id] || []).map((item) => item.id === response.id ? updated : item),
      }));
      setVipMessage('Η συμμετοχή απορρίφθηκε. Δεν δημιουργήθηκε προφίλ στο Tablet.');
    } catch (e) { setVipMessage(e.message || 'Η απόρριψη απέτυχε.'); }
    finally { setVipBusy(false); }
  }

  async function loadVipSubmissions(invitation) {
    setVipBusy(true);
    try {
      const { items: rows } = await appApi.entities.VIPInvitationSubmission.filter({ invitationId: invitation.id }, { sort: '-created_date', limit: 500 });
      setVipSubmissions((current) => ({ ...current, [invitation.id]: rows || [] }));
    } catch (e) { setVipMessage(e.message || 'Δεν φορτώθηκαν οι απαντήσεις.'); }
    finally { setVipBusy(false); }
  }

  return <div className="space-y-4">
    <ComicPanel className="bg-card space-y-3 border border-[#b99a45]/60">
      <div className="font-heading text-xl text-primary">Ιδιωτική VIP πρόσκληση</div>
      <div className="rounded-xl border border-[#b99a45]/50 bg-black p-4 text-center">
        <div className="text-xs tracking-[0.35em] text-[#E8C26B]">Αποκλειστική πρόσβαση</div>
        <div className="my-2 font-serif text-2xl tracking-[0.12em] text-[#f4e6bd]">VIP πρόσκληση</div>
        <div className="text-xs text-[#b99a45]">DEAL OF TEMPTATION</div>
      </div>
      <ComicButton disabled={vipBusy} onClick={createVipInvitation}>＋ Δημιουργία έτοιμης VIP πρόσκλησης</ComicButton>
      {vipMessage && <div className="text-sm font-bold text-foreground">{vipMessage}</div>}
      <label className="block space-y-1 text-sm font-bold text-[#E8C26B]">Σύνδεση με EVENT<select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} className="w-full rounded-lg border border-[#b99a45]/50 bg-black px-3 py-3 text-sm text-[#f4e6bd]"><option value="">Επίλεξε Event</option>{events.filter((event) => !['closing', 'completed'].includes(event.status)).map((event) => <option key={event.id} value={event.id}>{event.title} · {event.room_code}</option>)}</select></label>
    </ComicPanel>

    {vipInvitations.map((invitation) => {
      const url = invitation.token ? `${window.location.origin}/vip/${invitation.token}` : '';
      const responses = vipSubmissions[invitation.id];
      return <ComicPanel key={invitation.id} className="bg-card space-y-3 border border-[#b99a45]/40">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="font-heading text-lg text-[#E8C26B]">VIP πρόσκληση</div>
            <div className="text-xs text-foreground/60">{new Date(invitation.created_date).toLocaleString('el-GR')}</div>
            <div className="text-xs text-[#E8C26B]">Mode: {invitation.gameMode ? invitation.gameMode : 'Επιλογή από την καλεσμένη'}</div>
            <div className="text-xs text-foreground/60">Event: {invitation.eventTitle || '—'} · {invitation.roomCode || '—'}</div>
          </div>
          <span className={invitation.active ? 'rounded-full border border-[#b99a45] px-3 py-1 text-xs text-[#E8C26B]' : 'rounded-full border border-white/20 px-3 py-1 text-xs text-foreground/50'}>
            {invitation.active ? 'Ενεργή' : 'Ανενεργή'}
          </span>
        </div>
        {url && <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl bg-black p-3">
          <div className="rounded bg-white p-2"><QRCodeSVG value={url} size={132} /></div>
          <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
            <div className="break-all text-xs text-[#E8C26B]">{url}</div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <ComicButton size="sm" onClick={() => navigator.clipboard.writeText(url)}>Αντιγραφή συνδέσμου</ComicButton>
              <ComicButton size="sm" variant="dark" onClick={() => { if (navigator.share) navigator.share({ title: 'VIP Πρόσκληση — DEAL OF TEMPTATION', url }).catch(() => {}); else navigator.clipboard.writeText(url); }}>Κοινοποίηση</ComicButton>
            </div>
          </div>
        </div>}
        <div className="flex flex-wrap gap-2">
          <ComicButton size="sm" variant="dark" disabled={vipBusy} onClick={() => loadVipSubmissions(invitation)}>Απαντήσεις / συμμετοχές</ComicButton>
          <ComicButton size="sm" variant={invitation.active ? 'red' : 'green'} disabled={vipBusy} onClick={() => toggleVipInvitation(invitation)}>{invitation.active ? 'Απενεργοποίηση συνδέσμου' : 'Ενεργοποίηση συνδέσμου'}</ComicButton>
          <ComicButton size="sm" variant="red" disabled={vipBusy} onClick={() => deleteVipInvitation(invitation)}>Διαγραφή VIP πρόσκλησης + απαντήσεων</ComicButton>
        </div>
        {responses && <div className="space-y-2 border-t border-[#b99a45]/30 pt-3">
          <div className="font-heading text-sm text-[#E8C26B]">ΣΥΜΜΕΤΟΧΕΣ: {responses.length}</div>
          {responses.length === 0 ? <div className="text-sm text-foreground/55">Δεν υπάρχουν ακόμη υποβολές.</div> : responses.map((response) => (
            <div key={response.id} className="rounded-lg border border-[#b99a45]/25 bg-black/40 p-3">
              <div className="font-bold text-[#f4e6bd]">{response.avatar} {response.name}</div>
              <div className="mt-1 text-xs text-[#E8C26B]">ΕΠΙΛΕΓΜΕΝΟ MODE: {GAME_MODES.find((mode) => mode.id === response.gameMode)?.name || response.gameMode || '—'}</div>
              <div className="mt-2 space-y-1 text-xs text-foreground/70">
                {Object.entries(response.answerLabels || response.answers || {}).map(([label, answer]) => <div key={label}><span className="text-[#E8C26B]">{label}:</span> {String(answer)}</div>)}
              </div>
              <details className="mt-2 rounded-lg border border-[#b99a45]/25 p-2 text-xs">
                <summary className="cursor-pointer font-bold text-[#E8C26B]">Όλα τα αποθηκευμένα πεδία και απαντήσεις</summary>
                <pre className="mt-2 whitespace-pre-wrap break-words text-foreground/70">{JSON.stringify({ answers: response.answers || {}, customAnswers: response.customAnswers || {}, customAnswerLabels: response.customAnswerLabels || {} }, null, 2)}</pre>
              </details>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <div className="text-[10px] text-foreground/40">{new Date(response.created_date).toLocaleString('el-GR')} · {response.approved ? '✅ Εγκεκριμένη' : response.approvalStatus === 'rejected' ? '✕ ΑΠΟΡΡΙΦΘΕΙΣΑ' : '⏳ Σε αναμονή'}</div>
                <div className="flex flex-wrap gap-2">{!response.approved && response.approvalStatus !== 'rejected' && <><ComicButton size="sm" variant="green" disabled={vipBusy} onClick={() => approveVipSubmission(invitation, response)}>Έγκριση & δημιουργία προφίλ</ComicButton><ComicButton size="sm" variant="red" disabled={vipBusy} onClick={() => rejectVipSubmission(invitation, response)}>Απόρριψη</ComicButton></>}<ComicButton size="sm" variant="red" disabled={vipBusy} onClick={() => deleteVipSubmission(invitation, response)}>Διαγραφή απάντησης</ComicButton></div>
              </div>
            </div>
          ))}
        </div>}
      </ComicPanel>;
    })}

    <ComicPanel className="bg-card space-y-3">
      <div className="font-heading text-xl text-primary">Ψηφιακές προσκλήσεις</div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Τίτλος πρόσκλησης" className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm" />
      <select value={target} onChange={(e) => setTarget(e.target.value)} className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm">
        {TARGETS.map((item) => <option key={item.path} value={item.path}>{item.label}</option>)}
      </select>
      <ComicButton disabled={busy || !title.trim()} onClick={add}>＋ Δημιουργία πρόσκλησης</ComicButton>
      {message && <div className="text-xs font-bold">{message}</div>}
    </ComicPanel>
    {items.map((item) => {
      const url = `${window.location.origin}${item.path}`;
      return <ComicPanel key={item.id} className="bg-card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white p-2 rounded"><QRCodeSVG value={url} size={128} /></div>
          <div className="min-w-0 flex-1">
            <div className="font-heading text-lg">{item.title}</div>
            <div className="text-xs text-foreground/60 break-all my-2">{url}</div>
            <div className="flex flex-wrap gap-2">
              <ComicButton size="sm" onClick={() => { if (navigator.share) navigator.share({ title: item.title, url }).catch(() => {}); else navigator.clipboard.writeText(url); }}>Αποστολή / κοινοποίηση</ComicButton>
              <ComicButton size="sm" variant="dark" onClick={() => navigator.clipboard.writeText(url)}>Αντιγραφή συνδέσμου</ComicButton>
              <ComicButton size="sm" variant="red" disabled={busy} onClick={() => save(items.filter((x) => x.id !== item.id))}>Διαγραφή</ComicButton>
            </div>
          </div>
        </div>
      </ComicPanel>;
    })}
  </div>;
}
