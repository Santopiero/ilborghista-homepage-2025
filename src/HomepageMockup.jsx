// src/HomepageMockup.jsx
import { useState, useRef, useEffect } from "react";
import { MapPin, Clock, Search, Star, User, Bell, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  getCurrentUser,
  listLatestVideos,
  getCreator,
  createThread,
  searchNavigateTarget,
} from "./lib/store";
import { BORGI_INDEX, BORGI_BY_SLUG } from "./data/borghi";
import { enableNotifications } from "./lib/pushClient";

export default function HomepageMockup() {
  const navigate = useNavigate();

  const HERO_IMAGE_URL =
    "https://images.unsplash.com/photo-1520974735194-6c1f1c1d0b35?q=80&w=1600&auto=format&fit=crop";
  const FALLBACK_IMG =
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop";
  const onImgErr = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = FALLBACK_IMG;
  };

  const [query, setQuery] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);

  // ---------- PUSH UI state ----------
  const supportsPush =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  const [notifOn, setNotifOn] = useState(
    supportsPush && Notification.permission === "granted"
  );

  const [showPushBar, setShowPushBar] = useState(false);

  // ====== Forza popup via ?forcePushModal=1 (per test/demo) ======
  const [forceModal] = useState(() => {
    try {
      const u = new URL(window.location.href);
      return u.searchParams.get("forcePushModal") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      // init banner mobile solo se supportato, non già accettato, non già chiuso
      const dismissed = localStorage.getItem("hidePushBar") === "1";
      if (supportsPush && Notification.permission === "default" && !dismissed) {
        setShowPushBar(true);
      }
    } catch {}
  }, [supportsPush]);

  async function onEnablePush() {
    try {
      await enableNotifications();
      setNotifOn(true);
      setShowPushBar(false);
      setShowPushModal(false);
      try {
        localStorage.setItem("hidePushBar", "1");
        // dopo attivazione non riproporre più (1 anno)
        localStorage.setItem(MODAL_NEXT_KEY, String(Date.now() + 365 * DAY));
        localStorage.setItem(MODAL_STAGE_KEY, String(INTERVALS.length - 1));
      } catch {}
      alert("Notifiche attivate ✔");
    } catch (e) {
      alert("Attivazione non riuscita: " + (e?.message || e));
    }
  }

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("grazie") === "1") {
        setSignupSuccess(true);
        url.searchParams.delete("grazie");
        window.history.replaceState({}, "", url.pathname + url.hash);
      }
    } catch {}
  }, []);

  function handleSearch(e) {
    e?.preventDefault?.();
    const target = searchNavigateTarget(query);
    if (target.type === "borgo") navigate(`/borghi/${target.slug}`);
    else if (target.type === "poi") navigate(`/borghi/${target.slug}/poi/${target.poiId}`);
    else navigate(`/cerca?q=${encodeURIComponent(query)}`);
  }

  function startChat(creatorId) {
    const user = getCurrentUser();
    const thread = createThread({ creatorId, userId: user.id });
    navigate(`/chat/${thread.id}`);
  }

  /* ---------------- POPUP NOTIFICHE con schedule progressivo ---------------- */
  const DAY = 24 * 60 * 60 * 1000;
  // sequenza riproposizioni dopo "Più tardi": 3 giorni → 3 mesi → 6 mesi → 1 anno
  const INTERVALS = [3 * DAY, 90 * DAY, 180 * DAY, 365 * DAY];
  const MODAL_NEXT_KEY = "pushModalNextAt";
  const MODAL_STAGE_KEY = "pushModalStage";

  const [showPushModal, setShowPushModal] = useState(false);

  // Mostra popup:
  // - dopo 6s se supportato e permesso "default" e non rimandato
  // - OPPURE sempre (dopo 100ms) se ?forcePushModal=1
  useEffect(() => {
    if (!supportsPush) return;

    if (forceModal) {
      const t = setTimeout(() => setShowPushModal(true), 100);
      return () => clearTimeout(t);
    }

    if (Notification.permission !== "default") return;

    const now = Date.now();
    let nextAt = 0;
    try {
      nextAt = Number(localStorage.getItem(MODAL_NEXT_KEY) || 0);
    } catch {}

    if (now < nextAt) return;

    const t = setTimeout(() => setShowPushModal(true), 6000);
    return () => clearTimeout(t);
  }, [supportsPush, forceModal]);

  // se compare il popup, nascondo la barretta mobile per non duplicare
  useEffect(() => {
    if (showPushModal) setShowPushBar(false);
  }, [showPushModal]);

  function postponeModal() {
    try {
      const raw = localStorage.getItem(MODAL_STAGE_KEY);
      // stage corrente (parte da 0). Se assente, 0.
      let stage = Math.max(0, Number.isFinite(+raw) ? +raw : 0);
      const idx = Math.min(stage, INTERVALS.length - 1);
      const nextAt = Date.now() + INTERVALS[idx];
      localStorage.setItem(MODAL_NEXT_KEY, String(nextAt));
      // avanza stage, ma resta bloccato all'ultimo (1 anno)
      stage = Math.min(stage + 1, INTERVALS.length - 1);
      localStorage.setItem(MODAL_STAGE_KEY, String(stage));
    } catch {}
    setShowPushModal(false);
  }

  function neverShowModal() {
    try {
      // blocca per 1 anno (ultimo step) e imposta stage all'ultimo
      localStorage.setItem(MODAL_NEXT_KEY, String(Date.now() + 365 * DAY));
      localStorage.setItem(MODAL_STAGE_KEY, String(INTERVALS.length - 1));
    } catch {}
    setShowPushModal(false);
  }

  /* ---------- PRIMITIVE ---------- */
  function Carousel({ images = [], heightClass = "h-40", rounded = "rounded-2xl" }) {
    const [idx, setIdx] = useState(0);
    const startX = useRef(0), endX = useRef(0);
    const clamp = (n) => (n < 0 ? images.length - 1 : n >= images.length ? 0 : n);
    const go = (n) => setIdx(clamp(n));
    return (
      <div
        className={`relative w-full overflow-hidden ${rounded}`}
        onTouchStart={(e) => (startX.current = e.touches[0].clientX)}
        onTouchMove={(e) => (endX.current = e.touches[0].clientX)}
        onTouchEnd={() => {
          const d = endX.current - startX.current;
          if (Math.abs(d) > 40) (d < 0 ? go(idx + 1) : go(idx - 1));
        }}
      >
        <div
          className={`flex ${heightClass} transition-transform duration-500`}
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {images.map((src, i) => (
            <img key={i} loading="lazy" src={src} alt="" className={`w-full ${heightClass} object-cover flex-shrink-0`} onError={onImgErr}/>
          ))}
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Vai alla foto ${i + 1}`}
                className={`w-2.5 h-2.5 rounded-full transition ${i === idx ? "bg-white shadow ring-1 ring-black/10" : "bg-white/60 hover:bg-white"}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ---------- SERVIZI: solo testo centrato ---------- */
  const ServiceTile = ({ img, label, href = "#" }) => (
    <Link to={href} className="group relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition ring-1 ring-[#E1B671]/70 bg-white" aria-label={label}>
      <img loading="lazy" src={img} alt={label} className="absolute inset-0 w-full h-full object-cover duration-300 group-hover:scale-105" onError={onImgErr}/>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative grid place-items-center h-48 sm:h-56 p-6">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow text-center">{label}</h3>
      </div>
    </Link>
  );

  /* ---------- BORGO CARD ---------- */
  const formatIt = (n, d = 1) => (typeof n === "number" ? n.toLocaleString("it-IT", { minimumFractionDigits: d, maximumFractionDigits: d }) : n);
  const BORGI_EXTRA = {
    viggiano: {
      borgoName: "Viggiano",
      title: "La Città dell’Arpa e di Maria",
      currentEvent: "La festa della Madonna Nera",
      ratingAvg: 4.6,
      ratingCount: 128,
    },
  };

  const BorgoCard = ({ b }) => {
    const extra = BORGI_EXTRA[b.slug] || {};
    const name = extra.borgoName || b.name;
    const title = extra.title || b.title || b.tagline || `Scopri ${name}`;
    const currentEvent = extra.currentEvent;
    const hasRating = typeof extra.ratingAvg === "number" && typeof extra.ratingCount === "number" && extra.ratingCount > 0;

    return (
      <Link to={`/borghi/${b.slug}`} className="group overflow-hidden rounded-2xl bg-white shadow-xl hover:shadow-2xl transition min-w-[280px] max-w-[280px] snap-start" aria-label={`Apri ${name}`}>
        <div className="relative aspect-[16/9] overflow-hidden">
          <img loading="lazy" src={b.hero || FALLBACK_IMG} alt={`Veduta di ${name}`} className="w-full h-full object-cover" onError={onImgErr}/>
          <div className="absolute top-2 left-2 max-w-[82%] px-2.5 py-1 rounded-lg bg-white text-[#6B271A] text-sm font-semibold shadow">
            <span className="block truncate">{name}</span>
          </div>
        </div>
        <div className="p-4 space-y-2">
          <h3 className="text-base font-bold text-[#6B271A] leading-snug line-clamp-2">{title}</h3>
          {currentEvent && (
            <Link to={`/borghi/${b.slug}/eventi`} className="flex items-center gap-2 text-sm text-gray-700 hover:underline">
              <Clock size={16} className="text-[#6B271A]" aria-hidden="true" />
              <span>{currentEvent} – in corso</span>
            </Link>
          )}
          {hasRating && (
            <div className="flex items-center gap-1 text-sm text-gray-700">
              <span aria-hidden="true">★</span>
              <span className="font-semibold">{formatIt(extra.ratingAvg, 1)}</span>
              <span>({extra.ratingCount})</span>
            </div>
          )}
        </div>
      </Link>
    );
  };

  /* ---------- EVENTI: poster 3:4 ---------- */
  const EventPosterCard = ({
    poster,
    title,
    dateText,
    placeText,
    detailsText,
    type,
    href = "#",
    fixedWidth = true,
  }) => (
    <a
      href={href}
      className={`group overflow-hidden rounded-2xl bg-white shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition ${fixedWidth ? "min-w-[85%] max-w-[85%]" : "w-full"}`}
      aria-label={title}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img loading="lazy" src={poster || FALLBACK_IMG} alt={title} className="w-full h-full object-cover object-center" onError={onImgErr}/>
        {type && (
          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-white/95 text-[#6B271A] border border-[#E1B671] shadow">
            {type}
          </span>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="text-base font-extrabold text-[#6B271A] leading-snug line-clamp-2">{title}</h3>
        {dateText && <div className="text-sm text-gray-700">{dateText}</div>}
        {placeText && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <MapPin size={16} className="text-[#D54E30]" /> {placeText}
          </div>
        )}
        {detailsText && <div className="text-sm text-gray-600">{detailsText}</div>}
      </div>
    </a>
  );

  /* ---------- ESPERIENZA & PRODOTTO ---------- */
  const ExperienceCard = ({ images, title, location, region, meta, priceFrom, fixedWidth = true }) => (
    <article className={`overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition bg-white ${fixedWidth ? "min-w-[300px] max-w-[300px]" : "w-full"}`}>
      <div className="relative">
        <Carousel images={images} />
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#D54E30] text-white border border-[#6B271A] whitespace-nowrap">da {priceFrom}</span>
      </div>
      <div className="p-4 text-left space-y-2">
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-[#FAF5E0] text-[#6B271A] border border-[#E1B671]">Esperienza</span>
        <h3 className="text-base font-extrabold text-[#6B271A] leading-snug">{title}</h3>
        <div className="flex items-center text-sm text-gray-600 gap-2">
          <MapPin size={16} className="text-[#D54E30]" /> {location} | {region}
        </div>
        {meta && (
          <div className="flex items-center text-sm text-gray-600 gap-2">
            <Clock size={16} className="text-[#6B271A]" /> {meta}
          </div>
        )}
      </div>
    </article>
  );

  const ProductCard = ({ img, title, origin, priceFrom }) => (
    <article className="overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition bg-white min-w-[280px] max-w-[280px]">
      <div className="relative h-40 w-full">
        <img loading="lazy" src={img} alt={title} className="h-40 w-full object-cover" onError={onImgErr}/>
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#D54E30] text-white border border-[#6B271A] whitespace-nowrap">
          da {priceFrom}
        </span>
      </div>
      <div className="p-4 text-left space-y-2">
        <h3 className="text-base font-extrabold text-[#6B271A] leading-snug line-clamp-2">{title}</h3>
        {origin && (
          <div className="flex items-center text-sm text-gray-600 gap-2">
            <MapPin size={16} className="text-[#D54E30]" /> {origin}
          </div>
        )}
      </div>
    </article>
  );

  /* ---------------- HERO ---------------- */
  const HeroHeader = () => (
    <section className="relative">
      <img src={HERO_IMAGE_URL} alt="Hero Il Borghista" className="absolute inset-0 w-full h-full object-cover" onError={onImgErr}/>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 text-center text-white">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight drop-shadow-md">
          Trova cosa fare vicino a te
        </h1>
        <p className="mt-3 text-base md:text-lg drop-shadow">Eventi, esperienze e borghi in tutta Italia. Cerca e parti.</p>

        {/* === Barra con pillole RIPRISTINATA === */}
        <div className="mt-6 bg-white/95 backdrop-blur rounded-2xl p-3 md:p-4 inline-block w-full md:w-auto shadow-lg text-left">
          {/* form */}
          <form className="flex flex-col gap-3 md:flex-row md:items-center" onSubmit={handleSearch} aria-label="Ricerca">
            <label className="flex items-center gap-2 border rounded-xl px-3 py-3 w-full md:w-96 bg-white" htmlFor="query">
              <Search size={18} className="text-[#6B271A]" />
              <input
                id="query"
                className="w-full outline-none text-gray-900 placeholder:text-gray-500 caret-[#6B271A]"
                placeholder="Cerca eventi, esperienze o borghi"
                aria-label="Cosa cerchi"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <button className="ml-0 md:ml-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D54E30] text-white font-semibold self-center md:self-auto">
              <Search size={18} /> Cerca
            </button>
          </form>

          {/* pillole */}
          <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar md:flex-wrap md:overflow-visible">
            <button
              className="px-3 py-1.5 rounded-full bg-[#D54E30] text-white text-sm font-semibold whitespace-nowrap"
              onClick={() => setQuery("weekend")}
              aria-label="Filtra per questo weekend"
            >
              Questo weekend
            </button>
            <button
              className="px-3 py-1.5 rounded-full bg-[#FAF5E0] text-[#6B271A] text-sm font-semibold border border-[#E1B671] whitespace-nowrap"
              onClick={() => setQuery("vicino a me")}
              aria-label="Filtra per vicino a me"
            >
              Vicino a me
            </button>
            <button
              className="px-3 py-1.5 rounded-full bg-[#FAF5E0] text-[#6B271A] text-sm font-semibold border border-[#E1B671] whitespace-nowrap"
              onClick={() => setQuery("bambini")}
              aria-label="Filtra per con bambini"
            >
              Con bambini
            </button>
            <button
              className="px-3 py-1.5 rounded-full bg-[#FAF5E0] text-[#6B271A] text-sm font-semibold border border-[#E1B671] whitespace-nowrap"
              onClick={() => setQuery("food and wine")}
              aria-label="Filtra per Food & Wine"
            >
              Food & Wine
            </button>
            <button
              className="px-3 py-1.5 rounded-full bg-[#FAF5E0] text-[#6B271A] text-sm font-semibold border border-[#E1B671] whitespace-nowrap"
              onClick={() => setQuery("outdoor")}
              aria-label="Filtra per Outdoor"
            >
              Outdoor
            </button>
          </div>

          {/* links sotto */}
          <div className="text-sm text-gray-700 mt-2 flex items-center gap-4 justify-center">
            <span>
              Sei un Comune?{" "}
              <Link to="/registrazione-comune" className="font-semibold underline text-[#6B271A]">
                Scopri i nostri servizi
              </Link>
            </span>
            <Link to="/registrazione-creator" className="font-semibold underline text-[#6B271A]">
              Diventa creator
            </Link>
          </div>
        </div>
      </div>
    </section>
  );

  // === DATA MOCK ===
  const latestVideos = listLatestVideos(24);
  const EVENTI_QA = [
    {
      poster: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop",
      title: "La festa della Madonna Nera",
      dateText: "9–10 agosto 2025",
      placeText: "Viggiano (PZ) · Santuario",
      detailsText: "Ore 21:00 · Navette gratuite",
      type: "Sagra",
      href: "#",
    },
    {
      poster: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop",
      title: "Sapori in Piazza",
      dateText: "15 agosto 2025",
      placeText: "Viggiano (PZ) · Centro storico",
      detailsText: "Ingresso libero",
      type: "Sagra",
      href: "#",
    },
    {
      poster: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
      title: "Concerto d’estate",
      dateText: "22 agosto 2025",
      placeText: "Viggiano (PZ) · Arena",
      detailsText: "Ore 21:30",
      type: "",
      href: "#",
    },
  ];

  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <main className="space-y-12">
        {/* TOP NAV */}
        <header className="bg-white/90 backdrop-blur border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <Link to="/" className="text-xl font-extrabold text-[#6B271A]">Il Borghista</Link>
            <div className="flex items-center gap-3">
              <Link to="/creator" className="text-sm font-semibold underline text-[#6B271A]">Creators</Link>

              {/* 🔔 Attiva notifiche nell'header (nascosta quando il popup è visibile) */}
              {supportsPush && !(showPushModal && (Notification.permission === "default" || forceModal)) && (
                <button
                  type="button"
                  onClick={onEnablePush}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#E1B671] text-[#6B271A] px-3 py-2 font-semibold hover:bg-[#FAF5E0]"
                >
                  <Bell size={18} />
                  {notifOn ? "Notifiche attive" : "Attiva notifiche"}
                </button>
              )}

              <Link to="/registrazione-comune" className="inline-flex items-center gap-2 rounded-xl border border-[#E1B671] text-[#6B271A] px-3 py-2 font-semibold hover:bg-[#FAF5E0]">
                <User size={18} /> Registrati
              </Link>
            </div>
          </div>

          {/* Barretta mobile CTA notifiche */}
          {supportsPush && showPushBar && (
            <div className="md:hidden bg-amber-50 text-[#6B271A] border-t border-b border-amber-200">
              <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  <span className="text-sm">Attiva le notifiche per sagre ed eventi vicino a te</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onEnablePush}
                    className="text-sm font-semibold px-3 py-1 rounded-lg bg-[#D54E30] text-white"
                  >
                    Attiva
                  </button>
                  <button
                    aria-label="Chiudi"
                    onClick={() => {
                      setShowPushBar(false);
                      try { localStorage.setItem("hidePushBar", "1"); } catch {}
                    }}
                    className="p-1 rounded-lg hover:bg-amber-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </header>

        {signupSuccess && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="rounded-xl bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm">✅ Grazie! Iscrizione completata correttamente.</div>
          </div>
        )}

        {/* HERO */}
        <HeroHeader />

        {/* SERVIZI */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#6B271A]">Servizi</h2>
            <a href="#" className="text-sm font-semibold underline">Vedi tutti</a>
          </div>
          <div className="mt-4 relative md:hidden">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-white to-transparent rounded-l-2xl" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white to-transparent rounded-r-2xl" />
            <div className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2" style={{ WebkitOverflowScrolling: "touch" }}>
              <div className="min-w-[66%]"><ServiceTile img="https://images.unsplash.com/photo-1532635224-4786e6e86e18?q=80&w=1400&auto=format&fit=crop" label="Esperienze" /></div>
              <div className="min-w-[66%]"><ServiceTile img="https://images.unsplash.com/photo-1615141982883-c7ad0f24f0ff?q=80&w=1400&auto=format&fit=crop" label="Prodotti tipici" /></div>
              <div className="min-w-[66%]"><ServiceTile img="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1400&auto=format&fit=crop" label="Noleggio auto" /></div>
            </div>
          </div>
          <div className="mt-5 hidden md:grid grid-cols-3 gap-6">
            <div className="h-56"><ServiceTile img="https://images.unsplash.com/photo-1532635224-4786e6e86e18?q=80&w=1600&auto=format&fit=crop" label="Esperienze" /></div>
            <div className="h-56"><ServiceTile img="https://images.unsplash.com/photo-1615141982883-c7ad0f24f0ff?q=80&w=1600&auto=format&fit=crop" label="Prodotti tipici" /></div>
            <div className="h-56"><ServiceTile img="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1600&auto=format&fit=crop" label="Noleggio auto" /></div>
          </div>
        </section>

        {/* VIDEO CREATOR */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#6B271A]">Video dei creator</h2>
            <Link to="/creator" className="text-sm font-semibold underline">Vedi tutti</Link>
          </div>
          <div className="mt-4 md:hidden">
            <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4" style={{ WebkitOverflowScrolling: "touch" }}>
              {listLatestVideos(24).map((v) => {
                const c = getCreator(v.creatorId);
                const name = v.creatorName || c?.name || "Creator";
                const level = v.level || c?.level || "—";
                const idTo = v.creatorId || v.id;
                const borgo = BORGI_BY_SLUG[v.borgoSlug];
                return (
                  <article key={v.id} className="overflow-hidden rounded-2xl bg-white shadow-xl hover:shadow-2xl transition min-w-[300px] max-w-[300px] flex-shrink-0 snap-start">
                    <div className="aspect-[16/9] overflow-hidden">
                      <img src={v.thumbnail || v.cover || FALLBACK_IMG} alt={`Video di ${name}`} className="w-full h-full object-cover" loading="lazy" onError={onImgErr}/>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-extrabold text-[#6B271A] truncate">{name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF5E0] text-[#6B271A] border border-[#E1B671] shrink-0">{level}</span>
                      </div>
                      {borgo && (
                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                          <MapPin size={16} className="text-[#D54E30]" /> {borgo.name}
                        </div>
                      )}
                      <div className="mt-3 flex items-center justify-end">
                        <Link to={`/chat?to=${encodeURIComponent(idTo)}`} aria-label={`Contatta ${name}`} className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#D54E30] text-white">
                          <User size={18} />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
          <div className="mt-4 hidden md:grid grid-cols-4 gap-5">
            {listLatestVideos(24).slice(0, 4).map((v) => {
              const c = getCreator(v.creatorId);
              const name = v.creatorName || c?.name || "Creator";
              const level = v.level || c?.level || "—";
              const idTo = v.creatorId || v.id;
              const borgo = BORGI_BY_SLUG[v.borgoSlug];
              return (
                <article key={v.id} className="overflow-hidden rounded-2xl bg-white shadow-xl hover:shadow-2xl transition">
                  <div className="aspect-[16/9] overflow-hidden">
                    <img src={v.thumbnail || v.cover || FALLBACK_IMG} alt={`Video di ${name}`} className="w-full h-full object-cover" loading="lazy" onError={onImgErr}/>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-extrabold text-[#6B271A] truncate">{name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF5E0] text-[#6B271A] border border-[#E1B671] shrink-0">{level}</span>
                    </div>
                    {borgo && (
                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                        <MapPin size={16} className="text-[#D54E30]" /> {borgo.name}
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-end">
                      <Link to={`/chat?to=${encodeURIComponent(idTo)}`} aria-label={`Contatta ${name}`} className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#D54E30] text-white">
                        <User size={18} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* BORGHIDASCOPRIRE */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#6B271A]">Borghi da scoprire…</h2>
            <a href="#" className="text-sm font-semibold underline">Vedi tutti</a>
          </div>
          <div className="mt-3 flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory" style={{ WebkitOverflowScrolling: "touch" }}>
            {BORGI_INDEX.map((b) => (
              <BorgoCard key={b.slug} b={b} />
            ))}
          </div>
        </section>

        {/* PROSSIMI EVENTI */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#6B271A]">Prossimi eventi</h2>
            <a href="#" className="text-sm font-semibold underline">Vedi tutti</a>
          </div>
          <div className="mt-4 md:hidden flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x snap-mandatory" style={{ WebkitOverflowScrolling: "touch" }}>
            {EVENTI_QA.map((e, i) => (
              <EventPosterCard key={i} fixedWidth {...e} />
            ))}
          </div>
          <div className="mt-4 hidden md:grid grid-cols-3 lg:grid-cols-4 gap-5">
            {EVENTI_QA.map((e, i) => (
              <EventPosterCard key={i} fixedWidth={false} {...e} />
            ))}
          </div>
        </section>

        {/* PRODOTTI TIPICI */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#6B271A]">Prodotti tipici</h2>
            <a href="#" className="text-sm font-semibold underline">Vedi tutti</a>
          </div>
          <div className="mt-4 flex gap-5 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory" style={{ WebkitOverflowScrolling: "touch" }}>
            {[
              { img: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=1200&auto=format&fit=crop", title: "Formaggio di malga", origin: "Asiago (VI) | Veneto", priceFrom: "€7" },
              { img: "https://images.unsplash.com/photo-1505575972945-280b8f1e5d16?q=80&w=1200&auto=format&fit=crop", title: "Salumi tipici", origin: "Norcia (PG) | Umbria", priceFrom: "€9" },
              { img: "https://images.unsplash.com/photo-1514515411904-65fa19574d07?q=80&w=1200&auto=format&fit=crop", title: "Olio EVO del Garda", origin: "Garda (VR) | Veneto", priceFrom: "€6" },
              { img: "https://images.unsplash.com/photo-1543352634-8730a9c79dc5?q=80&w=1200&auto=format&fit=crop", title: "Vino Montepulciano", origin: "Montepulciano (SI) | Toscana", priceFrom: "€12" },
            ].map((p, i) => (
              <ProductCard key={i} {...p} />
            ))}
          </div>
        </section>

        {/* CTA NEWSLETTER */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl bg-[#FAF5E0] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Star className="text-[#6B271A]" />
              <div>
                <div className="text-[#6B271A] font-extrabold">Non perdere i prossimi eventi</div>
                <div className="text-gray-700 text-sm">Iscriviti: inviamo solo segnalazioni utili</div>
              </div>
            </div>
            <form className="flex w-full md:w-auto gap-2" onSubmit={(e) => e.preventDefault()}>
              <input className="flex-1 md:w-80 border rounded-xl px-3 py-2" placeholder="La tua email" aria-label="Email" />
              <button className="px-4 py-2 rounded-xl bg-[#D54E30] text-white font-semibold">Iscrivimi</button>
            </form>
          </div>
        </section>

        <footer className="border-t">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-sm text-gray-600 flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
            <div>© {new Date().getFullYear()} Il Borghista — Tutti i diritti riservati</div>
            <div className="flex gap-4">
              <a href="#" className="hover:underline">Privacy</a>
              <a href="#" className="hover:underline">Cookie</a>
              <Link to="/creator" className="hover:underline">Creator</Link>
            </div>
          </div>
        </footer>
      </main>

      {/* ======= POPUP NOTIFICHE ======= */}
      {supportsPush && showPushModal && (Notification.permission === "default" || forceModal) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Attiva notifiche">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 sm:p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#6B271A]/10">
                <Bell className="h-5 w-5 text-[#6B271A]" />
              </span>
              <div className="flex-1">
                <h3 className="text-lg font-extrabold text-[#6B271A]">Vuoi ricevere le novità del tuo territorio?</h3>
                <p className="mt-1 text-sm text-neutral-700">
                  Ti avviseremo solo per <strong>sagre, eventi e offerte vicino a te</strong>. Zero spam, promesso.
                </p>
              </div>
              <button
                aria-label="Chiudi"
                onClick={postponeModal}
                className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                onClick={onEnablePush}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D54E30] px-4 py-2 font-semibold text-white hover:opacity-95"
              >
                <Bell className="h-4 w-4" /> Attiva notifiche
              </button>
              <button
                onClick={postponeModal}
                className="inline-flex items-center justify-center rounded-xl border px-4 py-2 font-semibold text-[#6B271A] hover:bg-neutral-50"
              >
                Più tardi
              </button>
              <button
                onClick={neverShowModal}
                className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
              >
                No, grazie
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
