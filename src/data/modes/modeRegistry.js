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

export const MODE_MEDIA_SECTIONS = {
  lockdown: [
    { id: 'level1', label: 'Level 1 — Hostage Sacrifice', filename: 'section1_Level1_Hostage_Sacrifice.jpg' },
    { id: 'level2', label: 'Level 2 — Sensory Cipher', filename: 'section2_Level2_Sensory_Cipher.jpg' },
    { id: 'level3', label: 'Level 3 — Sabotage Override', filename: 'section3_Level3_Sabotage_Override.jpg' },
    { id: 'level4', label: 'Level 4 — Exit Code', filename: 'section4_Level4_Exit_Code.jpg' },
    { id: 'level5', label: 'Level 5 — VIP Vault', filename: 'section5_Level5_VIP_Vault.jpg' },
  ],
  beach_bar: [
    { id: 'checkin', label: 'Check-in', filename: 'beach_sec1.jpg' },
    { id: 'dance_arena', label: 'Dance Arena', filename: 'beach_sec2.jpg' },
    { id: 'penalty_wheel', label: 'Τροχός Ποινών', filename: 'beach_sec3.jpg' },
    { id: 'shot_truth', label: 'Shot & Truth', filename: 'beach_sec4.jpg' },
    { id: 'last_queen', label: 'Last Queen', filename: 'beach_sec5.jpg' },
  ],
};

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


// Vollständige Liste αποκλειστικά για το ενιαίο MODE MEDIA CENTER.
// Δεν αλλάζει τη λίστα των ενεργών/διαθέσιμων game modes.
export const MEDIA_MODES = [
  { id: 'classic', name: 'CLASSIC', icon: '' },
  { id: 'marathon', name: 'MARATHON', icon: '' },
  { id: 'arrest_heist', name: 'ARREST HEIST', icon: '' },
  { id: 'pajama', name: 'PAJAMA', icon: '' },
  { id: 'pedi_extended', name: 'PAJAMA PEDI-GLAM EXTENDED', icon: '' },
  ...NEW_MODES.map(({ id, name, icon }) => ({ id, name, icon })),
];
