// src/components/EmbedCard.jsx
import { useEffect, useMemo, useRef, useState } from "react";

/** Carica uno script esterno una sola volta */
function ensureScript(src, id) {
  return new Promise((resolve, reject) => {
    if (id && document.getElementById(id)) return resolve();
    const s = document.createElement("script");
    if (id) s.id = id;
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Impossibile caricare ${src}`));
    document.body.appendChild(s);
  });
}

/** Riconoscimento provider */
const isYouTube   = (u="") => /(?:youtu\.be|youtube\.com)/i.test(u);
const isInstagram = (u="") => /instagram\.com/i.test(u);
const isTikTok    = (u="") => /tiktok\.com/i.test(u);

/** Normalizza URL YouTube in embed */
function toYouTubeEmbed(url) {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    if (u.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    }
    // /shorts/ID → /embed/ID
    const shorts = u.pathname.match(/\/shorts\/([^/]+)/);
    if (shorts) return `https://www.youtube.com/embed/${shorts[1]}`;
    return url;
  } catch {
    return url;
  }
}

/** Componente principale */
export default function EmbedCard({ url, title = "Anteprima", caption }) {
  const containerRef = useRef(null);
  const [error, setError] = useState("");
  const safeUrl = (url || "").trim();

  const provider = useMemo(() => {
    if (!safeUrl) return "unknown";
    if (isYouTube(safeUrl)) return "youtube";
    if (isInstagram(safeUrl)) return "instagram";
    if (isTikTok(safeUrl)) return "tiktok";
    return "unknown";
  }, [safeUrl]);

  // Render provider-specific
  useEffect(() => {
    if (!safeUrl) return;
    setError("");

    // Instagram
    if (provider === "instagram") {
      // Requisiti:
      // 1) Post/Reel pubblico
      // 2) Script embed caricato
      // NB: dal 2020 l’oEmbed ufficiale richiede token, ma il render client con blockquote + script funziona.
      ensureScript("https://www.instagram.com/embed.js", "ig-embed-js")
        .then(() => {
          // Pulizia e nuovo blockquote
          const node = containerRef.current;
          if (!node) return;
          node.innerHTML = `
            <blockquote class="instagram-media" data-instgrm-permalink="${safeUrl}" data-instgrm-version="14" style="margin:0 auto; max-width:540px; width:100%;"></blockquote>
          `;
          // Trigger parse
          window.instgrm && window.instgrm.Embeds && window.instgrm.Embeds.process();
        })
        .catch(() => setError("Impossibile incorporare il post di Instagram. Verifica che sia pubblico."));
      return;
    }

    // TikTok
    if (provider === "tiktok") {
      ensureScript("https://www.tiktok.com/embed.js", "tt-embed-js")
        .then(() => {
          const node = containerRef.current;
          if (!node) return;
          node.innerHTML = `
            <blockquote class="tiktok-embed" cite="${safeUrl}" style="max-width:605px; min-width:325px;">
              <section></section>
            </blockquote>
          `;
          // lo script auto-parsa i blockquote
        })
        .catch(() => setError("Impossibile incorporare il video TikTok."));
      return;
    }

    // YouTube non necessita script
    if (provider === "youtube") {
      const node = containerRef.current;
      if (!node) return;
      const src = toYouTubeEmbed(safeUrl);
      node.innerHTML = `
        <div style="position:relative; padding-top:56.25%;">
          <iframe
            src="${src}"
            title="${title?.replace(/"/g, "&quot;") || "YouTube"}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
            style="position:absolute; inset:0; width:100%; height:100%; border:0; border-radius:12px;"
          ></iframe>
        </div>
      `;
      return;
    }

    // fallback
    const node = containerRef.current;
    if (node) node.innerHTML = "";
    setError("Formato non supportato. Inserisci un link YouTube / Instagram / TikTok.");
  }, [safeUrl, provider, title]);

  return (
    <div className="w-full rounded-xl border p-3 bg-white" style={{ borderColor: "#E1B671" }}>
      <div ref={containerRef} />
      {error ? (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      ) : caption ? (
        <p className="mt-2 text-xs opacity-80">{caption}</p>
      ) : null}
    </div>
  );
}
