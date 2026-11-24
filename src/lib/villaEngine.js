// VILLA TAKEOVER: καθαρές συναρτήσεις κατάστασης (state.mg.villa). Χωρίς browser — τις χρησιμοποιούν Tablet, TV, κινητό και tests.
import { VILLA_SQUARES, VILLA_CYCLES, VILLA_ROLES, VILLA_POINTS, VILLA_HOURS, VILLA_EXTENSION_HOURS } from '../data/modes/villaContent.js';
import { randomExitCode } from './consent.js';

const HOUR = 3600000;
const shuffleWith = (rng, list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

export const lastSquare = (v = {}) => (v.extended ? 56 : 48);
export const squareAt = (no) => VILLA_SQUARES.find((s) => s.no === no) || null;
export const cycleOf = (no) => VILLA_CYCLES.find((c) => no >= c.from && no <= c.to) || VILLA_CYCLES[0];
export const totalHours = (v = {}) => VILLA_HOURS + (v.extended ? VILLA_EXTENSION_HOURS : 0);
export const roleOf = (id) => VILLA_ROLES.find((r) => r.id === id) || null;

// Έναρξη: μοναδικός μυστικός ρόλος ανά παίκτρια (όσες περισσεύουν = «Villa Guest»), κωδικός 4 ψηφίων, τετράγωνο #1.
export function initVilla(players = [], { rng = Math.random, now = Date.now() } = {}) {
  const roles = {};
  shuffleWith(rng, players).forEach((p, i) => { roles[p.id] = VILLA_ROLES[i]?.id || 'guest'; });
  return { sq: 1, startedAt: now, sqAt: now, auto: true, roles, code: randomExitCode(rng), clues: {}, alliances: [], alerts: [], quiet: {}, socks: {}, night: false, extended: false, awards: {}, attempts: [], done: {} };
}

// Πρόγραμμα: το τετράγωνο Ν «ανοίγει» στην ώρα Ν-1 από την έναρξη (1 τετράγωνο ανά ώρα).
export const scheduledSquare = (v, now = Date.now()) => Math.min(lastSquare(v), 1 + Math.floor(Math.max(0, now - (v.startedAt ?? now)) / HOUR));
export const nextUnlockAt = (v) => (v.startedAt ?? 0) + (v.sq || 1) * HOUR;

export function advance(v, now = Date.now()) {
  if ((v.sq || 1) >= lastSquare(v)) return v;
  return { ...v, sq: (v.sq || 1) + 1, sqAt: now, card: null };
}

// Αποτέλεσμα τετραγώνου για μια παίκτρια: επιτυχία / αποτυχία / PASS (PASS = 0 πόντοι, ποτέ ποινή).
export function pointsFor(square, outcome) {
  if (!square || outcome === 'pass') return 0;
  const [win, lose] = VILLA_POINTS[square.type] || [10, -5];
  const mult = square.double ? 2 : 1;
  return (outcome === 'win' ? win : lose) * mult;
}

// Ενδείξεις κωδικού: το ψηφίο idx (0–3) πηγαίνει μόνο στο κινητό της παίκτριας.
export function awardClue(v, idx, pid) {
  const own = v.clues?.[pid] || [];
  return own.includes(idx) ? v : { ...v, clues: { ...(v.clues || {}), [pid]: [...own, idx].sort() } };
}
export const cluesFound = (v) => new Set(Object.values(v.clues || {}).flat()).size;

export function tryCode(v, pid, code, now = Date.now()) {
  const ok = String(code) === String(v.code);
  const attempts = [{ pid, ok, at: now }, ...(v.attempts || [])].slice(0, 20);
  return { villa: { ...v, attempts, ...(ok && !v.winner ? { winner: pid, wonAt: now } : {}) }, ok };
}

export function addAlliance(v, members, now = Date.now()) {
  const clean = [...new Set(members)].filter(Boolean);
  if (clean.length < 2) return v;
  return { ...v, alliances: [...(v.alliances || []), { id: `a${now.toString(36)}`, members: clean, at: now }] };
}

export function pushAlert(v, { to = 'all', title, text }, now = Date.now()) {
  const alert = { id: `n${now.toString(36)}${Math.floor(Math.random() * 1e3)}`, at: now, to, title: String(title || '').slice(0, 60), text: String(text || '').slice(0, 200) };
  return { ...v, alerts: [alert, ...(v.alerts || [])].slice(0, 40) };
}

export const visibleAlerts = (v, pid) => (v.alerts || []).filter((a) => a.to === 'all' || (pid && a.to === pid));
