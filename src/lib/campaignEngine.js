// DEAL OF TEMPTATION — Η ΤΑΙΝΙΑ: καθαρές συναρτήσεις κατάστασης (state.mg.cg). Χωρίς browser — Tablet, TV, κινητό, tests.
import {
  FORMATS, CONTINENTS, START_TOKENS, MAX_TOKENS, LOOT_TO_POINTS, ZONE_POINTS, TOKEN_USES, BUYOUT_TOKENS,
  WANTED5_FINAL_PENALTY, DEFAULT_STATE, trialOf, continentOf,
} from '../data/modes/campaignContent.js';

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const UNDO_MAX = 12;
const CHECKPOINT_MAX = 20;

export const formatOf = (cg = {}) => FORMATS[cg.format] || FORMATS.h48;
export const actsOf = (cg = {}) => formatOf(cg).acts;
export const currentAct = (cg = {}) => {
  const act = actsOf(cg)[cg.act || 0] || actsOf(cg)[0];
  const continent = cg.jump || act.continent;
  return { ...act, continent, index: cg.act || 0, total: actsOf(cg).length, info: continentOf(continent) };
};
export const isNight = (cg = {}) => !!(cg.night ?? currentAct(cg).night);

export function freshPlayer() {
  return { points: 0, loot: 0, tokens: START_TOKENS, wanted: 0, zones: 0, nail: '', nailLocked: false, state: { ...DEFAULT_STATE }, flags: {}, actStart: 0, bonus: 0 };
}
export const statsOf = (cg = {}, pid) => ({ ...freshPlayer(), ...((cg.players || {})[pid] || {}) });

export function initCampaign(players = [], { format = 'h48', now = Date.now() } = {}) {
  const map = {};
  players.forEach((p) => { map[p.id] = freshPlayer(); });
  return {
    format: FORMATS[format] ? format : 'h48', act: 0, status: 'transition', startedAt: now, actStartedAt: null,
    players: map, conquered: {}, undo: [], checkpoints: [], log: [], votes: null, risk: {}, finalVotes: {}, nailsOpen: false,
    previously: { at: now, from: null, to: 'classic' },
  };
}

// ---------- Σκορ & κατάταξη ----------
export function finalScore(cg, pid) {
  const s = statsOf(cg, pid);
  const penalty = s.wanted >= 5 ? WANTED5_FINAL_PENALTY : 0;
  return s.points + s.loot * LOOT_TO_POINTS + s.zones * ZONE_POINTS + s.tokens + (s.bonus || 0) - penalty;
}
export const liveScore = (cg, pid) => statsOf(cg, pid).points + statsOf(cg, pid).loot * LOOT_TO_POINTS + statsOf(cg, pid).zones * ZONE_POINTS;
export function ranking(cg, players = [], { final = false } = {}) {
  const conquests = (pid) => Object.values(cg.conquered || {}).filter((c) => c.winner === pid).length;
  return [...players].map((p) => ({ ...p, score: final ? finalScore(cg, p.id) : liveScore(cg, p.id), conquests: conquests(p.id), stats: statsOf(cg, p.id) }))
    .sort((a, b) => b.score - a.score || b.conquests - a.conquests || b.stats.tokens - a.stats.tokens || String(a.name).localeCompare(String(b.name), 'el'));
}
export const wantedOne = (cg, players = []) => {
  const top = [...players].map((p) => ({ p, w: statsOf(cg, p.id).wanted })).sort((a, b) => b.w - a.w)[0];
  return top && top.w > 0 ? top.p.id : null;
};

// ---------- Αλλαγές με Αναίρεση ----------
const snapshot = (cg) => ({ players: JSON.parse(JSON.stringify(cg.players || {})), at: Date.now() });
export function withUndo(cg) { return { ...cg, undo: [snapshot(cg), ...(cg.undo || [])].slice(0, UNDO_MAX) }; }
export function undo(cg) {
  const [last, ...rest] = cg.undo || [];
  return last ? { ...cg, players: last.players, undo: rest } : cg;
}

// Εφαρμόζει { points, loot, tokens, wanted, zones } σε μία παίκτρια. opts.penalty: για ασπίδα/διπλασιασμό/Wanted 2.
export function applyDelta(cg, pid, delta = {}, { penalty = false, undoable = true } = {}) {
  if (!pid || !(cg.players || {})[pid]) return cg;
  let out = undoable ? withUndo(cg) : cg;
  const s = statsOf(out, pid);
  const flags = { ...(s.flags || {}) };
  let mult = 1;
  if (flags.double && (delta.points || delta.loot)) { mult = 2; flags.double = false; }
  let points = (delta.points || 0) * mult;
  let loot = (delta.loot || 0) * mult;
  if (penalty) {
    if (s.wanted >= 2) points -= 1;
    if (flags.shield && s.wanted < 3) { points = Math.ceil(points / 2); loot = Math.ceil(loot / 2); flags.shield = false; }
  }
  const next = {
    ...s,
    points: s.points + points,
    loot: Math.max(0, s.loot + loot),
    tokens: clamp(s.tokens + (delta.tokens || 0), 0, MAX_TOKENS),
    wanted: clamp(s.wanted + (delta.wanted || 0), 0, 5),
    zones: Math.max(0, s.zones + (delta.zones || 0)),
    bonus: (s.bonus || 0) + (delta.bonus || 0),
    flags,
  };
  out = { ...out, players: { ...out.players, [pid]: next } };
  return out;
}

export function logLine(cg, text, now = Date.now()) {
  return { ...cg, log: [{ t: now, text: String(text).slice(0, 200) }, ...(cg.log || [])].slice(0, 120) };
}

// ---------- Μητρώο κατάστασης ----------
export const isBareFoot = (state = {}) => state.sockL !== 'on' || state.sockR !== 'on';
export function canRemove(state = {}, piece) {
  if (piece === 'shoeL') return state.shoeL === 'on';
  if (piece === 'shoeR') return state.shoeR === 'on';
  if (piece === 'sockL') return state.shoeL === 'off' && state.sockL === 'on';
  if (piece === 'sockR') return state.shoeR === 'off' && state.sockR === 'on';
  return false;
}
// Ένα κομμάτι ανά γύρο: παπούτσι πριν από την κάλτσα του ίδιου ποδιού.
export function removePiece(cg, pid, piece, { sleep = false } = {}) {
  const s = statsOf(cg, pid);
  if (!canRemove(s.state, piece)) return { cg, ok: false };
  const value = piece.startsWith('sock') && sleep ? 'sleep' : 'off';
  return { cg: setState(cg, pid, { [piece]: value }), ok: true };
}
export function setState(cg, pid, patch = {}) {
  const s = statsOf(cg, pid);
  const locked = s.state.hands === 'hogtie';
  const clean = { ...patch };
  if (locked && !clean.release) { delete clean.hands; delete clean.feet; }
  delete clean.release;
  return { ...cg, players: { ...cg.players, [pid]: { ...s, state: { ...s.state, ...clean } } } };
}
export const releaseAll = (cg, pid) => setState(cg, pid, { release: true, hands: 'free', feet: 'free', mask: false, flipflops: statsOf(cg, pid).state.flipflops === 'tied' ? 'on' : statsOf(cg, pid).state.flipflops });

// Επόμενο κομμάτι που μπορεί να βγει (αριστερά πρώτα).
export function nextPiece(state = {}) {
  return ['shoeL', 'shoeR', 'sockL', 'sockR'].find((p) => canRemove(state, p)) || null;
}

// ---------- Δοκιμασίες ----------
export function startTrial(cg, trialId, pid, { executors = [], secs, now = Date.now() } = {}) {
  const t = trialOf(trialId);
  if (!t || !pid) return cg;
  const dur = secs ?? t.secs ?? 0;
  // Όλα τα πεδία ρητά: ο server συγχωνεύει αντικείμενα, οπότε ό,τι λείπει θα κρατούσε την τιμή της προηγούμενης δοκιμασίας.
  let out = { ...cg, trial: { id: trialId, pid, executors, at: now, until: dur ? now + dur * 1000 : null, secs: dur, done: false, outcome: null, side: null } };
  if (t.state) out = setState(out, pid, t.state);
  return out;
}
// Αποτέλεσμα δοκιμασίας με τον πίνακα του PDF. outcome: win | lose | pass (PASS = 0, ποτέ ποινή).
export function resolveTrial(cg, outcome) {
  const tr = cg.trial;
  const t = tr && trialOf(tr.id);
  if (!t) return cg;
  let out = cg;
  if (outcome === 'win') out = applyDelta(out, tr.pid, t.win);
  if (outcome === 'lose') out = applyDelta(out, tr.pid, t.lose, { penalty: true });
  if (t.id === 'nightsock' && outcome === 'win') {
    // εκτελέστρια κερδίζει, στόχος χάνει κάλτσα
    for (const ex of tr.executors || []) out = applyDelta(out, ex, t.win, { undoable: false });
    out = applyDelta(out, tr.pid, t.lose, { penalty: true, undoable: false });
    const piece = canRemove(statsOf(out, tr.pid).state, 'sockL') ? 'sockL' : canRemove(statsOf(out, tr.pid).state, 'sockR') ? 'sockR' : null;
    if (piece) out = setState(out, tr.pid, { [piece]: 'sleep' });
  }
  if (t.high && outcome === 'win' && statsOf(out, tr.pid).wanted >= 5) out = applyDelta(out, tr.pid, { wanted: -1 }, { undoable: false });
  return { ...out, trial: { ...tr, outcome, done: true }, lastTrial: { id: t.id, pid: tr.pid, outcome, at: Date.now() } };
}
export const trialSecondsLeft = (cg, now = Date.now()) => (cg.trial?.until && !cg.trial.done ? Math.max(0, Math.ceil((cg.trial.until - now) / 1000)) : 0);

// ---------- Κλήρωση ----------
export function drawPlayer(cg, players = [], { rng = Math.random, eligible = null } = {}) {
  const pool = (eligible || players).filter(Boolean);
  if (!pool.length) return { cg, pid: null };
  const recent = cg.recentDraws || [];
  const fresh = pool.filter((p) => !recent.includes(p.id));
  const from = fresh.length ? fresh : pool;
  const pick = from[Math.floor(rng() * from.length)];
  return { cg: { ...cg, drawn: { pid: pick.id, at: Date.now() }, recentDraws: [pick.id, ...recent].slice(0, Math.max(1, players.length - 1)) }, pid: pick.id };
}

// ---------- Tokens (από το κινητό) ----------
export function spendToken(cg, pid, use, { target, players = [] } = {}) {
  const def = TOKEN_USES.find((u) => u.id === use);
  const s = statsOf(cg, pid);
  if (!def || s.tokens < def.cost) return { cg, ok: false, reason: 'Δεν έχεις αρκετά tokens.' };
  if (use === 'shield' && s.wanted >= 3) return { cg, ok: false, reason: 'Με Ενεργό Ένταλμα δεν επιτρέπεται Ασπίδα.' };
  let out = applyDelta(cg, pid, { tokens: -def.cost });
  const flags = { ...statsOf(out, pid).flags };
  if (use === 'shield') flags.shield = true;
  if (use === 'double') flags.double = true;
  if (use === 'switch') flags.switchReq = Date.now();
  out = { ...out, players: { ...out.players, [pid]: { ...statsOf(out, pid), flags } } };
  if (use === 'steal') {
    const leaders = ranking(out, players).filter((p) => p.id !== pid);
    const victim = target && leaders.find((p) => p.id === target) ? target : leaders[0]?.id;
    if (victim && liveScore(out, victim) >= liveScore(out, pid)) {
      const v = statsOf(out, victim);
      if (v.loot > 0 && v.points < 2) {
        out = applyDelta(out, victim, { loot: -1 }, { undoable: false });
        out = applyDelta(out, pid, { loot: 1 }, { undoable: false });
      } else {
        out = applyDelta(out, victim, { points: -2 }, { undoable: false });
        out = applyDelta(out, pid, { points: 2 }, { undoable: false });
      }
      return { cg: out, ok: true, victim };
    }
    return { cg, ok: false, reason: 'Η κλοπή γίνεται μόνο από προπορευόμενη παίκτρια.' };
  }
  return { cg: out, ok: true };
}
export function buyout(cg, pid) {
  const s = statsOf(cg, pid);
  if (s.wanted < 5 || s.tokens < BUYOUT_TOKENS) return { cg, ok: false };
  return { cg: applyDelta(cg, pid, { tokens: -BUYOUT_TOKENS, wanted: -1 }), ok: true };
}

// ---------- Ροή πράξεων ----------
export function checkpoint(cg, players = [], label = '', now = Date.now()) {
  const cp = { id: `cp${now.toString(36)}`, at: now, act: cg.act || 0, label, players: JSON.parse(JSON.stringify(cg.players || {})), conquered: { ...(cg.conquered || {}) },
    top: ranking(cg, players).slice(0, 3).map((p) => ({ id: p.id, name: p.name, score: p.score })) };
  return { ...cg, checkpoints: [cp, ...(cg.checkpoints || [])].slice(0, CHECKPOINT_MAX) };
}
export function restoreCheckpoint(cg, id) {
  const cp = (cg.checkpoints || []).find((c) => c.id === id);
  if (!cp) return cg;
  return { ...cg, players: JSON.parse(JSON.stringify(cp.players)), conquered: { ...cp.conquered }, act: cp.act, status: 'transition', trial: null, card: null, votes: null };
}

export function startAct(cg, players = [], now = Date.now()) {
  let out = checkpoint(cg, players, 'Έναρξη πράξης', now);
  const ps = {};
  Object.entries(out.players || {}).forEach(([pid, s]) => { ps[pid] = { ...s, actStart: liveScore(out, pid) }; });
  out = { ...out, players: ps, status: 'active', actStartedAt: now, lastClosed: null, night: null, previously: null, trial: null, card: null, votes: null };
  return logLine(out, `▶ Πράξη ${(out.act || 0) + 1}: ${currentAct(out).title} · ${currentAct(out).info.name}`, now);
}

// Κλείσιμο πράξης: νικήτρια = όποια κέρδισε τους περισσότερους πόντους μέσα στην πράξη. Wanted 4 → −2 Λεία στις δύο πρώτες.
export function closeAct(cg, players = [], now = Date.now()) {
  let out = withUndo(cg);
  for (const p of players) {
    if (statsOf(out, p.id).wanted === 4 && statsOf(out, p.id).loot > 0) {
      const lost = Math.min(2, statsOf(out, p.id).loot);
      out = applyDelta(out, p.id, { loot: -lost }, { undoable: false });
      ranking(out, players).filter((r) => r.id !== p.id).slice(0, lost).forEach((r) => { out = applyDelta(out, r.id, { loot: 1 }, { undoable: false }); });
    }
  }
  const gains = players.map((p) => ({ id: p.id, gain: liveScore(out, p.id) - (statsOf(out, p.id).actStart || 0) })).sort((a, b) => b.gain - a.gain);
  const winner = gains[0] && gains[0].gain > 0 ? gains[0].id : null;
  const act = currentAct(out);
  out = { ...out, conquered: { ...(out.conquered || {}), [out.act || 0]: { continent: act.continent, title: act.title, winner, at: now } }, trial: null, card: null, votes: null };
  out = checkpoint(out, players, 'Κλείσιμο πράξης', now);
  const last = (out.act || 0) >= act.total - 1;
  out = { ...out, status: last ? 'finale' : (act.standbyAfter ? 'standby' : 'transition'), lastClosed: now };
  return logLine(out, `■ Κλείσιμο πράξης ${(out.act || 0) + 1}${winner ? ` · κυριάρχησε: ${players.find((p) => p.id === winner)?.name || ''}` : ''}`, now);
}

// Μετάβαση: γραμμικά στην επόμενη πράξη ή «Έκτακτο Άλμα» σε άλλη ήπειρο για την ίδια πράξη.
export function goNext(cg, now = Date.now()) {
  const total = actsOf(cg).length;
  const next = Math.min((cg.act || 0) + 1, total - 1);
  const from = currentAct(cg).continent;
  const out = { ...cg, act: next, jump: null, status: 'transition', previously: { at: now, from, to: actsOf(cg)[next].continent, jump: false } };
  return logLine(out, `➡️ Μετάβαση στην Πράξη ${next + 1}`, now);
}
export function jumpTo(cg, continentId, now = Date.now()) {
  if (!CONTINENTS.some((c) => c.id === continentId)) return cg;
  const from = currentAct(cg).continent;
  return logLine({ ...cg, jump: continentId, status: 'transition', previously: { at: now, from, to: continentId, jump: true } }, `⚡ Έκτακτο άλμα στην ήπειρο ${continentOf(continentId).name}`, now);
}
export const setStandby = (cg, on, now = Date.now()) => logLine({ ...cg, status: on ? 'standby' : (cg.actStartedAt && !cg.lastClosed ? 'active' : 'transition'), standbyAt: on ? now : null }, on ? '⏸ Standby' : '▶ Επιστροφή από Standby', now);
export const toFinale = (cg, now = Date.now()) => logLine({ ...cg, status: 'finale', finaleAt: now }, '👑 Μεγάλο Φινάλε', now);

// Τελική ψήφος παρέας (+5 / +3) και Τελευταίο Ρίσκο (±6) — εφαρμόζονται μία φορά από το Tablet.
export function applyFinalVotes(cg) {
  if (cg.finalApplied) return cg;
  const tally = {};
  Object.values(cg.finalVotes || {}).forEach((t) => { tally[t] = (tally[t] || 0) + 1; });
  const order = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  let out = cg;
  if (order[0]) out = applyDelta(out, order[0][0], { bonus: 5 }, { undoable: false });
  if (order[1]) out = applyDelta(out, order[1][0], { bonus: 3 }, { undoable: false });
  return { ...out, finalApplied: true, finalTally: order };
}
export function resolveRisk(cg, pid, won) {
  if ((cg.risk || {})[pid] !== 'risk' || (cg.riskDone || {})[pid]) return cg;
  return { ...applyDelta(cg, pid, { bonus: won ? 6 : -6 }), riskDone: { ...(cg.riskDone || {}), [pid]: won ? 'win' : 'lose' } };
}

// ---------- Ψηφοφορίες ----------
// Οι παλιές ψήφοι μηδενίζονται ρητά (null) για κάθε παίκτρια — ο server συγχωνεύει αντικείμενα.
export const openVote = (cg, { kind, q, cardId = null, pid = null }, now = Date.now()) => ({
  ...cg, votes: { kind, q, cardId, pid, open: true, at: now, ballots: Object.fromEntries(Object.keys(cg.players || {}).map((id) => [id, null])) },
});
export const closeVote = (cg) => (cg.votes ? { ...cg, votes: { ...cg.votes, open: false } } : cg);
export function tallyVotes(cg) {
  const tally = {};
  Object.values(cg.votes?.ballots || {}).forEach((v) => { if (v && v !== true) tally[v] = (tally[v] || 0) + 1; });
  return Object.entries(tally).sort((a, b) => b[1] - a[1]);
}

// Εξαγωγή αρχείου ταινίας (JSON & CSV).
export function exportCampaign(cg, players = []) {
  const rows = ranking(cg, players, { final: true }).map((p, i) => ({ θέση: i + 1, όνομα: p.name, τελικό: p.score, πόντοι: p.stats.points, λεία: p.stats.loot, tokens: p.stats.tokens, ζώνες: p.stats.zones, wanted: p.stats.wanted, νύχια: p.stats.nail || '', κατακτήσεις: p.conquests }));
  const acts = actsOf(cg).map((a, i) => ({ πράξη: i + 1, ήπειρος: continentOf((cg.conquered || {})[i]?.continent || a.continent).name, τίτλος: a.title, νικήτρια: players.find((p) => p.id === (cg.conquered || {})[i]?.winner)?.name || '' }));
  const csv = [Object.keys(rows[0] || { θέση: '' }).join(','), ...rows.map((r) => Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
  return { json: JSON.stringify({ format: formatOf(cg).label, ranking: rows, acts, log: cg.log || [] }, null, 2), csv };
}
