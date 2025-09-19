// src/components/MediaLightbox.jsx
import { useEffect, useRef } from "react";

const loaders = {
  instagram: () =>
    ensureScript("ig-embed-js", "https://www.instagram.com/embed.js"),
  tiktok: () =>
    ensureScript("tt-embed-js", "https://www.tiktok.com/embed.js"),
  facebook: () =>
    ensureScript("fb-sdk", "https://connect.facebook.net/it_IT/sdk.js#xfbml=1&version=v19.0"),
};

function ensureScript(id, src) {
  if (typeof window === "undefined") return;
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.async = true;
  s.src = src;
  document.body.appendChild(s);
}

export default function MediaLightbox({ open, onClose, platform, url, title }) {
  const ref = useRef(null);

  // Carica lo script ufficiale on-demand
  useEffect(() => {
    if (!open) return;
    if (platform === "instagram") loaders.instagram();
    if (platform === "tiktok") loaders.tiktok();
    if (platform === "facebook") loaders.facebook();
  }, [open, platform]);

  // Inizializza l’embed quando la modal è aperta
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      try {
        if (platform === "instagram" && window.instgrm?.Embeds?.process) {
          window.instgrm.Embeds.process();
        }
        // TikTok e Facebook auto-iniziano appena lo script è carico
      } catch {}
    }, 120);
    return () => clearTimeout(t);
  }, [open, platform, url]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="font-medium text-sm">{title || "Anteprima"}</div>
          <button onClick={onClose} className="text-sm hover:opacity-80">Chiudi ✕</button>
        </div>

        <div className="p-3">
          {/* Instagram */}
          {platform === "instagram" && (
            <blockquote
              ref={ref}
              className="instagram-media"
              data-instgrm-permalink={url}
              data-instgrm-version="14"
              style={{ width: "100%", margin: 0, border: 0, padding: 0, background: "#fff" }}
            />
          )}

          {/* TikTok */}
          {platform === "tiktok" && (
            <blockquote
              className="tiktok-embed"
              cite={url}
              data-video-id="" // opzionale; TikTok lo deduce dall’URL
              style={{ maxWidth: "605px", minWidth: "325px" }}
            >
              <a href={url}>Guarda su TikTok</a>
            </blockquote>
          )}

          {/* Facebook (usa plugin video) */}
          {platform === "facebook" && (
            <div
              className="fb-video"
              data-href={url}
              data-allowfullscreen="true"
              data-width="auto"
              data-show-text="false"
            />
          )}

          {/* YouTube: iframe diretto */}
          {platform === "youtube" && (
            <div className="aspect-video w-full">
              <iframe
                title={title || "YouTube"}
                src={toYouTubeEmbed(url)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function detectPlatform(url = "") {
  const u = url.toLowerCase();
  if (/youtu\.be|youtube\.com/.test(u)) return "youtube";
  if (/instagram\.com/.test(u)) return "instagram";
  if (/tiktok\.com/.test(u)) return "tiktok";
  if (/facebook\.com|fb\.watch/.test(u)) return "facebook";
  return "link";
}

export function toYouTubeEmbed(url = "") {
  try {
    // support youtu.be / watch?v=
    const id =
      (url.match(/youtu\.be\/([^?]+)/)?.[1]) ||
      (url.match(/v=([^&]+)/)?.[1]) ||
      "";
    return id ? `https://www.youtube.com/embed/${id}` : url;
  } catch {
    return url;
  }
}
