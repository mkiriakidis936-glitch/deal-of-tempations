// 11.1.0 · Φώτα σπιτιού μέσω Samsung SmartThings (λάμπες & LED ταινίες Tapo κ.ά.).
// Πυρήνας χωρίς βάση δεδομένων (ελέγξιμος): σύνδεση, συσκευές, ουρά εντολών με όριο ρυθμού, «οδηγός» σκηνών.
// Τα tokens μένουν ΜΟΝΟ στον server — ποτέ σε browser, ποτέ σε backup.
// Δεν αλλάζει τίποτα στο παιχνίδι: μόνο διαβάζει την κατάσταση και στέλνει χρώματα στα φώτα.

import { lightScene, commandsFor, wantKey } from '../src/lib/lightScenes.js';

export const ST_API = 'https://api.smartthings.com';
export const DEVICE_MIN_GAP_MS = 5000; // ≤ 12 εντολές/λεπτό ανά συσκευή (όριο SmartThings)
export const BACKOFF_MS = 30000; // μετά από 429
export const PAT_TTL_MS = 24 * 3600 * 1000; // τα Personal Access Tokens λήγουν σε 24 ώρες
const LIGHT_CAPS = ['switch', 'switchLevel', 'colorControl', 'colorTemperature'];
const TV_CAPS = ['samsungvd.mediaInputSource', 'mediaInputSource', 'tvChannel', 'samsungvd.ambient', 'samsungvd.remoteControl', 'custom.launchapp'];

export const defaultConfig = () => ({ enabled: false, calm: false, auth: null, devices: [], lastError: '', lastOkAt: 0 });

// Τι βλέπει το Admin (χωρίς μυστικά).
export function publicStatus(cfg, now = Date.now()) {
  const a = cfg.auth;
  let auth = { type: 'none' };
  if (a?.type === 'pat') auth = { type: 'pat', expiresAt: (a.createdAt || 0) + PAT_TTL_MS, expired: now > (a.createdAt || 0) + PAT_TTL_MS };
  if (a?.type === 'oauth') auth = { type: 'oauth', connected: !!a.refreshToken, clientId: a.clientId ? `${a.clientId.slice(0, 6)}…` : '', expiresAt: a.expiresAt || 0 };
  return {
    enabled: !!cfg.enabled, calm: !!cfg.calm, auth,
    devices: (cfg.devices || []).map(({ id, label, role, caps, room, tv }) => ({ id, label, role, caps, room, tv: !!tv })),
    lastError: cfg.lastError || '', lastOkAt: cfg.lastOkAt || 0,
  };
}

export function createLights({ load, save, fetchImpl = (...a) => fetch(...a), now = () => Date.now(), log = () => {} }) {
  let cfg = null;
  const dev = new Map(); // deviceId → { sentKey, lastAt, pausedUntil, pending, timer }
  let driving = null; // { code, state } η τελευταία ενεργή συνεδρία
  let tick = null;

  const getCfg = async () => { if (!cfg) cfg = { ...defaultConfig(), ...((await load()) || {}) }; return cfg; };
  const persist = async (patch) => { cfg = { ...(await getCfg()), ...patch }; await save(cfg); return cfg; };

  // ---------- Σύνδεση ----------
  async function accessToken() {
    const c = await getCfg();
    const a = c.auth;
    if (!a) throw new Error('Δεν έχει συνδεθεί το SmartThings.');
    if (a.type === 'pat') {
      if (now() > (a.createdAt || 0) + PAT_TTL_MS) throw new Error('Το token του SmartThings έληξε (ισχύει 24 ώρες). Βάλε νέο στο Admin ή κάνε μόνιμη σύνδεση.');
      return a.token;
    }
    if (a.type === 'oauth') {
      if (!a.accessToken || now() > (a.expiresAt || 0) - 10 * 60 * 1000) await refresh();
      return cfg.auth.accessToken;
    }
    throw new Error('Άγνωστος τρόπος σύνδεσης.');
  }

  async function tokenRequest(body) {
    const a = (await getCfg()).auth;
    const res = await fetchImpl(`${ST_API}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${Buffer.from(`${a.clientId}:${a.clientSecret}`).toString('base64')}` },
      body: new URLSearchParams(body).toString(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) throw new Error(`SmartThings: αποτυχία σύνδεσης (${res.status}) ${data.error_description || data.error || ''}`.trim());
    // Το refresh token είναι μίας χρήσης: κρατάμε πάντα το καινούριο.
    await persist({ auth: { ...a, accessToken: data.access_token, refreshToken: data.refresh_token || a.refreshToken, expiresAt: now() + (Number(data.expires_in) || 86399) * 1000 } });
    return cfg.auth;
  }
  async function refresh() {
    const a = (await getCfg()).auth;
    if (!a?.refreshToken) throw new Error('Η μόνιμη σύνδεση δεν ολοκληρώθηκε. Πάτα «Σύνδεση με Samsung» στο Admin.');
    return tokenRequest({ grant_type: 'refresh_token', refresh_token: a.refreshToken, client_id: a.clientId });
  }
  async function exchangeCode(code, redirectUri) {
    const a = (await getCfg()).auth;
    return tokenRequest({ grant_type: 'authorization_code', code, client_id: a.clientId, redirect_uri: redirectUri });
  }

  async function api(path, { method = 'GET', body } = {}, retried = false) {
    const token = await accessToken();
    const res = await fetchImpl(`${ST_API}${path}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    if (res.status === 401 && cfg.auth?.type === 'oauth' && !retried) { await refresh(); return api(path, { method, body }, true); }
    if (res.status === 429) { const e = new Error('rate'); e.rate = true; throw e; }
    if (!res.ok) throw new Error(`SmartThings ${res.status}`);
    return res.status === 204 ? {} : res.json().catch(() => ({}));
  }

  // ---------- Συσκευές ----------
  async function discover() {
    const list = await api('/v1/devices');
    const prev = new Map(((await getCfg()).devices || []).map((d) => [d.id, d]));
    const devices = (list.items || []).map((d) => {
      const raw = [...new Set((d.components || []).filter((c) => c.id === 'main').flatMap((c) => (c.capabilities || []).map((x) => x.id)))];
      const caps = raw.filter((c) => LIGHT_CAPS.includes(c));
      if (!caps.includes('switch')) return null;
      const old = prev.get(d.deviceId);
      const name = `${d.label || d.name || ''}`;
      const lightLike = caps.includes('colorControl') || caps.includes('switchLevel');
      const isTv = raw.some((c) => TV_CAPS.includes(c)) || d.ocf?.ocfDeviceType === 'oic.d.tv' || (!lightLike && /\b(tv|τηλεόραση)\b/i.test(name));
      // Μαντεύουμε ρόλο: TV · «strip/ταινία/led» → ταινία · αλλιώς λάμπα αν έχει χρώμα/ένταση. Ο χρήστης τον αλλάζει.
      const guess = isTv ? 'tv' : /strip|ταιν|led|light ?strip|tape/i.test(name) ? 'strip' : (caps.includes('colorControl') || caps.includes('switchLevel') ? 'lamp' : 'off');
      return { id: d.deviceId, label: name || d.deviceId, room: d.roomId || '', caps, tv: isTv, role: old?.role || guess };
    }).filter(Boolean);
    await persist({ devices, lastError: '', lastOkAt: now() });
    return devices;
  }

  // ---------- Ουρά εντολών: το πιο πρόσφατο κερδίζει, ≥5″ ανά συσκευή ----------
  function want(d, scene) {
    if (!scene) return null;
    if (d.role === 'lamp') return scene.lamp || null;
    if (d.role === 'strip') return scene.strip || null;
    return null;
  }
  function schedule(d, w, { force = false } = {}) {
    if (!w) return;
    const s = dev.get(d.id) || { sentKey: '', lastAt: 0, pausedUntil: 0, pending: null, timer: null };
    dev.set(d.id, s);
    const key = wantKey(w);
    if (!force && key === s.sentKey && !s.pending) return;
    s.pending = { w, key, d };
    if (s.timer) return;
    const wait = Math.max(0, s.lastAt + DEVICE_MIN_GAP_MS - now(), s.pausedUntil - now());
    s.timer = setTimeout(() => flush(d.id), wait);
    s.timer.unref?.();
  }
  async function flush(id) {
    const s = dev.get(id);
    if (!s) return;
    s.timer = null;
    const p = s.pending;
    s.pending = null;
    if (!p || p.key === s.sentKey) return;
    const commands = commandsFor(p.w, p.d.caps);
    if (!commands.length) return;
    s.lastAt = now();
    try {
      await api(`/v1/devices/${encodeURIComponent(id)}/commands`, { method: 'POST', body: { commands } });
      s.sentKey = p.key;
      if (cfg.lastError) await persist({ lastError: '', lastOkAt: now() }); else cfg.lastOkAt = now();
    } catch (e) {
      if (e.rate) s.pausedUntil = now() + BACKOFF_MS;
      if (!s.pending) s.pending = p; // ξαναδοκιμάζει αργότερα
      if (!e.rate) { log(`[lights] ${e.message}`); if (cfg.lastError !== e.message) await persist({ lastError: e.message }).catch(() => {}); }
      if (!s.timer) { s.timer = setTimeout(() => flush(id), e.rate ? BACKOFF_MS : 15000); s.timer.unref?.(); }
    }
  }

  async function apply(scene, opts) {
    const c = await getCfg();
    for (const d of c.devices || []) schedule(d, want(d, scene), opts);
  }

  // ---------- Οδηγός: ακούει τις αλλαγές του παιχνιδιού ----------
  async function evaluate() {
    const c = await getCfg();
    if (!c.enabled || !c.auth || !driving) return null;
    const scene = lightScene(driving.state, now(), { calm: c.calm });
    if (scene) await apply(scene);
    return scene;
  }
  const tvOnFor = new Set(); // συνεδρίες όπου ανοίξαμε ήδη την TV (μία φορά, ποτέ κλείσιμο)
  async function tvOn(code) {
    const c = await getCfg();
    if (!c.enabled || !c.auth || tvOnFor.has(code)) return;
    const tvs = (c.devices || []).filter((d) => d.role === 'tv');
    if (!tvs.length) return;
    tvOnFor.add(code);
    for (const d of tvs) schedule(d, { on: true }, { force: true });
  }
  function onSession(record) {
    if (!record?.state) return;
    driving = { code: record.sessionCode, state: record.state };
    if (record.state.mg?.cg && record.state.lightsOn !== false) tvOn(record.sessionCode).catch(() => {});
    evaluate().catch(() => {});
    if (!tick) { tick = setInterval(() => evaluate().catch(() => {}), 1000); tick.unref?.(); } // για τις χρονικές μεταβάσεις (π.χ. τέλος περιστροφής Τροχού)
  }

  // Χειροκίνητη σκηνή (δοκιμή από το Admin).
  async function test(role, sceneId = 'test') {
    const palette = { test: { lamp: { on: true, level: 80, hue: 89, saturation: 85 }, strip: { on: true, level: 100, hue: 53, saturation: 90 } },
      normal: { lamp: { on: true, level: 90, kelvin: 2700 }, strip: { on: true, level: 60, kelvin: 2700 } },
      off: { lamp: { on: false }, strip: { on: false } } }[sceneId] || null;
    const c = await getCfg();
    for (const d of c.devices || []) {
      if (d.role === 'tv') { if (d.id === role && sceneId === 'test') schedule(d, { on: true }, { force: true }); continue; } // η TV δεν σβήνει/χρωματίζεται ποτέ
      if (!role || d.role === role || d.id === role) schedule(d, palette && (d.role === 'strip' ? palette.strip : palette.lamp), { force: true });
    }
  }

  function stop() { if (tick) clearInterval(tick); tick = null; for (const s of dev.values()) if (s.timer) clearTimeout(s.timer); dev.clear(); }

  return { getCfg, persist, discover, exchangeCode, refresh, onSession, evaluate, test, apply, stop, _dev: dev };
}
