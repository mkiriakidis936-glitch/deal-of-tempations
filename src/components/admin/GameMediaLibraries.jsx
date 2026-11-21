import React, { useMemo, useRef, useState } from 'react';
import { uploadMedia } from '@/lib/media';

const MODES = [
  { id: 'classic', label: 'CLASSIC' },
  { id: 'marathon', label: 'MARATHON' },
  { id: 'arrest_heist', label: 'ARREST HEIST' },
  { id: 'pajama', label: 'PAJAMA' },
  { id: 'pedi_extended', label: 'PAJAMA PEDI-GLAM EXTENDED' },
  { id: 'lockdown', label: 'PAJAMA LOCKDOWN 18+' },
  { id: 'beach_bar', label: 'BEACH BAR HOME LOCKDOWN' },
];

const inputClass = 'rounded-lg border border-border bg-background px-3 py-2 text-sm';

function FilePreview({ file }) {
  if (file.kind === 'video') return <video src={file.url} controls playsInline preload="metadata" className="w-full max-h-64 bg-black object-contain" />;
  if (file.kind === 'audio') return <audio src={file.url} controls preload="metadata" className="w-full" />;
  return <img src={file.url} alt={file.name} loading="lazy" className="max-h-64 max-w-full object-contain" />;
}

export default function GameMediaLibraries({ value = {}, files = [], onSave, onRefresh }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [previewFile, setPreviewFile] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState({});
  const [assignmentUrl, setAssignmentUrl] = useState('');
  const [assignmentMode, setAssignmentMode] = useState('classic');
  const [assignmentPoint, setAssignmentPoint] = useState('');
  const uploadInputs = useRef({});

  const galleries = value.gameModePhotos || {};
  const assignments = Array.isArray(value.gameMediaAssignments) ? value.gameMediaAssignments : [];
  const photos = useMemo(() => files.filter((file) => file.kind === 'image' || file.kind === 'graphic'), [files]);
  const selectedAssignmentFile = files.find((file) => file.url === assignmentUrl);

  async function saveValue(next, message = 'Αποθηκεύτηκε.') {
    await onSave(next);
    setNotice(message);
    setError('');
    await onRefresh?.();
  }

  async function uploadPhotoToMode(modeId, file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Επίλεξε αρχείο εικόνας.'); return; }
    setBusy(modeId);
    setError('');
    setNotice('');
    try {
      const uploaded = await uploadMedia(file);
      if (!uploaded?.url) throw new Error('Ο server δεν επέστρεψε σύνδεσμο για το αρχείο.');
      const nextGalleries = { ...galleries, [modeId]: [...new Set([...(galleries[modeId] || []), uploaded.url])] };
      await saveValue({ ...value, gameModePhotos: nextGalleries }, `Το αρχείο ${file.name} ανέβηκε και συνδέθηκε στο ${MODES.find((mode) => mode.id === modeId)?.label || modeId}.`);
      await onRefresh?.();
    } catch (e) {
      setError(e?.message || 'Το ανέβασμα ή η σύνδεση απέτυχε.');
    } finally {
      setBusy('');
      if (uploadInputs.current[modeId]) uploadInputs.current[modeId].value = '';
    }
  }

  async function addExistingPhoto(modeId) {
    const url = existingPhoto[modeId];
    if (!url) return;
    setBusy(modeId);
    setError('');
    try {
      const nextGalleries = {
        ...galleries,
        [modeId]: [...new Set([...(galleries[modeId] || []), url])],
      };
      await saveValue({ ...value, gameModePhotos: nextGalleries }, 'Η φωτογραφία συνδέθηκε με το Mode.');
      setExistingPhoto((current) => ({ ...current, [modeId]: '' }));
    } catch (e) {
      setError(e?.message || 'Δεν προστέθηκε η φωτογραφία.');
    } finally {
      setBusy('');
    }
  }

  async function removePhotoFromGallery(modeId, url) {
    if (!window.confirm('Να αφαιρεθεί η φωτογραφία μόνο από αυτή τη συλλογή; Το αρχείο θα παραμείνει στη Βιβλιοθήκη Πολυμέσων.')) return;
    setBusy(modeId);
    setError('');
    try {
      const nextGalleries = {
        ...galleries,
        [modeId]: (galleries[modeId] || []).filter((item) => item !== url),
      };
      await saveValue({ ...value, gameModePhotos: nextGalleries }, 'Η φωτογραφία αφαιρέθηκε από τη συλλογή. Το αρχείο διατηρήθηκε.');
    } catch (e) {
      setError(e?.message || 'Δεν αφαιρέθηκε η φωτογραφία.');
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
    setError('');
    try {
      await saveValue({ ...value, gameMediaAssignments: next }, 'Η σύνδεση αρχείου με το σημείο αποθηκεύτηκε.');
      setAssignmentPoint('');
    } catch (e) {
      setError(e?.message || 'Δεν αποθηκεύτηκε η σύνδεση.');
    } finally {
      setBusy('');
    }
  }

  async function removeAssignment(id) {
    if (!window.confirm('Να αφαιρεθεί μόνο η σύνδεση με αυτό το σημείο; Το αρχείο θα παραμείνει στη Βιβλιοθήκη Πολυμέσων.')) return;
    setBusy('assignment');
    setError('');
    try {
      await saveValue({ ...value, gameMediaAssignments: assignments.filter((item) => item.id !== id) }, 'Η σύνδεση αφαιρέθηκε. Το αρχείο διατηρήθηκε.');
    } catch (e) {
      setError(e?.message || 'Δεν αφαιρέθηκε η σύνδεση.');
    } finally {
      setBusy('');
    }
  }

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-heading text-2xl text-primary">MODE MEDIA CENTER — ΦΩΤΟΓΡΑΦΙΕΣ ΑΝΑ MODE</h2>
        <p className="text-sm text-foreground/65">Ανέβασε εικόνα απευθείας από τον υπολογιστή στη συλλογή του συγκεκριμένου Mode ή σύνδεσε υπάρχουσα εικόνα από τη βιβλιοθήκη. Η αφαίρεση από συλλογή δεν διαγράφει το αρχείο.</p>
      </div>

      {MODES.map((mode) => {
        const gallery = Array.isArray(galleries[mode.id]) ? galleries[mode.id] : [];
        return (
          <section key={mode.id} className="space-y-3 border-b border-border/60 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-heading text-xl">{mode.label}</h3>
                <p className="text-xs text-foreground/60">{gallery.length} φωτογραφίες</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <input ref={(element) => { uploadInputs.current[mode.id] = element; }} type="file" accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.svg,.heic" hidden disabled={!!busy} onChange={(event) => uploadPhotoToMode(mode.id, event.target.files?.[0])} aria-label={`Ανέβασμα φωτογραφίας από υπολογιστή για ${mode.label}`} />
              <button type="button" disabled={!!busy} onClick={() => uploadInputs.current[mode.id]?.click()} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-black disabled:opacity-40">Ανέβασμα από υπολογιστή εδώ</button>
              <select aria-label={`Υπάρχουσα φωτογραφία για ${mode.label}`}  className={inputClass} value={existingPhoto[mode.id] || ''} onChange={(event) => setExistingPhoto((current) => ({ ...current, [mode.id]: event.target.value }))}>
                <option value="">Επιλογή από τις ανεβασμένες εικόνες</option>
                {photos.map((file) => <option key={file.url} value={file.url}>{file.name}</option>)}
              </select>
              <button type="button" disabled={!!busy || !existingPhoto[mode.id]} onClick={() => addExistingPhoto(mode.id)} className="rounded-lg border border-border px-3 py-2 text-xs">Σύνδεση φωτογραφίας</button>
            </div>
            {gallery.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-3 gap-y-4">
                {gallery.map((url) => {
                  const file = files.find((item) => item.url === url) || { url, kind: 'image', name: url.split('/').pop() };
                  return (
                    <div key={url} className="min-w-0 space-y-1">
                      <button type="button" onClick={() => setPreviewFile(file)} className="block w-full">
                        <img src={url} alt={file.name} loading="lazy" className="w-full aspect-[4/3] object-contain bg-black/30" />
                      </button>
                      <div className="truncate text-[11px] text-foreground/65">{file.name}</div>
                      <button type="button" disabled={!!busy} onClick={() => removePhotoFromGallery(mode.id, url)} className="text-xs text-foreground/75 underline disabled:opacity-40">Αφαίρεση από τη συλλογή</button>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-xs text-foreground/45">Δεν υπάρχουν φωτογραφίες σε αυτή τη συλλογή.</p>}
          </section>
        );
      })}

      <section className="space-y-3">
        <h3 className="font-heading text-xl">ΣΥΝΔΕΣΗ ΑΡΧΕΙΩΝ ΜΕ ΣΗΜΕΙΑ ΠΑΙΧΝΙΔΙΟΥ</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1.5fr_auto] gap-2">
          <select aria-label="Επιλογή αρχείου" className={inputClass} value={assignmentUrl} onChange={(event) => setAssignmentUrl(event.target.value)}>
            <option value="">Επιλογή αρχείου</option>
            {files.map((file) => <option key={file.url} value={file.url}>{file.kind} · {file.name}</option>)}
          </select>
          <select aria-label="Mode" className={inputClass} value={assignmentMode} onChange={(event) => setAssignmentMode(event.target.value)}>
            {MODES.map((mode) => <option key={mode.id} value={mode.id}>{mode.label}</option>)}
          </select>
          <input aria-label="Σημείο παιχνιδιού" className={inputClass} value={assignmentPoint} onChange={(event) => setAssignmentPoint(event.target.value)} placeholder="Σημείο παιχνιδιού / Round / Scene" />
          <button type="button" disabled={!!busy || !selectedAssignmentFile || !assignmentPoint.trim()} onClick={addAssignment} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-black">Σύνδεση</button>
        </div>
        {assignments.length ? (
          <div className="space-y-2">
            {assignments.map((item) => {
              const file = files.find((candidate) => candidate.url === item.url);
              if (!file) return null;
              return <div key={item.id} className="flex flex-wrap items-center gap-2 border-b border-border/40 py-2 text-xs"><strong>{MODES.find((mode) => mode.id === item.mode)?.label || item.mode}</strong><span>· {item.point}</span><span className="min-w-0 flex-1 truncate text-foreground/60">{file.name}</span><button type="button" disabled={!!busy} onClick={() => removeAssignment(item.id)} className="text-foreground/75 underline">Αφαίρεση σύνδεσης</button></div>;
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
