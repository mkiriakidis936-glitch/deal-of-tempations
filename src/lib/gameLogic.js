// DEAL OF TEMPTATION - Shared Game Logic
import { BOARD, CLASSIC_BOARD, getPenaltyLadder, FULL_PENALTY_LADDER, HIDDEN_ROLES } from '@/data/gameConfig';
import {
  PDF_STREET_TRUTHS, PDF_STREET_DARES, PDF_WARRANT_CARDS, PDF_GLITCH_CARDS,
  HARDCORE_TRUTHS, ULTIMATE_TRUTHS,
} from '@/data/gameContent';
import { isNewMode } from '@/data/modes/modeRegistry';
import { initialMg } from '@/lib/modeKit';

export function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

export function drawCard(type) {
  const decks = {
    street_truth: STREET_TRUTHS,
    street_dare: STREET_DARES,
    warrant: WARRANT_CARDS,
    glitch: GLITCH_CARDS,
    hardcore: HARDCORE_TRUTHS,
    ultimate: ULTIMATE_TRUTHS,
  };
  const deck = decks[type] || [];
  if (deck.length === 0) return null;
  return deck[Math.floor(Math.random() * deck.length)];
}

export function getBoardSquare(position) {
  return CLASSIC_BOARD[position % CLASSIC_BOARD.length];
}

export function getHeistBoardSquare(position) {
  return BOARD[position % BOARD.length];
}

export function drawHeistCard(type) {
  const decks = { street_truth: PDF_STREET_TRUTHS, street_dare: PDF_STREET_DARES, warrant: PDF_WARRANT_CARDS, glitch: PDF_GLITCH_CARDS, hardcore: HARDCORE_TRUTHS, ultimate: ULTIMATE_TRUTHS };
  const deck = decks[type] || [];
  return deck.length ? deck[Math.floor(Math.random() * deck.length)] : null;
}

export function getSquareType(position) {
  const sq = getBoardSquare(position);
  return sq ? sq.type : 'street';
}

export function applyPenaltyStep(player) {
  const ladder = getPenaltyLadder(player.footwearLevel);
  const newStep = Math.min(player.penaltyStep + 1, ladder.length);
  return { ...player, penaltyStep: newStep };
}

export function reducePenaltyStep(player, steps = 1) {
  return { ...player, penaltyStep: Math.max(0, player.penaltyStep - steps) };
}

export function getCurrentPenalty(player) {
  const ladder = getPenaltyLadder(player.footwearLevel);
  return ladder[player.penaltyStep - 1] || null;
}

export function isFullyRestrained(player) {
  const ladder = getPenaltyLadder(player.footwearLevel);
  return player.penaltyStep >= ladder.length;
}

export function getPenaltyProgress(player) {
  const ladder = getPenaltyLadder(player.footwearLevel);
  return { current: player.penaltyStep, max: ladder.length, ladder };
}

export function calculateMostWanted(players) {
  if (!players || players.length === 0) return null;
  return [...players].sort((a, b) => {
    if (b.penaltyStep !== a.penaltyStep) return b.penaltyStep - a.penaltyStep;
    return (b.bounty || 0) - (a.bounty || 0);
  })[0];
}

export function assignHiddenRoles(players) {
  const roles = [...HIDDEN_ROLES];
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const assigned = shuffled.map((p, i) => ({
    ...p,
    role: roles[i % roles.length].id,
  }));
  return assigned;
}

export function assignChief(players) {
  const eligible = players.filter((p) => !isFullyRestrained(p));
  if (eligible.length === 0) return players;
  const chiefIdx = Math.floor(Math.random() * eligible.length);
  const chief = eligible[chiefIdx];
  return players.map((p) => ({ ...p, isChief: p.id === chief.id }));
}

export function generateSessionCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

export function createPlayer(id, name, footwearLevel, toenailPerk) {
  return {
    id,
    name,
    footwearLevel,
    toenailPerk,
    perkUsed: false,
    penaltyStep: 0,
    tokens: 3,
    karma: 5,
    position: 0,
    bounty: 0,
    role: null,
    isChief: false,
    team: null,
    isLeader: false,
    abilityUsed: false,
    immunity: false,
  };
}

export function createInitialState(mode, intensity, players) {
  let assignedPlayers = players.map((p, i) => ({
    ...createPlayer(`p${i}`, p.name, p.footwearLevel, p.toenailPerk),
    slipperType: p.slipperType || '',
    nailColor: p.nailColor || '',
  }));
  if (isNewMode(mode)) {
    return {
      mode, intensity, stage: 1, players: assignedPlayers, history: [], mobileVotes: {},
      stopActive: false, bombEvent: null, mg: initialMg(mode),
    };
  }
  if (mode === 'classic') {
    assignedPlayers = assignHiddenRoles(assignedPlayers);
  } else if (mode === 'marathon') {
    const shuffled = [...assignedPlayers].sort(() => Math.random() - 0.5);
    const half = Math.ceil(shuffled.length / 2);
    assignedPlayers = shuffled.map((p, i) => ({
      ...p,
      team: i < half ? 'alpha' : 'beta',
    }));
  } else if (mode === 'arrest_heist') {
    assignedPlayers = assignedPlayers.map((p, i) => ({
      ...p,
      team: i % 2 === 0 ? 'A' : 'B',
      isLeader: i < 2,
    }));
    return {
      mode, intensity, stage: 0, players: assignedPlayers,
      round: 1, currentTeam: 'A', currentPhase: 'choose',
      activeCard: null, cardAction: null, history: [],
      teamA: { points: 0 }, teamB: { points: 0 },
      grandHeist: null, stopActive: false, bombEvent: null,
    };
  }
  return {
    mode,
    intensity,
    stage: 0,
    players: assignedPlayers,
    currentPlayerIndex: 0,
    chiefIndex: 0,
    diceValue: null,
    activeCard: null,
    cardAction: null,
    history: [],
    mobileVotes: {},
    stopActive: false,
    stopUntil: null,
    timer: null,
    timerRunning: false,
    timerDuration: 0,
    timerRemaining: 0,
    round: 1,
    // Marathon
    teamAlpha: { loot: 0, stars: 0 },
    teamBeta: { loot: 0, stars: 0 },
    marathonStage: 1,
    currentTeam: 'alpha',
    trialIndex: 0,
    penaltyIndex: 0,
    bombEvent: null,
  };
}

export function addHistory(state, event) {
  const entry = { ...event, timestamp: Date.now(), round: state.round };
  return [entry, ...state.history].slice(0, 50);
}

// Κατηγοριοποιεί το ιστορικό σε BUST / MIDNIGHT PACT / TRADE HOSTAGE / ΑΝΩΝΥΜΗ ΨΗΦΟΣ για το Grand Jury.
export function categorizeGrandJuryLogs(history) {
  const cats = { bust: [], midnight_pact: [], trade_hostage: [], anonymous_vote: [] };
  (history || []).forEach((e) => {
    if (['bomb_exploded', 'bomb_timeout'].includes(e.type)) cats.bust.push(e);
    else if (e.type === 'midnight_pact') cats.midnight_pact.push(e);
    else if (e.type === 'warrant') cats.trade_hostage.push(e);
    else if (e.type === 'trial_verdict') cats.anonymous_vote.push(e);
  });
  return cats;
}

export function nextPlayer(state) {
  const players = state.players;
  let nextIdx = (state.currentPlayerIndex + 1) % players.length;
  return { ...state, currentPlayerIndex: nextIdx, round: state.round + 1, diceValue: null, activeCard: null, cardAction: null };
}

export function moveToStage2(state) {
  return { ...state, stage: 2, timerRunning: false };
}

export function moveToStage3(state) {
  return { ...state, stage: 3, timerRunning: false };
}

export function getWantedLevel(player) {
  return Math.min(5, Math.ceil(player.penaltyStep / 2));
}

export function getTotalLoot(state) {
  if (state.mode === 'marathon') {
    return state.teamAlpha.loot + state.teamBeta.loot;
  }
  return state.players.reduce((sum, p) => sum + (p.bounty || 0), 0);
}

export function triggerBombEvent(state, targetId) {
  return { ...state, bombEvent: { active: true, targetId } };
}

// Apply a Glitch card's mechanical effect. Returns { players, extra }.
export function applyGlitchEffect(state, card) {
  let players = state.players.map((p) => ({ ...p, bounty: p.bounty || 0 }));
  const extra = {};
  switch (card?.id) {
    case 'GLT-01':
      players = players.map((p) => (p.penaltyStep >= 2 && !isFullyRestrained(p) ? applyPenaltyStep(p) : p));
      break;
    case 'GLT-02':
      extra.doublePenaltyNextRound = true;
      break;
    case 'GLT-03':
      players = assignChief(players);
      break;
    case 'GLT-05':
      players = players.map((p) => (p.penaltyStep > 0 ? reducePenaltyStep(p, 1) : p));
      break;
    case 'GLT-06':
      extra.massBlindfold = true;
      break;
    case 'GLT-07':
      players = players.map((p) => (p.penaltyStep === 0 ? applyPenaltyStep(p) : reducePenaltyStep(p, 1)));
      break;
    case 'GLT-08':
      extra.doubleBountyNextRound = true;
      break;
    default:
      break;
  }
  return { players, extra };
}

// Use a hidden role ability (1× per player per game). Returns updated state patch or null.
export function useRoleAbility(state, playerId, payload = {}) {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.abilityUsed) return null;
  let players = state.players.map((p) => ({ ...p }));
  const extra = {};
  switch (player.role) {
    case 'cop': {
      extra.copPrediction = payload.targetId || calculateMostWanted(players)?.id;
      extra.copPredictorId = playerId;
      break;
    }
    case 'hacker': {
      extra.hackerCancel = true;
      break;
    }
    case 'driver': {
      const target = players.find((p) => p.id === payload.targetId);
      if (target) {
        players = players.map((p) => (p.id === target.id ? { ...p, penaltyStep: Math.floor(p.penaltyStep / 2) } : p));
      }
      break;
    }
    default:
      return null;
  }
  players = players.map((p) => (p.id === playerId ? { ...p, abilityUsed: true } : p));
  return { players, extra };
}