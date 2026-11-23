import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const app = read('../src/App.jsx');
const site = read('../src/data/siteContent.js');
const publicForms = read('../src/pages/PublicForms.jsx');

test('the unified public form route is registered and retired form routes stay removed', () => {
  assert.ok(app.includes('path="/forms"') || app.includes("path='/forms'"));
  assert.ok(app.includes('path="/portal"') || app.includes("path='/portal'"));
  for (const path of ['/invitation', '/welcome', '/pajama-form', '/pajama-invite', '/modes-form', '/intake']) {
    assert.ok(!app.includes(`path="${path}"`) && !app.includes(`path='${path}'`), `Retired route is still registered: ${path}`);
  }
});

test('all five digital modes have canonical site form links', () => {
  for (const mode of ['pedi_glam', 'pedi_extended', 'lockdown', 'beach_bar', 'marathon_4h']) {
    assert.ok(site.includes(`/forms?mode=${mode}`), `Missing public form link for ${mode}`);
  }
  assert.match(publicForms, /const validMode = GAME_MODES\.some/);
  assert.match(publicForms, /if \(isNewMode\(selectedMode\)\) return <ModeForm \/>/);
});


test('mode submissions retain Event identity and Tablet filters by that Event', () => {
  const modeForm = read('../src/pages/ModeForm.jsx');
  const setup = read('../src/components/tablet/SetupScreen.jsx');
  assert.match(modeForm, /params\.get\('eventId'\) \|\| params\.get\('dotEventId'\)/);
  assert.match(modeForm, /dotEventId \? \{ dotEventId \} : \{\}/);
  assert.match(modeForm, /roomCode \? \{ roomCode \} : \{\}/);
  assert.match(setup, /item\.dotEventId === selectedDotEventId/);
  assert.match(setup, /item\.roomCode === selectedEvent\?\.room_code/);
  assert.match(setup, /item\.sessionCode === selectedEvent\?\.room_code/);
  assert.match(setup, /PajamaIntake\.filter\(\{\}/);
});




test('Bachelorette intake submissions can be approved and only approved players enter Arrest & Heist', () => {
  const server = read('../server/entities.js');
  const setup = read('../src/components/tablet/SetupScreen.jsx');
  assert.match(server, /'BacheloretteIntake', 'VIPInvitationSubmission'/);
  assert.match(setup, /sourceEntity: 'BacheloretteIntake', modeIds: \['arrest_heist'\]/);
  assert.match(setup, /scopeToEvent\(heistRes\.items\)\.filter\(\(item\) => item\.approved === true\)/);
  assert.match(setup, /BacheloretteIntake\.subscribe\(refresh\)/);
});




test('Admin can approve Arrest & Heist intake directly from its form record', () => {
  const adminIntakes = read('../src/components/admin/AdminIntakes.jsx');
  assert.match(adminIntakes, /intake-approvals\/BacheloretteIntake/);
  assert.match(adminIntakes, /handleApproveBach/);
  assert.match(adminIntakes, /ΕΓΚΡΙΣΗ & ΠΡΟΣΘΗΚΗ ΣΤΟ TABLET/);
});


test('approved invitation intakes are assigned to their submitted mode in Admin casting', () => {
  const casting = read('../src/components/admin/AdminShowCasting.jsx');
  assert.match(casting, /item\.vipGameMode \|\| item\.gameMode \|\| 'classic'/);
  assert.match(casting, /scopeToEvent\(playerIntakes\)\.filter\(\(item\) => item\.approved === true \|\| item\.approvalStatus === 'approved'\)/);
});


test('mobile player heartbeat is validated and visible in live Admin presence', () => {
  const server = read('../server/entities.js');
  const play = read('../src/pages/Play.jsx');
  const adminPlayers = read('../src/components/admin/AdminPlayers.jsx');
  assert.match(server, /r\.post\('\/player-presence'/);
  assert.match(server, /PLAYER_PRESENCE_TTL_MS = 45_000/);
  assert.match(server, /broadcast\('PlayerPresence'/);
  assert.match(play, /\/api\/entities\/player-presence/);
  assert.match(adminPlayers, /base44\.entities\.PlayerPresence\.subscribe/);
  assert.match(adminPlayers, /ΣΥΝΔΕΔΕΜΕΝΗ/);
});


test('casting plans are Event-scoped and revoked approvals cannot enter Tablet setup', () => {
  const casting = read('../src/components/admin/AdminShowCasting.jsx');
  const setup = read('../src/components/tablet/SetupScreen.jsx');
  assert.match(casting, /selectedEventId/);
  assert.match(casting, /dotEventId: selectedEvent\.id/);
  assert.match(setup, /const planMatchesEvent =/);
  assert.match(setup, /const planHasOnlyApprovedPlayers =/);
  assert.match(setup, /eligibleModesByName\.get/);
});



test('session switching ignores stale async responses and binds updates to their originating session', () => {
  const hook = read('../src/hooks/useGameSession.js');
  assert.match(hook, /const operationRef = useRef\(0\)/);
  assert.match(hook, /if \(operation !== operationRef\.current\) return false/);
  assert.match(hook, /const targetSessionId = sessionRef\.current\.id/);
  assert.match(hook, /GameSession\.update\(targetSessionId, payload\)/);
  assert.match(hook, /if \(updated\?\.state && sessionRef\.current\?\.id === targetSessionId\)/);
});


test('Admin live actions prevent duplicate submissions and surface save status', () => {
  const live = read('../src/components/admin/AdminLiveControl.jsx');
  assert.match(live, /const \[busyAction, setBusyAction\] = useState\(''\)/);
  assert.match(live, /if \(busyAction\) return/);
  assert.match(live, /disabled=\{!!busyAction\}/);
  assert.match(live, /aria-live="polite"/);
  assert.match(live, /Η ενέργεια αποθηκεύτηκε/);
});


test('active session writes are serialized and session deletion clears subscribed screens', () => {
  const activeSession = read('../src/lib/activeSession.js');
  assert.match(activeSession, /let activeSessionWriteQueue = Promise\.resolve\(\)/);
  assert.match(activeSession, /activeSessionWriteQueue = activeSessionWriteQueue/);
  assert.match(activeSession, /event\.type === 'delete'.*onCode\(''\)/s);
  assert.match(activeSession, /toUpperCase\(\)/);
});



test('Tablet: μετράει σωστά ποιες συμπλήρωσαν φόρμα και σε ποιο mode, από όλες τις φόρμες', async () => {
  const { buildRoster, modeCounts } = await import('../src/lib/intakeRoster.js');
  const roster = buildRoster({
    player: [
      { id: 'a', name: 'Άννα', approved: true, preferredModes: ['classic', 'lockdown'] },
      { id: 'b', name: 'Βίκυ', approved: false, gameMode: 'classic' },
      { id: 'c', name: 'Γιώτα', approved: true, gameMode: 'marathon' },
    ],
    pajama: [
      { id: 'd', name: 'Δήμητρα', approved: true, preferredModes: ['beach_bar'] },
      { id: 'e', name: 'άννα ', approved: true, preferredModes: ['lockdown'] },
    ],
    heist: [{ id: 'f', name: 'Ελένη', leaderName: 'Ζωή', approved: true }],
    vip: [{ id: 'g', name: 'Ήρα', gameMode: 'marathon_4h', approvalStatus: 'rejected' }],
  });
  const by = Object.fromEntries(modeCounts(roster).map((row) => [row.id, row]));
  assert.deepEqual(by.classic.approved, ['Άννα']);
  assert.deepEqual(by.classic.pending, ['Βίκυ']);
  assert.equal(by.lockdown.approved.length, 1, 'ίδιο όνομα από δύο φόρμες μετράει μία φορά');
  assert.deepEqual(by.beach_bar.approved, ['Δήμητρα']);
  assert.deepEqual(by.arrest_heist.approved.sort(), ['Ελένη', 'Ζωή']);
  assert.equal(by.marathon_4h.approved.length + by.marathon_4h.pending.length, 0, 'απορριφθείσα δεν μετράει');
  assert.equal(by.marathon, undefined, 'αποσυρμένο mode δεν εμφανίζεται');
});
