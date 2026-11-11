export const SQUARE_META = {
  nails: { color: 'pink', icon: '💅', label: 'Νύχια & Pedi-Glam' },
  slippers: { color: 'purple', icon: '🩴', label: 'Παντόφλες & Ήχοι' },
  tickle: { color: 'neon', icon: '✨', label: 'Tickle Traps & Δέσιμα' },
  wildcard: { color: 'yellow', icon: '⚡', label: 'Wildcards & Τροχός' },
  morning_confessions: { color: 'amber', icon: '☕', label: 'Πρωινές Εξομολογήσεις' },
  morning_slippers: { color: 'purple', icon: '🩴', label: 'Πρωινές Δοκιμασίες' },
  morning_tickle: { color: 'neon', icon: '✨', label: 'Πρωινό Γαργαλητό' },
  finish: { color: 'gold', icon: '🏁', label: 'ΤΕΡΜΑΤΙΣΜΟΣ — 44' },
};

const NIGHT_TYPES = ['nails', 'slippers', 'tickle', 'wildcard'];
const MORNING_TYPES = ['morning_confessions', 'morning_slippers', 'morning_tickle'];

export const PAJAMA_NIGHT_LENGTH = 22;
export const PAJAMA_MORNING_LENGTH = 22;

const FINISH_INDEX = PAJAMA_NIGHT_LENGTH + PAJAMA_MORNING_LENGTH - 1;

export const PAJAMA_BOARD = [
  ...Array.from({ length: PAJAMA_NIGHT_LENGTH }, (_, i) => ({
    index: i,
    zone: 'night',
    type: NIGHT_TYPES[i % NIGHT_TYPES.length],
  })),
  ...Array.from({ length: PAJAMA_MORNING_LENGTH }, (_, i) => ({
    index: i + PAJAMA_NIGHT_LENGTH,
    zone: 'morning',
    type: i + PAJAMA_NIGHT_LENGTH === FINISH_INDEX ? 'finish' : MORNING_TYPES[i % MORNING_TYPES.length],
  })),
];