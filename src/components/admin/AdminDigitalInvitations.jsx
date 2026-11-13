import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { base44 } from '@/api/base44Client';

const KEY = 'digital_invitations';
const TARGETS = [
  { path: '/invitation', label: 'Heist Night — Πρόσκληση' },
  { path: '/pajama-invite', label: 'Pajama Pedi-Glam — Πρόσκληση' },
  { path: '/modes-form', label: 'Digital Modes — Φόρμα συμμετοχής' },
];
const makeId = () => globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

export default function AdminDigitalInvitations() {
  const [record, setRecord] = useState(null);
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState(TARGETS[0].path);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    base44.entities.AppSetting.filter({ key: KEY }, { limit: 1 }).then(({ items: rows }) => {
      const rec = rows?.[0] || null;
      setRecord(rec);
      setItems(Array.isArray(rec?.value?.items) ? rec.value.items : []);
    }).catch((e) => setMessage(e.message));
  }, []);

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

  return <div className="space-y-3">
    <ComicPanel className="bg-card space-y-3">
      <div className="font-heading text-xl text-primary">DIGITAL INVITATIONS</div>
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
              <ComicButton size="sm" variant="dark" onClick={() => navigator.clipboard.writeText(url)}>ΑΝΤΙΓΡΑΦΗ LINK</ComicButton>
              <ComicButton size="sm" variant="red" disabled={busy} onClick={() => save(items.filter((x) => x.id !== item.id))}>ΔΙΑΓΡΑΦΗ</ComicButton>
            </div>
          </div>
        </div>
      </ComicPanel>;
    })}
  </div>;
}
