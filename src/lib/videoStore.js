// src/lib/videoStore.js
// Semplice store IndexedDB per BLOB video (pattern analogo a imageStore)

const DB_NAME = "ib_video_store";
const STORE = "videos";

function withDb(fn) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1);
    open.onupgradeneeded = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    open.onsuccess = () => fn(open.result).then(resolve, reject);
    open.onerror = () => reject(open.error);
  });
}

export async function saveVideoBlob(blob) {
  const key = "v_" + Math.random().toString(36).slice(2) + Date.now();
  await withDb(async (db) => {
    await new Promise((res, rej) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(blob, key);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  });
  return key;
}

export async function getVideoBlob(key) {
  if (!key) return null;
  return withDb(async (db) => {
    return await new Promise((res, rej) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => res(req.result || null);
      req.onerror = () => rej(req.error);
    });
  });
}

export async function deleteVideo(key) {
  if (!key) return;
  return withDb(async (db) => {
    return await new Promise((res, rej) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  });
}
