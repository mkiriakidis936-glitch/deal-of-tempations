import React, { useEffect, useMemo, useRef, useState } from 'react';
import { appApi } from '@/api/apiClient';
import { uploadMedia, getMediaStorage } from '@/lib/media';
import { playSoundFile } from '@/lib/gameSounds';
import { sfx, tvSfx } from '@/lib/modeKit';
import { IMAGE_ACCEPT, VIDEO_ACCEPT, MEDIA_ACCEPT, mediaKindOf } from '@/lib/mediaKind';
import { slug, stripPrefix } from '@/lib/autoLink';
import { filesFromZip, skipPath, baseName } from '@/lib/bundleImport';
import { PHOTO_SPOT_IDS } from '@/data/mediaSlots';
import { CONTENT_CATEGORIES } from '@/components/admin/content/contentSchemas';
import { COLLECTIONS, fetchModesRecord, modeOfCollection } from '@/lib/modesContentStore';
import {
  buildMediaManifest, manifestSummary, manifestText, needsAttention,
  SURFACE_LABELS, SURFACE_ORDER, NEED_LABELS, STATUS_LABELS,
} from '@/lib/mediaManifest';

// Admin → Φωτογραφίες & βίντεο → 🧭 Χάρτης & έλεγχος
// ΟΛΕΣ οι θέσεις media: τι όνομα θέλει το αρχείο, πού εμφανίζεται, αν υπάρχει ή λείπει.
// Ανέβασμα απευθείας σε κάθε θέση, αυτόματη σύνδεση από τη βιβλιοθήκη και TXT με όλα τα ονόματα.

const STATUS_TONE = {
  ok: 'bg-[#30D158]/15 text-[#7BE495]',
  default: 'bg-[#64D2FF]/15 text-[#9BE2FF]',
  missing: 'bg-[#FF453A]/15 text-[#FF8A80]',
  broken: 'bg-[#FF9F0A]/20 text-[#FFC266]',
  inactive: 'bg-white/5 text-white/40',
};
const NEED_TONE = { required: 'text-[#FF8A80]', recommended: 'text-[#F7E3A8]', optional: 'text-white/55', inactive: 'text-white/35' };

// Γράφει ένα url (ή '' για αφαίρεση) στη σωστή θέση των ρυθμίσεων media.
export function setEntryValue(ov, entry, url) {
  const next = { ...ov };
  if (entry.group === 'scenes') {
    const map = { ...(ov.sceneLibrary || {}) };
    const id = entry.id.slice(6);
    if (url) map[id] = url; else delete map[id];
    next.sceneLibrary = map;
  } else if (entry.group === 'sounds') {
    const map = { ...(ov.gameSounds || {}) };
    const id = entry.id.slice(6);
    if (url) map[id] = url; else delete map[id];
    next.gameSounds = map;
  } else if (entry.modeId) {
    const modeMedia = { ...(ov.modeMedia || {}) };
    const saved = { ...(modeMedia[entry.modeId] || {}) };
    const field = entry.field;
    if (field.startsWith('section:')) {
      const id = field.slice(8);
      const sections = [...(Array.isArray(saved.sections) ? saved.sections : [])];
      const at = sections.findIndex((item) => item?.id === id);
      if (at === -1) sections.push({ id, image: url }); else sections[at] = { ...sections[at], image: url };
      saved.sections = sections;
    } else if (field.startsWith('gallery:')) {
      const gallery = Array.from({ length: 6 }, (_, i) => saved.gallery?.[i] || '');
      gallery[Number(field.slice(8))] = url;
      saved.gallery = gallery;
    } else {
      saved[field] = url;
      if (field === 'cover') saved.coverCleared = !url;
    }
    modeMedia[entry.modeId] = saved;
    next.modeMedia = modeMedia;
  } else {
    // Σταθερές θέσεις (Site, φόρμες, Promo, TV)
    next[entry.id] = url || undefined;
    const empty = new Set(ov.emptySlots || []);
    if (url) empty.delete(entry.id);
    else if (PHOTO_SPOT_IDS.includes(entry.id)) empty.add(entry.id);
    next.emptySlots = [...empty];
  }
  return next;
}

const acceptFor = (entry) => entry.kind === 'video' ? VIDEO_ACCEPT : entry.kind === 'audio' ? 'audio/*,.mp3,.wav,.ogg,.m4a,.aac' : entry.kind === 'image/video' ? `${IMAGE_ACCEPT},${VIDEO_ACCEPT}` : IMAGE_ACCEPT;
const kindMatches = (entry, fileKind) => entry.kind === 'video' ? fileKind === 'video'
  : entry.kind === 'audio' ? fileKind === 'audio'
    : entry.kind === 'image/video' ? ['image', 'graphic', 'video'].includes(fileKind)
      : ['image', 'graphic'].includes(fileKind);
const keyOf = (filename) => slug(String(filename).replace(/\.[a-z0-9]+$/i, ''));

function download(name, text) {
  const blob = new Blob([`﻿${text}`], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function AdminMediaMap({ ov = {}, library = [], onSave, onRefresh, busy: parentBusy = false }) {
  const [surface, setSurface] = useState('all');
  const [status, setStatus] = useState('attention');
  const [group, setGroup] = useState('all');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);
  const [cardStats, setCardStats] = useState([]);
  const input = useRef(null);
  const target = useRef(null);
  const bundleInput = useRef(null);
  const folderInput = useRef(null);
  const [report, setReport] = useState('');

  const entries = useMemo(() => buildMediaManifest(ov, library), [ov, library]);
  const sum = useMemo(() => manifestSummary(entries), [entries]);
  const groups = useMemo(() => {
    const out = [];
    for (const e of entries) if (!out.some((g) => g.id === e.group)) out.push({ id: e.group, label: e.groupLabel });
    return out;
  }, [entries]);

  // Εικόνες καρτών (προαιρετικές): πόσες κάρτες έχουν εικόνα, ανά λίστα.
  useEffect(() => {
    let live = true;
    (async () => {
      const stats = [];
      const imageCats = CONTENT_CATEGORIES.filter((c) => c.fields?.some((f) => f.type === 'image'));
      for (const cat of imageCats) {
        try {
          const { items } = await appApi.entities.GameContent.filter({ category: cat.id }, { limit: 500 });
          stats.push({ label: `Classic / Arrest & Heist · ${cat.label}`, total: (items || []).length, withImage: (items || []).filter((r) => r.data?.image).length, surfaces: 'Tablet, κινητό, TV ανάκρισης' });
        } catch { /* χωρίς δικαίωμα / εκτός σύνδεσης */ }
      }
      try {
        const saved = (await fetchModesRecord())?.value || {};
        for (const col of COLLECTIONS.filter((c) => modeOfCollection(c) !== 'retired' && c.fields?.some((f) => f.type === 'image'))) {
          const list = Array.isArray(saved[col.id]) ? saved[col.id] : col.arr;
          stats.push({ label: `${col.group} · ${col.label}`, total: list.length, withImage: list.filter((x) => x?.image).length, surfaces: 'TV, Tablet, κινητό' });
        }
      } catch { /* αγνόησε */ }
      if (live) setCardStats(stats);
    })();
    return () => { live = false; };
  }, []);

  const shown = entries.filter((e) => {
    if (surface !== 'all' && !e.surfaces.includes(surface)) return false;
    if (group !== 'all' && e.group !== group) return false;
    if (status === 'attention' && !needsAttention(e)) return false;
    if (status === 'missing' && !(e.status === 'missing' && e.need !== 'inactive')) return false;
    if (status === 'ok' && !['ok', 'default'].includes(e.status)) return false;
    if (status === 'live' && e.need === 'inactive') return false;
    const needle = q.trim().toLowerCase();
    if (needle && !`${e.label} ${e.filename} ${e.groupLabel} ${e.where}`.toLowerCase().includes(needle)) return false;
    return true;
  });

  const run = async (id, fn, ok) => {
    setBusy(id); setMsg(null);
    try { await fn(); if (ok) setMsg({ ok: true, text: ok }); }
    catch (e) { setMsg({ ok: false, text: e.message || 'Απέτυχε.' }); }
    finally { setBusy(''); }
  };

  const pick = (entry) => { target.current = entry; if (input.current) { input.current.accept = acceptFor(entry); input.current.click(); } };
  const onFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    const entry = target.current;
    if (!file || !entry) return;
    run(entry.id, async () => {
      const uploaded = await uploadMedia(file);
      if (!uploaded?.url) throw new Error('Ο server δεν επέστρεψε σύνδεσμο.');
      if (!kindMatches(entry, mediaKindOf(uploaded.url))) throw new Error(`Λάθος τύπος αρχείου για «${entry.label}».`);
      await onSave(setEntryValue(ov, entry, uploaded.url));
      await onRefresh?.();
    }, `Ανέβηκε στη θέση «${entry.label}» ✓`);
  };
  const clear = (entry) => {
    if (!window.confirm(`Αφαίρεση του αρχείου από τη θέση «${entry.label}»; (Το αρχείο μένει στη βιβλιοθήκη.)`)) return;
    run(entry.id, () => onSave(setEntryValue(ov, entry, '')), 'Η θέση άδειασε ✓');
  };

  // Αυτόματη σύνδεση: κάθε αρχείο της βιβλιοθήκης με όνομα ίδιο με μιας θέσης μπαίνει εκεί (μόνο σε κενές θέσεις).
  const autoLink = (overwrite = false) => run('autolink', async () => {
    const byKey = new Map();
    for (const f of library) {
      const k = stripPrefix(f.name);
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k).push(f);
    }
    let next = ov; let linked = 0; let skipped = 0;
    for (const e of entries) {
      const hits = [e.filename, ...(e.aliases || [])].flatMap((name) => byKey.get(keyOf(name)) || []).filter((f) => kindMatches(e, f.kind));
      if (!hits.length) continue;
      if (!overwrite && (e.status === 'ok')) { skipped += 1; continue; }
      const newest = [...hits].sort((a, b) => (b.modified || 0) - (a.modified || 0))[0];
      next = setEntryValue(next, e, newest.url);
      linked += 1;
    }
    if (!linked) throw new Error(skipped ? `Βρέθηκαν ${skipped} αρχεία, αλλά οι θέσεις τους είναι ήδη γεμάτες.` : 'Δεν βρέθηκε αρχείο με όνομα θέσης. Ονόμασε τα αρχεία όπως στο TXT και ανέβασέ τα στη Βιβλιοθήκη.');
    await onSave(next);
    setMsg({ ok: true, text: `Αυτόματη σύνδεση: ${linked} αρχεία μπήκαν στη θέση τους ✓${skipped ? ` (${skipped} θέσεις ήταν ήδη γεμάτες και δεν άλλαξαν)` : ''}` });
  });

  // 📦 Εισαγωγή πακέτου: ZIP ή φάκελος → ανεβαίνουν μόνο τα αρχεία με όνομα θέσης και μπαίνουν κατευθείαν στη θέση τους.
  const importBundle = (fileList, overwrite = false) => run('bundle', async () => {
    const want = new Map();
    for (const e of entries) for (const n of [e.filename, ...(e.aliases || [])]) {
      if (!n) continue;
      const k = keyOf(n);
      if (!want.has(k)) want.set(k, []);
      want.get(k).push(e);
    }
    const isWanted = (path) => want.has(keyOf(baseName(path)));
    const files = []; const unmatched = [];
    for (const f of Array.from(fileList || [])) {
      const path = f.webkitRelativePath || f.name;
      if (skipPath(path)) continue;
      if (/\.zip$/i.test(f.name)) {
        setMsg({ ok: true, text: `Άνοιγμα ZIP «${f.name}»…` });
        files.push(...await filesFromZip(f, isWanted));
      } else if (isWanted(path)) files.push(f);
      else if (mediaKindOf(f.name)) unmatched.push(f.name);
    }
    const seen = new Set(); const unique = files.filter((f) => { const k = keyOf(f.name); if (seen.has(k)) return false; seen.add(k); return true; });
    if (!unique.length) throw new Error('Δεν βρέθηκε κανένα αρχείο με όνομα θέσης. Έλεγξε ότι τα αρχεία έχουν τα ονόματα του TXT.');
    let next = ov; const linked = []; const full = []; const failed = [];
    for (let i = 0; i < unique.length; i += 1) {
      const f = unique[i];
      setMsg({ ok: true, text: `Ανέβασμα ${i + 1}/${unique.length}: ${f.name}` });
      const targets = (want.get(keyOf(f.name)) || []).filter((e) => kindMatches(e, mediaKindOf(f.name)) && (overwrite || !['ok', 'default'].includes(e.status)));
      if (!targets.length) { full.push(f.name); continue; }
      try {
        const up = await uploadMedia(f);
        if (!up?.url) throw new Error('χωρίς σύνδεσμο');
        for (const e of targets) { next = setEntryValue(next, e, up.url); linked.push(`${f.name} → ${e.groupLabel} · ${e.label}`); }
      } catch (err) { failed.push(`${f.name}: ${err.message || err}`); }
      if ((i + 1) % 25 === 0) await onSave(next);
    }
    await onSave(next);
    await onRefresh?.();
    const still = buildMediaManifest(next, library).filter((e) => e.need !== 'inactive' && e.status === 'missing' && e.need !== 'optional');
    const text = [
      `ΕΙΣΑΓΩΓΗ ΠΑΚΕΤΟΥ — ${new Date().toLocaleString('el-GR')}`,
      `\n✓ ΜΠΗΚΑΝ (${linked.length})`, ...linked,
      `\n◐ ΗΔΗ ΓΕΜΑΤΕΣ — δεν άλλαξαν (${full.length})`, ...full,
      `\n✕ ΑΠΕΤΥΧΑΝ (${failed.length})`, ...failed,
      `\n? ΑΡΧΕΙΑ ΧΩΡΙΣ ΘΕΣΗ (${unmatched.length})`, ...unmatched,
      `\n⚠ ΛΕΙΠΟΥΝ ΑΚΟΜΑ — υποχρεωτικά & προτεινόμενα (${still.length})`, ...still.map((e) => `${e.filename} — ${e.groupLabel} · ${e.label}`),
    ].join('\n');
    setReport(text);
    setMsg({ ok: !failed.length, text: `📦 Εισαγωγή: ${linked.length} θέσεις γέμισαν · ${full.length} ήταν ήδη γεμάτες · ${failed.length} απέτυχαν · λείπουν ακόμα ${still.length}.` });
  });

  const stamp = new Date().toISOString().slice(0, 10);
  const exportAll = () => download(`deal-of-temptation-media-${stamp}.txt`, manifestText(entries, { cardStats }));
  const exportMissing = () => download(`deal-of-temptation-media-leipoun-${stamp}.txt`, manifestText(entries.filter((e) => e.need !== 'inactive' && ['missing', 'broken'].includes(e.status)), {}));
  const copyName = async (name) => { try { await navigator.clipboard.writeText(name); setMsg({ ok: true, text: `Αντιγράφηκε: ${name}` }); } catch { window.prompt('Όνομα αρχείου:', name); } };

  const disabled = !!busy || parentBusy;
  const Tile = ({ label, value, tone = '' }) => (
    <div className="rounded-2xl bg-black/30 px-3 py-2.5"><div className="text-[11px] text-white/55">{label}</div><div className={`text-2xl font-bold ${tone}`}>{value}</div></div>
  );

  return (
    <div className="space-y-3 text-[#F5F1E8]">
      <input ref={input} type="file" accept={MEDIA_ACCEPT} hidden onChange={onFile} />
      <section className="space-y-3 rounded-3xl border border-[#E8C26B]/30 bg-[#17140C] p-4 sm:p-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#E8C26B]">Χάρτης media</div>
          <h2 className="mt-1 text-xl font-bold sm:text-2xl">Τι ανεβάζω, με ποιο όνομα και πού εμφανίζεται</h2>
          <p className="mt-1 text-xs text-white/60">Κάθε θέση φωτογραφίας, βίντεο και ήχου της εφαρμογής. Πάτα «Ανέβασμα» για να μπει ένα αρχείο κατευθείαν στη θέση του, ή κατέβασε το TXT, ονόμασε τα αρχεία, ανέβασέ τα όλα στη Βιβλιοθήκη και πάτα «Αυτόματη σύνδεση».</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Tile label="Θέσεις σε χρήση" value={sum.total} />
          <Tile label="✓ Ανέβηκαν" value={sum.ok} tone="text-[#7BE495]" />
          <Tile label="◐ Ενσωματωμένη" value={sum.defaults} tone="text-[#9BE2FF]" />
          <Tile label="✕ Λείπουν υποχρεωτικά" value={sum.missingRequired} tone={sum.missingRequired ? 'text-[#FF8A80]' : 'text-[#7BE495]'} />
          <Tile label="Λείπουν προτεινόμενα" value={sum.missingRecommended} tone={sum.missingRecommended ? 'text-[#F7E3A8]' : 'text-[#7BE495]'} />
          <Tile label="⚠ Σβήστηκαν" value={sum.broken} tone={sum.broken ? 'text-[#FFC266]' : 'text-[#7BE495]'} />
          {(() => {
            const st = getMediaStorage();
            if (!st?.total) return null;
            const mb = (b) => `${Math.round(b / 1048576)}MB`;
            const low = st.free < 300 * 1048576;
            return <Tile label={`💾 Ελεύθερος χώρος (αρχεία ${mb(st.used)})`} value={mb(st.free)} tone={low ? 'text-[#FF8A80]' : 'text-[#7BE495]'} />;
          })()}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={disabled} onClick={() => autoLink(false)} className="h-10 rounded-full bg-[#E8C26B] px-4 text-sm font-bold text-black disabled:opacity-50">{busy === 'autolink' ? 'Σύνδεση…' : '🔗 Αυτόματη σύνδεση (κενές θέσεις)'}</button>
          <button type="button" disabled={disabled} onClick={() => { if (window.confirm('Να αντικατασταθούν και οι ήδη γεμάτες θέσεις με τα αρχεία της βιβλιοθήκης που έχουν το σωστό όνομα;')) autoLink(true); }} className="h-10 rounded-full bg-[#2C2C2E] px-4 text-sm font-semibold disabled:opacity-50">🔁 Σύνδεση με αντικατάσταση</button>
          <button type="button" disabled={disabled} onClick={() => bundleInput.current?.click()} className="h-10 rounded-full bg-[#E8C26B] px-4 text-sm font-bold text-black disabled:opacity-50">{busy === 'bundle' ? 'Εισαγωγή…' : '📦 Εισαγωγή ZIP / αρχείων'}</button>
          <button type="button" disabled={disabled} onClick={() => folderInput.current?.click()} className="h-10 rounded-full bg-[#2C2C2E] px-4 text-sm font-semibold disabled:opacity-50">📁 Εισαγωγή φακέλου</button>
          <input ref={bundleInput} type="file" multiple accept={`.zip,application/zip,${MEDIA_ACCEPT}`} className="hidden" onChange={(e) => { const list = Array.from(e.target.files || []); e.target.value = ''; if (list.length) importBundle(list); }} />
          <input ref={folderInput} type="file" multiple webkitdirectory="" className="hidden" onChange={(e) => { const list = Array.from(e.target.files || []); e.target.value = ''; if (list.length) importBundle(list); }} />
          {report && <button type="button" onClick={() => download(`deal-of-temptation-eisagogi-${new Date().toISOString().slice(0, 10)}.txt`, report)} className="h-10 rounded-full bg-[#2C2C2E] px-4 text-sm font-semibold">⬇ Αναφορά εισαγωγής</button>}
          <button type="button" onClick={exportAll} className="h-10 rounded-full bg-[#2C2C2E] px-4 text-sm font-semibold">⬇ TXT — όλα τα ονόματα</button>
          <button type="button" onClick={exportMissing} className="h-10 rounded-full bg-[#2C2C2E] px-4 text-sm font-semibold">⬇ TXT — μόνο όσα λείπουν</button>
        </div>
        {msg && <div role="status" className={`rounded-2xl px-3 py-2 text-sm ${msg.ok ? 'bg-[#30D158]/10 text-[#7BE495]' : 'bg-[#FF453A]/10 text-[#FF8A80]'}`}>{msg.text}</div>}
      </section>

      <section className="space-y-2 rounded-3xl bg-[#1C1C1E] p-3 sm:p-4">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Οθόνη">
          {[['all', 'Όλες οι οθόνες'], ...SURFACE_ORDER.map((id) => [id, SURFACE_LABELS[id]])].map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={surface === id} onClick={() => setSurface(id)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${surface === id ? 'bg-white text-black' : 'bg-black/40 text-white/75'}`}>{label}</button>
          ))}
        </div>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Ομάδα">
          {[{ id: 'all', label: 'Όλα' }, ...groups].map((g) => {
            const live = entries.filter((e) => e.need !== 'inactive' && (g.id === 'all' || e.group === g.id));
            const done = live.filter((e) => ['ok', 'default'].includes(e.status)).length;
            return (
              <button key={g.id} type="button" role="tab" aria-selected={group === g.id} onClick={() => setGroup(g.id)}
                className={`shrink-0 rounded-2xl px-3.5 py-2 text-left ${group === g.id ? 'bg-[#E8C26B] text-black' : 'bg-black/40 text-white/80'}`}>
                <div className="text-[13px] font-semibold">{g.label}</div>
                <div className={`text-[11px] ${group === g.id ? 'text-black/70' : 'text-white/45'}`}>{done}/{live.length} έτοιμα</div>
              </button>
            );
          })}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Κατάσταση" className="h-10 rounded-xl border border-white/10 bg-[#2C2C2E] px-3 text-sm">
            <option value="attention">Χρειάζονται προσοχή (λείπουν / σβήστηκαν)</option>
            <option value="missing">Όλα όσα λείπουν (και προαιρετικά)</option>
            <option value="ok">Όσα υπάρχουν</option>
            <option value="live">Όλες οι θέσεις σε χρήση</option>
            <option value="all">Όλα (και όσα δεν εμφανίζονται πουθενά)</option>
          </select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Αναζήτηση (όνομα, θέση…)" className="h-10 rounded-xl border border-white/10 bg-[#2C2C2E] px-3 text-sm" />
        </div>
        <div className="text-xs text-white/55">{shown.length} θέσεις{status === 'attention' && shown.length === 0 ? ' — 🎉 δεν λείπει τίποτα που χρειάζεται εδώ.' : ''}</div>
      </section>

      {groups.filter((g) => shown.some((e) => e.group === g.id)).map((g) => (
        <section key={g.id} className="overflow-hidden rounded-3xl bg-[#1C1C1E]">
          <div className="border-b border-white/10 px-4 py-3 text-base font-bold">{g.label} <span className="text-sm font-normal text-white/50">· {shown.filter((e) => e.group === g.id).length}</span></div>
          <ul className="divide-y divide-white/10">
            {shown.filter((e) => e.group === g.id).map((e) => {
              const kind = mediaKindOf(e.url);
              return (
                <li key={e.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-black">
                    {e.url && kind === 'video' && <video src={`${e.url}#t=0.1`} muted playsInline preload="metadata" className="h-full w-full object-cover" />}
                    {e.url && kind === 'audio' && <div className="flex h-full items-center justify-center text-2xl">🎵</div>}
                    {e.url && kind !== 'video' && kind !== 'audio' && <img src={e.url} alt="" loading="lazy" onError={(ev) => { ev.currentTarget.style.display = 'none'; }} className="h-full w-full object-cover" />}
                    {!e.url && <div className="flex h-full items-center justify-center text-xs text-white/30">{e.kind === 'video' ? '🎬' : e.kind === 'audio' ? '🎵' : '🖼️'}</div>}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{e.label}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_TONE[e.status]}`}>{STATUS_LABELS[e.status]}</span>
                      <span className={`text-[11px] font-semibold ${NEED_TONE[e.need]}`}>{NEED_LABELS[e.need]}</span>
                    </div>
                    <button type="button" onClick={() => copyName(e.filename)} title="Αντιγραφή ονόματος" className="max-w-full truncate rounded-md bg-black/40 px-2 py-0.5 text-left font-mono text-[12px] text-[#E8C26B]">{e.filename}</button>
                    <div className="flex flex-wrap gap-1">{e.surfaces.map((s) => <span key={s} className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/75">{SURFACE_LABELS[s]}</span>)}</div>
                    <div className="text-[12px] text-white/55">{e.where}</div>
                  </div>
                  {e.need !== 'inactive' && (
                    <div className="flex shrink-0 gap-1.5">
                      {e.group === 'sounds' && <button type="button" aria-label={`Ακρόαση: ${e.label}`} onClick={() => { const id = e.id.slice(6); if (e.url) { try { playSoundFile(e.url); } catch { /* χωρίς ήχο */ } } else { const [g, n] = id.split('.'); (g === 'tv' ? tvSfx : sfx)[n]?.(); } }} className="h-9 w-9 rounded-full bg-[#2C2C2E] text-sm">▶</button>}
                      <button type="button" disabled={disabled} onClick={() => pick(e)} className="h-9 rounded-full bg-[#E8C26B] px-3.5 text-xs font-bold text-black disabled:opacity-50">{busy === e.id ? 'Ανέβασμα…' : e.url && e.status !== 'default' ? 'Αλλαγή' : 'Ανέβασμα'}</button>
                      {e.url && e.status !== 'default' && <button type="button" disabled={disabled} onClick={() => clear(e)} className="h-9 rounded-full bg-[#2C2C2E] px-3 text-xs text-white/70 disabled:opacity-50">Αφαίρεση</button>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {cardStats.length > 0 && (
        <section className="rounded-3xl bg-[#1C1C1E] p-4">
          <div className="text-base font-bold">🃏 Εικόνες καρτών <span className="text-sm font-normal text-white/50">· προαιρετικές</span></div>
          <p className="mt-1 text-xs text-white/55">Ανεβαίνουν απευθείας σε κάθε κάρτα: Admin → Κάρτες & περιεχόμενο. Χωρίς εικόνα η κάρτα δείχνει το εικονίδιό της.</p>
          <ul className="mt-2 space-y-1 text-sm">
            {cardStats.map((c) => <li key={c.label} className="flex justify-between gap-3 rounded-xl bg-black/30 px-3 py-2"><span className="min-w-0 truncate">{c.label}</span><span className="shrink-0 font-semibold">{c.withImage}/{c.total}</span></li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
