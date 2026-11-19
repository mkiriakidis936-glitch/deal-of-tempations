import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import express from 'express';
import { requireAdmin } from './auth.js';
import { query } from './db.js';

// Railway: prefer the mounted Volume path so uploads survive deployments.
const volumeRoot = process.env.RAILWAY_VOLUME_MOUNT_PATH;
const defaultUploadDir = volumeRoot ? path.join(volumeRoot, 'uploads') : path.join(import.meta.dirname, '..', 'uploads');
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || defaultUploadDir);
const PRIVATE_UPLOAD_DIR = path.join(UPLOAD_DIR, '.private');
fs.mkdirSync(PRIVATE_UPLOAD_DIR, { recursive: true });
const MAX_MB = Number(process.env.MAX_UPLOAD_MB) || 300;
const MAX_BYTES = MAX_MB * 1024 * 1024;
const KINDS = {
  '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.webp': 'image', '.gif': 'image', '.avif': 'image', '.svg': 'graphic',
  '.mp4': 'video', '.webm': 'video', '.mov': 'video',
  '.mp3': 'audio', '.wav': 'audio', '.ogg': 'audio', '.m4a': 'audio', '.aac': 'audio',
};
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const slugOf = (base) => base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'file';
const kindOf = (name) => KINDS[path.extname(name).toLowerCase()];

// Δημόσιο: σερβίρει τα αρχεία (Range requests για seek στα βίντεο). Τα ονόματα είναι μοναδικά => μόνιμο cache.
export const mediaStatic = [
  express.static(UPLOAD_DIR, {
    index: false,
    dotfiles: 'ignore',
    maxAge: '30d',
    immutable: true,
    setHeaders: (res, file) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (path.basename(file).startsWith('published-')) res.setHeader('Cache-Control', 'no-store, max-age=0');
    },
  }),
  (_req, res) => res.status(404).end(),
];

export function mediaRoutes() {
  const r = express.Router();

  // Public feedback photo upload: image-only, strict size limit, random filename.
  const publicUploads = new Map();
  r.post('/public-image', async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const nowTs = Date.now();
    let bucket = publicUploads.get(ip);
    if (!bucket || nowTs - bucket.startedAt >= 3600_000) { bucket = { startedAt: nowTs, count: 0 }; publicUploads.set(ip, bucket); }
    if (bucket.count >= 20) return res.status(429).json({ error: 'Πολλά ανεβάσματα. Δοκίμασε ξανά αργότερα.' });
    bucket.count += 1;
    if (publicUploads.size > 5000) for (const [k, v] of publicUploads) if (nowTs - v.startedAt >= 3600_000) publicUploads.delete(k);
    const original = path.basename(String(req.query.name || 'photo'));
    const ext = path.extname(original).toLowerCase();
    const allowed = new Set(['.jpg', '.jpeg', '.png', '.webp']);
    if (!allowed.has(ext)) return res.status(415).json({ error: 'Επιτρέπονται μόνο JPG, PNG και WEBP.' });
    const limit = 8 * 1024 * 1024;
    if (Number(req.headers['content-length'] || 0) > limit) return res.status(413).json({ error: 'Η φωτογραφία πρέπει να είναι έως 8MB.' });
    const name = `public-${Date.now().toString(36)}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    const tmp = path.join(UPLOAD_DIR, `.${name}.part`);
    let size = 0;
    const counter = new Transform({ transform(chunk, _enc, cb) { size += chunk.length; size > limit ? cb(new Error('TOO_BIG')) : cb(null, chunk); } });
    try {
      await pipeline(req, counter, fs.createWriteStream(tmp));
      if (!size) throw new Error('EMPTY');
      // το περιεχόμενο πρέπει να είναι πραγματικά εικόνα (όχι απλώς όνομα .jpg)
      const fh = await fsp.open(tmp, 'r');
      const head = Buffer.alloc(12);
      await fh.read(head, 0, 12, 0);
      await fh.close();
      const isJpg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
      const isPng = head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
      const isWebp = head.subarray(0, 4).toString() === 'RIFF' && head.subarray(8, 12).toString() === 'WEBP';
      if (!(isJpg || isPng || isWebp)) throw new Error('BAD_TYPE');
      await fsp.rename(tmp, path.join(UPLOAD_DIR, name));
      return res.json({ url: `/media/${name}`, name, size, kind: 'image' });
    } catch (e) {
      await fsp.rm(tmp, { force: true });
      if (e.message === 'TOO_BIG') return res.status(413).json({ error: 'Η φωτογραφία πρέπει να είναι έως 8MB.' });
      if (e.message === 'BAD_TYPE') return res.status(415).json({ error: 'Το αρχείο δεν είναι έγκυρη εικόνα.' });
      if (e.message === 'EMPTY') return res.status(400).json({ error: 'Το αρχείο είναι κενό.' });
      return res.status(400).json({ error: 'Η μεταφόρτωση απέτυχε.' });
    }
  });

  // POST /api/media/upload?name=photo.jpg  — raw body (octet-stream), μόνο admin
  r.post('/upload', requireAdmin, async (req, res) => {
    const original = path.basename(String(req.query.name || ''));
    const ext = path.extname(original).toLowerCase();
    const kind = KINDS[ext];
    if (!kind) return res.status(415).json({ error: 'Μη υποστηριζόμενος τύπος. Επιτρέπονται: JPG, PNG, WEBP, GIF, AVIF, SVG, MP4, WEBM, MOV, MP3, WAV, OGG, M4A, AAC.' });
    if (Number(req.headers['content-length'] || 0) > MAX_BYTES) return res.status(413).json({ error: `Το αρχείο ξεπερνά τα ${MAX_MB}MB.` });

    const name = `${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}-${slugOf(path.basename(original, ext))}${ext}`;
    const tmp = path.join(UPLOAD_DIR, `.${name}.part`);
    let size = 0;
    const counter = new Transform({
      transform(chunk, _enc, cb) {
        size += chunk.length;
        size > MAX_BYTES ? cb(new Error('TOO_BIG')) : cb(null, chunk);
      },
    });
    try {
      await pipeline(req, counter, fs.createWriteStream(tmp));
      if (!size) throw new Error('EMPTY');
      await fsp.rename(tmp, path.join(UPLOAD_DIR, name));
    } catch (e) {
      await fsp.rm(tmp, { force: true });
      if (res.headersSent) return;
      if (e.message === 'TOO_BIG') return res.status(413).json({ error: `Το αρχείο ξεπερνά τα ${MAX_MB}MB.` });
      if (e.message === 'EMPTY') return res.status(400).json({ error: 'Κενό αρχείο.' });
      return res.status(400).json({ error: 'Η μεταφόρτωση διακόπηκε. Δοκίμασε ξανά.' });
    }
    res.json({ url: `/media/${name}`, name, size, kind });
  });

  // GET /api/media — βιβλιοθήκη
  r.get('/', requireAdmin, async (_req, res) => {
    const names = (await fsp.readdir(UPLOAD_DIR)).filter((n) => !n.startsWith('.') && kindOf(n));
    const items = await Promise.all(names.map(async (n) => {
      const st = await fsp.stat(path.join(UPLOAD_DIR, n));
      return { name: n, url: `/media/${n}`, size: st.size, kind: kindOf(n), modified: st.mtimeMs };
    }));
    items.sort((a, b) => b.modified - a.modified);
    res.json({ items });
  });

  // DELETE /api/media?kind=image|video|all — μαζική διαγραφή, μόνο admin
  r.delete('/', requireAdmin, async (req, res) => {
    const kind = String(req.query.kind || 'all');
    if (!['image', 'video', 'audio', 'graphic', 'all'].includes(kind)) return res.status(400).json({ error: 'Μη έγκυρος τύπος διαγραφής.' });
    const names = (await fsp.readdir(UPLOAD_DIR)).filter((n) => !n.startsWith('.') && kindOf(n) && (kind === 'all' || kindOf(n) === kind));
    const results = await Promise.all(names.map((n) => fsp.rm(path.join(UPLOAD_DIR, n), { force: true })));
    res.json({ success: true, deleted: names.length, kind });
  });

  // DELETE /api/media/:name
  r.delete('/:name', requireAdmin, async (req, res) => {
    const n = req.params.name;
    if (!/^[A-Za-z0-9._-]+$/.test(n) || n.startsWith('.') || !kindOf(n)) return res.status(400).json({ error: 'Μη έγκυρο όνομα' });
    await fsp.rm(path.join(UPLOAD_DIR, n), { force: true });
    res.json({ success: true });
  });


  // Private production media: never exposed by the public /media static route.
  r.post('/private-upload', requireAdmin, async (req, res) => {
    const original = path.basename(String(req.query.name || ''));
    const ext = path.extname(original).toLowerCase();
    const kind = KINDS[ext];
    if (!kind) return res.status(415).json({ error: 'Μη υποστηριζόμενος τύπος αρχείου.' });
    if (Number(req.headers['content-length'] || 0) > MAX_BYTES) return res.status(413).json({ error: `Το αρχείο ξεπερνά τα ${MAX_MB}MB.` });
    const name = `private-${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const tmp = path.join(PRIVATE_UPLOAD_DIR, `.${name}.part`);
    let size = 0;
    const counter = new Transform({ transform(chunk, _enc, cb) { size += chunk.length; size > MAX_BYTES ? cb(new Error('TOO_BIG')) : cb(null, chunk); } });
    try {
      await pipeline(req, counter, fs.createWriteStream(tmp));
      if (!size) throw new Error('EMPTY');
      await fsp.rename(tmp, path.join(PRIVATE_UPLOAD_DIR, name));
      return res.json({ name, size, kind, private: true });
    } catch (error) {
      await fsp.rm(tmp, { force: true });
      if (error.message === 'TOO_BIG') return res.status(413).json({ error: `Το αρχείο ξεπερνά τα ${MAX_MB}MB.` });
      if (error.message === 'EMPTY') return res.status(400).json({ error: 'Κενό αρχείο.' });
      return res.status(400).json({ error: 'Η ιδιωτική μεταφόρτωση απέτυχε.' });
    }
  });

  // Publish a private recap asset only after the latest consent from every depicted participant allows public use.
  r.post('/publish-private', requireAdmin, async (req, res) => {
    const name = String(req.body?.name || '');
    const sessionCode = String(req.body?.sessionCode || '').trim().toUpperCase();
    const participants = Array.isArray(req.body?.participants) ? [...new Set(req.body.participants.map(value => String(value || '').trim()).filter(Boolean))] : [];
    if (!/^[A-Za-z0-9._-]+$/.test(name) || name.startsWith('.') || !name.startsWith('private-') || !kindOf(name)) {
      return res.status(400).json({ error: 'Μη έγκυρο ιδιωτικό αρχείο.' });
    }
    if (!sessionCode || !participants.length) return res.status(400).json({ error: 'Λείπουν τα στοιχεία διοργάνωσης ή συμμετεχόντων.' });
    const privateFile = path.join(PRIVATE_UPLOAD_DIR, name);
    if (!fs.existsSync(privateFile)) return res.status(404).json({ error: 'Το ιδιωτικό αρχείο δεν βρέθηκε.' });
    const { rows } = await query(
      "SELECT data FROM records WHERE entity = 'ProductionConsent' AND data->>'sessionCode' = $1 ORDER BY created_date DESC",
      [sessionCode]
    );
    const latest = new Map();
    for (const row of rows) {
      const consent = row.data || {};
      const key = String(consent.participantName || '').trim().toLocaleLowerCase('el-GR');
      if (key && !latest.has(key)) latest.set(key, consent);
    }
    const missing = participants.filter(participant => {
      const consent = latest.get(participant.toLocaleLowerCase('el-GR'));
      return !consent || consent.withdrawn === true || consent.adultConfirmed !== true || consent.recordingConsent !== true || consent.publicUseConsent !== true;
    });
    if (missing.length) return res.status(403).json({ error: 'Η δημόσια δημοσίευση δεν επιτρέπεται: λείπει ενεργή συγκατάθεση καταγραφής και δημόσιας χρήσης για όλους τους συμμετέχοντες.' });
    const ext = path.extname(name).toLowerCase();
    const publicName = `published-${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    await fsp.copyFile(privateFile, path.join(UPLOAD_DIR, publicName));
    return res.json({ name: publicName, url: `/media/${publicName}`, kind: kindOf(publicName), public: true });
  });

  r.get('/private/:name', requireAdmin, async (req, res) => {
    const name = req.params.name;
    if (!/^[A-Za-z0-9._-]+$/.test(name) || name.startsWith('.')) return res.status(400).json({ error: 'Μη έγκυρο όνομα αρχείου.' });
    const file = path.join(PRIVATE_UPLOAD_DIR, name);
    if (!fs.existsSync(file) || !kindOf(name)) return res.status(404).json({ error: 'Το αρχείο δεν βρέθηκε.' });
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.sendFile(file);
  });

  r.delete('/private/:name', requireAdmin, async (req, res) => {
    const name = req.params.name;
    if (!/^[A-Za-z0-9._-]+$/.test(name) || name.startsWith('.') || !kindOf(name)) return res.status(400).json({ error: 'Μη έγκυρο όνομα αρχείου.' });
    await fsp.rm(path.join(PRIVATE_UPLOAD_DIR, name), { force: true });
    return res.json({ success: true });
  });

  return r;
}
