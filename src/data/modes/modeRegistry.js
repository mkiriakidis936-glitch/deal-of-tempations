// Τα εγκεκριμένα ψηφιακά game modes.
export const NEW_MODES = [
  {
    id: 'pedi_glam',
    name: 'PAJAMA PEDI-GLAM · 90′',
    icon: '💅',
    desc: 'Ψηφιακή εμπειρία 90 λεπτών με Pedi-Care, ASMR, μάσκες, φτερά, κρέμες, Glam Tokens και εξομολογήσεις.',
    min: 3,
    max: 8,
    acts: ['board', 'midnight'],
    actDurations: { board: 60, midnight: 30 },
    minutes: 90,
  },
  {
    id: 'pedi_extended',
    name: 'PAJAMA PEDI-GLAM EXTENDED',
    icon: '💅',
    desc: 'Εκτεταμένη εμπειρία 2–2,5 ωρών με διαδοχικές κάρτες, mini-games, χρονόμετρα και κλιμακούμενες προκλήσεις.',
    min: 3,
    max: 8,
    acts: ['board', 'midnight'],
    actDurations: { board: 90, midnight: 60 },
    minutes: 150,
  },
  {
    id: 'lockdown',
    name: 'PAJAMA LOCKDOWN 18+',
    icon: '🚨',
    desc: 'Χρονομετρημένο Escape Room 60 λεπτών με Team Cipher, Sensory Puzzles, Sabotage Override, mini-games, Exit Code και VIP Vault.',
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
    desc: 'Home beach-bar party 2–3 ωρών με DJ, flip-flop dress code, Freeze Dance, Shot & Truth Sync, Penalty Wheel και Flip-Flop Heist. Τα ποτά είναι προαιρετικά.',
    min: 3,
    max: 8,
    acts: ['beach'],
    actDurations: { beach: 150 },
    minutes: 150,
  },
  {
    id: 'marathon_4h',
    name: 'PAJAMA HEIST & ARREST',
    icon: '🚔',
    desc: 'The Ultimate Lounge Lockdown: ταμπλό 21 τετραγώνων, Αστυνόμος & Fugitives, Wanted αστέρια, Loot, σαγιονάρες/κάλτσες ως άμυνα, χειροπέδες, ανάκριση με μυστική ψηφοφορία, Decibel Meter και φινάλε Barefoot Escape. 18+.',
    min: 3,
    max: 10,
    acts: ['lounge'],
    actDurations: { lounge: 105 },
    minutes: 105,
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

// iOS 27 · μαύρο & χρυσό. Κάθε mode έχει δική του απόχρωση χρυσού (όχι άλλο χρώμα).
export const MODE_THEMES = {
  lockdown: { bg: '#000000', accent: '#E8C26B', accent2: '#F7E3A8', danger: '#FF453A' },
  beach_bar: { bg: '#000000', accent: '#F0B85A', accent2: '#FBE3B0', danger: '#FF453A' },
  pedi_glam: { bg: '#000000', accent: '#E8C26B', accent2: '#F7E3A8', danger: '#FF453A' },
  pedi_extended: { bg: '#000000', accent: '#E8C26B', accent2: '#F7E3A8', danger: '#FF453A' },
  marathon_4h: { bg: '#000000', accent: '#D9B45B', accent2: '#F7E3A8', danger: '#FF453A' },
};

export const ACT_META = {
  board: { title: 'Act 1 · The Glam & Chaos Board', minutes: 60 },
  midnight: { title: 'Act 2 · Midnight ASMR & Secret Vault', minutes: 45 },
  lockdown: { title: 'Pajama Lockdown (18+)', minutes: 60 },
  morning: { title: 'Act 4 · Extended Morning Escape & VIP Vault', minutes: 45 },
  beach: { title: 'Beach Bar Home Lockdown', minutes: 150 },
  lounge: { title: 'The Ultimate Lounge Lockdown', minutes: 105 },
};


// Vollständige Liste αποκλειστικά για το ενιαίο MODE MEDIA CENTER.
// Δεν αλλάζει τη λίστα των ενεργών/διαθέσιμων game modes.
export const MEDIA_MODES = [
  { id: 'classic', name: 'CLASSIC', icon: '' },
  { id: 'marathon', name: 'MARATHON', icon: '' },
  { id: 'arrest_heist', name: 'ARREST HEIST', icon: '' },
  { id: 'pajama', name: 'PAJAMA', icon: '' },
  ...NEW_MODES.map(({ id, name, icon }) => ({ id, name, icon })),
];
