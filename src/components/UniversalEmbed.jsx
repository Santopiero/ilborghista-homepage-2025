// src/components/UniversalEmbed.jsx
import { useEffect, useMemo, useRef, useState } from "react";

/** ——————————————————————————————————————————————
 *  Tiny loader: carica uno script una sola volta
 *  —————————————————————————————————————————————— */
function loadScriptOnce(id, src) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) return resolve();
    const s = document.createElement("script");
    s.id = id;
    s.async = true;
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

/** ——————————————————————————————————————————————
 *  Helpers: rileva provider + normalizza URL
 *  —————————————————————————————————————————————— */
const isYouTube = (u = "") => /(youtube\.com|youtu\.be)/i.test(u);
const isInstagram = (u = "") => /instagram\.com/i.test(u);
const isTikTok = (u = "") => /tiktok\.com/i.test(u);
const isFacebook = (u = "") => /(facebook\.com|fb\.watch)/i.test(u);

function ytEmbedSrc(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.searchParams.get("v")) return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    // /shorts/<id> or /embed/<id>
    const parts = u.pathname.split("/").filter(Boolean);
    const id = parts.includes("shorts") || parts.includes("embed") ? parts[1] : parts[0];
    return id ? `https://www.youtube.com/embed/${id}` : "";
  } catch { return ""; }
}

/** ——————————————————————————————————————————————
 *  UniversalEmbed
 *  —————————————————————————————————————————————— */
export default function UniversalEmbed({ url, title = "Anteprima", width = "100%" }) {
  const wrapRef = useRef(null);
  const [error, setError] = useState("");

  const p = useMemo(() => ({
    ig: isInstagram(url),
    tt: isTikTok(url),
    fb: isFacebook(url),
    yt: isYouTube(url),
  }), [url]);

  // Attempt embed + fallback error after a small timeout
  useEffect(() => {
    let cancelled = false;
    setError("");

    const run = async () => {
      try {
        if (p.ig) {
          await loadScriptOnce("ig-embed-js", "https://www.instagram.com/embed.js");
          if (!cancelled) window.instgrm?.Embeds?.process?.();
        } else if (p.tt) {
          await loadScriptOnce("tt-embed-js", "https://www.tiktok.com/embed.js");
          // TikTok di solito autoprocessa; se esiste:
          window.tiktokEmbedLoad?.();
        } else if (p.fb) {
          await loadScriptOnce("fb-embed-js", "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v19.0");
          if (!cancelled) window.FB?.XFBML?.parse?.(wrapRef.current || undefined);
        } else if (p.yt) {
          // niente script
        }
      } catch {
        if (!cancelled) setError("Contenuto non incorporabile o URL non valido.");
      }

      // Fallback se l’embed non si materializza (post privato, embed disattivato, ecc.)
      setTimeout(() => {
        if (cancelled) return;
        // Per IG/TT/FB non possiamo sapere con certezza, ma se non c’è child, segnala
        if (wrapRef.current && wrapRef.current.childElementCount === 0 && !p.yt) {
          setError("Contenuto non incorporabile (profilo privato o embedding disattivato).");
        }
      }, 2500);
    };
    run();

    return () => { cancelled = true; };
  }, [p.ig, p.tt, p.fb, p.yt, url]);

  return (
    <div ref={wrapRef}>
      {p.ig && (
        <blockquote
          className="instagram-media"
          data-instgrm-permalink={url}
          data-instgrm-version="14"
          style={{ background: "#fff", border: 0, margin: 0, padding: 0, width: "100%" }}
        />
      )}

      {p.tt && (
        <blockquote
          className="tiktok-embed"
          cite={url}
          data-video-id=""
          style={{ maxWidth: 605, minWidth: 325, margin: 0 }}
        >
          <a href={url}>{title}</a>
        </blockquote>
      )}

      {p.fb && (
        <div
          className="fb-video"
          data-href={url}
          data-allowfullscreen="true"
          data-width="auto"
          data-show-text="false"
        />
      )}

      {p.yt && (
        <div style={{ position: "relative", paddingTop: "56.25%" }}>
          <iframe
            title={title}
            src={ytEmbedSrc(url)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ position: "absolute", inset: 0, width, height: "100%", border: 0, borderRadius: 12 }}
          />
        </div>
      )}

      {!p.ig && !p.tt && !p.fb && !p.yt && (
        <div style={{ fontSize: 14, color: "#6B271A" }}>
          URL non supportato per l’incorporamento.
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            color: "#6B271A",
            background: "#FAF5E0",
            border: "1px solid #E1B671",
            borderRadius: 8,
            padding: "8px 10px",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
