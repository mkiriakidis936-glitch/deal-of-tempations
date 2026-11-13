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
const noChangesOutsideKeys = (before, after, keys) => {
  if (!isObject(before) || !isObject(after)) return false;
  return Object.entries(after).every(([key, value]) =>
    keys.includes(key) || (Object.prototype.hasOwnProperty.call(before, key) && sameJson(before[key], value))
  );
};
const onlyOwnMapEntryChanged = (before, after, playerId) => {
  if (!isObject(before) || !isObject(after)) return false;
  return Object.entries(after).every(([key, value]) =>
    key === playerId || key.startsWith('__redacted_') || (Object.prototype.hasOwnProperty.call(before, key) && sameJson(before[key], value))
  );
};
const deepMerge = (target, patch, field = '', allowClear = false) => {
  if (Array.isArray(target) && Array.isArray(patch)) {
    if (patch.length === 0 && allowClear) return [];
    if (field === 'players' || field === 'confessions') {
      const key = field === 'players' ? 'id' : 'playerId';
      const merged = new Map(target.map((item) => [item?.[key], item]));
      for (const item of patch) {
        const id = item?.[key];
        if (id == null) continue;
        merged.set(id, merged.has(id) ? deepMerge(merged.get(id), item, '', allowClear) : item);
      }
      return [...merged.values()];
    }
    if (field === 'history') {
      const entries = new Map();
      for (const item of [...patch, ...target]) {
        const key = item?.timestamp != null
          ? `${item.timestamp}:${item.type || ''}:${item.player || item.voter || ''}`
          : JSON.stringify(item);
        if (!entries.has(key)) entries.set(key, item);
      }
      return [...entries.values()].sort((a, b) => (b?.timestamp || 0) - (a?.timestamp || 0)).slice(0, 50);
    }
    if (target.every((item) => isObject(item) && item.id) && patch.every((item) => isObject(item) && item.id)) {
      const merged = new Map(target.map((item) => [item.id, item]));
      for (const item of patch) merged.set(item.id, merged.has(item.id) ? deepMerge(merged.get(item.id), item) : item);
      return [...merged.values()];
    }
    return patch;
  }
  if (!isObject(target) || !isObject(patch)) return patch;
  const merged = { ...target };
  for (const [key, value] of Object.entries(patch)) {
    if (key.startsWith('__redacted_')) continue;
    merged[key] = deepMerge(target[key], value, key, allowClear);
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
  const playerIds = new Set((current.players || []).map((item) => item.id));
  const validTarget = (value) => typeof value === 'string' && playerIds.has(value) && value !== playerId;
  for (const key of ['mobileVotes', 'electricChairVotes', 'miniGameVotes', 'snitchVotes']) {
    if (key in patch && patch[key]?.[playerId] !== undefined && !validTarget(patch[key][playerId])) return false;
  }
  if ('miniGameVolunteers' in patch && patch.miniGameVolunteers?.[playerId] !== true) return false;
  if ('miniGameRatings' in patch && patch.miniGameRatings?.[playerId] !== undefined &&
      (!Number.isInteger(patch.miniGameRatings[playerId]) || patch.miniGameRatings[playerId] < 1 || patch.miniGameRatings[playerId] > 5)) return false;
  if ('timeCapsule' in patch) {
    const before = current.timeCapsule?.[playerId];
    const after = patch.timeCapsule?.[playerId];
    if (before?.submitted && !sameJson(before, after)) return false;
    if (after !== undefined) {
      if (!isObject(after) || ['firstArrest', 'finalist', 'traitor'].some((key) =>
        after[key] && !playerIds.has((current.players || []).find((item) => item.name === after[key])?.id)
      )) return false;
    }
  }

  if ('juryTrial' in patch) {
    if (!isObject(patch.juryTrial) || !noChangesOutsideKeys(current.juryTrial, patch.juryTrial, ['votes']) ||
        !onlyOwnMapEntryChanged(current.juryTrial?.votes || {}, patch.juryTrial.votes || {}, playerId)) return false;
    const vote = patch.juryTrial.votes?.[playerId];
    if (vote !== undefined && !['guilty', 'innocent'].includes(vote)) return false;
  }

  if ('grandJury' in patch) {
    const old = current.grandJury || {};
    const next = patch.grandJury;
    if (!isObject(next) || !noChangesOutsideKeys(old, next, ['queenVotes', 'championVotes']) ||
        !onlyOwnMapEntryChanged(old.queenVotes || {}, next.queenVotes || {}, playerId) ||
        !onlyOwnMapEntryChanged(old.championVotes || {}, next.championVotes || {}, playerId)) return false;
    for (const key of ['queenVotes', 'championVotes']) {
      if (next[key]?.[playerId] !== undefined && !validTarget(next[key][playerId])) return false;
    }
  }

  if ('privateMessages' in patch) {
    const old = current.privateMessages || {};
    const next = patch.privateMessages;
    if (!isObject(next) || !noChangesOutsideKeys(old, next, [playerId])) return false;
    const before = old[playerId] || [];
    const after = next[playerId] || [];
    if (!Array.isArray(before) || !Array.isArray(after)) return false;
    for (const item of after) {
      const previous = before.find((message) => message?.id === item?.id);
      if (!previous || !sameExceptKeys(previous, item, ['read', 'dismissed']) ||
          (item?.read !== undefined && typeof item.read !== 'boolean') ||
          (item?.dismissed !== undefined && typeof item.dismissed !== 'boolean')) return false;
    }
  }

  if ('sealedVotes' in patch) {
    const old = current.sealedVotes || {};
    const next = patch.sealedVotes;
    if (!isObject(next)) return false;
    for (const id of Object.keys(next)) {
      if (!isObject(next[id]) || !noChangesOutsideKeys(old[id], next[id], ['votes']) ||
          !onlyOwnMapEntryChanged(old[id]?.votes || {}, next[id]?.votes || {}, playerId)) return false;
      const selected = next[id]?.votes?.[playerId];
      if (selected !== undefined && !(old[id]?.options || []).some((option) => option.id === selected)) return false;
    }
  }

  if ('midnightPact' in patch) {
    const old = current.midnightPact || {};
    const next = patch.midnightPact;
    if (!isObject(next) || !noChangesOutsideKeys(old, next, ['offers']) ||
        !onlyOwnMapEntryChanged(old.offers || {}, next.offers || {}, playerId)) return false;
    if (next.offers?.[playerId] !== undefined && typeof next.offers[playerId] !== 'boolean') return false;
  }

  if ('lastWish' in patch) {
    const old = current.lastWish || {};
    const next = patch.lastWish;
    if (!isObject(next) || old.playerId !== next.playerId || old.playerId !== current.lastWish?.playerId) return false;
    if (old.phase === 'input' && old.playerId === playerId) {
      if (!noChangesOutsideKeys(old, next, ['wish', 'phase', 'votes']) ||
          typeof next.wish !== 'string' || !next.wish.trim() || next.wish.length > 160 ||
          next.phase !== 'vote' || !isObject(next.votes) || Object.keys(next.votes).length) return false;
    } else if (old.phase === 'vote') {
      if (!noChangesOutsideKeys(old, next, ['votes', 'phase', 'accepted']) ||
          !onlyOwnMapEntryChanged(old.votes || {}, next.votes || {}, playerId)) return false;
      if (next.phase === 'result') {
        const voters = (current.players || []).filter((p) => p.id !== old.playerId);
        const actualVotes = old.votes || {};
        if (!voters.every((p) => actualVotes[p.id] !== undefined)) return false;
        const yes = Object.values(actualVotes).filter(Boolean).length;
        const no = Object.values(actualVotes).filter((v) => v === false).length;
        if (next.accepted !== (yes > no)) return false;
      } else if (next.phase !== old.phase) return false;
      if (next.votes?.[playerId] !== undefined && typeof next.votes[playerId] !== 'boolean') return false;
    } else return false;
  }

  if ('pajama' in patch) {
    const old = current.pajama || {};
    const next = patch.pajama;
    if (!isObject(next) || !noChangesOutsideKeys(old, withoutKeys(next, ['saboteurId', 'sabotages']), ['confessions'])) return false;
    const before = old.confessions || [];
    const after = next.confessions || [];
    if (!Array.isArray(before) || !Array.isArray(after)) return false;
    const beforeOther = before.filter((item) => item.playerId !== playerId);
    const afterOther = after.filter((item) => item.playerId !== playerId);
    const own = after.find((item) => item.playerId === playerId);
    const otherEntriesUnchanged = afterOther.every((item) => {
      const previous = beforeOther.find((oldItem) => oldItem.playerId === item.playerId);
      return previous && Object.entries(item).every(([key, value]) =>
        key === 'playerId' || sameJson(previous[key], value)
      );
    });
    if (!otherEntriesUnchanged || (before.length > 0 && after.length === 0) || (own && (typeof own.text !== 'string' || own.text.length > 1000))) return false;
  }

  if ('mg' in patch) {
    const old = current.mg || {};
    const next = patch.mg;
    if (!isObject(next) || Object.keys(next).some((key) => !['stop', 'stopAt', 'stopBy', 'timer'].includes(key)) || old.stop || next.stop !== true || next.stopBy !== playerId) return false;
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
    const existingHistory = current.history || [];
    if (!patch.history.slice(1).every((item) => existingHistory.some((oldItem) => sameJson(oldItem, item)))) return false;
    if (entry.type === 'snitch_vote') {
      const target = (current.players || []).find((item) => item.id === patch.snitchVotes?.[playerId]);
      if (entry.voter !== player.name || !target || target.id === playerId || entry.target !== target.name) return false;
    }
    if (entry.type === 'double_down' && entry.player !== player.name) return false;
  }

  return true;
}

function sanitizePublicSession(record, playerId = null) {
  if (!record?.state || !isObject(record.state)) return record;
  const state = { ...record.state };
  const ownMap = (value) => {
    if (!playerId || !isObject(value) || value[playerId] === undefined) return {};
    return { [playerId]: value[playerId] };
  };
  const countOnlyMap = (value, preserveBooleanTally = false) => {
    if (!isObject(value)) return {};
    const result = {};
    let index = 0;
    for (const [key, item] of Object.entries(value)) {
      if (playerId && key === playerId) result[key] = item;
      else result[`__redacted_${index++}`] = preserveBooleanTally && (typeof item === 'boolean' || ['guilty', 'innocent'].includes(item)) ? item : true;
    }
    return result;
  };

  if ('privateMessages' in state) state.privateMessages = ownMap(state.privateMessages);
  if (state.pajama && isObject(state.pajama)) {
    state.pajama = {
      ...state.pajama,
      saboteurId: undefined,
      sabotages: (state.pajama.sabotages || []).map(() => ({})),
      ...(Array.isArray(state.pajama.confessions) ? {
        confessions: state.pajama.confessions.map((item) =>
          item.playerId === playerId ? item : { playerId: item.playerId }
        ),
      } : {}),
    };
  }
  if (state.mg && isObject(state.mg)) {
    const mg = { ...state.mg, missions: ownMap(state.mg.missions), chaosCards: ownMap(state.mg.chaosCards) };
    if (playerId && mg.card && mg.card.playerId !== playerId) mg.card = null;
    if (playerId && mg.branch !== playerId) mg.branch = null;
    state.mg = mg;
  }
  if (state.sealedVotes && isObject(state.sealedVotes)) {
    state.sealedVotes = Object.fromEntries(Object.entries(state.sealedVotes).map(([id, vote]) => [
      id,
      vote?.revealed ? vote : { ...vote, votes: countOnlyMap(vote?.votes) },
    ]));
  }
  if (state.juryTrial) state.juryTrial = { ...state.juryTrial, votes: countOnlyMap(state.juryTrial.votes, true) };
  if (state.grandJury) state.grandJury = {
    ...state.grandJury,
    queenVotes: countOnlyMap(state.grandJury.queenVotes),
    championVotes: countOnlyMap(state.grandJury.championVotes),
  };
  if (state.midnightPact) state.midnightPact = { ...state.midnightPact, offers: countOnlyMap(state.midnightPact.offers) };
  if (state.lastWish) state.lastWish = { ...state.lastWish, votes: countOnlyMap(state.lastWish.votes, true) };
  if (state.timeCapsule) state.timeCapsule = ownMap(state.timeCapsule);

  return { ...record, state };
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
const streams = new Map(); // entity -> Set<{ res, sessionCode, playerId, isPublic }>
function broadcast(entity, event) {
  const set = streams.get(entity);
  if (!set) return;
  for (const subscriber of set) {
    if (subscriber.sessionCode && event.data?.sessionCode !== subscriber.sessionCode) continue;
    const delivered = subscriber.isPublic && entity === 'GameSession'
      ? { ...event, data: sanitizePublicSession(event.data, subscriber.playerId) }
      : event;
    subscriber.res.write(`data: ${JSON.stringify(delivered)}\n\n`);
  }
}
// keep proxies (Railway) from closing idle connections
setInterval(() => { for (const set of streams.values()) for (const subscriber of set) subscriber.res.write(': ping\n\n'); }, 25000).unref();

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
    let playerId = null;
    if (req.entity === 'GameSession') {
      sessionCode = String(req.query.sessionCode || '').trim().toUpperCase() || null;
      playerId = String(req.query.playerId || '') || null;
      if (!isAdmin(req) && !sessionCode) return res.status(400).json({ error: 'sessionCode required' });
      if (sessionCode) {
        const { rows } = await query("SELECT data FROM records WHERE entity = 'GameSession' AND data->>'sessionCode' = $1 LIMIT 1", [sessionCode]);
        if (!rows[0]) return res.status(404).json({ error: 'Session not found' });
        if (!isAdmin(req) && playerId && !(rows[0].data?.state?.players || []).some((player) => player.id === playerId)) {
          return res.status(403).json({ error: 'Unknown player' });
        }
      }
    }
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.flushHeaders();
    res.write('retry: 2000\n\n');
    if (!streams.has(req.entity)) streams.set(req.entity, new Set());
    const subscriber = { res, sessionCode, playerId, isPublic: !isAdmin(req) };
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
      if (keys.some((key) => !['sessionCode', 'playerId'].includes(key)) ||
          (keys.includes('playerId') && (!keys.includes('sessionCode') || typeof effectiveQuery.playerId !== 'string')) ||
          (keys.includes('sessionCode') && typeof effectiveQuery.sessionCode !== 'string')) {
        return res.status(403).json({ error: 'Only session-code lookup is available' });
      }
      const playerId = effectiveQuery.playerId || null;
      effectiveQuery = keys.includes('sessionCode') ? { sessionCode: effectiveQuery.sessionCode.trim().toUpperCase() } : {};
      req.sessionViewerPlayerId = playerId;
      effectiveSort = '-created_date';
      effectiveLimit = 1;
      effectiveSkip = 0;
    }
    const params = [];
    const where = buildWhere(req.entity, effectiveQuery, params);
    const lim = Math.min(Math.max(parseInt(effectiveLimit, 10) || 50, 1), req.entity === 'GameSession' && !isAdmin(req) ? 1 : MAX_LIMIT);
    const off = Math.max(parseInt(effectiveSkip, 10) || 0, 0);
    const { rows } = await query(`SELECT * FROM records WHERE ${where} ORDER BY ${orderBy(effectiveSort)} LIMIT ${lim} OFFSET ${off}`, params);
    const items = rows.map(toRecord);
    if (req.entity === 'GameSession' && !isAdmin(req) && req.sessionViewerPlayerId &&
        items.length && !(items[0].state?.players || []).some((player) => player.id === req.sessionViewerPlayerId)) {
      return res.status(403).json({ error: 'Unknown player' });
    }
    res.json({ items: req.entity === 'GameSession' && !isAdmin(req) ? items.map((item) => sanitizePublicSession(item, req.sessionViewerPlayerId)) : items });
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
            const mergedState = deepMerge(current.state || {}, statePatch, '', true);
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
        const safePlayerPatch = { ...statePatch };
        if (isObject(safePlayerPatch.pajama)) {
          safePlayerPatch.pajama = { ...safePlayerPatch.pajama };
          delete safePlayerPatch.pajama.saboteurId;
          delete safePlayerPatch.pajama.sabotages;
        }
        const mergedState = deepMerge(current.state || {}, safePlayerPatch);
        const { rows } = await client.query(
          "UPDATE records SET data = data || $1::jsonb, updated_date = now() WHERE id = $2 AND entity = $3 RETURNING *",
          [JSON.stringify({ state: mergedState }), req.params.id, req.entity],
        );
        await client.query('COMMIT');
        const rec = toRecord(rows[0]);
        broadcast(req.entity, { type: 'update', id: rec.id, data: rec });
        return res.json(sanitizePublicSession(rec, playerId));
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
    const { rows } = await query('DELETE FROM records WHERE id = $1 AND entity = $2 RETURNING data', [req.params.id, req.entity]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    const data = { id: req.params.id, ...(req.entity === 'GameSession' ? { sessionCode: rows[0].data?.sessionCode } : {}) };
    broadcast(req.entity, { type: 'delete', id: req.params.id, data });
    res.json({ success: true });
  });

  r.post('/:entity/delete-many', guard('delete'), async (req, res) => {
    const params = [];
    const where = buildWhere(req.entity, req.body?.query, params);
    const { rows } = await query(`DELETE FROM records WHERE ${where} RETURNING id, data`, params);
    rows.forEach(({ id, data }) => broadcast(req.entity, {
      type: 'delete', id,
      data: { id, ...(req.entity === 'GameSession' ? { sessionCode: data?.sessionCode } : {}) },
    }));
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
