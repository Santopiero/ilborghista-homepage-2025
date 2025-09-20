import { useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { POI_BY_BORGO } from "../data/poi.js";
import { MapPin, Share2, Compass, Clock, ChevronLeft, Heart, Play, ChevronDown, Languages } from "lucide-react";
import PallotteBar from "../components/PallotteBar.jsx";

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

function MiniCard({ title, img, href }) {
  return (
    <Link to={href} className="w-40 sm:w-44 shrink-0 rounded-xl overflow-hidden border bg-white hover:shadow transition">
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
  const [langOpen, setLangOpen] = useState(false);
  const [fav, toggleFav] = useFav(`poi:${poiId}`);
  const videoRef = useRef(null);

  const directionsUrl = useMemo(() => {
    if (!data) return "#";
    const q = encodeURIComponent(`${data.title} ${data.address || data.locationName}`);
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }, [data]);

  const L = (field) => data?.i18n?.[lang]?.[field] ?? data?.[field] ?? "";

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

  const otherExperiences = (POI_BY_BORGO[slug] || []).filter((p) => p.type === "esperienze-itinerari");

  return (
    <main className="max-w-6xl mx-auto px-4 pt-14 pb-16">
      {/* Pallotte sticky */}
      <PallotteBar activeType={data.type} />

      {/* Header compatto */}
      <div className="flex items-center justify-between gap-2 mt-2">
        <Link to={`/borghi/${slug}/cosa-fare`} className="inline-flex items-center gap-1 text-sm text-blue-700">
          <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Cosa fare a {slug}</span><span className="sm:hidden">Indietro</span>
        </Link>

        {/* ❤️ sempre visibile */}
        <button
          onClick={toggleFav}
          className={`inline-flex items-center justify-center h-9 w-9 rounded-full border ${fav ? "bg-rose-100 text-rose-600" : "bg-white"}`}
          aria-label="Aggiungi ai preferiti"
          title="Aggiungi ai preferiti"
        >
          <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Titolo */}
      <div className="mt-2">
        <h1 className="text-xl sm:text-3xl font-bold">{L("title") || data.name}</h1>
        <div className="text-sm text-gray-600">{data.category}</div>
      </div>

      {/* HERO */}
      <section className="relative mt-3">
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {data.images?.map((src, i) => (
            <div key={i} className="snap-start shrink-0 basis-full sm:basis-[75%] lg:basis-[60%] rounded-2xl overflow-hidden relative">
              <img src={src} alt={`${L("title")} ${i + 1}`} className="w-full h-[200px] sm:h-[320px] object-cover" />
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

        {/* Quick actions (solo icone su mobile) */}
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

      {/* TABS sticky con LINGUA-PILL PRIMA DI “DESCRIZIONE” */}
      <div className="sticky top-[112px] sm:top-14 z-20 bg-white/90 backdrop-blur mt-4 border-b">
        <nav className="flex items-center gap-2 overflow-x-auto px-1 py-2">
          {/* Pill lingua */}
          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              onBlur={() => setTimeout(() => setLangOpen(false), 150)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm border bg-white"
              aria-haspopup="listbox"
              aria-expanded={langOpen}
              title="Lingua"
            >
              <Languages className="h-4 w-4" />
              {lang.toUpperCase() === "ZH" ? "中文" : lang.toUpperCase()}
              <ChevronDown className="h-4 w-4" />
            </button>

            {langOpen && (
              <ul
                role="listbox"
                className="absolute left-0 mt-1 w-28 rounded-xl border bg-white shadow z-10 overflow-hidden"
              >
                {["it","en","es","de","zh"].map((k) => (
                  <li key={k}>
                    <button
                      role="option"
                      aria-selected={lang === k}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setLang(k); setLangOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${lang===k?"font-medium bg-amber-50":""}`}
                    >
                      {k === "zh" ? "中文" : k.toUpperCase()}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Tabs contenuti */}
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

      {/* DESCRIZIONE con fade + consigliati */}
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
          <a href={directionsUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm">
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
