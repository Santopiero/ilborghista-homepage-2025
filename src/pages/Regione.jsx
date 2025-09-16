// src/pages/Regione.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, Calendar, ChevronDown, X } from "lucide-react";
import { BORGI_INDEX } from "../data/borghi";

/* ====================== Utils & costanti base ====================== */

const REGION_LABELS = {
  abruzzo: "Abruzzo", basilicata: "Basilicata", calabria: "Calabria", campania: "Campania",
  "emilia-romagna": "Emilia-Romagna", "friuli-venezia-giulia": "Friuli-Venezia Giulia", lazio: "Lazio",
  liguria: "Liguria", lombardia: "Lombardia", marche: "Marche", molise: "Molise", piemonte: "Piemonte",
  puglia: "Puglia", sardegna: "Sardegna", sicilia: "Sicilia", toscana: "Toscana",
  "trentino-alto-adige": "Trentino-Alto Adige", umbria: "Umbria", "valle-d-aosta": "Valle d’Aosta", veneto: "Veneto",
};

const REGION_COVER = {
  basilicata:
    "https://images.unsplash.com/photo-1583316058389-2a2a60e96c9d?q=80&w=1920&auto=format&fit=crop",
  puglia:
    "https://images.unsplash.com/photo-1519681393784-d120267933ba3ee?q=80&w=1920&auto=format&fit=crop",
  toscana:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1920&auto=format&fit=crop",
};

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop";

const onImgErr = (e) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = FALLBACK_IMG;
};

function getProvince(b) {
  return b?.province || b?.provincia || b?.prov || b?.provAbbr || b?.provinciaSigla || "";
}
function hasVideo(b) {
  return Boolean(
    b?.videoCount ||
      b?.hasVideo ||
      b?.hasVideos ||
      (Array.isArray(b?.videos) && b.videos.length > 0)
  );
}

// Normalizza eventi: accetta item con date singole o range
function extractEventDates(b) {
  const arr = Array.isArray(b?.events) ? b.events : [];
  return arr
    .map((e) => {
      const start = e?.start || e?.date || e?.from || e?.when;
      const end = e?.end || e?.to || e?.date;
      const s = start ? new Date(start) : null;
      const en = end ? new Date(end) : s;
      return s && en ? { s, en } : null;
    })
    .filter(Boolean);
}
function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && bStart <= aEnd;
}
function getPeriodRange(periodKey) {
  if (!periodKey) return null;
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  if (periodKey === "weekend") {
    const day = now.getDay(); // 0=dom, 6=sab
    const daysToSat = (6 - day + 7) % 7;
    const sat = new Date(startOfDay);
    sat.setDate(sat.getDate() + daysToSat);
    const sun = new Date(sat);
    sun.setDate(sun.getDate() + 1);
    sun.setHours(23, 59, 59, 999);
    return { from: sat, to: sun };
  }
  if (periodKey === "2weeks") {
    const from = startOfDay;
    const to = new Date(endOfDay);
    to.setDate(to.getDate() + 13);
    return { from, to };
  }
  if (periodKey === "month") {
    const from = startOfDay;
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { from, to };
  }
  return null;
}

/* ====================== Filtri: definizioni ====================== */

// Temi (cosa cerchi) — match su b.tags (string[])
const THEMES = [
  { key: "sagre", label: "Sagre & feste", aliases: ["sagre", "feste", "sagra", "evento"] },
  { key: "food", label: "Enogastronomia", aliases: ["food", "enogastronomia", "cibo", "vino", "degustazioni"] },
  { key: "trek", label: "Trekking & natura", aliases: ["trek", "trekking", "natura", "outdoor", "sentieri", "cammini"] },
  { key: "arte", label: "Arte & storia", aliases: ["arte", "storia", "museo", "castello", "chiesa", "borghistorico"] },
  { key: "view", label: "Panoramici", aliases: ["panoramico", "fotogenico", "belvedere", "scorci", "panoramici", "view"] },
];

function matchTheme(b, selectedKeys) {
  if (selectedKeys.size === 0) return true;
  const tags = (b?.tags || []).map((t) => String(t).toLowerCase());
  if (tags.length === 0) return false;
  for (const t of THEMES) {
    if (!selectedKeys.has(t.key)) continue;
    const hit = t.aliases.some((a) => tags.includes(a));
    if (!hit) return false; // tutte le pillole selezionate devono matchare (AND)
  }
  return true;
}

/* ============================ UI Components ============================ */

function Hero({ image, title }) {
  return (
    <section className="relative h-[42vh] md:h-[56vh]">
      <img
        src={image || FALLBACK_IMG}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover"
        onError={onImgErr}
      />
      <div className="absolute inset-0 bg-black/35" />
      <div className="relative max-w-6xl mx-auto h-full px-4 sm:px-6 flex flex-col justify-end pb-8">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white drop-shadow">{title}</h1>
      </div>
    </section>
  );
}

function FilterBar({ themeSet, toggleTheme, period, setPeriod, onlyVideo, setOnlyVideo }) {
  const [themesOpen, setThemesOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const selectedThemesCount = themeSet.size;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setThemesOpen(false);
        setPeriodOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="sticky top-[56px] md:top-[66px] z-40 bg-white/90 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-8">
        {/* COSA CERCHI -> pannello con chip */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setThemesOpen((v) => !v);
              setPeriodOpen(false);
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white text-[#6B271A]"
            aria-expanded={themesOpen}
            aria-haspopup="dialog"
          >
            <span className="font-semibold">Cosa cerchi</span>
            {selectedThemesCount > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-[#FAF5E0] border border-[#E1B671]">
                {selectedThemesCount}
              </span>
            )}
            <ChevronDown className="w-4 h-4" />
          </button>

          {themesOpen && (
            <>
              <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setThemesOpen(false)} />
              <div
                role="dialog"
                aria-label="Cosa cerchi"
                className="fixed left-1/2 -translate-x-1/2 bottom-4 w-[92vw] max-w-2xl z-50 rounded-2xl bg-white shadow-xl ring-1 ring-black/10 p-4 sm:bottom-auto sm:top-[88px]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-extrabold text-[#6B271A]">Cosa cerchi</div>
                  <button
                    className="inline-flex items-center gap-1.5 text-sm px-2 py-1.5 rounded-lg border"
                    onClick={() => setThemesOpen(false)}
                  >
                    <X className="w-3.5 h-3.5" /> Chiudi
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {THEMES.map((t) => {
                    const active = themeSet.has(t.key);
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => toggleTheme(t.key)}
                        aria-pressed={active}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm border transition ${
                          active
                            ? "bg-[#6B271A] text-white border-[#6B271A]"
                            : "bg-white text-[#6B271A] border-[#E1B671]"
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>

                {selectedThemesCount > 0 && (
                  <div className="mt-3 text-sm text-gray-700">
                    {selectedThemesCount} selezionati • clicca di nuovo per deselezionare
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* PERIODO */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setPeriodOpen((v) => !v);
              setThemesOpen(false);
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white text-[#6B271A]"
            aria-expanded={periodOpen}
          >
            <Calendar className="w-4 h-4" />
            <span className="font-semibold">Periodo</span>
            {period && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-[#FAF5E0] border border-[#E1B671]">
                {period === "weekend"
                  ? "Questo weekend"
                  : period === "2weeks"
                  ? "Prossime 2 settimane"
                  : "Questo mese"}
              </span>
            )}
            <ChevronDown className="w-4 h-4" />
          </button>

          {periodOpen && (
            <>
              <div className="fixed inset-0 bg-transparent z-40" onClick={() => setPeriodOpen(false)} />
              <div className="absolute mt-2 w-60 rounded-xl border bg-white shadow-xl overflow-hidden z-50">
                {[
                  { key: "", label: "Tutto il periodo" },
                  { key: "weekend", label: "Questo weekend" },
                  { key: "2weeks", label: "Prossime 2 settimane" },
                  { key: "month", label: "Questo mese" },
                ].map((opt) => (
                  <button
                    key={opt.key || "all"}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 ${
                      period === opt.key ? "font-semibold text-[#6B271A]" : ""
                    }`}
                    onClick={() => {
                      setPeriod(opt.key);
                      setPeriodOpen(false);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* SOLO BORGH I CON VIDEO */}
        <button
          type="button"
          onClick={() => setOnlyVideo((v) => !v)}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${
            onlyVideo ? "bg-[#6B271A] text-white border-[#6B271A]" : "bg-white text-[#6B271A]"
          }`}
          aria-pressed={onlyVideo}
          title="Mostra solo borghi con video"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
          <span>Con video</span>
        </button>
      </div>
    </div>
  );
}

function BorgoCard({ b }) {
  const name = b?.name || "Borgo";
  const prov = getProvince(b);
  const video = hasVideo(b);
  return (
    <Link
      to={`/borghi/${b.slug}`}
      className="group overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition block"
      aria-label={`Apri ${name}`}
    >
      <div className="relative aspect-[16/9]">
        <img
          src={b?.hero || FALLBACK_IMG}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] duration-300"
          onError={onImgErr}
        />
        <span className="absolute top-2 left-2 max-w-[80%] px-2.5 py-1 rounded-lg bg-white text-[#6B271A] text-sm font-semibold shadow">
          {name}
        </span>
        {video && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#D54E30] text-white border border-[#6B271A]">
            Video
          </span>
        )}
      </div>
      <div className="p-4 text-sm text-gray-700 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[#D54E30]" />
        <span className="truncate">
          {prov && `${prov} · `}
          {b?.region || ""}
        </span>
      </div>
    </Link>
  );
}

/* ================================ Pagina ================================ */

export default function Regione() {
  const { slug } = useParams();
  const label = REGION_LABELS[slug] || "Regione";
  const cover = REGION_COVER[slug] || FALLBACK_IMG;

  // Borghi della regione
  const allBorghi = useMemo(
    () =>
      BORGI_INDEX.filter(
        (b) =>
          b?.regionSlug === slug ||
          b?.regioneSlug === slug ||
          (b?.region || "").toLowerCase() === label.toLowerCase()
      ),
    [slug, label]
  );

  // Province presenti
  const provinces = useMemo(() => {
    const set = new Set();
    allBorghi.forEach((b) => {
      const p = getProvince(b);
      if (p) set.add(p);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "it"));
  }, [allBorghi]);

  // Stato filtri
  const [selectedProv, setSelectedProv] = useState("");
  const [themeSet, setThemeSet] = useState(() => new Set()); // multi
  const [period, setPeriod] = useState(""); // "", "weekend", "2weeks", "month"
  const [onlyVideo, setOnlyVideo] = useState(false);

  function toggleTheme(key) {
    setThemeSet((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  // Range periodo
  const range = useMemo(() => getPeriodRange(period), [period]);

  // C'è almeno un borgo con dati eventi?
  const anyEventsData = useMemo(
    () => allBorghi.some((b) => Array.isArray(b?.events) && b.events.length),
    [allBorghi]
  );

  const filtered = useMemo(() => {
    let list = allBorghi;

    if (selectedProv) {
      list = list.filter(
        (b) => (getProvince(b) || "").toLowerCase() === selectedProv.toLowerCase()
      );
    }

    // Cosa cerchi (temi)
    list = list.filter((b) => matchTheme(b, themeSet));

    // Solo borghi con video
    if (onlyVideo) list = list.filter((b) => hasVideo(b));

    // Periodo → se abbiamo dati eventi, filtra i borghi con almeno 1 evento nel range
    if (range && anyEventsData) {
      const { from, to } = range;
      list = list.filter((b) => {
        const ev = extractEventDates(b);
        return ev.some(({ s, en }) => rangesOverlap(s, en, from, to));
      });
    }

    return list.slice().sort((a, b) => String(a.name).localeCompare(String(b.name), "it"));
  }, [allBorghi, selectedProv, themeSet, onlyVideo, range, anyEventsData]);

  return (
    <main className="pb-12">
      {/* HERO */}
      <Hero image={cover} title={label} />

      {/* FILTRI */}
      <FilterBar
        themeSet={themeSet}
        toggleTheme={toggleTheme}
        period={period}
        setPeriod={setPeriod}
        onlyVideo={onlyVideo}
        setOnlyVideo={setOnlyVideo}
      />

      {/* MAPPA + PROVINCIA (nel pannello mappa) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        <div className="rounded-2xl border overflow-hidden bg-white">
          <div className="px-4 sm:px-5 py-3 border-b flex items-center gap-2 justify-between">
            <h2 className="text-base font-extrabold text-[#6B271A]">Mappa dei borghi</h2>
            <div className="flex items-center gap-2">
              <label className="text-sm text-[#6B271A] hidden sm:block">Provincia:</label>
              <select
                value={selectedProv}
                onChange={(e) => setSelectedProv(e.target.value)}
                className="px-2.5 py-1.5 text-sm rounded-lg border bg-white"
                aria-label="Filtra per provincia"
              >
                <option value="">Tutte</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {selectedProv && (
                <button
                  className="inline-flex items-center gap-1.5 text-sm px-2 py-1.5 rounded-lg border"
                  onClick={() => setSelectedProv("")}
                  aria-label="Rimuovi filtro provincia"
                >
                  <X className="w-3.5 h-3.5" /> Rimuovi
                </button>
              )}
            </div>
          </div>
          <div className="h-64 md:h-[420px] grid place-items-center text-sm text-gray-600">
            {/* Placeholder mappa: integra Leaflet/Mapbox qui */}
            <div className="text-center px-4">
              <div className="font-semibold text-[#6B271A]">Mappa interattiva in arrivo</div>
              <div>
                Seleziona la <b>Provincia</b> qui sopra o clicca sulla mappa (quando attiva) per
                filtrare i borghi.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LISTA BORGH I */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#6B271A]">Borghi in {label}</h2>
          <div className="text-sm text-gray-700">{filtered.length} risultati</div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 text-sm">
            Nessun borgo trovato con questi filtri.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((b) => (
              <BorgoCard key={b.slug} b={b} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
