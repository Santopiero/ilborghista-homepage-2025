// src/lib/creatorVideos.js
// Persistenza metadati in localStorage + blob in IndexedDB (videoStore)
// Supporta sia upload file locali sia link esterni (Instagram / TikTok / YouTube)

import { saveVideoBlob, getVideoBlob, deleteVideo } from "./videoStore";

/* ============================== Storage keys & migrazione ============================== */
const LS_KEY_V1 = "ib_videos_v1";
const LS_KEY = "ib_videos_v2";

function migrateIfNeeded() {
  try {
    if (!localStorage.getItem(LS_KEY) && localStorage.getItem(LS_KEY_V1)) {
      const old = JSON.parse(localStorage.getItem(LS_KEY_V1) || "[]");
      localStorage.setItem(LS_KEY, JSON.stringify(old));
    }
  } catch {}
}
migrateIfNeeded();

/* ============================== Utils base ============================== */
function loadAll() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function saveAll(arr) {
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
}
function nowISO() { return new Date().toISOString(); }

// Ordina per publishedAt -> createdAt -> updatedAt
function tsOf(v = {}) {
  const cands = [v.publishedAt, v.createdAt, v.updatedAt, v.ts, v.date];
  for (const c of cands) {
    const t = +new Date(c || 0);
    if (!Number.isNaN(t) && t > 0) return t;
  }
  return 0;
}
function orderLatest(list = []) {
  return [...list].sort((a, b) => tsOf(b) - tsOf(a));
}

/* ============================== Rilevamento piattaforma & helper link ============================== */
export function detectPlatform(url = "") {
  const u = (url || "").toLowerCase();
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  return "altro";
}

export function isValidPublicUrl(url = "") {
  try {
    const u = new URL(url);
    return ["http:", "https:"].includes(u.protocol);
  } catch { return false; }
}

export function getYouTubeId(url = "") {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v") || "";
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
  } catch {}
  return "";
}
export function getYouTubeThumb(url = "") {
  const id = getYouTubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

/* ============================== Liste/letture ============================== */
export function listByOwner(userId) {
  const all = loadAll();
  return orderLatest(
    all.filter(v => v.ownerId === userId)
  );
}

// NB: status "published" = approvato/visibile
export function listPublishedByBorgoSlug(slug) {
  const all = loadAll();
  return orderLatest(
    all.filter(v => v.status === "published" && v.borgoSlug === slug)
  );
}

export function listPublishedByPoi(slug, poiId) {
  const all = loadAll();
  return orderLatest(
    all.filter(v =>
      v.status === "published" &&
      v.borgoSlug === slug &&
      v.poiId === poiId
    )
  );
}

export function getById(id) {
  return loadAll().find(v => v.id === id) || null;
}

/* ============================== Creazione (bozza) ============================== */
/**
 * Crea una bozza.
 * - source: "link" | "file"
 * - per i link: salva platform, url e (se YouTube) thumbnail
 * - supporta category e poiId per organizzazione in HomeBorgo
 */
export async function createVideoDraft({
  ownerId,
  title = "",
  description = "",
  borgoSlug = "",
  poiId = "",
  category = "",       // <-- nuovo
  url = "",
  file,                // File video opzionale
  source = "link",     // "link" | "file"
  thumbnail = "",
  tags = [],
}) {
  const id = "vid_" + Math.random().toString(36).slice(2) + Date.now();

  // Dati specifici per "file"
  let videoKey = "";
  let localUrl = "";

  // Dati specifici per "link"
  let platform = "altro";
  let finalThumb = thumbnail || "";

  if (source === "file" && file instanceof File) {
    const buf = await file.arrayBuffer();
    const blob = new Blob([buf], { type: file.type || "video/mp4" });
    videoKey = await saveVideoBlob(blob);
    const b = await getVideoBlob(videoKey);
    localUrl = b ? URL.createObjectURL(b) : "";
  } else if (source === "link") {
    if (!isValidPublicUrl(url)) throw new Error("URL non valido");
    platform = detectPlatform(url);
    if (!finalThumb && platform === "youtube") {
      const yt = getYouTubeThumb(url);
      if (yt) finalThumb = yt;
    }
  }

  const base = {
    id,
    ownerId,
    title: (title || "").trim(),
    description: (description || "").trim(),
    borgoSlug,
    poiId,
    category,           // <-- nuovo campo
    status: "draft",
    createdAt: nowISO(),
    updatedAt: nowISO(),
    source,             // "file" | "link"
    videoKey,           // se file
    localUrl,           // objectURL per preview rapida
    url: (url || "").trim(), // se link
    platform,           // se link
    thumbnail: finalThumb || "",
    tags,
    views: 0,
    likes: 0,
  };

  const all = loadAll();
  all.unshift(base);
  saveAll(all);
  return base;
}

/* ============================== Creazione rapida link (pubblicato) ============================== */
/**
 * Aggiunge un link esterno già "pubblicato" (per onboarding/UX snella).
 * Valida URL, rileva piattaforma, genera thumbnail YouTube.
 * category e poiId servono per il posizionamento su HomeBorgo.
 */
export function addExternalVideo({
  ownerId = "mock-creator",
  ownerName, // opzionale
  title = "",
  borgoSlug,
  category,
  poiId = "",
  url,
  thumbnail = "",
  tags = [],
}) {
  if (!isValidPublicUrl(url)) throw new Error("URL non valido");
  if (!borgoSlug) throw new Error("Borgo obbligatorio");
  if (!category) throw new Error("Categoria obbligatoria");

  const id = "vid_" + Math.random().toString(36).slice(2) + Date.now();
  const platform = detectPlatform(url);
  const thumb = thumbnail || (platform === "youtube" ? getYouTubeThumb(url) || "" : "");

  const now = nowISO();
  const v = {
    id,
    ownerId,
    ownerName: ownerName || "",
    title: (title || "").trim(),
    description: "",
    borgoSlug,
    poiId,
    category,
    status: "published",       // pubblicato subito per test/UX
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
    source: "link",
    videoKey: "",
    localUrl: "",
    url: url.trim(),
    platform,
    thumbnail: thumb,
    tags,
    views: 0,
    likes: 0,
  };

  const all = loadAll();
  all.unshift(v);
  saveAll(all);
  return v;
}

/* ============================== Update/Remove/Status ============================== */
export function updateVideo(id, patch) {
  const all = loadAll();
  const idx = all.findIndex(v => v.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: nowISO() };
  saveAll(all);
  return all[idx];
}

export async function removeVideo(id) {
  const all = loadAll();
  const v = all.find(x => x.id === id);
  if (v?.videoKey) { try { await deleteVideo(v.videoKey); } catch {} }
  saveAll(all.filter(x => x.id !== id));
}

export function scheduleVideo(id, whenISO) {
  return updateVideo(id, { status: "scheduled", scheduledAt: whenISO || nowISO() });
}

export function publishVideo(id) {
  const v = getById(id);
  if (!v) return null;

  // Se è link, verifico che l'URL sia valido prima di pubblicare
  if (v.source === "link" && !isValidPublicUrl(v.url)) {
    throw new Error("URL non valido: impossibile pubblicare");
  }

  return updateVideo(id, { status: "published", publishedAt: nowISO() });
}

/* ============================== Riproduzione ============================== */
// Helper per recuperare URL riproducibile
export async function getPlayableUrl(video) {
  if (!video) return "";
  if (video.source === "link") return video.url;
  if (video.source === "file" && video.videoKey) {
    const blob = await getVideoBlob(video.videoKey);
    return blob ? URL.createObjectURL(blob) : "";
  }
  return "";
}

/* ============================== Alias compatibilità ============================== */
// usati in HomeBorgo e altrove
export const getVideosByBorgo = (slug) => listPublishedByBorgoSlug(slug);
export const getVideosByPoi   = (slug, poiId) => listPublishedByPoi(slug, poiId);

// utilità extra utili per UI filtri (opzionali)
export function listPlatformsByBorgo(slug) {
  const set = new Set(listPublishedByBorgoSlug(slug).map(v => v.platform || "altro"));
  return Array.from(set);
}
export function listCategoriesByBorgo(slug) {
  const set = new Set(listPublishedByBorgoSlug(slug).map(v => v.category || ""));
  set.delete("");
  return Array.from(set);
}
