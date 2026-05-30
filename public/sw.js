const CACHE_NAME = "aether-goals-v19";
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Bypass next dev HMR & webpack hot-reloader connections
  if (url.pathname.startsWith("/_next/webpack-hmr") || url.pathname.includes("hot-update")) {
    return;
  }

  const isApiOrDatabase = url.pathname.startsWith("/api") || url.host.includes("supabase.co");

  if (isApiOrDatabase) {
    // DO NOT cache Supabase or API traffic.
    // Dynamic database responses must always be fresh or fail securely.
    event.respondWith(fetch(event.request).catch(() => new Response(JSON.stringify({ error: "Offline" }), { status: 503, headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  // Cache-First strategy for static code files, next bundles, and image graphics
  const isStaticAsset =
    ASSETS_TO_CACHE.includes(url.pathname) ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".json");

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              event.waitUntil(
                caches.open(CACHE_NAME).then((cache) => {
                  return cache.put(event.request, responseToCache);
                })
              );
            }
            return networkResponse;
          })
          .catch(() => caches.match("/").then(res => res || new Response("Offline", { status: 503 })));
      })
    );
  } else {
    // Default: Stale-While-Revalidate for default routing page navigations
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              event.waitUntil(
                caches.open(CACHE_NAME).then((cache) => {
                  return cache.put(event.request, responseToCache);
                })
              );
            }
            return networkResponse;
          })
          .catch(() => {
            if (event.request.mode === "navigate") {
              return caches.match("/").then(res => res || new Response("Offline", { status: 503 }));
            }
            return caches.match(event.request).then(res => res || new Response("Offline", { status: 503 }));
          });

        return cachedResponse || fetchPromise;
      })
    );
  }
});
