// Ratneswar ERP service worker cleanup.
// Offline interception is disabled because authenticated ERP navigation must
// always expose the real Cloudflare/Next.js response rather than masking
// runtime failures behind an offline fallback.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))),
      self.registration.unregister(),
      self.clients.claim(),
    ])
  );
});
