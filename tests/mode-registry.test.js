import test from 'node:test';
import assert from 'node:assert/strict';
import { NEW_MODES, modeMeta } from '../src/data/modes/modeRegistry.js';
import { LOCKDOWN_SECONDS, MARATHON_LOCKDOWN_SECONDS } from '../src/data/modes/lockdownContent.js';

test('all approved digital modes are registered with their exact durations', () => {
  const expected = {
    deal_movie: 2880,
    lockdown: 60,
    marathon_4h: 105,
    villa_takeover: 2880,
  };
  const actual = Object.fromEntries(NEW_MODES.map((mode) => [mode.id, mode.minutes]));
  assert.deepEqual(actual, expected);
});

test('every registered mode has a complete timed act sequence', () => {
  for (const mode of NEW_MODES) {
    assert.ok(mode.acts.length > 0, `${mode.id} has no acts`);
    const actDuration = mode.acts.reduce((total, act) => total + Number(mode.actDurations?.[act] || 0), 0);
    assert.equal(actDuration, mode.minutes, `${mode.id} act durations do not match its total duration`);
  }
});

test('Pajama Heist & Arrest replaces Marathon 4H with the 105-minute Lounge Lockdown', () => {
  const mode = modeMeta('marathon_4h');
  assert.equal(mode.name, 'PAJAMA HEIST & ARREST');
  assert.deepEqual(mode.acts, ['lounge']);
  assert.equal(mode.minutes, 105);
});

test('standalone and Marathon Lockdown timers are both 60 minutes', () => {
  assert.equal(LOCKDOWN_SECONDS, 60 * 60);
  assert.equal(MARATHON_LOCKDOWN_SECONDS, 60 * 60);
});

test('Lounge Lockdown: 21 τετράγωνα, 36 κάρτες, 4 φάσεις 105′, 4 επίπεδα δεσιμάτων', async () => {
  const lg = await import('../src/data/modes/loungeContent.js');
  assert.equal(lg.LOUNGE_BOARD.length, 21);
  assert.equal(lg.LOUNGE_CARDS.length, 36);
  assert.equal(new Set(lg.LOUNGE_CARDS.map((card) => card.id)).size, 36);
  assert.equal(lg.LOUNGE_PHASES.reduce((sum, phase) => sum + phase.minutes, 0), 105);
  assert.equal(lg.restraintFor(5).name, 'Classic Hogtie & Sensory Lock');
  for (const type of lg.LOUNGE_BOARD) assert.ok(lg.SQUARE_TYPES[type], type);
});

test('μόνο Classic & Arrest Heist ως μηχανές, 3 ψηφιακά modes, τα παλιά αποσυρμένα', async () => {
  const { modeMeta: meta } = await import('../src/data/modes/modeRegistry.js');
  assert.equal(meta('pedi_glam')?.retired, true, 'παλιές συνεδρίες ανοίγουν ακόμα');
});

test('οδηγός: κάθε ενεργό mode έχει οδηγό, και κάθε φάση του ψηφιακού παιχνιδιού αντιστοιχεί σε ενότητα φωτογραφίας', async () => {
  const { MODE_GUIDE, phaseIdFor, currentPhase } = await import('../src/data/modes/modeGuide.js');
  const { ENGINE_MODES, NEW_MODES: active, MODE_MEDIA_SECTIONS } = await import('../src/data/modes/modeRegistry.js');
  for (const mode of [...ENGINE_MODES, ...active]) assert.ok(MODE_GUIDE[mode.id], `λείπει οδηγός για ${mode.id}`);
  for (const id of ['classic', 'arrest_heist', 'lockdown', 'marathon_4h', 'villa_takeover']) {
    const sectionIds = (MODE_MEDIA_SECTIONS[id] || []).map((s) => s.id);
    for (const phase of MODE_GUIDE[id].phases) assert.ok(sectionIds.includes(phase.id), `${id}: η φάση ${phase.id} δεν έχει ενότητα φωτογραφίας`);
  }
  assert.equal(phaseIdFor({ mode: 'lockdown', mg: { ld: { stage: 'exit' } } }), 'level4');
  assert.equal(currentPhase({ mode: 'marathon_4h', mg: { lounge: { phase: 3 } } }).index, 3);
  // Μηχανές: η φάση ακολουθεί το πραγματικό στάδιο.
  assert.deepEqual([0, 1, 2, 3].map((stage) => phaseIdFor({ mode: 'classic', stage })), ['setup', 'board', 'police', 'finale']);
  assert.deepEqual([0, 1, 2, 3].map((stage) => phaseIdFor({ mode: 'arrest_heist', stage })), ['teams', 'rounds', 'escape', 'victory']);
});

test('νέες ψηφιακές παρτίδες ξεκινούν με εισαγωγή κανόνων· οι παλιές δεν μπλοκάρονται', async () => {
  const src = (await import('node:fs')).readFileSync(new URL('../src/lib/modeKit.js', import.meta.url), 'utf8');
  assert.match(src, /\['lockdown', 'marathon_4h', 'villa_takeover', 'deal_movie'\]\.includes\(modeId\)\) base\.briefingRequired = true/);
  const { pointsOf, rankPlayers, championOf } = await import('../src/lib/modeRanking.js');
  const players = [{ id: 'a', name: 'Α' }, { id: 'b', name: 'Β' }];
  const mg = { scores: { a: 3, b: 5 }, tokens: { a: 4 }, lounge: { stats: { b: { loot: 2000 } } } };
  assert.equal(pointsOf(mg, 'a'), 7);
  assert.equal(pointsOf(mg, 'b'), 7);
  assert.equal(rankPlayers(players, { scores: { a: 1, b: 2 } })[0].id, 'b');
  assert.equal(championOf(players, { loungeQueen: 'a' }).player.id, 'a');
});

test('τελετή: η νικήτρια του τίτλου είναι πάντα πρώτη στο βάθρο, ακόμα κι αν έχει λιγότερους πόντους', async () => {
  const { finalStandings } = await import('../src/lib/modeRanking.js');
  const players = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const order = finalStandings(players, { scores: { a: 4, b: 5, c: 0 }, loungeQueen: 'c' }).map((p) => p.id);
  assert.deepEqual(order, ['c', 'b', 'a']);
});
