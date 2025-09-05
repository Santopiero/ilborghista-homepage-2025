// src/HomepageMockup.jsx
import { useState, useRef, useEffect } from "react";
import { MapPin, Clock, Search, Star, User, Car, Gift, Utensils } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  getCurrentUser,
  listLatestVideos,
  getCreator,
  createThread,
  searchNavigateTarget, // <-- import esistente
} from "./lib/store";
import { BORGI_INDEX, BORGI_BY_SLUG } from "./data/borghi";

export default function HomepageMockup() {
  const navigate = useNavigate();

  const HERO_IMAGE_URL =
    "https://images.unsplash.com/photo-1520974735194-6c1f1c1d0b35?q=80&w=1600&auto=format&fit=crop";
  const FALLBACK_IMG =
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop";
  const handleImgError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = FALLBACK_IMG;
  };

  const [expanded, setExpanded] = useState(false); // eventi
  const [creatorsExpanded, setCreatorsExpanded] = useState(false); // <-- creators
  const [query, setQuery] = useState("");
  const servicesRef = useRef(null);

  // Success banner dopo submit Netlify (?grazie=1#registrazione)
  const [signupSuccess, setSignupSuccess] = useState(false);
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

  // === PARTNER: auto-scroll ===
  const partnersRef = useRef(null);
  const [partnersPaused, setPartnersPaused] = useState(false);
  useEffect(() => {
    const id = setInterval(() => {
      if (!partnersRef.current || partnersPaused) return;
      const node = partnersRef.current;
      node.scrollLeft += 1;
      if (node.scrollLeft + node.clientWidth >= node.scrollWidth - 1) {
        node.scrollLeft = 0;
      }
    }, 20);
    return () => clearInterval(id);
  }, [partnersPaused]);

  /* ------------------- Ricerca ------------------- */
  function handleSearch(e) {
    e?.preventDefault?.();
    const target = searchNavigateTarget(query);
    if (target.type === "borgo") {
      navigate(`/borghi/${target.slug}`);
    } else if (target.type === "poi") {
      navigate(`/borghi/${target.slug}/poi/${target.poiId}`);
    } else {
      navigate(`/cerca?q=${encodeURIComponent(query)}`);
    }
  }

  function startChat(creatorId) {
    const user = getCurrentUser();
    const thread = createThread({ creatorId, userId: user.id });
    navigate(`/chat/${thread.id}`);
  }

  /* ------------------- UI PRIMITIVES ------------------- */

  function Carousel({ images = [], heightClass = "h-40", rounded = "rounded-2xl" }) {
    const [idx, setIdx] = useState(0);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    const clamp = (n) => (n < 0 ? images.length - 1 : n >= images.length ? 0 : n);
    const go = (n) => setIdx(clamp(n));

    const onTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
    };
    const onTouchMove = (e) => {
      touchEndX.current = e.touches[0].clientX;
    };
    const onTouchEnd = () => {
      const delta = touchEndX.current - touchStartX.current;
      if (Math.abs(delta) > 40) {
        delta < 0 ? go(idx + 1) : go(idx - 1);
      }
    };

    return (
      <div
        className={`relative w-full overflow-hidden ${rounded}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className={`flex ${heightClass} transition-transform duration-500`}
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {images.map((src, i) => (
            <img
              key={i}
              loading="lazy"
              src={src}
              alt=""
              className={`w-full ${heightClass} object-cover flex-shrink-0`}
              onError={handleImgError}
            />
          ))}
        </div>

        {images.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Vai alla foto ${i + 1}`}
                className={`w-2.5 h-2.5 rounded-full transition ${
                  i === idx ? "bg-white shadow ring-1 ring-black/10" : "bg-white/60 hover:bg-white"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const ServiceTile = ({ img, label, icon: Icon, count }) => (
    <a
      href="#"
      className="group relative w-56 h-32 sm:w-64 sm:h-36 rounded-2xl overflow-hidden shadow-lg ring-1 ring-[#E1B671]/60 hover:ring-[#D54E30] transition"
    >
      <img
        loading="lazy"
        src={img}
        alt={label}
        className="absolute inset-0 w-full h-full object-cover duration-300 group-hover:scale-105"
        onError={handleImgError}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
      <div className="absolute top-2 left-2 flex items-center gap-2">
        {Icon ? <Icon size={20} className="text-white drop-shadow" /> : null}
        {typeof count !== "undefined" ? (
          <span className="text-[12px] font-semibold text-white bg-[#D54E30]/90 rounded-full px-2 py-0.5 shadow">
            {count}
          </span>
        ) : null}
      </div>
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white">
        <span className="text-lg font-extrabold drop-shadow">{label}</span>
        <span className="opacity-0 group-hover:opacity-100 text-[12px] bg-white/25 backdrop-blur px-2 py-0.5 rounded-full transition">
          Scopri →
        </span>
      </div>
    </a>
  );

  const BorgoTile = ({ img, name, to }) => (
    <Link to={to} className="group snap-center">
      <div className="w-40 h-24 sm:w-48 sm:h-28 rounded-xl overflow-hidden shadow-md">
        <img
          loading="lazy"
          src={img}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition"
          onError={handleImgError}
        />
      </div>
      <div className="mt-2 text-sm font-semibold text-[#6B271A]">{name}</div>
    </Link>
  );

  /* -------- Event Cards -------- */

  function EventBadgeRow({ type = "Sagra", dateText = "28 AGO – 5 SET 2025", extra = null }) {
    return (
      <div className="flex flex-col items-start gap-1">
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-[#FAF5E0] text-[#6B271A] border border-[#E1B671]">
          {type}
        </span>
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF5E0] text-[#6B271A] border border-[#E1B671]">
          {dateText}
        </span>
        {extra}
      </div>
    );
  }

  function EventCardBase({ statusChip, images, title, place, time }) {
    return (
      <article className="overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition bg-white">
        <div className="relative">
          <Carousel images={images} />
          {statusChip}
        </div>
        <div className="p-4 text-left space-y-2">
          <EventBadgeRow />
          <h3 className="text-base font-extrabold text-[#6B271A] leading-snug">{title}</h3>
          <div className="flex items-center text-sm text-gray-600 gap-2">
            <MapPin size={16} className="text-[#D54E30]" /> {place}
          </div>
          <div className="flex items-center text-sm text-gray-600 gap-2">
            <Clock size={16} className="text-[#6B271A]" /> {time}
          </div>
        </div>
      </article>
    );
  }

  const CardSagra = () => (
    <EventCardBase
      statusChip={
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-green-600 text-white border border-green-700 shadow-sm">
          In corso
        </span>
      }
      images={[
        "https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1520974735194-6c1f1c1d0b35?q=80&w=1200&auto=format&fit=crop",
      ]}
      title="52ª Festa del Lard d’Arnad D.O.P. 2025"
      place="Arnad (AO) | Valle d'Aosta"
      time="Tutti i giorni dalle 17:00"
    />
  );

  const CardSagraAnnullata = () => (
    <EventCardBase
      statusChip={
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-[#D54E30] text-white border border-[#6B271A] shadow-sm">
          Annullata
        </span>
      }
      images={[
        "https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop",
      ]}
      title="52ª Festa del Lard d’Arnad D.O.P. 2025"
      place="Arnad (AO) | Valle d'Aosta"
      time="Evento annullato"
    />
  );

  const CardConcerto = () => (
    <EventCardBase
      statusChip={null}
      images={[
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
      ]}
      title="Apulia Suona 2025"
        place="Barletta (BT) | Puglia"
      time="Ore 21:00"
    />
  );

  const CardFiera = () => (
    <EventCardBase
      statusChip={
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-[#6B271A] text-white border border-[#E1B671] shadow-sm">
          In evidenza
        </span>
      }
      images={[
        "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
      ]}
      title="Edizione 2025 – Fiera di Santa Maria"
      place="Calcinate (BG) | Lombardia"
      time="Date non confermate"
    />
  );

  /* -------- Esperienze -------- */

  const ExperienceCard = ({
    images,
    title,
    location,
    region,
    meta,
    priceFrom,
    fixedWidth = true, // mobile: card fissa per carosello
  }) => (
    <article
      className={`overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition bg-white ${
        fixedWidth ? "min-w-[300px] max-w-[300px]" : "w-full"
      }`}
    >
      <div className="relative">
        <Carousel images={images} />
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#D54E30] text-white border border-[#6B271A] whitespace-nowrap">
          da {priceFrom}
        </span>
      </div>
      <div className="p-4 text-left space-y-2">
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-[#FAF5E0] text-[#6B271A] border border-[#E1B671]">
          Esperienza
        </span>
        <h3 className="text-base font-extrabold text-[#6B271A] leading-snug">{title}</h3>
        <div className="flex items-center text-sm text-gray-600 gap-2">
          <MapPin size={16} className="text-[#D54E30]" /> {location} | {region}
        </div>
        {meta ? (
          <div className="flex items-center text-sm text-gray-600 gap-2">
            <Clock size={16} className="text-[#6B271A]" /> {meta}
          </div>
        ) : null}
      </div>
    </article>
  );

  const ProductCard = ({ img, title, origin, priceFrom }) => (
    <article className="overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition bg-white min-w-[280px] max-w-[280px]">
      <div className="h-40 w-full">
        <img loading="lazy" src={img} alt={title} className="h-40 w-full object-cover" onError={handleImgError} />
      </div>
      <div className="p-4 text-left space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-[#FAF5E0] text-[#6B271A] border border-[#E1B671]">
            Prodotto tipico
          </span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#D54E30] text-white border border-[#6B271A] whitespace-nowrap">
            da {priceFrom}
          </span>
        </div>
        <h3 className="text-base font-extrabold text-[#6B271A] leading-snug">{title}</h3>
        <div className="flex items-center text-sm text-gray-600 gap-2">
          <MapPin size={16} className="text-[#D54E30]" /> {origin}
        </div>
      </div>
    </article>
  );

  /* ---------------- HERO ---------------- */
  const HeroHeader = () => (
    <section className="relative">
      <div className="absolute inset-0">
        <img src={HERO_IMAGE_URL} alt="Hero Il Borghista" className="w-full h-full object-cover" onError={handleImgError} />
        <div className="absolute inset-0 bg-black/30" />
      </div>
      <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 text-center text-white">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight drop-shadow-md">
          Trova cosa fare vicino a te
        </h1>
        <p className="mt-3 text-base md:text-lg drop-shadow">Eventi, esperienze e borghi in tutta Italia. Cerca e parti.</p>
        <div className="mt-6 bg-white/95 backdrop-blur rounded-2xl p-3 md:p-4 inline-block w-full md:w-auto shadow-lg">
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
            <button
              className="ml-0 md:ml-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D54E30] text-white font-semibold self-center md:self-auto"
              data-event="search_submit"
            >
              <Search size={18} /> Cerca
            </button>
          </form>

          {/* Pillole */}
          <div className="mt-3">
            <div className="flex gap-2 overflow-x-auto no-scrollbar md:flex-wrap md:overflow-visible justify-center md:justify-center">
              <button
                className="px-3 py-1.5 rounded-full bg-[#D54E30] text-white text-sm font-semibold whitespace-nowrap"
                onClick={() => setQuery("Viggiano")}
              >
                Questo weekend
              </button>
              <button className="px-3 py-1.5 rounded-full bg-[#FAF5E0] text-[#6B271A] text-sm font-semibold border border-[#E1B671] whitespace-nowrap">
                Vicino a me
              </button>
              <button className="px-3 py-1.5 rounded-full bg-[#FAF5E0] text-[#6B271A] text-sm font-semibold border border-[#E1B671] whitespace-nowrap">
                Con bambini
              </button>
              <button className="px-3 py-1.5 rounded-full bg-[#FAF5E0] text-[#6B271A] text-sm font-semibold border border-[#E1B671] whitespace-nowrap">
                Food & Wine
              </button>
              <button className="px-3 py-1.5 rounded-full bg-[#FAF5E0] text-[#6B271A] text-sm font-semibold border border-[#E1B671] whitespace-nowrap">
                Outdoor
              </button>
            </div>
          </div>

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

  // === LOGHI PARTNER (placeholder) ===
  const partners = Array.from({ length: 10 }).map((_, i) => ({
    id: i + 1,
    img: `https://dummyimage.com/160x64/FAF5E0/6B271A&text=Partner+${i + 1}`,
  }));
  const partnersLoop = [...partners, ...partners];

  // === Video dei creator (homepage) ===
  const latestVideos = listLatestVideos(24); // prendiamo più elementi, mostriamo 4 e poi espandiamo

  // --- Video Creator: carosello mobile (frecce) ---
  const creatorsRef = useRef(null);
  const scrollCreators = (dir = 1) => {
    const el = creatorsRef.current;
    if (!el) return;
    const firstCard = el.querySelector("[data-creator-card]");
    const gap = 16; // tailwind gap-4
    const step = (firstCard?.offsetWidth || 300) + gap;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <>
      {/* Utility per nascondere scrollbar nei container orizzontali */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <main className="space-y-12">
        {/* TOP NAV */}
        <header className="bg-white/90 backdrop-blur border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <Link to="/" className="text-xl font-extrabold text-[#6B271A]">
              il borghista
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/creator" className="text-sm font-semibold underline text-[#6B271A]">
                Creator
              </Link>
              <Link
                to="/registrazione-comune"
                className="inline-flex items-center gap-2 rounded-xl border border-[#E1B671] text-[#6B271A] px-3 py-2 font-semibold hover:bg-[#FAF5E0]"
                data-event="auth_click"
              >
                <User size={18} /> Registrati
              </Link>
            </div>
          </div>
        </header>

        {/* Banner successo (opzionale) */}
        {signupSuccess && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="rounded-xl bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm">
              ✅ Grazie! Iscrizione completata correttamente.
            </div>
          </div>
        )}

        {/* HERO */}
        <HeroHeader />

        {/* SERVIZI */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-lg font-extrabold text-[#6B271A]">Servizi</h2>
          {/* Mobile */}
          <div className="relative mt-3 md:hidden">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-white to-transparent rounded-l-2xl"></div>
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white to-transparent rounded-r-2xl"></div>
            <div className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pr-10" ref={servicesRef}>
              <ServiceTile
                img="https://images.unsplash.com/photo-1532635224-4786e6e86e18?q=80&w=900&auto=format&fit=crop"
                label="Esperienze"
                icon={Utensils}
                count={238}
              />
              <ServiceTile
                img="https://images.unsplash.com/photo-1615141982883-c7ad0f24f0ff?q=80&w=900&auto=format&fit=crop"
                label="Prodotti tipici"
                icon={Gift}
                count={120}
              />
              <ServiceTile
                img="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=900&auto=format&fit=crop"
                label="Noleggio auto"
                icon={Car}
                count={46}
              />
            </div>
          </div>
          {/* Desktop */}
          <div className="hidden md:grid grid-cols-3 gap-5 mt-3">
            <ServiceTile
              img="https://images.unsplash.com/photo-1532635224-4786e6e86e18?q=80&w=1200&auto=format&fit=crop"
              label="Esperienze"
              icon={Utensils}
              count={238}
            />
            <ServiceTile
              img="https://images.unsplash.com/photo-1615141982883-c7ad0f24f0ff?q=80&w=1200&auto=format&fit=crop"
              label="Prodotti tipici"
              icon={Gift}
              count={120}
            />
            <ServiceTile
              img="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop"
              label="Noleggio auto"
              icon={Car}
              count={46}
            />
          </div>
        </section>

        {/* VIDEO DEI CREATOR — mobile carosello / desktop 4 + espansione */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#6B271A]">Video dei creator</h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCreatorsExpanded((v) => !v)}
                className="text-sm font-semibold underline"
                aria-expanded={creatorsExpanded}
              >
                {creatorsExpanded ? "Mostra meno" : "Guarda tutto"}
              </button>
              <Link
                to="/creator"
                className="text-sm font-semibold underline"
                aria-label="Vedi tutti i creator"
              >
                Vedi tutti
              </Link>
            </div>
          </div>

          {/* Mobile: carosello orizzontale con frecce + swipe attivo */}
          <div className="mt-4 relative md:hidden">
            <div
              ref={creatorsRef}
              className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4"
              style={{ WebkitOverflowScrolling: "touch" }}
              aria-label="Carosello video dei creator"
            >
              {latestVideos.map((v) => {
                const c = getCreator(v.creatorId);
                const name = v.creatorName || c?.name || "Creator";
                const level = v.level || c?.level || "—";
                const idTo = v.creatorId || v.id;

                return (
                  <article
                    key={v.id}
                    data-creator-card
                    className="overflow-hidden rounded-2xl bg-white shadow-xl hover:shadow-2xl transition min-w-[300px] max-w-[300px] flex-shrink-0 snap-start"
                  >
                    <div className="aspect-[16/9] overflow-hidden">
                      <img
                        src={v.thumbnail || v.cover || FALLBACK_IMG}
                        alt={`Video di ${name}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={handleImgError}
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-extrabold text-[#6B271A] truncate">{name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF5E0] text-[#6B271A] border border-[#E1B671] shrink-0">
                          {level}
                        </span>
                      </div>
                      <div className="mt-3">
                        <Link
                          to={`/chat?to=${encodeURIComponent(idTo)}`}
                          aria-label={`Contatta ${name}`}
                          className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-[#D54E30] text-white text-sm font-semibold"
                        >
                          Contatta
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
              {latestVideos.length === 0 && (
                <div className="text-sm text-gray-600">
                  Ancora nessun video. <Link to="/registrazione-creator" className="underline">Diventa creator</Link>.
                </div>
              )}
            </div>

            {/* Frecce sovrapposte (tap ≥ 44px) */}
            <button
              type="button"
              onClick={() => scrollCreators(-1)}
              aria-label="Scorri indietro"
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-11 h-11 grid place-items-center rounded-full bg-white/90 border shadow"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollCreators(1)}
              aria-label="Scorri avanti"
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-11 h-11 grid place-items-center rounded-full bg-white/90 border shadow"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Desktop: griglia 4 colonne. Se non espanso → mostra solo 4; se espanso → tutti */}
          <div className="mt-4 hidden md:grid grid-cols-4 gap-5">
            {(creatorsExpanded ? latestVideos : latestVideos.slice(0, 4)).map((v) => {
              const c = getCreator(v.creatorId);
              const name = v.creatorName || c?.name || "Creator";
              const level = v.level || c?.level || "—";
              const idTo = v.creatorId || v.id;

              return (
                <article
                  key={v.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-xl hover:shadow-2xl transition w-full"
                >
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={v.thumbnail || v.cover || FALLBACK_IMG}
                      alt={`Video di ${name}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={handleImgError}
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-extrabold text-[#6B271A] truncate">{name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF5E0] text-[#6B271A] border border-[#E1B671] shrink-0">
                        {level}
                      </span>
                    </div>
                    <div className="mt-3">
                      <Link
                        to={`/chat?to=${encodeURIComponent(idTo)}`}
                        aria-label={`Contatta ${name}`}
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-[#D54E30] text-white text-sm font-semibold"
                      >
                        Contatta
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
          <h2 className="text-lg font-extrabold text-[#6B271A]">Borghi da scoprire…</h2>
          <div className="mt-3 flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory">
            {BORGI_INDEX.map((b) => (
              <BorgoTile key={b.slug} img={b.hero} name={b.name} to={`/borghi/${b.slug}`} />
            ))}
          </div>
        </section>

        {/* PROSSIMI EVENTI & SAGRE */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#6B271A]">Prossimi eventi e sagre</h2>
            <a href="#" className="text-sm font-semibold underline flex items-center gap-1">
              Vedi tutti
            </a>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-2 overflow-x-auto no-scrollbar md:flex-wrap md:overflow-visible text-xs">
              <span className="px-2.5 py-1 rounded-full bg-[#FAF5E0] text-[#6B271A] font-semibold whitespace-nowrap">
                Quando: Questo weekend ✕
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#FAF5E0] text-[#6B271A] font-semibold whitespace-nowrap">
                Distanza: 50 km ✕
              </span>
            </div>
            <button
              className="text-sm font-semibold underline shrink-0 ml-3"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              data-event="toggle_view"
            >
              {expanded ? "Mostra meno" : "Guarda tutti"}
            </button>
          </div>

          {expanded ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <CardSagra />
              <CardConcerto />
              <CardFiera />
              <CardSagraAnnullata />
              <CardConcerto />
              <CardFiera />
            </div>
          ) : (
            <div className="mt-4 flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">
              <div className="min-w-[280px] max-w-[280px] flex-shrink-0">
                <CardSagra />
              </div>
              <div className="min-w-[280px] max-w-[280px] flex-shrink-0">
                <CardSagraAnnullata />
              </div>
              <div className="min-w-[280px] max-w-[280px] flex-shrink-0">
                <CardFiera />
              </div>
              <div className="min-w-[280px] max-w-[280px] flex-shrink-0">
                <CardConcerto />
              </div>
            </div>
          )}
        </section>

        {/* ESPERIENZE CONSIGLIATE */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#6B271A]">Esperienze consigliate</h2>
            <a href="#" className="text-sm font-semibold underline flex items-center gap-1">
              Vedi tutte
            </a>
          </div>

          {/* Mobile */}
          <div className="mt-5 md:hidden flex gap-5 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">
            {[
              {
                images: [
                  "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=1200&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1468596238068-7eee4927c4a2?q=80&w=1200&auto=format&fit=crop",
                ],
                title: "Trekking al tramonto",
                location: "Arnad (AO)",
                region: "Valle d'Aosta",
                meta: "Durata 4h · Difficoltà media",
                priceFrom: "€25",
              },
              {
                images: [
                  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1493558103817-58b2924bce98?q=80&w=1200&auto=format&fit=crop",
                ],
                title: "Giro in barca alle calette",
                location: "Otranto (LE)",
                region: "Puglia",
                meta: "Durata 2h · Attrezzatura inclusa",
                priceFrom: "€35",
              },
              {
                images: [
                  "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?q=80&w=1200&auto=format&fit=crop",
                ],
                title: "Cooking class lucana",
                location: "Matera (MT)",
                region: "Basilicata",
                meta: "Durata 3h · Piccoli gruppi",
                priceFrom: "€59",
              },
              {
                images: [
                  "https://images.unsplash.com/photo-1473625247510-8ceb1760943f?q=80&w=1200&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1520975922323-2155a3b6f2b6?q=80&w=1200&auto=format&fit=crop",
                ],
                title: "E-bike tra i vigneti",
                location: "Neive (CN)",
                region: "Piemonte",
                meta: "Durata 2h",
                priceFrom: "€29",
              },
            ].map((e, i) => (
              <ExperienceCard key={i} fixedWidth {...e} />
            ))}
          </div>

          {/* Desktop */}
          <div className="mt-5 hidden md:grid grid-cols-4 gap-5">
            {[
              {
                images: [
                  "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=1200&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1468596238068-7eee4927c4a2?q=80&w=1200&auto=format&fit=crop",
                ],
                title: "Trekking al tramonto",
                location: "Arnad (AO)",
                region: "Valle d'Aosta",
                meta: "Durata 4h · Difficoltà media",
                priceFrom: "€25",
              },
              {
                images: [
                  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1493558103817-58b2924bce98?q=80&w=1200&auto=format&fit=crop",
                ],
                title: "Giro in barca alle calette",
                location: "Otranto (LE)",
                region: "Puglia",
                meta: "Durata 2h · Attrezzatura inclusa",
                priceFrom: "€35",
              },
              {
                images: [
                  "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?q=80&w=1200&auto=format&fit=crop",
                ],
                title: "Cooking class lucana",
                location: "Matera (MT)",
                region: "Basilicata",
                meta: "Durata 3h · Piccoli gruppi",
                priceFrom: "€59",
              },
              {
                images: [
                  "https://images.unsplash.com/photo-1473625247510-8ceb1760943f?q=80&w=1200&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1520975922323-2155a3b6f2b6?q=80&w=1200&auto=format&fit=crop",
                ],
                title: "E-bike tra i vigneti",
                location: "Neive (CN)",
                region: "Piemonte",
                meta: "Durata 2h",
                priceFrom: "€29",
              },
            ].map((e, i) => (
              <ExperienceCard key={i} fixedWidth={false} {...e} />
            ))}
          </div>
        </section>

        {/* PRODOTTI TIPICI */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#6B271A]">Prodotti tipici</h2>
            <a href="#" className="text-sm font-semibold underline flex items-center gap-1">
              Vedi tutti
            </a>
          </div>
          <div className="mt-4 flex gap-5 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">
            {[
              {
                img: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=1200&auto=format&fit=crop",
                title: "Formaggio di malga",
                origin: "Asiago (VI) | Veneto",
                priceFrom: "€7",
              },
              {
                img: "https://images.unsplash.com/photo-1505575972945-280b8f1e5d16?q=80&w=1200&auto=format&fit=crop",
                title: "Salumi tipici",
                origin: "Norcia (PG) | Umbria",
                priceFrom: "€9",
              },
              {
                img: "https://images.unsplash.com/photo-1514515411904-65fa19574d07?q=80&w=1200&auto=format&fit=crop",
                title: "Olio EVO del Garda",
                origin: "Garda (VR) | Veneto",
                priceFrom: "€6",
              },
              {
                img: "https://images.unsplash.com/photo-1543352634-8730a9c79dc5?q=80&w=1200&auto=format&fit=crop",
                title: "Vino Montepulciano",
                origin: "Montepulciano (SI) | Toscana",
                priceFrom: "€12",
              },
              {
                img: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?q=80&w=1200&auto=format&fit=crop",
                title: "Pasta artigianale",
                origin: "Gragnano (NA) | Campania",
                priceFrom: "€3",
              },
            ].map((p, i) => (
              <ProductCard key={i} {...p} />
            ))}
          </div>
        </section>

        {/* I NOSTRI PARTNER */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#6B271A]">I nostri partner</h2>
          </div>
          <div className="relative mt-3">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-white to-transparent rounded-l-2xl"></div>
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white to-transparent rounded-r-2xl"></div>

            <div
              ref={partnersRef}
              onMouseEnter={() => setPartnersPaused(true)}
              onMouseLeave={() => setPartnersPaused(false)}
              className="flex gap-4 overflow-x-auto no-scrollbar items-center py-2"
            >
              {[...Array(20)].map((_, idx) => (
                <div key={idx} className="shrink-0">
                  <div className="h-16 w-40 rounded-2xl bg-white border flex items-center justify-center shadow-sm">
                    <img
                      src={`https://dummyimage.com/160x64/FAF5E0/6B271A&text=Partner+${(idx % 10) + 1}`}
                      alt={`Logo partner ${(idx % 10) + 1}`}
                      className="max-h-12 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = `https://dummyimage.com/160x64/ffffff/999&text=Partner+${(idx % 10) + 1}`;
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRUST / NEWSLETTER */}
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
              <button className="px-4 py-2 rounded-xl bg-[#D54E30] text-white font-semibold" data-event="newsletter_subscribe">
                Iscrivimi
              </button>
            </form>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-sm text-gray-600 flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
            <div>© {new Date().getFullYear()} Il Borghista — Tutti i diritti riservati</div>
            <div className="flex gap-4">
              <a href="#" className="hover:underline">
                Privacy
              </a>
              <a href="#" className="hover:underline">
                Cookie
              </a>
              <Link to="/creator" className="hover:underline">
                Creator
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
