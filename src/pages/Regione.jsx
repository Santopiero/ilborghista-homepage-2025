// src/pages/Regione.jsx
import { useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { MapPin, Search as SearchIcon, X, Heart, ChevronRight } from "lucide-react";
import { BORGI_INDEX } from "../data/borghi";

/* ==============================
   REGIONS MAP (slug → label)
============================== */
const REGIONS = [
  { slug: "abruzzo", label: "Abruzzo" },
  { slug: "basilicata", label: "Basilicata" },
  { slug: "calabria", label: "Calabria" },
  { slug: "campania", label: "Campania" },
  { slug: "emilia-romagna", label: "Emilia-Romagna" },
  { slug: "friuli-venezia-giulia", label: "Friuli-Venezia Giulia" },
  { slug: "lazio", label: "Lazio" },
  { slug: "liguria", label: "Liguria" },
  { slug: "lombardia", label: "Lombardia" },
  { slug: "marche", label: "Marche" },
  { slug: "molise", label: "Molise" },
  { slug: "piemonte", label: "Piemonte" },
  { slug: "puglia", label: "Puglia" },
  { slug: "sardegna", label: "Sardegna" },
  { slug: "sicilia", label: "Sicilia" },
  { slug: "toscana", label: "Toscana" },
  { slug: "trentino-alto-adige", label: "Trentino-Alto Adige" },
  { slug: "umbria", label: "Umbria" },
  { slug: "valle-d-aosta", label: "Valle d’Aosta" },
  { slug: "veneto", label: "Veneto" },
];
const REGION_LABEL = Object.fromEntries(REGIONS.map(r => [r.slug, r.label]));

/* ==============================
   FALLBACK IMG + onError
============================== */
const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop";
const onImgErr = (e) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = FALLBACK_IMG;
};

/* ==============================
   Favorites (localStorage)
============================== */
const FAV_KEY = "ilborghista:favorites:v1";
function getFavSet() {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}
function saveFavSet(set) {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

function useFavorites() {
  const [favSet, setFavSet] = useState(() => getFavSet());
  const has = (id) => favSet.has(id);
  const toggle = (id) =>
    setFavSet((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveFavSet(next);
      return next;
    });
  return { has, toggle };
}

function FavoriteButton({ id, className = "" }) {
  const { has, toggle } = useFavorites();
  const active = has(id);
  return (
    <button
      type="button"
      aria-label={active ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      className={`inline-flex items-center justify-center rounded-full bg-white/95 text-[#D54E30] shadow ring-1 ring-black/10 hover:bg-white w-9 h-9 ${className}`}
    >
      <Heart className="w-5 h-5" fill={active ? "currentColor" : "none"} />
    </button>
  );
}

/* ==============================
   Piccola Card Borgo
============================== */
function BorgoCard({ b }) {
  return (
    <Link
      to={`/borghi/${b.slug}`}
      className="group overflow-hidden rounded-2xl bg-white shadow-xl hover:shadow-2xl transition relative"
      aria-label={`Apri ${b.name}`}
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          loading="lazy"
          src={b.hero || FALLBACK_IMG}
          alt={`Veduta di ${b.name}`}
          className="w-full h-full object-cover"
          onError={onImgErr}
        />
        <div className="absolute top-2 left-2 max-w-[82%] px-2.5 py-1 rounded-lg bg-white text-[#6B271A] text-sm font-semibold shadow">
          <span className="block truncate">{b.name}</span>
        </div>
        <FavoriteButton id={`borgo:${b.slug}`} className="absolute top-2 right-2" />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <MapPin size={16} className="text-[#D54E30]" />
          <span className="truncate">{b.province || b.region || ""}</span>
        </div>
      </div>
    </Link>
  );
}

/* ==============================
   Pagina Regione
============================== */
export default function Regione() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const label = REGION_LABEL[slug] || "Regione";
  const [q, setQ] = useState("");
  const qRef = useRef(null);

  const borghi = useMemo(
    () =>
      BORGI_INDEX.filter((b) => b.regionSlug === slug)
        .filter((b) => {
          if (!q.trim()) return true;
          const t = q.trim().toLowerCase();
          return (
            b.name?.toLowerCase().includes(t) ||
            b.slug?.toLowerCase().includes(t) ||
            (b.province || "").toLowerCase().includes(t)
          );
        })
        .slice(0, 500),
    [slug, q]
  );

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* BREADCRUMB */}
      <nav className="text-sm text-gray-600" aria-label="breadcrumb">
        <ol className="flex items-center gap-2">
          <li>
            <Link to="/" className="hover:underline">Home</Link>
          </li>
          <li className="opacity-60">/</li>
          <li className="text-[#6B271A] font-semibold">{label}</li>
        </ol>
      </nav>

      {/* HEADER REGIONALE */}
      <section className="rounded-3xl bg-[#FAF5E0] border border-[#E1B671] p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#6B271A]">{label}</h1>
            <p className="text-gray-700 mt-1">
              Scopri i borghi autentici della {label}. Esperienze, eventi, prodotti tipici.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white border px-3 py-2 text-sm">
              <span className="font-bold text-[#6B271A]">{borghi.length}</span> borghi
            </div>
            <button
              onClick={() => navigate("/esperienze?reg=" + encodeURIComponent(slug))}
              className="inline-flex items-center gap-2 rounded-xl bg-[#D54E30] text-white px-3 py-2 text-sm font-semibold"
            >
              Vai alle esperienze <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ricerca locale */}
        <form
          className="mt-4 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            qRef.current?.blur();
          }}
          role="search"
          aria-label={`Cerca nei borghi della ${label}`}
        >
          <div className="flex items-center gap-2 border rounded-xl px-3 py-2 w-full bg-white">
            <SearchIcon className="w-5 h-5 text-[#6B271A]" aria-hidden="true" />
            <input
              ref={qRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cerca un borgo o una provincia…"
              aria-label="Cosa cerchi"
              className="flex-1 outline-none text-gray-900 placeholder:text-gray-500 caret-[#6B271A]"
            />
            {q && (
              <button
                type="button"
                aria-label="Svuota"
                onClick={() => setQ("")}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-[#D54E30] text-white font-semibold"
          >
            Cerca
          </button>
        </form>
      </section>

      {/* LISTA BORGHI */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#6B271A]">Borghi della {label}</h2>
          <div className="text-sm text-gray-600">{borghi.length} risultati</div>
        </div>

        {borghi.length === 0 ? (
          <div className="mt-4 rounded-xl border p-4 text-sm text-neutral-700">
            Nessun borgo registrato per questa regione al momento.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {borghi.map((b) => (
              <BorgoCard key={b.slug} b={b} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
