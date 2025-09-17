// src/components/EmbedCard.jsx
import { useMemo } from "react";

function parseUrl(u) {
  try {
    const url = new URL(u);
    const host = url.hostname.replace(/^www\./, "");
    const path = url.pathname;

    if (host.includes("youtube.com")) {
      const vid = url.searchParams.get("v");
      return vid ? { type: "youtube", id: vid, url } : { type: "link", url };
    }
    if (host === "youtu.be") {
      const vid = path.split("/").filter(Boolean)[0];
      return vid ? { type: "youtube", id: vid, url } : { type: "link", url };
    }
    if (host.includes("vimeo.com")) {
      const id = path.split("/").filter(Boolean)[0];
      return id ? { type: "vimeo", id, url } : { type: "link", url };
    }
    if (host.includes("tiktok.com")) {
      const parts = path.split("/").filter(Boolean);
      const idx = parts.indexOf("video");
      const id = idx >= 0 ? parts[idx + 1] : null;
      return id ? { type: "tiktok", id, url } : { type: "link", url };
    }
    if (host.includes("facebook.com")) {
      if (path.includes("/videos/")) return { type: "facebookVideo", href: url.toString(), url };
      return { type: "link", url };
    }
    if (host.includes("instagram.com")) {
      return { type: "instagram", href: url.toString(), url };
    }
    return { type: "link", url };
  } catch {
    return { type: "invalid" };
  }
}

function IframeResponsive({ src, title }) {
  return (
    <div className="relative w-full overflow-hidden rounded-xl border bg-black/2" style={{ paddingTop: "56.25%" }}>
      <iframe
        src={src}
        title={title || "embed"}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}

export default function EmbedCard({ url, title, caption }) {
  const meta = useMemo(() => parseUrl(url), [url]);

  if (meta.type === "invalid") {
    return (
      <div className="rounded-xl border p-3 text-sm text-red-800 bg-red-50">
        URL non valido.
      </div>
    );
  }

  return (
    <figure className="rounded-2xl border p-3 bg-white">
      <div className="mb-2">
        <div className="text-sm font-semibold text-[#6B271A] truncate">
          {title || "Contenuto incorporato"}
        </div>
        <a
          href={typeof url === "string" ? url : "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-neutral-600 underline break-all"
        >
          {url}
        </a>
      </div>

      <div className="space-y-2">
        {meta.type === "youtube" && (
          <IframeResponsive src={`https://www.youtube.com/embed/${meta.id}`} title={title || "YouTube"} />
        )}
        {meta.type === "vimeo" && (
          <IframeResponsive src={`https://player.vimeo.com/video/${meta.id}`} title={title || "Vimeo"} />
        )}
        {meta.type === "tiktok" && (
          <IframeResponsive src={`https://www.tiktok.com/embed/v2/${meta.id}`} title={title || "TikTok"} />
        )}
        {meta.type === "facebookVideo" && (
          <IframeResponsive
            src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(meta.href)}&show_text=false&width=560`}
            title={title || "Facebook Video"}
          />
        )}
        {meta.type === "instagram" && (
          <div className="rounded-xl border bg-neutral-50 p-3 text-sm">
            <div className="font-semibold mb-1">Post Instagram</div>
            <p className="text-neutral-700 mb-2">
              L’anteprima ufficiale richiede lo script Instagram. Apri il post:
            </p>
            <a
              href={meta.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white hover:bg-neutral-50"
            >
              Apri su Instagram
            </a>
          </div>
        )}
        {meta.type === "link" && (
          <div className="rounded-xl border bg-neutral-50 p-3 text-sm">
            <div className="font-semibold mb-1">Anteprima non disponibile</div>
            <p className="text-neutral-700">Apri il link in una nuova scheda:</p>
            <a
              href={typeof url === "string" ? url : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white hover:bg-neutral-50"
            >
              Apri link
            </a>
          </div>
        )}
      </div>

      {caption && <figcaption className="mt-2 text-xs text-neutral-600">{caption}</figcaption>}
    </figure>
  );
}
