import test from 'node:test';
import assert from 'node:assert/strict';
import { autopilotPlan, autopilotDueAt, AUTO_WAIT_MS, ROLL_IDLE_MS } from '../src/lib/movieAutopilot.js';
import { movieGuideStep } from '../src/lib/movieGuide.js';
import { initCampaign } from '../src/lib/campaignEngine.js';

const players = [{ id: 'a' }, { id: 'b', bot: true }];
const now = 9_000_000;
const plan = (mg, extra = {}) => autopilotPlan(movieGuideStep({ mg, players, now, ...extra }), mg.cg, { now, players, ...extra });

test('πιλότος: έναρξη πράξης & μετάβαση = αυτόματα', () => {
  const cg = initCampaign(players, { format: 'h48', now });
  assert.deepEqual([plan({ cg }).action, plan({ cg }).auto], ['startAct', true]);
  assert.equal(autopilotDueAt(plan({ cg }), now), now + AUTO_WAIT_MS);
  const closed = { ...cg, status: 'transition', act: 0, conquered: { 0: { winner: 'a' } } };
  assert.deepEqual([plan({ cg: closed }).action, plan({ cg: closed }).auto], ['goNext', true]);
});

test('πιλότος: ΠΟΤΕ αυτόματα δοκιμασία, Τροχός, Deal, υποχρεωτικό, κλείσιμο, ΣΤΟΠ', () => {
  const base = { ...initCampaign(players, { format: 'h48', now }), status: 'active' };
  for (const cg of [
    { ...base, trial: { pid: 'a', done: false } },
    { ...base, wheel: { pid: 'a', at: now, done: false } },
    { ...base, game: 'dond', dond: { status: 'final' } },
    { ...base, status: 'transition', mandatory: { pending: true } },
    { ...base, board: { on: true, allDone: true, order: ['a'] } },
  ]) assert.equal(plan({ cg }), null);
  assert.equal(autopilotPlan({ id: 'act' }, base, { now, stopped: true }), null);
});

test('πιλότος: ζάρι για όποια αργεί 60″ (όχι για εικονική)', () => {
  const base = { ...initCampaign(players, { format: 'h48', now }), status: 'active' };
  const fresh = { ...base, board: { on: true, order: ['a', 'b'], turn: 0, at: now - 5000 } };
  assert.equal(plan({ cg: fresh }).auto, false);
  const idle = { ...base, board: { on: true, order: ['a', 'b'], turn: 0, at: now - ROLL_IDLE_MS - 1 } };
  assert.deepEqual([plan({ cg: idle }).action, plan({ cg: idle }).pid, plan({ cg: idle }).auto], ['rollFor', 'a', true]);
  const botTurn = { ...base, board: { on: true, order: ['a', 'b'], turn: 1, at: now - ROLL_IDLE_MS - 1 } };
  assert.equal(plan({ cg: botTurn }).auto, false);
});
