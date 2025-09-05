// src/pages/HomeBorgo.jsx
import React, { useMemo, useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  findBorgoBySlug,
  listPoiByBorgo,
  getVideosByBorgo,
  getVideosByPoi,
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
  Share2,
  Heart,
  Star,
  Bus,
  Hammer,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  List as ListIcon,
  PlayCircle,
} from "lucide-react";

/* =========================
   Helpers
   ========================= */
const isFoodDrink = (p) =>
  /(ristor|tratt|osteria|pizzer|bar|caff|café|enotec|pub|agritur)/i.test(p.type || p.name || "");
const isSleep = (p) =>
  /(hotel|b&b|b\s*&\s*b|bed|albergo|affittacamere|casa|agriturismo|residence)/i.test(p.type || p.name || "");
const isArtigiano = (p) =>
  /(artigian|laborator|bottega|ceramic|liutaio|tessil|falegn|orafo)/i.test(p.type || p.name || "");

function getYouTubeId(url = "") {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v") || "";
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
  } catch {}
  return "";
}
function getYouTubeThumb(url = "") {
  const id = getYouTubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
}

/* =========================
   UI Primitives
   ========================= */
function HScroll({ children, className = "" }) {
  // contenitore scrollabile con snap (mobile) + padding guard
  return (
    <div className={`relative ${className}`}>
      <div
        className="scrollbar-none flex gap-3 overflow-x-auto snap-x snap-mandatory px-1 -mx-1 md:snap-none md:overflow-x-hidden"
        role="list"
      >
        {children}
      </div>
    </div>
  );
}

function HScrollWithArrows({ children, className = "" }) {
  const ref = useRef(null);
  const scrollBy = (dx) => ref.current && ref.current.scrollBy({ left: dx, behavior: "smooth" });

  return (
    <div className={`relative ${className}`}>
      {/* frecce visibili da md in su */}
      <button
        aria-label="precedente"
        onClick={() => scrollBy(-Math.min(900, window.innerWidth * 0.9))}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5 hover:bg-neutral-50"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        aria-label="successivo"
        onClick={() => scrollBy(Math.min(900, window.innerWidth * 0.9))}
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5 hover:bg-neutral-50"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div
        ref={ref}
        className="scrollbar-none flex gap-3 overflow-x-auto snap-x snap-mandatory px-1 -mx-1 md:snap-none"
        role="list"
      >
        {children}
      </div>
    </div>
  );
}

/* =========================
   Hero Gallery con swipe
   ========================= */
function HeroGallery({ title, gallery = [], fallback }) {
  const [i, setI] = useState(0);
  const n = gallery.length;
  const hasMany = n > 0;
  const current = hasMany ? gallery[i] : null;
  const src = current?.src || fallback;

  // Swipe
  const touch = useRef({ x: 0, y: 0, t: 0 });
  const onTouchStart = (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    touch.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };
  const onTouchEnd = (e) => {
    const dx = (e.changedTouches?.[0]?.clientX || 0) - touch.current.x;
    const dt = Date.now() - touch.current.t;
    if (Math.abs(dx) > 40 && dt < 500) {
      if (dx < 0) setI((v) => (n ? (v + 1) % n : v));
      else setI((v) => (n ? (v - 1 + n) % n : v));
    }
  };

  return (
    <section className="relative">
      <div className="relative h-72 md:h-[380px] w-full overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <img
          key={src}
          src={src}
          alt={title}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

        {/* Didascalia/nome foto */}
        {current?.name && (
          <div className="absolute left-3 bottom-3 z-10 rounded-md bg-black/50 px-2 py-1 text-xs text-white">
            {current.name}
          </div>
        )}

        {/* Contatore */}
        <div className="absolute right-3 bottom-3 z-10 rounded-md bg-black/50 px-2 py-1 text-xs text-white">
          {hasMany ? `${i + 1} / ${n}` : "1 / 1"}
        </div>

        {/* Frecce */}
        {hasMany && (
          <>
            <button
              aria-label="Foto precedente"
              onClick={() => setI((v) => (v - 1 + n) % n)}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#6B271A] shadow hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              aria-label="Foto successiva"
              onClick={() => setI((v) => (v + 1) % n)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#6B271A] shadow hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Titolo e meta */}
      <div className="absolute inset-x-0 bottom-4">
        <div className="mx-auto flex max-w-6xl items-end justify-between gap-3 px-4 sm:px-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow">{title}</h1>
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
    </section>
  );
}

/* =========================
   Card POI
   ========================= */
function CardPOI({ slug, p }) {
  const hasVideo = getVideosByPoi(p.id).length > 0;
  const img =
    p.cover ||
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop";
  return (
    <li className="snap-center shrink-0 w-[80%] xs:w-[75%] sm:w-[55%] md:w-[40%] lg:w-[30%] 2xl:w-[22%] border rounded-2xl overflow-hidden bg-white hover:shadow-lg transition" role="listitem">
      <Link to={`/borghi/${slug}/poi/${p.id}`} className="block">
        <div className="h-40 w-full bg-gray-100">
          <img src={img} alt={p.name} className="h-40 w-full object-cover" />
        </div>
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-[#6B271A] line-clamp-2">{p.name}</h3>
            <span className="shrink-0 p-1 rounded-lg border text-[#6B271A]" aria-hidden>
              <Heart className="w-4 h-4" />
            </span>
          </div>
          <div className="text-sm text-gray-600">{p.type}</div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
            {hasVideo ? (
              <span className="inline-flex items-center gap-1 text-[#6B271A]">
                <Film className="w-3.5 h-3.5" /> video
              </span>
            ) : <span />}
          </div>
        </div>
      </Link>
    </li>
  );
}

/* =========================
   Componenti semplici
   ========================= */
const Pill = ({ to, icon: Icon, label, bg = "bg-[#FAF5E0]" }) => (
  <a
    href={to}
    className={`inline-flex items-center gap-2 px-3 py-2 rounded-full ${bg} border border-[#E1B671] text-[#6B271A] text-sm font-semibold hover:bg-white`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </a>
);

/* =========================
   Pagina
   ========================= */
export default function HomeBorgo() {
  const { slug } = useParams();

  // Meta + dizionario statico
  const borgo = useMemo(() => findBorgoBySlug(slug), [slug]);
  const meta = BORGI_BY_SLUG?.[slug] || null;

  // POI
  const allPoi = useMemo(() => listPoiByBorgo(slug), [slug]);
  const eatDrink = useMemo(() => allPoi.filter(isFoodDrink), [allPoi]);
  const sleep = useMemo(() => allPoi.filter(isSleep), [allPoi]);
  const artigiani = useMemo(() => allPoi.filter(isArtigiano), [allPoi]);
  const thingsToDo = useMemo(() => allPoi.filter((p) => !isFoodDrink(p) && !isSleep(p) && !isArtigiano(p)), [allPoi]);

  // Video
  const videos = useMemo(() => getVideosByBorgo(slug), [slug]);

  if (!borgo && !meta) {
    return (
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
        <p className="text-gray-700">Borgo non trovato.</p>
        <Link to="/" className="text-[#6B271A] underline">Torna alla Home</Link>
      </main>
    );
  }

  const title = `${borgo?.name || meta?.name || slug} ${borgo?.provincia ? `(${borgo.provincia})` : ""}`;
  const descr =
    meta?.description ||
    "Scopri il borgo: cosa fare, dove mangiare e bere, dormire, eventi, itinerari, artigiani e prodotti tipici.";

  // HERO gallery (dal backend: meta.gallery = [{src, name}, ...])
  const heroGallery = Array.isArray(meta?.gallery) && meta.gallery.length
    ? meta.gallery
    : [{ src: meta?.hero ||
        "https://images.unsplash.com/photo-1543340713-8f6b9f4507f8?q=80&w=1600&auto=format&fit=crop",
        name: meta?.name || borgo?.name || "Borgo" }];

  const nearby = BORGI_INDEX.filter((b) => b.slug !== slug).slice(0, 4);

  /* ---- MOCK per sezioni editoriali ----- */
  const eventi = [
    { title: "Festa delle tradizioni", img: "https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=1200&auto=format&fit=crop", when: "6–8 SET" },
    { title: "Concerti in piazza", img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop", when: "12–13 SET" },
    { title: "Sagra del gusto locale", img: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop", when: "20 SET" },
  ];
  const itinerari = [
    { title: "Passeggiata panoramica", img: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop", meta: "3 km • 1h30" },
    { title: "Percorso dei musei", img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop", meta: "2 km • 1h" },
    { title: "Tra chiese e arte", img: "https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?q=80&w=1200&auto=format&fit=crop", meta: "4 km • 2h" },
  ];
  const prodottiTipici = [
    { title: "Formaggio di malga", img: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=1200&auto=format&fit=crop" },
    { title: "Salumi tipici", img: "https://images.unsplash.com/photo-1505575972945-280b8f1e5d16?q=80&w=1200&auto=format&fit=crop" },
    { title: "Olio EVO locale", img: "https://images.unsplash.com/photo-1514515411904-65fa19574d07?q=80&w=1200&auto=format&fit=crop" },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* HERO GALLERY */}
      <HeroGallery title={title} gallery={heroGallery} fallback={heroGallery?.[0]?.src} />

      {/* PILLS */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-4">
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

      {/* INTRO + IN BREVE (con descrizione collassabile + mini gallery) */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Descrizione con fade + mostra tutto */}
          <DescriptionBlock text={descr} />

          {/* In breve dinamico */}
          <aside className="md:col-span-1">
            <div className="rounded-2xl border p-4 bg-[#FAF5E0]">
              <h3 className="text-sm font-bold text-[#6B271A]">In breve</h3>
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {meta?.shortInfo?.text ? (
                  <li className="leading-relaxed">{meta.shortInfo.text}</li>
                ) : null}
                {borgo?.regione || meta?.regione ? (
                  <li><span className="font-semibold">Regione:</span> {borgo?.regione || meta?.regione}</li>
                ) : null}
                {borgo?.provincia ? (
                  <li><span className="font-semibold">Provincia:</span> {borgo.provincia}</li>
                ) : null}
                <li><span className="font-semibold">Hashtag:</span> #{slug}</li>
              </ul>

              {/* Mini-slideshow backend: meta.shortInfo.gallery = [{src, name}] */}
              {Array.isArray(meta?.shortInfo?.gallery) && meta.shortInfo.gallery.length ? (
                <div className="mt-3">
                  <SmallGallery items={meta.shortInfo.gallery} />
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </section>

      {/* CREATOR DEL BORGO → carosello orizzontale */}
      <section id="creator" className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#6B271A] flex items-center gap-2">
            <Film className="w-5 h-5" /> Creator del borgo
          </h2>
          {videos?.length > 0 && (
            <Link to={`/borghi/${slug}/video`} className="text-sm font-semibold underline">
              Vedi tutti
            </Link>
          )}
        </div>

        {videos?.length ? (
          <HScrollWithArrows className="mt-3">
            {videos.map((v) => {
              const thumb = v.thumbnail || getYouTubeThumb(v.youtubeUrl || v.url);
              return (
                <article
                  key={v.id}
                  className="snap-center shrink-0 w-[78%] xs:w-[70%] sm:w-[55%] md:w-[40%] lg:w-[30%] 2xl:w-[22%] rounded-2xl overflow-hidden border bg-white"
                  role="listitem"
                >
                  <a href={v.youtubeUrl || v.url} target="_blank" rel="noreferrer" className="block">
                    <div className="relative h-44 w-full bg-neutral-100">
                      {thumb ? (
                        <img src={thumb} alt={v.title} className="h-44 w-full object-cover" />
                      ) : (
                        <div className="flex h-44 items-center justify-center text-neutral-400">
                          <PlayCircle className="h-10 w-10" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-[#1A1818] line-clamp-2">{v.title || "Video"}</h3>
                    </div>
                  </a>
                </article>
              );
            })}
          </HScrollWithArrows>
        ) : (
          <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl border p-4 bg-white">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#6B271A]/10">
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
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#D54E30] px-4 py-2 font-semibold text-white"
            >
              Diventa Creator del Borgo
            </Link>
          </div>
        )}
      </section>

      {/* EVENTI & SAGRE → carosello */}
      <SectionCarousel
        id="eventi"
        title="Eventi & Sagre"
        items={eventi}
        render={(ev, i) => (
          <article key={i} className="snap-center shrink-0 w-[78%] xs:w-[70%] sm:w-[55%] md:w-[40%] lg:w-[30%] 2xl:w-[22%] rounded-2xl overflow-hidden border bg-white" role="listitem">
            <div className="relative">
              <img src={ev.img} alt={ev.title} className="h-40 w-full object-cover" />
              <span className="absolute top-2 left-2 rounded-full border px-2 py-0.5 text-[11px] font-bold bg-[#6B271A] text-white border-[#E1B671]">
                {ev.when}
              </span>
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-[#6B271A] line-clamp-2">{ev.title}</h3>
              <div className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                <Star className="h-3 w-3 text-[#D54E30]" />
                Consigliato
              </div>
            </div>
          </article>
        )}
      />

      {/* COSA FARE → carosello */}
      <SectionCarousel
        id="cosa-fare"
        title="Cosa fare"
        extraLink={thingsToDo.length > 6 ? "#" : null}
        items={thingsToDo}
        render={(p) => <CardPOI key={p.id} slug={slug} p={p} />}
      />

      {/* MANGIARE & BERE → carosello */}
      <SectionCarousel
        id="mangiare-bere"
        title="Mangiare e Bere"
        extraLink={eatDrink.length > 6 ? "#" : null}
        items={eatDrink}
        render={(p) => <CardPOI key={p.id} slug={slug} p={p} />}
      />

      {/* ARTIGIANI → carosello */}
      <SectionCarousel
        id="artigiani"
        title="Artigiani"
        extraLink={artigiani.length > 6 ? "#" : null}
        items={artigiani}
        render={(p) => <CardPOI key={p.id} slug={slug} p={p} />}
      />

      {/* DORMIRE → carosello */}
      <SectionCarousel
        id="dormire"
        title="Dormire"
        extraLink={sleep.length > 6 ? "#" : null}
        items={sleep}
        render={(p) => <CardPOI key={p.id} slug={slug} p={p} />}
      />

      {/* ESPERIENZE / ITINERARI → carosello */}
      <SectionCarousel
        id="itinerari"
        title="Esperienze e Itinerari"
        items={itinerari}
        extraLink="#"
        render={(it, i) => (
          <article key={i} className="snap-center shrink-0 w-[78%] xs:w-[70%] sm:w-[55%] md:w-[40%] lg:w-[30%] 2xl:w-[22%] rounded-2xl overflow-hidden border bg-white" role="listitem">
            <img src={it.img} alt={it.title} className="h-40 w-full object-cover" />
            <div className="p-3">
              <h3 className="font-semibold text-[#6B271A]">{it.title}</h3>
              <div className="mt-1 text-xs text-gray-600">{it.meta}</div>
            </div>
          </article>
        )}
      />

      {/* PRODOTTI TIPICI → carosello */}
      <SectionCarousel
        id="prodotti-tipici"
        title="Prodotti tipici"
        items={prodottiTipici}
        extraLink="#"
        render={(p, i) => (
          <article key={i} className="snap-center shrink-0 w-[78%] xs:w-[70%] sm:w-[55%] md:w-[40%] lg:w-[30%] 2xl:w-[22%] rounded-2xl overflow-hidden border bg-white" role="listitem">
            <img src={p.img} alt={p.title} className="h-40 w-full object-cover" />
            <div className="p-3">
              <h3 className="font-semibold text-[#6B271A]">{p.title}</h3>
            </div>
          </article>
        )}
      />

      {/* BORGHI VICINI (griglia desktop, ma orizzontale su mobile) */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <h2 className="text-xl font-extrabold text-[#6B271A]">Borghi vicini</h2>
        <HScrollWithArrows className="mt-3">
          {nearby.map((b) => (
            <Link
              key={b.slug}
              to={`/borghi/${b.slug}`}
              className="snap-center shrink-0 w-[70%] xs:w-[60%] sm:w-[45%] md:w-[32%] lg:w-[23%] rounded-2xl overflow-hidden border bg-white hover:shadow-lg transition"
              role="listitem"
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
        </HScrollWithArrows>
      </section>

      {/* TRASPORTI */}
      <section id="trasporti" className="mx-auto max-w-6xl px-4 sm:px-6 pb-12">
        <div className="rounded-2xl border p-4 bg-[#FAF5E0]">
          <h3 className="text-sm font-bold text-[#6B271A] flex items-center gap-2">
            <Train className="w-4 h-4" /> Come arrivare
          </h3>
          <p className="mt-2 text-sm text-gray-700">
            Aggiorneremo presto con collegamenti e orari utili per raggiungere {borgo?.name || meta?.name}.
          </p>
        </div>
      </section>
    </main>
  );
}

/* =========================
   Blocchi riutilizzabili
   ========================= */
function DescriptionBlock({ text }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="md:col-span-2">
      <div className={`relative text-gray-800 leading-relaxed ${expanded ? "" : "max-h-28 overflow-hidden"}`}>
        <p>{text}</p>
        {!expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/90 to-transparent" />
        )}
      </div>
      <button
        className="mt-2 text-sm font-semibold text-[#6B271A] underline"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? "Mostra meno" : "Mostra tutto"}
      </button>
    </div>
  );
}

function SmallGallery({ items }) {
  const ref = useRef(null);
  const scrollBy = (dx) => ref.current && ref.current.scrollBy({ left: dx, behavior: "smooth" });
  return (
    <div className="relative">
      <div ref={ref} className="scrollbar-none mt-2 flex gap-2 overflow-x-auto snap-x snap-mandatory">
        {items.map((it, idx) => (
          <figure key={idx} className="snap-start shrink-0 w-40">
            <img
              src={it.src}
              alt={it.name || `Foto ${idx + 1}`}
              className="h-24 w-40 rounded-xl object-cover ring-1 ring-black/5"
            />
            {it.name ? <figcaption className="mt-1 truncate text-xs text-neutral-600">{it.name}</figcaption> : null}
          </figure>
        ))}
      </div>
      <div className="mt-2 hidden justify-end gap-2 md:flex">
        <button
          onClick={() => scrollBy(-300)}
          className="inline-flex items-center justify-center rounded-full bg-white h-8 w-8 shadow ring-1 ring-black/5"
          aria-label="precedente"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => scrollBy(300)}
          className="inline-flex items-center justify-center rounded-full bg-white h-8 w-8 shadow ring-1 ring-black/5"
          aria-label="successivo"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SectionCarousel({ id, title, items = [], render, extraLink = null }) {
  return (
    <section id={id} className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-[#6B271A]">{title}</h2>
        {extraLink ? (
          <Link to={extraLink} className="text-sm font-semibold underline">
            Vedi tutti
          </Link>
        ) : null}
      </div>
      {items?.length ? (
        <HScrollWithArrows className="mt-3">
          {items.map((it, idx) => render(it, idx))}
        </HScrollWithArrows>
      ) : (
        <p className="mt-2 text-gray-600">Contenuti in arrivo.</p>
      )}
    </section>
  );
}
