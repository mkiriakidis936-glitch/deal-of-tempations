import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCustomMode, rulesFromCustom, customMinutes, isCustomMode, newCustomMode } from '../src/lib/customModeRules.js';
import { createBoard, applyRoll, resolveCard, answerInterrogation, payBribe, statOf } from '../src/lib/boardEngine.js';

test('κατασκευαστής: νέο mode έχει έγκυρο id, ταμπλό από την Αφετηρία και κάρτες', () => {
  const mode = newCustomMode();
  assert.ok(isCustomMode(mode.id));
  assert.equal(mode.board[0], 'start');
  assert.ok(mode.cards.length >= 1);
  assert.ok(mode.questions.length >= 3);
});

test('κατασκευαστής: άκυρα δεδομένα από το Admin διορθώνονται αντί να σπάσουν το παιχνίδι', () => {
  const mode = normalizeCustomMode({
    id: 'hack', name: '', board: ['loot', 'nope', 'police'], cards: [{ title: '' , text: '' }], questions: ['μόνο μία'],
    phases: [{ name: 'Α', minutes: -5 }], startLoot: 'abc', min: 99, max: 1,
  });
  assert.ok(isCustomMode(mode.id));
  assert.equal(mode.board[0], 'start');
  assert.ok(mode.board.length >= 8);
  assert.ok(!mode.board.includes('nope'));
  assert.ok(mode.cards.length >= 1 && mode.cards.every((c) => c.title || c.text));
  assert.ok(mode.questions.length >= 3);
  assert.equal(mode.phases[0].minutes, 1);
  assert.equal(mode.startLoot, 5000);
  assert.equal(mode.min, 12);
});

test('κατασκευαστής: η διάρκεια είναι το άθροισμα των φάσεων', () => {
  const mode = normalizeCustomMode({ phases: [{ name: 'Α', minutes: 20 }, { name: 'Β', minutes: 40 }] });
  assert.equal(customMinutes(mode), 60);
});

test('κατασκευαστής: ολόκληρη παρτίδα με δικό σου mode τρέχει στην κοινή μηχανή', () => {
  const rules = rulesFromCustom({
    name: 'Δοκιμαστικό', board: ['start', 'warrant', 'police', 'loot', 'market', 'tickle', 'safehouse', 'glitch', 'warrant', 'loot'],
    cards: [{ title: 'Κάρτα Α', text: 'Κάνε κάτι' }], questions: ['Ε1', 'Ε2', 'Ε3'], startLoot: 100, cardReward: 50,
  });
  assert.equal(rules.title, 'Δοκιμαστικό');
  const players = [{ id: 'a', name: 'Α' }, { id: 'b', name: 'Β' }];
  let seed = 3;
  const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  let lg = createBoard(players, rules, { rng });
  assert.equal(statOf(lg, rules, 'a').loot, 100);
  for (let i = 0; i < 150; i += 1) {
    if (lg.card) lg = lg.card.market ? payBribe(lg, rules) : resolveCard(lg, rules, rng() > 0.5);
    else if (lg.interro) lg = answerInterrogation(lg, rules, rng() > 0.5 ? 'truth' : 'lie').lounge;
    else if (lg.tickle) lg = { ...lg, tickle: null };
    else lg = applyRoll(lg, players, rules, { rng }).lounge;
    for (const p of players) assert.ok(lg.pos[p.id] < rules.board.length);
  }
  assert.ok(lg.usedCards.every((id) => id.startsWith('custom_') || id.length > 0));
});
