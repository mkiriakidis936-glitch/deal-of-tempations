import crypto from 'node:crypto';
import express from 'express';
import { query, pool } from './db.js';
import { requireAdmin } from './auth.js';
import { notifyNewSubmission, notifyPlayerMission } from './push.js';
import { isValidConsentEntry } from '../src/lib/consent.js';

// Entities that used to live in base44/entities/*.jsonc
export const ENTITIES = [
  'Achievement', 'AppSetting', 'BacheloretteIntake', 'BlackmailVault', 'Chronicle', 'GameContent',
  'GameSession', 'GameSessionSnapshot', 'Haunting', 'InvitationRSVP', 'Memorial', 'PajamaContent', 'PajamaIntake',
  'PlayerIntake', 'PlayerProfile', 'SessionArchive', 'VIPInvitation', 'VIPInvitationSubmission',
  'PublicFormSubmission', 'ShowProduction', 'ProductionConsent', 'ProductionCue',
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
  InvitationRSVP:     { read: ADMIN, update: ADMIN, delete: ADMIN },
  VIPInvitation: { read: ADMIN, create: ADMIN, update: ADMIN, delete: ADMIN },
  VIPInvitationSubmission: { read: ADMIN, update: ADMIN, delete: ADMIN },
  PublicFormSubmission: { read: ADMIN, update: ADMIN, delete: ADMIN },
  // Reality-show production plans are private and editable only by administrators.
  ShowProduction: { read: ADMIN, create: ADMIN, update: ADMIN, delete: ADMIN },
  ProductionConsent: { read: ADMIN, update: ADMIN, delete: ADMIN },
  ProductionCue: { create: ADMIN, update: ADMIN, delete: ADMIN },
  Achievement:        { create: ADMIN, update: ADMIN, delete: ADMIN },
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
  GameSessionSnapshot: { read: ADMIN, create: ADMIN, update: ADMIN, delete: ADMIN },
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
      for (const item of patch) merged.set(item.id, merged.has(item.id) ? deepMerge(merged.get(item.id), item, '', allowClear) : item);
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

export function validatePlayerPatch(current, patch, playerId) {
  if (!isObject(patch) || !Object.keys(patch).length) return false;
  const allowed = new Set([
    'mobileVotes', 'electricChairVotes', 'juryTrial', 'grandJury', 'privateMessages',
    'sealedVotes', 'miniGameVolunteers', 'miniGameVotes', 'miniGameRatings',
    'snitchVotes', 'history', 'timeCapsule', 'lastWish', 'midnightPact',
    'pajama', 'mg', 'players', 'absoluteInterrogation', 'bailoutAuction',
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
      if (!isObject(after) || typeof after.submitted !== 'boolean' || ['firstArrest', 'finalist', 'traitor'].some((key) => {
        if (!after[key]) return false;
        const target = (current.players || []).find((item) => item.name === after[key]);
        return !target || target.id === playerId;
      })) return false;
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
      if (next.phase === 'result' && playerId !== old.playerId) return false;
      if (next.votes?.[playerId] !== undefined && playerId === old.playerId) return false;
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

  if ('absoluteInterrogation' in patch) {
    const old = current.absoluteInterrogation || {};
    const next = patch.absoluteInterrogation;
    const step = Number(old.step || 0);
    if (!old.active || old.targetId === playerId || !isObject(next) ||
        !noChangesOutsideKeys(old, next, ['votes']) || !isObject(next.votes) ||
        !Number.isInteger(step) || step < 0 || step > 2) return false;
    const beforeVotes = old.votes || {};
    const afterVotes = next.votes;
    for (const key of Object.keys(afterVotes)) {
      if (key !== String(step) && (!Object.prototype.hasOwnProperty.call(beforeVotes, key) || !sameJson(beforeVotes[key], afterVotes[key]))) return false;
    }
    const beforeStep = beforeVotes[step] || {};
    const afterStep = afterVotes[step] || {};
    if (!onlyOwnMapEntryChanged(beforeStep, afterStep, playerId)) return false;
    if (afterStep[playerId] !== undefined && typeof afterStep[playerId] !== 'boolean') return false;
  }

  if ('bailoutAuction' in patch) {
    const old = current.bailoutAuction || {};
    const next = patch.bailoutAuction;
    if (!old.active || old.targetId === playerId || !isObject(next) ||
        !noChangesOutsideKeys(old, next, ['bids']) || !isObject(next.bids) ||
        !onlyOwnMapEntryChanged(old.bids || {}, next.bids, playerId)) return false;
    const bid = next.bids[playerId];
    if (bid !== undefined && (!Number.isFinite(bid) || bid <= 0)) return false;
  }

  if ('mg' in patch) {
    const old = current.mg || {};
    const next = patch.mg;
    if (!isObject(next)) return false;
    const stopPatch = Object.keys(next).every((key) => ['stop', 'stopAt', 'stopBy', 'timer'].includes(key)) &&
      !old.stop && next.stop === true && next.stopBy === playerId &&
      Number.isFinite(next.stopAt) && (next.timer === null || next.timer === undefined || isObject(next.timer));
    const action = next.playerAction;
    const actionTypes = new Set([
      'board_roll', 'board_route', 'board_complete', 'board_pass',
      'midnight_pass', 'lockdown_exit_code', 'morning_clue', 'morning_code',
      'beach_checkin', 'beach_finale_response', 'beach_freeze_loser', 'beach_wheel_spin', 'beach_wheel_done', 'beach_wheel_again', 'beach_truth_response',
    ]);
    let validAction = Object.keys(next).length === 1 && isObject(action) &&
      action.playerId === playerId && actionTypes.has(action.type) && Number.isFinite(action.at);
    if (validAction && action.type === 'board_route') validAction = ['glam', 'chaos'].includes(action.route);
    if (validAction && action.type === 'beach_finale_response') validAction = ['done', 'pass'].includes(action.value);
    if (validAction && action.type === 'beach_truth_response') validAction = ['truth', 'mocktail'].includes(action.value);
    if (validAction && action.type === 'lockdown_exit_code') validAction = /^\d{4}$/.test(String(action.code || ''));
    if (validAction && action.type === 'morning_clue') validAction = Number.isInteger(action.index) && action.index >= 0 && action.index < 4;
    if (validAction && action.type === 'morning_code') validAction = /^\d{4}$/.test(String(action.code || ''));
    // Consent check-in: κάθε παίκτρια γράφει ΜΟΝΟ τη δική της καταχώρηση, και μόνο πριν ξεκινήσει το παιχνίδι.
    const consentPlayers = next.consent?.players;
    const consentPatch = Object.keys(next).length === 1 && isObject(next.consent) && Object.keys(next.consent).length === 1 &&
      isObject(consentPlayers) && Object.keys(consentPlayers).length === 1 && consentPlayers[playerId] !== undefined &&
      !old.consent?.done && isValidConsentEntry(consentPlayers[playerId]);
    if (!stopPatch && !validAction && !consentPatch) return false;
  }

  if ('players' in patch) {
    const old = current.players || [];
    const next = patch.players;
    if (!Array.isArray(next) || old.length !== next.length) return false;
    const changed = old.filter((p, i) => !sameJson(p, next[i]));
    const before = old.find((p) => p.id === playerId);
    const after = next.find((p) => p.id === playerId);
    if (!before || !after || !sameExceptKeys(before, after, ['penaltyStep'])) return false;
    const delta = (after.penaltyStep || 0) - (before.penaltyStep || 0);
    const doubleDown = patch.history?.[0];
    const validPenaltyChange =
      (delta === 1 && doubleDown?.type === 'double_down' && doubleDown.result === 'ποινή') ||
      (delta === -1 && doubleDown?.type === 'double_down' && doubleDown.result === 'ελευθερία') ||
      (delta === 0 && (before.penaltyStep || 0) === 0 && doubleDown?.type === 'double_down' && doubleDown.result === 'ελευθερία');
    if (!validPenaltyChange || (changed.length > 0 && (changed.length !== 1 || changed[0]?.id !== playerId))) return false;
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

export function sanitizePublicSession(record, playerId = null) {
  if (!record?.state || !isObject(record.state)) return record;
  const state = { ...record.state };
  if (Array.isArray(state.players)) {
    state.players = state.players.map((player) => {
      if (!isObject(player) || !Object.prototype.hasOwnProperty.call(player, 'vipProfile')) return player;
      const { vipProfile, ...publicPlayer } = player;
      return playerId && player.id === playerId ? { ...publicPlayer, vipProfile } : publicPlayer;
    });
  }
  if (Array.isArray(state.history)) state.history = state.history.filter((event) => !['truth', 'dare', 'confession'].includes(event?.type));
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
    // Τα όρια (consent) κάθε παίκτριας είναι ιδιωτικά: οι υπόλοιπες/η TV βλέπουν μόνο αν επιβεβαίωσε.
    if (isObject(mg.consent?.players)) {
      mg.consent = {
        ...mg.consent,
        players: Object.fromEntries(Object.entries(mg.consent.players).map(([id, entry]) => [
          id,
          playerId && id === playerId ? entry : { confirmed: entry?.confirmed === true, optOuts: [], at: entry?.at },
        ])),
      };
    }
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
  if (state.absoluteInterrogation && isObject(state.absoluteInterrogation)) {
    state.absoluteInterrogation = {
      ...state.absoluteInterrogation,
      votes: Object.fromEntries(Object.entries(state.absoluteInterrogation.votes || {}).map(([step, votes]) => [
        step,
        ownMap(votes),
      ])),
    };
  }
  if (state.bailoutAuction && isObject(state.bailoutAuction)) {
    state.bailoutAuction = {
      ...state.bailoutAuction,
      bids: ownMap(state.bailoutAuction.bids),
    };
  }

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

  // Public intake forms: submissions are stored centrally and readable only by Admin.
  const publicFormKinds = new Set(['join-heist', 'event-request', 'feedback']);
  const publicFormBuckets = new Map();
  r.post('/public-forms/:type', async (req, res, next) => {
    try {
      const type = String(req.params.type || '');
      if (!publicFormKinds.has(type)) return res.status(404).json({ error: 'Η φόρμα δεν βρέθηκε.' });
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const now = Date.now();
      const bucket = publicFormBuckets.get(ip) || { at: now, count: 0 };
      if (now - bucket.at > 3600000) { bucket.at = now; bucket.count = 0; }
      if (bucket.count >= 12) return res.status(429).json({ error: 'Έγιναν πολλές υποβολές. Δοκίμασε αργότερα.' });
      bucket.count += 1; publicFormBuckets.set(ip, bucket);
      const body = req.body || {};
      const clean = (v, max = 1200) => typeof v === 'string' ? v.trim().slice(0, max) : '';
      const data = {
        type,
        ...(clean(body.sessionCode, 40) ? { sessionCode: clean(body.sessionCode, 40).toUpperCase() } : {}),
        name: clean(body.name, 100),
        contact: clean(body.contact, 160),
        email: clean(body.email, 160),
        eventType: clean(body.eventType, 100),
        eventDate: clean(body.eventDate, 40),
        guests: clean(body.guests, 30),
        message: clean(body.message, 3000),
        suggestion: clean(body.suggestion, 3000),
        photoUrl: typeof body.photoUrl === 'string' && /^\/media\/public-[A-Za-z0-9._-]+\.(?:jpg|jpeg|png|webp)$/i.test(body.photoUrl) ? body.photoUrl : '',
        status: 'new',
        submittedAt: new Date().toISOString(),
      };
      if (data.sessionCode) {
        const { rows: linkedSessions } = await query("SELECT id FROM records WHERE entity = 'GameSession' AND data->>'sessionCode' = $1 LIMIT 1", [data.sessionCode]);
        if (!linkedSessions[0]) return res.status(400).json({ error: 'Το Event της πρόσκλησης δεν βρέθηκε.' });
      }
      if (!data.name || (type === 'join-heist' && !data.contact) || (type === 'event-request' && !data.eventType) ||
          (type === 'feedback' && !data.message && !data.suggestion)) {
        return res.status(400).json({ error: 'Συμπλήρωσε τα υποχρεωτικά πεδία.' });
      }
      const { rows } = await query(
        "INSERT INTO records (id, entity, data, created_by) VALUES ($1, 'PublicFormSubmission', $2, NULL) RETURNING *",
        [crypto.randomUUID(), JSON.stringify(data)],
      );
      const rec = toRecord(rows[0]);
      broadcast('PublicFormSubmission', { type: 'create', id: rec.id, data: rec });
      notifyNewSubmission('PublicFormSubmission', rec);
      return res.json({ success: true, id: rec.id });
    } catch (error) { return next(error); }
  });

  // TV playback acknowledgements are restricted to the active cue and its current command.
  const playbackAckBuckets = new Map();
  r.post('/production-cue/ack', async (req, res, next) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const now = Date.now();
      const bucket = playbackAckBuckets.get(ip) || { at: now, count: 0 };
      if (now - bucket.at > 60000) { bucket.at = now; bucket.count = 0; }
      if (bucket.count >= 120) return res.status(429).json({ error: 'Πολλές ενημερώσεις αναπαραγωγής.' });
      bucket.count += 1;
      playbackAckBuckets.set(ip, bucket);

      const sessionCode = String(req.body?.sessionCode || '').trim().toUpperCase();
      const cueId = String(req.body?.cueId || '');
      const commandId = String(req.body?.commandId || '');
      const status = String(req.body?.status || '');
      const allowed = new Set(['ready', 'playing', 'paused', 'ended', 'error', 'closed', 'stopped']);
      if (!sessionCode || !cueId || !commandId || !allowed.has(status)) {
        return res.status(400).json({ error: 'Μη έγκυρη επιβεβαίωση αναπαραγωγής.' });
      }
      const { rows: found } = await query(
        "SELECT * FROM records WHERE id = $1 AND entity = 'ProductionCue' LIMIT 1",
        [cueId],
      );
      if (!found[0]) return res.status(404).json({ error: 'Το cue δεν βρέθηκε.' });
      const current = toRecord(found[0]);
      if (String(current.sessionCode || '').toUpperCase() !== sessionCode ||
          current.commandId !== commandId || !current.active) {
        return res.status(409).json({ error: 'Η επιβεβαίωση αφορά παλαιότερη εντολή.' });
      }
      const previousStatus = current.playbackStatus || 'pending';
      if ((status === 'ready' && ['playing', 'paused', 'ended', 'error', 'closed', 'stopped'].includes(previousStatus)) ||
          (status === 'playing' && ['ended', 'error', 'closed', 'stopped'].includes(previousStatus)) ||
          (status === 'ended' && !['pending', 'ready', 'playing'].includes(previousStatus))) {
        return res.status(409).json({ error: 'Η επιβεβαίωση αναπαραγωγής είναι παλαιότερη από την τρέχουσα κατάσταση.' });
      }
      const patch = {
        playbackStatus: status,
        playbackStatusAt: new Date().toISOString(),
        playbackError: status === 'error' ? String(req.body?.error || 'Αποτυχία αναπαραγωγής').slice(0, 500) : '',
        ...(status === 'closed' || status === 'stopped' ? { active: false } : {}),
      };
      if (status === 'ended') {
        const queue = Array.isArray(current.queue) ? current.queue : [];
        const nextIndex = Number(current.queueIndex ?? -1) + 1;
        const nextItem = queue[nextIndex];
        if (nextItem?.url && ['video', 'audio', 'image'].includes(nextItem.kind)) {
          Object.assign(patch, {
            active: true,
            label: nextItem.label || nextItem.name || 'Media',
            kind: nextItem.kind,
            source: nextItem.url,
            mediaItemId: nextItem.id || nextItem.url,
            queueIndex: nextIndex,
            playbackCommand: 'play',
            commandId: crypto.randomUUID(),
            commandAt: Date.now(),
            playbackStatus: 'pending',
            playbackError: '',
            activatedAt: new Date().toISOString(),
          });
        } else {
          patch.active = false;
        }
      }
      const { rows } = await query(
        "UPDATE records SET data = data || $1::jsonb, updated_date = now() WHERE id = $2 AND entity = 'ProductionCue' AND data->>'commandId' = $3 AND upper(data->>'sessionCode') = $4 AND data->>'active' = 'true' RETURNING *",
        [JSON.stringify(patch), cueId, commandId, sessionCode],
      );
      if (!rows[0]) return res.status(409).json({ error: 'Η εντολή άλλαξε πριν καταχωριστεί η επιβεβαίωση.' });
      const rec = toRecord(rows[0]);
      broadcast('ProductionCue', { type: 'update', id: rec.id, data: rec });
      return res.json({ success: true, cue: rec });
    } catch (error) { return next(error); }
  });

  r.param('entity', (req, res, next, name) => {
    if (!ENTITIES.includes(name)) return res.status(404).json({ error: `Unknown entity ${name}` });
    req.entity = name;
    next();
  });
  // Public forms are open to everyone; cap how many submissions one IP can send so bots can't flood the DB.
  const FORM_ENTITIES = new Set(['PlayerIntake', 'PajamaIntake', 'BacheloretteIntake', 'InvitationRSVP', 'VIPInvitationSubmission', 'ProductionConsent']);
  const formBuckets = new Map();
  const formLimit = (req, res, next) => {
    if (isAdmin(req) || !FORM_ENTITIES.has(req.entity)) return next();
    const now = Date.now();
    const key = `${req.entity}:${req.ip || req.socket.remoteAddress || 'unknown'}`;
    let b = formBuckets.get(key);
    if (!b || now - b.startedAt >= 3600_000) { b = { startedAt: now, count: 0 }; formBuckets.set(key, b); }
    const weight = Array.isArray(req.body) ? req.body.length : 1;
    if (Array.isArray(req.body) && weight > 10) return res.status(413).json({ error: 'Bulk submission is too large.' });
    if (b.count + weight > 60) return res.status(429).json({ error: 'Too many submissions. Try again later.' });
    b.count += weight;
    if (formBuckets.size > 5000) for (const [k, v] of formBuckets) if (now - v.startedAt >= 3600_000) formBuckets.delete(k);
    return next();
  };
  const guard = (op) => (req, res, next) => (needsAdmin(req.entity, op) ? requireAdmin(req, res, next) : next());

  r.get('/event-info/:sessionCode', async (req, res, next) => {
    try {
      const sessionCode = String(req.params.sessionCode || '').trim().toUpperCase();
      const { rows } = await query("SELECT data FROM records WHERE entity = 'GameSession' AND data->>'sessionCode' = $1 LIMIT 1", [sessionCode]);
      if (!rows[0]) return res.status(404).json({ error: 'Το Event δεν βρέθηκε.' });
      return res.json({ scheduledAt: rows[0].data?.event?.scheduledAt || '' });
    } catch (error) { return next(error); }
  });

  // Public RSVP count exposes only an aggregate, never attendee names or records.
  r.get('/pajama-rsvp/count', async (req, res, next) => {
    try {
      const sessionCode = String(req.query.sessionCode || '').trim().toUpperCase();
      const params = ['pajama'];
      let where = "entity = 'InvitationRSVP' AND data->>'event' = $1 AND data->>'confirmed' = 'true'";
      if (sessionCode) {
        params.push(sessionCode);
        where += " AND data->>'sessionCode' = $2";
      } else {
        where += " AND COALESCE(data->>'sessionCode', '') = ''";
      }
      const { rows } = await query(`SELECT count(*)::int AS count FROM records WHERE ${where}`, params);
      return res.json({ count: rows[0]?.count || 0 });
    } catch (error) { return next(error); }
  });


  // Private VIP invitations: the shared token is only returned to administrators.
  r.post('/vip-invitations', requireAdmin, async (req, res, next) => {
    try {
      const token = crypto.randomBytes(32).toString('base64url');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const gameMode = String(req.body?.gameMode || 'classic');
      const sessionCode = String(req.body?.sessionCode || '').trim().toUpperCase();
      if (sessionCode) {
        const { rows: sessions } = await query("SELECT id FROM records WHERE entity = 'GameSession' AND data->>'sessionCode' = $1 LIMIT 1", [sessionCode]);
        if (!sessions[0]) return res.status(400).json({ error: 'Το επιλεγμένο Event δεν βρέθηκε.' });
      }
      const allowedGameModes = ['classic', 'marathon', 'arrest_heist', 'pajama', 'lockdown', 'beach_bar'];
      if (!allowedGameModes.includes(gameMode)) return res.status(400).json({ error: 'Επίλεξε έγκυρο παιχνίδι.' });
      const data = {
        gameMode,
        ...(sessionCode ? { sessionCode } : {}),
        title: 'VIP INVITATION',
        gameTitle: 'DEAL OF TEMPTATION',
        intro: 'Έχεις λάβει μια προσωπική πρόσκληση σε μια ξεχωριστή εμπειρία. Επιβεβαίωσε τη συμμετοχή σου και συμπλήρωσε το προσωπικό σου προφίλ.',
        token,
        tokenHash,
        active: true,
      };
      const { rows } = await query(
        "INSERT INTO records (id, entity, data, created_by) VALUES ($1, 'VIPInvitation', $2, $3) RETURNING *",
        [crypto.randomUUID(), JSON.stringify(data), req.user?.email || null],
      );
      return res.json({ ...toRecord(rows[0]), token });
    } catch (error) { return next(error); }
  });

  r.delete('/vip-invitations/:id', requireAdmin, async (req, res, next) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: invitationRows } = await client.query(
        "SELECT id FROM records WHERE id = $1 AND entity = 'VIPInvitation' FOR UPDATE",
        [req.params.id],
      );
      if (!invitationRows[0]) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Η VIP πρόσκληση δεν βρέθηκε.' });
      }
      const { rows: submissions } = await client.query(
        "SELECT id, data FROM records WHERE entity = 'VIPInvitationSubmission' AND data->>'invitationId' = $1",
        [req.params.id],
      );
      const submissionIds = submissions.map(({ data }) => data?.submissionId).filter(Boolean);
      const { rows: players } = await client.query(
        "DELETE FROM records WHERE entity = 'PlayerIntake' AND (data->>'vipInvitationId' = $1 OR data->>'vipSubmissionId' = ANY($2::text[])) RETURNING id",
        [req.params.id, submissionIds],
      );
      await client.query("DELETE FROM records WHERE entity = 'VIPInvitationSubmission' AND data->>'invitationId' = $1", [req.params.id]);
      await client.query("DELETE FROM records WHERE id = $1 AND entity = 'VIPInvitation'", [req.params.id]);
      await client.query('COMMIT');
      players.forEach(({ id }) => broadcast('PlayerIntake', { type: 'delete', id, data: { id } }));
      submissions.forEach(({ id }) => broadcast('VIPInvitationSubmission', { type: 'delete', id, data: { id } }));
      broadcast('VIPInvitation', { type: 'delete', id: req.params.id, data: { id: req.params.id } });
      return res.json({ success: true, deletedSubmissions: submissions.length, deletedPlayers: players.length });
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      return next(error);
    } finally { client.release(); }
  });

  r.delete('/vip-submissions/:id', requireAdmin, async (req, res, next) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: submissions } = await client.query(
        "SELECT id, data FROM records WHERE id = $1 AND entity = 'VIPInvitationSubmission' FOR UPDATE",
        [req.params.id],
      );
      if (!submissions[0]) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Η απάντηση δεν βρέθηκε.' });
      }
      const { rows: players } = await client.query(
        "DELETE FROM records WHERE entity = 'PlayerIntake' AND data->>'vipSubmissionId' = $1 RETURNING id",
        [submissions[0].data?.submissionId || ''],
      );
      await client.query("DELETE FROM records WHERE id = $1 AND entity = 'VIPInvitationSubmission'", [req.params.id]);
      await client.query('COMMIT');
      players.forEach(({ id }) => broadcast('PlayerIntake', { type: 'delete', id, data: { id } }));
      broadcast('VIPInvitationSubmission', { type: 'delete', id: req.params.id, data: { id: req.params.id } });
      return res.json({ success: true, deletedPlayers: players.length });
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      return next(error);
    } finally { client.release(); }
  });

  r.get('/vip-invitations/:token', async (req, res, next) => {
    try {
      const token = String(req.params.token || '');
      if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return res.status(404).json({ error: 'Η πρόσκληση δεν βρέθηκε ή δεν είναι πλέον ενεργή.' });
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const { rows } = await query(
        "SELECT id, data FROM records WHERE entity = 'VIPInvitation' AND data->>'tokenHash' = $1 AND data->>'active' = 'true' LIMIT 1",
        [tokenHash],
      );
      if (!rows[0]) return res.status(404).json({ error: 'Η πρόσκληση δεν βρέθηκε ή δεν είναι πλέον ενεργή.' });
      const { rows: settings } = await query(
        "SELECT data FROM records WHERE entity = 'AppSetting' AND data->>'key' = 'admin_form_questions' LIMIT 1"
      );
      const questions = settings[0]?.data?.value?.forms?.invitation || [];
      return res.json({
        id: rows[0].id,
        title: rows[0].data.title || 'VIP INVITATION',
        gameTitle: rows[0].data.gameTitle || 'DEAL OF TEMPTATION',
        gameMode: rows[0].data.gameMode || 'classic',
        intro: rows[0].data.intro || '',
        questions: Array.isArray(questions) ? questions : [],
      });
    } catch (error) { return next(error); }
  });

  r.post('/vip-invitations/:token/submit', async (req, res, next) => {
    const token = String(req.params.token || '');
    if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return res.status(404).json({ error: 'Η πρόσκληση δεν βρέθηκε ή δεν είναι πλέον ενεργή.' });
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const { rows: invitations } = await query(
      "SELECT id, data FROM records WHERE entity = 'VIPInvitation' AND data->>'tokenHash' = $1 AND data->>'active' = 'true' LIMIT 1",
      [tokenHash],
    );
    if (!invitations[0]) return res.status(404).json({ error: 'Η πρόσκληση δεν βρέθηκε ή δεν είναι πλέον ενεργή.' });
    req.entity = 'VIPInvitationSubmission';
    return formLimit(req, res, async () => {
      const body = req.body || {};
      const submissionId = typeof body.submissionId === 'string' ? body.submissionId.trim() : '';
      if (body.adultConfirmed !== true || body.consentConfirmed !== true || !/^[A-Za-z0-9_-]{16,100}$/.test(submissionId) ||
          typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 80 ||
          typeof body.avatar !== 'string' || body.avatar.length > 32 ||
          !isObject(body.answers || {})) {
        return res.status(400).json({ error: 'Συμπλήρωσε σωστά τα στοιχεία της πρόσκλησης.' });
      }
      const answers = body.answers || {};
      const { rows: settings } = await query(
        "SELECT data FROM records WHERE entity = 'AppSetting' AND data->>'key' = 'admin_form_questions' LIMIT 1"
      );
      const configuredQuestions = Array.isArray(settings[0]?.data?.value?.forms?.invitation)
        ? settings[0].data.value.forms.invitation
        : [];
      const customAnswers = body.customAnswers === undefined ? {} : body.customAnswers;
      const customQuestionIds = new Set(configuredQuestions.map((question) => String(question.id || '')).filter(Boolean));
      const customAnswersValid = isObject(customAnswers) &&
        Object.entries(customAnswers).every(([id, value]) => customQuestionIds.has(id) && typeof value === 'string' && value.length <= 2000) &&
        configuredQuestions.every((question) => {
          const value = customAnswers[question.id] || '';
          if (question.required && !String(value).trim()) return false;
          if (value && question.type === 'select' && !(question.options || []).includes(value)) return false;
          return true;
        });
      if (!customAnswersValid) {
        return res.status(400).json({ error: 'Έλεγξε τις πρόσθετες ερωτήσεις της VIP φόρμας και δοκίμασε ξανά.' });
      }
      const allowedKeys = new Set([
        'displayName', 'personality', 'competitiveness', 'activityPreferences',
        'unexpectedChallenge', 'activeParticipation', 'boundaries', 'safetyBoundaries',
        'safeWord', 'intensity', 'surpriseWish', 'shoeSize', 'plannedOutfit', 'shoesToWear',
        'nailColor', 'slipperType', 'pajamaType', 'stayAtVilla', 'favoriteDrink',
      ]);
      const scalarValues = Object.entries(answers).filter(([key]) => !['activityPreferences', 'safetyBoundaries'].includes(key)).map(([, value]) => value);
      const allowedPreferences = ['questions', 'missions', 'surprises', 'roleplay', 'puzzles'];
      const allowedBoundaries = ['touch', 'restraints', 'blindfolds', 'alcohol', 'personal-disclosure'];
      if (Object.keys(answers).some((key) => !allowedKeys.has(key)) ||
          scalarValues.some((value) => typeof value !== 'string' || value.length > 2000) ||
          !['bold', 'reserved', ''].includes(answers.personality || '') ||
          !['yes', 'no', ''].includes(answers.unexpectedChallenge || '') ||
          !['yes', 'no', ''].includes(answers.activeParticipation || '') ||
          !['yes', 'no', ''].includes(answers.stayAtVilla || '') ||
          !Array.isArray(answers.safetyBoundaries) || answers.safetyBoundaries.length > allowedBoundaries.length ||
          answers.safetyBoundaries.some((key) => !allowedBoundaries.includes(key)) ||
          typeof answers.safeWord !== 'string' || answers.safeWord.trim().length < 2 || answers.safeWord.trim().length > 40 ||
          !['competitiveness', 'intensity'].every((key) => /^[1-5]$/.test(String(answers[key] || ''))) ||
          !isObject(answers.activityPreferences) ||
          Object.keys(answers.activityPreferences).some((key) => !allowedPreferences.includes(key)) ||
          !allowedPreferences.every((key) => ['yes', 'no'].includes(answers.activityPreferences[key] || 'no'))) {
        return res.status(400).json({ error: 'Έλεγξε τις απαντήσεις της VIP φόρμας και δοκίμασε ξανά.' });
      }
      const gameMode = invitations[0].data.gameMode || 'classic';
      const answerLabels = {
        'Πώς θέλεις να σε αποκαλούν στο παιχνίδι;': answers.displayName || '',
        'Προσωπικότητα': answers.personality === 'bold' ? 'Τολμηρός/ή' : answers.personality === 'reserved' ? 'Συγκρατημένος/η' : '',
        'Ανταγωνιστικότητα': answers.competitiveness || '',
        'Ένταση δοκιμασιών': answers.intensity || '',
        'Προσωπική λέξη STOP / Safe Word': answers.safeWord || '',
        'Προτιμήσεις δραστηριοτήτων': Object.entries(answers.activityPreferences || {}).filter(([, value]) => value === 'yes').map(([key]) => ({ questions: 'Ερωτήσεις', missions: 'Αποστολές', surprises: 'Εκπλήξεις', roleplay: 'Role-play', puzzles: 'Γρίφοι' }[key])).join(', '),
        'Όρια / Δεν επιθυμώ': (answers.safetyBoundaries || []).map((key) => ({ touch: 'Σωματική επαφή', restraints: 'Δεσίματα / περιορισμοί', blindfolds: 'Κάλυψη ματιών', alcohol: 'Αλκοόλ', 'personal-disclosure': 'Προσωπικές αποκαλύψεις' }[key])).join(', '),
        'Απρόβλεπτη πρόκληση': answers.unexpectedChallenge === 'yes' ? 'ΝΑΙ' : answers.unexpectedChallenge === 'no' ? 'ΟΧΙ' : '',
        'Ενεργή συμμετοχή': answers.activeParticipation === 'yes' ? 'ΝΑΙ' : answers.activeParticipation === 'no' ? 'ΟΧΙ' : '',
        'Τι δεν επιθυμείς να περιλαμβάνει το παιχνίδι': answers.boundaries || '',
        'Επιθυμητή έκπληξη': answers.surpriseWish || '',
        'Νούμερο παπουτσιού': answers.shoeSize || '',
        'Τι σκέφτεσαι να φορέσεις': answers.plannedOutfit || '',
        'Τι παπούτσια θα φορέσεις': answers.shoesToWear || '',
        'Χρώμα νυχιών': answers.nailColor || '',
        'Τύπος παντόφλας / σαγιονάρας': answers.slipperType || '',
        'Τύπος πιτζάμας': answers.pajamaType || '',
        'Διαμονή στο σπίτι / Villa': answers.stayAtVilla === 'yes' ? 'ΝΑΙ' : answers.stayAtVilla === 'no' ? 'ΟΧΙ' : '',
        'Αγαπημένο ποτό': answers.favoriteDrink || '',
      };
      configuredQuestions.forEach((question) => {
        const value = customAnswers[question.id];
        if (value !== undefined && String(value).trim()) answerLabels[question.label] = value;
      });
      const customAnswerLabels = Object.fromEntries(configuredQuestions.map((question) => [question.id, question.label]));
      const data = {
        invitationId: invitations[0].id,
        consentConfirmed: true,
        ...(invitations[0].data?.sessionCode ? { sessionCode: invitations[0].data.sessionCode } : {}),
        submissionId,
        gameMode,
        name: body.name.trim(),
        displayName: String(answers.displayName || '').trim(),
        avatar: body.avatar,
        answers,
        customAnswers,
        answerLabels,
        adultConfirmed: true,
        confirmed: true,
        approved: false,
        approvalStatus: 'pending',
        approvedDate: null,
        customAnswerLabels,
        submittedAt: new Date().toISOString(),
      };
      const client = await pool.connect();
      let inserted;
      let playerIntakeRecord = null;
      try {
        await client.query('BEGIN');
        inserted = await client.query(
          "INSERT INTO records (id, entity, data, created_by) VALUES ($1, 'VIPInvitationSubmission', $2, NULL) ON CONFLICT ((data->>'submissionId')) WHERE entity = 'VIPInvitationSubmission' AND data ? 'submissionId' DO NOTHING RETURNING *",
          [crypto.randomUUID(), JSON.stringify(data)],
        );
        if (inserted.rows.length) {
          // The VIP submission stays pending until an administrator approves it.
          // PlayerIntake is created by the shared approval endpoint.
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        client.release();
        return next(error);
      }
      client.release();
      if (playerIntakeRecord) broadcast('PlayerIntake', { type: 'create', id: playerIntakeRecord.id, data: playerIntakeRecord });
      let record = inserted.rows[0] ? toRecord(inserted.rows[0]) : null;
      if (!record) {
        const existing = await query(
          "SELECT * FROM records WHERE entity = 'VIPInvitationSubmission' AND data->>'submissionId' = $1 LIMIT 1",
          [submissionId],
        );
        record = existing.rows[0] ? toRecord(existing.rows[0]) : null;
      }
      if (!record) return res.status(500).json({ error: 'Δεν ήταν δυνατή η αποθήκευση της συμμετοχής.' });
      if (inserted.rows[0]) {
        broadcast('VIPInvitationSubmission', { type: 'create', id: record.id, data: record });
        notifyNewSubmission('VIPInvitationSubmission', record);
      }
      return res.json({ success: true, alreadySubmitted: !inserted.rows.length });
    });
  });

  // Store the invitation intake and RSVP together. A stable submissionId makes retries safe.
  r.post('/invitation-intake', async (req, res, next) => {
    req.entity = 'PlayerIntake';
    return formLimit(req, res, async () => {
      const body = req.body || {};
      const submissionId = typeof body.submissionId === 'string' ? body.submissionId.trim() : '';
      if (!/^[A-Za-z0-9-]{16,100}$/.test(submissionId) || typeof body.name !== 'string' || !body.name.trim() ||
          body.adultConfirmed !== true || body.safeWordConfirmed !== true) {
        return res.status(400).json({ error: 'Επιβεβαίωσε ότι είσαι 18+ και ότι γνωρίζεις τη λέξη STOP.' });
      }
      const sessionCode = String(body.sessionCode || '').trim().toUpperCase();
      if (sessionCode) {
        const { rows: sessions } = await query("SELECT id FROM records WHERE entity = 'GameSession' AND data->>'sessionCode' = $1 LIMIT 1", [sessionCode]);
        if (!sessions[0]) return res.status(400).json({ error: 'Το Event της πρόσκλησης δεν βρέθηκε.' });
      }
      const { rows: settings } = await query("SELECT data FROM records WHERE entity = 'AppSetting' AND data->>'key' = 'admin_form_questions' LIMIT 1");
      const questions = Array.isArray(settings[0]?.data?.value?.forms?.invitation) ? settings[0].data.value.forms.invitation : [];
      const customAnswers = body.customAnswers || {};
      const ids = new Set(questions.map((question) => String(question.id || '')).filter(Boolean));
      const customValid = isObject(customAnswers) &&
        Object.entries(customAnswers).every(([id, value]) => ids.has(id) && typeof value === 'string' && value.length <= 2000) &&
        questions.every((question) => {
          const value = customAnswers[question.id] || '';
          return (!question.required || String(value).trim().length > 0) &&
            (!value || question.type !== 'select' || (question.options || []).includes(value));
        });
      if (!customValid) return res.status(400).json({ error: 'Έλεγξε τις υποχρεωτικές πρόσθετες ερωτήσεις.' });
      const client = await pool.connect();
      let playerRecord;
      let rsvpRecord;
      let playerCreated = false;
      let rsvpCreated = false;
      try {
        await client.query('BEGIN');
        let inserted = await client.query(
          "INSERT INTO records (id, entity, data, created_by) VALUES ($1, 'PlayerIntake', $2, NULL) ON CONFLICT ((data->>'submissionId')) WHERE entity = 'PlayerIntake' AND data ? 'submissionId' DO NOTHING RETURNING *",
          [crypto.randomUUID(), JSON.stringify(stripBuiltins({
            ...body,
            submissionId,
            formType: 'invitation',
            approved: false,
            approvalStatus: 'pending',
            approvedDate: null,
          }))],
        );
        playerCreated = inserted.rows.length > 0;
        if (playerCreated) playerRecord = toRecord(inserted.rows[0]);
        else {
          const existing = await client.query(
            "SELECT * FROM records WHERE entity = 'PlayerIntake' AND data->>'submissionId' = $1 LIMIT 1",
            [submissionId],
          );
          playerRecord = existing.rows[0] ? toRecord(existing.rows[0]) : null;
        }
        inserted = await client.query(
          "INSERT INTO records (id, entity, data, created_by) VALUES ($1, 'InvitationRSVP', $2, NULL) ON CONFLICT ((data->>'submissionId')) WHERE entity = 'InvitationRSVP' AND data ? 'submissionId' DO NOTHING RETURNING *",
          [crypto.randomUUID(), JSON.stringify({ name: body.name.trim(), confirmed: false, submissionId, ...(sessionCode ? { sessionCode } : {}) })],
        );
        rsvpCreated = inserted.rows.length > 0;
        if (rsvpCreated) rsvpRecord = toRecord(inserted.rows[0]);
        else {
          const existing = await client.query(
            "SELECT * FROM records WHERE entity = 'InvitationRSVP' AND data->>'submissionId' = $1 LIMIT 1",
            [submissionId],
          );
          rsvpRecord = existing.rows[0] ? toRecord(existing.rows[0]) : null;
        }
        if (!playerRecord || !rsvpRecord) throw new Error('Invitation submission could not be completed.');
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        client.release();
        return next(error);
      }
      client.release();
      if (playerCreated) {
        broadcast('PlayerIntake', { type: 'create', id: playerRecord.id, data: playerRecord });
        notifyNewSubmission('PlayerIntake', playerRecord);
      }
      if (rsvpCreated) broadcast('InvitationRSVP', { type: 'create', id: rsvpRecord.id, data: rsvpRecord });
      return res.json({ playerIntake: playerRecord, invitationRSVP: rsvpRecord, alreadySubmitted: !playerCreated && !rsvpCreated });
    });
  });

  // Delete a game-created Event as one transaction, including its linked invitations and guest submissions.
  r.delete('/game-events/:sessionCode', requireAdmin, async (req, res, next) => {
    const client = await pool.connect();
    const sessionCode = String(req.params.sessionCode || '').trim().toUpperCase();
    try {
      await client.query('BEGIN');
      const { rows: sessions } = await client.query(
        "SELECT * FROM records WHERE entity = 'GameSession' AND data->>'sessionCode' = $1 FOR UPDATE",
        [sessionCode],
      );
      if (!sessions[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Το Event δεν βρέθηκε.' }); }
      const session = toRecord(sessions[0]);
      const { rows: invitations } = await client.query(
        "SELECT id FROM records WHERE entity = 'VIPInvitation' AND data->>'sessionCode' = $1",
        [sessionCode],
      );
      const invitationIds = invitations.map((row) => row.id);
      const { rows: vipSubmissions } = await client.query(
        "SELECT id, data FROM records WHERE entity = 'VIPInvitationSubmission' AND (data->>'sessionCode' = $1 OR data->>'invitationId' = ANY($2::text[]))",
        [sessionCode, invitationIds],
      );
      const submissionIds = vipSubmissions.map((row) => row.data?.submissionId).filter(Boolean);
      const { rows: playerRows } = await client.query(
        "DELETE FROM records WHERE entity = 'PlayerIntake' AND (data->>'sessionCode' = $1 OR data->>'vipInvitationId' = ANY($2::text[]) OR data->>'vipSubmissionId' = ANY($3::text[])) RETURNING id",
        [sessionCode, invitationIds, submissionIds],
      );
      const { rows: rsvpRows } = await client.query(
        "DELETE FROM records WHERE entity = 'InvitationRSVP' AND data->>'sessionCode' = $1 RETURNING id",
        [sessionCode],
      );
      const { rows: publicRows } = await client.query(
        "DELETE FROM records WHERE entity = 'PublicFormSubmission' AND data->>'sessionCode' = $1 RETURNING id",
        [sessionCode],
      );
      const { rows: bacheloretteRows } = await client.query(
        "DELETE FROM records WHERE entity = 'BacheloretteIntake' AND data->>'sessionCode' = $1 RETURNING id",
        [sessionCode],
      );
      const { rows: pajamaRows } = await client.query(
        "DELETE FROM records WHERE entity = 'PajamaIntake' AND data->>'sessionCode' = $1 RETURNING id",
        [sessionCode],
      );
      const { rows: deletedVipRows } = await client.query(
        "DELETE FROM records WHERE entity = 'VIPInvitationSubmission' AND (data->>'sessionCode' = $1 OR data->>'invitationId' = ANY($2::text[])) RETURNING id",
        [sessionCode, invitationIds],
      );
      const { rows: deletedInvitationRows } = await client.query(
        "DELETE FROM records WHERE entity = 'VIPInvitation' AND data->>'sessionCode' = $1 RETURNING id",
        [sessionCode],
      );
      const snapshot = {
        sessionId: session.id, sessionCode, mode: session.state?.mode || session.mode || '',
        stage: Number(session.state?.stage ?? 0),
        playerCount: Array.isArray(session.state?.players) ? session.state.players.length : 0,
        label: 'Αυτόματο αντίγραφο πριν από διαγραφή Event',
        state: JSON.parse(JSON.stringify(session.state || {})),
        sourceUpdatedAt: session.updated_date || session.created_date || null,
      };
      const { rows: snapshotRows } = await client.query(
        "INSERT INTO records (id, entity, data, created_by) VALUES ($1, 'GameSessionSnapshot', $2, $3) RETURNING *",
        [crypto.randomUUID(), JSON.stringify(snapshot), req.user?.email || null],
      );
      await client.query("DELETE FROM records WHERE id = $1 AND entity = 'GameSession'", [session.id]);
      await client.query('COMMIT');
      playerRows.forEach(({ id }) => broadcast('PlayerIntake', { type: 'delete', id, data: { id } }));
      rsvpRows.forEach(({ id }) => broadcast('InvitationRSVP', { type: 'delete', id, data: { id } }));
      publicRows.forEach(({ id }) => broadcast('PublicFormSubmission', { type: 'delete', id, data: { id } }));
      bacheloretteRows.forEach(({ id }) => broadcast('BacheloretteIntake', { type: 'delete', id, data: { id } }));
      pajamaRows.forEach(({ id }) => broadcast('PajamaIntake', { type: 'delete', id, data: { id } }));
      deletedVipRows.forEach(({ id }) => broadcast('VIPInvitationSubmission', { type: 'delete', id, data: { id } }));
      deletedInvitationRows.forEach(({ id }) => broadcast('VIPInvitation', { type: 'delete', id, data: { id } }));
      broadcast('GameSessionSnapshot', { type: 'create', id: snapshotRows[0].id, data: toRecord(snapshotRows[0]) });
      broadcast('GameSession', { type: 'delete', id: session.id, data: { id: session.id, sessionCode } });
      return res.json({
        success: true,
        deleted: {
          playerIntakes: playerRows.length, rsvps: rsvpRows.length, publicForms: publicRows.length,
          bacheloretteIntakes: bacheloretteRows.length, pajamaIntakes: pajamaRows.length,
          vipSubmissions: deletedVipRows.length, vipInvitations: deletedInvitationRows.length,
        },
        snapshotId: snapshotRows[0].id,
      });
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      return next(error);
    } finally { client.release(); }
  });

  // Keep invitation RSVP and its matching intake together when either is deleted.
  r.delete('/invitation-rsvps/:id', requireAdmin, async (req, res, next) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query("SELECT data FROM records WHERE id = $1 AND entity = 'InvitationRSVP' FOR UPDATE", [req.params.id]);
      if (!rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Η επιβεβαίωση δεν βρέθηκε.' }); }
      const submissionId = rows[0].data?.submissionId || '';
      const { rows: players } = await client.query("DELETE FROM records WHERE entity = 'PlayerIntake' AND data->>'submissionId' = $1 RETURNING id", [submissionId]);
      await client.query("DELETE FROM records WHERE id = $1 AND entity = 'InvitationRSVP'", [req.params.id]);
      await client.query('COMMIT');
      players.forEach(({ id }) => broadcast('PlayerIntake', { type: 'delete', id, data: { id } }));
      broadcast('InvitationRSVP', { type: 'delete', id: req.params.id, data: { id: req.params.id } });
      return res.json({ success: true, deletedPlayerIntakes: players.length });
    } catch (error) { await client.query('ROLLBACK').catch(() => {}); return next(error); }
    finally { client.release(); }
  });

  r.delete('/pajama-intakes/:id', requireAdmin, async (req, res, next) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: source } = await client.query(
        "SELECT id FROM records WHERE id = $1 AND entity = 'PajamaIntake' FOR UPDATE",
        [req.params.id],
      );
      if (!source[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Η αίτηση δεν βρέθηκε.' }); }
      const { rows: profiles } = await client.query(
        "DELETE FROM records WHERE entity = 'PlayerIntake' AND data->>'sourceEntity' = 'PajamaIntake' AND data->>'sourceIntakeId' = $1 RETURNING id",
        [req.params.id],
      );
      await client.query("DELETE FROM records WHERE id = $1 AND entity = 'PajamaIntake'", [req.params.id]);
      await client.query('COMMIT');
      profiles.forEach(({ id }) => broadcast('PlayerIntake', { type: 'delete', id, data: { id } }));
      broadcast('PajamaIntake', { type: 'delete', id: req.params.id, data: { id: req.params.id } });
      return res.json({ success: true, deletedProfiles: profiles.length });
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      return next(error);
    } finally { client.release(); }
  });

  r.delete('/player-intakes/:id', requireAdmin, async (req, res, next) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query("SELECT data FROM records WHERE id = $1 AND entity = 'PlayerIntake' FOR UPDATE", [req.params.id]);
      if (!rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Η αίτηση δεν βρέθηκε.' }); }
      const data = rows[0].data || {};
      const submissionId = data.submissionId || '';
      const { rows: rsvps } = await client.query("DELETE FROM records WHERE entity = 'InvitationRSVP' AND data->>'submissionId' = $1 RETURNING id", [submissionId]);
      const { rows: vipSubmissions } = data.vipSubmissionId
        ? await client.query("DELETE FROM records WHERE entity = 'VIPInvitationSubmission' AND data->>'submissionId' = $1 RETURNING id", [data.vipSubmissionId])
        : { rows: [] };
      await client.query("DELETE FROM records WHERE id = $1 AND entity = 'PlayerIntake'", [req.params.id]);
      await client.query('COMMIT');
      rsvps.forEach(({ id }) => broadcast('InvitationRSVP', { type: 'delete', id, data: { id } }));
      vipSubmissions.forEach(({ id }) => broadcast('VIPInvitationSubmission', { type: 'delete', id, data: { id } }));
      broadcast('PlayerIntake', { type: 'delete', id: req.params.id, data: { id: req.params.id } });
      return res.json({ success: true, deletedRsvps: rsvps.length, deletedVipSubmissions: vipSubmissions.length });
    } catch (error) { await client.query('ROLLBACK').catch(() => {}); return next(error); }
    finally { client.release(); }
  });

  // --- realtime stream (EventSource can't send headers; admins authenticate with a one-time ?ticket= from POST /api/entities/stream-ticket) ---
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

  r.post('/:entity', guard('create'), formLimit, async (req, res) => {
    if (req.entity === 'ProductionConsent' && !isAdmin(req)) {
      const body = req.body || {};
      const code = String(body.sessionCode || '').trim().toUpperCase();
      const participant = typeof body.participantName === 'string' ? body.participantName.trim() : '';
      if (!/^[A-Z0-9]{4}$/.test(code) || !participant || participant.length > 100 || body.adultConfirmed !== true ||
          typeof body.recordingConsent !== 'boolean' || typeof body.privateUseConsent !== 'boolean' || typeof body.publicUseConsent !== 'boolean' ||
          typeof body.withdrawn !== 'boolean') return res.status(400).json({ error: 'Συμπλήρωσε σωστά τη δήλωση συγκατάθεσης.' });
      const { rows: eventRows } = await query("SELECT id FROM records WHERE entity = 'GameSession' AND data->>'sessionCode' = $1 LIMIT 1", [code]);
      if (!eventRows[0]) return res.status(404).json({ error: 'Η διοργάνωση δεν βρέθηκε.' });
      req.body = { sessionCode: code, participantName: participant, contact: typeof body.contact === 'string' ? body.contact.trim().slice(0,160) : '', recordingConsent: body.recordingConsent, privateUseConsent: body.privateUseConsent, publicUseConsent: body.publicUseConsent, withdrawn: body.withdrawn, adultConfirmed: true, consentVersion: '2026-11-17', submittedAt: new Date().toISOString() };
    }
    if (req.entity === 'ProductionCue' && !isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
    if (!isAdmin(req) && ['PajamaIntake', 'BacheloretteIntake'].includes(req.entity)) {
      const body = req.body || {};
      if (body.adultConfirmed !== true || body.safeWordConfirmed !== true) {
        return res.status(400).json({ error: 'Απαιτείται επιβεβαίωση 18+ και αποδοχή του STOP.' });
      }
      if (req.entity === 'BacheloretteIntake') {
        const sessionCode = String(body.sessionCode || '').trim().toUpperCase();
        if (typeof body.leaderName !== 'string' || !body.leaderName.trim() ||
            !['house', 'oneday'].includes(body.accommodation) || !/^[A-Z0-9]{4}$/.test(sessionCode)) {
          return res.status(400).json({ error: 'Συμπλήρωσε σωστά τα υποχρεωτικά στοιχεία της φόρμας.' });
        }
      } else if (typeof body.name !== 'string' || !body.name.trim()) {
        return res.status(400).json({ error: 'Το όνομα είναι υποχρεωτικό.' });
      }
      if (req.entity === 'PajamaIntake' && body.formType === 'modes') {
        const modes = body.preferredModes;
        if (!Array.isArray(modes) || !modes.length || modes.some((mode) => !['pedi_extended', 'lockdown', 'beach_bar', 'marathon_4h'].includes(mode))) {
          return res.status(400).json({ error: 'Επίλεξε τουλάχιστον ένα διαθέσιμο Mode.' });
        }
      }
      const formType = req.entity === 'BacheloretteIntake' ? 'heist' : (body.formType === 'modes' ? 'modes' : 'pajama');
      const { rows: settings } = await query("SELECT data FROM records WHERE entity = 'AppSetting' AND data->>'key' = 'admin_form_questions' LIMIT 1");
      const questions = settings[0]?.data?.value?.forms?.[formType] || [];
      const answers = body.customAnswers || {};
      const ids = new Set((Array.isArray(questions) ? questions : []).map((question) => String(question.id || '')).filter(Boolean));
      const valid = isObject(answers) &&
        Object.entries(answers).every(([id, value]) => ids.has(id) && typeof value === 'string' && value.length <= 2000) &&
        (Array.isArray(questions) ? questions : []).every((question) => {
          const value = answers[question.id] || '';
          return (!question.required || String(value).trim().length > 0) &&
            (!value || question.type !== 'select' || (question.options || []).includes(value));
        });
      if (!valid) return res.status(400).json({ error: 'Έλεγξε τις υποχρεωτικές πρόσθετες ερωτήσεις.' });
    }
    const { rows } = await query(
      'INSERT INTO records (id, entity, data, created_by) VALUES ($1,$2,$3,$4) RETURNING *',
      [crypto.randomUUID(), req.entity, stripBuiltins(req.body), req.user?.email || null],
    );
    const rec = toRecord(rows[0]);
    broadcast(req.entity, { type: 'create', id: rec.id, data: rec });
    notifyNewSubmission(req.entity, rec);
    res.json(rec);
  });

  r.post('/:entity/bulk', guard('create'), formLimit, async (req, res) => {
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

  // Approve a submitted form and create/update its unified PlayerIntake profile.
  r.post('/intake-approvals/:entity/:id', requireAdmin, async (req, res, next) => {
    const entity = String(req.params.entity || '');
    if (!['PlayerIntake', 'PajamaIntake', 'VIPInvitationSubmission'].includes(entity)) {
      return res.status(400).json({ error: 'Μη υποστηριζόμενη φόρμα.' });
    }
    const client = await pool.connect();
    let sourceRecord;
    let profileRecord;
    let profileAction = 'create';
    let rsvpRecord = null;
    const approvedDate = new Date().toISOString();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query('SELECT * FROM records WHERE id = $1 AND entity = $2 FOR UPDATE', [req.params.id, entity]);
      if (!rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Η αίτηση δεν βρέθηκε.' }); }
      sourceRecord = toRecord(rows[0]);
      if (req.body?.approved === false) {
        await client.query("UPDATE records SET data = data || $1::jsonb, updated_date = now() WHERE id = $2 AND entity = $3",
          [JSON.stringify({ approved: false, approvalStatus: 'pending', approvedDate: null }), sourceRecord.id, entity]);
        if (entity === 'PlayerIntake') {
          profileRecord = { ...sourceRecord, approved: false, approvalStatus: 'pending', approvedDate: null };
          if (sourceRecord.submissionId) {
            const { rows: rsvps } = await client.query("UPDATE records SET data = data || $1::jsonb, updated_date = now() WHERE entity = 'InvitationRSVP' AND data->>'submissionId' = $2 RETURNING *", [JSON.stringify({ confirmed: false }), sourceRecord.submissionId]);
            if (rsvps[0]) rsvpRecord = toRecord(rsvps[0]);
          }
        } else {
          const sourceKey = entity === 'VIPInvitationSubmission' ? sourceRecord.submissionId : sourceRecord.id;
          const { rows: profiles } = await client.query(
            "UPDATE records SET data = data || $1::jsonb, updated_date = now() WHERE entity = 'PlayerIntake' AND data->>'sourceIntakeId' = $2 RETURNING *",
            [JSON.stringify({ approved: false, approvalStatus: 'pending', approvedDate: null }), String(sourceKey)]
          );
          profileRecord = profiles[0] ? toRecord(profiles[0]) : null;
        }
        await client.query('COMMIT');
        if (entity !== 'PlayerIntake') broadcast(entity, { type: 'update', id: sourceRecord.id, data: { ...sourceRecord, approved: false, approvalStatus: 'pending' } });
        if (profileRecord) broadcast('PlayerIntake', { type: 'update', id: profileRecord.id, data: profileRecord });
        if (rsvpRecord) broadcast('InvitationRSVP', { type: 'update', id: rsvpRecord.id, data: rsvpRecord });
        return res.json({ source: { ...sourceRecord, approved: false }, profile: profileRecord });
      }
      let profile = sourceRecord;
      if (entity === 'PajamaIntake') {
        profile = {
          ...sourceRecord,
          sourceEntity: entity,
          sourceIntakeId: sourceRecord.id,
          formType: sourceRecord.formType === 'modes' ? 'modes' : 'pajama',
          preferredModes: sourceRecord.preferredModes || [],
          approved: true,
          approvalStatus: 'approved',
          approvedDate,
        };
        await client.query("UPDATE records SET data = data || $1::jsonb, updated_date = now() WHERE id = $2 AND entity = $3",
          [JSON.stringify({ approved: true, approvalStatus: 'approved', approvedDate }), sourceRecord.id, entity]);
      } else if (entity === 'VIPInvitationSubmission') {
        const { rows: invitations } = await client.query("SELECT data FROM records WHERE id = $1 AND entity = 'VIPInvitation' LIMIT 1", [sourceRecord.invitationId]);
        if (!invitations[0]) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Η VIP πρόσκληση δεν βρέθηκε.' }); }
        const answers = sourceRecord.answers || {};
        profile = {
          name: String(answers.displayName || sourceRecord.name || '').trim(),
          legalName: sourceRecord.name,
          sessionCode: sourceRecord.sessionCode || invitations[0].data.sessionCode || '',
          vipGameMode: sourceRecord.gameMode || invitations[0].data.gameMode || 'classic',
          vipInvitationId: sourceRecord.invitationId,
          vipSubmissionId: sourceRecord.submissionId,
          vipProfile: { displayName: answers.displayName || '', avatar: sourceRecord.avatar || '', consentConfirmed: sourceRecord.consentConfirmed === true, answers: { ...answers, customAnswers: sourceRecord.customAnswers || {}, customAnswerLabels: sourceRecord.customAnswerLabels || {} }, answerLabels: sourceRecord.answerLabels || {} },
          shoeSize: answers.shoeSize || '',
          nailColor: answers.nailColor || '',
          slipperType: answers.slipperType || '',
          pajamaStyle: answers.pajamaType || '',
          preferredModes: [sourceRecord.gameMode || invitations[0].data.gameMode || 'classic'],
          approved: true,
          approvalStatus: 'approved',
          approvedDate,
          formType: 'vip',
          sourceEntity: entity,
          sourceIntakeId: sourceRecord.id,
        };
        await client.query("UPDATE records SET data = data || $1::jsonb, updated_date = now() WHERE id = $2 AND entity = $3",
          [JSON.stringify({ approved: true, approvalStatus: 'approved', approvedDate }), sourceRecord.id, entity]);
      } else {
        profile = { ...sourceRecord, approved: true, approvalStatus: 'approved', approvedDate };
        await client.query("UPDATE records SET data = data || $1::jsonb, updated_date = now() WHERE id = $2 AND entity = $3",
          [JSON.stringify({ approved: true, approvalStatus: 'approved', approvedDate }), sourceRecord.id, entity]);
      }
      const profileKey = entity === 'PlayerIntake'
        ? sourceRecord.id
        : entity === 'VIPInvitationSubmission'
          ? sourceRecord.submissionId
          : sourceRecord.id;
      const { rows: existing } = await client.query(
        "SELECT * FROM records WHERE entity = 'PlayerIntake' AND data->>'sourceIntakeId' = $1 LIMIT 1",
        [String(profileKey)]
      );
      if (entity === 'PlayerIntake') {
        const { rows: updated } = await client.query(
          "UPDATE records SET data = data || $1::jsonb, updated_date = now() WHERE id = $2 AND entity = 'PlayerIntake' RETURNING *",
          [JSON.stringify({ approved: true, approvalStatus: 'approved', approvedDate: profile.approvedDate || new Date().toISOString() }), sourceRecord.id]
        );
        profileRecord = toRecord(updated[0]);
        if (sourceRecord.submissionId) {
          const { rows: rsvps } = await client.query("UPDATE records SET data = data || $1::jsonb, updated_date = now() WHERE entity = 'InvitationRSVP' AND data->>'submissionId' = $2 RETURNING *", [JSON.stringify({ confirmed: true }), sourceRecord.submissionId]);
          if (rsvps[0]) rsvpRecord = toRecord(rsvps[0]);
        }
      } else if (existing[0]) {
        const { rows: updated } = await client.query(
          "UPDATE records SET data = data || $1::jsonb, updated_date = now() WHERE id = $2 AND entity = 'PlayerIntake' RETURNING *",
          [JSON.stringify({ ...profile, sourceIntakeId: String(profileKey) }), existing[0].id]
        );
        profileRecord = toRecord(updated[0]);
        profileAction = 'update';
      } else {
        const { rows: created } = await client.query(
          "INSERT INTO records (id, entity, data, created_by) VALUES ($1, 'PlayerIntake', $2, NULL) RETURNING *",
          [crypto.randomUUID(), JSON.stringify({ ...profile, sourceIntakeId: String(profileKey) })]
        );
        profileRecord = toRecord(created[0]);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      return next(error);
    } finally { client.release(); }
    if (entity !== 'PlayerIntake') broadcast(entity, { type: 'update', id: sourceRecord.id, data: { ...sourceRecord, approved: true, approvalStatus: 'approved' } });
    broadcast('PlayerIntake', { type: entity === 'PlayerIntake' ? 'update' : profileAction, id: profileRecord.id, data: profileRecord });
    if (rsvpRecord) broadcast('InvitationRSVP', { type: 'update', id: rsvpRecord.id, data: rsvpRecord });
    return res.json({ source: sourceRecord, profile: profileRecord });
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
            const beforeMissions = current.state?.mg?.missions || {};
            const afterMissions = rec.state?.mg?.missions || {};
            for (const [playerId, mission] of Object.entries(afterMissions)) {
              if (mission?.status === 'active' && mission.sentAt && mission.sentAt !== beforeMissions[playerId]?.sentAt) {
                notifyPlayerMission(current.sessionCode, playerId, mission).catch((error) =>
                  console.error('[player-push] mission notification failed:', error.message)
                );
              }
            }
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
