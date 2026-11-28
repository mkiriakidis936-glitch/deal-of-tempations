import test from 'node:test';
import assert from 'node:assert/strict';
import { movieGuideStep } from '../src/lib/movieGuide.js';

const players = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
const g = (mg, extra = {}) => movieGuideStep({ mg, players, nameOf: (id) => id.toUpperCase(), ...extra });

test('οδηγός: από την αρχή μέχρι την πράξη', () => {
  assert.equal(movieGuideStep({ mg: {}, players: [{ id: 'a' }] }).id, 'players');
  assert.equal(g({ consentRequired: true, consent: { players: { a: { confirmed: true } } } }).id, 'consent');
  assert.match(g({ consentRequired: true, consent: { players: { a: { confirmed: true } } } }).text, /1\/3/);
  assert.equal(g({}).id, 'start');
  assert.equal(g({ cg: { status: 'transition', act: 0 } }).id, 'act');
  assert.equal(g({ cg: { status: 'transition', act: 0 } }).tab, 1);
});

test('οδηγός: ταμπλό & ζάρι', () => {
  const board = { on: true, order: ['a', 'b', 'c'], turn: 1, pos: {}, pending: null, allDone: false };
  const roll = g({ cg: { status: 'active', act: 0, boardMode: true, board } });
  assert.equal(roll.id, 'roll'); assert.match(roll.title, /B/); assert.equal(roll.tab, 8);
  assert.equal(g({ cg: { status: 'active', act: 0, board: { ...board, pending: { pid: 'c', index: 4 } } } }).id, 'square');
  assert.equal(g({ cg: { status: 'active', act: 0, board: { ...board, allDone: true } } }).id, 'board-done');
});

test('οδηγός: ό,τι τρέχει στην TV έχει προτεραιότητα', () => {
  const board = { on: true, order: ['a'], turn: 0, pending: null };
  assert.equal(g({ cg: { status: 'active', board, trial: { pid: 'a', done: false } } }).id, 'trial');
  assert.equal(g({ cg: { status: 'active', board, wheel: { pid: 'a', done: false } } }).id, 'wheel');
  assert.equal(g({ cg: { status: 'active', board, game: 'dond', dond: { status: 'final' } } }).text.includes('ΑΝΟΙΓΜΑ'), true);
});

test('οδηγός: κλείσιμο πράξης, μετάβαση, υποχρεωτικό, φινάλε, ΣΤΟΠ', () => {
  assert.equal(g({ cg: { status: 'transition', act: 0, conquered: { 0: { winner: 'a' } }, lastClosed: 1 } }).id, 'next');
  assert.equal(g({ cg: { status: 'transition', act: 1, conquered: { 0: { winner: 'a' } }, lastClosed: 1 } }).id, 'act');
  assert.equal(g({ cg: { status: 'transition', act: 0, mandatory: { pending: true, pid: null } } }).id, 'mandatory-draw');
  assert.equal(g({ cg: { status: 'transition', act: 0, mandatory: { pending: true, pid: 'b' } } }).id, 'mandatory-wheel');
  assert.equal(g({ cg: { status: 'finale' } }).id, 'finale');
  assert.equal(g({ cg: { status: 'active' } }, { stopped: true }).id, 'stop');
});
