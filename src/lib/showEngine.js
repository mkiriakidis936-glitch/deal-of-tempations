// «Μηχανή του show»: βραβεία, τίτλοι, highlights, δελτίο καιρού, ρεκόρ.
// Καθαρές συναρτήσεις πάνω στα στατιστικά της βραδιάς (lg.tally / lg.stats), χωρίς React/δίκτυο.

const money = (n) => `${Math.round(Number(n) || 0).toLocaleString('el-GR')}€`;
const t = (lg, pid) => lg.tally?.[pid] || {};
const s = (lg, pid) => lg.stats?.[pid] || {};
const nameOf = (players, pid) => players.find((p) => p.id === pid)?.name || '—';

// Η παίκτρια με τη μεγαλύτερη τιμή (μόνο αν > min). Ισοπαλία: σπάει με τη λεία.
function topBy(lg, players, value, min = 0) {
  let best = null;
  for (const p of players) {
    const v = value(p.id);
    if (!(v > min)) continue;
    if (!best || v > best.value || (v === best.value && (s(lg, p.id).loot || 0) > (s(lg, best.pid).loot || 0))) best = { pid: p.id, value: v };
  }
  return best;
}

export const AWARDS = [
  { id: 'loot', icon: '💰', title: 'Η Βασίλισσα της Λείας', line: (v) => `Τελείωσε με ${money(v)}`, pick: (lg, ps) => topBy(lg, ps, (id) => s(lg, id).loot || 0, -1) },
  { id: 'wanted', icon: '🚔', title: 'Η πιο Καταζητούμενη', line: (v) => `${v} συλλήψεις μέσα σε μία βραδιά`, pick: (lg, ps) => topBy(lg, ps, (id) => t(lg, id).arrests || 0) },
  { id: 'liar', icon: '🤥', title: 'Η Μεγαλύτερη Ψεύτρα', line: (v) => `${v} «ψέματα» στην ανάκριση`, pick: (lg, ps) => topBy(lg, ps, (id) => t(lg, id).lies || 0) },
  { id: 'honest', icon: '😇', title: 'Η πιο Ειλικρινής', line: (v) => `${v} «αλήθειες» στην ανάκριση`, pick: (lg, ps) => topBy(lg, ps, (id) => t(lg, id).truths || 0) },
  { id: 'daring', icon: '🔥', title: 'Η πιο Τολμηρή', line: (v) => `Ολοκλήρωσε ${v} κάρτες`, pick: (lg, ps) => topBy(lg, ps, (id) => t(lg, id).cardsDone || 0) },
  { id: 'lucky', icon: '🎲', title: 'Το Χρυσό Χέρι', line: (v) => `${v} εξάρια στο ζάρι`, pick: (lg, ps) => topBy(lg, ps, (id) => t(lg, id).sixes || 0) },
  { id: 'unlucky', icon: '🌧️', title: 'Η πιο Άτυχη στο Ζάρι', line: (v) => `${v} φορές έφερε άσσο`, pick: (lg, ps) => topBy(lg, ps, (id) => t(lg, id).ones || 0) },
  { id: 'fall', icon: '📉', title: 'Η Μεγαλύτερη Πτώση', line: (v) => `Έχασε συνολικά ${money(v)}`, pick: (lg, ps) => topBy(lg, ps, (id) => t(lg, id).lootOut || 0) },
  { id: 'barefoot', icon: '🦶', title: 'Η Ξυπόλυτη της Βραδιάς', line: (v) => `Έχασε ${v} σαγιονάρες/κάλτσες`, pick: (lg, ps) => topBy(lg, ps, (id) => t(lg, id).footLost || 0) },
  { id: 'diplomat', icon: '🕶️', title: 'Η Διπλωμάτισσα', line: (v) => `Πλήρωσε ${v} φορές δωροδοκία`, pick: (lg, ps) => topBy(lg, ps, (id) => t(lg, id).bribes || 0) },
  { id: 'traitor', icon: '🗡️', title: 'Η Προδότρια', line: (v) => `Έκλεψε ${money(v)} στα κρυφά`, pick: (lg, ps) => topBy(lg, ps, (id) => (lg.betrayals || []).filter((b) => b.from === id).reduce((sum, b) => sum + (b.amount || 0), 0)) },
  { id: 'clean', icon: '🕊️', title: 'Η Αθώα', line: () => 'Δεν συνελήφθη ούτε μία φορά', pick: (lg, ps) => {
    const free = ps.filter((p) => !(t(lg, p.id).arrests > 0));
    if (!free.length || free.length === ps.length) return null;
    return topBy(lg, free, (id) => (s(lg, id).loot || 0) + 1, 0);
  } },
];

// Όλα τα βραβεία που απονέμονται (ένα ανά κατηγορία, όσα έχουν νικήτρια).
export function computeAwards(lg, players) {
  return AWARDS.map((award) => {
    const win = award.pick(lg, players);
    return win ? { id: award.id, icon: award.icon, title: award.title, pid: win.pid, name: nameOf(players, win.pid), line: award.line(win.value) } : null;
  }).filter(Boolean);
}

// Τίτλος κάθε παίκτριας για την αναμνηστική κάρτα.
export function playerTitle(awards, pid) {
  return awards.find((a) => a.pid === pid)?.title || 'Η Μυστηριώδης Φυγάς';
}

// Οι μεγάλες στιγμές της βραδιάς (για την ανασκόπηση στην TV).
export function highlights(lg, players) {
  const all = players.map((p) => ({ p, t: t(lg, p.id), s: s(lg, p.id) }));
  const sum = (key) => all.reduce((n, x) => n + (x.t[key] || 0), 0);
  const out = [];
  const peak = topBy(lg, players, (id) => t(lg, id).lootPeak || 0);
  if (peak) out.push({ icon: '💎', text: `Το μεγαλύτερο ποσό της βραδιάς: ${money(peak.value)} από ${nameOf(players, peak.pid)}` });
  if (sum('arrests')) out.push({ icon: '🚔', text: `${sum('arrests')} συλλήψεις συνολικά` });
  if (sum('lies')) out.push({ icon: '🤥', text: `${sum('lies')} ψέματα και ${sum('truths')} αλήθειες στις ανακρίσεις` });
  if (sum('rolls')) out.push({ icon: '🎲', text: `${sum('rolls')} ζαριές · ${sum('sixes')} εξάρια · ${sum('ones')} άσσοι` });
  const fall = topBy(lg, players, (id) => t(lg, id).lootOut || 0);
  if (fall) out.push({ icon: '📉', text: `${nameOf(players, fall.pid)} έχασε ${money(fall.value)} μέσα στη βραδιά` });
  if (sum('goldenLoot')) out.push({ icon: '✨', text: `Το Χρυσό Λεπτό μοίρασε επιπλέον ${money(sum('goldenLoot'))}` });
  if ((lg.betrayals || []).length) out.push({ icon: '🗡️', text: `${lg.betrayals.length} κρυφές προδοσίες` });
  if ((lg.news || []).length) out.push({ icon: '📰', text: `${lg.news.length} breaking news από τις παίκτριες` });
  if (lg.finale?.winner) out.push({ icon: '🔓', text: `${nameOf(players, lg.finale.winner)} έλυσε πρώτη τον γρίφο του φινάλε` });
  return out;
}

// Δελτίο «καιρού» της βραδιάς.
export function weatherReport(lg, players) {
  const wanted = topBy(lg, players, (id) => (s(lg, id).stars || 0) * 10 + (t(lg, id).arrests || 0), 0);
  const rich = topBy(lg, players, (id) => s(lg, id).loot || 0, -1);
  const clean = players.filter((p) => !(t(lg, p.id).arrests > 0));
  const bare = players.filter((p) => s(lg, p.id).footwear === 0).length;
  const totalStars = players.reduce((n, p) => n + (s(lg, p.id).stars || 1), 0);
  const heat = players.length ? totalStars / players.length : 1;
  const sky = heat >= 4 ? { icon: '🌪️', label: 'Καταιγίδα συλλήψεων' } : heat >= 3 ? { icon: '⛈️', label: 'Ένταση στον ορίζοντα' } : heat >= 2 ? { icon: '🌤️', label: 'Συννεφιά με υποψίες' } : { icon: '☀️', label: 'Ήρεμα νερά… προς το παρόν' };
  return {
    sky,
    temperature: Math.round(18 + heat * 4 + bare * 2),
    lines: [
      wanted && { icon: '🚨', text: `Πιο καταζητούμενη: ${nameOf(players, wanted.pid)}` },
      rich && { icon: '💰', text: `Πιο πλούσια: ${nameOf(players, rich.pid)} (${money(rich.value)})` },
      clean.length && clean.length < players.length ? { icon: '🕊️', text: `Ακόμα αθώες: ${clean.map((p) => p.name).join(', ')}` } : null,
      bare ? { icon: '🦶', text: `${bare} ξυπόλυτες — προσοχή στις παγίδες γέλιου` } : null,
    ].filter(Boolean),
  };
}

// ---------- Ρεκόρ όλων των εποχών ----------
export const RECORD_DEFS = [
  { id: 'maxLoot', label: 'Περισσότερη λεία σε μία βραδιά', format: money, value: (lg, id) => s(lg, id).loot || 0 },
  { id: 'peakLoot', label: 'Μεγαλύτερο ποσό στη διάρκεια', format: money, value: (lg, id) => t(lg, id).lootPeak || 0 },
  { id: 'arrests', label: 'Περισσότερες συλλήψεις', format: (v) => `${v}`, value: (lg, id) => t(lg, id).arrests || 0 },
  { id: 'lies', label: 'Περισσότερα ψέματα', format: (v) => `${v}`, value: (lg, id) => t(lg, id).lies || 0 },
  { id: 'cards', label: 'Περισσότερες κάρτες', format: (v) => `${v}`, value: (lg, id) => t(lg, id).cardsDone || 0 },
];

// Συγκρίνει τη βραδιά με τα αποθηκευμένα ρεκόρ. Επιστρέφει όσα έσπασαν και τα νέα ρεκόρ για αποθήκευση.
export function checkRecords(records = {}, lg, players, { date = new Date().toISOString().slice(0, 10) } = {}) {
  const next = { ...records };
  const broken = [];
  for (const def of RECORD_DEFS) {
    const best = topBy(lg, players, (id) => def.value(lg, id));
    if (!best) continue;
    const old = records[def.id];
    if (!old || best.value > old.value) {
      next[def.id] = { value: best.value, name: nameOf(players, best.pid), date };
      broken.push({ id: def.id, label: def.label, name: nameOf(players, best.pid), value: def.format(best.value), previous: old ? `${def.format(old.value)} (${old.name})` : null });
    }
  }
  return { records: next, broken };
}

// ---------- Περιεχόμενο εκπομπής ----------
export const DOSSIER_QUESTIONS = [
  'Το πιο τρελό μέρος που έχεις κοιμηθεί;',
  'Ένα μυστικό ταλέντο που δεν ξέρει κανείς εδώ;',
  'Η πιο αμήχανη στιγμή σου σε ραντεβού;',
  'Τι θα έκλεβες αν ήξερες ότι δεν θα σε πιάσουν ποτέ;',
  'Ποιο τραγούδι τραγουδάς κρυφά στο μπάνιο;',
  'Το χειρότερο δώρο που έχεις κάνει (ή πάρει);',
];

// Υπενθυμίσεις σκηνοθέτη (λεπτά από την έναρξη) — εμφανίζονται στο Tablet.
export const DIRECTOR_CUES = [
  { id: 'dossier', at: 10, text: 'Ώρα για τον πρώτο «Φάκελο υπόπτου» — ποια το είπε;' },
  { id: 'golden1', at: 20, text: 'Ρίξε ένα Χρυσό Λεπτό για να ανέβει η ένταση.' },
  { id: 'weather1', at: 30, text: 'Το πρώτο Δελτίο Καιρού βγαίνει αυτόματα στην TV.' },
  { id: 'drama1', at: 45, text: 'Μια Δραματική Στιγμή: ανακοίνωσε κάτι στην TV.' },
  { id: 'golden2', at: 60, text: 'Δεύτερο Χρυσό Λεπτό πριν το φινάλε.' },
  { id: 'finale', at: 90, text: 'Ετοίμασε το φινάλε: Barefoot Escape.' },
  { id: 'ceremony', at: 100, text: 'Μετά το φινάλε: Τελετή απονομής 🏆' },
];

export const BETRAY_SHARE = 0.3;
export const BET_REWARD = 2000;
export const DOSSIER_REWARD = 1000;
