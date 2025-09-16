// src/layouts/AppLayout.jsx
import { Suspense } from "react";
import { Outlet } from "react-router-dom";

/* ⬇️ usa la topbar DRY vera */
import TopBar from "../components/TopBar.jsx"; // ✅ nome corretto, rispettando case-sensitive

function TinyFallback() {
  return <div style={{ padding: 16 }}>Caricamento…</div>;
}

export default function AppLayout() {
  return (
    <>
      <TopBar />        {/* ✅ stessa barra che vedi nelle Regioni */}
      <Suspense fallback={<TinyFallback />}>
        <Outlet />
      </Suspense>
    </>
  );
}
