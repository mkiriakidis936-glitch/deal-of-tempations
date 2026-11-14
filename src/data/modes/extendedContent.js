// Pajama Pedi-Glam Extended + Acts 1, 2, 4 του μαραθωνίου.

export const GATE_TOKENS = 5; // Glam Tokens για να περάσεις στο Lockdown Portal / Act 2.
export const EXT_END = 35;
export const EXT_PORTAL = 33;
export const EXT_BRANCHES = [5, 12, 19, 26];
export const EXT_ZONES = [
  { id: 'warm', name: 'Warm-Up', from: 0, to: 11, color: '#FF2A85' },
  { id: 'chaos', name: 'Chaos Zone', from: 12, to: 23, color: '#FF003C' },
  { id: 'portal', name: 'Lockdown Portal', from: 24, to: 35, color: '#FFD700' },
];

export function squareType(i) {
  if (i === 0) return 'start';
  if (i === EXT_END) return 'finish';
  if (i === EXT_PORTAL) return 'portal';
  if (EXT_BRANCHES.includes(i)) return 'branch';
  return i % 4 === 3 ? 'rest' : 'card';
}
export const zoneOf = (i) => EXT_ZONES.find((z) => i >= z.from && i <= z.to) || EXT_ZONES[0];

export const ROUTES = {
  glam: { id: 'glam', name: 'The Glam Route', icon: '💗', color: '#FF2A85', desc: 'Ασφαλής δρόμος: ερωτήσεις, μυστικά, foot-spa. 1 Token ανά επιτυχία.', reward: 1, steps: 3 },
  chaos: { id: 'chaos', name: 'The Chaos & Trap Route', icon: '🔥', color: '#FF003C', desc: 'Παγίδες, δεσίματα, σαμποτάζ. 2 Tokens ανά επιτυχία, διπλοί πόντοι στον τερματισμό — αλλά ρίσκο ποινής.', reward: 2, steps: 3 },
};

export const GLAM_CARDS = [
  { id: 'g1', title: 'The Pedi-Gloss Check', text: 'Δείξε τα νύχια των ποδιών σου. Αν είναι άψογα βαμμένα, κερδίζεις 1 Glam Token. Αν όχι, κάνε 30 δευτερόλεπτα μασάζ πέλματος στη διπλανή σου.', secs: 30 },
  { id: 'g2', title: 'The Inner Circle Secret', text: 'Πες ένα αβλαβές μυστικό ομορφιάς ή μια αστεία αποτυχία μακιγιάζ που δεν έχεις πει ποτέ. Κερδίζεις 1 Token.' },
  { id: 'g3', title: 'The Compliment Chain', text: 'Κάνε ένα ειλικρινές, τρυφερό κομπλιμέντο για τα πόδια ή το στυλ σε κάθε κοπέλα της παρέας. Παίρνεις 1 Token.' },
  { id: 'g4', title: 'The Skincare Rule', text: 'Απάντησε σωστά: ποιο είναι το νούμερο 1 βήμα πριν βάλεις βερνίκι; (Απάντηση: καθαρισμός νυχιού και μετά η base coat.) Κερδίζεις 1 Token.' },
  { id: 'g5', title: 'The Satin Touch', text: 'Πέρασε μια σατέν κορδέλα απαλά γύρω από τις καμάρες σου για 15 δευτερόλεπτα χωρίς να γελάσεις. Κερδίζεις 1 Token.', secs: 15 },
  { id: 'g6', title: 'The Lazy Break', text: 'Είσαι ασφαλής σε αυτόν τον γύρο. Ξεκουράσου και πάρε 1 Glam Token δώρο.', free: true },
];

export const CHAOS_CARDS = [
  { id: 'c1', title: 'The Sock Switch Heist', text: 'Έχεις 30 δευτερόλεπτα να κλέψεις την κάλτσα της παίκτριας στα δεξιά σου χωρίς να σηκωθείς από το μαξιλάρι σου. Αν πετύχεις: +2 Tokens.', secs: 30 },
  { id: 'c2', title: 'The Tied Step', text: 'Τα πόδια σου δένονται χαλαρά με μια σατέν ζώνη στις φτέρνες για τους επόμενους 2 γύρους. Αν τερματίσεις έτσι, παίρνεις διπλούς πόντους.', restraint: true },
  { id: 'c3', title: 'The Tickle Trap', text: 'Έπεσες σε ναρκοπέδιο γαργαλητού! Η απέναντι παίκτρια έχει δικαίωμα να σε γαργαλήσει στα πέλματα για 15 δευτερόλεπτα, εκτός αν πληρώσεις 2 Glam Tokens για ασυλία.', secs: 15, trap: true },
  { id: 'c4', title: 'The Piggyback Penalty', text: 'Πρέπει να μεταφέρεις την παίκτρια στα αριστερά σου στην πλάτη σου μέχρι το επόμενο τετράγωνο. Αν αρνηθείς, χάνεις όλα τα tokens αυτού του γύρου.' },
  { id: 'c5', title: 'The Blind Balance', text: 'Κλείσε τα μάτια και στάσου στο ένα πόδι για 20 δευτερόλεπτα. Αν χάσεις την ισορροπία σου, τρως ποινή 10 δευτερολέπτων απαλού γαργαλητού στα δάχτυλα.', secs: 20 },
  { id: 'c6', title: 'The Sabotage Card', text: 'Απέκτησες μια Chaos Card! Κράτα την κρυφά και χρησιμοποίησέ την όποτε θες ενάντια σε αντίπαλο.', giveChaos: true },
];

export const CHAOS_POWERS = [
  { id: 'skip', name: 'Χάσε τη σειρά σου', icon: '⏭️', text: 'Η αντίπαλος χάνει την επόμενη σειρά της.' },
  { id: 'swap', name: 'Ανταλλαγή θέσεων', icon: '🔀', text: 'Αλλάζεις θέση στο ταμπλό με την αντίπαλο.' },
  { id: 'tickle', name: 'Επίθεση 15″', icon: '🪶', text: 'Η αντίπαλος τρώει 15″ γαργάλημα στα πέλματα.' },
];

export const SHOP = [
  { id: 'immunity', icon: '🛡️', name: 'Ασυλία γαργαλητού', cost: 2, desc: 'Γλιτώνεις την επόμενη ποινή γαργαλητού.' },
  { id: 'bribe', icon: '💸', name: 'Δωροδοκία', cost: 2, desc: 'Η συμπαίκτρια που επιλέγεις παίρνει τη θέση σου σε ένα δύσκολο δέσιμο και κερδίζει 1 token.', needsTarget: true },
  { id: 'chaos', icon: '🃏', name: 'Chaos Card', cost: 3, desc: 'Κρυφή κάρτα για χρήση εναντίον αντιπάλου.' },
  { id: 'skip', icon: '⏩', name: 'Skip Penalty', cost: 3, desc: 'Ακυρώνεις μια ποινή (Lockdown/Morning).' },
  { id: 'hint', icon: '💡', name: 'Hint Card', cost: 2, desc: 'Μια βοήθεια σε γρίφο του Lockdown ή του Morning Escape.' },
];

export const SECRET_MISSIONS = [
  { id: 'm1', title: 'The Stealthy Sock', text: 'Μυστική αποστολή: Πρέπει μέσα στα επόμενα 10 λεπτά να βγάλεις αθόρυβα την κάλτσα της παίκτριας στα αριστερά σου χωρίς να το καταλάβει.', reward: 3, mins: 10 },
  { id: 'm2', title: 'The Hidden Giggles', text: 'Μυστική αποστολή: Κάνε τη φίλη σου απέναντί σου να γελάσει δυνατά μέσα σε 1 λεπτό, χρησιμοποιώντας μόνο μια αστεία γκριμάτσα.', reward: 2, mins: 1 },
  { id: 'm3', title: 'The Secret Token Transfer', text: 'Μυστική αποστολή: Δωροδόκησε κρυφά μια συμπαίκτρια με ένα βλέμμα συνενοχής, χωρίς να το πάρουν χαμπάρι οι υπόλοιπες.', reward: 2, mins: 8, bothReward: true },
];


export const EXTENDED_GLAM_CARDS = [
  { id: 'eg1', title: 'The Skincare Rule', text: 'Ποιο είναι το #1 βήμα πριν το βερνίκι; (Base coat). Σωστό = +1 Token.' },
  { id: 'eg2', title: 'The Satin Touch', text: 'Πέρασε σατέν κορδέλα γύρω από τις καμάρες σου για 15″ χωρίς να γελάσεις. +1 Token.', secs: 15 },
  { id: 'eg3', title: 'The Lazy Break', text: 'Ξεκουράσου σε αυτόν τον γύρο και πάρε +1 Glam Token δώρο.', free: true },
  { id: 'eg4', title: 'The Beauty Confession', text: 'Ποια είναι η πιο ακριβή αγορά ομορφιάς που μετάνιωσες; +1 Token.' },
  { id: 'eg5', title: 'The Hand & Foot Sync', text: 'Κάνε 20″ χαλαρωτικό μασάζ χεριών στη διπλανή σου. +1 Token.', secs: 20 },
  { id: 'eg6', title: 'The Velvet Blindfold', text: 'Φόρεσε μάσκα ύπνου και μάντεψε ποια κοπέλα σου φυσάει απαλά στο μέτωπο. +1 Token.' },
  { id: 'eg7', title: 'The Secret Crush Hint', text: 'Δώσε 3 στοιχεία για το τελευταίο άτομο που φλέρταρες. +1 Token.' },
  { id: 'eg8', title: 'The Pedi-Check', text: 'Αν φοράς χνουδωτές κάλτσες, +1 Token. Αν είσαι ξυπόλυτη, +2 Tokens.' },
  { id: 'eg9', title: 'The Compliment Duel', text: 'Ανταλλάξτε από 3 αληθινά κομπλιμέντα με την απέναντί σου. +1 Token η καθεμία.' },
  { id: 'eg10', title: 'The Golden Token', text: 'Βρήκες κρυμμένο θησαυρό! Κερδίζεις +2 Glam Tokens.', free: true, reward: 2 },
];

export const EXTENDED_CHAOS_CARDS = [
  { id: 'ec1', title: 'The Sock Switch Heist', text: 'Έχεις 30″ να κλέψεις την κάλτσα της παίκτριας στα δεξιά σου χωρίς να σηκωθείς. Επιτυχία = +2 Tokens.', secs: 30 },
  { id: 'ec2', title: 'The Tied Step', text: 'Οι φτέρνες σου δένονται χαλαρά με σατέν ζώνη για 2 γύρους. Αν τερματίσεις έτσι, διπλοί πόντοι.', restraint: true },
  { id: 'ec3', title: 'The Tickle Trap', text: 'Η απέναντι σε γαργαλάει στα πέλματα για 15″ εκτός αν πληρώσεις 2 Tokens.', secs: 15, trap: true },
  { id: 'ec4', title: 'The Piggyback Penalty', text: 'Μετέφερε την παίκτρια στα αριστερά σου στην πλάτη μέχρι το επόμενο τετράγωνο.' },
  { id: 'ec5', title: 'The Blind Balance', text: 'Κλείσε τα μάτια και στάσου στο ένα πόδι για 20″. Αν πέσεις, 10″ γαργάλημα στα δάχτυλα.', secs: 20 },
  { id: 'ec6', title: 'The Hogtie Ransom', text: 'Hogtie για 45″. Η κάρτα ολοκληρώνεται με επιβεβαίωση της παίκτριας ή άμεσο STOP.', secs: 45, restraint: true },
  { id: 'ec7', title: 'The Feather Torture', text: 'Δεμένα χέρια πίσω, 20″ δοκιμασία με φτερό στις καμάρες. +2 Tokens αν ολοκληρωθεί.', secs: 20, restraint: true },
  { id: 'ec8', title: 'The Barefoot Walk', text: 'Βγάλε τις κάλτσες σου και περπάτα στις μύτες γύρω από το δωμάτιο ενώ οι άλλες σου πετούν μαξιλάρια. +2 Tokens.' },
  { id: 'ec9', title: 'The Double Trouble', text: 'Διάλεξε μια συμπαίκτρια. Δένεστε αστράγαλο με αστράγαλο για τους επόμενους 2 γύρους. +2 Tokens.', restraint: true },
  { id: 'ec10', title: 'The Chaos Card Draw', text: 'Τράβηξε αμέσως μία Chaos Card από το κρυφό deck!', giveChaos: true },
];

export const EXTENDED_SECRET_MISSIONS = [
  { id: 'em1', title: 'The Stealthy Sock', text: 'Βγάλε αθόρυβα την κάλτσα της παίκτριας στα αριστερά σου μέσα σε 10′ χωρίς να το καταλάβει.', reward: 3, mins: 10 },
  { id: 'em2', title: 'The Hidden Giggles', text: 'Κάνε την απέναντί σου να γελάσει δυνατά μέσα σε 1′ με μία μόνο γκριμάτσα.', reward: 2, mins: 1 },
  { id: 'em3', title: 'The Secret Token Transfer', text: 'Δωροδόκησε κρυφά μια συμπαίκτρια με ένα βλέμμα συνενοχής χωρίς να το πάρουν χαμπάρι οι άλλες.', reward: 2, mins: 8, bothReward: true },
  { id: 'em4', title: 'The Barefoot Frame', text: 'Πείσε μία παίκτρια να βγάλει τις κάλτσες της οικειοθελώς μέσα στα επόμενα 3 λεπτά.', reward: 3, mins: 3 },
  { id: 'em5', title: 'The Whisper Sabotage', text: 'Ψιθύρισε κάτι αστείο στο αυτί μιας παίκτριας την ώρα που προσπαθεί να μείνει σοβαρή σε δοκιμασία.', reward: 2, mins: 3 },
  { id: 'em6', title: 'The Pillow Thief', text: 'Κλέψε το μαξιλάρι της διπλανής σου και κάθισε πάνω του χωρίς να το προσέξει για 2 λεπτά.', reward: 2, mins: 2 },
  { id: 'em7', title: 'The Mirror Copy', text: 'Αντίγραψε κάθε κίνηση της αρχηγού του γύρου για 3 λεπτά χωρίς να σε καταλάβει.', reward: 3, mins: 3 },
  { id: 'em8', title: 'The Satin Knot', text: 'Δέσε κρυφά μία σατέν κορδέλα στον αστράγαλο της διπλανής σου ενώ μιλάει.', reward: 3, mins: 3 },
  { id: 'em9', title: 'The Forbidden Word', text: 'Κάνε μία παίκτρια να πει τη λέξη «Γαργάλημα» ή «Κάλτσα» μέσα σε 2 λεπτά.', reward: 2, mins: 2 },
  { id: 'em10', title: 'The Alliance', text: 'Συμφώνησε κρυφά με μία άλλη παίκτρια να ψηφίσετε το ίδιο άτομο στην επόμενη δοκιμασία.', reward: 2, mins: 10 },
];

// Act 2 — Midnight ASMR & Tickle Vault
export const BLIND_TEXTURES = [
  { id: 't1', name: 'The Satin Freeze', text: 'Παγάκι τυλιγμένο σε σατέν ύφασμα, πέρασμα στην καμάρα.' },
  { id: 't2', name: 'The Feather Tickle', text: 'Διπλό φτερό μαραμπού ανάμεσα στα δάχτυλα των ποδιών.' },
  { id: 't3', name: 'The Velvet Trace', text: 'Αργή διαδρομή με βελούδινη κορδέλα από τη φτέρνα ως τα δάχτυλα.' },
  { id: 't4', name: 'The Fingernail Whisper', text: 'Ελαφρύ χάιδεμα με την άκρη του νυχιού.' },
  { id: 't5', name: 'The Warm Oil Drop', text: 'Σταγόνα χλιαρού ελαίου μασάζ με κυκλικές κινήσεις στην πατούσα.' },
];

export const WHISPER_QUESTIONS = [
  'Ψιθύρισε ποιο είναι το πιο τρελό όνειρο ή φαντασίωση που είδες ποτέ και σε έκανε να ξυπνήσεις κόκκινη.',
  'Ποια από τις παρούσες θεωρείς ότι έχει το πιο ακαταμάχητο βλέμμα;',
  'Ποιο είναι το μεγαλύτερο ψέμα που έχεις πει ποτέ σε γονείς για να πας σε βραδινό πάρτι;',
  'Ψιθύρισε ποιο είναι το πιο ένοχο μυστικό σου σχετικά με το πώς περνάς τα βράδια μόνη σου στο σπίτι.',
  'Ποιο άτομο από το παρελθόν σου θα έστελνες μήνυμα απόψε αν ήξερες ότι δεν θα το μάθει κανείς;',
  'Ψιθύρισε ποια είναι η πιο ευαίσθητη ζώνη στο σώμα σου όταν σου κάνουν μασάζ.',
  'Ποιο είναι το πιο αμήχανο φλερτ που δέχτηκες ποτέ και προσποιήθηκες ότι δεν κατάλαβες;',
  'Ψιθύρισε ποια συμπαίκτρια πιστεύεις ότι θα σπάσει πρώτη στο επόμενο Act του Escape Room.',
];

export const ASMR_CLIPS = [
  { id: 'a1', say: 'Find the velvet key', keyword: 'Βελούδο', hint: 'Whisper' },
  { id: 'a2', say: 'Tickle the tied feet', keyword: 'Γαργάλημα', hint: 'ASMR Breath' },
  { id: 'a3', say: 'Hostage release code', keyword: 'Ομηρία', hint: 'Digital Glitch' },
  { id: 'a4', say: 'Midnight sock heist', keyword: 'Κάλτσες', hint: 'Soft Sound' },
  { id: 'a5', say: 'Vault is open six nine six nine', keyword: '6969', hint: 'Final Code Whisper' },
];

// Act 4 — Extended Morning Escape (4 ψήφια, ρυθμίζονται από τη διοργανώτρια)
export const MORNING_CLUES = [
  { id: 'k1', app: 'Look where the glitter shines, under the pinkest shade.', where: 'Κάτω από το ροζ βερνίκι νυχιών (αυτοκόλλητο με το 1ο ψηφίο).' },
  { id: 'k2', app: 'Where fluffy steps end, the secret begins.', where: 'Στη σόλα της πιο χνουδωτής παντόφλας (χαρτάκι με το 2ο ψηφίο).' },
  { id: 'k3', app: 'Blind eyes feel the truth.', where: 'Στην ετικέτα της τελευταίας μάσκας ύπνου (3ο ψηφίο).' },
  { id: 'k4', app: 'The currency of survival holds the final key.', where: 'Στην πίσω πλευρά του τελευταίου Glam Token (4ο ψηφίο).' },
];
export const DEFAULT_MORNING_CODE = '6969';

export const VIP_VAULT = [
  'Ποια είναι η πιο τολμηρή τοποθεσία στην οποία έχεις κάνει ποτέ hookup, χωρίς να σε πάρουν χαμπάρι;',
  'The Foot Glam Challenge: Διάλεξε μια συμπαίκτρια και κάνε της 20″ μασάζ πέλματος με ενυδατική κρέμα, ενώ της λες ένα πικάντικο κομπλιμέντο.',
  'Δείξε στις υπόλοιπες το πιο αστείο, παράξενο ή πικάντικο DM που έλαβες ποτέ από άγνωστο.',
  'Προτιμάς το γαργάλημα στα πέλματα ως αστεία τιμωρία ή ως παιχνίδι αίσθησης;',
  'Υπάρχει κάποιος πρώην φίλης σου ή γνωστός της παρέας που βρήκες ποτέ ελκυστικό; Ώρα για ομολογία χωρίς κρίση!',
  'The Blindfolded Dare: Φόρεσε τη μάσκα ύπνου. Οι υπόλοιπες ακουμπούν απαλά το χέρι τους στο πόδι σου. Μάντεψε ποια σε άγγιξε πρώτη.',
  'Ποια είναι η αγαπημένη σου "dirty" ατάκα ή τακτική φλερτ που πιάνει σχεδόν πάντα;',
  'The Silent Laugh Penalty: Μείνε εντελώς ανέκφραστη για 30″ ενώ οι υπόλοιπες σου κάνουν γκριμάτσες και απαλό γαργάλημα.',
  'Ποια ερωτική ταινία, σειρά ή anime έχεις παρακολουθήσει κρυφά πάνω από τρεις φορές;',
  'The Satin Hogtie Vote: Ποια από τις παρούσες θα εμπιστευόσουν περισσότερο να σε δέσει ως "VIP Hostage" για 5 λεπτά;',
  'Ποια είναι η μεγαλύτερη ανοησία που έχεις κάνει ποτέ από έρωτα ή πάθος;',
  'The Tickle Immunity Trade: Αν είχες 5 Glam Tokens τώρα, θα τα έδινες όλα για να σώσεις τη διπλανή σου από μια ποινή γαργαλητού;',
  'Ποια φαντασίωση από ρομαντικό βιβλίο ενηλίκων θα ήθελες να ζήσεις στην πραγματικότητα;',
  'The Sock Thief: Μέσα σε 10 δευτερόλεπτα βρες την πιο παράταιρη κάλτσα στο δωμάτιο και φόρεσέ την επιδεικτικά.',
  'The Whisper Challenge: Ψιθύρισε στο αυτί της παίκτριας στα αριστερά σου ένα μυστικό που δεν έχεις πει σε κανέναν άλλον εδώ μέσα.',
  'Ποιο είναι το πιο τοξικό "red flag" σε σύντροφο που εσύ προσωπικά βρίσκεις εκπληκτικά ελκυστικό;',
  'The Ultimate Pedi Check: Βγάλτε όλες τις κάλτσες. Ποια έχει τα πιο περιποιημένα νύχια πέλματος αυτή τη στιγμή; Ψηφίζει η ομάδα.',
  'The 3-Second Rule: Απάντησε σε 3″ — ποιον celebrity θα ήθελες κρυφά να σε κλειδώσει σε ένα Escape Room;',
  'The Foot Reflex Test: Άσε μια συμπαίκτρια να δοκιμάσει την ευαισθησία σου στην καμάρα με ένα φτερό για 10″ χωρίς να κουνηθείς.',
  'The Final Toast: Σήκωσε το ποτήρι (ή τον καφέ σου) και πες μια επική ευχή για τις επόμενες βραδιές pajama party της παρέας!',
];
