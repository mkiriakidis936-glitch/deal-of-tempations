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
      if (document.visibilityState === 'hidden') return;
      fetchServerVersion().then((info) => { if (alive) setServer(info); }).catch(() => {});
    };
    check();
    const id = setInterval(check, CHECK_MS);
    document.addEventListener('visibilitychange', check);
    return () => { alive = false; clearInterval(id); document.removeEventListener('visibilitychange', check); };
  }, []);
  return server && !isSameBuild(server) ? server : null;
}

export async function reloadToLatest() {
  try {
    const regs = await navigator.serviceWorker?.getRegistrations?.();
    await Promise.all((regs || []).map((reg) => reg.update().catch(() => {})));
  } catch { /* χωρίς service worker */ }
  window.location.reload();
}
