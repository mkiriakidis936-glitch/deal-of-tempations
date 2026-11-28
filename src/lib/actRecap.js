// 12.0.0 · «Previously On…»: σύνοψη της πράξης που μόλις έκλεισε, από το ημερολόγιο του παιχνιδιού.
// Καθαρή συνάρτηση: διαλέγει έως 4 δυνατές στιγμές (στέμμα, Τροχός, Deal, συλλήψεις, ζάρια με τύχη).

const WEIGHT = [
  [/👑/, 6], [/🤝|✋|💼/, 5], [/🎡|Τροχ/, 5], [/⛓️|🚔|Σύλληψ|ένταλμα|🚨/i, 4], [/✅|Επιτυχ/, 3], [/❌|Ποινή/, 3],
  [/🎲.*έφερε 6/, 3], [/🪙|token/i, 2], [/💅/, 1], [/🎲/, 1],
];
const score = (text) => WEIGHT.reduce((s, [re, w]) => (re.test(text) ? Math.max(s, w) : s), 0);
const clean = (text) => text.replace(/\s+/g, ' ').trim();

export function actRecap(cg = {}) {
  const conq = cg.conquered || {};
  const done = Object.keys(conq).map(Number).sort((a, b) => a - b);
  if (!done.length) return null;
  const idx = done[done.length - 1];
  const end = conq[idx]?.at || Date.now();
  const start = idx > 0 ? conq[done[done.length - 2]]?.at || 0 : 0;
  const lines = (cg.log || []).filter((l) => l.t > start && l.t <= end + 50 && !/Αναίρεση|Μετάβαση|ΕΝΑΡΞΗ|πιλότος|Πρόβα/i.test(l.text));
  const moments = lines
    .map((l) => ({ ...l, w: score(l.text) }))
    .filter((l) => l.w > 0)
    .sort((a, b) => b.w - a.w || b.t - a.t)
    .slice(0, 4)
    .sort((a, b) => a.t - b.t)
    .map((l) => clean(l.text));
  return { act: idx, continent: conq[idx]?.continent, winner: conq[idx]?.winner || null, moments, count: lines.length };
}
