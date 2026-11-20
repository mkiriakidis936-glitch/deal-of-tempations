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
    marathon_4h: 240,
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

test('Pajama Marathon is four hours with the 60-minute Lockdown act', () => {
  const marathon = modeMeta('marathon_4h');
  assert.deepEqual(marathon.acts, ['board', 'midnight', 'lockdown', 'morning']);
  assert.equal(marathon.actDurations.lockdown, 60);
  assert.equal(marathon.minutes, 240);
});

test('standalone and Marathon Lockdown timers are both 60 minutes', () => {
  assert.equal(LOCKDOWN_SECONDS, 60 * 60);
  assert.equal(MARATHON_LOCKDOWN_SECONDS, 60 * 60);
});
