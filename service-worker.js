// Bible Summaries PWA — Service Worker
const CACHE_NAME = 'bible-summaries-v5';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './marked.min.js',
  './version.json',
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

// Fetch: network-first, fall back to cache
self.addEventListener('fetch', event => {
  if (event.request.url.includes('version.json')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
