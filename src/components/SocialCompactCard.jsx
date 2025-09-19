// src/components/SocialCompactCard.jsx
import { useState } from "react";
import MediaLightbox, { detectPlatform } from "./MediaLightbox";

const badges = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  youtube: "YouTube",
  link: "Link",
};

export default function SocialCompactCard({ url, title, thumb, date, meta }) {
  const platform = detectPlatform(url);
  const [open, setOpen] = useState(false);

  const isYouTube = platform === "youtube";

  return (
    <div className="rounded-2xl border p-3 bg-white">
      <div className="aspect-video w-full overflow-hidden rounded-xl border">
        {/* Nel feed: thumb statica per IG/TikTok/Fb; iframe diretto solo per YouTube */}
        {isYouTube ? (
          <iframe
            title={title || "YouTube"}
            src={toYTEmbed(url)}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="w-full h-full relative group"
            title="Guarda"
          >
            <img
              src={thumb || meta?.thumbnail || "https://placehold.co/800x450?text=Anteprima"}
              alt={title || "Anteprima"}
              className="w-full h-full object-cover"
            />
            <span className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 group-hover:opacity-100 transition">
              <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium">
                Guarda
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="mt-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{title || "Senza titolo"}</div>
          {date && <div className="text-xs opacity-70">{date}</div>}
        </div>
        <span className="text-xs rounded-full border px-2 py-0.5 shrink-0">
          {badges[platform]}
        </span>
      </div>

      {/* Lightbox per IG/TikTok/Fb (YouTube non serve perché già embed inline) */}
      <MediaLightbox
        open={open}
        onClose={() => setOpen(false)}
        platform={platform}
        url={url}
        title={title}
      />
    </div>
  );
}

function toYTEmbed(url = "") {
  try {
    const id =
      (url.match(/youtu\.be\/([^?]+)/)?.[1]) ||
      (url.match(/v=([^&]+)/)?.[1]) ||
      "";
    return id ? `https://www.youtube.com/embed/${id}` : url;
  } catch {
    return url;
  }
}
