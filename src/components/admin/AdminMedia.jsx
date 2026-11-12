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
  const [busy, setBusy] = useState(null);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState(null);
  const target = useRef(null);
  const imgOne = useRef(null);
  const imgMany = useRef(null);
  const vid = useRef(null);

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

  const pick = (id, mode, ref) => { target.current = { id, mode }; ref.current?.click(); };

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
      else await save({ ...ov, [t.id]: [...(ov[t.id] || DEFAULTS[t.id]), ...urls] });
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

  const used = new Set(Object.values(ov).flat());
  const removeFile = (f) => {
    if (!window.confirm(`Διαγραφή του «${f.name}» οριστικά;`)) return;
    run(f.name, async () => { await deleteMedia(f.name); await refreshLibrary(); }, 'Διαγράφηκε ✓');
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
      <input ref={vid} type="file" accept={VID_ACCEPT} hidden onChange={onFiles} />

      <ComicPanel className="bg-card">
        <div className="font-heading text-xl text-primary">🖼️ ΦΩΤΟΓΡΑΦΙΕΣ & ΒΙΝΤΕΟ</div>
        <p className="text-xs font-body text-foreground/70 mt-1">
          Ανέβασε τα δικά σου αρχεία για κάθε σημείο. Οι φωτογραφίες μικραίνουν αυτόματα (max 2400px). Για βίντεο προτίμησε MP4 (H.264).
          Οι οθόνες (TV, κινητά) δείχνουν τις αλλαγές μετά από ανανέωση της σελίδας.
        </p>
        {msg && <div className={`mt-2 text-sm font-bold ${msg.ok ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</div>}
      </ComicPanel>

      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg">🎬 ΒΙΝΤΕΟ</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {VIDEO_SPOTS.map((s) => (
            <div key={s.id} className="border-2 border-border/40 rounded-lg p-2 bg-secondary/40">
              <Thumb video src={ov[s.id] || (s.id === 'agent' ? DEFAULTS.agent : '')} className="w-full aspect-video rounded" />
              <div className="font-bold text-sm mt-2">{s.label}</div>
              <div className="text-[11px] text-foreground/60">{s.where}</div>
              {s.id !== 'agent' && !ov[s.id] && <div className="text-[11px] text-primary/80">Χρησιμοποιεί το κεντρικό βίντεο</div>}
              <div className="flex gap-2 mt-2">
                <ComicButton size="sm" disabled={!!busy} onClick={() => pick(s.id, 'slot', vid)}>⬆️ Ανέβασμα</ComicButton>
                {ov[s.id] && <ComicButton size="sm" variant="dark" disabled={!!busy} onClick={() => reset(s.id)}>↩︎ Αρχικό</ComicButton>}
              </div>
              <Progress id={s.id} />
            </div>
          ))}
        </div>
      </ComicPanel>

      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg">🖼️ ΕΙΚΟΝΕΣ</div>
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

      {GALLERIES.map((g) => (
        <ComicPanel key={g.id} className="bg-card space-y-3">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <div className="font-heading text-lg">📸 {g.label.toUpperCase()} ({listOf(g.id).length})</div>
              <div className="text-[11px] text-foreground/60">{g.where}</div>
            </div>
            <div className="flex gap-2">
              <ComicButton size="sm" disabled={!!busy} onClick={() => pick(g.id, 'gallery', imgMany)}>➕ Προσθήκη φωτογραφιών</ComicButton>
              {ov[g.id] && <ComicButton size="sm" variant="dark" disabled={!!busy} onClick={() => reset(g.id)}>↩︎ Αρχικές</ComicButton>}
            </div>
          </div>
          <Progress id={g.id} />
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {listOf(g.id).map((src, i) => (
              <div key={`${src}-${i}`} className="relative border-2 border-border/40 rounded overflow-hidden">
                <Thumb src={src} className="w-full aspect-[4/5]" />
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/70 text-white text-sm">
                  <button disabled={!!busy || i === 0} onClick={() => move(g.id, i, -1)} className="px-2 py-1 disabled:opacity-30">◀</button>
                  <button disabled={!!busy} onClick={() => remove(g.id, i)} className="px-2 py-1 text-red-400">✕</button>
                  <button disabled={!!busy || i === listOf(g.id).length - 1} onClick={() => move(g.id, i, 1)} className="px-2 py-1 disabled:opacity-30">▶</button>
                </div>
              </div>
            ))}
          </div>
        </ComicPanel>
      ))}

      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg">🗂️ ΒΙΒΛΙΟΘΗΚΗ ΑΡΧΕΙΩΝ ({library.length})</div>
        {!library.length && <div className="text-xs text-foreground/60">Δεν έχεις ανεβάσει ακόμα αρχεία.</div>}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {library.map((f) => (
            <div key={f.name} className="border-2 border-border/40 rounded overflow-hidden bg-secondary/40">
              <Thumb video={f.kind === 'video'} src={f.url} className="w-full aspect-square" />
              <div className="p-1 text-[10px] leading-tight break-all">{f.name.replace(/^[a-z0-9]+-[a-f0-9]{6}-/, '')}<br />{mb(f.size)}</div>
              <button
                disabled={!!busy || used.has(f.url)}
                title={used.has(f.url) ? 'Χρησιμοποιείται — αφαίρεσέ το πρώτα' : 'Διαγραφή'}
                onClick={() => removeFile(f)}
                className="w-full text-[11px] py-1 bg-black/50 text-red-400 disabled:opacity-30"
              >
                {used.has(f.url) ? 'σε χρήση' : '🗑 Διαγραφή'}
              </button>
            </div>
          ))}
        </div>
      </ComicPanel>
    </div>
  );
}
