// src/lib/creatorVideos.js
// Persistenza metadati in localStorage + blob in IndexedDB (videoStore)

import { saveVideoBlob, getVideoBlob, deleteVideo } from "./videoStore";

/** ===== Chiave LocalStorage / versione schema ===== */
const LS_KEY = "ib_videos_v2";

/** ===== Util ===== */
const nowISO = () => new Date().toISOString();

function loadAll() {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    return Array.isArray(arr) ? migrate(arr) : [];
  } catch {
    return [];
  }
}
function saveAll(arr) {
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
}

/** Migrazione minima: assicura i campi del nuovo schema */
function migrate(list) {
  return list.map((v) => ({
    id: v.id,
    ownerId: v.ownerId || "anon",
    title: v.title || "",
    description: v.description || "",
    borgoSlug: v.borgoSlug || "",
    borgoName: v.borgoName || "",
    poiId: v.poiId || "",
    status: v.status || "draft",
    createdAt: v.createdAt || nowISO(),
    updatedAt: v.updatedAt || nowISO(),
    scheduledAt: v.scheduledAt || null,
    publishedAt: v.publishedAt || null,
    source: v.source || (v.videoKey ? "file" : "link"),
    url: (v.url || "").trim(),
    videoKey: v.videoKey || "",
    localUrl: v.localUrl || "",
    thumbnail: v.thumbnail || "",
    views: Number.isFinite(v.views) ? v.views : 0,
    likes: Number.isFinite(v.likes) ? v.likes : 0,
    tags: Array.isArray(v.tags) ? v.tags : [],
    activity: v.activity || "",
  }));
}

/** ====== Thumbnails ====== */
function youTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
  } catch {}
  return null;
}
function deriveThumbFromLink(url) {
  const id = youTubeId(url);
  if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  return "";
}

/** ====== Query helpers ====== */
export function listAll() {
  return loadAll().sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
}
export function listByOwner(ownerId) {
  return listAll().filter((v) => v.ownerId === ownerId);
}
export function listByStatus(ownerId, status) {
  return listByOwner(ownerId).filter((v) => v.status === status);
}
export function listPublishedByBorgoSlug(slug) {
  return listAll().filter((v) => v.status === "published" && v.borgoSlug === slug);
}
export function getById(id) {
  return loadAll().find((v) => v.id === id) || null;
}

/** ====== Creazione / aggiornamento ====== */
/**
 * Crea una bozza (supporta link OPPURE file).
 * - Se `source` === "file" salva il blob in IndexedDB e prepara un objectURL per preview.
 * - Se `source` === "link" prova a derivare una thumbnail (YouTube).
 */
export async function createVideoDraft({
  ownerId,
  title = "",
  description = "",
  borgoSlug = "",
  borgoName = "",
  poiId = "",
  activity = "",
  tags = [],
  url = "",
  file, // File | undefined
  source = "link", // "link" | "file"
  thumbnail = "",
}) {
  const id = "vid_" + Math.random().toString(36).slice(2) + Date.now();

  let videoKey = "";
  let localUrl = "";
  let finalThumb = (thumbnail || "").trim();

  if (source === "file" && file instanceof File) {
    const buf = await file.arrayBuffer();
    const blob = new Blob([buf], { type: file.type || "video/mp4" });
    videoKey = await saveVideoBlob(blob);
    const stored = await getVideoBlob(videoKey);
    localUrl = stored ? URL.createObjectURL(stored) : "";
  } else if (source === "link") {
    if (!finalThumb) finalThumb = deriveThumbFromLink(url);
  }

  const base = {
    id,
    ownerId,
    title: String(title || "").trim(),
    description: String(description || "").trim(),
    borgoSlug,
    borgoName,
    poiId,
    activity,
    tags: Array.isArray(tags) ? tags : [],
    status: "draft",
    createdAt: nowISO(),
    updatedAt: nowISO(),
    scheduledAt: null,
    publishedAt: null,

    source, // "file" | "link"
    url: String(url || "").trim(),
    videoKey,
    localUrl,
    thumbnail: finalThumb,

    views: 0,
    likes: 0,
  };

  const all = loadAll();
  all.unshift(base);
  saveAll(all);
  return base;
}

/** Aggiornamento generico */
export function updateVideo(id, patch) {
  const all = loadAll();
  const idx = all.findIndex((v) => v.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: nowISO() };
  saveAll(all);
  return all[idx];
}

/** Imposta/aggiorna borgo e POI (utile se l’utente li seleziona dopo) */
export function setBorgoAndPoi(id, { borgoSlug, borgoName = "", poiId = "" }) {
  return updateVideo(id, { borgoSlug, borgoName, poiId });
}

/** Pianifica */
export function scheduleVideo(id, whenISO) {
  return updateVideo(id, { status: "scheduled", scheduledAt: whenISO || nowISO() });
}

/** Pubblica */
export function publishVideo(id) {
  return updateVideo(id, { status: "published", publishedAt: nowISO() });
}

/** Rimuove (e cancella l’eventuale blob) */
export async function removeVideo(id) {
  const all = loadAll();
  const v = all.find((x) => x.id === id);
  if (v?.videoKey) {
    try {
      await deleteVideo(v.videoKey);
    } catch {}
  }
  const next = all.filter((x) => x.id !== id);
  saveAll(next);
}

/** ====== Media helpers ====== */
/** Restituisce un URL riproducibile (objectURL per file, href per link) */
export async function getPlayableUrl(video) {
  if (!video) return "";
  if (video.source === "link") return video.url || "";
  if (video.source === "file" && video.videoKey) {
    const blob = await getVideoBlob(video.videoKey);
    return blob ? URL.createObjectURL(blob) : "";
  }
  return "";
}

/** Aggiorna la thumbnail derivandola dal link (utile se l’utente incolla dopo) */
export function refreshDerivedThumbnail(id) {
  const v = getById(id);
  if (!v) return null;
  if (v.source === "link" && !v.thumbnail) {
    const th = deriveThumbFromLink(v.url);
    if (th) return updateVideo(id, { thumbnail: th });
  }
  return v;
}

/** ====== Statistiche basic (client-side) ====== */
export function incrementViews(id, delta = 1) {
  const v = getById(id);
  if (!v) return null;
  return updateVideo(id, { views: (v.views || 0) + Math.max(1, delta) });
}
export function toggleLike(id) {
  const v = getById(id);
  if (!v) return null;
  const likes = (v.likes || 0) + 1;
  return updateVideo(id, { likes });
}

/** ====== Factory: crea da form “Onboarding” ======
 * Accetta oggetto:
 * {
 *   ownerId, title, description, borgoSlug, borgoName, poiId,
 *   activity, tags (array o stringa separata da virgole),
 *   mode: "file"|"link",
 *   file: File (se mode=file),
 *   url: string (se mode=link),
 *   thumbnail?: string
 * }
 */
export async function createFromOnboarding(form) {
  const tags =
    Array.isArray(form.tags)
      ? form.tags
      : String(form.tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

  return createVideoDraft({
    ownerId: form.ownerId,
    title: form.title,
    description: form.description,
    borgoSlug: form.borgoSlug,
    borgoName: form.borgoName,
    poiId: form.poiId,
    activity: form.activity,
    tags,
    source: form.mode === "file" ? "file" : "link",
    url: form.mode === "link" ? form.url : "",
    file: form.mode === "file" ? form.file : undefined,
    thumbnail: form.thumbnail,
  });
}
