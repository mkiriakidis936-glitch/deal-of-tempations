import test from 'node:test';
import assert from 'node:assert/strict';
import { soundIntensity, soundscapeKey, SOUNDSCAPES } from '../src/lib/soundscape.js';

test('μουσική: μία ανά ήπειρο + φινάλε', () => {
  for (const id of ['classic', 'arrest_heist', 'lockdown', 'marathon_4h', 'villa_takeover', 'finale']) assert.ok(SOUNDSCAPES[id]);
  assert.equal(soundscapeKey(null, 'classic'), null);
  assert.equal(soundscapeKey({ status: 'finale' }, 'lockdown'), 'finale');
  assert.equal(soundscapeKey({ status: 'active' }, 'xyz'), 'classic');
});

test('μουσική: ένταση στον Τροχό, ηρεμία μετά', () => {
  const now = 100000;
  assert.equal(soundIntensity({ wheel: { at: now - 1000, done: false } }, now), 1);
  assert.ok(soundIntensity({ wheel: { at: now - 9000, done: false } }, now) < 0.5);
  assert.ok(soundIntensity({ board: { roll: { at: now - 500 } } }, now) > 0.5);
  assert.ok(soundIntensity({}, now) < 0.3);
});
