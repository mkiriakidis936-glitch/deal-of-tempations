// Night Director (v2.0): πρόγραμμα βραδιάς, κρυφοί στόχοι, ανατροπές.
// Ζει ως state.night μέσα στο υπάρχον state της συνεδρίας, άρα σώζεται και συγχρονίζεται μόνο του.
import { isNewMode } from '@/data/modes/modeRegistry';

export const DURATIONS = [120, 180, 240];
export const INTENSITIES = [
  { id: 'soft', label: 'Ήπια', twists: 1 },
  { id: 'medium', label: 'Μέτρια', twists: 2 },
  { id: 'wild', label: 'Άγρια', twists: 3 },
];

const ROUNDS = [
  { id: 'warmup', title: 'Ζέσταμα στο Ταμπλό', desc: 'Γνωριμία με τους κανόνες, ελαφριές ποινές', share: 0.17 },
  { id: 'market', title: 'Μαύρη Αγορά', desc: 'Συμφωνίες, προδοσίες, κρυφοί στόχοι ενεργοί', share: 0.2 },
  { id: 'climax', title: 'Κορύφωση', desc: 'Mini-games και αυξανόμενη δυσκολία', share: 0.38 },
  { id: 'finale', title: 'Φινάλε & Μεγάλη Αποκάλυψη', desc: 'Τελικός γύρος και αποκάλυψη των κρυφών στόχων', share: 0.25 },
];

export const AGENDAS = [
  'Να μην αγγίξει καμία το Vault μέχρι το Φινάλε.',
  'Να κάνεις 3 παίκτριες να γελάσουν την ώρα μιας ποινής.',
  'Να κερδίσεις δύο συμφωνίες στη Μαύρη Αγορά.',
  'Να προδώσεις τη συμμαχία σου χωρίς να σε καταλάβουν.',
  'Να μείνεις η τελευταία ελεύθερη σε έναν γύρο.',
  'Να πείσεις μια παίκτρια να σου παραχωρήσει το πλεονέκτημά της.',
  'Να προτείνεις εσύ τον νέο κανόνα στην Ανατροπή και να περάσει.',
  'Να μην πεις «όχι» σε καμία πρόκληση για έναν ολόκληρο γύρο.',
  'Να κάνεις μια παίκτρια να σου εμπιστευτεί ένα μυστικό.',
  'Να είσαι η πρώτη που θα ψηφίσει σε κάθε ψηφοφορία ενός γύρου.',
];

export const TWISTS = [
  'Η βαθμολογία αντιστρέφεται για τον επόμενο γύρο.',
  'Όλες παίζουν με τη σειρά της διπλανής τους.',
  'Διπλοί πόντοι για όποια ρισκάρει πρώτη.',
  'Οι συμμαχίες διαλύονται: κάθε παίκτρια ξεκινά μόνη της.',
  'Μία παίκτρια, με κλήρωση, γίνεται ο Αστυνόμος για 10 λεπτά.',
  'Σιωπή για 5 λεπτά: όποια μιλά χάνει έναν πόντο.',
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const round5 = (n) => Math.max(5, Math.round(n / 5) * 5);

export function buildProgram(durationMin = 180) {
  let start = 0;
  return ROUNDS.map((r, i) => {
    const minutes = i === ROUNDS.length - 1 ? Math.max(5, durationMin - start) : round5(durationMin * r.share);
    const out = { id: r.id, title: r.title, desc: r.desc, start, end: start + minutes, minutes };
    start += minutes;
    return out;
  });
}

export function assignAgendas(players) {
  const pool = shuffle(AGENDAS);
  const out = {};
  (players || []).forEach((p, i) => {
    out[p.id] = { text: pool[i % pool.length], done: null };
  });
  return out;
}

export function createNight({ durationMin, intensity, players }) {
  return {
    v: 1,
    startedAt: Date.now(),
    settings: { durationMin, intensity },
    program: buildProgram(durationMin),
    roundIdx: 0,
    agendas: assignAgendas(players),
    twist: null,
    twistsUsed: [],
    reveal: false,
  };
}

export function pickTwist(night) {
  const used = night?.twistsUsed || [];
  const left = TWISTS.map((t, i) => i).filter((i) => !used.includes(i));
  const idx = (left.length ? shuffle(left) : shuffle(TWISTS.map((t, i) => i)))[0];
  return { idx, text: TWISTS[idx] };
}

export function scoreOf(state, p) {
  if (state.mode === 'pajama') return state.pajama?.scores?.[p.id] || 0;
  if (isNewMode(state.mode)) return (state.mg?.scores?.[p.id] || 0) + (state.mg?.tokens?.[p.id] || 0);
  return p.bounty || 0;
}

export function agendaMessages(night, existing) {
  const messages = { ...(existing || {}) };
  Object.entries(night.agendas).forEach(([pid, a]) => {
    messages[pid] = [
      ...(messages[pid] || []),
      {
        id: `night_${pid}_${Date.now()}`,
        text: `🎭 ΚΡΥΦΟΣ ΣΤΟΧΟΣ (μην τον πεις σε κανέναν): ${a.text} Ισχύει πάντα το ΣΤΟΠ.`,
        timestamp: Date.now(),
        from: 'Σκηνοθέτης',
        read: false,
      },
    ];
  });
  return messages;
}
