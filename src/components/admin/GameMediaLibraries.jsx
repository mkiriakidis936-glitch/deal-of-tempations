import React, { useMemo, useRef, useState } from 'react';
import { uploadMedia } from '@/lib/media';

const MODES = [
  { id: 'classic', label: 'CLASSIC' },
  { id: 'marathon', label: 'MARATHON' },
  { id: 'arrest_heist', label: 'ARREST HEIST' },
  { id: 'pajama', label: 'PAJAMA' },
];

const inputClass = 'rounded-lg border border-border bg-background px-3 py-2 text-sm';

function FilePreview({ file }) {
  if (file.kind === 'video') return <video src={file.url} controls playsInline preload="metadata" className="w-full max-h-64 bg-black object-contain" />;
  if (file.kind === 'audio') return <audio src={file.url} controls preload="metadata" className="w-full" />;
  return <img src={file.url} alt={file.name} loading="lazy" className="max-h-64 max-w-full object-contain" />;
}

export default function GameMediaLibraries({ value = {}, files = [], onSave, onRefresh, onDeleteFile }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [previewFile, setPreviewFile] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState({});
  const [assignmentUrl, setAssignmentUrl] = useState('');
  const [assignmentMode, setAssignmentMode] = useState('classic');
  const [assignmentPoint, setAssignmentPoint] = useState('');
  const photoInputs = useRef({});
  const videoInput = useRef(null);
  const soundInput = useRef(null);

  const galleries = value.gameModePhotos || {};
  const assignments = Array.isArray(value.gameMediaAssignments) ? value.gameMediaAssignments : [];
  const photos = useMemo(() => files.filter((file) => file.kind === 'image' || file.kind === 'graphic'), [files]);
  const videos = useMemo(() => files.filter((file) => file.kind === 'video'), [files]);
  const sounds = useMemo(() => files.filter((file) => file.kind === 'audio'), [files]);
  const selectedAssignmentFile = files.find((file) => file.url === assignmentUrl);

  async function saveValue(next) {
    await onSave(next);
    setNotice('Αποθηκεύτηκε.');
    setError('');
  }

  async function uploadToGallery(modeId, event) {
    const selected = [...(event.target.files || [])];
    event.target.value = '';
    if (!selected.length) return;
    setBusy(modeId);
    setError('');
    try {
      const uploaded = [];
      for (const file of selected) uploaded.push((await uploadMedia(file)).url);
      const nextGalleries = {
        ...galleries,
        [modeId]: [...new Set([...(galleries[modeId] || []), ...uploaded])],
      };
      await saveValue({ ...value, gameModePhotos: nextGalleries });
      await onRefresh?.();
    } catch (e) {
      setError(e?.message || 'Δεν ανέβηκαν οι φωτογραφίες.');
    } finally {
      setBusy('');
    }
  }

  async function addExistingPhoto(modeId) {
    const url = existingPhoto[modeId];
    if (!url) return;
    setBusy(modeId);
    try {
      const nextGalleries = {
        ...galleries,
        [modeId]: [...new Set([...(galleries[modeId] || []), url])],
      };
      await saveValue({ ...value, gameModePhotos: nextGalleries });
      setExistingPhoto((current) => ({ ...current, [modeId]: '' }));
    } catch (e) {
      setError(e?.message || 'Δεν προστέθηκε η φωτογραφία.');
    } finally {
      setBusy('');
    }
  }

  async function uploadToLibrary(kind, event) {
    const selected = [...(event.target.files || [])];
    event.target.value = '';
    if (!selected.length) return;
    setBusy(kind);
    setError('');
    try {
      for (const file of selected) await uploadMedia(file);
      await onRefresh?.();
      setNotice(kind === 'video' ? 'Τα βίντεο προστέθηκαν στη Video Library.' : 'Οι ήχοι προστέθηκαν στη Sound Library.');
    } catch (e) {
      setError(e?.message || 'Δεν ανέβηκε το αρχείο.');
    } finally {
      setBusy('');
    }
  }

  async function addAssignment() {
    if (!selectedAssignmentFile || !assignmentPoint.trim()) return;
    const nextAssignment = {
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      url: selectedAssignmentFile.url,
      mode: assignmentMode,
      point: assignmentPoint.trim(),
    };
    const next = [...assignments];
    if (!next.some((item) => item.url === nextAssignment.url && item.mode === nextAssignment.mode && item.point.toLocaleLowerCase('el-GR') === nextAssignment.point.toLocaleLowerCase('el-GR'))) {
      next.push(nextAssignment);
    }
    setBusy('assignment');
    try {
      await saveValue({ ...value, gameMediaAssignments: next });
      setAssignmentPoint('');
    } catch (e) {
      setError(e?.message || 'Δεν αποθηκεύτηκε η σύνδεση.');
    } finally {
      setBusy('');
    }
  }

  function fileAssignments(url) {
    return assignments.filter((item) => item.url === url);
  }

  async function deleteFile(file) {
    if (!file || !onDeleteFile) return;
    await onDeleteFile(file);
  }

  return (
    <section className="space-y-7">
      <div className="space-y-1">
        <h2 className="font-heading text-2xl text-primary">GAME MEDIA</h2>
        <p className="text-sm text-foreground/65">Ξεχωριστές βιβλιοθήκες φωτογραφιών ανά Mode, βίντεο και ήχων. Το ίδιο αρχείο μπορεί να συνδεθεί με πολλά σημεία χωρίς νέο ανέβασμα.</p>
      </div>

      {MODES.map((mode) => {
        const gallery = Array.isArray(galleries[mode.id]) ? galleries[mode.id] : [];
        return (
          <section key={mode.id} className="space-y-3 border-b border-border/60 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-heading text-xl">{mode.label} — PHOTOS</h3>
                <p className="text-xs text-foreground/60">{gallery.length} φωτογραφίες</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={!!busy} onClick={() => photoInputs.current[mode.id]?.click()} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">Προσθήκη φωτογραφιών</button>
                <input ref={(node) => { photoInputs.current[mode.id] = node; }} hidden type="file" accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.heic,.svg" multiple onChange={(event) => uploadToGallery(mode.id, event)} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <select className={inputClass} value={existingPhoto[mode.id] || ''} onChange={(event) => setExistingPhoto((current) => ({ ...current, [mode.id]: event.target.value }))}>
                <option value="">Επιλογή υπάρχουσας φωτογραφίας</option>
                {photos.map((file) => <option key={file.url} value={file.url}>{file.name}</option>)}
              </select>
              <button type="button" disabled={!!busy || !existingPhoto[mode.id]} onClick={() => addExistingPhoto(mode.id)} className="rounded-lg border border-border px-3 py-2 text-xs">Σύνδεση χωρίς νέο upload</button>
            </div>

            {gallery.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-3 gap-y-4">
                {gallery.map((url) => {
                  const file = files.find((item) => item.url === url);
                  return (
                    <div key={url} className="min-w-0 space-y-1">
                      <button type="button" onClick={() => setPreviewFile(file || { url, kind: 'image', name: url.split('/').pop() })} className="block w-full">
                        <img src={url} alt={file?.name || mode.label} loading="lazy" className="w-full aspect-[4/3] object-contain bg-black/30" />
                      </button>
                      <div className="truncate text-[11px] text-foreground/65">{file?.name || url.split('/').pop()}</div>
                      <button type="button" disabled={!!busy || !file} onClick={() => deleteFile(file)} className="text-xs text-red-400 underline disabled:opacity-40">Διαγραφή αρχείου από παντού</button>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-xs text-foreground/45">Δεν υπάρχουν φωτογραφίες σε αυτή τη συλλογή.</p>}
          </section>
        );
      })}

      <section className="space-y-3 border-b border-border/60 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-heading text-xl">VIDEO LIBRARY</h3>
            <p className="text-xs text-foreground/60">{videos.length} βίντεο</p>
          </div>
          <button type="button" disabled={!!busy} onClick={() => videoInput.current?.click()} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">Προσθήκη βίντεο</button>
          <input ref={videoInput} hidden type="file" accept="video/*,.mp4,.webm,.mov" multiple onChange={(event) => uploadToLibrary('video', event)} />
        </div>
        {videos.map((file) => (
          <div key={file.url} className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-border/40 py-3">
            <div className="w-full sm:w-64"><video src={file.url} controls playsInline preload="metadata" className="w-full max-h-36 bg-black object-contain" /></div>
            <div className="min-w-0 flex-1"><div className="break-all text-sm font-medium">{file.name}</div><div className="text-xs text-foreground/55">{Math.ceil((file.size || 0) / 1024)} KB</div></div>
            <button type="button" disabled={!!busy} onClick={() => deleteFile(file)} className="text-xs text-red-400 underline">Διαγραφή αρχείου από παντού</button>
          </div>
        ))}
        {!videos.length && <p className="text-xs text-foreground/45">Δεν υπάρχουν βίντεο.</p>}
      </section>

      <section className="space-y-3 border-b border-border/60 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-heading text-xl">SOUND LIBRARY</h3>
            <p className="text-xs text-foreground/60">{sounds.length} ηχητικά αρχεία</p>
          </div>
          <button type="button" disabled={!!busy} onClick={() => soundInput.current?.click()} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">Προσθήκη ήχων</button>
          <input ref={soundInput} hidden type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac" multiple onChange={(event) => uploadToLibrary('audio', event)} />
        </div>
        {sounds.map((file) => (
          <div key={file.url} className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-border/40 py-3">
            <div className="w-full sm:w-64"><audio src={file.url} controls preload="metadata" className="w-full" /></div>
            <div className="min-w-0 flex-1"><div className="break-all text-sm font-medium">{file.name}</div><div className="text-xs text-foreground/55">{Math.ceil((file.size || 0) / 1024)} KB</div></div>
            <button type="button" disabled={!!busy} onClick={() => deleteFile(file)} className="text-xs text-red-400 underline">Διαγραφή αρχείου από παντού</button>
          </div>
        ))}
        {!sounds.length && <p className="text-xs text-foreground/45">Δεν υπάρχουν ήχοι.</p>}
      </section>

      <section className="space-y-3">
        <h3 className="font-heading text-xl">ΣΥΝΔΕΣΗ ΑΡΧΕΙΩΝ ΜΕ ΣΗΜΕΙΑ ΠΑΙΧΝΙΔΙΟΥ</h3>
        <p className="text-xs text-foreground/60">Επίλεξε ένα ήδη ανεβασμένο αρχείο και σύνδεσέ το με όσα σημεία χρειάζεται. Δεν δημιουργείται δεύτερο αντίγραφο.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1.5fr_auto] gap-2">
          <select className={inputClass} value={assignmentUrl} onChange={(event) => setAssignmentUrl(event.target.value)}>
            <option value="">Επιλογή αρχείου</option>
            {files.map((file) => <option key={file.url} value={file.url}>{file.kind} · {file.name}</option>)}
          </select>
          <select className={inputClass} value={assignmentMode} onChange={(event) => setAssignmentMode(event.target.value)}>
            {MODES.map((mode) => <option key={mode.id} value={mode.id}>{mode.label}</option>)}
          </select>
          <input className={inputClass} value={assignmentPoint} onChange={(event) => setAssignmentPoint(event.target.value)} placeholder="Σημείο παιχνιδιού / Round / Scene" />
          <button type="button" disabled={!!busy || !selectedAssignmentFile || !assignmentPoint.trim()} onClick={addAssignment} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">Σύνδεση</button>
        </div>
        {assignments.length ? (
          <div className="space-y-2">
            {assignments.map((item) => {
              const file = files.find((candidate) => candidate.url === item.url);
              if (!file) return null;
              return <div key={item.id} className="flex flex-wrap items-center gap-2 border-b border-border/40 py-2 text-xs"><strong>{MODES.find((mode) => mode.id === item.mode)?.label || item.mode}</strong><span>· {item.point}</span><span className="min-w-0 flex-1 truncate text-foreground/60">{file.name}</span><button type="button" disabled={!!busy} onClick={() => deleteFile(file)} className="text-red-400 underline">Διαγραφή αρχείου από παντού</button></div>;
            })}
          </div>
        ) : <p className="text-xs text-foreground/45">Δεν έχουν συνδεθεί αρχεία με σημεία παιχνιδιού.</p>}
      </section>

      {previewFile && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label="Προεπισκόπηση αρχείου" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewFile(null); }}>
          <div className="w-full max-w-4xl space-y-3">
            <div className="flex items-center justify-between gap-3 text-white">
              <div className="min-w-0 truncate text-sm">{previewFile.name}</div>
              <button type="button" onClick={() => setPreviewFile(null)} className="rounded-lg border border-white/40 px-3 py-2 text-xs">ΚΛΕΙΣΙΜΟ</button>
            </div>
            <div className="flex min-h-40 items-center justify-center rounded-lg bg-black p-3">
              <FilePreview file={previewFile} />
            </div>
          </div>
        </div>
      )}
      {(error || notice) && <div className="text-sm" role="status">{error ? <span className="text-red-400">{error}</span> : <span className="text-emerald-400">{notice}</span>}</div>}
    </section>
  );
}
