// Minimal offline shell for P0 installability. P2 upgrades to full Workbox caching + Sheets queue.
self.addEventListener("install", () => { self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", () => {});
