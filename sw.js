const CACHE_NAME = 'marido-de-aluguel-hub-v1';
// Use relative URLs so the service worker works correctly when served under
// a GitHub Pages subpath (e.g. /owner/repo/). The SW scope will be the
// directory where the file is served, so './' and './index.html' are correct.
const APP_SHELL_URLS = [
  './',
  './index.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  try {
    const accept = event.request.headers.get('accept') || '';
    if (accept.includes('text/html')) {
      event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
      );
      return;
    }
  } catch (e) {
    // If headers aren't accessible for some reason, fall back to network
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then(networkResponse => {
        try {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            try { cache.put(event.request, responseToCache); } catch (_) { }
          });
        } catch (_) { /* ignore caching errors */ }
        return networkResponse;
      }).catch(() => {
        // final fallback: attempt to match by URL path
        return caches.match(new Request('./index.html'));
      });
    })
  );
});
