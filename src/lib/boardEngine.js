// Κοινή παιχνιδομηχανή ταμπλό: καθαρές συναρτήσεις (χωρίς React/δίκτυο), ίδιες σε Tablet, tests και μελλοντικά modes.
// Κάθε mode δίνει έναν «ορισμό» (def): ταμπλό, εφέ τετραγώνων, κάρτες, ερωτήσεις, ετυμηγορίες, όρια.

export const defaultStats = (def) => ({ stars: def.startStars ?? 1, loot: def.startLoot ?? 0, footwear: def.footwearMax ?? 4, cuffs: 'none', immune: false });

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const pickWith = (rng, list) => list[Math.floor(rng() * list.length)];

export function shuffleWith(rng, list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function createBoard(players, def, { rng = Math.random, now = Date.now() } = {}) {
  return {
    stats: Object.fromEntries(players.map((p) => [p.id, defaultStats(def)])),
    pos: Object.fromEntries(players.map((p) => [p.id, 0])),
    turn: 0,
    round: 1,
    chief: players.length ? pickWith(rng, players).id : null,
    phase: 0,
    phaseAt: now,
    usedCards: [],
  };
}

export const statOf = (lg, def, pid) => ({ ...defaultStats(def), ...(lg.stats?.[pid] || {}) });

export function updateStat(lg, def, pid, change) {
  const current = statOf(lg, def, pid);
  const patch = typeof change === 'function' ? change(current) : change;
  const next = { ...current, ...patch };
  next.stars = clamp(next.stars, def.minStars ?? 1, def.maxStars ?? 5);
  next.footwear = clamp(next.footwear, 0, def.footwearMax ?? 4);
  next.loot = Math.max(0, Math.round(next.loot));
  return { ...lg, stats: { ...(lg.stats || {}), [pid]: next } };
}

export const currentPlayer = (lg, players) => (players.length ? players[(lg.turn || 0) % players.length] : null);
export const isBusy = (lg) => !!(lg.card || lg.interro || lg.tickle || lg.finale);
export const isBarefoot = (lg, def, pid) => statOf(lg, def, pid).footwear === 0;

export function drawCard(lg, def, pid, { rng = Math.random, now = Date.now() } = {}) {
  let used = lg.usedCards || [];
  let pool = def.cards.filter((card) => !used.includes(card.id));
  if (!pool.length) { used = []; pool = def.cards; }
  const card = pickWith(rng, pool);
  return { ...lg, card: { ...card, pid, at: now }, usedCards: [...used, card.id] };
}

export function startInterrogation(lg, def, pid, { rng = Math.random, now = Date.now() } = {}) {
  return { ...lg, interro: { id: `i${now.toString(36)}`, at: now, pid, idx: 0, questions: shuffleWith(rng, def.questions).slice(0, 3), answers: {} } };
}

function glitchEvent(lg, def, pid, players, rng, now) {
  const kind = pickWith(rng, def.glitchEvents || ['distraction']);
  if (kind === 'snatch') {
    const target = pickWith(rng, players.filter((p) => p.id !== pid).length ? players.filter((p) => p.id !== pid) : players);
    return { ...lg, mission: { pid: target?.id, title: 'Slipper Snatch', text: def.texts?.snatch || '', until: now + 30000 } };
  }
  if (kind === 'wheel') {
    return { ...lg, alert: { type: 'wheel', title: def.texts?.wheelTitle || 'WHEEL', text: `${players.find((p) => p.id === pid)?.name || ''} → ${pickWith(rng, def.hellWheel || ['—'])}`, until: now + 15000 } };
  }
  return { ...lg, alert: { type: 'distraction', title: def.texts?.distractionTitle || 'DISTRACTION ALERT!', text: def.texts?.distraction || '', until: now + 20000 } };
}

// Μία ζαριά: κίνηση, μπόνους αφετηρίας, εφέ τετραγώνου, επόμενη σειρά.
export function applyRoll(lg, players, def, { d, rng = Math.random, now = Date.now() } = {}) {
  const player = currentPlayer(lg, players);
  if (!player || isBusy(lg)) return { lounge: lg, event: null };
  const dice = d ?? 1 + Math.floor(rng() * 6);
  const from = lg.pos?.[player.id] || 0;
  const size = def.board.length;
  const to = (from + dice) % size;
  const type = def.board[to];
  const effect = def.squares[type]?.effect || {};
  let next = { ...lg, pos: { ...(lg.pos || {}), [player.id]: to }, lastRoll: { pid: player.id, d: dice, square: type, at: now }, turn: ((lg.turn || 0) + 1) % players.length };
  if (from + dice >= size && def.passStartBonus) next = updateStat(next, def, player.id, (s) => ({ loot: s.loot + def.passStartBonus }));

  const immune = statOf(next, def, player.id).immune;
  if (effect.immunityBlocks && immune) {
    next = updateStat(next, def, player.id, { immune: false });
    return { lounge: next, event: { pid: player.id, d: dice, square: type, immuneUsed: true } };
  }
  if (effect.loot) next = updateStat(next, def, player.id, (s) => ({ loot: s.loot + effect.loot }));
  if (effect.stars) next = updateStat(next, def, player.id, (s) => ({ stars: s.stars + effect.stars }));
  if (effect.footwear) next = updateStat(next, def, player.id, (s) => ({ footwear: s.footwear + effect.footwear }));
  if (effect.immune) next = updateStat(next, def, player.id, { immune: true });
  if (effect.card) next = drawCard(next, def, player.id, { rng, now });
  if (effect.interrogate) next = startInterrogation(next, def, player.id, { rng, now });
  if (effect.market) next = { ...next, card: { id: 'market', market: true, title: def.texts?.marketTitle || 'Black Market', text: def.texts?.market || '', pid: player.id, at: now } };
  if (effect.random) next = glitchEvent(next, def, player.id, players, rng, now);
  if (effect.tickle) next = { ...next, tickle: { pid: player.id, at: now, secs: (def.tickleSeconds || 45) * (isBarefoot(next, def, player.id) ? 2 : 1) } };
  return { lounge: next, event: { pid: player.id, d: dice, square: type, immuneUsed: false } };
}

export function resolveCard(lg, def, ok) {
  const card = lg.card;
  if (!card) return lg;
  const reward = def.cardReward || { loot: 1000 };
  const penalty = def.cardPenalty || { stars: 1, footwear: -1 };
  const next = ok
    ? updateStat(lg, def, card.pid, (s) => ({ loot: s.loot + (reward.loot || 0) }))
    : updateStat(lg, def, card.pid, (s) => ({ stars: s.stars + (penalty.stars || 0), footwear: s.footwear + (penalty.footwear || 0) }));
  return { ...next, card: null };
}

export function payBribe(lg, def) {
  const card = lg.card;
  if (!card) return lg;
  return { ...updateStat(lg, def, card.pid, (s) => ({ loot: Math.floor(s.loot / 2), immune: true })), card: null };
}

export function tallyVotes(votes, key) {
  const values = Object.values(votes || {}).map(String).filter((value) => value.startsWith(`${key}:`)).map((value) => value.split(':')[2]);
  return { truth: values.filter((v) => v === 'truth').length, lie: values.filter((v) => v === 'lie').length };
}

export function verdictFor(answers) {
  const lies = Object.values(answers || {}).filter((a) => a === 'lie').length;
  return lies === 0 ? 'allTruth' : lies < 3 ? 'someLies' : 'allLies';
}

const VERDICT_EFFECTS = {
  allTruth: (s, def) => ({ cuffs: 'none', loot: s.loot + 5000, footwear: def.footwearMax ?? 4, stars: s.stars - 1 }),
  someLies: (s) => ({ stars: s.stars + 1 }),
  allLies: (s, def) => ({ stars: def.maxStars ?? 5, loot: 0, cuffs: 'back' }),
};

export function answerInterrogation(lg, def, answer, { now = Date.now() } = {}) {
  const it = lg.interro;
  if (!it || !['truth', 'lie'].includes(answer)) return { lounge: lg, verdict: null };
  const answers = { ...it.answers, [it.idx]: answer };
  if (it.idx < 2) return { lounge: { ...lg, interro: { ...it, idx: it.idx + 1, answers } }, verdict: null };
  const key = verdictFor(answers);
  const verdict = { key, pid: it.pid, ...(def.verdicts?.[key] || {}), at: now };
  const next = updateStat(lg, def, it.pid, (s) => VERDICT_EFFECTS[key](s, def));
  return { lounge: { ...next, interro: null, verdict }, verdict };
}

export function finaleCode(lg, players, def) {
  const totalStars = players.reduce((sum, p) => sum + statOf(lg, def, p.id).stars, 0);
  const bare = players.filter((p) => isBarefoot(lg, def, p.id)).length;
  return [(lg.round || 1) % 10, totalStars % 10, players.length % 10, bare % 10].join('');
}

export function startFinale(lg, players, def, { now = Date.now() } = {}) {
  return { ...lg, card: null, interro: null, tickle: null, phase: (def.phases?.length || 1) - 1, finale: { code: finaleCode(lg, players, def), riddle: def.finaleRiddle || [], startedAt: now, winner: null } };
}

export function submitFinaleCode(lg, playerId, code, { now = Date.now() } = {}) {
  if (!lg.finale || lg.finale.winner) return { lounge: lg, correct: false };
  if (String(code) !== lg.finale.code) return { lounge: lg, correct: false };
  return { lounge: { ...lg, finale: { ...lg.finale, winner: playerId, solvedAt: now } }, correct: true };
}

export function newRound(lg, players, { rng = Math.random } = {}) {
  return { ...lg, round: (lg.round || 1) + 1, chief: players.length ? pickWith(rng, players).id : null };
}

export const rankByLoot = (lg, players, def) => [...players].sort((a, b) => statOf(lg, def, b.id).loot - statOf(lg, def, a.id).loot);
