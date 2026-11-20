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
