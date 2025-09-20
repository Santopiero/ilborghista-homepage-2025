import { useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { POI_BY_BORGO } from "../data/poi.js";
import { MapPin, Share2, Compass, Clock, ChevronLeft, Heart, Play } from "lucide-react";
import PallotteBar, { CategoryBadge } from "../components/PallotteBar.jsx";

/* preferiti */
function useFav(id) {
  const KEY = "ib_favs";
  const [fav, setFav] = useState(() => {
    try { return (JSON.parse(localStorage.getItem(KEY)) || []).includes(id); }
    catch { return false; }
  });
  return [
    fav,
    () => {
      try {
        const arr = JSON.parse(localStorage.getItem(KEY)) || [];
        const next = arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];
        localStorage.setItem(KEY, JSON.stringify(next));
        setFav(!fav);
      } catch {}
    },
  ];
}

/* mini card per consigliati */
function MiniCard({ title, img, href }) {
  return (
    <Link to={href} className="w-44 shrink-0 rounded-xl overflow-hidden border bg-white hover:shadow transition">
      <div className="aspect-video w-full overflow-hidden">
        <img src={img} alt={title} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="p-2">
        <div className="text-sm font-medium line-clamp-2">{title}</div>
      </div>
    </Link>
  );
}

export default function PoiDetail() {
  const { slug, poiId } = useParams();
  const data = (POI_BY_BORGO[slug] || []).find((x) => x.id === poiId);
  const [active, setActive] = useState("descrizione");
  const [expanded, setExpanded] = useState(false);
  const [lang, setLang] = useState("it"); // it, en, es, de, zh
  const [fav, toggleFav] = useFav(`poi:${poiId}`);
  const videoRef = useRef(null);

  const L = (field) =>
    data?.i18n?.[lang]?.[field] ??
    data?.[field] ??
    "";

  const directionsUrl = useMemo(() => {
    if (!data) return "#";
    const q = encodeURIComponent(`${L("title")} ${data.address || data.locationName}`);
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }, [data, lang]);

  if (!data) {
    return (
      <main className="max-w-3xl mx-auto px-4 pt-14 pb-16">
        <Link to={`/borghi/${slug}/cosa-fare`} className="inline-flex items-center gap-1 text-sm text-blue-700">
          <ChevronLeft className="h-4 w-4" /> Torna a “Cosa fare”
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Attività non trovata</h1>
      </main>
    );
  }

  const otherExperiences = (POI_BY_BORGO[slug] || []).filter(
    (p) => p.type === "esperienze-itinerari"
  );

  return (
    <main className="max-w-6xl mx-auto px-4 pt-14 pb-16">
      {/* Barra “Pallotte” sticky */}
      <PallotteBar activeType={data.type} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mt-3">
        <div className="min-w-0">
          <Link to={`/borghi/${slug}/cosa-fare`} className="inline-flex items-center gap-1 text-sm text-blue-700">
            <ChevronLeft className="h-4 w-4" /> Cosa fare a {slug}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{L("title") || data.name}</h1>
            <CategoryBadge type={data.type} />
          </div>
          <div className="text-sm text-gray-600">{data.category}</div>
        </div>

        {/* Lingue + preferiti */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border overflow-hidden">
            {[
              { k: "it", label: "IT" },
              { k: "en", label: "EN" },
              { k: "es", label: "ES" },
              { k: "de", label: "DE" },
              { k: "zh", label: "中文" },
            ].map(({ k, label }) => (
              <button
                key={k}
                onClick={() => setLang(k)}
                className={`px-2.5 py-1 text-sm ${lang === k ? "bg-amber-100 font-medium" : "bg-white"}`}
                title={label}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={toggleFav}
            className={`ml-1 inline-flex items-center justify-center h-9 w-9 rounded-full border ${fav ? "bg-rose-100 text-rose-600" : "bg-white"}`}
            aria-label="Aggiungi ai preferiti"
            title="Aggiungi ai preferiti"
          >
            <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>

      {/* HERO gallery */}
      <section className="relative mt-3">
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {data.images?.map((src, i) => (
            <div key={i} className="snap-start shrink-0 basis-full sm:basis-[75%] lg:basis-[60%] rounded-2xl overflow-hidden relative">
              <img src={src} alt={`${L("title")} ${i + 1}`} className="w-full h-[220px] sm:h-[320px] object-cover" />
              {/* icona video sulla foto (sostituisce il bottone "Video" pill) */}
              {data.video?.youtubeId && (
                <button
                  onClick={() => {
                    setActive("video");
                    setTimeout(() => videoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
                  }}
                  className="absolute top-2 left-2 h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center"
                  aria-label="Guarda il video"
                  title="Guarda il video"
                >
                  <Play className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Quick actions — solo icone su mobile, testo su sm+ */}
        <div className="absolute left-3 bottom-3 flex gap-2">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/90 backdrop-blur shadow text-sm"
            title="Indicazioni"
            aria-label="Indicazioni"
          >
            <Compass className="h-4 w-4" />
            <span className="hidden sm:inline">Indicazioni</span>
          </a>
          <button
            onClick={() => {
              try {
                if (navigator.share) navigator.share({ title: L("title"), url: window.location.href });
                else navigator.clipboard.writeText(window.location.href);
              } catch {}
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/90 backdrop-blur shadow text-sm"
            title="Condividi"
            aria-label="Condividi"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Condividi</span>
          </button>
        </div>
      </section>

      {/* Meta card */}
      <section className="mt-4 rounded-2xl border p-4">
        <div className="flex flex-wrap gap-4 text-sm text-gray-700">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" /> {data.locationName}
          </span>
          {data.duration && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" /> {data.duration}
            </span>
          )}
          {data.info?.costo && <span className="inline-flex items-center gap-1">💶 {data.info.costo}</span>}
        </div>
        {data.address && <div className="mt-2 text-sm text-gray-600">{data.address}</div>}
      </section>

      {/* Tabs sticky */}
      <div className="sticky top-[56px] z-20 bg-white/90 backdrop-blur mt-4 border-b">
        <nav className="flex gap-2 overflow-x-auto px-1 py-2">
          {["descrizione", "curiosita", "info", "mappa", "video"].map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={`px-3 py-2 rounded-full text-sm whitespace-nowrap border ${
                active === t ? "bg-amber-100 border-amber-200" : "bg-white"
              }`}
            >
              {t === "descrizione" && "Descrizione"}
              {t === "curiosita" && "Curiosità"}
              {t === "info" && "Info utili"}
              {t === "mappa" && "Mappa"}
              {t === "video" && "Video"}
            </button>
          ))}
        </nav>
      </div>

      {/* DESCRIZIONE con fade */}
      {active === "descrizione" && (
        <section className="mt-4">
          <div className={`relative transition-all ${expanded ? "" : "max-h-40 overflow-hidden"}`}>
            <p className="text-[15px] leading-7 text-gray-800">
              <span
                dangerouslySetInnerHTML={{
                  __html: (L("description") || "").replace(/\*\*(.*?)\*\*/g, "<b>$1</b>"),
                }}
              />
            </p>
            {!expanded && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
            )}
          </div>
          <div className="mt-2">
            <button onClick={() => setExpanded((v) => !v)} className="mx-auto block text-sm underline">
              {expanded ? "Mostra meno" : "Leggi tutto"}
            </button>
          </div>

          {/* Itinerari & Esperienze consigliate - carosello orizzontale */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Itinerari & Esperienze consigliate</h2>
            <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {otherExperiences.length === 0 ? (
                <div className="text-sm text-gray-500 py-4">Al momento non ci sono esperienze consigliate.</div>
              ) : (
                otherExperiences.map((e) => (
                  <MiniCard
                    key={e.id}
                    title={e.title || e.name}
                    img={e.images?.[0]}
                    href={`/borghi/${slug}/esperienze`}
                  />
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {active === "curiosita" && (
        <section className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Curiosità</h2>
          <ul className="list-disc pl-5 space-y-1">
            {data.curiosita?.map((c, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: c.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") }} />
            ))}
          </ul>
        </section>
      )}

      {active === "info" && (
        <section className="mt-4 grid sm:grid-cols-2 gap-3">
          {data.info?.periodo && (
            <div className="rounded-xl border p-3">
              <div className="text-xs text-gray-500">Periodo consigliato</div>
              <div className="font-medium">{data.info.periodo}</div>
            </div>
          )}
          {data.info?.parcheggio && (
            <div className="rounded-xl border p-3">
              <div className="text-xs text-gray-500">Parcheggio</div>
              <div className="font-medium">{data.info.parcheggio}</div>
            </div>
          )}
          {data.info?.accessibilita && (
            <div className="rounded-xl border p-3">
              <div className="text-xs text-gray-500">Accessibilità</div>
              <div className="font-medium">{data.info.accessibilita}</div>
            </div>
          )}
          {data.info?.costo && (
            <div className="rounded-xl border p-3">
              <div className="text-xs text-gray-500">Costo</div>
              <div className="font-medium">{data.info.costo}</div>
            </div>
          )}
        </section>
      )}

      {active === "mappa" && (
        <section className="mt-4">
          <div className="rounded-2xl overflow-hidden border">
            <iframe
              title="Mappa"
              width="100%"
              height="320"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${encodeURIComponent(data.lat + "," + data.lng)}&hl=it&z=15&output=embed`}
            />
          </div>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
          >
            Apri in Google Maps
          </a>
        </section>
      )}

      {active === "video" && (
        <section ref={videoRef} id="video-section" className="mt-4">
          {data.video?.youtubeId ? (
            <div className="aspect-video w-full rounded-2xl overflow-hidden">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${data.video.youtubeId}`}
                title="Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <p className="text-sm text-gray-600">Nessun video disponibile.</p>
          )}
        </section>
      )}
    </main>
  );
}
