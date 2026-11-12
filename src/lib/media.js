import { base44, getToken } from '@/api/base44Client';
import { applyMediaOverrides } from '@/data/brandArt';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const MEDIA_KEY = 'media_overrides';
const IMG_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;
const VID_EXT = /\.(mp4|webm|mov)$/i;
const HEIC = /\.(heic|heif)$/i;

export async function fetchOverrides() {
  const { items } = await base44.entities.AppSetting.filter({ key: MEDIA_KEY }, { limit: 1 });
  return items?.[0] || null;
}

// Φορτώνει τις αλλαγές του Admin και τις εφαρμόζει πριν ξεκινήσει το React.
// Αν ο server αργεί/πέσει, η εφαρμογή ανοίγει κανονικά με τα αρχικά αρχεία.
export async function loadMedia() {
  try {
    const rec = await Promise.race([
      fetchOverrides(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);
    applyMediaOverrides(rec?.value || {});
  } catch (e) {
    console.warn('[media] χρήση αρχικών αρχείων:', e.message);
  }
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
  if (!IMG_EXT.test(file.name) && !VID_EXT.test(file.name) && !HEIC.test(file.name)) {
    throw new Error(`«${file.name}»: μη υποστηριζόμενος τύπος (JPG, PNG, WEBP, MP4, WEBM, MOV).`);
  }
  const f = HEIC.test(file.name) || IMG_EXT.test(file.name) ? await prepareImage(file) : file;
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
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error(data.error || `Σφάλμα ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('Πρόβλημα σύνδεσης κατά το ανέβασμα.'));
    xhr.send(f);
  });
}

const authHeaders = () => { const t = getToken(); return t ? { Authorization: `Bearer ${t}` } : {}; };

export async function listMedia() {
  const res = await fetch(`${API_URL}/api/media`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Δεν φορτώθηκε η βιβλιοθήκη.');
  return (await res.json()).items || [];
}

export async function deleteMedia(name) {
  const res = await fetch(`${API_URL}/api/media/${encodeURIComponent(name)}`, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) throw new Error('Δεν διαγράφηκε.');
}
