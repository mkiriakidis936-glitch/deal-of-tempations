import crypto from 'node:crypto';
import express from 'express';
import { requireAdmin } from './auth.js';
import { entityApi } from './entities.js';
import { pool } from './db.js';

// ---- port of base44/shared/archiveLogic.ts ----
async function archiveSessionData({ sessionCode, mode, winner, playerNames, stats, confessions, highlights }) {
  const eventDate = new Date().toISOString().split('T')[0];
  const names = [...new Set((Array.isArray(playerNames) ? playerNames : []).filter((name) => typeof name === 'string' && name.trim()).map((name) => name.trim()))];
  const safeStats = stats && typeof stats === 'object' && !Array.isArray(stats) ? stats : {};
  const safeConfessions = Array.isArray(confessions) ? confessions : [];
  const safeHighlights = Array.isArray(highlights) ? highlights : [];
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    // Serialize retries for the same session and chapter numbering across sessions.
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1)::bigint)', [sessionCode]);
    await client.query('SELECT pg_advisory_xact_lock(11235813)');

    const insertRecord = async (entity, data) => {
      const id = crypto.randomUUID();
      await client.query(
        'INSERT INTO records (id, entity, data) VALUES ($1, $2, $3::jsonb)',
        [id, entity, JSON.stringify(data)],
      );
      return id;
    };

    const { rows: archives } = await client.query(
      "SELECT id, data FROM records WHERE entity = 'SessionArchive' AND data->>'sessionCode' = $1 ORDER BY created_date DESC LIMIT 1",
      [sessionCode],
    );
    const archiveId = archives[0]?.id || await insertRecord('SessionArchive', {
      sessionCode, mode, winner: winner || '', playerNames: names, stats: safeStats,
      confessions: safeConfessions, highlights: safeHighlights, eventDate, volume: 1,
    });

    const { rows: chronicles } = await client.query(
      "SELECT id, data FROM records WHERE entity = 'Chronicle' AND data->>'sessionCode' = $1 ORDER BY created_date DESC LIMIT 1",
      [sessionCode],
    );
    let chronicleTitle = chronicles[0]?.data?.title || `Κεφάλαιο ${sessionCode}`;
    let chapter = Number(chronicles[0]?.data?.chapter) || null;
    if (!chronicles[0]) {
      const { rows: last } = await client.query(
        "SELECT COALESCE(MAX((data->>'chapter')::int), 0) AS chapter FROM records WHERE entity = 'Chronicle' AND data->>'volume' = '1' AND data->>'chapter' ~ '^[0-9]+$'",
      );
      chapter = Number(last[0]?.chapter || 0) + 1;
      const chronicleText = [
        `Το τραπέζι στήθηκε για «${mode}».`,
        winner ? `Νικήτρια της βραδιάς: ${winner}.` : '',
        names.length ? `Στο τραπέζι κάθισαν: ${names.join(', ')}.` : '',
        safeHighlights.length ? `Έμειναν: ${safeHighlights.join(' · ')}.` : '',
        safeConfessions.length ? `Καταγράφηκαν ${safeConfessions.length} εξομολογήσεις στο Vault.` : '',
      ].filter(Boolean).join(' ');
      await insertRecord('Chronicle', {
        volume: 1, chapter, sessionCode, title: chronicleTitle, content: chronicleText,
        characters: names, eventDate,
      });
    }

    // lastSessionCode makes profile increments idempotent if a previous attempt was retried.
    for (const name of names) {
      const { rows: profiles } = await client.query(
        "SELECT id, data FROM records WHERE entity = 'PlayerProfile' AND data->>'playerName' = $1 ORDER BY created_date ASC LIMIT 1 FOR UPDATE",
        [name],
      );
      const profile = profiles[0];
      const isWinner = name === winner;
      if (profile) {
        if (profile.data?.lastSessionCode !== sessionCode) {
          const next = {
            ...profile.data,
            totalSessions: (profile.data?.totalSessions || 0) + 1,
            totalWins: (profile.data?.totalWins || 0) + (isWinner ? 1 : 0),
            lastSessionCode: sessionCode,
          };
          await client.query(
            'UPDATE records SET data = $1::jsonb, updated_date = now() WHERE id = $2',
            [JSON.stringify(next), profile.id],
          );
        }
      } else {
        await insertRecord('PlayerProfile', {
          playerName: name, totalSessions: 1, totalWins: isWinner ? 1 : 0, lastSessionCode: sessionCode,
        });
      }
    }

    for (const confession of safeConfessions) {
      const entry = {
        playerName: confession.playerName || 'Unknown',
        confession: confession.text || confession.confession || '',
        confessionType: confession.type || 'truth',
        sessionCode,
        eventDate,
      };
      if (!entry.confession) continue;
      const { rowCount } = await client.query(
        "SELECT 1 FROM records WHERE entity = 'BlackmailVault' AND data->>'sessionCode' = $1 AND data->>'playerName' = $2 AND data->>'confession' = $3 LIMIT 1",
        [sessionCode, entry.playerName, entry.confession],
      );
      if (!rowCount) await insertRecord('BlackmailVault', entry);
    }

    await client.query('COMMIT');
    return { archiveId, chronicleTitle, chapter };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
function timingSafeEqual(a, b) {
  const ab = Buffer.from(a), bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export function functionRoutes() {
  const r = express.Router();

  // POST /api/functions/archiveSession  (admin only)
  r.post('/archiveSession', requireAdmin, async (req, res) => {
    const { sessionCode, mode } = req.body || {};
    if (!sessionCode || !mode) return res.status(400).json({ error: 'sessionCode and mode required' });
    res.json({ success: true, ...(await archiveSessionData(req.body)) });
  });

  // GET /api/functions/controlPanelApi  — read-only, protected by X-Control-Panel-Key
  // (same payload as the old Base44 function, for the separate CONTROL PANEL app)
  r.get('/controlPanelApi', async (req, res) => {
    const expected = process.env.CONTROL_PANEL_API_KEY || '';
    const provided = String(req.get('x-control-panel-key') || '');
    if (!expected) return res.status(503).json({ error: 'API key not configured' });
    if (!provided || !timingSafeEqual(provided, expected)) return res.status(401).json({ error: 'Unauthorized' });

    const [session] = await entityApi.filter('GameSession', {}, { sort: '-created_date', limit: 1 });
    if (!session) return res.json({ active: false, session: null });
    const state = session.state || {};

    let intakes = [];
    try {
      intakes = (await entityApi.filter('PlayerIntake', {}, { sort: '-created_date', limit: 100 })).map((i) => ({
        id: i.id, name: i.name, accommodation: i.accommodation ?? null, shoeType: i.shoeType ?? null, shoeSize: i.shoeSize ?? null,
        nailColor: i.nailColor ?? null, intensity: i.intensity ?? null, comfortTruth: i.comfortTruth ?? null,
        comfortDare: i.comfortDare ?? null, comfortTickle: i.comfortTickle ?? null, comfortBondage: i.comfortBondage ?? null,
        comfortDrinking: i.comfortDrinking ?? null, secrets: i.secrets ?? null, musicPreferences: i.musicPreferences ?? null,
        allergies: i.allergies ?? null, dressCode: i.dressCode ?? null, safeWordConfirmed: i.safeWordConfirmed ?? false,
      }));
    } catch { /* non-critical */ }

    res.json({
      active: true,
      intakes,
      session: {
        id: session.id, sessionCode: session.sessionCode, mode: session.mode, duration: session.duration, intensity: session.intensity,
        stage: state.stage ?? session.stage ?? 0, round: state.round ?? null, currentTeam: state.currentTeam ?? null,
        currentPlayerId: state.currentPlayerId ?? null,
        players: Array.isArray(state.players) ? state.players.map((p) => ({
          id: p.id, name: p.name, footwearLevel: p.footwearLevel ?? null, penaltyStep: p.penaltyStep ?? 0, tokens: p.tokens ?? 0,
          bounty: p.bounty ?? 0, team: p.team ?? null, isChief: !!p.isChief, role: p.role ?? null, position: p.position ?? null,
        })) : [],
        activeCard: state.activeCard ?? null,
        history: Array.isArray(state.history) ? state.history.slice(-50) : [],
        updatedAt: session.updated_date,
      },
    });
  });

  return r;
}
