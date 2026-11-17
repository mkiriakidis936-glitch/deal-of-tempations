// Τα εγκεκριμένα ψηφιακά game modes.
export const NEW_MODES = [
  {
    id: 'lockdown',
    name: 'PAJAMA LOCKDOWN 18+',
    icon: '🚨',
    desc: 'Ψηφιακό Escape Room 5 ωρών με Team Cipher, Sensory Puzzles, Sabotage Override, mini-games, Exit Code και VIP Vault.',
    min: 3,
    max: 8,
    acts: ['lockdown'],
    actDurations: { lockdown: 60 },
    minutes: 300,
  },
  {
    id: 'beach_bar',
    name: 'BEACH BAR HOME LOCKDOWN',
    icon: '🍹',
    desc: 'Home beach-bar party 5 ωρών με DJ, flip-flop dress code, Dance & Freeze, Mocktail & Truth Sync, τροχό και Flip-Flop Heist. Τα ποτά είναι πάντα προαιρετικά και αντικαθίστανται με μη αλκοολούχα.',
    min: 3,
    max: 8,
    acts: ['beach'],
    actDurations: { beach: 150 },
    minutes: 300,
  },

];

export const isNewMode = (id) => NEW_MODES.some((m) => m.id === id);
export const modeMeta = (id) => NEW_MODES.find((m) => m.id === id);

export const MODE_THEMES = {
  lockdown: { bg: '#0A0A0A', accent: '#FF003C', accent2: '#FF6B8A' },
  beach_bar: { bg: '#0D0D11', accent: '#00F2FE', accent2: '#FF3366' },
};

export const ACT_META = {
  board: { title: 'Act 1 · The Glam & Chaos Board', minutes: 60 },
  midnight: { title: 'Act 2 · Midnight ASMR & Secret Vault', minutes: 45 },
  lockdown: { title: 'Pajama Lockdown (18+)', minutes: 60 },
  morning: { title: 'Act 4 · Extended Morning Escape & VIP Vault', minutes: 45 },
  beach: { title: 'Beach Bar Home Lockdown', minutes: 150 },
};
