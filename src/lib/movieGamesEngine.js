// Η ΤΑΙΝΙΑ — Τροχοί Ποινών, Καρέκλα Ανάκρισης και τα 4 παιχνίδια (καθαρές συναρτήσεις πάνω στο mg.cg).
// Ο server συγχωνεύει αντικείμενα: κάθε «νέο» αντικείμενο γράφεται με ΟΛΑ τα πεδία του.
import { WHEELS, wheelOf, DOND_BOXES, DOND_ROUNDS } from '../data/modes/movieGames.js';
import { setState, releaseAll, statsOf, applyDelta, logLine } from './campaignEngine.js';

const shuffle = (rng, list) => { const a = [...list]; for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// Όρια από τη φόρμα της Ταινίας (movieProfile): ποινές που δεν θέλει + κατηγορίες που έκλεισε.
const LIMIT_RE = {
  chairOk: /καρέκλα/i, cuffsOk: /χειροπέδ|δέσιμο|δεμέν/i, tickleOk: /γαργάλ/i, iceOk: /παγάκι/i, alcoholOk: /σφηνάκι|αλκοόλ|ποτ[όή]/i,
  shoesOffOk: /παπούτσι|κάλτσ|ξυπόλητ/i, nightOk: /ύπνο|νυχτεριν/i,
};
export function profileAllows(profile, item) {
  if (!profile || !item) return true;
  if ((profile.wheelNo || []).includes(item.id)) return false;
  const text = `${item.title || ''} ${item.tv || ''}`;
  return Object.entries(LIMIT_RE).every(([k, re]) => profile[k] !== false || !re.test(text));
}
export const isFree = (cg, pid) => !!statsOf(cg, pid).flags?.free;

// ---------- Τροχοί Ποινών ----------
// allowedIds: ποινές που επιτρέπουν τα όρια της παίκτριας (το Tablet τις φιλτράρει με το check-in).
export function spinWheel(cg, wheelId, pid, { allowedIds = null, rng = Math.random, reason = '', now = Date.now() } = {}) {
  const w = wheelOf(wheelId);
  if (!pid || isFree(cg, pid)) return { cg, item: null };
  const pool = w.items.filter((i) => !allowedIds || allowedIds.includes(i.id));
  const item = pool.length ? pool[Math.floor(rng() * pool.length)] : null;
  const index = item ? w.items.findIndex((i) => i.id === item.id) : -1;
  let out = { ...cg, wheel: { id: w.id, pid, itemId: item?.id || null, index, at: now, until: item?.secs ? now + 4500 + item.secs * 1000 : null, reason, confirmed: false, done: false, doneAt: null } };
  if (item?.effect) out = setState(out, pid, item.effect);
  if (reason === 'mandatory' && out.mandatory?.pending) out = { ...out, mandatory: { ...out.mandatory, pending: false, pid, wheelId: w.id, itemId: item?.id || null } };
  return { cg: logLine(out, `🎡 ${w.name}: ${item ? item.title : 'καμία επιτρεπτή ποινή — PASS'}`, now), item };
}
export const confirmWheel = (cg) => (cg.wheel ? { ...cg, wheel: { ...cg.wheel, confirmed: true } } : cg);
export const endWheel = (cg, now = Date.now()) => (cg.wheel ? { ...cg, wheel: { ...cg.wheel, done: true, doneAt: now } } : cg);
export const allWheelItems = () => WHEELS.flatMap((w) => w.items.map((i) => ({ ...i, wheel: w.id })));

// ---------- Υποχρεωτικό γεγονός μετά από κάθε ήπειρο ----------
export const openMandatory = (cg, now = Date.now()) => ({ ...cg, mandatory: { pending: true, pid: null, wheelId: null, itemId: null, at: now, drawnAt: null } });
export const mandatoryPending = (cg) => !!cg.mandatory?.pending;

// ---------- Καρέκλα Ανάκρισης ----------
export function chairIn(cg, pid, now = Date.now()) {
  if (!pid) return cg;
  return { ...setState(cg, pid, { hands: 'chair', feet: 'chair' }), chair: { pid, at: now, active: true, outAt: null } };
}
export function chairOut(cg, now = Date.now()) {
  if (!cg.chair?.pid) return cg;
  return { ...releaseAll(cg, cg.chair.pid), chair: { ...cg.chair, active: false, outAt: now } };
}

// ---------- 1ο Παιχνίδι: Θάρρος ή Αλήθεια ----------
export const todStart = (cg, pid, now = Date.now()) => ({ ...cg, game: 'tod', tod: { pid, choice: null, cardTitle: '', cardText: '', at: now, result: null, resultAt: null } });
export const todChoose = (cg, choice) => (cg.tod && !cg.tod.choice && ['truth', 'dare'].includes(choice) ? { ...cg, tod: { ...cg.tod, choice } } : cg);
export const todCard = (cg, card) => (cg.tod ? { ...cg, tod: { ...cg.tod, cardTitle: card?.title || '', cardText: card?.text || '', result: null, resultAt: null } } : cg);
// ok | wrong (λάθος στην Αλήθεια) | refuse (άρνηση/δισταγμός στο Θάρρος) → τα δύο τελευταία γυρίζουν Τροχό.
export const todResult = (cg, result, now = Date.now()) => (cg.tod ? { ...cg, tod: { ...cg.tod, result, resultAt: now } } : cg);
export const todNeedsWheel = (result) => result === 'wrong' || result === 'refuse';

// ---------- 2ο Παιχνίδι: Beerpong ----------
export const bpStart = (cg, a = [], b = [], cups = 10, now = Date.now()) => ({ ...cg, game: 'beerpong', bp: { a, b, cupsA: cups, cupsB: cups, at: now, winner: null, lastLost: null, lastAt: null } });
// Η ομάδα team πέτυχε ποτήρι: χάνει ποτήρι η αντίπαλη.
export function bpHit(cg, team, now = Date.now()) {
  const bp = cg.bp;
  if (!bp || bp.winner) return cg;
  const loser = team === 'a' ? 'b' : 'a';
  const key = loser === 'a' ? 'cupsA' : 'cupsB';
  const left = Math.max(0, bp[key] - 1);
  return { ...cg, bp: { ...bp, [key]: left, lastLost: loser, lastAt: now, winner: left === 0 ? team : null } };
}

// ---------- 3ο Παιχνίδι: Μάντεψε τι είναι ----------
export function guessStart(cg, pid, item, now = Date.now()) {
  if (!pid) return cg;
  return { ...setState(cg, pid, { mask: true }), game: 'guess', guess: { pid, item: String(item || '').slice(0, 60), at: now, until: now + 30000, result: null } };
}
export const guessResult = (cg, ok) => (cg.guess ? { ...setState(cg, cg.guess.pid, { mask: false }), guess: { ...cg.guess, result: ok ? 'ok' : 'fail' } } : cg);

// ---------- 4ο Παιχνίδι: Deal or No Deal ----------
export function dondStart(cg, pid, prizePid, { rng = Math.random, now = Date.now() } = {}) {
  const boxes = shuffle(rng, DOND_BOXES).map((b, i) => ({ no: i + 1, kind: b.kind, label: b.label, value: b.value, wheel: b.wheel || null, delta: b.delta || null, open: false }));
  return { ...cg, game: 'dond', dond: { pid, prizePid: prizePid || pid, boxes, myBox: null, round: 0, openedInRound: 0, status: 'pick', offer: null, offerAt: null, result: null, lastOpened: null, at: now, awardedAt: null, decision: null, decidedAt: null } };
}
const closedOthers = (d) => d.boxes.filter((b) => !b.open && b.no !== d.myBox);
export function dondPick(cg, no) {
  const d = cg.dond;
  if (!d || d.status !== 'pick' || !d.boxes.some((b) => b.no === no)) return cg;
  return { ...cg, dond: { ...d, myBox: no, status: 'open' } };
}
// Ανοίγει ένα κουτί. Επιστρέφει { cg, box } — αν box.wheel, το Tablet γυρίζει τον αντίστοιχο Τροχό.
export function dondOpen(cg, no, now = Date.now()) {
  const d = cg.dond;
  const box = d?.boxes.find((b) => b.no === no);
  if (!d || d.status !== 'open' || !box || box.open || no === d.myBox) return { cg, box: null };
  const boxes = d.boxes.map((b) => (b.no === no ? { ...b, open: true } : b));
  const opened = d.openedInRound + 1;
  const need = DOND_ROUNDS[Math.min(d.round, DOND_ROUNDS.length - 1)];
  const left = boxes.filter((b) => !b.open && b.no !== d.myBox).length;
  const status = left === 0 ? 'final' : opened >= need ? 'offer_wait' : 'open';
  let out = { ...cg, dond: { ...d, boxes, openedInRound: opened, status, lastOpened: { no, at: now } } };
  if (box.delta) out = applyDelta(out, d.pid, box.delta, { undoable: false });
  return { cg: out, box };
}
export const dondOffer = (cg, text, now = Date.now()) => (cg.dond ? { ...cg, dond: { ...cg.dond, status: 'offer', offer: String(text || '').slice(0, 120), offerAt: now } } : cg);
export function dondDecide(cg, value, now = Date.now()) {
  const d = cg.dond;
  if (!d || d.status !== 'offer') return cg;
  if (value === 'deal') return { ...cg, dond: { ...d, status: 'deal', decision: 'deal', decidedAt: now, result: { kind: 'deal', text: d.offer, win: true } } };
  const final = closedOthers(d).length === 0;
  return { ...cg, dond: { ...d, status: final ? 'final' : 'open', round: d.round + 1, openedInRound: 0, offer: null, decision: 'nodeal', decidedAt: now } };
}
export function dondReveal(cg) {
  const d = cg.dond;
  if (!d || d.myBox == null) return cg;
  const mine = d.boxes.find((b) => b.no === d.myBox);
  return { ...cg, dond: { ...d, boxes: d.boxes.map((b) => ({ ...b, open: true })), status: 'revealed', result: { kind: 'box', text: mine.label, win: mine.kind === 'big' } } };
}
// Απονομή: η κοπέλα του επάθλου κερδίζει ελευθερία (λύνονται όλα, ασυλία από Τροχούς) + δώρο.
export function dondAward(cg, win, now = Date.now()) {
  const d = cg.dond;
  if (!d) return cg;
  let out = cg;
  if (win) {
    out = releaseAll(out, d.prizePid);
    const s = statsOf(out, d.prizePid);
    out = { ...out, players: { ...out.players, [d.prizePid]: { ...s, flags: { ...(s.flags || {}), free: true } } } };
    out = applyDelta(out, d.prizePid, { bonus: 10 }, { undoable: false });
  }
  return logLine({ ...out, dond: { ...d, status: win ? 'won' : 'lost', awardedAt: now } }, win ? '💼 Deal or No Deal: ΕΛΕΥΘΕΡΙΑ + ΔΩΡΟ' : '💼 Deal or No Deal: χωρίς ελευθερία', now);
}

// ---------- Εντάλματα, Wanted Level & Καταζητούμενη ----------
// announce: η τελευταία ανακοίνωση-διαταγή για TV & κινητά (warrant | wanted | mostwanted | arrestwheel).
export const announce = (cg, kind, pid, extra = {}, now = Date.now()) => ({ ...cg, announce: { kind, pid, at: now, level: null, wheel: null, ...extra } });
export function issueWarrant(cg, pid, now = Date.now()) {
  if (!pid) return cg;
  const s = statsOf(cg, pid);
  let out = { ...cg, players: { ...cg.players, [pid]: { ...s, flags: { ...(s.flags || {}), warrant: true } } } };
  out = applyDelta(out, pid, { wanted: 1 }, { undoable: false });
  return announce(out, 'warrant', pid, { level: statsOf(out, pid).wanted }, now);
}
export function clearWarrant(cg, pid) {
  const s = statsOf(cg, pid);
  return { ...cg, players: { ...cg.players, [pid]: { ...s, flags: { ...(s.flags || {}), warrant: false } } } };
}
export function raiseWanted(cg, pid, now = Date.now()) {
  if (!pid) return cg;
  const out = applyDelta(cg, pid, { wanted: 1 });
  return announce(out, 'wanted', pid, { level: statsOf(out, pid).wanted }, now);
}
// Ορίζει την Καταζητούμενη (χειροκίνητα από το Tablet ή αυτόματα όταν αλλάζει η πρώτη σε Wanted).
export const setMostWanted = (cg, pid, now = Date.now()) => announce({ ...cg, mostWanted: pid || null }, 'mostwanted', pid, {}, now);

// Υποχρεωτική κλήρωση: κληρώνει (ή ορίζει) την κοπέλα ανάμεσα σε όσες δεν έχουν κερδίσει ελευθερία.
export function mandatoryDraw(cg, players = [], { pid = null, rng = Math.random, now = Date.now() } = {}) {
  if (!cg.mandatory?.pending) return { cg, pid: null };
  const pool = players.filter((p) => !isFree(cg, p.id)).map((p) => p.id);
  const chosen = pid && pool.includes(pid) ? pid : pool[Math.floor(rng() * pool.length)] || null;
  return { cg: { ...cg, mandatory: { ...cg.mandatory, pid: chosen, drawnAt: now } }, pid: chosen };
}
// Παράλειψη (π.χ. καμία διαθέσιμη παίκτρια) — μόνο με ρητή απόφαση από το Tablet.
export const mandatorySkip = (cg) => (cg.mandatory ? { ...cg, mandatory: { ...cg.mandatory, pending: false } } : cg);
export const gameEnd = (cg) => ({ ...cg, game: null });
