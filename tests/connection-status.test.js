import test from 'node:test';
import assert from 'node:assert/strict';
import { isRetryableError, setPendingWrites, getPendingWrites, subscribePendingWrites } from '../src/lib/connectionStatus.js';

test('σύνδεση: ξαναστέλνονται μόνο σφάλματα δικτύου/server, όχι απαγορεύσεις', () => {
  assert.equal(isRetryableError(new TypeError('Failed to fetch')), true);
  assert.equal(isRetryableError({ status: 502 }), true);
  assert.equal(isRetryableError({ status: 503 }), true);
  assert.equal(isRetryableError({ status: 429 }), true);
  assert.equal(isRetryableError({ status: 403 }), false);
  assert.equal(isRetryableError({ status: 400 }), false);
});

test('σύνδεση: ο μετρητής αλλαγών σε αναμονή ειδοποιεί την οθόνη', () => {
  const seen = [];
  const off = subscribePendingWrites((n) => seen.push(n));
  setPendingWrites(2);
  setPendingWrites(0);
  off();
  assert.deepEqual(seen, [2, 0]);
  assert.equal(getPendingWrites(), 0);
});
