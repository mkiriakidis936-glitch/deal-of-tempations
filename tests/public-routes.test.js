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


test('approved Arrest & Heist registrations appear in mode preference counts', () => {
  const setup = read('../src/components/tablet/SetupScreen.jsx');
  assert.match(setup, /filter\(\(item\) => item\.approved === true\)\.map\(\(item\) => \(\{ \.\.\.item, modeIds: \['arrest_heist'\] \}\)\)/);
  assert.match(setup, /\.\.\.heistIntakes, \.\.\.pendingIntakes/);
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
  assert.match(casting, /playerIntakes\.filter\(\(item\) => item\.approved === true \|\| item\.approvalStatus === 'approved'\)/);
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
