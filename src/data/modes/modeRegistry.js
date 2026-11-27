// Τα ενεργά ψηφιακά modes (ξεχωριστά από τις μηχανές παιχνιδιού Classic / Arrest Heist).
export const NEW_MODES = [
  {
    id: 'deal_movie',
    name: 'DEAL OF TEMPTATION — Η ΤΑΙΝΙΑ',
    icon: '🎬',
    desc: 'Το μεγάλο ψηφιακό παιχνίδι / Live TV Show / ταινία: ο χάρτης των 5 ηπείρων (Classic, Arrest Heist, Pajama Lockdown 18+, Pajama Heist & Arrest, Villa Takeover) σε πράξεις — Γρήγορο σετ, 48h ή 72h — με Previously On, Standby, κοινό σκορ, λεία, tokens, Wanted Level, κληρώσεις, νύχια, παπούτσια/κάλτσες ένα-ένα, χορούς, δεσίματα, νυχτερινή φάση και Μεγάλο Δώρο.',
    min: 3,
    max: 10,
    acts: ['campaign'],
    actDurations: { campaign: 2880 },
    minutes: 2880,
  },
  {
    id: 'lockdown',
    name: 'PAJAMA LOCKDOWN 18+',
    icon: '🚨',
    desc: 'Χρονομετρημένο Escape Room 60 λεπτών με ομαδικούς γρίφους, αισθησιακές δοκιμασίες, δολιοφθορά, μίνι παιχνίδια, κωδικό εξόδου και VIP Vault.',
    min: 3,
    max: 8,
    acts: ['lockdown'],
    actDurations: { lockdown: 60 },
    minutes: 60,
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
  {
    id: 'villa_takeover',
    name: 'VILLA TAKEOVER 48/72',
    icon: '🏝️',
    desc: 'Πολυήμερο ψηφιακό παιχνίδι 18+ σε Villa / Airbnb, σε έκδοση 48 ή 72 ωρών: ταμπλό 3 κύκλων και 48/72 τετραγώνων, 4-Step Round Strip, σαγιονάρες & χρώμα νυχιών, δεσίματα, μύτες, γαργάλημα, χορός, σφηνάκια με δεμένα χέρια, Απόλυτες Διαταγές, Κλέφτρες & Αστυνομικίνες, διπλό Night Sock Heist, μυστικοί ρόλοι, συμμαχίες και τετραψήφιος κωδικός για την Τελική Αναμέτρηση.',
    min: 3,
    max: 8,
    acts: ['villa'],
    actDurations: { villa: 2880 },
    minutes: 2880,
  },

];

// Αποσυρμένα modes: δεν εμφανίζονται πουθενά, μένουν μόνο για να ανοίγουν παλιές αποθηκευμένες συνεδρίες.
export const RETIRED_MODES = [
  // Αφαιρέθηκε εντελώς στην 7.5.0 — μένει μόνο ως «ταμπέλα» για να κλείνουν παλιές αποθηκευμένες παρτίδες.
  {
    id: 'beach_bar',
    name: 'BEACH BAR (ΑΦΑΙΡΕΘΗΚΕ)',
    icon: '🍹',
    desc: 'Αφαιρέθηκε στην 7.5.0.',
    min: 3,
    max: 8,
    acts: ['beach'],
    actDurations: { beach: 1 },
    retired: true,
    removed: true,
    minutes: 1,
  },
  {
    id: 'pedi_glam',
    name: 'PAJAMA PEDI-GLAM · 90′',
    icon: '💅',
    desc: 'Ψηφιακή εμπειρία 90 λεπτών με Pedi-Care, ASMR, μάσκες, φτερά, κρέμες, Glam Tokens και εξομολογήσεις.',
    min: 3,
    max: 8,
    acts: ['board', 'midnight'],
    actDurations: { board: 60, midnight: 30 },
    retired: true,
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
    retired: true,
    minutes: 150,
  },
];

// alt: η ενότητα είναι «εναλλακτική εικόνα» της φάσης alt — εναλλάσσεται ζωντανά μαζί της (βλ. src/lib/sectionVariants.js).
export const MODE_MEDIA_SECTIONS = {
  classic: [
    { id: 'setup', label: 'Προετοιμασία', filename: 'classic_setup.jpg' },
    { id: 'board', label: 'Ταμπλό 24 θέσεων · Περιπολία', filename: 'classic_board.jpg' },
    { id: 'truth_dare', label: 'Αλήθεια ή Θάρρος', filename: 'classic_truth_dare.jpg' },
    { id: 'police', label: 'Αστυνομικός έλεγχος · Ανάκριση', filename: 'classic_police.jpg' },
    { id: 'black_market', label: 'Μαύρη αγορά', filename: 'classic_black_market.jpg' },
    { id: 'warrant', label: 'Ένταλμα', filename: 'classic_warrant.jpg' },
    { id: 'finale', label: 'Φινάλε', filename: 'classic_finale.jpg' },
  ],
  arrest_heist: [
    { id: 'teams', label: 'Alpha vs Beta', filename: 'heist_teams.jpg' },
    { id: 'rounds', label: 'Γύροι ληστείας', filename: 'heist_rounds.jpg' },
    { id: 'penalties', label: 'Στάδια ποινών', filename: 'heist_penalties.jpg' },
    { id: 'escape', label: 'Grand Heist Escape', filename: 'heist_escape.jpg' },
    { id: 'victory', label: 'Νίκη & στέψη', filename: 'heist_victory.jpg' },
    { id: 'planning', label: 'Σχεδιασμός ληστείας', filename: 'heist_planning.jpg', alt: 'teams' },
    { id: 'arrest', label: 'Σύλληψη & ανάκριση', filename: 'heist_arrest.jpg', alt: 'penalties' },
  ],
  deal_movie: [
    { id: 'classic', label: 'Ήπειρος 1 — Classic', filename: 'movie_continent_classic.jpg' },
    { id: 'arrest_heist', label: 'Ήπειρος 2 — Arrest Heist', filename: 'movie_continent_arrest_heist.jpg' },
    { id: 'lockdown', label: 'Ήπειρος 3 — Pajama Lockdown 18+', filename: 'movie_continent_lockdown.jpg' },
    { id: 'marathon_4h', label: 'Ήπειρος 4 — Pajama Heist & Arrest', filename: 'movie_continent_pajama_heist.jpg' },
    { id: 'villa_takeover', label: 'Ήπειρος 5 — Villa Takeover', filename: 'movie_continent_villa.jpg' },
    { id: 'transition', label: 'Μετάβαση — Previously On', filename: 'movie_previously_on.jpg' },
    { id: 'standby', label: 'Standby — αναμονή επόμενης πράξης', filename: 'movie_standby.jpg' },
    { id: 'night', label: 'Βράδυ στον Ύπνο', filename: 'movie_night.jpg' },
    { id: 'finale', label: 'Μεγάλο Φινάλε & Μεγάλο Δώρο', filename: 'movie_finale.jpg' },
  ],
  villa_takeover: [
    { id: 'arrival', label: 'Ημέρα 1 — Άφιξη & Round Strip', filename: 'villa_day1.jpg' },
    { id: 'temptation', label: 'Ημέρα 2 — Ένταση & Μίνι-Παιχνίδια', filename: 'villa_day2.jpg' },
    { id: 'takeover', label: 'Ημέρα 3 — Ανατροπή Συμμαχιών', filename: 'villa_day3.jpg' },
    { id: 'night', label: 'Νύχτες — Night Mode & Night Sock Heist', filename: 'villa_night.jpg' },
    { id: 'strip', label: '4-Step Round Strip', filename: 'villa_round_strip.jpg', alt: 'arrival' },
    { id: 'restraint', label: 'Δεσίματα, μύτες & γαργάλημα', filename: 'villa_restraint.jpg', alt: 'temptation' },
    { id: 'nails', label: 'Σαγιονάρες & χρώμα νυχιών', filename: 'villa_nails.jpg', alt: 'arrival' },
    { id: 'command', label: 'Απόλυτη Διαταγή & Άγαλμα', filename: 'villa_command.jpg' },
    { id: 'cops', label: 'Κλέφτρες & Αστυνομικίνες', filename: 'villa_cops.jpg' },
    { id: 'roles', label: 'Μυστικοί ρόλοι, συμμαχίες & ψηφοφορίες', filename: 'villa_roles.jpg', alt: 'takeover' },
    { id: 'finale', label: 'Τελική Αναμέτρηση & κωδικός', filename: 'villa_finale.jpg' },
    { id: 'crown', label: 'Απονομή — Queen of the Villa', filename: 'villa_crown.jpg' },
  ],
  marathon_4h: [
    { id: 'phase1', label: 'Φάση 1 — Warm-up & Slipper Grabbing', filename: 'lounge_phase1.jpg' },
    { id: 'phase2', label: 'Φάση 2 — The Handcuff Escalation', filename: 'lounge_phase2.jpg' },
    { id: 'phase3', label: 'Φάση 3 — Lockdown & Decibel Challenge', filename: 'lounge_phase3.jpg' },
    { id: 'phase4', label: 'Φάση 4 — Barefoot Escape & Crown', filename: 'lounge_phase4.jpg' },
    { id: 'prep', label: 'Προετοιμασία & Ρόλοι', filename: 'lounge_prep.jpg', alt: 'phase1' },
    { id: 'interrogation', label: 'Ανάκριση & μυστική ψηφοφορία', filename: 'lounge_interrogation.jpg', alt: 'phase2' },
    { id: 'loot', label: 'Wanted αστέρια & Loot', filename: 'lounge_loot.jpg', alt: 'phase4' },
  ],
  lockdown: [
    { id: 'level1', label: 'Επίπεδο 1 — Η θυσία της ομήρου', filename: 'section1_Level1_Hostage_Sacrifice.jpg' },
    { id: 'level2', label: 'Επίπεδο 2 — Ο αισθησιακός γρίφος', filename: 'section2_Level2_Sensory_Cipher.jpg' },
    { id: 'level3', label: 'Επίπεδο 3 — Δολιοφθορά', filename: 'section3_Level3_Sabotage_Override.jpg' },
    { id: 'level4', label: 'Επίπεδο 4 — Ο κωδικός εξόδου', filename: 'section4_Level4_Exit_Code.jpg' },
    { id: 'level5', label: 'Επίπεδο 5 — VIP Vault', filename: 'section5_Level5_VIP_Vault.jpg' },
    { id: 'briefing', label: 'Briefing — Έναρξη Lockdown', filename: 'lockdown_briefing.jpg', alt: 'level1' },
    { id: 'escape', label: 'Escape — Έξοδος', filename: 'lockdown_escape.jpg', alt: 'level5' },
  ],
};

export const isNewMode = (id) => NEW_MODES.some((m) => m.id === id) || RETIRED_MODES.some((m) => m.id === id);
export const modeMeta = (id) => NEW_MODES.find((m) => m.id === id) || RETIRED_MODES.find((m) => m.id === id);

// iOS 27 · μαύρο & χρυσό. Κάθε mode έχει δική του απόχρωση χρυσού (όχι άλλο χρώμα).
export const MODE_THEMES = {
  lockdown: { bg: '#000000', accent: '#E8C26B', accent2: '#F7E3A8', danger: '#FF453A' },
  pedi_glam: { bg: '#000000', accent: '#E8C26B', accent2: '#F7E3A8', danger: '#FF453A' },
  pedi_extended: { bg: '#000000', accent: '#E8C26B', accent2: '#F7E3A8', danger: '#FF453A' },
  marathon_4h: { bg: '#000000', accent: '#D9B45B', accent2: '#F7E3A8', danger: '#FF453A' },
  villa_takeover: { bg: '#000000', accent: '#E8C26B', accent2: '#F7E3A8', danger: '#FF453A' },
  deal_movie: { bg: '#000000', accent: '#FF3B5C', accent2: '#F7E3A8', danger: '#FF453A' },
};

export const ACT_META = {
  board: { title: 'Act 1 · The Glam & Chaos Board', minutes: 60 },
  midnight: { title: 'Act 2 · Midnight ASMR & Secret Vault', minutes: 45 },
  lockdown: { title: 'Pajama Lockdown (18+)', minutes: 60 },
  morning: { title: 'Act 4 · Extended Morning Escape & VIP Vault', minutes: 45 },
  beach: { title: 'Beach Bar (αφαιρέθηκε)', minutes: 1 },
  lounge: { title: 'The Ultimate Lounge Lockdown', minutes: 105 },
  villa: { title: 'Villa Takeover · 48/72', minutes: 2880 },
  campaign: { title: 'Deal of Temptation — Η Ταινία', minutes: 2880 },
};


// Μηχανές παιχνιδιού (ταμπλό με ζάρι) — ξεχωριστή κατηγορία από τα ψηφιακά modes.
export const ENGINE_MODES = [
  { id: 'classic', name: 'CLASSIC', icon: '🎲', kind: 'engine' },
  { id: 'arrest_heist', name: 'ARREST HEIST', icon: '🚨', kind: 'engine' },
];

// Όλα τα ενεργά modes για το MODE MEDIA CENTER: πρώτα οι μηχανές, μετά τα ψηφιακά.
export const MEDIA_MODES = [
  ...ENGINE_MODES,
  ...NEW_MODES.map(({ id, name, icon }) => ({ id, name, icon, kind: 'digital' })),
];

// Διάρκεια για Site, Promo και φόρμες: «105′», «3 ώρες», «48 ή 72 ώρες».
export function durationLabel(meta) {
  if (!meta?.minutes) return '';
  if (meta.id === 'villa_takeover') return '48 ή 72 ώρες';
  if (meta.id === 'deal_movie') return 'Βραδιά, 48 ή 72 ώρες';
  if (meta.minutes < 120) return `${meta.minutes}′`;
  const h = meta.minutes / 60;
  return `${h.toLocaleString('el-GR', { maximumFractionDigits: 1 })} ώρες`;
}
