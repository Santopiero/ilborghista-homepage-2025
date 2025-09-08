import React from "react";

export default function InstallButton({ className = "", children = "Installa l’app" }) {
  return (
    <button className={className} onClick={() => window.__openInstallModal?.()}>
      {children}
    </button>
  );
}
