// src/components/SafeEmbed.jsx
import { lazy, Suspense } from "react";

const EmbedCard = lazy(() => import("./EmbedCard.jsx"));

function FallbackBox({ msg = "Caricamento anteprima…" }) {
  return (
    <div
      className="rounded-xl border p-3 text-sm"
      style={{ borderColor: "#E1B671", background: "#FAF5E0" }}
    >
      {msg}
    </div>
  );
}

function LocalError({ message }) {
  return (
    <div
      className="rounded-xl border p-3 text-sm"
      style={{ borderColor: "#FCA5A5", background: "#FEE2E2", color: "#7F1D1D" }}
    >
      Impossibile renderizzare l’embed. {message ? `(${message})` : ""}
    </div>
  );
}

export default function SafeEmbed({ url, title, caption }) {
  try {
    if (!url) return <LocalError message="URL mancante" />;
    return (
      <Suspense fallback={<FallbackBox />}>
        <EmbedCard url={url} title={title} caption={caption} />
      </Suspense>
    );
  } catch (e) {
    return <LocalError message={e?.message} />;
  }
}
