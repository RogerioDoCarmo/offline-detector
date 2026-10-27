// Service worker of the installed demo: it keeps the page itself available offline and leaves
// everything else alone. In particular it never answers a reachability probe: only same-origin
// navigations and the demo's own static files are handled, and the cross-origin probe URLs (and
// any other request) go straight to the network, so the detector can still tell the truth.
const CACHE = 'od-demo-v1';
const BASE = '/offline-detector/demo/';
const STATIC = `${BASE}_next/static/`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const page = await fetch(BASE, { cache: 'reload' });
      await cache.put(BASE, page.clone());
      // The page references its scripts and styles by absolute path: cache those too, so the
      // first offline reload does not depend on a visit the worker was not yet controlling.
      const assets = new Set(
        (await page.text()).match(
          /\/offline-detector\/demo\/_next\/static\/[^"'\x5c)\s]+/g,
        ),
      );
      await Promise.all(
        [...assets, `${BASE}manifest.webmanifest`, `${BASE}icon-192.png`].map((url) =>
          cache.add(url),
        ),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate' && url.pathname.startsWith(BASE)) {
    event.respondWith(
      fetch(request).catch(
        async () => (await caches.match(request)) ?? caches.match(BASE),
      ),
    );
  } else if (url.pathname.startsWith(STATIC)) {
    event.respondWith(caches.match(request).then((hit) => hit ?? fetch(request)));
  }
});
