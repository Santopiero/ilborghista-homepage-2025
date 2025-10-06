// src/pages/MangiareBere.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  listPoiByBorgo,
  findBorgoBySlug,
  syncBorgoBundle,
  isFavorite,
  toggleFavorite,
} from "../lib/store";
import { BORGI_BY_SLUG } from "../data/borghi";
import {
  MapPin, Heart, Search, Menu, X, LogIn, Users, MessageCircle,
  Smartphone, Info, HandHeart, BadgeCheck, Utensils
} from "lucide-react";

/* ================= Helpers ================= */
const isFoodDrink = (p) =>
  /(ristor|tratt|osteria|pizzer|bar|caff|café|enotec|pub|agritur)/i.test(p.type || p.name || "");

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches ||
   window.navigator.standalone === true);

/* ================= Favorite hook ================= */
function useFavorite(type, id, data) {
  const [fav, setFav] = useState(() => {
    try { return isFavorite?.(type, id) ?? false; } catch { return false; }
  });
  const onToggle = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    try {
      const next = toggleFavorite?.(type, id, data);
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

/* ============== Claimable di default per Mangiare & Bere ============== */
function buildClaimableEatDrink(slug, borgoName) {
  return [
    {
      id: `claim-${slug}-1`,
      borgoSlug: slug,
      name: "Ristorante del Centro",
      location: borgoName,
      cover: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1500&auto=format&fit=crop",
      fascia: "€€",
      claimable: true,
    },
    {
      id: `claim-${slug}-2`,
      borgoSlug: slug,
      name: "Bar del Borgo",
      location: borgoName,
      cover: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1500&auto=format&fit=crop",
      fascia: "€",
      claimable: true,
    },
  ];
}

/* ================= TopBar (coerente con HomeBorgo) ================= */
function TopBar({ slug }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");

  const infoHref = `/borghi/${slug}/info`;
  const donateHref = `/borghi/${slug}/sostieni`;

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
              aria-label="Cerca su Il Borghista"
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
                  aria-label="Cerca nel borgo"
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
              <li>
                <Link
                  to="/auth"
                  className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-neutral-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <LogIn className="h-4 w-4" /> Accedi / Registrati
                </Link>
              </li>

              {/* Info & Sostieni — SOLO mobile */}
              <li className="sm:hidden">
                <Link
                  to={infoHref}
                  className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-neutral-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <Info className="h-4 w-4" /> Info
                </Link>
              </li>
              <li className="sm:hidden">
                <Link
                  to={donateHref}
                  className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-neutral-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <HandHeart className="h-4 w-4" /> Sostieni il borgo
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
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}

/* ================= Card attività (uguale a HomeBorgo) ================= */
function EatDrinkCard({ item }) {
  const isClaim = item.claimable === true;
  const href = isClaim
    ? `/registrazione-attivita/mangiare?claim=${encodeURIComponent(item.id)}`
    : `/borghi/${item.borgoSlug}/poi/${item.id}`;

  const [fav, toggleFav] = useFavorite("attivita", item.id, {
    id: item.id, title: item.name, img: item.cover, location: item.location, tipo: "mangiare"
  });

  return (
    <Link
      to={href}
      className="group overflow-hidden rounded-3xl bg-white ring-1 ring-black/5 shadow-[0_10px_25px_-12px_rgba(0,0,0,0.15)]"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <img src={item.cover} alt={item.name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
        {isClaim ? (
          <span className="absolute left-3 top-3 rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-bold text-cyan-800 ring-1 ring-cyan-200">
            Da rivendicare
          </span>
        ) : (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-[#5B2A1F] ring-1 ring-black/5">
            {item.fascia || "€€"}
          </span>
        )}
        <button
          aria-label={fav ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
          onClick={(e)=>{e.preventDefault(); toggleFav(e);}}
          className={`absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full shadow ring-1 ring-black/10 ${fav ? "bg-[#D54E30] text-white" : "bg-white/90 text-[#6B271A]"}`}
        >
          <Heart className="h-4 w-4" fill={fav ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-extrabold text-[#5B2A1F] line-clamp-2">{item.name}</h3>
        <div className="mt-1 inline-flex items-center gap-1 text-sm text-neutral-700">
          <MapPin className="h-4 w-4 text-[#D54E30]" />
          {item.location}
        </div>
        {isClaim ? (
          <div className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-cyan-700">
            <BadgeCheck className="h-4 w-4" /> Rivendica e completa la scheda
          </div>
        ) : null}
      </div>
    </Link>
  );
}

/* ================= Pagina ================= */
export default function MangiareEBere() {
  const { slug } = useParams();

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
      <>
        <TopBar slug={slug} />
        <main className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
          <p className="text-gray-700">Borgo non trovato.</p>
          <Link to="/" className="underline text-[#6B271A]">Torna alla Home</Link>
        </main>
      </>
    );
  }

  const borgoName = meta?.displayName || borgo?.name || meta?.name || slug;

  // POI dal data store
  const allPoi = useMemo(() => listPoiByBorgo(slug) || [], [slug, syncTick]);
  const eatDrinkRaw = useMemo(() => allPoi.filter(isFoodDrink), [allPoi]);

  // Mappatura card coerente con HomeBorgo
  const eatDrinkReal = useMemo(() => {
    return eatDrinkRaw.map((p) => ({
      id: p.id,
      borgoSlug: slug,
      name: p.name || "Attività",
      location: `${borgoName}${p.localita ? " · " + p.localita : ""}`,
      cover: p.cover || "https://images.unsplash.com/photo-1528605105345-5344ea20e269?q=80&w=1600&auto=format&fit=crop",
      fascia: p.fascia || "€€",
      claimable: false,
    }));
  }, [eatDrinkRaw, borgoName, slug]);

  // placeholder rivendicabili (sempre almeno 2 schede totali)
  const claimables = useMemo(() => buildClaimableEatDrink(slug, borgoName), [slug, borgoName]);

  const cards = useMemo(() => {
    const arr = [...eatDrinkReal];
    if (arr.length < 2) {
      const need = 2 - arr.length;
      arr.push(...claimables.slice(0, Math.max(0, need)));
    }
    return arr;
  }, [eatDrinkReal, claimables]);

  return (
    <>
      <TopBar slug={slug} />
      <main className="min-h-screen bg-white pt-16">
        <section className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#C81E3C]/10">
              <Utensils className="h-4 w-4 text-[#C81E3C]" />
            </span>
            <h1 className="text-2xl font-extrabold text-[#5B2A1F]">
              Mangiare e Bere a {borgoName}
            </h1>
          </div>
          <p className="mt-1 text-sm text-neutral-600">
            Locali suggeriti e attività rivendicabili. Le schede registrate compaiono automaticamente quando disponibili.
          </p>

          {/* griglia ordinata */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {cards.map((it) => (
              <EatDrinkCard key={it.id} item={it} />
            ))}
          </div>

          {/* CTA per inserire/claimare attività */}
          <div className="mt-6 rounded-xl border bg-[#FAF5E0] p-4 text-[#5B2A1F]">
            Sei il titolare di un’attività nel borgo?{" "}
            <Link
              to={`/registrazione-attivita/mangiare`}
              className="font-semibold underline"
            >
              Rivendica o crea la tua scheda
            </Link>
            .
          </div>
        </section>
      </main>
    </>
  );
}
