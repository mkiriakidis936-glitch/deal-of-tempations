// Pajama Lockdown: 18+ Girls-Only Escape Room (Master Specification).

export const LOCKDOWN_SECONDS = 60 * 60;
export const EXIT_CODE = '6969';
export const WRONG_ANSWER_PENALTY = 120; // +2 λεπτά
export const SURGE_BELOW = 10 * 60;
export const SURGE_BONUS = 5 * 60;

export const LOCKDOWN_MESSAGE =
  'The Pajama Lockdown Has Begun. Only the sharpest minds and most fearless girls will escape. Fail, and face the ultimate tickle penalty.';

export const BINDING_OPTIONS = [
  'Hogtie με σατέν ζώνες (χέρια & πόδια πίσω) + μάσκα ύπνου',
  'Χέρια ψηλά σε σταθερό σημείο, πόδια ενωμένα στις μύτες + μάσκα ύπνου',
];

// Level 1 — ερωτήσεις που απαντούν οι υπόλοιπες. Η διοργανώτρια κρίνει ✅/❌.
export const HOSTAGE_QUESTIONS = [
  'Ποια από τις παρούσες είπε πρώτη «ναι» σε αυτό το Lockdown;',
  'Τι χρώμα βερνίκι φοράει η Hostage στα νύχια των ποδιών;',
  'Ποιο τραγούδι έπαιζε όταν μπήκατε σήμερα στο σπίτι;',
  'Ποια είναι η πιο γαργαλιάρα της παρέας (απαντά η ομάδα ομόφωνα);',
  'Πόσα ζευγάρια παντόφλες υπάρχουν τώρα στο δωμάτιο;',
  'Ποια παίκτρια έχει γενέθλια πρώτη μετά από σήμερα;',
  'Τι ποτό/χυμό πίνει η Hostage απόψε;',
  'Ποιο είναι το πρώτο όνομα της Hostage ανάποδα;',
];
export const HOSTAGE_NEEDED = 5; // σωστές απαντήσεις για να ανοίξει το Level 1

export const CONFESSION_LOCK = [
  'Ποια είναι η πιο τρελή φαντασίωση που δεν έχεις τολμήσει;',
  'Ποιο είναι το πιο ένοχο μυστικό της παρέας που ξέρουν όλες;',
  'Ποια η πιο τολμηρή στιγμή που θα ξανάκανες;',
  'Ποια είναι η πιο αθυρόστομη ατάκα που έχεις πει ποτέ σε ραντεβού;',
];

export const SPICY_WHEEL = [
  'Η πρώτη εντύπωση: ποια από τις παρούσες είχες κρυφά αξιολογήσει ως «την πιο άτακτη» όταν τη γνώρισες;',
  'Taboo Fantasy: ποια είναι η πιο τολμηρή φαντασίωση που δεν έχεις ομολογήσει ποτέ σε σύντροφο;',
  'Red Flag: ποιο red flag συγχωρείς πιο εύκολα από όσο θα έπρεπε;',
  'Bad Habit: ποια είναι η πιο «e-stalking» συνήθεια που έχεις κάνει σε πρώην ή crush;',
  'The Turn-Off: τι σου ρίχνει τη λίμπιντο στο μηδέν σε ένα δευτερόλεπτο στο πρώτο ραντεβού;',
  'Secret Crush: υπάρχει κάποιος γνωστός που βρίσκεις καυτό και δεν το έχεις πει ποτέ εδώ μέσα;',
  'Truth or Dare: διάλεξε συμπαίκτρια, κάνε της 30″ γαργάλημα στα πέλματα όσο της λες ένα μεγάλο κομπλιμέντο.',
  'Awkward Moment: η πιο αμήχανη ή «καυτή» στιγμή που σε έπιασαν στα πράσα οι γονείς ή συγκάτοικος;',
  'Bad Romance: η πιο αστεία δικαιολογία που έχεις χρησιμοποιήσει για να φύγεις από ραντεβού;',
  'The Confession: με ποια celebrity θα άλλαζες ζωές για 24 ώρες για μια «wild» εμπειρία;',
  'Guilty Pleasure: ποιο ερωτικό μυθιστόρημα, ταινία ή σειρά σε έκανε να κοκκινίσεις περισσότερο;',
  'The Flirt: το πιο τολμηρό μήνυμα (DM) που έχεις στείλει ποτέ;',
  'Bad Decisions: η πιο τρελή παρόρμηση που έκανες επειδή ήσουν ξενυχτισμένη ή πιωμένη;',
  'The Foot Check: ποια είναι η πιο ευαίσθητη περιοχή στα πέλματά σου; Δείξε πού σε πιάνει πιο εύκολα το γαργάλημα.',
  'The Ultimate Secret: πες ένα μυστικό σου που δεν ξέρει κανείς από την οικογένειά σου.',
];
export const WHEEL_DECISION_SECONDS = 5;
export const WHEEL_PENALTY_SECONDS = 30;

// Level 2 — Blind Foot ID: υφή → ψηφίο (όπως στο PDF).
export const FOOT_ID = [
  { digit: '1', name: 'The Ice Melt', text: 'Παγάκι τυλιγμένο σε λεπτό σατέν, αργό πέρασμα στην καμάρα.' },
  { digit: '2', name: 'The Feather Whisper', text: 'Ελαφρύ, σχεδόν αόρατο φτερό μαραμπού στα δάχτυλα των ποδιών.' },
  { digit: '3', name: 'The Velvet Trap', text: 'Βελούδινη κορδέλα από τη φτέρνα ως τα δάχτυλα.' },
  { digit: '4', name: 'The Fingernail Trace', text: 'Αργή διαδρομή με την άκρη του νυχιού κατά μήκος του πέλματος.' },
  { digit: '5', name: 'The Warm Touch', text: 'Σταγόνα ζεστού ελαίου massage και κυκλικές κινήσεις στην πατούσα.' },
  { digit: '6', name: 'The Woolen Sock Brush', text: 'Τρίψιμο με χοντρή μάλλινη κάλτσα στα ευαίσθητα σημεία.' },
  { digit: '7', name: 'The Double Tap', text: 'Απαλό τσίμπημα με δύο δάχτυλα ανάμεσα στα δάχτυλα των ποδιών.' },
  { digit: '8', name: 'The Satin Glide', text: 'Γρήγορο τράβηγμα σατέν ζώνης διαγώνια από την πατούσα.' },
  { digit: '9', name: 'The Breath Play', text: 'Απαλό φύσημα με ζεστή ανάσα και ελαφρύ άγγιγμα στα δάχτυλα.' },
  { digit: '0', name: 'The Multi-Textured Combo', text: 'Φτερό και παγάκι ταυτόχρονα, αριστερό και δεξί πόδι.' },
];

export const WHISPER_CLUES = [
  { say: 'Find the velvet key', keyword: 'Βελούδο' },
  { say: 'Tickle the tied feet', keyword: 'Γαργάλημα' },
  { say: 'Hostage release code', keyword: 'Ομηρία' },
  { say: 'Midnight sock heist', keyword: 'Κάλτσες' },
  { say: 'Vault is open', keyword: '6969' },
];

export const SOCK_HEIST_SECONDS = 120;

export const MINI_GAMES = [
  { id: 'glitch', icon: '👾', name: 'The Glitch Cipher', desc: 'Αποκρυπτογράφησε τη λέξη σε 45″.', fail: 'Λάθος: +1 λεπτό & 10″ απαλό γαργάλημα στη Hostage.', failSecs: 60 },
  { id: 'hold', icon: '🤝', name: 'The Swipe & Hold', desc: 'Δύο παίκτριες κρατούν ταυτόχρονα 15″ (δάχτυλα ποδιών ή μύτη παντόφλας).', fail: 'Αν σηκωθεί το χέρι/πόδι, ξαναρχίζει το μέτρημα.', failSecs: 0 },
  { id: 'memory', icon: '🧠', name: 'Midnight Memory Grid', desc: 'Ξαναπάτα τα εικονίδια με τη σωστή σειρά.', fail: 'Αποτυχία: 15″ ποινή στο Blind Foot ID της Hostage.', failSecs: 0 },
  { id: 'truth', icon: '⚡', name: 'Rapid-Fire Truth Tap', desc: '5 σωστά True/False σε 20″.', fail: 'Έστω και ένα λάθος: ενεργοποιείται ο Spicy Truth Wheel.', failSecs: 0, wheel: true },
  { id: 'decibel', icon: '🤫', name: 'The Decibel Challenge', desc: '30″ απόλυτη σιωπή (ακόμα και με γαργάλημα).', fail: 'Αν κάποια γελάσει ή μιλήσει: +3 λεπτά στο timer.', failSecs: 180 },
  { id: 'lockpick', icon: '🔐', name: 'The Virtual Lockpick', desc: 'Βρες τον συνδυασμό ακούγοντας τα «click».', fail: '', failSecs: 0 },
  { id: 'socks', icon: '🧦', name: 'The Sock Match Puzzle', desc: 'Βρες 2 ζευγάρια σε 30″ ενώ μια παίκτρια ψάχνει τις πραγματικές κάλτσες στα τυφλά.', fail: '', failSecs: 0 },
  { id: 'slider', icon: '🎚️', name: 'Danger Zone Slider', desc: 'Σύρε το Tickle Intensity ακριβώς στο 7 σε 5″.', fail: 'Λάθος: 30″ ομαδικό γαργάλημα.', failSecs: 0 },
  { id: 'shake', icon: '📳', name: 'The Secret Shake Test', desc: 'Κουνήστε δυνατά το κινητό 10″ συγχρονισμένα.', fail: '', failSecs: 0 },
  { id: 'cipher', icon: '🔢', name: 'Final Countdown Cipher', desc: 'Λύσε τον γρίφο με τα εικονίδια.', fail: '', failSecs: 0 },
];

export const TRUE_FALSE = [
  ['Το παγάκι λιώνει πιο γρήγορα σε ζεστό δωμάτιο.', true],
  ['Το σατέν είναι ύφασμα από φυσικό φτερό.', false],
  ['Η base coat μπαίνει πριν το χρώμα του βερνικιού.', true],
  ['Το μαραμπού είναι είδος φτερού.', true],
  ['Το βελούδο είναι πιο τραχύ από το μαλλί.', false],
  ['Οι παντόφλες φοριούνται συνήθως στα χέρια.', false],
  ['Το top coat βάζει λάμψη και προστατεύει το βερνίκι.', true],
  ['Ένα ζευγάρι κάλτσες έχει 3 κάλτσες.', false],
  ['Το Escape Room λύνεται με συνεργασία.', true],
  ['Το 6969 διαβάζεται ίδιο ανάποδα αν γυρίσεις το κείμενο ανάποδα.', true],
];
