// Καθαρή λογική custom modes (χωρίς δίκτυο) — χρησιμοποιείται από Admin, μηχανή και tests.
import { LOUNGE_RULES, SQUARE_TYPES } from '../data/modes/loungeContent.js';

export const CUSTOM_PREFIX = 'custom_';
export const SQUARE_IDS = Object.keys(SQUARE_TYPES);
export const isCustomMode = (id) => String(id || '').startsWith(CUSTOM_PREFIX);

const clampInt = (value, min, max, fallback) => {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
};

export function newCustomMode() {
  const id = `${CUSTOM_PREFIX}${Date.now().toString(36)}`;
  return {
    id,
    name: 'ΝΕΟ ΠΑΙΧΝΙΔΙ',
    icon: '🎲',
    desc: '',
    min: 3,
    max: 10,
    active: true,
    board: [...LOUNGE_RULES.board],
    cards: [{ id: `${id}_c1`, title: 'Πρώτη κάρτα', text: 'Γράψε εδώ τι πρέπει να κάνει η παίκτρια.' }],
    questions: ['Ποιο είναι το πιο τολμηρό σου μυστικό;', 'Ποια εδώ μέσα θα διάλεγες για συνένοχο;', 'Τι δεν έχεις πει ποτέ σε κανέναν;'],
    phases: LOUNGE_RULES.phases.map((p) => ({ ...p })),
    startLoot: LOUNGE_RULES.startLoot,
    passStartBonus: LOUNGE_RULES.passStartBonus,
    tickleSeconds: LOUNGE_RULES.tickleSeconds,
    cardReward: LOUNGE_RULES.cardReward.loot,
  };
}

// Καθαρίζει/επικυρώνει ό,τι έρχεται από το Admin ώστε η μηχανή να μη σπάει ποτέ.
export function normalizeCustomMode(raw = {}) {
  const base = newCustomMode();
  const id = isCustomMode(raw.id) ? String(raw.id).slice(0, 40) : base.id;
  const board = (Array.isArray(raw.board) ? raw.board : base.board).filter((type) => SQUARE_IDS.includes(type)).slice(0, 40);
  if (board[0] !== 'start') board.unshift('start');
  while (board.length < 8) board.push('loot');
  const cards = (Array.isArray(raw.cards) ? raw.cards : [])
    .filter((card) => card && String(card.title || card.text || '').trim())
    .map((card, i) => ({
      id: String(card.id || `${id}_c${i + 1}`).slice(0, 60),
      title: String(card.title || '').slice(0, 120),
      text: String(card.text || '').slice(0, 1000),
      ...(Number(card.secs) > 0 ? { secs: clampInt(card.secs, 1, 3600, 30) } : {}),
      ...(card.image ? { image: String(card.image).slice(0, 500) } : {}),
    }));
  const questions = (Array.isArray(raw.questions) ? raw.questions : []).map((q) => String(q || '').trim()).filter(Boolean).slice(0, 100);
  const phases = (Array.isArray(raw.phases) && raw.phases.length ? raw.phases : base.phases).slice(0, 8).map((p, i) => ({
    id: String(p.id || `phase${i + 1}`),
    name: String(p.name || `Φάση ${i + 1}`).slice(0, 80),
    minutes: clampInt(p.minutes, 1, 600, 15),
    text: String(p.text || '').slice(0, 400),
  }));
  return {
    id,
    name: String(raw.name || base.name).slice(0, 60),
    icon: String(raw.icon || '🎲').slice(0, 4),
    desc: String(raw.desc || '').slice(0, 400),
    min: clampInt(raw.min, 2, 12, 3),
    max: clampInt(raw.max, 2, 16, 10),
    active: raw.active !== false,
    board,
    cards: cards.length ? cards : base.cards,
    questions: questions.length >= 3 ? questions : [...questions, ...base.questions].slice(0, Math.max(3, questions.length)),
    phases,
    startLoot: clampInt(raw.startLoot, 0, 1000000, 5000),
    passStartBonus: clampInt(raw.passStartBonus, 0, 100000, 1000),
    tickleSeconds: clampInt(raw.tickleSeconds, 5, 600, 45),
    cardReward: clampInt(raw.cardReward, 0, 100000, 1000),
  };
}

export const customMinutes = (mode) => mode.phases.reduce((sum, p) => sum + p.minutes, 0);

// Κανόνες για την παιχνιδομηχανή: ό,τι δεν ορίζει το custom mode, έρχεται από το Pajama Heist & Arrest.
export function rulesFromCustom(mode) {
  const m = normalizeCustomMode(mode);
  return {
    ...LOUNGE_RULES,
    title: m.name,
    board: m.board,
    cards: m.cards,
    questions: m.questions,
    phases: m.phases,
    startLoot: m.startLoot,
    passStartBonus: m.passStartBonus,
    tickleSeconds: m.tickleSeconds,
    cardReward: { loot: m.cardReward },
  };
}

