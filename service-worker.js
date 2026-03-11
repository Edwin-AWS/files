// Bible Summaries PWA — Service Worker
const CACHE_NAME = 'bible-summaries-v1';

// App shell: files to cache immediately on install
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  // Summaries (add more as Mateo writes them)
  './summaries/Genesis.md',
  './summaries/Exodus.md',
  './summaries/Leviticus.md',
  './summaries/Numbers.md',
  './summaries/Deuteronomy.md',
  './summaries/Joshua.md',
  './summaries/Judges.md',
  './summaries/Ruth.md',
  './summaries/1Samuel.md',
  './summaries/2Samuel.md',
  './summaries/1Kings.md',
  // External: marked.js
  'https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js',
];

// Install: cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for app files, network-first for Bible API
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Bible API — always try network, fall back to cache
  if (url.hostname === 'bible-api.com') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Everything else: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
