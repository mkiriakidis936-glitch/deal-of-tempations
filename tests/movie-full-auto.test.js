import test from 'node:test';
import assert from 'node:assert/strict';
import { fullAutoStep, isFullAutoAllowed } from '../src/lib/movieFullAuto.js';
import { botAction, makeBots } from '../src/lib/rehearsalBots.js';
import * as E from '../src/lib/campaignEngine.js';
import * as BD from '../src/lib/movieBoardEngine.js';
import * as G from '../src/lib/movieGamesEngine.js';

// Ίδια επεξεργασία ενεργειών κινητού με το Tablet (μόνο όσες στέλνουν οι εικονικές).
function applyBot(c, a, rnd) {
  const pid = a.playerId;
  if (a.type === 'cg_roll' && BD.turnPid(c) === pid && !c.board?.pending) { const r = BD.boardRoll(c, pid, BD.rollDie(rnd), c.__now); return r.ok ? r.cg : c; }
  if (a.type === 'cg_wheel_ok' && c.wheel?.pid === pid) return G.confirmWheel(c);
  if (a.type === 'cg_tod' && c.tod?.pid === pid) return G.todChoose(c, a.value);
  if (a.type === 'cg_vote' && c.votes?.open) return { ...c, votes: { ...c.votes, ballots: { ...c.votes.ballots, [pid]: String(a.value) } } };
  if (a.type === 'cg_final' && c.votes?.open) return { ...c, votes: { ...c.votes, ballots: { ...c.votes.ballots, [pid]: String(a.target) } } };
  if (a.type === 'cg_risk' && c.votes?.open) return { ...c, votes: { ...c.votes, ballots: { ...c.votes.ballots, [pid]: a.value } } };
  if (a.type === 'cg_nail') return { ...c, players: { ...c.players, [pid]: { ...E.statsOf(c, pid), nail: a.nail, nailLocked: true } } };
  return c;
}

function seeded(seed) { let s = seed; return () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; }

test('πλήρης αυτόματη: μόνο με εικονικές παίκτριες', () => {
  assert.equal(isFullAutoAllowed([{ id: 'a', bot: true }, { id: 'b', bot: true }]), true);
  assert.equal(isFullAutoAllowed([{ id: 'a', bot: true }, { id: 'r' }]), false);
  assert.equal(isFullAutoAllowed([{ id: 'a', bot: true }]), false);
  const cg = E.initCampaign([{ id: 'r' }, { id: 'a', bot: true }], { format: 'quick' });
  assert.equal(fullAutoStep({ cg, players: [{ id: 'r' }, { id: 'a', bot: true }] }), null);
  assert.equal(fullAutoStep({ cg, players: makeBots([], 3), stopped: true }), null);
});

for (const seed of [1, 7, 42]) {
  test(`πλήρης αυτόματη: η ταινία φτάνει μόνη της στο φινάλε (σενάριο ${seed})`, () => {
    const rnd = seeded(seed);
    const players = makeBots([], 4, 1);
    let now = 1_000_000;
    let cg = E.initCampaign(players, { format: 'quick', now });
    let shown = { key: '', at: 0 };
    let steps = 0;
    for (let tick = 0; tick < 20000 && cg.status !== 'finale'; tick += 1) {
      now += 500;
      cg.__now = now;
      const a = botAction({ cg, players, now, rnd });
      if (a) cg = applyBot(cg, a, rnd);
      const s = fullAutoStep({ cg, players, now, speed: 'fast', rnd });
      if (!s) continue;
      if (s.key !== shown.key) { shown = { key: s.key, at: now }; continue; }
      if (now - shown.at >= s.wait) { cg = s.run(cg); steps += 1; shown = { key: '', at: 0 }; }
    }
    delete cg.__now;
    assert.equal(cg.status, 'finale', `κόλλησε στο: ${JSON.stringify({ status: cg.status, act: cg.act, board: cg.board && { pending: cg.board.pending, allDone: cg.board.allDone }, trial: cg.trial, wheel: cg.wheel, game: cg.game, votes: cg.votes?.open, mandatory: cg.mandatory })}`);
    assert.ok(Object.keys(cg.conquered || {}).length >= 3);
    assert.ok(steps > 10);
  });
}
