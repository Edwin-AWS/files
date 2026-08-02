// Bible Summaries PWA — Service Worker
const CACHE_NAME = 'bible-summaries-v5';

// Critical assets — app won't work without these
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './marked.min.js',
  './version.json',
];

// Large assets cached opportunistically (not required for install to succeed)
const OPTIONAL_ASSETS = [
  './bible/kjv.json',
  './bible/asv.json',
  './bible/web.json',
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
  // Add remaining books here — they will be cached opportunistically
  // so a single missing file won't break installation.
];

// Install: cache critical shell first, then optional assets in background
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => {
        // Cache optional assets without blocking install
        caches.open(CACHE_NAME).then(cache => {
          OPTIONAL_ASSETS.forEach(url => {
            cache.add(url).catch(() => {
              // Silently skip assets that fail (e.g. missing summary files)
            });
          });
        });
      })
      .catch(err => {
        console.error('[SW] Install failed — critical shell could not be cached:', err);
        throw err;
      })
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

// Fetch: network-first, fall back to cache
self.addEventListener('fetch', event => {
  // Only handle GET requests — never intercept POST/PUT/DELETE etc.
  if (event.request.method !== 'GET') return;

  // version.json: network-only with cache fallback (for update detection)
  if (event.request.url.includes('version.json')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Only cache valid same-origin or CORS responses — never opaque/error responses
        if (
          response &&
          response.ok &&
          (response.type === 'basic' || response.type === 'cors')
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
