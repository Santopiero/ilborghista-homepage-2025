// src/components/ModalInstallApp.jsx
import React, { useEffect, useRef, useState } from "react";

/* ===== Helpers ===== */
const KEY_INSTALLED = "a2hs:installed";
const KEY_PENDING   = "a2hs:pending";   // session flag: siamo arrivati qui per installare
const KEY_NEXTAT    = "a2hs:nextAt";    // riproposta programmata
const KEY_STAGE     = "a2hs:stage";     // 0→1→2→3→4 (6s, 3g, 3m, 6m, 12m)

const STAGES_MS = [
  6000,                       // prima volta ~6s
  3 * 24 * 60 * 60 * 1000,    // 3 giorni
  90 * 24 * 60 * 60 * 1000,   // 3 mesi
  180 * 24 * 60 * 60 * 1000,  // 6 mesi
  365 * 24 * 60 * 60 * 1000,  // 12 mesi
];

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator.standalone === true
  );
}

function detectEnv() {
  const ua = (typeof navigator !== "undefined" ? navigator.userAgent : "").toLowerCase();
  return {
    isAndroid: /android/.test(ua),
    isIOS: /iphone|ipad|ipod/.test(ua),
    isChrome: /chrome|crios/.test(ua) && !/edge|edgios|opr/.test(ua),
    isSafari: /^((?!chrome|android).)*safari/i.test(typeof navigator !== "undefined" ? navigator.userAgent : ""),
    isEdge: /edg/i.test(typeof navigator !== "undefined" ? navigator.userAgent : ""),
  };
}

function getStage() {
  try { return Math.max(0, parseInt(localStorage.getItem(KEY_STAGE) || "0", 10)); } catch { return 0; }
}
function setStage(s) { try { localStorage.setItem(KEY_STAGE, String(s)); } catch {} }
function scheduleNext(fromNowMs) {
  try { localStorage.setItem(KEY_NEXTAT, String(Date.now() + fromNowMs)); } catch {}
}
function dueNow() {
  try { return Date.now() >= parseInt(localStorage.getItem(KEY_NEXTAT) || "0", 10); } catch { return true; }
}

/* ===== Component ===== */
export default function ModalInstallApp() {
  const env = detectEnv();
  const [open, setOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false); // true ⇒ istruzioni manuali
  const deferredPromptRef = useRef(null);

  // riproposta automatica (6s, 3g, 3m, 6m, 12m)
  useEffect(() => {
    if (isStandalone() || localStorage.getItem(KEY_INSTALLED) === "1") return;

    // handler globale SEMPRE disponibile
    window.__openInstallModal = () => {
      const hasPrompt = !!deferredPromptRef.current;
      setManualMode(!hasPrompt && !(env.isAndroid && env.isChrome));
      setOpen(true);
    };

    // intercetta il prompt
    function onBeforeInstallPrompt(e) {
      e.preventDefault();
      deferredPromptRef.current = e;

      // se siamo arrivati qui con pending (da "Apri in Chrome") → apri subito e lancia prompt
      const wantInstall =
        (sessionStorage.getItem(KEY_PENDING) === "1") ||
        new URL(window.location.href).searchParams.get("a2hs") === "1";

      if (wantInstall) {
        setManualMode(false);
        setOpen(true);
        // piccolo delay per sicurezza, poi prompt
        setTimeout(() => onInstallNow(), 50);
        // pulisci flag e URL
        try { sessionStorage.removeItem(KEY_PENDING); } catch {}
        const url = new URL(window.location.href);
        url.searchParams.delete("a2hs");
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      } else if (dueNow()) {
        // prima apertura automatica dopo 6s (solo se è “tempo”)
        const stage = getStage();
        setTimeout(() => {
          setManualMode(false);
          setOpen(true);
        }, STAGES_MS[Math.min(stage, STAGES_MS.length - 1)]);
      }
    }

    function onAppInstalled() {
      localStorage.setItem(KEY_INSTALLED, "1");
      setOpen(false);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    // se non arriverà BIP (iOS/desktop non compatibili): fallback programmato
    if (dueNow() && !(env.isAndroid && env.isChrome)) {
      const stage = getStage();
      setTimeout(() => {
        setManualMode(true);
        setOpen(true);
      }, STAGES_MS[Math.min(stage, STAGES_MS.length - 1)]);
    }

    // auto-apertura post-redirect (se non è ancora arrivato BIP): attendi max 8s, poi fallback
    const wantInstall =
      (sessionStorage.getItem(KEY_PENDING) === "1") ||
      new URL(window.location.href).searchParams.get("a2hs") === "1";
    if (wantInstall && !deferredPromptRef.current) {
      setOpen(true);
      setManualMode(false); // proviamo a credere che arrivi
      const t = setTimeout(() => {
        // niente BIP: vai di fallback manuale
        setManualMode(true);
        try { sessionStorage.removeItem(KEY_PENDING); } catch {}
      }, 8000);
      return () => clearTimeout(t);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      // non rimuovo __openInstallModal per lasciarlo riutilizzabile
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // “Installa ora”
  async function onInstallNow() {
    const e = deferredPromptRef.current;
    if (e?.prompt) {
      const choice = await e.prompt();
      // risultato può essere { outcome: "accepted" | "dismissed" }
      if (choice?.outcome === "accepted") {
        localStorage.setItem(KEY_INSTALLED, "1");
        setOpen(false);
      } else {
        // rimanda al prossimo step della curva
        bumpSnooze();
        setOpen(false);
      }
    } else {
      // nessun prompt disponibile ⇒ fallback manuale (istruzioni)
      setManualMode(true);
    }
  }

  // “Più tardi”
  function onLater() {
    bumpSnooze();
    setOpen(false);
  }

  function bumpSnooze() {
    const current = getStage();
    const nextStage = Math.min(current + 1, STAGES_MS.length - 1);
    setStage(nextStage);
    scheduleNext(STAGES_MS[nextStage]);
  }

  // Escamotage: apri in Chrome con intent + flag per auto-prompt
  function openInChrome() {
    try { sessionStorage.setItem(KEY_PENDING, "1"); } catch {}
    const loc = window.location;
    const here = new URL(loc.href);
    here.searchParams.set("a2hs", "1");

    // Se siamo in http://localhost non tutti i device gestiscono gli intent.
    // In quel caso faccio solo window.location = stessa URL (mostrerà il chooser)
    const useIntent = here.protocol === "https:";

    if (useIntent) {
      const scheme = here.protocol.replace(":", "");
      const intent =
        `intent://${here.host}${here.pathname}${here.search}${here.hash}` +
        `#Intent;scheme=${scheme};package=com.android.chrome;end`;
      window.location.href = intent;
    } else {
      // dev fallback: apri chooser; l’utente seleziona Chrome
      window.location.href = here.toString();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onLater} />

      <div className="absolute inset-x-4 top-20 mx-auto max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden">
        {/* Header compatto */}
        <div className="flex items-center gap-3 px-4 pt-4">
          <img
            src="/icons/maskable-192.png"
            alt=""
            className="w-10 h-10 rounded-xl ring-1 ring-black/10"
          />
          <div className="min-w-0">
            <div className="text-base font-extrabold text-[#6B271A] truncate">
              Installa l’app Il Borghista
            </div>
            {!manualMode && (
              <div className="text-xs text-neutral-600">Aggiungi alla schermata Home</div>
            )}
          </div>
        </div>

        {/* Body super semplice */}
        <div className="px-4 pb-4 pt-3">
          {manualMode ? (
            <div className="space-y-3">
              {/* Android non-Chrome: apri in Chrome per l’install nativa */}
              {env.isAndroid && !env.isChrome ? (
                <button
                  onClick={openInChrome}
                  className="w-full inline-flex items-center justify-center h-11 rounded-xl bg-[#0b3a53] text-white font-semibold"
                >
                  Apri in Chrome
                </button>
              ) : null}

              {/* iOS / Safari: istruzioni minime */}
              {env.isIOS ? (
                <div className="text-sm text-neutral-700">
                  Apri con <b>Safari</b>, tocca{" "}
                  <span aria-label="Condividi">Condividi</span> → <b>Aggiungi a Home</b>.
                </div>
              ) : null}

              {/* Fallback generico */}
              {!env.isIOS && (env.isChrome || !env.isAndroid) ? (
                <div className="text-sm text-neutral-700">
                  Se non vedi il popup di installazione, aggiorna la pagina e riprova.
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-sm text-neutral-700">
              Installala per un accesso rapido a eventi ed esperienze.
            </div>
          )}
        </div>

        {/* Footer con 2 azioni */}
        <div className="flex items-center gap-2 px-4 pb-4">
          <button
            onClick={onInstallNow}
            className="flex-1 inline-flex items-center justify-center h-11 rounded-xl bg-[#D54E30] text-white font-semibold"
          >
            Installa ora
          </button>
          <button
            onClick={onLater}
            className="inline-flex h-11 items-center justify-center px-3 rounded-xl text-[#6B271A] font-semibold"
          >
            Più tardi
          </button>
        </div>
      </div>
    </div>
  );
}
