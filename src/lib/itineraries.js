// src/lib/itineraries.js

import { BORGI_BY_SLUG } from "../data/borghi";

// Storage chiave unica
const KEY = "ib_itineraries_v1";

const norm = (s) => String(s || "").trim().toLowerCase();

const getLL = (slug) => {
  const b = BORGI_BY_SLUG?.[slug];
  const lat = b?.lat ?? b?.latitude ?? b?.geo?.lat ?? b?.coords?.lat;
  const lng = b?.lng ?? b?.longitude ?? b?.geo?.lng ?? b?.coords?.lng;
  return (typeof lat === "number" && typeof lng === "number") ? { lat, lng } : null;
};
const toRad = (d) => (d * Math.PI) / 180;
const haversineKm = (a, b) => {
  if (!a || !b) return null;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

// Leggi tutto (filtrabile per status)
export function listMyItineraries(userId, status) {
  const all = JSON.parse(localStorage.getItem(KEY) || "[]");
  const mine = all.filter((i) => i.userId === userId);
  return typeof status === "string" ? mine.filter((i) => i.status === status) : mine;
}

// Crea bozza
export function createDraft(userId) {
  const all = JSON.parse(localStorage.getItem(KEY) || "[]");
  const id = "itin_" + Math.random().toString(36).slice(2, 10);
  const now = new Date().toISOString();
  const draft = {
    id, userId, status: "bozza",
    title: "", mainBorgoSlug: "", dateOfTrip: "", duration: "",
    tags: [], summary: "", stops: [],
    finalTips: { howToArrive: "", parking: "", bestPeriod: "", extraTips: "" },
    // NB: le immagini pesanti stanno in IndexedDB -> qui salvo solo le chiavi
    galleryKeys: [],
    coverUrl: "", createdAt: now, updatedAt: now,
  };
  all.unshift(draft);
  localStorage.setItem(KEY, JSON.stringify(all));
  return draft;
}

// Leggi per id
export function getItinerary(id) {
  const all = JSON.parse(localStorage.getItem(KEY) || "[]");
  return all.find((i) => i.id === id) || null;
}

// Aggiorna (merge patch)
export function updateItinerary(id, patch) {
  const all = JSON.parse(localStorage.getItem(KEY) || "[]");
  const idx = all.findIndex((i) => i.id === id);
  if (idx === -1) return null;

  // normalizza slug se presente
  const next = { ...all[idx], ...patch };
  if (typeof next.mainBorgoSlug === "string") next.mainBorgoSlug = norm(next.mainBorgoSlug);

  next.updatedAt = new Date().toISOString();
  all[idx] = next;
  localStorage.setItem(KEY, JSON.stringify(all));
  return next;
}

// Stato → in revisione
export function submitForReview(id) {
  return updateItinerary(id, { status: "in_revisione" });
}

// Stato → pubblicato
export function publish(id) {
  return updateItinerary(id, { status: "pubblicato" });
}

// Elimina
export function removeItinerary(id) {
  const all = JSON.parse(localStorage.getItem(KEY) || "[]");
  const next = all.filter((i) => i.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
}

/* ===== Nuovo: lista itinerari pubblicati vicino a un borgo =====
   - radiusKm = 0  -> solo lo stesso borgo
   - radiusKm > 0  -> include anche i borghi limitrofi entro raggio (centro-centro)
*/
export function listPublishedNear(borgoSlug, radiusKm = 0) {
  const targetSlug = norm(borgoSlug);
  const targetLL = getLL(targetSlug);

  const all = JSON.parse(localStorage.getItem(KEY) || "[]");
  const pubs = all.filter((i) => i.status === "pubblicato" && i.mainBorgoSlug);

  const out = [];
  for (const it of pubs) {
    const itSlug = norm(it.mainBorgoSlug);
    if (!itSlug) continue;

    if (!targetLL || radiusKm <= 0) {
      if (itSlug === targetSlug) out.push({ ...it, distanceKm: 0 });
      continue;
    }

    const itLL = getLL(itSlug);
    const d = haversineKm(targetLL, itLL);
    if (d == null) continue;
    if (d <= radiusKm) out.push({ ...it, distanceKm: d });
  }

  // ordine: più vicini prima, poi i più recenti
  out.sort((a, b) => {
    const da = typeof a.distanceKm === "number" ? a.distanceKm : Infinity;
    const db = typeof b.distanceKm === "number" ? b.distanceKm : Infinity;
    if (da !== db) return da - db;
    return (b.updatedAt || "").localeCompare(a.updatedAt || "");
  });

  return out;
}
