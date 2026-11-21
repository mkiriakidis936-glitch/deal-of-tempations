import express from 'express';
import crypto from 'node:crypto';
import { requireAdmin } from './auth.js';

// Ζωντανή κάμερα Tablet/κινητού → TV (WebRTC, απευθείας μέσα στο WiFi).
// Ο server μεταφέρει ΜΟΝΟ τη «χειραψία» (SDP). Η εικόνα δεν περνά ποτέ από εδώ και δεν αποθηκεύεται.
// Όλα ζουν στη μνήμη και λήγουν μόνα τους.
const ROOM_TTL = 6 * 60 * 60 * 1000;
const VIEWER_TTL = 2 * 60 * 1000;
const MAX_VIEWERS = 8;
const MAX_SDP = 24 * 1024;

const rooms = new Map(); // code → { camId, startedAt, viewers: Map(viewerId → { offer, answer, at }) }

const codeOf = (req) => String(req.params.code || '').trim().toUpperCase().slice(0, 12);
const validSdp = (sdp) => typeof sdp === 'string' && sdp.length > 20 && sdp.length <= MAX_SDP && sdp.startsWith('v=0');

function sweep() {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.startedAt > ROOM_TTL) { rooms.delete(code); continue; }
    for (const [id, viewer] of room.viewers) if (now - viewer.at > VIEWER_TTL) room.viewers.delete(id);
  }
}
setInterval(sweep, 30_000).unref?.();

// Απλό όριο ανά IP για τα δημόσια αιτήματα της TV.
const hits = new Map();
function limited(req) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const bucket = hits.get(ip) || { at: now, n: 0 };
  if (now - bucket.at > 60_000) { bucket.at = now; bucket.n = 0; }
  bucket.n += 1;
  hits.set(ip, bucket);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v.at > 60_000) hits.delete(k);
  return bucket.n > 120;
}

export function cameraRoutes() {
  const r = express.Router();

  // Admin: ξεκινά/σταματά την κάμερα για μια συνεδρία.
  r.post('/:code/start', requireAdmin, (req, res) => {
    const camId = crypto.randomBytes(8).toString('hex');
    rooms.set(codeOf(req), { camId, startedAt: Date.now(), viewers: new Map() });
    res.json({ camId });
  });
  r.delete('/:code', requireAdmin, (req, res) => {
    rooms.delete(codeOf(req));
    res.json({ success: true });
  });

  // TV: στέλνει την πρότασή της (offer) για να δει την κάμερα.
  r.post('/:code/viewer', (req, res) => {
    if (limited(req)) return res.status(429).json({ error: 'Πολλά αιτήματα.' });
    const room = rooms.get(codeOf(req));
    const { camId, sdp } = req.body || {};
    if (!room || room.camId !== camId) return res.status(404).json({ error: 'Η κάμερα δεν είναι ενεργή.' });
    if (!validSdp(sdp)) return res.status(400).json({ error: 'Μη έγκυρη σύνδεση.' });
    if (room.viewers.size >= MAX_VIEWERS) return res.status(429).json({ error: 'Πολλές οθόνες συνδεδεμένες στην κάμερα.' });
    const viewerId = crypto.randomBytes(8).toString('hex');
    room.viewers.set(viewerId, { offer: sdp, answer: null, at: Date.now() });
    res.json({ viewerId });
  });

  // TV: περιμένει την απάντηση της κάμερας.
  r.get('/:code/viewer/:viewerId', (req, res) => {
    if (limited(req)) return res.status(429).json({ error: 'Πολλά αιτήματα.' });
    const viewer = rooms.get(codeOf(req))?.viewers.get(String(req.params.viewerId));
    if (!viewer) return res.status(404).json({ error: 'Η σύνδεση έληξε.' });
    res.set('Cache-Control', 'no-store').json({ answer: viewer.answer });
  });

  // Admin (κάμερα): βλέπει ποιες οθόνες περιμένουν και απαντά.
  r.get('/:code/pending', requireAdmin, (req, res) => {
    const room = rooms.get(codeOf(req));
    if (!room || room.camId !== String(req.query.camId || '')) return res.status(404).json({ error: 'Η κάμερα δεν είναι ενεργή.' });
    const pending = [...room.viewers].filter(([, v]) => !v.answer).map(([viewerId, v]) => ({ viewerId, sdp: v.offer }));
    res.set('Cache-Control', 'no-store').json({ pending, viewers: room.viewers.size });
  });
  r.post('/:code/answer', requireAdmin, (req, res) => {
    const room = rooms.get(codeOf(req));
    const { camId, viewerId, sdp } = req.body || {};
    if (!room || room.camId !== camId) return res.status(404).json({ error: 'Η κάμερα δεν είναι ενεργή.' });
    const viewer = room.viewers.get(String(viewerId));
    if (!viewer) return res.status(404).json({ error: 'Η οθόνη αποσυνδέθηκε.' });
    if (!validSdp(sdp)) return res.status(400).json({ error: 'Μη έγκυρη σύνδεση.' });
    viewer.answer = sdp;
    viewer.at = Date.now();
    res.json({ success: true });
  });

  return r;
}

// Για τα tests.
export const __cameraRooms = rooms;
