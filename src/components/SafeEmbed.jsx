// src/components/SafeEmbed.jsx
import React, { useEffect, useMemo, useRef } from "react";

function norm(u = "") {
  try { return new URL(u); } catch { return null; }
}
const isYouTube   = (u="") => /(?:youtu\.be|youtube\.com)/i.test(u);
const isVimeo     = (u="") => /vimeo\.com/i.test(u);
const isInstagram = (u="") => /instagram\.com/i.test(u);
const isTikTok    = (u="") => /tiktok\.com/i.test(u);

function ytEmbedSrc(url) {
  const U = norm(url); if (!U) return "";
  if (U.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${U.pathname.slice(1)}`;
  if (U.searchParams.get("v"))
    return `https://www.youtube.com/embed/${U.searchParams.get("v")}`;
  const m = U.pathname.match(/\/shorts\/([^/]+)/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  return "";
}
function vimeoEmbedSrc(url) {
  const U = norm(url); if (!U) return "";
  const id = U.pathname.split("/").filter(Boolean)[0];
  return id ? `https://player.vimeo.com/video/${id}` : "";
}

/** carica uno script esterno una sola volta */
function useScriptOnce(id, src) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById(id)) return;
    const s = document.createElement("script");
    s.id = id; s.async = true; s.src = src;
    document.body.appendChild(s);
  }, [id, src]);
}

/** Instagram richiede la chiamata a window.instgrm.Embeds.process() */
function useInstagramProcess(deps) {
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        window.instgrm && window.instgrm.Embeds && window.instgrm.Embeds.process();
      } catch {}
    }, 80);
    return () => clearTimeout(t);
  }, deps); // riesegui quando cambia l’URL (o rimonta il componente)
}

export default function SafeEmbed({ url = "", title = "", caption = "" }) {
  const containerRef = useRef(null);

  // ========== INSTAGRAM ==========
  if (isInstagram(url)) {
    useScriptOnce("ig-embed-js", "https://www.instagram.com/embed.js");
    useInstagramProcess([url]);

    return (
      <div ref={containerRef} className="rounded-xl border p-2" style={{ borderColor: "#E1B671" }}>
        <blockquote
          className="instagram-media"
          data-instgrm-permalink={url}
          data-instgrm-version="14"
          style={{ background: "#fff", border: 0, margin: 0, padding: 0, width: "100%" }}
        />
        <div className="mt-2 text-xs text-[#6B271A]">
          L’anteprima ufficiale Instagram è incorporata qui. Se non vedi il player, apri il post:
          <div className="mt-2">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs"
              style={{ borderColor: "#E1B671", color: "#6B271A" }}
            >
              Apri su Instagram
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ========== TIKTOK ==========
  if (isTikTok(url)) {
    // TikTok ha due modi: iframe (per /embed/) o blockquote + script.
    // Se l’URL contiene /video/ costruiamo l’embed con /embed/.
    const U = norm(url);
    let embed = "";
    if (U) {
      const m = U.pathname.match(/\/video\/(\d+)/);
      if (m) embed = `https://www.tiktok.com/embed/${m[1]}`;
    }
    if (embed) {
      return (
        <div className="relative w-full overflow-hidden rounded-xl border" style={{ borderColor: "#E1B671" }}>
          <iframe
            src={embed}
            title={title || "TikTok"}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            className="aspect-[9/16] w-full"
            loading="lazy"
          />
        </div>
      );
    }
  }

  // ========== YOUTUBE ==========
  if (isYouTube(url)) {
    const src = ytEmbedSrc(url);
    return (
      <div className="relative w-full overflow-hidden rounded-xl border" style={{ borderColor: "#E1B671" }}>
        <iframe
          src={src}
          title={title || "YouTube"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="aspect-video w-full"
          loading="lazy"
        />
        {caption ? <div className="p-2 text-xs text-[#6B271A]">{caption}</div> : null}
      </div>
    );
  }

  // ========== VIMEO ==========
  if (isVimeo(url)) {
    const src = vimeoEmbedSrc(url);
    return (
      <div className="relative w-full overflow-hidden rounded-xl border" style={{ borderColor: "#E1B671" }}>
        <iframe
          src={src}
          title={title || "Vimeo"}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full"
          loading="lazy"
        />
        {caption ? <div className="p-2 text-xs text-[#6B271A]">{caption}</div> : null}
      </div>
    );
  }

  // ========== FALLBACK (link esterno) ==========
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: "#E1B671", color: "#6B271A" }}>
      <div className="text-sm font-medium">{title || "Contenuto esterno"}</div>
      <a className="mt-1 block truncate underline" href={url} rel="noreferrer" target="_blank">{url}</a>
      {caption ? <div className="mt-2 text-xs">{caption}</div> : null}
    </div>
  );
}
