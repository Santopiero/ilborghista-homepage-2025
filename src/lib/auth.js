// src/lib/auth.js
const KEY = "ilb_auth"; // { userId, role: "creator"|"user" }

export function getAuth() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isCreatorSignedIn() {
  const a = getAuth();
  return !!(a && a.role === "creator" && a.userId);
}

export function signOut() {
  localStorage.removeItem(KEY);
}

/**
 * Mock login/registrazione Creator.
 * Crea un utente creator fake e ritorna {userId, role:"creator"}.
 * In un backend vero qui chiameresti l'API.
 */
export function loginOrRegisterCreator(email, password) {
  if (!email || !password) throw new Error("Email e password richieste.");
  // Genera un id deterministico per la demo
  const userId = "cr_" + btoa(email).replace(/=/g, "").slice(0, 8);
  const payload = { userId, role: "creator" };
  localStorage.setItem(KEY, JSON.stringify(payload));
  return payload;
}
