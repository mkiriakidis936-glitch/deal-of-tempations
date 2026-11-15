import React, { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { DIGITAL_CARDS } from '@/data/gameContent';
import { isVipActivityAllowed, canAssignVipActivity } from '@/lib/playerIntelligence';
import { INTENSITY_LEVELS, EXTRA4_CATEGORIES, getExtra4, addExtra4Event, pauseExtra4Timers, resumeExtra4Timers } from '@/lib/extra4';
import { isNewMode, modeMeta, ACT_META } from '@/data/modes/modeRegistry';
import { PAJAMA_ACTS } from '@/data/pajamaProgram';

const money = (value) => Math.max(0, Number(value) || 0);

function getSceneItems(state) {
  if (isNewMode(state.mode)) {
    const meta = modeMeta(state.mode);
    return (meta?.acts || []).map((id) => ({ id, label: ACT_META[id]?.title || id }));
  }
  if (state.mode === 'pajama') return PAJAMA_ACTS.map((act) => ({ id: act.id, label: act.title }));
  if (state.mode === 'marathon') return ['INFILTRATION', 'THE VAULT', 'POLICE RAIDS', 'TOTAL LOCKDOWN'].map((label, index) => ({ id: `marathon-${index + 1}`, label }));
  if (state.mode === 'arrest_heist') return ['ARREST & HEIST', 'GRAND HEIST', 'FINALE'].map((label, index) => ({ id: `arrest-${index + 1}`, label }));
  return ['Προετοιμασία', 'Περιπολία', 'Ανάκριση', 'Φινάλε'].map((label, index) => ({ id: `classic-${index}`, label }));
}

function getModeSceneIndex(state) {
  if (isNewMode(state.mode)) return state.mg?.actIndex || 0;
  if (state.mode === 'pajama') return state.pajama?.actIndex || 0;
  if (state.mode === 'marathon') return Math.max(0, (state.marathonStage || 1) - 1);
  if (state.mode === 'arrest_heist') return Math.max(0, (state.stage || 1) - 1);
  return state.stage || 0;
}

export default function Extra4Panel({ state, updateState, playerProfiles = [], playerProfilesReady = true, onOpen, onEndGame, onClose }) {
  const [tab, setTab] = useState('overview');
  const [category, setCategory] = useState('sensory');
  const [playerId, setPlayerId] = useState(state.players?.[0]?.id || '');
  const [amount, setAmount] = useState('1');
  const [lootName, setLootName] = useState('');
  const [lootRarity, setLootRarity] = useState('common');
  const [keyTarget, setKeyTarget] = useState('');
  const [terminalPlayer, setTerminalPlayer] = useState(state.players?.[0]?.id || '');
  const [terminalUrl, setTerminalUrl] = useState('');
  const extra4 = getExtra4(state);
  const activeCategory = EXTRA4_CATEGORIES.find((item) => item.id === category) || EXTRA4_CATEGORIES[0];
  const players = state.players || [];
  const activeActivity = extra4.activity.active;
  const activeTimer = state.syncTimer || state.mg?.timer || null;
  const timerRemaining = activeTimer?.endsAt ? Math.max(0, Math.ceil((activeTimer.endsAt - Date.now()) / 1000)) : activeTimer?.remaining;
  const updateExtra = (patch, rootPatch = {}) => updateState({ ...rootPatch, extra4: patch });
  const eventLog = extra4.eventLog.slice().reverse();
  const currentMode = state.mode || '—';
  const sceneItems = getSceneItems(state);
  const defaultSceneOrder = sceneItems.map((item) => item.id);
  const savedSceneOrder = extra4.scenes.modeId === currentMode && Array.isArray(extra4.scenes.order) ? extra4.scenes.order : [];
  const sceneOrder = [...savedSceneOrder.filter((id) => defaultSceneOrder.includes(id)), ...defaultSceneOrder.filter((id) => !savedSceneOrder.includes(id))];
  const modeSceneIndex = Math.max(0, Math.min(sceneItems.length - 1, getModeSceneIndex(state)));
  const autoSceneIndex = Math.max(0, sceneOrder.indexOf(sceneItems[modeSceneIndex]?.id));
  const currentSceneIndex = extra4.scenes.auto === false
    ? Math.max(0, Math.min(sceneOrder.length - 1, extra4.scenes.currentIndex || 0))
    : autoSceneIndex;
  const currentSceneId = sceneOrder[currentSceneIndex];
  const currentScene = sceneItems.find((item) => item.id === currentSceneId)?.label || sceneItems[0]?.label || '—';
  const activeTimers = [
    state.syncTimer ? { label: 'Κεντρικό', timer: state.syncTimer } : null,
    state.mg?.timer ? { label: 'Mode', timer: state.mg.timer } : null,
  ].filter(Boolean);
  const activityType = ['guessing', 'trivia'].includes(category) ? 'questions' : category === 'vip' ? 'surprises' : 'missions';
  const eligiblePlayers = players.filter((player) => isVipActivityAllowed({ playerProfiles, playerProfilesReady }, player, activityType));
  const activityCatalog = EXTRA4_CATEGORIES.flatMap((group) => group.actions.map((action) => ({ ...action, categoryId: group.id, categoryLabel: group.label })));

  async function pause() {
    if (extra4.control.status === 'paused') {
      const timers = resumeExtra4Timers(state);
      await updateExtra(
        { control: { ...extra4.control, status: 'running', resumedAt: Date.now(), pausedAt: null } },
        { ...timers, stopActive: false },
      );
      return;
    }
    if (extra4.control.status === 'emergency') return;
    const timers = pauseExtra4Timers(state);
    await updateExtra(
      { control: { ...extra4.control, status: 'paused', pausedAt: Date.now() } },
      { ...timers, stopActive: true },
    );
  }

  async function emergencyStop() {
    if (extra4.control.status === 'emergency') return;
    const timers = pauseExtra4Timers(state);
    await updateExtra(
      {
        control: {
          ...extra4.control,
          status: 'emergency',
          emergencyAt: Date.now(),
          requiresDirectorDecision: true,
          interrupted: {
            mode: state.mode || null,
            stage: state.stage ?? null,
            activeActivity: activeActivity || null,
            syncTimer: state.syncTimer || null,
          },
        },
        liveFeed: { ...extra4.liveFeed, status: 'off', requestedAt: null, cameraEnabled: false, microphoneEnabled: false, sourceToken: null, tvToken: null, offer: null, answer: null },
      },
      { ...timers, stopActive: true },
    );
  }

  async function continueAfterEmergency() {
    const timers = resumeExtra4Timers(state);
    await updateExtra(
      {
        control: { ...extra4.control, status: 'running', requiresDirectorDecision: false, continuedAt: Date.now(), emergencyAt: null },
        liveFeed: { ...extra4.liveFeed, status: 'off', requestedAt: null, cameraEnabled: false, microphoneEnabled: false },
      },
      { ...timers, stopActive: false },
    );
  }

  async function setLevel(level) {
    if (activeActivity?.status === 'active') return;
    const modePatch = state.mg ? { mg: { ...state.mg, intensity: level } } : { intensity: level };
    await updateExtra({ tactical: { ...extra4.tactical, level, modeId: currentMode, changedAt: Date.now() } }, modePatch);
  }

  async function startActivity(action, group = activeCategory) {
    const groupId = typeof group === 'string' ? group : group.id;
    const groupLabel = typeof group === 'string' ? (EXTRA4_CATEGORIES.find((item) => item.id === group)?.label || group) : group.label;
    const type = ['guessing', 'trivia'].includes(groupId) ? 'questions' : groupId === 'vip' ? 'surprises' : 'missions';
    const eligible = players.filter((player) => canAssignVipActivity({ playerProfiles, playerProfilesReady }, player, { activityType: type, activityLabel: groupLabel }));
    if (state.stopActive || extra4.control.status !== 'running' || activeActivity?.status === 'active' || eligible.length === 0) return;
    const catalogIndex = activityCatalog.findIndex((item) => item.id === action.id && item.categoryId === groupId);
    const item = { id: `activity-${Date.now()}`, actionId: action.id, label: action.label, category: groupLabel, status: 'active', startedAt: Date.now(), endedAt: null, result: null, mode: currentMode, participantIds: eligible.map((player) => player.id) };
    const eventLog = addExtra4Event(extra4, 'activity_started', `Έναρξη: ${item.label}`, { activityId: item.id, result: null });
    await updateExtra({ activity: { ...extra4.activity, active: item, queueIndex: catalogIndex >= 0 ? catalogIndex : extra4.activity.queueIndex }, eventLog });
    onOpen?.(action.id);
  }

  async function finishActivity(result) {
    if (!activeActivity || activeActivity.status !== 'active') return;
    const endedAt = Date.now();
    const completed = { ...activeActivity, status: 'completed', endedAt, result };
    let eventLog = addExtra4Event(extra4, 'activity_completed', `Ολοκλήρωση: ${activeActivity.label}`, { activityId: activeActivity.id, result });
    if (extra4.activity.auto && result !== 'cancelled' && result !== 'skipped') {
      const startIndex = Math.max(-1, activityCatalog.findIndex((item) => item.id === activeActivity.actionId && item.categoryId === (EXTRA4_CATEGORIES.find((group) => group.label === activeActivity.category)?.id || category)));
      let next = null;
      for (let step = 1; step <= activityCatalog.length; step += 1) {
        const candidate = activityCatalog[(startIndex + step) % activityCatalog.length];
        const type = ['guessing', 'trivia'].includes(candidate.categoryId) ? 'questions' : candidate.categoryId === 'vip' ? 'surprises' : 'missions';
        const eligible = players.filter((player) => canAssignVipActivity({ playerProfiles, playerProfilesReady }, player, { activityType: type, activityLabel: candidate.label }));
        if (eligible.length) { next = { candidate, eligible }; break; }
      }
      if (next && extra4.control.status === 'running') {
        const nextActivity = { id: `activity-${Date.now()}`, actionId: next.candidate.id, label: next.candidate.label, category: next.candidate.categoryLabel, status: 'active', startedAt: Date.now(), endedAt: null, result: null, mode: currentMode, participantIds: next.eligible.map((player) => player.id) };
        eventLog = addExtra4Event({ ...extra4, eventLog }, 'activity_started', `Αυτόματη επόμενη δραστηριότητα: ${nextActivity.label}`, { activityId: nextActivity.id, result: null });
        await updateExtra({ activity: { ...extra4.activity, active: nextActivity, queueIndex: activityCatalog.indexOf(next.candidate) }, eventLog });
        onOpen?.(next.candidate.id);
        return;
      }
    }
    await updateExtra({ activity: { ...extra4.activity, active: completed }, eventLog });
  }

  async function addTokens() {
    const value = money(amount);
    if (!playerId || !value) return;
    const tokens = { ...extra4.economy.tokens, [playerId]: money(extra4.economy.tokens[playerId]) + value };
    await updateExtra({ economy: { ...extra4.economy, tokens } });
    setAmount('1');
  }

  async function awardKey() {
    if (!playerId) return;
    const keys = { ...extra4.economy.keys, [playerId]: money(extra4.economy.keys[playerId]) + 1 };
    await updateExtra({ economy: { ...extra4.economy, keys } });
  }

  async function tradeKeyForTokens() {
    if (!playerId || money(extra4.economy.keys[playerId]) < 1 || money(amount) < 1) return;
    const keys = { ...extra4.economy.keys, [playerId]: money(extra4.economy.keys[playerId]) - 1 };
    const tokens = { ...extra4.economy.tokens, [playerId]: money(extra4.economy.tokens[playerId]) + money(amount) };
    await updateExtra({ economy: { ...extra4.economy, keys, tokens } });
  }

  async function addLootToPool() {
    if (!lootName.trim()) return;
    const item = { id: globalThis.crypto?.randomUUID?.() || `loot-${Date.now()}`, name: lootName.trim(), rarity: lootRarity, mode: currentMode, createdAt: Date.now() };
    await updateExtra({ economy: { ...extra4.economy, lootPool: [...(extra4.economy.lootPool || []), item] } });
    setLootName('');
  }

  async function rollLoot() {
    if (!playerId) return;
    const pool = extra4.economy.lootPool || [];
    const available = pool.filter((item) => !item.removedAt && !item.consumedAt && (item.mode === currentMode || item.mode === 'all'));
    if (!available.length) return;
    const selected = available[Math.floor(Math.random() * available.length)];
    const inventory = { ...extra4.economy.inventory, [playerId]: [...(extra4.economy.inventory[playerId] || []), { ...selected, awardedAt: Date.now() }] };
    const lootPool = pool.map((item) => item.id === selected.id ? { ...item, consumedAt: Date.now() } : item);
    await updateExtra({ economy: { ...extra4.economy, inventory, lootPool } });
  }

  async function tradeKeyForLoot() {
    if (!playerId || money(extra4.economy.keys[playerId]) < 1) return;
    const pool = extra4.economy.lootPool || [];
    const available = pool.filter((item) => !item.removedAt && !item.consumedAt && (item.mode === currentMode || item.mode === 'all'));
    if (!available.length) return;
    const selected = available[Math.floor(Math.random() * available.length)];
    const keys = { ...extra4.economy.keys, [playerId]: money(extra4.economy.keys[playerId]) - 1 };
    const inventory = { ...extra4.economy.inventory, [playerId]: [...(extra4.economy.inventory[playerId] || []), { ...selected, awardedAt: Date.now() }] };
    const lootPool = pool.map((item) => item.id === selected.id ? { ...item, consumedAt: Date.now() } : item);
    await updateExtra({ economy: { ...extra4.economy, keys, inventory, lootPool } });
  }

  async function removeLootFromPool(id) {
    await updateExtra({ economy: { ...extra4.economy, lootPool: (extra4.economy.lootPool || []).map((item) => item.id === id ? { ...item, removedAt: Date.now() } : item) } });
  }

  async function releaseRestriction() {
    if (!playerId || !keyTarget || money(extra4.economy.keys[playerId]) < 1) return;
    const keys = { ...extra4.economy.keys, [playerId]: money(extra4.economy.keys[playerId]) - 1 };
    const restrictions = { ...extra4.economy.restrictions };
    restrictions[keyTarget] = null;
    await updateExtra({ economy: { ...extra4.economy, keys, restrictions } });
    setKeyTarget('');
  }

  function createFeedToken() {
    const bytes = new Uint8Array(32);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
  }

  async function requestLiveFeed() {
    const sourceToken = createFeedToken();
    const tvToken = createFeedToken();
    await updateExtra({
      liveFeed: {
        ...extra4.liveFeed,
        status: 'requested',
        requestedAt: Date.now(),
        cameraEnabled: false,
        microphoneEnabled: false,
        sourceToken,
        tvToken,
        offer: null,
        answer: null,
        restartRequest: 0,
      },
    });
  }

  async function stopLiveFeed() {
    await updateExtra({
      liveFeed: {
        ...extra4.liveFeed,
        status: 'off',
        requestedAt: null,
        cameraEnabled: false,
        microphoneEnabled: false,
        sourceToken: null,
        tvToken: null,
        offer: null,
        answer: null,
      },
    });
  }

  async function issueTerminal() {
    if (!terminalPlayer) return;
    const code = globalThis.crypto?.randomUUID?.() || `terminal-${Date.now()}`;
    const activityId = activeActivity?.status === 'active' ? activeActivity.id : null;
    const activityQuery = activityId ? `&activity=${encodeURIComponent(activityId)}` : '';
    const url = `${window.location.origin}/play?code=${encodeURIComponent(state.sessionCode || '')}&terminal=${encodeURIComponent(code)}&player=${encodeURIComponent(terminalPlayer)}${activityQuery}`;
    const terminals = { ...(extra4.cards.terminals || {}), [code]: { code, playerId: terminalPlayer, activityId, url, active: true, createdAt: Date.now() } };
    await updateExtra({ cards: { ...extra4.cards, terminals } });
    setTerminalUrl(url);
  }

  async function deleteTerminal(code) {
    const terminal = extra4.cards.terminals?.[code];
    if (!terminal || terminal.active) return;
    const terminals = { ...(extra4.cards.terminals || {}) };
    terminals[code] = null;
    await updateExtra({ cards: { ...extra4.cards, terminals } });
  }

  async function deactivateTerminal(code) {
    const terminals = { ...(extra4.cards.terminals || {}) };
    if (terminals[code]) terminals[code] = { ...terminals[code], active: false, deactivatedAt: Date.now() };
    await updateExtra({ cards: { ...extra4.cards, terminals } });
    if (terminalUrl.includes(code)) setTerminalUrl('');
  }

  async function selectCard(card) {
    await updateExtra({ cards: { ...extra4.cards, activeCard: { ...card, selectedAt: Date.now() } } });
  }

  const terminalEntries = useMemo(() => Object.values(extra4.cards.terminals || {}).filter(Boolean).sort((a, b) => b.createdAt - a.createdAt), [extra4.cards.terminals]);

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-background/98 p-3 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl space-y-3 pb-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="ds-eyebrow text-primary/80">DEAL OF TEMPTATION</div>
            <div className="ds-title text-2xl">EXTRA 4.0 CONTROL</div>
          </div>
          <ComicButton variant="red" size="sm" onClick={onClose}>ΚΛΕΙΣΙΜΟ</ComicButton>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ['overview', 'ΕΠΙΣΚΟΠΗΣΗ'], ['tactical', 'TACTICAL LEVELS'], ['games', 'MINI-GAMES'],
            ['scenes', 'SCENE DIRECTOR'], ['economy', 'KEY HEIST & ECONOMY'], ['cards', 'CARDS & QR'], ['live', 'LIVE FEED'],
          ].map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`rounded-lg border px-3 py-2 text-xs font-bold ${tab === id ? 'border-primary bg-primary text-tarot-dark' : 'border-border bg-card text-foreground'}`}>{label}</button>)}
        </div>

        {tab === 'overview' && <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ComicPanel className="bg-card p-3"><div className="ds-label text-foreground/50">MODE</div><div className="font-heading text-lg text-primary">{currentMode}</div></ComicPanel>
            <ComicPanel className="bg-card p-3"><div className="ds-label text-foreground/50">ΠΑΙΚΤΕΣ</div><div className="font-heading text-2xl">{players.length}</div></ComicPanel>
            <ComicPanel className="bg-card p-3"><div className="ds-label text-foreground/50">ΧΡΟΝΟΜΕΤΡΟ</div><div className="font-heading text-2xl">{timerRemaining == null ? '—' : `${Math.floor(timerRemaining / 60)}:${String(timerRemaining % 60).padStart(2, '0')}`}</div></ComicPanel>
            <ComicPanel className="bg-card p-3"><div className="ds-label text-foreground/50">ΚΑΤΑΣΤΑΣΗ</div><div className="font-heading text-lg">{extra4.control.status === 'emergency' ? 'EMERGENCY STOP' : extra4.control.status === 'paused' ? 'PAUSE' : 'LIVE'}</div></ComicPanel>
          </div>
          <ComicPanel className="bg-card space-y-3">
            <div className="ds-label text-primary/80">ΚΕΝΤΡΙΚΟΣ ΕΛΕΓΧΟΣ</div>
            <div className="grid grid-cols-2 gap-2">
              <ComicButton variant={extra4.control.status === 'paused' ? 'green' : 'yellow'} onClick={pause} disabled={extra4.control.status === 'emergency'}>{extra4.control.status === 'paused' ? '▶ ΣΥΝΕΧΕΙΑ' : '⏸ PAUSE'}</ComicButton>
              <ComicButton variant="red" onClick={emergencyStop} disabled={extra4.control.status === 'emergency'}>EMERGENCY STOP</ComicButton>
            </div>
            {extra4.control.status === 'emergency' && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 space-y-2">
              <div className="font-heading text-destructive">ΕΠΕΙΓΟΥΣΑ ΔΙΑΚΟΠΗ — ΑΠΑΙΤΕΙΤΑΙ ΑΠΟΦΑΣΗ DIRECTOR</div>
              <div className="text-xs text-foreground/70">Mode: {extra4.control.interrupted?.mode || '—'} · Στάδιο: {extra4.control.interrupted?.stage ?? '—'}</div>
              <div className="flex gap-2"><ComicButton variant="green" onClick={continueAfterEmergency}>ΣΥΝΕΧΙΣΗ ΕΠΕΙΣΟΔΙΟΥ</ComicButton><ComicButton variant="red" onClick={onEndGame}>ΤΕΡΜΑΤΙΣΜΟΣ</ComicButton></div>
            </div>}
            <div className="text-xs text-foreground/55">Το PAUSE διατηρεί το υπόλοιπο χρόνου. Το EMERGENCY STOP απαιτεί απόφαση του Director και δεν επανεκκινεί αυτόματα.</div>
          </ComicPanel>
          <ComicPanel className="bg-card space-y-2">
            <div className="ds-label text-primary/80">ΕΝΕΡΓΑ ΧΡΟΝΟΜΕΤΡΑ</div>
            {activeTimers.length ? activeTimers.map((entry) => {
              const remaining = entry.timer.running === false ? entry.timer.remaining : entry.timer.endsAt ? Math.max(0, Math.ceil((entry.timer.endsAt - Date.now()) / 1000)) : entry.timer.remaining;
              return <div key={entry.label} className="flex items-center justify-between border-b border-border/40 py-2 text-sm"><span>{entry.label}</span><strong>{Math.floor(Math.max(0, remaining || 0) / 60)}:{String(Math.max(0, remaining || 0) % 60).padStart(2, '0')}</strong></div>;
            }) : <div className="text-xs text-foreground/50">Δεν υπάρχουν ενεργά χρονόμετρα.</div>}
          </ComicPanel>
          <ComicPanel className="bg-card space-y-2">
            <div className="ds-label text-primary/80">ΠΑΙΚΤΕΣ — LIVE STATUS</div>
            {players.map((player) => <div key={player.id} className="flex items-center justify-between border-b border-border/50 py-2 text-sm"><span>{player.name}</span><span className="text-xs text-foreground/60">{player.team || '—'} · {extra4.economy.tokens[player.id] || 0} Tokens · {extra4.economy.keys[player.id] || 0} Keys</span></div>)}
          </ComicPanel>
          <ComicPanel className="bg-card space-y-2">
            <div className="ds-label text-primary/80">BASIC EVENT LOG</div>
            {eventLog.length ? eventLog.slice(0, 8).map((event) => <div key={event.id} className="flex justify-between gap-2 border-b border-border/40 py-1 text-xs"><span>{event.detail}</span><span className="shrink-0 text-foreground/45">{new Date(event.timestamp).toLocaleTimeString('el-GR')}</span></div>) : <div className="text-xs text-foreground/50">Δεν υπάρχουν καταγεγραμμένες δραστηριότητες.</div>}
          </ComicPanel>
        </>}

        {tab === 'tactical' && <ComicPanel className="bg-card space-y-3">
          <div className="ds-label text-primary/80">TACTICAL LEVEL — ΚΟΙΝΟ ΓΙΑ ΟΛΟΥΣ</div>
          <div className="text-sm">Ενεργό επίπεδο: <strong className="text-primary">{INTENSITY_LEVELS.find((item) => item.id === extra4.tactical.level)?.name || extra4.tactical.level}</strong></div>
          <div className="grid gap-2 sm:grid-cols-3">
            {INTENSITY_LEVELS.map((item) => <button key={item.id} disabled={activeActivity?.status === 'active' || extra4.control.status !== 'running'} onClick={() => setLevel(item.id)} className={`rounded-xl border-2 p-3 text-left disabled:opacity-40 ${extra4.tactical.level === item.id ? 'border-primary bg-primary/10' : 'border-border bg-secondary'}`}><div className="font-heading text-lg">{item.icon} {item.name}</div><div className="mt-1 text-xs text-foreground/60">{item.desc}</div></button>)}
          </div>
          <div className="text-xs text-foreground/55">Η δυσκολία είναι κοινή για όλους. Αλλάζει μόνο από τον Director και μόνο μεταξύ δραστηριοτήτων. Με αλλαγή Mode επανέρχεται στο STANDARD.</div>
        </ComicPanel>}

        {tab === 'games' && <div className="space-y-3">
          <ComicPanel className="bg-card space-y-3">
            <div className="ds-label text-primary/80">INTERACTIVE MINI-GAMES</div>
            <div className="flex flex-wrap gap-2">{EXTRA4_CATEGORIES.map((item) => <button key={item.id} onClick={() => setCategory(item.id)} className={`rounded-lg border px-3 py-2 text-xs ${category === item.id ? 'border-primary bg-primary text-tarot-dark' : 'border-border bg-secondary'}`}>{item.label}</button>)}</div>
            <div className="grid gap-2 sm:grid-cols-2">{activeCategory.actions.map((action) => <ComicButton key={action.id} disabled={!!(activeActivity?.status === 'active') || extra4.control.status !== 'running'} onClick={() => startActivity(action)}>{action.label}</ComicButton>)}</div>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={extra4.activity.auto !== false} onChange={(e) => updateExtra({ activity: { ...extra4.activity, auto: e.target.checked } })} /> Αυτόματη επιλογή επόμενης δραστηριότητας</label>
            <div className="text-xs text-foreground/50">Επιλέξιμοι παίκτες για την κατηγορία: {eligiblePlayers.length}/{players.length}. Οι δηλωμένες προτιμήσεις ελέγχονται πριν από την ανάθεση.</div>
            {activeActivity?.status === 'active' && <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 space-y-2"><div className="font-heading text-primary">ΕΝΕΡΓΗ ΔΡΑΣΤΗΡΙΟΤΗΤΑ: {activeActivity.label}</div><div className="text-xs text-foreground/60">Συμμετέχοντες: {(activeActivity.participantIds || []).map((id) => players.find((player) => player.id === id)?.name || id).join(', ') || '—'}</div><div className="flex flex-wrap gap-2"><ComicButton variant="green" onClick={() => finishActivity('completed')}>ΟΛΟΚΛΗΡΩΘΗΚΕ</ComicButton><ComicButton variant="yellow" onClick={() => finishActivity('success')}>ΕΠΙΤΥΧΙΑ</ComicButton><ComicButton variant="red" onClick={() => finishActivity('failed')}>ΑΠΟΤΥΧΙΑ</ComicButton><ComicButton variant="dark" onClick={() => finishActivity('skipped')}>ΠΑΡΑΛΕΙΨΗ</ComicButton><ComicButton variant="red" onClick={() => finishActivity('cancelled')}>ΑΚΥΡΩΣΗ</ComicButton></div></div>}
          </ComicPanel>
        </div>}

        {tab === 'scenes' && <ComicPanel className="bg-card space-y-3">
          <div className="ds-label text-primary/80">HYBRID SCENE DIRECTOR</div>
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="text-xs text-foreground/50">ΕΝΕΡΓΟ MODE · ΤΡΕΧΟΥΣΑ ΣΚΗΝΗ</div>
            <div className="mt-1 font-heading text-2xl text-primary">{currentScene}</div>
            <div className="mt-1 text-xs text-foreground/55">Η αυτόματη λειτουργία ακολουθεί τη φάση του Mode. Η χειροκίνητη λειτουργία ελέγχει μόνο τη σειρά παρουσίασης και δεν αλλάζει τους κανόνες ή το στάδιο του παιχνιδιού.</div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={extra4.scenes.auto !== false} onChange={(e) => updateExtra({ scenes: { ...extra4.scenes, auto: e.target.checked, modeId: currentMode, order: sceneOrder, currentIndex: autoSceneIndex, current: sceneItems[sceneOrder[autoSceneIndex]]?.label || currentScene } })} /> Αυτόματη παρακολούθηση εξέλιξης σκηνών</label>
          <div className="space-y-1">
            {sceneOrder.map((id, index) => {
              const item = sceneItems.find((scene) => scene.id === id);
              if (!item) return null;
              return <div key={id} className={`flex items-center gap-2 rounded-lg border p-2 text-sm ${index === currentSceneIndex ? 'border-primary bg-primary/10' : 'border-border bg-secondary'}`}>
                <span className="flex-1">{index + 1}. {item.label}{index === currentSceneIndex ? ' · ΤΡΕΧΟΥΣΑ' : ''}</span>
                <button disabled={index === 0} onClick={() => { const next = [...sceneOrder]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; updateExtra({ scenes: { ...extra4.scenes, modeId: currentMode, order: next } }); }} className="rounded border border-border px-2 py-1 text-xs disabled:opacity-30">↑</button>
                <button disabled={index === sceneOrder.length - 1} onClick={() => { const next = [...sceneOrder]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; updateExtra({ scenes: { ...extra4.scenes, modeId: currentMode, order: next } }); }} className="rounded border border-border px-2 py-1 text-xs disabled:opacity-30">↓</button>
              </div>;
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            <ComicButton variant="yellow" onClick={() => updateExtra({ scenes: { ...extra4.scenes, auto: false, modeId: currentMode, order: sceneOrder, currentIndex: (currentSceneIndex + 1) % sceneOrder.length, current: sceneItems[sceneOrder[(currentSceneIndex + 1) % sceneOrder.length]]?.label || currentScene } })} disabled={sceneOrder.length < 2}>ΠΑΡΑΛΕΙΨΗ ΣΚΗΝΗΣ</ComicButton>
            <ComicButton variant="dark" onClick={() => updateExtra({ scenes: { ...extra4.scenes, modeId: currentMode, order: sceneOrder, currentIndex: currentSceneIndex, current: currentScene, replayAt: Date.now() } })}>ΕΠΑΝΑΛΗΨΗ ΣΚΗΝΗΣ</ComicButton>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <ComicButton onClick={() => onOpen?.('showdirector')}>SCENE DIRECTOR</ComicButton>
            <ComicButton variant="yellow" onClick={() => onOpen?.('eventqueue')}>ΑΝΑΚΟΙΝΩΣΗ / EVENT QUEUE</ComicButton>
            <ComicButton variant="purple" onClick={() => onOpen?.('finalepres')}>SPECIAL SCENE / FINALE</ComicButton>
          </div>
          <div className="text-xs text-foreground/55">Ο Director μπορεί να αναδιατάξει τη σειρά, να παραλείψει ή να επαναλάβει σκηνή και να ενεργοποιήσει ειδική παρουσίαση ή ανακοίνωση.</div>
        </ComicPanel>}

        {tab === 'economy' && <div className="grid gap-3 lg:grid-cols-2">
          <ComicPanel className="bg-card space-y-3">
            <div className="ds-label text-primary/80">GLAM TOKENS & KEY HEIST</div>
            <label className="block text-xs">Παίκτης<select className="mt-1 w-full rounded-lg border border-border bg-background p-2" value={playerId} onChange={(e) => setPlayerId(e.target.value)}>{players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
            <div className="grid grid-cols-2 gap-2"><div className="rounded bg-secondary p-3"><div className="text-xs text-foreground/50">TOKENS</div><div className="font-heading text-2xl">{extra4.economy.tokens[playerId] || 0}</div></div><div className="rounded bg-secondary p-3"><div className="text-xs text-foreground/50">KEYS</div><div className="font-heading text-2xl">{extra4.economy.keys[playerId] || 0}</div></div></div>
            <label className="block text-xs">Ποσότητα Tokens<input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background p-2" /></label>
            <div className="flex flex-wrap gap-2"><ComicButton onClick={addTokens} disabled={!playerId || money(amount) < 1}>ΑΠΟΝΟΜΗ TOKENS</ComicButton><ComicButton variant="yellow" onClick={awardKey} disabled={!playerId}>ΑΠΟΝΟΜΗ KEY</ComicButton></div>
          </ComicPanel>
          <ComicPanel className="bg-card space-y-3">
            <div className="ds-label text-primary/80">ΧΡΗΣΗ ΚΛΕΙΔΙΟΥ</div>
            <label className="block text-xs">Παίκτης που διαθέτει Key<select className="mt-1 w-full rounded-lg border border-border bg-background p-2" value={playerId} onChange={(e) => setPlayerId(e.target.value)}>{players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
            <label className="block text-xs">Σύμμαχος για ψηφιακή απελευθέρωση<select className="mt-1 w-full rounded-lg border border-border bg-background p-2" value={keyTarget} onChange={(e) => setKeyTarget(e.target.value)}><option value="">Επίλεξε παίκτη</option>{players.filter((p) => p.id !== playerId && extra4.economy.restrictions[p.id]).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
            <ComicButton variant="green" onClick={releaseRestriction} disabled={!keyTarget || money(extra4.economy.keys[playerId]) < 1}>ΑΠΕΛΕΥΘΕΡΩΣΗ ΣΥΜΜΑΧΟΥ</ComicButton>
            <div className="flex flex-wrap gap-2"><ComicButton variant="yellow" onClick={tradeKeyForTokens} disabled={money(extra4.economy.keys[playerId]) < 1 || money(amount) < 1}>ΑΝΤΑΛΛΑΓΗ KEY → TOKENS</ComicButton><ComicButton variant="purple" onClick={tradeKeyForLoot} disabled={money(extra4.economy.keys[playerId]) < 1 || !(extra4.economy.lootPool || []).some((item) => item.mode === currentMode || item.mode === 'all')}>ΑΝΤΑΛΛΑΓΗ KEY → LOOT</ComicButton></div>
            <div className="text-xs text-foreground/50">Η ανταλλαγή Tokens γίνεται με ποσότητα που ορίζει ο Director. Το Loot επιλέγεται τυχαία από το διαθέσιμο pool του ενεργού Mode.</div>
          </ComicPanel>
          <ComicPanel className="bg-card space-y-3">
            <div className="ds-label text-primary/80">LOOT POOL — {currentMode}</div>
            <div className="grid grid-cols-2 gap-2">
              <input value={lootName} onChange={(e) => setLootName(e.target.value)} placeholder="Όνομα Loot" className="rounded-lg border border-border bg-background p-2 text-sm" />
              <select value={lootRarity} onChange={(e) => setLootRarity(e.target.value)} className="rounded-lg border border-border bg-background p-2 text-sm">
                <option value="common">Common</option><option value="rare">Rare</option><option value="epic">Epic</option><option value="legendary">Legendary</option>
              </select>
            </div>
            <ComicButton size="sm" onClick={addLootToPool} disabled={!lootName.trim()}>ΠΡΟΣΘΗΚΗ ΣΤΟ LOOT POOL</ComicButton>
            <ComicButton variant="yellow" onClick={rollLoot} disabled={!playerId || !(extra4.economy.lootPool || []).some((item) => item.mode === currentMode || item.mode === 'all')}>LOOT ROULETTE ΓΙΑ {players.find((player) => player.id === playerId)?.name || 'ΠΑΙΚΤΗ'}</ComicButton>
            {(extra4.economy.lootPool || []).filter((item) => !item.removedAt && !item.consumedAt && (item.mode === currentMode || item.mode === 'all')).map((item) => <div key={item.id} className="flex items-center justify-between gap-2 border-b border-border/50 py-2 text-xs"><span>{item.name} · {item.rarity.toUpperCase()}</span><ComicButton size="sm" variant="red" onClick={() => removeLootFromPool(item.id)}>ΑΦΑΙΡΕΣΗ</ComicButton></div>)}
            <div className="border-t border-border/50 pt-2"><div className="ds-label mb-2">INVENTORY</div>{players.map((player) => <div key={player.id} className="py-1 text-xs"><strong>{player.name}:</strong> {(extra4.economy.inventory[player.id] || []).map((item) => `${item.name} (${item.rarity})`).join(', ') || '—'}</div>)}</div>
          </ComicPanel>
        </div>}

        {tab === 'cards' && <div className="space-y-3">
          <ComicPanel className="bg-card space-y-3">
            <div className="ds-label text-primary/80">DIGITAL CARDS</div>
            <div className="grid gap-2 sm:grid-cols-2">{(DIGITAL_CARDS || []).map((card) => <div key={card.id} className="rounded-lg border border-border bg-secondary p-3"><div className="font-heading">{card.icon} {card.name}</div><div className="mt-1 text-xs text-foreground/60">{card.desc}</div><ComicButton size="sm" className="mt-2 w-full" onClick={() => selectCard(card)}>ΕΠΙΛΟΓΗ ΚΑΡΤΑΣ</ComicButton></div>)}</div>
            {extra4.cards.activeCard && <div className="rounded-lg border border-primary/40 bg-primary/5 p-3"><div className="font-heading text-primary">ΕΠΙΛΕΓΜΕΝΗ ΚΑΡΤΑ: {extra4.cards.activeCard.name}</div><div className="text-sm">{extra4.cards.activeCard.desc}</div><ComicButton size="sm" variant="red" onClick={() => updateExtra({ cards: { ...extra4.cards, activeCard: null } })}>ΚΑΘΑΡΙΣΜΟΣ TV ΚΑΡΤΑΣ</ComicButton></div>}
          </ComicPanel>
          <ComicPanel className="bg-card space-y-3">
            <div className="ds-label text-primary/80">QR TERMINALS</div>
            <label className="block text-xs">Σύνδεση με παίκτη<select className="mt-1 w-full rounded-lg border border-border bg-background p-2" value={terminalPlayer} onChange={(e) => setTerminalPlayer(e.target.value)}>{players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
            <ComicButton onClick={issueTerminal} disabled={!terminalPlayer || !state.sessionCode}>ΔΗΜΙΟΥΡΓΙΑ QR TERMINAL</ComicButton>
            {terminalUrl && <div className="rounded-lg bg-white p-3 text-center"><QRCodeSVG value={terminalUrl} size={180} /><div className="mt-2 break-all text-xs text-black">{terminalUrl}</div></div>}
            {terminalEntries.map((terminal) => <div key={terminal.code} className="flex items-center justify-between gap-2 border-b border-border py-2 text-xs"><span>{players.find((p) => p.id === terminal.playerId)?.name || 'Παίκτης'} · {terminal.active ? 'ΕΝΕΡΓΟ' : 'ΑΝΕΝΕΡΓΟ'}</span>{terminal.active ? <ComicButton size="sm" variant="red" onClick={() => deactivateTerminal(terminal.code)}>ΑΠΕΝΕΡΓΟΠΟΙΗΣΗ</ComicButton> : <ComicButton size="sm" variant="red" onClick={() => deleteTerminal(terminal.code)}>ΔΙΑΓΡΑΦΗ QR</ComicButton>}</div>)}
          </ComicPanel>
          <div className="text-xs text-foreground/55">Οι υπάρχουσες VIP προσκλήσεις και οι φόρμες διαχειρίζονται από την ενότητα Admin → Digital Invitations.</div>
        </div>}

        {tab === 'live' && <ComicPanel className="bg-card space-y-3">
          <div className="ds-label text-primary/80">ISOLATION CHAMBER — LIVE FEED</div>
          <div className="text-sm">Κατάσταση: <strong>{extra4.liveFeed.status === 'requested' ? 'ΑΝΑΜΟΝΗ ΣΥΝΑΙΝΕΣΗΣ' : extra4.liveFeed.status === 'connected' ? 'ΣΥΝΔΕΔΕΜΕΝΟ' : extra4.liveFeed.status === 'connecting' || extra4.liveFeed.status === 'reconnecting' ? 'ΣΥΝΔΕΣΗ' : 'ΑΝΕΝΕΡΓΟ'}</strong></div>
          <div className="flex flex-wrap gap-2"><ComicButton onClick={requestLiveFeed} disabled={extra4.control.status !== 'running' || extra4.liveFeed.status !== 'off'}>ΑΙΤΗΜΑ ΕΝΑΡΞΗΣ LIVE FEED</ComicButton><ComicButton variant="red" onClick={stopLiveFeed} disabled={extra4.liveFeed.status === 'off'}>STOP FEED</ComicButton></div>
          {extra4.liveFeed.sourceToken && extra4.liveFeed.tvToken && <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-secondary p-3 space-y-2">
              <div className="font-heading text-sm text-primary">ΣΥΣΚΕΥΗ ISOLATION CHAMBER</div>
              <div className="break-all text-[10px] text-foreground/60">{window.location.origin}/isolation?code={encodeURIComponent(state.sessionCode || '')}&token={extra4.liveFeed.sourceToken}</div>
              <ComicButton size="sm" className="w-full" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/isolation?code=${encodeURIComponent(state.sessionCode || '')}&token=${extra4.liveFeed.sourceToken}`)}>ΑΝΤΙΓΡΑΦΗ LINK ΠΗΓΗΣ</ComicButton>
            </div>
            <div className="rounded-lg border border-border bg-secondary p-3 space-y-2">
              <div className="font-heading text-sm text-primary">TV LIVE FEED</div>
              <div className="break-all text-[10px] text-foreground/60">{window.location.origin}/tv?code={encodeURIComponent(state.sessionCode || '')}&feedToken={extra4.liveFeed.tvToken}</div>
              <ComicButton size="sm" className="w-full" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/tv?code=${encodeURIComponent(state.sessionCode || '')}&feedToken=${extra4.liveFeed.tvToken}`)}>ΑΝΤΙΓΡΑΦΗ LINK TV</ComicButton>
            </div>
          </div>}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!extra4.liveFeed.tvPip} onChange={(e) => updateExtra({ liveFeed: { ...extra4.liveFeed, tvPip: e.target.checked } })} /> Picture-in-Picture στην TV</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!extra4.liveFeed.tvAudio} onChange={(e) => updateExtra({ liveFeed: { ...extra4.liveFeed, tvAudio: e.target.checked } })} /> Επιτρέπεται αίτημα ήχου στην TV</label>
          <div className="text-xs text-foreground/55">Η κάμερα και το μικρόφωνο ενεργοποιούνται μόνο μετά από χειροκίνητη συναίνεση στη συσκευή πηγής. Η μετάδοση WebRTC χρησιμοποιεί το τοπικό δίκτυο χωρίς αποθήκευση βίντεο.</div>
        </ComicPanel>}

      </div>
    </div>
  );
}
