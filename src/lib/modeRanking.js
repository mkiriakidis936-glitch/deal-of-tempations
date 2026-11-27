import { finalScore } from './campaignEngine.js';

// Κοινή κατάταξη για τα ψηφιακά modes (Tablet αποτελέσματα, TV τελετή, κινητό dashboard).
// Η Ταινία (mg.cg) μετράει με τον τελικό αλγόριθμο του PDF.
export const pointsOf = (mg = {}, pid) => (mg.cg ? finalScore(mg.cg, pid) : ((mg.scores || {})[pid] || 0)
  + Math.round((((mg.lounge?.stats || {})[pid]?.loot) || 0) / 1000)
  + ((mg.tokens || {})[pid] || 0));

export const rankPlayers = (players = [], mg = {}) => [...players].sort((a, b) => pointsOf(mg, b.id) - pointsOf(mg, a.id));

// Ο τίτλος της νικήτριας: Lounge Queen αν έχει οριστεί, αλλιώς η πρώτη της κατάταξης.
export function championOf(players = [], mg = {}) {
  const find = (id) => players.find((p) => p.id === id);
  if (mg.movieWinner && find(mg.movieWinner)) return { player: find(mg.movieWinner), title: 'Η Μεγάλη Νικήτρια — Deal of Temptation' };
  if (mg.villaQueen && find(mg.villaQueen)) return { player: find(mg.villaQueen), title: 'Queen of the Villa' };
  if (mg.loungeQueen && find(mg.loungeQueen)) return { player: find(mg.loungeQueen), title: 'Ultimate Pajama Police Queen' };
  const top = rankPlayers(players, mg)[0];
  return top ? { player: top, title: mg.lockdownResult === 'won' ? 'Απόδραση — VIP Vault' : 'Νικήτρια' } : null;
}

// Τελική κατάταξη: η νικήτρια του τίτλου (Queen κ.λπ.) πάντα πρώτη, μετά οι υπόλοιπες με βάση τους πόντους.
export function finalStandings(players = [], mg = {}) {
  const champion = championOf(players, mg)?.player;
  const ranked = rankPlayers(players, mg);
  return champion ? [champion, ...ranked.filter((p) => p.id !== champion.id)] : ranked;
}

// Ζωντανή κατάταξη για την TV (ανάμεσα στις φάσεις), για κάθε είδος mode.
export function liveStandings(state = {}) {
  const players = state.players || [];
  const mg = state.mg || {};
  if (state.mode === 'arrest_heist') {
    return [['A', '💖 Team Alpha'], ['B', '💎 Team Beta']]
      .map(([id, name]) => ({ id, name, value: state[id === 'A' ? 'teamA' : 'teamB']?.points || 0, unit: 'πόντοι' }))
      .sort((a, b) => b.value - a.value);
  }
  if (state.mode === 'classic') {
    return [...players].sort((a, b) => (b.bounty || 0) - (a.bounty || 0)).slice(0, 5)
      .map((p) => ({ id: p.id, name: p.name, value: (p.bounty || 0).toLocaleString('el-GR'), unit: '€' }));
  }
  return rankPlayers(players, mg).slice(0, 5).map((p) => ({ id: p.id, name: p.name, value: pointsOf(mg, p.id), unit: 'πόντοι' }));
}
