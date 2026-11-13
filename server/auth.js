import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('JWT_SECRET is not set. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
  process.exit(1);
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
if (ADMIN_EMAILS.length === 0) console.warn('[auth] ADMIN_EMAILS is empty: nobody will get the admin role.');

const roleFor = (email) => (ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'user');
const publicUser = (u) => ({ id: u.id, email: u.email, role: u.role, created_date: u.created_date });
const signToken = (u) => jwt.sign({ sub: u.id }, JWT_SECRET, { expiresIn: '30d' });
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const newId = () => crypto.randomUUID();

// ---------- middleware ----------
export async function attachUser(req, _res, next) {
  req.user = null;
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.query.token;
  if (token) {
    try {
      const { sub } = jwt.verify(String(token), JWT_SECRET);
      const { rows } = await query('SELECT * FROM users WHERE id = $1', [sub]);
      if (rows[0]) {
        // keep role in sync with ADMIN_EMAILS (promote/demote without touching the DB)
        const role = roleFor(rows[0].email);
        if (role !== rows[0].role) {
          await query('UPDATE users SET role = $1 WHERE id = $2', [role, sub]);
          rows[0].role = role;
        }
        req.user = rows[0];
      }
    } catch { /* invalid/expired token -> anonymous */ }
  }
  next();
}

export const requireAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
};

// ---------- email (optional) ----------
async function sendEmail(to, subject, text) {
  if (process.env.RESEND_API_KEY && process.env.MAIL_FROM) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.MAIL_FROM, to, subject, text }),
    });
    if (!r.ok) console.error('[mail] Resend error', r.status, await r.text());
  } else {
    console.warn(`[mail:not-configured] Email delivery is disabled; message not sent to ${to}.`);
  }
}

const baseUrl = (req) => process.env.PUBLIC_URL || `${req.headers['x-forwarded-proto'] || req.protocol}://${req.get('host')}`;
const validEmail = (e) => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const authRateBuckets = new Map();
function authRateLimit({ limit, windowMs }) {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.path}:${req.ip || req.socket.remoteAddress || 'unknown'}`;
    let bucket = authRateBuckets.get(key);
    if (!bucket || now - bucket.startedAt >= bucket.windowMs) {
      bucket = { startedAt: now, count: 0, windowMs };
      authRateBuckets.set(key, bucket);
    }
    if (bucket.count >= limit) return res.status(429).json({ error: 'Too many attempts. Try again later.' });
    bucket.count += 1;
    if (authRateBuckets.size > 5000) {
      for (const [entry, value] of authRateBuckets) {
        if (now - value.startedAt >= value.windowMs) authRateBuckets.delete(entry);
      }
    }
    next();
  };
}

// ---------- routes ----------
export function authRoutes(app) {
  app.post('/api/auth/register', authRateLimit({ limit: 8, windowMs: 60 * 60 * 1000 }), async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!validEmail(email)) return res.status(400).json({ error: 'Invalid email' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const exists = await query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (exists.rowCount) return res.status(409).json({ error: 'This email is already registered' });
    const { rows } = await query(
      'INSERT INTO users (id, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING *',
      [newId(), email, await bcrypt.hash(password, 12), roleFor(email)],
    );
    res.json({ access_token: signToken(rows[0]), user: publicUser(rows[0]) });
  });

  app.post('/api/auth/login', authRateLimit({ limit: 10, windowMs: 15 * 60 * 1000 }), async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    const u = rows[0];
    const ok = u?.password_hash && (await bcrypt.compare(String(req.body?.password || ''), u.password_hash));
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
    res.json({ access_token: signToken(u), user: publicUser(u) });
  });

  app.get('/api/auth/me', (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    res.json(publicUser(req.user));
  });

  // Always answers 200 so it can't be used to discover which emails exist.
  app.post('/api/auth/reset-request', authRateLimit({ limit: 5, windowMs: 60 * 60 * 1000 }), async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const { rows } = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (rows[0]) {
      const token = crypto.randomBytes(32).toString('hex');
      await query('UPDATE users SET reset_token_hash = $1, reset_expires = now() + interval \'1 hour\' WHERE id = $2', [sha256(token), rows[0].id]);
      await sendEmail(email, 'Επαναφορά κωδικού', `Πάτα εδώ για νέο κωδικό (ισχύει 1 ώρα):\n${baseUrl(req)}/reset-password?token=${token}`);
    }
    res.json({ ok: true });
  });

  app.post('/api/auth/reset', authRateLimit({ limit: 10, windowMs: 60 * 60 * 1000 }), async (req, res) => {
    const { token, password } = req.body || {};
    if (!token || String(password || '').length < 8) return res.status(400).json({ error: 'Invalid request (password min 8 chars)' });
    const { rows } = await query('SELECT id FROM users WHERE reset_token_hash = $1 AND reset_expires > now()', [sha256(String(token))]);
    if (!rows[0]) return res.status(400).json({ error: 'The reset link is invalid or has expired' });
    await query('UPDATE users SET password_hash = $1, reset_token_hash = NULL, reset_expires = NULL WHERE id = $2', [await bcrypt.hash(String(password), 12), rows[0].id]);
    res.json({ ok: true });
  });

  // ----- Google sign-in (optional: needs GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET) -----
  const googleConfigured = () => process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = (req) => `${baseUrl(req)}/api/auth/google/callback`;

  app.get('/api/auth/google', (req, res) => {
    if (!googleConfigured()) return res.status(501).send('Google login is not configured on this server.');
    const returnTo = typeof req.query.returnTo === 'string' && req.query.returnTo.startsWith('/') && !req.query.returnTo.startsWith('//') ? req.query.returnTo : '/';
    const state = jwt.sign({ returnTo }, JWT_SECRET, { expiresIn: '10m' });
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: redirectUri(req),
      response_type: 'code', scope: 'openid email', state, prompt: 'select_account',
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });

  app.get('/api/auth/google/callback', async (req, res) => {
    try {
      if (!googleConfigured()) return res.status(501).send('Google login is not configured.');
      const { returnTo } = jwt.verify(String(req.query.state || ''), JWT_SECRET);
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: String(req.query.code || ''), client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri(req), grant_type: 'authorization_code',
        }),
      });
      const tokens = await tokenRes.json();
      if (!tokens.id_token) throw new Error('No id_token from Google');
      // Ask Google's tokeninfo endpoint to validate the signature and claims.
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokens.id_token)}`);
      const claims = await verifyRes.json();
      if (!verifyRes.ok || claims.aud !== process.env.GOOGLE_CLIENT_ID ||
          !['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss) ||
          Number(claims.exp) <= Math.floor(Date.now() / 1000) ||
          !claims.sub || !claims.email || claims.email_verified !== 'true') {
        throw new Error('Google ID token validation failed');
      }
      const email = String(claims.email).toLowerCase();
      let { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
      if (!rows[0]) {
        ({ rows } = await query('INSERT INTO users (id, email, role, google_id) VALUES ($1,$2,$3,$4) RETURNING *', [newId(), email, roleFor(email), claims.sub]));
      }
      // token travels in the URL fragment so it never reaches server logs
      res.redirect(`/auth-callback.html#token=${signToken(rows[0])}&returnTo=${encodeURIComponent(returnTo || '/')}`);
    } catch (e) {
      console.error('[google]', e.message);
      res.redirect('/login?error=google');
    }
  });
}
