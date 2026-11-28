import { appApi, getToken } from '@/api/apiClient';
import { applyMediaOverrides } from '@/data/brandArt';
import { setSiteOverrides } from '@/data/siteContent';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const MEDIA_KEY = 'media_overrides';
const IMG_EXT = /\.(jpe?g|png|webp|gif|avif|svg)$/i;
const VID_EXT = /\.(mp4|m4v|webm|mov)$/i;
const AUDIO_EXT = /\.(mp3|wav|ogg|m4a|aac)$/i;
const HEIC = /\.(heic|heif)$/i;

export async function fetchOverrides() {
  const { items } = await appApi.entities.AppSetting.filter({ key: MEDIA_KEY }, { limit: 1 });
  return items?.[0] || null;
}

// Φορτώνει τις αλλαγές του Admin και τις εφαρμόζει πριν ξεκινήσει το React.
// Αν ο server αργεί/πέσει, η εφαρμογή ανοίγει κανονικά με τα αρχικά αρχεία.
export const SITE_KEY = 'site_content';

export async function fetchSiteRecord() {
  const { items } = await appApi.entities.AppSetting.filter({ key: SITE_KEY }, { limit: 1 });
  return items?.[0] || null;
}

// Αλλάζει τις ρυθμίσεις φωτογραφιών με ασφάλεια (διαβάζει τα πιο πρόσφατα, εφαρμόζει την αλλαγή, αποθηκεύει).
export async function patchOverrides(mutator) {
  const rec = await fetchOverrides();
  const next = mutator({ ...(rec?.value || {}) });
  const clean = Object.fromEntries(Object.entries(next).filter(([, v]) => (Array.isArray(v) ? v.length : v)));
  if (rec?.id) await appApi.entities.AppSetting.update(rec.id, { value: clean });
  else await appApi.entities.AppSetting.create({ key: MEDIA_KEY, value: clean });
  return clean;
}

// ---- Φόρτωση / συγχρονισμός media σε Site, Tablet, TV, κινητά ----
// 1) Εφαρμόζεται αμέσως η τελευταία γνωστή ρύθμιση (cache) ώστε να μη φαίνονται ποτέ λάθος/κενές εικόνες.
// 2) Η φόρτωση από τον server έχει υπομονή (8″) και ΔΕΝ εγκαταλείπεται: συνεχίζει ξανά και ξανά στο παρασκήνιο.
// 3) Η TV/Tablet/Κινητό ελέγχουν περιοδικά για αλλαγές από το Admin (χωρίς χειροκίνητο refresh).
const CACHE_KEY = 'media_overrides_cache_v2';
const POLL_MS = 15_000; // TV/Tablet/κινητά βλέπουν νέα φωτογραφία από το Admin σε ≤15″
const STATIC_PATHS = /^\/(site|promo|forms|gift-unlock|vip\/)/;
const mediaListeners = new Set();
let lastSignature = '';

export const subscribeMediaRefresh = (fn) => { mediaListeners.add(fn); return () => mediaListeners.delete(fn); };
const emit = (kind) => mediaListeners.forEach((fn) => { try { fn(kind); } catch { /* ignore */ } });

const readCache = () => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch { return null; }
};
const writeCache = (payload) => {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(payload)); } catch { /* ignore (private mode / quota) */ }
};
const withTimeout = (promise, ms) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
]);

function applyPayload(media, site) {
  applyMediaOverrides(media || {});
  setSiteOverrides(site || {});
}

async function fetchPayload(ms = 8000) {
  const [rec, site] = await withTimeout(Promise.all([fetchOverrides(), fetchSiteRecord()]), ms);
  return { media: rec?.value || {}, site: site?.value || {} };
}

let pollStarted = false;
function startBackgroundSync() {
  if (pollStarted || typeof window === 'undefined') return;
  pollStarted = true;
  const check = async () => {
    if (document.visibilityState === 'hidden') return;
    try {
      const payload = await fetchPayload(10000);
      const signature = JSON.stringify(payload);
      if (signature === lastSignature) return;
      const firstReal = !lastSignature;
      lastSignature = signature;
      applyPayload(payload.media, payload.site);
      writeCache(payload);
      emit(firstReal || STATIC_PATHS.test(window.location.pathname) ? 'remount' : 'applied');
    } catch { /* επόμενη προσπάθεια */ }
  };
  setInterval(check, POLL_MS);
  document.addEventListener('visibilitychange', check);
  window.addEventListener('online', check);
  window.addEventListener('focus', check);
}

export async function loadMedia() {
  const cached = readCache();
  if (cached) { try { applyPayload(cached.media, cached.site); } catch { /* ignore */ } }
  try {
    const payload = await fetchPayload(cached ? 2500 : 8000);
    lastSignature = JSON.stringify(payload);
    applyPayload(payload.media, payload.site);
    writeCache(payload);
  } catch (e) {
    console.warn('[media] προσωρινά χρήση αποθηκευμένων/αρχικών αρχείων:', e.message);
    // Δεν μένουμε με τα αρχικά: ξαναδοκιμάζει σύντομα και, μόλις έρθουν, ανανεώνει την οθόνη.
    const retry = async (delay) => {
      try {
        const payload = await fetchPayload(10000);
        lastSignature = JSON.stringify(payload);
        applyPayload(payload.media, payload.site);
        writeCache(payload);
        emit('remount');
      } catch { setTimeout(() => retry(Math.min(delay * 2, 30000)), delay); }
    };
    setTimeout(() => retry(3000), 3000);
  }
  startBackgroundSync();
}

// Μικραίνει τις φωτογραφίες (max 2400px, JPEG) ώστε να φορτώνουν γρήγορα στα κινητά/TV.
async function prepareImage(file) {
  const isHeic = HEIC.test(file.name) || /heic|heif/.test(file.type);
  const resizable = isHeic || /^image\/(jpeg|webp)$/.test(file.type);
  if (!resizable) return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
    if (!isHeic && scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86));
    if (!blob) throw new Error('no blob');
    if (!isHeic && blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    if (isHeic) throw new Error('Το HEIC δεν διαβάζεται σε αυτόν τον browser. Κάνε export σε JPG και ξαναδοκίμασε.');
    return file;
  }
}

export async function uploadMedia(file, onProgress) {
  if (!IMG_EXT.test(file.name) && !VID_EXT.test(file.name) && !AUDIO_EXT.test(file.name) && !HEIC.test(file.name)) {
    throw new Error(`«${file.name}»: μη υποστηριζόμενος τύπος (JPG, PNG, HEIC, SVG, MP4, MOV, M4V, WEBM, MP3, WAV, OGG, M4A, AAC).`);
  }
  const f = (HEIC.test(file.name) || IMG_EXT.test(file.name)) && !/\.svg$/i.test(file.name) ? await prepareImage(file) : file;
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/api/media/upload?name=${encodeURIComponent(f.name)}`);
    const token = getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      let data = {};
      try { data = JSON.parse(xhr.responseText); } catch { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300) { invalidateMediaList(); resolve(data); }
      else reject(new Error(data.error || `Σφάλμα ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('Πρόβλημα σύνδεσης κατά το ανέβασμα.'));
    xhr.send(f);
  });
}

const authHeaders = () => { const t = getToken(); return t ? { Authorization: `Bearer ${t}` } : {}; };

const MEDIA_LIST_CACHE_MS = 15000;
let mediaListCache = null;
let mediaListCachedAt = 0;
let mediaListRequest = null;

export function invalidateMediaList() {
  mediaListCache = null;
  mediaListCachedAt = 0;
}

// Χώρος αποθήκευσης του server (used / free / total σε bytes), από την τελευταία λίστα της βιβλιοθήκης.
let mediaStorage = null;
export const getMediaStorage = () => mediaStorage;

export async function listMedia({ force = false } = {}) {
  if (!force && mediaListCache && Date.now() - mediaListCachedAt < MEDIA_LIST_CACHE_MS) return mediaListCache;
  if (mediaListRequest) return mediaListRequest;
  const request = (async () => {
    const res = await fetch(`${API_URL}/api/media`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Δεν φορτώθηκε η βιβλιοθήκη.');
    const body = await res.json();
    const items = body.items || [];
    mediaStorage = body.storage || null;
    mediaListCache = items;
    mediaListCachedAt = Date.now();
    return items;
  })();
  mediaListRequest = request;
  try { return await request; }
  finally { if (mediaListRequest === request) mediaListRequest = null; }
}


export async function deleteMedia(name) {
  const res = await fetch(`${API_URL}/api/media/${encodeURIComponent(name)}`, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) throw new Error('Δεν διαγράφηκε.');
  invalidateMediaList();
}

export async function deleteAllMedia(kind = 'all') {
  const res = await fetch(`${API_URL}/api/media?kind=${encodeURIComponent(kind)}`, { method: 'DELETE', headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Δεν διαγράφηκαν τα αρχεία.');
  invalidateMediaList();
  return data;
}
