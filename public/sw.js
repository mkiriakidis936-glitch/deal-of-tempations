// Service worker: PWA (offline κέλυφος) + push ειδοποιήσεις.
// Άλλαξε το VERSION όταν θες να καθαριστεί η cache σε όλες τις συσκευές.
const VERSION = 'v1';
const RUNTIME = `dot-runtime-${VERSION}`;
const SHELL_KEY = '/__shell';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('dot-') && k !== RUNTIME).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

const HASHED = /\/assets\/.+-[A-Za-z0-9_-]{8,}\.(js|css)$/;
const STATIC = /\.(png|jpe?g|webp|gif|svg|ico|woff2?|ttf)$/i;

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/media/') || url.pathname === '/sw.js') return;

  // Σελίδες: πρώτα δίκτυο, αλλιώς το τελευταίο κέλυφος της εφαρμογής (SPA)
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME);
      try {
        const res = await fetch(req);
        if (res.ok) cache.put(SHELL_KEY, res.clone());
        return res;
      } catch {
        return (await cache.match(SHELL_KEY)) || new Response('Είσαι εκτός σύνδεσης.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
    })());
    return;
  }

  // Hashed build αρχεία: cache-first (δεν αλλάζουν ποτέ)
  if (HASHED.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME);
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    })());
    return;
  }

  // Εικόνες/γραμματοσειρές: stale-while-revalidate
  if (STATIC.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME);
      const hit = await cache.match(req);
      const net = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })());
  }
});

self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = { body: event.data?.text() }; }
  event.waitUntil(self.registration.showNotification(d.title || 'Deal of Temptation', {
    body: d.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    data: { url: d.url || '/admin' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/admin', self.location.origin).href;
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      if (new URL(w.url).origin !== self.location.origin) continue;
      try { await w.focus(); if ('navigate' in w) await w.navigate(target); return; } catch { /* πρόσεξε το επόμενο */ }
    }
    await self.clients.openWindow(target);
  })());
});
