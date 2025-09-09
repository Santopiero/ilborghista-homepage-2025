// src/components/ModalInstallApp.jsx
import { useEffect, useRef, useState } from "react";

const DAY = 24 * 60 * 60 * 1000;
const KEY_STEP = "a2hs:step";
const KEY_LAST = "a2hs:last";
const KEY_INSTALLED = "a2hs:installed";

// step 0 = subito; poi 3 gg; 3 mesi; 6 mesi; 12 mesi
const STEPS = [0, 3 * DAY, 90 * DAY, 180 * DAY, 365 * DAY];

function getStep() {
  const n = parseInt(localStorage.getItem(KEY_STEP) || "0", 10);
  return Number.isFinite(n) ? Math.min(n, STEPS.length - 1) : 0;
}
function setStep(n) {
  localStorage.setItem(KEY_STEP, String(Math.min(n, STEPS.length - 1)));
}
function setLastNow() {
  localStorage.setItem(KEY_LAST, String(Date.now()));
}
function dueNow() {
  const step = getStep();
  const last = parseInt(localStorage.getItem(KEY_LAST) || "0", 10);
  const wait = STEPS[step];
  return last === 0 ? true : Date.now() - last >= wait;
}

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    // iOS PWA
    (window.navigator as any)?.standalone === true
  );
}

function detectEnv() {
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  const isChrome = /Chrome/i.test(ua) && !/Edg|OPR/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  return { isIOS, isSafari, isChrome, isAndroid };
}

export default function ModalInstallApp() {
  const [open, setOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false); // iOS/nessun BIP
  const deferredPromptRef = useRef<any>(null);

  useEffect(() => {
    // già installata → non fare nulla
    if (isStandalone() || localStorage.getItem(KEY_INSTALLED) === "1") return;

    const { isIOS, isSafari } = detectEnv();

    function onBeforeInstallPrompt(e: any) {
      // Chrome/Android, Edge, Desktop Chrome
      e.preventDefault();
      deferredPromptRef.current = e;

      // mostriamo la nostra modale (6s) secondo cadenza
      if (dueNow()) {
        setTimeout(() => {
          setManualMode(false);
          setOpen(true);
        }, 6000);
      }
      // funzione globale per il menu
      (window as any).__openInstallModal = () => {
        setManualMode(false);
        setOpen(true);
      };
    }

    // iOS Safari non emette BIP: attiviamo fallback se dovuto
    if (isIOS && isSafari) {
      (window as any).__openInstallModal = () => {
        setManualMode(true);
        setOpen(true);
      };
      if (dueNow()) {
        setTimeout(() => {
          setManualMode(true);
          setOpen(true);
        }, 6000);
      }
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", () => {
      localStorage.setItem(KEY_INSTALLED, "1");
      setOpen(false);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      (window as any).__openInstallModal = undefined;
    };
  }, []);

  // blocca scrolling sotto la modale
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function onInstallNow() {
    try {
      if (manualMode || !deferredPromptRef.current) {
        // nessun prompt disponibile: istruzioni
        // (la UI già mostra i passaggi; qui chiudiamo)
        setOpen(false);
        return;
      }
      const ev = deferredPromptRef.current;
      deferredPromptRef.current = null;
      ev.prompt();
      const choice = await ev.userChoice;
      if (choice?.outcome === "accepted") {
        localStorage.setItem(KEY_INSTALLED, "1");
        setOpen(false);
      } else {
        // rimanda: programma il prossimo step
        const step = getStep();
        setStep(step + 1);
        setLastNow();
        setOpen(false);
      }
    } catch {
      // in caso di errore consideriamo come "rimandato"
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
        {/* Header minimale */}
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

        {/* Corpo super semplice */}
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
