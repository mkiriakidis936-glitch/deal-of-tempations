// 10.5.2 · Οδηγός πρώτης βραδιάς (Tablet, Ταινία): «τι πατάω τώρα;».
// Καθαρή συνάρτηση: από την κατάσταση βγάζει ΕΝΑ επόμενο βήμα, με την καρτέλα του Tablet όπου βρίσκεται το κουμπί.
// Μόνο οδηγίες· δεν αλλάζει τίποτα στο παιχνίδι.
// Καρτέλες (ActCampaign): 8 Ταμπλό & Ζάρι · 1 Πράξεις & ΣΤΟΠ · 7 Τροχοί, Deal & Παιχνίδια · 2 Κλήρωση & Νύχια · 5 Πόντοι & Κατάταξη.

const confirmedCount = (mg, players) => players.filter((p) => mg?.consent?.players?.[p.id]?.confirmed).length;

export function movieGuideStep({ mg = {}, players = [], stopped = false, now = Date.now(), nameOf = (id) => id } = {}) {
  const cg = mg.cg;
  const step = (id, icon, title, text, tab = null) => ({ id, icon, title, text, tab });

  if (stopped) return step('stop', '⏸', 'Το παιχνίδι είναι σε ΣΤΟΠ', 'Όταν όλες είναι εντάξει, πάτα ξανά το ΣΤΟΠ για να συνεχίσει.');
  if (players.length < 2) return step('players', '👥', 'Πρόσθεσε τις παίκτριες', `Χρειάζονται τουλάχιστον 2 (τώρα ${players.length}). Δείξε το QR για να μπουν από τα κινητά.`);
  if (mg.consentRequired && !mg.consent?.done) {
    return step('consent', '🛟', 'Περίμενε τα όρια από τα κινητά', `${confirmedCount(mg, players)}/${players.length} επιβεβαίωσαν. Το παιχνίδι ξεκινά όταν είναι όλες έτοιμες.`);
  }
  if (!cg) return step('start', '🎬', 'Διάλεξε διάρκεια και πάτα «Ξεκίνα»', 'Κάτω από τον χάρτη: 48 ωρών, 72 ωρών κ.λπ. Μετά ανοίγει η TV με την ταινία.');

  const status = cg.status || 'transition';
  if (status === 'finale') return step('finale', '👑', 'Μεγάλο Φινάλε', 'Η TV δείχνει τη νικήτρια. Στο «Πόντοι & Κατάταξη» κάνεις την απονομή του Μεγάλου Δώρου.', 5);
  if (cg.mandatory?.pending) {
    return cg.mandatory.pid
      ? step('mandatory-wheel', '⚠️', `Υποχρεωτικό: Τροχός για ${nameOf(cg.mandatory.pid)}`, 'Στις «Πράξεις & ΣΤΟΠ», στο πλαίσιο «Υποχρεωτικό γεγονός», γύρνα τον Τροχό.', 1)
      : step('mandatory-draw', '⚠️', 'Υποχρεωτική κλήρωση', 'Στις «Πράξεις & ΣΤΟΠ», στο πλαίσιο «Υποχρεωτικό γεγονός», πάτα την κλήρωση. Μετά ανοίγει η επόμενη πράξη.', 1);
  }
  if (status === 'standby') return step('standby', '⏸', 'Διάλειμμα (Standby)', 'Όταν επιστρέψετε, πάτα «STANDBY OFF» στις «Πράξεις & ΣΤΟΠ».', 1);
  if (status === 'transition') {
    if ((cg.conquered || {})[cg.act || 0]) { // η τρέχουσα πράξη έκλεισε, δεν έγινε ακόμα η μετάβαση
      return step('next', '➡️', 'Η πράξη έκλεισε', 'Πάτα «ΜΕΤΑΒΑΣΗ ΣΕ ΕΠΟΜΕΝΗ ΗΠΕΙΡΟ» στις «Πράξεις & ΣΤΟΠ», ή «ΦΙΝΑΛΕ» αν ήταν η τελευταία.', 1);
    }
    return step('act', '▶', 'Ξεκίνα την πράξη', 'Πάτα «▶ ΕΝΑΡΞΗ ΠΡΑΞΗΣ» στις «Πράξεις & ΣΤΟΠ». Η TV δείχνει την κάρτα της πράξης.', 1);
  }

  // Ενεργή πράξη: πρώτα ό,τι τρέχει τώρα στην TV.
  if (cg.trial && !cg.trial.done) return step('trial', '⛓️', `Δοκιμασία: ${nameOf(cg.trial.pid)}`, 'Όταν τελειώσει, πάτα «✅ Επιτυχία», «❌ Ποινή» ή «⏭ PASS» στο κόκκινο πλαίσιο της δοκιμασίας.');
  if (cg.wheel && !cg.wheel.done) return step('wheel', '🎡', `Τροχός για ${nameOf(cg.wheel.pid)}`, 'Ο Τροχός γυρίζει στην TV. Όταν γίνει η ποινή, ολοκλήρωσέ τη στο «Τροχοί, Deal & Παιχνίδια».', 7);
  if (cg.game === 'dond' && cg.dond && !['won', 'lost'].includes(cg.dond.status)) {
    const d = cg.dond;
    const text = d.status === 'pick' ? 'Η παίκτρια διαλέγει το δικό της κουτί από το κινητό.'
      : d.status === 'offer_wait' ? 'Γράψε την προσφορά του «τραπεζίτη» και στείλ\' την.'
        : d.status === 'offer' ? 'Περίμενε DEAL ή NO DEAL από το κινητό.'
          : d.status === 'final' ? 'Πάτα «🎁 ΑΝΟΙΓΜΑ ΤΟΥ ΚΟΥΤΙΟΥ ΤΗΣ».'
            : d.status === 'revealed' || d.status === 'deal' ? 'Κάνε την απονομή (κέρδισε ή έχασε).' : 'Η παίκτρια ανοίγει κουτιά από το κινητό.';
    return step('dond', '💼', 'Deal or No Deal', text, 7);
  }
  if (cg.game && cg.game !== 'dond') return step('game', '🎮', 'Παιχνίδι σε εξέλιξη', 'Συνέχισέ το ή κλείσ\' το στο «Τροχοί, Deal & Παιχνίδια».', 7);

  const b = cg.board;
  if (b?.on) {
    if (b.allDone) return step('board-done', '🏁', 'Όλες τερμάτισαν το ταμπλό', 'Πάτα «■ ΚΛΕΙΣΙΜΟ ΠΡΑΞΗΣ» στις «Πράξεις & ΣΤΟΠ».', 1);
    if (b.pending) return step('square', '🎯', `${nameOf(b.pending.pid)} έπεσε σε τετράγωνο`, 'Στο «Ταμπλό & Ζάρι» πάτα το κουμπί του τετραγώνου. Όταν τελειώσει η σκηνή, πάτα «Επόμενη σειρά».', 8);
    const order = b.order || [];
    const turn = order.length ? order[((b.turn % order.length) + order.length) % order.length] : null;
    return step('roll', '🎲', `Σειρά της ${turn ? nameOf(turn) : '—'} να ρίξει`, 'Ρίχνει από το κινητό της. Αν αργεί, πάτα «Ρίξε για εκείνη» ή «PASS» στο «Ταμπλό & Ζάρι».', 8);
  }
  if (cg.boardMode === false || !b) {
    return step('play', '🎰', 'Η πράξη τρέχει', 'Κάνε κλήρωση στο «Κλήρωση & Νύχια», γύρνα Τροχό ή ξεκίνα παιχνίδι. Όταν τελειώσετε, «■ ΚΛΕΙΣΙΜΟ ΠΡΑΞΗΣ».', 2);
  }
  return step('play', '🎰', 'Η πράξη τρέχει', 'Όταν τελειώσετε, πάτα «■ ΚΛΕΙΣΙΜΟ ΠΡΑΞΗΣ» στις «Πράξεις & ΣΤΟΠ».', 1);
}
