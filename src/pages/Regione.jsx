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
  basilicata: "https://images.unsplash.com/photo-1583316058389-2a2a60e96c9d?q=80&w=1920&auto=format&fit=crop",
  puglia: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1920&auto=format&fit=crop",
  toscana: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1920&auto=format&fit=crop",
};

const REGION_SUBTITLE = {
  basilicata: "Borghi tra monti e calanchi",
  puglia: "Mare, trulli e masserie",
  toscana: "Colline, arte e vino",
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

// Eventi → range date
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
function getPresetRange(periodKey) {
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
    if (!hit) return false; // AND logico fra le pillole selezionate
  }
  return true;
}

/* ============================ UI Components ============================ */

function Hero({ image, title, subtitle }) {
  return (
    <section className="relative h-[38vh] md:h-[48vh]">
      <img
        src={image || FALLBACK_IMG}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover"
        onError={onImgErr}
      />
      <div className="absolute inset-0 bg-black/35" />
      <div className="relative max-w-6xl mx-auto h-full px-4 sm:px-6 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white drop-shadow">{title}</h1>
        <p className="mt-2 text-white/95 text-base sm:text-lg drop-shadow">
          {subtitle || `Scopri i borghi più belli della ${title}`}
        </p>
      </div>
    </section>
  );
}

/** Barra filtri — i popover sono overlay fissati (funzionano anche su desktop) */
function FilterBar({
  themeSet, toggleTheme,
  periodPreset, setPeriodPreset,
  dateFrom, setDateFrom,
  dateTo, setDateTo,
  onlyVideo, setOnlyVideo,
}) {
  const [themesOpen, setThemesOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const selectedThemesCount = themeSet.size;

  useEffect(() => {
    const onKey = (e) => (e.key === "Escape") && (setThemesOpen(false), setPeriodOpen(false));
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hasCustom = !!(dateFrom && dateTo);
  const periodBadge =
    hasCustom
      ? `${dateFrom.replaceAll("-", "/")} → ${dateTo.replaceAll("-", "/")}`
      : periodPreset === "weekend"
      ? "Weekend"
      : periodPreset === "2weeks"
      ? "2 settimane"
      : periodPreset === "month"
      ? "Questo mese"
      : "";

  return (
    <div className="sticky top-[56px] md:top-[66px] z-40 bg-white/90 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2">
        <div
          className="flex items-center gap-2 overflow-x-auto pb-2"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* COSA CERCHI */}
          <button
            type="button"
            onClick={() => { setThemesOpen(true); setPeriodOpen(false); }}
            className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-full border bg-white text-[#6B271A]"
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

          {/* PERIODO */}
          <button
            type="button"
            onClick={() => { setPeriodOpen(true); setThemesOpen(false); }}
            className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-full border bg-white text-[#6B271A]"
            aria-expanded={periodOpen}
            aria-haspopup="dialog"
          >
            <Calendar className="w-4 h-4" />
            <span className="font-semibold">Periodo</span>
            {periodBadge && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-[#FAF5E0] border border-[#E1B671] whitespace-nowrap">
                {periodBadge}
              </span>
            )}
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* CON VIDEO */}
          <button
            type="button"
            onClick={() => setOnlyVideo((v) => !v)}
            className={`shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-full border ${
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

      {/* SHEET “Cosa cerchi” (overlay fisso) */}
      {themesOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setThemesOpen(false)} />
          <div
            role="dialog"
            aria-label="Cosa cerchi"
            className="fixed left-1/2 -translate-x-1/2 top-[72px] w-[92vw] max-w-2xl z-[60] rounded-2xl bg-white shadow-xl ring-1 ring-black/10 p-4"
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

            {themeSet.size > 0 && (
              <div className="mt-3 text-sm text-gray-700">
                {themeSet.size} selezionati • clicca di nuovo per deselezionare
              </div>
            )}
          </div>
        </>
      )}

      {/* SHEET “Periodo” (overlay fisso) */}
      {periodOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setPeriodOpen(false)} />
          <div
            role="dialog"
            aria-label="Periodo"
            className="fixed left-1/2 -translate-x-1/2 top-[72px] w-[92vw] max-w-xl z-[60] rounded-2xl bg-white shadow-xl ring-1 ring-black/10 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="font-extrabold text-[#6B271A]">Periodo</div>
              <button
                className="inline-flex items-center gap-1.5 text-sm px-2 py-1.5 rounded-lg border"
                onClick={() => setPeriodOpen(false)}
              >
                <X className="w-3.5 h-3.5" /> Chiudi
              </button>
            </div>

            {/* Preset */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: "", label: "Tutto il periodo" },
                { key: "weekend", label: "Questo weekend" },
                { key: "2weeks", label: "Prossime 2 settimane" },
                { key: "month", label: "Questo mese" },
              ].map((opt) => {
                const active = periodPreset === opt.key && !dateFrom && !dateTo;
                return (
                  <button
                    key={opt.key || "all"}
                    className={`px-3 py-1.5 rounded-full border text-sm ${
                      active ? "bg-[#6B271A] text-white border-[#6B271A]" : "bg-white text-[#6B271A]"
                    }`}
                    onClick={() => {
                      setDateFrom("");
                      setDateTo("");
                      setPeriodPreset(opt.key);
                    }}
                    aria-pressed={active}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Custom date range */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr,auto,auto] items-end gap-2">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Dal</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setPeriodPreset("");
                    setDateFrom(e.target.value);
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="hidden sm:block text-center pb-2">→</div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Al</label>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => {
                    setPeriodPreset("");
                    setDateTo(e.target.value);
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="hidden sm:block" />
              <div className="flex gap-2">
                <button
                  className="px-3 py-2 rounded-lg border"
                  onClick={() => { setDateFrom(""); setDateTo(""); setPeriodPreset(""); }}
                >
                  Azzera
                </button>
                <button
                  className="px-3 py-2 rounded-lg bg-[#6B271A] text-white"
                  onClick={() => setPeriodOpen(false)}
                >
                  Applica
                </button>
              </div>
            </div>
          </div>
        </>
      )}
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
  const subtitle = REGION_SUBTITLE[slug] || "";

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
  const [periodPreset, setPeriodPreset] = useState(""); // "", "weekend", "2weeks", "month"
  const [dateFrom, setDateFrom] = useState(""); // yyyy-mm-dd
  const [dateTo, setDateTo] = useState("");     // yyyy-mm-dd
  const [onlyVideo, setOnlyVideo] = useState(false);
  const [showMap, setShowMap] = useState(false);

  function toggleTheme(key) {
    setThemeSet((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  // Range finale: se c'è custom, vince sul preset
  const periodRange = useMemo(() => {
    if (dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    return getPresetRange(periodPreset);
  }, [dateFrom, dateTo, periodPreset]);

  // Abbiamo dati eventi?
  const anyEventsData = useMemo(
    () => allBorghi.some((b) => Array.isArray(b?.events) && b.events.length),
    [allBorghi]
  );

  // Applica filtri
  const filtered = useMemo(() => {
    let list = allBorghi;

    if (selectedProv) {
      list = list.filter(
        (b) => (getProvince(b) || "").toLowerCase() === selectedProv.toLowerCase()
      );
    }

    list = list.filter((b) => matchTheme(b, themeSet));

    if (onlyVideo) list = list.filter((b) => hasVideo(b));

    if (periodRange && anyEventsData) {
      const { from, to } = periodRange;
      list = list.filter((b) => {
        const ev = extractEventDates(b);
        return ev.some(({ s, en }) => rangesOverlap(s, en, from, to));
      });
    }

    return list.slice().sort((a, b) => String(a.name).localeCompare(String(b.name), "it"));
  }, [allBorghi, selectedProv, themeSet, onlyVideo, periodRange, anyEventsData]);

  return (
    <main className="pb-12">
      {/* HERO */}
      <Hero image={cover} title={label} subtitle={subtitle} />

      {/* FILTRI */}
      <FilterBar
        themeSet={themeSet}
        toggleTheme={toggleTheme}
        periodPreset={periodPreset}
        setPeriodPreset={setPeriodPreset}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        onlyVideo={onlyVideo}
        setOnlyVideo={setOnlyVideo}
      />

      {/* MAPPA (collassata di default) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#6B271A]">Mappa dei borghi</h2>
        </div>

        <div className="mt-3 rounded-2xl border overflow-hidden bg-white">
          <div className="px-4 sm:px-5 py-3 border-b flex items-center gap-2 justify-between">
            <div className="font-semibold text-[#6B271A]">Filtra per Provincia</div>
            <div className="flex items-center gap-2">
              <select
                value={selectedProv}
                onChange={(e) => setSelectedProv(e.target.value)}
                className="px-2.5 py-1.5 text-sm rounded-lg border bg-white"
                aria-label="Filtra per provincia"
              >
                <option value="">Tutte</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>{p}</option>
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
              <button
                type="button"
                onClick={() => setShowMap((v) => !v)}
                className="px-3 py-1.5 rounded-lg border bg-white text-[#6B271A]"
              >
                {showMap ? "Nascondi mappa" : "Apri mappa"}
              </button>
            </div>
          </div>
          {showMap ? (
            <div className="h-64 md:h-[420px] grid place-items-center text-sm text-gray-600">
              {/* TODO: integra Leaflet/Mapbox */}
              <div className="text-center px-4">
                <div className="font-semibold text-[#6B271A]">Mappa interattiva in arrivo</div>
                <div>
                  Seleziona la <b>Provincia</b> sopra o tocca la mappa (quando attiva) per filtrare.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 text-sm text-gray-700">Mappa chiusa.</div>
          )}
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
