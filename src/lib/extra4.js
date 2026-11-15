import { INTENSITY_LEVELS } from '@/data/gameConfig';
import { isNewMode, modeMeta, ACT_META } from '@/data/modes/modeRegistry';
import { PAJAMA_ACTS } from '@/data/pajamaProgram';

export const EXTRA4_VERSION = '4.0';

export const EXTRA4_CATEGORIES = [
  { id: 'sensory', label: 'Sensory Challenges', actions: [{ id: 'oracle', label: 'Blind Oracle' }, { id: 'audio', label: 'Audio Challenge' }] },
  { id: 'guessing', label: 'Guessing Games', actions: [{ id: 'trivia', label: 'Trivia Know Me' }] },
  { id: 'roulette', label: 'Roulette Challenges', actions: [{ id: 'shoe', label: 'Shoe Roulette' }, { id: 'slots', label: 'Temptation Slots' }, { id: 'karmaslots', label: 'Karma Slots' }] },
  { id: 'reaction', label: 'Reaction & Reflex', actions: [{ id: 'eventqueue', label: 'Live Challenge Queue' }] },
  { id: 'trivia', label: 'Trivia & Questions', actions: [{ id: 'trivia', label: 'Trivia Know Me' }, { id: 'poker', label: 'Liars Poker' }] },
  { id: 'team', label: 'Team Challenges', actions: [{ id: 'grandjury', label: 'Grand Jury' }, { id: 'sealedvote', label: 'Sealed Vote' }] },
  { id: 'vip', label: 'VIP Challenges', actions: [{ id: 'privatemsg', label: 'Private Message' }, { id: 'showdirector', label: 'Show Director' }] },
  { id: 'mode', label: 'Special Mode Challenges', actions: [{ id: 'finaldeal', label: 'Final Deal' }, { id: 'eventqueue', label: 'Event Queue' }] },
];

export function getExtra4(state = {}) {
  const saved = state.extra4 || {};
  return {
    version: EXTRA4_VERSION,
    control: { status: state.stopActive ? 'paused' : 'running', ...(saved.control || {}) },
    tactical: { level: 'standard', ...(saved.tactical || {}) },
    activity: { active: null, queue: [], auto: true, queueIndex: -1, ...(saved.activity || {}) },
    economy: { tokens: {}, keys: {}, loot: {}, restrictions: {}, lootPool: [], inventory: {}, ...(saved.economy || {}) },
    cards: { activeCard: null, ...(saved.cards || {}) },
    liveFeed: { status: 'off', requestedAt: null, cameraEnabled: false, microphoneEnabled: false, ...(saved.liveFeed || {}) },
    scenes: { current: null, currentIndex: 0, modeId: null, order: [], queue: [], auto: true, ...(saved.scenes || {}) },
    eventLog: Array.isArray(saved.eventLog) ? saved.eventLog : [],
  };
}

export function addExtra4Event(extra4, type, detail, extra = {}) {
  const entry = { id: globalThis.crypto?.randomUUID?.() || `extra4-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, type, detail, timestamp: Date.now(), ...extra };
  return [...(extra4.eventLog || []), entry].slice(-50);
}

export function pauseExtra4Timers(state, now = Date.now()) {
  const syncTimer = state.syncTimer?.endsAt
    ? { ...state.syncTimer, remaining: Math.max(0, Math.ceil((state.syncTimer.endsAt - now) / 1000)), endsAt: null, running: false, extra4Paused: true }
    : state.syncTimer;
  const mgTimer = state.mg?.timer?.endsAt
    ? { ...state.mg.timer, remaining: Math.max(0, Math.ceil((state.mg.timer.endsAt - now) / 1000)), endsAt: null, extra4Paused: true }
    : state.mg?.timer;
  const missions = Object.fromEntries(Object.entries(state.mg?.missions || {}).map(([id, mission]) => [
    id,
    mission?.expiresAt
      ? { ...mission, extra4RemainingMs: Math.max(0, mission.expiresAt - now), expiresAt: null }
      : mission,
  ]));
  return {
    ...(syncTimer !== state.syncTimer ? { syncTimer } : {}),
    ...(state.mg ? { mg: { ...state.mg, ...(mgTimer !== state.mg.timer ? { timer: mgTimer } : {}), ...(Object.keys(missions).length ? { missions } : {}) } } : {}),
  };
}

export function resumeExtra4Timers(state, now = Date.now()) {
  const syncTimer = state.syncTimer?.extra4Paused
    ? (({ extra4Paused, ...timer }) => ({ ...timer, endsAt: now + Math.max(0, timer.remaining || 0) * 1000, running: true }))(state.syncTimer)
    : state.syncTimer;
  const mgTimer = state.mg?.timer?.extra4Paused
    ? (({ extra4Paused, ...timer }) => ({ ...timer, endsAt: now + Math.max(0, timer.remaining || 0) * 1000 }))(state.mg.timer)
    : state.mg?.timer;
  const missions = Object.fromEntries(Object.entries(state.mg?.missions || {}).map(([id, mission]) => {
    if (mission?.extra4RemainingMs == null) return [id, mission];
    const { extra4RemainingMs, ...rest } = mission;
    return [id, { ...rest, expiresAt: now + extra4RemainingMs }];
  }));
  return {
    ...(syncTimer !== state.syncTimer ? { syncTimer } : {}),
    ...(state.mg ? { mg: { ...state.mg, ...(mgTimer !== state.mg.timer ? { timer: mgTimer } : {}), ...(Object.keys(missions).length ? { missions } : {}) } } : {}),
  };
}


export function getExtra4SceneItems(state = {}) {
  if (isNewMode(state.mode)) {
    const meta = modeMeta(state.mode);
    return (meta?.acts || []).map((id) => ({ id, label: ACT_META[id]?.title || id }));
  }
  if (state.mode === 'pajama') return PAJAMA_ACTS.map((act) => ({ id: act.id, label: act.title }));
  if (state.mode === 'marathon') return ['INFILTRATION', 'THE VAULT', 'POLICE RAIDS', 'TOTAL LOCKDOWN'].map((label, index) => ({ id: `marathon-${index + 1}`, label }));
  if (state.mode === 'arrest_heist') return ['ARREST & HEIST', 'GRAND HEIST', 'FINALE'].map((label, index) => ({ id: `arrest-${index + 1}`, label }));
  return ['Προετοιμασία', 'Περιπολία', 'Ανάκριση', 'Φινάλε'].map((label, index) => ({ id: `classic-${index}`, label }));
}

export function getExtra4ModeSceneIndex(state = {}) {
  if (isNewMode(state.mode)) return state.mg?.actIndex || 0;
  if (state.mode === 'pajama') return state.pajama?.actIndex || 0;
  if (state.mode === 'marathon') return Math.max(0, (state.marathonStage || 1) - 1);
  if (state.mode === 'arrest_heist') return Math.max(0, (state.stage || 1) - 1);
  return state.stage || 0;
}

export { INTENSITY_LEVELS };
