import React, { useCallback, useEffect, useRef, useState } from 'react';
import { request, getToken } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

const KIND_LABEL = { auto: 'Αυτόματο', manual: 'Χειροκίνητο', 'pre-restore': 'Πριν από επαναφορά' };
const mb = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const when = (ms) => new Date(ms).toLocaleString('el-GR');

async function download(path, filename) {
  const token = getToken();
  const res = await fetch(path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error(`Αποτυχία λήψης (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export default function AdminBackup() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [picked, setPicked] = useState(null); // { name, data }
  const [libraryRefreshNeeded, setLibraryRefreshNeeded] = useState(false);
  const fileRef = useRef(null);
  const mediaFileRef = useRef(null);

  const load = useCallback(async () => {
    try { setItems((await request('GET', '/api/backup/list')).items || []); } catch (e) { setMsg({ ok: false, text: e.message }); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (libraryRefreshNeeded) setLibraryRefreshNeeded(false); }, [libraryRefreshNeeded]);

  async function run(fn, okText) {
    setBusy(true);
    setMsg(null);
    try { await fn(); setMsg({ ok: true, text: okText }); } catch (e) { setMsg({ ok: false, text: e.message || 'Κάτι πήγε στραβά.' }); }
    setBusy(false);
    load();
  }

  const downloadNow = () => run(() => download('/api/backup/export', `deal-of-temptation-backup-${new Date().toISOString().slice(0, 10)}.json`), 'Το αντίγραφο κατέβηκε στον υπολογιστή σου.');
  const saveNow = () => run(() => request('POST', '/api/backup/now'), 'Αποθηκεύτηκε αντίγραφο στον server.');

  const downloadMediaNow = () => run(
    () => download('/api/backup/media/export', 'deal-of-temptation-media-' + new Date().toISOString().slice(0, 10) + '.tar.gz'),
    'Το αρχείο φωτογραφιών και βίντεο κατέβηκε.',
  );

  async function onMediaRestorePick(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.tar.gz')) {
      setMsg({ ok: false, text: 'Επίλεξε αρχείο .tar.gz από το Media Backup.' });
      return;
    }
    if (!window.confirm('Να γίνει επαναφορά των φωτογραφιών και βίντεο από αυτό το αρχείο; Τα ίδια ονόματα αρχείων θα αντικατασταθούν. Θα κρατηθεί πρώτα αντίγραφο των τωρινών media στον server.')) return;
    await run(async () => {
      const token = getToken();
      const response = await fetch('/api/backup/media/restore', {
        method: 'POST',
        headers: token ? { Authorization: 'Bearer ' + token } : {},
        body: file,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Αποτυχία επαναφοράς αρχείων.');
      setLibraryRefreshNeeded(true);
      return result;
    }, 'Η επαναφορά αρχείων ολοκληρώθηκε. Κάνε ανανέωση της σελίδας.');
  }

  function askMode(label) {
    const replace = window.confirm(
      `${label}\n\nOK = ΠΛΗΡΗΣ ΕΠΑΝΑΦΟΡΑ (τα δεδομένα γίνονται ακριβώς όπως ήταν· ό,τι προστέθηκε μετά χάνεται).\nΑκύρωση = ΣΥΓΧΩΝΕΥΣΗ (προστίθενται όσα λείπουν και επανέρχονται οι παλιές τιμές, χωρίς διαγραφή).\n\nΠριν από την επαναφορά κρατιέται αυτόματο αντίγραφο της τωρινής κατάστασης.`,
    );
    return replace ? 'replace' : 'merge';
  }

  function restoreStored(name) {
    if (!window.confirm(`Επαναφορά από «${name}»;`)) return;
    const mode = askMode('Τρόπος επαναφοράς:');
    run(() => request('POST', `/api/backup/restore-file/${encodeURIComponent(name)}?mode=${mode}`), 'Η επαναφορά ολοκληρώθηκε. Κάνε ανανέωση της σελίδας.');
  }

  async function onPick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (data?.app !== 'deal-of-temptation' || !Array.isArray(data.records)) throw new Error('Δεν είναι αντίγραφο του Deal of Temptation.');
      setPicked({ name: file.name, data });
      setMsg(null);
    } catch (err) {
      setPicked(null);
      setMsg({ ok: false, text: err.message || 'Μη έγκυρο αρχείο.' });
    }
  }

  function restorePicked() {
    if (!picked) return;
    const mode = askMode(`Επαναφορά από το αρχείο «${picked.name}»;`);
    run(async () => { await request('POST', `/api/backup/restore?mode=${mode}`, picked.data); setPicked(null); }, 'Η επαναφορά ολοκληρώθηκε. Κάνε ανανέωση της σελίδας.');
  }

  return (
    <div className="space-y-4">
      <ComicPanel className="bg-tarot-royal text-center py-4">
        <div className="font-heading text-3xl comic-text-stroke text-tarot-gold">💾 Αντίγραφα ασφαλείας</div>
        <div className="text-sm font-bold text-foreground/80 font-body">Παρτίδες, κάρτες, φόρμες, site, παίκτριες, επιτεύγματα</div>
      </ComicPanel>

      {msg && (
        <ComicPanel className={msg.ok ? 'bg-tarot-forest' : 'bg-tarot-crimson'}>
          <div className="font-body text-sm text-foreground">{msg.ok ? '✓ ' : '⚠ '}{msg.text}</div>
        </ComicPanel>
      )}

      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg text-primary">ΔΗΜΙΟΥΡΓΙΑ</div>
        <div className="flex flex-wrap gap-2">
          <ComicButton variant="yellow" size="md" disabled={busy} onClick={downloadNow}>⬇ ΚΑΤΕΒΑΣΜΑ ΣΤΟΝ ΥΠΟΛΟΓΙΣΤΗ</ComicButton>
          <ComicButton variant="dark" size="md" disabled={busy} onClick={saveNow}>💾 ΑΠΟΘΗΚΕΥΣΗ ΣΤΟΝ SERVER</ComicButton>
        </div>
        <div className="text-xs text-foreground/60 font-body">
          Ο server κρατά μόνος του αντίγραφο κάθε μέρα (τα 14 τελευταία), μέσα στο Volume. Το JSON περιλαμβάνει τα δεδομένα της εφαρμογής. Φωτογραφίες και βίντεο διαχειρίζονται ξεχωριστά από το Media Backup παρακάτω.
        </div>
      </ComicPanel>

      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg text-primary">MEDIA BACKUP — ΦΩΤΟΓΡΑΦΙΕΣ & ΒΙΝΤΕΟ</div>
        <div className="text-xs text-foreground/60 font-body">Δημιουργεί συμπιεσμένο αρχείο .tar.gz με όλα τα ανεβασμένα αρχεία του Media Library. Η επαναφορά κρατά πρώτα αντίγραφο των τωρινών αρχείων στον server και επαναφέρει τα αρχεία με τα αρχικά τους ονόματα.</div>
        <div className="flex flex-wrap gap-2">
          <ComicButton variant="yellow" size="md" disabled={busy} onClick={downloadMediaNow}>⬇ ΚΑΤΕΒΑΣΜΑ MEDIA BACKUP</ComicButton>
          <input ref={mediaFileRef} type="file" accept=".tar.gz,application/gzip" className="hidden" onChange={onMediaRestorePick} />
          <ComicButton variant="dark" size="md" disabled={busy} onClick={() => mediaFileRef.current?.click()}>📂 ΕΠΑΝΑΦΟΡΑ MEDIA BACKUP</ComicButton>
        </div>
      </ComicPanel>

      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg text-primary">ΕΠΑΝΑΦΟΡΑ ΑΠΟ ΑΡΧΕΙΟ</div>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={onPick} />
        <ComicButton variant="dark" size="md" disabled={busy} onClick={() => fileRef.current?.click()}>📂 ΕΠΙΛΟΓΗ ΑΡΧΕΙΟΥ .json</ComicButton>
        {picked && (
          <div className="space-y-2 border border-border p-3">
            <div className="text-sm font-body">«{picked.name}» · {picked.data.records.length} εγγραφές · {picked.data.exportedAt ? new Date(picked.data.exportedAt).toLocaleString('el-GR') : ''}</div>
            <div className="text-xs text-foreground/70 font-body">
              {Object.entries(picked.data.counts || {}).map(([k, v]) => `${k}: ${v}`).join(' · ')}
            </div>
            <ComicButton variant="red" size="md" disabled={busy} onClick={restorePicked}>⚠ ΕΠΑΝΑΦΟΡΑ ΑΠΟ ΑΥΤΟ</ComicButton>
          </div>
        )}
      </ComicPanel>

      <ComicPanel className="bg-card space-y-2">
        <div className="flex justify-between items-center">
          <div className="font-heading text-lg text-primary">ΑΠΟΘΗΚΕΥΜΕΝΑ ΣΤΟΝ SERVER</div>
          <ComicButton variant="dark" size="sm" onClick={load}>↻</ComicButton>
        </div>
        {!items.length && <div className="text-sm text-foreground/60 font-body">Δεν υπάρχουν ακόμα. Το πρώτο αυτόματο δημιουργείται λίγο μετά την εκκίνηση του server.</div>}
        {items.map((it) => (
          <div key={it.name} className="flex items-center gap-2 border-t border-border pt-2">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-heading truncate">{KIND_LABEL[it.kind] || it.kind}</div>
              <div className="text-xs text-foreground/60">{when(it.modified)} · {mb(it.size)}</div>
            </div>
            <ComicButton variant="dark" size="sm" disabled={busy} onClick={() => run(() => download(`/api/backup/file/${encodeURIComponent(it.name)}`, it.name), 'Το αρχείο κατέβηκε.')}>⬇</ComicButton>
            <ComicButton variant="red" size="sm" disabled={busy} onClick={() => restoreStored(it.name)}>ΕΠΑΝΑΦΟΡΑ</ComicButton>
          </div>
        ))}
      </ComicPanel>
    </div>
  );
}
