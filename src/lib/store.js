// src/lib/store.js
// ============================================================================
// STORE PRINCIPALE (frontend, local-first)
// Gestisce utenti, borghi, attività (POI), creators, video (YouTube o file) e chat
// + sincronizzazione opzionale da API (/api/...) — utile con MSW o backend reale
// ============================================================================

/* ---------------------------------- UTILS --------------------------------- */
function readFromLocalStorage(key, fallback) {
  try {
    if (typeof localStorage === "undefined") return fallback;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeToLocalStorage(key, value) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("Errore salvataggio localStorage", err);
  }
}

export function slugify(str = "") {
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ---------------------------------- USER ---------------------------------- */
const USER_KEY = "ib_user";

export function getCurrentUser() {
  return readFromLocalStorage(USER_KEY, null);
}

export function setCurrentUser(user) {
  writeToLocalStorage(USER_KEY, user);
}

export function logoutUser() {
  try {
    if (typeof localStorage !== "undefined") localStorage.removeItem(USER_KEY);
  } catch {}
}

/* -------------------------------- CREATORS -------------------------------- */
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

export function getMyCreatorProfile() {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;
  const creators = listCreators();
  return creators.find((c) => c.userId === currentUser.id) || null;
}

/* --------------------------------- BORGHI --------------------------------- */
const BORGHI_KEY = "ib_borghi";

export function listBorghi() {
  return readFromLocalStorage(BORGHI_KEY, []);
}

export function getBorgo(slug) {
  return listBorghi().find((b) => b.slug === slug) || null;
}

export const findBorgoBySlug = getBorgo;

export function findBorgoByName(name) {
  const s = slugify(name);
  return (
    listBorghi().find((b) => b.slug === s || slugify(b.name) === s) || null
  );
}

/* ----------- INDICE BORGI (per datalist / wizard itinerari) --------------- */
// Torna un array leggero [{ slug, name }]
export function getBorghiIndex() {
  let items = listBorghi();
  if (!items || items.length === 0) {
    try { ensureDemoSeed(); } catch {}
    items = listBorghi();
  }
  return (items || []).map((b) => ({ slug: b.slug, name: b.name }));
}
// Snapshot iniziale
export const BORGI_INDEX = getBorghiIndex();
// Facoltativo: per ricalcolare dopo una sync
export function refreshBorghiIndex() { return getBorghiIndex(); }

/* ------------------------------- ATTIVITÀ/POI ----------------------------- */
const ATTIVITA_KEY = "ib_attivita";

export function listAttivita() {
  return readFromLocalStorage(ATTIVITA_KEY, []);
}

export function getAttivita(id) {
  return listAttivita().find((p) => p.id === id) || null;
}

export function listAttivitaByBorgo(borgoSlug) {
  return listAttivita().filter((p) => p.borgoSlug === borgoSlug);
}

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

// Alias per compatibilità col codice esistente
export const listPoi = listAttivita;
export const findPoiById = getAttivita;
export const listPoiByBorgo = listAttivitaByBorgo;

/* ------------------------------- PREFERITI -------------------------------- */
const FAV_KEY = "ib_favorites_v1";
const FAV_TYPES = new Set(["poi", "video", "borgo"]);

function _readFav() {
  const base = { poi: [], video: [], borgo: [] };
  const f = readFromLocalStorage(FAV_KEY, base);
  return {
    poi: Array.isArray(f?.poi) ? f.poi : [],
    video: Array.isArray(f?.video) ? f.video : [],
    borgo: Array.isArray(f?.borgo) ? f.borgo : [],
  };
}
function _writeFav(obj) {
  writeToLocalStorage(FAV_KEY, obj);
  _notifyFavSubscribers(obj);
}

export function listFavorites(type) {
  if (!FAV_TYPES.has(type)) return [];
  const f = _readFav();
  return Array.from(new Set(f[type]));
}

export function isFavorite(type, id) {
  if (!id || !FAV_TYPES.has(type)) return false;
  return listFavorites(type).includes(id);
}

export function setFavorite(type, id, value) {
  if (!id || !FAV_TYPES.has(type)) return isFavorite(type, id);
  const f = _readFav();
  const arr = f[type];
  const i = arr.indexOf(id);
  if (value && i === -1) arr.push(id);
  if (!value && i >= 0) arr.splice(i, 1);
  _writeFav(f);
  return arr.includes(id);
}

export function toggleFavorite(type, id) {
  return setFavorite(type, id, !isFavorite(type, id));
}

export const listFavoritePoi = () => listFavorites("poi");
export const isPoiFavorite = (id) => isFavorite("poi", id);
export const togglePoiFavorite = (id) => toggleFavorite("poi", id);
export const setPoiFavorite = (id, value) => setFavorite("poi", id, value);

const _favSubscribers = new Set();
function _notifyFavSubscribers(snapshot = null) {
  const snap = snapshot || _readFav();
  _favSubscribers.forEach((cb) => {
    try { cb(snap); } catch {}
  });
}
export function onFavoritesChange(cb) {
  if (typeof cb !== "function") return () => {};
  _favSubscribers.add(cb);
  return () => _favSubscribers.delete(cb);
}
if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  window.addEventListener("storage", (e) => {
    if (e.key === FAV_KEY) _notifyFavSubscribers();
  });
}

/* ---------------------------------- MEDIA --------------------------------- */
// (immutato – omesso per brevità nello spiegone; lasciato identico)
const MEDIA_DB = "ib_media";
const MEDIA_STORE = "videos";
function hasIndexedDB() { try { return typeof indexedDB !== "undefined" && !!indexedDB.open; } catch { return false; } }
function openMediaDB() { if (!hasIndexedDB()) return Promise.reject(new Error("IndexedDB non disponibile"));
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(MEDIA_DB, 1);
    req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains(MEDIA_STORE)) { db.createObjectStore(MEDIA_STORE, { keyPath: "id" }); } };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
export async function saveVideoFile(file) {
  const db = await openMediaDB();
  const id = "media_" + Date.now();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE, "readwrite");
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.objectStore(MEDIA_STORE).put({ id, blob: file, type: file.type || "video/mp4", createdAt: Date.now() });
  });
  db.close?.(); return id;
}
export async function getVideoBlob(mediaId) {
  const db = await openMediaDB();
  const blob = await new Promise((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE, "readonly");
    tx.onerror = () => reject(tx.error);
    const req = tx.objectStore(MEDIA_STORE).get(mediaId);
    req.onsuccess = () => resolve(req.result?.blob || null);
    req.onerror = () => reject(req.error);
  });
  db.close?.(); return blob;
}
export async function getVideoObjectURL(mediaId) {
  const blob = await getVideoBlob(mediaId);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}
export async function deleteVideoFile(mediaId) {
  const db = await openMediaDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE, "readwrite");
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.objectStore(MEDIA_STORE).delete(mediaId);
  });
  db.close?.();
}

/* ---------------------------------- VIDEO --------------------------------- */
const VIDEOS_KEY = "ib_videos";
export function readVideos() { return readFromLocalStorage(VIDEOS_KEY, []); }
export function saveVideos(videos) { writeToLocalStorage(VIDEOS_KEY, videos); }
export function addVideo(video) {
  const { borgoSlug, youtubeUrl, localMediaId } = video || {};
  if (!borgoSlug) throw new Error("borgoSlug richiesto");
  if (!youtubeUrl && !localMediaId) throw new Error("Fornisci un link YouTube o un file");
  const v = { id: video.id || "vid_" + Date.now(), title: video.title || "Video", borgoSlug,
    poiId: video.poiId || null, creatorId: video.creatorId || null, createdAt: video.createdAt || new Date().toISOString(),
    uploadType: localMediaId ? "file" : "embed", youtubeUrl: youtubeUrl || null, localMediaId: localMediaId || null };
  const videos = readVideos(); videos.unshift(v); saveVideos(videos); return v;
}
export function listLatestVideos(limit = 6) { return readVideos().slice(0, limit); }
export function listCreatorVideos(creatorId) { return readVideos().filter((v) => v.creatorId === creatorId); }
export const listVideosByCreator = listCreatorVideos;
export function listVideosByBorgo(borgoSlug) { return readVideos().filter((v) => v.borgoSlug === borgoSlug); }
export function getVideosByBorgo(slug) { return listVideosByBorgo(slug); }
export function getVideosByPoi(poiId) {
  const all = readVideos();
  return all.filter((v) => v.poiId === poiId || (v.entityType === "poi" && v.entityId === poiId));
}

/* ------------------------------- RICERCA NAV ------------------------------- */
export function searchNavigateTarget(input) {
  if (!input || !input.trim()) return { type: null };
  const text = input.trim();
  const s = slugify(text);

  const bySlug = findBorgoBySlug(s);
  if (bySlug) return { type: "borgo", slug: bySlug.slug };

  const byName = findBorgoByName(text);
  if (byName) return { type: "borgo", slug: byName.slug };

  const poi = listAttivita().find((p) => slugify(p.name) === s) || null;
  if (poi) return { type: "poi", slug: poi.borgoSlug, poiId: poi.id };

  return { type: null };
}

/* ------------------------- SEED DI ESEMPIO (DEV) -------------------------- */
const DEMO_SEED_FLAG = "ib_demo_seed_v1";
export function ensureDemoSeed() {
  if (readFromLocalStorage(DEMO_SEED_FLAG, false)) return;

  const sampleBorghi = [
    { slug: "viggiano", name: "Viggiano (PZ)", region: "Basilicata",
      hero: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop" },
    { slug: "arnad", name: "Arnad (AO)", region: "Valle d’Aosta",
      hero: "https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=1600&auto=format&fit=crop" },
    { slug: "otranto", name: "Otranto (LE)", region: "Puglia",
      hero: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop" },
  ];
  if (listBorghi().length === 0) writeToLocalStorage(BORGHI_KEY, sampleBorghi);

  const samplePoi = [
    { id: "poi_vig_rist1", name: "Ristorante del Centro", type: "ristorante", borgoSlug: "viggiano" },
    { id: "poi_vig_bar1",  name: "Enoteca l’Arpa",        type: "bar",        borgoSlug: "viggiano" },
    { id: "poi_vig_bb1",   name: "B&B Aurora",            type: "bb",         borgoSlug: "viggiano" },
    { id: "poi_arn_loc1",  name: "Sala Pro Loco",         type: "location",   borgoSlug: "arnad" },
    { id: "poi_otr_exp1",  name: "Tour in barca",         type: "esperienza", borgoSlug: "otranto" },
  ];
  if (listAttivita().length === 0) writeToLocalStorage(ATTIVITA_KEY, samplePoi);

  writeToLocalStorage(DEMO_SEED_FLAG, true);
}
ensureDemoSeed();

/* ------------------------------- SYNC DA API ------------------------------- */
// (immutato come prima)
export async function syncBorgoBundle(slug) {
  if (!slug) return { borgo: null, poi: null, videos: null };
  const enc = encodeURIComponent;
  const getJson = async (url) => { try { const res = await fetch(url); if (!res.ok) return null; return await res.json(); } catch { return null; } };
  let borgo = null, poi = null, videos = null;
  const bundle = await getJson(`/api/borghi/${enc(slug)}/bundle`);
  if (bundle) {
    borgo  = bundle.borgo  || null;
    poi    = Array.isArray(bundle.poi)    ? bundle.poi    : null;
    videos = Array.isArray(bundle.videos) ? bundle.videos : null;
  } else {
    borgo  = await getJson(`/api/borghi/${enc(slug)}`);
    poi    = await getJson(`/api/borghi/${enc(slug)}/poi`);
    videos = await getJson(`/api/borghi/${enc(slug)}/videos`);
  }
  if (borgo && borgo.slug) {
    const borghi = listBorghi();
    const i = borghi.findIndex((b) => b.slug === borgo.slug);
    if (i >= 0) borghi[i] = { ...borghi[i], ...borgo }; else borghi.push(borgo);
    writeToLocalStorage(BORGHI_KEY, borghi);
  }
  if (Array.isArray(poi)) {
    const all = listAttivita().filter((p) => p.borgoSlug !== slug);
    const normalized = poi.map((p) => ({ ...p, borgoSlug: p.borgoSlug || slug }));
    writeToLocalStorage(ATTIVITA_KEY, [...all, ...normalized]);
  }
  if (Array.isArray(videos)) {
    const existing = readVideos().filter((v) => v.borgoSlug !== slug);
    const normalized = videos.map((v) => ({
      ...v, id: v.id || ("vid_" + Math.random().toString(36).slice(2)),
      borgoSlug: v.borgoSlug || slug, uploadType: v.uploadType || (v.localMediaId ? "file" : "embed"),
      createdAt: v.createdAt || new Date().toISOString(),
    }));
    writeToLocalStorage(VIDEOS_KEY, [...existing, ...normalized]);
  }
  return { borgo, poi, videos };
}

/* ------------------------------- CHAT EXPORTS ------------------------------ */
export {
  createThread, getThread, listThreadsForUser, addMessage,
  sendMessage, getThreadById, getCurrentUserId,
} from "./chat-store.js";
