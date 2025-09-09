// src/pages/HomeBorgo.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  findBorgoBySlug,
  listPoiByBorgo,
  getVideosByBorgo,
  getVideosByPoi,
  syncBorgoBundle,
  isFavorite,
  toggleFavorite,
  slugify,
} from "../lib/store";
import { BORGI_BY_SLUG, BORGI_INDEX } from "../data/borghi";
import {
  ChevronLeft, ChevronRight, Share2, Heart, Film, CalendarDays, Route, ShoppingBag,
  List as ListIcon, PlayCircle, Utensils, BedDouble, Hammer, Search, Menu, X,
  LogIn, Users, MessageCircle, Mail, CheckCircle2, AlertCircle, MapPinned,
  MapPin, Star, Bus, Info, HandHeart, Minus, User, Smartphone
} from "lucide-react";

/* ================= Helpers ================= */
const isFoodDrink = (p) =>
  /(ristor|tratt|osteria|pizzer|bar|caff|café|enotec|pub|agritur)/i.test(p.type || p.name || "");
const isSleep = (p) =>
  /(hotel|b&b|b\s*&\s*b|bed|albergo|affittacamere|casa|agriturismo|residence)/i.test(p.type || p.name || "");
const isArtigiano = (p) =>
  /(artigian|laborator|bottega|ceramic|liutaio|tessil|falegn|orafo)/i.test(p.type || p.name || "");

// Mostra/nasconde "Installa l’app" se è già A2HS
const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches ||
   window.navigator.standalone === true);

const fmtPrice = (n) => {
  if (n == null || Number.isNaN(n)) return null;
  try { return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n); }
  catch { return `€ ${Math.round(n)}`; }
};
function withUtm(url, partner) {
  if (!url) return "#";
  const u = new URL(url, window.location.origin);
  u.searchParams.set("utm_source", "ilborghista");
  u.searchParams.set("utm_medium", "partner");
  u.searchParams.set("utm_campaign", (partner || "esperienze").toLowerCase());
  return u.toString();
}
function getYouTubeId(url = "") {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v") || "";
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
  } catch {}
  return "";
}
const getYouTubeThumb = (url = "") =>
  getYouTubeId(url) ? `https://i.ytimg.com/vi/${getYouTubeId(url)}/hqdefault.jpg` : "";

/* ================= Small Favorite Hook ================= */
function useFavorite(type, id, data) {
  const [fav, setFav] = useState(() => {
    try { return isFavorite?.(type, id) ?? false; } catch { return false; }
  });
  const onToggle = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    try {
      const next = toggleFavorite?.(type, id, data);
      // se toggleFavorite ritorna boolean, usalo; altrimenti optimistico
      if (typeof next === "boolean") setFav(next);
      else setFav((v) => !v);
    } catch {
      setFav((v) => !v);
    }
  };
  useEffect(() => {
    try { setFav(isFavorite?.(type, id) ?? false); } catch {}
  }, [type, id]);
  return [fav, onToggle];
}

/* ================= TopBar ================= */
function TopBar({ slug }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    const to = q ? `/cerca?q=${encodeURIComponent(q)}&borgo=${encodeURIComponent(slug)}` : `/cerca`;
    setSearchOpen(false);
    navigate(to);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
          <Link to="/" aria-label="Vai alla home di Il Borghista" className="inline-flex items-center">
            <span className="text-lg font-extrabold tracking-tight text-[#6B271A]">Il Borghista</span>
          </Link>

          {/* Ricerca desktop */}
          <form onSubmit={onSubmit} className="relative hidden w-[46%] md:block">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cerca luoghi, eventi, esperienze…"
              className="w-full rounded-full border px-4 py-2 pl-9 text-sm outline-none focus:border-[#6B271A]"
            />
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          </form>

          <div className="flex items-center gap-2">
            {/* Ricerca mobile */}
            <button
              aria-label="Apri la ricerca"
              onClick={() => setSearchOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white md:hidden"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Hamburger */}
            <button
              aria-label="Apri il menu"
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Ricerca mobile */}
        {searchOpen && (
          <div className="border-t bg-white md:hidden">
            <form onSubmit={onSubmit} className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
              <div className="relative">
                <input
                  type="search"
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cerca nel borgo…"
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
              <button
                aria-label="Chiudi menu"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ul className="p-2">
              {/* Accedi + Registrati */}
              <li>
                <Link
                  to="/registrazione-utente"
                  className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-neutral-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <LogIn className="h-4 w-4" /> Accedi / Registrati
                </Link>
              </li>

              <li>
                <Link
                  to="/creator"
                  className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-neutral-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <Users className="h-4 w-4" /> I nostri creator
                </Link>
              </li>

              <li>
                <Link
                  to="/contatti"
                  className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-neutral-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <MessageCircle className="h-4 w-4" /> Contattaci
                </Link>
              </li>

              {/* Installa l’app: SOLO mobile e se non già installata */}
              {typeof window !== "undefined" && !isStandalone() && (
                <li className="mt-1 sm:hidden">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      window.__openInstallModal?.();
                    }}
                    className="w-full flex items-center gap-2 rounded-lg px-3 py-3 bg-[#0b3a53] text-white font-medium hover:opacity-90"
                  >
                    <Smartphone className="h-4 w-4" /> Installa l’app
                  </button>
                </li>
              )}

              <li className="mt-2 border-t pt-2">
                <Link
                  to="/registrazione-creator"
                  className="flex items-center justify-center rounded-xl bg-[#D54E30] px-4 py-2 font-semibold text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  Diventa Creator del Borgo
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}

/* ================= HScroll + arrows ================= */
function HScrollWithArrows({ children, className = "" }) {
  const ref = useRef(null);
  const scrollBy = (dir) => {
    const el = ref.current;
    if (!el) return;
    const width = el.clientWidth || window.innerWidth;
    el.scrollBy({ left: dir * Math.round(width * 0.9), behavior: "smooth" });
  };

  return (
    <div className={`relative ${className}`}>
      <button
        aria-label="Scorri a sinistra"
        onClick={() => scrollBy(-1)}
        className="absolute left-0 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5 hover:bg-neutral-50 md:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        aria-label="Scorri a destra"
        onClick={() => scrollBy(1)}
        className="absolute right-0 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5 hover:bg-neutral-50 md:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div
        ref={ref}
        role="list"
        className="scrollbar-none -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 md:snap-none"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {children}
      </div>
    </div>
  );
}

/* ================= Hero overlay ================= */
function HeroOverlay({ mapsUrl }) {
  return (
    <div className="absolute left-4 right-4 top-16 z-20 flex items-start justify-between">
      <a
        href={mapsUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-sm font-semibold text-[#6B271A] shadow ring-1 ring-black/5 hover:bg-white"
      >
        <MapPinned className="h-4 w-4" />
        <span className="hidden md:inline">Apri mappa</span>
      </a>
    </div>
  );
}

/* ================= Hero Gallery ================= */
function HeroGallery({ title, gallery = [], fallback, overlay = null, leftExtras = null, favType, favId, favData }) {
  const [i, setI] = useState(0);
  const n = gallery?.length || 0;
  const hasMany = n > 1;
  const current = n ? gallery[i] : { src: fallback, name: title };

  // Preferiti del borgo
  const [isFav, onFavToggle] = useFavorite(favType, favId, favData);

  // Swipe mobile
  const t = useRef({ x: 0, t: 0 });
  const onTouchStart = (e) => {
    const a = e.touches?.[0]; if (!a) return;
    t.current = { x: a.clientX, t: Date.now() };
  };
  const onTouchEnd = (e) => {
    const dx = (e.changedTouches?.[0]?.clientX || 0) - t.current.x;
    const dt = Date.now() - t.current.t;
    if (Math.abs(dx) > 40 && dt < 500 && hasMany) setI((v) => (dx < 0 ? (v + 1) % n : (v - 1 + n) % n));
  };

  // Precarica ±1
  useEffect(() => {
    if (!n) return;
    const next = new Image(); next.src = gallery[(i + 1) % n]?.src || "";
    const prev = new Image(); prev.src = gallery[(i - 1 + n) % n]?.src || "";
  }, [i, n, gallery]);

  return (
    <section className="relative">
      <div className="relative h-72 w-full overflow-hidden md:h-[380px]" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <img src={current?.src || fallback} alt={current?.name || title} className="h-full w-full object-cover" loading="eager" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

        {/* overlay */}
        {overlay}

        {/* label foto & contatore */}
        {current?.name ? <div className="absolute left-3 top-3 z-10 rounded-md bg-black/55 px-2 py-1 text-xs text-white">{current.name}</div> : null}
        <div className="absolute right-3 top-3 z-10 rounded-md bg-black/55 px-2 py-1 text-xs text-white">{n ? `${i + 1} / ${n}` : "1 / 1"}</div>

        {/* azioni mobile */}
        <div className="md:hidden absolute right-3 bottom-3 z-10 flex flex-col gap-2">
          <button aria-label="Condividi" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#6B271A] shadow ring-1 ring-black/5">
            <Share2 className="h-5 w-5" />
          </button>
          <button
            aria-label={isFav ? "Rimuovi dai preferiti" : "Salva nei preferiti"}
            onClick={onFavToggle}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full shadow ring-1 ring-black/5 ${isFav ? "bg-[#D54E30] text-white" : "bg-white/90 text-[#6B271A]"}`}
          >
            <Heart className="h-5 w-5" fill={isFav ? "currentColor" : "none"} />
          </button>
        </div>

        {/* frecce desktop */}
        {hasMany && (
          <>
            <button aria-label="Foto precedente" onClick={() => setI((v) => (v - 1 + n) % n)} className="absolute left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow hover:bg-white md:flex">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button aria-label="Foto successiva" onClick={() => setI((v) => (v + 1) % n)} className="absolute right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow hover:bg-white md:flex">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* titolo + extra (Info + Sostieni) */}
      <div className="absolute inset-x-0 bottom-4">
        <div className="mx-auto flex max-w-6xl items-end justify-between gap-2 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-white drop-shadow md:text-4xl">{title}</h1>
            {leftExtras}
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <button className="inline-flex h-10 items-center gap-2 rounded-xl border bg-white/90 px-3 text-[#6B271A] hover:bg-white">
              <Share2 className="h-4 w-4" /> Condividi
            </button>
            <button
              onClick={onFavToggle}
              className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 hover:bg-white ${isFav ? "bg-[#D54E30] text-white border-[#D54E30]" : "bg-white/90 text-[#6B271A]"}`}
            >
              <Heart className="h-4 w-4" fill={isFav ? "currentColor" : "none"} /> {isFav ? "Salvato" : "Salva"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================= NAV (pallotte) ================= */
const colors = {
  cosafare:   { bg: "#2E7D32", color: "#ffffff" },
  mangiare:   { bg: "#C81E3C", color: "#ffffff" },
  eventi:     { bg: "#F4B000", color: "#ffffff" },
  artigiani:  { bg: "#9A5B2D", color: "#ffffff" },
  trasporti:  { bg: "#1649D7", color: "#ffffff" },
  esperienze: { bg: "#4ada48ff", color:"#ffffff"},
  dormire:    { bg: "#EC6A9E", color: "#ffffff" },
  prodotti:   { bg: "#8C6A18", color: "#ffffff" },
};

function NavBall({ to, label, icon: Icon, bg, color }) {
  return (
    <Link to={to} aria-label={label} title={label} className="flex items-center gap-1.5 shrink-0">
      <span
        className="inline-flex h-10 w-10 items-center justify-center rounded-full shadow ring-1 ring-black/5"
        style={{ background: bg, color }}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="hidden sm:inline text-[13.5px] leading-none text-[#1A1818] whitespace-nowrap">
        {label}
      </span>
    </Link>
  );
}
function NavTileMobile({ to, label, icon: Icon, bg, color, gradient }) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="flex items-center gap-2 rounded-2xl border bg-white p-2 shadow-sm hover:shadow ring-1 ring-transparent hover:ring-[#6B271A]/20 active:scale-[0.99] transition"
    >
      <span
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full shadow ring-1 ring-black/5"
        style={{ background: gradient ? undefined : bg, color }}
      >
        {gradient ? <span className="absolute inset-0 rounded-full" style={{ background: colors.esperienze.bg }} /> : null}
        <Icon className="h-5 w-5 relative" aria-hidden="true" />
      </span>
      <span className="text-[15px] leading-tight font-extrabold text-[#5B2A1F]">
        {label}
      </span>
    </Link>
  );
}
const Divider = () => <span className="mx-1 hidden h-6 w-px bg-neutral-200 sm:inline-block" />;

/* ================= Descrizione & In breve ================= */
function DescriptionBlock({ text, slug }) {
  const KEY = `descr-expanded:${slug}`;
  const [expanded, setExpanded] = useState(() => {
    try { return sessionStorage.getItem(KEY) === "1"; } catch { return false; }
  });
  useEffect(() => {
    try { sessionStorage.setItem(KEY, expanded ? "1" : "0"); } catch {}
  }, [expanded]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
      <div className={`relative leading-relaxed text-gray-800 ${expanded ? "" : "max-h-28 overflow-hidden"}`}>
        <p>{text}</p>
        {!expanded && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/90 to-transparent" />}
      </div>
      <button className="mt-2 inline-flex h-9 items-center rounded-md px-2 text-sm font-semibold text-[#6B271A] underline" onClick={() => setExpanded((v) => !v)}>
        {expanded ? "Mostra meno" : "Mostra tutto"}
      </button>
    </section>
  );
}
function SmallGallery({ items = [] }) {
  const ref = useRef(null);
  const scrollBy = (dx) => ref.current && ref.current.scrollBy({ left: dx, behavior: "smooth" });
  if (!items.length) return null;
  return (
    <div className="relative">
      <div ref={ref} className="scrollbar-none mt-2 flex gap-2 overflow-x-auto snap-x snap-mandatory" style={{ WebkitOverflowScrolling: "touch" }}>
        {items.map((it, idx) => (
          <figure key={idx} className="snap-start shrink-0 w-40">
            <img src={it.src} alt={it.name || `Foto ${idx + 1}`} className="h-24 w-40 rounded-xl object-cover ring-1 ring-black/5" loading="lazy" decoding="async" />
            {it.name ? <figcaption className="mt-1 truncate text-xs text-neutral-600">{it.name}</figcaption> : null}
          </figure>
        ))}
      </div>
      <div className="mt-2 hidden justify-end gap-2 md:flex">
        <button onClick={() => scrollBy(-300)} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5" aria-label="precedente"><ChevronLeft className="h-4 w-4" /></button>
        <button onClick={() => scrollBy(300)} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5" aria-label="successivo"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
function InBreve({ meta, borgo, slug }) {
  const regione = borgo?.regione || meta?.regione || meta?.region;
  const provincia = borgo?.provincia || meta?.provincia || meta?.province;
  const short = meta?.shortInfo || null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
      <div className="rounded-2xl border bg-[#FAF5E0] p-4">
        <h3 className="text-sm font-bold text-[#6B271A]">In breve</h3>
        <ul className="mt-2 space-y-1 text-sm text-gray-700">
          {short?.text ? <li className="leading-relaxed">{short.text}</li> : null}
          {regione ? <li><span className="font-semibold">Regione:</span> {regione}</li> : null}
          {provincia ? <li><span className="font-semibold">Provincia:</span> {provincia}</li> : null}
          <li><span className="font-semibold">Hashtag:</span> #{slug}</li>
        </ul>
        {Array.isArray(short?.gallery) && short.gallery.length ? <div className="mt-3"><SmallGallery items={short.gallery} /></div> : null}
      </div>
    </section>
  );
}

/* ================== CARD “HM” PRECISE ================== */
/* 1) Video dei creator */
function CreatorCardHM({ v, borgoName }) {
  const th = v.thumbnail || getYouTubeThumb(v.youtubeUrl || v.url);
  const name = v.creatorName || v.author || v.owner || v.channel || (v.title ? String(v.title).split("–")[0].trim() : "Creator");
  const [fav, toggleFav] = useFavorite("video", v.id, {
    id: v.id, title: v.title, thumbnail: th, url: v.youtubeUrl || v.url, borgoName
  });
  return (
    <article className="snap-center shrink-0 w-[80%] xs:w-[70%] sm:w-[48%] md:w-[32%] lg:w-[24%] overflow-hidden rounded-3xl bg-white shadow-[0_10px_25px_-12px_rgba(0,0,0,0.15)] ring-1 ring-black/5">
      <a href={v.youtubeUrl || v.url} target="_blank" rel="noreferrer" className="block">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-3xl">
          {th ? (
            <img src={th} alt={v.title || name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400">
              <PlayCircle className="h-10 w-10" />
            </div>
          )}
          {/* cuore in alto dx (rimpiazza il "minus") */}
          <button
            type="button"
            aria-label={fav ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
            className={`absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full shadow ring-1 ring-black/10 ${fav ? "bg-[#D54E30] text-white" : "bg-white/90 text-[#6B271A]"}`}
            onClick={toggleFav}
          >
            <Heart className="h-4 w-4" fill={fav ? "currentColor" : "none"} />
          </button>
        </div>
        <div className="p-4">
          <div className="font-extrabold text-[#5B2A1F]">{name}</div>
          <div className="mt-1 flex items-center gap-1 text-sm text-neutral-600">
            <MapPin className="h-4 w-4 text-[#D54E30]" />
            {borgoName}
          </div>
          {/* icona profilo in basso dx */}
          <span className="mt-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#D54E30] text-white">
            <User className="h-4 w-4" />
          </span>
        </div>
      </a>
    </article>
  );
}

/* 2) Borghi da scoprire (nearby) */
function DiscoverBorgoCardHM({ b }) {
  const [fav, toggleFav] = useFavorite("borgo", b.slug, { slug: b.slug, name: b.name, hero: b.hero });
  return (
    <Link
      to={`/borghi/${b.slug}`}
      className="snap-center shrink-0 w-[80%] xs:w-[70%] sm:w-[48%] md:w-[32%] lg:w-[24%] overflow-hidden rounded-[28px] bg-white shadow-[0_10px_25px_-12px_rgba(0,0,0,0.15)] ring-1 ring-black/5"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-[28px]">
        <img src={b.hero} alt={b.name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#5B2A1F] shadow ring-1 ring-black/5">
          {b.name}
        </span>
        <button
          aria-label={fav ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
          onClick={toggleFav}
          className={`absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full shadow ring-1 ring-black/10 ${fav ? "bg-[#D54E30] text-white" : "bg-white/90 text-[#6B271A]"}`}
        >
          <Heart className="h-4 w-4" fill={fav ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-extrabold text-[#5B2A1F]">Scopri {b.name}</h3>
        <div className="mt-1 text-sm text-neutral-600">
          {b.subtitle || "Itinerari, eventi e sapori del territorio"}
        </div>
        <div className="mt-2 inline-flex items-center gap-1 text-sm text-neutral-700">
          <Star className="h-4 w-4 text-[#E6B800]" />
          4,6 <span className="text-neutral-500">(128)</span>
        </div>
      </div>
    </Link>
  );
}

/* 3) Prossimi eventi – locandina verticale */
function HMEventPosterCard({ ev }) {
  const eventId = ev.id || slugify(ev.title + (ev.date || ""));
  const [fav, toggleFav] = useFavorite("evento", eventId, { id: eventId, title: ev.title, img: ev.img, date: ev.date, place: ev.place });
  return (
    <article className="snap-center shrink-0 w-[68%] xs:w-[54%] sm:w-[38%] md:w-[28%] lg:w-[22%] overflow-hidden rounded-3xl bg-white shadow-[0_10px_25px_-12px_rgba(0,0,0,0.15)] ring-1 ring-black/5">
      {/* Locandina verticale 2:3 */}
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <img
          src={ev.img}
          alt={ev.title}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        {ev.tag && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-extrabold text-[#5B2A1F] shadow ring-1 ring-black/5">
            {ev.tag}
          </span>
        )}
        <button
          aria-label={fav ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
          onClick={toggleFav}
          className={`absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full shadow ring-1 ring-black/10 ${fav ? "bg-[#D54E30] text-white" : "bg-white/90 text-[#6B271A]"}`}
        >
          <Heart className="h-4 w-4" fill={fav ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-extrabold text-[#5B2A1F]">{ev.title}</h3>
        {ev.date && <div className="mt-2 text-sm text-neutral-700">{ev.date}</div>}
        {ev.place && (
          <div className="mt-1 inline-flex items-center gap-1 text-sm text-neutral-700">
            <MapPin className="h-4 w-4 text-[#D54E30]" />
            {ev.place}
          </div>
        )}
        {ev.meta && <div className="mt-1 text-sm text-neutral-700">{ev.meta}</div>}
      </div>
    </article>
  );
}

/* 4) Prodotti tipici */
function HMProductCard({ p }) {
  const prodId = p.id || slugify(p.title);
  const [fav, toggleFav] = useFavorite("prodotto", prodId, { id: prodId, title: p.title, img: p.img, location: p.location, priceFrom: p.priceFrom });
  return (
    <article className="snap-center shrink-0 w-[80%] xs:w-[70%] sm:w-[48%] md:w-[32%] lg:w-[24%] overflow-hidden rounded-3xl bg-white shadow-[0_10px_25px_-12px_rgba(0,0,0,0.15)] ring-1 ring-black/5">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl rounded-b-none">
        <img src={p.img} alt={p.title} className="h-full w-full object-cover" loading="lazy" decoding="async" />
        {p.priceFrom != null && (
          <span className="absolute right-3 top-3 rounded-full bg-[#D54E30] px-3 py-1 text-xs font-extrabold text-white shadow ring-1 ring-[#E1B671]">
            da {fmtPrice(p.priceFrom).replace(/\s?EUR?/, "").trim()}
          </span>
        )}
        <button
          aria-label={fav ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
          onClick={toggleFav}
          className={`absolute left-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full shadow ring-1 ring-black/10 ${fav ? "bg-[#D54E30] text-white" : "bg-white/90 text-[#6B271A]"}`}
        >
          <Heart className="h-4 w-4" fill={fav ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-extrabold text-[#5B2A1F]">{p.title}</h3>
        <div className="mt-2 inline-flex items-center gap-1 text-sm text-neutral-700">
          <MapPin className="h-4 w-4 text-[#D54E30]" />
          {p.location}
        </div>
      </div>
    </article>
  );
}

/* ================= Section wrapper ================= */
function SectionHM({ title, linkTo, children }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-[#5B2A1F]">{title}</h2>
        {linkTo && (
          <Link to={linkTo} className="text-sm font-semibold underline">
            Vedi tutti
          </Link>
        )}
      </div>
      <HScrollWithArrows>{children}</HScrollWithArrows>
    </section>
  );
}

/* ================= Newsletter ================= */
function NewsletterCTA({ slug }) {
  const [email, setEmail] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [msg, setMsg] = useState("");

  const isValid = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isValid(email)) { setStatus("error"); setMsg("Inserisci un'email valida."); return; }
    if (!privacy) { setStatus("error"); setMsg("Devi accettare l'informativa privacy."); return; }

    setLoading(true); setStatus(null); setMsg("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, borgo: slug, source: "home-borgo" }),
      });
      if (!res.ok) throw new Error("subscribe failed");
      setStatus("ok"); setMsg("Iscrizione completata! Controlla la posta per confermare.");
      setEmail(""); setPrivacy(false);
    } catch {
      setStatus("error"); setMsg("Si è verificato un problema. Riprova tra poco.");
    } finally { setLoading(false); }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="rounded-2xl border bg-white p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#6B271A]/10">
            <Mail className="h-5 w-5 text-[#6B271A]" />
          </span>
          <div className="w-full">
            <h3 className="text-lg font-extrabold text-[#6B271A]">Rimani aggiornato sui borghi</h3>
            <p className="mt-0.5 text-sm text-neutral-600">Eventi, esperienze e novità de Il Borghista. Niente spam, promesso.</p>
            <form onSubmit={onSubmit} className="mt-3 grid gap-2 sm:flex sm:items-center">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="La tua email" aria-label="Email per iscriverti alla newsletter" className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-[#6B271A] sm:max-w-md" required inputMode="email" autoComplete="email" />
              <button type="submit" disabled={loading} className="inline-flex h-11 items-center justify-center rounded-xl bg-[#6B271A] px-4 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60">
                {loading ? "Iscrizione..." : "Iscrivimi"}
              </button>
            </form>
            <label className="mt-2 inline-flex items-start gap-2 text-xs text-neutral-600">
              <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} className="mt-0.5" required />
              <span>Accetto l’<Link to="/privacy" className="underline">informativa privacy</Link> e i <Link to="/termini" className="underline">termini di servizio</Link>.</span>
            </label>
            {status === "ok" && (<div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700"><CheckCircle2 className="h-4 w-4" /><span className="text-sm">{msg}</span></div>)}
            {status === "error" && (<div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-rose-700"><AlertCircle className="h-4 w-4" /><span className="text-sm">{msg}</span></div>)}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================= Pagina ================= */
export default function HomeBorgo() {
  const { slug } = useParams();

  // 🔄 trigger per rileggere i dati dopo la sync MSW
  const [syncTick, setSyncTick] = useState(0);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try { await syncBorgoBundle(slug); }
      finally { if (mounted) setSyncTick(Date.now()); }
    })();
    return () => { mounted = false; };
  }, [slug]);

  const borgo = useMemo(() => findBorgoBySlug(slug), [slug, syncTick]);
  const meta = BORGI_BY_SLUG?.[slug] || null;

  if (!borgo && !meta) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <p className="text-gray-700">Borgo non trovato.</p>
        <Link to="/" className="underline text-[#6B271A]">Torna alla Home</Link>
      </main>
    );
  }

  const title = meta?.displayName || borgo?.name || meta?.name || slug;
  const descr = meta?.description || "Scopri il borgo: eventi e sagre, esperienze da vivere, prodotti tipici e i borghi vicini.";

  const gallery = Array.isArray(meta?.gallery) && meta.gallery.length
    ? meta.gallery
    : [{ src: meta?.hero || "https://images.unsplash.com/photo-1543340713-8f6b9f4507f8?q=80&w=1600&auto=format&fit=crop", name: meta?.name || borgo?.name || "Borgo" }];

  // Mappa (bottone unico)
  const place = (meta?.name || borgo?.name || slug) + " " + ((borgo?.provincia || meta?.provincia || "") + " " + (borgo?.regione || meta?.regione || "")).trim();
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;

  // Video creator
  const videos = useMemo(() => getVideosByBorgo(slug), [slug, syncTick]);

  // POI raccolte
  const allPoi = useMemo(() => listPoiByBorgo(slug), [slug, syncTick]);
  const eatDrink = useMemo(() => allPoi.filter(isFoodDrink), [allPoi]);
  const sleep = useMemo(() => allPoi.filter(isSleep), [allPoi]);
  const artigiani = useMemo(() => allPoi.filter(isArtigiano), [allPoi]);
  const thingsToDo = useMemo(() => allPoi.filter((p) => !isFoodDrink(p) && !isSleep(p) && !isArtigiano(p)), [allPoi]);

  // Mock coerenti con HM (>=4 per sezione)
  const eventi = [
    { title: "La festa della Madonna Nera", img: "https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=1500&auto=format&fit=crop", tag: "SAGRA", date: "9–10 agosto 2025", place: "Viggiano (PZ) · Santuario", meta: "Ore 21:00 · Navette gratuite" },
    { title: "Sapori in Piazza", img: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?q=80&w=1500&auto=format&fit=crop", tag: "SAGRA", date: "15 agosto 2025", place: "Viggiano (PZ) · Centro storico", meta: "Ingresso libero" },
    { title: "Concerto d’estate", img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1500&auto=format&fit=crop", tag: "", date: "22 agosto 2025", place: "Viggiano (PZ) · Arena", meta: "Ore 21:30" },
  ];
  const prodottiTipici = [
    { title: "Formaggio di malga", img: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=1500&auto=format&fit=crop", priceFrom: 7, location: "Asiago (VI) | Veneto" },
    { title: "Salumi tipici",      img: "https://images.unsplash.com/photo-1505575972945-280b8f1e5d16?q=80&w=1500&auto=format&fit=crop", priceFrom: 9, location: "Norcia (PG) | Umbria" },
    { title: "Olio EVO del Garda", img: "https://images.unsplash.com/photo-1514515411904-65fa19574d07?q=80&w=1500&auto=format&fit=crop", priceFrom: 6, location: "Garda (VR) | Veneto" },
    { title: "Vino Montepulciano", img: "https://images.unsplash.com/photo-1524594081293-190a2fe0baae?q=80&w=1500&auto=format&fit=crop", priceFrom: 8, location: "Montepulciano (SI) | Toscana" },
  ];
  const nearby = (BORGI_INDEX || []).filter((b) => b.slug !== slug).slice(0, 4);

  /* NAV items */
  const navBase = [
    { key: "cosafare",   label: "Cosa fare",              to: `/borghi/${slug}/cosa-fare`,       icon: ListIcon,   ...colors.cosafare },
    { key: "mangiare",   label: "Mangiare e Bere",        to: `/borghi/${slug}/mangiare-bere`,   icon: Utensils,   ...colors.mangiare },
    { key: "eventi",     label: "Eventi e Sagre",         to: `/borghi/${slug}/eventi`,          icon: CalendarDays, ...colors.eventi },
    { key: "artigiani",  label: "Artigiani",              to: `/borghi/${slug}/artigiani`,       icon: Hammer,     ...colors.artigiani },
    { key: "trasporti",  label: "Trasporti",              to: `/borghi/${slug}/trasporti`,       icon: Bus,        ...colors.trasporti },
    { key: "esperienze", label: "Esperienze e Itinerari", to: `/borghi/${slug}/esperienze`,      icon: Route,      ...colors.esperienze },
    { key: "dormire",    label: "Dormire",                to: `/borghi/${slug}/dormire`,         icon: BedDouble,  ...colors.dormire },
    { key: "prodotti",   label: "Prodotti tipici",        to: `/borghi/${slug}/prodotti-tipici`, icon: ShoppingBag, ...colors.prodotti },
  ];

  const infoHref = `/borghi/${slug}/info`;
  const donateHref = `/borghi/${slug}/sostieni`;

  return (
    <>
      <TopBar slug={slug} />
      <main className="min-h-screen bg-white pt-14">
        {/* HERO */}
        <HeroGallery
          title={title}
          gallery={gallery}
          fallback={gallery?.[0]?.src}
          overlay={<HeroOverlay mapsUrl={mapsUrl} />}
          leftExtras={
            <>
              <Link to={infoHref} aria-label={`Informazioni su ${title}`} className="inline-flex h-9 md:h-10 items-center gap-1.5 rounded-full border bg-white/90 px-2 md:px-3 text-white md:text-[#6B271A] hover:bg-white">
                <Info className="h-4 w-4" />
                <span className="hidden md:inline font-semibold text-[#6B271A]">Info</span>
              </Link>
              <Link to={donateHref} aria-label={`Sostieni ${title}`} className="inline-flex h-9 md:h-10 items-center gap-1.5 rounded-full bg-[#06B6D4] px-2 md:px-3 text-white hover:opacity-95">
                <HandHeart className="h-4 w-4" />
                <span className="hidden md:inline font-semibold">Sostieni il borgo</span>
              </Link>
            </>
          }
          favType="borgo"
          favId={slug}
          favData={{ slug, name: title, hero: gallery?.[0]?.src || "" }}
        />

        {/* NAV – mobile griglia / desktop fila compatta */}
        <section className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="grid grid-cols-2 gap-2 sm:hidden">
            {navBase.map((n) => (
              <NavTileMobile key={n.key} to={n.to} label={n.label} icon={n.icon} bg={n.bg} color={n.color} gradient={n.gradient} />
            ))}
          </div>
          <div className="hidden items-center gap-1.5 overflow-x-auto pb-0.5 sm:flex" style={{ WebkitOverflowScrolling: "touch" }}>
            {navBase.map((n, i) => (
              <React.Fragment key={n.key}>
                <NavBall to={n.to} label={n.label} icon={n.icon} bg={n.gradient ? undefined : n.bg} color={n.color} />
                {i < navBase.length - 1 ? <Divider /> : null}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* DESCRIZIONE + IN BREVE */}
        <DescriptionBlock text={descr} slug={slug} />
        <InBreve meta={meta} borgo={borgo} slug={slug} />

        {/* ======= SEZIONI IN STILE HM ======= */}

        {/* Video dei creator */}
        <SectionHM title="Video dei creator" linkTo={`/borghi/${slug}/video`}>
          {(videos?.length ? videos : Array.from({ length: 4 }).map((_, i) => ({
            id: `mock-${i}`,
            title: "Racconto del borgo",
            url: "#",
            thumbnail: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1500&auto=format&fit=crop",
            creatorName: i === 3 ? "Gorgonzola" : "santopiero",
          }))).map((v) => (
            <CreatorCardHM key={v.id} v={v} borgoName={meta?.name || borgo?.name || slug} />
          ))}
        </SectionHM>

        {/* Borghi da scoprire */}
        <SectionHM title="Borghi da scoprire…" linkTo={`/cerca?tipo=borghi`}>
          {nearby.map((b) => (
            <DiscoverBorgoCardHM key={b.slug} b={b} />
          ))}
        </SectionHM>

        {/* Prossimi eventi — locandine verticali */}
        <SectionHM title="Prossimi eventi" linkTo={`/borghi/${slug}/eventi`}>
          {eventi.map((ev, i) => (
            <HMEventPosterCard key={i} ev={ev} />
          ))}
        </SectionHM>

        {/* Prodotti tipici */}
        <SectionHM title="Prodotti tipici" linkTo={`/borghi/${slug}/prodotti-tipici`}>
          {prodottiTipici.map((p, i) => (
            <HMProductCard key={i} p={p} />
          ))}
        </SectionHM>

        {/* (Facoltative) altre raccolte locali in stile semplice */}
        {thingsToDo?.length ? (
          <SectionHM title="Cosa fare" linkTo={`/borghi/${slug}/cosa-fare`}>
            {thingsToDo.slice(0, 8).map((p) => (
              <li key={p.id} className="list-none">
                <CreatorCardHM
                  v={{
                    id: p.id,
                    title: p.name,
                    url: `/borghi/${slug}/poi/${p.id}`,
                    thumbnail:
                      p.cover ||
                      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop",
                    creatorName: p.name,
                  }}
                  borgoName={meta?.name || borgo?.name || slug}
                />
              </li>
            ))}
          </SectionHM>
        ) : null}

        {/* Newsletter */}
        <NewsletterCTA slug={slug} />
      </main>
    </>
  );
}
