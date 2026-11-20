import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const app = read('../src/App.jsx');
const site = read('../src/data/siteContent.js');
const publicForms = read('../src/pages/PublicForms.jsx');

test('the unified public form route is registered and retired form routes stay removed', () => {
  assert.match(app, /path=["']\\/forms["']/);
  assert.match(app, /path=["']\\/portal["']/);
  for (const path of ['/invitation', '/welcome', '/pajama-form', '/pajama-invite', '/modes-form', '/intake']) {
    assert.doesNotMatch(app, new RegExp(`path=["']${path.replaceAll('/', '\\\\/')}["']`), `Retired route is still registered: ${path}`);
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
