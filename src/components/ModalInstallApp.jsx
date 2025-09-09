// src/components/ModalInstallApp.jsx
import { useEffect, useRef, useState } from "react";

const DAY = 24 * 60 * 60 * 1000;
const KEY_STEP = "a2hs:step";
const KEY_LAST = "a2hs:last";
const KEY_INSTALLED = "a2hs:installed";
const KEY_PENDING = "a2hs:pending"; // session flag per auto-prompt dopo il chooser

// step 0 = subito; poi 3 gg; 3 mesi; 6 mesi; 12 mesi
const STEPS = [0, 3 * DAY, 90 * DAY, 180 * DAY, 365 * DAY];

function getStep() {
  try {
    const n = parseInt(localStorage.getItem(KEY_STEP) || "0", 10);
    return Number.isFinite(n) ? Math.min(n, STEPS.length - 1) : 0;
  } catch {
    return 0;
  }
}
function setStep(n) {
  try {
    localStorage.setItem(KEY_STEP, String(Math.min(n, STEPS.length - 1)));
  } catch {}
}
function setLastNow() {
  try {
    localStorage.setItem(KEY_LAST, String(Date.now()));
  } catch {}
}
function dueNow() {
  try {
    const step = getStep();
    const last = parseInt(localStorage.getItem(KEY_LAST) || "0", 10);
    const wait = STEPS[step];
    return last === 0 ? true : Date.now() - last >= wait;
  } catch {
    return true;
  }
}

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    // iOS PWA
    window.navigator?.standalone === true
  );
}

function detectEnv() {
  const ua = (navigator.userAgent || "").toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  const isChrome = (/chrome|crios/.test(ua) && !/edg|opr/.test(ua)) || false;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent || "");
  const isHTTPS = window.location.protocol === "https:";
  return { isIOS, isAndroid, isChrome, isSafari, isHTTPS };
}

export default function ModalInstallApp() {
  const [open, setOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false); // iOS/nessun BIP
  const deferredPromptRef = useRef(null);

  // rendo sempre disponibile l’apertura da menu
  useEffect(() => {
    window.__openInstallModal = () => {
      // se abbiamo già il prompt, modalità automatica; altrimenti manuale (iOS/edge case)
      const hasBip = !!deferredPromptRef.current;
      setManualMode(!hasBip);
      setOpen(true);
    };
    return () => {
      // non lo azzero per permettere richiamo cross-pagine, ma se preferisci:
      // window.__openInstallModal = undefined;
    };
  }, []);

  useEffect(() => {
    // già installata → non fare nulla
    if (isStandalone() || localStorage.getItem(KEY_INSTALLED) === "1") return;

    const { isIOS, isSafari } = detectEnv();

    function onBeforeInstallPrompt(e) {
      // Chrome/Android, Edge Chromium, Desktop Chrome
      e.preventDefault();
      deferredPromptRef.current = e;

      // Se siamo tornati da un chooser con pending attivo → apri e lancia subito il prompt
      const pending = sessionStorage.getItem(KEY_PENDING) === "1";
      if (pending) {
        setManualMode(false);
        setOpen(true);
        setTimeout(() => {
          // piccolo delay per sicurezza
          onInstallNow();
        }, 50);
        try { sessionStorage.removeItem(KEY_PENDING); } catch {}
        return;
      }

      // Altrimenti: mostra la modale secondo cadenza (prima volta ~0s/6s a tua scelta)
      if (dueNow()) {
        setTimeout(() => {
          setManualMode(false);
          setOpen(true);
        }, 6000);
      }
    }

    // iOS Safari non emette BIP → fallback se dovuto
    if (isIOS && isSafari) {
      if (dueNow()) {
        setTimeout(() => {
          setManualMode(true);
          setOpen(true);
        }, 6000);
      }
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", () => {
      try { localStorage.setItem(KEY_INSTALLED, "1"); } catch {}
      setOpen(false);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  // blocca scrolling sotto la modale
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escamotage: se non ho BIP attivo, su Android apro il chooser (intent Chrome se https)
  function openChooserForChrome() {
    const { isAndroid, isHTTPS } = detectEnv();
    if (!isAndroid) return false;

    try { sessionStorage.setItem(KEY_PENDING, "1"); } catch {}
    const here = new URL(window.location.href);

    if (isHTTPS) {
      // intent verso Chrome (evita doppi tap su molti device)
      const scheme = here.protocol.replace(":", "");
      const intent =
        `intent://${here.host}${here.pathname}${here.search}${here.hash}` +
        `#Intent;scheme=${scheme};package=com.android.chrome;end`;
      window.location.href = intent;
    } else {
      // dev/non https: apri comunque la stessa URL → mostrerà il chooser
      window.location.href = here.toString();
    }
    return true;
  }

  async function onInstallNow() {
    try {
      // se ho un prompt pronto → mostralo subito
      const ev = deferredPromptRef.current;
      if (ev && typeof ev.prompt === "function") {
        deferredPromptRef.current = null; // il prompt si può usare una sola volta
        ev.prompt();
        const choice = await ev.userChoice;
        if (choice?.outcome === "accepted") {
          try { localStorage.setItem(KEY_INSTALLED, "1"); } catch {}
          setOpen(false);
        } else {
          const step = getStep();
          setStep(step + 1);
          setLastNow();
          setOpen(false);
        }
        return;
      }

      // nessun BIP: su iOS mostriamo istruzioni, su Android apriamo chooser e auto-prompt al ritorno
      const { isIOS } = detectEnv();
      if (isIOS) {
        setManualMode(true); // mantiene la stessa UI/tema, solo testo diverso
        return;
      }

      // Android senza BIP: apri chooser (o intent Chrome), al ritorno il BIP verrà intercettato e promptato
      const moved = openChooserForChrome();
      if (!moved) {
        // fallback estremo: consideriamo come rimandato
        const step = getStep();
        setStep(step + 1);
        setLastNow();
        setOpen(false);
      }
    } catch {
      // in caso di errore consideriamo come rimandato
      const step = getStep();
      setStep(step + 1);
      setLastNow();
      setOpen(false);
    }
  }

  function onLater() {
    const step = getStep();
    setStep(step + 1);
    setLastNow();
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onLater}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Installa l'app Il Borghista"
        className="absolute left-1/2 top-1/2 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden"
      >
        {/* Header minimale (grafica invariata) */}
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="text-[#6B271A] font-extrabold">Installa l’app</div>
          <button
            onClick={onLater}
            aria-label="Chiudi"
            className="w-9 h-9 rounded-full border grid place-items-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </div>

        {/* Corpo super semplice (grafica invariata) */}
        <div className="px-5 pt-4 pb-5">
          <div className="text-lg font-semibold text-[#6B271A]">
            Installa l’app <span className="whitespace-nowrap">Il Borghista</span>
          </div>
          {manualMode ? (
            <p className="mt-2 text-sm text-neutral-700">
              Su iPhone/iPad: tocca <b>Condividi</b> (⬆️) e poi <b>Aggiungi a Home</b>.
            </p>
          ) : (
            <p className="mt-2 text-sm text-neutral-700">
              Aggiungila alla schermata Home per un’esperienza più veloce.
            </p>
          )}

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={onInstallNow}
              className="flex-1 rounded-xl bg-[#D54E30] text-white font-semibold px-4 py-2"
            >
              Installa ora
            </button>
            <button
              onClick={onLater}
              className="flex-1 rounded-xl border bg-white text-[#6B271A] font-semibold px-4 py-2"
            >
              Più tardi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
