import test from 'node:test';
import assert from 'node:assert/strict';
import { playerBadges } from '../src/lib/playerBadges.js';

const players = [{ id: 'a', name: 'Γιούνα' }, { id: 'b', name: 'Αμάρα' }, { id: 'c', name: 'Θάλεια' }];
test('παράσημα: από στατιστικά, ημερολόγιο και κατακτήσεις', () => {
  const cg = {
    players: { a: { points: 50, loot: 5, tokens: 1, wanted: 0 }, b: { points: 40, loot: 2, tokens: 4, wanted: 3 }, c: { points: 10, loot: 0, tokens: 0, wanted: 0 } },
    log: [{ t: 1, text: '🎲 Αμάρα έφερε 6 → Λεία' }, { t: 2, text: '✋ Θάλεια: NO DEAL' }, { t: 3, text: '✅ Γιούνα: επιτυχία' }, { t: 4, text: '🎲 Γιούνα έφερε 5' }],
    conquered: { 0: { winner: 'a' }, 1: { winner: 'a' } },
  };
  const b = playerBadges(cg, players);
  const ids = (pid) => b[pid].map((x) => x.id).sort();
  assert.deepEqual(ids('a'), ['brave', 'conqueror', 'loot', 'queen']);
  assert.deepEqual(ids('b'), ['lucky', 'tokens', 'wanted']);
  assert.deepEqual(ids('c'), ['risk']);
});
test('παράσημα: κανένα όταν όλα είναι μηδέν', () => {
  const b = playerBadges({ players: {} }, players);
  assert.ok(Object.values(b).every((l) => l.length === 0));
});
