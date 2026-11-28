import test from 'node:test';
import assert from 'node:assert/strict';
import { computeReadiness, nightSession } from '../src/lib/readiness.js';

const NOW = Date.parse('2026-11-28T20:00:00Z');
const players = [{ id: 'a', name: 'Α' }, { id: 'b', name: 'Β' }];
const session = (extra = {}) => ({ id: 's1', sessionCode: 'ABCD', updated_date: '2026-11-28T19:00:00Z', state: { stage: 1, players, ...extra } });
const allGood = {
  sessions: [session()],
  media: { missingRequired: 0, broken: 0 },
  backup: { modified: NOW - 3600000 },
  newRequests: 0,
  pushDevices: 3,
  connection: 'connected',
  now: NOW,
};

test('όλα έτοιμα → 100%', () => {
  const r = computeReadiness(allGood);
  assert.equal(r.score, 100);
  assert.equal(r.tone, 'ready');
  assert.equal(r.todo.length, 0);
});

test('χωρίς παρτίδα: πέφτουν παρτίδα, παίκτριες και συναίνεση', () => {
  const r = computeReadiness({ ...allGood, sessions: [] });
  assert.deepEqual(r.todo.map((i) => i.id).sort(), ['consent', 'players', 'session']);
  assert.equal(r.score, 50);
  assert.equal(r.items.find((i) => i.id === 'session').tab, 'show');
});

test('συναίνεση που λείπει μετράει μόνο αν ζητείται', () => {
  const pending = computeReadiness({ ...allGood, sessions: [session({ mg: { consentRequired: true, consent: { players: { a: { confirmed: true } } } } })] });
  assert.equal(pending.items.find((i) => i.id === 'consent').status, 'todo');
  assert.match(pending.items.find((i) => i.id === 'consent').detail, /1\/2/);
  const done = computeReadiness({ ...allGood, sessions: [session({ mg: { consentRequired: true, consent: { players: { a: { confirmed: true }, b: { confirmed: true } } } } })] });
  assert.equal(done.items.find((i) => i.id === 'consent').status, 'ok');
});

test('άγνωστα δεδομένα δεν μετράνε ως έτοιμα', () => {
  const r = computeReadiness({ ...allGood, media: null, backup: undefined, newRequests: null, pushDevices: null, connection: 'loading' });
  for (const id of ['media', 'broken', 'backup', 'inbox', 'push', 'server']) assert.equal(r.items.find((i) => i.id === id).status, 'unknown', id);
  assert.ok(r.score < 60);
});

test('παλιό αντίγραφο (> 24 ώρες) ή κανένα → εκκρεμότητα', () => {
  assert.equal(computeReadiness({ ...allGood, backup: { modified: NOW - 2 * 86400000 } }).items.find((i) => i.id === 'backup').status, 'todo');
  assert.equal(computeReadiness({ ...allGood, backup: null }).items.find((i) => i.id === 'backup').status, 'todo');
});

test('η παρτίδα της βραδιάς είναι η πιο πρόσφατη ανοιχτή', () => {
  const old = { id: 'o', updated_date: '2026-11-27T10:00:00Z', state: { stage: 1 } };
  const fresh = { id: 'f', updated_date: '2026-11-28T10:00:00Z', state: { stage: 0 } };
  const finished = { id: 'x', updated_date: '2026-11-28T12:00:00Z', state: { stage: 3 } };
  assert.equal(nightSession([old, finished, fresh]).id, 'f');
  assert.equal(nightSession([finished]), null);
});

test('τα βάρη αθροίζουν 100', () => {
  assert.equal(computeReadiness(allGood).items.reduce((s, i) => s + i.weight, 0), 100);
});
