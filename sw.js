/* PartyHub — service worker
   Cachea la app y las fuentes de Google para que funcione sin internet
   despues de la primera apertura. Solo actua cuando la app se sirve por
   http(s), por ejemplo dentro del APK (Capacitor) o en un hosting. */

const CACHE = 'partyhub-v1';
const SHELL = ['./', './index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request)
        .then((res) => {
          const url = e.request.url;
          const cacheable =
            url.startsWith(self.location.origin) ||
            url.includes('fonts.googleapis.com') ||
            url.includes('fonts.gstatic.com');
          if (res.ok && cacheable) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
