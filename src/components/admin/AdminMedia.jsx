import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { ART, DEFAULTS, applyMediaOverrides } from '@/data/brandArt';
import { IMAGE_SLOTS, PHOTO_SPOTS, PHOTO_SPOT_IDS, VIDEO_SLOTS, MODE_COVER_SLOTS, GALLERIES, SURFACES } from '@/data/mediaSlots';
import { MEDIA_MODES, MODE_MEDIA_SECTIONS } from '@/data/modes/modeRegistry';
import ModeMediaManager from '@/components/admin/ModeMediaManager';
import AdminMediaPreview from '@/components/admin/AdminMediaPreview';
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
  if (!active) return (
    <button type="button" onClick={() => setActiveVideoThumb(id)} aria-label="Άνοιγμα προεπισκόπησης βίντεο"
      className={`relative flex items-center justify-center overflow-hidden bg-black/70 ${className}`}>
      <span className="rounded-full border border-white/40 bg-black/70 px-4 py-2 text-xs font-bold text-white">▶ ΠΡΟΕΠΙΣΚΟΠΗΣΗ</span>
    </button>
  );
  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      <video src={src} controls muted playsInline preload="none" onLoadedData={onLoad} onError={onError}
        style={{ objectPosition }} className="h-full w-full object-contain" />
      <button type="button" onClick={() => setActiveVideoThumb(null)}
        className="absolute right-1 top-1 rounded bg-black/80 px-2 py-1 text-[10px] text-white">Κλείσιμο</button>
    </div>
  );
}

function Thumb({ src, video, audio, className = '', objectPosition = '50% 50%', onLoad, onError }) {
  if (!src) return <div className={`bg-black/40 ${className}`} />;
  if (audio) return <div className={`bg-black/30 flex items-center justify-center p-2 ${className}`}><audio src={src} controls preload="none" onCanPlay={onLoad} onError={onError} className="w-full" /></div>;
  if (video) return <VideoThumb src={src} className={className} objectPosition={objectPosition} onLoad={onLoad} onError={onError} />;
  return <img src={src} alt="" loading="lazy" decoding="async" onLoad={onLoad} onError={onError} style={{ objectPosition }} className={`object-contain ${className}`} />;
}

export default function AdminMedia() {
  const [rec, setRec] = useState(null);
  const [ov, setOv] = useState({});
  const [library, setLibrary] = useState([]);
  const [libraryFilter, setLibraryFilter] = useState('all');
  const [libraryKindFilter, setLibraryKindFilter] = useState('all');
  const [librarySearch, setLibrarySearch] = useState('');
  const [galleryAsset, setGalleryAsset] = useState({});
  const [section, setSection] = useState('modes');
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
      } catch (e) { setMsg({ ok: false, text: 'Δεν φορτώθηκαν οι ρυθμίσεις.' }); }
      refreshLibrary();
    })();
  }, [refreshLibrary]);

  const save = async (next) => {
    const galleryIds = ['heistPhotos', 'pajamaPhotos', 'siteVideos'];
    const clean = Object.fromEntries(Object.entries(next).filter(([k, v]) => (k.startsWith('clearAll') ? !!v : (Array.isArray(v) ? (v.length > 0 || galleryIds.includes(k)) : v))));
    const record = rec?.id ? rec : await fetchOverrides();
    if (record?.id) {
      if (!rec?.id) setRec(record);
      await base44.entities.AppSetting.update(record.id, { value: clean });
    }
    else setRec(await base44.entities.AppSetting.create({ key: MEDIA_KEY, value: clean }));
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
  const clearSlot = (id) => run(id, () => save({ ...ov, [id]: undefined, emptySlots: [...new Set([...(ov.emptySlots || []), id])] }), 'Το σημείο καθαρίστηκε ✓');
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
  const assignMediaToSlot = (url, slotId) => run(`slot-${slotId}`, async () => {
    await save({ ...ov, [slotId]: url, emptySlots: (ov.emptySlots || []).filter((id) => id !== slotId), emptyModeCovers: (ov.emptyModeCovers || []).filter((id) => id !== slotId) });
  }, 'Το υπάρχον αρχείο συνδέθηκε με το σημείο ✓');
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
  const addExistingToList = (url, listId) => run(`list-${listId}`, async () => {
    const current = [...listOf(listId)];
    if (!current.includes(url)) current.push(url);
    await save({ ...ov, [listId]: current });
  }, 'Το υπάρχον αρχείο προστέθηκε στη συλλογή ✓');
  const assignLibraryImageToSlot = (url, slotId) => run(`slot-${url}`, async () => {
    const category = ['poster', 'heistNight', 'photoHeistNight', 'extraHeistRoom', 'group', 'scene'].includes(slotId)
      ? 'heist'
      : ['party1', 'slipper', 'party2', 'vault', 'photoGame', 'photoSlippers', 'photoPediGlam', 'extraPediGlam'].includes(slotId)
        ? 'pajama'
        : 'branding';
    await save({ ...ov, [slotId]: url, libraryCategories: { ...(ov.libraryCategories || {}), [url]: category } });
  }, 'Η εικόνα ανατέθηκε στο σημείο ✓');

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

      const avResult = await base44.entities.AppSetting.filter({ key: 'av_control_room_v1' }, { limit: 1 });
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
        await base44.entities.AppSetting.update(avRecord.id, { value: { ...avValue, metadata, queue, queueIndex } });
      }

      const cueResult = await base44.entities.ProductionCue.filter({ source: f.url }, { limit: 1000 });
      for (const cue of cueResult.items || []) {
        if (cue?.id) await base44.entities.ProductionCue.update(cue.id, {
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
    const label = kind === 'image' ? 'ΟΛΕΣ ΤΙΣ ΦΩΤΟΓΡΑΦΙΕΣ' : kind === 'video' ? 'ΟΛΑ ΤΑ ΒΙΝΤΕΟ' : kind === 'audio' ? 'ΟΛΟΥΣ ΤΟΥΣ ΗΧΟΥΣ' : 'ΟΛΑ ΤΑ ΠΟΛΥΜΕΣΑ';
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
        ...(kind === 'video' || kind === 'all' ? { trailer: '' } : {}),
      }]));
      const next = {
        ...ov,
        modeMedia: nextModeMedia,
        ...(kind === 'video' || kind === 'all' ? {
          agent: undefined,
          welcomeVideo: undefined,
          countdownVideo: undefined,
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

      const avResult = await base44.entities.AppSetting.filter({ key: 'av_control_room_v1' }, { limit: 1 });
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
        await base44.entities.AppSetting.update(avRecord.id, { value: { ...avValue, metadata, queue, queueIndex } });
      }

      await Promise.all([...deletedUrls].map(async (url) => {
        const cueResult = await base44.entities.ProductionCue.filter({ source: url }, { limit: 1000 });
        await Promise.all((cueResult.items || []).filter((cue) => cue?.id).map((cue) => base44.entities.ProductionCue.update(cue.id, {
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

  const missingMediaPoints = () => {
    const missing = [];
    const clearedImages = !!(ov.clearAllPhotos || ov.clearAllMedia);
    for (const slot of PHOTO_SPOTS) {
      const src = ov[slot.id] || (ov.emptySlots?.includes(slot.id) || clearedImages ? '' : DEFAULTS[slot.id]);
      if (!src) missing.push({ surface: slot.surfaces?.[0] || 'site', label: slot.label, where: slot.where });
    }
    for (const slot of IMAGE_SLOTS) if (!ov[slot.id] && (clearedImages || !DEFAULTS[slot.id])) missing.push({ surface: slot.surfaces?.[0] || 'site', label: slot.label, where: slot.where });
    for (const slot of VIDEO_SLOTS) if (!ov[slot.id]) missing.push({ surface: 'tv', label: slot.label, where: slot.where });
    for (const mode of MEDIA_MODES) {
      const saved = ov.modeMedia?.[mode.id] || {};
      const sections = Array.isArray(saved.sections) && saved.sections.length
        ? saved.sections
        : (MODE_MEDIA_SECTIONS[mode.id] || []).map((item) => ({ ...item, image: '' }));
      const gallery = Array.isArray(saved.gallery) ? saved.gallery.filter(Boolean) : [];
      if (!saved.hero) missing.push({ surface: 'site', label: `${mode.name} — Hero`, where: 'Κεντρική εικόνα παρουσίασης του Mode' });
      if (saved.coverCleared || (!saved.cover && !ov[`modeCover_${mode.id}`] && !DEFAULTS[`modeCover_${mode.id}`])) missing.push({ surface: 'tablet', label: `${mode.name} — Cover`, where: 'Ξεχωριστό εξώφυλλο επιλογής Mode στο Tablet / Forms' });
      for (const section of sections) {
        if (!section.image) missing.push({ surface: 'tablet', label: `${mode.name} — ${section.label}`, where: 'Εικόνα ενότητας στο Tablet Setup' });
      }
      if (gallery.length < 6) missing.push({ surface: 'site', label: `${mode.name} — Gallery (${gallery.length}/6)`, where: 'Gallery του mode στο Site (6 θέσεις)' });
      if (!saved.trailer) missing.push({ surface: 'tablet', label: `${mode.name} — Βίντεο trailer`, where: 'Tablet Setup και σελίδα του mode στο Site' });
    }
    for (const gallery of GALLERIES.filter((item) => !item.retired)) {
      const count = listOf(gallery.id).filter(Boolean).length;
      const required = gallery.requiredCount || 0;
      if (required > 0 && count < required) missing.push({
        surface: gallery.surfaces?.[0] || 'site',
        label: `${gallery.label} (${count}/${required})`,
        where: gallery.where,
      });
    }
    return missing;
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
          { id: 'modes', label: '🎮 MODE MEDIA CENTER', hint: 'Όλα ανά mode' },
          { id: 'site', label: '🌐 Site & TV', hint: 'Σημεία, gallery, βίντεο έναρξης' },
          { id: 'library', label: '🗂️ Βιβλιοθήκη', hint: 'Ανέβασμα & όλα τα αρχεία' },
        ].map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={section === item.id} onClick={() => { setSection(item.id); if (item.id !== 'site') setSurfaceFilter('all'); }}
            className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left sm:block ${section === item.id ? 'border-primary bg-primary/15' : 'border-border bg-secondary/40'}`}>
            <div className="text-sm font-black">{item.label}</div><div className="text-[11px] text-foreground/55 sm:mt-0.5">{item.hint}</div>
          </button>
        ))}
      </div>

      {section === 'library' && (<>
      <ComicPanel className="bg-card">
        <div className="font-heading text-xl text-primary">🗂️ ΒΙΒΛΙΟΘΗΚΗ ΠΟΛΥΜΕΣΩΝ 3.0</div>
        <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); target.current = { id: 'library', mode: 'library', surface: surfaceFilter }; onFiles({ target: { files: [...(e.dataTransfer?.files || [])], value: '' } }); }} className={`mt-3 rounded-xl border-2 border-dashed p-5 text-center text-sm font-bold transition-colors ${dragging ? 'border-primary bg-primary/15' : 'border-border/70 bg-secondary/40'}`}>ΣΥΡΕ ΕΔΩ ΠΟΛΛΑΠΛΑ ΑΡΧΕΙΑ ΓΙΑ ΑΝΕΒΑΣΜΑ</div>
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
      {section === 'site' && (<>
      <ComicPanel className="bg-card">
        <div className="font-heading text-lg">ΠΡΟΟΡΙΣΜΟΣ ΠΟΛΥΜΕΣΩΝ</div>
        <p className="mt-1 text-xs text-foreground/60">Επίλεξε πού ανήκει το υλικό. Οι καρτέλες φιλτράρουν τα σημεία και τη βιβλιοθήκη αρχείων. Μπορείς είτε να επιλέξεις υπάρχον αρχείο από τη βιβλιοθήκη είτε να ανεβάσεις νέο απευθείας στο συγκεκριμένο σημείο.</p>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <button type="button" onClick={() => setSurfaceFilter("all")} className={surfaceFilter === "all" ? "rounded-xl border border-primary bg-primary/15 p-3 text-left" : "rounded-xl border border-border bg-secondary/40 p-3 text-left"}><div className="text-sm font-black">ΟΛΑ</div><div className="text-[10px] text-foreground/55">Όλα τα σημεία</div></button>
          {SURFACES.map((surface) => <button key={surface.id} type="button" onClick={() => setSurfaceFilter(surface.id)} className={surfaceFilter === surface.id ? "rounded-xl border border-primary bg-primary/15 p-3 text-left" : "rounded-xl border border-border bg-secondary/40 p-3 text-left"}><div className="text-sm font-black">{surface.label}</div><div className="text-[10px] text-foreground/55">{surface.description}</div></button>)}
          <button type="button" onClick={() => setSurfaceFilter("preview")} className={surfaceFilter === "preview" ? "rounded-xl border border-primary bg-primary/15 p-3 text-left" : "rounded-xl border border-border bg-secondary/40 p-3 text-left"}><div className="text-sm font-black">ΖΩΝΤΑΝΗ ΠΡΟΕΠΙΣΚΟΠΗΣΗ</div><div className="text-[10px] text-foreground/55">Πραγματικές σελίδες</div></button>
        </div>
      </ComicPanel>

      {surfaceFilter === "preview" && <AdminMediaPreview />}

      {showSurface("site", "forms", "tv", "tablet", "mobile") && (
      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg">🖼️ ΠΟΛΥΜΕΣΑ ΑΝΑ ΣΗΜΕΙΟ</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PHOTO_SPOTS.filter((s) => showSurface(...(s.surfaces || []))).map((s) => {
            const src = ov[s.id] || (ov.emptySlots?.includes(s.id) || ov.clearAllPhotos || ov.clearAllMedia ? '' : DEFAULTS[s.id]);
            return (
              <div key={s.id} className="border-2 border-border/40 rounded-lg p-2 bg-secondary/40">
                {src ? <Thumb src={src} video={isVideoFile(src)} className="w-full aspect-video rounded" /> : <div className="w-full aspect-video rounded bg-black/40 flex items-center justify-center text-xs text-foreground/50">Κενό σημείο</div>}
                <div className="font-bold text-sm mt-2">{s.label}</div>
                {s.filename && <div className="text-[10px] text-foreground/55">{s.filename}</div>}
                <div className="text-[11px] text-foreground/60">{s.where}</div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <select aria-label={`Αρχείο για ${s.label}`} value="" disabled={!!busy} onChange={(e) => { if (e.target.value) assignMediaToSlot(e.target.value, s.id); }} className="w-full rounded-lg border border-border bg-background px-2 py-2 text-xs"><option value="">Σύνδεση από κεντρική βιβλιοθήκη…</option>{library.filter((file) => ['image','graphic','video'].includes(file.kind)).map((file) => <option key={file.url} value={file.url}>{file.kind} · {file.name}</option>)}</select>
                  {directUploadControl(`photo-spot-${s.id}`, 'image/*,video/*', (url, ov) => ({ ...ov, [s.id]: url, emptySlots: (ov.emptySlots || []).filter((id) => id !== s.id) }))}
                  {src && <ComicButton size="sm" variant="dark" disabled={!!busy} onClick={() => clearSlot(s.id)}>Αφαίρεση από σημείο</ComicButton>}
                  <ComicButton size="sm" variant="dark" disabled={!!busy} onClick={() => reset(s.id)}>↩︎ Αρχικό</ComicButton>
                </div>
                <Progress id={s.id} />
              </div>
            );
          })}
          {IMAGE_SLOTS.filter((slot) => showSurface(...(slot.surfaces || []))).map((slot) => {
            const src = ov[slot.id] || (ov.emptySlots?.includes(slot.id) || ov.clearAllPhotos || ov.clearAllMedia ? '' : DEFAULTS[slot.id]);
            const uploadedFile = library.find((file) => file.url === src);
            return <div key={slot.id} className="border-2 border-border/40 rounded-lg p-2 bg-secondary/40">
              <Thumb src={src} className="w-full aspect-video rounded" />
              <div className="font-bold text-sm mt-2">{slot.label}</div>
              <div className="text-[11px] text-foreground/60">{slot.where}</div>
              <select aria-label={`Αρχείο για ${slot.label}`} value="" disabled={!!busy} onChange={(e) => { if (e.target.value) assignMediaToSlot(e.target.value, slot.id); }} className="mt-2 w-full rounded-lg border border-border bg-background px-2 py-2 text-xs">
                <option value="">Σύνδεση από κεντρική βιβλιοθήκη…</option>
                {library.filter((file) => file.kind === 'image' || file.kind === 'graphic').map((file) => <option key={file.url} value={file.url}>{file.name}</option>)}
              </select>
              <div className="mt-2 flex flex-wrap gap-2">
                {directUploadControl(`image-slot-${slot.id}`, 'image/*', (url, ov) => ({ ...ov, [slot.id]: url, emptySlots: (ov.emptySlots || []).filter((id) => id !== slot.id) }))}
                {src && <ComicButton size="sm" variant="dark" disabled={!!busy} onClick={() => clearSlot(slot.id)}>Αφαίρεση από σημείο</ComicButton>}
                {ov[slot.id] && <ComicButton size="sm" variant="dark" disabled={!!busy} onClick={() => reset(slot.id)}>↩︎ Αρχική εικόνα</ComicButton>}
                {uploadedFile && <ComicButton size="sm" variant="red" disabled={!!busy} onClick={() => removeFile(uploadedFile)}>🗑️ Οριστική διαγραφή από παντού</ComicButton>}
              </div>
            </div>;
          })}
        </div>
      </ComicPanel>
      )}

      {showSurface('tv') && (
      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg">🎬 ΒΙΝΤΕΟ ΕΝΑΡΞΗΣ TV</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {VIDEO_SLOTS.map((slot) => {
            const src = ov[slot.id] || '';
            return (
              <div key={slot.id} className="border-2 border-border/40 rounded-lg p-3 bg-secondary/40 space-y-2">
                <div className="font-heading text-base text-primary">{slot.label}</div>
                <div className="text-xs text-foreground/60">{slot.where}</div>
                {src ? <Thumb src={src} video className="w-full aspect-video rounded" /> : <div className="w-full aspect-video rounded bg-black/40 flex items-center justify-center text-xs text-foreground/50">Δεν έχει ανέβει βίντεο</div>}
                <div className="flex flex-wrap gap-2">
                  <select aria-label={`Βίντεο για ${slot.label}`} value="" disabled={!!busy} onChange={(e) => { if (e.target.value) assignMediaToSlot(e.target.value, slot.id); }} className="w-full rounded-lg border border-border bg-background px-2 py-2 text-xs"><option value="">Σύνδεση βίντεο από κεντρική βιβλιοθήκη…</option>{library.filter((file) => file.kind === 'video').map((file) => <option key={file.url} value={file.url}>{file.name}</option>)}</select>
                  {directUploadControl(`video-slot-${slot.id}`, VIDEO_ACCEPT, (url, ov) => ({ ...ov, [slot.id]: url }))}
                  {src && <ComicButton size="sm" variant="dark" disabled={!!busy} onClick={() => run(slot.id, () => save({ ...ov, [slot.id]: undefined }), 'Το βίντεο αφαιρέθηκε ✓')}>🗑 Αφαίρεση</ComicButton>}
                </div>
                <Progress id={slot.id} />
              </div>
            );
          })}
        </div>
      </ComicPanel>
      )}
      </>)}

      {section === 'modes' && (<>
      <section className="rounded-3xl bg-[#1C1C1E] p-4 text-[#F5F1E8] sm:p-5">
        <h3 className="text-base font-bold">🎮 Εξώφυλλο ανά mode</h3>
        <p className="mb-3 text-xs text-white/55">Επιλογή mode στο Tablet, φόρμα /forms και Site.</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
          {MEDIA_MODES.map((mode) => {
            const coverId = `modeCover_${mode.id}`;
            const saved = ov.modeMedia?.[mode.id] || {};
            const src = saved.coverCleared ? '' : (saved.cover || ov[coverId] || (ov.clearAllPhotos || ov.clearAllMedia ? '' : DEFAULTS[coverId]) || '');
            const withCover = (base, url) => ({ ...base, modeMedia: { ...(base.modeMedia || {}), [mode.id]: { ...(base.modeMedia?.[mode.id] || {}), cover: url, coverCleared: !url } } });
            return (
              <div key={mode.id} className="space-y-1.5">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-black">
                  {src ? <img src={src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center border border-dashed border-white/20 text-xs text-white/45 rounded-2xl">Χωρίς εξώφυλλο</div>}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-8 text-xs font-bold">{mode.icon} {mode.name}</div>
                </div>
                <div className="flex flex-col gap-1.5">
                  {directUploadControl(`mode-cover-${mode.id}`, 'image/*', (url, base) => withCover(base, url), src ? 'Αλλαγή' : '＋ Ανέβασμα')}
                  <select aria-label={`Εξώφυλλο ${mode.name} από βιβλιοθήκη`} value="" disabled={!!busy} onChange={(e) => { const url = e.target.value; if (url) run(`cover-${mode.id}`, () => save(withCover(ov, url)), 'Το εξώφυλλο αποθηκεύτηκε ✓'); }} className="h-9 w-full min-w-0 rounded-full border border-white/10 bg-[#2C2C2E] px-3 text-xs">
                    <option value="">Από βιβλιοθήκη…</option>
                    {library.filter((file) => file.kind === 'image' || file.kind === 'graphic').map((file) => <option key={file.url} value={file.url}>{file.name}</option>)}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div>
        <ModeMediaManager
          value={ov.modeMedia || {}}
          files={library}
          onRefresh={refreshLibrary}
          disabled={!!busy}
          onSave={async (modeMedia) => {
            setBusy('mode-media');
            setMsg(null);
            try {
              await saveChanged({ ...ov, modeMedia });
              setMsg({ ok: true, text: 'Τα πολυμέσα του mode αποθηκεύτηκαν ✓' });
            } catch (error) {
              setMsg({ ok: false, text: error.message });
              throw error;
            } finally {
              setBusy(null);
              setProgress(0);
            }
          }}
        />
      </div>
      </>)}

      {section === 'site' && (<>
      {showSurface('site', 'forms') && (
      <section className="space-y-3 rounded-3xl bg-[#1C1C1E] p-4 text-[#F5F1E8] sm:p-5">
        <div>
          <h3 className="text-base font-bold">📸 Gallery ανά mode</h3>
          <p className="text-xs text-white/55">6 φωτογραφίες για κάθε mode — σελίδα του mode στο Site και καρτέλα «Όλες» της γκαλερί.</p>
        </div>
        {MEDIA_MODES.map((mode) => {
          const gallery = Array.from({ length: 6 }, (_, index) => ov.modeMedia?.[mode.id]?.gallery?.[index] || '');
          const withSlot = (base, index, url) => {
            const current = Array.from({ length: 6 }, (_, i) => base.modeMedia?.[mode.id]?.gallery?.[i] || '');
            current[index] = url;
            return { ...base, modeMedia: { ...(base.modeMedia || {}), [mode.id]: { ...(base.modeMedia?.[mode.id] || {}), gallery: current } } };
          };
          return (
            <div key={mode.id} className="space-y-2 border-t border-white/10 pt-3 first:border-0 first:pt-0">
              <div className="text-sm font-bold">{mode.icon} {mode.name} <span className="font-normal text-white/50">· {gallery.filter(Boolean).length}/6</span></div>
              <div className="grid grid-cols-3 gap-2 lg:grid-cols-6">
                {gallery.map((src, index) => (
                  <div key={index} className="space-y-1">
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-black">
                      {src ? <img src={src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-dashed border-white/20 text-lg text-white/35">{index + 1}</div>}
                      {src && <button type="button" disabled={!!busy} onClick={() => run(`mode-gallery-clear-${mode.id}-${index}`, () => save(withSlot(ov, index, '')), 'Η θέση άδειασε ✓')} aria-label={`Αφαίρεση φωτογραφίας ${index + 1}`} className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-xs">✕</button>}
                    </div>
                    {directUploadControl(`mode-gallery-${mode.id}-${index}`, 'image/*', (url, base) => withSlot(base, index, url), src ? 'Αλλαγή' : '＋')}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>
      )}
      {showSurface('site', 'forms') && (
      <>
      {GALLERIES.filter((g) => !g.retired && showSurface(...(g.surfaces || ['site']))).map((g) => {
        const video = g.kind === 'video';
        const list = listOf(g.id);
        const requiredCount = g.requiredCount || 0;
        const filesForGallery = library.filter((file) => video ? file.kind === 'video' : file.kind === 'image' || file.kind === 'graphic');
        return (
          <ComicPanel key={g.id} className="bg-card space-y-3">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <div className="font-heading text-lg">{video ? '🎞️' : '📸'} {g.label.toUpperCase()} ({requiredCount ? `${list.length}/${requiredCount}` : list.length})</div>
                <div className="text-[11px] text-foreground/60">{g.where}</div>
              </div>
              {!requiredCount && (
                <div className="flex gap-2 flex-wrap">
                  <select aria-label={`Αρχείο για ${g.label}`} value={galleryAsset[g.id] || ''} disabled={!!busy} onChange={(e) => setGalleryAsset((current) => ({ ...current, [g.id]: e.target.value }))} className="rounded-lg border border-border bg-background px-2 py-2 text-xs"><option value="">Επιλογή από κεντρική βιβλιοθήκη…</option>{filesForGallery.map((file) => <option key={file.url} value={file.url}>{file.name}</option>)}</select>
                  <ComicButton size="sm" disabled={!!busy || !galleryAsset[g.id]} onClick={() => { addExistingToList(galleryAsset[g.id], g.id); setGalleryAsset((current) => ({ ...current, [g.id]: '' })); }}>Σύνδεση</ComicButton>
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
                      <select
                        aria-label={`${g.label} ${index + 1}`}
                        value={src}
                        disabled={!!busy || (!src && !canAdd)}
                        onChange={(event) => {
                          const selectedUrl = event.target.value;
                          if (!selectedUrl) return;
                          const next = [...list];
                          if (index < next.length) next[index] = selectedUrl;
                          else next.push(selectedUrl);
                          setList(g.id, next);
                        }}
                        className="w-full rounded-lg border border-border bg-background px-2 py-2 text-[10px]"
                      >
                        <option value="">{src ? 'Επιλογή αντικατάστασης…' : 'Επιλογή εικόνας…'}</option>
                        {filesForGallery.map((item) => <option key={item.url} value={item.url}>{item.name}</option>)}
                      </select>
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
                      <div className="grid grid-cols-4 text-white text-base bg-black/70">
                        <button disabled={!!busy || i === 0} onClick={() => move(g.id, i, -1)} className="py-2.5 disabled:opacity-30" aria-label="Πίσω">◀</button>
                        <select aria-label={`Αντικατάσταση στοιχείου ${i+1}`} value="" disabled={!!busy} onChange={(e) => { if (e.target.value) run(`replace-${g.id}-${i}`, () => { const next=[...list]; next[i]=e.target.value; return save({ ...ov, [g.id]: next }); }, 'Το αρχείο αντικαταστάθηκε ✓'); }} className="col-span-2 w-full bg-black/70 text-[10px] text-white"><option value="">Αλλαγή από βιβλιοθήκη</option>{filesForGallery.map((item) => <option key={item.url} value={item.url}>{item.name}</option>)}</select>
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
      </>)}

      {section === 'library' && (<>
      {surfaceFilter !== 'preview' && (
      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg">📋 ΑΝΑΦΟΡΑ ΚΕΝΩΝ ΣΗΜΕΙΩΝ</div>
        <p className="text-xs text-foreground/60">Εμφανίζονται οι ελλείψεις της λίστας εικόνων και οι αριθμημένες galleries που δεν έχουν συμπληρωθεί.</p>
        {missingMediaPoints().filter((item) => surfaceFilter === 'all' || item.surface === surfaceFilter).length === 0
          ? <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">Δεν εντοπίστηκαν κενά σημεία στην επιλεγμένη κατηγορία.</div>
          : <div className="grid sm:grid-cols-2 gap-2">
              {missingMediaPoints().filter((item) => surfaceFilter === 'all' || item.surface === surfaceFilter).map((item, index) => (
                <button key={item.surface + item.label + index} type="button" onClick={() => setSurfaceFilter(item.surface)} className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-left">
                  <div className="text-[10px] font-black text-primary">{SURFACES.find((surface) => surface.id === item.surface)?.label || item.surface}</div>
                  <div className="mt-1 text-sm font-bold">{item.label}</div>
                  <div className="mt-1 text-[11px] text-foreground/55">{item.where}</div>
                </button>
              ))}
            </div>}
      </ComicPanel>
      )}

      {surfaceFilter !== 'preview' && (
      <ComicPanel className="bg-card space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap"><div className="font-heading text-lg">🗂️ ΑΡΧΕΙΑ ΚΕΝΤΡΙΚΗΣ ΒΙΒΛΙΟΘΗΚΗΣ ({library.length})</div><ComicButton size="sm" disabled={!!busy} onClick={() => pick('library', 'library', libraryOne, undefined, surfaceFilter)}>＋ ΠΡΟΣΘΗΚΗ ΑΡΧΕΙΟΥ</ComicButton></div>
        <input type="search" value={librarySearch} onChange={(e) => setLibrarySearch(e.target.value)} placeholder="Αναζήτηση αρχείων…" className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm" />
        <p className="text-[11px] text-foreground/60">Οργάνωσε φωτογραφίες, γραφικά, βίντεο και ήχους σε Heist, Pajama ή Εταιρική ταυτότητα. Η διαγραφή αφαιρεί το αρχείο οριστικά.</p>
        <div className="space-y-2">
          <div className="text-xs font-bold text-foreground/65">ΤΥΠΟΣ ΑΡΧΕΙΟΥ</div>
          <div className="flex flex-wrap gap-2">
            {[{ id: 'all', label: 'Όλα' }, { id: 'image', label: 'Εικόνες' }, { id: 'video', label: 'Βίντεο' }, { id: 'audio', label: 'Ήχοι' }].map((kind) => (
              <ComicButton key={kind.id} size="sm" variant={libraryKindFilter === kind.id ? 'default' : 'dark'} disabled={!!busy} onClick={() => setLibraryKindFilter(kind.id)}>{kind.label}</ComicButton>
            ))}
          </div>
          <div className="text-xs font-bold text-foreground/65">ΟΜΑΔΑ ΑΡΧΕΙΟΥ</div>
          <div className="flex flex-wrap gap-2">
            {[{ id: 'all', label: 'Όλα' }, ...LIBRARY_CATEGORIES].map((c) => (
              <ComicButton key={c.id} size="sm" variant={libraryFilter === c.id ? 'default' : 'dark'} disabled={!!busy} onClick={() => setLibraryFilter(c.id)}>{c.label}</ComicButton>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'Όλα τα αρχεία' },
            { id: 'unused', label: 'Δεν χρησιμοποιούνται' },
            { id: 'broken', label: 'Σφάλμα φόρτωσης' },
          ].map((item) => <ComicButton key={item.id} size="sm" variant={libraryStatusFilter === item.id ? 'default' : 'dark'} disabled={!!busy} onClick={() => setLibraryStatusFilter(item.id)}>{item.label}</ComicButton>)}
        </div>
        {!library.length && <div className="text-xs text-foreground/60">Δεν έχεις ανεβάσει ακόμα αρχεία.</div>}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {library.filter((f) => (libraryKindFilter === 'all' || f.kind === libraryKindFilter || (libraryKindFilter === 'image' && f.kind === 'graphic')) && (libraryFilter === 'all' || categoryOf(f.url) === libraryFilter) && (surfaceFilter === 'all' || getFileSurfaces(f.url).includes(surfaceFilter)) && (libraryStatusFilter === 'all' || (libraryStatusFilter === 'unused' && !isUsed(f.url)) || (libraryStatusFilter === 'broken' && fileLoadStatus[f.url] === 'error')) && f.name.toLowerCase().includes(librarySearch.toLowerCase())).map((f) => (
            <div key={f.name} className="admin-media-library-card border-2 border-border/40 rounded overflow-hidden bg-secondary/40">
              <Thumb video={f.kind === 'video'} audio={f.kind === 'audio'} src={f.url} objectPosition={ov.libraryFocalPoints?.[f.url] || '50% 50%'} onLoad={() => setFileLoadStatus((v) => ({ ...v, [f.url]: 'ok' }))} onError={() => setFileLoadStatus((v) => ({ ...v, [f.url]: 'error' }))} className="w-full aspect-square" />
              <div className="p-1 text-[10px] leading-tight break-all">{f.name.replace(/^[a-z0-9]+-[a-f0-9]{6}-/, '')}<br />{mb(f.size)}<br />Κατάσταση: {fileLoadStatus[f.url] === 'error' ? '⚠ Σφάλμα φόρτωσης' : fileLoadStatus[f.url] === 'ok' ? (isUsed(f.url) ? `Σε χρήση · ${getFileSurfaces(f.url).map((id) => SURFACES.find((s) => s.id === id)?.label || id).join(', ') || 'Εντοπισμένη αντιστοίχιση'}` : 'Δεν χρησιμοποιείται') : 'Έλεγχος φόρτωσης…'}</div>
              {<div className="p-1 space-y-1">
                <div className="text-[10px] text-foreground/60">Κατηγορία εφαρμογής</div>
                <select value={ov.librarySurfaces?.[f.url] || 'auto'} disabled={!!busy} onChange={(e) => setLibrarySurface(f.url, e.target.value)} className="w-full rounded bg-black/50 border border-border/50 p-1 text-[10px]">
                  <option value="auto">Αυτόματη αντιστοίχιση</option>
                  {SURFACES.map((surface) => <option key={surface.id} value={surface.id}>{surface.label}</option>)}
                </select>
                <div className="text-[10px] text-foreground/60">Ομάδα αρχείου</div>
                <select value={categoryOf(f.url)} disabled={!!busy} onChange={(e) => setLibraryCategory(f.url, e.target.value)} className="w-full rounded bg-black/50 border border-border/50 p-1 text-xs">
                  {LIBRARY_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                {(f.kind === 'image' || f.kind === 'graphic') && <>
                  <div className="text-[10px] text-foreground/60">Σημείο εστίασης</div>
                  <select value={ov.libraryFocalPoints?.[f.url] || '50% 50%'} disabled={!!busy} onChange={(e) => setLibraryFocalPoint(f.url, e.target.value)} className="w-full rounded bg-black/50 border border-border/50 p-1 text-[10px]">
                    <option value="50% 50%">Κέντρο</option><option value="50% 0%">Πάνω</option><option value="50% 100%">Κάτω</option><option value="0% 50%">Αριστερά</option><option value="100% 50%">Δεξιά</option>
                  </select>
                  <select defaultValue="" disabled={!!busy} onChange={(e) => { if (e.target.value) assignLibraryImageToSlot(f.url, e.target.value); e.target.value = ''; }} className="w-full rounded bg-black/50 border border-border/50 p-1 text-[10px]">
                    <option value="">Ανάθεση σε σημείο εφαρμογής…</option>
                    {IMAGE_SLOTS.map((slot) => <option key={slot.id} value={slot.id}>{slot.label} — {(slot.surfaces || []).map((id) => SURFACES.find((surface) => surface.id === id)?.label || id).join(' / ')}</option>)}
                  </select>
                </>}
              </div>}
              <button disabled={!!busy} onClick={() => removeFile(f)} className="w-full text-xs py-2.5 bg-black/50 text-red-400 disabled:opacity-30">🗑 Διαγραφή</button>
            </div>
          ))}
        </div>
      </ComicPanel>
      )}
      </>)}
    </div>
  );
}
