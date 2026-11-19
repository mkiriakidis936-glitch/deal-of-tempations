import React, { useRef, useState } from 'react';
import { MEDIA_MODES, MODE_MEDIA_SECTIONS } from '@/data/modes/modeRegistry';
import { MODE_COVERS } from '@/data/brandArt';
import { uploadMedia } from '@/lib/media';

const emptyMode = { hero: '', cover: '', sections: [], gallery: [], cards: [], trailer: '' };
const inputClass = 'rounded-lg border border-border bg-background px-3 py-2 text-sm';
const imageAccept = '.jpg,.jpeg,.png,.webp,.gif,.avif,.svg,.heic';
const videoAccept = '.mp4,.webm,.mov';

function Thumb({ src, video = false, className = '' }) {
  if (!src) return <div className={`flex items-center justify-center rounded-lg bg-black/30 text-xs text-foreground/45 ${className}`}>Χωρίς αρχείο</div>;
  return video
    ? <video src={src} controls muted playsInline preload="metadata" className={`rounded-lg bg-black object-cover ${className}`} />
    : <img src={src} alt="" loading="lazy" className={`rounded-lg object-cover ${className}`} />;
}

function expectedNameFor(modeId, field, item) {
  if (field === 'hero') return 'hero.jpg';
  if (field === 'cover') return 'cover.jpg';
  if (field.startsWith('section:')) return item?.filename || MODE_MEDIA_SECTIONS[modeId]?.find((section) => section.id === field.slice(8))?.filename || '';
  if (field.startsWith('gallery:')) return ['lockdown', 'beach_bar'].includes(modeId) ? `${modeId === 'lockdown' ? 'lockdown' : 'beach'}_gallery_${String(Number(field.slice(8)) + 1).padStart(2, '0')}.jpg` : '';
  return '';
}

function validateSelectedFile(file, expectedName, video) {
  if (!file) return 'Δεν επιλέχθηκε αρχείο.';
  const extension = file.name.split('.').pop()?.toLowerCase();
  const allowed = video ? ['mp4', 'webm', 'mov'] : ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg', 'heic', 'heif'];
  if (!allowed.includes(extension)) return video ? 'Για trailer επίλεξε MP4, WEBM ή MOV.' : 'Για εικόνα επίλεξε JPG, PNG, WEBP, GIF, AVIF, SVG ή HEIC.';
  return '';
}

export default function ModeMediaManager({ value = {}, files = [], onSave, onRefresh, disabled = false }) {
  const [selected, setSelected] = useState(MEDIA_MODES[0].id);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [chosen, setChosen] = useState({});
  const fileInputs = useRef({});
  const mode = MEDIA_MODES.find((item) => item.id === selected) || MEDIA_MODES[0];
  const saved = value[selected] || {};
  const data = {
    ...emptyMode,
    cover: MODE_COVERS[`modeCover_${selected}`] || '',
    ...saved,
    sections: Array.isArray(saved.sections) && saved.sections.length
      ? saved.sections
      : (MODE_MEDIA_SECTIONS[selected] || []).map((item) => ({ ...item, image: '' })),
    gallery: Array.from({ length: 6 }, (_, index) => saved.gallery?.[index] || ''),
  };
  const imageFiles = files.filter((file) => file.kind === 'image' || file.kind === 'graphic');
  const videoFiles = files.filter((file) => file.kind === 'video');
  const availableFor = (field) => field === 'trailer' ? videoFiles : imageFiles;

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
    const validationError = validateSelectedFile(file, expectedNameFor(selected, field), field === 'trailer');
    if (validationError) {
      setError(validationError);
      setNotice('');
      return;
    }
    persist(setField(field, url), 'Το αρχείο συνδέθηκε στη συγκεκριμένη θέση.');
  };

  const uploadToField = async (field, file, item = null) => {
    const video = field === 'trailer';
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
    const problem = validateSelectedFile(file, expectedNameFor(selected, field, item), field === 'trailer');
    return problem ? 'ΛΑΘΟΣ ΑΡΧΕΙΟ: ' + problem : '✓ Το όνομα και ο τύπος αρχείου είναι σωστά';
  };

  const triggerUpload = (field) => fileInputs.current[field]?.click();
  const uploadControl = (field, label, item = null) => (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={(element) => { fileInputs.current[field] = element; }}
        type="file"
        accept={field === 'trailer' ? videoAccept : imageAccept}
        className="hidden"
        disabled={disabled || !!busy}
        onChange={(event) => uploadToField(field, event.target.files?.[0], item)}
        aria-label={`Ανέβασμα από υπολογιστή: ${label}`}
      />
      <button type="button" disabled={disabled || !!busy} onClick={() => triggerUpload(field)} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white disabled:opacity-40">
        Ανέβασμα από υπολογιστή
      </button>
      <span className="text-[10px] text-foreground/50">Αναμενόμενο: {expectedNameFor(selected, field, item) || (field === 'trailer' ? 'MP4 / WEBM / MOV' : 'εικόνα')}</span>
    </div>
  );

  const updateItems = (field, items) => persist({ ...data, [field]: items });
  const addItem = (field) => {
    const id = `${field}-${Date.now()}`;
    updateItems(field, [...(data[field] || []), { id, label: field === 'sections' ? 'Νέα ενότητα' : 'Νέα κάρτα', image: '' }]);
  };
  const updateLabel = (field, id, label) => updateItems(field, (data[field] || []).map((item) => item.id === id ? { ...item, label } : item));
  const removeItem = (field, id) => updateItems(field, (data[field] || []).filter((item) => item.id !== id));

  const libraryPicker = (field, label, item = null) => (
    <div className="flex flex-wrap gap-2">
      <select aria-label={label} className={inputClass} value={chosen[field] || ''} disabled={disabled || !!busy} onChange={(event) => setChosen((current) => ({ ...current, [field]: event.target.value }))}>
        <option value="">Επιλογή από τη βιβλιοθήκη</option>
        {availableFor(field).map((file) => <option key={file.url} value={file.url}>{file.name}</option>)}
      </select>
      <button type="button" disabled={disabled || !!busy || !chosen[field]} onClick={() => { assign(field, chosen[field]); setChosen((current) => ({ ...current, [field]: '' })); }} className="rounded-lg border border-border px-3 py-2 text-xs">Σύνδεση υπάρχοντος</button>
    </div>
  );

  return (
    <section className="space-y-3">
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-[#17131d] to-[#292039] p-4 sm:p-5 text-white">
        <div className="text-[10px] font-black tracking-[.2em] text-primary">MODE MEDIA CENTER</div>
        <div className="mt-1 font-heading text-2xl">Φωτογραφική ταυτότητα ανά Mode</div>
        <p className="mt-1 text-xs text-white/65">Κάθε θέση δέχεται απευθείας ανέβασμα από τον υπολογιστή ή επιλογή ήδη ανεβασμένου αρχείου. Όπου υπάρχει καθορισμένο όνομα στις προδιαγραφές, ελέγχεται πριν γίνει το ανέβασμα.</p>
        <div className="mt-4 grid grid-cols-2 xl:grid-cols-4 gap-2">
          {MEDIA_MODES.map((item) => (
            <button key={item.id} type="button" disabled={disabled || !!busy} onClick={() => { setSelected(item.id); setError(''); setNotice(''); }} className={`rounded-xl border p-3 text-left transition ${selected === item.id ? 'border-primary bg-primary/20' : 'border-white/15 bg-white/5 hover:bg-white/10'}`}>
              <div className="text-xs font-black">{item.icon} {item.name}</div>
              <div className="mt-1 text-[10px] text-white/55">{(value[item.id]?.gallery || []).filter(Boolean).length}/6 gallery · {(value[item.id]?.sections || []).length || (MODE_MEDIA_SECTIONS[item.id] || []).length} ενότητες</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 space-y-4">
        <div>
          <div className="font-heading text-xl">{mode.icon} {mode.name}</div>
          <p className="mt-1 text-xs text-foreground/55">Οι θέσεις εμφανίζουν το απαιτούμενο όνομα αρχείου, προεπισκόπηση και κατάσταση σύνδεσης.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { id: 'hero', label: 'Κεντρική εικόνα / Hero' },
            { id: 'cover', label: 'Cover image' },
          ].map((slot) => (
            <div key={slot.id} className="rounded-xl border border-border/60 bg-secondary/30 p-3">
              <Thumb src={data[slot.id]} className="mb-3 aspect-video w-full" />
              <div className="text-sm font-bold">{slot.label}</div>
              <div className="mt-1 text-[11px] text-foreground/55">Επιτρεπόμενος τύπος: εικόνα</div>
              <div className="mt-1 text-[10px]">{assignmentStatus(slot.id, data[slot.id])}</div>
              <div className="mt-2 space-y-2">
                {uploadControl(slot.id, slot.label)}
                {libraryPicker(slot.id, slot.label)}
                {data[slot.id] && <button type="button" disabled={disabled || !!busy} onClick={() => persist({ ...data, [slot.id]: '', ...(slot.id === 'cover' ? { coverCleared: true } : {}) }, 'Η σύνδεση αφαιρέθηκε. Το αρχείο παραμένει στη βιβλιοθήκη.')} className="rounded-lg border border-border px-3 py-2 text-xs">Αφαίρεση σύνδεσης</button>}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border/60 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div><div className="font-bold text-sm">Φωτογραφίες ανά ενότητα</div><div className="text-[11px] text-foreground/55">Εμφάνιση στο Tablet Setup.</div></div>
            <button type="button" disabled={disabled || !!busy} onClick={() => addItem('sections')} className="rounded-lg border border-border px-3 py-2 text-xs font-bold">+ Προαιρετική ενότητα</button>
          </div>
          {data.sections.map((item) => {
            const field = `section:${item.id}`;
            const required = (MODE_MEDIA_SECTIONS[selected] || []).some((section) => section.id === item.id);
            return (
              <div key={item.id} className="grid sm:grid-cols-[1fr_160px_auto] gap-2 items-center rounded-lg bg-secondary/40 p-2">
                <div className="min-w-0">
                  <input defaultValue={item.label || ''} disabled={disabled || !!busy} onBlur={(e) => { if (e.target.value !== (item.label || '')) updateLabel('sections', item.id, e.target.value); }} className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm" aria-label="Τίτλος ενότητας" />
                  <div className="mt-1 text-[10px] text-foreground/55">Αναμενόμενο αρχείο αναφοράς: {item.filename || 'Δεν έχει οριστεί'} — γίνεται δεκτό οποιοδήποτε έγκυρο όνομα εικόνας</div>
                  <div className="mt-1 text-[10px]">{assignmentStatus(field, item.image, item)}</div>
                </div>
                <Thumb src={item.image} className="aspect-video w-full" />
                <div className="flex flex-col gap-1">
                  {uploadControl(field, item.label, item)}
                  {libraryPicker(field, 'Εικόνα ενότητας', item)}
                  {!required && <button type="button" disabled={disabled || !!busy} onClick={() => removeItem('sections', item.id)} className="rounded-lg border border-border px-2 py-2 text-xs">Αφαίρεση προαιρετικής ενότητας</button>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-border/60 p-3 space-y-3">
          <div>
            <div className="font-bold text-sm">Gallery — {data.gallery.filter(Boolean).length}/6 εικόνες</div>
            <div className="text-[11px] text-foreground/55">Κάθε αριθμημένη θέση δέχεται απευθείας οποιοδήποτε έγκυρο αρχείο εικόνας. Τα κενά δεν μετακινούν τις επόμενες εικόνες.</div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.gallery.map((src, index) => {
              const field = `gallery:${index}`;
              const filename = expectedNameFor(selected, field);
              return (
                <div key={index} className="rounded-lg border border-border/60 bg-secondary/30 p-2 space-y-2">
                  <div className="text-xs font-bold">{filename}</div>
                  <Thumb src={src} className="aspect-[4/3] w-full" />
                  <div className="text-[10px]">{assignmentStatus(field, src)}</div>
                  {uploadControl(field, filename)}
                  {libraryPicker(field, filename)}
                  {src && <button type="button" disabled={disabled || !!busy} onClick={() => persist(setField(field, ''), 'Η θέση Gallery καθαρίστηκε.')} className="w-full rounded-lg border border-border px-2 py-1.5 text-xs">Αφαίρεση σύνδεσης</button>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
          <div className="font-bold text-sm">Video trailer — Tablet Setup & Site mode page</div>
          <Thumb src={data.trailer} video className="mt-3 aspect-video w-full" />
          <div className="mt-1 text-[10px]">{assignmentStatus('trailer', data.trailer)}</div>
          <div className="mt-2 space-y-2">
            {uploadControl('trailer', 'Video trailer')}
            {libraryPicker('trailer', 'Video trailer')}
            {data.trailer && <button type="button" disabled={disabled || !!busy} onClick={() => persist({ ...data, trailer: '' }, 'Η σύνδεση αφαιρέθηκε. Το αρχείο παραμένει στη βιβλιοθήκη.')} className="rounded-lg border border-border px-3 py-2 text-xs">Αφαίρεση σύνδεσης</button>}
          </div>
        </div>

        {(error || notice) && <div className="text-sm" role="status">{error ? <span className="text-red-400">{error}</span> : <span className="text-emerald-400">{notice}</span>}</div>}
        {busy && <div className="text-xs text-foreground/55">Ανέβασμα / αποθήκευση σε εξέλιξη…</div>}
      </div>
    </section>
  );
}
