// TEMPTATION SLOTS — Shared logic for the slot machine gambling system.
// Works across all game modes using common player fields: penaltyStep, tokens, bounty.

export const SLOT_SYMBOLS = [
  { id: 'moon', icon: '🌙', name: 'Moon' },
  { id: 'star', icon: '⭐', name: 'Star' },
  { id: 'sun', icon: '☀️', name: 'Sun' },
  { id: 'death', icon: '💀', name: 'Death' },
  { id: 'heart', icon: '❤️', name: 'Heart' },
  { id: 'eye', icon: '👁️', name: 'Eye' },
];

// Spin 3 independent reels (uniform distribution).
export function spinReels() {
  return [0, 1, 2].map(() => SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]);
}

// Evaluate a spin. Returns { type, label, tier, symbol? }
// tier: 'jackpot' | 'win' | 'bust'
// type: 'jackpot' | 'curse' | 'oracle' | 'win' | 'bust'
export function evaluateSpin(reels) {
  const [a, b, c] = reels;
  if (a.id === b.id && b.id === c.id) {
    if (a.id === 'death') return { type: 'curse', label: 'CURSE', tier: 'jackpot', symbol: a };
    if (a.id === 'eye') return { type: 'oracle', label: 'ORACLE', tier: 'jackpot', symbol: a };
    return { type: 'jackpot', label: 'JACKPOT', tier: 'jackpot', symbol: a };
  }
  if (a.id === b.id || b.id === c.id || a.id === c.id) {
    const winSym = a.id === b.id ? a : b.id === c.id ? b : a;
    return { type: 'win', label: 'WIN', tier: 'win', symbol: winSym };
  }
  return { type: 'bust', label: 'BUST', tier: 'bust' };
}

// Stake types — what the player risks and what they can win.
// applyStake = pay the bet (always applied at spin start).
// applyJackpot = big reward for 3× same (good symbol).
// applyWin = small reward for 2× same.
// applyCurse = extra punishment for 3× Death (applied INSTEAD of jackpot).
// applyOracle = reward for 3× Eye (applied INSTEAD of jackpot).
// applyBust = nothing (stake already lost) — kept for completeness.
export const STAKE_TYPES = [
  {
    id: 'penalty',
    name: 'Ποινή',
    icon: '⚠️',
    desc: 'Πόνταρε +1 βήμα ποινής',
    canStake: () => true,
    applyStake: (p) => ({ ...p, penaltyStep: p.penaltyStep + 1 }),
    applyJackpot: (p) => ({ ...p, penaltyStep: Math.max(0, p.penaltyStep - 4) }),
    applyWin: (p) => ({ ...p, penaltyStep: Math.max(0, p.penaltyStep - 1) }),
    applyCurse: (p) => ({ ...p, penaltyStep: p.penaltyStep + 2 }),
    applyOracle: (p) => ({ ...p, penaltyStep: Math.max(0, p.penaltyStep - 2) }),
    applyBust: (p) => p,
    jackpotText: '-4 βήματα!',
    winText: '-1 βήμα',
    curseText: '+2 επιπλέον βήματα!',
    oracleText: '-2 βήματα + Oracle Vision',
    bustText: 'Χάνεις το στοίχημα (+1)',
  },
  {
    id: 'tokens',
    name: 'Tokens',
    icon: '🪙',
    desc: 'Πόνταρε 2 tokens',
    canStake: (p) => (p.tokens || 0) >= 2,
    applyStake: (p) => ({ ...p, tokens: (p.tokens || 0) - 2 }),
    applyJackpot: (p) => ({ ...p, tokens: (p.tokens || 0) + 12 }),
    applyWin: (p) => ({ ...p, tokens: (p.tokens || 0) + 3 }),
    applyCurse: (p) => ({ ...p, tokens: Math.max(0, (p.tokens || 0) - 3) }),
    applyOracle: (p) => ({ ...p, tokens: (p.tokens || 0) + 5 }),
    applyBust: (p) => p,
    jackpotText: '+12 tokens!',
    winText: '+3 tokens',
    curseText: '-3 επιπλέον tokens!',
    oracleText: '+5 tokens + Oracle Vision',
    bustText: 'Χάνεις τα 2 tokens',
  },
  {
    id: 'bounty',
    name: 'Bounty',
    icon: '💰',
    desc: 'Πόνταρε 1 bounty',
    canStake: (p) => (p.bounty || 0) >= 1,
    applyStake: (p) => ({ ...p, bounty: Math.max(0, (p.bounty || 0) - 1) }),
    applyJackpot: (p) => ({ ...p, bounty: (p.bounty || 0) + 6 }),
    applyWin: (p) => ({ ...p, bounty: (p.bounty || 0) + 2 }),
    applyCurse: (p) => ({ ...p, bounty: Math.max(0, (p.bounty || 0) - 1) }),
    applyOracle: (p) => ({ ...p, bounty: (p.bounty || 0) + 3 }),
    applyBust: (p) => p,
    jackpotText: '+6 bounty!',
    winText: '+2 bounty',
    curseText: '-1 επιπλέον bounty!',
    oracleText: '+3 bounty + Oracle Vision',
    bustText: 'Χάνεις το bounty',
  },
];

// Apply a slot result to a single player. Returns the updated player.
export function applySlotResult(player, stake, evalResult) {
  let p = { ...player };
  p = stake.applyStake(p);
  switch (evalResult.type) {
    case 'jackpot': p = stake.applyJackpot(p); break;
    case 'win': p = stake.applyWin(p); break;
    case 'curse': p = stake.applyCurse(p); break;
    case 'oracle': p = stake.applyOracle(p); break;
    case 'bust': p = stake.applyBust(p); break;
    default: break;
  }
  return p;
}

// Human-readable result text for a given stake + result.
export function getResultText(stake, evalResult) {
  switch (evalResult.type) {
    case 'jackpot': return stake.jackpotText;
    case 'win': return stake.winText;
    case 'curse': return stake.curseText;
    case 'oracle': return stake.oracleText;
    case 'bust': return stake.bustText;
    default: return '';
  }
}