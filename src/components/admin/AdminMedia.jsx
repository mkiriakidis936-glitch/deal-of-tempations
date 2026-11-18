import React, { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { ART, DEFAULTS, applyMediaOverrides } from '@/data/brandArt';
import { IMAGE_SLOTS, PHOTO_SPOTS, PHOTO_SPOT_IDS, VIDEO_SLOTS, MODE_COVER_SLOTS, GALLERIES, SURFACES } from '@/data/mediaSlots';
import { NEW_MODES, MODE_MEDIA_SECTIONS } from '@/data/modes/modeRegistry';
import ModeMediaManager from '@/components/admin/ModeMediaManager';
import GameMediaLibraries from '@/components/admin/GameMediaLibraries';
import AdminMediaPreview from '@/components/admin/AdminMediaPreview';
import AVControlRoom from '@/components/admin/AVControlRoom';
import { MEDIA_KEY, fetchOverrides, uploadMedia, listMedia, deleteMedia, deleteAllMedia } from '@/lib/media';

const MEDIA_ACCEPT = 'image/*,video/*,audio/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.heic,.svg,.mp4,.webm,.mov,.mp3,.wav,.ogg,.m4a,.aac';
const isVideoFile = (url) => /\.(mp4|webm|mov)(?:[?#]|$)/i.test(url || '');
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

function Thumb({ src, video, audio, className = '', objectPosition = '50% 50%', onLoad, onError }) {
  if (!src) return <div className={`bg-black/40 ${className}`} />;
  if (audio) return <div className={`bg-black/30 flex items-center justify-center p-2 ${className}`}><audio src={src} controls preload="metadata" onCanPlay={onLoad} onError={onError} className="w-full" /></div>;
  return video
    ? <video src={src} controls muted playsInline preload="metadata" onLoadedData={onLoad} onError={onError} style={{ objectPosition }} className={`bg-black object-cover ${className}`} />
    : <img src={src} alt="" loading="lazy" onLoad={onLoad} onError={onError} style={{ objectPosition }} className={`object-contain ${className}`} />;
}

export default function AdminMedia() {
  const [rec, setRec] = useState(null);
  const [ov, setOv] = useState({});
  const [library, setLibrary] = useState([]);
  const [mediaRevision, setMediaRevision] = useState(0);
  const [libraryFilter, setLibraryFilter] = useState('all');
  const [libraryKindFilter, setLibraryKindFilter] = useState('all');
  const [librarySearch, setLibrarySearch] = useState('');
  const [galleryAsset, setGalleryAsset] = useState({});
  const [surfaceFilter, setSurfaceFilter] = useState('all');
  const [fileLoadStatus, setFileLoadStatus] = useState({});
  const [libraryStatusFilter, setLibraryStatusFilter] = useState('all');
  const LIBRARY_CATEGORIES = [
    { id: 'heist', label: 'Ληστεία' },
    { id: 'pajama', label: 'Πιτζάμα' },
    { id: 'branding', label: 'Εταιρική ταυτότητα' },
    { id: 'uncategorized', label: 'Χωρίς κατηγορία' },
  ];
  const categoryOf = (url) => ov.libraryCategories?.[url] || 'uncategorized';
  const showSurface = (...ids) => surfaceFilter === 'all' || ids.includes(surfaceFilter);
  const [busy, setBusy] = useState(null);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [msg, setMsg] = useState(null);
  const target = useRef(null);
  const libraryOne = useRef(null);

  const refreshLibrary = useCallback(async () => {
    try { setLibrary(await listMedia()); setMediaRevision((revision) => revision + 1); } catch (e) { setMsg({ ok: false, text: e.message }); }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const historyKey = `admin_setting_versions_${MEDIA_KEY}`;
        const history = await base44.entities.AppSetting.filter({ key: historyKey }, { limit: 1 });
        if (history.items?.[0]?.id) await base44.entities.AppSetting.delete(history.items[0].id);
      } catch (e) {
        setMsg({ ok: false, text: 'Δεν διαγράφηκε το παλιό ιστορικό εκδόσεων της Βιβλιοθήκης Πολυμέσων.' });
      }
    })();
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
    if (rec?.id) {
      await base44.entities.AppSetting.update(rec.id, { value: clean });
    }
    else setRec(await base44.entities.AppSetting.create({ key: MEDIA_KEY, value: clean }));
    applyMediaOverrides(clean);
    setOv(clean);
  };

  const run = async (id, fn, okText = 'Αποθηκεύτηκε ✓') => {
    setBusy(id); setMsg(null);
    try { await fn(); setMsg({ ok: true, text: okText }); }
    catch (e) { setMsg({ ok: false, text: e.message }); }
    finally { setBusy(null); setProgress(0); }
  };

  // Το μοναδικό σημείο ανεβάσματος αρχείων είναι η κεντρική βιβλιοθήκη.
  const pick = (id, mode, ref, index, surface = surfaceFilter) => { target.current = { id, mode, index, surface }; ref.current?.click(); };

  const onFiles = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = '';
    const t = target.current;
    if (!files.length || !t || t.mode !== 'library') return;
    await run('library-upload', async () => {
      const urls = [];
      for (let i = 0; i < files.length; i++) {
        const uploaded = await uploadMedia(files[i], (p) => setProgress((i + p) / files.length));
        urls.push(uploaded.url);
      }
      const librarySurfaces = { ...(ov.librarySurfaces || {}) };
      for (const url of urls) if (t.surface && t.surface !== 'all' && t.surface !== 'preview') librarySurfaces[url] = t.surface;
      await save({ ...ov, librarySurfaces });
      await refreshLibrary();
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
    for (const slot of MODE_COVER_SLOTS.filter((item) => item.modeId !== 'pedi_extended' && !NEW_MODES.some((mode) => mode.id === item.modeId))) {
      const src = ov[slot.id] || (ov.emptyModeCovers?.includes(slot.id) || clearedImages ? '' : DEFAULTS[slot.id]);
      if (!src) missing.push({ surface: 'tablet', label: slot.label, where: 'Εξώφυλλο επιλογής Mode στο Tablet / Forms' });
    }
    for (const mode of NEW_MODES) {
      const saved = ov.modeMedia?.[mode.id] || {};
      const sections = Array.isArray(saved.sections) && saved.sections.length
        ? saved.sections
        : (MODE_MEDIA_SECTIONS[mode.id] || []).map((item) => ({ ...item, image: '' }));
      const gallery = Array.isArray(saved.gallery) ? saved.gallery.filter(Boolean) : [];
      if (!saved.hero) missing.push({ surface: 'site', label: `${mode.name} — Hero`, where: 'Κεντρική εικόνα παρουσίασης του Mode' });
      if (!saved.cover && !ov[`modeCover_${mode.id}`]) missing.push({ surface: 'tablet', label: `${mode.name} — Cover`, where: 'Ξεχωριστό εξώφυλλο επιλογής Mode στο Tablet / Forms' });
      for (const section of sections) {
        if (!section.image) missing.push({ surface: 'tablet', label: `${mode.name} — ${section.label}`, where: 'Εικόνα ενότητας στο Tablet Setup' });
      }
      if (gallery.length < 6) missing.push({ surface: 'site', label: `${mode.name} — Gallery (${gallery.length}/6)`, where: 'Απαιτούνται έξι αριθμημένες εικόνες Gallery 01–06' });
    }
    for (const gallery of GALLERIES) {
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
      <AVControlRoom refreshKey={mediaRevision} />
      <input ref={libraryOne} type="file" accept={MEDIA_ACCEPT} hidden onChange={onFiles} />

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

      <ComicPanel className="bg-card">
        <div className="font-heading text-lg">ΠΡΟΟΡΙΣΜΟΣ ΠΟΛΥΜΕΣΩΝ</div>
        <p className="mt-1 text-xs text-foreground/60">Επίλεξε πού ανήκει το υλικό. Οι καρτέλες φιλτράρουν τα σημεία και τη βιβλιοθήκη αρχείων. Τα νέα αρχεία ανεβαίνουν μόνο από την κεντρική βιβλιοθήκη.</p>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <button type="button" onClick={() => setSurfaceFilter("all")} className={surfaceFilter === "all" ? "rounded-xl border border-primary bg-primary/15 p-3 text-left" : "rounded-xl border border-border bg-secondary/40 p-3 text-left"}><div className="text-sm font-black">ΟΛΑ</div><div className="text-[10px] text-foreground/55">Όλα τα σημεία</div></button>
          {SURFACES.map((surface) => <button key={surface.id} type="button" onClick={() => setSurfaceFilter(surface.id)} className={surfaceFilter === surface.id ? "rounded-xl border border-primary bg-primary/15 p-3 text-left" : "rounded-xl border border-border bg-secondary/40 p-3 text-left"}><div className="text-sm font-black">{surface.label}</div><div className="text-[10px] text-foreground/55">{surface.description}</div></button>)}
          <button type="button" onClick={() => setSurfaceFilter("preview")} className={surfaceFilter === "preview" ? "rounded-xl border border-primary bg-primary/15 p-3 text-left" : "rounded-xl border border-border bg-secondary/40 p-3 text-left"}><div className="text-sm font-black">LIVE PREVIEW</div><div className="text-[10px] text-foreground/55">Πραγματικές σελίδες</div></button>
        </div>
      </ComicPanel>

      {surfaceFilter === "preview" && <AdminMediaPreview />}

      {showSurface("site", "forms", "tv", "tablet", "mobile") && (
      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg">🖼️ ΠΟΛΥΜΕΣΑ ΑΝΑ ΣΗΜΕΙΟ</div>
        <p className="text-xs text-foreground/60">Κάθε αρχείο ανεβαίνει μία φορά στην κεντρική βιβλιοθήκη. Από εδώ συνδέεις υπάρχοντα αρχεία στα σημεία εμφάνισης ή αφαιρείς μόνο τη σύνδεση.</p>
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
        <p className="text-xs text-foreground/60">Ανέβασε ξεχωριστά τα δύο βίντεο. Το WELCOME παίζει όταν η TV συνδέεται στη συνεδρία. Το COUNTDOWN παίζει όταν ξεκινά το παιχνίδι από το Tablet.</p>
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
                  {src && <ComicButton size="sm" variant="dark" disabled={!!busy} onClick={() => run(slot.id, () => save({ ...ov, [slot.id]: undefined }), 'Το βίντεο αφαιρέθηκε ✓')}>🗑 Αφαίρεση</ComicButton>}
                </div>
                <Progress id={slot.id} />
              </div>
            );
          })}
        </div>
      </ComicPanel>
      )}

      {showSurface('tablet', 'forms') && (
      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg">🎮 ΕΞΩΦΥΛΛΟ ΦΩΤΟΓΡΑΦΙΑΣ ΑΝΑ MODE</div>
        <p className="text-xs text-foreground/60">Οι φωτογραφίες εμφανίζονται στην επιλογή Mode του Tablet και στη φόρμα επιλογής Mode. Τα PAJAMA LOCKDOWN 18+ και BEACH BAR HOME LOCKDOWN διαχειρίζονται στην ενότητα πολυμέσων των νέων Modes.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MODE_COVER_SLOTS.filter((s) => s.modeId !== 'pedi_extended' && !NEW_MODES.some((mode) => mode.id === s.modeId) && showSurface(...(s.surfaces || ['tablet', 'forms']))).map((s) => {
            const src = ov[s.id] || (ov.emptyModeCovers?.includes(s.id) || ov.clearAllPhotos || ov.clearAllMedia ? '' : DEFAULTS[s.id]);
            return (
              <div key={s.id} className="border-2 border-border/40 rounded-lg p-2 bg-secondary/40">
                {src ? <Thumb src={src} className="w-full aspect-video rounded" /> : <div className="w-full aspect-video rounded bg-black/40 flex items-center justify-center text-xs text-foreground/50">Χωρίς φωτογραφία</div>}
                <div className="font-bold text-sm mt-2">{s.label}</div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <select aria-label={`Εικόνα εξωφύλλου ${s.label}`} value="" disabled={!!busy} onChange={(e) => { if (e.target.value) assignMediaToSlot(e.target.value, s.id); }} className="w-full rounded-lg border border-border bg-background px-2 py-2 text-xs"><option value="">Σύνδεση εικόνας από κεντρική βιβλιοθήκη…</option>{library.filter((file) => file.kind === 'image' || file.kind === 'graphic').map((file) => <option key={file.url} value={file.url}>{file.name}</option>)}</select>
                  <ComicButton size="sm" variant="dark" disabled={!!busy} onClick={() => reset(s.id)}>↩︎ Αρχική φωτογραφία</ComicButton>
                </div>
                <Progress id={s.id} />
              </div>
            );
          })}
        </div>
      </ComicPanel>
      )}

      {showSurface('site', 'forms', 'tablet') && (
      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg">🎮 ΔΙΑΧΕΙΡΙΣΗ ΣΥΝΔΕΣΕΩΝ ΑΝΑ MODE</div>
        <p className="text-xs text-foreground/60">Τα Modes χρησιμοποιούν αρχεία που υπάρχουν ήδη στην κεντρική βιβλιοθήκη. Δεν γίνεται νέο ανέβασμα από αυτή την ενότητα.</p>
        <GameMediaLibraries value={ov} files={library} onSave={save} onRefresh={refreshLibrary} />
        <div className="border-t border-border/60 pt-4">
        <ModeMediaManager
          value={ov.modeMedia || {}}
          files={library}
          onRefresh={refreshLibrary}
          disabled={!!busy}
          onSave={(modeMedia) => run('mode-media', () => save({ ...ov, modeMedia }), 'Το Πολυμέσα Mode αποθηκεύτηκε ✓')}
        />
        </div>
      </ComicPanel>
      )}

      {showSurface('site', 'forms') && (
      <>
      {GALLERIES.filter((g) => showSurface(...(g.surfaces || ['site']))).map((g) => {
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
            <div key={f.name} className="border-2 border-border/40 rounded overflow-hidden bg-secondary/40">
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
    </div>
  );
}
