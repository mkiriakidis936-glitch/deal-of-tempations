// 12.0.0 · Πρόβα με εικονικές παίκτριες (Ταινία).
// Οι εικονικές παίκτριες (player.bot === true) στέλνουν ΤΙΣ ΙΔΙΕΣ ενέργειες που θα έστελνε ένα κινητό
// (cg_roll, cg_wheel_ok, cg_dond_box, cg_dond, cg_tod, cg_vote, cg_final, cg_nail), ώστε να δοκιμάζεται ο αληθινός μηχανισμός.
// Καθαρή συνάρτηση: επιστρέφει μία ενέργεια ή null. Δεν αγγίζει ποτέ τις πραγματικές παίκτριες.

import { turnPid } from './movieBoardEngine.js';
import { NAIL_COLORS } from '../data/modes/campaignContent.js';

export const BOT_NAMES = ['Ρομπο-Λένα', 'Ρομπο-Ντίνα', 'Ρομπο-Κική', 'Ρομπο-Ζωή', 'Ρομπο-Μαίρη', 'Ρομπο-Νίνα'];
export const VOTE_OPTIONS = { truth: ['Ισχύει', 'Μπλόφα'], believe: ['Την πιστεύω', 'Την κρίνω'], verdict: ['Αθώα', 'Ένοχη', 'Ασυλία'], choice: ['Σίγουρα +3', 'Ρίσκο 50/50'] };

export const isBot = (players, pid) => !!players.find((p) => p.id === pid)?.bot;
export const hasBots = (players = []) => players.some((p) => p.bot);

export function makeBots(existing = [], n = 4, now = Date.now()) {
  const used = new Set(existing.map((p) => p.name));
  return BOT_NAMES.filter((name) => !used.has(name)).slice(0, n).map((name, i) => ({ id: `bot_${now.toString(36)}_${i}`, name, bot: true, joinedAt: now }));
}

const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length) % arr.length];

// «Σκέψη» ~2,5–4″ πριν από κάθε κίνηση, ώστε να φαίνεται φυσικό στην TV.
export function botAction({ cg, players = [], now = Date.now(), rnd = Math.random, think = 2500 } = {}) {
  if (!cg || !hasBots(players)) return null;
  const bot = (pid) => isBot(players, pid);
  const others = (pid) => players.filter((p) => p.id !== pid);

  // Νύχια
  if (cg.nailsOpen) {
    const b = players.find((p) => p.bot && !(cg.players?.[p.id]?.nailLocked));
    if (b) return { playerId: b.id, type: 'cg_nail', nail: pick(NAIL_COLORS, rnd) };
  }
  // Τροχός: επιβεβαίωση όταν σταματήσει
  const w = cg.wheel;
  if (w && !w.done && !w.confirmed && bot(w.pid) && now - w.at > 4500 + think) return { playerId: w.pid, type: 'cg_wheel_ok' };
  // Deal or No Deal
  const d = cg.dond;
  if (cg.game === 'dond' && d && bot(d.pid) && now - (d.lastOpened?.at || d.offerAt || d.at || 0) > think) {
    const closed = (d.boxes || []).filter((x) => !x.open && x.no !== d.myBox);
    if (d.status === 'pick' && d.boxes?.length) return { playerId: d.pid, type: 'cg_dond_box', value: pick(d.boxes, rnd).no };
    if (d.status === 'open' && closed.length) return { playerId: d.pid, type: 'cg_dond_box', value: pick(closed, rnd).no };
    if (d.status === 'offer') return { playerId: d.pid, type: 'cg_dond', value: rnd() < 0.35 ? 'deal' : 'nodeal' };
  }
  // Αλήθεια ή Θάρρος
  if (cg.game === 'tod' && cg.tod && bot(cg.tod.pid) && !cg.tod.choice && now - (cg.tod.at || 0) > think) return { playerId: cg.tod.pid, type: 'cg_tod', value: rnd() < 0.5 ? 'truth' : 'dare' };
  // Ψηφοφορίες
  const v = cg.votes;
  if (v?.open && now - (v.at || 0) > think) {
    const b = players.find((p) => p.bot && (v.ballots || {})[p.id] == null && (v.kind !== 'choice' || v.pid === p.id));
    if (b) {
      if (v.kind === 'final') return { playerId: b.id, type: 'cg_final', target: pick(others(b.id), rnd)?.id };
      if (v.kind === 'player') return { playerId: b.id, type: 'cg_vote', value: pick(others(b.id), rnd)?.id };
      if (v.kind === 'risk') return { playerId: b.id, type: 'cg_risk', value: rnd() < 0.5 ? 'lock' : 'risk' };
      if (VOTE_OPTIONS[v.kind]) return { playerId: b.id, type: 'cg_vote', value: pick(VOTE_OPTIONS[v.kind], rnd) };
    }
  }
  // Ταμπλό: ρίχνει όταν είναι η σειρά της
  const bd = cg.board;
  if (bd?.on && (cg.status || 'active') === 'active' && !bd.pending && !bd.allDone) {
    const t = turnPid(cg);
    if (t && bot(t) && now - Math.max(bd.roll?.at || 0, bd.at || 0) > think + 1500) return { playerId: t, type: 'cg_roll' };
  }
  return null;
}
