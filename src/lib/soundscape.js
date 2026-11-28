// 10.5.2 · Μουσικό χαλί της Ταινίας: παλέτες ανά ήπειρο και «πόσο σφιχτό» είναι τώρα. Καθαρές συναρτήσεις.

const n = (semi, base = 110) => base * Math.pow(2, semi / 12);
export const SOUNDSCAPES = {
  // root (Hz), συγχορδία σε ημιτόνια, κυματομορφή, φίλτρο, παλμός (bpm), νότες μπάσου του παλμού
  classic: { root: n(5), chord: [0, 4, 7, 11, 14], wave: 'triangle', cutoff: 1400, bpm: 72, bass: [0, 0, 7, 5], label: 'Χρυσό καζίνο' },
  arrest_heist: { root: n(2), chord: [0, 3, 7, 10], wave: 'sawtooth', cutoff: 900, bpm: 104, bass: [0, 0, 3, 0, 7, 0, 10, 7], label: 'Ληστεία' },
  lockdown: { root: n(-2), chord: [0, 1, 7, 12, 13], wave: 'sawtooth', cutoff: 600, bpm: 58, bass: [0, 0], label: 'Κλειστή ζώνη' },
  marathon_4h: { root: n(0), chord: [0, 3, 7, 10, 15], wave: 'square', cutoff: 700, bpm: 92, bass: [0, 3, 5, 7], label: 'Νυχτερινή καταδίωξη' },
  villa_takeover: { root: n(-3), chord: [0, 3, 7, 10, 14, 17], wave: 'triangle', cutoff: 1100, bpm: 76, bass: [0, 7, 3, 10], label: 'Βίλα' },
  finale: { root: n(5), chord: [0, 4, 7, 12, 16, 19], wave: 'triangle', cutoff: 2200, bpm: 84, bass: [0, 5, 7, 0], label: 'Φινάλε' },
};

// Πόσο «σφιχτό» είναι τώρα: 0 ηρεμία · 1 ένταση (τροχός/ζάρι/κουτί/δοκιμασία).
export function soundIntensity(cg, now = Date.now()) {
  if (!cg) return 0;
  if (cg.wheel && !cg.wheel.done && now - cg.wheel.at < 4500) return 1;
  if (cg.board?.roll && now - cg.board.roll.at < 2600) return 0.8;
  const d = cg.dond;
  if (cg.game === 'dond' && d && (d.status === 'final' || d.status === 'offer' || (d.revealedAt && now - d.revealedAt < 3000))) return 0.8;
  if (cg.trial && !cg.trial.done) return 0.55;
  if (cg.mandatory?.pending) return 0.6;
  return 0.15;
}

export function soundscapeKey(cg, continent) {
  if (!cg) return null;
  if (cg.status === 'finale') return 'finale';
  return SOUNDSCAPES[continent] ? continent : 'classic';
}
