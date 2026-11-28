import test from 'node:test';
import assert from 'node:assert/strict';
import { createLights, publicStatus, PAT_TTL_MS, DEVICE_MIN_GAP_MS } from '../server/lightsCore.js';
import { initCampaign, startAct } from '../src/lib/campaignEngine.js';

const players = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }];
const DEVICES = { items: [
  { deviceId: 'L1', label: 'Tapo Σαλόνι', components: [{ id: 'main', capabilities: [{ id: 'switch' }, { id: 'switchLevel' }, { id: 'colorControl' }, { id: 'colorTemperature' }] }] },
  { deviceId: 'S1', label: 'Tapo LED Strip TV', components: [{ id: 'main', capabilities: [{ id: 'switch' }, { id: 'switchLevel' }, { id: 'colorControl' }] }] },
  { deviceId: 'X1', label: 'Θερμοστάτης', components: [{ id: 'main', capabilities: [{ id: 'temperatureMeasurement' }] }] },
] };

function rig({ clock = { t: 1_000_000 }, responder } = {}) {
  let stored = null;
  const calls = [];
  const fetchImpl = async (url, opts = {}) => {
    calls.push({ url, opts, body: opts.body ? (opts.headers?.['Content-Type']?.includes('json') ? JSON.parse(opts.body) : opts.body) : null });
    const r = responder?.(url, opts, calls) || null;
    if (r) return r;
    if (url.endsWith('/v1/devices')) return { ok: true, status: 200, json: async () => DEVICES };
    if (url.includes('/commands')) return { ok: true, status: 200, json: async () => ({}) };
    return { ok: false, status: 404, json: async () => ({}) };
  };
  const L = createLights({ load: async () => stored, save: async (c) => { stored = JSON.parse(JSON.stringify(c)); }, fetchImpl, now: () => clock.t });
  return { L, calls, clock, stored: () => stored };
}
const cmds = (calls) => calls.filter((c) => c.url.includes('/commands'));

test('φώτα/server: το token των 24 ωρών λήγει με καθαρό μήνυμα', async () => {
  const { L, clock } = rig();
  await L.persist({ auth: { type: 'pat', token: 'x'.repeat(30), createdAt: clock.t } });
  assert.equal((await L.discover()).length, 2);
  clock.t += PAT_TTL_MS + 1;
  await assert.rejects(() => L.discover(), /έληξε/);
  assert.equal(publicStatus(await L.getCfg(), clock.t).auth.expired, true);
});

test('φώτα/server: εύρεση συσκευών, ρόλοι, κανένα μυστικό στην κατάσταση', async () => {
  const { L, clock } = rig();
  await L.persist({ auth: { type: 'pat', token: 'secret-token-123456789', createdAt: clock.t } });
  const d = await L.discover();
  assert.deepEqual(d.map((x) => [x.id, x.role]), [['L1', 'lamp'], ['S1', 'strip']]);
  const pub = JSON.stringify(publicStatus(await L.getCfg(), clock.t));
  assert.ok(!pub.includes('secret-token'));
});

test('φώτα/server: σκηνή από το παιχνίδι, χωρίς διπλές εντολές, ≥5″ ανά συσκευή, ΣΤΟΠ', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  const { L, calls, clock } = rig();
  await L.persist({ enabled: true, auth: { type: 'pat', token: 'y'.repeat(30), createdAt: clock.t } });
  await L.discover();
  const cg = startAct(initCampaign(players, { format: 'h48', now: clock.t - 60000 }), players, clock.t - 30000);
  L.onSession({ sessionCode: 'S', state: { mg: { cg } } });
  await new Promise((r) => setImmediate(r)); t.mock.timers.tick(0); await new Promise((r) => setImmediate(r));
  assert.equal(cmds(calls).length, 2); // λάμπα + ταινία
  L.onSession({ sessionCode: 'S', state: { mg: { cg } } });
  await new Promise((r) => setImmediate(r)); t.mock.timers.tick(0); await new Promise((r) => setImmediate(r));
  assert.equal(cmds(calls).length, 2); // ίδια σκηνή → τίποτα
  // ΣΤΟΠ αμέσως μετά: περιμένει το όριο των 5″
  L.onSession({ sessionCode: 'S', state: { stopActive: true, mg: { cg } } });
  await new Promise((r) => setImmediate(r));
  assert.equal(cmds(calls).length, 2);
  clock.t += DEVICE_MIN_GAP_MS; t.mock.timers.tick(DEVICE_MIN_GAP_MS);
  await new Promise((r) => setImmediate(r)); await new Promise((r) => setImmediate(r));
  const stop = cmds(calls).slice(2);
  assert.equal(stop.length, 2);
  const lamp = stop.find((c) => c.url.includes('/L1/')).body.commands;
  assert.ok(lamp.some((c) => c.command === 'setColorTemperature'));
  assert.equal(lamp.find((c) => c.command === 'setLevel').arguments[0], 100);
  L.stop();
});

test('φώτα/server: απενεργοποιημένα = καμία εντολή', async () => {
  const { L, calls, clock } = rig();
  await L.persist({ enabled: false, auth: { type: 'pat', token: 'z'.repeat(30), createdAt: clock.t } });
  await L.discover();
  L.onSession({ sessionCode: 'S', state: { stopActive: true } });
  assert.equal(await L.evaluate(), null);
  assert.equal(cmds(calls).length, 0);
  L.stop();
});

test('φώτα/server: μόνιμη σύνδεση — ανανέωση σε 401 και φύλαξη του νέου refresh token', async () => {
  let first = true;
  const { L, calls, clock, stored } = rig({ responder: (url) => {
    if (url.endsWith('/oauth/token')) return { ok: true, status: 200, json: async () => ({ access_token: 'NEW', refresh_token: 'R2', expires_in: 86399 }) };
    if (url.endsWith('/v1/devices') && first) { first = false; return { ok: false, status: 401, json: async () => ({}) }; }
    return null;
  } });
  await L.persist({ auth: { type: 'oauth', clientId: 'client-123456', clientSecret: 'sec-123456789', accessToken: 'OLD', refreshToken: 'R1', expiresAt: clock.t + 3600_000 } });
  const d = await L.discover();
  assert.equal(d.length, 2);
  const tok = calls.find((c) => c.url.endsWith('/oauth/token'));
  assert.match(tok.body, /grant_type=refresh_token/);
  assert.match(tok.body, /refresh_token=R1/);
  assert.equal(stored().auth.refreshToken, 'R2');
  assert.equal(stored().auth.accessToken, 'NEW');
});

test('φώτα/server: η Samsung TV ανοίγει μία φορά με την Ταινία, ποτέ δεν σβήνει', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  const TV = { items: [...DEVICES.items, { deviceId: 'TV1', label: 'Samsung QLED', components: [{ id: 'main', capabilities: [{ id: 'switch' }, { id: 'samsungvd.mediaInputSource' }] }] }] };
  const { L, calls, clock } = rig({ responder: (url) => (url.endsWith('/v1/devices') ? { ok: true, status: 200, json: async () => TV } : null) });
  await L.persist({ enabled: true, auth: { type: 'pat', token: 'w'.repeat(30), createdAt: clock.t } });
  const devs = await L.discover();
  assert.equal(devs.find((d) => d.id === 'TV1').role, 'tv');
  const cg = startAct(initCampaign(players, { format: 'h48', now: clock.t - 60000 }), players, clock.t - 30000);
  for (let i = 0; i < 3; i += 1) { L.onSession({ sessionCode: 'S', state: { mg: { cg } } }); await new Promise((r) => setImmediate(r)); t.mock.timers.tick(0); await new Promise((r) => setImmediate(r)); }
  const tv = cmds(calls).filter((c) => c.url.includes('/TV1/'));
  assert.equal(tv.length, 1);
  assert.deepEqual(tv[0].body.commands.map((c) => c.command), ['on']);
  await L.test(null, 'off'); clock.t += 10000; t.mock.timers.tick(10000); await new Promise((r) => setImmediate(r));
  assert.equal(cmds(calls).filter((c) => c.url.includes('/TV1/')).length, 1); // «Σβήσε όλα» δεν σβήνει την TV
  L.stop();
});
