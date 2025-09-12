// src/lib/imageStore.js
// Semplice wrapper IndexedDB per salvare immagini come Blob.
// Nessuna libreria esterna.

const DB_NAME = "ib_media";
const DB_VERSION = 1;
const STORE = "images";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txWrap(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const ret = fn(store);
    tx.oncomplete = () => resolve(ret);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function makeId() {
  return (crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now() + "_" + Math.random().toString(36).slice(2));
}

/** Salva un dataURL come Blob in IndexedDB, ritorna l'id */
export async function saveImageFromDataURL(dataURL) {
  const res = await fetch(dataURL);
  const blob = await res.blob();
  const db = await openDB();
  const id = "img_" + makeId();
  await txWrap(db, "readwrite", (store) => store.put({ id, blob, createdAt: Date.now() }));
  return id;
}

/** Legge il Blob dell'immagine per id */
export async function getImageBlob(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result ? req.result.blob : null);
    req.onerror = () => reject(req.error);
  });
}

/** Cancella immagine per id */
export async function deleteImage(id) {
  const db = await openDB();
  await txWrap(db, "readwrite", (store) => store.delete(id));
}

/** Svuota tutto (opzionale, per manutenzione) */
export async function clearAllImages() {
  const db = await openDB();
  await txWrap(db, "readwrite", (store) => store.clear());
}
