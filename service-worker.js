/* Finance Chat PWA - Service Worker */
const VERSION = "v18.1.0";
const CACHE = `finance-chat-${VERSION}`;

// Network-first for HTML to avoid stale UI; cache-first for static assets.
const STATIC = [
  "./manifest.webmanifest",
  "./favicon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(STATIC);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE) ? caches.delete(k) : Promise.resolve()));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  if (req.headers.get("accept")?.includes("text/html")) {
    event.respondWith((async () => {
      try {
        return await fetch(req, { cache: "no-store" });
      } catch (e) {
        const cached = await caches.match("./index.html");
        return cached || new Response("Offline", { status: 200, headers: { "Content-Type": "text/plain" } });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      const cache = await caches.open(CACHE);
      cache.put(req, fresh.clone());
      return fresh;
    } catch (e) {
      return cached || new Response("", { status: 200 });
    }
  })());
});