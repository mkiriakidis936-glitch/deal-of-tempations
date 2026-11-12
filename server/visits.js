import express from 'express';
import { query } from './db.js';
import { requireAdmin } from './auth.js';

const TRACKED = new Set(['/site']);
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|uptime|monitor|curl|wget/i;
const hits = new Map(); // ip -> { n, reset }  (απλό rate limit)
setInterval(() => hits.clear(), 60_000).unref();

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
    if (typeof path !== 'string' || !TRACKED.has(path)) return res.status(204).end();

    // ίδιος επισκέπτης στην ίδια σελίδα μέσα σε 30 λεπτά = 1 επίσκεψη
    const dup = await query(
      "SELECT 1 FROM page_views WHERE visitor = $1 AND path = $2 AND created_date > now() - interval '30 minutes' LIMIT 1",
      [visitor, path],
    );
    if (!dup.rowCount) {
      let host = '';
      try { host = new URL(String(ref || '')).hostname.replace(/^www\./, ''); } catch { /* χωρίς referrer */ }
      await query('INSERT INTO page_views (visitor, path, ref) VALUES ($1,$2,$3)', [visitor, path, host.slice(0, 100) || null]);
    }
    res.status(204).end();
  });

  // GET /api/visits/stats?path=/site — μόνο admin
  r.get('/stats', requireAdmin, async (req, res) => {
    const path = TRACKED.has(String(req.query.path)) ? String(req.query.path) : '/site';
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
    res.json({ path, ...totals, days, refs });
  });

  return r;
}
