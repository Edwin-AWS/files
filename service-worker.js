// Bible Summaries PWA — Service Worker
const CACHE_NAME = 'bible-summaries-v6';

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
  './summaries/2Kings.md',
  './summaries/1Chronicles.md',
  './summaries/2Chronicles.md',
  './summaries/Ezra.md',
  './summaries/Nehemiah.md',
  './summaries/Esther.md',
  './summaries/Job.md',
  './summaries/Psalms.md',
  './summaries/Proverbs.md',
  './summaries/Ecclesiastes.md',
  './summaries/SongofSolomon.md',
  './summaries/Isaiah.md',
  './summaries/Jeremiah.md',
  './summaries/Lamentations.md',
  './summaries/Ezekiel.md',
  './summaries/Daniel.md',
  './summaries/Hosea.md',
  './summaries/Joel.md',
  './summaries/Amos.md',
  './summaries/Obadiah.md',
  './summaries/Jonah.md',
  './summaries/Micah.md',
  './summaries/Nahum.md',
  './summaries/Habakkuk.md',
  './summaries/Zephaniah.md',
  './summaries/Haggai.md',
  './summaries/Zechariah.md',
  './summaries/Malachi.md',
  './summaries/Matthew.md',
  './summaries/Mark.md',
  './summaries/Luke.md',
  './summaries/John.md',
  './summaries/Acts.md',
  './summaries/Romans.md',
  './summaries/1Corinthians.md',
  './summaries/2Corinthians.md',
  './summaries/Galatians.md',
  './summaries/Ephesians.md',
  './summaries/Philippians.md',
  './summaries/Colossians.md',
  './summaries/1Thessalonians.md',
  './summaries/2Thessalonians.md',
  './summaries/1Timothy.md',
  './summaries/2Timothy.md',
  './summaries/Titus.md',
  './summaries/Philemon.md',
  './summaries/Hebrews.md',
  './summaries/James.md',
  './summaries/1Peter.md',
  './summaries/2Peter.md',
  './summaries/1John.md',
  './summaries/2John.md',
  './summaries/3John.md',
  './summaries/Jude.md',
  './summaries/Revelation.md',
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
