import test from 'node:test';
import assert from 'node:assert/strict';
import { timerStart, timerLeft, timerAdd, timerPause, timerResume } from '../src/lib/modeTimer.js';
import { applyDelta, undoLast } from '../src/lib/modeUndo.js';

test('timer: εκκίνηση, υπολειπόμενος χρόνος, προσθήκη', () => {
  const t = timerStart(60, 1000);
  assert.equal(timerLeft(t, 1000), 60);
  assert.equal(timerLeft(t, 31000), 30);
  assert.equal(timerLeft(t, 99000), 0);
  const more = timerAdd(t, 30);
  assert.equal(timerLeft(more, 1000), 90);
  assert.equal(more.total, 90);
});

test('timer: pause παγώνει, resume συνεχίζει από εκεί που έμεινε', () => {
  const paused = timerPause(timerStart(100, 0), 40000);
  assert.equal(paused.endsAt, null);
  assert.equal(paused.remaining, 60);
  assert.equal(timerLeft(paused, 999999), 60);           // δεν τρέχει όσο είναι σε pause
  const resumed = timerResume(paused, 500000);
  assert.equal(timerLeft(resumed, 500000), 60);
  assert.equal(timerLeft(resumed, 530000), 30);
  assert.equal(timerAdd(paused, 15).remaining, 75);       // προσθήκη σε pause
  assert.equal(timerPause(null), null);
});

test('undo: αναιρεί την τελευταία αλλαγή tokens / score', () => {
  let mg = { tokens: {}, scores: {}, undo: [] };
  mg = { ...mg, ...applyDelta(mg, 'tokens', 'a', 3) };
  mg = { ...mg, ...applyDelta(mg, 'scores', 'a', 10) };
  mg = { ...mg, ...applyDelta(mg, 'tokens', 'b', 2) };
  assert.equal(mg.undo.length, 3);
  let r = undoLast(mg); mg = { ...mg, ...r.patch };
  assert.deepEqual(mg.tokens, { a: 3, b: 0 });
  r = undoLast(mg); mg = { ...mg, ...r.patch };
  assert.equal(mg.scores.a, 0);
  r = undoLast(mg); mg = { ...mg, ...r.patch };
  assert.equal(mg.tokens.a, 0);
  assert.equal(undoLast(mg), null);                      // τίποτα άλλο να αναιρεθεί
});

test('undo: τα tokens δεν πάνε κάτω από 0 και η αναίρεση είναι ακριβής', () => {
  let mg = { tokens: { a: 1 }, scores: {}, undo: [] };
  mg = { ...mg, ...applyDelta(mg, 'tokens', 'a', -5) };   // πέφτει μόνο κατά 1 (στο 0)
  assert.equal(mg.tokens.a, 0);
  assert.equal(mg.undo[0].n, -1);
  const { patch } = undoLast(mg);
  assert.equal(patch.tokens.a, 1);                        // επανέρχεται στο 1, όχι στο 5
  const noop = applyDelta({ tokens: { a: 0 }, undo: [] }, 'tokens', 'a', -3);
  assert.equal(noop.undo.length, 0);                      // καμία αλλαγή -> δεν γράφεται στο undo
});

test('undo: κρατά το πολύ 10 καταχωρήσεις και δεν χρησιμοποιεί κλειδί id', () => {
  let mg = { tokens: {}, undo: [] };
  for (let i = 0; i < 15; i += 1) mg = { ...mg, ...applyDelta(mg, 'tokens', 'a', 1) };
  assert.equal(mg.undo.length, 10);
  assert.ok(mg.undo.every((e) => !('id' in e) && e.pid === 'a'));
});
