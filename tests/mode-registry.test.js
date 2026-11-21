import test from 'node:test';
import assert from 'node:assert/strict';
import { NEW_MODES, modeMeta } from '../src/data/modes/modeRegistry.js';
import { LOCKDOWN_SECONDS, MARATHON_LOCKDOWN_SECONDS } from '../src/data/modes/lockdownContent.js';

test('all approved digital modes are registered with their exact durations', () => {
  const expected = {
    pedi_glam: 90,
    pedi_extended: 150,
    lockdown: 60,
    beach_bar: 150,
    marathon_4h: 105,
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
