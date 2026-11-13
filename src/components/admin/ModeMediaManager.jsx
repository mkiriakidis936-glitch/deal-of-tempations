import React, { useRef, useState } from 'react';
import { NEW_MODES } from '@/data/modes/modeRegistry';
import { uploadMedia } from '@/lib/media';
import { MODE_COVERS } from '@/data/brandArt';

const emptyMode = { hero: '', cover: '', sections: [], gallery: [], cards: [], trailer: '' };

function Thumb({ src, video = false, className = '' }) {
  if (!src) return <div className={`flex items-center justify-center rounded-lg bg-black/30 text-xs text-foreground/45 ${className}`}>Χωρίς αρχείο</div>;
  return video
    ? <video src={src} controls muted playsInline preload="metadata" className={`rounded-lg bg-black object-cover ${className}`} />
    : <img src={src} alt="" loading="lazy" className={`rounded-lg object-cover ${className}`} />;
}

export default function ModeMediaManager({ value = {}, onSave, disabled = false }) {
  const [selected, setSelected] = useState(NEW_MODES[0].id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const imageInput = useRef(null);
  const imagesInput = useRef(null);
  const videoInput = useRef(null);
  const target = useRef(null);
  const mode = NEW_MODES.find((item) => item.id === selected) || NEW_MODES[0];
  const data = { ...emptyMode, cover: MODE_COVERS[`modeCover_${selected}`] || '', ...(value[selected] || {}) };
  if (!data.cover) data.cover = MODE_COVERS[`modeCover_${selected}`] || '';

  const persist = async (next) => {
    setBusy(true);
    setError('');
    try {
      await onSave({ ...value, [selected]: next });
    } catch (e) {
      setError(e?.message || 'Δεν αποθηκεύτηκαν οι αλλαγές.');
    } finally {
      setBusy(false);
    }
  };

  const choose = (field, multiple = false) => {
    target.current = { field, multiple };
    (multiple ? imagesInput : field === 'trailer' ? videoInput : imageInput).current?.click();
  };

  const handleFiles = async (event) => {
    const files = [...(event.target.files || [])];
    event.target.value = '';
    if (!files.length || !target.current) return;
    const { field } = target.current;
    setBusy(true);
    setError('');
    try {
      const urls = [];
      for (const file of files) urls.push((await uploadMedia(file)).url);
      const next = { ...data };
      if (field === 'gallery') next.gallery = [...(data.gallery || []), ...urls];
      else if (field.startsWith('section:')) {
        const id = field.slice('section:'.length);
        next.sections = (data.sections || []).map((item) => item.id === id ? { ...item, image: urls[0] } : item);
      } else if (field.startsWith('card:')) {
        const id = field.slice('card:'.length);
        next.cards = (data.cards || []).map((item) => item.id === id ? { ...item, image: urls[0] } : item);
      } else next[field] = urls[0];
      await onSave({ ...value, [selected]: next });
    } catch (e) {
      setError(e?.message || 'Δεν ανέβηκε το αρχείο.');
    } finally {
      setBusy(false);
      target.current = null;
    }
  };

  const updateItems = (field, items) => persist({ ...data, [field]: items });
  const addItem = (field) => {
    const id = `${field}-${Date.now()}`;
    const items = [...(data[field] || []), { id, label: field === 'sections' ? 'Νέα ενότητα' : 'Νέα κάρτα', image: '' }];
    updateItems(field, items);
  };
  const updateLabel = (field, id, label) => {
    const items = (data[field] || []).map((item) => item.id === id ? { ...item, label } : item);
    updateItems(field, items);
  };
  const removeItem = (field, id) => updateItems(field, (data[field] || []).filter((item) => item.id !== id));

  return (
    <section className="space-y-3">
      <input ref={imageInput} hidden type="file" accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.heic" onChange={handleFiles} />
      <input ref={imagesInput} hidden multiple type="file" accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.heic" onChange={handleFiles} />
      <input ref={videoInput} hidden type="file" accept="video/*,.mp4,.webm,.mov" onChange={handleFiles} />

      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-[#17131d] to-[#292039] p-4 sm:p-5 text-white">
        <div className="text-[10px] font-black tracking-[.2em] text-primary">MODE MEDIA CENTER</div>
        <div className="mt-1 font-heading text-2xl">Φωτογραφική ταυτότητα ανά Mode</div>
        <p className="mt-1 text-xs text-white/65">Κάθε Mode έχει ανεξάρτητο Hero, Cover, ενότητες, Gallery, κάρτες και προαιρετικό trailer.</p>
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
          <p className="mt-1 text-xs text-foreground/55">Οι αλλαγές αποθηκεύονται ξεχωριστά για αυτό το Mode.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { id: 'hero', label: 'Κεντρική εικόνα / Hero', note: 'Κεντρική εικόνα παρουσίασης του Mode.' },
            { id: 'cover', label: 'Cover image', note: 'Εικόνα στην κάρτα επιλογής Mode.' },
          ].map((slot) => (
            <div key={slot.id} className="rounded-xl border border-border/60 bg-secondary/30 p-3">
              <Thumb src={data[slot.id]} className="mb-3 aspect-video w-full" />
              <div className="text-sm font-bold">{slot.label}</div>
              <div className="mt-0.5 text-[11px] text-foreground/55">{slot.note}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" disabled={disabled || busy} onClick={() => choose(slot.id)} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">⬆ Ανέβασμα / Αλλαγή</button>
                {data[slot.id] && <button type="button" disabled={disabled || busy} onClick={() => persist({ ...data, [slot.id]: '' })} className="rounded-lg border border-border px-3 py-2 text-xs">Αφαίρεση</button>}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border/60 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div><div className="font-bold text-sm">Φωτογραφίες ανά ενότητα</div><div className="text-[11px] text-foreground/55">Πρόσθεσε ενότητες με δικό τους τίτλο και εικόνα.</div></div>
            <button type="button" disabled={disabled || busy} onClick={() => addItem('sections')} className="rounded-lg border border-border px-3 py-2 text-xs font-bold">+ Ενότητα</button>
          </div>
          {(data.sections || []).map((item) => (
            <div key={item.id} className="grid sm:grid-cols-[1fr_160px_auto] gap-2 items-center rounded-lg bg-secondary/40 p-2">
              <input defaultValue={item.label || ''} disabled={disabled || busy} onBlur={(e) => { if (e.target.value !== (item.label || '')) updateLabel('sections', item.id, e.target.value); }} className="min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm" aria-label="Τίτλος ενότητας" />
              <Thumb src={item.image} className="aspect-video w-full" />
              <div className="flex gap-1">
                <button type="button" disabled={disabled || busy} onClick={() => { target.current = { field: `section:${item.id}` }; imageInput.current?.click(); }} className="rounded-lg bg-primary px-2 py-2 text-xs text-white">Εικόνα</button>
                <button type="button" disabled={disabled || busy} onClick={() => removeItem('sections', item.id)} className="rounded-lg border border-border px-2 py-2 text-xs">✕</button>
              </div>
            </div>
          ))}
          {!data.sections?.length && <div className="text-xs text-foreground/45">Δεν έχουν προστεθεί ενότητες.</div>}
        </div>

        <div className="rounded-xl border border-border/60 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div><div className="font-bold text-sm">Φωτογραφίες για τις κάρτες του Mode</div><div className="text-[11px] text-foreground/55">Ξεχωριστή εικόνα και τίτλος για κάθε κάρτα.</div></div>
            <button type="button" disabled={disabled || busy} onClick={() => addItem('cards')} className="rounded-lg border border-border px-3 py-2 text-xs font-bold">+ Κάρτα</button>
          </div>
          {(data.cards || []).map((item) => (
            <div key={item.id} className="grid sm:grid-cols-[1fr_160px_auto] gap-2 items-center rounded-lg bg-secondary/40 p-2">
              <input defaultValue={item.label || ''} disabled={disabled || busy} onBlur={(e) => { if (e.target.value !== (item.label || '')) updateLabel('cards', item.id, e.target.value); }} className="min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm" aria-label="Τίτλος κάρτας" />
              <Thumb src={item.image} className="aspect-video w-full" />
              <div className="flex gap-1">
                <button type="button" disabled={disabled || busy} onClick={() => { target.current = { field: `card:${item.id}` }; imageInput.current?.click(); }} className="rounded-lg bg-primary px-2 py-2 text-xs text-white">Εικόνα</button>
                <button type="button" disabled={disabled || busy} onClick={() => removeItem('cards', item.id)} className="rounded-lg border border-border px-2 py-2 text-xs">✕</button>
              </div>
            </div>
          ))}
          {!data.cards?.length && <div className="text-xs text-foreground/45">Δεν έχουν προστεθεί κάρτες.</div>}
        </div>

        <div className="rounded-xl border border-border/60 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div><div className="font-bold text-sm">Gallery ({(data.gallery || []).length})</div><div className="text-[11px] text-foreground/55">Πολλαπλές φωτογραφίες αποκλειστικά για αυτό το Mode.</div></div>
            <button type="button" disabled={disabled || busy} onClick={() => choose('gallery', true)} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">+ Προσθήκη φωτογραφιών</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {(data.gallery || []).map((src, index) => (
              <div key={`${src}-${index}`} className="rounded-lg border border-border/60 p-1">
                <Thumb src={src} className="aspect-[4/5] w-full" />
                <button type="button" disabled={disabled || busy} onClick={() => updateItems('gallery', data.gallery.filter((_, i) => i !== index))} className="mt-1 w-full rounded bg-black/70 py-2 text-xs text-red-300">Αφαίρεση</button>
              </div>
            ))}
          </div>
          {!data.gallery?.length && <div className="text-xs text-foreground/45">Η Gallery είναι κενή.</div>}
        </div>

        <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
          <div className="font-bold text-sm">Video trailer (προαιρετικό)</div>
          <Thumb src={data.trailer} video className="mt-3 aspect-video w-full" />
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" disabled={disabled || busy} onClick={() => choose('trailer')} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">⬆ Ανέβασμα / Αλλαγή trailer</button>
            {data.trailer && <button type="button" disabled={disabled || busy} onClick={() => persist({ ...data, trailer: '' })} className="rounded-lg border border-border px-3 py-2 text-xs">Αφαίρεση</button>}
          </div>
        </div>

        {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-500">{error}</div>}
        {busy && <div className="text-xs text-foreground/55">Αποθήκευση / ανέβασμα…</div>}
      </div>
    </section>
  );
}
