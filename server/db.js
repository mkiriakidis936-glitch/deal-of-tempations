import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. On Railway: add a PostgreSQL service and reference its DATABASE_URL variable.');
  process.exit(1);
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Railway's internal network doesn't need SSL; the public proxy URL does.
  ssl: /railway\.internal|localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL) ? false : { rejectUnauthorized: false },
});

export const query = (text, params) => pool.query(text, params);

// Runs on every boot; all statements are idempotent.
export async function migrate() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      role          TEXT NOT NULL DEFAULT 'user',
      google_id     TEXT,
      reset_token_hash TEXT,
      reset_expires    TIMESTAMPTZ,
      created_date  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS records (
      id           TEXT PRIMARY KEY,
      entity       TEXT NOT NULL,
      data         JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_by   TEXT,
      created_date TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_date TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS records_entity_created_idx ON records (entity, created_date DESC);
    CREATE INDEX IF NOT EXISTS records_data_gin_idx ON records USING GIN (data jsonb_path_ops);
  `);
}
