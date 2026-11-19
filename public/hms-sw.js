// BinGi HMS app (PWA) service worker. Network first: the HMS always shows live data.
// Only when the network is gone does a page fall back to a small offline page. Nothing private is cached.
const CACHE = "bingi-hms-app-v2";
const OFFLINE = "/hms-app/offline.html";
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll([OFFLINE]))); self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", (e) => {
  if (e.request.mode !== "navigate") return;
  e.respondWith(fetch(e.request).catch(() => caches.match(OFFLINE)));
});
