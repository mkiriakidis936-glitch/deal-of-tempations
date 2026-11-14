import express from 'express';
import webpush from 'web-push';
import { query } from './db.js';
import { requireAdmin } from './auth.js';

// VAPID κλειδιά: από env (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY) ή, αν λείπουν, δημιουργούνται μία φορά και μένουν στη βάση.
let ready = null;
function init() {
  ready ||= (async () => {
    let pub = process.env.VAPID_PUBLIC_KEY;
    let priv = process.env.VAPID_PRIVATE_KEY;
    if (!pub || !priv) {
      const read = async () => Object.fromEntries((await query("SELECT key, value FROM server_secrets WHERE key IN ('vapid_public','vapid_private')")).rows.map((r) => [r.key, r.value]));
      let m = await read();
      if (!m.vapid_public || !m.vapid_private) {
        const k = webpush.generateVAPIDKeys();
        await query("INSERT INTO server_secrets (key, value) VALUES ('vapid_public',$1),('vapid_private',$2) ON CONFLICT (key) DO NOTHING", [k.publicKey, k.privateKey]);
        m = await read();
      }
      pub = m.vapid_public; priv = m.vapid_private;
    }
    const admin = (process.env.ADMIN_EMAILS || '').split(',')[0].trim();
    const subject = process.env.VAPID_SUBJECT || (admin ? `mailto:${admin}` : 'mailto:admin@example.com');
    webpush.setVapidDetails(subject, pub, priv);
    return pub;
  })().catch((e) => { ready = null; throw e; });
  return ready;
}

const clip = (s, n) => String(s ?? '').trim().slice(0, n);

export async function notifyAdmins({ title, body, url }) {
  await init();
  await query('INSERT INTO notifications (title, body, url) VALUES ($1,$2,$3)', [title, body || '', url || '/admin']);
  const { rows } = await query('SELECT endpoint, subscription FROM push_subscriptions WHERE user_id IS NOT NULL');
  const payload = JSON.stringify({ title, body, url: url || '/admin' });
  await Promise.all(rows.map(async (row) => {
    try {
      await webpush.sendNotification(row.subscription, payload, { TTL: 60 * 60 * 24, urgency: 'high' });
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) await query('DELETE FROM push_subscriptions WHERE endpoint = $1', [row.endpoint]);
      else console.error('[push] αποτυχία αποστολής:', e.statusCode || e.message);
    }
  }));
}

export async function notifyPlayerMission(sessionCode, playerId, mission) {
  if (!sessionCode || !playerId || !mission?.title) return;
  await init();
  const { rows } = await query(
    'SELECT endpoint, subscription FROM push_subscriptions WHERE session_code = $1 AND player_id = $2',
    [sessionCode, playerId],
  );
  const payload = JSON.stringify({
    title: 'Μυστική αποστολή',
    body: clip(mission.title, 120),
    url: `/play?code=${encodeURIComponent(sessionCode)}`,
  });
  await Promise.all(rows.map(async (row) => {
    try {
      await webpush.sendNotification(row.subscription, payload, { TTL: 60 * 60, urgency: 'high' });
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) {
        await query('DELETE FROM push_subscriptions WHERE endpoint = $1', [row.endpoint]);
      } else {
        console.error('[player-push] αποτυχία αποστολής:', e.statusCode || e.message);
      }
    }
  }));
}

// Καλείται από το entities.js μόλις αποθηκευτεί νέα εγγραφή (δημόσιες φόρμες).
export function notifyNewSubmission(entity, rec) {
  let msg = null;
  const name = clip(rec.name, 80) || 'Κάποια κοπέλα';
  if (entity === 'PlayerIntake') {
    msg = { title: '💌 Νέα πρόσκληση', body: `${name} συμπλήρωσε το ερωτηματολόγιο στο /invitation`, url: '/admin?tab=intakes' };
  } else if (entity === 'InvitationRSVP' && rec.event === 'pajama') {
    msg = { title: '🩴 Νέα κράτηση θέσης', body: `${name} κράτησε θέση στο /pajama-invite`, url: '/admin?tab=rsvp' };
  } else if (entity === 'PajamaIntake') {
    msg = { title: '🩴 Νέα φόρμα Pajama', body: `${name} συμπλήρωσε τη φόρμα στο /pajama-form`, url: '/admin?tab=pajama' };
  }
  if (msg) notifyAdmins(msg).catch((e) => console.error('[push] notify error:', e.message));
}

export function pushRoutes() {
  const r = express.Router();

  r.get('/public-key', async (_req, res) => res.json({ key: await init() }));

  r.post('/player-subscribe', async (req, res) => {
    const sessionCode = String(req.body?.sessionCode || '').trim().toUpperCase();
    const playerId = String(req.body?.playerId || '').trim();
    const sub = req.body?.subscription;
    if (!sessionCode || !playerId || !sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return res.status(400).json({ error: 'Μη έγκυρη συνδρομή παίκτριας' });
    }
    const { rows: sessions } = await query(
      "SELECT data FROM records WHERE entity = 'GameSession' AND data->>'sessionCode' = $1 LIMIT 1",
      [sessionCode],
    );
    const players = sessions[0]?.data?.state?.players || [];
    if (!players.some((player) => player.id === playerId)) return res.status(404).json({ error: 'Δεν βρέθηκε η παίκτρια στη συνεδρία' });
    await query(
      `INSERT INTO push_subscriptions (endpoint, user_id, subscription, device, session_code, player_id)
       VALUES ($1,NULL,$2,$3,$4,$5)
       ON CONFLICT (endpoint) DO UPDATE SET user_id = COALESCE(push_subscriptions.user_id, EXCLUDED.user_id), subscription = EXCLUDED.subscription, device = EXCLUDED.device,
         session_code = EXCLUDED.session_code, player_id = EXCLUDED.player_id`,
      [sub.endpoint, sub, clip(req.body.device, 80), sessionCode, playerId],
    );
    res.json({ success: true });
  });

  r.post('/player-unsubscribe', async (req, res) => {
    const sessionCode = String(req.body?.sessionCode || '').trim().toUpperCase();
    const playerId = String(req.body?.playerId || '').trim();
    await query(
      'UPDATE push_subscriptions SET session_code = NULL, player_id = NULL WHERE endpoint = $1 AND session_code = $2 AND player_id = $3',
      [String(req.body?.endpoint || ''), sessionCode, playerId],
    );
    res.json({ success: true });
  });

  r.post('/subscribe', requireAdmin, async (req, res) => {
    const sub = req.body?.subscription;
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) return res.status(400).json({ error: 'Μη έγκυρη συνδρομή' });
    await query(
      `INSERT INTO push_subscriptions (endpoint, user_id, subscription, device) VALUES ($1,$2,$3,$4)
       ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, subscription = EXCLUDED.subscription, device = EXCLUDED.device`,
      [sub.endpoint, req.user.id, sub, clip(req.body.device, 80)],
    );
    res.json({ success: true });
  });

  r.post('/unsubscribe', requireAdmin, async (req, res) => {
    await query('DELETE FROM push_subscriptions WHERE endpoint = $1', [String(req.body?.endpoint || '')]);
    res.json({ success: true });
  });

  r.get('/status', requireAdmin, async (_req, res) => {
    const devices = (await query('SELECT device, created_date FROM push_subscriptions ORDER BY created_date DESC')).rows;
    const history = (await query('SELECT id, title, body, url, created_date FROM notifications ORDER BY created_date DESC LIMIT 30')).rows;
    res.json({ devices, history });
  });

  r.post('/test', requireAdmin, async (_req, res) => {
    await notifyAdmins({ title: '🔔 Δοκιμή', body: 'Οι ειδοποιήσεις δουλεύουν!', url: '/admin?tab=notifications' });
    res.json({ success: true });
  });

  return r;
}
