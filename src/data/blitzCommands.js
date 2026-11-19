// Εντολές για το 8άρι blitz: τι κάνει τώρα κάθε παίκτρια και τι πρέπει να κάνει μέσα σε 8″.
export const BLITZ_COMMANDS = [
  { doing: 'Όρθια, χέρια ψηλά', must: 'Μείνε ακίνητη 8″ — μία κίνηση = ποινή' },
  { doing: 'Γονατιστή στο πάτωμα', must: 'Κράτα την ανάσα σου ως το μηδέν' },
  { doing: 'Καθιστή με τα πόδια τεντωμένα', must: 'Κούνα μόνο τα δάχτυλα των ποδιών' },
  { doing: 'Ξαπλωτή ανάσκελα', must: 'Σήκωσε τα πόδια 10 εκατοστά και κράτα' },
  { doing: 'Χέρια πίσω από την πλάτη', must: 'Λύσε το ένα χέρι πριν το μηδέν' },
  { doing: 'Μπρούμυτα στο κρεβάτι', must: 'Μη γελάσεις καθόλου για 8″' },
  { doing: 'Όρθια στην άκρη του δωματίου', must: 'Φτάσε στο κέντρο με τρία βήματα' },
  { doing: 'Καθιστή στην καρέκλα', must: 'Σήκωσε το ένα πόδι χωρίς να ακουμπήσεις' },
  { doing: 'Με την πλάτη στον τοίχο', must: 'Πες αλφαβήτα ανάποδα ως το Δ' },
  { doing: 'Πάνω στις μύτες', must: 'Μείνε στις μύτες ως το μηδέν' },
  { doing: 'Σταυρωπό πόδι', must: 'Άλλαξε πόδι χωρίς να χάσεις την ισορροπία' },
  { doing: 'Χέρια στο κεφάλι', must: 'Σφίξε τις γροθιές και μέτρα δυνατά ως το 8' },
  { doing: 'Καθιστή δίπλα στην επόμενη', must: 'Κοίταξέ την στα μάτια χωρίς να γελάσεις' },
  { doing: 'Γονατιστή με μέτωπο κάτω', must: 'Σήκωσε το κεφάλι μόνο στο «τώρα»' },
  { doing: 'Όρθια με τα χέρια μπροστά', must: 'Κρατά τις παλάμες ανοιχτές, χωρίς να τις κλείσεις' },
  { doing: 'Καθιστή με την πλάτη ίσια', must: 'Πες το όνομα της νικήτριας τρεις φορές' },
];

const DEMO_NAMES = ['Παίκτρια 1', 'Παίκτρια 2', 'Παίκτρια 3', 'Παίκτρια 4'];

function shuffled(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Μία εντολή ανά παίκτρια — ίδια σειρά με τη λίστα των παικτριών.
export function blitzEntries(players) {
  const roster = (players || []).length
    ? players.map((p) => ({ id: p.id || p.name, name: p.name || '—' }))
    : DEMO_NAMES.map((name, i) => ({ id: `demo-${i}`, name }));
  const commands = shuffled(BLITZ_COMMANDS);
  return roster.map((p, i) => ({
    ...p,
    doing: commands[i % commands.length].doing,
    must: commands[i % commands.length].must,
  }));
}

export const BLITZ_DURATION = 8;