import React, { useEffect, useState } from 'react';
import { request } from '@/api/apiClient';
import { getActiveSessionCode } from '@/lib/activeSession';

// 11.1.0 · Admin → 💡 Φώτα & Samsung TV.
// Σύνδεση με Samsung SmartThings (λάμπες & LED ταινίες Tapo κ.ά.), ρόλοι συσκευών, δοκιμή, και πώς ανοίγει η TV.
// Τα tokens πηγαίνουν μόνο στον server· εδώ δεν εμφανίζονται ποτέ.

const card = 'rounded-2xl bg-[#1C1C1E] p-4 text-white';
const btn = 'rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-40';
const ROLE = { lamp: '💡 Λάμπα (ατμόσφαιρα)', strip: '🌈 LED ταινία (εφέ)', off: '⛔ Εκτός παιχνιδιού' };
const SCENES = [
  ['Κάθε ήπειρος', 'Δικό της χρώμα: Classic χρυσό · Arrest Heist κόκκινο/μπλε · Lockdown μωβ · Pajama ροζ · Villa τιρκουάζ'],
  ['🎡 Τροχός γυρίζει', 'Λάμπες χαμηλά, ταινίες αλλάζουν ροζ → μπλε → χρυσό'],
  ['🎡 Αποτέλεσμα Τροχού', 'Κόκκινο'],
  ['🎲 Ζάρι', 'Ταινίες λευκές για λίγα δευτερόλεπτα'],
  ['💼 Deal: προσφορά / τελικό κουτί', 'Χρυσό-πορτοκαλί ένταση· νίκη = όλα χρυσά'],
  ['⛓️ Δοκιμασία', 'Κόκκινο χαμηλό'],
  ['🌙 Νύχτα', 'Σκοτεινό μωβ'],
  ['⏸ Διάλειμμα', 'Ζεστό λευκό χαμηλά'],
  ['👑 Φινάλε', 'Λάμπες χρυσές στο 100%, ταινίες γιορτινές'],
  ['🛑 ΣΤΟΠ', 'Όλα ανάβουν σε δυνατό λευκό φως — πάντα, για ασφάλεια'],
];

export default function AdminLights() {
  const [st, setSt] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('pat');
  const [token, setToken] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [roles, setRoles] = useState({});

  const call = async (method, path, body, ok) => {
    setBusy(true); setMsg('');
    try { const r = await request(method, `/api/lights${path}`, body); if (r?.devices) setSt((s) => ({ ...s, ...r })); if (ok) setMsg(typeof ok === 'function' ? ok(r) : ok); return r; } catch (e) { setMsg(`⚠️ ${e.message}`); return null; } finally { setBusy(false); }
  };
  const load = () => request('GET', '/api/lights/status').then(setSt).catch((e) => setMsg(`⚠️ ${e.message}`));
  useEffect(() => {
    load();
    const q = new URLSearchParams(window.location.search).get('lights');
    if (q) setMsg(q.startsWith('ok:') ? `✅ Μόνιμη σύνδεση έτοιμη · βρέθηκαν ${q.slice(3)} συσκευές.` : `⚠️ ${q}`);
  }, []);
  useEffect(() => { if (st?.devices) setRoles(Object.fromEntries(st.devices.map((d) => [d.id, d.role]))); }, [st?.devices]);

  const code = getActiveSessionCode();
  const tvUrl = `${window.location.origin}/tv${code ? `?code=${encodeURIComponent(code)}` : ''}`;
  const connected = st && st.auth?.type !== 'none' && !st.auth?.expired;
  const hoursLeft = st?.auth?.type === 'pat' ? Math.max(0, Math.round((st.auth.expiresAt - Date.now()) / 3600000)) : null;

  return (
    <div className="space-y-4">
      <div className={card}>
        <div className="text-xl font-bold">💡 Φώτα του σπιτιού · Samsung SmartThings</div>
        <p className="mt-1 text-sm text-white/65">Οι λάμπες και οι LED ταινίες (Tapo κ.ά.) που έχεις στο SmartThings αλλάζουν χρώμα μόνες τους με το παιχνίδι: ήπειρος, Τροχός, ζάρι, Deal, φινάλε. Σε ΣΤΟΠ ανάβουν όλα σε δυνατό λευκό.</p>
        {msg && <div className="mt-3 rounded-xl bg-black/40 p-3 text-sm">{msg}</div>}
        {st && (
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl bg-black/30 p-3 text-sm"><div className="text-white/55">Σύνδεση</div><b>{st.auth.type === 'none' ? '— όχι ακόμα' : st.auth.type === 'pat' ? (st.auth.expired ? '⛔ Token έληξε' : `🟢 Token · λήγει σε ~${hoursLeft} ώρες`) : st.auth.connected ? '🟢 Μόνιμη σύνδεση' : '🟡 Μόνιμη: εκκρεμεί έγκριση'}</b></div>
            <div className="rounded-xl bg-black/30 p-3 text-sm"><div className="text-white/55">Συσκευές</div><b>{st.devices.filter((d) => d.role !== 'off').length} στο παιχνίδι / {st.devices.length}</b></div>
            <div className="rounded-xl bg-black/30 p-3 text-sm"><div className="text-white/55">Τελευταίο</div><b>{st.lastError ? `⚠️ ${st.lastError}` : st.lastOkAt ? `✅ ${new Date(st.lastOkAt).toLocaleTimeString('el-GR')}` : '—'}</b></div>
          </div>
        )}
        {st && (
          <div className="mt-3 space-y-2">
            <label className="flex items-center justify-between gap-3 rounded-xl bg-black/30 px-4 py-3">
              <span><b>Τα φώτα ακολουθούν το παιχνίδι</b><span className="block text-xs text-white/55">Κλειστό = κανείς δεν αγγίζει τα φώτα.</span></span>
              <input type="checkbox" role="switch" className="h-6 w-11 accent-[#ffd23f]" checked={!!st.enabled} disabled={!connected || busy} onChange={(e) => call('POST', '/settings', { enabled: e.target.checked })} />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-xl bg-black/30 px-4 py-3">
              <span><b>Ήπια φώτα</b><span className="block text-xs text-white/55">Χωρίς εναλλαγές χρωμάτων (για όποια ενοχλείται από αλλαγές φωτός). Ακόμα και κανονικά, η πιο γρήγορη αλλαγή είναι κάθε 6″.</span></span>
              <input type="checkbox" role="switch" className="h-6 w-11 accent-[#ffd23f]" checked={!!st.calm} disabled={busy} onChange={(e) => call('POST', '/settings', { calm: e.target.checked })} />
            </label>
          </div>
        )}
      </div>

      <div className={card}>
        <div className="text-lg font-bold">1 · Σύνδεση με SmartThings</div>
        <div className="mt-2 flex gap-2">
          <button type="button" className={`${btn} ${mode === 'pat' ? 'bg-[#ffd23f] text-black' : 'bg-white/10'}`} onClick={() => setMode('pat')}>Γρήγορη (24 ώρες)</button>
          <button type="button" className={`${btn} ${mode === 'oauth' ? 'bg-[#ffd23f] text-black' : 'bg-white/10'}`} onClick={() => setMode('oauth')}>Μόνιμη (για 48/72h)</button>
        </div>
        {mode === 'pat' ? (
          <div className="mt-3 space-y-2 text-sm">
            <p className="text-white/70">Ιδανικό για μία βραδιά. Το SmartThings κάνει αυτά τα tokens να λήγουν σε 24 ώρες, άρα φτιάξ' το <b>το ίδιο απόγευμα</b>.</p>
            <ol className="list-decimal space-y-1 pl-5 text-white/80">
              <li>Άνοιξε <a className="underline" href="https://account.smartthings.com/tokens" target="_blank" rel="noreferrer">account.smartthings.com/tokens</a> και συνδέσου με τον λογαριασμό Samsung.</li>
              <li>«Generate new token», όνομα «Deal of Temptation».</li>
              <li>Τσέκαρε <b>Devices</b>: «List all devices», «See all devices», «Control all devices».</li>
              <li>«Generate token», αντέγραψέ το και επικόλλησέ το εδώ.</li>
            </ol>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Token SmartThings" autoComplete="off" className="min-w-0 flex-1 rounded-xl bg-black/40 px-3 py-2" />
              <button type="button" disabled={busy || token.length < 20} className={`${btn} bg-[#ffd23f] text-black`} onClick={async () => { const r = await call('POST', '/token', { token }, (x) => `✅ Συνδέθηκε · βρέθηκαν ${x.found} φώτα.`); if (r) setToken(''); }}>Σύνδεση & εύρεση φώτων</button>
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-2 text-sm">
            <p className="text-white/70">Μία φορά, για πάντα: η σύνδεση ανανεώνεται μόνη της. Χρειάζεται 10′ σε υπολογιστή.</p>
            <ol className="list-decimal space-y-1 pl-5 text-white/80">
              <li>Εγκατάστησε το <a className="underline" href="https://github.com/SmartThingsCommunity/smartthings-cli#readme" target="_blank" rel="noreferrer">SmartThings CLI</a> και τρέξε <code className="rounded bg-black/50 px-1">smartthings apps:create</code>.</li>
              <li>Διάλεξε <b>OAuth-In App</b>, όνομα «Deal of Temptation», scopes <code className="rounded bg-black/50 px-1">r:devices:* x:devices:* r:locations:*</code>.</li>
              <li>Ως Redirect URI βάλε ακριβώς: <code className="break-all rounded bg-black/50 px-1">{st?.redirectUri || '…'}</code> <button type="button" className="ml-1 underline" onClick={() => navigator.clipboard?.writeText(st?.redirectUri || '')}>αντιγραφή</button></li>
              <li>Επικόλλησε εδώ το OAuth Client Id και Client Secret που σου δίνει, και πάτα «Σύνδεση με Samsung».</li>
            </ol>
            <div className="grid gap-2 sm:grid-cols-2">
              <input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="OAuth Client Id" autoComplete="off" className="rounded-xl bg-black/40 px-3 py-2" />
              <input value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} placeholder="OAuth Client Secret" type="password" autoComplete="off" className="rounded-xl bg-black/40 px-3 py-2" />
            </div>
            <button type="button" disabled={busy || clientId.length < 10 || clientSecret.length < 10} className={`${btn} bg-[#ffd23f] text-black`} onClick={async () => { const r = await call('POST', '/oauth/app', { clientId, clientSecret }); if (r?.url) window.location.href = r.url; }}>Σύνδεση με Samsung →</button>
          </div>
        )}
        {st && st.auth.type !== 'none' && <button type="button" className="mt-3 text-xs text-white/50 underline" onClick={() => { if (window.confirm('Αποσύνδεση SmartThings;')) call('POST', '/disconnect', {}, 'Αποσυνδέθηκε.'); }}>Αποσύνδεση</button>}
      </div>

      <div className={card}>
        <div className="flex items-center justify-between gap-2">
          <div className="text-lg font-bold">2 · Ποιο φως κάνει τι</div>
          <button type="button" disabled={!connected || busy} className={`${btn} bg-white/10`} onClick={() => call('POST', '/discover', {}, (x) => `Βρέθηκαν ${x.found} φώτα.`)}>↻ Ξαναβρές</button>
        </div>
        {!st?.devices?.length ? <p className="mt-2 text-sm text-white/60">Δεν υπάρχουν ακόμα φώτα. Κάνε πρώτα τη σύνδεση.</p> : (
          <div className="mt-3 space-y-2">
            {st.devices.map((d) => (
              <div key={d.id} className="flex flex-col gap-2 rounded-xl bg-black/30 p-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1"><b className="block truncate">{d.label}</b><span className="text-xs text-white/50">{d.caps.includes('colorControl') ? '🎨 χρώμα' : '⚪ χωρίς χρώμα'}{d.caps.includes('switchLevel') ? ' · ένταση' : ''}</span></div>
                <select value={roles[d.id] || d.role} onChange={(e) => setRoles((r) => ({ ...r, [d.id]: e.target.value }))} className="rounded-xl bg-[#2C2C2E] px-3 py-2 text-sm">
                  {Object.entries(ROLE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <button type="button" disabled={busy} className={`${btn} bg-white/10`} onClick={() => call('POST', '/test', { target: d.id }, `Δοκιμή: «${d.label}»`)}>Δοκιμή</button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" disabled={busy} className={`${btn} bg-[#ffd23f] text-black`} onClick={() => call('POST', '/devices', { roles }, '✅ Αποθηκεύτηκε.')}>Αποθήκευση ρόλων</button>
              <button type="button" disabled={busy} className={`${btn} bg-white/10`} onClick={() => call('POST', '/test', { target: 'lamp' }, 'Οι λάμπες γίνονται ροζ.')}>Δοκιμή λάμπες</button>
              <button type="button" disabled={busy} className={`${btn} bg-white/10`} onClick={() => call('POST', '/test', { target: 'strip' }, 'Οι ταινίες γίνονται κυανές.')}>Δοκιμή ταινίες</button>
              <button type="button" disabled={busy} className={`${btn} bg-white/10`} onClick={() => call('POST', '/test', { scene: 'normal' }, 'Κανονικό ζεστό φως.')}>Κανονικό φως</button>
              <button type="button" disabled={busy} className={`${btn} bg-white/10`} onClick={() => call('POST', '/test', { scene: 'off' }, 'Σβήνουν.')}>Σβήσε όλα</button>
            </div>
            <p className="text-xs text-white/45">Οι Tapo περνούν από το cloud: κάθε αλλαγή φτάνει σε 1–3″, και κάθε φως δέχεται εντολή το πολύ κάθε 5″.</p>
          </div>
        )}
      </div>

      <div className={card}>
        <div className="text-lg font-bold">3 · Τι κάνουν τα φώτα στο παιχνίδι</div>
        <div className="mt-2 divide-y divide-white/10 text-sm">
          {SCENES.map(([a, b]) => <div key={a} className="flex gap-3 py-2"><b className="w-48 shrink-0">{a}</b><span className="text-white/70">{b}</span></div>)}
        </div>
      </div>

      <div className={card}>
        <div className="text-lg font-bold">📺 Η TV σε Samsung Smart TV</div>
        <p className="mt-1 text-sm text-white/65">Η οθόνη της TV είναι μια σελίδα. Τρεις τρόποι να μπει στη Samsung, από τον πιο σταθερό:</p>
        <div className="mt-3 rounded-xl bg-black/30 p-3 text-sm">
          <b>Σύνδεσμος TV{code ? ` (βραδιά ${code})` : ''}:</b>
          <div className="mt-1 flex items-center gap-2"><code className="min-w-0 flex-1 break-all rounded bg-black/50 px-2 py-1">{tvUrl}</code><button type="button" className={`${btn} bg-white/10`} onClick={() => navigator.clipboard?.writeText(tvUrl)}>Αντιγραφή</button></div>
        </div>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-white/80">
          <li><b>Browser της TV (πιο σταθερό):</b> Samsung TV → εφαρμογή «Internet» → γράψε τον σύνδεσμο → αγαπημένα. Πάτα μία φορά οπουδήποτε στην οθόνη για να ξεκλειδώσει ο ήχος.</li>
          <li><b>Google Cast:</b> αν η TV σου (2023–2025) πήρε την αναβάθμιση One UI Tizen με Google Cast, άνοιξε τον σύνδεσμο σε Chrome (υπολογιστή ή Android) → ⋮ → «Μετάδοση…» → η Samsung σου. Ή από το Tablet: «📺 Στείλε στην TV».</li>
          <li><b>Smart View από Galaxy:</b> άνοιξε τον σύνδεσμο στο κινητό/tablet, οριζόντια, και κάνε Smart View στην TV (καθρέφτισμα).</li>
        </ol>
      </div>
    </div>
  );
}
