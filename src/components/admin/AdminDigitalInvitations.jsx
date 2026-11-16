import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { base44, request } from '@/api/base44Client';
import { GAME_MODES } from '@/data/gameConfig';

const KEY = 'digital_invitations';
const TARGETS = [
  { path: '/invitation', label: 'Heist Night — Πρόσκληση' },
  { path: '/pajama-invite', label: 'Pajama Pedi-Glam — Πρόσκληση' },
  { path: '/modes-form', label: 'Επιλογή λειτουργιών παιχνιδιού' },
  { path: '/modes-form?mode=pedi_extended', label: 'Pedi Extended' },
  { path: '/modes-form?mode=lockdown', label: 'Lockdown' },
  { path: '/modes-form?mode=beach_bar', label: 'Beach Bar' },
];
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
  const [vipGameMode, setVipGameMode] = useState('classic');

  useEffect(() => {
    base44.entities.AppSetting.filter({ key: KEY }, { limit: 1 }).then(({ items: rows }) => {
      const rec = rows?.[0] || null;
      setRecord(rec);
      setItems(Array.isArray(rec?.value?.items) ? rec.value.items : []);
    }).catch((e) => setMessage(e.message));
    loadVipInvitations();
  }, []);

  async function loadVipInvitations() {
    try {
      const { items: rows } = await base44.entities.VIPInvitation.filter({}, { sort: '-created_date', limit: 30 });
      setVipInvitations(rows || []);
    } catch (e) { setVipMessage(e.message || 'Δεν φορτώθηκαν οι VIP προσκλήσεις.'); }
  }

  const save = async (next) => {
    setBusy(true);
    try {
      const value = { items: next };
      const rec = record?.id
        ? await base44.entities.AppSetting.update(record.id, { value })
        : await base44.entities.AppSetting.create({ key: KEY, value });
      setRecord(rec); setItems(next); setMessage('Αποθηκεύτηκε.');
    } catch (e) { setMessage(e.message); }
    finally { setBusy(false); }
  };

  const add = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    const next = [...items, { id: makeId(), title: cleanTitle, path: target, createdAt: new Date().toISOString() }];
    save(next).then(() => setTitle(''));
  };

  async function createVipInvitation() {
    setVipBusy(true);
    setVipMessage('');
    try {
      const invitation = await request('POST', '/api/entities/vip-invitations', { gameMode: vipGameMode });
      setVipInvitations((current) => [invitation, ...current]);
      setVipMessage('Η VIP πρόσκληση δημιουργήθηκε και είναι έτοιμη για αποστολή.');
    } catch (e) { setVipMessage(e.message || 'Δεν δημιουργήθηκε η VIP πρόσκληση.'); }
    finally { setVipBusy(false); }
  }

  async function toggleVipInvitation(invitation) {
    setVipBusy(true);
    try {
      const updated = await base44.entities.VIPInvitation.update(invitation.id, { active: !invitation.active });
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

  async function loadVipSubmissions(invitation) {
    setVipBusy(true);
    try {
      const { items: rows } = await base44.entities.VIPInvitationSubmission.filter({ invitationId: invitation.id }, { sort: '-created_date', limit: 500 });
      setVipSubmissions((current) => ({ ...current, [invitation.id]: rows || [] }));
    } catch (e) { setVipMessage(e.message || 'Δεν φορτώθηκαν οι απαντήσεις.'); }
    finally { setVipBusy(false); }
  }

  return <div className="space-y-4">
    <ComicPanel className="bg-card space-y-3 border border-[#b99a45]/60">
      <div className="font-heading text-xl text-primary">ΙΔΙΩΤΙΚΗ VIP ΠΡΟΣΚΛΗΣΗ</div>
      <p className="text-sm text-foreground/70">Έτοιμη, ιδιωτική πρόσκληση DEAL OF TEMPTATION. Το σύστημα δημιουργεί έναν κοινό σύνδεσμο και QR για όλους τους καλεσμένους. Το κείμενο και ο σχεδιασμός είναι προκαθορισμένα.</p>
      <div className="rounded-xl border border-[#b99a45]/50 bg-black p-4 text-center">
        <div className="text-xs tracking-[0.35em] text-[#c9a94e]">ΑΠΟΚΛΕΙΣΤΙΚΗ ΠΡΟΣΒΑΣΗ</div>
        <div className="my-2 font-serif text-2xl tracking-[0.12em] text-[#f4e6bd]">VIP ΠΡΟΣΚΛΗΣΗ</div>
        <div className="text-xs text-[#b99a45]">DEAL OF TEMPTATION</div>
      </div>
      <ComicButton disabled={vipBusy} onClick={createVipInvitation}>＋ ΔΗΜΙΟΥΡΓΙΑ ΕΤΟΙΜΗΣ VIP ΠΡΟΣΚΛΗΣΗΣ</ComicButton>
      {vipMessage && <div className="text-sm font-bold text-foreground">{vipMessage}</div>}
      <label className="block space-y-1 text-sm font-bold text-[#d8bd72]">ΣΥΝΔΕΣΗ ΜΕ ΠΑΙΧΝΙΔΙ<select value={vipGameMode} onChange={(e) => setVipGameMode(e.target.value)} className="w-full rounded-lg border border-[#b99a45]/50 bg-black px-3 py-3 text-sm text-[#f4e6bd]">{GAME_MODES.map((mode) => <option key={mode.id} value={mode.id}>{mode.name}</option>)}</select></label>
      <p className="text-xs text-foreground/55">Η VIP φόρμα έχει δικές της ερωτήσεις και δεν επηρεάζει το απλή φόρμα πρόσκλησης.</p>
    </ComicPanel>

    {vipInvitations.map((invitation) => {
      const url = invitation.token ? `${window.location.origin}/vip/${invitation.token}` : '';
      const responses = vipSubmissions[invitation.id];
      return <ComicPanel key={invitation.id} className="bg-card space-y-3 border border-[#b99a45]/40">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="font-heading text-lg text-[#c9a94e]">VIP ΠΡΟΣΚΛΗΣΗ</div>
            <div className="text-xs text-foreground/60">{new Date(invitation.created_date).toLocaleString('el-GR')}</div>
            <div className="text-xs text-[#d8bd72]">Παιχνίδι: {GAME_MODES.find((mode) => mode.id === invitation.gameMode)?.name || invitation.gameMode || 'ΚΛΑΣΣΙΚΗ'}</div>
          </div>
          <span className={invitation.active ? 'rounded-full border border-[#b99a45] px-3 py-1 text-xs text-[#d8bd72]' : 'rounded-full border border-white/20 px-3 py-1 text-xs text-foreground/50'}>
            {invitation.active ? 'ΕΝΕΡΓΗ' : 'ΑΝΕΝΕΡΓΗ'}
          </span>
        </div>
        {url && <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl bg-black p-3">
          <div className="rounded bg-white p-2"><QRCodeSVG value={url} size={132} /></div>
          <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
            <div className="break-all text-xs text-[#d8bd72]">{url}</div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <ComicButton size="sm" onClick={() => navigator.clipboard.writeText(url)}>ΑΝΤΙΓΡΑΦΗ ΣΥΝΔΕΣΜΟΥ</ComicButton>
              <ComicButton size="sm" variant="dark" onClick={() => { if (navigator.share) navigator.share({ title: 'VIP Πρόσκληση — DEAL OF TEMPTATION', url }).catch(() => {}); else navigator.clipboard.writeText(url); }}>ΚΟΙΝΟΠΟΙΗΣΗ</ComicButton>
            </div>
          </div>
        </div>}
        <div className="flex flex-wrap gap-2">
          <ComicButton size="sm" variant="dark" disabled={vipBusy} onClick={() => loadVipSubmissions(invitation)}>ΑΠΑΝΤΗΣΕΙΣ / ΣΥΜΜΕΤΟΧΕΣ</ComicButton>
          <ComicButton size="sm" variant={invitation.active ? 'red' : 'green'} disabled={vipBusy} onClick={() => toggleVipInvitation(invitation)}>{invitation.active ? 'ΑΠΕΝΕΡΓΟΠΟΙΗΣΗ ΣΥΝΔΕΣΜΟΥ' : 'ΕΝΕΡΓΟΠΟΙΗΣΗ ΣΥΝΔΕΣΜΟΥ'}</ComicButton>
          <ComicButton size="sm" variant="red" disabled={vipBusy} onClick={() => deleteVipInvitation(invitation)}>ΔΙΑΓΡΑΦΗ VIP ΠΡΟΣΚΛΗΣΗΣ + ΑΠΑΝΤΗΣΕΩΝ</ComicButton>
        </div>
        {responses && <div className="space-y-2 border-t border-[#b99a45]/30 pt-3">
          <div className="font-heading text-sm text-[#d8bd72]">ΣΥΜΜΕΤΟΧΕΣ: {responses.length}</div>
          {responses.length === 0 ? <div className="text-sm text-foreground/55">Δεν υπάρχουν ακόμη υποβολές.</div> : responses.map((response) => (
            <div key={response.id} className="rounded-lg border border-[#b99a45]/25 bg-black/40 p-3">
              <div className="font-bold text-[#f4e6bd]">{response.avatar} {response.name}</div>
              <div className="mt-2 space-y-1 text-xs text-foreground/70">
                {Object.entries(response.answerLabels || response.answers || {}).map(([label, answer]) => <div key={label}><span className="text-[#c9a94e]">{label}:</span> {String(answer)}</div>)}
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <div className="text-[10px] text-foreground/40">{new Date(response.created_date).toLocaleString('el-GR')}</div>
                <ComicButton size="sm" variant="red" disabled={vipBusy} onClick={() => deleteVipSubmission(invitation, response)}>ΔΙΑΓΡΑΦΗ ΑΠΑΝΤΗΣΗΣ</ComicButton>
              </div>
            </div>
          ))}
        </div>}
      </ComicPanel>;
    })}

    <ComicPanel className="bg-card space-y-3">
      <div className="font-heading text-xl text-primary">ΨΗΦΙΑΚΕΣ ΠΡΟΣΚΛΗΣΕΙΣ</div>
      <p className="text-xs text-foreground/65">Δημιουργία QR προσκλήσεων που οδηγούν στις ήδη υπάρχουσες φόρμες και εμπειρίες.</p>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Τίτλος πρόσκλησης" className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm" />
      <select value={target} onChange={(e) => setTarget(e.target.value)} className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm">
        {TARGETS.map((item) => <option key={item.path} value={item.path}>{item.label}</option>)}
      </select>
      <ComicButton disabled={busy || !title.trim()} onClick={add}>＋ ΔΗΜΙΟΥΡΓΙΑ ΠΡΟΣΚΛΗΣΗΣ</ComicButton>
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
              <ComicButton size="sm" onClick={() => { if (navigator.share) navigator.share({ title: item.title, url }).catch(() => {}); else navigator.clipboard.writeText(url); }}>ΑΠΟΣΤΟΛΗ / ΚΟΙΝΟΠΟΙΗΣΗ</ComicButton>
              <ComicButton size="sm" variant="dark" onClick={() => navigator.clipboard.writeText(url)}>ΑΝΤΙΓΡΑΦΗ ΣΥΝΔΕΣΜΟΥ</ComicButton>
              <ComicButton size="sm" variant="red" disabled={busy} onClick={() => save(items.filter((x) => x.id !== item.id))}>ΔΙΑΓΡΑΦΗ</ComicButton>
            </div>
          </div>
        </div>
      </ComicPanel>;
    })}
  </div>;
}
