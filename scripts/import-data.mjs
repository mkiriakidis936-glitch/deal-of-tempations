// Imports data exported from Base44 into the new Postgres database.
//
//   1. Put one JSON file per entity in ./data-export/  (e.g. data-export/PlayerIntake.json,
//      each file = an array of records, or { "items": [...] })
//   2. DATABASE_URL=postgres://... node scripts/import-data.mjs
//
// Original ids and created/updated dates are kept. Safe to re-run (existing ids are skipped).
import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const dir = path.resolve(import.meta.dirname, '..', 'data-export');
if (!process.env.DATABASE_URL) { console.error('Set DATABASE_URL first.'); process.exit(1); }

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: /railway\.internal|localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL) ? false : { rejectUnauthorized: false },
});

// make sure the tables exist (same DDL the server runs on boot)
const { migrate } = await import('../server/db.js');
await migrate();

const KNOWN = ['Achievement', 'AppSetting', 'BacheloretteIntake', 'BlackmailVault', 'Chronicle', 'GameContent', 'GameSession',
  'Haunting', 'InvitationRSVP', 'Memorial', 'PajamaContent', 'PajamaIntake', 'PlayerIntake', 'PlayerProfile', 'SessionArchive'];

let total = 0;
for (const file of await fs.readdir(dir)) {
  if (!file.endsWith('.json')) continue;
  const entity = file.replace(/\.json$/, '');
  if (!KNOWN.includes(entity)) { console.warn(`skip ${file}: unknown entity`); continue; }
  const raw = JSON.parse(await fs.readFile(path.join(dir, file), 'utf8'));
  const list = Array.isArray(raw) ? raw : raw.items || raw.data || [];
  let n = 0;
  for (const rec of list) {
    const { id, _id, created_date, updated_date, created_by, created_by_id, is_sample, app_id, ...data } = rec;
    const rid = String(id || _id || crypto.randomUUID());
    const r = await pool.query(
      `INSERT INTO records (id, entity, data, created_by, created_date, updated_date)
       VALUES ($1,$2,$3,$4,COALESCE($5::timestamptz, now()),COALESCE($6::timestamptz, $5::timestamptz, now()))
       ON CONFLICT (id) DO NOTHING`,
      [rid, entity, data, created_by || null, created_date || null, updated_date || null],
    );
    n += r.rowCount;
  }
  total += n;
  console.log(`${entity}: ${n}/${list.length} imported`);
}
console.log(`Done, ${total} records.`);
await pool.end();
process.exit(0);
