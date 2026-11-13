// Τα 4 νέα ψηφιακά game modes (από το PDF "Μεγάλο Update").
export const NEW_MODES = [
  {
    id: 'pedi_extended',
    name: 'PEDI-GLAM EXTENDED',
    icon: '💅',
    desc: 'Διακλαδούμενο ταμπλό (Glam / Chaos Route), Glam Tokens, Secret Missions στο κινητό, Midnight ASMR & Tickle Vault, Morning Escape.',
    min: 2,
    max: 8,
    acts: ['board', 'midnight', 'morning'],
    minutes: 150,
  },
  {
    id: 'lockdown',
    name: 'PAJAMA LOCKDOWN 18+',
    icon: '🚨',
    desc: '100% ψηφιακό Escape Room 60′: Hostage Sacrifice, Sensory Cipher, Sabotage Override, 10 mini-games, Exit Code & VIP Vault.',
    min: 3,
    max: 8,
    acts: ['lockdown'],
    minutes: 75,
  },
  {
    id: 'beach_bar',
    name: 'BEACH BAR LOCKDOWN',
    icon: '🍹',
    desc: 'Σαγιονάρες, Dance & Freeze, Τροχός Ποινών, Shot & Truth, Flip-Flop Heist και The Last Queen Standing.',
    min: 3,
    max: 8,
    acts: ['beach'],
    minutes: 210,
  },
  {
    id: 'marathon_4h',
    name: '4H PAJAMA MARATHON',
    icon: '🌙',
    desc: 'Ο μαραθώνιος των 4 ωρών: Act 1 Board → Act 2 Midnight Vault → Act 3 Lockdown → Act 4 Morning Escape & VIP Vault.',
    min: 3,
    max: 8,
    acts: ['board', 'midnight', 'lockdown', 'morning'],
    minutes: 210,
  },
];

export const isNewMode = (id) => NEW_MODES.some((m) => m.id === id);
export const modeMeta = (id) => NEW_MODES.find((m) => m.id === id);

// Χρώματα από τους UI οδηγούς του PDF.
export const MODE_THEMES = {
  pedi_extended: { bg: '#0A0A0A', accent: '#FF2A85', accent2: '#FFD700' },
  lockdown: { bg: '#0A0A0A', accent: '#FF003C', accent2: '#FF6B8A' },
  beach_bar: { bg: '#0D0D11', accent: '#00F2FE', accent2: '#FF3366' },
  marathon_4h: { bg: '#0A0A0A', accent: '#FFD700', accent2: '#FF2A85' },
};

export const ACT_META = {
  board: { title: 'Act 1 · The Glam & Chaos Board', minutes: 45 },
  midnight: { title: 'Act 2 · Midnight ASMR & Tickle Vault', minutes: 45 },
  lockdown: { title: 'Act 3 · Pajama Lockdown (18+)', minutes: 75 },
  morning: { title: 'Act 4 · Extended Morning Escape & VIP Vault', minutes: 45 },
  beach: { title: 'Beach Bar Lockdown', minutes: 210 },
};
