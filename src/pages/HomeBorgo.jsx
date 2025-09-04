// src/pages/HomeBorgo.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  findBorgoBySlug,
  listPoiByBorgo,
  getVideosByBorgo,
  getVideosByPoi,
  getVideoObjectURL, // per i video caricati come file (IndexedDB)
} from "../lib/store";
import { BORGI_BY_SLUG, BORGI_INDEX } from "../data/borghi";
import {
  MapPin,
  Film,
  CalendarDays,
  Utensils,
  BedDouble,
  Train,
  Route,
  Mountain,
  Share2,
  Heart,
  Star,
  Bus,
  Hammer,
  ShoppingBag,
  List as ListIcon,
} from "lucide-react";


/* ---------- helpers ---------- */
function YouTubeEmbed({ url = "" }) {
  try {
    const u = new URL(url);
    let id = "";
    if (u.hostname.includes("youtube.com")) id = u.searchParams.get("v") || "";
    else if (u.hostname.includes("youtu.be")) id = u.pathname.slice(1);
    if (!id) return null;
    return (
      <div className="aspect-video w-full">
        <iframe
          className="w-full h-full rounded-xl"
          src={`https://www.youtube.com/embed/${id}`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  } catch {
    return null;
  }
}

const isFoodDrink = (p) =>
  /(ristor|tratt|osteria|pizzer|bar|caff|café|enotec|pub|agritur)/i.test(
    p.type || p.name || ""
  );
const isSleep = (p) =>
  /(hotel|b&b|b\s*&\s*b|bed|albergo|affittacamere|casa|agriturismo|residence)/i.test(
    p.type || p.name || ""
  );
const isArtigiano = (p) =>
  /(artigian|laborator|bottega|ceramic|liutaio|tessil|falegn|orafo)/i.test(
    p.type || p.name || ""
  );

/* ---------- page ---------- */
export default function HomeBorgo() {
  const { slug } = useParams();

  // Meta dal DB + dizionario statico (immagini e descrizioni)
  const borgo = useMemo(() => findBorgoBySlug(slug), [slug]);
  const meta = BORGI_BY_SLUG?.[slug] || null;

  // POI
  const allPoi = useMemo(() => listPoiByBorgo(slug), [slug]);
  const eatDrink = useMemo(() => allPoi.filter(isFoodDrink), [allPoi]);
  const sleep = useMemo(() => allPoi.filter(isSleep), [allPoi]);
  const artigiani = useMemo(() => allPoi.filter(isArtigiano), [allPoi]);
  const thingsToDo = useMemo(
    () => allPoi.filter((p) => !isFoodDrink(p) && !isSleep(p) && !isArtigiano(p)),
    [allPoi]
  );

  // Video dei creator (Home Borgo)
  const videos = useMemo(() => getVideosByBorgo(slug), [slug]);

  if (!borgo && !meta) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <p className="text-gray-700">Borgo non trovato.</p>
        <Link to="/" className="text-[#6B271A] underline">
          Torna alla Home
        </Link>
      </main>
    );
  }

  const hero =
    meta?.hero ||
    "https://images.unsplash.com/photo-1543340713-8f6b9f4507f8?q=80&w=1600&auto=format&fit=crop";
  const title = `${borgo?.name || meta?.name || slug} ${
    borgo?.provincia ? `(${borgo.provincia})` : ""
  }`;
  const descr =
    meta?.description ||
    "Scopri il borgo: cosa fare, dove mangiare e bere, dormire, eventi, itinerari, artigiani e prodotti tipici.";
  const nearby = BORGI_INDEX.filter((b) => b.slug !== slug).slice(0, 4);

  const Pill = ({ to, icon: Icon, label, bg = "bg-[#FAF5E0]" }) => (
    <a
      href={to}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full ${bg} border border-[#E1B671] text-[#6B271A] text-sm font-semibold hover:bg-white`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </a>
  );

  const CardPOI = ({ p }) => {
    const hasVideo = getVideosByPoi(p.id).length > 0;
    return (
      <li className="border rounded-2xl overflow-hidden bg-white hover:shadow-lg transition">
        <Link to={`/borghi/${slug}/poi/${p.id}`} className="block">
          <div className="h-32 w-full bg-gray-100">
            <img
              src={
                p.cover ||
                "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop"
              }
              alt={p.name}
              className="h-32 w-full object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop";
              }}
            />
          </div>
          <div className="p-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-[#6B271A] line-clamp-2">
                {p.name}
              </h3>
              <button
                type="button"
                className="shrink-0 p-1 rounded-lg border hover:bg-[#FAF5E0]"
                aria-label="salva"
                onClick={(e) => e.preventDefault()}
              >
                <Heart className="w-4 h-4 text-[#6B271A]" />
              </button>
            </div>
            <div className="text-sm text-gray-600">{p.type}</div>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#D54E30]" /> {borgo?.name || meta?.name}
              </span>
              {hasVideo && (
                <span className="inline-flex items-center gap-1 text-[#6B271A]">
                  <Film className="w-3.5 h-3.5" /> video
                </span>
              )}
            </div>
          </div>
        </Link>
      </li>
    );
  };

  /* ---- MOCK: Eventi / Itinerari / Prodotti tipici (sostituibili con feed reali) ---- */
  const eventi = [
    {
      title: "Festa delle tradizioni",
      img: "https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=1200&auto=format&fit=crop",
      when: "6–8 SET",
    },
    {
      title: "Concerti in piazza",
      img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop",
      when: "12–13 SET",
    },
    {
      title: "Sagra del gusto locale",
      img: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop",
      when: "20 SET",
    },
  ];

  const itinerari = [
    {
      title: "Passeggiata panoramica",
      img: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop",
      meta: "3 km • 1h30",
    },
    {
      title: "Percorso dei musei",
      img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
      meta: "2 km • 1h",
    },
    {
      title: "Tra chiese e arte",
      img: "https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?q=80&w=1200&auto=format&fit=crop",
      meta: "4 km • 2h",
    },
  ];

  const prodottiTipici = [
    {
      title: "Formaggio di malga",
      img: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=1200&auto=format&fit=crop",
    },
    {
      title: "Salumi tipici",
      img: "https://images.unsplash.com/photo-1505575972945-280b8f1e5d16?q=80&w=1200&auto=format&fit=crop",
    },
    {
      title: "Olio EVO locale",
      img: "https://images.unsplash.com/photo-1514515411904-65fa19574d07?q=80&w=1200&auto=format&fit=crop",
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative">
        <div className="h-72 md:h-[380px] w-full relative">
          <img
            src={hero}
            alt={title}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-4">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-end justify-between gap-3">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow">
                  {title}
                </h1>
                {(borgo?.provincia || borgo?.regione || meta?.regione) && (
                  <p className="text-white/90 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {[borgo?.provincia, borgo?.regione || meta?.regione]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <button className="inline-flex items-center gap-2 bg-white/90 text-[#6B271A] px-3 py-2 rounded-xl border hover:bg-white">
                  <Share2 className="w-4 h-4" /> Condividi
                </button>
                <button className="inline-flex items-center gap-2 bg-white/90 text-[#6B271A] px-3 py-2 rounded-xl border hover:bg-white">
                  <Heart className="w-4 h-4" /> Salva
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PILLE SEZIONI (esattamente come richiesto) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Pill to="#cosa-fare" icon={ListIcon} label="Cosa fare" />
          <Pill to="#mangiare-bere" icon={Utensils} label="Mangiare e Bere" />
          <Pill to="#eventi" icon={CalendarDays} label="Eventi e Sagre" />
          <Pill to="#artigiani" icon={Hammer} label="Artigiani" />
          <Pill to="#trasporti" icon={Bus} label="Trasporti" />
          <Pill to="#itinerari" icon={Route} label="Esperienze e Itinerari" />
          <Pill to="#dormire" icon={BedDouble} label="Dormire" />
          <Pill to="#prodotti-tipici" icon={ShoppingBag} label="Prodotti tipici" />
        </div>
      </section>

      {/* INTRO + IN BREVE */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <p className="text-gray-800 leading-relaxed">{descr}</p>
          </div>
          <aside className="md:col-span-1">
            <div className="rounded-2xl border p-4 bg-[#FAF5E0]">
              <h3 className="text-sm font-bold text-[#6B271A]">In breve</h3>
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {borgo?.regione || meta?.regione ? (
                  <li>
                    <span className="font-semibold">Regione:</span>{" "}
                    {borgo?.regione || meta?.regione}
                  </li>
                ) : null}
                {borgo?.provincia ? (
                  <li>
                    <span className="font-semibold">Provincia:</span>{" "}
                    {borgo.provincia}
                  </li>
                ) : null}
                <li>
                  <span className="font-semibold">Hashtag:</span> #{slug}
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      {/* CREATOR DEL BORGO (in alto) */}
      <section id="creator" className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <h2 className="text-xl font-extrabold text-[#6B271A] flex items-center gap-2">
          <Film className="w-5 h-5" /> Creator del borgo
        </h2>

        {videos.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-8 mt-4">
            {videos.map((v) => (
              <article key={v.id} className="border rounded-2xl p-4 bg-white">
                <YouTubeEmbed url={v.youtubeUrl || v.url} />
                <h3 className="mt-3 font-semibold">{v.title}</h3>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl border p-4 bg-white">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#6B271A]/10">
                <Film className="w-5 h-5 text-[#6B271A]" />
              </span>
              <div>
                <div className="font-semibold text-[#6B271A]">
                  Nessun video pubblicato… ancora 😉
                </div>
                <div className="text-sm text-gray-600">
                  Sei un creator? Racconta {borgo?.name || meta?.name} con i tuoi video.
                </div>
              </div>
            </div>
            <Link
              to="/registrazione-creator"
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D54E30] text-white font-semibold"
            >
              Diventa Creator del Borgo
            </Link>
          </div>
        )}
      </section>

      {/* EVENTI & SAGRE (scende sotto i creator) */}
      <section id="eventi" className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#6B271A]">Eventi & Sagre</h2>
          <Link to="#" className="text-sm font-semibold underline">Vedi tutti</Link>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {eventi.map((ev, i) => (
            <article key={i} className="rounded-2xl overflow-hidden border bg-white hover:shadow-lg transition">
              <div className="relative">
                <img src={ev.img} alt={ev.title} className="h-36 w-full object-cover" />
                <span className="absolute top-2 left-2 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#6B271A] text-white border border-[#E1B671]">
                  {ev.when}
                </span>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-[#6B271A] line-clamp-2">{ev.title}</h3>
                <div className="mt-1 text-xs text-gray-600 flex items-center gap-1">
                  <Star className="w-3 h-3 text-[#D54E30]" />
                  Consigliato
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* COSA FARE */}
      <section id="cosa-fare" className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#6B271A]">Cosa fare</h2>
          {thingsToDo.length > 6 && (
            <Link to="#" className="text-sm font-semibold underline">Vedi tutte</Link>
          )}
        </div>
        {thingsToDo.length === 0 ? (
          <p className="text-gray-600 mt-2">Stiamo raccogliendo le migliori attività ed esperienze.</p>
        ) : (
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {thingsToDo.slice(0, 6).map((p) => (
              <CardPOI key={p.id} p={p} />
            ))}
          </ul>
        )}
      </section>

      {/* DOVE MANGIARE & BERE */}
      <section id="mangiare-bere" className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#6B271A]">Mangiare e Bere</h2>
          {eatDrink.length > 6 && (
            <Link to="#" className="text-sm font-semibold underline">Vedi tutti</Link>
          )}
        </div>
        {eatDrink.length === 0 ? (
          <p className="text-gray-600 mt-2">Aggiungeremo presto ristoranti, trattorie, bar e locali.</p>
        ) : (
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {eatDrink.slice(0, 6).map((p) => (
              <CardPOI key={p.id} p={p} />
            ))}
          </ul>
        )}
      </section>

      {/* ARTIGIANI */}
      <section id="artigiani" className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#6B271A]">Artigiani</h2>
          {artigiani.length > 6 && (
            <Link to="#" className="text-sm font-semibold underline">Vedi tutti</Link>
          )}
        </div>
        {artigiani.length === 0 ? (
          <p className="text-gray-600 mt-2">Stiamo selezionando le migliori botteghe e laboratori del borgo.</p>
        ) : (
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {artigiani.slice(0, 6).map((p) => (
              <CardPOI key={p.id} p={p} />
            ))}
          </ul>
        )}
      </section>

      {/* DORMIRE */}
      <section id="dormire" className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#6B271A]">Dormire</h2>
          {sleep.length > 6 && (
            <Link to="#" className="text-sm font-semibold underline">Vedi tutte</Link>
          )}
        </div>
        {sleep.length === 0 ? (
          <p className="text-gray-600 mt-2">Stiamo selezionando le migliori strutture dove soggiornare.</p>
        ) : (
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {sleep.slice(0, 6).map((p) => (
              <CardPOI key={p.id} p={p} />
            ))}
          </ul>
        )}
      </section>

      {/* ESPERIENZE E ITINERARI */}
      <section id="itinerari" className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#6B271A]">Esperienze e Itinerari</h2>
          <Link to="#" className="text-sm font-semibold underline">Vedi tutti</Link>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {itinerari.map((it, i) => (
            <article key={i} className="rounded-2xl overflow-hidden border bg-white hover:shadow-lg transition">
              <img src={it.img} alt={it.title} className="h-36 w-full object-cover" />
              <div className="p-3">
                <h3 className="font-semibold text-[#6B271A]">{it.title}</h3>
                <div className="text-xs text-gray-600 mt-1">{it.meta}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* PRODOTTI TIPICI */}
      <section id="prodotti-tipici" className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#6B271A]">Prodotti tipici</h2>
          <Link to="#" className="text-sm font-semibold underline">Vedi tutti</Link>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {prodottiTipici.map((p, i) => (
            <article key={i} className="rounded-2xl overflow-hidden border bg-white hover:shadow-lg transition">
              <img src={p.img} alt={p.title} className="h-36 w-full object-cover" />
              <div className="p-3">
                <h3 className="font-semibold text-[#6B271A]">{p.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* BORGHI VICINI */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <h2 className="text-xl font-extrabold text-[#6B271A]">Borghi vicini</h2>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {nearby.map((b) => (
            <Link
              key={b.slug}
              to={`/borghi/${b.slug}`}
              className="rounded-2xl overflow-hidden border bg-white hover:shadow-lg transition"
            >
              <div className="h-28 w-full">
                <img
                  src={b.hero}
                  alt={b.name}
                  className="h-28 w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop";
                  }}
                />
              </div>
              <div className="p-3">
                <div className="font-semibold text-[#6B271A]">{b.name}</div>
                <div className="text-xs text-gray-600">
                  {[b.provincia, b.regione].filter(Boolean).join(" · ")}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* TRASPORTI (ancora mock, ma sezione pronta) */}
      <section id="trasporti" className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div className="rounded-2xl border p-4 bg-[#FAF5E0]">
          <h3 className="text-sm font-bold text-[#6B271A] flex items-center gap-2">
            <Train className="w-4 h-4" /> Come arrivare
          </h3>
          <p className="text-sm text-gray-700 mt-2">
            Aggiorneremo presto con collegamenti e orari utili per raggiungere {borgo?.name || meta?.name}.
          </p>
        </div>
      </section>
    </main>
  );
}
