import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import express from 'express';
import { requireAdmin } from './auth.js';

// Railway: prefer the mounted Volume path so uploads survive deployments.
const volumeRoot = process.env.RAILWAY_VOLUME_MOUNT_PATH;
const defaultUploadDir = volumeRoot ? path.join(volumeRoot, 'uploads') : path.join(import.meta.dirname, '..', 'uploads');
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || defaultUploadDir);
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
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  }),
  (_req, res) => res.status(404).end(),
];

export function mediaRoutes() {
  const r = express.Router();

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

  return r;
}
