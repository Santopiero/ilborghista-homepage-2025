// src/lib/store.js
// ============================================================================
// STORE PRINCIPALE
// Gestisce utenti, borghi, attività (POI), creators, video e chat
// ============================================================================

// -------------------------------- UTILS ------------------------------------
function readFromLocalStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeToLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("Errore salvataggio localStorage", err);
  }
}

// Slugify uniforme per route e ricerche
export function slugify(str = "") {
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ============================================================================
// UTENTE
// ============================================================================
const USER_KEY = "ib_user";

export function getCurrentUser() {
  return readFromLocalStorage(USER_KEY, null);
}

export function setCurrentUser(user) {
  writeToLocalStorage(USER_KEY, user);
}

export function logoutUser() {
  localStorage.removeItem(USER_KEY);
}

// ============================================================================
// CREATORS
// ============================================================================
const CREATORS_KEY = "ib_creators";

export function listCreators() {
  return readFromLocalStorage(CREATORS_KEY, []);
}

export function getCreator(id) {
  return listCreators().find((c) => c.id === id) || null;
}

export function addCreator(creator) {
  const creators = listCreators();
  creators.push(creator);
  writeToLocalStorage(CREATORS_KEY, creators);
  return creator;
}

export function updateCreator(updated) {
  const creators = listCreators();
  const idx = creators.findIndex((c) => c.id === updated.id);
  if (idx >= 0) {
    creators[idx] = updated;
    writeToLocalStorage(CREATORS_KEY, creators);
    return true;
  }
  return false;
}

// Profilo creator associato all'utente loggato
export function getMyCreatorProfile() {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;
  const creators = listCreators();
  return creators.find((c) => c.userId === currentUser.id) || null;
}

// ============================================================================
// BORGHI
// ============================================================================
const BORGHI_KEY = "ib_borghi";

export function listBorghi() {
  return readFromLocalStorage(BORGHI_KEY, []);
}

export function getBorgo(slug) {
  return listBorghi().find((b) => b.slug === slug) || null;
}

// Alias utili
export const findBorgoBySlug = getBorgo;

export function findBorgoByName(name) {
  const s = slugify(name);
  return (
    listBorghi().find(
      (b) => b.slug === s || slugify(b.name) === s
    ) || null
  );
}

// ============================================================================
// ATTIVITÀ / POI
// ============================================================================
const ATTIVITA_KEY = "ib_attivita";

// Struttura tipica item attività: { id, borgoSlug, type, name, indirizzo, ... }

export function listAttivita() {
  return readFromLocalStorage(ATTIVITA_KEY, []);
}

export function getAttivita(id) {
  return listAttivita().find((p) => p.id === id) || null;
}

export function listAttivitaByBorgo(borgoSlug) {
  return listAttivita().filter((p) => p.borgoSlug === borgoSlug);
}

// CRUD opzionale
export function addAttivita(item) {
  const items = listAttivita();
  items.push(item);
  writeToLocalStorage(ATTIVITA_KEY, items);
  return item;
}

export function updateAttivita(updated) {
  const items = listAttivita();
  const idx = items.findIndex((p) => p.id === updated.id);
  if (idx >= 0) {
    items[idx] = updated;
    writeToLocalStorage(ATTIVITA_KEY, items);
    return true;
  }
  return false;
}

// Alias per compatibilità con codice che usa "poi"
export const listPoi = listAttivita;
export const findPoiById = getAttivita;
export const listPoiByBorgo = listAttivitaByBorgo;

// ============================================================================
// VIDEO
// ============================================================================
const VIDEOS_KEY = "ib_videos";

// Struttura tipica video:
// {
//   id, title, youtubeUrl,
//   borgoSlug,                 // per Home Borgo
//   // Opzione A (consigliata):
//   poiId,                     // per collegamento diretto a una scheda attività
//   // Opzione B (compatibilità legacy):
//   entityType: "poi", entityId: "...",
//   creatorId, createdAt
// }

export function readVideos() {
  return readFromLocalStorage(VIDEOS_KEY, []);
}

export function saveVideos(videos) {
  writeToLocalStorage(VIDEOS_KEY, videos);
}

// Aggiunge il video in testa (più recente per primo)
export function addVideo(video) {
  const v = {
    id: video.id || "vid_" + Date.now(),
    title: video.title || "Video",
    youtubeUrl: video.youtubeUrl,
    borgoSlug: video.borgoSlug || null,
    poiId: video.poiId || null,
    entityType: video.entityType || (video.poiId ? "poi" : video.entityType) || null,
    entityId: video.entityId || video.poiId || null,
    creatorId: video.creatorId || null,
    createdAt: video.createdAt || new Date().toISOString(),
  };
  const videos = readVideos();
  videos.unshift(v); // più recente in testa
  saveVideos(videos);
  return v;
}

export function listLatestVideos(limit = 6) {
  return readVideos().slice(0, limit);
}

export function listCreatorVideos(creatorId) {
  return readVideos().filter((v) => v.creatorId === creatorId);
}

// Alias richiesto dalle pagine esistenti
export const listVideosByCreator = listCreatorVideos;

export function listVideosByBorgo(borgoSlug) {
  return readVideos().filter((v) => v.borgoSlug === borgoSlug);
}

export function listVideosByEntity(entityType, entityId) {
  return readVideos().filter(
    (v) => v.entityType === entityType && v.entityId === entityId
  );
}

// Utility dirette per pagine Borgo/POI
export function getVideosByBorgo(slug) {
  return listVideosByBorgo(slug);
}

export function getVideosByPoi(poiId) {
  const all = readVideos();
  return all.filter(
    (v) => v.poiId === poiId || (v.entityType === "poi" && v.entityId === poiId)
  );
}

// ============================================================================
// RICERCA (Home → Borgo / POI)
// ============================================================================
export function searchNavigateTarget(input) {
  if (!input || !input.trim()) return { type: null };
  const text = input.trim();
  const s = slugify(text);

  // 1) Match diretto borgo (slug o nome)
  const bySlug = findBorgoBySlug(s);
  if (bySlug) return { type: "borgo", slug: bySlug.slug };

  const byName = findBorgoByName(text);
  if (byName) return { type: "borgo", slug: byName.slug };

  // 2) Match attività/POI per nome slugificato
  const poi =
    listAttivita().find((p) => slugify(p.name) === s) || null;
  if (poi) return { type: "poi", slug: poi.borgoSlug, poiId: poi.id };

  return { type: null };
}

// ============================================================================
// CHAT (RE-EXPORT da chat-store.js per compatibilità)
// ============================================================================
export {
  createThread,
  getThread,
  listThreadsForUser,
  addMessage,
  sendMessage,
  getThreadById,
  getCurrentUserId,
} from "./chat-store.js";
