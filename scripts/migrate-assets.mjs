// Migrate Base44-hosted media in source files AND PostgreSQL records.
// Run with DATABASE_URL set to include stored profile/gallery/event URLs:
//   DATABASE_URL="..." node scripts/migrate-assets.mjs
// Assets are content-addressed to prevent basename collisions.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';

const { Pool } = pg;
const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public', 'assets');
const HOSTS = /https?:\/\/(?:base44\.app|media\.base44\.com)\/[^'"\x60\s)<>]+/g;
const CONTENT_EXT = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp',
  'image/gif': '.gif', 'image/avif': '.avif', 'video/mp4': '.mp4',
  'video/webm': '.webm', 'video/quicktime': '.mov',
};

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else if (/\.(jsx?|tsx?|html|css)$/.test(e.name)) out.push(p);
  }
  return out;
}

function collectUrls(value, urls) {
  if (typeof value === 'string') {
    for (const match of value.match(HOSTS) || []) urls.add(match.replace(/[.,;]+$/, ''));
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectUrls(item, urls));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectUrls(item, urls));
  }
}

function replaceUrls(value, mapping) {
  if (typeof value === 'string') {
    let next = value;
    for (const [url, local] of mapping) next = next.split(url).join(local);
    return next;
  }
  if (Array.isArray(value)) return value.map((item) => replaceUrls(item, mapping));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceUrls(item, mapping)]));
  }
  return value;
}

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: /railway\.internal|localhost|127\.0\.1/.test(process.env.DATABASE_URL) ? false : { rejectUnauthorized: false },
    })
  : null;

try {
  const files = [...await walk(path.join(ROOT, 'src')), path.join(ROOT, 'index.html')];
  const contents = new Map();
  const urls = new Set();

  for (const file of files) {
    const source = await fs.readFile(file, 'utf8');
    contents.set(file, source);
    collectUrls(source, urls);

    // brandArt.js builds URLs as `${BASE}file.jpeg`.
    const base = source.match(/const BASE = '(https?:\/\/[^']+\/)'/);
    if (base) {
      for (const match of source.matchAll(/\$\{BASE\}([^\x60'"\s]+)/g)) {
        urls.add(base[1] + match[1]);
      }
    }
  }

  let dbRows = [];
  if (pool) {
    const result = await pool.query(
      "SELECT id, data FROM records WHERE data::text LIKE ANY($1::text[])",
      [['%base44.app%', '%media.base44.com%']],
    );
    dbRows = result.rows;
    dbRows.forEach((row) => collectUrls(row.data, urls));
    console.log(`Found ${dbRows.length} database record(s) containing Base44 media references.`);
  } else {
    console.warn('DATABASE_URL is not set: database-stored media references will NOT be scanned.');
  }

  if (!urls.size) {
    console.log('Nothing to migrate: no Base44-hosted media references found.');
    process.exitCode = 0;
  } else {
    await fs.mkdir(OUT, { recursive: true });
    const mapping = new Map();
    let failed = 0;

    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const bytes = Buffer.from(await response.arrayBuffer());
        if (!bytes.length) throw new Error('Empty response');

        const parsed = new URL(url);
        const ext = path.extname(parsed.pathname).toLowerCase() || CONTENT_EXT[(response.headers.get('content-type') || '').split(';')[0].trim()] || '.bin';
        const digest = crypto.createHash('sha256').update(bytes).digest('hex');
        const name = `${digest}${ext}`;
        const destination = path.join(OUT, name);

        if (!await fs.access(destination).then(() => true, () => false)) {
          const temporary = `${destination}.part`;
          await fs.writeFile(temporary, bytes);
          await fs.rename(temporary, destination);
        }
        mapping.set(url, `/assets/${name}`);
        console.log('✓', name);
      } catch (error) {
        failed += 1;
        console.error('✗', url, '-', error.message);
      }
    }

    if (failed) {
      throw new Error(`${failed} media file(s) failed to migrate. Database records and source files were left unchanged; fix the failures and run again.`);
    }

    // Update JSONB records atomically after every asset has been downloaded.
    if (pool && dbRows.length) {
      const updates = dbRows
        .map((row) => ({ id: row.id, data: replaceUrls(row.data, mapping) }))
        .filter((row, index) => JSON.stringify(row.data) !== JSON.stringify(dbRows[index].data));
      if (updates.length) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          for (const row of updates) {
            await client.query('UPDATE records SET data = $1::jsonb, updated_date = now() WHERE id = $2', [JSON.stringify(row.data), row.id]);
          }
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
        console.log(`Updated ${updates.length} database record(s).`);
      }
    }

    // Rewrite source files only after all downloads and database updates succeed.
    const ordered = [...mapping.entries()].sort((a, b) => b[0].length - a[0].length);
    for (const [file, original] of contents) {
      let source = original;
      for (const [url, local] of ordered) source = source.split(url).join(local);
      source = source.replace(/const BASE = 'https?:\/\/[^']+\//, "const BASE = '/assets/");
      if (source !== original) {
        await fs.writeFile(file, source);
        console.log('rewrote', path.relative(ROOT, file));
      }
    }

    console.log(`Done: ${mapping.size} unique media URL(s) migrated to content-addressed files in public/assets.`);
  }
} finally {
  await pool?.end();
}
