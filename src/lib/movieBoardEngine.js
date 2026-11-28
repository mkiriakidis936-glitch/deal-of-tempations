// Η ΤΑΙΝΙΑ · Ταμπλό & Ζάρι (καθαρές συναρτήσεις πάνω στο mg.cg).
// Ο server συγχωνεύει αντικείμενα: κάθε «νέο» αντικείμενο (roll, pending) γράφεται με ΟΛΑ τα πεδία του.
import { BOARD_SQUARES, squareOf } from '../data/modes/movieBoard.js';
import { applyDelta, logLine } from './campaignEngine.js';
import { issueWarrant } from './movieGamesEngine.js';

const lastIndex = () => BOARD_SQUARES.length - 1;
const shuffle = (rng, list) => { const a = [...list]; for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// Τετράγωνα που λύνονται μόνα τους· τα υπόλοιπα περιμένουν το Tablet (σκηνή + «Επόμενη σειρά»).
export const AUTO_KINDS = ['start', 'points', 'loot', 'warrant', 'safe', 'double', 'skip', 'finish'];

export const boardOn = (cg) => !!cg?.board?.on;
export const turnPid = (cg) => {
  const b = cg?.board;
  if (!b?.on || !b.order?.length || b.allDone) return null;
  return b.order[((b.turn % b.order.length) + b.order.length) % b.order.length] || null;
};
export const rollDie = (rng = Math.random) => 1 + Math.floor(rng() * 6);

export function boardStart(cg, players = [], { rng = Math.random, now = Date.now() } = {}) {
  const order = shuffle(rng, players.map((p) => p.id));
  const map = (v) => Object.fromEntries(order.map((id) => [id, v]));
  return logLine({
    ...cg,
    boardMode: true,
    board: { on: true, order, turn: 0, pos: map(0), skip: map(false), done: map(false), extra: false, allDone: false, rolls: 0, at: now, roll: null, pending: null },
  }, '🎲 Ξεκίνησε το ταμπλό της ηπείρου', now);
}
export const boardStop = (cg) => (cg.board ? { ...cg, board: { ...cg.board, on: false, roll: null, pending: null } } : cg);
export const setBoardMode = (cg, on) => ({ ...cg, boardMode: !!on });

// Προχωρά τη σειρά: ίδια παίκτρια αν «ξαναρίχνει», αλλιώς η επόμενη που δεν τερμάτισε και δεν «χάνει σειρά».
function advance(board) {
  const b = { ...board, skip: { ...board.skip } };
  if (b.extra) return { ...b, extra: false };
  const n = b.order.length;
  if (!n || b.order.every((id) => b.done[id])) return { ...b, allDone: true };
  let t = b.turn;
  for (let guard = 0; guard < n * 3; guard += 1) {
    t += 1;
    const id = b.order[t % n];
    if (b.done[id]) continue;
    if (b.skip[id]) { b.skip[id] = false; continue; }
    return { ...b, turn: t };
  }
  return { ...b, turn: t };
}

// Ζαριά. Επιστρέφει { cg, ok, square }. Μόνο η παίκτρια που έχει σειρά, και μόνο όταν δεν εκκρεμεί τετράγωνο.
export function boardRoll(cg, pid, value, now = Date.now()) {
  const b = cg.board;
  if (!b?.on || b.pending || b.allDone || pid !== turnPid(cg)) return { cg, ok: false, square: null };
  const v = Math.max(1, Math.min(6, Math.round(Number(value) || 1)));
  const from = b.pos[pid] || 0;
  const to = Math.min(lastIndex(), from + v);
  const sq = squareOf(to);
  const auto = AUTO_KINDS.includes(sq.kind);
  let out = { ...cg, board: { ...b, pos: { ...b.pos, [pid]: to }, rolls: (b.rolls || 0) + 1, roll: { pid, value: v, from, to, kind: sq.kind, at: now, n: (b.rolls || 0) + 1 } } };
  const num = Number(sq.value) || 0;
  if (sq.kind === 'points' && num) out = applyDelta(out, pid, { points: num }, { undoable: false });
  if (sq.kind === 'loot' && num) out = applyDelta(out, pid, { loot: num }, { undoable: false });
  if (sq.kind === 'warrant') out = issueWarrant(out, pid, now);
  if (sq.kind === 'finish') {
    if (num) out = applyDelta(out, pid, { points: num }, { undoable: false });
    out = { ...out, board: { ...out.board, done: { ...out.board.done, [pid]: true } } };
  }
  if (sq.kind === 'skip') out = { ...out, board: { ...out.board, skip: { ...out.board.skip, [pid]: true } } };
  if (sq.kind === 'double') out = { ...out, board: { ...out.board, extra: true } };
  if (auto) return { cg: { ...out, board: { ...advance(out.board), pending: null } }, ok: true, square: sq };
  return { cg: { ...out, board: { ...out.board, pending: { pid, index: to, kind: sq.kind, at: now, resolved: false } } }, ok: true, square: sq };
}

// Το Tablet τελείωσε τη σκηνή του τετραγώνου → επόμενη σειρά.
export function boardResolve(cg) {
  const b = cg.board;
  if (!b?.on) return cg;
  return { ...cg, board: { ...advance({ ...b, pending: null }), pending: null } };
}
// Παράκαμψη σειράς (απούσα παίκτρια, ΣΤΟΠ, PASS): χωρίς ζαριά.
export function boardPass(cg) {
  const b = cg.board;
  if (!b?.on) return cg;
  return { ...cg, board: { ...advance({ ...b, pending: null, extra: false }), pending: null } };
}
