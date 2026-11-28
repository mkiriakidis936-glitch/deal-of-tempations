import test from 'node:test';
import assert from 'node:assert/strict';
import { readinessChecks } from '../src/lib/nightReadiness.js';

const now = 10_000_000;
const players = [{ id: 'a' }, { id: 'b' }];
const lvl = (r, id) => r.checks.find((c) => c.id === id)?.level;

test('ετοιμότητα: όλα καλά = έτοιμοι', () => {
  const r = readinessChecks({ state: { players }, presence: { a: now - 1000, b: now - 2000 }, tv: { online: true, sound: true, w: 1920, h: 1080 }, lights: { auth: { type: 'oauth', connected: true }, enabled: true, devices: [{ role: 'lamp' }] }, media: { missingRequired: 0, broken: 0 }, now });
  assert.equal(r.ready, true); assert.equal(r.bad, 0);
});

test('ετοιμότητα: TV κλειστή, κλειδωμένος ήχος, κινητό εκτός, ΣΤΟΠ', () => {
  assert.equal(lvl(readinessChecks({ state: { players }, now }), 'tv'), 'bad');
  const r = readinessChecks({ state: { players, stopActive: true }, presence: { a: now }, tv: { online: true, sound: false }, now });
  assert.equal(lvl(r, 'tv-sound'), 'bad'); assert.equal(lvl(r, 'phones'), 'warn'); assert.equal(lvl(r, 'stop'), 'bad'); assert.equal(r.ready, false);
});

test('ετοιμότητα: token φώτων που λήγει πριν το τέλος, εικονικές παίκτριες', () => {
  const r = readinessChecks({ state: { players: [...players, { id: 'x', bot: true }] }, presence: { a: now, b: now }, tv: { online: true, sound: true }, lights: { auth: { type: 'pat', expiresAt: now + 2 * 3600000 }, enabled: true, devices: [] }, eventHours: 6, now });
  assert.equal(lvl(r, 'lights'), 'warn'); assert.equal(lvl(r, 'bots'), 'warn');
  assert.match(r.checks.find((c) => c.id === 'phones').title, /2\/2/); // οι εικονικές δεν μετράνε
  assert.equal(lvl(readinessChecks({ lights: { auth: { type: 'pat', expired: true } }, now }), 'lights'), 'bad');
});
