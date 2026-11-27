// VILLA TAKEOVER 48/72: καθαρές συναρτήσεις κατάστασης (state.mg.villa). Χωρίς browser — τις χρησιμοποιούν Tablet, TV, κινητό και tests.
import {
  VILLA_PHASES, VILLA_SCHEDULE, VILLA_BEATS, VILLA_RINGS, VILLA_ROLES, VILLA_POINTS, VILLA_DAYS, STRIP_STEPS, VILLA_TV,
} from '../data/modes/villaContent.js';
import { randomExitCode } from './consent.js';

const HOUR = 3600000;
const caps = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
const shuffleWith = (rng, list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

export const hoursOf = (v = {}) => (Number(v.hours) === 72 ? 72 : 48);
export const lastSquare = (v = {}) => hoursOf(v);
export const totalHours = hoursOf;
export const phasesOf = (v = {}) => VILLA_PHASES[hoursOf(v)];
export const phaseOf = (no, v = {}) => phasesOf(v).find((p) => no >= p.from && no <= p.to) || phasesOf(v)[0];
export const cycleOf = phaseOf;
export const dayOf = (no, v = {}) => VILLA_DAYS[phaseOf(no, v).day];
export const roleOf = (id) => VILLA_ROLES.find((r) => r.id === id) || null;

// Το τετράγωνο Ν (1..48/72): ο μηχανισμός του PDF που παίζει εκείνη την ώρα.
export function squareAt(no, v = {}) {
  const phase = phaseOf(no, v);
  const beatId = VILLA_SCHEDULE[hoursOf(v)][phase.id][no - phase.from];
  const beat = VILLA_BEATS[beatId];
  if (!beat) return null;
  return { no, beat: beatId, phase: phase.id, ...beat, ringInfo: VILLA_RINGS[beat.ring] };
}
export const boardOf = (v = {}) => Array.from({ length: lastSquare(v) }, (_, i) => squareAt(i + 1, v));

// Έναρξη: έκδοση 48 ή 72 ωρών, μοναδικός μυστικός ρόλος ανά παίκτρια (όσες περισσεύουν = «Villa Guest»), κωδικός 4 ψηφίων.
export function initVilla(players = [], { rng = Math.random, now = Date.now(), hours = 48 } = {}) {
  const roles = {};
  shuffleWith(rng, players).forEach((p, i) => { roles[p.id] = VILLA_ROLES[i]?.id || 'guest'; });
  return {
    hours: Number(hours) === 72 ? 72 : 48, sq: 1, startedAt: now, sqAt: now, auto: true, roles, code: randomExitCode(rng),
    clues: {}, alliances: [], alerts: [], quiet: {}, socks: {}, loot: {}, karma: {}, slips: {}, profile: {},
    strip: 0, stripLate: {}, night: false, nights: 0, awards: {}, attempts: [], done: {},
  };
}

// Πρόγραμμα: το τετράγωνο Ν «ανοίγει» στην ώρα Ν-1 από την έναρξη (1 τετράγωνο ανά ώρα).
export const scheduledSquare = (v, now = Date.now()) => Math.min(lastSquare(v), 1 + Math.floor(Math.max(0, now - (v.startedAt ?? now)) / HOUR));
export const nextUnlockAt = (v) => (v.startedAt ?? 0) + (v.sq || 1) * HOUR;

// Προχώρημα: εφαρμόζει τα αυτόματα του νέου τετραγώνου (νύχτα, πρωινός απολογισμός, ειδοποίηση φάσης).
export function advance(v, now = Date.now()) {
  const cur = v.sq || 1;
  if (cur >= lastSquare(v)) return v;
  const no = cur + 1;
  const sq = squareAt(no, v);
  const phase = phaseOf(no, v);
  let out = { ...v, sq: no, sqAt: now, card: null, statue: null };
  if (phase.from === no) {
    out = pushAlert(out, { title: `ΦΑΣΗ: ${caps(phase.title)}`, text: `${phase.zone} — ${phase.flow}` }, now);
    if (!phase.night) out.night = false;
    if (phase.day > phaseOf(cur, v).day) out = pushAlert(out, { title: VILLA_DAYS[phase.day].title, text: VILLA_DAYS[phase.day].text }, now + 1);
  }
  if (sq?.night === 'on') out = pushAlert({ ...out, night: true, nights: (out.nights || 0) + 1 }, VILLA_TV.night, now + 2);
  if (sq?.night === 'off') out = pushAlert({ ...out, night: false, morningSummary: morningReveal(out) }, VILLA_TV.morning, now + 2);
  if (sq?.shift) out = pushAlert(out, VILLA_TV.shift, now + 3);
  if (sq?.finale === 'code') out = pushAlert(out, VILLA_TV.final, now + 3);
  return out;
}

// 4-Step Round Strip: ο γύρος ανεβαίνει μόνο προς τα πάνω (1 → 4) για όλες.
export function setStrip(v, step, now = Date.now()) {
  const next = Math.max(0, Math.min(4, Number(step) || 0));
  if (next <= (v.strip || 0)) return v;
  const info = STRIP_STEPS[next - 1];
  return pushAlert({ ...v, strip: next, stripAt: now, stripLate: {} }, { title: `ROUND STRIP ${next}/4 — ${caps(info.item)}`, text: info.tv }, now);
}
export const stripInfo = (v = {}) => (v.strip ? STRIP_STEPS[v.strip - 1] : null);
export const footwearLevelOf = (v = {}, pid) => {
  const own = v.profile?.[pid]?.footwear;
  if (Number.isInteger(own)) return Math.min(own, v.strip >= 4 ? 0 : v.strip >= 2 ? 1 : 3);
  return v.strip >= 4 ? 0 : v.strip >= 2 ? 1 : 3;
};

// Αποτέλεσμα τετραγώνου για μια παίκτρια: επιτυχία / αποτυχία / PASS (PASS = 0 πόντοι, ποτέ ποινή).
export function pointsFor(square, outcome) {
  if (!square || outcome === 'pass') return 0;
  const [win, lose] = VILLA_POINTS[square.type] || [10, -5];
  const mult = square.double ? 2 : 1;
  return (outcome === 'win' ? win : lose) * mult;
}

export const addSlip = (v, pid) => ({ ...v, slips: { ...(v.slips || {}), [pid]: ((v.slips || {})[pid] || 0) + 1 } });
export const addKarma = (v, pid, delta) => ({ ...v, karma: { ...(v.karma || {}), [pid]: ((v.karma || {})[pid] || 0) + delta } });
export function addLoot(v, pid, kind, n = 1) {
  const own = { sock: 0, intel: 0, veto: 0, blackmail: 0, ...((v.loot || {})[pid] || {}) };
  own[kind] = Math.max(0, (own[kind] || 0) + n);
  const out = { ...v, loot: { ...(v.loot || {}), [pid]: own } };
  if (kind === 'sock') out.socks = { ...(v.socks || {}), [pid]: own.sock };
  return out;
}
export const lootOf = (v, pid) => ({ sock: 0, intel: 0, veto: 0, blackmail: 0, ...((v.loot || {})[pid] || {}) });

// Night Sock Heist: η καταγραφή (ποια έκλεψε από ποια). Ο Midnight Phantom παίρνει διπλό Sock Loot.
export function logHeist(v, thief, victim, now = Date.now()) {
  const n = v.roles?.[thief] === 'phantom' ? 2 : 1;
  let out = addLoot(v, thief, 'sock', n);
  out = { ...out, heistLog: [{ thief, victim, n, at: now, night: out.nights || 1 }, ...(v.heistLog || [])].slice(0, 60) };
  if (v.sockBomb && v.sockBomb === victim) out = pushAlert({ ...out, sockBomb: null }, { to: thief, title: 'ΚΑΛΤΣΑ-ΒΟΜΒΑ', text: 'Έκλεψες τη μαρκαρισμένη κάλτσα: αυτόματη ποινή 3 συνεχόμενων Dares 18+.' }, now);
  return { villa: out, n };
}
// Πρωινός απολογισμός: ποιοι έμειναν χωρίς κάλτσες και ποια μάζεψε τα περισσότερα Sock Loot της νύχτας.
export function morningReveal(v) {
  const night = v.nights || 1;
  const log = (v.heistLog || []).filter((h) => h.night === night);
  const victims = [...new Set(log.map((h) => h.victim))];
  const tally = {};
  log.forEach((h) => { tally[h.thief] = (tally[h.thief] || 0) + h.n; });
  const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  return { victims, top, total: log.reduce((s, h) => s + h.n, 0) };
}

// Απόλυτη Διαταγή: Διοικητής για 10 λεπτά (κόκκινη οθόνη στο κινητό).
export function startCommand(v, pid, command, now = Date.now(), minutes = 10) {
  return pushAlert({ ...v, command: { pid, id: command.id, title: command.title, text: command.text, at: now, until: now + minutes * 60000 } }, { to: pid, title: 'ΑΠΟΛΥΤΗ ΔΙΑΤΑΓΗ', text: `Είσαι ο Διοικητής για ${minutes} λεπτά: ${command.title}.` }, now);
}
export const commandActive = (v, now = Date.now()) => !!(v.command && v.command.until > now);

// Σήμα Αγάλματος: όλοι παγώνουν 20–40″.
export const startStatue = (v, secs = 30, now = Date.now()) => pushAlert({ ...v, statue: { at: now, until: now + secs * 1000 } }, VILLA_TV.statue, now);
export const statueActive = (v, now = Date.now()) => !!(v.statue && v.statue.until > now);

// Κλέφτρες & Αστυνομικίνες: 2 Αστυνομικίνες, οι υπόλοιπες Κλέφτρες.
export function startCops(v, girls = [], { rng = Math.random, now = Date.now() } = {}) {
  const ids = shuffleWith(rng, girls.map((p) => p.id || p));
  const cops = ids.slice(0, 2);
  return pushAlert({ ...v, cops: { at: now, phase: 0, cops, thieves: ids.slice(2), caught: [], immune: [] } }, VILLA_TV.cops, now);
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
  let villa = { ...v, attempts, ...(ok && !v.winner ? { winner: pid, wonAt: now } : {}) };
  villa = pushAlert(villa, ok ? VILLA_TV.override : VILLA_TV.surge, now);
  if (!ok) villa = { ...villa, surge: now };
  return { villa, ok };
}

export function addAlliance(v, members, now = Date.now(), type = '') {
  const clean = [...new Set(members)].filter(Boolean);
  if (clean.length < 2) return v;
  return { ...v, alliances: [...(v.alliances || []), { id: `a${now.toString(36)}`, members: clean, type, at: now }] };
}
export const breakAlliance = (v, id, by, now = Date.now()) => ({
  ...v, alliances: (v.alliances || []).map((a) => (a.id === id ? { ...a, broken: true, brokenBy: by, brokenAt: now } : a)),
});

export function pushAlert(v, { to = 'all', title, text }, now = Date.now()) {
  const alert = { id: `n${now.toString(36)}${Math.floor(Math.random() * 1e3)}`, at: now, to, title: String(title || '').slice(0, 80), text: String(text || '').slice(0, 300) };
  return { ...v, alerts: [alert, ...(v.alerts || [])].slice(0, 40) };
}

export const visibleAlerts = (v, pid) => (v.alerts || []).filter((a) => a.to === 'all' || (pid && a.to === pid));
