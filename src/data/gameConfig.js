// DEAL OF TEMPTATION - Game Configuration
// Board, Penalties, Roles, Perks, Intensity, Marathon, Bomb Event

// ===== 44-SQUARE BOARD =====
const BOARD_SQUARES = [
  { type: 'street', name: 'START' },
  { type: 'glitch', name: 'Base44 Glitch' },
  { type: 'glitch', name: 'Σφάλμα' },
  { type: 'street', name: 'Ο Καθρέφτης' },
  { type: 'street', name: 'Το Ψέμα' },
  { type: 'blackmarket', name: 'Μαύρη Αγορά' },
  { type: 'police', name: 'Police HQ' },
  { type: 'safehouse', name: 'Κρησφύγετο' },
  { type: 'warrant', name: 'Ένταλμα' },
  { type: 'street', name: 'Η Σφραγίδα' },
  { type: 'street', name: 'Η Ομολογία' },
  { type: 'street', name: 'Το Τίμημα' },
  { type: 'street', name: 'Δρόμος 5' },
  { type: 'warrant', name: 'Ένταλμα' },
  { type: 'blackmarket', name: 'Μαύρη Αγορά' },
  { type: 'warrant', name: 'Warrant' },
  { type: 'street', name: 'Η Μάρτυρας' },
  { type: 'safehouse', name: 'Κρησφύγετο' },
  { type: 'street', name: 'Δρόμος 7' },
  { type: 'warrant', name: 'Ένταλμα' },
  { type: 'glitch', name: 'Σφάλμα' },
  { type: 'glitch', name: 'Base44 Glitch' },
  { type: 'police', name: 'Αστυνομία' },
  { type: 'blackmarket', name: 'Μαύρη Αγορά' },
  { type: 'street', name: 'Δρόμος 9' },
  { type: 'glitch', name: 'Σφάλμα' },
  { type: 'warrant', name: 'Ένταλμα' },
  { type: 'street', name: 'Δρόμος 10' },
  { type: 'safehouse', name: 'Κρησφύγετο' },
  { type: 'glitch', name: 'Σφάλμα' },
  { type: 'street', name: 'Δρόμος 11' },
  { type: 'blackmarket', name: 'Μαύρη Αγορά' },
  { type: 'police', name: 'Αστυνομία' },
  { type: 'street', name: 'Δρόμος 12' },
  { type: 'glitch', name: 'Σφάλμα' },
  { type: 'police', name: 'Αστυνομία' },
  { type: 'blackmarket', name: 'Μαύρη Αγορά' },
  { type: 'street', name: 'Δρόμος 13' },
  { type: 'warrant', name: 'Ένταλμα' },
  { type: 'glitch', name: 'Σφάλμα' },
  { type: 'street', name: 'Δρόμος 14' },
  { type: 'safehouse', name: 'Κρησφύγετο' },
  { type: 'blackmarket', name: 'Μαύρη Αγορά' },
  { type: 'street', name: 'FINISH' },
];

export const BOARD = BOARD_SQUARES.map((sq, i) => ({ ...sq, position: i, zone: Math.floor(i / 11) + 1 }));

// Το βασικό DEAL χρησιμοποιεί 24 κουτιά. Το πλήρες 44-base board παραμένει διαθέσιμο για Heist & Arrest.
export const CLASSIC_BOARD = BOARD.slice(0, 24);

export const SQUARE_TYPES = {
  street: { label: 'Street Truth/Dare', icon: '🎲', color: 'bg-yellow-300', desc: 'Τράβα κάρτα Αλήθειας ή Θάρρους. Αποτυχία ➔ +1 Λάθος στη Σκάλα Ποινών.' },
  police: { label: 'Police HQ', icon: '🚔', color: 'bg-blue-400', desc: 'Οδηγείσαι αμέσως σε Interrogation Duel με τον Αστυνόμο.' },
  safehouse: { label: 'Safehouse', icon: '🏠', color: 'bg-green-400', desc: 'Πλήρης Ασυλία. Δεν μπορεί να σε αγγίξει κανείς μέχρι τον επόμενο γύρο.' },
  blackmarket: { label: 'Black Market', icon: '🛍️', color: 'bg-purple-400', desc: 'Αγόρασε ασυλία, επαναφόρτισε Perk ή δωροδοκία.' },
  warrant: { label: 'Warrant', icon: '📜', color: 'bg-red-400', desc: 'Διάλεξε άλλη παίκτρια και επίβαλε challenge ή σύλληψη.' },
  glitch: { label: 'Base44 Glitch', icon: '⚡', color: 'bg-pink-400', desc: 'Τυχαίο event που επηρεάζει όλη την παρέα.' },
};

// ===== PENALTY LADDER =====
export const FULL_PENALTY_LADDER = [
  { step: 1, label: 'Δέσιμο Ποδιών (αστράγαλοι)', icon: '🦶', detail: 'Σχοινί, zip-tie ή tape στους αστραγάλους.', challenge: 'Πρέπει να κάνει 3 βήματα με δεμένα πόδια. Αν πέσει, +10" γαργαλήματος στις μασχάλες.' },
  { step: 2, label: 'Δέσιμο Χεριών (καρποί)', icon: '✋', detail: 'Καρποί δεμένοι μπροστά ή πίσω.', challenge: 'Πρέπει να πιει 1 σφηνάκι χωρίς χέρια, μόνο με το στόμα από το τραπέζι.' },
  { step: 3, label: 'Βγάλσιμο Αριστερού Παπουτσιού', icon: '👟', detail: 'Ένα παπούτσι φεύγει.', challenge: 'Το παπούτσι περνάει σε άλλη παίκτρια — το φοράει για 1 γύρο ως «κατάσχεση».' },
  { step: 4, label: 'Βγάλσιμο Δεξιού Παπουτσιού', icon: '👟', detail: 'Χωρίς παπούτσια.', challenge: 'Πρέπει να περπατήσει ξυπόλυτη σε όλο το δωμάτιο και να φέρει ένα αντικείμενο.' },
  { step: 5, label: 'Βγάλσιμο Αριστερής Κάλτσας', icon: '🧦', detail: '1 γυμνό πέλμα.', challenge: 'Η παρέα ακουμπάει 1 αντικείμενο στο γυμνό πέλμα — πρέπει να μαντέψει τι είναι.' },
  { step: 6, label: 'Βγάλσιμο Δεξιάς Κάλτσας', icon: '🧦', detail: 'Εντελώς ξυπόλυτη.', challenge: '15" γαργάλημα στις γυμνές πατούσες από 1 παίκτρια. Αν γελάσει, +1 επιπλέον ποινή.' },
  { step: 7, label: 'Toe Tie — Δέσιμο Μυτών', icon: '🎀', detail: 'Τα δύο μεγάλα δάχτυλα δεμένα μεταξύ τους. Πέλματα κλειδωμένα. Fully Restrained → Στάδιο 2.', challenge: 'Πλήρης ακινητοποίηση ποδιών. Αν κινηθεί τα δάχτυλα, +20" συνεχόμενο γαργάλημα. Τέλος Σκάλας → Στάδιο 2.' },
];

export function getPenaltyLadder(footwearLevel) {
  if (footwearLevel >= 2) return FULL_PENALTY_LADDER;
  if (footwearLevel === 1) {
    return [FULL_PENALTY_LADDER[0], FULL_PENALTY_LADDER[1], FULL_PENALTY_LADDER[2], FULL_PENALTY_LADDER[3], FULL_PENALTY_LADDER[6]];
  }
  return [FULL_PENALTY_LADDER[0], FULL_PENALTY_LADDER[1], FULL_PENALTY_LADDER[6]];
}

export const FOOTWEAR_LEVELS = [
  { level: 3, label: 'Μπότες / Ψηλά Τακούνια', icon: '👢', steps: 7, desc: 'Πλήρης σκάλα ποινών (7 βήματα).' },
  { level: 2, label: 'Αθλητικά / Sneakers', icon: '👟', steps: 7, desc: 'Πλήρης σκάλα ποινών (7 βήματα).' },
  { level: 1, label: 'Πέδιλα / Σανδάλια / Παντόφλες', icon: '👡', steps: 5, desc: 'Παραλείπονται τα βήματα καλτσών (5 βήματα).' },
  { level: 0, label: 'Ξυπόλυτη', icon: '🦶', steps: 3, desc: 'Παραλείπονται παπούτσια & κάλτσες (3 βήματα).' },
];

// ===== TOENAIL PERKS =====
export const TOENAIL_PERKS = [
  { id: 'red', name: 'Red Queen', icon: '🔴', color: '#ef4444', desc: 'Μεταφορά 1 ποινής δεσίματος ή σφηνακίου σε άλλη παίκτρια.' },
  { id: 'black', name: 'Goth Shield', icon: '🖤', color: '#1e293b', desc: '30 δευτερόλεπτα πλήρης ασυλία στο γαργάλημα.' },
  { id: 'nude', name: 'Stealth Mode', icon: '🤍', color: '#e2d6c8', desc: 'Ακύρωση 1 στάσης δεσίματος (Skip).' },
  { id: 'pink', name: 'Girlboss Override', icon: '🩷', color: '#ec4899', desc: 'Επιλογή της παίκτριας που θα παίξει στη συνέχεια.' },
  { id: 'glitter', name: 'Glitch Code', icon: '🪩', color: '#a855f7', desc: 'Αλλαγή κάρτας ή αλλαγή της ποινής που έβγαλε η εφαρμογή.' },
];

// ===== HIDDEN ROLES =====
export const HIDDEN_ROLES = [
  { id: 'cop', name: 'Υπαστυνόμος', icon: '🚔', desc: 'Προβλέπει την πιο Καταζητούμενη. Αν σωστά, +ασυλία στο τέλος.' },
  { id: 'hacker', name: 'Χάκερ', icon: '💻', desc: 'Ακυρώνει σφάλμα (Glitch/Blackout) ή αντιστρέφει φορά κίνησης.' },
  { id: 'driver', name: 'Οδηγός Απόδρασης', icon: '🏎️', desc: 'Γρήγορη διάσωση συμπαίκτριας (μαζί μισή ποινή).' },
];

// ===== INTENSITY LEVELS =====
export const INTENSITY_LEVELS = [
  { id: 'standard', name: 'STANDARD', icon: '🟢', desc: 'Η βασική εμπειρία.' },
  { id: 'extreme', name: 'EXTREME', icon: '🟠', desc: 'Πιο απαιτητικές δοκιμασίες και μεγαλύτερη ένταση.' },
  { id: 'ultra', name: 'ULTRA 2026/27', icon: '🔴', desc: 'Ακραία ένταση. Όλα στο τραπέζι.' },
];

// ===== GAME MODES =====
// BUILD 11:07 — 4 modes: classic, marathon, arrest_heist, pajama
export const GAME_MODES = [
  { id: 'classic', name: 'ΚΛΑΣΣΙΚΗ', icon: '🎲', desc: '2-6 παίκτριες. Ταμπλό 44 κουτιών, Σκάλα 7 Ποινών, Στάδια 1-3.' },
  { id: 'marathon', name: 'MEGA MARATHON', icon: '🏆', desc: '8-10 παίκτριες. 2 ομάδες (Alpha & Beta), 4 στάδια, $200.000 Loot ή 10 Wanted Stars.' },
  { id: 'arrest_heist', name: 'ARREST & HEIST', icon: '🚨', desc: '2 Ομάδες (Alpha vs Beta). 6 γύροι, 6 στάδια ποινών, Grand Heist Escape.' },
  { id: 'pajama', name: 'PAJAMA PEDI-GLAM', icon: '🩴', desc: 'Μένουν στο σπίτι. Πιτζάμες, νύχια, παντόφλες, γαργαλητό & δεσίματα. 44 κουτιά, νύχτα & πρωί.' },
];

// Τα 4 ψηφιακά modes του «Μεγάλου Update» ορίζονται στο data/modes/modeRegistry.js
import { NEW_MODES } from '@/data/modes/modeRegistry';
NEW_MODES.forEach((m) => GAME_MODES.push({ id: m.id, name: m.name, icon: m.icon, desc: m.desc }));

// ===== MARATHON STAGES =====
export const MARATHON_STAGES = [
  { stage: 1, name: 'INFILTRATION', wantedRange: '1-3', target: 'FINISH', desc: 'Ψηφιακό φιδάκι 80 κουτιών. Ζάρι και κίνηση. Challenge: Επιτυχία +$5.000, Αποτυχία +1⭐. Κόντρα: Νίκη +$5.000, Ήττα +1⭐. Παγίδες/Ποινές: αυτόματο εφέ +1⭐. Πρώτη ομάδα στο FINISH.' },
  { stage: 2, name: 'THE VAULT', wantedRange: '4-6', target: '$100.000', desc: 'Εσωτερικός κύκλος, διπλάσια Loot. 5 ατομικές δοκιμασίες ξυπόλυτων. Κλιμάκωση δεσίματος.' },
  { stage: 3, name: 'POLICE RAIDS', wantedRange: '7-9', target: '$160.000', desc: '3 ομαδικές ποινές (2-3 παίκτριες ταυτόχρονα).' },
  { stage: 4, name: 'TOTAL LOCKDOWN', wantedRange: '10 / $200.000', target: 'ΝΙΚΗ', desc: 'Η ηττημένη ομάδα ακινητοποιείται. 120″ τελικής εκτέλεσης.' },
];

// ===== BOMB EVENT =====
export const BOMB_TYPING_TYPES = [
  { id: 'hogtie', name: 'Hogtie', icon: '🪢', desc: 'Καρποί πίσω από την πλάτη. Αστράγαλοι δεμένοι, φτέρνες στους γλουτούς.' },
  { id: 'tiptoe', name: 'Overhead Standing Tiptoe Lock', icon: '🩰', desc: 'Χέρια δεμένα ψηλά. Αστράγαλοι δεμένοι κάτω. Στέκεται στις μύτες.' },
  { id: 'spitlock', name: 'The Spit Lock (Σούβλα)', icon: '🍢', desc: 'Μαντήλι στα μάτια. Χέρια & πόδια σε οριζόντια δοκό.' },
];

export const BOMB_RIDDLES_ALPHA = [
  { id: 1, code: '2460', question: 'Ο κωδικός της βόμβας έχει 4 ψηφία. Το 1ο ψηφίο είναι το μισό του 2ου. Το 3ο ψηφίο είναι το άθροισμα του 1ου και του 2ου. Το 4ο ψηφίο είναι το μηδέν. Αν το άθροισμα και των 4 ψηφίων είναι 12, ποιος είναι ο κωδικός;', answer: '2460', logic: '2, 4, 2+4=6, 0 → 2+4+6+0 = 12' },
  { id: 2, code: 'hole', question: 'Όσο πιο πολύ υλικό αφαιρείς από μένα, τόσο μεγαλύτερος γίνομαι. Τι είμαι;', answer: 'Η Τρύπα', logic: 'Τρύπα στο χρηματοκιβώτιο/τοίχο.' },
  { id: 3, code: 'clock', question: 'Τρέχω συνεχώς αλλά δεν έχω πόδια. Έχω πρόσωπο/καντράν αλλά δεν έχω μάτια. Αν σταματήσω, η βόμβα εκρήγνυται. Τι είμαι;', answer: 'Το Ρολόι / Χρονόμετρο', logic: '' },
  { id: 4, code: 'key', question: 'Έχω δόντια αλλά δεν μπορώ να δαγκώσω. Ανοίγω περάσματα αλλά δεν μπορώ να περπατήσω. Τι είμαι;', answer: 'Το Κλειδί', logic: '' },
  { id: 5, code: 'green', question: 'Έχεις 3 καλώδια: Κόκκινο, Μπλε, Πράσινο. Το Πράσινο είναι αμέσως μετά το Κόκκινο. Το Μπλε είναι 1ο στη σειρά. Ποιο καλώδιο είναι 3ο (τελευταίο);', answer: 'Το Πράσινο', logic: 'Σειρά: 1. Μπλε, 2. Κόκκινο, 3. Πράσινο.' },
  { id: 6, code: 'oath', question: 'Μπορείς να με κρατήσεις μόνο αφού μου το δώσεις. Δεν αγγίζομαι με τα χέρια, αλλά αν με σπάσεις, καταστρέφονται τα πάντα ανάμεσά μας. Τι είμαι;', answer: 'Ο Λόγος / Η Υπόσχεση', logic: '6ος κρίσιμος γρίφος.' },
];

export const BOMB_RIDDLES_BETA = [
  { id: 1, code: '283', question: 'Ο κωδικός έχει 3 ψηφία. Το 2ο ψηφίο είναι 4 φορές μεγαλύτερο από το 1ο. Το 3ο ψηφίο είναι κατά 5 μικρότερο από το 2ο. Αν το άθροισμα και των 3 ψηφίων είναι 13, ποιος είναι ο κωδικός;', answer: '283', logic: '1ο=2, 2ο=8, 3ο=3 → 2+8+3 = 13' },
  { id: 2, code: 'bottle', question: 'Έχω λαιμό αλλά δεν έχω κεφάλι. Έχω σώμα αλλά δεν έχω χέρια. Αν με αναποδογυρίσεις, χύνεται το περιεχόμενό μου. Τι είμαι;', answer: 'Το Μπουκάλι', logic: '' },
  { id: 3, code: 'shadow', question: 'Σε ακολουθώ παντού κατά τη διάρκεια της ληστείας, αλλά εξαφανίζομαι στο απόλυτο σκοτάδι. Τι είμαι;', answer: 'Η Σκιά σου', logic: '' },
  { id: 4, code: 'safe', question: 'Όλοι με θέλουν κλειστό όταν είμαι γεμάτος, και ανοιχτό μόνο όταν θέλουν να πάρουν αυτό που κρύβω μέσα μου. Τι είμαι;', answer: 'Το Χρηματοκιβώτιο / Πορτοφόλι', logic: '' },
  { id: 5, code: 'agb', question: 'Υπάρχουν 3 κουμπιά: Α, Β, Γ. Το Α δεν είναι δίπλα στο Β. Το Γ είναι αμέσως μετά το Α. Ποια είναι η σωστή σειρά από αριστερά προς τα δεξιά;', answer: 'Α - Γ - Β', logic: '' },
  { id: 6, code: 'silence', question: 'Όσο περισσότερο υπάρχει, τόσο λιγότερα βλέπεις και ακούς. Αν με ονομάσεις δυνατά, με καταστρέφεις ακαριαία. Τι είμαι;', answer: 'Η Σιωπή', logic: '6ος κρίσιμος γρίφος.' },
];

export const BOMB_PASO_TRIALS = [
  { id: 'truth', name: 'ΑΚΡΑΙΑ ΑΛΗΘΕΙΑ (Extreme Truth)', desc: 'Πες μπροστά σε όλες, με κάθε λεπτομέρεια και χωρίς να διστάσεις: Ποιο είναι το πιο ντροπιαστικό πράγμα που έχεις κάνει ή η πιο κρυφή σκέψη που έχεις κάνει για μία συγκεκριμένη παίκτρια της αντίπαλης ομάδας;', success: 'Πλήρης, αναλυτική απάντηση χωρίς δισταγμό άνω των 5 δευτερολέπτων.' },
  { id: 'dare', name: 'ΑΚΡΑΙΟ ΘΑΡΡΟΣ (Extreme Dare)', desc: 'Βγάλε αμέσως τα παπούτσια και τις κάλτσες σου. Κάθισε στο πάτωμα και άφησε 2 παίκτριες της αντίπαλης ομάδας να σου γαργαλήσουν τις γυμνές αψίδες των πελμάτων για 30 δευτερόλεπτα, χωρίς να μετακινήσεις τα πόδια σου και χωρίς να βγάλεις τον παραμικρό ήχο/γέλιο!', success: 'Απόλυτη ακινησία και σιγή για 30 δευτερόλεπτα.' },
];

// ===== WHEEL OF MISFORTUNE =====
export const WHEEL_BINDING_MATERIALS = ['Σχοινί', 'Zip-ties', 'Duct Tape', 'Βελούδινη Κορδέλα'];
export const WHEEL_TICKLE_TOOLS = ['Γυμνά δάχτυλα', 'Παγάκι', 'Πινέλο μακιγιάζ', 'Φτερό'];

// ===== ARREST & HEIST MODE =====
export const ARREST_HEIST_LADDER = [
  { step: 1, label: 'Σύλληψη', icon: '🚔', detail: 'Αφαίρεση 1ου παπουτσιού (αργά από την αντίπαλη ομάδα) + Δέσιμο καρπών με Zip-ties.' },
  { step: 2, label: 'Περιορισμός', icon: '⛓️', detail: 'Αφαίρεση 2ου παπουτσιού + Τύλιγμα γονάτων με Duct tape (περιορισμός κίνησης).' },
  { step: 3, label: 'Απογύμνωση 1', icon: '🧦', detail: 'Αφαίρεση 1ης κάλτσας + Δέσιμο των δύο ποδιών μεταξύ τους στους αστραγάλους.' },
  { step: 4, label: 'Απογύμνωση 2', icon: '🦶', detail: 'Αφαίρεση 2ης κάλτσας (τελείως γυμνές πατούσες) + Σφιχτό Blindfold.' },
  { step: 5, label: 'Full Hogtie Lockdown', icon: '🪢', detail: 'Πλήρες Hogtie με σχοινί στον καναπέ/πάτωμα.' },
  { step: 6, label: 'Blindfold Full Lockdown', icon: '🙈', detail: 'Hogtie + Blindfold + Γυμνές Πατούσες. Τέλος ποινών — Grand Heist ξεκινά.' },
];

export const ARREST_HEIST_INTENSITY = [
  { id: 'soft', name: 'SOFT', icon: '🟢', desc: 'Ελαφριές ποινές, λιγότερο γαργάλημα.' },
  { id: 'medium', name: 'MEDIUM', icon: '🟡', desc: 'Κλιμακωτό γαργάλημα & δεσίματα.' },
  { id: 'hardcore', name: 'FULL HARDCORE', icon: '🔴', desc: 'Hogtie, Tickle & ακραίες δοκιμασίες.' },
];