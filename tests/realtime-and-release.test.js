import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('realtime: όλες οι συνδρομές μιας σελίδας μοιράζονται μία σύνδεση SSE', () => {
  const client = read('src/api/base44Client.js');
  assert.match(client, /\/api\/entities\/multi\/stream\?/);
  assert.doesNotMatch(client, /\/api\/entities\/\$\{name\}\/stream/);
  assert.match(client, /type: 'resync'/);
  const server = read('server/entities.js');
  assert.match(server, /r\.get\('\/multi\/stream'/);
  assert.match(server, /JSON\.stringify\(\{ \.\.\.delivered, entity \}\)/);
});

test('realtime: ο admin που ανοίγει /play δεν χάνει τη συνεδρία λόγω playerId', () => {
  const server = read('server/entities.js');
  assert.match(server, /isAdmin\(req\) && isObject\(effectiveQuery\) && 'playerId' in effectiveQuery/);
});

test('TV: μία μόνο έξοδος παραγωγής (χωρίς διπλή αναπαραγωγή media)', () => {
  const tv = read('src/pages/TV.jsx');
  assert.match(tv, /TVProductionOutput/);
  assert.doesNotMatch(tv, /RealityShowOverlay/);
});

test('release: έκδοση, build info και προστασία από παλιά αρχεία μετά από deploy', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
  assert.match(read('vite.config.js'), /version\.json/);
  assert.match(read('server/index.js'), /\/api\/version/);
  assert.match(read('server/index.js'), /res\.status\(404\)\.end\(\)/);
  assert.match(read('src/main.jsx'), /vite:preloadError/);
  assert.ok(read('CHANGELOG.md').includes(`## ${pkg.version}`), 'το CHANGELOG περιέχει την τρέχουσα έκδοση');
});

test('admin: κάθε καρτέλα της πλοήγησης έχει οθόνη', () => {
  const admin = read('src/pages/Admin.jsx');
  const navBlock = admin.slice(admin.indexOf('const NAV_GROUPS'), admin.indexOf('const LEGACY_TABS'));
  const ids = [...navBlock.matchAll(/\{ id: '([a-z_]+)', label: '[^']+', icon:/g)].map((m) => m[1]);
  assert.ok(ids.length >= 15); // 5.0: αφαιρέθηκαν Σενάρια, Επιτεύγματα, Πληροφορίες event, Αρχείο, Ανάκτηση
  for (const id of ids.filter((id) => id !== 'dashboard')) {
    assert.match(admin, new RegExp(`case '${id}':`), `λείπει η οθόνη για ${id}`);
  }
});

test('ειδοποιήσεις: κάθε σύνδεσμος ανοίγει υπαρκτή καρτέλα του Admin', () => {
  const push = read('server/push.js');
  const admin = read('src/pages/Admin.jsx');
  const tabs = [...push.matchAll(/url: '\/admin\?tab=([a-z_-]+)'/g)].map((m) => m[1]);
  assert.ok(tabs.length > 0);
  for (const tab of tabs) assert.match(admin, new RegExp(`case '${tab}':`), `η ειδοποίηση οδηγεί σε ανύπαρκτη καρτέλα: ${tab}`);
});

test('εικονίδια: νέο λογότυπο DT για εφαρμογή, Site και TV', () => {
  assert.match(read('src/data/brandArt.js'), /emblem: '\/icons\/icon-512\.png'/);
  assert.match(read('src/components/tv/TVExperienceLayer.jsx'), /icon-192\.png/);
  assert.ok(fs.existsSync(path.join(root, 'public/splash/iphone-17-pro.jpg')));
  assert.ok(fs.existsSync(path.join(root, 'public/manifest-play.webmanifest')));
});

test('server: σφάλμα βάσης ή μη χειρισμένο promise δεν ρίχνει τον server', () => {
  assert.match(read('server/db.js'), /pool\.on\('error'/);
  assert.match(read('server/index.js'), /unhandledRejection/);
});

test('realtime: χρησιμοποιημένο εισιτήριο admin δεν γίνεται σιωπηλά ανώνυμη σύνδεση', () => {
  const server = read('server/entities.js');
  assert.match(server, /if \(req\.query\.ticket && !admin\) return res\.status\(401\)/);
  const client = read('src/api/base44Client.js');
  assert.match(client, /\[401, 403\]\.includes\(error\?\.status\)/);
  assert.match(client, /event: ping|addEventListener\('ping'/);
});
