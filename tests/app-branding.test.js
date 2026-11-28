import test from 'node:test';
import assert from 'node:assert/strict';
import { BRANDING_GROUPS, BRANDING_PATHS, brandingMap, groupState } from '../src/lib/appBranding.js';

test('εικονίδιο/εκκίνηση/κοινοποίηση: οι διευθύνσεις είναι ακριβώς αυτές του index.html και των manifests', async () => {
  const fs = await import('node:fs');
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const used = new Set();
  for (const m of ['manifest.webmanifest', 'manifest-play.webmanifest', 'manifest-public.webmanifest']) {
    const icons = JSON.parse(fs.readFileSync(new URL(`../public/${m}`, import.meta.url), 'utf8')).icons || [];
    for (const icon of icons) { used.add(icon.src); assert.ok(BRANDING_PATHS.includes(icon.src), `${m}: το ${icon.src} δεν αλλάζει από το Admin`); }
  }
  for (const p of BRANDING_PATHS) assert.ok(html.includes(p) || used.has(p), `δεν χρησιμοποιείται πουθενά: ${p}`);
  for (const m of html.matchAll(/(?:href|content)="(?:__ORIGIN__)?(\/(?:icons|splash)\/[^"]+|\/og-image\.jpg)"/g)) assert.ok(BRANDING_PATHS.includes(m[1]), `index.html: το ${m[1]} δεν αλλάζει από το Admin`);
  for (const p of BRANDING_PATHS) assert.ok(fs.existsSync(new URL(`../public${p}`, import.meta.url)), `δεν υπάρχει ενσωματωμένο ${p}`);
});

test('brandingMap δέχεται μόνο ανεβασμένα αρχεία /media/ για γνωστές διευθύνσεις', () => {
  const map = brandingMap({
    '/icons/icon-192.png': '/media/abc-1.png',
    '/og-image.jpg': 'https://evil.example/x.jpg',
    '/splash/iphone-15-pro.jpg': '/media/../../etc/passwd',
    '/secret.txt': '/media/a.png',
  });
  assert.deepEqual(map, { '/icons/icon-192.png': '/media/abc-1.png' });
  assert.equal(groupState(map, BRANDING_GROUPS[0]), 1);
  assert.deepEqual(brandingMap(null), {});
});

test('Χάρτης media: κάθε όνομα αρχείου είναι λατινικό (αλλιώς η «Αυτόματη σύνδεση» δεν το βρίσκει)', async () => {
  const fs = await import('node:fs');
  for (const f of ['src/data/modes/modeRegistry.js', 'src/data/mediaSlots.js']) {
    const text = fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
    for (const m of text.matchAll(/filename: '([^']*)'/g)) if (m[1]) assert.match(m[1], /^[A-Za-z0-9_.-]+$/, `${f}: «${m[1]}»`);
  }
});

test('κίνηση παιχνιδιού: φορτώνεται τελευταία και σέβεται τη «Μείωση κίνησης»', async () => {
  const fs = await import('node:fs');
  const main = fs.readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
  assert.ok(main.indexOf("game-motion.css") > main.indexOf("movie.css"), 'το game-motion.css πρέπει να φορτώνεται μετά το movie.css');
  const css = fs.readFileSync(new URL('../src/design/game-motion.css', import.meta.url), 'utf8');
  const motion = css.slice(css.indexOf('@media (prefers-reduced-motion: no-preference)'), css.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.ok(motion.includes('gx-takeover-card') && motion.includes('mv-roll'));
  assert.ok(!/backdrop-filter|filter:\s*blur/.test(css), 'χωρίς blur: μένει ελαφρύ');
});
