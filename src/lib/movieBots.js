// 12.0 · Λογική «ψεύτικων κινητών» (καθαρή συνάρτηση, ελέγχεται στα tests).
import { turnPid } from './movieBoardEngine.js';
import { NAIL_COLORS } from '../data/modes/campaignContent.js';

const VOTE_OPTIONS = { truth: ['Ισχύει', 'Μπλόφα'], believe: ['Την πιστεύω', 'Την κρίνω'], verdict: ['Αθώα', 'Ένοχη', 'Ασυλία'], choice: ['Σίγουρα +3', 'Ρίσκο 50/50'] };
const pick = (list) => list[Math.floor(Math.random() * list.length)];

// Η επόμενη ενέργεια που θα έκανε ένα κινητό, ή null.
export function nextBotAction(state, bots, now = Date.now()) {
  const cg = state?.mg?.cg;
  if (!cg || state.stopActive || state.mg?.stop) return null;
  const players = state.players || [];
  const isBot = (id) => bots.includes(id);
  const w = cg.wheel;
  if (w && !w.done && !w.confirmed && isBot(w.pid) && now - w.at > 6000) return { playerId: w.pid, type: 'cg_wheel_ok' };
  if (cg.game === 'tod' && cg.tod && !cg.tod.choice && isBot(cg.tod.pid)) return { playerId: cg.tod.pid, type: 'cg_tod', value: pick(['truth', 'dare']) };
  const d = cg.game === 'dond' ? cg.dond : null;
  if (d && isBot(d.pid)) {
    if (d.status === 'pick' || d.status === 'open') {
      const closed = (d.boxes || []).filter((b) => !b.open && (d.status === 'pick' || b.no !== d.myBox));
      if (closed.length) return { playerId: d.pid, type: 'cg_dond_box', value: pick(closed).no };
    }
    if (d.status === 'offer') return { playerId: d.pid, type: 'cg_dond', value: Math.random() < 0.3 ? 'deal' : 'nodeal' };
  }
  const v = cg.votes;
  if (v?.open) {
    const voter = players.find((p) => isBot(p.id) && !(v.ballots || {})[p.id] && !(v.kind === 'final' && (cg.finalVotes || {})[p.id]) && !(v.kind === 'risk' && (cg.risk || {})[p.id]));
    if (voter) {
      const others = players.filter((p) => p.id !== voter.id);
      if (v.kind === 'final') return { playerId: voter.id, type: 'cg_final', target: pick(others).id };
      if (v.kind === 'player') return { playerId: voter.id, type: 'cg_vote', value: pick(others).id };
      if (v.kind === 'risk') return { playerId: voter.id, type: 'cg_risk', value: pick(['lock', 'risk']) };
      if (VOTE_OPTIONS[v.kind] && (v.kind !== 'choice' || v.pid === voter.id)) return { playerId: voter.id, type: 'cg_vote', value: pick(VOTE_OPTIONS[v.kind]) };
    }
  }
  if (cg.nailsOpen) {
    const p = players.find((x) => isBot(x.id) && !cg.players?.[x.id]?.nailLocked);
    if (p) return { playerId: p.id, type: 'cg_nail', nail: pick(NAIL_COLORS) };
  }
  if (cg.board?.on && (cg.status || 'active') === 'active' && !cg.board.pending) {
    const t = turnPid(cg);
    if (t && isBot(t)) return { playerId: t, type: 'cg_roll' };
  }
  return null;
}

