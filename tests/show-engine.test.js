import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../src/lib/boardEngine.js';
import { computeAwards, playerTitle, highlights, weatherReport, checkRecords } from '../src/lib/showEngine.js';

const def = { board: ['start', 'loot', 'warrant', 'police'], squares: { start: { effect: {} }, loot: { effect: { loot: 1000 } }, warrant: { effect: {} }, police: { effect: { interrogate: true } } }, cards: [{ id: 'c1', title: 'x', text: 'y' }], questions: ['a', 'b', 'c', 'd'], verdicts: {} };
const players = [{ id: 'a', name: 'Άννα' }, { id: 'b', name: 'Βίκυ' }];

test('η μηχανή μετράει στατιστικά: ζαριές, λεία, συλλήψεις, ψέματα', () => {
  let lg = E.createBoard(players, def);
  lg = E.applyRoll(lg, players, def, { d: 1 }).lounge; // Άννα → λεία
  assert.equal(lg.tally.a.rolls, 1);
  assert.equal(lg.tally.a.ones, 1);
  assert.equal(lg.tally.a.lootIn, 1000);
  lg = E.startInterrogation(lg, def, 'b');
  assert.equal(lg.tally.b.arrests, 1);
  assert.equal(lg.firstArrest.pid, 'b');
  lg = E.answerInterrogation(lg, def, 'lie').lounge;
  assert.equal(lg.tally.b.lies, 1);
});

test('Χρυσό Λεπτό: η λεία από τετράγωνο μετράει διπλή', () => {
  let lg = { ...E.createBoard(players, def), golden: { until: Date.now() + 60000 } };
  lg = E.applyRoll(lg, players, def, { d: 1 }).lounge;
  assert.equal(lg.stats.a.loot, 2000);
  assert.equal(lg.tally.a.goldenLoot, 1000);
});

test('βραβεία, τίτλοι, highlights, δελτίο και ρεκόρ', () => {
  let lg = E.createBoard(players, def);
  lg = E.updateStat(lg, def, 'a', { loot: 9000 });
  lg = E.startInterrogation(lg, def, 'b');
  const awards = computeAwards(lg, players);
  assert.equal(awards.find((x) => x.id === 'loot').name, 'Άννα');
  assert.equal(awards.find((x) => x.id === 'wanted').name, 'Βίκυ');
  assert.equal(awards.find((x) => x.id === 'clean').name, 'Άννα');
  assert.equal(playerTitle(awards, 'b'), 'Η πιο Καταζητούμενη');
  assert.ok(highlights(lg, players).length >= 2);
  assert.ok(weatherReport(lg, players).lines.length >= 1);
  const first = checkRecords({}, lg, players);
  assert.ok(first.broken.some((r) => r.id === 'maxLoot'));
  const again = checkRecords(first.records, lg, players);
  assert.equal(again.broken.length, 0);
});

test('ο server αντικαθιστά (όχι ενώνει) τις λίστες news/εξομολογητηρίου, ώστε η διαγραφή να δουλεύει', async () => {
  const src = (await import('node:fs')).readFileSync(new URL('../src/components/modes/ShowControls.jsx', import.meta.url), 'utf8');
  assert.match(src, /news: \[\{ key: uid\(\)/);
  assert.match(src, /anonBox: \[\{ key: uid\(\)/);
});

test('βραβεία: σωστός ενικός και η «Αθώα» πάει σε όποια δεν έχει άλλο βραβείο', () => {
  const players3 = [{ id: 'a', name: 'Άννα' }, { id: 'b', name: 'Βίκυ' }, { id: 'c', name: 'Γωγώ' }];
  let lg = E.createBoard(players3, def);
  lg = E.updateStat(lg, def, 'a', { loot: 9000 });
  lg = E.startInterrogation(lg, def, 'c');
  const awards = computeAwards(lg, players3);
  assert.equal(awards.find((x) => x.id === 'wanted').line, '1 σύλληψη μέσα σε μία βραδιά');
  assert.equal(awards.find((x) => x.id === 'clean').name, 'Βίκυ');
});
