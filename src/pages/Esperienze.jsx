// src/pages/Esperienze.jsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BORGI_BY_SLUG } from "../data/borghi";
import { findBorgoBySlug, listPoiByBorgo, getVideosByPoi } from "../lib/store";
import {
  Search, Menu, X, CalendarDays, Route, ShoppingBag, Hammer, Utensils, BedDouble,
  List as ListIcon, Info, MapPin, Star, SlidersHorizontal, ChevronDown, Bus, Film
} from "lucide-react";

/* ---------- utils ---------- */
const isFoodDrink = (p) =>
  /(ristor|tratt|osteria|pizzer|bar|caff|café|enotec|pub|agritur)/i.test(p.type || p.name || "");
const isSleep = (p) =>
  /(hotel|b&b|b\s*&\s*b|bed|albergo|affittacamere|casa|agriturismo|residence)/i.test(p.type || p.name || "");
const isArtigiano = (p) =>
  /(artigian|laborator|bottega|ceramic|liutaio|tessil|falegn|orafo)/i.test(p.type || p.name || "");

// euristiche per "itinerario" (dati dei Comuni)
const isItinerary = (p) =>
  /(itinerar|percorso|cammino|trekking|passeggiat|sentier)/i.test(
    `${p.type || ""} ${p.category || ""} ${p.name || ""} ${Array.isArray(p.tags) ? p.tags.join(" ") : ""}`
  );

const isBookableExperience = (p) =>
  !!(p.affiliateUrl || p.url || p.partner || p.source || p.priceFrom); // esperienze acquistabili

const partnerLabel = (p) => (p.partner || p.source || "").toString().trim();
const priceFrom = (p) =>
  typeof p.priceFrom === "number"
    ? p.priceFrom
    : p.priceFrom
    ? Number(String(p.priceFrom).replace(/[^\d]/g, ""))
    : null;
const durLabel = (p) => p.duration || p.meta?.duration || p.durata || "";
const cityLabel = (p) => [p.comune || p.city, p.provincia || p.province || p.prov].filter(Boolean).join(" ");
const ratingVal = (p) => p.rating?.value ?? p.rating;
const ratingCnt = (p) => p.rating?.count ?? p.reviews ?? p.nReviews;

const fmtPrice = (n) => {
  if (n == null || Number.isNaN(n)) return null;
  try {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `€ ${Math.round(n)}`;
  }
};

function withUtm(url, partner) {
  if (!url) return null;
  const u = new URL(url, window.location.origin);
  u.searchParams.set("utm_source", "ilborghista");
  u.searchParams.set("utm_medium", "partner");
  u.searchParams.set("utm_campaign", (partner || "esperienze").toLowerCase());
  return u.toString();
}

/* ---------- TopBar: brand + search sempre visibile + hamburger ---------- */
function TopBar({ slug }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const to = q ? `/cerca?q=${encodeURIComponent(q)}&borgo=${encodeURIComponent(slug)}` : `/cerca`;
    navigate(to);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6">
          <Link to="/" aria-label="Vai alla home di Il Borghista" className="shrink-0">
            <span className="text-lg font-extrabold tracking-tight text-[#6B271A]">Il Borghista</span>
          </Link>

          {/* search sempre visibile (anche mobile) */}
          <form onSubmit={submit} className="relative mx-2 flex-1">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cerca esperienze…"
              className="w-full rounded-full border px-4 py-2 pl-9 text-sm outline-none focus:border-[#6B271A]"
            />
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          </form>

          <button
            aria-label="Apri il menu"
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Drawer menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <nav className="absolute right-0 top-0 h-full w-80 max-w-[85%] bg-white shadow-xl" aria-label="Menu principale">
            <div className="flex items-center justify-between border-b p-4">
              <span className="text-base font-bold text-[#6B271A]">Menu</span>
              <button
                aria-label="Chiudi menu"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="p-2">
              <li><Link to="/login" className="block rounded-lg px-3 py-3 hover:bg-neutral-50" onClick={() => setMenuOpen(false)}>Accedi</Link></li>
              <li><Link to="/registrazione" className="block rounded-lg px-3 py-3 hover:bg-neutral-50" onClick={() => setMenuOpen(false)}>Registrati</Link></li>
              <li><Link to="/creator" className="block rounded-lg px-3 py-3 hover:bg-neutral-50" onClick={() => setMenuOpen(false)}>I nostri creator</Link></li>
              <li><Link to={`/borghi/${slug}/info-utili`} className="block rounded-lg px-3 py-3 hover:bg-neutral-50" onClick={() => setMenuOpen(false)}>Info utili</Link></li>
              <li><Link to="/contatti" className="block rounded-lg px-3 py-3 hover:bg-neutral-50" onClick={() => setMenuOpen(false)}>Contattaci</Link></li>
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}

/* ---------- Pillola ---------- */
const Pill = ({ to, icon: Icon, label }) => (
  <Link
    to={to}
    className="snap-start inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-[#E1B671] bg-[#FAF5E0] px-3 text-sm font-semibold text-[#6B271A] hover:bg-white"
    aria-label={`Vai a ${label}`}
  >
    <Icon className="h-4 w-4" />
    {label}
  </Link>
);

/* ---------- Card esperienza ---------- */
function ExperienceCard({ slug, p }) {
  const partner = partnerLabel(p);
  const price = priceFrom(p);
  const href = withUtm(p.affiliateUrl || p.url, partner) || `/borghi/${slug}/poi/${p.id}`;
  const hasVideo = p.hasVideo || (typeof getVideosByPoi === "function" && p.id ? getVideosByPoi(p.id).length > 0 : false);

  return (
    <article className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow" role="listitem">
      <a href={href} target="_blank" rel="noreferrer" aria-label={`Controlla disponibilità: ${p.name}`} className="block">
        <div className="relative aspect-[16/9] w-full bg-neutral-100">
          <img
            src={
              p.cover ||
              "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1200&auto=format&fit=crop"
            }
            alt={p.alt || `Esperienza: ${p.name} ${partner ? `- partner ${partner}` : ""}`}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          {/* badge partner (sx) */}
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-[#6B271A] shadow ring-1 ring-black/5">
            {partner || "Partner"}
          </span>
          {/* badge prezzo (dx) */}
          {price != null && (
            <span className="absolute right-2 top-2 rounded-full border border-[#E1B671] bg-[#D54E30] px-2 py-0.5 text-[11px] font-bold text-white shadow">
              da {fmtPrice(price).replace(/\s?EUR?/, "").trim()}
            </span>
          )}
          {/* badge video */}
          {hasVideo && (
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
              <Film className="h-3.5 w-3.5" /> video
            </span>
          )}
        </div>

        <div className="p-3">
          <h3 className="line-clamp-2 h-[44px] font-semibold text-[#1A1818]">{p.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-600">
            <span className="font-semibold text-[#6B271A]">Esperienza</span>
            {durLabel(p) && <span>{durLabel(p)}</span>}
            {cityLabel(p) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-[#D54E30]" />
                {cityLabel(p)}
              </span>
            )}
            {price != null && <span>da {fmtPrice(price)}</span>}
            {ratingVal(p) && (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-[#E6B800]" />
                {Number(ratingVal(p)).toFixed(1)} {ratingCnt(p) ? `(${ratingCnt(p)})` : ""}
              </span>
            )}
          </div>

          <div className="mt-3">
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={`Apri i dettagli dell'esperienza: ${p.name}`}
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#6B271A] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
            >
              Controlla disponibilità
            </a>
          </div>
        </div>
      </a>
    </article>
  );
}

/* ---- 4 esperienze mock di fallback (solo se i dati reali sono pochi) ---- */
const MOCK_ITEMS = [
  {
    id: "mock-exp-1",
    name: "Aosta: volo in mongolfiera sulle Alpi con vista mozzafiato",
    cover: "https://images.unsplash.com/photo-1520974735194-6c1f1c1d0b35?q=80&w=1200&auto=format&fit=crop",
    partner: "Viator",
    priceFrom: 245,
    duration: "3 ore",
    comune: "Aosta",
    provincia: "AO",
    affiliateUrl: "https://example.com/viator?prod=balloon-alps",
    rating: { value: 4.8, count: 132 },
    hasVideo: true,
  },
  {
    id: "mock-exp-2",
    name: "Perugia: giro in mongolfiera tra Umbria e Assisi",
    cover: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
    partner: "Musement",
    priceFrom: 160,
    duration: "2 ore",
    comune: "Perugia",
    provincia: "PG",
    affiliateUrl: "https://example.com/musement?prod=balloon-perugia",
    rating: { value: 4.6, count: 89 },
  },
  {
    id: "mock-exp-3",
    name: "Etna: esclusivo tour in mongolfiera",
    cover: "https://images.unsplash.com/photo-1491555103944-7c647fd857e6?q=80&w=1200&auto=format&fit=crop",
    partner: "Freedome",
    priceFrom: 1600,
    duration: "1 giorno",
    comune: "Catania",
    provincia: "CT",
    affiliateUrl: "https://example.com/freedome?prod=etna-balloon",
    rating: { value: 4.9, count: 57 },
    hasVideo: true,
  },
  {
    id: "mock-exp-4",
    name: "Firenze: volo in mongolfiera sulla Toscana",
    cover: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1200&auto=format&fit=crop",
    partner: "GetYourGuide",
    priceFrom: 270,
    duration: "3 ore",
    comune: "Firenze",
    provincia: "FI",
    affiliateUrl: "https://example.com/gyg?prod=firenze-balloon",
    rating: { value: 4.7, count: 201 },
  },
];

/* ---------- Pagina ---------- */
export default function Esperienze() {
  const { slug } = useParams();

  const borgo = useMemo(() => findBorgoBySlug(slug), [slug]);
  const meta = BORGI_BY_SLUG?.[slug] || null;
  const title = meta?.displayName || borgo?.name || meta?.name || slug;

  // Tutti i POI del borgo e filtro base: no food/sleep/artigiani
  const allPoi = useMemo(() => listPoiByBorgo(slug), [slug]);
  const poiClean = useMemo(
    () => allPoi.filter((p) => !isFoodDrink(p) && !isSleep(p) && !isArtigiano(p)),
    [allPoi]
  );

  /* ===== Filtri ===== */
  const [contentType, setContentType] = useState("all");  // all | esperienze | itinerari
  const [priceBand, setPriceBand] = useState("all");      // all | lt50 | 50-100 | 100-250 | gt250
  const [partner, setPartner] = useState("all");          // all | getyourguide | viator | musement | freedome
  const [duration, setDuration] = useState("all");        // all | le2 | 2-4 | day
  const [order, setOrder] = useState("auto");             // auto | priceAsc | priceDesc | az | rating

  // Base array in funzione del tipo (esperienze vs itinerari)
  const base = useMemo(() => {
    let arr = poiClean;
    if (contentType === "esperienze") arr = arr.filter(isBookableExperience);
    if (contentType === "itinerari") arr = arr.filter(isItinerary);
    return arr;
  }, [poiClean, contentType]);

  // Aggiungo mock se mancano esperienze visibili (solo quando NON si filtrano gli itinerari)
  const baseWithSeeds = useMemo(() => {
    if (contentType === "itinerari") return base;
    const needSeeds = base.length < 4;
    return needSeeds ? [...base, ...MOCK_ITEMS.map((m) => ({ ...m, id: `${slug}-${m.id}` }))] : base;
  }, [base, contentType, slug]);

  const filtered = useMemo(() => {
    let arr = [...baseWithSeeds];

    // prezzo
    arr = arr.filter((p) => {
      const pr = priceFrom(p);
      if (priceBand === "all" || pr == null) return true;
      if (priceBand === "lt50") return pr < 50;
      if (priceBand === "50-100") return pr >= 50 && pr <= 100;
      if (priceBand === "100-250") return pr > 100 && pr <= 250;
      if (priceBand === "gt250") return pr > 250;
      return true;
    });

    // partner
    if (partner !== "all") {
      arr = arr.filter((p) => partnerLabel(p).toLowerCase().includes(partner));
    }

    // durata
    if (duration !== "all") {
      const dTest = (lab) => {
        const l = (lab || "").toLowerCase();
        if (!l) return false;
        if (duration === "le2") return /(\b1\b|\b2\b|\b1 ?ora|\b2 ?ore)/.test(l) || /min/.test(l);
        if (duration === "2-4") return /(2|3|4) ?ore/.test(l);
        if (duration === "day") return /(giorn)/.test(l) || /(6|7|8|9|10|11|12) ?ore/.test(l);
        return false;
      };
      arr = arr.filter((p) => dTest(durLabel(p)));
    }

    // ordinamento
    if (order === "priceAsc") {
      arr.sort((a, b) => (priceFrom(a) || Infinity) - (priceFrom(b) || Infinity));
    } else if (order === "priceDesc") {
      arr.sort((a, b) => (priceFrom(b) || -1) - (priceFrom(a) || -1));
    } else if (order === "az") {
      arr.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (order === "rating") {
      arr.sort((a, b) => (ratingVal(b) || 0) - (ratingVal(a) || 0));
    }

    return arr;
  }, [baseWithSeeds, priceBand, partner, duration, order]);

  const resultsCount = filtered.length;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    (meta?.name || borgo?.name || slug) +
      " " +
      ((borgo?.provincia || meta?.provincia || "") + " " + (borgo?.regione || meta?.regione || "")).trim()
  )}`;

  return (
    <>
      <TopBar slug={slug} />
      <main className="min-h-screen bg-white pt-14">
        {/* Pillole: orizzontali su mobile, griglia su desktop */}
        <section className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          {/* mobile scroll */}
          <div className="flex gap-2 overflow-x-auto pb-2 sm:hidden" style={{ WebkitOverflowScrolling: "touch" }}>
            <Pill to={`/borghi/${slug}/eventi`}          icon={CalendarDays} label="Eventi e Sagre" />
            <Pill to={`/borghi/${slug}/esperienze-itinerari`} icon={Route}      label="Esperienze e Itinerari" />
            <Pill to={`/borghi/${slug}/prodotti-tipici`} icon={ShoppingBag}    label="Prodotti Tipici" />
            <Pill to={`/borghi/${slug}/artigiani`}       icon={Hammer}         label="Artigiani" />
            <Pill to={`/borghi/${slug}/mangiare-bere`}   icon={Utensils}       label="Dove Mangiare" />
            <Pill to={`/borghi/${slug}/dormire`}         icon={BedDouble}      label="Dove Dormire" />
            <Pill to={`/borghi/${slug}/cosa-fare`}       icon={ListIcon}       label="Cosa Fare" />
            <Pill to={`/borghi/${slug}/trasporti`}       icon={Bus}            label="Trasporti" />
          </div>
          {/* desktop grid */}
          <div className="hidden grid-cols-4 gap-2 sm:grid">
            <Pill to={`/borghi/${slug}/eventi`}          icon={CalendarDays} label="Eventi e Sagre" />
            <Pill to={`/borghi/${slug}/esperienze-itinerari`} icon={Route}   label="Esperienze e Itinerari" />
            <Pill to={`/borghi/${slug}/prodotti-tipici`} icon={ShoppingBag}  label="Prodotti Tipici" />
            <Pill to={`/borghi/${slug}/artigiani`}       icon={Hammer}       label="Artigiani" />
            <Pill to={`/borghi/${slug}/mangiare-bere`}   icon={Utensils}     label="Dove Mangiare" />
            <Pill to={`/borghi/${slug}/dormire`}         icon={BedDouble}    label="Dove Dormire" />
            <Pill to={`/borghi/${slug}/cosa-fare`}       icon={ListIcon}     label="Cosa Fare" />
            <Pill to={`/borghi/${slug}/trasporti`}       icon={Bus}          label="Trasporti" />
          </div>
        </section>

        {/* Header + filtri sticky */}
        <section className="border-t bg-[#FAF5E0]">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div>
              <h1 className="text-xl font-extrabold text-[#6B271A]">
                {contentType === "itinerari" ? "Itinerari" : "Esperienze"} a {title}
              </h1>
              <p className="text-sm text-neutral-700">Passeggiate, musei, natura, itinerari e altro ancora.</p>
            </div>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-full border bg-white px-3 py-2 text-sm font-semibold text-[#6B271A] shadow-sm hover:bg-neutral-50 md:inline-flex"
            >
              Apri mappa
            </a>
          </div>

          <div className="sticky top-14 z-40 border-t border-[#E9DEC7] bg-[#FAF5E0]">
            <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2 px-4 py-2 sm:grid-cols-6 sm:px-6">
              {/* Tipo (nuovo filtro) */}
              <div className="relative">
                <label className="mb-1 block text-xs font-semibold text-[#6B271A]">Tipo</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full appearance-none rounded-full border bg-white px-3 py-1.5 pr-8 text-sm text-[#6B271A] focus:border-[#6B271A]"
                >
                  <option value="all">Tutti</option>
                  <option value="esperienze">Esperienze (acquistabili)</option>
                  <option value="itinerari">Itinerari (Comune)</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-[30px] h-4 w-4 text-neutral-500" />
              </div>

              {/* Conteggio risultati */}
              <div className="col-span-1 flex items-end">
                <div className="rounded-full border bg-white px-3 py-1.5 text-sm font-semibold text-[#6B271A]">
                  {resultsCount} {resultsCount === 1 ? "risultato" : "risultati"}
                </div>
              </div>

              {/* Prezzo */}
              <div className="relative">
                <label className="mb-1 block text-xs font-semibold text-[#6B271A]">Prezzo</label>
                <select
                  value={priceBand}
                  onChange={(e) => setPriceBand(e.target.value)}
                  className="w-full appearance-none rounded-full border bg-white px-8 py-1.5 pr-8 text-sm text-[#6B271A] focus:border-[#6B271A]"
                >
                  <option value="all">Tutti</option>
                  <option value="lt50">&lt; 50 €</option>
                  <option value="50-100">50–100 €</option>
                  <option value="100-250">100–250 €</option>
                  <option value="gt250">&gt; 250 €</option>
                </select>
                <SlidersHorizontal className="pointer-events-none absolute left-2 top-[30px] h-4 w-4 text-neutral-500" />
                <ChevronDown className="pointer-events-none absolute right-2 top-[30px] h-4 w-4 text-neutral-500" />
              </div>

              {/* Partner */}
              <div className="relative">
                <label className="mb-1 block text-xs font-semibold text-[#6B271A]">Partner</label>
                <select
                  value={partner}
                  onChange={(e) => setPartner(e.target.value)}
                  className="w-full appearance-none rounded-full border bg-white px-3 py-1.5 pr-8 text-sm text-[#6B271A] focus:border-[#6B271A]"
                >
                  <option value="all">Tutti</option>
                  <option value="getyourguide">GetYourGuide</option>
                  <option value="viator">Viator</option>
                  <option value="musement">Musement</option>
                  <option value="freedome">Freedome</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-[30px] h-4 w-4 text-neutral-500" />
              </div>

              {/* Durata */}
              <div className="relative">
                <label className="mb-1 block text-xs font-semibold text-[#6B271A]">Durata</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full appearance-none rounded-full border bg-white px-3 py-1.5 pr-8 text-sm text-[#6B271A] focus:border-[#6B271A]"
                >
                  <option value="all">Tutte</option>
                  <option value="le2">fino a 2 ore</option>
                  <option value="2-4">2–4 ore</option>
                  <option value="day">mezza/1 giornata</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-[30px] h-4 w-4 text-neutral-500" />
              </div>

              {/* Ordina */}
              <div className="relative">
                <label className="mb-1 block text-xs font-semibold text-[#6B271A]">Ordina per</label>
                <select
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  className="w-full appearance-none rounded-full border bg-white px-3 py-1.5 pr-8 text-sm text-[#6B271A] focus:border-[#6B271A]"
                >
                  <option value="auto">Automatico</option>
                  <option value="priceAsc">Prezzo crescente</option>
                  <option value="priceDesc">Prezzo decrescente</option>
                  <option value="az">A → Z</option>
                  <option value="rating">Valutazione</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-[30px] h-4 w-4 text-neutral-500" />
              </div>
            </div>
          </div>
        </section>

        {/* Risultati */}
        <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border bg-white p-6 text-center text-neutral-700">
              Nessun risultato con i filtri selezionati.
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {filtered.map((p) => (
                <ExperienceCard key={p.id} slug={slug} p={p} />
              ))}
            </ul>
          )}
        </section>

        {/* Link rapidi */}
        <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/borghi/${slug}`}
              className="rounded-full border px-3 py-2 text-sm font-semibold text-[#6B271A] hover:bg-neutral-50"
            >
              ← Torna alla pagina del borgo
            </Link>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border px-3 py-2 text-sm font-semibold text-[#6B271A] hover:bg-neutral-50"
            >
              Apri su Google Maps
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
