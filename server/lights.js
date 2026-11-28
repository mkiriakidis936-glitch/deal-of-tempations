// 11.1.0 · Διαδρομές /api/lights (μόνο admin, εκτός από την επιστροφή της σύνδεσης Samsung).
import express from 'express';
import crypto from 'node:crypto';
import { requireAdmin } from './auth.js';
import { query } from './db.js';
import { createLights, publicStatus } from './lightsCore.js';

const ROW_ID = 'smartthings-config';
const ENTITY = 'SmartThingsConfig'; // εκτός της λίστας ENTITIES: δεν διαβάζεται από το γενικό API, δεν μπαίνει σε backup

export const lights = createLights({
  load: async () => {
    const { rows } = await query('SELECT data FROM records WHERE id = $1 AND entity = $2', [ROW_ID, ENTITY]);
    return rows[0]?.data || null;
  },
  save: async (cfg) => {
    await query(
      `INSERT INTO records (id, entity, data) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_date = now()`,
      [ROW_ID, ENTITY, JSON.stringify(cfg)],
    );
  },
  log: (m) => console.warn(m),
});

// Η μόνιμη σύνδεση κρατιέται ζωντανή: ανανέωση μία φορά τη μέρα (τα refresh tokens είναι μίας χρήσης).
setInterval(async () => {
  try { const c = await lights.getCfg(); if (c.auth?.type === 'oauth' && c.auth.refreshToken) await lights.refresh(); } catch (e) { console.warn('[lights] refresh', e.message); }
}, 12 * 3600 * 1000).unref();

const baseUrl = (req) => (process.env.PUBLIC_URL || `${req.headers['x-forwarded-proto'] || req.protocol}://${req.get('host')}`).replace(/\/$/, '');
const redirectUri = (req) => `${baseUrl(req)}/api/lights/oauth/callback`;
const oauthStates = new Map(); // state → λήξη

export function lightRoutes() {
  const r = express.Router();
  const safe = (fn) => async (req, res) => {
    try { await fn(req, res); } catch (e) { res.status(400).json({ error: e.message || 'Σφάλμα' }); }
  };

  r.get('/status', requireAdmin, safe(async (req, res) => {
    res.set('Cache-Control', 'no-store').json({ ...publicStatus(await lights.getCfg()), redirectUri: redirectUri(req) });
  }));

  // Ενεργοποίηση / ήπια λειτουργία.
  r.post('/settings', requireAdmin, safe(async (req, res) => {
    const patch = {};
    if (typeof req.body?.enabled === 'boolean') patch.enabled = req.body.enabled;
    if (typeof req.body?.calm === 'boolean') patch.calm = req.body.calm;
    res.json(publicStatus(await lights.persist(patch)));
  }));

  // Γρήγορη σύνδεση: Personal Access Token (24 ώρες).
  r.post('/token', requireAdmin, safe(async (req, res) => {
    const token = String(req.body?.token || '').trim();
    if (!/^[A-Za-z0-9-]{20,}$/.test(token)) throw new Error('Το token δεν μοιάζει σωστό. Αντέγραψέ το ολόκληρο από account.smartthings.com/tokens.');
    await lights.persist({ auth: { type: 'pat', token, createdAt: Date.now() }, lastError: '' });
    const devices = await lights.discover();
    res.json({ ...publicStatus(await lights.getCfg()), found: devices.length });
  }));

  // Μόνιμη σύνδεση: OAuth (Client ID / Secret από την εφαρμογή SmartThings τύπου «API only»).
  r.post('/oauth/app', requireAdmin, safe(async (req, res) => {
    const clientId = String(req.body?.clientId || '').trim();
    const clientSecret = String(req.body?.clientSecret || '').trim();
    if (clientId.length < 10 || clientSecret.length < 10) throw new Error('Συμπλήρωσε Client ID και Client Secret.');
    await lights.persist({ auth: { type: 'oauth', clientId, clientSecret } });
    const state = crypto.randomBytes(16).toString('hex');
    oauthStates.set(state, Date.now() + 10 * 60 * 1000);
    const url = `https://api.smartthings.com/oauth/authorize?${new URLSearchParams({ client_id: clientId, response_type: 'code', redirect_uri: redirectUri(req), scope: 'r:devices:* x:devices:* r:locations:*', state })}`;
    res.json({ url });
  }));
  r.get('/oauth/callback', async (req, res) => {
    const state = String(req.query.state || '');
    const ok = oauthStates.get(state);
    oauthStates.delete(state);
    const back = (msg) => res.redirect(`/admin?lights=${encodeURIComponent(msg)}`);
    if (!ok || ok < Date.now()) return back('Η σύνδεση έληξε. Ξαναπάτα «Σύνδεση με Samsung».');
    try {
      await lights.exchangeCode(String(req.query.code || ''), redirectUri(req));
      const devices = await lights.discover();
      back(`ok:${devices.length}`);
    } catch (e) { back(e.message); }
  });

  r.post('/discover', requireAdmin, safe(async (_req, res) => {
    const devices = await lights.discover();
    res.json({ ...publicStatus(await lights.getCfg()), found: devices.length });
  }));

  // Ρόλος κάθε συσκευής: lamp (Λάμπα) / strip (LED ταινία) / off (εκτός παιχνιδιού).
  r.post('/devices', requireAdmin, safe(async (req, res) => {
    const roles = req.body?.roles || {};
    const c = await lights.getCfg();
    const devices = (c.devices || []).map((d) => (['lamp', 'strip', 'off'].includes(roles[d.id]) ? { ...d, role: roles[d.id] } : d));
    res.json(publicStatus(await lights.persist({ devices })));
  }));

  r.post('/test', requireAdmin, safe(async (req, res) => {
    await lights.test(req.body?.target || null, req.body?.scene || 'test');
    res.json({ success: true });
  }));

  r.post('/disconnect', requireAdmin, safe(async (_req, res) => {
    res.json(publicStatus(await lights.persist({ auth: null, enabled: false, devices: [] })));
  }));

  return r;
}
