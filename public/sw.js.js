/* SW minimale per essere installabile */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
// Un listener fetch (anche no-op) aiuta alcuni browser a considerare il SW "attivo"
self.addEventListener("fetch", () => {});
