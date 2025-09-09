// src/components/ModalInstallApp.jsx
import { useEffect, useState } from "react";

const DAY = 24 * 60 * 60 * 1000;
const STEPS_DAYS = [0, 3, 90, 180, 365]; // 6s poi 3g, 3m, 6m, 12m
const LS_STEP = "ib:a2hs:step";
const LS_NEXT = "ib:a2hs:nextAt";

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator?.standalone === true);

const isIOS = () =>
  typeof navigator !== "undefined" &&
  /iphone|ipad|ipod/i.test(navigator.userAgent || "");

export default function ModalInstallApp() {
  const [open, setOpen] = useState(false);
  const [deferred, setDeferred] = useState(null);

  useEffect(() => {
    if (isStandalone()) return;

    const onBIP = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // per il bottone "Scarica app" nel menu
    window.__openInstallModal = () => setOpen(true);

    // auto-apri dopo 6s se è tempo
    const nextAt = Number(localStorage.getItem(LS_NEXT) || 0);
    if (Date.now() >= nextAt) {
      const t = setTimeout(() => setOpen(true), 6000);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBIP);
      };
    }
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  function scheduleNext() {
    const step = Number(localStorage.getItem(LS_STEP) || 0);
    const nextStep = Math.min(step + 1, STEPS_DAYS.length - 1);
    localStorage.setItem(LS_STEP, String(nextStep));
    const days = STEPS_DAYS[nextStep] ?? 3;
    localStorage.setItem(LS_NEXT, String(Date.now() + days * DAY));
  }

  async function onInstallNow() {
    // Chrome/Android: prompt nativo
    if (deferred) {
      try {
        deferred.prompt();
        const choice = await deferred.userChoice;
        setDeferred(null);
        if (choice?.outcome === "accepted") {
          // non riproporre per un anno
          localStorage.setItem(LS_STEP, String(STEPS_DAYS.length - 1));
          localStorage.setItem(LS_NEXT, String(Date.now() + 365 * DAY));
          setOpen(false);
          return;
        }
      } catch {}
      scheduleNext();
      setOpen(false);
      return;
    }

    // iOS / altri browser: non esiste prompt nativo
    if (isIOS()) {
      alert('Su iPhone: apri "Condividi" → "Aggiungi a Home".');
    }
    scheduleNext();
    setOpen(false);
  }

  function onLater() {
    scheduleNext();
    setOpen(false);
  }

  if (!open || isStandalone()) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/40 p-3 sm:p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl ring-1 ring-black/10">
        <div className="p-5 text-center">
          <div className="text-base font-extrabold text-[#6B271A]">
            Installa l’app “Il Borghista”
          </div>
        </div>
        <div className="p-4 pt-0 flex items-center justify-end gap-2">
          <button
            onClick={onLater}
            className="px-3 py-2 rounded-lg border text-sm font-semibold hover:bg-neutral-50"
          >
            Più tardi
          </button>
          <button
            onClick={onInstallNow}
            className="px-3 py-2 rounded-lg bg-[#D54E30] text-white text-sm font-semibold hover:opacity-95"
          >
            Installa ora
          </button>
        </div>
      </div>
    </div>
  );
}
