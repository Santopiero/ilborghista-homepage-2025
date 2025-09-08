import React, { useEffect, useState } from "react";

const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

const canShowAgain = () => {
  const next = Number(localStorage.getItem("a2hs-fab-next") || 0);
  return Date.now() >= next;
};

export default function InstallFAB() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (!canShowAgain()) return;
    setShow(true);

    const onInstalled = () => setShow(false);
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  if (!show) return null;

  const hide7d = () => {
    localStorage.setItem("a2hs-fab-next", String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setShow(false);
  };

  return (
    <div className="fixed right-4 bottom-4 z-[99]">
      <button
        onClick={() => window.__openInstallModal?.()}
        className="shadow-lg rounded-full px-4 py-3 bg-[#0b3a53] text-white text-sm font-medium hover:opacity-90"
        aria-label="Installa l’app"
        title="Installa l’app"
      >
        📲 Installa l’app
      </button>
      <button
        onClick={hide7d}
        className="absolute -top-2 -right-2 bg-white rounded-full ring-1 ring-black/10 w-6 h-6 text-xs"
        aria-label="Nascondi"
        title="Nascondi"
      >
        ✕
      </button>
    </div>
  );
}
