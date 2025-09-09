/* public/sw.js */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});

const ICON = "/icons/icon-192.png";     // <- esiste nella tua cartella
const BADGE = "/icons/icon-192.png";    // riuso la 192 anche come badge

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Il Borghista", body: event.data?.text() || "" };
  }

  const title = payload.title || "Il Borghista";
  const options = {
    body: payload.body || "Nuovo aggiornamento",
    icon: ICON,
    badge: BADGE,           // puoi anche rimuovere questa riga se non la vuoi
    data: { url: payload.url || "/", ...payload.data },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ("focus" in c) { c.navigate(url); return c.focus(); } }
      return clients.openWindow ? clients.openWindow(url) : null;
    })
  );
});
