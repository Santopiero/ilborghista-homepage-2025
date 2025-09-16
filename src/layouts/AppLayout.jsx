// src/layouts/AppLayout.jsx
import { Suspense } from "react";
import { Outlet } from "react-router-dom";

/* ⬇️ usa la topbar DRY vera */
import Topbar from "../components/Topbar.jsx"; // ← se il file ha un nome/percorso diverso, vedi note sotto

function TinyFallback() {
  return <div style={{ padding: 16 }}>Caricamento…</div>;
}

export default function AppLayout() {
  return (
    <>
      <Topbar />        {/* ✅ stessa barra che vedi nelle Regioni */}
      <Suspense fallback={<TinyFallback />}>
        <Outlet />
      </Suspense>
    </>
  );
}
