self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener("fetch", (e) => {
  // Pass-through strategy to satisfy PWA installation checks cleanly
  e.respondWith(fetch(e.request));
});
