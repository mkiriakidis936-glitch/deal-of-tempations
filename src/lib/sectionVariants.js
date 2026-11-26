// Εναλλακτικές εικόνες φάσης. Μια ενότητα με `alt: 'level1'` δεν είναι δική της φάση του παιχνιδιού·
// εμφανίζεται εναλλάξ με την εικόνα της φάσης alt, ώστε να φαίνεται ζωντανά χωρίς να εφευρίσκουμε νέες καταστάσεις.
// Η επιλογή αλλάζει με το `seed` (π.χ. πλήθος γεγονότων του ιστορικού), άρα μένει σταθερή ανάμεσα σε δύο γεγονότα.
export function pickSectionVariant(baseId, sections = [], seed = 0) {
  if (!baseId) return baseId;
  const withImage = (id) => sections.find((s) => s.id === id)?.image;
  const alts = sections.filter((s) => s.alt === baseId && withImage(s.id)).map((s) => s.id);
  if (!alts.length) return baseId;
  const pool = withImage(baseId) ? [baseId, ...alts] : alts; // αν λείπει η κύρια εικόνα, δείχνουμε μόνο τις εναλλακτικές
  const n = Math.abs(Number(seed) || 0);
  return pool[n % pool.length];
}
