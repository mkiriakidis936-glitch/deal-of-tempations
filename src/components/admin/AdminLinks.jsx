import React, { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { appApi } from '@/api/apiClient';
import { GAME_MODES } from '@/data/gameConfig';
import { PROMO_SITE_KEYS } from '@/pages/Promo';

// Admin → Σύνδεσμοι & QR: ΟΛΟΙ οι σύνδεσμοι της εφαρμογής σε ένα σημείο, με αντιγραφή, άνοιγμα και QR.
const ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';
const GIFT_KEY = 'admin_gift_vault';
const GIFT_DEFAULTS = {
  code: 'PAJAMAQUEENS',
  title: 'Η δοκιμασία πέρασε!',
  vow: 'Αφού αντέξατε όλη τη βραδιά, το δώρο αυτό είναι επίσημα δικό σας.',
  passTitle: 'Πιστοποιημένη Survivor της βραδιάς',
  giftName: 'Σπα σε ξενοδοχείο',
  giftText: 'Μία συνεδρία σπα σε ξενοδοχείο για όλη την παρέα — κερασμένη από τη διοργανώτρια.',
};

const activeModes = () => GAME_MODES.filter((mode) => !mode.retired);

function useCopy() {
  const [copied, setCopied] = useState('');
  const copy = async (key, text) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1600); }
    catch { window.prompt('Αντίγραψε τον σύνδεσμο:', text); }
  };
  return [copied, copy];
}

function LinkRow({ label, desc, url, locked, lockedText, copied, onCopy }) {
  const [qr, setQr] = useState(false);
  return (
    <div className="border-b border-white/10 px-4 py-3 last:border-0">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-white">{label}</div>
          {desc && <div className="text-xs text-white/55">{desc}</div>}
          <div className="mt-1 truncate font-mono text-[12px] text-[#E8C26B]/90">{locked ? lockedText : url}</div>
        </div>
        {!locked && (
          <div className="flex shrink-0 gap-1.5">
            <button type="button" className="adm-pill" onClick={() => onCopy(url, url)}>{copied === url ? '✓ Αντιγράφηκε' : 'Αντιγραφή'}</button>
            <a className="adm-pill" href={url} target="_blank" rel="noreferrer">Άνοιγμα ↗</a>
            <button type="button" className="adm-pill" aria-expanded={qr} onClick={() => setQr((v) => !v)}>QR</button>
          </div>
        )}
      </div>
      {qr && !locked && (
        <div className="mt-3 inline-block rounded-2xl bg-white p-3"><QRCodeSVG value={url} size={168} level="M" /></div>
      )}
    </div>
  );
}

function Group({ title, hint, children }) {
  return (
    <section className="space-y-2">
      <div className="px-1">
        <h3 className="text-[17px] font-semibold text-white">{title}</h3>
        {hint && <p className="text-xs text-white/55">{hint}</p>}
      </div>
      <div className="overflow-hidden rounded-2xl bg-[#1C1C1E]">{children}</div>
    </section>
  );
}

function GiftEditor() {
  const [record, setRecord] = useState(null);
  const [draft, setDraft] = useState(GIFT_DEFAULTS);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    appApi.entities.AppSetting.filter({ key: GIFT_KEY }, { limit: 1 })
      .then(({ items }) => { const rec = items?.[0] || null; setRecord(rec); setDraft({ ...GIFT_DEFAULTS, ...(rec?.value || {}) }); })
      .catch((e) => setMsg(e.message || 'Δεν φορτώθηκε το δώρο.'));
  }, []);
  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  async function save() {
    const code = String(draft.code || '').trim().toUpperCase();
    if (code.length < 4) { setMsg('Ο κωδικός πρέπει να έχει τουλάχιστον 4 χαρακτήρες.'); return; }
    setBusy(true); setMsg('');
    try {
      const value = { ...draft, code };
      const saved = record?.id ? await appApi.entities.AppSetting.update(record.id, { value }) : await appApi.entities.AppSetting.create({ key: GIFT_KEY, value });
      setRecord(saved); setDraft(value); setMsg('Αποθηκεύτηκε ✓ — ισχύει αμέσως στο /gift-unlock.');
    } catch (e) { setMsg(e.message || 'Η αποθήκευση απέτυχε.'); }
    finally { setBusy(false); }
  }
  const field = 'w-full rounded-xl border border-white/10 bg-[#2C2C2E] px-3 py-2 text-sm text-white';
  return (
    <div className="space-y-3 p-4">
      <p className="text-xs text-white/60">Η σελίδα <b>/gift-unlock</b> ανοίγει το «δώρο της παρέας» όταν κάποια γράψει τον σωστό κωδικό. Τον κωδικό τον λες εσύ (ή τον δείχνει η TV) όταν περάσει η δοκιμασία. Ο έλεγχος γίνεται στον server — ο κωδικός δεν φαίνεται μέσα στη σελίδα.</p>
      <label className="block space-y-1"><span className="text-xs font-semibold text-white/70">Μυστικός κωδικός</span>
        <input className={`${field} font-mono text-lg uppercase tracking-[0.2em] text-[#E8C26B]`} value={draft.code} onChange={(e) => set('code', e.target.value)} /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1"><span className="text-xs font-semibold text-white/70">Τίτλος μετά το ξεκλείδωμα</span><input className={field} value={draft.title} onChange={(e) => set('title', e.target.value)} /></label>
        <label className="block space-y-1"><span className="text-xs font-semibold text-white/70">Τίτλος πάσου</span><input className={field} value={draft.passTitle} onChange={(e) => set('passTitle', e.target.value)} /></label>
        <label className="block space-y-1"><span className="text-xs font-semibold text-white/70">Όνομα δώρου</span><input className={field} value={draft.giftName} onChange={(e) => set('giftName', e.target.value)} /></label>
        <label className="block space-y-1 sm:col-span-2"><span className="text-xs font-semibold text-white/70">Περιγραφή δώρου</span><textarea rows={2} className={field} value={draft.giftText} onChange={(e) => set('giftText', e.target.value)} /></label>
        <label className="block space-y-1 sm:col-span-2"><span className="text-xs font-semibold text-white/70">Μήνυμα</span><textarea rows={2} className={field} value={draft.vow} onChange={(e) => set('vow', e.target.value)} /></label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={busy} onClick={save} className="h-10 rounded-full bg-[#E8C26B] px-5 text-sm font-bold text-black disabled:opacity-50">{busy ? 'Αποθήκευση…' : 'Αποθήκευση δώρου'}</button>
        {msg && <span className="text-xs text-white/75" role="status">{msg}</span>}
      </div>
    </div>
  );
}

export default function AdminLinks({ sessions = [], selectedSession }) {
  const sessionCode = selectedSession?.sessionCode || sessions?.[0]?.sessionCode || '';
  const [copied, copy] = useCopy();
  const modes = useMemo(activeModes, []);
  const withCode = (path) => `${ORIGIN}${path}?code=${encodeURIComponent(sessionCode)}`;
  const game = [
    { label: '📟 Tablet — εδώ διευθύνεις', desc: 'Η κύρια συσκευή. Μόνο αυτή ξεκινά γύρους, κάρτες, ποινές και ΣΤΟΠ.', url: withCode('/') },
    { label: '📺 TV — οθόνη για όλες', desc: 'Δείχνει ταμπλό, σκορ και ανακοινώσεις. Δεν ελέγχει τίποτα.', url: withCode('/tv') },
    { label: '📱 Κινητό — κάθε παίκτρια', desc: 'Ψηφοφορίες, προσωπικές κάρτες, αποστολές.', url: withCode('/play') },
  ];

  async function copyGame() {
    await copy('all-game', game.map((item) => `${item.label}\n${item.url}`).join('\n\n'));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 text-white">
      <section className="rounded-3xl border border-[#E8C26B]/30 bg-[#17140C] p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#E8C26B]">Όλοι οι σύνδεσμοι</div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-white/70">Κωδικός ενεργής συνεδρίας</div>
            <div className="font-mono text-3xl font-bold tracking-[0.2em] text-[#E8C26B]">{sessionCode || '—'}</div>
            {!sessionCode && <div className="text-xs text-white/55">Ξεκίνα παιχνίδι από το Tablet για να πάρεις κωδικό.</div>}
          </div>
          <button type="button" className="h-11 rounded-full bg-[#E8C26B] px-5 text-sm font-bold text-black disabled:opacity-40" disabled={!sessionCode} onClick={copyGame}>
            {copied === 'all-game' ? '✓ Αντιγράφηκαν' : 'Αντιγραφή Tablet + TV + Κινητό'}
          </button>
        </div>
      </section>

      <Group title="🎮 Το παιχνίδι" hint="Ίδιος κωδικός σε όλες τις συσκευές. Αυτά τα ανοίγεις εσύ.">
        {game.map((item) => <LinkRow key={item.label} {...item} locked={!sessionCode} lockedText="Χρειάζεται ενεργή συνεδρία" copied={copied} onCopy={copy} />)}
      </Group>

      <Group title="📣 Promo — για να τους «τσιμπήσεις»" hint="Μοντέρνα σελίδα με όλα τα modes και κουμπί «Κλείσε θέση». Ο σύνδεσμος ανά mode ανοίγει κατευθείαν σε αυτό.">
        <LinkRow label="📣 Promo — όλα τα modes" url={`${ORIGIN}/promo`} copied={copied} onCopy={copy} />
        {modes.filter((mode) => PROMO_SITE_KEYS[mode.id]).map((mode) => (
          <LinkRow key={mode.id} label={`${mode.icon} Promo · ${mode.name}`} url={`${ORIGIN}/promo?mode=${mode.id}`} copied={copied} onCopy={copy} />
        ))}
      </Group>

      <Group title="📝 Φόρμες συμμετοχής" hint="Η αίτηση πάει στις «Αιτήσεις». Ο σύνδεσμος ανά mode έχει ήδη επιλεγμένο το mode.">
        <LinkRow label="📝 Ενιαία φόρμα (επιλέγει mode)" url={`${ORIGIN}/forms`} copied={copied} onCopy={copy} />
        {modes.map((mode) => <LinkRow key={mode.id} label={`${mode.icon} Φόρμα · ${mode.name}`} url={`${ORIGIN}/forms?mode=${mode.id}`} copied={copied} onCopy={copy} />)}
      </Group>

      <Group title="🌐 Ιστοσελίδα" hint="Η πλήρης παρουσίαση: σενάριο, πρόγραμμα, gallery, ερωτήσεις.">
        <LinkRow label="🌐 Site — αρχική" url={`${ORIGIN}/site`} copied={copied} onCopy={copy} />
        {modes.filter((mode) => PROMO_SITE_KEYS[mode.id]).map((mode) => (
          <LinkRow key={mode.id} label={`${mode.icon} Site · ${mode.name}`} url={`${ORIGIN}/site?event=${PROMO_SITE_KEYS[mode.id]}`} copied={copied} onCopy={copy} />
        ))}
        <LinkRow label="📍 Portal — πληροφορίες Event" desc="Ημερομηνία, τοποθεσία και πρακτικές πληροφορίες της εκδήλωσης." url={`${ORIGIN}/portal`} copied={copied} onCopy={copy} />
      </Group>

      <Group title="🙋 Δήλωση ενδιαφέροντος" hint="Δες «Ενδιαφέρον & συμμετοχή»: η καλεσμένη δηλώνει «θέλω / δεν μπορώ» για ONE NIGHT ή 48H VILLA.">
        <LinkRow label="🙋 Δήλωση ενδιαφέροντος" url={`${ORIGIN}/deal`} copied={copied} onCopy={copy} />
      </Group>

      <Group title="🎁 Δώρο — Gift Unlock" hint="Η σελίδα του δώρου και ο κωδικός της.">
        <LinkRow label="🎁 Gift Unlock" url={`${ORIGIN}/gift-unlock`} copied={copied} onCopy={copy} />
        <GiftEditor />
      </Group>

      <Group title="💌 Προσωπικοί σύνδεσμοι" hint="Δεν είναι σταθεροί — φτιάχνονται για κάθε καλεσμένη ή βραδιά.">
        <div className="space-y-1 px-4 py-3 text-sm text-white/75">
          <div>• <b>VIP πρόσκληση</b> (/vip/…): Admin → Προσκλήσεις.</div>
          <div>• <b>Σελίδα αναμνήσεων</b> (/memories/…): Admin → Ιστορικό παρτίδων → Σελίδες αναμνήσεων.</div>
        </div>
      </Group>

      <Group title="🔧 Μόνο για σένα">
        <LinkRow label="🎛️ Ρύθμιση ήχου & κάμερας" desc="Άνοιξέ το στη συσκευή της TV ή του Tablet." url={`${ORIGIN}/av-setup`} copied={copied} onCopy={copy} />
        <LinkRow label="🔧 Admin" desc="Δεν το στέλνεις ποτέ σε καλεσμένη." url={`${ORIGIN}/admin`} copied={copied} onCopy={copy} />
      </Group>
    </div>
  );
}
