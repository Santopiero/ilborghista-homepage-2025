// src/pages/PoiDetail.jsx
import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { POI_BY_BORGO } from "../data/poi.js";
import { MapPin, Share2, Compass, Clock, ChevronLeft } from "lucide-react";

export default function PoiDetail() {
  const { slug, poiId } = useParams();
  const data = (POI_BY_BORGO[slug] || []).find((x) => x.id === poiId);
  const [active, setActive] = useState("descrizione");
  const [expanded, setExpanded] = useState(false);

  const directionsUrl = useMemo(() => {
    if (!data) return "#";
    const q = encodeURIComponent(`${data.title} ${data.address || data.locationName}`);
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }, [data]);

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

  return (
    <main className="max-w-4xl mx-auto px-4 pt-14 pb-16">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mt-2">
        <div>
          <Link to={`/borghi/${slug}/cosa-fare`} className="inline-flex items-center gap-1 text-sm text-blue-700">
            <ChevronLeft className="h-4 w-4" /> Cosa fare a {slug}
          </Link>
          <h1 className="text-2xl font-bold mt-1">{data.title}</h1>
          <div className="text-sm text-gray-600">{data.category}</div>
        </div>
      </div>

      {/* HERO gallery */}
      <section className="relative mt-3">
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {data.images?.map((src, i) => (
            <div key={i} className="snap-start shrink-0 basis-full sm:basis-[75%] lg:basis-[60%] rounded-2xl overflow-hidden">
              <img src={src} alt={`${data.title} ${i + 1}`} className="w-full h-[220px] sm:h-[320px] object-cover" />
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="absolute left-3 bottom-3 flex gap-2">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/90 backdrop-blur shadow text-sm"
          >
            <Compass className="h-4 w-4" /> Indicazioni
          </a>
          <button
            onClick={() => {
              try {
                if (navigator.share) {
                  navigator.share({ title: data.title, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                }
              } catch {}
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/90 backdrop-blur shadow text-sm"
          >
            <Share2 className="h-4 w-4" /> Condividi
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
          {data.info?.costo && (
            <span className="inline-flex items-center gap-1">💶 {data.info.costo}</span>
          )}
        </div>
        {data.address && <div className="mt-2 text-sm text-gray-600">{data.address}</div>}
      </section>

      {/* Tabs sticky */}
      <div className="sticky top-14 z-20 bg-white/90 backdrop-blur mt-4 border-b">
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

      {/* Sections */}
      {active === "descrizione" && (
        <section className="mt-4">
          {/* Wrapper con fade quando non espanso */}
          <div className={`relative transition-all ${expanded ? "" : "max-h-40 overflow-hidden"}`}>
            <p className="text-[15px] leading-7 text-gray-800">
              <span
                dangerouslySetInnerHTML={{
                  __html: (data.description || "").replace(/\*\*(.*?)\*\*/g, "<b>$1</b>"),
                }}
              />
            </p>

            {/* GRADIENT FADE come Home Borgo */}
            {!expanded && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
            )}
          </div>

          <div className="mt-2">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mx-auto block text-sm underline"
            >
              {expanded ? "Mostra meno" : "Leggi tutto"}
            </button>
          </div>
        </section>
      )}

      {active === "curiosita" && (
        <section className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Curiosità</h2>
          <ul className="list-disc pl-5 space-y-1">
            {data.curiosita?.map((c, i) => (
              <li
                key={i}
                dangerouslySetInnerHTML={{ __html: c.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") }}
              />
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
        <section className="mt-4">
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
