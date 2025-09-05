// src/pages/Esperienze.jsx
import React, { useMemo, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BORGI_BY_SLUG } from "../data/borghi";
import { findBorgoBySlug, listPoiByBorgo, getVideosByPoi } from "../lib/store";
import {
  Search, Menu, X, LogIn, UserPlus, Users, Info, MessageCircle,
  MapPin, PlayCircle, SlidersHorizontal, ChevronDown, ChevronLeft
} from "lucide-react";

/* ---------------- helpers ---------------- */
const isFoodDrink = (p) =>
  /(ristor|tratt|osteria|pizzer|bar|caff|café|enotec|pub|agritur)/i.test(p.type || p.name || "");
const isSleep = (p) =>
  /(hotel|b&b|b\s*&\s*b|bed|albergo|affittacamere|casa|agriturismo|residence)/i.test(p.type || p.name || "");
const isArtigiano = (p) =>
  /(artigian|laborator|bottega|ceramic|liutaio|tessil|falegn|orafo)/i.test(p.type || p.name || "");

const norm = (s="") => (s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/* ---------------- TopBar (brand testuale) ---------------- */
function TopBar({ slug }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    const to = q ? `/cerca?q=${encodeURIComponent(q)}&borgo=${encodeURIComponent(slug)}` : `/cerca`;
    navigate(to);
    setSearchOpen(false);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Link to={`/borghi/${slug}`} className="inline-flex items-center gap-1 text-[#6B271A]">
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm font-semibold">Borgo</span>
            </Link>
          </div>

          <Link to="/" aria-label="Vai alla home di Il Borghista" className="inline-flex items-center">
            <span className="text-lg font-extrabold tracking-tight text-[#6B271A]">Il Borghista</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              aria-label="Apri la ricerca"
              onClick={() => setSearchOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white md:hidden"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              aria-label="Apri il menu"
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* barra ricerca desktop */}
        <div className="hidden border-t bg-white md:block">
          <form onSubmit={submit} className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
            <div className="relative">
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cerca esperienze…"
                className="w-full rounded-xl border px-4 py-2 pl-9 text-sm outline-none focus:border-[#6B271A]"
              />
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            </div>
          </form>
        </div>

        {/* barra ricerca mobile */}
        {searchOpen && (
          <div className="border-t bg-white md:hidden">
            <form onSubmit={submit} className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
              <div className="relative">
                <input
                  type="search"
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cerca esperienze…"
                  className="w-full rounded-xl border px-4 py-2 pl-9 text-sm outline-none focus:border-[#6B271A]"
                />
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              </div>
            </form>
          </div>
        )}
      </header>

      {/* Drawer menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <nav className="absolute right-0 top-0 h-full w-80 max-w-[85%] bg-white shadow-xl" aria-label="Menu principale">
            <div className="flex items-center justify-between border-b p-4">
              <span className="text-base font-bold text-[#6B271A]">Menu</span>
              <button aria-label="Chiudi menu" onClick={() => setMenuOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border">
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="p-2">
              <li><Link to="/login" className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-neutral-50" onClick={() => setMenuOpen(false)}><LogIn className="h-4 w-4" /> Accedi</Link></li>
              <li><Link to="/registrazione" className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-neutral-50" onClick={() => setMenuOpen(false)}><UserPlus className="h-4 w-4" /> Registrati</Link></li>
              <li><Link to="/creator" className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-neutral-50" onClick={() => setMenuOpen(false)}><Users className="h-4 w-4" /> I nostri creator</Link></li>
              <li><Link to={`/borghi/${slug}/info-utili`} className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-neutral-50" onClick={() => setMenuOpen(false)}><Info className="h-4 w-4" /> Info utili</Link></li>
              <li><Link to="/contatti" className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-neutral-50" onClick={() => setMenuOpen(false)}><MessageCircle className="h-4 w-4" /> Contattaci</Link></li>
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}

/* ---------------- chip orizzontali ---------------- */
function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`snap-start shrink-0 rounded-full border px-3 py-1.5 text-sm ${
        active ? "bg-[#6B271A] text-white border-[#6B271A]" : "bg-white text-[#6B271A] border-[#E1B671]"
      }`}
    >
      {children}
    </button>
  );
}

/* ---------------- Card Esperienza ---------------- */
function CardExperience({ slug, p }) {
  const hasVideo = getVideosByPoi(p.id).length > 0;
  return (
    <li className="overflow-hidden rounded-2xl border bg-white transition hover:shadow">
      <Link to={`/borghi/${slug}/poi/${p.id}`} className="block">
        <div className="h-36 w-full bg-gray-100">
          <img
            src={
              p.cover ||
              "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop"
            }
            alt={p.name}
            className="h-36 w-full object-cover"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop";
            }}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 font-semibold text-[#6B271A]">{p.name}</h3>
            {hasVideo && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#6B271A]/10 px-2 py-0.5 text-[11px] text-[#6B271A]">
                <PlayCircle className="h-3.5 w-3.5" /> video
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-gray-600">
            <MapPin className="h-3.5 w-3.5 text-[#D54E30]" />
            <span>{p.type || "Esperienza"}</span>
          </div>
        </div>
      </Link>
    </li>
  );
}

/* ---------------- Pagina Esperienze ---------------- */
export default function Esperienze() {
  const { slug } = useParams();

  // dati borgo
  const borgo = useMemo(() => findBorgoBySlug(slug), [slug]);
  const meta = BORGI_BY_SLUG?.[slug] || null;
  const title = meta?.displayName || borgo?.name || meta?.name || slug;

  // lista POI e filtro "esperienze"
  const allPoi = useMemo(() => listPoiByBorgo(slug), [slug]);
  const onlyExperiences = useMemo(
    () => allPoi.filter((p) => !isFoodDrink(p) && !isSleep(p) && !isArtigiano(p)),
    [allPoi]
  );

  // categorie dinamiche a partire da p.type
  const categories = useMemo(() => {
    const s = new Set();
    onlyExperiences.forEach((p) => {
      const t = (p.type || "Altro").trim();
      if (t) s.add(t);
    });
    return ["Tutte", ...Array.from(s).sort((a, b) => a.localeCompare(b))];
  }, [onlyExperiences]);

  // stato UI
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("Tutte");
  const [order, setOrder] = useState("relevance"); // relevance | az

  // filtro+ordinamento
  const items = useMemo(() => {
    let arr = onlyExperiences;
    const qn = norm(query);
    if (qn) {
      arr = arr.filter((p) => norm(p.name).includes(qn) || norm(p.type || "").includes(qn));
    }
    if (cat !== "Tutte") {
      arr = arr.filter((p) => (p.type || "Altro") === cat);
    }
    if (order === "az") {
      arr = [...arr].sort((a, b) => a.name.localeCompare(b.name));
    }
    return arr;
  }, [onlyExperiences, query, cat, order]);

  // link Google Maps (apri mappa borgo)
  const place = (meta?.name || borgo?.name || slug) + " " + ((borgo?.provincia || meta?.provincia || "") + " " + (borgo?.regione || meta?.regione || "")).trim();
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;

  if (!borgo && !meta) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <p className="text-gray-700">Borgo non trovato.</p>
        <Link to="/" className="text-[#6B271A] underline">Torna alla Home</Link>
      </main>
    );
  }

  return (
    <>
      <TopBar slug={slug} />
      <main className="min-h-screen bg-white pt-14">
        {/* Hero compatto della sezione */}
        <section className="border-b bg-[#FAF5E0]">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <div>
              <h1 className="text-xl font-extrabold text-[#6B271A]">Esperienze a {title}</h1>
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

          {/* filtri sticky */}
          <div className="sticky top-14 z-40 border-t border-[#E9DEC7] bg-[#FAF5E0]">
            <div className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
              <div className="flex items-center gap-2">
                <div className="relative hidden sm:block">
                  <SlidersHorizontal className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <select
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="appearance-none rounded-full border px-8 py-1.5 pr-8 text-sm text-[#6B271A] focus:border-[#6B271A]"
                  >
                    <option value="relevance">Consigliati</option>
                    <option value="az">Ordina A → Z</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                </div>

                <div className="relative flex-1">
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cerca un'esperienza…"
                    className="w-full rounded-full border px-4 py-2 pl-9 text-sm outline-none focus:border-[#6B271A]"
                  />
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                </div>
              </div>

              {/* chips categoria */}
              <div className="mt-2 -mx-1 overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
                <div className="flex snap-x snap-mandatory gap-2 px-1">
                  {categories.map((c) => (
                    <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
                      {c}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* risultati */}
        <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          {items.length === 0 ? (
            <div className="rounded-2xl border bg-white p-6 text-center text-neutral-700">
              Nessuna esperienza trovata. Prova a cambiare filtro o ricerca.
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {items.map((p) => (
                <CardExperience key={p.id} slug={slug} p={p} />
              ))}
            </ul>
          )}
        </section>

        {/* link utili */}
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
