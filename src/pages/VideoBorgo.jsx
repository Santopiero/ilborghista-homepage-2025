// src/pages/VideoBorgo.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import SafeEmbed from "../components/SafeEmbed.jsx";
import { BORGI_BY_SLUG } from "../data/borghi";
import { findBorgoBySlug, isFavorite, toggleFavorite } from "../lib/store";
import { getVideosByBorgo as getVideosByBorgoLocal, getPlayableUrl } from "../lib/creatorVideos";
import { MapPin, Heart, X, Filter, PlayCircle } from "lucide-react";

/* ---------- helpers ---------- */
const getYouTubeId = (url = "") => {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v") || "";
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
  } catch {}
  return "";
};
const getThumb = (v) =>
  v.thumbnail ||
  (v.youtubeUrl || v.url
    ? `https://i.ytimg.com/vi/${getYouTubeId(v.youtubeUrl || v.url)}/hqdefault.jpg`
    : "");

function useFavorite(type, id, data) {
  const [fav, setFav] = useState(() => {
    try { return isFavorite?.(type, id) ?? false; } catch { return false; }
  });
  const toggle = (e) => {
    e?.preventDefault?.(); e?.stopPropagation?.();
    try {
      const next = toggleFavorite?.(type, id, data);
      setFav(typeof next === "boolean" ? next : !fav);
    } catch { setFav(!fav); }
  };
  return [fav, toggle];
}

/* ---------- Card video (stile HomeBorgo) ---------- */
function VideoCard({ v, place, onOpen }) {
  const th = getThumb(v);
  const [fav, toggleFav] = useFavorite("video", v.id, {
    id: v.id, title: v.title, thumbnail: th, url: v.youtubeUrl || v.url, borgoName: place
  });

  return (
    <article className="group relative overflow-hidden rounded-2xl bg-white shadow ring-1 ring-black/5">
      <button type="button" onClick={() => onOpen(v)} className="block w-full text-left">
        <div className="relative aspect-[16/9] overflow-hidden">
          {th ? (
            <img src={th} alt={v.title} className="h-full w-full object-cover group-hover:scale-[1.02] transition" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400">
              <PlayCircle className="h-10 w-10" />
            </div>
          )}
          <button
            aria-label={fav ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
            onClick={toggleFav}
            className={`absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full shadow ring-1 ring-black/10 ${fav ? "bg-[#D54E30] text-white" : "bg-white/90 text-[#6B271A]"}`}
          >
            <Heart className="h-4 w-4" fill={fav ? "currentColor" : "none"} />
          </button>
        </div>
        <div className="p-3">
          <div className="font-extrabold text-[#5B2A1F] line-clamp-2">{v.title}</div>
          <div className="mt-1 flex items-center gap-1 text-sm text-neutral-600">
            <MapPin className="h-4 w-4 text-[#D54E30]" />
            {place}
          </div>
        </div>
      </button>
    </article>
  );
}

/* ---------- Pagina ---------- */
export default function VideoBorgo() {
  const { slug } = useParams();
  const borgo = useMemo(() => findBorgoBySlug(slug), [slug]);
  const meta = BORGI_BY_SLUG?.[slug] || null;
  const placeName = meta?.name || borgo?.name || slug;

  // sorgente dati
  const allVideos = useMemo(() => getVideosByBorgoLocal(slug), [slug]);

  // filtri
  const [q, setQ] = useState("");
  const [source, setSource] = useState("all"); // all|youtube|instagram|tiktok|facebook|file
  const filtered = useMemo(() => {
    const t = (q || "").toLowerCase().trim();
    return (allVideos || []).filter((v) => {
      const okText = !t || (v.title || "").toLowerCase().includes(t) || (v.creatorName || "").toLowerCase().includes(t);
      const url = (v.youtubeUrl || v.url || "").toLowerCase();
      const kind =
        url.includes("youtube") || url.includes("youtu.be") ? "youtube" :
        url.includes("instagram") ? "instagram" :
        url.includes("tiktok") ? "tiktok" :
        url.includes("facebook") ? "facebook" :
        v.source === "file" ? "file" : "other";
      const okSrc = source === "all" ? true : kind === source;
      return okText && okSrc;
    });
  }, [allVideos, q, source]);

  // player modale
  const [openVid, setOpenVid] = useState(null);
  const [playUrl, setPlayUrl] = useState("");
  async function openVideo(v) {
    setOpenVid(v);
    try {
      if (v?.source === "file") {
        const url = await getPlayableUrl(v);
        setPlayUrl(url || "");
      } else {
        setPlayUrl(v?.url || v?.youtubeUrl || "");
      }
    } catch { setPlayUrl(v?.url || v?.youtubeUrl || ""); }
  }
  function closeVideo() { setOpenVid(null); setPlayUrl(""); }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-4 sm:px-6">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#5B2A1F]">Video dei creator · {placeName}</h1>
          <p className="text-sm text-neutral-600">Raccolta dei contenuti pubblicati dai nostri creator su questo borgo.</p>
        </div>
        <Link to="/registrazione-creator" className="inline-flex h-10 items-center justify-center rounded-xl bg-[#D54E30] px-4 text-sm font-semibold text-white">
          Diventa creator
        </Link>
      </div>

      {/* filtri */}
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca titolo o creator…"
          className="rounded-xl border px-3 py-2 outline-none focus:border-[#6B271A]"
        />
        <div className="flex gap-2">
          {["all","youtube","instagram","tiktok","facebook","file"].map((k) => (
            <button
              key={k}
              onClick={() => setSource(k)}
              className={`rounded-full border px-3 py-2 text-sm ${source===k ? "bg-[#6B271A] text-white border-[#6B271A]" : "bg-white text-[#6B271A] border-[#E1B671]"}`}
              title={k}
            >
              {k === "all" ? "Tutte" : k[0].toUpperCase() + k.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* griglia */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Nessun video trovato con questi filtri.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <VideoCard key={v.id} v={v} place={placeName} onOpen={openVideo} />
          ))}
        </div>
      )}

      {/* modale player */}
      {openVid && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/60" onClick={closeVideo} />
          <div className="absolute left-1/2 top-1/2 w-[96%] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <div className="pr-6">
                <div className="text-sm text-neutral-600">{placeName}</div>
                <h3 className="text-lg font-bold text-[#5B2A1F] line-clamp-2">{openVid.title}</h3>
              </div>
              <button className="inline-flex h-9 w-9 items-center justify-center rounded-full border" onClick={closeVideo} aria-label="Chiudi">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-black/5" style={{ borderColor: "#E1B671" }}>
              {openVid.source === "file" ? (
                <video src={playUrl} controls playsInline className="absolute inset-0 h-full w-full rounded-xl" />
              ) : (
                <div className="absolute inset-0">
                  <SafeEmbed url={playUrl} title={openVid.title} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
