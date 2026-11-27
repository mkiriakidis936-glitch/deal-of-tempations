import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { appApi } from '@/api/apiClient';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { ART, DEFAULTS, applyMediaOverrides } from '@/data/brandArt';
import { IMAGE_SLOTS, PHOTO_SPOTS, PHOTO_SPOT_IDS, VIDEO_SLOTS, MODE_COVER_SLOTS, GALLERIES, SURFACES } from '@/data/mediaSlots';
import { MEDIA_MODES } from '@/data/modes/modeRegistry';
import AdminMediaMap from '@/components/admin/AdminMediaMap';
import { MEDIA_KEY, fetchOverrides, uploadMedia, listMedia, deleteMedia, deleteAllMedia } from '@/lib/media';

import { MEDIA_ACCEPT, VIDEO_ACCEPT, isVideoUrl as isVideoFile } from '@/lib/mediaKind';
const containsUrl = (value, url) => typeof value === 'string'
  ? value === url
  : Array.isArray(value)
    ? value.some((item) => containsUrl(item, url))
    : !!value && typeof value === 'object'
      ? Object.values(value).some((item) => containsUrl(item, url))
      : false;
const removeUrl = (value, url) => {
  if (typeof value === 'string') return value === url ? undefined : value;
  if (Array.isArray(value)) return value.map((item) => removeUrl(item, url)).filter((item) => item !== undefined);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, removeUrl(item, url)]).filter(([, item]) => item !== undefined));
  return value;
};
const mb = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

let activeVideoThumb = null;
const videoThumbListeners = new Set();
const setActiveVideoThumb = (id) => {
  activeVideoThumb = id;
  videoThumbListeners.forEach((listener) => listener());
};

function VideoThumb({ src, className = '', objectPosition = '50% 50%', onLoad, onError }) {
  const id = useId();
  const [active, setActive] = useState(false);
  useEffect(() => {
    const sync = () => setActive(activeVideoThumb === id);
    videoThumbListeners.add(sync);
    sync();
    return () => {
      videoThumbListeners.delete(sync);
      if (activeVideoThumb === id) setActiveVideoThumb(null);
    };
  }, [id]);
  // Πριν το πάτημα: πρώτο καρέ ως εικόνα (#t=0.1, δουλεύει και στο iPhone) + κουμπί ▶.
  if (!active) return (
    <button type="button" onClick={() => setActiveVideoThumb(id)} aria-label="Αναπαραγωγή βίντεο"
      className={`relative flex items-center justify-center overflow-hidden bg-black ${className}`}>
      <video src={`${src}#t=0.1`} muted playsInline preload="metadata" tabIndex={-1} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-70" />
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-black/70 text-2xl text-white ring-1 ring-white/40">▶</span>
    </button>
  );
  // Με το πάτημα το βίντεο ξεκινά αμέσως (με ήχο, αφού το ζήτησε ο χρήστης).
  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      <video src={src} controls autoPlay playsInline preload="auto" onLoadedData={onLoad} onError={onError}
        ref={(el) => { if (el && el.paused && !el.dataset.started) { el.dataset.started = '1'; el.play().catch(() => { el.muted = true; el.play().catch(() => {}); }); } }}
        style={{ objectPosition }} className="h-full w-full object-contain" />
      <button type="button" onClick={() => setActiveVideoThumb(null)}
        className="absolute right-1 top-1 rounded bg-black/80 px-2 py-1 text-[10px] text-white">Κλείσιμο</button>
    </div>
  );
}

function Thumb({ src, video, audio, className = '', objectPosition = '50% 50%', onLoad, onError }) {
  if (!src) return <div className={`bg-black/40 ${className}`} />;
  if (audio) return <div className={`bg-black/30 flex flex-col items-center justify-center gap-2 p-2 ${className}`}><span className="text-3xl" aria-hidden="true">🎵</span><audio src={src} controls preload="none" onCanPlay={onLoad} onError={onError} className="w-full" /></div>;
  if (video) return <VideoThumb src={src} className={className} objectPosition={objectPosition} onLoad={onLoad} onError={onError} />;
  return <img src={src} alt="" loading="lazy" decoding="async" onLoad={onLoad} onError={onError} style={{ objectPosition }} className={`object-cover ${className}`} />;
}

export default function AdminMedia() {
  const [rec, setRec] = useState(null);
  const [ov, setOv] = useState({});
  const [library, setLibrary] = useState([]);
  const [libraryFilter, setLibraryFilter] = useState('all');
  const [libraryKindFilter, setLibraryKindFilter] = useState('all');
  const [librarySearch, setLibrarySearch] = useState('');
  const [section, setSection] = useState('map');
  const [surfaceFilter, setSurfaceFilter] = useState('all');
  const [fileLoadStatus, setFileLoadStatus] = useState({});
  const [libraryStatusFilter, setLibraryStatusFilter] = useState('all');
  // Κατηγορίες βιβλιοθήκης: μία ανά mode + Site + TV. Οι παλιές τιμές μεταφράζονται αυτόματα.
  const LIBRARY_CATEGORIES = [
    ...MEDIA_MODES.map((mode) => ({ id: mode.id, label: `${mode.icon || '🎮'} ${mode.name}` })),
    { id: 'site', label: '🌐 Site & φόρμες' },
    { id: 'tv', label: '📺 TV' },
    { id: 'uncategorized', label: 'Χωρίς κατηγορία' },
  ];
  const LEGACY_CATEGORY = { heist: 'arrest_heist', branding: 'site', pajama: 'uncategorized' };
  const categoryOf = (url) => {
    const raw = ov.libraryCategories?.[url] || 'uncategorized';
    const mapped = LEGACY_CATEGORY[raw] || raw;
    return LIBRARY_CATEGORIES.some((item) => item.id === mapped) ? mapped : 'uncategorized';
  };
  const showSurface = (...ids) => surfaceFilter === 'all' || ids.includes(surfaceFilter);
  const [busy, setBusy] = useState(null);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [msg, setMsg] = useState(null);
  const target = useRef(null);
  const libraryOne = useRef(null);
  const directInputs = useRef({});

  const refreshLibrary = useCallback(async () => {
    try { setLibrary(await listMedia({ force: true })); } catch (e) { setMsg({ ok: false, text: e.message }); }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetchOverrides();
        setRec(r);
        setOv(r?.value || {});
      } catch { setMsg({ ok: false, text: 'Δεν φορτώθηκαν οι ρυθμίσεις.' }); }
      refreshLibrary();
    })();
  }, [refreshLibrary]);

  const save = async (next) => {
    const galleryIds = ['heistPhotos', 'pajamaPhotos', 'siteVideos'];
    const clean = Object.fromEntries(Object.entries(next).filter(([k, v]) => (k.startsWith('clearAll') ? !!v : (Array.isArray(v) ? (v.length > 0 || galleryIds.includes(k)) : v))));
    const record = rec?.id ? rec : await fetchOverrides();
    if (record?.id) {
      if (!rec?.id) setRec(record);
      await appApi.entities.AppSetting.update(record.id, { value: clean });
    }
    else setRec(await appApi.entities.AppSetting.create({ key: MEDIA_KEY, value: clean }));
    applyMediaOverrides(clean);
    setOv(clean);
  };

  const saveChanged = async (next) => {
    const fresh = (await fetchOverrides())?.value || {};
    const merged = { ...fresh };
    for (const k of new Set([...Object.keys(ov), ...Object.keys(next)])) {
      if (JSON.stringify(next[k]) !== JSON.stringify(ov[k])) {
        if (next[k] === undefined) delete merged[k]; else merged[k] = next[k];
      }
    }
    await save(merged);
  };

  const run = async (id, fn, okText = 'Αποθηκεύτηκε ✓') => {
    setBusy(id); setMsg(null);
    try { await fn(); setMsg({ ok: true, text: okText }); }
    catch (e) { setMsg({ ok: false, text: e.message }); }
    finally { setBusy(null); setProgress(0); }
  };

  const pick = (id, mode, ref, index, surface = surfaceFilter) => { target.current = { id, mode, index, surface }; ref.current?.click(); };

  const onFiles = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = '';
    const t = target.current;
    if (!files.length || !t || t.mode !== 'library') return;
    await run('library-upload', async () => {
      const urls = [];
      const failed = [];
      for (let i = 0; i < files.length; i++) {
        try {
          const uploaded = await uploadMedia(files[i], (p) => setProgress((i + p) / files.length));
          urls.push(uploaded.url);
        } catch (err) {
          failed.push(`${files[i].name}: ${err.message}`);
        }
      }
      if (urls.length) {
        const fresh = (await fetchOverrides())?.value || {};
        const librarySurfaces = { ...(fresh.librarySurfaces || {}) };
        for (const url of urls) if (t.surface && t.surface !== 'all' && t.surface !== 'preview') librarySurfaces[url] = t.surface;
        await save({ ...fresh, librarySurfaces });
        await refreshLibrary();
      }
      if (failed.length) throw new Error(`Ανέβηκαν ${urls.length}/${files.length}. Απέτυχαν: ${failed.join(' · ')}`);
    }, 'Τα αρχεία προστέθηκαν στην κεντρική βιβλιοθήκη ✓');
  };

  const reset = (id) => run(id, () => { const { [id]: _, ...rest } = ov; if (PHOTO_SPOT_IDS.includes(id) || IMAGE_SLOTS.some((slot) => slot.id === id)) return save({ ...rest, [id]: DEFAULTS[id], emptySlots: (ov.emptySlots || []).filter((slot) => slot !== id) }); if (MODE_COVER_SLOTS.some((slot) => slot.id === id)) return save({ ...rest, [id]: DEFAULTS[id], emptyModeCovers: (ov.emptyModeCovers || []).filter((slot) => slot !== id) }); return save(rest); }, 'Επαναφορά στο αρχικό ✓');
  const listOf = (id) => Array.isArray(ov[id]) ? ov[id] : ((id === 'siteVideos' && (ov.clearAllVideos || ov.clearAllMedia)) || ((id === 'heistPhotos' || id === 'pajamaPhotos') && (ov.clearAllPhotos || ov.clearAllMedia)) ? [] : (DEFAULTS[id] || []));
  const setList = (id, list) => run(id, () => save({ ...ov, [id]: list }));
  const move = (id, i, d) => {
    const l = [...listOf(id)]; const j = i + d;
    if (j < 0 || j >= l.length) return;
    [l[i], l[j]] = [l[j], l[i]];
    setList(id, l);
  };
  const remove = (id, i) => setList(id, listOf(id).filter((_, k) => k !== i));

  const isUsed = (url) => Object.entries(ov).some(([k, v]) => !['libraryCategories', 'libraryFocalPoints', 'librarySurfaces'].includes(k) && containsUrl(v, url));
  const getFileSurfaces = (url) => {
    const found = new Set();
    const manual = ov.librarySurfaces?.[url];
    if (manual && SURFACES.some((s) => s.id === manual)) found.add(manual);
    for (const slot of PHOTO_SPOTS) if (containsUrl(ov[slot.id], url)) (slot.surfaces || []).forEach((s) => found.add(s));
    for (const slot of VIDEO_SLOTS) if (containsUrl(ov[slot.id], url)) (slot.surfaces || ['tv']).forEach((s) => found.add(s));
    for (const slot of IMAGE_SLOTS) if (containsUrl(ov[slot.id], url)) (slot.surfaces || []).forEach((s) => found.add(s));
    for (const slot of MODE_COVER_SLOTS) if (containsUrl(ov[slot.id], url)) (slot.surfaces || ['tablet', 'forms']).forEach((s) => found.add(s));
    for (const gallery of GALLERIES) if (containsUrl(ov[gallery.id], url)) (gallery.surfaces || ['site']).forEach((s) => found.add(s));
    for (const media of Object.values(ov.modeMedia || {})) {
      if (containsUrl(media.hero, url)) ['site', 'tablet'].forEach((s) => found.add(s));
      if (containsUrl(media.cover, url)) ['tablet', 'forms'].forEach((s) => found.add(s));
      if (containsUrl(media.sections, url)) found.add('tablet');
      if (containsUrl(media.gallery, url) || containsUrl(media.trailer, url)) found.add('site');
      if (containsUrl(media.intro, url)) found.add('tv');
    }
    return [...found];
  };
  const setLibrarySurface = (url, surface) => run(`surface-${url}`, () => {
    const librarySurfaces = { ...(ov.librarySurfaces || {}) };
    if (surface === 'auto') delete librarySurfaces[url]; else librarySurfaces[url] = surface;
    return save({ ...ov, librarySurfaces });
  }, 'Η κατηγορία εφαρμογής αποθηκεύτηκε ✓');
  const setLibraryCategory = (url, category) => run(`category-${url}`, () => save({ ...ov, libraryCategories: { ...(ov.libraryCategories || {}), [url]: category } }), 'Η κατηγορία αποθηκεύτηκε ✓');
  const setLibraryFocalPoint = (url, focalPoint) => run(`focal-${url}`, () => save({ ...ov, libraryFocalPoints: { ...(ov.libraryFocalPoints || {}), [url]: focalPoint } }), 'Το σημείο εστίασης αποθηκεύτηκε ✓');
  const uploadDirectToSlot = async (slotId, file, apply, successText = 'Το αρχείο ανέβηκε και συνδέθηκε απευθείας στο σημείο.') => {
    if (!file) return;
    await run(`direct-upload-${slotId}`, async () => {
      const uploaded = await uploadMedia(file, setProgress);
      if (!uploaded?.url) throw new Error('Ο server δεν επέστρεψε σύνδεσμο για το αρχείο.');
      const fresh = (await fetchOverrides())?.value || {};
      await save(apply(uploaded.url, fresh));
      await refreshLibrary();
    }, successText);
  };
  const directUploadControl = (slotId, accept, apply, label = 'Ανέβασμα αρχείου εδώ') => (
    <>
      <input ref={(element) => { directInputs.current[slotId] = element; }} type="file" accept={accept} hidden disabled={!!busy}
        onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; uploadDirectToSlot(slotId, file, apply); }} />
      <ComicButton size="sm" disabled={!!busy} onClick={() => directInputs.current[slotId]?.click()}>{label}</ComicButton>
    </>
  );


  const removeFile = (f) => {
    const used = isUsed(f.url);
    const q = used
      ? `Το «${f.name}» θα διαγραφεί οριστικά από το σύστημα και από ΟΛΑ τα σημεία όπου χρησιμοποιείται. Δεν θα παραμείνουν συνδέσεις. Συνέχεια;`
      : `Οριστική διαγραφή του «${f.name}» από το σύστημα; Συνέχεια;`;
    if (!window.confirm(q)) return;
    return run(f.name, async () => {
      const next = used ? (removeUrl(ov, f.url) || {}) : { ...ov };
      if (Array.isArray(next.gameMediaAssignments)) {
        next.gameMediaAssignments = next.gameMediaAssignments.filter((item) => item?.url !== f.url);
      }
      for (const key of ['libraryCategories', 'librarySurfaces', 'libraryFocalPoints']) {
        if (next[key]) { const values = { ...next[key] }; delete values[f.url]; next[key] = values; }
      }
      if (used || ['libraryCategories', 'librarySurfaces', 'libraryFocalPoints'].some((key) => ov[key]?.[f.url] !== undefined)) await save(next);

      const avResult = await appApi.entities.AppSetting.filter({ key: 'av_control_room_v1' }, { limit: 1 });
      const avRecord = avResult.items?.[0];
      if (avRecord?.id) {
        const avValue = avRecord.value || {};
        const metadata = { ...(avValue.metadata || {}) };
        delete metadata[f.url];
        const queue = (avValue.queue || []).filter((item) => item?.url !== f.url);
        const removedIndex = (avValue.queue || []).findIndex((item) => item?.url === f.url);
        let queueIndex = Number.isInteger(avValue.queueIndex) ? avValue.queueIndex : -1;
        if (removedIndex >= 0) {
          if (queueIndex === removedIndex) queueIndex = -1;
          else if (queueIndex > removedIndex) queueIndex -= 1;
        }
        await appApi.entities.AppSetting.update(avRecord.id, { value: { ...avValue, metadata, queue, queueIndex } });
      }

      const cueResult = await appApi.entities.ProductionCue.filter({ source: f.url }, { limit: 1000 });
      for (const cue of cueResult.items || []) {
        if (cue?.id) await appApi.entities.ProductionCue.update(cue.id, {
          active: false,
          source: '',
          mediaItemId: null,
          playbackCommand: 'stop',
          commandAt: Date.now(),
        });
      }

      await deleteMedia(f.name);
      await refreshLibrary();
    }, 'Το αρχείο διαγράφηκε οριστικά από παντού ✓');
  };


  const clearMedia = (kind) => {
    const label = kind === 'image' ? 'Όλες τις φωτογραφίες' : kind === 'video' ? 'Όλα τα βίντεο' : kind === 'audio' ? 'Όλους τους ήχους' : 'Όλα τα πολυμέσα';
    if (!window.confirm(`ΠΡΟΣΟΧΗ: Θα διαγραφούν οριστικά ${label} από τη βιβλιοθήκη του project και από ΟΛΑ τα σημεία χρήσης, συμπεριλαμβανομένου του AV Control Room. Συνέχεια;`)) return;
    return run(`clear-${kind}`, async () => {
      const deletedUrls = new Set(library.filter((file) => kind === 'all' || file.kind === kind).map((file) => file.url));
      const pruneFileMap = (map = {}) => Object.fromEntries(Object.entries(map).filter(([url]) => !deletedUrls.has(url)));
      const nextModeMedia = Object.fromEntries(Object.entries(ov.modeMedia || {}).map(([modeId, media]) => [modeId, {
        ...media,
        ...(kind === 'image' || kind === 'all' ? {
          hero: '',
          cover: '',
          sections: (media.sections || []).map((item) => ({ ...item, image: '' })),
          gallery: [],
          cards: (media.cards || []).map((item) => ({ ...item, image: '' })),
        } : {}),
        ...(kind === 'video' || kind === 'all' ? { trailer: '', intro: '', sections: (media.sections || []).map((item) => (deletedUrls.has(item?.image) || kind === 'all' ? { ...item, image: '' } : item)) } : {}),
      }]));
      const next = {
        ...ov,
        modeMedia: nextModeMedia,
        ...(kind === 'video' || kind === 'all' ? {
          agent: undefined,
          ...Object.fromEntries(VIDEO_SLOTS.map(({ id }) => [id, undefined])),
          siteVideos: [],
          ...Object.fromEntries(PHOTO_SPOT_IDS.map((id) => [id, typeof ov[id] === 'string' && !isVideoFile(ov[id]) && kind === 'video' ? ov[id] : undefined])),
        } : {}),
        ...(kind === 'image' || kind === 'all' ? {
          ...Object.fromEntries(Object.keys(ART).map((id) => [id, undefined])),
          ...Object.fromEntries(MODE_COVER_SLOTS.map(({ id }) => [id, undefined])),
          emptyModeCovers: MODE_COVER_SLOTS.map(({ id }) => id),
          heistPhotos: [],
          pajamaPhotos: [],
          gameModePhotos: Object.fromEntries(Object.entries(ov.gameModePhotos || {}).map(([modeId, urls]) => [modeId, (urls || []).filter((url) => !deletedUrls.has(url))])),
          ...Object.fromEntries(PHOTO_SPOT_IDS.map((id) => [id, kind === 'image' && isVideoFile(ov[id]) ? ov[id] : undefined])),
          clearAllPhotos: true,
        } : {}),
        gameMediaAssignments: (ov.gameMediaAssignments || []).filter((item) => !deletedUrls.has(item?.url)),
        ...(kind === 'all' ? { clearAllPhotos: true, clearAllVideos: true, clearAllMedia: true, emptySlots: PHOTO_SPOT_IDS } : {}),
        ...(kind === 'video' ? { clearAllVideos: true } : {}),
        libraryCategories: pruneFileMap(ov.libraryCategories),
        librarySurfaces: pruneFileMap(ov.librarySurfaces),
        libraryFocalPoints: pruneFileMap(ov.libraryFocalPoints),
      };
      await save(next);

      const avResult = await appApi.entities.AppSetting.filter({ key: 'av_control_room_v1' }, { limit: 1 });
      const avRecord = avResult.items?.[0];
      if (avRecord?.id) {
        const avValue = avRecord.value || {};
        const oldQueue = avValue.queue || [];
        const queue = oldQueue.filter((item) => !deletedUrls.has(item?.url));
        const oldIndex = Number.isInteger(avValue.queueIndex) ? avValue.queueIndex : -1;
        const currentDeleted = oldIndex >= 0 && deletedUrls.has(oldQueue[oldIndex]?.url);
        const removedBefore = oldIndex >= 0 ? oldQueue.slice(0, oldIndex).filter((item) => deletedUrls.has(item?.url)).length : 0;
        const queueIndex = currentDeleted ? -1 : oldIndex < 0 ? -1 : oldIndex - removedBefore;
        const metadata = Object.fromEntries(Object.entries(avValue.metadata || {}).filter(([url]) => !deletedUrls.has(url)));
        await appApi.entities.AppSetting.update(avRecord.id, { value: { ...avValue, metadata, queue, queueIndex } });
      }

      await Promise.all([...deletedUrls].map(async (url) => {
        const cueResult = await appApi.entities.ProductionCue.filter({ source: url }, { limit: 1000 });
        await Promise.all((cueResult.items || []).filter((cue) => cue?.id).map((cue) => appApi.entities.ProductionCue.update(cue.id, {
          active: false,
          source: '',
          mediaItemId: null,
          playbackCommand: 'stop',
          commandAt: Date.now(),
        })));
      }));

      await deleteAllMedia(kind);
      await refreshLibrary();
    }, `${label}: οριστική διαγραφή από παντού ολοκληρώθηκε ✓`);
  };

  const Progress = ({ id }) => busy === id ? (
    <div className="h-2 rounded bg-black/40 overflow-hidden mt-2">
      <div className="h-full bg-primary transition-all" style={{ width: `${Math.max(5, progress * 100)}%` }} />
    </div>
  ) : null;

  return (
    <div className="space-y-3">
      <input ref={libraryOne} type="file" accept={MEDIA_ACCEPT} hidden onChange={onFiles} />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="tablist" aria-label="Ενότητες πολυμέσων">
        {[
          { id: 'map', label: '🧭 Όλες οι θέσεις', hint: 'Ανέβασμα σε κάθε θέση · τι λείπει · πού φαίνεται' },
          { id: 'galleries', label: '🎞️ Γκαλερί & λίστες βίντεο', hint: 'Φωτογραφίες και βίντεο με σειρά' },
          { id: 'library', label: '🗂️ Αρχεία', hint: 'Όλα τα αρχεία του server · διαγραφή' },
        ].map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={section === item.id} onClick={() => { setSection(item.id); if (item.id !== 'site') setSurfaceFilter('all'); }}
            className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left sm:block ${section === item.id ? 'border-primary bg-primary/15' : 'border-border bg-secondary/40'}`}>
            <div className="text-sm font-black">{item.label}</div><div className="text-[11px] text-foreground/55 sm:mt-0.5">{item.hint}</div>
          </button>
        ))}
      </div>

      {section === 'map' && (
        <AdminMediaMap ov={ov} library={library} busy={!!busy} onSave={saveChanged} onRefresh={refreshLibrary} />
      )}

      {section === 'library' && (<>
      <ComicPanel className="bg-card">
        <div className="font-heading text-xl text-primary">🗂️ Βιβλιοθήκη πολυμέσων 3.0</div>
        <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); target.current = { id: 'library', mode: 'library', surface: surfaceFilter }; onFiles({ target: { files: [...(e.dataTransfer?.files || [])], value: '' } }); }} className={`mt-3 rounded-xl border-2 border-dashed p-5 text-center text-sm font-bold transition-colors ${dragging ? 'border-primary bg-primary/15' : 'border-border/70 bg-secondary/40'}`}>Σύρε εδώ πολλά αρχεία για ανέβασμα</div>
        <p className="text-xs font-body text-foreground/70 mt-1">
          Διαχείριση φωτογραφιών, γραφικών SVG, βίντεο και ήχων με κατηγορίες, αναζήτηση και προεπισκόπηση. Οι φωτογραφίες μικραίνουν αυτόματα.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <ComicButton size="sm" variant="dark" disabled={!!busy} onClick={() => clearMedia('image')}>🗑 Διαγραφή όλων των φωτογραφιών</ComicButton>
          <ComicButton size="sm" variant="dark" disabled={!!busy} onClick={() => clearMedia('video')}>🗑 Διαγραφή όλων των βίντεο</ComicButton>
          <ComicButton size="sm" variant="dark" disabled={!!busy} onClick={() => clearMedia('all')}>🗑 Διαγραφή όλων των πολυμέσων</ComicButton>
        </div>
        {msg && <div className={`mt-2 text-sm font-bold ${msg.ok ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</div>}
      </ComicPanel>

      </>)}
      {section === 'galleries' && (
      <>
      {GALLERIES.filter((g) => !g.retired && showSurface(...(g.surfaces || ['site']))).map((g) => {
        const video = g.kind === 'video';
        const list = listOf(g.id);
        const requiredCount = g.requiredCount || 0;
        return (
          <ComicPanel key={g.id} className="bg-card space-y-3">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <div className="font-heading text-lg">{video ? '🎞️' : '📸'} {g.label.toUpperCase()} ({requiredCount ? `${list.length}/${requiredCount}` : list.length})</div>
                <div className="text-[11px] text-foreground/60">{g.where}</div>
              </div>
              {!requiredCount && (
                <div className="flex gap-2 flex-wrap">
                  {ov[g.id] && <ComicButton size="sm" variant="dark" disabled={!!busy} onClick={() => reset(g.id)}>↩︎ Αρχικά</ComicButton>}
                </div>
              )}
            </div>
            <Progress id={g.id} />
            {!requiredCount && directUploadControl(`gallery-${g.id}`, video ? VIDEO_ACCEPT : 'image/*', (url, base) => ({ ...base, [g.id]: [...(Array.isArray(base[g.id]) ? base[g.id] : listOf(g.id)), url] }), video ? 'Ανέβασμα βίντεο εδώ' : 'Ανέβασμα εικόνας εδώ')}
            {requiredCount ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Array.from({ length: requiredCount }, (_, index) => {
                  const src = list[index] || '';
                  const file = library.find((item) => item.url === src);
                  const canAdd = index === list.length;
                  return (
                    <div key={index} className="border-2 border-border/40 rounded-lg p-2 bg-secondary/40 space-y-2">
                      <div className="text-xs font-bold">{g.id === 'heistPhotos' ? `heist_${String(index + 1).padStart(2, '0')}.jpg` : `pajama_${String(index + 1).padStart(2, '0')}.jpg`}</div>
                      <Thumb src={src} className="w-full aspect-[4/3] rounded" />
                      <div className="text-[10px] text-foreground/60 break-all">{file?.name || (src ? 'Αρχείο συνδεδεμένο' : 'Δεν έχει συνδεθεί εικόνα')}</div>
                      {canAdd && directUploadControl(`required-gallery-${g.id}-${index}`, 'image/*', (url, base) => { const next = [...(Array.isArray(base[g.id]) ? base[g.id] : list)]; next[index] = url; return { ...base, [g.id]: next }; }, 'Ανέβασμα απευθείας εδώ')}
                      {src && <ComicButton size="sm" variant="dark" disabled={!!busy} onClick={() => remove(g.id, index)}>Αφαίρεση θέσης</ComicButton>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                {!list.length && <div className="text-xs text-foreground/60">Δεν υπάρχει κανένα ακόμα.</div>}
                <div className={`grid gap-2 ${video ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'}`}>
                  {list.map((src, i) => (
                    <div key={`${src}-${i}`} className="border-2 border-border/40 rounded overflow-hidden bg-secondary/40">
                      <Thumb video={video} src={src} className={`w-full ${video ? 'aspect-video' : 'aspect-[4/5]'}`} />
                      <div className="grid grid-cols-3 text-white text-base bg-black/70">
                        <button disabled={!!busy || i === 0} onClick={() => move(g.id, i, -1)} className="py-2.5 disabled:opacity-30" aria-label="Πίσω">◀</button>
                        <button disabled={!!busy} onClick={() => remove(g.id, i)} className="py-2.5 text-red-400" aria-label="Αφαίρεση">🗑</button>
                        <button disabled={!!busy || i === list.length - 1} onClick={() => move(g.id, i, 1)} className="py-2.5 disabled:opacity-30" aria-label="Μπροστά">▶</button>
                      </div>
                      {video && (
                        <select aria-label={`Πού εμφανίζεται το βίντεο ${i + 1}`} value={ov.videoPlacements?.[src] || 'site'} disabled={!!busy}
                          onChange={(e) => { const placement = e.target.value; run(`placement-${i}`, () => save({ ...ov, videoPlacements: { ...(ov.videoPlacements || {}), [src]: placement } }), 'Η θέση του βίντεο αποθηκεύτηκε ✓'); }}
                          className="w-full bg-background px-2 py-2 text-[11px]">
                          <option value="site">📍 Αρχική Site</option>
                          {MEDIA_MODES.map((mode) => <option key={mode.id} value={mode.id}>📍 {mode.name} (Site + Tablet)</option>)}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </ComicPanel>
        );
      })}
      </>
      )}

      {section === 'library' && (<>

      {surfaceFilter !== 'preview' && (
      <section className="space-y-3 rounded-3xl bg-[#1C1C1E] p-4 text-[#F5F1E8] sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-bold">🗂️ Αρχεία <span className="font-normal text-white/50">· {library.length}</span></h3>
          <button type="button" disabled={!!busy} onClick={() => pick('library', 'library', libraryOne, undefined, surfaceFilter)} className="h-10 shrink-0 rounded-full bg-[#E8C26B] px-4 text-sm font-bold text-black">＋ Ανέβασμα</button>
        </div>
        <input type="search" value={librarySearch} onChange={(e) => setLibrarySearch(e.target.value)} placeholder="Αναζήτηση αρχείων…" className="h-11 w-full rounded-full border border-white/10 bg-black/40 px-4 text-sm" />
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          {[{ id: 'all', label: 'Όλα' }, { id: 'image', label: '🖼️ Εικόνες' }, { id: 'video', label: '🎬 Βίντεο' }, { id: 'audio', label: '🎵 Ήχοι' }].map((kind) => (
            <button key={kind.id} type="button" onClick={() => setLibraryKindFilter(kind.id)} aria-pressed={libraryKindFilter === kind.id}
              className={`h-9 shrink-0 rounded-full px-4 text-xs font-semibold ${libraryKindFilter === kind.id ? 'bg-[#E8C26B] text-black' : 'bg-[#2C2C2E] text-white/80'}`}>{kind.label}</button>
          ))}
          {[{ id: 'unused', label: 'Αχρησιμοποίητα' }, { id: 'broken', label: '⚠ Σφάλματα' }].map((item) => (
            <button key={item.id} type="button" onClick={() => setLibraryStatusFilter(libraryStatusFilter === item.id ? 'all' : item.id)} aria-pressed={libraryStatusFilter === item.id}
              className={`h-9 shrink-0 rounded-full px-4 text-xs font-semibold ${libraryStatusFilter === item.id ? 'bg-[#E8C26B] text-black' : 'bg-[#2C2C2E] text-white/80'}`}>{item.label}</button>
          ))}
        </div>
        <select value={libraryFilter} onChange={(e) => setLibraryFilter(e.target.value)} aria-label="Ομάδα αρχείων" className="h-10 w-full rounded-full border border-white/10 bg-[#2C2C2E] px-4 text-sm sm:w-72">
          <option value="all">Όλες οι ομάδες</option>
          {LIBRARY_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        {!library.length && <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-white/55">Δεν έχεις ανεβάσει ακόμα αρχεία.</div>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {library.filter((f) => (libraryKindFilter === 'all' || f.kind === libraryKindFilter || (libraryKindFilter === 'image' && f.kind === 'graphic')) && (libraryFilter === 'all' || categoryOf(f.url) === libraryFilter) && (surfaceFilter === 'all' || getFileSurfaces(f.url).includes(surfaceFilter)) && (libraryStatusFilter === 'all' || (libraryStatusFilter === 'unused' && !isUsed(f.url)) || (libraryStatusFilter === 'broken' && fileLoadStatus[f.url] === 'error')) && f.name.toLowerCase().includes(librarySearch.toLowerCase())).map((f) => {
            const status = fileLoadStatus[f.url] === 'error' ? { text: '⚠ Σφάλμα', cls: 'bg-[#FF453A]/20 text-[#FF8A80]' } : isUsed(f.url) ? { text: 'Σε χρήση', cls: 'bg-[#30D158]/15 text-[#7BE495]' } : { text: 'Αχρησιμοποίητο', cls: 'bg-white/10 text-white/60' };
            const kindLabel = f.kind === 'video' ? 'Βίντεο' : f.kind === 'audio' ? 'Ήχος' : f.kind === 'graphic' ? 'Γραφικό' : 'Εικόνα';
            return (
              <div key={f.name} className="admin-media-library-card overflow-hidden rounded-2xl bg-black/30">
                <Thumb video={f.kind === 'video'} audio={f.kind === 'audio'} src={f.url} objectPosition={ov.libraryFocalPoints?.[f.url] || '50% 50%'} className="aspect-square w-full"
                  onLoad={() => setFileLoadStatus((v) => ({ ...v, [f.url]: 'ok' }))} onError={() => setFileLoadStatus((v) => ({ ...v, [f.url]: 'error' }))} />
                <div className="space-y-1.5 p-2.5">
                  <div className="line-clamp-2 break-all text-xs font-semibold" title={f.name}>{f.name.replace(/^[a-z0-9]+-[a-f0-9]{6}-/, '').replace(/^\d{10,}-/, '')}</div>
                  <div className="flex flex-wrap items-center gap-1 text-[10px]">
                    <span className="text-white/50">{kindLabel} · {mb(f.size)}</span>
                    <span className={`rounded-full px-2 py-0.5 font-semibold ${status.cls}`}>{status.text}</span>
                  </div>
                  <details className="text-xs">
                    <summary className="cursor-pointer list-none py-1 text-[#E8C26B]">Ρυθμίσεις ›</summary>
                    <div className="space-y-1.5 pt-1">
                      <select value={categoryOf(f.url)} disabled={!!busy} onChange={(e) => setLibraryCategory(f.url, e.target.value)} aria-label="Ομάδα αρχείου" className="h-9 w-full rounded-xl bg-[#2C2C2E] px-2 text-xs">
                        {LIBRARY_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                      <select value={ov.librarySurfaces?.[f.url] || 'auto'} disabled={!!busy} onChange={(e) => setLibrarySurface(f.url, e.target.value)} aria-label="Πού εμφανίζεται" className="h-9 w-full rounded-xl bg-[#2C2C2E] px-2 text-xs">
                        <option value="auto">Οθόνη: αυτόματα</option>
                        {SURFACES.map((surface) => <option key={surface.id} value={surface.id}>Οθόνη: {surface.label}</option>)}
                      </select>
                      {(f.kind === 'image' || f.kind === 'graphic') && (
                        <select value={ov.libraryFocalPoints?.[f.url] || '50% 50%'} disabled={!!busy} onChange={(e) => setLibraryFocalPoint(f.url, e.target.value)} aria-label="Σημείο εστίασης" className="h-9 w-full rounded-xl bg-[#2C2C2E] px-2 text-xs">
                          <option value="50% 50%">Εστίαση: κέντρο</option><option value="50% 0%">Εστίαση: πάνω</option><option value="50% 100%">Εστίαση: κάτω</option><option value="0% 50%">Εστίαση: αριστερά</option><option value="100% 50%">Εστίαση: δεξιά</option>
                        </select>
                      )}
                      <button type="button" disabled={!!busy} onClick={() => removeFile(f)} className="h-9 w-full rounded-xl bg-[#FF453A]/15 text-xs font-semibold text-[#FF8A80]">🗑 Διαγραφή αρχείου</button>
                    </div>
                  </details>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      )}
      </>)}
    </div>
  );
}
