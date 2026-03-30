const CACHE_NAME = 'rugbyscore-v1';
const STATIC_ASSETS = [
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap'
];

// Install: cache static assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Always fetch Supabase API calls from network — never cache
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For everything else: try network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then(function(networkResponse) {
        // Update cache with fresh response
        var responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      })
      .catch(function() {
        // Network failed — serve from cache
        return caches.match(event.request).then(function(cached) {
          return cached || caches.match('/index.html');
        });
      })
  );
});
