import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { listMedia } from '@/lib/media';
import { publishProductionCue, commandProductionCue, stopProductionCue } from '@/lib/productionCue';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

const SETTINGS_KEY = 'av_control_room_v1';
const field = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm';
const kinds = [{ id: 'all', label: 'Όλα' }, { id: 'video', label: 'Βίντεο' }, { id: 'audio', label: 'Ήχος' }, { id: 'image', label: 'Εικόνες' }, { id: 'graphic', label: 'Γραφικά' }];
const folders = ['Γενικά', 'Intro & Opening', 'Sound Identity', 'Transitions', 'Commercial Breaks', 'Scenes', 'Highlights', 'Winner Reveal', 'Recap'];
const uid = () => globalThis.crypto?.randomUUID?.() || String(Date.now() + Math.random());

const AUTO_RULES = [
  ['Sound Identity', /^(sfx|sound|loop|sting)_/],
  ['Intro & Opening', /^(opening|logo_reveal)/],
  ['Transitions', /^transition/],
  ['Commercial Breaks', /^break/],
  ['Scenes', /^(scene|mode_intro)/],
  ['Highlights', /^highlight/],
  ['Winner Reveal', /^winner/],
  ['Recap', /^recap/],
];
const AUTO_TITLES = {
 "break_00_bumper": "Διάλειμμα: Επιστρέφουμε σε λίγο",
 "break_01_champagne": "Διάλειμμα: τοστ",
 "break_02_slippers": "Διάλειμμα: παντόφλες",
 "break_03_vault_dial": "Διάλειμμα: καντράν",
 "break_05_women_whisper": "Διάλειμμα: ψιθυρίζουν",
 "highlight_big_win": "ΜΕΓΑΛΗ ΝΙΚΗ",
 "highlight_laughter_montage": "ΤΑ ΚΑΛΥΤΕΡΑ ΓΕΛΙΑ",
 "highlight_penalty_reaction": "ΠΟΙΝΗ!",
 "highlight_team_cheer": "ΟΜΑΔΕΣ ALPHA & BETA",
 "highlight_vault_open": "ΑΝΟΙΓΕΙ ΤΟ ΧΡΗΜΑΤΟΚΙΒΩΤΙΟ",
 "logo_reveal": "Αποκάλυψη λογοτύπου",
 "opening_02_vault_awakens": "ΤΟ ΧΡΗΜΑΤΟΚΙΒΩΤΙΟ ΞΥΠΝΑ",
 "opening_03_the_four_enter": "ΟΙ ΠΑΙΚΤΡΙΕΣ",
 "opening_04_welcome_toast": "ΚΑΛΩΣΗΡΘΑΤΕ",
 "opening_05_rules_tease": "ΤΡΑΒΑ ΚΑΡΤΑ",
 "recap_00_goodbye": "ΕΥΧΑΡΙΣΤΟΥΜΕ ΠΟΥ ΠΑΙΞΑΤΕ",
 "recap_01_montage_open": "Η ΒΡΑΔΙΑ ΣΕ ΛΙΓΕΣ ΣΤΙΓΜΕΣ",
 "recap_02_golden_hour": "ΤΕΛΕΙΑ ΒΡΑΔΙΑ",
 "recap_03_goodnight": "ΚΑΛΗΝΥΧΤΑ",
 "recap_04_credits_bg": "ΕΥΧΑΡΙΣΤΟΥΜΕ ΠΟΥ ΠΑΙΞΑΤΕ",
 "mode_intro_arrest_heist": "Εισαγωγή Mode: ARREST & HEIST",
 "mode_intro_beach_bar": "Εισαγωγή Mode: BEACH BAR HOME LOCKDOWN",
 "mode_intro_classic": "Εισαγωγή Mode: ΚΛΑΣΣΙΚΗ",
 "mode_intro_lockdown": "Εισαγωγή Mode: PAJAMA LOCKDOWN",
 "mode_intro_marathon": "Εισαγωγή Mode: MEGA MARATHON",
 "mode_intro_pajama": "Εισαγωγή Mode: PAJAMA PEDI-GLAM",
 "scene_arrest_chase": "ΣΥΛΛΗΨΗ!",
 "scene_beach_last_queen": "LAST QUEEN",
 "scene_beach_wheel": "ΤΡΟΧΟΣ ΠΟΙΝΩΝ",
 "scene_heist_round_start": "ΓΥΡΟΣ ΛΗΣΤΕΙΑΣ",
 "scene_lockdown_cipher": "LEVEL 2 · SENSORY CIPHER",
 "scene_lockdown_exit_code": "LEVEL 4 · EXIT CODE",
 "scene_lockdown_level1": "LEVEL 1 · HOSTAGE SACRIFICE",
 "scene_pajama_pedicure": "ΒΡΑΔΥ ΠΕΡΙΠΟΙΗΣΗΣ",
 "transition_00_gold": "Μετάβαση χρυσή (λογότυπο)",
 "winner_00_reveal": "ΚΑΙ Η ΝΙΚΗΤΡΙΑ ΕΙΝΑΙ... / Η ΝΙΚΗΤΡΙΑ",
 "winner_01_envelope": "ΤΟ ΑΠΟΤΕΛΕΣΜΑ ΕΙΝΑΙ ΕΤΟΙΜΟ",
 "winner_02_vault_gold": "ΤΟ ΧΡΥΣΟ ΧΡΗΜΑΤΟΚΙΒΩΤΙΟ",
 "winner_03_crown_ceremony": "Η ΣΤΕΨΗ",
 "winner_04_confetti_burst": "ΜΠΡΑΒΟ!",
 "winner_05_spotlight_trophy": "Ο ΘΡΙΑΜΒΟΣ",
 "sting_logo": "Ήχος λογοτύπου",
 "loop_main_theme": "Κεντρικό θέμα (loop)",
 "loop_suspense_bed": "Υπόβαθρο αγωνίας (loop)",
 "sfx_vault_open": "Άνοιγμα χρηματοκιβωτίου",
 "sfx_key_turn": "Στρίψιμο κλειδιού",
 "sfx_card_deal": "Μοίρασμα καρτών",
 "sfx_dice_roll": "Ζάρια",
 "sfx_wheel_spin": "Τροχός ποινών",
 "sfx_countdown_tick": "Μέτρημα αντίστροφης",
 "sfx_heartbeat": "Χτύποι καρδιάς",
 "sfx_whoosh_transition": "Whoosh μετάβασης",
 "sfx_riser_reveal": "Riser αποκάλυψης",
 "sfx_win_fanfare": "Φανφάρα νίκης",
 "sfx_fail_buzzer": "Buzzer αποτυχίας",
 "sfx_applause_laughter": "Χειροκρότημα και γέλια",
 "sfx_ding_gold": "Ding πόντου",
 "sound_opening_theme": "Θέμα έναρξης",
 "sound_recap_theme": "Θέμα κλεισίματος"
};
// Τα αρχεία της βιβλιοθήκης έχουν όνομα «χρόνος-hex-όνομα.ext» (π.χ. lx3k9a-1f2e3d-opening-02-vault-awakens.mp4).
const normalizeMediaName = (name = '') => String(name).toLowerCase()
  .replace(/\.[a-z0-9]+$/, '')
  .replace(/^[a-z0-9]+-[a-f0-9]{6}-/, '')
  .replace(/[-\s]+/g, '_')
  .replace(/^\d+_/, '');
const prettyTitle = (key) => key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export default function AVControlRoom({ refreshKey = 0 }) {
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
  const [volume, setVolume] = useState(0.8);
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

  useEffect(() => { load(); }, [load, refreshKey]);
  useEffect(() => {
    if (!sessionCode) { setCueRecord(null); return undefined; }
    let alive = true;
    const refreshCue = () => base44.entities.ProductionCue.filter({ sessionCode }, { limit: 1 }).then(({ items = [] }) => {
      if (!alive) return;
      const nextCue = items[0] || null;
      setCueRecord(nextCue);
      if (Array.isArray(nextCue?.queue) && nextCue.queue.length && Number.isInteger(nextCue.queueIndex)) {
        setQueueIndex(nextCue.queueIndex);
      }
    }).catch(() => {});
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

  async function autoCategorize() {
    if (!files.length) return;
    const next = { ...metadata };
    let done = 0;
    let skipped = 0;
    for (const file of files) {
      const key = normalizeMediaName(file.name);
      const rule = AUTO_RULES.find(([, pattern]) => pattern.test(key));
      const folderName = rule ? rule[0] : (file.kind === 'audio' ? 'Sound Identity' : null);
      if (!folderName) { skipped += 1; continue; }
      const current = next[file.url] || {};
      next[file.url] = {
        ...current,
        folder: current.folder && current.folder !== 'Γενικά' ? current.folder : folderName,
        title: current.title || AUTO_TITLES[key] || prettyTitle(key),
      };
      done += 1;
    }
    setMetadata(next);
    try { await persist(next); setMessage(`Αυτόματη κατηγοριοποίηση: ${done} αρχεία οργανώθηκαν σε φακέλους, ${skipped} έμειναν ως έχουν (δεν αναγνωρίστηκε το όνομα).`); }
    catch (error) { setMessage(error.message || 'Δεν αποθηκεύτηκε η κατηγοριοποίηση.'); }
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
    if (assetMeta.permission !== 'cleared') { setMessage('Η προβολή είναι κλειδωμένη μέχρι να καταχωριστεί η απαιτούμενη άδεια ή συγκατάθεση.'); return; }
    setBusy(true);
    try {
      const data = {
        label: assetMeta.title || item.label || item.name,
        kind: item.kind === 'video' ? 'video' : item.kind === 'audio' ? 'audio' : 'image',
        source: item.url,
        mediaItemId: item.id || item.url,
        mediaFolder: assetMeta.folder || 'Γενικά',
        queue: queue[index]?.url === item.url ? queue : [],
        queueIndex: queue[index]?.url === item.url ? index : -1,
        volume,
      };
      const saved = await publishProductionCue(sessionCode, data);
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
      const saved = await stopProductionCue(sessionCode);
      if (saved) setCueRecord(saved);
      setMessage('Η έξοδος TV σταμάτησε.');
    } catch (error) { setMessage(error.message || 'Δεν ήταν δυνατή η διακοπή της εξόδου.'); }
  }

  async function sendPlaybackCommand(playbackCommand, nextVolume = volume) {
    if (!sessionCode) { setMessage('Επίλεξε πρώτα Event.'); return; }
    try {
      const saved = await commandProductionCue(sessionCode, playbackCommand, nextVolume);
      setCueRecord(saved);
      setMessage('Η εντολή χειρισμού στάλθηκε στην TV.');
    } catch (error) { setMessage(error.message || 'Δεν στάλθηκε η εντολή χειρισμού.'); }
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
        <div><h2 className="font-heading text-2xl text-primary">AV CONTROL ROOM — ΧΕΙΡΙΣΜΟΣ TV</h2><p className="text-xs text-foreground/60">Επιλογή αρχείων από την κεντρική βιβλιοθήκη για δικαιώματα, ουρά και ζωντανή έξοδο TV. Δεν ανεβάζει ούτε διατηρεί δεύτερη βιβλιοθήκη.</p></div>
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
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-heading text-lg">ΕΠΙΛΟΓΗ ΑΡΧΕΙΟΥ ΑΠΟ ΤΗΝ ΚΕΝΤΡΙΚΗ ΒΙΒΛΙΟΘΗΚΗ · {files.length}</h3><span className="text-[10px] text-foreground/50">Προβολή και επιλογή — χωρίς ανεβάσματα ή δεύτερο αποθηκευτικό χώρο</span><ComicButton size="sm" onClick={autoCategorize} disabled={busy || !files.length}>⚡ ΑΥΤΟΜΑΤΗ ΚΑΤΗΓΟΡΙΟΠΟΙΗΣΗ ΑΠΟ ΟΝΟΜΑ ΑΡΧΕΙΟΥ</ComicButton></div>
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
              <select className={field} value={selectedMeta.permission || 'pending'} onChange={(e) => saveMetadata({ permission: e.target.value })}>
                <option value="cleared">Επιτρέπεται η χρήση</option><option value="pending">Εκκρεμεί άδεια / συγκατάθεση</option><option value="blocked">Απαγορεύεται η χρήση</option>
              </select>
            </label>
            <label className="block space-y-1 text-xs font-bold">ΣΗΜΕΙΩΣΕΙΣ / ΠΗΓΗ ΑΔΕΙΑΣ<textarea className={field} rows={2} value={selectedMeta.notes || ''} onChange={(e) => setMetadata((v) => ({ ...v, [selected]: { ...selectedMeta, notes: e.target.value } }))} onBlur={(e) => saveMetadata({ notes: e.target.value })} /></label>
            <div className="flex flex-wrap gap-2"><ComicButton size="sm" onClick={() => addToQueue(selectedFile)}>＋ ΣΤΗΝ ΟΥΡΑ</ComicButton><ComicButton size="sm" onClick={() => publish({ ...selectedFile, label: selectedMeta.title || selectedFile.name }, queueIndex)} disabled={busy || selectedMeta.permission !== 'cleared'}>▶ ΑΜΕΣΗ ΠΡΟΒΟΛΗ TV</ComicButton></div>
          </> : <p className="text-xs text-foreground/50">Επίλεξε αρχείο από τη βιβλιοθήκη για προεπισκόπηση και διαχείριση.</p>}
        </ComicPanel>

        <ComicPanel className="bg-card space-y-3">
          <div className="flex items-center justify-between"><h3 className="font-heading text-lg">LIVE AV OUTPUT</h3><span className={`rounded-full px-2 py-1 text-[10px] ${cueRecord?.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-secondary text-foreground/60'}`}>{cueRecord?.active ? 'LIVE' : 'STANDBY'}</span></div>
          <p className="text-xs text-foreground/60">Η έξοδος στέλνει το επιλεγμένο media στην υπάρχουσα οθόνη /tv για το ενεργό Event.</p>
          <div className="grid grid-cols-3 gap-2"><ComicButton size="sm" disabled={busy || !queue.length} onClick={() => playQueue(0)}>▶ PLAY</ComicButton><ComicButton size="sm" variant="dark" disabled={busy || queueIndex <= 0} onClick={() => playQueue(-1)}>PREV</ComicButton><ComicButton size="sm" variant="dark" disabled={busy || queueIndex < 0 || queueIndex >= queue.length - 1} onClick={() => playQueue(1)}>NEXT</ComicButton></div>
          <div className="grid grid-cols-3 gap-2"><ComicButton size="sm" variant="dark" disabled={busy || !cueRecord?.active} onClick={() => sendPlaybackCommand("play")}>▶ CONTINUE</ComicButton><ComicButton size="sm" variant="dark" disabled={busy || !cueRecord?.active} onClick={() => sendPlaybackCommand("pause")}>Ⅱ PAUSE</ComicButton><ComicButton size="sm" variant="dark" disabled={busy || !cueRecord?.active} onClick={stopOutput}>■ STOP MEDIA</ComicButton></div>
          <div className="flex items-center gap-3 text-xs"><span>VOLUME</span><input aria-label="Ένταση TV" className="flex-1" type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(Number(e.target.value))} /><b>{Math.round(volume * 100)}%</b><ComicButton size="sm" variant="dark" disabled={busy || !cueRecord?.active} onClick={() => sendPlaybackCommand("volume", volume)}>SET</ComicButton><ComicButton size="sm" variant="dark" disabled={busy || !cueRecord?.active} onClick={() => sendPlaybackCommand("mute")}>MUTE</ComicButton><ComicButton size="sm" variant="dark" disabled={busy || !cueRecord?.active} onClick={() => sendPlaybackCommand("unmute")}>UNMUTE</ComicButton></div>
          <ComicButton size="sm" variant="dark" disabled={busy} onClick={stopOutput}>■ STOP TV OVERLAY</ComicButton>
          <div className="text-xs text-foreground/60">Τρέχον στοιχείο: {currentCue?.label || '—'}</div>
          <div className="space-y-1 max-h-56 overflow-y-auto">{queue.map((item, index) => <div key={item.id} className={`flex items-center gap-1 rounded-lg border p-2 ${index === queueIndex ? 'border-primary bg-primary/10' : 'border-border'}`}><button className="min-w-0 flex-1 text-left text-xs truncate" onClick={() => publish(item, index)}>{index + 1}. {item.label}</button><button className="px-2 text-xs" disabled={index === 0} onClick={() => moveQueueItem(index, -1)}>↑</button><button className="px-2 text-xs" disabled={index === queue.length - 1} onClick={() => moveQueueItem(index, 1)}>↓</button><button className="px-2 text-xs text-red-400" onClick={() => removeQueueItem(item.id)}>×</button></div>)}</div>
          <div className="flex flex-wrap gap-2"><ComicButton size="sm" variant="dark" onClick={async () => { setQueue([]); setQueueIndex(-1); await persist(metadata, [], -1); }}>Καθαρισμός ουράς</ComicButton><a className="text-xs underline self-center" href="/tv" target="_blank" rel="noreferrer">Άνοιγμα TV Output ↗</a></div>
        </ComicPanel>
      </div>
    </div>
  </div>;
}
