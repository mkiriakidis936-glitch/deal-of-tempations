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
    DELETE FROM records WHERE entity IN ('GameSessionEvent', 'PlayerCheckin');
    CREATE TABLE IF NOT EXISTS server_secrets (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      endpoint     TEXT PRIMARY KEY,
      user_id      TEXT,
      subscription JSONB NOT NULL,
      device       TEXT,
      created_date TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS session_code TEXT;
    ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS player_id TEXT;
    CREATE INDEX IF NOT EXISTS push_subscriptions_player_idx ON push_subscriptions (session_code, player_id);
    CREATE TABLE IF NOT EXISTS notifications (
      id           BIGSERIAL PRIMARY KEY,
      title        TEXT NOT NULL,
      body         TEXT,
      url          TEXT,
      created_date TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS page_views (
      id           BIGSERIAL PRIMARY KEY,
      visitor      TEXT NOT NULL,
      path         TEXT NOT NULL,
      ref          TEXT,
      created_date TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS page_views_path_created_idx ON page_views (path, created_date DESC);
  `);
}
