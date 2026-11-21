import test from 'node:test';
import assert from 'node:assert/strict';
import { tvStingers } from '../src/lib/tvStingers.js';

test('TV stingers: παίζουν μόνο για καινούργια γεγονότα', () => {
  assert.deepEqual(tvStingers({}, {}), []);
  const before = { lastRoll: { at: 1 }, round: 1 };
  assert.deepEqual(tvStingers(before, before), []);
  assert.deepEqual(tvStingers(before, { ...before, lastRoll: { at: 2, square: 'loot' } }), ['dice', 'loot']);
  assert.deepEqual(tvStingers(before, { ...before, card: { at: 5, market: true } }), ['market']);
  assert.deepEqual(tvStingers(before, { ...before, interro: { id: 'x' } }), ['arrest']);
  assert.deepEqual(tvStingers(before, { ...before, verdict: { at: 9, key: 'allTruth' } }), ['truth']);
  assert.deepEqual(tvStingers(before, { ...before, verdict: { at: 9, key: 'someLies' } }), ['lie']);
  assert.deepEqual(tvStingers(before, { ...before, round: 2 }), ['round']);
  assert.deepEqual(tvStingers(before, { ...before, queen: 'p1' }), ['crown']);
});

test('κάμερα: μόνο ο admin ανοίγει/απαντά, η TV μόνο με ενεργό camId', async () => {
  process.env.JWT_SECRET ||= 'test-secret-test-secret-test-secret-123';
  process.env.DATABASE_URL ||= 'postgresql://u:p@127.0.0.1:1/none';
  const { default: express } = await import('express');
  const { cameraRoutes } = await import('../server/camera.js');
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { if (req.headers['x-admin']) req.user = { role: 'admin' }; next(); });
  app.use('/api/camera', cameraRoutes());
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}/api/camera/ABC1`;
  const send = (method, path, body, admin) => fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(admin ? { 'x-admin': '1' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const sdp = 'v=0\r\no=- 1 2 IN IP4 127.0.0.1\r\ns=-\r\n';
  try {
    assert.equal((await send('POST', '/start', {})).status, 401);
    const { camId } = await (await send('POST', '/start', {}, true)).json();
    assert.ok(camId);
    assert.equal((await send('POST', '/viewer', { camId: 'wrong', sdp })).status, 404);
    assert.equal((await send('POST', '/viewer', { camId, sdp: 'nonsense' })).status, 400);
    const { viewerId } = await (await send('POST', '/viewer', { camId, sdp })).json();
    assert.equal((await (await send('GET', `/viewer/${viewerId}`)).json()).answer, null);
    assert.equal((await send('GET', `/pending?camId=${camId}`)).status, 401);
    const { pending } = await (await send('GET', `/pending?camId=${camId}`, null, true)).json();
    assert.equal(pending[0].viewerId, viewerId);
    assert.equal((await send('POST', '/answer', { camId, viewerId, sdp }, true)).status, 200);
    assert.equal((await (await send('GET', `/viewer/${viewerId}`)).json()).answer, sdp);
    await send('DELETE', '', null, true);
    assert.equal((await send('POST', '/viewer', { camId, sdp })).status, 404);
  } finally {
    server.close();
  }
});
