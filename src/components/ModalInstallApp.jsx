// src/components/ModalInstallApp.jsx
import { useEffect, useRef, useState } from "react";
import { X, Smartphone } from "lucide-react";

/* === Cadenza identica a prima ===================================== */
const DAY = 24 * 60 * 60 * 1000;
const STEPS = [0, 3 * DAY, 90 * DAY, 180 * DAY, 365 * DAY];
const KEY_STEP = "a2hs:step";
const KEY_LAST = "a2hs:last";
const KEY_INSTALLED = "a2hs:installed";
const KEY_PENDING = "a2hs:pending"; // avvia auto-prompt al rientro

const getStep = () => {
  const n = parseInt(localStorage.getItem(KEY_STEP) || "0", 10);
  return Number.isFinite(n) ? Math.min(n, STEPS.length - 1) : 0;
};
const setStep = (n) =>
  localStorage.setItem(KEY_STEP, String(Math.min(n, STEPS.length - 1)));
const setLastNow = () => localStorage.setItem(KEY_LAST, String(Date.now()));
const dueNow = () => {
  const step = getStep();
  const last = parseInt(localStorage.getItem(KEY_LAST) || "0", 10);
  const wait = STEPS[step];
  return last === 0 ? true : Date.now() - last >= wait;
};
/* ================================================================== */

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

  // 1) intercetta il BIP, lo deferra e abilita l’auto-prompt se rientri dal chooser
  useEffect(() => {
    if (isStandalone) return;

    const onBIP = (e) => {
      e.preventDefault();
      bipRef.current = e;
      setCanInstall(true);

      // se arrivo qui dopo aver aperto il chooser → autoprompt immediato
      const pending = sessionStorage.getItem(KEY_PENDING) === "1";
      if (pending) {
        try {
          sessionStorage.removeItem(KEY_PENDING);
        } catch {}
        // mostro subito il prompt (senza secondo tap)
        setTimeout(() => doInstall(), 30);
      }
    };

    window.addEventListener("beforeinstallprompt", onBIP);

    // cadenza: prima volta 6s, poi 3g/3m/6m/12m
    if (dueNow()) {
      setTimeout(() => setOpen(true), 6000);
    }

    // API globale (menu a panino)
    window.__openInstallModal = () => setOpen(true);

    // chiudi con ESC
    const onKey = (ev) => ev.key === "Escape" && onLater();
    window.addEventListener("keydown", onKey);

    // installazione completata
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

  // 2) forza SEMPRE il selettore di browser (chooser) su Android
  function openChooserAlways() {
    if (!isAndroid) return false;
    try {
      sessionStorage.setItem(KEY_PENDING, "1");
    } catch {}
    // intent GENERICO senza package + chooser_title
    // → Android mostra il selettore anche se esiste un browser predefinito (quando possibile)
    const scheme = location.protocol.replace(":", "");
    const intent =
      `intent://${location.host}${location.pathname}${location.search}${location.hash}` +
      `#Intent;scheme=${scheme};action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;` +
      `chooser_title=Seleziona%20browser;end`;
    location.href = intent;
    return true;
  }

  // 3) mostra il prompt (se già disponibile)
  async function doInstall() {
    const e = bipRef.current;
    if (!e) {
      // se ancora non ho il prompt, apro il chooser e attendo il rientro
      openChooserAlways();
      return;
    }
    try {
      e.prompt();
      const res = await e.userChoice;
      if (res?.outcome !== "accepted") {
        // rimandato: programma il prossimo giro
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onLater} />

      {/* dialog – GRAFICA INVARIATA */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-title"
        className="absolute left-1/2 top-1/2 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2
                   overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10"
      >
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

        {/* footer azioni – GRAFICA INVARIATA */}
        <div className="flex items-center justify-end gap-2 p-3">
          <button
            onClick={onLater}
            className="rounded-xl border px-3 py-2 text-sm font-medium text-[#6B271A] hover:bg-neutral-50"
          >
            Più tardi
          </button>

          {/* Sempre “Installa ora”: se ho già il prompt lo mostro, altrimenti apro SEMPRE il chooser */}
          <button
            onClick={() => (canInstall ? doInstall() : openChooserAlways())}
            className="rounded-xl bg-[#D54E30] px-3 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            Installa ora
          </button>
        </div>

        {/* suggerimento piccolo quando il BIP non è ancora arrivato */}
        {!canInstall && isAndroid ? (
          <div className="px-4 pb-4 text-center text-[11px] text-neutral-500">
            Scegli un browser dall’elenco. Al rientro l’installazione partirà automaticamente.
          </div>
        ) : null}
      </div>
    </div>
  );
}
