// Κοινή κατάσταση σύνδεσης της συσκευής: πόσες αλλαγές περιμένουν να σταλούν (π.χ. έπεσε το WiFi).
let pendingWrites = 0;
const listeners = new Set();

export const getPendingWrites = () => pendingWrites;
export function setPendingWrites(count) {
  if (count === pendingWrites) return;
  pendingWrites = count;
  listeners.forEach((fn) => { try { fn(count); } catch { /* ignore */ } });
}
export function subscribePendingWrites(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Σφάλμα δικτύου ή προσωρινό σφάλμα server (επανεκκίνηση): η αλλαγή ξαναστέλνεται αργότερα.
// Σφάλμα 4xx (απαγόρευση/λάθος δεδομένα): ΔΕΝ ξαναστέλνεται.
export function isRetryableError(error) {
  const status = error?.status;
  if (!status) return true;
  return status === 408 || status === 429 || status >= 500;
}
