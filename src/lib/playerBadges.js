// 12.0.0 · Παράσημα της βραδιάς (Ταινία): τίτλοι από τα στατιστικά και το ημερολόγιο. Μόνο για διασκέδαση.
// Καθαρή συνάρτηση. Κάθε παράσημο πάει σε όποια έχει το μεγαλύτερο (>0) νούμερο· στις ισοπαλίες, σε όλες.

export const BADGES = [
  { id: 'queen', icon: '👑', title: 'Η Βασίλισσα', text: 'Πρώτη στην κατάταξη' },
  { id: 'loot', icon: '💰', title: 'Βασίλισσα της Λείας', text: 'Η περισσότερη λεία' },
  { id: 'tokens', icon: '🪙', title: 'Η Τραπεζίτισσα', text: 'Τα περισσότερα tokens' },
  { id: 'wanted', icon: '🎯', title: 'Η Πιο Καταζητούμενη', text: 'Τα περισσότερα αστέρια Wanted' },
  { id: 'brave', icon: '🛡️', title: 'Η Αδάμαστη', text: 'Οι περισσότερες επιτυχίες σε δοκιμασίες' },
  { id: 'lucky', icon: '🎲', title: 'Τυχερό Ζάρι', text: 'Τα περισσότερα εξάρια' },
  { id: 'risk', icon: '✋', title: 'Η Ρισκαδόρα', text: 'Τα περισσότερα NO DEAL' },
  { id: 'deal', icon: '🤝', title: 'Η Διαπραγματεύτρια', text: 'Είπε DEAL την κατάλληλη στιγμή' },
  { id: 'conqueror', icon: '🗺️', title: 'Η Κατακτήτρια', text: 'Κέρδισε τις περισσότερες ηπείρους' },
];

const countLog = (cg, players, re) => {
  const out = {};
  for (const l of cg.log || []) {
    if (!re.test(l.text)) continue;
    // Το όνομα που εμφανίζεται πρώτο στη γραμμή
    let best = null; let pos = Infinity;
    for (const p of players) { const i = p.name ? l.text.indexOf(p.name) : -1; if (i >= 0 && i < pos) { pos = i; best = p.id; } }
    if (best) out[best] = (out[best] || 0) + 1;
  }
  return out;
};

export function playerBadges(cg = {}, players = [], { scoreOf = (id) => cg.players?.[id]?.points || 0 } = {}) {
  const ids = players.map((p) => p.id);
  const stat = (k) => Object.fromEntries(ids.map((id) => [id, Number(cg.players?.[id]?.[k]) || 0]));
  const conquests = {};
  Object.values(cg.conquered || {}).forEach((c) => { if (c?.winner) conquests[c.winner] = (conquests[c.winner] || 0) + 1; });
  const values = {
    queen: Object.fromEntries(ids.map((id) => [id, scoreOf(id)])),
    loot: stat('loot'),
    tokens: stat('tokens'),
    wanted: stat('wanted'),
    brave: countLog(cg, players, /✅/),
    lucky: countLog(cg, players, /έφερε 6\b/),
    risk: countLog(cg, players, /NO DEAL/),
    deal: countLog(cg, players, /🤝.*DEAL/),
    conqueror: conquests,
  };
  const byPlayer = Object.fromEntries(ids.map((id) => [id, []]));
  for (const b of BADGES) {
    const v = values[b.id] || {};
    const max = Math.max(0, ...ids.map((id) => v[id] || 0));
    if (max <= 0) continue;
    const winners = ids.filter((id) => (v[id] || 0) === max);
    if (winners.length > Math.max(2, Math.ceil(ids.length / 2))) continue; // όταν τα έχουν σχεδόν όλες, δεν είναι παράσημο
    winners.forEach((id) => byPlayer[id].push({ ...b, value: max }));
  }
  return byPlayer;
}
