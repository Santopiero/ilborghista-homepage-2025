// src/pages/PoiDetail.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { findPoiById, getVideosByPoi, getVideoObjectURL } from "../lib/store";
import { Film } from "lucide-react";


function YouTubeEmbed({ url }) {
  try {
    const u = new URL(url);
    let videoId = "";
    if (u.hostname.includes("youtube.com")) videoId = u.searchParams.get("v") || "";
    else if (u.hostname.includes("youtu.be")) videoId = u.pathname.replace("/", "");
    if (!videoId) return null;
    return (
      <div className="aspect-video w-full">
        <iframe
          className="w-full h-full rounded-xl"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  } catch {
    return null;
  }
}

export default function PoiDetail() {
  const { poiId, slug } = useParams();
  const poi = useMemo(() => findPoiById(poiId), [poiId]);
  const videos = useMemo(() => getVideosByPoi(poiId), [poiId]);

  if (!poi) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <p className="text-gray-700">Attività non trovata.</p>
        <Link to={`/borghi/${slug}`} className="text-[#6B271A] underline">Torna al borgo</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <Link to={`/borghi/${slug}`} className="text-[#6B271A] underline">← Torna a {slug}</Link>
        <h1 className="text-2xl font-bold mt-4">{poi.name}</h1>
        <p className="text-gray-600">{poi.type}</p>

        {videos.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Film className="w-5 h-5" /> Video
            </h2>
            <div className="grid md:grid-cols-2 gap-6 mt-3">
              {videos.map(v => (
                <article key={v.id} className="border rounded-xl p-3">
                  <YouTubeEmbed url={v.youtubeUrl || v.url} />
                  <h3 className="mt-2 font-medium">{v.title}</h3>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
