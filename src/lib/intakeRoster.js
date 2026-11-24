// Tablet Setup: ποιες συμπλήρωσαν φόρμα, σε ποια modes, και ποιες έχουν εγκριθεί.
import { ENGINE_MODES, NEW_MODES } from '../data/modes/modeRegistry.js';

// Ενεργά modes (μηχανές + ψηφιακά). Τα αποσυρμένα αγνοούνται.
const activeModes = () => [...ENGINE_MODES, ...NEW_MODES];
const isActive = (id) => activeModes().some((m) => m.id === id);
export const nameKey = (name) => String(name || '').trim().toLocaleLowerCase('el-GR');

// Ενιαία λίστα όλων των αιτήσεων (όλες οι φόρμες): ένα στοιχείο ανά όνομα & mode, με κατάσταση έγκρισης και στοιχεία φόρμας.
export function buildRoster(sources) {
  const rows = [];
  const push = (item, source, name, modes) => {
    const clean = String(name || '').trim();
    if (!clean) return;
    const active = (modes || []).filter(isActive);
    rows.push({
      key: `${source}-${item.id}-${nameKey(clean)}`, id: item.id, source, name: clean,
      approved: item.approved === true, rejected: item.approvalStatus === 'rejected',
      modes: [...new Set(active)], createdAt: item.created_date || item.submittedAt || '', item,
    });
  };
  for (const item of sources.player || []) push(item, 'PlayerIntake', item.name, item.preferredModes?.length ? item.preferredModes : [item.vipGameMode || item.gameMode || 'classic']);
  for (const item of sources.pajama || []) push(item, 'PajamaIntake', item.name, item.preferredModes || []);
  for (const item of sources.vip || []) push(item, 'VIPInvitationSubmission', item.name, [item.gameMode || 'classic']);
  return rows.filter((row) => !row.rejected);
}

// Ανά mode: μοναδικά ονόματα εγκεκριμένων και εκκρεμών (μια παίκτρια που δήλωσε 2 modes μετράει και στα δύο).
export function modeCounts(roster) {
  return activeModes().map((mode) => {
    const approved = new Map();
    const pending = new Map();
    roster.filter((row) => row.modes.includes(mode.id)).forEach((row) => {
      (row.approved ? approved : pending).set(nameKey(row.name), row.name);
    });
    for (const key of approved.keys()) pending.delete(key);
    return { id: mode.id, approved: [...approved.values()], pending: [...pending.values()] };
  });
}

