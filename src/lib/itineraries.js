// Storage chiave unica
const KEY = "ib_itineraries_v1";

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
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  localStorage.setItem(KEY, JSON.stringify(all));
  return all[idx];
}

// Stato → in revisione
export function submitForReview(id) {
  return updateItinerary(id, { status: "in_revisione" });
}

// Stato → pubblicato (stub)
export function publish(id) {
  return updateItinerary(id, { status: "pubblicato" });
}

// Elimina
export function removeItinerary(id) {
  const all = JSON.parse(localStorage.getItem(KEY) || "[]");
  const next = all.filter((i) => i.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
}
