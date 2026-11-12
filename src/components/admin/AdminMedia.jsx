import React, { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { DEFAULTS } from '@/data/brandArt';
import { IMAGE_SLOTS, VIDEO_SPOTS, GALLERIES } from '@/data/mediaSlots';
import { MEDIA_KEY, fetchOverrides, uploadMedia, listMedia, deleteMedia } from '@/lib/media';

const IMG_ACCEPT = 'image/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.heic';
const VID_ACCEPT = 'video/*,.mp4,.webm,.mov';
const mb = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

function Thumb({ src, video, className = '' }) {
  if (!src) return <div className={`bg-black/40 ${className}`} />;
  return video
    ? <video src={src} controls muted playsInline preload="metadata" className={`bg-black object-cover ${className}`} />
    : <img src={src} alt="" loading="lazy" className={`object-cover ${className}`} />;
}

export default function AdminMedia() {
  const [rec, setRec] = useState(null);
  const [ov, setOv] = useState({});
  const [library, setLibrary] = useState([]);
  const [libraryFilter, setLibraryFilter] = useState('all');
  const LIBRARY_CATEGORIES = [
    { id: 'heist', label: 'Heist' },
    { id: 'pajama', label: 'Pajama' },
    { id: 'branding', label: 'Branding' },
    { id: 'uncategorized', label: 'Χωρίς κατηγορία' },
  ];
  const categoryOf = (url) => ov.libraryCategories?.[url] || 'uncategorized';
  const [busy, setBusy] = useState(null);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState(null);
  const target = useRef(null);
  const imgOne = useRef(null);
  const imgMany = useRef(null);
  const vidOne = useRef(null);
  const vidMany = useRef(null);

  const refreshLibrary = useCallback(async () => {
    try { setLibrary(await listMedia()); } catch (e) { setMsg({ ok: false, text: e.message }); }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetchOverrides();
        setRec(r);
        setOv(r?.value || {});
      } catch (e) { setMsg({ ok: false, text: 'Δεν φορτώθηκαν οι ρυθμίσεις.' }); }
      refreshLibrary();
    })();
  }, [refreshLibrary]);

  const save = async (next) => {
    const clean = Object.fromEntries(Object.entries(next).filter(([, v]) => (Array.isArray(v) ? v.length : v)));
    if (rec?.id) await base44.entities.AppSetting.update(rec.id, { value: clean });
    else setRec(await base44.entities.AppSetting.create({ key: MEDIA_KEY, value: clean }));
    setOv(clean);
  };

  const run = async (id, fn, okText = 'Αποθηκεύτηκε ✓') => {
    setBusy(id); setMsg(null);
    try { await fn(); setMsg({ ok: true, text: okText }); }
    catch (e) { setMsg({ ok: false, text: e.message }); }
    finally { setBusy(null); setProgress(0); }
  };

  // mode: 'slot' (αντικατάσταση σημείου) | 'add' (προσθήκη σε λίστα) | 'replace' (αντικατάσταση στοιχείου λίστας)
  const pick = (id, mode, ref, index) => { target.current = { id, mode, index }; ref.current?.click(); };

  const onFiles = async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    const t = target.current;
    if (!files.length || !t) return;
    await run(t.id, async () => {
      const urls = [];
      for (let i = 0; i < files.length; i++) {
        const r = await uploadMedia(files[i], (p) => setProgress((i + p) / files.length));
        urls.push(r.url);
      }
      if (t.mode === 'slot') await save({ ...ov, [t.id]: urls[0] });
      else if (t.mode === 'replace') {
        const l = [...(ov[t.id] || DEFAULTS[t.id] || [])];
        l[t.index] = urls[0];
        await save({ ...ov, [t.id]: l });
      } else {
        const categories = { ...(ov.libraryCategories || {}) };
        if (t.id === 'heistPhotos' || t.id === 'pajamaPhotos') {
          for (const url of urls) categories[url] = t.id === 'heistPhotos' ? 'heist' : 'pajama';
        }
        await save({ ...ov, [t.id]: [...(ov[t.id] || DEFAULTS[t.id] || []), ...urls], libraryCategories: categories });
      }
      refreshLibrary();
    }, 'Ανέβηκε και αποθηκεύτηκε ✓');
  };

  const reset = (id) => run(id, () => { const { [id]: _, ...rest } = ov; return save(rest); }, 'Επαναφορά στο αρχικό ✓');
  const listOf = (id) => ov[id] || DEFAULTS[id] || [];
  const setList = (id, list) => run(id, () => save({ ...ov, [id]: list }));
  const move = (id, i, d) => {
    const l = [...listOf(id)]; const j = i + d;
    if (j < 0 || j >= l.length) return;
    [l[i], l[j]] = [l[j], l[i]];
    setList(id, l);
  };
  const remove = (id, i) => setList(id, listOf(id).filter((_, k) => k !== i));

  const isUsed = (url) => Object.entries(ov).some(([k, v]) => k !== 'libraryCategories' && (Array.isArray(v) ? v.includes(url) : v === url));
  const setLibraryCategory = (url, category) => run(`category-${url}`, () => save({ ...ov, libraryCategories: { ...(ov.libraryCategories || {}), [url]: category } }), 'Η κατηγορία αποθηκεύτηκε ✓');
  const assignLibraryImageToSlot = (url, slotId) => run(`slot-${url}`, async () => {
    await save({ ...ov, [slotId]: url, libraryCategories: { ...(ov.libraryCategories || {}), [url]: 'branding' } });
  }, 'Η εικόνα ανατέθηκε στο σημείο ✓');
  const addLibraryImageToGallery = (url, galleryId) => run(`assign-${url}`, async () => {
    const current = [...(ov[galleryId] || DEFAULTS[galleryId] || [])];
    if (!current.includes(url)) current.push(url);
    const category = galleryId === 'heistPhotos' ? 'heist' : 'pajama';
    await save({ ...ov, [galleryId]: current, libraryCategories: { ...(ov.libraryCategories || {}), [url]: category } });
  }, 'Η εικόνα προστέθηκε στη γκαλερί ✓');
  const removeFile = (f) => {
    const used = isUsed(f.url);
    const q = used ? `Το «${f.name}» χρησιμοποιείται κάπου. Θα αφαιρεθεί από εκεί (θα επανέλθει το αρχικό) και θα διαγραφεί οριστικά. Συνέχεια;` : `Διαγραφή του «${f.name}» οριστικά;`;
    if (!window.confirm(q)) return;
    run(f.name, async () => {
      if (used) {
        const next = {};
        for (const [k, v] of Object.entries(ov)) {
          if (k === 'libraryCategories') {
            const categories = { ...v };
            delete categories[f.url];
            next[k] = categories;
          } else if (Array.isArray(v)) next[k] = v.filter((u) => u !== f.url);
          else if (v !== f.url) next[k] = v;
        }
        await save(next);
      }
      await deleteMedia(f.name);
      await refreshLibrary();
    }, 'Διαγράφηκε ✓');
  };

  const Progress = ({ id }) => busy === id ? (
    <div className="h-2 rounded bg-black/40 overflow-hidden mt-2">
      <div className="h-full bg-primary transition-all" style={{ width: `${Math.max(5, progress * 100)}%` }} />
    </div>
  ) : null;

  return (
    <div className="space-y-3">
      <input ref={imgOne} type="file" accept={IMG_ACCEPT} hidden onChange={onFiles} />
      <input ref={imgMany} type="file" accept={IMG_ACCEPT} multiple hidden onChange={onFiles} />
      <input ref={vidOne} type="file" accept={VID_ACCEPT} hidden onChange={onFiles} />
      <input ref={vidMany} type="file" accept={VID_ACCEPT} multiple hidden onChange={onFiles} />

      <ComicPanel className="bg-card">
        <div className="font-heading text-xl text-primary">🖼️ ΦΩΤΟΓΡΑΦΙΕΣ & ΒΙΝΤΕΟ</div>
        <p className="text-xs font-body text-foreground/70 mt-1">
          Ανέβασε, άλλαξε ή σβήσε ό,τι θες. Τις ίδιες αλλαγές μπορείς να τις κάνεις και απευθείας πάνω στις σελίδες (✏️ κάτω αριστερά, όταν είσαι συνδεδεμένη/ος).
          Οι φωτογραφίες μικραίνουν αυτόματα. Για βίντεο προτίμησε MP4 (H.264).
        </p>
        {msg && <div className={`mt-2 text-sm font-bold ${msg.ok ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</div>}
      </ComicPanel>

      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg">🎬 ΒΙΝΤΕΟ ΑΝΑ ΣΗΜΕΙΟ</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {VIDEO_SPOTS.map((s) => (
            <div key={s.id} className="border-2 border-border/40 rounded-lg p-2 bg-secondary/40">
              <Thumb video src={ov[s.id] || (s.id === 'agent' ? DEFAULTS.agent : '')} className="w-full aspect-video rounded" />
              <div className="font-bold text-sm mt-2">{s.label}</div>
              <div className="text-[11px] text-foreground/60">{s.where}</div>
              {s.id !== 'agent' && !ov[s.id] && <div className="text-[11px] text-primary/80">Χρησιμοποιεί το κεντρικό βίντεο</div>}
              <div className="flex gap-2 mt-2">
                <ComicButton size="sm" disabled={!!busy} onClick={() => pick(s.id, 'slot', vidOne)}>⬆️ Ανέβασμα</ComicButton>
                {ov[s.id] && <ComicButton size="sm" variant="dark" disabled={!!busy} onClick={() => reset(s.id)}>↩︎ Αρχικό</ComicButton>}
              </div>
              <Progress id={s.id} />
            </div>
          ))}
        </div>
      </ComicPanel>

      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg">🖼️ ΕΙΚΟΝΕΣ ΑΝΑ ΣΗΜΕΙΟ</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {IMAGE_SLOTS.map((s) => (
            <div key={s.id} className="border-2 border-border/40 rounded-lg p-2 bg-secondary/40">
              <Thumb src={ov[s.id] || DEFAULTS[s.id]} className="w-full aspect-square rounded" />
              <div className="font-bold text-sm mt-2">{s.label}</div>
              <div className="text-[11px] text-foreground/60">{s.where}</div>
              <div className="flex gap-2 mt-2 flex-wrap">
                <ComicButton size="sm" disabled={!!busy} onClick={() => pick(s.id, 'slot', imgOne)}>⬆️ Αλλαγή</ComicButton>
                {ov[s.id] && <ComicButton size="sm" variant="dark" disabled={!!busy} onClick={() => reset(s.id)}>↩︎</ComicButton>}
              </div>
              <Progress id={s.id} />
            </div>
          ))}
        </div>
      </ComicPanel>

      {GALLERIES.map((g) => {
        const video = g.kind === 'video';
        const list = listOf(g.id);
        return (
          <ComicPanel key={g.id} className="bg-card space-y-3">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <div className="font-heading text-lg">{video ? '🎞️' : '📸'} {g.label.toUpperCase()} ({list.length})</div>
                <div className="text-[11px] text-foreground/60">{g.where}</div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <ComicButton size="sm" disabled={!!busy} onClick={() => pick(g.id, 'add', video ? vidMany : imgMany)}>➕ Προσθήκη {video ? 'βίντεο' : 'φωτογραφιών'}</ComicButton>
                {ov[g.id] && <ComicButton size="sm" variant="dark" disabled={!!busy} onClick={() => reset(g.id)}>↩︎ Αρχικά</ComicButton>}
              </div>
            </div>
            <Progress id={g.id} />
            {!list.length && <div className="text-xs text-foreground/60">Δεν υπάρχει κανένα ακόμα.</div>}
            <div className={`grid gap-2 ${video ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'}`}>
              {list.map((src, i) => (
                <div key={`${src}-${i}`} className="border-2 border-border/40 rounded overflow-hidden bg-secondary/40">
                  <Thumb video={video} src={src} className={`w-full ${video ? 'aspect-video' : 'aspect-[4/5]'}`} />
                  <div className="grid grid-cols-4 text-white text-base bg-black/70">
                    <button disabled={!!busy || i === 0} onClick={() => move(g.id, i, -1)} className="py-2.5 disabled:opacity-30" aria-label="Πίσω">◀</button>
                    <button disabled={!!busy} onClick={() => pick(g.id, 'replace', video ? vidOne : imgOne, i)} className="py-2.5" aria-label="Αλλαγή">✏️</button>
                    <button disabled={!!busy} onClick={() => remove(g.id, i)} className="py-2.5 text-red-400" aria-label="Αφαίρεση">🗑</button>
                    <button disabled={!!busy || i === list.length - 1} onClick={() => move(g.id, i, 1)} className="py-2.5 disabled:opacity-30" aria-label="Μπροστά">▶</button>
                  </div>
                </div>
              ))}
            </div>
          </ComicPanel>
        );
      })}

      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg">🗂️ ΒΙΒΛΙΟΘΗΚΗ ΑΡΧΕΙΩΝ ({library.length})</div>
        <p className="text-[11px] text-foreground/60">Οργάνωσε τις εικόνες σε Heist, Pajama ή Branding. Από εδώ μπορείς επίσης να προσθέσεις μια εικόνα απευθείας στη σωστή γκαλερί. Η διαγραφή αφαιρεί το αρχείο οριστικά.</p>
        <div className="flex flex-wrap gap-2">
          {[{ id: 'all', label: 'Όλα' }, ...LIBRARY_CATEGORIES].map((c) => (
            <ComicButton key={c.id} size="sm" variant={libraryFilter === c.id ? 'default' : 'dark'} disabled={!!busy} onClick={() => setLibraryFilter(c.id)}>{c.label}</ComicButton>
          ))}
        </div>
        {!library.length && <div className="text-xs text-foreground/60">Δεν έχεις ανεβάσει ακόμα αρχεία.</div>}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {library.filter((f) => libraryFilter === 'all' || (f.kind === 'video' ? libraryFilter === 'uncategorized' : categoryOf(f.url) === libraryFilter)).map((f) => (
            <div key={f.name} className="border-2 border-border/40 rounded overflow-hidden bg-secondary/40">
              <Thumb video={f.kind === 'video'} src={f.url} className="w-full aspect-square" />
              <div className="p-1 text-[10px] leading-tight break-all">{f.name.replace(/^[a-z0-9]+-[a-f0-9]{6}-/, '')}<br />{mb(f.size)}{isUsed(f.url) ? ' · σε χρήση' : ''}</div>
              {f.kind !== 'video' && <div className="p-1 space-y-1">
                <div className="text-[10px] text-foreground/60">Κατηγορία</div>
                <select value={categoryOf(f.url)} disabled={!!busy} onChange={(e) => setLibraryCategory(f.url, e.target.value)} className="w-full rounded bg-black/50 border border-border/50 p-1 text-xs">
                  {LIBRARY_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-1">
                  <button disabled={!!busy} onClick={() => addLibraryImageToGallery(f.url, 'heistPhotos')} className="text-[10px] py-1 rounded bg-black/50 disabled:opacity-30">+ Heist</button>
                  <button disabled={!!busy} onClick={() => addLibraryImageToGallery(f.url, 'pajamaPhotos')} className="text-[10px] py-1 rounded bg-black/50 disabled:opacity-30">+ Pajama</button>
                </div>
                <select defaultValue="" disabled={!!busy} onChange={(e) => { if (e.target.value) assignLibraryImageToSlot(f.url, e.target.value); e.target.value = ''; }} className="w-full rounded bg-black/50 border border-border/50 p-1 text-[10px]">
                  <option value="">Ανάθεση σε σημείο Site…</option>
                  {IMAGE_SLOTS.map((slot) => <option key={slot.id} value={slot.id}>{slot.label}</option>)}
                </select>
              </div>}
              <button disabled={!!busy} onClick={() => removeFile(f)} className="w-full text-xs py-2.5 bg-black/50 text-red-400 disabled:opacity-30">🗑 Διαγραφή</button>
            </div>
          ))}
        </div>
      </ComicPanel>
    </div>
  );
}
