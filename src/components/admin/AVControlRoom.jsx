import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { listMedia } from '@/lib/media';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

const SETTINGS_KEY = 'av_control_room_v1';
const field = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm';
const kinds = [{ id: 'all', label: 'Όλα' }, { id: 'video', label: 'Βίντεο' }, { id: 'audio', label: 'Ήχος' }, { id: 'image', label: 'Εικόνες' }, { id: 'graphic', label: 'Γραφικά' }];
const folders = ['Γενικά', 'Intro & Opening', 'Sound Identity', 'Transitions', 'Commercial Breaks', 'Scenes', 'Highlights', 'Winner Reveal', 'Recap'];
const uid = () => globalThis.crypto?.randomUUID?.() || String(Date.now() + Math.random());

export default function AVControlRoom() {
  const [files, setFiles] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionCode, setSessionCode] = useState('');
  const [filter, setFilter] = useState('all');
  const [folderFilter, setFolderFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('');
  const [settingsRecord, setSettingsRecord] = useState(null);
  const [metadata, setMetadata] = useState({});
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [cueRecord, setCueRecord] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const audioRef = useRef(null);
  const videoRef = useRef(null);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [media, sessionResult, settingResult] = await Promise.all([
        listMedia(),
        base44.entities.GameSession.filter({}, { sort: '-created_date', limit: 100 }),
        base44.entities.AppSetting.filter({ key: SETTINGS_KEY }, { limit: 1 }),
      ]);
      setFiles(media || []);
      setSessions(sessionResult.items || []);
      const rec = settingResult.items?.[0] || null;
      setSettingsRecord(rec);
      const value = rec?.value || {};
      setMetadata(value.metadata || {});
      setQueue(value.queue || []);
      setQueueIndex(Number.isInteger(value.queueIndex) ? value.queueIndex : -1);
      const preferred = sessionResult.items?.[0]?.sessionCode || '';
      setSessionCode((current) => current || preferred);
    } catch (error) {
      setMessage(error.message || 'Δεν φορτώθηκαν τα δεδομένα Media.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!sessionCode) { setCueRecord(null); return undefined; }
    let alive = true;
    const refreshCue = () => base44.entities.ProductionCue.filter({ sessionCode }, { limit: 1 }).then(({ items = [] }) => { if (alive) setCueRecord(items[0] || null); }).catch(() => {});
    refreshCue();
    const off = base44.entities.ProductionCue.subscribe((event) => { if (event?.data?.sessionCode === sessionCode) refreshCue(); });
    return () => { alive = false; off?.(); };
  }, [sessionCode]);

  const currentSession = sessions.find((item) => item.sessionCode === sessionCode);
  const currentCue = queueIndex >= 0 ? queue[queueIndex] : null;
  const filteredFiles = useMemo(() => files.filter((file) => {
    const meta = metadata[file.url] || {};
    return (filter === 'all' || file.kind === filter)
      && (folderFilter === 'all' || (meta.folder || 'Γενικά') === folderFilter)
      && (file.name || '').toLocaleLowerCase('el-GR').includes(search.toLocaleLowerCase('el-GR'))
      && (!meta.hidden);
  }), [files, filter, folderFilter, search, metadata]);
  const selectedFile = files.find((file) => file.url === selected);
  const selectedMeta = metadata[selected] || {};

  async function persist(nextMetadata = metadata, nextQueue = queue, nextIndex = queueIndex) {
    const value = { metadata: nextMetadata, queue: nextQueue, queueIndex: nextIndex };
    const saved = settingsRecord?.id
      ? await base44.entities.AppSetting.update(settingsRecord.id, { value })
      : await base44.entities.AppSetting.create({ key: SETTINGS_KEY, value });
    setSettingsRecord(saved);
  }

  async function saveMetadata(patch) {
    if (!selectedFile) return;
    const next = { ...metadata, [selected]: { ...selectedMeta, ...patch } };
    setMetadata(next);
    try { await persist(next); setMessage('Οι πληροφορίες του αρχείου αποθηκεύτηκαν.'); }
    catch (error) { setMessage(error.message || 'Δεν αποθηκεύτηκαν οι πληροφορίες.'); }
  }

  async function addToQueue(file = selectedFile) {
    if (!file) return;
    const entry = { id: uid(), url: file.url, name: file.name, kind: file.kind, label: metadata[file.url]?.title || file.name };
    const next = [...queue, entry];
    setQueue(next);
    try { await persist(metadata, next, queueIndex); setMessage('Το αρχείο προστέθηκε στην ουρά.'); }
    catch (error) { setMessage(error.message || 'Δεν αποθηκεύτηκε η ουρά.'); }
  }

  async function removeQueueItem(id) {
    const next = queue.filter((item) => item.id !== id);
    const nextIndex = queueIndex >= next.length ? next.length - 1 : queueIndex;
    setQueue(next); setQueueIndex(nextIndex);
    try { await persist(metadata, next, nextIndex); } catch (error) { setMessage(error.message || 'Δεν αποθηκεύτηκε η αλλαγή της ουράς.'); }
  }

  async function moveQueueItem(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= queue.length) return;
    const next = [...queue];
    [next[index], next[target]] = [next[target], next[index]];
    setQueue(next);
    try { await persist(metadata, next, queueIndex); } catch (error) { setMessage(error.message || 'Δεν αποθηκεύτηκε η σειρά.'); }
  }

  async function publish(item, index = queueIndex) {
    if (!sessionCode) { setMessage('Επίλεξε πρώτα Event.'); return; }
    if (!item) { setMessage('Δεν έχει επιλεγεί αρχείο για προβολή.'); return; }
    const assetMeta = metadata[item.url] || {};
    if (assetMeta.permission && assetMeta.permission !== 'cleared') { setMessage('Η προβολή είναι κλειδωμένη μέχρι να καταχωριστεί η απαιτούμενη άδεια ή συγκατάθεση.'); return; }
    setBusy(true);
    try {
      const existing = cueRecord || (await base44.entities.ProductionCue.filter({ sessionCode }, { limit: 1 })).items?.[0] || null;
      const data = {
        sessionCode,
        active: true,
        label: assetMeta.title || item.label || item.name,
        kind: item.kind === 'video' ? 'video' : item.kind === 'audio' ? 'audio' : 'image',
        source: item.url,
        activatedAt: new Date().toISOString(),
        mediaItemId: item.id || item.url,
        mediaFolder: assetMeta.folder || 'Γενικά',
      };
      const saved = existing?.id
        ? await base44.entities.ProductionCue.update(existing.id, data)
        : await base44.entities.ProductionCue.create(data);
      setCueRecord(saved);
      setQueueIndex(index);
      await persist(metadata, queue, index);
      setMessage('Το επιλεγμένο Media μεταδόθηκε στην οθόνη TV.');
    } catch (error) {
      setMessage(error.message || 'Δεν ήταν δυνατή η μετάδοση στην TV.');
    } finally { setBusy(false); }
  }

  async function stopOutput() {
    try {
      const existing = cueRecord || (sessionCode ? (await base44.entities.ProductionCue.filter({ sessionCode }, { limit: 1 })).items?.[0] : null);
      if (existing?.id) {
        const saved = await base44.entities.ProductionCue.update(existing.id, { active: false });
        setCueRecord(saved);
      }
      setMessage('Η έξοδος TV σταμάτησε.');
    } catch (error) { setMessage(error.message || 'Δεν ήταν δυνατή η διακοπή της εξόδου.'); }
  }

  async function playQueue(direction = 0) {
    if (!queue.length) return;
    const nextIndex = queueIndex < 0 ? 0 : Math.min(queue.length - 1, Math.max(0, queueIndex + direction));
    await publish(queue[nextIndex], nextIndex);
  }

  function preview(file) {
    setSelected(file.url);
    setShowDetails(true);
  }

  const mediaUrl = (url) => url?.startsWith('http') ? url : url;

  return <div className="space-y-4">
    <ComicPanel className="bg-card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h2 className="font-heading text-2xl text-primary">MEDIA MANAGEMENT & AV CONTROL ROOM</h2><p className="text-xs text-foreground/60">Ενιαία διαχείριση βιβλιοθήκης, δικαιωμάτων, ουράς και ζωντανής εξόδου TV.</p></div>
        <ComicButton size="sm" variant="dark" onClick={load} disabled={busy}>↻ Ανανέωση Media</ComicButton>
      </div>
      <label className="block space-y-1 text-xs font-bold">ΕΝΕΡΓΟ EVENT
        <select className={field} value={sessionCode} onChange={(e) => { setSessionCode(e.target.value); setCueRecord(null); }}>
          <option value="">Επιλογή Event</option>
          {sessions.map((session) => <option key={session.id} value={session.sessionCode}>{session.event?.title || session.mode || 'Game'} · {session.sessionCode}</option>)}
        </select>
      </label>
      {currentSession && <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        <div className="rounded-lg bg-secondary p-2"><b className="block text-base">{currentSession.sessionCode}</b>Κωδικός Event</div>
        <div className="rounded-lg bg-secondary p-2"><b className="block text-base">{currentSession.mode || '—'}</b>Mode</div>
        <div className="rounded-lg bg-secondary p-2"><b className="block text-base">{currentSession.state?.round || 1}</b>Round</div>
        <div className="rounded-lg bg-secondary p-2"><b className="block text-base">{currentSession.state?.stage ?? '—'}</b>Stage</div>
      </div>}
    </ComicPanel>

    {message && <ComicPanel className="bg-secondary"><p className="text-sm">{message}</p></ComicPanel>}

    <div className="grid xl:grid-cols-[1.1fr_.9fr] gap-3">
      <ComicPanel className="bg-card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-heading text-lg">MEDIA LIBRARY · {files.length} ΑΡΧΕΙΑ</h3><span className="text-[10px] text-foreground/50">Uploads από την υπάρχουσα Βιβλιοθήκη Πολυμέσων</span></div>
        <input className={field} type="search" placeholder="Αναζήτηση ονόματος αρχείου…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex flex-wrap gap-1">{kinds.map((kind) => <ComicButton key={kind.id} size="sm" variant={filter === kind.id ? 'default' : 'dark'} onClick={() => setFilter(kind.id)}>{kind.label}</ComicButton>)}</div>
        <select className={field} value={folderFilter} onChange={(e) => setFolderFilter(e.target.value)}><option value="all">Όλοι οι φάκελοι</option>{folders.map((folder) => <option key={folder}>{folder}</option>)}</select>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[560px] overflow-y-auto">
          {filteredFiles.map((file) => <button key={file.name} type="button" onClick={() => preview(file)} className={`rounded-lg border p-2 text-left ${selected === file.url ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>
            <div className="aspect-video rounded bg-black/50 overflow-hidden flex items-center justify-center">
              {file.kind === 'video' ? <video src={mediaUrl(file.url)} muted preload="metadata" className="w-full h-full object-contain" /> : file.kind === 'audio' ? <span className="text-3xl">♫</span> : <img src={mediaUrl(file.url)} alt="" className="w-full h-full object-contain" />}
            </div>
            <span className="mt-1 block text-xs font-bold break-all">{metadata[file.url]?.title || file.name}</span>
            <span className="text-[10px] text-foreground/50">{file.kind} · {Math.ceil((file.size || 0) / 1024)} KB</span>
          </button>)}
          {!filteredFiles.length && <p className="col-span-full text-xs text-foreground/50">Δεν υπάρχουν αρχεία σε αυτή την κατηγορία.</p>}
        </div>
      </ComicPanel>

      <div className="space-y-3">
        <ComicPanel className="bg-card space-y-3">
          <h3 className="font-heading text-lg">MEDIA PREVIEW & DETAILS</h3>
          {selectedFile ? <>
            <div className="rounded-lg bg-black/70 min-h-40 flex items-center justify-center p-2">
              {selectedFile.kind === 'video' ? <video ref={videoRef} key={selectedFile.url} src={selectedFile.url} controls playsInline className="max-h-64 max-w-full" /> : selectedFile.kind === 'audio' ? <audio ref={audioRef} key={selectedFile.url} src={selectedFile.url} controls className="w-full" /> : <img src={selectedFile.url} alt="" className="max-h-64 max-w-full object-contain" />}
            </div>
            <label className="block space-y-1 text-xs font-bold">ΤΙΤΛΟΣ<input className={field} value={selectedMeta.title || ''} onChange={(e) => setMetadata((v) => ({ ...v, [selected]: { ...selectedMeta, title: e.target.value } }))} onBlur={(e) => saveMetadata({ title: e.target.value })} /></label>
            <label className="block space-y-1 text-xs font-bold">ΦΑΚΕΛΟΣ / ΚΑΤΗΓΟΡΙΑ<select className={field} value={selectedMeta.folder || 'Γενικά'} onChange={(e) => saveMetadata({ folder: e.target.value })}>{folders.map((folder) => <option key={folder}>{folder}</option>)}</select></label>
            <label className="block space-y-1 text-xs font-bold">MODE / ΧΡΗΣΗ<input className={field} value={selectedMeta.mode || ''} placeholder="π.χ. Heist Night, Pajama…" onChange={(e) => setMetadata((v) => ({ ...v, [selected]: { ...selectedMeta, mode: e.target.value } }))} onBlur={(e) => saveMetadata({ mode: e.target.value })} /></label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block space-y-1 text-xs font-bold">ROUND<input className={field} value={selectedMeta.round || ''} onChange={(e) => setMetadata((v) => ({ ...v, [selected]: { ...selectedMeta, round: e.target.value } }))} onBlur={(e) => saveMetadata({ round: e.target.value })} /></label>
              <label className="block space-y-1 text-xs font-bold">SCENE / EVENT<input className={field} value={selectedMeta.scene || ''} onChange={(e) => setMetadata((v) => ({ ...v, [selected]: { ...selectedMeta, scene: e.target.value } }))} onBlur={(e) => saveMetadata({ scene: e.target.value })} /></label>
            </div>
            <label className="block space-y-1 text-xs font-bold">ΔΙΚΑΙΩΜΑΤΑ / ΣΥΓΚΑΤΑΘΕΣΗ
              <select className={field} value={selectedMeta.permission || 'cleared'} onChange={(e) => saveMetadata({ permission: e.target.value })}>
                <option value="cleared">Επιτρέπεται η χρήση</option><option value="pending">Εκκρεμεί άδεια / συγκατάθεση</option><option value="blocked">Απαγορεύεται η χρήση</option>
              </select>
            </label>
            <label className="block space-y-1 text-xs font-bold">ΣΗΜΕΙΩΣΕΙΣ / ΠΗΓΗ ΑΔΕΙΑΣ<textarea className={field} rows={2} value={selectedMeta.notes || ''} onChange={(e) => setMetadata((v) => ({ ...v, [selected]: { ...selectedMeta, notes: e.target.value } }))} onBlur={(e) => saveMetadata({ notes: e.target.value })} /></label>
            <div className="flex flex-wrap gap-2"><ComicButton size="sm" onClick={() => addToQueue(selectedFile)}>＋ ΣΤΗΝ ΟΥΡΑ</ComicButton><ComicButton size="sm" onClick={() => publish({ ...selectedFile, label: selectedMeta.title || selectedFile.name }, queueIndex)} disabled={busy || (selectedMeta.permission && selectedMeta.permission !== 'cleared')}>▶ ΑΜΕΣΗ ΠΡΟΒΟΛΗ TV</ComicButton></div>
          </> : <p className="text-xs text-foreground/50">Επίλεξε αρχείο από τη βιβλιοθήκη για προεπισκόπηση και διαχείριση.</p>}
        </ComicPanel>

        <ComicPanel className="bg-card space-y-3">
          <div className="flex items-center justify-between"><h3 className="font-heading text-lg">LIVE AV OUTPUT</h3><span className={`rounded-full px-2 py-1 text-[10px] ${cueRecord?.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-secondary text-foreground/60'}`}>{cueRecord?.active ? 'LIVE' : 'STANDBY'}</span></div>
          <p className="text-xs text-foreground/60">Η έξοδος στέλνει το επιλεγμένο media στην υπάρχουσα οθόνη /tv για το ενεργό Event.</p>
          <div className="grid grid-cols-3 gap-2"><ComicButton size="sm" disabled={busy || !queue.length} onClick={() => playQueue(0)}>▶ PLAY</ComicButton><ComicButton size="sm" variant="dark" disabled={busy || queueIndex <= 0} onClick={() => playQueue(-1)}>PREV</ComicButton><ComicButton size="sm" variant="dark" disabled={busy || queueIndex < 0 || queueIndex >= queue.length - 1} onClick={() => playQueue(1)}>NEXT</ComicButton></div>
          <ComicButton size="sm" variant="dark" disabled={busy} onClick={stopOutput}>■ STOP TV OUTPUT</ComicButton>
          <div className="text-xs text-foreground/60">Τρέχον στοιχείο: {currentCue?.label || '—'}</div>
          <div className="space-y-1 max-h-56 overflow-y-auto">{queue.map((item, index) => <div key={item.id} className={`flex items-center gap-1 rounded-lg border p-2 ${index === queueIndex ? 'border-primary bg-primary/10' : 'border-border'}`}><button className="min-w-0 flex-1 text-left text-xs truncate" onClick={() => publish(item, index)}>{index + 1}. {item.label}</button><button className="px-2 text-xs" disabled={index === 0} onClick={() => moveQueueItem(index, -1)}>↑</button><button className="px-2 text-xs" disabled={index === queue.length - 1} onClick={() => moveQueueItem(index, 1)}>↓</button><button className="px-2 text-xs text-red-400" onClick={() => removeQueueItem(item.id)}>×</button></div>)}</div>
          <div className="flex flex-wrap gap-2"><ComicButton size="sm" variant="dark" onClick={async () => { setQueue([]); setQueueIndex(-1); await persist(metadata, [], -1); }}>Καθαρισμός ουράς</ComicButton><a className="text-xs underline self-center" href="/tv" target="_blank" rel="noreferrer">Άνοιγμα TV Output ↗</a></div>
        </ComicPanel>
      </div>
    </div>
  </div>;
}
