// src/lib/chat-store.js
const THREADS_KEY = "ib_threads";
const USER_KEYS = ["ib_user", "ib_auth_user"];

function getCurrentUserSafe() {
  try {
    for (const k of USER_KEYS) {
      const raw = localStorage.getItem(k);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return null;
}

function readThreads() {
  try {
    const raw = localStorage.getItem(THREADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeThreads(list) {
  localStorage.setItem(THREADS_KEY, JSON.stringify(list || []));
}

export function createThread({ userId, creatorId }) {
  if (!userId || !creatorId) throw new Error("createThread: userId e creatorId sono obbligatori");
  const threads = readThreads();
  const existing = threads.find(t => t.userId === userId && t.creatorId === creatorId);
  if (existing) return existing;

  const t = {
    id: `th_${Date.now()}`,
    userId,
    creatorId,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  threads.push(t);
  writeThreads(threads);
  return t;
}

export function getThread(threadId) {
  return readThreads().find(t => t.id === threadId) || null;
}

export function listThreadsForUser(userId) {
  return readThreads().filter(t => t.userId === userId || t.creatorId === userId);
}

export function addMessage(threadId, { senderId, text }) {
  const threads = readThreads();
  const idx = threads.findIndex(t => t.id === threadId);
  if (idx < 0) throw new Error("Thread non trovato");
  const msg = {
    id: `m_${Date.now()}`,
    senderId,
    text: String(text || "").trim(),
    ts: Date.now(),
  };
  threads[idx].messages.push(msg);
  threads[idx].updatedAt = Date.now();
  writeThreads(threads);
  return msg;
}

export const sendMessage = addMessage;
export const getThreadById = getThread;

export function getCurrentUserId() {
  return getCurrentUserSafe()?.id || null;
}
