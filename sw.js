/* =============================================
   SERVICE WORKER — Behind The Label
   Caches page assets for fast loads on slow wifi.
   Signature queuing is handled by petition.js,
   not here, because cross-origin POSTs to Google
   Apps Script can't be intercepted by a SW.
============================================= */

const CACHE_NAME = 'btl-petition-v2';

const PRECACHE = [
  './',
  './index.html',
  './petition.html',
  './petition.js',
];

// ── Install: pre-cache shell files ───────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: remove old caches ──────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch strategy ───────────────────────────────────
// Google APIs: always go straight to network (no interception)
// Google Fonts / CDN: network-first, cache fallback
// Same-origin assets: cache-first, update in background
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept Google Apps Script calls — let petition.js handle offline logic
  if (url.hostname === 'script.google.com') return;

  // External CDN (fonts etc.) — network first, cache as fallback
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Same-origin — cache first, refresh in background (stale-while-revalidate)
  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(request).then(cached => {
        const networkFetch = fetch(request).then(res => {
          cache.put(request, res.clone());
          return res;
        }).catch(() => {});
        return cached || networkFetch;
      })
    )
  );
});
