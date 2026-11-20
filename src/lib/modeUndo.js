// Αναίρεση τελευταίας ενέργειας βαθμολογίας (tokens / score) για τη διοργανώτρια.
// Κρατά τις τελευταίες 10 αλλαγές στο mg.undo ως {k, pid, n (πραγματική αλλαγή), t}. (Όχι κλειδί «id»: ο server συγχωνεύει πίνακες με id.)
const MAX = 10;

export function applyDelta(mg, kind, id, n) {
  const map = { ...(mg[kind] || {}) };
  const before = map[id] || 0;
  const after = kind === 'tokens' ? Math.max(0, before + n) : before + n;
  map[id] = after;
  const applied = after - before;
  const undo = applied === 0 ? (mg.undo || []) : [...(mg.undo || []), { k: kind, pid: id, n: applied, t: Date.now() }].slice(-MAX);
  return { [kind]: map, undo };
}

export function undoLast(mg) {
  const stack = mg.undo || [];
  const last = stack[stack.length - 1];
  if (!last) return null;
  const map = { ...(mg[last.k] || {}) };
  const before = map[last.pid] || 0;
  map[last.pid] = last.k === 'tokens' ? Math.max(0, before - last.n) : before - last.n;
  return { patch: { [last.k]: map, undo: stack.slice(0, -1) }, entry: last };
}
