import { request } from '@/api/base44Client';

export const pushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function deviceLabel() {
  const ua = navigator.userAgent;
  const os = /iphone/i.test(ua) ? 'iPhone' : /ipad/i.test(ua) ? 'iPad' : /android/i.test(ua) ? 'Android' : /mac/i.test(ua) ? 'Mac' : /windows/i.test(ua) ? 'Windows' : 'Συσκευή';
  const br = /edg\//i.test(ua) ? 'Edge' : /chrome|crios/i.test(ua) ? 'Chrome' : /firefox|fxios/i.test(ua) ? 'Firefox' : /safari/i.test(ua) ? 'Safari' : '';
  return `${os}${br ? ` · ${br}` : ''}${isStandalone() ? ' · εφαρμογή' : ''}`;
}

const toKey = (b64) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

export async function currentSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}

export async function enablePush() {
  if (!pushSupported()) throw new Error('Αυτός ο browser δεν υποστηρίζει ειδοποιήσεις.');
  const reg = await navigator.serviceWorker.ready;
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Οι ειδοποιήσεις είναι μπλοκαρισμένες. Επίτρεψέ τες από τις ρυθμίσεις του browser/συσκευής.');
  const { key } = await request('GET', '/api/push/public-key');
  const old = await reg.pushManager.getSubscription();
  if (old) await old.unsubscribe().catch(() => {});
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(key) });
  await request('POST', '/api/push/subscribe', { subscription: sub.toJSON(), device: deviceLabel() });
}

export async function enablePlayerPush(sessionCode, playerId) {
  if (!sessionCode || !playerId) throw new Error('Δεν έχει επιλεγεί συνεδρία και παίκτρια.');
  if (!pushSupported()) throw new Error('Η συσκευή ή ο browser δεν υποστηρίζει ειδοποιήσεις push.');
  if (isIOS() && !isStandalone()) throw new Error('Σε iPhone/iPad πρόσθεσε πρώτα το παιχνίδι στην Αφετηρία και άνοιξέ το από το εικονίδιο της εφαρμογής.');
  const reg = await navigator.serviceWorker.ready;
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Οι ειδοποιήσεις είναι απενεργοποιημένες στις ρυθμίσεις της συσκευής.');
  const { key } = await request('GET', '/api/push/public-key');
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(key) });
  }
  await request('POST', '/api/push/player-subscribe', {
    subscription: sub.toJSON(),
    sessionCode,
    playerId,
    device: deviceLabel(),
  });
  return true;
}

export async function disablePush() {
  const sub = await currentSubscription();
  if (!sub) return;
  await request('POST', '/api/push/unsubscribe', { endpoint: sub.endpoint }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}

export const sendTestPush = () => request('POST', '/api/push/test', {});
export const pushStatus = () => request('GET', '/api/push/status');

// ---- εγκατάσταση ως εφαρμογή (PWA) ----
let deferred = null;
const listeners = new Set();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; listeners.forEach((f) => f()); });
  window.addEventListener('appinstalled', () => { deferred = null; listeners.forEach((f) => f()); });
}
export const canInstall = () => !!deferred;
export const onInstallChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export async function promptInstall() {
  if (!deferred) return false;
  deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  listeners.forEach((f) => f());
  return outcome === 'accepted';
}
