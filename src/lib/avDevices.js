// Συσκευές ήχου/εικόνας ΑΝΑ ΣΥΣΚΕΥΗ (TV, Tablet): κάμερα, μικρόφωνο USB-C, έξοδος ήχου (κάρτα ήχου USB-C / ασύρματα ακουστικά).
// Αποθηκεύονται τοπικά στον browser της συσκευής από τη σελίδα /av-setup και εφαρμόζονται σε όλο το παιχνίδι.
const KEY = 'dot_av_devices_v1';

export function loadAv() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; }
}
export function saveAv(next) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...loadAv(), ...next })); } catch { /* χωρίς storage */ }
}

export const videoConstraints = (extra = {}) => {
  const { camera } = loadAv();
  return camera ? { deviceId: { exact: camera }, ...extra } : extra;
};
export const audioConstraints = () => {
  const { mic } = loadAv();
  return mic ? { deviceId: { exact: mic }, echoCancellation: false, noiseSuppression: false } : true;
};

// Έξοδος ήχου: setSinkId σε κάθε <audio>/<video> και στο WebAudio (Chrome/Edge). Στο Safari ακολουθεί την έξοδο του συστήματος.
export const canChooseOutput = () => typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype;
export function applyOutput(root = document) {
  const { speaker } = loadAv();
  if (!speaker || !canChooseOutput()) return;
  root.querySelectorAll('audio, video').forEach((el) => {
    if (el.sinkId !== speaker) el.setSinkId(speaker).catch(() => {});
  });
}
export function applyOutputToContext(ctx) {
  const { speaker } = loadAv();
  if (speaker && ctx && typeof ctx.setSinkId === 'function' && ctx.sinkId !== speaker) ctx.setSinkId(speaker).catch(() => {});
}

// Τρέχει σε TV/Tablet: εφαρμόζει την επιλεγμένη έξοδο και σε βίντεο/ήχους που εμφανίζονται αργότερα.
export function startOutputRouting() {
  if (typeof window === 'undefined' || !loadAv().speaker) return () => {};
  applyOutput();
  const id = setInterval(applyOutput, 2000);
  return () => clearInterval(id);
}
