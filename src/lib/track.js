import { getToken } from '@/api/base44Client';

// Μετράει επισκέψεις στο /site. Δεν μετράει όταν είσαι συνδεδεμένη/ος (δηλαδή εσύ).
export function trackVisit(path) {
  try {
    if (getToken()) return;
    let id = localStorage.getItem('dot_vid');
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('dot_vid', id); }
    let ref = document.referrer;
    try { if (new URL(ref).host === location.host) ref = ''; } catch { ref = ''; }
    fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitor: id, path, ref }),
      keepalive: true,
    }).catch(() => {});
  } catch { /* δεν πρέπει ποτέ να χαλάει τη σελίδα */ }
}
