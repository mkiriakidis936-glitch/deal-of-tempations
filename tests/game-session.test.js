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

test('the active digital modes keep their specified durations', () => {
  assert.deepEqual(NEW_MODES.map((mode) => mode.id), ['deal_movie', 'lockdown', 'marathon_4h', 'villa_takeover']);
  assert.deepEqual(NEW_MODES.map((mode) => mode.minutes), [2880, 60, 105, 2880]);
});

test('player session response never exposes VIP profiles, and hidden roles only to their owner', () => {
  const record = { id: 'session', state: { players: players.map((p, i) => ({ ...p, role: i ? 'cop' : 'hacker' })) } };
  const fromP0 = sanitizePublicSession(record, 'p0');
  // Το κινητό δεν χρειάζεται ποτέ το VIP προφίλ — ούτε της ίδιας (δεν εκτίθεται αν κάποια διαλέξει λάθος όνομα).
  assert.equal('vipProfile' in fromP0.state.players[0], false);
  assert.equal('vipProfile' in fromP0.state.players[1], false);
  assert.equal(fromP0.state.players[0].role, 'hacker');
  assert.equal('role' in fromP0.state.players[1], false);
  assert.equal('role' in sanitizePublicSession(record).state.players[0], false);
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
  assert.equal(validatePlayerPatch(current, { mg: { playerAction: { playerId: 'p1', type: 'beach_finale_response', value: 'done', at: 1000 } } }, 'p1'), false); // Beach Bar αφαιρέθηκε (7.5.0)
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

test('εκπομπή: γραμματοκιβώτιο παίκτριας — μόνο έγκυρα, μόνο δικά της', async () => {
  const { validatePlayerPatch } = await import('../server/entities.js');
  const current = { players: [{ id: 'p1' }, { id: 'p2' }], loungeInbox: {} };
  const at = Date.now();
  assert.equal(validatePlayerPatch(current, { loungeInbox: { p1: [{ type: 'news', text: 'Η Μαρία έκρυψε σαγιονάρα!', at }] } }, 'p1'), true);
  assert.equal(validatePlayerPatch(current, { loungeInbox: { p1: [{ type: 'news', text: 'x'.repeat(91), at }] } }, 'p1'), false);
  assert.equal(validatePlayerPatch(current, { loungeInbox: { p1: [{ type: 'betray', target: 'p2', at }] } }, 'p1'), true);
  assert.equal(validatePlayerPatch(current, { loungeInbox: { p1: [{ type: 'betray', target: 'p1', at }] } }, 'p1'), false);
  assert.equal(validatePlayerPatch(current, { loungeInbox: { p2: [{ type: 'news', text: 'ξένο', at }] } }, 'p1'), false);
  assert.equal(validatePlayerPatch(current, { loungeInbox: { p1: [{ type: 'dossier', answers: ['α', 'β', 'γ'], at }] } }, 'p1'), true);
  assert.equal(validatePlayerPatch(current, { loungeInbox: { p1: [{ type: 'hack', at }] } }, 'p1'), false);
  assert.equal(validatePlayerPatch(current, { loungeInbox: { p1: [{ type: 'news', text: 'ok', at, extra: 1 }] } }, 'p1'), false);
  assert.equal(validatePlayerPatch(current, { loungeInbox: { p1: Array.from({ length: 11 }, (_, i) => ({ type: 'confess', text: 'x', at: at + i })) } }, 'p1'), false);
  assert.equal(validatePlayerPatch(current, { loungeInbox: { p1: [{ type: 'bet', target: 'p2', at }, { type: 'confess', text: 'και αυτό', at: at + 1 }] } }, 'p1'), true);
});

test('εκπομπή: τα μυστικά κρύβονται από TV και άλλες παίκτριες', async () => {
  const { sanitizePublicSession } = await import('../server/entities.js');
  const record = { state: {
    loungeVotes: { p1: 'i1:0:truth', p2: 'i1:0:lie', p3: 'i1:0:lie' },
    loungeInbox: { p1: [{ type: 'confess', text: 'μυστικό', at: 1 }] },
    mg: { lounge: {
      anonBox: [{ text: 'μυστικό' }], dossier: { p1: ['a', 'b', 'c'], p2: ['d', 'e', 'f'] },
      dossierQ: { id: 'q1', text: 'a', owner: 'p1' }, bets: { p1: 'p2', p2: 'p1' }, betrayCard: 'p2',
      betrayals: [{ from: 'p2', to: 'p1', amount: 500 }],
    } },
  } };
  const tv = sanitizePublicSession(record).state;
  assert.deepEqual(tv.loungeTally['i1:0'], { truth: 1, lie: 2 });
  assert.equal(tv.mg.lounge.anonBox, undefined);
  assert.equal(tv.mg.lounge.dossier, undefined);
  assert.equal(tv.mg.lounge.dossierQ.owner, undefined);
  assert.equal(tv.mg.lounge.betrayCard, undefined);
  assert.deepEqual(tv.mg.lounge.betrayals, [{}]);
  assert.deepEqual(tv.loungeInbox, {});
  const p2 = sanitizePublicSession(record, 'p2').state;
  assert.equal(p2.mg.lounge.betrayCard, 'p2');
  assert.deepEqual(p2.mg.lounge.bets, { p2: 'p1' });
  assert.deepEqual(p2.mg.lounge.dossier, { p2: ['d', 'e', 'f'] });
  const revealed = sanitizePublicSession({ state: { mg: { lounge: { betrayRevealed: true, betrayals: [{ from: 'p2', to: 'p1', amount: 500 }], dossierQ: { id: 'q', owner: 'p1', revealed: true } } } } }).state;
  assert.equal(revealed.mg.lounge.betrayals[0].from, 'p2');
  assert.equal(revealed.mg.lounge.dossierQ.owner, 'p1');
});

test('εξομολογητήριο: ανώνυμες εξομολογήσεις δεν χάνονται στη συγχώνευση του server', async () => {
  const { validatePlayerPatch } = await import('../server/entities.js');
  const src = await readFile(new URL('../src/components/modes/ShowControls.jsx', import.meta.url), 'utf8');
  assert.match(src, /anonBox/);
  assert.doesNotMatch(src, /\bconfessions\b/);
  assert.equal(typeof validatePlayerPatch, 'function');
});

test('ασφάλεια: μια δημόσια φόρμα δεν μπορεί να «αυτο-εγκριθεί» ούτε να δηλώσει admin', async () => {
  const { stripAdminOnlyFields } = await import('../server/entities.js');
  const clean = stripAdminOnlyFields({ name: 'Άννα', preferredModes: ['lockdown'], approved: true, approvalStatus: 'approved', approvedAt: 'x', approvedDate: 'x', approvedBy: 'x', role: 'admin', adminNotes: 'x' });
  assert.deepEqual(clean, { name: 'Άννα', preferredModes: ['lockdown'] });
  const src = await readFile(new URL('../server/entities.js', import.meta.url), 'utf8');
  assert.match(src, /if \(!isAdmin\(req\)\) req\.body = stripAdminOnlyFields\(req\.body \|\| \{\}\);/, 'η γενική δημιουργία καθαρίζει τα πεδία έγκρισης');
  assert.match(src, /r\.post\('\/:entity\/bulk', requireAdmin/, 'η μαζική δημιουργία είναι μόνο για admin');
});

test('ασφάλεια: οι ρυθμίσεις του Admin δεν διαβάζονται δημόσια, οι δημόσιες ναι', async () => {
  const { isAdminOnlySetting } = await import('../server/entities.js');
  for (const key of ['show_casting_plan', 'digital_invitations', 'admin_site_versions', 'av_control_room_v1', 'admin_custom_scenarios', 'all_time_records', 'admin_setting_versions_modes_content']) {
    assert.equal(isAdminOnlySetting('AppSetting', { key }), true, `${key} πρέπει να είναι μόνο για admin`);
  }
  for (const key of ['media_overrides', 'site_content', 'modes_content', 'custom_board_modes', 'admin_global_design', 'event_date', 'admin_form_questions']) {
    assert.equal(isAdminOnlySetting('AppSetting', { key }), false, `${key} χρειάζεται δημόσια (TV, κινητά, Site)`);
  }
  assert.equal(isAdminOnlySetting('GameSession', { key: 'show_casting_plan' }), false);
});

test('double down from the phone works with the redacted player list but cannot touch private fields', () => {
  const current = { players: players.map((p, i) => ({ ...p, role: i ? 'cop' : 'hacker', penaltyStep: 1 })), history: [] };
  const view = sanitizePublicSession({ state: current }, 'p1').state;
  const entry = { type: 'double_down', player: 'Player 1', result: 'ποινή', timestamp: 1 };
  const patch = { players: view.players.map((p) => (p.id === 'p1' ? { ...p, penaltyStep: 2 } : p)), history: [entry] };
  assert.equal(validatePlayerPatch(current, patch, 'p1'), true);
  const roleSwap = { ...patch, players: patch.players.map((p) => (p.id === 'p1' ? { ...p, role: 'driver' } : p)) };
  assert.equal(validatePlayerPatch(current, roleSwap, 'p1'), false);
  const otherRole = { ...patch, players: patch.players.map((p) => (p.id === 'p0' ? { ...p, role: 'driver' } : p)) };
  assert.equal(validatePlayerPatch(current, otherRole, 'p1'), false);
});

test('villa takeover: phones see only their own role, clues, alliances and alerts — never the code', async () => {
  const villa = {
    sq: 6, code: '4721', roles: { p0: 'hacker', p1: 'phantom' }, clues: { p0: [0, 2] },
    alliances: [{ id: 'a1', members: ['p0', 'p1'] }, { id: 'a2', members: ['p1', 'p2'] }],
    alerts: [{ id: 'n1', to: 'all', title: 'A' }, { id: 'n2', to: 'p1', title: 'B' }],
  };
  const rec = { state: { players: [...players, { id: 'p2', name: 'Player 2' }], mg: { villa } } };
  const p0 = sanitizePublicSession(rec, 'p0').state.mg.villa;
  assert.equal(p0.code, undefined);
  assert.deepEqual(p0.myDigits, { 0: '4', 2: '2' });
  assert.deepEqual(p0.roles, { p0: 'hacker' });
  assert.deepEqual(p0.alliances.map((a) => a.id), ['a1']);
  assert.deepEqual(p0.alerts.map((a) => a.id), ['n1']);
  const tv = sanitizePublicSession(rec).state.mg.villa;
  assert.deepEqual([tv.code, tv.roles, tv.alliances.length], [undefined, {}, 0]);
  const current = { players, mg: { stop: false } };
  assert.equal(validatePlayerPatch(current, { mg: { playerAction: { playerId: 'p1', type: 'villa_code', code: '4721', at: 1 } } }, 'p1'), true);
  assert.equal(validatePlayerPatch(current, { mg: { playerAction: { playerId: 'p1', type: 'villa_vote', target: 'p1', at: 1 } } }, 'p1'), false);
  assert.equal(validatePlayerPatch(current, { mg: { playerAction: { playerId: 'p1', type: 'villa_quiet', value: true, at: 1 } } }, 'p1'), true);
  assert.equal(validatePlayerPatch(current, { mg: { playerAction: { playerId: 'p1', type: 'villa_profile', nail: 'Κόκκινο', at: 1 } } }, 'p1'), true);
  assert.equal(validatePlayerPatch(current, { mg: { playerAction: { playerId: 'p1', type: 'villa_profile', footwear: 7, at: 1 } } }, 'p1'), false);
  assert.equal(validatePlayerPatch(current, { mg: { playerAction: { playerId: 'p1', type: 'villa_heist', target: 'p0', at: 1 } } }, 'p1'), true);
  const withHeist = sanitizePublicSession({ state: { ...rec.state, mg: { villa: { ...villa, sockBomb: 'p0', heistLog: [{ thief: 'p1', victim: 'p0', n: 1, at: 1, night: 1 }] } } } }, 'p0').state.mg.villa;
  assert.equal(withHeist.sockBomb, undefined);
  assert.equal(withHeist.heistLog[0].thief, undefined);
});

test('villa engine: 48/72 ώρες, 4-step Round Strip, νύχτες, κλοπές, PASS χωρίς ποινή, κωδικός', async () => {
  const V = await import('../src/lib/villaEngine.js');
  const C = await import('../src/data/modes/villaContent.js');
  const ps = Array.from({ length: 8 }, (_, i) => ({ id: `p${i}` }));
  const v = V.initVilla(ps, { rng: () => 0.3, now: 0 });
  const roles = Object.values(v.roles).filter((r) => r !== 'guest');
  assert.equal(new Set(roles).size, roles.length);
  assert.match(v.code, /^\d{4}$/);
  // Κάθε ώρα έχει τετράγωνο, και οι 4 ενδείξεις υπάρχουν μία φορά σε κάθε έκδοση.
  for (const hours of [48, 72]) {
    const board = V.boardOf({ hours });
    assert.equal(board.length, hours);
    assert.ok(board.every(Boolean), `${hours}h: λείπει τετράγωνο`);
    assert.deepEqual(board.filter((s) => s.clue !== undefined).map((s) => s.clue).sort(), [0, 1, 2, 3]);
    assert.equal(board[hours - 1].finale, 'awards');
    assert.ok(board.some((s) => s.finale === 'code'));
    assert.equal(V.phasesOf({ hours }).at(-1).to, hours);
  }
  assert.equal(V.boardOf({ hours: 72 }).filter((s) => s.heist).length, 2, '72ωρο = διπλή νύχτα');
  assert.equal(V.squareAt(49, { hours: 72 }).shift, true, 'Alliance Shift στην 49η ώρα');
  assert.equal(V.scheduledSquare(v, 3 * 3600000 + 5), 4);
  assert.equal(V.scheduledSquare(v, 99 * 3600000), 48);
  assert.equal(V.scheduledSquare({ ...v, hours: 72 }, 99 * 3600000), 72);
  // Round Strip μόνο προς τα πάνω.
  let s = V.setStrip(v, 1);
  assert.equal(s.strip, 1);
  assert.equal(V.setStrip(s, 1), s);
  s = V.setStrip(V.setStrip(V.setStrip(s, 2), 3), 4);
  assert.equal(V.footwearLevelOf(s, 'p0'), 0);
  assert.equal(C.STRIP_STEPS.length, 4);
  // Νύχτα → κλοπή (Phantom ×2) → πρωινός απολογισμός.
  let n = { ...v, hours: 72 };
  while ((n.sq || 1) < 20) n = V.advance(n);
  assert.equal(n.night, true);
  const phantom = Object.keys(n.roles).find((id) => n.roles[id] === 'phantom');
  const { villa: afterHeist, n: got } = V.logHeist(n, phantom, phantom === 'p0' ? 'p1' : 'p0');
  assert.equal(got, 2);
  let m = afterHeist;
  while ((m.sq || 1) < 25) m = V.advance(m);
  assert.equal(m.night, false);
  assert.equal(m.morningSummary.top, phantom);
  // Πόντοι, κωδικός, διαταγή, άγαλμα.
  assert.equal(V.pointsFor(V.squareAt(14, { hours: 72 }), 'pass'), 0);
  assert.ok(V.pointsFor(V.squareAt(13, { hours: 72 }), 'lose') < 0);
  assert.equal(V.tryCode(v, 'p1', v.code).ok, true);
  assert.ok(V.tryCode(v, 'p1', v.code === '0000' ? '1111' : '0000').villa.surge);
  assert.equal(V.cluesFound(V.awardClue(V.awardClue(v, 1, 'p0'), 1, 'p3')), 1);
  assert.equal(V.commandActive(V.startCommand(v, 'p0', C.VILLA_ROYAL_COMMANDS[0], 0), 5 * 60000), true);
  assert.equal(V.statueActive(V.startStatue(v, 30, 0), 31000), false);
  // Όλο το περιεχόμενο του PDF.
  assert.deepEqual([C.VILLA_QUESTIONS.length, C.VILLA_DARES.length, C.VILLA_NAIL_CARDS.length, C.VILLA_FLIRT_QUESTIONS.length, C.VILLA_COMMAND_CARDS.length, C.VILLA_HUNT_CARDS.length, C.VILLA_NIGHT_CHALLENGES.length], [20, 20, 15, 20, 15, 10, 5]);
  assert.ok(C.VILLA_DECKS.every((d) => C.deckCards(d.id).length > 0));
});

test('προσωπικός PIN: ποτέ δημόσιος, απαραίτητος για προσωπικά δεδομένα, παλιές βραδιές χωρίς PIN λειτουργούν', async () => {
  const { pinOk } = await import('../server/entities.js');
  const state = { players: [{ id: 'p0', name: 'Α', pin: '4821', role: 'cop' }, { id: 'p1', name: 'Β' }] };
  assert.equal(pinOk(state, 'p0', '4821'), true);
  assert.equal(pinOk(state, 'p0', '0000'), false);
  assert.equal(pinOk(state, 'p0', undefined), false);
  assert.equal(pinOk(state, 'p1', undefined), true, 'παλιά παίκτρια χωρίς PIN');
  assert.equal(pinOk(state, 'p9', '4821'), false);
  const own = sanitizePublicSession({ state }, 'p0').state.players[0];
  assert.equal('pin' in own, false);
  assert.equal(own.hasPin, true);
  const patch = { mg: { playerAction: { playerId: 'p0', type: 'board_roll', at: 1 } } };
  assert.equal(validatePlayerPatch({ ...state, mg: {} }, { players: sanitizePublicSession({ state }, 'p0').state.players.map((p) => ({ ...p })) , history: [{ type: 'double_down', player: 'Α', result: 'ελευθερία', timestamp: 1 }] }, 'p0'), true);
  assert.ok(patch);
});

test('9.0.0 Η Ταινία: πράξεις 4/6/9, κανόνας παπούτσι→κάλτσα, πίνακας πόντων, hogtie, tokens, τελικό σκορ', async () => {
  const E = await import('../src/lib/campaignEngine.js');
  const C = await import('../src/data/modes/campaignContent.js');
  assert.deepEqual(['quick', 'h48', 'h72'].map((f) => C.FORMATS[f].acts.length), [4, 6, 9]);
  for (const f of ['h48', 'h72']) assert.ok(C.FORMATS[f].acts.at(-1).finale && C.FORMATS[f].acts.at(-1).continent === 'villa_takeover');
  assert.equal(C.CONTINENTS.length, 5);
  const ps = [{ id: 'a', name: 'Α' }, { id: 'b', name: 'Β' }, { id: 'c', name: 'Γ' }];
  let cg = E.startAct(E.initCampaign(ps, { format: 'h48' }), ps);
  assert.equal(E.statsOf(cg, 'a').tokens, 2);
  assert.equal(E.removePiece(cg, 'a', 'sockL').ok, false, 'η κάλτσα δεν βγαίνει πριν το παπούτσι');
  cg = E.removePiece(cg, 'a', 'shoeL').cg;
  assert.equal(E.removePiece(cg, 'a', 'sockL').ok, true);
  cg = E.resolveTrial(E.startTrial(cg, 'tiptoe', 'b'), 'win');
  assert.deepEqual([E.statsOf(cg, 'b').points, E.statsOf(cg, 'b').tokens], [6, 3]);
  cg = E.startTrial(cg, 'hogtie', 'c');
  assert.equal(E.setState(cg, 'c', { hands: 'free' }).players.c.state.hands, 'hogtie', 'το hogtie κλειδώνει μέχρι απελευθέρωση');
  cg = E.resolveTrial(cg, 'lose');
  assert.deepEqual([E.statsOf(cg, 'c').points, E.statsOf(cg, 'c').wanted], [-4, 2]);
  assert.equal(E.resolveTrial(E.startTrial(cg, 'onefoot', 'c'), 'pass').players.c.points, -4, 'PASS = 0');
  assert.equal(E.resolveTrial(E.startTrial(cg, 'onefoot', 'c'), 'lose').players.c.points, -7, 'Wanted 2: −1 επιπλέον σε αποτυχία');
  assert.equal(E.spendToken(E.applyDelta(cg, 'c', { wanted: 1 }), 'c', 'shield').ok, false, 'Wanted 3: χωρίς Ασπίδα');
  cg = E.applyDelta(cg, 'b', { loot: 2, zones: 1 });
  assert.equal(E.finalScore(cg, 'b'), 6 + 4 + 3 + 3);
  cg = E.closeAct(cg, ps);
  assert.equal(cg.conquered[0].winner, 'b');
  assert.equal(E.undo(E.applyDelta(cg, 'a', { points: 5 })).players.a.points, cg.players.a.points);
  assert.equal(E.goNext(cg).act || 0, 0, 'πρώτα η υποχρεωτική κλήρωση + Τροχός');
  const MGE = await import('../src/lib/movieGamesEngine.js');
  const drawn = MGE.mandatoryDraw(cg, ps, { pid: 'a' });
  assert.equal(drawn.pid, 'a');
  cg = MGE.spinWheel(drawn.cg, 2, 'a', { allowedIds: ['w2_chair'], reason: 'mandatory' }).cg;
  assert.equal(cg.mandatory.pending, false);
  assert.deepEqual([cg.players.a.state.hands, cg.players.a.state.feet], ['chair', 'chair']);
  cg = E.goNext(cg);
  assert.equal(E.currentAct(cg).continent, 'arrest_heist');
  assert.equal(E.currentAct(E.jumpTo(cg, 'lockdown')).continent, 'lockdown');
});

test('9.0.0 Η Ταινία: τα κινητά δεν βλέπουν ξένες ψήφους, αναιρέσεις ή checkpoints', () => {
  const cg = { act: 0, status: 'active', players: {}, undo: [{}], checkpoints: [{}], votes: { open: true, ballots: { p0: 'Ισχύει', p1: 'Μπλόφα' } }, finalVotes: { p0: 'p1', p1: 'p0' }, risk: { p1: 'risk' } };
  const view = sanitizePublicSession({ state: { players, mg: { cg } } }, 'p0').state.mg.cg;
  assert.equal(view.undo, undefined);
  assert.equal(view.checkpoints, undefined);
  assert.equal(view.votes.ballots.p0, 'Ισχύει');
  assert.equal(view.votes.ballots.p1, undefined);
  assert.equal(view.finalVotes.p1, undefined);
  assert.equal(view.risk.p1, undefined);
  const current = { players, mg: { stop: false } };
  assert.equal(validatePlayerPatch(current, { mg: { playerAction: { playerId: 'p1', type: 'cg_nail', nail: 'Κόκκινο', at: 1 } } }, 'p1'), true);
  assert.equal(validatePlayerPatch(current, { mg: { playerAction: { playerId: 'p1', type: 'cg_token', use: 'steal', at: 1 } } }, 'p1'), true);
  assert.equal(validatePlayerPatch(current, { mg: { playerAction: { playerId: 'p1', type: 'cg_token', use: 'nuke', at: 1 } } }, 'p1'), false);
  assert.equal(validatePlayerPatch(current, { mg: { playerAction: { playerId: 'p1', type: 'cg_final', target: 'p1', at: 1 } } }, 'p1'), false);
});

test('Η Ταινία: Τροχοί, Deal or No Deal, ελευθερία και απόκρυψη κουτιών', async () => {
  const E = await import('../src/lib/campaignEngine.js');
  const G = await import('../src/lib/movieGamesEngine.js');
  const ps = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }];
  let cg = E.initCampaign(ps, { format: 'quick', now: 1 });
  let i = 0; const rng = () => ((i += 1) % 7) / 7;
  cg = G.dondStart(cg, 'a', 'b', { rng });
  assert.equal(cg.dond.boxes.length, 16);
  cg = G.dondPick(cg, 1);
  for (let n = 2; n <= 6; n += 1) cg = G.dondOpen(cg, n).cg;
  assert.equal(cg.dond.status, 'offer_wait');
  cg = G.dondDecide(G.dondOffer(cg, 'Ελευθερία'), 'deal');
  assert.equal(cg.dond.status, 'deal');
  cg = G.dondAward(cg, true);
  assert.equal(G.isFree(cg, 'b'), true);
  assert.equal(G.spinWheel(cg, 1, 'b').item, null, 'ελεύθερη = εκτός Τροχών');
  const session = { state: { mg: { cg: { ...cg, guess: { pid: 'a', item: 'Φτερό', at: 1, until: 2, result: null } } }, players: ps } };
  const pub = sanitizePublicSession(session, 'a');
  const closed = pub.state.mg.cg.dond.boxes.filter((b) => !b.open);
  assert.ok(closed.length > 0 && closed.every((b) => b.label === undefined && b.kind === undefined));
  assert.equal(pub.state.mg.cg.guess.item, undefined);
  assert.equal(validatePlayerPatch({ players: ps, mg: {} }, { mg: { playerAction: { type: 'cg_dond', value: 'deal', playerId: 'a', at: 1 } } }, 'a'), true);
  assert.equal(validatePlayerPatch({ players: ps, mg: {} }, { mg: { playerAction: { type: 'cg_dond_box', value: 99, playerId: 'a', at: 1 } } }, 'a'), false);
});

test('Η Ταινία: τα όρια της φόρμας κόβουν ποινές του Τροχού και μένουν κρυφά από τα κινητά', async () => {
  const G = await import('../src/lib/movieGamesEngine.js');
  const { WHEELS } = await import('../src/data/modes/movieGames.js');
  const profile = { alcoholOk: false, chairOk: false, wheelNo: ['w1_ice'] };
  const ok = WHEELS.flatMap((w) => w.items).filter((i) => G.profileAllows(profile, i)).map((i) => i.id);
  assert.ok(!ok.includes('w1_shot') && !ok.includes('w2_chair') && !ok.includes('w1_ice') && ok.includes('w1_shoeL'));
  const pub = sanitizePublicSession({ state: { players: [{ id: 'a', name: 'A', movieProfile: profile }] } }, 'a');
  assert.equal('movieProfile' in pub.state.players[0], false);
});

test('Η Ταινία: μετά την ΤΕΛΕΥΤΑΙΑ ήπειρο δεν ανοίγει υποχρεωτική κλήρωση (πάει κατευθείαν στο φινάλε)', async () => {
  const E = await import('../src/lib/campaignEngine.js');
  const ps = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }];
  let cg = E.initCampaign(ps, { format: 'quick', now: 1 });
  cg = { ...cg, act: E.actsOf(cg).length - 1 };
  cg = E.closeAct(E.startAct(cg, ps), ps);
  assert.equal(cg.status, 'finale');
  assert.equal(cg.mandatory.pending, false);
});
