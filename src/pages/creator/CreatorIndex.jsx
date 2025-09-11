// src/pages/creator/CreatorIndex.jsx
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listCreators } from "../../lib/store";
import {
  Search as SearchIcon,
  MapPin,
  Tag,
  Video as VideoIcon,
  Eye,
  Clock,
  MessageCircle,
  Star,
  Instagram,
  Youtube,
  Music2, // usato come icona TikTok-like
} from "lucide-react";

/**
 * Panoramica Creator — versione con follower per piattaforma
 * - Mostra: avatar/cover, nome/handle, regione, categorie
 * - Metriche: video, views, durata media (se disponibile), follower (piattaforma principale)
 * - Filtri superiori + ordinamento
 * - CTA: Contatta / Vedi profilo
 */
export default function CreatorIndex() {
  const navigate = useNavigate();
  const creators = listCreators() ?? [];

  // -------------------------
  // STATE FILTRI E ORDINAMENTO
  // -------------------------
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("pop"); // pop | views | videos | recent

  // opzioni dinamiche
  const { regions, categories } = useMemo(() => {
    const r = new Set();
    const c = new Set();
    creators.forEach((cr) => {
      if (cr?.region) r.add(cr.region);
      const pool = Array.isArray(cr?.categories)
        ? cr.categories
        : [cr?.category].filter(Boolean);
      pool.forEach((x) => x && c.add(x));
    });
    return {
      regions: Array.from(r).sort((a, b) => a.localeCompare(b)),
      categories: Array.from(c).sort((a, b) => a.localeCompare(b)),
    };
  }, [creators]);

  // -------------------------
  // HELPERS
  // -------------------------
  const fmt = (n) =>
    typeof n === "number"
      ? Intl.NumberFormat("it-IT", { notation: "compact", maximumFractionDigits: 1 }).format(n)
      : "—";

  // Rileva piattaforma principale in base al numero follower/subscriber
  const pickTopPlatform = (c) => {
    const ig = c?.social?.instagramFollowers ?? c?.instagramFollowers ?? 0;
    const tt = c?.social?.tiktokFollowers ?? c?.tiktokFollowers ?? 0;
    const yt = c?.social?.youtubeSubscribers ?? c?.youtubeSubscribers ?? 0;

    const platforms = [
      { key: "instagram", label: "Instagram", count: ig, Icon: Instagram },
      { key: "tiktok", label: "TikTok", count: tt, Icon: Music2 },
      { key: "youtube", label: "YouTube", count: yt, Icon: Youtube },
    ].filter((p) => typeof p.count === "number" && p.count > 0);

    if (!platforms.length) return null;

    platforms.sort((a, b) => b.count - a.count);
    const top = platforms[0];

    // tooltip riepilogativo con tutte le piattaforme disponibili
    const tooltip = platforms
      .map((p) => `${p.label}: ${fmt(p.count)}`)
      .join(" · ");

    return { ...top, tooltip };
  };

  const getEngagement = (c) => {
    // percentuale (0-100) o frazione (0-1) gestita
    let e =
      c?.social?.engagementRate ??
      c?.engagementRate ??
      c?.stats?.engagementRate ??
      null;
    if (e == null) return null;
    if (e > 0 && e <= 1) e = e * 100;
    return Math.round(e * 10) / 10; // una cifra decimale
  };

  // -------------------------
  // FILTER + SORT
  // -------------------------
  const filtered = useMemo(() => {
    const norm = (s) => (s || "").toString().toLowerCase();

    let arr = creators.filter((c) => {
      const inRegion = !region || norm(c.region).includes(norm(region));
      const pool = Array.isArray(c.categories)
        ? c.categories
        : [c.category].filter(Boolean);
      const inCategory = !category || pool.some((cat) => norm(cat).includes(norm(category)));

      const hay =
        [
          c.name,
          c.handle ? "@" + c.handle : "",
          c.bio,
          c.region,
          ...(pool || []),
          ...(c.tags || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase() || "";

      const inQuery = !q || hay.includes(q.toLowerCase());
      return inRegion && inCategory && inQuery;
    });

    // ordinamento
    arr = arr.sort((a, b) => {
      const aViews = a?.stats?.totalViews ?? a.totalViews ?? 0;
      const bViews = b?.stats?.totalViews ?? b.totalViews ?? 0;
      const aVideos = a?.stats?.videosCount ?? a.videosCount ?? 0;
      const bVideos = b?.stats?.videosCount ?? b.videosCount ?? 0;
      const aScore = a?.points ?? a?.score ?? 0;
      const bScore = b?.points ?? b?.score ?? 0;
      const aRecent = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
      const bRecent = new Date(b?.updatedAt || b?.createdAt || 0).getTime();

      if (sort === "views") return bViews - aViews;
      if (sort === "videos") return bVideos - aVideos;
      if (sort === "recent") return bRecent - aRecent;

      // pop: miscela di punteggio, views e n° video
      const aPop = aScore * 5 + aViews * 0.001 + aVideos * 2;
      const bPop = bScore * 5 + bViews * 0.001 + bVideos * 2;
      return bPop - aPop;
    });

    return arr;
  }, [creators, q, region, category, sort]);

  const CategoryPills = ({ items = [] }) => {
    if (!items.length) return null;
    return (
      <div className="flex flex-wrap gap-1.5">
        {items.slice(0, 3).map((x, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-[#FAF5E0] text-[#6B271A] border border-amber-200"
          >
            <Tag className="w-3 h-3" aria-hidden />
            {x}
          </span>
        ))}
        {items.length > 3 && (
          <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-600 border">
            +{items.length - 3}
          </span>
        )}
      </div>
    );
  };

  // -------------------------
  // RENDER
  // -------------------------
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header + CTA */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-[#6B271A]">I nostri Creator</h1>
          <p className="text-sm text-gray-600">
            Filtra per regione e categoria, confronta metriche e contatta chi vuoi ingaggiare.
          </p>
        </div>
        <Link
          to="/registrazione-creator"
          className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-sm font-semibold bg-[#D54E30] text-white hover:bg-[#bc4329] active:translate-y-px transition"
        >
          Diventa creator
        </Link>
      </div>

      {/* Barre di ricerca e filtri */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-5">
          <label className="sr-only" htmlFor="q">Cerca creator</label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              id="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cerca per nome, tag o stile (es. food, drone, storytelling)…"
              className="w-full h-11 pl-9 pr-3 rounded-xl border bg-white focus:ring-2 focus:ring-[#E1B671]/70 outline-none"
            />
          </div>
        </div>

        <div className="md:col-span-3">
          <label className="sr-only" htmlFor="region">Regione</label>
          <select
            id="region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border bg-white text-sm focus:ring-2 focus:ring-[#E1B671]/70 outline-none"
          >
            <option value="">Tutte le regioni</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <label className="sr-only" htmlFor="category">Categoria</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border bg-white text-sm focus:ring-2 focus:ring-[#E1B671]/70 outline-none"
          >
            <option value="">Tutte le categorie</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-1">
          <label className="sr-only" htmlFor="sort">Ordina</label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border bg-white text-sm focus:ring-2 focus:ring-[#E1B671]/70 outline-none"
            title="Ordina risultati"
          >
            <option value="pop">Popolari</option>
            <option value="views">Più visti</option>
            <option value="videos">Più video</option>
            <option value="recent">Recenti</option>
          </select>
        </div>
      </div>

      {/* GRID CREATOR */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((c) => {
          const cover = c.coverUrl || c.avatarUrl;
          const avatar = c.avatarUrl || cover;
          const name = c.name || c.handle || "Creator";
          const handle = c.handle ? `@${c.handle}` : null;
          const catPool = Array.isArray(c.categories) ? c.categories : [c.category].filter(Boolean);
          const videos = c?.stats?.videosCount ?? c.videosCount ?? 0;
          const views = c?.stats?.totalViews ?? c.totalViews ?? 0;
          const avgDur = c?.stats?.avgDurationMin ?? c.avgDurationMin ?? null;
          const rating = c?.rating ?? null;

          const topPlatform = pickTopPlatform(c);
          const engagement = getEngagement(c); // percentuale se disponibile

          return (
            <article
              key={c.id}
              className="group rounded-2xl border overflow-hidden bg-white shadow-sm hover:shadow-md transition"
            >
              {/* COVER */}
              <div className="relative h-36 bg-gray-100">
                {cover ? (
                  <img
                    src={cover}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : null}

                {/* AVATAR */}
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name}
                    className="absolute -bottom-6 left-4 w-14 h-14 rounded-full ring-4 ring-white object-cover bg-white"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : (
                  <div className="absolute -bottom-6 left-4 w-14 h-14 rounded-full ring-4 ring-white bg-gray-200" />
                )}
              </div>

              {/* BODY */}
              <div className="p-4 pt-8">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-[#6B271A] leading-tight">{name}</h3>
                    {handle && <div className="text-xs text-gray-500">{handle}</div>}
                  </div>

                  {/* RATING se disponibile */}
                  {typeof rating === "number" && (
                    <div className="inline-flex items-center gap-1 text-amber-600 text-sm font-semibold">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      {rating.toFixed(1)}
                    </div>
                  )}
                </div>

                {/* Meta: regione + categorie */}
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                  {c.region && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {c.region}
                    </span>
                  )}

                  {/* Engagement (se presente) */}
                  {engagement != null && (
                    <span className="ml-auto inline-flex items-center gap-1 text-[12px] px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                      {engagement}% ENG
                    </span>
                  )}
                </div>

                {/* Categorie */}
                <div className="mt-2">
                  <CategoryPills items={catPool} />
                </div>

                {/* Metriche */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-[12px]">
                  <div className="rounded-xl border bg-[#FAF5E0] text-[#6B271A] px-2 py-2 flex items-center gap-1.5 justify-center">
                    <VideoIcon className="w-4 h-4" />
                    <span className="font-semibold">{fmt(videos)}</span>
                    <span className="opacity-80">video</span>
                  </div>
                  <div className="rounded-xl border bg-white px-2 py-2 flex items-center gap-1.5 justify-center">
                    <Eye className="w-4 h-4 text-gray-700" />
                    <span className="font-semibold">{fmt(views)}</span>
                    <span className="text-gray-600 opacity-80">views</span>
                  </div>

                  {/* Durata media: mostrata solo se disponibile */}
                  {avgDur != null ? (
                    <div className="rounded-xl border bg-white px-2 py-2 flex items-center gap-1.5 justify-center">
                      <Clock className="w-4 h-4 text-gray-700" />
                      <span className="font-semibold">{avgDur}′</span>
                      <span className="text-gray-600 opacity-80">avg</span>
                    </div>
                  ) : (
                    // Follower piattaforma principale (se non c'è avg mostriamo comunque i follower come terzo box)
                    topPlatform && (
                      <div
                        className="rounded-xl border bg-white px-2 py-2 flex items-center gap-1.5 justify-center"
                        title={topPlatform.tooltip}
                      >
                        <topPlatform.Icon className="w-4 h-4 text-gray-700" />
                        <span className="font-semibold">{fmt(topPlatform.count)}</span>
                        <span className="text-gray-600 opacity-80">
                          {topPlatform.key === "youtube" ? "sub" : "followers"}
                        </span>
                      </div>
                    )
                  )}
                </div>

                {/* Se abbiamo sia avg che follower, aggiungiamo il box follower sotto */}
                {avgDur != null && topPlatform && (
                  <div
                    className="mt-2 text-[12px] inline-flex items-center gap-1.5 rounded-xl border bg-white px-2 py-1.5"
                    title={topPlatform.tooltip}
                  >
                    <topPlatform.Icon className="w-4 h-4 text-gray-700" />
                    <span className="font-semibold">{fmt(topPlatform.count)}</span>
                    <span className="text-gray-600 opacity-80">
                      {topPlatform.key === "youtube" ? "sub" : "followers"}
                    </span>
                  </div>
                )}

                {/* CTA */}
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/chat?to=creator:${encodeURIComponent(c.id)}`)}
                    className="inline-flex items-center justify-center gap-2 h-10 px-3 rounded-xl bg-[#D54E30] text-white text-sm font-semibold hover:bg-[#bc4329] active:translate-y-px transition w-full"
                    aria-label={`Contatta ${name}`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contatta
                  </button>
                  <Link
                    to={`/creator/${c.id}`}
                    className="inline-flex items-center justify-center h-10 px-3 rounded-xl border text-sm font-semibold hover:bg-gray-50 w-32"
                  >
                    Vedi profilo
                  </Link>
                </div>
              </div>
            </article>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full text-sm text-gray-600">
            Nessun creator trovato.{" "}
            <Link to="/registrazione-creator" className="underline">
              Aggiungine uno
            </Link>
            .
          </div>
        )}
      </section>
    </main>
  );
}
