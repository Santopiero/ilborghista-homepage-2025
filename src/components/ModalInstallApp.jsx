import React, { useEffect, useState, useCallback } from "react";

/* Utils */
const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

const canShowAgain = () => {
  const next = Number(localStorage.getItem("a2hs-next") || 0);
  return Date.now() >= next;
};
const snooze7d = () => {
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  localStorage.setItem("a2hs-next", String(Date.now() + sevenDays));
};

export default function ModalInstallApp() {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState("none"); // 'android' | 'ios' | 'none'
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const close = useCallback(() => {
    setShow(false);
    snooze7d();
  }, []);

  // Espone un trigger globale per aprire il modale da qualunque punto (menu/CTA)
  useEffect(() => {
    window.__openInstallModal = () => {
      if (isStandalone()) return;         // già installata
      if (!canShowAgain()) return;        // rispettare snooze
      if (isIOS()) {
        setMode("ios");
        setShow(true);
      } else if (deferredPrompt) {
        setMode("android");
        setShow(true);
      } else {
        // Nessun beforeinstallprompt disponibile: mostra fallback generico
        setMode("ios");
        setShow(true);
      }
    };
    return () => {
      if (window.__openInstallModal) delete window.__openInstallModal;
    };
  }, [deferredPrompt]);

  // Autoproponi (soft) dopo la 2ª visita o ad evento beforeinstallprompt
  useEffect(() => {
    if (isStandalone()) return;

    const handler = (e) => {
      // Android/desktop: intercetta l’evento e blocca il prompt nativo
      e.preventDefault();
      setDeferredPrompt(e);
      if (canShowAgain() && !show && !isIOS()) {
        setMode("android");
        setShow(true);
      }
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS: se non abbiamo mai chiesto e si può, mostra istruzioni
    if (isIOS() && canShowAgain()) {
      setMode("ios");
      setShow(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [show]);

  const onInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      setShow(false);
      // niente snooze: installata
    } else {
      // rifiutata: rispetta utente
      close();
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full sm:w-[520px] mx-3 sm:mx-0 rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          <img src="/icons/icon-192.png" alt="" className="w-10 h-10 rounded-xl" />
          <div className="flex-1">
            <div className="font-semibold text-lg">Installa “Il Borghista”</div>
            <div className="text-sm text-gray-500">
              Accesso rapido, esperienza a schermo intero e notifiche (in arrivo).
            </div>
          </div>
          <button onClick={close} className="text-gray-500 hover:text-gray-700 px-2 py-1">✕</button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {mode === "android" ? (
            <>
              <p className="text-sm text-gray-700">
                Installa l’app per averla nella schermata Home e aprirla come un’app nativa.
              </p>
              <button
                onClick={onInstallClick}
                className="w-full rounded-xl px-4 py-3 font-medium text-white bg-[#0b3a53] hover:opacity-90"
              >
                Installa ora
              </button>
              <p className="text-xs text-gray-500 text-center">
                Se non vedi il prompt, apri il menu ⋮ del browser e scegli “Installa app”.
              </p>
            </>
          ) : (
            <>
              <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
                <li>Su iPhone/iPad apri il menu <span className="font-medium">Condividi</span> (Qadrato con freccia).</li>
                <li>Tocca <span className="font-medium">Aggiungi a schermata Home</span>.</li>
                <li>Conferma il nome <span className="font-medium">Il Borghista</span> e tocca <span className="font-medium">Aggiungi</span>.</li>
              </ol>
              <a
                href="https://support.apple.com/it-it/HT208982"
                target="_blank"
                rel="noreferrer"
                className="inline-flex justify-center w-full rounded-xl px-4 py-3 font-medium text-white bg-[#0b3a53] hover:opacity-90"
              >
                Vedi istruzioni ufficiali Apple
              </a>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 flex justify-end gap-2 border-t">
          <button
            onClick={close}
            className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
          >
            Non ora
          </button>
        </div>
      </div>
    </div>
  );
}
