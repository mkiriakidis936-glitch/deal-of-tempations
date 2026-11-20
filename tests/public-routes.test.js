import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const app = read('../src/App.jsx');
const site = read('../src/data/siteContent.js');
const publicForms = read('../src/pages/PublicForms.jsx');

test('all public form links used by the site have registered routes', () => {
  for (const path of ['/forms', '/invitation', '/welcome', '/pajama-form', '/pajama-invite', '/modes-form', '/intake', '/portal']) {
    assert.match(app, new RegExp(`path=["']${path.replaceAll('/', '\\/')}["']`), `Missing route: ${path}`);
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


test('Admin exposes the public participation link for a selected Event', () => {
  const adminInterest = read('../src/components/admin/AdminInterestParticipation.jsx');
  assert.match(app, /path="\/deal"/);
  assert.match(app, /path="\/deal\/:roomCode"/);
  assert.match(adminInterest, /\/deal\/\$\{selectedEvent\.room_code\}/);
  assert.match(adminInterest, /copyParticipationLink/);
  assert.match(adminInterest, /href="\/deal"/);
  assert.match(adminInterest, /copyInterestLink/);
  assert.match(adminInterest, /modes-form\?event=/);
  assert.match(adminInterest, /copyModeFormLink/);
});


test('Bachelorette intake submissions can be approved and only approved players enter Arrest & Heist', () => {
  const server = read('../server/entities.js');
  const setup = read('../src/components/tablet/SetupScreen.jsx');
  assert.match(server, /'BacheloretteIntake', 'VIPInvitationSubmission'/);
  assert.match(setup, /sourceEntity: 'BacheloretteIntake', modeIds: \['arrest_heist'\]/);
  assert.match(setup, /scopeToEvent\(heistRes\.items\)\.filter\(\(item\) => item\.approved === true\)/);
  assert.match(setup, /BacheloretteIntake\.subscribe\(refresh\)/);
});
