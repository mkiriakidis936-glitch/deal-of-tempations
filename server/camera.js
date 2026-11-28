import express from 'express';
import crypto from 'node:crypto';
import { requireAdmin } from './auth.js';

// Ζωντανές κάμερες (Tablet / κινητά) → TV & Στούντιο (WebRTC, απευθείας μέσα στο WiFi).
// Ο server μεταφέρει ΜΟΝΟ τη «χειραψία» (SDP). Η εικόνα δεν περνά ποτέ από εδώ και δεν αποθηκεύεται.
// Έως MAX_CAMS κάμερες ανά βραδιά. Κινητό-κάμερα μπαίνει με «εισιτήριο» από το Στούντιο (QR), χωρίς login διαχειριστή·
// μετά απαντά στις οθόνες με το δικό της κλειδί (camKey). Όλα ζουν στη μνήμη και λήγουν μόνα τους.
const ROOM_TTL = 6 * 60 * 60 * 1000;
const VIEWER_TTL = 2 * 60 * 1000;
const TICKET_TTL = 15 * 60 * 1000;
const MAX_VIEWERS = 8;
const MAX_CAMS = 4;
const MAX_SDP = 24 * 1024;

// code → { cams: Map(camId → { key, label, startedAt, seenAt, viewers: Map(viewerId → { offer, answer, at }) }), tickets: Map(ticket → expiresAt) }
const rooms = new Map();

const codeOf = (req) => String(req.params.code || '').trim().toUpperCase().slice(0, 12);
const validSdp = (sdp) => typeof sdp === 'string' && sdp.length > 20 && sdp.length <= MAX_SDP && sdp.startsWith('v=0');
const isAdmin = (req) => req.user?.role === 'admin';
const token = () => crypto.randomBytes(8).toString('hex');
const cleanLabel = (s, fallback) => String(s || '').replace(/[<>]/g, '').trim().slice(0, 30) || fallback;
const roomOf = (code) => {
  if (!rooms.has(code)) rooms.set(code, { cams: new Map(), tickets: new Map() });
  return rooms.get(code);
};
const camOf = (req, camId) => rooms.get(codeOf(req))?.cams.get(String(camId || ''));

function sweep() {
  const now = Date.now();
  for (const [code, room] of rooms) {
    for (const [camId, cam] of room.cams) {
      if (now - cam.startedAt > ROOM_TTL) { room.cams.delete(camId); continue; }
      for (const [id, viewer] of cam.viewers) if (now - viewer.at > VIEWER_TTL) cam.viewers.delete(id);
    }
    for (const [t, exp] of room.tickets) if (exp < now) room.tickets.delete(t);
    if (!room.cams.size && !room.tickets.size) rooms.delete(code);
  }
}
setInterval(sweep, 30_000).unref?.();

// Απλό όριο ανά IP για τα δημόσια αιτήματα (TV, κινητά-κάμερες).
const hits = new Map();
function limited(req) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const bucket = hits.get(ip) || { at: now, n: 0 };
  if (now - bucket.at > 60_000) { bucket.at = now; bucket.n = 0; }
  bucket.n += 1;
  hits.set(ip, bucket);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v.at > 60_000) hits.delete(k);
  return bucket.n > 240;
}

function addCam(code, label) {
  const room = roomOf(code);
  if (room.cams.size >= MAX_CAMS) return null;
  const camId = token();
  const cam = { key: token() + token(), label: cleanLabel(label, `Κάμερα ${room.cams.size + 1}`), startedAt: Date.now(), seenAt: Date.now(), viewers: new Map() };
  room.cams.set(camId, cam);
  return { camId, camKey: cam.key, label: cam.label };
}
// Η κάμερα (admin ή όποια έχει το κλειδί της) απαντά στις οθόνες.
const camAuth = (req, cam, key) => !!cam && (isAdmin(req) || (typeof key === 'string' && key.length > 10 && key === cam.key));

export function cameraRoutes() {
  const r = express.Router();

  // Admin (Tablet): ξεκινά κάμερα για μια συνεδρία.
  r.post('/:code/start', requireAdmin, (req, res) => {
    const out = addCam(codeOf(req), req.body?.label || 'Tablet');
    if (!out) return res.status(429).json({ error: `Έως ${MAX_CAMS} κάμερες ανά βραδιά.` });
    res.json(out);
  });
  // Admin: σταματά όλες τις κάμερες της συνεδρίας.
  r.delete('/:code', requireAdmin, (req, res) => {
    rooms.delete(codeOf(req));
    res.json({ success: true });
  });
  // Admin (Στούντιο): εισιτήριο για να γίνει ένα κινητό κάμερα (QR). Ισχύει 15′ και για έως MAX_CAMS κάμερες.
  r.post('/:code/ticket', requireAdmin, (req, res) => {
    const t = token() + token();
    roomOf(codeOf(req)).tickets.set(t, Date.now() + TICKET_TTL);
    res.json({ ticket: t, expiresAt: Date.now() + TICKET_TTL });
  });
  // Admin (Στούντιο): ποιες κάμερες είναι ενεργές.
  r.get('/:code/cams', requireAdmin, (req, res) => {
    const room = rooms.get(codeOf(req));
    const now = Date.now();
    const cams = room ? [...room.cams].map(([camId, c]) => ({ camId, label: c.label, startedAt: c.startedAt, online: now - c.seenAt < 10_000, viewers: c.viewers.size })) : [];
    res.set('Cache-Control', 'no-store').json({ cams, max: MAX_CAMS });
  });
  // Κινητό-κάμερα: μπαίνει με εισιτήριο.
  r.post('/:code/cam', (req, res) => {
    if (limited(req)) return res.status(429).json({ error: 'Πολλά αιτήματα.' });
    const room = rooms.get(codeOf(req));
    const exp = room?.tickets.get(String(req.body?.ticket || ''));
    if (!exp || exp < Date.now()) return res.status(403).json({ error: 'Το QR της κάμερας έληξε. Πάρε νέο από το Στούντιο.' });
    const out = addCam(codeOf(req), req.body?.label);
    if (!out) return res.status(429).json({ error: `Έως ${MAX_CAMS} κάμερες ανά βραδιά.` });
    res.json(out);
  });
  // Μία κάμερα σταματά (admin ή η ίδια με το κλειδί της).
  r.delete('/:code/cam/:camId', (req, res) => {
    const cam = camOf(req, req.params.camId);
    if (!camAuth(req, cam, req.body?.camKey || req.query.key)) return res.status(cam ? 401 : 404).json({ error: 'Δεν επιτρέπεται.' });
    rooms.get(codeOf(req)).cams.delete(String(req.params.camId));
    res.json({ success: true });
  });

  // TV / Στούντιο: στέλνει την πρότασή του (offer) για να δει μια κάμερα.
  r.post('/:code/viewer', (req, res) => {
    if (limited(req)) return res.status(429).json({ error: 'Πολλά αιτήματα.' });
    const { camId, sdp } = req.body || {};
    const cam = camOf(req, camId);
    if (!cam) return res.status(404).json({ error: 'Η κάμερα δεν είναι ενεργή.' });
    if (!validSdp(sdp)) return res.status(400).json({ error: 'Μη έγκυρη σύνδεση.' });
    if (cam.viewers.size >= MAX_VIEWERS) return res.status(429).json({ error: 'Πολλές οθόνες συνδεδεμένες στην κάμερα.' });
    const viewerId = token();
    cam.viewers.set(viewerId, { offer: sdp, answer: null, at: Date.now() });
    res.json({ viewerId });
  });

  // TV / Στούντιο: περιμένει την απάντηση της κάμερας.
  r.get('/:code/viewer/:viewerId', (req, res) => {
    if (limited(req)) return res.status(429).json({ error: 'Πολλά αιτήματα.' });
    const room = rooms.get(codeOf(req));
    let viewer = null;
    for (const cam of room?.cams.values() || []) { viewer = cam.viewers.get(String(req.params.viewerId)); if (viewer) break; }
    if (!viewer) return res.status(404).json({ error: 'Η σύνδεση έληξε.' });
    res.set('Cache-Control', 'no-store').json({ answer: viewer.answer });
  });

  // Κάμερα: βλέπει ποιες οθόνες περιμένουν και απαντά (admin ή με το κλειδί της).
  r.get('/:code/pending', (req, res) => {
    const cam = camOf(req, req.query.camId);
    if (!cam) return res.status(isAdmin(req) || req.query.key ? 404 : 401).json({ error: 'Η κάμερα δεν είναι ενεργή.' });
    if (!camAuth(req, cam, req.query.key)) return res.status(401).json({ error: 'Unauthorized' });
    cam.seenAt = Date.now();
    const pending = [...cam.viewers].filter(([, v]) => !v.answer).map(([viewerId, v]) => ({ viewerId, sdp: v.offer }));
    res.set('Cache-Control', 'no-store').json({ pending, viewers: cam.viewers.size });
  });
  r.post('/:code/answer', (req, res) => {
    const { camId, camKey, viewerId, sdp } = req.body || {};
    const cam = camOf(req, camId);
    if (!cam) return res.status(404).json({ error: 'Η κάμερα δεν είναι ενεργή.' });
    if (!camAuth(req, cam, camKey)) return res.status(401).json({ error: 'Unauthorized' });
    const viewer = cam.viewers.get(String(viewerId));
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
