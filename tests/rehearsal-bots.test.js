import test from 'node:test';
import assert from 'node:assert/strict';
import { botAction, makeBots, hasBots } from '../src/lib/rehearsalBots.js';
import { initCampaign, startAct } from '../src/lib/campaignEngine.js';
import { boardStart } from '../src/lib/movieBoardEngine.js';
import { dondStart, dondPick } from '../src/lib/movieGamesEngine.js';

const now = 5_000_000;
const real = [{ id: 'r1', name: 'Αληθινή' }];
const bots = makeBots(real, 3, now);
const players = [...real, ...bots];

test('bots: δημιουργία, μόνο με bot:true', () => {
  assert.equal(bots.length, 3);
  assert.ok(bots.every((b) => b.bot && b.id.startsWith('bot_')));
  assert.equal(hasBots(real), false);
  assert.equal(botAction({ cg: {}, players: real, now }), null);
});

test('bots: ρίχνει ζάρι μόνο όταν είναι η σειρά εικονικής', () => {
  let cg = startAct(initCampaign(players, { format: 'h48', now: now - 60000 }), players, now - 60000);
  cg = boardStart(cg, players, { now: now - 60000 });
  const turn = cg.board.order[cg.board.turn % cg.board.order.length];
  const a = botAction({ cg, players, now });
  if (turn === 'r1') assert.equal(a, null); else assert.deepEqual([a.type, a.playerId], ['cg_roll', turn]);
});

test('bots: Τροχός, Deal, ψηφοφορία', () => {
  const b = bots[0].id;
  const base = startAct(initCampaign(players, { format: 'h48', now: now - 60000 }), players, now - 60000);
  assert.equal(botAction({ cg: { ...base, wheel: { pid: b, at: now - 9000, done: false } }, players, now }).type, 'cg_wheel_ok');
  assert.equal(botAction({ cg: { ...base, wheel: { pid: b, at: now - 1000, done: false } }, players, now }), null); // ακόμα γυρίζει
  assert.equal(botAction({ cg: { ...base, wheel: { pid: 'r1', at: now - 9000, done: false } }, players, now }), null); // αληθινή = ποτέ
  let d = dondStart(base, b, b, { now: now - 9000 });
  assert.equal(botAction({ cg: d, players, now }).type, 'cg_dond_box');
  d = dondPick(d, 3);
  const open = botAction({ cg: d, players, now });
  assert.equal(open.type, 'cg_dond_box'); assert.notEqual(open.value, 3);
  const v = { ...base, votes: { kind: 'player', open: true, at: now - 9000, ballots: { r1: null, [b]: null } } };
  const vote = botAction({ cg: v, players, now });
  assert.equal(vote.type, 'cg_vote'); assert.notEqual(vote.value, vote.playerId);
});
