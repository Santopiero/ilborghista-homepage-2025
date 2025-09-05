// src/pages/HomeBorgo.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { findBorgoBySlug, getVideosByBorgo } from "../lib/store";
import { BORGI_BY_SLUG, BORGI_INDEX } from "../data/borghi";
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Heart,
  Film,
  CalendarDays,
  Route,
  ShoppingBag,
  List as ListIcon,
  PlayCircle,
  Utensils,
  BedDouble,
  Hammer,
  Info,
  Search,
  Menu,
  X,
  LogIn,
  UserPlus,
  Users,
  MessageCircle,
} from "lucide-react";

/* =========================
   Helpers
   ========================= */
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
   TopBar fissa con logo + ricerca + hamburger
   ========================= */
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
          {/* Logo */}
          <Link to="/" aria-label="Vai alla home di Il Borghista" className="inline-flex items-center gap-2">
            {/* Usa il tuo asset logo; fallback a testo */}
            <img
              src="/logo-ilborghista.svg"
              alt="Il Borghista"
              className="h-7 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span className="hidden text-base font-extrabold text-[#6B271A] sm:inline">Il Borghista</span>
          </Link>

          {/* Search inline (desktop) */}
          <form onSubmit={onSubmit} className="relative hidden md:block w-[46%]">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cerca luoghi, eventi, esperienze…"
              className="w-full rounded-full border px-4 py-2 pl-9 text-sm outline-none ring-0 focus:border-[#6B271A]"
            />
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          </form>

          {/* Azioni a destra */}
          <div className="flex items-center gap-2">
            {/* Search toggle (mobile) */}
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

        {/* Barra di ricerca mobile (a scomparsa) */}
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
          <nav
            className="absolute right-0 top-0 h-full w-80 max-w-[85%] bg-white shadow-xl"
            aria-label="Menu principale"
          >
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
              <li>
                <Link
                  to="/login"
                  className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-neutral-50"
                  onClick={() => setMenuOpen(false)}
                  data-analytics="menu:login"
                >
                  <LogIn className="h-4 w-4" /> Accedi
                </Link>
              </li>
              <li>
                <Link
                  to="/registrazione"
                  className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-neutral-50"
                  onClick={() => setMenuOpen(false)}
                  data-analytics="menu:registrati"
                >
                  <UserPlus className="h-4 w-4" /> Registrati
                </Link>
              </li>
              <li>
                <Link
                  to="/creator"
                  className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-neutral-50"
                  onClick={() => setMenuOpen(false)}
                  data-analytics="menu:creator"
                >
                  <Users className="h-4 w-4" /> I nostri creator
                </Link>
              </li>
              <li>
                <Link
                  to={`/borghi/${slug}/info-utili`}
                  className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-neutral-50"
                  onClick={() => setMenuOpen(false)}
                  data-analytics="menu:info-utili"
                >
                  <Info className="h-4 w-4" /> Info utili
                </Link>
              </li>
              <li>
                <Link
                  to="/contatti"
                  className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-neutral-50"
                  onClick={() => setMenuOpen(false)}
                  data-analytics="menu:contatti"
                >
                  <MessageCircle className="h-4 w-4" /> Contattaci
                </Link>
              </li>
              <li className="mt-2 border-t pt-2">
                <Link
                  to="/registrazione-creator"
                  className="flex items-center justify-center rounded-xl bg-[#D54E30] px-4 py-2 font-semibold text-white"
                  onClick={() => setMenuOpen(false)}
                  data-analytics="menu:diventa-creator"
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

/* =========================
   HScroll + arrows (mobile swipe, desktop arrows)
   ========================= */
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
        className="absolute left-0 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5 hover:bg-neutral-50 md:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        aria-label="Scorri a destra"
        onClick={() => scrollBy(1)}
        className="absolute right-0 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5 hover:bg-neutral-50 md:flex"
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

/* =========================
   Hero Gallery (frecce, swipe, contatore, nome foto) + preload ±1
   ========================= */
function HeroGallery({ title, gallery = [], fallback }) {
  const [i, setI] = useState(0);
  const n = gallery?.length || 0;
  const hasMany = n > 1;
  const current = n ? gallery[i] : { src: fallback, name: title };

  // Swipe mobile
  const touch = useRef({ x: 0, t: 0 });
  const onTouchStart = (e) => {
    const t = e.touches?.[0]; if (!t) return;
    touch.current = { x: t.clientX, t: Date.now() };
  };
  const onTouchEnd = (e) => {
    const dx = (e.changedTouches?.[0]?.clientX || 0) - touch.current.x;
    const dt = Date.now() - touch.current.t;
    if (Math.abs(dx) > 40 && dt < 500 && hasMany) {
      setI((v) => (dx < 0 ? (v + 1) % n : (v - 1 + n) % n));
    }
  };

  // Precarica ±1 immagine
  useEffect(() => {
    if (!n) return;
    const next = new Image();
    next.src = gallery[(i + 1) % n]?.src || "";
    const prev = new Image();
    prev.src = gallery[(i - 1 + n) % n]?.src || "";
  }, [i, n, gallery]);

  return (
    <section className="relative">
      <div
        className="relative h-72 w-full overflow-hidden md:h-[380px]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <img
          key={current?.src}
          src={current?.src || fallback}
          alt={current?.name || title}
          className="h-full w-full object-cover"
          loading="eager"
          decoding="async"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

        {/* Nome foto in alto a sinistra */}
        {current?.name && (
          <div className="absolute left-3 top-3 z-10 rounded-md bg-black/55 px-2 py-1 text-xs text-white">
            {current.name}
          </div>
        )}
        {/* Contatore in alto a destra */}
        <div className="absolute right-3 top-3 z-10 rounded-md bg-black/55 px-2 py-1 text-xs text-white">
          {n ? `${i + 1} / ${n}` : "1 / 1"}
        </div>

        {/* Frecce desktop */}
        {hasMany && (
          <>
            <button
              aria-label="Foto precedente"
              onClick={() => setI((v) => (v - 1 + n) % n)}
              className="absolute left-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow hover:bg-white md:flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              aria-label="Foto successiva"
              onClick={() => setI((v) => (v + 1) % n)}
              className="absolute right-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow hover:bg-white md:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Titolo + azioni minime */}
      <div className="absolute inset-x-0 bottom-4">
        <div className="mx-auto flex max-w-6xl items-end justify-between gap-3 px-4 sm:px-6">
          <h1 className="text-3xl font-extrabold text-white drop-shadow md:text-4xl">{title}</h1>
          <div className="hidden items-center gap-2 sm:flex">
            <button className="inline-flex h-11 items-center gap-2 rounded-xl border bg-white/90 px-3 text-[#6B271A] hover:bg-white">
              <Share2 className="h-4 w-4" /> Condividi
            </button>
            <button className="inline-flex h-11 items-center gap-2 rounded-xl border bg-white/90 px-3 text-[#6B271A] hover:bg-white">
              <Heart className="h-4 w-4" /> Salva
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================
   Pillole (link a rotte vere, no ancore)
   ========================= */
const Pill = ({ to, icon: Icon, label, analytics }) => (
  <Link
    to={to}
    data-analytics={`pillola:${analytics || label.toLowerCase()}`}
    aria-label={`Vai a ${label}`}
    className="inline-flex h-11 items-center gap-2 rounded-full border border-[#E1B671] bg-[#FAF5E0] px-3 text-sm font-semibold text-[#6B271A] hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#6B271A] focus:ring-offset-2"
  >
    <Icon className="h-4 w-4" />
    {label}
  </Link>
);

/* =========================
   Descrizione (fade + toggle persistente per borgo)
   ========================= */
function DescriptionBlock({ text, slug }) {
  const KEY = `descr-expanded:${slug}`;
  const [expanded, setExpanded] = useState(() => {
    try { return sessionStorage.getItem(KEY) === "1"; } catch { return false; }
  });

  useEffect(() => {
    try { sessionStorage.setItem(KEY, expanded ? "1" : "0"); } catch {}
  }, [expanded]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
      <div className={`relative leading-relaxed text-gray-800 ${expanded ? "" : "max-h-28 overflow-hidden"}`}>
        <p>{text}</p>
        {!expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/90 to-transparent" />
        )}
      </div>
      <button
        className="mt-2 inline-flex h-9 items-center rounded-md px-2 text-sm font-semibold text-[#6B271A] underline"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? "Mostra meno" : "Mostra tutto"}
      </button>
    </section>
  );
}

/* =========================
   "In breve" ripristinato (testo + mini-slideshow)
   ========================= */
function SmallGallery({ items = [] }) {
  const ref = useRef(null);
  const scrollBy = (dx) => ref.current && ref.current.scrollBy({ left: dx, behavior: "smooth" });
  if (!items.length) return null;
  return (
    <div className="relative">
      <div ref={ref} className="scrollbar-none mt-2 flex gap-2 overflow-x-auto snap-x snap-mandatory" style={{ WebkitOverflowScrolling: "touch" }}>
        {items.map((it, idx) => (
          <figure key={idx} className="snap-start shrink-0 w-40">
            <img
              src={it.src}
              alt={it.name || `Foto ${idx + 1}`}
              className="h-24 w-40 rounded-xl object-cover ring-1 ring-black/5"
              loading="lazy"
              decoding="async"
            />
            {it.name ? <figcaption className="mt-1 truncate text-xs text-neutral-600">{it.name}</figcaption> : null}
          </figure>
        ))}
      </div>
      <div className="mt-2 hidden justify-end gap-2 md:flex">
        <button
          onClick={() => scrollBy(-300)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5"
          aria-label="precedente"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => scrollBy(300)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5"
          aria-label="successivo"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
function InBreve({ meta, borgo, slug }) {
  const regione = borgo?.regione || meta?.regione || meta?.region;
  const provincia = borgo?.provincia || meta?.provincia || meta?.province;
  const short = meta?.shortInfo || null;
  const hashtag = `#${slug}`;

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-4">
      <div className="rounded-2xl border bg-[#FAF5E0] p-4">
        <h3 className="text-sm font-bold text-[#6B271A]">In breve</h3>
        <ul className="mt-2 space-y-1 text-sm text-gray-700">
          {short?.text ? <li className="leading-relaxed">{short.text}</li> : null}
          {regione ? (
            <li>
              <span className="font-semibold">Regione:</span> {regione}
            </li>
          ) : null}
          {provincia ? (
            <li>
              <span className="font-semibold">Provincia:</span> {provincia}
            </li>
          ) : null}
          <li>
            <span className="font-semibold">Hashtag:</span> {hashtag}
          </li>
        </ul>
        {Array.isArray(short?.gallery) && short.gallery.length ? (
          <div className="mt-3">
            <SmallGallery items={short.gallery} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* =========================
   Sezione generica con carosello
   ========================= */
function SectionCarousel({ id, title, items = [], render, extraLink = null }) {
  return (
    <section id={id} className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-[#6B271A]">{title}</h2>
        {extraLink ? (
          <Link to={extraLink} className="text-sm font-semibold underline">
            Vedi tutti
          </Link>
        ) : null}
      </div>
      <HScrollWithArrows className="mt-3">
        {items.map((it, idx) => render(it, idx))}
      </HScrollWithArrows>
    </section>
  );
}

/* =========================
   Pagina
   ========================= */
export default function HomeBorgo() {
  const { slug } = useParams();

  const borgo = useMemo(() => findBorgoBySlug(slug), [slug]);
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
  const descr =
    meta?.description ||
    "Scopri il borgo: eventi e sagre, esperienze da vivere, prodotti tipici e i borghi vicini.";

  const gallery =
    Array.isArray(meta?.gallery) && meta.gallery.length
      ? meta.gallery
      : [
          {
            src:
              meta?.hero ||
              "https://images.unsplash.com/photo-1543340713-8f6b9f4507f8?q=80&w=1600&auto=format&fit=crop",
            name: meta?.name || borgo?.name || "Borgo",
          },
        ];

  const videos = useMemo(() => getVideosByBorgo(slug), [slug]);

  // Mock min 4 card per test fluidità
  const eventi = [
    { title: "Festa delle tradizioni", img: "https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=1200&auto=format&fit=crop", when: "6–8 SET" },
    { title: "Concerti in piazza", img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop", when: "12–13 SET" },
    { title: "Sagra del gusto locale", img: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop", when: "20 SET" },
    { title: "Mercatino artigiano", img: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop", when: "28 SET" },
  ];
  const esperienze = [
    { title: "Passeggiata panoramica", meta: "3 km • 1h30", img: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop" },
    { title: "Percorso dei musei", meta: "2 km • 1h", img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop" },
    { title: "Tour centro storico", meta: "A piedi • 1h30", img: "https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?q=80&w=1200&auto=format&fit=crop" },
    { title: "Sentiero natura", meta: "4 km • 2h", img: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1200&auto=format&fit=crop" },
  ];
  const prodottiTipici = [
    { title: "Formaggio di malga", img: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=1200&auto=format&fit=crop" },
    { title: "Salumi tipici", img: "https://images.unsplash.com/photo-1505575972945-280b8f1e5d16?q=80&w=1200&auto=format&fit=crop" },
    { title: "Olio EVO locale", img: "https://images.unsplash.com/photo-1514515411904-65fa19574d07?q=80&w=1200&auto=format&fit=crop" },
    { title: "Miele artigianale", img: "https://images.unsplash.com/photo-1505577058444-a3dab90d4253?q=80&w=1200&auto=format&fit=crop" },
  ];
  const nearby = (BORGI_INDEX || []).filter((b) => b.slug !== slug).slice(0, 8);

  return (
    <>
      {/* Fascia fissa */}
      <TopBar slug={slug} />

      <main className="min-h-screen bg-white pt-14">
        {/* HERO */}
        <HeroGallery title={title} gallery={gallery} fallback={gallery?.[0]?.src} />

        {/* PILLOLE (link a route vere) */}
        <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Pill to={`/borghi/${slug}/eventi`}          icon={CalendarDays} label="Eventi e Sagre" analytics="eventi" />
            <Pill to={`/borghi/${slug}/esperienze`}      icon={Route}        label="Esperienze"      analytics="esperienze" />
            <Pill to={`/borghi/${slug}/prodotti-tipici`} icon={ShoppingBag}  label="Prodotti Tipici" analytics="prodotti" />
            <Pill to={`/borghi/${slug}/artigiani`}       icon={Hammer}       label="Artigiani"       analytics="artigiani" />
            <Pill to={`/borghi/${slug}/mangiare-bere`}   icon={Utensils}     label="Dove Mangiare"   analytics="mangiare" />
            <Pill to={`/borghi/${slug}/dormire`}         icon={BedDouble}    label="Dove Dormire"    analytics="dormire" />
            <Pill to={`/borghi/${slug}/cosa-fare`}       icon={ListIcon}     label="Cosa Fare"       analytics="cosa-fare" />
            <Pill to={`/borghi/${slug}/info-utili`}      icon={Info}         label="Info Utili"      analytics="info-utili" />
          </div>
        </section>

        {/* DESCRIZIONE */}
        <DescriptionBlock text={descr} slug={slug} />

        {/* IN BREVE (ripristinato) */}
        <InBreve meta={meta} borgo={borgo} slug={slug} />

        {/* VIDEO CREATOR */}
        <section id="creator" className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-extrabold text-[#6B271A]">
              <Film className="h-5 w-5" /> Creator del borgo
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
                    className="snap-center shrink-0 w-[78%] xs:w-[70%] sm:w-[55%] md:w-[40%] lg:w-[30%] 2xl:w-[22%] overflow-hidden rounded-2xl border bg-white"
                    role="listitem"
                  >
                    <a href={v.youtubeUrl || v.url} target="_blank" rel="noreferrer" className="block">
                      <div className="relative h-44 w-full bg-neutral-100">
                        {thumb ? (
                          <img src={thumb} alt={v.title} className="h-44 w-full object-cover" loading="lazy" decoding="async" />
                        ) : (
                          <div className="flex h-44 items-center justify-center text-neutral-400">
                            <PlayCircle className="h-10 w-10" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      </div>
                      <div className="p-3">
                        <h3 className="line-clamp-2 font-semibold text-[#1A1818]">{v.title || "Video"}</h3>
                        {v.description ? (
                          <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{v.description}</p>
                        ) : null}
                      </div>
                    </a>
                  </article>
                );
              })}
            </HScrollWithArrows>
          ) : (
            <div className="mt-3 rounded-2xl border bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#6B271A]/10">
                  <Film className="h-5 w-5 text-[#6B271A]" />
                </span>
                <div>
                  <div className="font-semibold text-[#6B271A]">Nessun video pubblicato… ancora 😉</div>
                  <div className="text-sm text-gray-600">
                    Sei un creator? Racconta {meta?.name || borgo?.name || "il borgo"} con i tuoi video.
                  </div>
                </div>
                <Link
                  to="/registrazione-creator"
                  className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#D54E30] px-4 py-2 font-semibold text-white"
                >
                  Diventa Creator del Borgo
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* 1) EVENTI E SAGRE */}
        <SectionCarousel
          id="eventi"
          title="Eventi e Sagre"
          items={eventi}
          render={(ev, i) => (
            <article
              key={i}
              className="snap-center shrink-0 w-[78%] xs:w-[70%] sm:w-[55%] md:w-[40%] lg:w-[30%] 2xl:w-[22%] overflow-hidden rounded-2xl border bg-white"
              role="listitem"
            >
              <div className="relative">
                <img src={ev.img} alt={ev.title} className="h-40 w-full object-cover" loading="lazy" decoding="async" />
                <span className="absolute left-2 top-2 rounded-full border border-[#E1B671] bg-[#6B271A] px-2 py-0.5 text-[11px] font-bold text-white">
                  {ev.when}
                </span>
              </div>
              <div className="p-3">
                <h3 className="line-clamp-2 font-semibold text-[#6B271A]">{ev.title}</h3>
              </div>
            </article>
          )}
        />

        {/* 2) ESPERIENZE */}
        <SectionCarousel
          id="esperienze"
          title="Esperienze"
          items={esperienze}
          render={(it, i) => (
            <article
              key={i}
              className="snap-center shrink-0 w-[78%] xs:w-[70%] sm:w-[55%] md:w-[40%] lg:w-[30%] 2xl:w-[22%] overflow-hidden rounded-2xl border bg-white"
              role="listitem"
            >
              <img src={it.img} alt={it.title} className="h-40 w-full object-cover" loading="lazy" decoding="async" />
              <div className="p-3">
                <h3 className="font-semibold text-[#6B271A]">{it.title}</h3>
                <div className="mt-1 text-xs text-neutral-600">{it.meta}</div>
              </div>
            </article>
          )}
        />

        {/* 3) PRODOTTI TIPICI */}
        <SectionCarousel
          id="prodotti-tipici"
          title="Prodotti Tipici"
          items={prodottiTipici}
          render={(p, i) => (
            <article
              key={i}
              className="snap-center shrink-0 w-[78%] xs:w-[70%] sm:w-[55%] md:w-[40%] lg:w-[30%] 2xl:w-[22%] overflow-hidden rounded-2xl border bg-white"
              role="listitem"
            >
              <img src={p.img} alt={p.title} className="h-40 w-full object-cover" loading="lazy" decoding="async" />
              <div className="p-3">
                <h3 className="font-semibold text-[#6B271A]">{p.title}</h3>
              </div>
            </article>
          )}
        />

        {/* 4) BORGHI VICINI */}
        <SectionCarousel
          id="borghi-vicini"
          title="Borghi Vicini"
          items={nearby.length >= 4 ? nearby : [...nearby, ...nearby].slice(0, 4)}
          render={(b) => (
            <Link
              key={b.slug}
              to={`/borghi/${b.slug}`}
              className="snap-center shrink-0 w-[70%] xs:w-[60%] sm:w-[45%] md:w-[32%] lg:w-[23%] overflow-hidden rounded-2xl border bg-white hover:shadow"
              role="listitem"
            >
              <div className="h-28 w-full">
                <img
                  src={b.hero}
                  alt={b.name}
                  className="h-28 w-full object-cover"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop";
                  }}
                />
              </div>
              <div className="p-3">
                <div className="font-semibold text-[#6B271A]">{b.name}</div>
              </div>
            </Link>
          )}
        />
      </main>
    </>
  );
}
