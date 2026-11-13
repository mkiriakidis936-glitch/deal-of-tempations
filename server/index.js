import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { migrate, pool } from './db.js';
import { attachUser, authRoutes } from './auth.js';
import { entityRoutes } from './entities.js';
import { functionRoutes } from './functions.js';
import { mediaRoutes, mediaStatic } from './media.js';
import { pushRoutes } from './push.js';
import { visitRoutes } from './visits.js';
import { backupRoutes, startAutoBackup } from './backup.js';

const app = express();
app.set('trust proxy', 1); // Railway terminates TLS in front of us
// πριν από τον γενικό parser των 2MB: τα αντίγραφα ασφαλείας έχουν δικό τους, μεγαλύτερο όριο
app.use('/api/backup', attachUser, backupRoutes());
app.use(express.json({ limit: '2mb' }));
app.use(attachUser);

app.get('/api/health', (_req, res) => res.json({ ok: true }));
authRoutes(app);
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
  app.use(express.static(dist, {
    index: false,
    maxAge: '1h',
    // το service worker και το manifest δεν πρέπει να μένουν σε cache, αλλιώς δεν ενημερώνεται η εφαρμογή
    setHeaders: (res, file) => { if (/(^|[\\/])(sw\.js|manifest\.webmanifest)$/.test(file)) res.setHeader('Cache-Control', 'no-cache'); },
  }));
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    res.sendFile(path.join(dist, 'index.html'));
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
startAutoBackup();

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => server.close(() => pool.end().then(() => process.exit(0))));
}
