import crypto from 'node:crypto';
import express from 'express';
import { query, pool } from './db.js';
import { requireAdmin } from './auth.js';
import { notifyNewSubmission } from './push.js';

// Entities that used to live in base44/entities/*.jsonc
export const ENTITIES = [
  'Achievement', 'AppSetting', 'BacheloretteIntake', 'BlackmailVault', 'Chronicle', 'GameContent',
  'GameSession', 'Haunting', 'InvitationRSVP', 'Memorial', 'PajamaContent', 'PajamaIntake',
  'PlayerIntake', 'PlayerProfile', 'SessionArchive',
];

// Who may do what. Default for every operation is "public" (the phones/TV
// screens at the party are not logged in); anything listed here is tightened.
//   read   = filter / get / stream      count = count
const ADMIN = 'admin';
const rules = {
  // personal answers: anyone can submit the form, only admins can read them
  PlayerIntake:       { read: ADMIN, update: ADMIN, delete: ADMIN },
  PajamaIntake:       { read: ADMIN, update: ADMIN, delete: ADMIN },
  BacheloretteIntake: { read: ADMIN, update: ADMIN, delete: ADMIN },
  InvitationRSVP:     { update: ADMIN, delete: ADMIN },
  // configuration / content: everybody reads, only admins change
  AppSetting:     { create: ADMIN, update: ADMIN, delete: ADMIN },
  GameContent:    { create: ADMIN, update: ADMIN, delete: ADMIN },
  PajamaContent:  { create: ADMIN, update: ADMIN, delete: ADMIN },
  // Private game records and player profiles are visible only to administrators.
  BlackmailVault: { read: ADMIN, create: ADMIN, update: ADMIN, delete: ADMIN },
  PlayerProfile:  { read: ADMIN, create: ADMIN, update: ADMIN, delete: ADMIN },
  SessionArchive: { read: ADMIN, create: ADMIN, update: ADMIN, delete: ADMIN },
  Chronicle:      { read: ADMIN, create: ADMIN, update: ADMIN, delete: ADMIN },
  // Sessions are created and deleted by the Game Master. Player writes use the
  // session-scoped, validated update path below.
  GameSession:     { create: ADMIN, delete: ADMIN },
};
const needsAdmin = (entity, op) => (rules[entity]?.[op] || 'public') === ADMIN;
const isAdmin = (req) => req.user?.role === 'admin';
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const sameJson = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const withoutKeys = (value, keys) => Object.fromEntries(Object.entries(value || {}).filter(([key]) => !keys.includes(key)));
const sameExceptKeys = (before, after, keys) => sameJson(withoutKeys(before, keys), withoutKeys(after, keys));
const onlyOwnMapEntryChanged = (before, after, playerId) => {
  if (!isObject(before) || !isObject(after)) return false;
  return sameJson(withoutKeys(before, [playerId]), withoutKeys(after, [playerId]));
};
const deepMerge = (target, patch) => {
  if (!isObject(target) || !isObject(patch)) return patch;
  const merged = { ...target };
  for (const [key, value] of Object.entries(patch)) {
    merged[key] = isObject(value) && isObject(target[key]) ? deepMerge(target[key], value) : value;
  }
  return merged;
};

function validatePlayerPatch(current, patch, playerId) {
  if (!isObject(patch) || !Object.keys(patch).length) return false;
  const allowed = new Set([
    'mobileVotes', 'electricChairVotes', 'juryTrial', 'grandJury', 'privateMessages',
    'sealedVotes', 'miniGameVolunteers', 'miniGameVotes', 'miniGameRatings',
    'snitchVotes', 'history', 'timeCapsule', 'lastWish', 'midnightPact',
    'pajama', 'mg', 'players',
  ]);
  if (Object.keys(patch).some((key) => !allowed.has(key))) return false;
  const player = (current.players || []).find((item) => item.id === playerId);
  if (!player) return false;

  const ownMaps = ['mobileVotes', 'electricChairVotes', 'miniGameVolunteers', 'miniGameVotes', 'miniGameRatings', 'snitchVotes', 'timeCapsule'];
  for (const key of ownMaps) {
    if (key in patch && !onlyOwnMapEntryChanged(current[key] || {}, patch[key] || {}, playerId)) return false;
  }

  if ('juryTrial' in patch) {
    if (!isObject(patch.juryTrial) || !sameExceptKeys(current.juryTrial, patch.juryTrial, ['votes']) ||
        !onlyOwnMapEntryChanged(current.juryTrial?.votes || {}, patch.juryTrial.votes || {}, playerId)) return false;
  }

  if ('grandJury' in patch) {
    const old = current.grandJury || {};
    const next = patch.grandJury;
    if (!isObject(next) || !sameExceptKeys(old, next, ['queenVotes', 'championVotes']) ||
        !onlyOwnMapEntryChanged(old.queenVotes || {}, next.queenVotes || {}, playerId) ||
        !onlyOwnMapEntryChanged(old.championVotes || {}, next.championVotes || {}, playerId)) return false;
  }

  if ('privateMessages' in patch) {
    const old = current.privateMessages || {};
    const next = patch.privateMessages;
    if (!isObject(next) || !sameExceptKeys(old, next, [playerId])) return false;
    const before = old[playerId] || [];
    const after = next[playerId] || [];
    if (!Array.isArray(before) || !Array.isArray(after) || before.length !== after.length) return false;
    for (let i = 0; i < before.length; i++) {
      if (before[i]?.id !== after[i]?.id ||
          !sameExceptKeys(before[i], after[i], ['read', 'dismissed']) ||
          (after[i]?.read !== undefined && typeof after[i].read !== 'boolean') ||
          (after[i]?.dismissed !== undefined && typeof after[i].dismissed !== 'boolean')) return false;
    }
  }

  if ('sealedVotes' in patch) {
    const old = current.sealedVotes || {};
    const next = patch.sealedVotes;
    if (!isObject(next) || !sameJson(Object.keys(old).sort(), Object.keys(next).sort())) return false;
    for (const id of Object.keys(old)) {
      if (!isObject(next[id]) || !sameExceptKeys(old[id], next[id], ['votes']) ||
          !onlyOwnMapEntryChanged(old[id]?.votes || {}, next[id]?.votes || {}, playerId)) return false;
    }
  }

  if ('midnightPact' in patch) {
    const old = current.midnightPact || {};
    const next = patch.midnightPact;
    if (!isObject(next) || !sameExceptKeys(old, next, ['offers']) ||
        !onlyOwnMapEntryChanged(old.offers || {}, next.offers || {}, playerId)) return false;
  }

  if ('lastWish' in patch) {
    const old = current.lastWish || {};
    const next = patch.lastWish;
    if (!isObject(next) || old.playerId !== next.playerId || old.playerId !== current.lastWish?.playerId) return false;
    if (old.phase === 'input' && old.playerId === playerId) {
      if (!sameExceptKeys(old, next, ['wish', 'phase', 'votes']) ||
          typeof next.wish !== 'string' || !next.wish.trim() || next.wish.length > 160 ||
          next.phase !== 'vote' || !isObject(next.votes) || Object.keys(next.votes).length) return false;
    } else if (old.phase === 'vote') {
      if (!sameExceptKeys(old, next, ['votes', 'phase', 'accepted']) ||
          !onlyOwnMapEntryChanged(old.votes || {}, next.votes || {}, playerId)) return false;
      if (next.phase === 'result') {
        const voters = (current.players || []).filter((p) => p.id !== old.playerId);
        if (!voters.every((p) => next.votes?.[p.id] !== undefined)) return false;
        const yes = Object.values(next.votes).filter(Boolean).length;
        const no = Object.values(next.votes).filter((v) => v === false).length;
        if (next.accepted !== (yes > no)) return false;
      } else if (next.phase !== old.phase) return false;
    } else return false;
  }

  if ('pajama' in patch) {
    const old = current.pajama || {};
    const next = patch.pajama;
    if (!isObject(next) || !sameExceptKeys(old, next, ['confessions'])) return false;
    const before = old.confessions || [];
    const after = next.confessions || [];
    if (!Array.isArray(before) || !Array.isArray(after)) return false;
    const beforeOther = before.filter((item) => item.playerId !== playerId);
    const afterOther = after.filter((item) => item.playerId !== playerId);
    const own = after.find((item) => item.playerId === playerId);
    if (!sameJson(beforeOther, afterOther) || (own && (typeof own.text !== 'string' || own.text.length > 1000))) return false;
  }

  if ('mg' in patch) {
    const old = current.mg || {};
    const next = patch.mg;
    if (!isObject(next) || old.stop || next.stop !== true || next.stopBy !== playerId ||
        !sameExceptKeys(old, next, ['stop', 'stopAt', 'stopBy', 'timer'])) return false;
  }

  if ('players' in patch) {
    const old = current.players || [];
    const next = patch.players;
    if (!Array.isArray(next) || old.length !== next.length) return false;
    const changed = old.filter((p, i) => !sameJson(p, next[i]));
    if (changed.length !== 1 || changed[0]?.id !== playerId) return false;
    const before = old.find((p) => p.id === playerId);
    const after = next.find((p) => p.id === playerId);
    if (!before || !after || !sameExceptKeys(before, after, ['penaltyStep']) ||
        ![-1, 1].includes((after.penaltyStep || 0) - (before.penaltyStep || 0))) return false;
  }

  if ('history' in patch) {
    if (!Array.isArray(patch.history) || patch.history.length > 50) return false;
    const allowedHistory = ('snitchVotes' in patch && 'players' in current) ||
      ('players' in patch) || ('lastWish' in patch && patch.lastWish?.phase === 'result');
    if (!allowedHistory) return false;
    const entry = patch.history[0];
    if (!entry || !['snitch_vote', 'double_down', 'last_wish'].includes(entry.type)) return false;
    if (entry.type === 'snitch_vote' && entry.voter !== player.name) return false;
    if (entry.type === 'double_down' && entry.player !== player.name) return false;
  }

  return true;
}

const FIELD = /^[A-Za-z0-9_]+$/;
const BUILTIN_COLS = { id: 'id', created_date: 'created_date', updated_date: 'updated_date', created_by: 'created_by' };
const MAX_LIMIT = 1000;

// ---------- row <-> record ----------
const toRecord = (row) => ({
  ...row.data, id: row.id, created_date: row.created_date, updated_date: row.updated_date, created_by: row.created_by,
});
const stripBuiltins = (obj) => {
  const { id, created_date, updated_date, created_by, ...rest } = obj || {};
  return rest;
};

// ---------- sorting ("-created_date", "order", "-chapter") ----------
function orderBy(sort) {
  if (typeof sort !== 'string' || !sort) return 'created_date DESC, id DESC';
  const dir = sort.startsWith('-') ? 'DESC' : 'ASC';
  const field = sort.replace(/^[-+]/, '');
  if (!FIELD.test(field)) return 'created_date DESC, id DESC';
  if (BUILTIN_COLS[field]) return `${BUILTIN_COLS[field]} ${dir}, id ${dir}`;
  // numeric-looking values sort as numbers, everything else as text
  return `(CASE WHEN data->>'${field}' ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN (data->>'${field}')::numeric END) ${dir} NULLS LAST, data->>'${field}' ${dir}, id ${dir}`;
}

// ---------- where (equality filters, like the Base44 SDK usage in this app) ----------
function buildWhere(entity, q, params) {
  params.push(entity);
  let sql = `entity = $${params.length}`;
  const eq = {};
  for (const [k, v] of Object.entries(q || {})) {
    if (!FIELD.test(k)) continue;
    if (BUILTIN_COLS[k]) { params.push(v); sql += ` AND ${BUILTIN_COLS[k]} = $${params.length}`; }
    else eq[k] = v;
  }
  if (Object.keys(eq).length) { params.push(JSON.stringify(eq)); sql += ` AND data @> $${params.length}::jsonb`; }
  return sql;
}

// ---------- realtime ----------
const streams = new Map(); // entity -> Set<res>
function broadcast(entity, event) {
  const set = streams.get(entity);
  if (!set) return;
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of set) res.write(payload);
}
// keep proxies (Railway) from closing idle connections
setInterval(() => { for (const set of streams.values()) for (const res of set) res.write(': ping\n\n'); }, 25000).unref();

export function entityRoutes() {
  const r = express.Router();

  r.param('entity', (req, res, next, name) => {
    if (!ENTITIES.includes(name)) return res.status(404).json({ error: `Unknown entity ${name}` });
    req.entity = name;
    next();
  });
  const guard = (op) => (req, res, next) => (needsAdmin(req.entity, op) ? requireAdmin(req, res, next) : next());

  // --- realtime stream (EventSource can't send headers; the token may come as ?token=) ---
  r.get('/:entity/stream', guard('read'), async (req, res) => {
    let sessionCode = null;
    if (req.entity === 'GameSession') {
      sessionCode = String(req.query.sessionCode || '').trim().toUpperCase() || null;
      if (!isAdmin(req) && !sessionCode) return res.status(400).json({ error: 'sessionCode required' });
      if (sessionCode) {
        const { rowCount } = await query("SELECT 1 FROM records WHERE entity = 'GameSession' AND data->>'sessionCode' = $1 LIMIT 1", [sessionCode]);
        if (!rowCount) return res.status(404).json({ error: 'Session not found' });
      }
    }
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.flushHeaders();
    res.write('retry: 2000\\n\\n');
    if (!streams.has(req.entity)) streams.set(req.entity, new Set());
    const subscriber = { res, sessionCode };
    streams.get(req.entity).add(subscriber);
    req.on('close', () => streams.get(req.entity)?.delete(subscriber));
  });

  r.post('/:entity/filter', guard('read'), async (req, res) => {
    const { query: q, sort, limit, skip } = req.body || {};
    let effectiveQuery = q || {};
    let effectiveSort = sort;
    let effectiveLimit = limit;
    let effectiveSkip = skip;
    if (req.entity === 'GameSession' && !isAdmin(req)) {
      const keys = Object.keys(effectiveQuery);
      if (keys.length && (keys.length !== 1 || keys[0] !== 'sessionCode' || typeof effectiveQuery.sessionCode !== 'string')) {
        return res.status(403).json({ error: 'Only session-code lookup is available' });
      }
      effectiveQuery = keys.length ? { sessionCode: effectiveQuery.sessionCode.trim().toUpperCase() } : {};
      effectiveSort = '-created_date';
      effectiveLimit = 1;
      effectiveSkip = 0;
    }
    const params = [];
    const where = buildWhere(req.entity, effectiveQuery, params);
    const lim = Math.min(Math.max(parseInt(effectiveLimit, 10) || 50, 1), req.entity === 'GameSession' && !isAdmin(req) ? 1 : MAX_LIMIT);
    const off = Math.max(parseInt(effectiveSkip, 10) || 0, 0);
    const { rows } = await query(`SELECT * FROM records WHERE ${where} ORDER BY ${orderBy(effectiveSort)} LIMIT ${lim} OFFSET ${off}`, params);
    res.json({ items: rows.map(toRecord) });
  });

  r.post('/:entity/count', guard('count'), async (req, res) => {
    if (req.entity === 'GameSession' && !isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
    const params = [];
    const where = buildWhere(req.entity, req.body?.query, params);
    const { rows } = await query(`SELECT count(*)::int AS count FROM records WHERE ${where}`, params);
    res.json({ count: rows[0].count });
  });

  r.get('/:entity/:id', guard('read'), async (req, res) => {
    if (req.entity === 'GameSession' && !isAdmin(req)) return res.status(403).json({ error: 'Use session-code lookup' });
    const { rows } = await query('SELECT * FROM records WHERE id = $1 AND entity = $2', [req.params.id, req.entity]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(toRecord(rows[0]));
  });

  r.post('/:entity', guard('create'), async (req, res) => {
    const { rows } = await query(
      'INSERT INTO records (id, entity, data, created_by) VALUES ($1,$2,$3,$4) RETURNING *',
      [crypto.randomUUID(), req.entity, stripBuiltins(req.body), req.user?.email || null],
    );
    const rec = toRecord(rows[0]);
    broadcast(req.entity, { type: 'create', id: rec.id, data: rec });
    notifyNewSubmission(req.entity, rec);
    res.json(rec);
  });

  r.post('/:entity/bulk', guard('create'), async (req, res) => {
    if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Expected an array' });
    const client = await pool.connect();
    const created = [];
    try {
      await client.query('BEGIN');
      for (const item of req.body) {
        const { rows } = await client.query(
          'INSERT INTO records (id, entity, data, created_by) VALUES ($1,$2,$3,$4) RETURNING *',
          [crypto.randomUUID(), req.entity, stripBuiltins(item), req.user?.email || null],
        );
        created.push(toRecord(rows[0]));
      }
      await client.query('COMMIT');
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
    created.forEach((rec) => broadcast(req.entity, { type: 'create', id: rec.id, data: rec }));
    res.json(created);
  });

  r.patch('/:entity/:id', guard('update'), async (req, res) => {
    if (req.entity === 'GameSession') {
      const { sessionCode, playerId, statePatch } = req.body || {};
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const { rows: found } = await client.query(
          'SELECT * FROM records WHERE id = $1 AND entity = $2 FOR UPDATE',
          [req.params.id, req.entity],
        );
        if (!found[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }
        const current = toRecord(found[0]);
        if (isAdmin(req)) {
          if (isObject(statePatch)) {
            const mergedState = deepMerge(current.state || {}, statePatch);
            const { rows } = await client.query(
              "UPDATE records SET data = data || $1::jsonb, updated_date = now() WHERE id = $2 AND entity = $3 RETURNING *",
              [JSON.stringify({ state: mergedState }), req.params.id, req.entity],
            );
            await client.query('COMMIT');
            const rec = toRecord(rows[0]);
            broadcast(req.entity, { type: 'update', id: rec.id, data: rec });
            return res.json(rec);
          }
          const { rows } = await client.query(
            'UPDATE records SET data = data || $1::jsonb, updated_date = now() WHERE id = $2 AND entity = $3 RETURNING *',
            [JSON.stringify(stripBuiltins(req.body)), req.params.id, req.entity],
          );
          await client.query('COMMIT');
          const rec = toRecord(rows[0]);
          broadcast(req.entity, { type: 'update', id: rec.id, data: rec });
          return res.json(rec);
        }
        if (typeof sessionCode !== 'string' || !playerId || !isObject(statePatch) ||
            current.sessionCode !== sessionCode.trim().toUpperCase() ||
            !validatePlayerPatch(current.state || {}, statePatch, playerId)) {
          await client.query('ROLLBACK');
          return res.status(403).json({ error: 'Player update is not permitted' });
        }
        const mergedState = deepMerge(current.state || {}, statePatch);
        const { rows } = await client.query(
          "UPDATE records SET data = data || $1::jsonb, updated_date = now() WHERE id = $2 AND entity = $3 RETURNING *",
          [JSON.stringify({ state: mergedState }), req.params.id, req.entity],
        );
        await client.query('COMMIT');
        const rec = toRecord(rows[0]);
        broadcast(req.entity, { type: 'update', id: rec.id, data: rec });
        return res.json(rec);
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    }
    const { rows } = await query(
      'UPDATE records SET data = data || $1::jsonb, updated_date = now() WHERE id = $2 AND entity = $3 RETURNING *',
      [JSON.stringify(stripBuiltins(req.body)), req.params.id, req.entity],
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    const rec = toRecord(rows[0]);
    broadcast(req.entity, { type: 'update', id: rec.id, data: rec });
    res.json(rec);
  });

  r.delete('/:entity/:id', guard('delete'), async (req, res) => {
    const { rowCount } = await query('DELETE FROM records WHERE id = $1 AND entity = $2', [req.params.id, req.entity]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    broadcast(req.entity, { type: 'delete', id: req.params.id, data: { id: req.params.id } });
    res.json({ success: true });
  });

  r.post('/:entity/delete-many', guard('delete'), async (req, res) => {
    const params = [];
    const where = buildWhere(req.entity, req.body?.query, params);
    const { rows } = await query(`DELETE FROM records WHERE ${where} RETURNING id`, params);
    rows.forEach(({ id }) => broadcast(req.entity, { type: 'delete', id, data: { id } }));
    res.json({ deleted: rows.length, has_more: false });
  });

  return r;
}

// Used by server-side functions
export const entityApi = {
  async filter(entity, q = {}, { sort, limit = 50 } = {}) {
    const params = [];
    const where = buildWhere(entity, q, params);
    const { rows } = await query(`SELECT * FROM records WHERE ${where} ORDER BY ${orderBy(sort)} LIMIT ${Math.min(limit, MAX_LIMIT)}`, params);
    return rows.map(toRecord);
  },
  async create(entity, data) {
    const { rows } = await query('INSERT INTO records (id, entity, data) VALUES ($1,$2,$3) RETURNING *', [crypto.randomUUID(), entity, stripBuiltins(data)]);
    const rec = toRecord(rows[0]);
    broadcast(entity, { type: 'create', id: rec.id, data: rec });
    return rec;
  },
  async update(entity, id, data) {
    const { rows } = await query('UPDATE records SET data = data || $1::jsonb, updated_date = now() WHERE id = $2 AND entity = $3 RETURNING *', [JSON.stringify(stripBuiltins(data)), id, entity]);
    const rec = toRecord(rows[0]);
    broadcast(entity, { type: 'update', id: rec.id, data: rec });
    return rec;
  },
};
