import { PAJAMA_ACTS } from '@/data/pajamaProgram';

// Περιεχόμενο του /site για κάθε event. Όλα επεξεργάζονται από Admin → 🌐 Site & Σενάριο.
export const SITE_EVENTS = [
  { id: 'heist', label: '🚨 HEIST NIGHT' },
];

const PAJAMA_PROGRAM = PAJAMA_ACTS.map((a) => ({
  roman: a.roman,
  title: a.title,
  subtitle: a.subtitle,
  meta: `${a.minutes}′${a.breakMinutes ? ` · +${a.breakMinutes}′ διάλειμμα` : ''}`,
  group: a.zone === 'night' ? 'Νύχτα' : 'Πρωί',
  lines: a.brief,
}));

export const DEFAULT_SITE = {
  heist: {
    tab: 'Heist Night',
    overline: 'Heist Night · 18+',
    titleLines: ['DEAL OF', 'TEMPTATION'],
    tagline: 'Μια βραδιά με κάρτες, ένταση και υποχρεώσεις που δεν διάβασες πριν φτάσεις.',
    date: '',
    cta: { label: 'ΚΛΕΙΣΕ ΘΕΣΗ', path: '/forms?mode=arrest_heist' },
    scenarioKicker: 'Το παιχνίδι',
    scenarioTitle: 'ΤΙ ΕΙΝΑΙ ΤΟ HEIST NIGHT',
    scenario: [
      'Κλειστή βραδιά παιχνιδιού για καλεσμένες. Δύο ομάδες, Alpha και Beta, παίζουν πάνω σε ψηφιακό ταμπλό με κάρτες, challenges και ποινές που ανεβαίνουν στάδιο με στάδιο.',
      'Το σενάριο: μια μεγάλη ληστεία είναι σε εξέλιξη και η αστυνομία πλησιάζει. Κάθε επιλογή σου αφήνει σημάδι — Wanted stars, Loot και ένα Grand Heist Escape για όποια ομάδα προλάβει.',
      'Δεν μαθαίνεις τι θα σου ζητηθεί πριν μπεις. Οι κανόνες και τα όρια ορίζονται πριν ξεκινήσουμε και η λέξη-στοπ σταματά τα πάντα.',
    ],
    highlights: ['2 ομάδες, 1 ταμπλό', 'Κάρτες & challenges', 'Wanted stars & Loot', 'Grand Heist Escape'],
    videoKicker: 'Το τρέιλερ',
    videoTitle: '30 ΔΕΥΤΕΡΟΛΕΠΤΑ ΑΠΟ ΤΗ ΝΥΧΤΑ',
    programKicker: 'Πώς παίζεται',
    programTitle: 'ΤΕΣΣΕΡΑ ΒΗΜΑΤΑ',
    programNote: 'Καμία λεπτομέρεια δεν ταξιδεύει πριν τη βραδιά.',
    program: [
      { roman: 'I', title: 'Παίρνεις το γράμμα', subtitle: '', meta: '', group: '', lines: ['Ένα link, τίποτα άλλο. Ανοίγει μόνο για όσες είναι καλεσμένες.'] },
      { roman: 'II', title: 'Υπογράφεις', subtitle: '', meta: '', group: '', lines: ['Λίγα στοιχεία και μία επιβεβαίωση. Από εκείνη τη στιγμή η θέση σου είναι κλειδωμένη.'] },
      { roman: 'III', title: 'Έρχεσαι', subtitle: '', meta: '', group: '', lines: ['Το βράδυ του event, στο σπίτι. Καμία λεπτομέρεια δεν ταξιδεύει σε μήνυμα πριν.'] },
      { roman: 'IV', title: 'Η σφραγίδα σπάει', subtitle: '', meta: '', group: '', lines: ['Ό,τι είναι να γίνει, γίνεται εκεί μπροστά σε όλες.'] },
    ],
    info: [
      { title: 'Πότε', text: '{date}' },
      { title: 'Πού', text: 'Ιδιωτικός χώρος — η διεύθυνση στέλνεται με την επιβεβαίωση' },
      { title: 'Dress code', text: 'Μαύρο ή ό,τι σε κάνει να νιώθεις επικίνδυνη.' },
      { title: 'Τι φέρνεις', text: 'Τον εαυτό σου και διάθεση για παιχνίδι.' },
    ],
    participation: 'Κλειστή λίστα, 18+, λίγες θέσεις. Η κράτηση γίνεται σε λίγα λεπτά — μόνο τα βασικά.',
    faq: [
      { q: 'Τι είναι ακριβώς;', a: 'Μια βραδιά παιχνιδιού με κάρτες, ομάδες και υποχρεώσεις. Κλειστή λίστα καλεσμένων, 18+.' },
      { q: 'Κανόνες συμπεριφοράς', a: 'Όρια δηλώνονται πριν ξεκινήσουμε και γίνονται σεβαστά. Υπάρχει λέξη-στοπ που σταματά τα πάντα αμέσως, χωρίς εξηγήσεις.' },
      { q: 'Τηλέφωνα και φωτογραφίες', a: 'Ό,τι λέγεται στο τραπέζι δεν βγαίνει από το τραπέζι.' },
      { q: 'Πώς κλείνω θέση;', a: 'Συμπληρώνεις τη φόρμα. Η θέση επιβεβαιώνεται και λαμβάνεις τη διεύθυνση και τις τελευταίες λεπτομέρειες.' },
    ],
  },

  pajama: {
    tab: 'Pajama Pedi-Glam · 5H',
    overline: 'Pajama Pedi-Glam · Night & Morning · 18+',
    titleLines: ['PAJAMA PEDI-GLAM', '5H OVERNIGHT'],
    tagline: 'Μια βραδιά με πιτζάμες, παντόφλες και υποχρεώσεις που δεν διάβασες πριν φτάσεις.',
    date: '',
    cta: { label: 'ΚΛΕΙΣΕ ΘΕΣΗ', path: '/forms?mode=pajama' },
    scenarioKicker: 'Το παιχνίδι',
    scenarioTitle: 'ΤΙ ΕΙΝΑΙ ΤΟ PAJAMA PEDI-GLAM',
    scenario: [
      'Μια βραδιά και ένα πρωί στο σπίτι, με τις πιο χουχουλιάρες πιτζάμες και παντόφλες. Παίζετε πάνω σε ψηφιακό ταμπλό 44 κουτιών με κάρτες, challenges, κρυφά σαμποτάζ και εξομολογήσεις.',
      'Το σενάριο: κάθε πράξη φέρνει νέους κανόνες, ποινές και ανατροπές. Κάπου ανάμεσά σας κρύβεται μια Σαμποτέρ, και το πρωί αποκαλύπτεται ποια ήταν.',
      'Η παίκτρια με τους περισσότερους πόντους στέφεται «Βασίλισσα του Pedi-Glam». Όρια δηλώνονται πριν ξεκινήσουμε και η λέξη-στοπ σταματά τα πάντα.',
    ],
    highlights: ['Νύχτα & πρωί, 7 πράξεις', 'Ταμπλό 44 κουτιών', 'Κρυφά σαμποτάζ', 'Βασίλισσα του Pedi-Glam'],
    videoKicker: 'Το τρέιλερ',
    videoTitle: '30 ΔΕΥΤΕΡΟΛΕΠΤΑ ΑΠΟ ΤΗ ΝΥΧΤΑ',
    programKicker: 'Πρόγραμμα',
    programTitle: 'ΕΠΤΑ ΠΡΑΞΕΙΣ',
    programNote: 'Συνολική διάρκεια 5 ώρες, με διαλείμματα.',
    program: PAJAMA_PROGRAM,
    info: [
      { title: 'Πότε', text: '{date}' },
      { title: 'Πού', text: 'Ιδιωτικός χώρος — η διεύθυνση στέλνεται με την επιβεβαίωση' },
      { title: 'Dress code', text: 'Πιτζάμες. Μαύρο προαιρετικό, άνετο υποχρεωτικό.' },
      { title: 'Τι φέρνεις', text: 'Τις δικές σου παντόφλες και φρέσκο μανικιούρ.' },
    ],
    participation: 'Κλειστή λίστα, 18+, λίγες θέσεις. Η κράτηση γίνεται σε 5 λεπτά — μόνο τα βασικά.',
    faq: [
      { q: 'Τι είναι ακριβώς;', a: 'Μια βραδιά παιχνιδιού με πιτζάμες, κάρτες και υποχρεώσεις. Κλειστή λίστα καλεσμένων, 18+, καμία δεν ξέρει τα υπόλοιπα πριν φτάσει.' },
      { q: 'Πόσο διαρκεί;', a: 'Επτά πράξεις: τέσσερις το βράδυ και τρεις το πρωί, με διαλείμματα. Μπορείς να μείνεις και για ύπνο.' },
      { q: 'Τι πρέπει να φέρω;', a: 'Πιτζάμες, τις δικές σου παντόφλες και φρέσκο μανικιούρ. Αν δεν φέρεις παντόφλες, το παιχνίδι σου δίνει δικές του — και δεν είναι καλό νέο.' },
      { q: 'Κανόνες συμπεριφοράς', a: 'Όρια δηλώνονται πριν ξεκινήσουμε και γίνονται σεβαστά. Υπάρχει safe word που σταματά τα πάντα αμέσως, χωρίς εξηγήσεις.' },
      { q: 'Τηλέφωνα και φωτογραφίες', a: 'Τα τηλέφωνα μένουν κλειστά στη διάρκεια του παιχνιδιού. Ό,τι λέγεται στο τραπέζι δεν βγαίνει από το τραπέζι.' },
      { q: 'Πώς κλείνω θέση;', a: 'Συμπληρώνεις τη φόρμα σε 5 λεπτά. Η θέση επιβεβαιώνεται και λαμβάνεις τη διεύθυνση και τις τελευταίες λεπτομέρειες.' },
    ],
  },
};


// ---------- Τα 5 νέα ψηφιακά modes ----------
const modeInfo = (dress, bring) => [
  { title: 'Πότε', text: '{date}' },
  { title: 'Πού', text: 'Ιδιωτικός χώρος — η διεύθυνση στέλνεται με την επιβεβαίωση' },
  { title: 'Dress code', text: dress },
  { title: 'Τι φέρνεις', text: bring },
];
const modeFaq = (what, duration) => [
  { q: 'Τι είναι ακριβώς;', a: what },
  { q: 'Πόσο διαρκεί;', a: duration },
  { q: 'Πρέπει να έχω κινητό;', a: 'Ναι. Το παιχνίδι είναι 100% ψηφιακό: το tablet το διευθύνει η οικοδέσποινα, η τηλεόραση δείχνει το σκορ και κάθε κινητό δείχνει τις προσωπικές σου αποστολές.' },
  { q: 'Κανόνες & όρια', a: 'Μόνο ενήλικες (18+) που συμφωνούν να παίξουν. Τα όρια δηλώνονται στη φόρμα και γίνονται σεβαστά. Υπάρχει κουμπί ΣΤΟΠ σε κάθε κινητό: όλα σταματούν αμέσως, χωρίς εξηγήσεις.' },
  { q: 'Μπορώ να διαλέξω mode;', a: 'Στη φόρμα επιλέγεις ένα Mode ανά υποβολή.' },
  { q: 'Πώς κλείνω θέση;', a: 'Συμπληρώνεις τη φόρμα σε 3 λεπτά. Η θέση επιβεβαιώνεται και παίρνεις τη διεύθυνση και τις τελευταίες λεπτομέρειες.' },
];

SITE_EVENTS.push(
  { id: 'lockdown', label: '🚨 PAJAMA LOCKDOWN' },
  { id: 'beachbar', label: '🍹 BEACH BAR HOME LOCKDOWN' },
  { id: 'marathon4h', label: '🚔 PAJAMA HEIST & ARREST' },
);

Object.assign(DEFAULT_SITE, {
  lockdown: {
    tab: 'Pajama Lockdown',
    overline: 'Pajama Lockdown · 18+ Girls-Only Escape Room',
    titleLines: ['PAJAMA', 'LOCKDOWN'],
    tagline: '60 λεπτά. Ένα κλειδωμένο κινητό. Μόνο οι πιο έξυπνες και τολμηρές θα αποδράσουν.',
    date: '',
    cta: { label: 'ΚΛΕΙΣΕ ΘΕΣΗ', path: '/forms?mode=lockdown' },
    scenarioKicker: 'Το παιχνίδι',
    scenarioTitle: 'ΤΙ ΕΙΝΑΙ ΤΟ PAJAMA LOCKDOWN',
    scenario: [
      'Ένα 100% ψηφιακό escape room 60 λεπτών, μόνο για γυναίκες 18+. Με το που ανοίγει η εφαρμογή, η οθόνη γίνεται κατάμαυρη με κόκκινα neon, ηχεί συναγερμός και ξεκινά αντίστροφη μέτρηση.',
      'Σε τρία επίπεδα λύνετε γρίφους, αισθησιακά τεστ υφής, ψιθύρους ASMR και φυσικές δοκιμασίες συνεργασίας. Κάθε λάθος σας κοστίζει χρόνο.',
      'Αν συμπληρώσετε τον 4ψήφιο κωδικό πριν μηδενιστεί το ρολόι, ξεκλειδώνει το VIP Vault. Αν όχι, σας περιμένει η απόλυτη ποινή.',
    ],
    highlights: ['60 λεπτά, 3 επίπεδα', '10 ψηφιακά mini-games', 'Spicy Truth Wheel', 'VIP Vault'],
    videoKicker: 'Το τρέιλερ',
    videoTitle: '30 ΔΕΥΤΕΡΟΛΕΠΤΑ ΑΠΟ ΤΟ LOCKDOWN',
    programKicker: 'Πώς παίζεται',
    programTitle: 'ΤΡΙΑ ΕΠΙΠΕΔΑ',
    programNote: 'Το ρολόι δεν σταματά, εκτός αν πει κάποια ΣΤΟΠ.',
    program: [
      { roman: 'I', title: 'The Hostage Sacrifice', subtitle: '', meta: '', group: '', lines: ['Η ομάδα διαλέγει μία «Hostage». Οι υπόλοιπες απαντούν στις ερωτήσεις της οθόνης. Κάθε λάθος βάζει +2′ ποινή.'] },
      { roman: 'II', title: 'The 18+ Sensory Cipher', subtitle: '', meta: '', group: '', lines: ['Blind Foot ID, Secret Confession Lock και Audio Whisper Clue. Τρεις δοκιμασίες, τρία ψηφία.'] },
      { roman: 'III', title: 'The Sabotage Override', subtitle: '', meta: '', group: '', lines: ['Midnight Sock Heist: 2 λεπτά χαοτικής μάχης κλοπής καλτσών, και μετά ο Exit Code.'] },
    ],
    info: modeInfo('Πιτζάμες. Μαύρο ή κόκκινο είναι ευπρόσδεκτο.', 'Παράταιρες κάλτσες, μάσκα ύπνου, σατέν κορδέλες και κινητό με φόρτιση.'),
    participation: 'Κλειστή λίστα, 18+, λίγες θέσεις. Στη φόρμα δηλώνεις και τα όριά σου.',
    faq: modeFaq('Ένα ψηφιακό escape room 18+ με γρίφους, φυσικές δοκιμασίες και χρονόμετρο.', 'Το Lockdown διαρκεί 60 λεπτά.'),
  },
  pedi_glam: {
    tab: 'Pajama Pedi-Glam',
    overline: 'Pajama Pedi-Glam · 18+',
    titleLines: ['PAJAMA', 'PEDI-GLAM'],
    tagline: '90 λεπτά ψηφιακού Pedi-Care, ASMR, Glam Tokens και εξομολογήσεων.',
    date: '',
    cta: { label: 'ΚΛΕΙΣΕ ΘΕΣΗ', path: '/forms?mode=pedi_glam' },
    scenarioKicker: 'Το παιχνίδι',
    scenarioTitle: 'ΤΙ ΕΙΝΑΙ ΤΟ PAJAMA PEDI-GLAM',
    scenario: [
      'Μία ψηφιακή εμπειρία 90 λεπτών με Pedi-Care και Glam Tokens.',
      'Η ροή συνδυάζει ASMR, μάσκες, φτερά και κρέμες.',
      'Οι παίκτριες συμμετέχουν σε ψηφιακές κάρτες και εξομολογήσεις.'
    ],
    highlights: ['90 λεπτά', 'Pedi-Care', 'ASMR & αισθητηριακές δοκιμές', 'Glam Tokens & εξομολογήσεις'],
    videoKicker: 'Η εμπειρία',
    videoTitle: 'PAJAMA PEDI-GLAM',
    programKicker: 'Ροή παιχνιδιού',
    programTitle: 'ΔΥΟ ΠΡΑΞΕΙΣ',
    programNote: 'Συνολική διάρκεια 90 λεπτά.',
    program: [
      { roman: 'I', title: 'Glam & Chaos Board', subtitle: '', meta: '60′', group: '', lines: ['Ψηφιακό ταμπλό, Pedi-Care, κάρτες και Glam Tokens.'] },
      { roman: 'II', title: 'Midnight ASMR', subtitle: '', meta: '30′', group: '', lines: ['ASMR, αισθητηριακές δοκιμές και εξομολογήσεις.'] }
    ],
    info: modeInfo('Πιτζάμες και άνετα ρούχα.', 'Κινητό με φόρτιση.'),
    participation: 'Κλειστή λίστα, 18+. Στη φόρμα δηλώνεις τα όριά σου.',
    faq: modeFaq('Ψηφιακή εμπειρία Pedi-Care με ASMR, Glam Tokens και εξομολογήσεις.', '90 λεπτά.')
  },
  pedi_extended: {
    tab: 'Pedi-Glam Extended',
    overline: 'Pajama Pedi-Glam Extended · 18+',
    titleLines: ['PAJAMA PEDI-GLAM', 'EXTENDED'],
    tagline: '2–2,5 ώρες με διαδοχικές κάρτες, mini-games, χρονόμετρα και κλιμακούμενες προκλήσεις.',
    date: '',
    cta: { label: 'ΚΛΕΙΣΕ ΘΕΣΗ', path: '/forms?mode=pedi_extended' },
    scenarioKicker: 'Το παιχνίδι',
    scenarioTitle: 'ΤΙ ΕΙΝΑΙ ΤΟ PEDI-GLAM EXTENDED',
    scenario: [
      'Η εκτεταμένη εκδοχή του Pedi-Glam διαρκεί 2–2,5 ώρες.',
      'Οι παίκτριες προχωρούν σε διαδοχικές κάρτες και ψηφιακά mini-games με χρονόμετρα.',
      'Οι προκλήσεις κλιμακώνονται σταδιακά μέσα από την κοινή ροή του παιχνιδιού.'
    ],
    highlights: ['2–2,5 ώρες', 'Διαδοχικές κάρτες', 'Ψηφιακά mini-games', 'Χρονόμετρα & κλιμακούμενες προκλήσεις'],
    videoKicker: 'Η εμπειρία',
    videoTitle: 'PEDI-GLAM EXTENDED',
    programKicker: 'Ροή παιχνιδιού',
    programTitle: 'ΔΙΑΔΟΧΙΚΕΣ ΠΡΟΚΛΗΣΕΙΣ',
    programNote: 'Η διάρκεια κυμαίνεται από 2 έως 2,5 ώρες.',
    program: [
      { roman: 'I', title: 'Κάρτες', subtitle: '', meta: '', group: '', lines: ['Διαδοχικές κάρτες Pedi-Glam.'] },
      { roman: 'II', title: 'Mini-games', subtitle: '', meta: '', group: '', lines: ['Ψηφιακά mini-games με χρονόμετρα.'] },
      { roman: 'III', title: 'Κλιμάκωση', subtitle: '', meta: '', group: '', lines: ['Οι προκλήσεις προχωρούν με αυξανόμενη ένταση.'] }
    ],
    info: modeInfo('Πιτζάμες και άνετα ρούχα.', 'Κινητό με φόρτιση.'),
    participation: 'Κλειστή λίστα, 18+. Στη φόρμα δηλώνεις τα όριά σου.',
    faq: modeFaq('Εκτεταμένη ψηφιακή εμπειρία Pedi-Glam με κάρτες, mini-games και χρονόμετρα.', '2–2,5 ώρες.')
  },
  marathon4h: {
    tab: 'Pajama Heist & Arrest',
    overline: 'The Ultimate Lounge Lockdown · 18+',
    titleLines: ['PAJAMA HEIST', '& ARREST'],
    tagline: 'Αστυνόμος, Fugitives, χειροπέδες, σαγιονάρες και ένα ταμπλό που δεν συγχωρεί.',
    date: '',
    cta: { label: 'ΚΛΕΙΣΕ ΘΕΣΗ', path: '/forms?mode=marathon_4h' },
    scenarioKicker: 'Το παιχνίδι',
    scenarioTitle: 'ΤΙ ΕΙΝΑΙ ΤΟ PAJAMA HEIST & ARREST',
    scenario: [
      'Ζωντανή τηλεοπτική παραγωγή σε 3 οθόνες: TV με ταμπλό 21 τετραγώνων, Tablet διευθύντριας και τα κινητά σας.',
      'Σε κάθε γύρο μία γίνεται Police Chief με το κλειδί των χειροπέδων· οι υπόλοιπες είναι Fugitives.',
      'Wanted αστέρια, Loot, σαγιονάρες και κάλτσες ως «ζωές», ανάκριση με μυστική ψηφοφορία, Decibel Meter και το μεγάλο φινάλε The Barefoot Escape.'
    ],
    highlights: ['105 λεπτά', 'Ταμπλό 21 τετραγώνων', 'Deck 36 καρτών', 'Ανάκριση & Decibel Meter', 'Barefoot Escape & στέμμα'],
    videoKicker: 'Η εμπειρία',
    videoTitle: 'PAJAMA HEIST & ARREST',
    programKicker: 'Ροή παιχνιδιού',
    programTitle: 'ΤΕΣΣΕΡΙΣ ΦΑΣΕΙΣ',
    programNote: 'Συνολική διάρκεια 105 λεπτά.',
    program: [
      { roman: 'I', title: 'Warm-up & Slipper Grabbing', subtitle: '', meta: '15′', group: '', lines: ['Dress code, πρώτοι γύροι, κλοπές σαγιονάρας.'] },
      { roman: 'II', title: 'The Handcuff Escalation', subtitle: '', meta: '30′', group: '', lines: ['Χειροπέδες, συνένοχοι και η καρέκλα ανάκρισης.'] },
      { roman: 'III', title: 'The Lockdown & Decibel Torture', subtitle: '', meta: '45′', group: '', lines: ['Βαριά δεσίματα και γαργάλημα με Decibel Meter.'] },
      { roman: 'IV', title: 'The Barefoot Escape & Crown', subtitle: '', meta: '15′', group: '', lines: ['Γρίφος στα κινητά και στέψη της βασίλισσας.'] }
    ],
    info: modeInfo('Πιτζάμες, χοντρές πιτζαμοκάλτσες και υποχρεωτικά σαγιονάρες.', 'Κινητό με φόρτιση.'),
    participation: 'Κλειστή λίστα, 18+. Στη φόρμα δηλώνεις τα όριά σου. Το ΣΤΟΠ και η λέξη ασφαλείας ισχύουν πάντα.',
    faq: modeFaq('Παιχνίδι ταμπλό με ρόλους Αστυνόμου/Fugitives, Wanted αστέρια, χειροπέδες, ανάκριση και φινάλε Barefoot Escape.', '105 λεπτά.')
  },
  beachbar: {
    tab: 'Beach Bar Lockdown',
    overline: 'Beach Bar Lockdown · Shots, Flip-Flops & Tickle Chaos · 18+',
    titleLines: ['BEACH BAR', 'LOCKDOWN'],
    tagline: 'Σαγιονάρες, χορός, ποτό και ένας τροχός που δεν συγχωρεί.',
    date: '',
    cta: { label: 'ΚΛΕΙΣΕ ΘΕΣΗ', path: '/forms?mode=beach_bar' },
    scenarioKicker: 'Το παιχνίδι',
    scenarioTitle: 'ΤΙ ΕΙΝΑΙ ΤΟ BEACH BAR LOCKDOWN',
    scenario: [
      'Ένα καλοκαιρινό VIP beach bar μέσα στο σαλόνι. Όλες ξεκινάτε φορώντας μόνο σαγιονάρες και άνετα ρούχα, και η εφαρμογή παίζει την μουσική.',
      'Όταν η μουσική σταματά με κόρνα, η τελευταία που θα εκτελέσει την εντολή χάνει και γυρίζει τον Τροχό Ποινών: δεσίματα, hogtie και γαργάλημα. Ανάμεσα στους γύρους η οθόνη πετάει 18+ ερωτήσεις: αλήθεια ή διπλό σφηνάκι.',
      'Κρυφές αποστολές στο κινητό σε σπρώχνουν να κλέψεις σαγιονάρες. Όσες τις έχουν χάσει παίζουν τον τελικό: The Last Queen Standing.',
    ],
    highlights: ['Dance & Freeze', 'Τροχός Ποινών', 'Shot & Truth', 'Beach Queen'],
    videoKicker: 'Το τρέιλερ',
    videoTitle: '30 ΔΕΥΤΕΡΟΛΕΠΤΑ ΑΠΟ ΤΟ BEACH BAR',
    programKicker: 'Ροή βραδιάς',
    programTitle: 'ΠΕΝΤΕ ΦΑΣΕΙΣ',
    programNote: 'Συνολική διάρκεια 2–3 ώρες. Το αλκοόλ είναι προαιρετικό: υπάρχει και εκδοχή χωρίς αλκοόλ.',
    program: [
      { roman: 'I', title: 'Check-in', subtitle: '', meta: '', group: '', lines: ['Φοράτε σαγιονάρες και επιβεβαιώνετε ότι είστε έτοιμες.'] },
      { roman: 'II', title: 'Dance & Freeze', subtitle: '', meta: '', group: '', lines: ['Χορός. Όταν ακούσετε την κόρνα, εκτελείτε την εντολή. Η τελευταία χάνει.'] },
      { roman: 'III', title: 'Ο Τροχός Ποινών', subtitle: '', meta: '', group: '', lines: ['Τέσσερις κατηγορίες: χορός, δέσιμο, hogtie και διλήμματα.'] },
      { roman: 'IV', title: 'Shot & Truth', subtitle: '', meta: '', group: '', lines: ['Απαντάς σε 5″ ή πίνεις διπλό σφηνάκι.'] },
      { roman: 'V', title: 'The Last Queen Standing', subtitle: '', meta: '', group: '', lines: ['Τελικός 3 λεπτών. Η Beach Queen διαλέγει την τελική δοκιμασία.'] },
    ],
    info: modeInfo('Καλοκαιρινό: σαγιονάρες, άνετα ρούχα, μαγιό ή κάτι δροσερό.', 'Σαγιονάρες (υποχρεωτικές), μεγάλη διάθεση και κινητό με φόρτιση.'),
    participation: 'Κλειστή λίστα, 18+, λίγες θέσεις. Στη φόρμα δηλώνεις αν πίνεις αλκοόλ και τα όριά σου.',
    faq: modeFaq('Ένα beach bar party game με χορό, ποτό, σαγιονάρες και ποινές. Κλειστή λίστα, 18+.', 'Διαρκεί 2–3 ώρες.'),
  },
});

let overrides = {};
export const setSiteOverrides = (o) => { overrides = o && typeof o === 'object' ? o : {}; };

// Αρχικά + ό,τι έχεις αλλάξει από το Admin
export function getSiteContent(ev) {
  const id = DEFAULT_SITE[ev] ? ev : 'heist';
  const d = DEFAULT_SITE[id];
  const o = overrides[id] || {};
  const merged = { ...d, ...o, cta: { ...d.cta, ...(o.cta || {}) } };
  for (const k of ['scenario', 'highlights', 'program', 'info', 'faq', 'titleLines']) {
    if (!Array.isArray(merged[k])) merged[k] = d[k];
  }
  return merged;
}
