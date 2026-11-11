import crypto from 'node:crypto';
import express from 'express';
import { requireAdmin } from './auth.js';
import { entityApi } from './entities.js';

// ---- port of base44/shared/archiveLogic.ts ----
async function archiveSessionData({ sessionCode, mode, winner, playerNames, stats, confessions, highlights }) {
  const eventDate = new Date().toISOString().split('T')[0];
  const names = playerNames || [];

  const archive = await entityApi.create('SessionArchive', {
    sessionCode, mode, winner: winner || '', playerNames: names, stats: stats || {},
    confessions: confessions || [], highlights: highlights || [], eventDate, volume: 1,
  });

  const title = `Κεφάλαιο ${sessionCode}`;
  const chronicleText = [
    `Το τραπέζι στήθηκε για «${mode}».`,
    winner ? `Νικήτρια της βραδιάς: ${winner}.` : '',
    names.length ? `Στο τραπέζι κάθισαν: ${names.join(', ')}.` : '',
    (highlights || []).length ? `Έμειναν: ${highlights.join(' · ')}.` : '',
    (confessions || []).length ? `Καταγράφηκαν ${confessions.length} εξομολογήσεις στο Vault.` : '',
  ].filter(Boolean).join(' ');

  const [last] = await entityApi.filter('Chronicle', { volume: 1 }, { sort: '-chapter', limit: 1 });
  const nextChapter = (last?.chapter || 0) + 1;
  await entityApi.create('Chronicle', { volume: 1, chapter: nextChapter, sessionCode, title, content: chronicleText, characters: names, eventDate });

  await Promise.allSettled(names.map(async (name) => {
    const [profile] = await entityApi.filter('PlayerProfile', { playerName: name }, { limit: 1 });
    const isWinner = name === winner;
    if (profile) {
      await entityApi.update('PlayerProfile', profile.id, {
        totalSessions: (profile.totalSessions || 0) + 1,
        totalWins: (profile.totalWins || 0) + (isWinner ? 1 : 0),
        lastSessionCode: sessionCode,
      });
    } else {
      await entityApi.create('PlayerProfile', { playerName: name, totalSessions: 1, totalWins: isWinner ? 1 : 0, lastSessionCode: sessionCode });
    }
  }));

  const vaultEntries = (confessions || [])
    .map((c) => ({ playerName: c.playerName || 'Unknown', confession: c.text || c.confession || '', confessionType: c.type || 'truth', sessionCode, eventDate }))
    .filter((e) => e.confession);
  for (const entry of vaultEntries) await entityApi.create('BlackmailVault', entry);

  return { archiveId: archive.id, chronicleTitle: title, chapter: nextChapter };
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
