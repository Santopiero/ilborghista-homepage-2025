// src/components/ModalInstallApp.jsx
import { useEffect, useRef, useState } from "react";
import { X, Smartphone } from "lucide-react";

export default function ModalInstallApp() {
  const APP_NAME = "Il Borghista";
  const [open, setOpen] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const bipRef = useRef(null);

  // ---- ambiente
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

  // Intent per riaprire la stessa pagina in Chrome (solo Android non-Chrome)
  const chromeIntent = isAndroid && !isChrome
    ? `intent://${location.host}${location.pathname}${location.search}#Intent;scheme=${location.protocol.replace(
        ":",
        ""
      )};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(
        location.href
      )};end`
    : null;

  useEffect(() => {
    if (isStandalone) return;
    const onBIP = (e) => {
      // intercetta il prompt e lo “deferra”
      e.preventDefault();
      bipRef.current = e;
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // API globale per aprire la modale (es. da menu a panino)
    window.__openInstallModal = () => setOpen(true);

    const onKey = (ev) => ev.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("keydown", onKey);
      if (window.__openInstallModal) delete window.__openInstallModal;
    };
  }, [isStandalone]);

  const doInstall = async () => {
    try {
      const e = bipRef.current;
      if (!e) {
        setOpen(false);
        return;
      }
      e.prompt();
      await e.userChoice; // {outcome:'accepted'|'dismissed'}
    } finally {
      setOpen(false);
    }
  };

  if (isStandalone) return null;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => setOpen(false)}
      />

      {/* dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-title"
        className="absolute left-1/2 top-1/2 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2
                   overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10"
      >
        {/* header “hero” minimal */}
        <div className="relative h-28 bg-gradient-to-r from-[#6B271A] via-[#8a4a3a] to-[#D54E30]">
          <button
            aria-label="Chiudi"
            onClick={() => setOpen(false)}
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
              {/* sottotitolo super breve, resta discreto */}
              <div className="text-xs/5 opacity-90">Tocca e sei pronto.</div>
            </div>
          </div>
        </div>

        {/* footer azioni */}
        <div className="flex items-center justify-end gap-2 p-3">
          <button
            onClick={() => setOpen(false)}
            className="rounded-xl border px-3 py-2 text-sm font-medium text-[#6B271A] hover:bg-neutral-50"
          >
            Più tardi
          </button>

          {isAndroid && !isChrome ? (
            <a
              href={chromeIntent}
              rel="noopener"
              className="rounded-xl bg-[#D54E30] px-3 py-2 text-sm font-semibold text-white hover:opacity-95"
            >
              Apri in Chrome
            </a>
          ) : canInstall ? (
            <button
              onClick={doInstall}
              className="rounded-xl bg-[#D54E30] px-3 py-2 text-sm font-semibold text-white hover:opacity-95"
            >
              Installa ora
            </button>
          ) : (
            // Fallback ultra-minimal quando il BIP non è ancora disponibile
            <button
              onClick={() => setOpen(false)}
              className="rounded-xl bg-[#D54E30] px-3 py-2 text-sm font-semibold text-white hover:opacity-95"
            >
              OK
            </button>
          )}
        </div>

        {/* hint piccolo e non invadente */}
        {!canInstall && isAndroid && isChrome ? (
          <div className="px-4 pb-4 text-center text-[11px] text-neutral-500">
            Se non vedi il bottone, menu ⋮ → <b>Installa app</b>.
          </div>
        ) : null}
      </div>
    </div>
  );
}
