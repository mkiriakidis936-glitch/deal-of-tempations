import express from 'express';
import { query } from './db.js';
import { requireAdmin } from './auth.js';

const isTrackedPath = (value) => typeof value === 'string' && /^\/site(?:\/[a-z0-9_-]+)?$/.test(value);
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|uptime|monitor|curl|wget/i;
const hits = new Map(); // ip -> { n, reset }  (απλό rate limit)
setInterval(() => hits.clear(), 60_000).unref();

// Καθαρισμός: οι επισκέψεις πάνω από 180 ημέρες σβήνονται (μία φορά την ημέρα)
setInterval(() => { query("DELETE FROM page_views WHERE created_date < now() - interval '180 days'").catch(() => {}); }, 24 * 3600_000).unref();

export function visitRoutes() {
  const r = express.Router();

  // POST /api/visits  { visitor, path, ref }  — δημόσιο
  r.post('/', async (req, res) => {
    const { visitor, path, ref } = req.body || {};
    const ua = String(req.get('user-agent') || '');
    const ip = req.ip;
    const h = hits.get(ip) || 0;
    hits.set(ip, h + 1);
    if (h > 60 || BOT.test(ua) || !ua) return res.status(204).end();
    if (typeof visitor !== 'string' || !/^[A-Za-z0-9-]{8,64}$/.test(visitor)) return res.status(400).json({ error: 'bad visitor' });
    const normalizedPath = typeof path === 'string' ? path.split('?')[0].split('#')[0].toLowerCase() : '';
    if (!isTrackedPath(normalizedPath)) return res.status(204).end();

    // ίδιος επισκέπτης στην ίδια σελίδα μέσα σε 30 λεπτά = 1 επίσκεψη
    const dup = await query(
      "SELECT 1 FROM page_views WHERE visitor = $1 AND path = $2 AND created_date > now() - interval '30 minutes' LIMIT 1",
      [visitor, normalizedPath],
    );
    if (!dup.rowCount) {
      let host = '';
      try { host = new URL(String(ref || '')).hostname.replace(/^www\./, ''); } catch { /* χωρίς referrer */ }
      await query('INSERT INTO page_views (visitor, path, ref) VALUES ($1,$2,$3)', [visitor, normalizedPath, host.slice(0, 100) || null]);
    }
    res.status(204).end();
  });

  // Συγκεντρωτικά στατιστικά συνεδριών απευθείας στη βάση — χωρίς φόρτωση όλων των sessions στο browser.
  r.get('/session-stats', requireAdmin, async (_req, res) => {
    const base = `FROM records
      WHERE entity = 'GameSession'`;
    const [summary, modes, intensities, stages, recent] = await Promise.all([
      query(`SELECT
        count(*)::int AS total,
        count(*) FILTER (WHERE COALESCE(NULLIF(data->'state'->>'stage', '')::int, 0) >= 3)::int AS completed,
        count(*) FILTER (WHERE COALESCE(NULLIF(data->'state'->>'stage', '')::int, 0) < 3 AND updated_date >= now() - interval '24 hours')::int AS active,
        count(*) FILTER (WHERE COALESCE(NULLIF(data->'state'->>'stage', '')::int, 0) < 3 AND updated_date < now() - interval '24 hours')::int AS abandoned,
        COALESCE(sum(jsonb_array_length(CASE WHEN jsonb_typeof(data->'state'->'players') = 'array' THEN data->'state'->'players' ELSE '[]'::jsonb END)), 0)::int AS player_participations
        ${base}`),
      query(`SELECT COALESCE(data->'state'->>'mode', data->>'mode', 'unknown') AS id, count(*)::int AS count ${base} GROUP BY 1`),
      query(`SELECT COALESCE(data->'state'->>'intensity', data->>'intensity', 'unknown') AS id, count(*)::int AS count ${base} GROUP BY 1`),
      query(`SELECT COALESCE(NULLIF(data->'state'->>'stage', '')::int, 0) AS stage, count(*)::int AS count ${base} GROUP BY 1`),
      query(`SELECT id, data->>'sessionCode' AS "sessionCode",
        COALESCE(data->'state'->>'mode', data->>'mode') AS mode,
        COALESCE(NULLIF(data->'state'->>'stage', '')::int, 0) AS stage,
        jsonb_array_length(CASE WHEN jsonb_typeof(data->'state'->'players') = 'array' THEN data->'state'->'players' ELSE '[]'::jsonb END)::int AS players,
        updated_date
        ${base} ORDER BY updated_date DESC LIMIT 10`),
    ]);
    res.json({
      ...summary.rows[0],
      byMode: modes.rows,
      byIntensity: intensities.rows,
      byStage: stages.rows,
      recent: recent.rows,
      activeWindowHours: 24,
    });
  });

  // GET /api/visits/stats?path=/site — μόνο admin
  r.get('/stats', requireAdmin, async (req, res) => {
    const path = isTrackedPath(String(req.query.path || '')) ? String(req.query.path) : '/site';
    const tz = 'Europe/Athens';
    const [totals] = (await query(
      `SELECT
         count(*)::int AS views,
         count(DISTINCT visitor)::int AS visitors,
         count(*) FILTER (WHERE (created_date AT TIME ZONE $2)::date = (now() AT TIME ZONE $2)::date)::int AS today,
         count(*) FILTER (WHERE created_date > now() - interval '7 days')::int AS week,
         count(*) FILTER (WHERE created_date > now() - interval '30 days')::int AS month,
         count(DISTINCT visitor) FILTER (WHERE created_date > now() - interval '30 days')::int AS visitors_month
       FROM page_views WHERE path = $1`, [path, tz],
    )).rows;
    const days = (await query(
      `SELECT to_char(d, 'YYYY-MM-DD') AS day, coalesce(c.n, 0)::int AS views
       FROM generate_series(((now() AT TIME ZONE $2)::date - 29)::timestamp, (now() AT TIME ZONE $2)::date::timestamp, interval '1 day') d
       LEFT JOIN (
         SELECT (created_date AT TIME ZONE $2)::date AS day, count(*) AS n FROM page_views WHERE path = $1 GROUP BY 1
       ) c ON c.day = d::date
       ORDER BY d`, [path, tz],
    )).rows;
    const refs = (await query(
      `SELECT ref, count(*)::int AS views FROM page_views WHERE path = $1 AND ref IS NOT NULL GROUP BY ref ORDER BY views DESC LIMIT 6`, [path],
    )).rows;
    const pages = (await query(
      `SELECT path, count(*)::int AS views, count(DISTINCT visitor)::int AS visitors
       FROM page_views
       WHERE path LIKE '/site%'
       GROUP BY path
       ORDER BY views DESC
       LIMIT 25`,
    )).rows;
    res.json({ path, ...totals, days, refs, pages });
  });

  return r;
}
