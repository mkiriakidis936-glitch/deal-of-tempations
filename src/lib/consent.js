// Consent check-in ανά παίκτρια για τα ψηφιακά modes.
// Καθαρό module (χωρίς browser εξαρτήσεις) ώστε να το χρησιμοποιούν και ο server και τα tests.
// Το φίλτρο είναι αυτόματο, με λέξεις-κλειδιά: δεν αντικαθιστά τον έλεγχο της διοργανώτριας ούτε το ΣΤΟΠ/PASS.

// Τα regex γράφονται χωρίς τόνους και με πεζά· το κείμενο περνά από fold() πριν ελεγχθεί (ώστε «Γαργάλημα» = «γαργαλημα»).
export const fold = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ς/g, 'σ').toLowerCase();

export const CONSENT_OPTIONS = [
  { id: 'touch', label: 'Χωρίς σωματική επαφή / άγγιγμα', re: /αγγιγ|αγγιζ|ακουμπ|touch|massage|μασαζ|γαργαλ|tickle|αγκαλ|φιλι/ },
  { id: 'alcohol', label: 'Χωρίς αλκοόλ', re: /σφηνακ|\bshots?\b|αλκοολ|alcohol|κρασι|μπυρα|cocktail|κοκτειλ/ },
  { id: 'camera', label: 'Χωρίς φωτογραφίες / βίντεο', re: /φωτογραφ|selfie|βιντεο|video|photo|ηχογραφ|story/ },
  { id: 'personal', label: 'Χωρίς προσωπικές ερωτήσεις / εξομολογήσεις', re: /εξομολογ|confess|αληθει|truth|προσωπικ|μυστικ|18\+/ },
  { id: 'physical', label: 'Χωρίς σωματικές προκλήσεις (χορός, ισορροπία)', re: /χορευ|χορεψ|χορο|dance|freeze|ισορροπ|τρεξ|push.?up|squat|ακινησ|γονατ/ },
];
export const CONSENT_IDS = CONSENT_OPTIONS.map((option) => option.id);

export const consentOf = (mg, playerId) => {
  const entry = mg?.consent?.players?.[playerId];
  return {
    optOuts: Array.isArray(entry?.optOuts) ? entry.optOuts.filter((id) => CONSENT_IDS.includes(id)) : [],
    confirmed: entry?.confirmed === true,
  };
};

// Νέες συνεδρίες ζητούν consent πριν ξεκινήσει το παιχνίδι. Παλιές (χωρίς consentRequired) δεν επηρεάζονται.
export const consentPending = (mg) => !!mg?.consentRequired && !mg?.consent?.done;
export const allConfirmed = (mg, players = []) => players.length > 0 && players.every((p) => consentOf(mg, p.id).confirmed);
export const anyOptOut = (mg, optionId, players = []) => players.some((p) => consentOf(mg, p.id).optOuts.includes(optionId));

export const textOf = (item) => {
  if (typeof item === 'string') return item;
  if (Array.isArray(item)) return item.map(textOf).join(' ');
  if (item && typeof item === 'object') return [item.title, item.text, item.say, item.question, item.cmd, item.name, item.desc].filter(Boolean).join(' ') || JSON.stringify(item);
  return String(item ?? '');
};

// Ποια από τα όρια της παίκτριας παραβιάζει αυτό το κείμενο;
export const blockedBy = (mg, playerId, text) => {
  const { optOuts } = consentOf(mg, playerId);
  return CONSENT_OPTIONS.filter((option) => optOuts.includes(option.id) && option.re.test(fold(text))).map((option) => option.id);
};

// Τυχαία κάρτα που δεν παραβιάζει τα όρια καμίας από τις αναφερόμενες παίκτριες. null = δεν υπάρχει κατάλληλη.
export function pickAllowed(items, mg, playerIds, rnd = Math.random) {
  const ids = Array.isArray(playerIds) ? playerIds : [playerIds];
  const ok = (items || []).filter((item) => ids.every((id) => blockedBy(mg, id, textOf(item)).length === 0));
  return ok.length ? ok[Math.floor(rnd() * ok.length)] : null;
}

export function isValidConsentEntry(entry) {
  return !!entry && typeof entry === 'object' && !Array.isArray(entry)
    && typeof entry.confirmed === 'boolean' && Number.isFinite(entry.at)
    && Array.isArray(entry.optOuts) && entry.optOuts.length <= CONSENT_IDS.length
    && entry.optOuts.every((id) => CONSENT_IDS.includes(id));
}

// Τυχαίος Exit Code 4 διαφορετικών ψηφίων, όχι ακολουθία (1234, 4321 κ.λπ.).
export function randomExitCode(rnd = Math.random) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const digits = [...'0123456789'].sort(() => rnd() - 0.5).slice(0, 4);
    const diffs = digits.slice(1).map((d, i) => Number(d) - Number(digits[i]));
    if (diffs.every((d) => d === 1) || diffs.every((d) => d === -1)) continue;
    return digits.join('');
  }
  return '7302';
}
