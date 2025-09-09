// src/components/ModalInstallApp.jsx
import { useEffect, useRef, useState } from "react";
import { X, Smartphone } from "lucide-react";

/* ==== cadenza (come prima) =================================== */
const DAY = 24 * 60 * 60 * 1000;
const STEPS = [0, 3 * DAY, 90 * DAY, 180 * DAY, 365 * DAY];
const KEY_STEP = "a2hs:step";
const KEY_LAST = "a2hs:last";
const KEY_INSTALLED = "a2hs:installed";
const KEY_PENDING = "a2hs:pending"; // per auto-prompt dopo il chooser

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
/* ============================================================= */

export default function ModalInstallApp() {
  const APP_NAME = "Il Borghista";
  const [open, setOpen] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const bipRef = useRef(null);

  // ambiente
  const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator?.standalone === true);

  const isAndroid = /Android/i.test(ua);
  const isChrome =
    /Chrome\/\d+/.test(ua) &&
    !/Edg|OPR|SamsungBrowser|UCBrowser/i.test(ua) &&
    (navigator.vendor || "").includes("Google");

  // chooser: intent GENERICO (nessun package) → l’utente sceglie il browser
  function openChooser() {
    if (!isAndroid) return false;
    try {
      sessionStorage.setItem(KEY_PENDING, "1");
    } catch {}
    const scheme = location.protocol.replace(":", "");
    const intent =
      `intent://${location.host}${location.pathname}${location.search}${location.hash}` +
      `#Intent;scheme=${scheme};action=android.intent.action.VIEW;end`;
    location.href = intent;
    return true;
  }

  useEffect(() => {
    if (isStandalone) return;

    const onBIP = (e) => {
      e.preventDefault();
      bipRef.current = e;
      setCanInstall(true);

      // rientro dal chooser: auto-prompt
      const pending = sessionStorage.getItem(KEY_PENDING) === "1";
      if (pending) {
        try { sessionStorage.removeItem(KEY_PENDING); } catch {}
        setOpen(true);
        // piccolo delay per sicurezza
        setTimeout(() => doInstall(), 50);
      }
    };

    window.addEventListener("beforeinstallprompt", onBIP);

    // mostra popup secondo cadenza (prima volta dopo ~6s)
    if (dueNow()) {
      setTimeout(() => setOpen(true), 6000);
    }

    // API globale per aprire la modale (menu a panino)
    window.__openInstallModal = () => setOpen(true);

    // chiusura via ESC
    const onKey = (ev) => ev.key === "Escape" && onLater();
    window.addEventListener("keydown", onKey);

    // app installata
    window.addEventListener("appinstalled", () => {
      localStorage.setItem(KEY_INSTALLED, "1");
      setOpen(false);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStandalone]);

  async function doInstall() {
    const e = bipRef.current;
    if (!e) {
      // niente prompt disponibile: su Android provo il chooser, altrimenti chiudo
      if (isAndroid) {
        openChooser();
      }
      return;
    }
    try {
      e.prompt();
      const choice = await e.userChoice;
      if (choice?.outcome !== "accepted") {
        const step = getStep();
        setStep(step + 1);
        setLastNow();
      } else {
        localStorage.setItem(KEY_INSTALLED, "1");
      }
    } catch {
      const step = getStep();
      setStep(step + 1);
      setLastNow();
    } finally {
      setOpen(false);
    }
  }

  function onLater() {
    const step = getStep();
    setStep(step + 1);
    setLastNow();
    setOpen(false);
  }

  if (isStandalone) return null;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onLater}
      />

      {/* dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-title"
        className="absolute left-1/2 top-1/2 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2
                   overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10"
      >
        {/* header gradient – grafica invariata */}
        <div className="relative h-28 bg-gradient-to-r from-[#6B271A] via-[#8a4a3a] to-[#D54E30]">
          <button
            aria-label="Chiudi"
            onClick={onLater}
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#6B271A] shadow"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="absolute left-4 bottom-4 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#6B271A] shadow ring-1 ring-black/10">
              <Smartphone className="h-6 w-6" />
            </span>
            <div className="text-white">
              <div id="install-title" className="text-lg font-extrabold leading-tight drop-shadow">
                Installa l’app {APP_NAME}
              </div>
              <div className="text-xs/5 opacity-90">Tocca e sei pronto.</div>
            </div>
          </div>
        </div>

        {/* footer azioni – grafica invariata */}
        <div className="flex items-center justify-end gap-2 p-3">
          <button
            onClick={onLater}
            className="rounded-xl border px-3 py-2 text-sm font-medium text-[#6B271A] hover:bg-neutral-50"
          >
            Più tardi
          </button>

          {/* SEMPRE “Installa ora”: se ho il prompt lo mostro, altrimenti apro il chooser */}
          <button
            onClick={() => (canInstall ? doInstall() : (isAndroid ? openChooser() : onLater()))}
            className="rounded-xl bg-[#D54E30] px-3 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            Installa ora
          </button>
        </div>

        {/* hint opzionale quando non ho ancora il prompt in Chrome */}
        {!canInstall && isAndroid && isChrome ? (
          <div className="px-4 pb-4 text-center text-[11px] text-neutral-500">
            Se non vedi il bottone di installazione, apri il menu ⋮ e scegli <b>Installa app</b>.
          </div>
        ) : null}
      </div>
    </div>
  );
}
