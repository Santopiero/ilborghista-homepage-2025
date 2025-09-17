// src/pages/VideoBorgo.jsx
import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SafeEmbed from "../components/SafeEmbed.jsx";
import { getVideosByBorgo as getVideosByBorgoLocal } from "../lib/creatorVideos";
import { BORGI_BY_SLUG } from "../data/borghi";

const providers = [
  { key: "all", label: "Tutte le piattaforme" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "youtube", label: "YouTube" },
];

const isYouTube   = (u="") => /(?:youtu\.be|youtube\.com)/i.test(u);
const isInstagram = (u="") => /instagram\.com/i.test(u);
const isTikTok    = (u="") => /tiktok\.com/i.test(u);

function providerOf(url="") {
  if (isInstagram(url)) return "instagram";
  if (isTikTok(url))    return "tiktok";
  if (isYouTube(url))   return "youtube";
  return "other";
}

export default function VideoBorgo() {
  const { slug } = useParams();
  const meta = BORGI_BY_SLUG?.[slug] || null;
  const borgoName = meta?.displayName || meta?.name || slug;

  const all = useMemo(() => getVideosByBorgoLocal(slug) || [], [slug]);
  const [pFilter, setPFilter] = useState("all");

  const list = useMemo(() => {
    const sorted = [...all].sort((a,b) => +new Date(b.publishedAt||b.updatedAt||b.createdAt||0) - +new Date(a.publishedAt||a.updatedAt||a.createdAt||0));
    if (pFilter === "all") return sorted;
    return sorted.filter(v => providerOf(v.url) === pFilter);
  }, [all, pFilter]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-[#5B2A1F]">Video dei creator · {borgoName}</h1>
        <Link to={`/borghi/${slug}`} className="text-sm underline text-[#6B271A]">
          ← Torna al borgo
        </Link>
      </div>

      {/* Filtri semplici: piattaforma */}
      <div className="mb-4 flex flex-wrap gap-2">
        {providers.map(p => (
          <button
            key={p.key}
            onClick={() => setPFilter(p.key)}
            className={`rounded-full border px-3 py-1.5 text-sm ${pFilter===p.key ? "font-semibold" : ""}`}
            style={{
              borderColor: "#E1B671",
              color: "#6B271A",
              background: pFilter===p.key ? "#FAF5E0" : "#fff"
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {list.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map(v => (
            <li key={v.id} className="rounded-2xl border p-3" style={{ borderColor: "#E1B671", background: "#fff" }}>
              <SafeEmbed url={v.url} title={v.title} caption="" />
              <div className="mt-2">
                <div className="font-semibold text-[#5B2A1F] line-clamp-2">{v.title || "Video"}</div>
                <div className="mt-1 text-xs text-[#6B271A] opacity-80">
                  {new Date(v.publishedAt || v.updatedAt || v.createdAt || Date.now()).toLocaleDateString("it-IT")}
                  {" · "}
                  {providerOf(v.url)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border p-4 text-[#6B271A]" style={{ borderColor: "#E1B671", background: "#FAF5E0" }}>
          Nessun video pubblicato per questo borgo.
        </div>
      )}
    </main>
  );
}
