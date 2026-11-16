// Τα πέντε εγκεκριμένα ψηφιακά game modes.
export const NEW_MODES = [
  {
    id: 'pedi_glam',
    name: 'PAJAMA PEDI-GLAM',
    icon: '💅',
    desc: '90 λεπτά Sensory & Pamper Edition με ASMR, περιποίηση, μάσκες, πινέλα, κρέμες, Glam Tokens και εξομολογήσεις.',
    min: 2,
    max: 8,
    acts: ['pedi_glam'],
    actDurations: { pedi_glam: 90 },
    minutes: 90,
  },
  {
    id: 'pedi_extended',
    name: 'PEDI-GLAM EXTENDED',
    icon: '💅',
    desc: 'After-hours εμπειρία 2,5 ωρών με Glam / Chaos Route, Glam Tokens, Secret Missions, Midnight ASMR και Morning Escape.',
    min: 2,
    max: 8,
    acts: ['board', 'midnight', 'morning'],
    actDurations: { board: 60, midnight: 45, morning: 45 },
    minutes: 150,
  },
  {
    id: 'lockdown',
    name: 'PAJAMA LOCKDOWN 18+',
    icon: '🚨',
    desc: 'Ψηφιακό Escape Room 60 λεπτών με Hostage Sacrifice, Sensory Cipher, Sabotage Override, mini-games, Exit Code και VIP Vault.',
    min: 3,
    max: 8,
    acts: ['lockdown'],
    actDurations: { lockdown: 60 },
    minutes: 60,
  },
  {
    id: 'beach_bar',
    name: 'BEACH BAR HOME LOCKDOWN',
    icon: '🍹',
    desc: 'Home beach-bar party 2,5 ωρών με DJ, flip-flop dress code, Dance & Freeze, Shot & Truth Sync, τροχό και Flip-Flop Heist. Τα ποτά είναι πάντα προαιρετικά και αντικαθίστανται με μη αλκοολούχα.',
    min: 3,
    max: 8,
    acts: ['beach'],
    actDurations: { beach: 150 },
    minutes: 150,
  },
  {
    id: 'marathon_4h',
    name: 'PAJAMA MARATHON 4H',
    icon: '🏆',
    desc: 'Τετράωρη εμπειρία τεσσάρων Acts: Pedi-Glam, Midnight ASMR, 60 λεπτά Pajama Lockdown και Morning Escape.',
    min: 2,
    max: 8,
    acts: ['pedi_glam', 'midnight', 'lockdown', 'morning'],
    actDurations: { pedi_glam: 90, midnight: 45, lockdown: 60, morning: 45 },
    minutes: 240,
  },
];

export const isNewMode = (id) => NEW_MODES.some((m) => m.id === id);
export const modeMeta = (id) => NEW_MODES.find((m) => m.id === id);

export const MODE_THEMES = {
  pedi_glam: { bg: '#0A0A0A', accent: '#FF69B4', accent2: '#FFD700' },
  pedi_extended: { bg: '#0A0A0A', accent: '#FF2A85', accent2: '#FFD700' },
  lockdown: { bg: '#0A0A0A', accent: '#FF003C', accent2: '#FF6B8A' },
  beach_bar: { bg: '#0D0D11', accent: '#00F2FE', accent2: '#FF3366' },
  marathon_4h: { bg: '#0A0A0A', accent: '#FF2A85', accent2: '#FFD700' },
};

export const ACT_META = {
  pedi_glam: { title: 'Act 1 · Pajama Pedi-Glam', minutes: 90 },
  board: { title: 'Act 1 · The Glam & Chaos Board', minutes: 60 },
  midnight: { title: 'Act 2 · Midnight ASMR & Tickle Vault', minutes: 45 },
  lockdown: { title: 'Act 3 · Pajama Lockdown (18+)', minutes: 60 },
  morning: { title: 'Act 4 · Extended Morning Escape & VIP Vault', minutes: 45 },
  beach: { title: 'Beach Bar Home Lockdown', minutes: 150 },
};
