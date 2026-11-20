import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

process.env.DATABASE_URL ||= 'postgres://test:test@127.0.0.1:5432/deal_of_temptation_test';
process.env.JWT_SECRET ||= 'test-only-secret-for-isolated-session-tests';
const { validatePlayerPatch, sanitizePublicSession } = await import('../server/entities.js');
const { NEW_MODES } = await import('../src/data/modes/modeRegistry.js');

const players = [
  { id: 'p0', name: 'Player 0', vipProfile: { boundaries: ['private'] } },
  { id: 'p1', name: 'Player 1', vipProfile: { boundaries: ['own-only'] } },
];

test('approved digital modes exclude retired Pajama Marathon and Pedi-Glam Extended', () => {
  assert.deepEqual(NEW_MODES.map((mode) => mode.id), ['lockdown', 'beach_bar']);
  assert.equal(NEW_MODES.some((mode) => mode.id === 'pedi_extended'), false);
  assert.equal(NEW_MODES.some((mode) => mode.id === 'marathon_4h'), false);
  assert.ok(NEW_MODES.every((mode) => mode.minutes === 300));
});

test('player session response never exposes another player VIP profile', () => {
  const record = { id: 'session', state: { players } };
  const fromP0 = sanitizePublicSession(record, 'p0');
  assert.deepEqual(fromP0.state.players[0].vipProfile, { boundaries: ['private'] });
  assert.equal('vipProfile' in fromP0.state.players[1], false);
  const forTv = sanitizePublicSession(record);
  assert.equal('vipProfile' in forTv.state.players[0], false);
  assert.equal('vipProfile' in forTv.state.players[1], false);
});

test('mobile STOP is accepted only as the validated minimal STOP patch', () => {
  const current = { players, mg: { stop: false, timer: { total: 300, endsAt: 5000, remaining: 300 }, log: [] } };
  const valid = { mg: { stop: true, stopAt: 1000, stopBy: 'p1', timer: { total: 300, endsAt: null, remaining: 299 } } };
  assert.equal(validatePlayerPatch(current, valid, 'p1'), true);
  assert.equal(validatePlayerPatch(current, { mg: { ...current.mg, stop: true, stopAt: 1000, stopBy: 'p1' } }, 'p1'), false);
  assert.equal(validatePlayerPatch(current, { mg: { stop: true, stopAt: 1000, stopBy: 'p0' } }, 'p1'), false);
});

test('mode mobile actions accept only the signed-in player and supported action payloads', () => {
  const current = { players, mg: { stop: false } };
  assert.equal(validatePlayerPatch(current, { mg: { playerAction: { playerId: 'p1', type: 'board_roll', at: 1000 } } }, 'p1'), true);
  assert.equal(validatePlayerPatch(current, { mg: { playerAction: { playerId: 'p0', type: 'board_roll', at: 1000 } } }, 'p1'), false);
  assert.equal(validatePlayerPatch(current, { mg: { playerAction: { playerId: 'p1', type: 'board_route', route: 'unknown', at: 1000 } } }, 'p1'), false);
  assert.equal(validatePlayerPatch(current, { mg: { playerAction: { playerId: 'p1', type: 'morning_code', code: '12A4', at: 1000 } } }, 'p1'), false);
  assert.equal(validatePlayerPatch(current, { mg: { playerAction: { playerId: 'p1', type: 'beach_finale_response', value: 'done', at: 1000 } } }, 'p1'), true);
});

test('Absolute Interrogation accepts only the current player own boolean vote', () => {
  const current = {
    players,
    absoluteInterrogation: { active: true, step: 0, targetId: 'p0', questions: ['Q1'], votes: { 0: {} } },
  };
  assert.equal(validatePlayerPatch(current, {
    absoluteInterrogation: { ...current.absoluteInterrogation, votes: { 0: { p1: true } } },
  }, 'p1'), true);
  assert.equal(validatePlayerPatch(current, {
    absoluteInterrogation: { ...current.absoluteInterrogation, votes: { 0: { p0: false, p1: true } } },
  }, 'p1'), false);
  assert.equal(validatePlayerPatch(current, {
    absoluteInterrogation: { ...current.absoluteInterrogation, targetId: 'p1', votes: { 0: { p1: true } } },
  }, 'p1'), false);
});

test('Bailout Auction accepts only the current player own positive bid', () => {
  const current = {
    players,
    bailoutAuction: { active: true, targetId: 'p0', bids: {} },
  };
  assert.equal(validatePlayerPatch(current, {
    bailoutAuction: { ...current.bailoutAuction, bids: { p1: 25 } },
  }, 'p1'), true);
  assert.equal(validatePlayerPatch(current, {
    bailoutAuction: { ...current.bailoutAuction, bids: { p0: 50, p1: 25 } },
  }, 'p1'), false);
  assert.equal(validatePlayerPatch(current, {
    bailoutAuction: { ...current.bailoutAuction, bids: { p1: -1 } },
  }, 'p1'), false);
});


test('existing redacted vote maps remain writable without exposing other votes', () => {
  const current = {
    players,
    juryTrial: { votes: { p0: 'guilty', p1: 'innocent' }, question: 'Q' },
  };
  const response = sanitizePublicSession({ state: current }, 'p0');
  assert.deepEqual(response.state.juryTrial.votes, { p0: 'guilty', __redacted_0: 'innocent' });
  assert.equal(validatePlayerPatch(current, {
    juryTrial: { ...response.state.juryTrial, votes: { ...response.state.juryTrial.votes, p0: 'innocent' } },
  }, 'p0'), true);
});

test('private auction bids and interrogation votes are redacted for other players', () => {
  const record = { state: {
    players,
    bailoutAuction: { active: true, targetId: 'p0', bids: { p0: 10, p1: 25 } },
    absoluteInterrogation: { active: true, step: 0, targetId: 'p0', votes: { 0: { p0: true, p1: false } } },
  } };
  const response = sanitizePublicSession(record, 'p0');
  assert.deepEqual(response.state.bailoutAuction.bids, { p0: 10 });
  assert.deepEqual(response.state.absoluteInterrogation.votes[0], { p0: true });
});

test('database startup migration does not delete session history records', async () => {
  const db = await readFile(new URL('../server/db.js', import.meta.url), 'utf8');
  assert.doesNotMatch(db, /DELETE\s+FROM\s+records/i);
});

test('VIP invitation submission requires server-side 18+ confirmation and no difficulty field', async () => {
  const source = await readFile(new URL('../server/entities.js', import.meta.url), 'utf8');
  assert.match(source, /body\.adultConfirmed !== true/);
  assert.doesNotMatch(source, /'difficulty',\s*'unexpectedChallenge'/);
});

test('consent: η παίκτρια γράφει μόνο τη δική της καταχώρηση, μόνο πριν ξεκινήσει το παιχνίδι', () => {
  const current = { players, mg: { consentRequired: true, consent: { players: {} } } };
  const entry = { optOuts: ['touch'], confirmed: true, at: 1000 };
  assert.equal(validatePlayerPatch(current, { mg: { consent: { players: { p1: entry } } } }, 'p1'), true);
  assert.equal(validatePlayerPatch(current, { mg: { consent: { players: { p0: entry } } } }, 'p1'), false);     // όχι για άλλη
  assert.equal(validatePlayerPatch(current, { mg: { consent: { players: { p1: { ...entry, optOuts: ['x'] } } } } }, 'p1'), false);
  assert.equal(validatePlayerPatch(current, { mg: { consent: { done: true, players: { p1: entry } } } }, 'p1'), false); // όχι done
  assert.equal(validatePlayerPatch(current, { mg: { consent: { players: { p1: entry } }, stop: false } }, 'p1'), false); // μόνο consent
  const started = { players, mg: { consentRequired: true, consent: { done: true, players: {} } } };
  assert.equal(validatePlayerPatch(started, { mg: { consent: { players: { p1: entry } } } }, 'p1'), false);      // μετά την έναρξη
});

test('consent: τα όρια κάθε παίκτριας δεν φαίνονται στις υπόλοιπες ούτε στην TV', () => {
  const record = { id: 's', state: { players, mg: { consent: { players: {
    p0: { optOuts: ['touch'], confirmed: true, at: 1 }, p1: { optOuts: ['alcohol'], confirmed: true, at: 2 },
  } } } } };
  const forP1 = sanitizePublicSession(record, 'p1').state.mg.consent.players;
  assert.deepEqual(forP1.p1.optOuts, ['alcohol']);        // τα δικά της τα βλέπει
  assert.deepEqual(forP1.p0.optOuts, []);                  // της άλλης όχι
  assert.equal(forP1.p0.confirmed, true);                  // μόνο ότι επιβεβαίωσε
  const forTv = sanitizePublicSession(record).state.mg.consent.players;
  assert.deepEqual(forTv.p0.optOuts, []);
  assert.deepEqual(forTv.p1.optOuts, []);
});
