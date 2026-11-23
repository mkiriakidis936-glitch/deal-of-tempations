import { useEffect, useState } from 'react';

/* global __APP_VERSION__, __APP_BUILD__, __APP_BUILT_AT__ */
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';
export const APP_BUILD = typeof __APP_BUILD__ !== 'undefined' ? __APP_BUILD__ : 'dev';
export const APP_BUILT_AT = typeof __APP_BUILT_AT__ !== 'undefined' ? __APP_BUILT_AT__ : '';

export async function fetchServerVersion() {
  const res = await fetch('/api/version', { cache: 'no-store' });
  if (!res.ok) throw new Error('Δεν βρέθηκαν πληροφορίες έκδοσης.');
  return res.json();
}

export const isSameBuild = (server) => !server?.build || server.build === 'dev' || APP_BUILD === 'dev' || server.build === APP_BUILD;

const CHECK_MS = 5 * 60 * 1000;

export function useUpdateAvailable() {
  const [server, setServer] = useState(null);
  useEffect(() => {
    let alive = true;
    const check = () => {
      if (document.visibilityState === 'hidden' || !autoCheckEnabled()) return;
      fetchServerVersion().then((info) => { markChecked(); if (alive) setServer(info); }).catch(() => {});
    };
    check();
    const id = setInterval(check, CHECK_MS);
    document.addEventListener('visibilitychange', check);
    return () => { alive = false; clearInterval(id); document.removeEventListener('visibilitychange', check); };
  }, []);
  return server && !isSameBuild(server) ? server : null;
}

const LAST_VERSION_KEY = 'dot_installed_version';
const AUTO_CHECK_KEY = 'dot_update_autocheck';
const LAST_CHECK_KEY = 'dot_update_last_check';

const store = {
  get: (key) => { try { return localStorage.getItem(key); } catch { return null; } },
  set: (key, value) => { try { localStorage.setItem(key, value); } catch { /* ιδιωτική περιήγηση */ } },
};

export const autoCheckEnabled = () => store.get(AUTO_CHECK_KEY) !== 'off';
export const setAutoCheck = (on) => store.set(AUTO_CHECK_KEY, on ? 'on' : 'off');
export const lastCheckAt = () => Number(store.get(LAST_CHECK_KEY)) || 0;
export const markChecked = () => store.set(LAST_CHECK_KEY, String(Date.now()));

// Μετά από ενημέρωση: επιστρέφει την έκδοση που μόλις εγκαταστάθηκε (μία φορά), αλλιώς null.
export function consumeJustUpdated() {
  const previous = store.get(LAST_VERSION_KEY);
  store.set(LAST_VERSION_KEY, APP_VERSION);
  return previous && previous !== APP_VERSION ? { from: previous, to: APP_VERSION } : null;
}

// «Εγκατάσταση» όπως σε εφαρμογή: κατεβάζει τη νέα σελίδα, ανανεώνει τον service worker,
// καθαρίζει τα παλιά αρχεία και επανεκκινεί. onStep('download' | 'install' | 'restart').
export async function installUpdate(onStep = () => {}) {
  onStep('download');
  try { await fetch('/', { cache: 'reload', credentials: 'same-origin' }); } catch { /* συνεχίζουμε */ }
  onStep('install');
  try {
    const regs = await navigator.serviceWorker?.getRegistrations?.();
    await Promise.all((regs || []).map((reg) => reg.update().catch(() => {})));
    const keys = await caches?.keys?.();
    await Promise.all((keys || []).filter((key) => key.startsWith('dot-')).map((key) => caches.delete(key)));
  } catch { /* χωρίς service worker / cache */ }
  onStep('restart');
  await new Promise((resolve) => setTimeout(resolve, 600));
  window.location.reload();
}

export async function reloadToLatest() {
  await installUpdate();
}
