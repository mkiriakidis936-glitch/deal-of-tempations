import React, { useEffect, useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { base44 } from '@/api/base44Client';

const KEY = 'site_admin_translations';
const LANGS = [{ id: 'el', label: 'Ελληνικά' }, { id: 'en', label: 'English' }, { id: 'bg', label: 'Български' }, { id: 'tr', label: 'Türkçe' }];

export default function AdminMultilingual() {
  const [record, setRecord] = useState(null);
  const [packs, setPacks] = useState({});
  const [language, setLanguage] = useState('en');
  const [keyName, setKeyName] = useState('');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    base44.entities.AppSetting.filter({ key: KEY }, { limit: 1 }).then(({ items }) => {
      const rec = items?.[0] || null;
      setRecord(rec);
      setPacks(rec?.value?.translations || {});
    }).catch((e) => setMessage(e.message));
  }, []);

  const save = async (next) => {
    setBusy(true);
    try {
      const value = { languages: LANGS.map((l) => l.id), translations: next };
      const rec = record?.id
        ? await base44.entities.AppSetting.update(record.id, { value })
        : await base44.entities.AppSetting.create({ key: KEY, value });
      setRecord(rec); setPacks(next); setMessage('Οι μεταφράσεις αποθηκεύτηκαν.');
    } catch (e) { setMessage(e.message); }
    finally { setBusy(false); }
  };

  const addOrUpdate = () => {
    const k = keyName.trim();
    if (!k) return;
    save({ ...packs, [k]: { ...(packs[k] || {}), [language]: draft } }).then(() => { setKeyName(''); setDraft(''); });
  };

  const rows = Object.entries(packs).sort(([a], [b]) => a.localeCompare(b));
  return <div className="space-y-3">
    <ComicPanel className="bg-card space-y-3">
      <div className="font-heading text-xl text-primary">MULTILINGUAL MANAGEMENT</div>
      <p className="text-xs text-foreground/65">Κεντρικό λεξικό για το Website και τις ετικέτες πλοήγησης του Admin. Κλειδιά Website: heist.tagline, pajama.scenarioTitle, home.tagline. Κλειδιά Admin: admin.nav.dashboard, admin.nav.host. Υποστηρίζονται Ελληνικά, Αγγλικά, Βουλγαρικά και Τουρκικά.</p>
      <div className="grid sm:grid-cols-2 gap-2">
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="rounded-lg border-2 border-border bg-background px-3 py-2 text-sm">{LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}</select>
        <input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="Κλειδί (π.χ. heist.tagline ή admin.nav.dashboard)" className="rounded-lg border-2 border-border bg-background px-3 py-2 text-sm" />
      </div>
      <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Μετάφραση για την επιλεγμένη γλώσσα" rows={3} className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm" />
      <ComicButton disabled={busy || !keyName.trim()} onClick={addOrUpdate}>ΑΠΟΘΗΚΕΥΣΗ ΜΕΤΑΦΡΑΣΗΣ</ComicButton>
      {message && <div className="text-xs font-bold">{message}</div>}
    </ComicPanel>
    {rows.map(([key, values]) => <ComicPanel key={key} className="bg-card">
      <div className="font-bold text-sm mb-2">{key}</div>
      <div className="grid sm:grid-cols-2 gap-2 text-xs">
        {LANGS.map((l) => <div key={l.id} className="rounded border border-border/50 p-2"><div className="font-bold text-primary">{l.label}</div><div className="whitespace-pre-wrap">{values?.[l.id] || '—'}</div></div>)}
      </div>
      <div className="mt-2"><ComicButton size="sm" variant="red" disabled={busy} onClick={() => { const next = { ...packs }; delete next[key]; save(next); }}>ΔΙΑΓΡΑΦΗ ΚΛΕΙΔΙΟΥ</ComicButton></div>
    </ComicPanel>)}
  </div>;
}
