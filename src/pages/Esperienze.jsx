// src/pages/Esperienze.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BORGI_BY_SLUG } from "../data/borghi";
import { findBorgoBySlug, listPoiByBorgo, getVideosByPoi } from "../lib/store";
import {
  Search, Menu, X, CalendarDays, Route, ShoppingBag, Hammer, Utensils, BedDouble,
  List as ListIcon, MapPin, Star, ChevronDown, Bus, Film, Home
} from "lucide-react";

/* ---------- helpers ---------- */
const isFoodDrink = (p) =>
  /(ristor|tratt|osteria|pizzer|bar|caff|café|enotec|pub|agritur)/i.test(p.type || p.name || "");
const isSleep = (p) =>
  /(hotel|b&b|b\s*&\s*b|bed|albergo|affittacamere|casa|agriturismo|residence)/i.test(p.type || p.name || "");
const isArtigiano = (p) =>
  /(artigian|laborator|bottega|ceramic|liutaio|tessil|falegn|orafo)/i.test(p.type || p.name || "");
const isItinerary = (p) =>
  /(itinerar|percorso|cammino|trekking|passeggiat|sentier)/i.test(
    `${p.type || ""} ${p.category || ""} ${p.name || ""} ${Array.isArray(p.tags) ? p.tags.join(" ") : ""}`
  );
const isBookableExperience = (p) =>
  !!(p.affiliateUrl || p.url || p.partner || p.source || p.priceFrom);

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

/* ---------- TopBar ---------- */
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
          <button aria-label="Apri il menu" onClick={() => setMenuOpen(true)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>
      {menuOpen && (
        <div className="fixed inset-0 z-[90]">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <nav className="absolute right-0 top-0 h-full w-80 max-w-[85%] bg-white shadow-xl" aria-label="Menu principale">
            <div className="flex items-center justify-between border-b p-4">
              <span className="text-base font-bold text-[#6B271A]">Menu</span>
              <button aria-label="Chiudi menu" onClick={() => setMenuOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border">
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

/* ---------- Nav “palline” ---------- */
function NavItem({ to, label, icon: Icon, bg, color }) {
  return (
    <Link to={to} aria-label={label} title={label} className="flex items-center gap-2 shrink-0">
      <span
        className="inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full shadow ring-1 ring-black/5"
        style={{ backgroundColor: bg, color }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="hidden sm:inline text-sm text-[#1A1818]">{label}</span>
    </Link>
  );
}
const Divider = () => <span className="mx-2 hidden h-6 w-px bg-neutral-200 sm:inline-block" />;

/* ---------- Chip helpers ---------- */
function SelectChip({ label, value, onChange, options }) {
  return (
    <label className="relative inline-flex shrink-0 items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-full border bg-white pl-3 pr-8 text-sm font-medium text-[#6B271A] shadow-sm focus:border-[#6B271A]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none -ml-6 h-4 w-4 text-neutral-500" />
    </label>
  );
}

/* ---------- Dropdown partner con Portal ---------- */
function PartnerDropdownChip({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 200 });

  const items = [
    { value: "all", label: "Tutti i partner" },
    { value: "getyourguide", label: "GetYourGuide" },
    { value: "viator", label: "Viator" },
    { value: "musement", label: "Musement" },
    { value: "freedome", label: "Freedome" },
  ];

  const current = items.find((i) => i.value === value)?.label || "Partner";

  const update = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 8, left: r.left, width: Math.max(180, r.width) });
  };

  useEffect(() => {
    if (!open) return;
    update();
    const onScroll = () => update();
    const onResize = () => update();
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="inline-flex h-9 items-center rounded-full border bg-white px-3 text-sm font-semibold text-[#6B271A] shadow-sm"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {current}
        <ChevronDown className="ml-1 h-4 w-4 text-neutral-500" />
      </button>

      {open &&
        createPortal(
          <>
            {/* backdrop per click-outside */}
            <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
            <ul
              role="listbox"
              className="fixed z-[9999] overflow-hidden rounded-xl border bg-white p-1 shadow-lg"
              style={{ top: pos.top, left: pos.left, width: pos.width }}
            >
              {items.map((i) => (
                <li key={i.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i.value === value}
                    onClick={() => {
                      onChange(i.value);
                      setOpen(false);
                    }}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                      i.value === value ? "bg-[#FAF5E0] text-[#6B271A]" : "hover:bg-neutral-50"
                    }`}
                  >
                    {i.label}
                  </button>
                </li>
              ))}
            </ul>
          </>,
          document.body
        )}
    </>
  );
}

/* ---------- Toggle Esperienze ⇄ Itinerari (segmented) ---------- */
function EToggle({ value, onChange }) {
  return (
    <div className="inline-flex h-9 items-center rounded-full border bg-white p-0.5 shadow-sm" role="tablist" aria-label="Tipo contenuto">
      {[
        { v: "esperienze", l: "Esperienze" },
        { v: "itinerari", l: "Itinerari" },
      ].map(({ v, l }) => (
        <button
          key={v}
          role="tab"
          aria-selected={value === v}
          onClick={() => onChange(v)}
          className={`px-3 text-sm font-semibold rounded-full ${
            value === v ? "bg-[#FAF5E0] text-[#6B271A]" : "text-[#6B271A]/70 hover:bg-neutral-50"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

/* ---------- Card ---------- */
function ExperienceCard({ slug, p }) {
  const partner = partnerLabel(p);
  const price = priceFrom(p);
  const href = withUtm(p.affiliateUrl || p.url, partner) || `/borghi/${slug}/poi/${p.id}`;
  const hasVideo =
    p.hasVideo || (typeof getVideosByPoi === "function" && p.id ? getVideosByPoi(p.id).length > 0 : false);

  return (
    <article className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow" role="listitem">
      <a href={href} target="_blank" rel="noreferrer" aria-label={`Apri dettagli: ${p.name}`} className="block">
        <div className="relative aspect-[16/9] w-full bg-neutral-100">
          <img
            src={p.cover || "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1200&auto=format&fit=crop"}
            alt={p.alt || `Esperienza: ${p.name} ${partner ? `- partner ${partner}` : ""}`}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-[#6B271A] shadow ring-1 ring-black/5">
            {partner || "Partner"}
          </span>
          {price != null && (
            <span className="absolute right-2 top-2 rounded-full border border-[#E1B671] bg-[#D54E30] px-2 py-0.5 text-[11px] font-bold text-white shadow">
              da {fmtPrice(price).replace(/\s?EUR?/, "").trim()}
            </span>
          )}
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
            {ratingVal(p) && (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-[#E6B800]" />
                {Number(ratingVal(p)).toFixed(1)} {ratingCnt(p) ? `(${ratingCnt(p)})` : ""}
              </span>
            )}
          </div>
        </div>
      </a>
    </article>
  );
}

/* ---- Seeds fallback ---- */
const MOCK_ITEMS = [
  { id: "mock-exp-1", name: "Aosta: volo in mongolfiera sulle Alpi con vista mozzafiato",
    cover: "https://images.unsplash.com/photo-1725744837149-0e6985bbf8a5?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    partner: "Viator", priceFrom: 245, duration: "3 ore", comune: "Aosta", provincia: "AO",
    affiliateUrl: "https://example.com/viator?prod=balloon-alps", rating: { value: 4.8, count: 132 }, hasVideo: true },
  { id: "mock-exp-2", name: "Perugia: giro in mongolfiera tra Umbria e Assisi",
    cover: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
    partner: "Musement", priceFrom: 160, duration: "2 ore", comune: "Perugia", provincia: "PG",
    affiliateUrl: "https://example.com/musement?prod=balloon-perugia", rating: { value: 4.6, count: 89 } },
  { id: "mock-exp-3", name: "Etna: esclusivo tour in mongolfiera",
    cover: "https://images.unsplash.com/photo-1491555103944-7c647fd857e6?q=80&w=1200&auto=format&fit=crop",
    partner: "Freedome", priceFrom: 1600, duration: "1 giorno", comune: "Catania", provincia: "CT",
    affiliateUrl: "https://example.com/freedome?prod=etna-balloon", rating: { value: 4.9, count: 57 }, hasVideo: true },
  { id: "mock-exp-4", name: "Firenze: volo in mongolfiera sulla Toscana",
    cover: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1200&auto=format&fit=crop",
    partner: "GetYourGuide", priceFrom: 270, duration: "3 ore", comune: "Firenze", provincia: "FI",
    affiliateUrl: "https://example.com/gyg?prod=firenze-balloon", rating: { value: 4.7, count: 201 } },
];

/* ---------- Pagina ---------- */
export default function Esperienze() {
  const { slug } = useParams();

  const borgo = useMemo(() => findBorgoBySlug(slug), [slug]);
  const meta = BORGI_BY_SLUG?.[slug] || null;
  const title = meta?.displayName || borgo?.name || meta?.name || slug;

  const allPoi = useMemo(() => listPoiByBorgo(slug), [slug]);
  const poiClean = useMemo(
    () => allPoi.filter((p) => !isFoodDrink(p) && !isSleep(p) && !isArtigiano(p)),
    [allPoi]
  );

  /* FILTRI */
  const [contentType, setContentType] = useState("esperienze"); // esperienze | itinerari
  const [priceBand, setPriceBand] = useState("all");
  const [partner, setPartner] = useState("all");
  const [duration, setDuration] = useState("all");
  const [order, setOrder] = useState("auto");

  const base = useMemo(() => {
    let arr = poiClean;
    arr = contentType === "itinerari" ? arr.filter(isItinerary) : arr.filter(isBookableExperience);
    return arr;
  }, [poiClean, contentType]);

  const baseWithSeeds = useMemo(() => {
    if (contentType === "itinerari") return base;
    return base.length < 4 ? [...base, ...MOCK_ITEMS.map((m) => ({ ...m, id: `${slug}-${m.id}` }))] : base;
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
    if (partner !== "all") arr = arr.filter((p) => partnerLabel(p).toLowerCase().includes(partner));

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

    // ordine
    if (order === "priceAsc") arr.sort((a, b) => (priceFrom(a) || Infinity) - (priceFrom(b) || Infinity));
    else if (order === "priceDesc") arr.sort((a, b) => (priceFrom(b) || -1) - (priceFrom(a) || -1));
    else if (order === "az") arr.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    else if (order === "rating") arr.sort((a, b) => (ratingVal(b) || 0) - (ratingVal(a) || 0));

    return arr;
  }, [baseWithSeeds, priceBand, partner, duration, order]);

  const resultsCount = filtered.length;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    (meta?.name || borgo?.name || slug) + " " + ((borgo?.provincia || meta?.provincia || "") + " " + (borgo?.regione || meta?.regione || "")).trim()
  )}`;

  const colors = {
    home:        { bg: "#222222", color: "#ffffff" },
    cosafare:    { bg: "#2E7D32", color: "#ffffff" },
    mangiare:    { bg: "#C81E3C", color: "#ffffff" },
    eventi:      { bg: "#F4B000", color: "#ffffff" },
    artigiani:   { bg: "#9A5B2D", color: "#ffffff" },
    trasporti:   { bg: "#1649D7", color: "#ffffff" },
    esperienze:  { bg: "#21C195", color: "#ffffff" },
    dormire:     { bg: "#EC6A9E", color: "#ffffff" },
    prodotti:    { bg: "#4B2E12", color: "#ffffff" },
  };

  return (
    <>
      <TopBar slug={slug} />

      <main className="min-h-screen bg-white pt-14">
        {/* PALLINE */}
        <section className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: "touch" }}>
            <NavItem to={`/borghi/${slug}`} label="Home borgo" icon={Home} {...colors.home} />
            <Divider />
            <NavItem to={`/borghi/${slug}/cosa-fare`} label="Cosa fare" icon={ListIcon} {...colors.cosafare} />
            <Divider />
            <NavItem to={`/borghi/${slug}/mangiare-bere`} label="Mangiare" icon={Utensils} {...colors.mangiare} />
            <Divider />
            <NavItem to={`/borghi/${slug}/eventi`} label="Eventi e Sagre" icon={CalendarDays} {...colors.eventi} />
            <Divider />
            <NavItem to={`/borghi/${slug}/artigiani`} label="Artigiani" icon={Hammer} {...colors.artigiani} />
            <Divider />
            <NavItem to={`/borghi/${slug}/trasporti`} label="Trasporti" icon={Bus} {...colors.trasporti} />
            <Divider />
            <NavItem to={`/borghi/${slug}/esperienze`} label="Esperienze" icon={Route} {...colors.esperienze} />
            <Divider />
            <NavItem to={`/borghi/${slug}/dormire`} label="Dormire" icon={BedDouble} {...colors.dormire} />
            <Divider />
            <NavItem to={`/borghi/${slug}/prodotti-tipici`} label="Prodotti tipici" icon={ShoppingBag} {...colors.prodotti} />
          </div>
        </section>

        {/* Header + Filtri (bianco) */}
        <section className="border-t bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
            <h1 className="text-base sm:text-lg font-extrabold text-[#6B271A]">
              {contentType === "itinerari" ? "Itinerari" : "Esperienze"} a {title}
            </h1>
            <a href={mapsUrl} target="_blank" rel="noreferrer" className="hidden rounded-full border bg-white px-3 py-1.5 text-sm font-semibold text-[#6B271A] shadow-sm hover:bg-neutral-50 md:inline-flex">
              Apri mappa
            </a>
          </div>

          <div className="sticky top-14 z-[80] border-t bg-white">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="flex items-center gap-2 overflow-x-auto py-2" style={{ WebkitOverflowScrolling: "touch" }}>
                <EToggle value={contentType} onChange={setContentType} />
                <PartnerDropdownChip value={partner} onChange={setPartner} />
                <SelectChip
                  label="Prezzo"
                  value={priceBand}
                  onChange={setPriceBand}
                  options={[
                    { value: "all", label: "Prezzo: tutti" },
                    { value: "lt50", label: "< 50 €" },
                    { value: "50-100", label: "50–100 €" },
                    { value: "100-250", label: "100–250 €" },
                    { value: "gt250", label: "> 250 €" },
                  ]}
                />
                <SelectChip
                  label="Durata"
                  value={duration}
                  onChange={setDuration}
                  options={[
                    { value: "all", label: "Durata: tutte" },
                    { value: "le2", label: "≤ 2 ore" },
                    { value: "2-4", label: "2–4 ore" },
                    { value: "day", label: "mezza/1 giornata" },
                  ]}
                />
                <SelectChip
                  label="Ordina per"
                  value={order}
                  onChange={setOrder}
                  options={[
                    { value: "auto", label: "Ordina: automatico" },
                    { value: "priceAsc", label: "Prezzo ↑" },
                    { value: "priceDesc", label: "Prezzo ↓" },
                    { value: "az", label: "A → Z" },
                    { value: "rating", label: "Valutazione" },
                  ]}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Conteggio risultati */}
        <div className="mx-auto max-w-6xl px-4 pt-4 text-sm text-neutral-600 sm:px-6">
          {resultsCount} {resultsCount === 1 ? "risultato" : "risultati"}
        </div>

        {/* Griglia */}
        <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
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

        {/* Footer link rapidi */}
        <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/borghi/${slug}`} className="rounded-full border px-3 py-2 text-sm font-semibold text-[#6B271A] hover:bg-neutral-50">
              ← Torna alla pagina del borgo
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
