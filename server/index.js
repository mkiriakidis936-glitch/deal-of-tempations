import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { migrate, pool } from './db.js';
import { attachUser, authRoutes, issueStreamTicket } from './auth.js';
import { entityRoutes, closeAllStreams } from './entities.js';
import { functionRoutes } from './functions.js';
import { mediaRoutes, mediaStatic, UPLOAD_DIR } from './media.js';
import { brandingRoutes } from './branding.js';
import { pushRoutes } from './push.js';
import { visitRoutes } from './visits.js';
import { backupRoutes, startAutoBackup, BACKUP_DIR } from './backup.js';
import { cameraRoutes } from './camera.js';
import { lightRoutes, lights } from './lights.js';
import { onSessionChange } from './entities.js';
import { releaseNotesFor } from './releaseNotes.js';

const app = express();
app.set('trust proxy', 1); // Railway terminates TLS in front of us

// Security headers (camera/microphone μένουν ανοιχτά για QR scanner και Live Feed).
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
  if (req.headers['x-forwarded-proto'] === 'https') res.setHeader('Strict-Transport-Security', 'max-age=15552000');
  next();
});

// πριν από τον γενικό parser των 2MB: τα αντίγραφα ασφαλείας έχουν δικό τους, μεγαλύτερο όριο
app.use('/api/backup', attachUser, backupRoutes());
app.use(express.json({ limit: '2mb' }));
app.use(attachUser);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// 12.0 · Υγεία server για το Admin (μόνο admin): έκδοση, χρόνος λειτουργίας, μνήμη, βάση, χώρος αποθήκευσης.
app.get('/api/admin/health', async (req, res) => {
  if (req.user?.role !== 'admin') return res.status(req.user ? 403 : 401).json({ error: 'Unauthorized' });
  const out = { version: PACKAGE_VERSION, uptimeSec: Math.round(process.uptime()), node: process.version, memoryMB: Math.round(process.memoryUsage().rss / 1048576), now: Date.now() };
  const t0 = Date.now();
  try {
    const { rows } = await pool.query("SELECT entity, count(*)::int AS n FROM records GROUP BY entity");
    out.db = { ok: true, latencyMs: Date.now() - t0, records: Object.fromEntries(rows.map((r) => [r.entity, r.n])) };
  } catch (e) { out.db = { ok: false, error: e.message }; }
  const dirSize = async (dir) => {
    try {
      const names = await fs.promises.readdir(dir);
      let size = 0; let files = 0;
      for (const n of names) { if (n.startsWith('.')) continue; try { const st = await fs.promises.stat(path.join(dir, n)); if (st.isFile()) { size += st.size; files += 1; } } catch { /* αγνόησε */ } }
      return { size, files };
    } catch { return null; }
  };
  out.uploads = await dirSize(UPLOAD_DIR);
  out.backups = await dirSize(BACKUP_DIR);
  try { const st = await fs.promises.statfs(UPLOAD_DIR); out.disk = { free: st.bavail * st.bsize, total: st.blocks * st.bsize }; } catch { out.disk = null; }
  res.set('Cache-Control', 'no-store').json(out);
});

const PACKAGE_VERSION = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '..', 'package.json'), 'utf8')).version;
const startedAt = new Date().toISOString();
app.get('/api/version', (_req, res) => {
  let info = { version: PACKAGE_VERSION, build: 'dev', builtAt: '' };
  try { info = { ...info, ...JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '..', 'dist', 'version.json'), 'utf8')) }; } catch { /* χωρίς build */ }
  let notes = '';
  try { notes = releaseNotesFor(fs.readFileSync(path.resolve(import.meta.dirname, '..', 'CHANGELOG.md'), 'utf8'), info.version); } catch { /* χωρίς CHANGELOG */ }
  res.set('Cache-Control', 'no-store').json({ ...info, notes, serverStartedAt: startedAt });
});

app.get('/api/production/privacy', async (req, res) => {
  const sessionCode = String(req.query.event || '').trim().toUpperCase();
  if (!sessionCode || sessionCode.length > 40) return res.status(400).json({ error: 'Μη έγκυρος κωδικός διοργάνωσης.' });
  try {
    const { rows } = await pool.query(
      "SELECT data FROM records WHERE entity = 'ShowProduction' AND data->>'sessionCode' = $1 ORDER BY updated_date DESC LIMIT 1",
      [sessionCode]
    );
    const data = rows[0]?.data || {};
    return res.json({
      title: String(data.title || ''),
      controllerName: String(data.privacyControllerName || ''),
      controllerContact: String(data.privacyControllerContact || ''),
      retentionDays: Number(data.privacyRetentionDays) || 0,
    });
  } catch {
    return res.status(500).json({ error: 'Δεν ήταν δυνατή η φόρτωση των πληροφοριών απορρήτου.' });
  }
});

authRoutes(app);
// Μόνο ο admin χρειάζεται εισιτήριο (πλήρη δεδομένα). Επισκέπτες και απλοί λογαριασμοί συνεχίζουν με δημόσια ροή — χωρίς σφάλμα.
app.post('/api/entities/stream-ticket', (req, res) => res.json({ ticket: req.user?.role === 'admin' ? issueStreamTicket(req.user.id) : null }));
app.use('/api/entities', entityRoutes());
app.use('/api/functions', functionRoutes());
app.use('/api/media', mediaRoutes());
app.use('/api/push', pushRoutes());
app.use('/api/visits', visitRoutes());
app.use('/api/camera', cameraRoutes());
app.use('/api/lights', lightRoutes());
// 11.1.0 · Τα φώτα του σπιτιού ακούν κάθε αλλαγή του παιχνιδιού (μόνο ανάγνωση).
onSessionChange((record) => lights.onSession(record));
app.use('/media', mediaStatic);
// Εικονίδιο εφαρμογής, εκκίνηση iPhone, εικόνα κοινοποίησης: αν το Admin ανέβασε δική του, σερβίρεται πριν από τα ενσωματωμένα.
app.use(brandingRoutes());
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// Serve the built React app + SPA fallback (client-side routing: /tv, /play, /admin ...)
const dist = path.resolve(import.meta.dirname, '..', 'dist');
if (fs.existsSync(dist)) {
  // index.html is rendered per request so shared links (WhatsApp, Viber, Messenger) get a proper title, description and preview image.
  const indexFile = path.join(dist, 'index.html');
  let indexTemplate = fs.readFileSync(indexFile, 'utf8');
  let indexMtime = fs.statSync(indexFile).mtimeMs;
  const currentIndex = () => {
    try {
      const mtime = fs.statSync(indexFile).mtimeMs;
      if (mtime !== indexMtime) { indexTemplate = fs.readFileSync(indexFile, 'utf8'); indexMtime = mtime; }
    } catch { /* κρατάμε το τελευταίο γνωστό */ }
    return indexTemplate;
  };
  const SITE_DESC = 'Deal of Temptation — The private reality game night. Ιδιωτική βιωματική Reality Show εμπειρία με παιχνίδια, σκηνοθεσία, ήχο, εικόνα και προαιρετικό recap. 18+.';
  const PAGES = {
    '/site': { title: 'Deal of Temptation — The private reality game night', desc: SITE_DESC, index: true },
    '/portal': { title: 'Deal of Temptation — Πληροφορίες Event', desc: 'Ημερομηνία, τοποθεσία και πρακτικές πληροφορίες της εκδήλωσης.' },
    '/promo': { title: 'Deal of Temptation — Trailer', desc: SITE_DESC, index: true },
    '/gift-unlock': { title: 'Deal of Temptation — Ξεκλείδωσε το δώρο σου', desc: 'Βάλε τον κωδικό σου και ξεκλείδωσε το δώρο.' },
    '/play': { title: 'DT Play — Deal of Temptation', desc: 'Το κινητό σου στο παιχνίδι.' },
    '/forms': { title: 'Deal of Temptation — Φόρμα συμμετοχής', desc: 'Ενιαία φόρμα επιλογής Mode και υποβολής συμμετοχής.' },
  };
  const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const renderIndex = (req) => {
    const origin = (process.env.PUBLIC_URL || `${req.headers['x-forwarded-proto'] || req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    const route = req.path.replace(/\/+$/, '') || '/';
    const meta = PAGES[route] || { title: 'Deal of Temptation', desc: SITE_DESC };
    const indexable = !!meta.index;
    return currentIndex()
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`)
      .replaceAll('__TITLE__', esc(meta.title)).replaceAll('__DESC__', esc(meta.desc))
      .replaceAll('__ORIGIN__', origin).replaceAll('__URL__', esc(origin + route))
      .replaceAll('__ROBOTS__', indexable ? 'index,follow' : 'noindex,nofollow');
  };

  app.use(express.static(dist, {
    index: false,
    maxAge: '1h',
    // το service worker και το manifest δεν πρέπει να μένουν σε cache, αλλιώς δεν ενημερώνεται η εφαρμογή
    setHeaders: (res, file) => {
      if (/(^|[\/])(sw\.js|version\.json|manifest(-public|-play)?\.webmanifest)$/.test(file)) res.setHeader('Cache-Control', 'no-cache');
      else if (/[\/]assets[\/]/.test(file)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  }));
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    if (/^\/assets\/|\.(js|css|map|png|jpe?g|webp|svg|ico|json|webmanifest)$/i.test(req.path)) return res.status(404).end();
    res.type('html').set('Cache-Control', 'no-cache').send(renderIndex(req));
  });
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // Λάθος αίτημα από τον client (χαλασμένο JSON, πολύ μεγάλο σώμα): 4xx, όχι «σφάλμα server».
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Μη έγκυρα δεδομένα αιτήματος.' });
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Το αίτημα είναι πολύ μεγάλο.' });
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
});

const port = Number(process.env.PORT) || 3000;
await migrate();
const server = app.listen(port, '0.0.0.0', () => console.log(`Server listening on :${port}`));
// Μεγάλα βίντεο από κινητό/αργό δίκτυο: το προεπιλεγμένο requestTimeout του Node (5′) διέκοπτε το ανέβασμα.
server.requestTimeout = 30 * 60 * 1000;
server.headersTimeout = 65 * 1000;
server.keepAliveTimeout = 65 * 1000;
startAutoBackup();

process.on('unhandledRejection', (error) => console.error('[server] μη χειρισμένο σφάλμα:', error?.message || error));

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    closeAllStreams();
    server.closeAllConnections?.();
    server.close(() => pool.end().catch(() => {}).then(() => process.exit(0)));
    setTimeout(() => process.exit(0), 5000).unref();
  });
}
