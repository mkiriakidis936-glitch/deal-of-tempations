import React, { useRef, useState } from 'react';
import { MEDIA_MODES, MODE_MEDIA_SECTIONS } from '@/data/modes/modeRegistry';
import { MODE_COVER_SLOTS } from '@/data/mediaSlots';
import { expectedNames, planAutoLinks, applyLinks } from '@/lib/autoLink';
import { MODE_COVERS } from '@/data/brandArt';
import { uploadMedia } from '@/lib/media';
import { IMAGE_ACCEPT, VIDEO_ACCEPT } from '@/lib/mediaKind';
import { modeFileName } from '@/lib/mediaManifest';

const emptyMode = { hero: '', cover: '', sections: [], gallery: [], cards: [], trailer: '', intro: '' };
// Πεδία που δέχονται βίντεο (τα υπόλοιπα δέχονται εικόνα).
const isVideoField = (field) => field === 'trailer' || field === 'intro';
const imageAccept = IMAGE_ACCEPT;
const videoAccept = VIDEO_ACCEPT;


function expectedNameFor(modeId, field, item) {
  // Ίδια ονόματα με τον Χάρτη media και το TXT (src/lib/mediaManifest.js).
  if (field.startsWith('section:')) return modeFileName(modeId, field, item?.filename || MODE_MEDIA_SECTIONS[modeId]?.find((section) => section.id === field.slice(8))?.filename || '');
  return modeFileName(modeId, field);
}

function validateSelectedFile(file, expectedName, video) {
  if (!file) return 'Δεν επιλέχθηκε αρχείο.';
  const extension = file.name.split('.').pop()?.toLowerCase();
  const allowed = video ? ['mp4', 'm4v', 'webm', 'mov'] : ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg', 'heic', 'heif'];
  if (!allowed.includes(extension)) return video ? 'Για βίντεο επίλεξε MP4, M4V, WEBM ή MOV.' : 'Για εικόνα επίλεξε JPG, PNG, WEBP, GIF, AVIF, SVG ή HEIC.';
  return '';
}

export default function ModeMediaManager({ value = {}, files = [], onSave, onRefresh, disabled = false }) {
  const [selected, setSelected] = useState(MEDIA_MODES[0].id);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const fileInputs = useRef({});
  const mode = MEDIA_MODES.find((item) => item.id === selected) || MEDIA_MODES[0];
  const saved = value[selected] || {};
  const data = {
    ...emptyMode,
    cover: MODE_COVERS[`modeCover_${selected}`] || '',
    ...saved,
    // Πάντα η τρέχουσα λίστα θέσεων (και οι νέες), με όποια φωτογραφία έχει ήδη αποθηκευτεί για το ίδιο id.
    sections: (MODE_MEDIA_SECTIONS[selected] || []).map((item) => ({ ...item, image: (Array.isArray(saved.sections) ? saved.sections : []).find((s) => s?.id === item.id)?.image || '' })),
    gallery: Array.from({ length: 6 }, (_, index) => saved.gallery?.[index] || ''),
  };
  const imageFiles = files.filter((file) => file.kind === 'image' || file.kind === 'graphic');
  const videoFiles = files.filter((file) => file.kind === 'video');
  const availableFor = (field) => isVideoField(field) ? videoFiles : imageFiles;

  const persist = async (next, message = 'Η σύνδεση αποθηκεύτηκε.') => {
    setBusy('save');
    setError('');
    setNotice('');
    try {
      await onSave({ ...value, [selected]: next });
      setNotice(message);
    } catch (e) {
      setError(e?.message || 'Δεν αποθηκεύτηκαν οι αλλαγές.');
    } finally {
      setBusy('');
    }
  };

  const setField = (field, url) => {
    const next = { ...data };
    if (field.startsWith('section:')) {
      const id = field.slice('section:'.length);
      next.sections = data.sections.map((item) => item.id === id ? { ...item, image: url } : item);
    } else if (field.startsWith('gallery:')) {
      const index = Number(field.slice('gallery:'.length));
      next.gallery = [...data.gallery];
      next.gallery[index] = url;
    } else if (field.startsWith('card:')) {
      const id = field.slice('card:'.length);
      next.cards = data.cards.map((item) => item.id === id ? { ...item, image: url } : item);
    } else {
      next[field] = url;
      if (field === 'cover') next.coverCleared = false;
    }
    return next;
  };

  const assign = (field, url) => {
    if (!url) return;
    const file = files.find((item) => item.url === url);
    const validationError = validateSelectedFile(file, expectedNameFor(selected, field), isVideoField(field));
    if (validationError) {
      setError(validationError);
      setNotice('');
      return;
    }
    persist(setField(field, url), 'Το αρχείο συνδέθηκε στη συγκεκριμένη θέση.');
  };

  const uploadToField = async (field, file, item = null) => {
    const video = isVideoField(field);
    const expected = expectedNameFor(selected, field, item);
    const validationError = validateSelectedFile(file, expected, video);
    if (validationError) {
      setError(validationError);
      setNotice('');
      return;
    }
    setBusy(field);
    setError('');
    setNotice('');
    try {
      const uploaded = await uploadMedia(file);
      if (!uploaded?.url) throw new Error('Ο server δεν επέστρεψε σύνδεσμο για το αρχείο.');
      await onSave({ ...value, [selected]: setField(field, uploaded.url) });
      await onRefresh?.();
      setNotice(`Ανέβηκε και συνδέθηκε: ${file.name}`);
    } catch (e) {
      setError(e?.message || 'Το ανέβασμα ή η σύνδεση απέτυχε.');
    } finally {
      setBusy('');
      if (fileInputs.current[field]) fileInputs.current[field].value = '';
    }
  };

  const assignmentStatus = (field, url, item = null) => {
    if (!url) return 'Εκκρεμεί αρχείο';
    const file = files.find((entry) => entry.url === url);
    if (!file) return 'Προεπιλεγμένο ή μη καταχωρισμένο αρχείο — δεν επαληθεύτηκε';
    const problem = validateSelectedFile(file, expectedNameFor(selected, field, item), isVideoField(field));
    return problem ? 'ΛΑΘΟΣ ΑΡΧΕΙΟ: ' + problem : '✓ Το όνομα και ο τύπος αρχείου είναι σωστά';
  };

  // Συνδέει ΜΟΝΟ κενές θέσεις, με βάση το όνομα αρχείου της βιβλιοθήκης (π.χ. classic_setup.jpg → Classic / Προετοιμασία).
  const autoLink = async () => {
    const plan = planAutoLinks(files, expectedNames(MEDIA_MODES, MODE_MEDIA_SECTIONS, MODE_COVER_SLOTS).filter((e) => e.modeId));
    if (!plan.links.length) { setError('Δεν βρέθηκε αρχείο στη βιβλιοθήκη με όνομα που ταιριάζει σε θέση. Ανέβασε πρώτα τις εικόνες (π.χ. classic_setup.jpg).'); setNotice(''); return; }
    const nextValue = { ...value };
    for (const { id } of MEDIA_MODES) {
      const links = plan.links.filter((l) => l.modeId === id);
      if (links.length) nextValue[id] = applyLinks({ ...(value[id] || {}), sections: value[id]?.sections || [] }, links);
    }
    const before = JSON.stringify(value);
    if (JSON.stringify(nextValue) === before) { setNotice(`Βρέθηκαν ${plan.links.length} αρχεία, αλλά όλες οι θέσεις τους είναι ήδη γεμάτες.`); setError(''); return; }
    setBusy('save'); setError(''); setNotice('');
    try {
      await onSave(nextValue);
      setNotice(`Αυτόματη σύνδεση: ${plan.links.length} αρχεία ταίριαξαν σε θέσεις (οι ήδη γεμάτες δεν άλλαξαν).${plan.ambiguous.length ? ` Προσοχή: ${plan.ambiguous.length} θέσεις είχαν πολλά αρχεία με το ίδιο όνομα — πήρε το νεότερο.` : ''}`);
    } catch (e) {
      setError(e?.message || 'Η αυτόματη σύνδεση απέτυχε.');
    } finally { setBusy(''); }
  };

  const triggerUpload = (field) => fileInputs.current[field]?.click();
  const fileInput = (field, label, item = null) => (
    <input
      ref={(element) => { fileInputs.current[field] = element; }}
      type="file"
      accept={isVideoField(field) ? videoAccept : imageAccept}
      className="hidden"
      disabled={disabled || !!busy}
      onChange={(event) => uploadToField(field, event.target.files?.[0], item)}
      aria-label={`Ανέβασμα από υπολογιστή: ${label}`}
    />
  );

  const updateItems = (field, items) => persist({ ...data, [field]: items });
  const addItem = (field) => {
    const id = `${field}-${Date.now()}`;
    updateItems(field, [...(data[field] || []), { id, label: field === 'sections' ? 'Νέα ενότητα' : 'Νέα κάρτα', image: '' }]);
  };
  const updateLabel = (field, id, label) => updateItems(field, (data[field] || []).map((item) => item.id === id ? { ...item, label } : item));
  const removeItem = (field, id) => updateItems(field, (data[field] || []).filter((item) => item.id !== id));

  // Ένα «πλακίδιο» φωτογραφίας: γεμίζει το πλαίσιο· αν είναι άδειο, πατιέται για ανέβασμα.
  const Tile = ({ field, src, label, item = null, video = false, ratio = 'aspect-video', onClear }) => {
    const status = assignmentStatus(field, src, item);
    const uploading = busy === field;
    return (
      <div className="space-y-1.5">
        {fileInput(field, label, item)}
        {src ? (
          <div className={`relative overflow-hidden rounded-2xl bg-black ${ratio}`}>
            {video
              ? <video src={`${src}#t=0.1`} controls playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" />
              : <img src={src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
            {uploading && <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-xs font-bold">Ανέβασμα…</div>}
          </div>
        ) : (
          <button type="button" disabled={disabled || !!busy} onClick={() => triggerUpload(field)}
            className={`flex w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-white/20 bg-white/[0.03] text-white/55 ${ratio}`}>
            <span className="text-2xl leading-none">＋</span>
            <span className="px-2 text-center text-[11px] font-semibold">{uploading ? 'Ανέβασμα…' : video ? 'Προσθήκη βίντεο' : 'Προσθήκη φωτογραφίας'}</span>
          </button>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          {src && <button type="button" disabled={disabled || !!busy} onClick={() => triggerUpload(field)} className="h-9 rounded-full bg-[#E8C26B] px-3 text-xs font-bold text-black">Αλλαγή</button>}
          <select aria-label={`${label} — από τη βιβλιοθήκη`} value="" disabled={disabled || !!busy}
            onChange={(event) => { if (event.target.value) assign(field, event.target.value); }}
            className="h-9 min-w-0 basis-full rounded-full border border-white/10 bg-[#2C2C2E] px-3 text-xs">
            <option value="">Από βιβλιοθήκη…</option>
            {availableFor(field).map((file) => <option key={file.url} value={file.url}>{file.name}</option>)}
          </select>
          {src && onClear && <button type="button" disabled={disabled || !!busy} onClick={onClear} className="h-9 rounded-full px-2 text-xs text-white/55 underline">Αφαίρεση</button>}
        </div>
        {status.startsWith('ΛΑΘΟΣ') && <div className="text-[11px] text-[#FF8A80]">{status}</div>}
      </div>
    );
  };

  const Block = ({ title, hint, action, children }) => (
    <section className="rounded-3xl bg-[#1C1C1E] p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0"><h3 className="text-base font-bold text-white">{title}</h3>{hint && <p className="text-xs text-white/55">{hint}</p>}</div>
        {action}
      </div>
      {children}
    </section>
  );

  return (
    <div className="space-y-3 text-[#F5F1E8]">
      <header className="rounded-3xl border border-[#E8C26B]/30 bg-[#17140C] p-4 sm:p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#E8C26B]">Mode Media Center</div>
        <h2 className="mt-1 text-xl font-bold sm:text-2xl">Φωτογραφίες & βίντεο ανά mode</h2>
        <p className="mt-1 text-xs text-white/60">Διάλεξε mode και πάτα σε οποιοδήποτε πλαίσιο για να ανεβάσεις. Εμφανίζονται σε Tablet, TV, κινητά και Site.</p>
        <button type="button" disabled={disabled || !!busy} onClick={autoLink}
          className="mt-3 h-10 rounded-full bg-[#E8C26B] px-4 text-sm font-bold text-black disabled:opacity-50">🔗 Αυτόματη σύνδεση από τη βιβλιοθήκη (όλα τα modes)</button>
        <div className="-mx-4 mt-3 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 xl:grid-cols-5">
          {MEDIA_MODES.map((item) => {
            const on = selected === item.id;
            const filled = (value[item.id]?.gallery || []).filter(Boolean).length;
            return (
              <button key={item.id} type="button" disabled={disabled || !!busy} onClick={() => { setSelected(item.id); setError(''); setNotice(''); }} aria-pressed={on}
                className={`w-40 shrink-0 snap-start rounded-2xl border p-3 text-left sm:w-auto ${on ? 'border-[#E8C26B] bg-[#E8C26B]/15' : 'border-white/10 bg-black/30'}`}>
                <div className="truncate text-sm font-bold">{item.icon} {item.name}</div>
                <div className="mt-0.5 text-[11px] text-white/55">{filled}/6 gallery</div>
              </button>
            );
          })}
        </div>
      </header>

      <Block title={`${mode.icon || ''} ${mode.name}`} hint="Κεντρική εικόνα: TV, κινητά, Tablet, Site και κεφαλίδα της φόρμας. Εξώφυλλο: κάρτες επιλογής mode.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><div className="mb-1.5 text-xs font-semibold text-white/70">Κεντρική εικόνα</div><Tile field="hero" src={data.hero} label="Κεντρική εικόνα" onClear={() => persist({ ...data, hero: '' }, 'Η κεντρική εικόνα αφαιρέθηκε.')} /></div>
          <div><div className="mb-1.5 text-xs font-semibold text-white/70">Εξώφυλλο</div><Tile field="cover" src={data.cover} label="Εξώφυλλο" onClear={() => persist({ ...data, cover: '', coverCleared: true }, 'Το εξώφυλλο αφαιρέθηκε.')} /></div>
        </div>
      </Block>

      <Block title="Φωτογραφίες ανά φάση" hint="Αλλάζουν μόνες τους σε TV και κινητά όταν το παιχνίδι φτάνει στη φάση."
        action={<button type="button" disabled={disabled || !!busy} onClick={() => addItem('sections')} className="h-9 shrink-0 rounded-full bg-[#2C2C2E] px-3 text-xs font-semibold">＋ Ενότητα</button>}>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
          {data.sections.map((item) => {
            const field = `section:${item.id}`;
            const required = (MODE_MEDIA_SECTIONS[selected] || []).some((section) => section.id === item.id);
            return (
              <div key={item.id} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <input defaultValue={item.label || ''} disabled={disabled || !!busy} aria-label="Όνομα ενότητας"
                    onBlur={(e) => { if (e.target.value !== (item.label || '')) updateLabel('sections', item.id, e.target.value); }}
                    className="h-9 min-w-0 flex-1 rounded-xl border border-transparent bg-transparent px-1 text-sm font-semibold focus:border-white/15 focus:bg-black/30" />
                  {!required && <button type="button" disabled={disabled || !!busy} onClick={() => removeItem('sections', item.id)} aria-label="Διαγραφή ενότητας" className="h-9 w-9 shrink-0 rounded-full text-white/50">✕</button>}
                </div>
                <Tile field={field} src={item.image} label={item.label} item={item} onClear={() => persist(setField(field, ''), 'Η φωτογραφία της ενότητας αφαιρέθηκε.')} />
              </div>
            );
          })}
        </div>
      </Block>

      <Block title={`Gallery · ${data.gallery.filter(Boolean).length}/6`} hint="Εμφανίζεται στη σελίδα του mode στο Site και στο Tablet.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {data.gallery.map((src, index) => (
            <Tile key={index} field={`gallery:${index}`} src={src} label={`Gallery ${index + 1}`} ratio="aspect-[4/5]" onClear={() => persist(setField(`gallery:${index}`, ''), 'Η θέση άδειασε.')} />
          ))}
        </div>
      </Block>

      <Block title="🎬 Intro βίντεο TV" hint="Παίζει στην TV στην αρχή κάθε νέας παρτίδας αυτού του mode, πριν από τους κανόνες. Το Tablet μπορεί να το ξαναπαίξει. Αν μείνει κενό, παίζει το γενικό «Intro παιχνιδιού» (Site & TV)." >
        <div className="max-w-xl"><Tile field="intro" src={data.intro} label="Intro βίντεο TV" video onClear={() => persist({ ...data, intro: '' }, 'Το intro αφαιρέθηκε.')} /></div>
      </Block>

      <Block title="Βίντεο trailer" hint="Tablet Setup και σελίδα του mode στο Site.">
        <div className="max-w-xl"><Tile field="trailer" src={data.trailer} label="Βίντεο trailer" video onClear={() => persist({ ...data, trailer: '' }, 'Το βίντεο αφαιρέθηκε.')} /></div>
      </Block>

      {(error || notice) && <div className="rounded-2xl bg-[#1C1C1E] px-4 py-3 text-sm" role="status">{error ? <span className="text-[#FF8A80]">{error}</span> : <span className="text-[#7BE495]">{notice}</span>}</div>}
    </div>
  );
}
