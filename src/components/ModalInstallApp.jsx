// src/components/ModalInstallApp.jsx
import { useEffect, useRef, useState } from "react";
import { X, Smartphone } from "lucide-react";

/* === Cadenza identica ============================================ */
const DAY = 24 * 60 * 60 * 1000;
const STEPS = [0, 3 * DAY, 90 * DAY, 180 * DAY, 365 * DAY];
const KEY_STEP = "a2hs:step";
const KEY_LAST = "a2hs:last";
const KEY_INSTALLED = "a2hs:installed";
const KEY_PENDING = "a2hs:pending"; // auto-prompt quando rientro

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
/* ================================================================ */

export default function ModalInstallApp() {
  const APP_NAME = "Il Borghista";
  const [open, setOpen] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [iosManual, setIosManual] = useState(false);
  const bipRef = useRef(null);

  // ambiente
  const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator?.standalone === true);

  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  const isChrome =
    /Chrome\/\d+/.test(ua) &&
    !/Edg|OPR|SamsungBrowser|UCBrowser/i.test(ua) &&
    (navigator.vendor || "").includes("Google");

  /* -------- intercetta BIP + scheduling + global API -------- */
  useEffect(() => {
    if (isStandalone) return;

    const onBIP = (e) => {
      e.preventDefault();
      bipRef.current = e;
      setCanInstall(true);

      // se arrivo dal “salta a Chrome” → autoprompt
      if (sessionStorage.getItem(KEY_PENDING) === "1") {
        sessionStorage.removeItem(KEY_PENDING);
        setTimeout(() => doInstall(), 20);
      }
    };

    window.addEventListener("beforeinstallprompt", onBIP);

    // iOS Safari non emette BIP -> modal con istruzioni
    if (isIOS && isSafari) setIosManual(true);

    if (dueNow()) setTimeout(() => setOpen(true), 6000);

    (window).__openInstallModal = () => setOpen(true);

    const onKey = (ev) => ev.key === "Escape" && onLater();
    window.addEventListener("keydown", onKey);

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

  /* -------- forza apertura in Chrome (no Samsung) -------- */
  function openInChrome() {
    if (!isAndroid || isChrome) return false;
    try {
      sessionStorage.setItem(KEY_PENDING, "1");
    } catch {}
    const scheme = location.protocol.replace(":", "");
    const href = location.href;
    const play = "https://play.google.com/store/apps/details?id=com.android.chrome";
    const intent =
      `intent://${location.host}${location.pathname}${location.search}${location.hash}` +
      `#Intent;scheme=${scheme};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(
        href
      )};end`;
    // se Chrome manca, Android apre il fallback_url (che è la stessa pagina);
    // in quel caso l'utente resta dove si trova. Aggiungiamo anche un link visibile sotto.
    location.href = intent;
    return true;
  }

  /* -------- prompt installazione -------- */
  async function doInstall() {
    const e = bipRef.current;
    if (!e) {
      // prompt non ancora disponibile: se non sono in Chrome su Android → apri Chrome
      if (isAndroid && !isChrome) {
        openInChrome();
      }
      setOpen(false);
      return;
    }
    try {
      e.prompt();
      const res = await e.userChoice;
      if (res?.outcome !== "accepted") {
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

      {/* dialog – grafica invariata */}
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
                Installa l’app Il Borghista
              </div>
              <div className="text-xs/5 opacity-90">Tocca e sei pronto.</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-3">
          <button
            onClick={onLater}
            className="rounded-xl border px-3 py-2 text-sm font-medium text-[#6B271A] hover:bg-neutral-50"
          >
            Più tardi
          </button>

          {/* “Installa ora”: prompt se c’è, altrimenti salta a Chrome e autoprompt */}
          <button
            onClick={() => (canInstall ? doInstall() : (isAndroid && !isChrome ? openInChrome() : doInstall()))}
            className="rounded-xl bg-[#D54E30] px-3 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            Installa ora
          </button>
        </div>

        {/* hint piccoli (non cambia la grafica del blocco azioni) */}
        {iosManual ? (
          <div className="px-4 pb-4 text-center text-[11px] text-neutral-500">
            Su iPhone/iPad: <b>Condividi</b> (⬆️) → <b>Aggiungi a Home</b>.
          </div>
        ) : !canInstall && isAndroid && !isChrome ? (
          <div className="px-4 pb-4 text-center text-[11px] text-neutral-500">
            Apertura in Chrome per l’installazione. Se non accade, <a
              href="https://play.google.com/store/apps/details?id=com.android.chrome"
              className="underline"
              target="_blank"
              rel="noreferrer"
            >installa/aggiorna Chrome</a> e riprova.
          </div>
        ) : !canInstall && isAndroid && isChrome ? (
          <div className="px-4 pb-4 text-center text-[11px] text-neutral-500">
            Se non vedi il bottone, menu ⋮ → <b>Installa app</b>.
          </div>
        ) : null}
      </div>
    </div>
  );
}
