import test from 'node:test';
import assert from 'node:assert/strict';
import { lightScene, commandsFor, wantKey, MIN_CYCLE_MS, CONTINENT_LIGHT } from '../src/lib/lightScenes.js';
import { initCampaign, startAct } from '../src/lib/campaignEngine.js';

const players = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }];
const now = 1_000_000;
const active = () => startAct(initCampaign(players, { format: 'h48', now: now - 60000 }), players, now - 30000);

test('φώτα: ΣΤΟΠ = δυνατό λευκό, πάνω από όλα', () => {
  const s = lightScene({ stopActive: true, mg: { cg: { ...active(), wheel: { at: now, done: false } } } }, now);
  assert.equal(s.id, 'safety');
  assert.equal(s.lamp.level, 100);
  assert.ok(s.lamp.kelvin);
  assert.equal(lightScene({ mg: { stop: true } }, now).id, 'safety');
  assert.equal(lightScene({ lightsOn: false, stopActive: true }, now), null); // κλειστά = δεν αγγίζουμε
});

test('φώτα: χωρίς Ταινία δεν αγγίζουμε τίποτα· χειροκίνητο κανονικό φως', () => {
  assert.equal(lightScene({ mg: {} }, now), null);
  assert.equal(lightScene({ lightsManual: 'normal', mg: {} }, now).id, 'normal');
});

test('φώτα: ήπειρος, Τροχός, ζάρι, δοκιμασία, φινάλε', () => {
  const cg = active();
  const base = lightScene({ mg: { cg } }, now);
  assert.equal(base.id, 'act');
  assert.deepEqual({ hue: base.strip.hue, saturation: base.strip.saturation }, CONTINENT_LIGHT.classic.strip);
  assert.equal(lightScene({ mg: { cg: { ...cg, wheel: { at: now - 1000, done: false } } } }, now).id, 'wheel-spin');
  assert.equal(lightScene({ mg: { cg: { ...cg, wheel: { at: now - 8000, done: false } } } }, now).id, 'wheel-result');
  assert.equal(lightScene({ mg: { cg: { ...cg, board: { roll: { at: now - 500 } } } } }, now).id, 'dice');
  assert.equal(lightScene({ mg: { cg: { ...cg, trial: { pid: 'a', done: false } } } }, now).id, 'trial');
  assert.equal(lightScene({ mg: { cg: { ...cg, status: 'finale' } } }, now).id, 'finale');
  assert.equal(lightScene({ mg: { cg: { ...cg, status: 'standby' } } }, now).id, 'standby');
});

test('φώτα: εναλλαγές όχι πιο γρήγορα από 6″· ήπιο = καμία εναλλαγή', () => {
  const cg = { ...active(), status: 'finale' };
  const seen = new Set();
  for (let t = 0; t < MIN_CYCLE_MS; t += 500) seen.add(wantKey(lightScene({ mg: { cg } }, now - (now % MIN_CYCLE_MS) + t).strip));
  assert.equal(seen.size, 1);
  const calm = new Set();
  for (let t = 0; t < MIN_CYCLE_MS * 4; t += MIN_CYCLE_MS) calm.add(wantKey(lightScene({ mg: { cg } }, now + t, { calm: true }).strip));
  assert.equal(calm.size, 1);
});

test('φώτα: εντολές SmartThings ανά δυνατότητα συσκευής', () => {
  const all = ['switch', 'switchLevel', 'colorControl', 'colorTemperature'];
  const color = commandsFor({ on: true, level: 80, hue: 10, saturation: 90 }, all);
  assert.deepEqual(color.map((c) => c.command), ['on', 'setColor', 'setLevel']);
  assert.deepEqual(commandsFor({ on: true, level: 50, kelvin: 2700 }, all).map((c) => c.command), ['on', 'setColorTemperature', 'setLevel']);
  assert.deepEqual(commandsFor({ on: true, level: 50, hue: 1, saturation: 1 }, ['switch']).map((c) => c.command), ['on']);
  assert.deepEqual(commandsFor({ on: false }, all).map((c) => c.command), ['off']);
  assert.equal(commandsFor({ on: true, level: 0 }, all).find((c) => c.command === 'setLevel').arguments[0], 1);
});

test('φώτα: στο ταμπλό οι ταινίες παίρνουν το χρώμα της παίκτριας που έχει σειρά', () => {
  const cg = { ...active(), board: { on: true, order: ['b', 'a'], turn: 0, pending: null, allDone: false } };
  const s = lightScene({ players, mg: { cg } }, now);
  assert.equal(s.id, 'turn'); assert.equal(s.pid, 'b');
  assert.equal(s.strip.saturation, 90);
  const s2 = lightScene({ players, mg: { cg: { ...cg, board: { ...cg.board, turn: 1 } } } }, now);
  assert.notEqual(s2.strip.hue, s.strip.hue);
});
