import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { createReadStream, createWriteStream } from 'node:fs';
import { createGzip, createGunzip } from 'node:zlib';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import express from 'express';
import { pool, query } from './db.js';
import { requireAdmin } from './auth.js';
import { ENTITIES } from './entities.js';
import { UPLOAD_DIR } from './media.js';

// Αντίγραφα ασφαλείας του περιεχομένου (πίνακας `records`: παιχνίδι, φόρμες, site, κάρτες...).
// Δεν περιλαμβάνονται λογαριασμοί/κωδικοί (users) ούτε τα ίδια τα αρχεία φωτογραφιών: αυτά μένουν στο Volume.
// Στο Railway: δίπλα στο /data/uploads δημιουργείται το /data/backups, άρα επιβιώνει σε κάθε deploy.
export const BACKUP_DIR = path.join(path.dirname(UPLOAD_DIR), 'backups');
fs.mkdirSync(BACKUP_DIR, { recursive: true });

const NAME_RE = /^[A-Za-z0-9._-]+\.json$/;
const KEEP = { auto: 14, manual: 20, 'pre-restore': 5 };

const MEDIA_KEEP = 3;
const MEDIA_MAX_TOTAL = 2 * 1024 * 1024 * 1024;
const MEDIA_MAX_FILE = 300 * 1024 * 1024;
const mediaNameIsSafe = (name) => /^[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp|gif|avif|mp4|webm|mov)$/i.test(name);
const writeText = (buffer, value, offset, length) => buffer.write(String(value), offset, length, 'utf8');
const writeOctal = (buffer, value, offset, length) => buffer.write(String(Math.max(0, value).toString(8).padStart(length - 1, '0')) + '\0', offset, length, 'ascii');

function tarHeader(name, size, mtime) {
  const header = Buffer.alloc(512);
  writeText(header, name, 0, 100);
  writeOctal(header, 0o644, 100, 8);
  writeOctal(header, 0, 108, 8);
  writeOctal(header, 0, 116, 8);
  writeOctal(header, size, 124, 12);
  writeOctal(header, Math.floor(mtime / 1000), 136, 12);
  header.fill(0x20, 148, 156);
  header[156] = 0x30;
  writeText(header, 'ustar\0', 257, 6);
  writeText(header, '00', 263, 2);
  let checksum = 0;
  for (const byte of header) checksum += byte;
  writeText(header, checksum.toString(8).padStart(6, '0') + '\0 ', 148, 8);
  return header;
}

async function* mediaTarStream() {
  const names = (await fsp.readdir(UPLOAD_DIR)).filter(mediaNameIsSafe).sort();
  for (const name of names) {
    const file = path.join(UPLOAD_DIR, name);
    const stat = await fsp.stat(file);
    if (!stat.isFile()) continue;
    yield tarHeader(name, stat.size, stat.mtimeMs);
    for await (const chunk of createReadStream(file)) yield chunk;
    const padding = (512 - (stat.size % 512)) % 512;
    if (padding) yield Buffer.alloc(padding);
  }
  yield Buffer.alloc(1024);
}

async function saveMediaPreRestore() {
  const target = path.join(BACKUP_DIR, 'media-pre-restore-' + stamp());
  await fsp.cp(UPLOAD_DIR, target, { recursive: true });
  const dirs = (await fsp.readdir(BACKUP_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('media-pre-restore-'))
    .map((entry) => entry.name).sort();
  await Promise.all(dirs.slice(0, Math.max(0, dirs.length - MEDIA_KEEP)).map((name) => fsp.rm(path.join(BACKUP_DIR, name), { recursive: true, force: true })));
}

async function restoreMediaArchive(req) {
  const tempTar = path.join(BACKUP_DIR, '.media-restore-' + Date.now() + '.tar');
  let total = 0;
  const limiter = new Transform({
    transform(chunk, _encoding, callback) {
      total += chunk.length;
      if (total > MEDIA_MAX_TOTAL) callback(new Error('Το αρχείο πολυμέσων ξεπερνά το όριο των 2 GB.'));
      else callback(null, chunk);
    },
  });
  try {
    await pipeline(req, createGunzip(), limiter, createWriteStream(tempTar, { flags: 'wx' }));
    const handle = await fsp.open(tempTar, 'r');
    try {
      const stat = await handle.stat();
      const entries = [];
      let offset = 0;
      while (offset + 512 <= stat.size) {
        const header = Buffer.alloc(512);
        const result = await handle.read(header, 0, 512, offset);
        if (result.bytesRead !== 512 || header.every((byte) => byte === 0)) break;
        const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
        const sizeText = header.subarray(124, 136).toString('ascii').replace(/\0.*$/, '').trim();
        const size = Number.parseInt(sizeText || '0', 8);
        const type = String.fromCharCode(header[156] || 48);
        if (!mediaNameIsSafe(name) || !Number.isSafeInteger(size) || size < 0 || size > MEDIA_MAX_FILE || (type !== '0' && type !== '\0')) {
          throw Object.assign(new Error('Το αρχείο περιέχει μη έγκυρη εγγραφή πολυμέσου. Δεν έγινε επαναφορά.'), { status: 400 });
        }
        const dataOffset = offset + 512;
        if (dataOffset + size > stat.size) throw Object.assign(new Error('Το αρχείο πολυμέσων είναι κατεστραμμένο.'), { status: 400 });
        entries.push({ name, size, dataOffset });
        offset = dataOffset + Math.ceil(size / 512) * 512;
      }
      if (!entries.length) throw Object.assign(new Error('Το αρχείο δεν περιέχει φωτογραφίες ή βίντεο.'), { status: 400 });
      await saveMediaPreRestore();
      for (const entry of entries) {
        const temp = path.join(UPLOAD_DIR, '.' + entry.name + '.restore.part');
        await pipeline(createReadStream(tempTar, { start: entry.dataOffset, end: entry.dataOffset + entry.size - 1 }), createWriteStream(temp, { flags: 'w' }));
        await fsp.rename(temp, path.join(UPLOAD_DIR, entry.name));
      }
      return { restored: entries.length, bytes: entries.reduce((sum, entry) => sum + entry.size, 0) };
    } finally { await handle.close(); }
  } finally { await fsp.rm(tempTar, { force: true }); }
}


const stamp = () => new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);

export async function buildBackup() {
  const { rows } = await query(
    'SELECT id, entity, data, created_by, created_date, updated_date FROM records WHERE entity = ANY($1) ORDER BY entity, created_date',
    [ENTITIES],
  );
  const counts = {};
  rows.forEach((r) => { counts[r.entity] = (counts[r.entity] || 0) + 1; });
  return { app: 'deal-of-temptation', version: 1, exportedAt: new Date().toISOString(), counts, records: rows };
}

async function prune(kind) {
  const files = (await fsp.readdir(BACKUP_DIR)).filter((n) => n.startsWith(`${kind}-`) && NAME_RE.test(n)).sort();
  const extra = files.slice(0, Math.max(0, files.length - KEEP[kind]));
  await Promise.all(extra.map((n) => fsp.rm(path.join(BACKUP_DIR, n), { force: true })));
}

export async function saveBackup(kind) {
  const data = await buildBackup();
  const name = `${kind}-${stamp()}.json`;
  const tmp = path.join(BACKUP_DIR, `.${name}.part`);
  await fsp.writeFile(tmp, JSON.stringify(data));
  await fsp.rename(tmp, path.join(BACKUP_DIR, name));
  await prune(kind);
  return { name, counts: data.counts, records: data.records.length };
}

function validate(data) {
  if (!data || data.app !== 'deal-of-temptation' || data.version !== 1 || !Array.isArray(data.records)) {
    throw Object.assign(new Error('Το αρχείο δεν είναι έγκυρο αντίγραφο του Deal of Temptation.'), { status: 400 });
  }
  for (const r of data.records) {
    if (!r || typeof r.id !== 'string' || !r.id || r.id.length > 100 || !ENTITIES.includes(r.entity) || typeof r.data !== 'object' || r.data === null) {
      throw Object.assign(new Error('Το αρχείο περιέχει μη έγκυρες εγγραφές. Δεν έγινε καμία αλλαγή.'), { status: 400 });
    }
  }
}

// merge   : προσθέτει ό,τι λείπει και επαναφέρει τις τιμές των εγγραφών του αρχείου (δεν σβήνει νεότερες εγγραφές).
// replace : για κάθε είδος δεδομένων του αρχείου, η βάση γίνεται ακριβώς όπως ήταν τότε.
export async function restoreBackup(data, mode) {
  validate(data);
  await saveBackup('pre-restore'); // δίχτυ ασφαλείας: η επαναφορά αναιρείται
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (mode === 'replace') {
      const entities = [...new Set(data.records.map((r) => r.entity))];
      await client.query('DELETE FROM records WHERE entity = ANY($1)', [entities]);
    }
    for (let i = 0; i < data.records.length; i += 500) {
      const chunk = data.records.slice(i, i + 500).map((r) => ({
        id: r.id, entity: r.entity, data: r.data, created_by: r.created_by || null,
        created_date: r.created_date || null, updated_date: r.updated_date || null,
      }));
      await client.query(
        `INSERT INTO records (id, entity, data, created_by, created_date, updated_date)
         SELECT x.id, x.entity, x.data, x.created_by, COALESCE(x.created_date, now()), COALESCE(x.updated_date, x.created_date, now())
         FROM jsonb_to_recordset($1::jsonb) AS x(id text, entity text, data jsonb, created_by text, created_date timestamptz, updated_date timestamptz)
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_date = EXCLUDED.updated_date`,
        [JSON.stringify(chunk)],
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  return { restored: data.records.length, mode };
}

export function startAutoBackup() {
  const run = () => saveBackup('auto').catch((e) => console.error('[backup] auto backup failed', e));
  setTimeout(run, 30 * 1000).unref();
  setInterval(run, 24 * 60 * 60 * 1000).unref();
}

export function backupRoutes() {
  const r = express.Router();
  r.use(requireAdmin);
  r.use(express.json({ limit: '200mb' }));
  const modeOf = (req) => (req.query.mode === 'replace' ? 'replace' : 'merge');

  r.get('/export', async (_req, res) => {
    const data = await buildBackup();
    res.setHeader('Content-Disposition', `attachment; filename="deal-of-temptation-backup-${stamp()}.json"`);
    res.json(data);
  });
  r.get('/media/export', async (_req, res, next) => {
    try {
      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('Content-Disposition', 'attachment; filename="deal-of-temptation-media-' + stamp() + '.tar.gz"');
      await pipeline(Readable.from(mediaTarStream()), createGzip(), res);
    } catch (error) { next(error); }
  });

  r.post('/media/restore', async (req, res, next) => {
    try {
      const result = await restoreMediaArchive(req);
      res.json({ success: true, ...result, preRestoreSaved: true });
    } catch (error) { next(error); }
  });

  r.get('/list', async (_req, res) => {
    const names = (await fsp.readdir(BACKUP_DIR)).filter((n) => NAME_RE.test(n));
    const items = await Promise.all(names.map(async (n) => {
      const st = await fsp.stat(path.join(BACKUP_DIR, n));
      return { name: n, kind: n.split('-')[0], size: st.size, modified: st.mtimeMs };
    }));
    items.sort((a, b) => b.modified - a.modified);
    res.json({ items });
  });

  r.post('/now', async (_req, res) => { res.json({ success: true, ...(await saveBackup('manual')) }); });

  r.get('/file/:name', (req, res) => {
    if (!NAME_RE.test(req.params.name) || req.params.name.startsWith('.')) return res.status(400).json({ error: 'Μη έγκυρο όνομα' });
    res.download(path.join(BACKUP_DIR, req.params.name));
  });

  r.post('/restore', async (req, res) => { res.json({ success: true, ...(await restoreBackup(req.body, modeOf(req))) }); });

  r.post('/restore-file/:name', async (req, res) => {
    if (!NAME_RE.test(req.params.name) || req.params.name.startsWith('.')) return res.status(400).json({ error: 'Μη έγκυρο όνομα' });
    const data = JSON.parse(await fsp.readFile(path.join(BACKUP_DIR, req.params.name), 'utf8'));
    res.json({ success: true, ...(await restoreBackup(data, modeOf(req))) });
  });

  // eslint-disable-next-line no-unused-vars
  r.use((err, _req, res, _next) => {
    console.error('[backup]', err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Σφάλμα στο αντίγραφο ασφαλείας.' });
  });
  return r;
}
