import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { migrate, pool } from './db.js';
import { attachUser, authRoutes, issueStreamTicket, requireAdmin } from './auth.js';
import { entityRoutes } from './entities.js';
import { functionRoutes } from './functions.js';
import { mediaRoutes, mediaStatic } from './media.js';
import { pushRoutes } from './push.js';
import { visitRoutes } from './visits.js';
import { backupRoutes, startAutoBackup } from './backup.js';

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

const PACKAGE_VERSION = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '..', 'package.json'), 'utf8')).version;
const startedAt = new Date().toISOString();
app.get('/api/version', (_req, res) => {
  let info = { version: PACKAGE_VERSION, build: 'dev', builtAt: '' };
  try { info = { ...info, ...JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '..', 'dist', 'version.json'), 'utf8')) }; } catch { /* χωρίς build */ }
  res.set('Cache-Control', 'no-store').json({ ...info, serverStartedAt: startedAt });
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
app.post('/api/entities/stream-ticket', requireAdmin, (req, res) => res.json({ ticket: issueStreamTicket(req.user.id) }));
app.use('/api/entities', entityRoutes());
app.use('/api/functions', functionRoutes());
app.use('/api/media', mediaRoutes());
app.use('/api/push', pushRoutes());
app.use('/api/visits', visitRoutes());
app.use('/media', mediaStatic);
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
  const SITE_DESC = 'DEAL OF TEMPTATIONS — THE PRIVATE REALITY GAME NIGHT. Ιδιωτική βιωματική Reality Show εμπειρία με παιχνίδια, σκηνοθεσία, ήχο, εικόνα και προαιρετικό recap. 18+.';
  const PAGES = {
    '/site': { title: 'DEAL OF TEMPTATIONS — THE PRIVATE REALITY GAME NIGHT', desc: SITE_DESC, index: true },
    '/portal': { title: 'DEAL OF TEMPTATIONS — Πληροφορίες Event', desc: 'Ημερομηνία, τοποθεσία και πρακτικές πληροφορίες της εκδήλωσης.' },
    '/promo': { title: 'DEAL OF TEMPTATIONS — Trailer', desc: SITE_DESC, index: true },
    '/gift-unlock': { title: 'DEAL OF TEMPTATIONS — Ξεκλείδωσε το δώρο σου', desc: 'Βάλε τον κωδικό σου και ξεκλείδωσε το δώρο.' },
    '/play': { title: 'DT Play — Deal of Temptation', desc: 'Το κινητό σου στο παιχνίδι.' },
    '/forms': { title: 'DEAL OF TEMPTATIONS — Φόρμα συμμετοχής', desc: 'Ενιαία φόρμα επιλογής Mode και υποβολής συμμετοχής.' },
  };
  const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const renderIndex = (req) => {
    const origin = (process.env.PUBLIC_URL || `${req.headers['x-forwarded-proto'] || req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    const route = req.path.replace(/\/+$/, '') || '/';
    const meta = PAGES[route] || { title: 'Deal of Temptation', desc: SITE_DESC };
    const indexable = !!meta.index;
    return currentIndex()
      .replace('<title>DEAL OF TEMPTATIONS</title>', `<title>${esc(meta.title)}</title>`)
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
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = Number(process.env.PORT) || 3000;
await migrate();
const server = app.listen(port, '0.0.0.0', () => console.log(`Server listening on :${port}`));
// Μεγάλα βίντεο από κινητό/αργό δίκτυο: το προεπιλεγμένο requestTimeout του Node (5′) διέκοπτε το ανέβασμα.
server.requestTimeout = 30 * 60 * 1000;
server.headersTimeout = 65 * 1000;
server.keepAliveTimeout = 65 * 1000;
startAutoBackup();

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => server.close(() => pool.end().then(() => process.exit(0))));
}
