// «Έτοιμο για βραδιά» 0–100%: καθαρός υπολογισμός από όσα ήδη φορτώνει η Επισκόπηση.
// Δεν αλλάζει δεδομένα· κάθε έλεγχος δείχνει πού πας για να το φτιάξεις (tab του Admin).
// Ό,τι δεν μπόρεσε να ελεγχθεί (null) εμφανίζεται «άγνωστο» και δεν μετράει ως έτοιμο.
import { allConfirmed, consentOf } from './consent.js';

const DAY = 24 * 60 * 60 * 1000;
const stageOf = (s) => Number(s?.state?.stage ?? s?.stage ?? 0);

// Η παρτίδα της βραδιάς: η πιο πρόσφατη που δεν έχει τελειώσει.
export function nightSession(sessions = []) {
  const open = sessions.filter((s) => s && stageOf(s) < 3);
  const time = (s) => Date.parse(s.updated_date || s.created_date || '') || 0;
  return open.sort((a, b) => time(b) - time(a))[0] || null;
}

export function computeReadiness({ sessions = [], media = null, backup, newRequests = null, pushDevices = null, connection = 'loading', now = Date.now() } = {}) {
  const session = nightSession(sessions);
  const players = session?.state?.players || [];
  const mg = session?.state?.mg || {};
  const items = [];
  const add = (item) => items.push({ status: 'todo', ...item });

  add({
    id: 'session', weight: 20, tab: 'show', fix: 'Άνοιγμα Live Show',
    label: 'Παρτίδα της βραδιάς',
    status: session ? 'ok' : 'todo',
    detail: session ? `Κωδικός ${session.sessionCode || '—'}` : 'Δεν υπάρχει ανοιχτή παρτίδα. Ξεκίνα από το Tablet.',
  });

  add({
    id: 'players', weight: 15, tab: 'players', fix: 'Παίκτριες',
    label: 'Παίκτριες στην παρτίδα',
    status: !session ? 'todo' : players.length >= 2 ? 'ok' : 'todo',
    detail: !session ? 'Χρειάζεται πρώτα παρτίδα.' : players.length >= 2 ? `${players.length} παίκτριες` : `Μόνο ${players.length}. Χρειάζονται τουλάχιστον 2.`,
  });

  const needsConsent = !!mg.consentRequired;
  const confirmed = players.filter((p) => consentOf(mg, p.id).confirmed).length;
  add({
    id: 'consent', weight: 15, tab: 'show', fix: 'Δες ποιες λείπουν',
    label: 'Όρια & συναίνεση',
    status: !session ? 'todo' : !needsConsent || mg.consent?.done || allConfirmed(mg, players) ? 'ok' : 'todo',
    detail: !session ? 'Χρειάζεται πρώτα παρτίδα.' : !needsConsent ? 'Δεν ζητείται σε αυτή την παρτίδα.' : `${confirmed}/${players.length} επιβεβαίωσαν από το κινητό`,
  });

  add({
    id: 'media', weight: 15, tab: 'media', fix: 'Χάρτης media',
    label: 'Υποχρεωτικά media',
    status: !media ? 'unknown' : media.missingRequired === 0 ? 'ok' : 'todo',
    detail: !media ? 'Δεν ήταν δυνατός ο έλεγχος.' : media.missingRequired === 0 ? 'Όλα στη θέση τους' : `Λείπουν ${media.missingRequired}`,
  });

  add({
    id: 'broken', weight: 5, tab: 'media', fix: 'Χάρτης media',
    label: 'Σβησμένα αρχεία',
    status: !media ? 'unknown' : media.broken === 0 ? 'ok' : 'todo',
    detail: !media ? 'Δεν ήταν δυνατός ο έλεγχος.' : media.broken === 0 ? 'Κανένα' : `${media.broken} θέσεις δείχνουν σε αρχείο που δεν υπάρχει`,
  });

  const backupAt = backup ? Number(backup.modified) || Date.parse(backup.modified) || 0 : 0;
  add({
    id: 'backup', weight: 10, tab: 'backup', fix: 'Νέο αντίγραφο',
    label: 'Αντίγραφο ασφαλείας 24ώρου',
    status: backup === undefined ? 'unknown' : backupAt && now - backupAt <= DAY ? 'ok' : 'todo',
    detail: backup === undefined ? 'Δεν ήταν δυνατός ο έλεγχος.' : backupAt ? `Τελευταίο: ${new Date(backupAt).toLocaleString('el-GR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Δεν υπάρχει αντίγραφο',
  });

  add({
    id: 'inbox', weight: 5, tab: 'inbox', fix: 'Αιτήσεις',
    label: 'Αιτήσεις σε αναμονή',
    status: newRequests === null ? 'unknown' : newRequests === 0 ? 'ok' : 'todo',
    detail: newRequests === null ? 'Δεν ήταν δυνατός ο έλεγχος.' : newRequests === 0 ? 'Καμία' : `${newRequests} περιμένουν απάντηση`,
  });

  add({
    id: 'push', weight: 5, tab: 'notifications', fix: 'Ειδοποιήσεις',
    label: 'Κινητά με ειδοποιήσεις',
    status: pushDevices === null ? 'unknown' : pushDevices > 0 ? 'ok' : 'todo',
    detail: pushDevices === null ? 'Δεν ήταν δυνατός ο έλεγχος.' : pushDevices > 0 ? `${pushDevices} συσκευές` : 'Καμία συσκευή ακόμη',
  });

  add({
    id: 'server', weight: 10, tab: 'settings', fix: 'Ρυθμίσεις',
    label: 'Σύνδεση με τον server',
    status: connection === 'connected' ? 'ok' : connection === 'error' ? 'todo' : 'unknown',
    detail: connection === 'connected' ? 'Συνδεδεμένο' : connection === 'error' ? 'Δεν απαντά' : 'Έλεγχος…',
  });

  const total = items.reduce((sum, item) => sum + item.weight, 0);
  const done = items.filter((item) => item.status === 'ok').reduce((sum, item) => sum + item.weight, 0);
  const score = total ? Math.round((done / total) * 100) : 0;
  const tone = score >= 90 ? 'ready' : score >= 60 ? 'almost' : 'notyet';
  return { score, tone, session, items, todo: items.filter((item) => item.status !== 'ok') };
}
