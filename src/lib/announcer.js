// 12.0.0 · Εκφωνητής της TV: μία φράση για κάθε μεγάλη στιγμή (όχι για κάθε ζάρι).
// Καθαρή συνάρτηση: συγκρίνει προηγούμενη/τωρινή κατάσταση και επιστρέφει τη φράση ή null.

import { currentAct } from './campaignEngine.js';

export const announceKey = (cg = {}) => ({
  status: cg.status, act: cg.act, actStartedAt: cg.actStartedAt || 0, wheelAt: cg.wheel?.at || 0, offerAt: cg.dond?.offerAt || 0,
  awardAt: cg.dond?.awardedAt || 0, announceAt: cg.announce?.at || 0, drawnAt: cg.drawn?.at || 0, mandatoryAt: cg.mandatory?.at || 0, finaleAt: cg.finaleAt || 0,
});

export function announcerLine(prev, cg, nameOf = (id) => id, leader = null) {
  if (!prev || !cg) return null;
  const k = announceKey(cg);
  if (k.status === 'finale' && prev.status !== 'finale') return leader ? `Κυρίες μου… η μεγάλη νικήτρια της βραδιάς είναι… ${leader}!` : 'Φτάσαμε στο μεγάλο φινάλε!';
  if (k.actStartedAt && k.actStartedAt !== prev.actStartedAt) {
    let a = null; try { a = currentAct(cg); } catch { /* χωρίς πράξη */ }
    return a ? `Πράξη ${a.index + 1}. ${a.title}!` : 'Πάμε!';
  }
  if (k.status === 'standby' && prev.status !== 'standby') return 'Κάνουμε ένα μικρό διάλειμμα. Μείνετε συντονισμένες!';
  if (k.mandatoryAt && k.mandatoryAt !== prev.mandatoryAt) return 'Υποχρεωτική κλήρωση! Ποια θα είναι;';
  if (k.wheelAt && k.wheelAt !== prev.wheelAt) return `Ο Τροχός γυρίζει για ${art(nameOf(cg.wheel?.pid))}!`;
  if (k.offerAt && k.offerAt !== prev.offerAt) return 'Ο τραπεζίτης τηλεφωνεί. Η προσφορά είναι στο τραπέζι. Deal… ή No Deal;';
  if (k.awardAt && k.awardAt !== prev.awardAt) return cg.dond?.status === 'won' ? 'Τεράστια νίκη!' : 'Ωχ… αυτό πόνεσε!';
  if (k.announceAt && k.announceAt !== prev.announceAt) {
    const n = nameOf(cg.announce?.pid);
    if (cg.announce?.kind === 'mostwanted') return `Η πιο καταζητούμενη της βραδιάς: ${n}!`;
    if (cg.announce?.kind === 'wanted') return `Ένταλμα σύλληψης για ${art(n)}!`;
  }
  if (k.drawnAt && k.drawnAt !== prev.drawnAt) return `Η κλήρωση έβγαλε… ${nameOf(cg.drawn?.pid)}!`;
  return null;
}
const art = (name = '') => `την ${name}`;
