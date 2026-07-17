// Minimal offline support for ExploQR SJDM. No precache manifest (hashed
// build filenames aren't known ahead of time without a bundler plugin) —
// instead, everything gets cached the first time it's actually requested,
// so a visitor who's loaded the app (and viewed a spot's tiles/photos)
// before heading to a low-signal spot like Balagbag or Kaytitinga Falls can
// still reopen it offline.
// Bumped to v2 with the next/image migration: photos are now requested via
// same-origin /_next/image, so the v1 caches full of raw upload.wikimedia.org
// responses are dead weight and would never be read again.
const CACHE_VERSION = "v2";
const STATIC_CACHE = `exploqr-static-${CACHE_VERSION}`;
const MEDIA_CACHE = `exploqr-media-${CACHE_VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, MEDIA_CACHE];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("exploqr-") && !CURRENT_CACHES.includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isNextStaticAsset(url) {
  return url.origin === self.location.origin && url.pathname.startsWith("/_next/static/");
}

// Map tiles (CARTO) and spot photos — the assets a visitor needs to keep
// browsing a spot they've already opened once.
//
// Photos reach us as same-origin /_next/image?url=… requests, since
// next/image proxies them through the optimizer. Matching upload.wikimedia.org
// directly is kept for the 360° panoramas, which Pannellum fetches itself and
// which never pass through next/image.
function isCachableMedia(url) {
  return (
    url.hostname.endsWith("basemaps.cartocdn.com") ||
    url.hostname === "upload.wikimedia.org" ||
    (url.origin === self.location.origin && url.pathname === "/_next/image")
  );
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  const cache = await caches.open(cacheName);
  cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkFetch = fetch(request)
    .then((response) => {
      cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  return cached || (await networkFetch);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isNextStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (isCachableMedia(url)) {
    event.respondWith(staleWhileRevalidate(request, MEDIA_CACHE));
    return;
  }
});
