// 12.0.0 · Αυτόματος πιλότος της Ταινίας (Tablet).
// Από το βήμα του Οδηγού → ποια ενέργεια μπορεί να γίνει με ένα πάτημα, και ποια ΜΟΝΗ της.
// ΑΣΦΑΛΕΙΑ: μόνο «ακίνδυνα» βήματα γίνονται αυτόματα (έναρξη πράξης, μετάβαση ηπείρου, ζάρι για όποια αργεί).
// Δοκιμασίες, ποινές, Τροχός, Deal, κλείσιμο πράξης, υποχρεωτικό και φινάλε: ΠΟΤΕ αυτόματα — πάντα με πάτημα της διοργανώτριας.
// Σε ΣΤΟΠ δεν γίνεται τίποτα.

import { actsOf } from './campaignEngine.js';

export const AUTO_WAIT_MS = 10_000; // αντίστροφη μέτρηση στο Tablet πριν από κάθε αυτόματο βήμα
export const ROLL_IDLE_MS = 60_000; // αν μια παίκτρια δεν ρίξει σε 60″, ρίχνει ο πιλότος για εκείνη

// step: από movieGuideStep. Επιστρέφει { action, label, auto, at } ή null.
export function autopilotPlan(step, cg, { now = Date.now(), stopped = false, players = [] } = {}) {
  if (!step || !cg || stopped) return null;
  if (step.id === 'act') return { action: 'startAct', label: '▶ Ξεκίνα την πράξη', auto: true, at: now };
  if (step.id === 'next') {
    const isLast = (cg.act || 0) >= actsOf(cg).length - 1;
    return isLast ? { action: 'finale', label: '👑 Φινάλε', auto: false } : { action: 'goNext', label: '➡️ Επόμενη ήπειρος', auto: true, at: now };
  }
  if (step.id === 'roll') {
    const b = cg.board || {};
    const order = b.order || [];
    const pid = order.length ? order[((b.turn % order.length) + order.length) % order.length] : null;
    const isBot = !!players.find((p) => p.id === pid)?.bot;
    const since = Math.max(b.roll?.at || 0, b.at || 0, b.turnAt || 0);
    const idle = now - since;
    return { action: 'rollFor', pid, label: '🎲 Ρίξε για εκείνη', auto: !isBot && idle >= ROLL_IDLE_MS, at: since + ROLL_IDLE_MS };
  }
  // Όλα τα υπόλοιπα: η διοργανώτρια αποφασίζει.
  return null;
}

// Πότε εκτελείται ένα αυτόματο βήμα: μετά από AUTO_WAIT_MS από τη στιγμή που εμφανίστηκε (ή από το «at» του).
export function autopilotDueAt(plan, shownAt) {
  if (!plan?.auto) return null;
  return Math.max(shownAt + AUTO_WAIT_MS, plan.action === 'rollFor' ? plan.at : 0);
}
