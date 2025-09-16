// src/lib/creatorVideos.js
// Persistenza metadati in localStorage + blob in IndexedDB (videoStore)

import { saveVideoBlob, getVideoBlob, deleteVideo } from "./videoStore";

const LS_KEY = "ib_videos_v1";

function loadAll() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function saveAll(arr) {
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
}
function nowISO() { return new Date().toISOString(); }

export function listByOwner(userId) {
  const all = loadAll();
  return all
    .filter(v => v.ownerId === userId)
    .sort((a,b)=> (b.createdAt||"") > (a.createdAt||"") ? 1 : -1);
}

export function listPublishedByBorgoSlug(slug) {
  const all = loadAll();
  return all.filter(v => v.status === "published" && v.borgoSlug === slug);
}

export function listPublishedByPoi(slug, poiId) {
  const all = loadAll();
  return all.filter(v => v.status === "published" && v.borgoSlug === slug && v.poiId === poiId);
}

export function getById(id) {
  return loadAll().find(v => v.id === id) || null;
}

// Creazione/metadati (file opzionale)
export async function createVideoDraft({
  ownerId,
  title = "",
  description = "",
  borgoSlug = "",
  poiId = "",
  url = "",
  file,            // File video opzionale
  source = "link", // "link" | "file"
  thumbnail = "",
  tags = [],
}) {
  const id = "vid_" + Math.random().toString(36).slice(2) + Date.now();

  let videoKey = "";
  let localUrl = "";
  if (source === "file" && file instanceof File) {
    const buf = await file.arrayBuffer();
    const blob = new Blob([buf], { type: file.type || "video/mp4" });
    videoKey = await saveVideoBlob(blob);
    const b = await getVideoBlob(videoKey);
    localUrl = b ? URL.createObjectURL(b) : "";
  }

  const base = {
    id,
    ownerId,
    title,
    description,
    borgoSlug,
    poiId,
    status: "draft",
    createdAt: nowISO(),
    updatedAt: nowISO(),
    source,           // "file" o "link"
    videoKey,         // se file
    localUrl,         // objectURL per preview rapida
    url: url.trim(),  // se link
    thumbnail,
    tags,
    views: 0,
    likes: 0,
  };

  const all = loadAll();
  all.unshift(base);
  saveAll(all);
  return base;
}

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
  const v = all.find(x=>x.id===id);
  if (v?.videoKey) { try { await deleteVideo(v.videoKey); } catch {} }
  saveAll(all.filter(x=>x.id!==id));
}

export function scheduleVideo(id, whenISO) {
  return updateVideo(id, { status: "scheduled", scheduledAt: whenISO || nowISO() });
}

export function publishVideo(id) {
  return updateVideo(id, { status: "published", publishedAt: nowISO() });
}

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

/* ===== Alias compatibilità con HomeBorgo (più funzionale) ===== */
export const getVideosByBorgo = (slug) => listPublishedByBorgoSlug(slug);
export const getVideosByPoi    = (slug, poiId) => listPublishedByPoi(slug, poiId);
