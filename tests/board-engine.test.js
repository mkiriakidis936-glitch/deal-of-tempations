import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBoard, applyRoll, resolveCard, payBribe, answerInterrogation, tallyVotes, startFinale,
  submitFinaleCode, statOf, updateStat, newRound, isBusy, currentPlayer, drawCard, rankByLoot,
} from '../src/lib/boardEngine.js';
import { LOUNGE_RULES as def } from '../src/data/modes/loungeContent.js';

const players = [{ id: 'a', name: 'Άννα' }, { id: 'b', name: 'Βίκυ' }, { id: 'c', name: 'Γιώτα' }];
const fixed = (value) => () => value;
const boardAt = (type) => def.board.indexOf(type, 3);
const placeBefore = (lg, pid, type, d) => ({ ...lg, pos: { ...lg.pos, [pid]: (boardAt(type) - d + def.board.length) % def.board.length } });

test('engine: νέο ταμπλό με αρχικά στατιστικά για κάθε παίκτρια', () => {
  const lg = createBoard(players, def, { rng: fixed(0), now: 1 });
  assert.equal(Object.keys(lg.stats).length, 3);
  assert.deepEqual(statOf(lg, def, 'a'), { stars: 1, loot: 5000, footwear: 4, cuffs: 'none', immune: false });
  assert.equal(lg.chief, 'a');
  assert.equal(currentPlayer(lg, players).id, 'a');
});

test('engine: η ζαριά μετακινεί, περνά τη σειρά και δίνει Λεία', () => {
  let lg = placeBefore(createBoard(players, def), 'a', 'loot', 2);
  const { lounge, event } = applyRoll(lg, players, def, { d: 2, now: 5 });
  assert.equal(event.square, 'loot');
  assert.equal(lounge.pos.a, boardAt('loot'));
  assert.equal(statOf(lounge, def, 'a').loot, 7000);
  assert.equal(currentPlayer(lounge, players).id, 'b');
});

test('engine: πέρασμα από την αφετηρία δίνει μπόνους', () => {
  const lg = { ...createBoard(players, def), pos: { a: def.board.length - 1, b: 0, c: 0 } };
  const { lounge } = applyRoll(lg, players, def, { d: 2 });
  assert.equal(lounge.pos.a, 1);
  assert.ok(statOf(lounge, def, 'a').loot >= 6000);
});

test('engine: Αστυνομία = +1 αστέρι και ανάκριση· η ασυλία την ακυρώνει', () => {
  let lg = placeBefore(createBoard(players, def), 'a', 'police', 1);
  const arrested = applyRoll(lg, players, def, { d: 1, rng: fixed(0) }).lounge;
  assert.equal(statOf(arrested, def, 'a').stars, 2);
  assert.equal(arrested.interro.pid, 'a');
  assert.equal(arrested.interro.questions.length, 3);
  assert.ok(isBusy(arrested));

  lg = updateStat(placeBefore(createBoard(players, def), 'a', 'police', 1), def, 'a', { immune: true });
  const safe = applyRoll(lg, players, def, { d: 1 });
  assert.equal(safe.event.immuneUsed, true);
  assert.equal(safe.lounge.interro, undefined);
  assert.equal(statOf(safe.lounge, def, 'a').immune, false);
});

test('engine: όσο υπάρχει εκκρεμότητα δεν γίνεται νέα ζαριά', () => {
  const lg = drawCard(createBoard(players, def), def, 'a', { rng: fixed(0) });
  const { lounge, event } = applyRoll(lg, players, def, { d: 3 });
  assert.equal(event, null);
  assert.equal(lounge, lg);
});

test('engine: κάρτα — επιτυχία δίνει Loot, αποτυχία αστέρι και −1 άμυνα, ποτέ κάτω από 0', () => {
  const base = drawCard(createBoard(players, def), def, 'a', { rng: fixed(0) });
  assert.equal(statOf(resolveCard(base, def, true), def, 'a').loot, 6000);
  let failed = updateStat(base, def, 'a', { footwear: 0 });
  failed = resolveCard(failed, def, false);
  assert.equal(statOf(failed, def, 'a').stars, 2);
  assert.equal(statOf(failed, def, 'a').footwear, 0);
  assert.equal(failed.card, null);
});

test('engine: τα αστέρια μένουν πάντα από 1 έως 5', () => {
  let lg = createBoard(players, def);
  for (let i = 0; i < 10; i += 1) lg = updateStat(lg, def, 'a', (s) => ({ stars: s.stars + 1 }));
  assert.equal(statOf(lg, def, 'a').stars, 5);
  for (let i = 0; i < 10; i += 1) lg = updateStat(lg, def, 'a', (s) => ({ stars: s.stars - 1 }));
  assert.equal(statOf(lg, def, 'a').stars, 1);
});

test('engine: Black Bribe κρατά το 50% και δίνει ασυλία', () => {
  const lg = { ...createBoard(players, def), card: { id: 'market', market: true, pid: 'b' } };
  const after = payBribe(lg, def);
  assert.equal(statOf(after, def, 'b').loot, 2500);
  assert.equal(statOf(after, def, 'b').immune, true);
});

test('engine: ανάκριση — 3 αλήθειες απελευθερώνουν, 3 ψέματα = Hogtie και μηδέν Loot', () => {
  const start = applyRoll(placeBefore(createBoard(players, def), 'a', 'police', 1), players, def, { d: 1, rng: fixed(0) }).lounge;
  let lg = start;
  for (const answer of ['truth', 'truth', 'truth']) lg = answerInterrogation(lg, def, answer).lounge;
  assert.equal(lg.verdict.key, 'allTruth');
  assert.equal(statOf(lg, def, 'a').loot, 10000);
  assert.equal(lg.interro, null);

  lg = start;
  for (const answer of ['lie', 'lie', 'lie']) lg = answerInterrogation(lg, def, answer).lounge;
  assert.equal(lg.verdict.key, 'allLies');
  assert.equal(statOf(lg, def, 'a').stars, 5);
  assert.equal(statOf(lg, def, 'a').loot, 0);
  assert.equal(statOf(lg, def, 'a').cuffs, 'back');

  lg = start;
  for (const answer of ['truth', 'lie', 'truth']) lg = answerInterrogation(lg, def, answer).lounge;
  assert.equal(lg.verdict.key, 'someLies');
});

test('engine: μυστικές ψήφοι μετρώνται μόνο για την τρέχουσα ερώτηση', () => {
  const votes = { a: 'i1:0:truth', b: 'i1:0:lie', c: 'i1:1:lie', d: 'other:0:truth' };
  assert.deepEqual(tallyVotes(votes, 'i1:0'), { truth: 1, lie: 1 });
  assert.deepEqual(tallyVotes(votes, 'i1:1'), { truth: 0, lie: 1 });
});

test('engine: φινάλε — μόνο ο σωστός κωδικός και μόνο η πρώτη κερδίζει', () => {
  let lg = updateStat(createBoard(players, def), def, 'c', { footwear: 0 });
  lg = startFinale(lg, players, def, { now: 10 });
  assert.match(lg.finale.code, /^\d{4}$/);
  assert.equal(lg.finale.code, `1${(3) % 10}31`);
  assert.equal(submitFinaleCode(lg, 'a', '0000').correct, false);
  const first = submitFinaleCode(lg, 'b', lg.finale.code);
  assert.equal(first.correct, true);
  assert.equal(first.lounge.finale.winner, 'b');
  assert.equal(submitFinaleCode(first.lounge, 'a', lg.finale.code).correct, false);
});

test('engine: νέος γύρος αλλάζει Αστυνόμο και η κατάταξη ακολουθεί το Loot', () => {
  let lg = newRound(createBoard(players, def), players, { rng: fixed(0.99) });
  assert.equal(lg.round, 2);
  assert.equal(lg.chief, 'c');
  lg = updateStat(lg, def, 'b', { loot: 9000 });
  assert.equal(rankByLoot(lg, players, def)[0].id, 'b');
});

test('engine: προσομοίωση 200 ζαριών χωρίς σφάλματα και με έγκυρες τιμές', () => {
  let seed = 7;
  const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  let lg = createBoard(players, def, { rng });
  for (let i = 0; i < 200; i += 1) {
    if (lg.card) lg = rng() > 0.5 ? resolveCard(lg, def, rng() > 0.5) : payBribe(lg, def);
    else if (lg.interro) lg = answerInterrogation(lg, def, rng() > 0.5 ? 'truth' : 'lie').lounge;
    else if (lg.tickle) lg = { ...lg, tickle: null };
    else lg = applyRoll(lg, players, def, { rng }).lounge;
    for (const p of players) {
      const s = statOf(lg, def, p.id);
      assert.ok(s.stars >= 1 && s.stars <= 5);
      assert.ok(s.footwear >= 0 && s.footwear <= 4);
      assert.ok(s.loot >= 0);
      assert.ok(lg.pos[p.id] >= 0 && lg.pos[p.id] < def.board.length);
    }
  }
});

test('lounge cards respect the player consent filter and fall back to a penalty-free PASS', async () => {
  const E = await import('../src/lib/boardEngine.js');
  const def = { cards: [{ id: 'a', title: 'Selfie', text: 'βγάλε selfie' }, { id: 'b', title: 'Χορός', text: 'χόρεψε' }], cardReward: { loot: 1000 }, cardPenalty: { stars: 1, footwear: -1 } };
  const onlyB = E.drawCard({}, def, 'p1', { isAllowed: (card) => card.id === 'b', rng: () => 0 });
  assert.equal(onlyB.card.id, 'b');
  const none = E.drawCard({}, def, 'p1', { isAllowed: () => false });
  assert.equal(none.card.pass, true);
  assert.deepEqual(E.resolveCard(none, def, false), { ...none, card: null });
});
