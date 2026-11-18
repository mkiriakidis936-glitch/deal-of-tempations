import React, { useState } from 'react';
import { NEW_MODES } from '@/data/modes/modeRegistry';
import { MODE_COVERS } from '@/data/brandArt';

const emptyMode = { hero: '', cover: '', sections: [], gallery: [], cards: [], trailer: '' };
const inputClass = 'rounded-lg border border-border bg-background px-3 py-2 text-sm';

function Thumb({ src, video = false, className = '' }) {
  if (!src) return <div className={`flex items-center justify-center rounded-lg bg-black/30 text-xs text-foreground/45 ${className}`}>Χωρίς αρχείο</div>;
  return video
    ? <video src={src} controls muted playsInline preload="metadata" className={`rounded-lg bg-black object-cover ${className}`} />
    : <img src={src} alt="" loading="lazy" className={`rounded-lg object-cover ${className}`} />;
}

export default function ModeMediaManager({ value = {}, files = [], onSave, disabled = false }) {
  const [selected, setSelected] = useState(NEW_MODES[0].id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [chosen, setChosen] = useState({});
  const [chosenGallery, setChosenGallery] = useState({});
  const mode = NEW_MODES.find((item) => item.id === selected) || NEW_MODES[0];
  const data = { ...emptyMode, cover: MODE_COVERS[`modeCover_${selected}`] || '', ...(value[selected] || {}) };
  const imageFiles = files.filter((file) => file.kind === 'image' || file.kind === 'graphic');
  const videoFiles = files.filter((file) => file.kind === 'video');
  const availableFor = (field) => field === 'trailer' ? videoFiles : imageFiles;

  const persist = async (next, message = 'Η σύνδεση αποθηκεύτηκε.') => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await onSave({ ...value, [selected]: next });
      setNotice(message);
    } catch (e) {
      setError(e?.message || 'Δεν αποθηκεύτηκαν οι αλλαγές.');
    } finally {
      setBusy(false);
    }
  };

  const assign = (field, url) => {
    if (!url) return;
    const next = { ...data };
    if (field.startsWith('section:')) {
      const id = field.slice('section:'.length);
      next.sections = (data.sections || []).map((item) => item.id === id ? { ...item, image: url } : item);
    } else if (field.startsWith('card:')) {
      const id = field.slice('card:'.length);
      next.cards = (data.cards || []).map((item) => item.id === id ? { ...item, image: url } : item);
    } else next[field] = url;
    persist(next, 'Το υπάρχον αρχείο συνδέθηκε με το Mode.');
    setChosen((current) => ({ ...current, [field]: '' }));
  };

  const addGalleryFiles = () => {
    const urls = chosenGallery[selected] || [];
    if (!urls.length) return;
    persist({ ...data, gallery: [...new Set([...(data.gallery || []), ...urls])] }, 'Τα υπάρχοντα αρχεία συνδέθηκαν με τη Gallery.');
    setChosenGallery((current) => ({ ...current, [selected]: [] }));
  };

  const updateItems = (field, items) => persist({ ...data, [field]: items });
  const addItem = (field) => {
    const id = `${field}-${Date.now()}`;
    updateItems(field, [...(data[field] || []), { id, label: field === 'sections' ? 'Νέα ενότητα' : 'Νέα κάρτα', image: '' }]);
  };
  const updateLabel = (field, id, label) => updateItems(field, (data[field] || []).map((item) => item.id === id ? { ...item, label } : item));
  const removeItem = (field, id) => updateItems(field, (data[field] || []).filter((item) => item.id !== id));

  const filePicker = (field, label) => (
    <div className="flex flex-wrap gap-2">
      <select aria-label={label} className={inputClass} value={chosen[field] || ''} disabled={disabled || busy} onChange={(event) => setChosen((current) => ({ ...current, [field]: event.target.value }))}>
        <option value="">Επιλογή από την κεντρική βιβλιοθήκη</option>
        {availableFor(field).map((file) => <option key={file.url} value={file.url}>{file.name}</option>)}
      </select>
      <button type="button" disabled={disabled || busy || !chosen[field]} onClick={() => assign(field, chosen[field])} className="rounded-lg border border-border px-3 py-2 text-xs">Σύνδεση αρχείου</button>
    </div>
  );

  return (
    <section className="space-y-3">
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-[#17131d] to-[#292039] p-4 sm:p-5 text-white">
        <div className="text-[10px] font-black tracking-[.2em] text-primary">MODE MEDIA CENTER</div>
        <div className="mt-1 font-heading text-2xl">Φωτογραφική ταυτότητα ανά Mode</div>
        <p className="mt-1 text-xs text-white/65">Όλα τα αρχεία επιλέγονται από την κεντρική Βιβλιοθήκη Πολυμέσων. Εδώ διαχειρίζεσαι μόνο τις συνδέσεις και τις θέσεις εμφάνισης. Δεν γίνεται νέο ανέβασμα.</p>
        <div className="mt-4 grid grid-cols-2 xl:grid-cols-4 gap-2">
          {NEW_MODES.map((item) => (
            <button key={item.id} type="button" disabled={disabled || busy} onClick={() => setSelected(item.id)} className={`rounded-xl border p-3 text-left transition ${selected === item.id ? 'border-primary bg-primary/20' : 'border-white/15 bg-white/5 hover:bg-white/10'}`}>
              <div className="text-xs font-black">{item.icon} {item.name}</div>
              <div className="mt-1 text-[10px] text-white/55">{(value[item.id]?.gallery || []).length} gallery · {(value[item.id]?.sections || []).length} ενότητες</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 space-y-4">
        <div>
          <div className="font-heading text-xl">{mode.icon} {mode.name}</div>
          <p className="mt-1 text-xs text-foreground/55">Σύνδεση υπαρχόντων αρχείων της κεντρικής βιβλιοθήκης.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { id: 'hero', label: 'Κεντρική εικόνα / Hero', note: 'Κεντρική εικόνα παρουσίασης του Mode.' },
            { id: 'cover', label: 'Cover image', note: 'Εικόνα επιλογής Mode στο Tablet και στη φόρμα.' },
          ].map((slot) => (
            <div key={slot.id} className="rounded-xl border border-border/60 bg-secondary/30 p-3">
              <Thumb src={data[slot.id]} className="mb-3 aspect-video w-full" />
              <div className="text-sm font-bold">{slot.label}</div>
              <div className="mt-0.5 text-[11px] text-foreground/55">{slot.note}</div>
              <div className="mt-2 space-y-2">
                {filePicker(slot.id, slot.label)}
                {data[slot.id] && <button type="button" disabled={disabled || busy} onClick={() => persist({ ...data, [slot.id]: '' }, 'Η σύνδεση αφαιρέθηκε. Το αρχείο παραμένει στη βιβλιοθήκη.')} className="rounded-lg border border-border px-3 py-2 text-xs">Αφαίρεση σύνδεσης</button>}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border/60 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div><div className="font-bold text-sm">Φωτογραφίες ανά ενότητα</div><div className="text-[11px] text-foreground/55">Εμφάνιση στο Tablet Setup.</div></div>
            <button type="button" disabled={disabled || busy} onClick={() => addItem('sections')} className="rounded-lg border border-border px-3 py-2 text-xs font-bold">+ Ενότητα</button>
          </div>
          {(data.sections || []).map((item) => (
            <div key={item.id} className="grid sm:grid-cols-[1fr_160px_auto] gap-2 items-center rounded-lg bg-secondary/40 p-2">
              <input defaultValue={item.label || ''} disabled={disabled || busy} onBlur={(e) => { if (e.target.value !== (item.label || '')) updateLabel('sections', item.id, e.target.value); }} className="min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm" aria-label="Τίτλος ενότητας" />
              <Thumb src={item.image} className="aspect-video w-full" />
              <div className="flex flex-col gap-1">
                <select aria-label="Εικόνα ενότητας" className={inputClass} value={chosen[`section:${item.id}`] || ''} disabled={disabled || busy} onChange={(event) => setChosen((current) => ({ ...current, [`section:${item.id}`]: event.target.value }))}>
                  <option value="">Επιλογή εικόνας</option>{imageFiles.map((file) => <option key={file.url} value={file.url}>{file.name}</option>)}
                </select>
                <button type="button" disabled={disabled || busy || !chosen[`section:${item.id}`]} onClick={() => assign(`section:${item.id}`, chosen[`section:${item.id}`])} className="rounded-lg bg-primary px-2 py-2 text-xs text-white">Σύνδεση</button>
                <button type="button" disabled={disabled || busy} onClick={() => removeItem('sections', item.id)} className="rounded-lg border border-border px-2 py-2 text-xs">Αφαίρεση ενότητας</button>
              </div>
            </div>
          ))}
          {!data.sections?.length && <div className="text-xs text-foreground/45">Δεν έχουν προστεθεί ενότητες.</div>}
        </div>

        <div className="rounded-xl border border-border/60 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div><div className="font-bold text-sm">Gallery ({(data.gallery || []).length})</div><div className="text-[11px] text-foreground/55">Επιλογή πολλών υπαρχόντων εικόνων από την κεντρική βιβλιοθήκη.</div></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select multiple aria-label="Επιλογή φωτογραφιών Gallery" className={inputClass} value={chosenGallery[selected] || []} disabled={disabled || busy} onChange={(event) => setChosenGallery((current) => ({ ...current, [selected]: [...event.target.selectedOptions].map((option) => option.value) }))}>
              {imageFiles.map((file) => <option key={file.url} value={file.url}>{file.name}</option>)}
            </select>
            <button type="button" disabled={disabled || busy || !(chosenGallery[selected] || []).length} onClick={addGalleryFiles} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">Σύνδεση επιλεγμένων</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {(data.gallery || []).map((src, index) => (
              <div key={`${src}-${index}`} className="rounded-lg border border-border/60 p-1">
                <Thumb src={src} className="aspect-[4/5] w-full" />
                <button type="button" disabled={disabled || busy} onClick={() => updateItems('gallery', data.gallery.filter((_, i) => i !== index))} className="mt-1 w-full rounded bg-black/70 py-2 text-xs text-red-300">Αφαίρεση σύνδεσης</button>
              </div>
            ))}
          </div>
          {!data.gallery?.length && <div className="text-xs text-foreground/45">Η Gallery είναι κενή.</div>}
        </div>

        <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
          <div className="font-bold text-sm">Video trailer — Tablet Setup & Site mode page</div>
          <Thumb src={data.trailer} video className="mt-3 aspect-video w-full" />
          <div className="mt-2 space-y-2">
            {filePicker('trailer', 'Video trailer')}
            {data.trailer && <button type="button" disabled={disabled || busy} onClick={() => persist({ ...data, trailer: '' }, 'Η σύνδεση αφαιρέθηκε. Το αρχείο παραμένει στη βιβλιοθήκη.')} className="rounded-lg border border-border px-3 py-2 text-xs">Αφαίρεση σύνδεσης</button>}
          </div>
        </div>

        {(error || notice) && <div className="text-sm" role="status">{error ? <span className="text-red-400">{error}</span> : <span className="text-emerald-400">{notice}</span>}</div>}
        {busy && <div className="text-xs text-foreground/55">Αποθήκευση σύνδεσης…</div>}
      </div>
    </section>
  );
}
