// src/lib/pushClient.js
// Client per attivare e testare le notifiche Web Push (VAPID)

const ICON  = "/icons/icon-192.png";    // presenti in /public/icons
const BADGE = "/icons/icon-192.png";    // riuso la 192 anche come badge

/* ================= Utilità ================= */

// Converte Base64URL -> Uint8Array (necessario per applicationServerKey)
function urlBase64ToUint8Array(base64String) {
  if (!base64String || typeof base64String !== "string") return new Uint8Array();
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

export const hasPushSupport =
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

const isSecure = () =>
  (typeof window !== "undefined" && window.isSecureContext) ||
  ["localhost", "127.0.0.1"].includes(location.hostname);

/* Garantisce che il Service Worker sia pronto e registrato */
async function ensureSW() {
  if (!hasPushSupport) throw new Error("Questo browser non supporta le push.");
  if (!isSecure()) throw new Error("Le notifiche richiedono HTTPS (o localhost in sviluppo).");

  let reg = await navigator.serviceWorker.getRegistration();
  if (!reg) {
    reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  }
  await navigator.serviceWorker.ready;
  return reg;
}

/* Ritorna la subscription esistente (JSON) se presente */
export async function getExistingSubscriptionJSON() {
  if (!hasPushSupport) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  return sub ? sub.toJSON() : null;
}

/**
 * Richiede permesso, registra SW (se serve) e sottoscrive con VAPID.
 * Ritorna la subscription come JSON (da inviare al backend).
 */
export async function enableNotifications() {
  if (!hasPushSupport) throw new Error("Questo browser non supporta le push.");
  if (!isSecure()) throw new Error("Le notifiche richiedono HTTPS (o localhost).");

  if (Notification.permission === "denied") {
    throw new Error("Notifiche bloccate dal browser. Sbloccale nelle impostazioni del sito.");
  }
  if (Notification.permission !== "granted") {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") throw new Error("Permesso notifiche non concesso.");
  }

  const reg = await ensureSW();

  // Già iscritti?
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const vapid = (import.meta.env.VITE_VAPID_PUBLIC_KEY || "").trim();
    if (!vapid) throw new Error("VAPID public key mancante. Imposta VITE_VAPID_PUBLIC_KEY nel file .env");
    if (!/^[A-Za-z0-9_\-]{80,140}$/.test(vapid)) {
      throw new Error("VAPID public key non valida (atteso formato Base64URL).");
    }
    const applicationServerKey = urlBase64ToUint8Array(vapid);
    if (!applicationServerKey?.length) throw new Error("Conversione VAPID key fallita.");

    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
  }

  const json = sub.toJSON();

  // Non bloccare se il backend non risponde
  try {
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(json),
    });
  } catch {}

  return json;
}

/* Per test locali: mostra una notifica immediata dal SW */
export async function showLocalTest() {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) throw new Error("Service Worker non registrato.");
  if (Notification.permission !== "granted") throw new Error("Consenti prima le notifiche.");

  return reg.showNotification("Il Borghista", {
    body: "Prova notifica: tutto ok ✅",
    icon: ICON,
    badge: BADGE,
    data: { url: "/" },
    tag: "local-test",
  });
}

/* Facoltativo: per reset durante i test */
export async function unsubscribePush() {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) await sub.unsubscribe();
}
