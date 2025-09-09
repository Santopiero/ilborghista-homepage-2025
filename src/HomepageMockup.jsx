// src/HomepageMockup.jsx
import { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Clock,
  Search as SearchIcon,
  Star,
  User,
  Bell,
  X,
  Menu,
  Heart,
  Smartphone,
  MessageCircle,
} from "lucide-react";
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

/* =============================================================================
   UTILS
============================================================================= */
const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop";

const onImgErr = (e) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = FALLBACK_IMG;
};

const formatIt = (n, d = 1) =>
  typeof n === "number"
    ? n.toLocaleString("it-IT", { minimumFractionDigits: d, maximumFractionDigits: d })
    : n;

function useBodyLock(locked) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (locked) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => (document.body.style.overflow = prev || "");
  }, [locked]);
}

/* =============================================================================
   FAVORITES (LocalStorage)
============================================================================= */
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
  useEffect(() => saveFavSet(favSet), [favSet]);

  const has = (id) => favSet.has(id);
  const toggle = (id) =>
    setFavSet((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
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

/* =============================================================================
   NOTIFICHE (badge + pannello con Test)
============================================================================= */
const NOTIF_KEY = "ilborghista:notifs:v1";
const loadNotifs = () => {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
const saveNotifs = (list) => {
  try {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(list));
  } catch {}
};

function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState(() => loadNotifs());
  useBodyLock(open);

  // helper globale per test da console
  useEffect(() => {
    window.__ilb_addNotif = (title = "Nuova notifica", body = "Prova") => {
      const n = { id: Date.now(), title, body, ts: new Date().toISOString() };
      setList((prev) => {
        const next = [n, ...prev].slice(0, 100);
        saveNotifs(next);
        return next;
      });
    };
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  const unread = list.length;

  async function showOsNotification(title, body) {
    try {
      if (typeof Notification === "undefined") return;
      if (Notification.permission === "default") {
        const r = await Notification.requestPermission();
        if (r !== "granted") return;
      }
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg?.showNotification) {
        reg.showNotification(title || "Il Borghista", {
          body: body || "",
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          tag: "local-test",
        });
      } else {
        new Notification(title || "Il Borghista", {
          body: body || "",
          icon: "/icons/icon-192.png",
          tag: "local-test",
        });
      }
    } catch {}
  }
  function onTestNotif() {
    const n = {
      id: Date.now(),
      title: "Prova notifica",
      body: "Questo è un test ✅",
      ts: new Date().toISOString(),
    };
    setList((prev) => {
      const next = [n, ...prev].slice(0, 100);
      saveNotifs(next);
      return next;
    });
    showOsNotification(n.title, n.body);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Le tue notifiche"
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-full border bg-white"
        onClick={() => setOpen(true)}
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 grid place-items-center text-[11px] rounded-full bg-[#D54E30] text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute right-4 top-4 w-[92vw] max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-black/10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-extrabold text-[#6B271A]">Le tue notifiche</div>
              <button
                aria-label="Chiudi"
                className="inline-flex w-8 h-8 items-center justify-center rounded-full border"
                onClick={() => setOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-auto">
              {list.length === 0 ? (
                <div className="px-4 py-6 text-sm text-neutral-600">
                  Nessuna notifica al momento.
                </div>
              ) : (
                <ul className="divide-y">
                  {list.map((n) => (
                    <li key={n.id} className="px-4 py-3">
                      <div className="font-semibold text-[#5B2A1F]">{n.title}</div>
                      {n.body && <div className="text-sm text-neutral-700 mt-0.5">{n.body}</div>}
                      <div className="text-xs text-neutral-500 mt-1">
                        {new Date(n.ts).toLocaleString("it-IT")}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t">
              <button
                className="text-sm underline text-neutral-700"
                onClick={() => {
                  setList([]);
                  saveNotifs([]);
                }}
              >
                Svuota
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onTestNotif}
                  className="text-sm bg-[#FAF5E0] px-3 py-1.5 rounded-lg border border-[#E1B671]"
                >
                  Test notifica
                </button>
                <button
                  className="text-sm bg-[#D54E30] text-white px-3 py-1.5 rounded-lg"
                  onClick={() => setOpen(false)}
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* =============================================================================
   PRIMITIVES
============================================================================= */
function Carousel({ images = [], heightClass = "h-40", rounded = "rounded-2xl" }) {
  const [idx, setIdx] = useState(0);
  const startX = useRef(0);
  const endX = useRef(0);
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
          <img
            key={i}
            loading="lazy"
            src={src}
            alt=""
            className={`w-full ${heightClass} object-cover flex-shrink-0`}
            onError={onImgErr}
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

const ServiceTile = ({ img, label, href = "#" }) => (
  <Link
    to={href}
    className="group relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition ring-1 ring-[#E1B671]/70 bg-white"
    aria-label={label}
  >
    <img
      loading="lazy"
      src={img}
      alt={label}
      className="absolute inset-0 w-full h-full object-cover duration-300 group-hover:scale-105"
      onError={onImgErr}
    />
    <div className="absolute inset-0 bg-black/30" />
    <div className="relative grid place-items-center h-48 sm:h-56 p-6">
      <h3 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow text-center">
        {label}
      </h3>
    </div>
  </Link>
);

/* =============================================================================
   PAGE
============================================================================= */
export default function HomepageMockup() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // lock scroll quando il drawer è aperto
  useBodyLock(menuOpen);

  // supporto push
  const supportsPush =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  // handle query param "grazie"
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

  /* ---- dati mock ---- */
  const HERO_IMAGE_URL =
    "https://media.istockphoto.com/id/176523127/it/foto/bellissima-citt%C3%A0-in-toscana-pitigliano-provincia-di-grosseto.jpg?s=2048x2048&w=is&k=20&c=Xn6bDbmcSuIol1Lqn59AyOEuSUrTYqzMcoF5KUSnQxI=";

  const BORGI_EXTRA = {
    viggiano: {
      borgoName: "Viggiano",
      title: "La Città dell’Arpa e di Maria",
      currentEvent: "La festa della Madonna Nera",
      ratingAvg: 4.6,
      ratingCount: 128,
    },
  };

  const EVENTI_QA = [
    {
      poster:
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop",
      title: "La festa della Madonna Nera",
      dateText: "9–10 agosto 2025",
      placeText: "Viggiano (PZ) · Santuario",
      detailsText: "Ore 21:00 · Navette gratuite",
      type: "Sagra",
      href: "#",
    },
    {
      poster:
        "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop",
      title: "Sapori in Piazza",
      dateText: "15 agosto 2025",
      placeText: "Viggiano (PZ) · Centro storico",
      detailsText: "Ingresso libero",
      type: "Sagra",
      href: "#",
    },
    {
      poster:
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
      title: "Concerto d’estate",
      dateText: "22 agosto 2025",
      placeText: "Viggiano (PZ) · Arena",
      detailsText: "Ore 21:30",
      type: "",
      href: "#",
    },
  ];

  const ESPERIENZE_QA = [
    {
      id: "balloon",
      images: [
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1500&auto=format&fit=crop",
      ],
      title: "Volo in mongolfiera all’alba",
      location: "Piana dei borghi",
      region: "Basilicata",
      meta: "3 ore • Guida certificata",
      priceFrom: "€245",
    },
    {
      id: "ebike",
      images: [
        "https://images.unsplash.com/photo-1520974735194-6c1f1c1d0b35?q=80&w=1500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1543352634-8730a9c79dc5?q=80&w=1500&auto=format&fit=crop",
      ],
      title: "E-bike tra i borghi",
      location: "Val d’Agri",
      region: "Basilicata",
      meta: "1/2 giornata • Noleggio incluso",
      priceFrom: "€59",
    },
    {
      id: "centrostorico",
      images: [
        "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1500&auto=format&fit=crop",
      ],
      title: "Tour centro storico guidato",
      location: "Borgo antico",
      region: "Basilicata",
      meta: "2 ore • Gruppi piccoli",
      priceFrom: "€18",
    },
    {
      id: "degustazione",
      images: [
        "https://images.unsplash.com/photo-1505575972945-280b8f1e5d16?q=80&w=1500&auto=format&fit=crop",
      ],
      title: "Degustazione prodotti tipici",
      location: "Cantina locale",
      region: "Basilicata",
      meta: "1h 30’ • 5 calici",
      priceFrom: "€35",
    },
  ];

  /* ---- sottocomponenti ---- */
  const BorgoCard = ({ b }) => {
    const extra = BORGI_EXTRA[b.slug] || {};
    const name = extra.borgoName || b.name;
    const title = extra.title || b.title || b.tagline || `Scopri ${name}`;
    const currentEvent = extra.currentEvent;
    const hasRating =
      typeof extra.ratingAvg === "number" &&
      typeof extra.ratingCount === "number" &&
      extra.ratingCount > 0;

    return (
      <Link
        to={`/borghi/${b.slug}`}
        className="group overflow-hidden rounded-2xl bg-white shadow-xl hover:shadow-2xl transition min-w-[280px] max-w-[280px] snap-start relative"
        aria-label={`Apri ${name}`}
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            loading="lazy"
            src={b.hero || FALLBACK_IMG}
            alt={`Veduta di ${name}`}
            className="w-full h-full object-cover"
            onError={onImgErr}
          />
          <div className="absolute top-2 left-2 max-w-[82%] px-2.5 py-1 rounded-lg bg-white text-[#6B271A] text-sm font-semibold shadow">
            <span className="block truncate">{name}</span>
          </div>
          <FavoriteButton id={`borgo:${b.slug}`} className="absolute top-2 right-2" />
        </div>
        <div className="p-4 space-y-2">
          <h3 className="text-base font-bold text-[#6B271A] leading-snug line-clamp-2">{title}</h3>
          {currentEvent && (
            <Link
              to={`/borghi/${b.slug}/eventi`}
              className="flex items-center gap-2 text-sm text-gray-700 hover:underline"
            >
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

  const EventPosterCard = ({
    poster,
    title,
    dateText,
    placeText,
    detailsText,
    type,
    href = "#",
    fixedWidth = true,
  }) => {
    const favId = `event:${title}`;
    return (
      <a
        href={href}
        className={`group overflow-hidden rounded-2xl bg-white shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition ${
          fixedWidth ? "min-w-[85%] max-w-[85%]" : "w-full"
        } relative`}
        aria-label={title}
      >
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            loading="lazy"
            src={poster || FALLBACK_IMG}
            alt={title}
            className="w-full h-full object-cover object-center"
            onError={onImgErr}
          />
          {type && (
            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-white/95 text-[#6B271A] border border-[#E1B671] shadow">
              {type}
            </span>
          )}
          <FavoriteButton id={favId} className="absolute top-2 right-2" />
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
  };

  const ExperienceCard = ({ id, images, title, location, region, meta, priceFrom, fixedWidth }) => (
    <article
      className={`overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition bg-white ${
        fixedWidth !== false ? "min-w-[300px] max-w-[300px]" : "w-full"
      } relative`}
    >
      <div className="relative">
        <Carousel images={images} />
        <FavoriteButton id={`exp:${id || title}`} className="absolute top-2 left-2" />
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
        {meta && (
          <div className="flex items-center text-sm text-gray-600 gap-2">
            <Clock size={16} className="text-[#6B271A]" /> {meta}
          </div>
        )}
      </div>
    </article>
  );

  /* ---- HERO ---- */
  const HeroHeader = () => (
    <section className="relative">
      <img
        src={HERO_IMAGE_URL}
        alt="Hero Il Borghista"
        className="absolute inset-0 w-full h-full object-cover"
        onError={onImgErr}
      />
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 text-center text-white">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight drop-shadow-md">
          Trova cosa fare vicino a te
        </h1>
        <p className="mt-3 text-base md:text-lg drop-shadow">
          Eventi, esperienze e borghi in tutta Italia. Cerca e parti.
        </p>

        {/* barra di ricerca */}
        <div className="mt-6 bg-white/95 backdrop-blur rounded-2xl p-3 md:p-4 inline-block w-full md:w-auto shadow-lg text-left">
          <form className="flex flex-col gap-3 md:flex-row md:items-center" onSubmit={handleSearch}>
            <label
              className="flex items-center gap-2 border rounded-xl px-3 py-3 w-full md:w-96 bg-white"
              htmlFor="query"
            >
              <SearchIcon size={18} className="text-[#6B271A]" />
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
              <SearchIcon size={18} /> Cerca
            </button>
          </form>

          {/* pillole */}
          <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar md:flex-wrap md:overflow-visible">
            <button
              className="px-3 py-1.5 rounded-full bg-[#D54E30] text-white text-sm font-semibold whitespace-nowrap"
              onClick={() => setQuery("weekend")}
            >
              Questo weekend
            </button>
            <button
              className="px-3 py-1.5 rounded-full bg-[#FAF5E0] text-[#6B271A] text-sm font-semibold border border-[#E1B671] whitespace-nowrap"
              onClick={() => setQuery("vicino a me")}
            >
              Vicino a me
            </button>
            <button
              className="px-3 py-1.5 rounded-full bg-[#FAF5E0] text-[#6B271A] text-sm font-semibold border border-[#E1B671] whitespace-nowrap"
              onClick={() => setQuery("bambini")}
            >
              Con bambini
            </button>
            <button
              className="px-3 py-1.5 rounded-full bg-[#FAF5E0] text-[#6B271A] text-sm font-semibold border border-[#E1B671] whitespace-nowrap"
              onClick={() => setQuery("food and wine")}
            >
              Food & Wine
            </button>
            <button
              className="px-3 py-1.5 rounded-full bg-[#FAF5E0] text-[#6B271A] text-sm font-semibold border border-[#E1B671] whitespace-nowrap"
              onClick={() => setQuery("outdoor")}
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

  /* ============================= RENDER =================================== */
  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <main className="space-y-12">
        {/* HEADER */}
        <header className="bg-white/90 backdrop-blur border-b sticky top-0 z-[50]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <Link to="/" className="text-xl font-extrabold text-[#6B271A]">
              Il Borghista
            </Link>

            <div className="flex items-center gap-2">
              <NotificationsBell />
              <button
                aria-label="Apri il menu"
                onClick={() => setMenuOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Drawer menu — montato FUORI dal <header> per evitare clipping */}
        {menuOpen && (
          <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
            <aside
              className="absolute right-0 top-0 h-full w-[min(85vw,22rem)] bg-white shadow-2xl ring-1 ring-black/10
                         flex flex-col"
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

              <nav className="flex-1 overflow-y-auto">
                <ul className="py-2">
                  <li>
                    <Link
                      to="/registrazione-utente"
                      className="flex items-center gap-2 rounded-lg px-4 py-3 hover:bg-neutral-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      <User className="h-4 w-4" /> Accedi / Registrati
                    </Link>
                  </li>

                  {supportsPush && (
                    <li>
                      <button
                        onClick={async () => {
                          try {
                            await enableNotifications();
                            window.__ilb_addNotif?.(
                              "Notifiche attivate",
                              "Riceverai aggiornamenti sulle sagre"
                            );
                          } catch (e) {
                            alert(e?.message || e);
                          } finally {
                            setMenuOpen(false);
                          }
                        }}
                        className="w-full text-left flex items-center gap-2 rounded-lg px-4 py-3 hover:bg-neutral-50"
                      >
                        <Bell className="h-4 w-4" /> Attiva notifiche
                      </button>
                    </li>
                  )}

                  <li>
                    <Link
                      to="/creator"
                      className="flex items-center gap-2 rounded-lg px-4 py-3 hover:bg-neutral-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Star className="h-4 w-4" /> Creators
                    </Link>
                  </li>

                  <li>
                    <Link
                      to="/contatti"
                      className="flex items-center gap-2 rounded-lg px-4 py-3 hover:bg-neutral-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      <MessageCircle className="h-4 w-4" /> Contattaci
                    </Link>
                  </li>

                  <li className="sm:hidden">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        window.__openInstallModal?.();
                      }}
                      className="w-full text-left flex items-center gap-2 rounded-lg px-4 py-3 hover:bg-neutral-50"
                    >
                      <Smartphone className="h-4 w-4" /> Installa app
                    </button>
                  </li>
                </ul>
              </nav>

              <div className="border-t p-3 mt-auto">
                <Link
                  to="/registrazione-creator"
                  className="flex items-center justify-center rounded-xl bg-[#D54E30] px-4 py-2 font-semibold text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  Diventa creator
                </Link>
              </div>
            </aside>
          </div>
        )}

        {/* POST-SIGNUP TOAST */}
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#6B271A]">Servizi</h2>
            <a href="#" className="text-sm font-semibold underline">
              Vedi tutti
            </a>
          </div>
          <div className="mt-4 relative md:hidden">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-white to-transparent rounded-l-2xl" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white to-transparent rounded-r-2xl" />
            <div
              className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div className="min-w-[66%]">
                <ServiceTile
                  img="https://images.unsplash.com/photo-1532635224-4786e6e86e18?q=80&w=1400&auto=format&fit=crop"
                  label="Esperienze"
                />
              </div>
              <div className="min-w-[66%]">
                <ServiceTile
                  img="https://images.unsplash.com/photo-1615141982883-c7ad0f24f0ff?q=80&w=1400&auto=format&fit=crop"
                  label="Prodotti tipici"
                />
              </div>
              <div className="min-w-[66%]">
                <ServiceTile
                  img="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1400&auto=format&fit=crop"
                  label="Noleggio auto"
                />
              </div>
            </div>
          </div>
          <div className="mt-5 hidden md:grid grid-cols-3 gap-6">
            <div className="h-56">
              <ServiceTile
                img="https://images.unsplash.com/photo-1532635224-4786e6e86e18?q=80&w=1600&auto=format&fit=crop"
                label="Esperienze"
              />
            </div>
            <div className="h-56">
              <ServiceTile
                img="https://images.unsplash.com/photo-1615141982883-c7ad0f24f0ff?q=80&w=1600&auto=format&fit=crop"
                label="Prodotti tipici"
              />
            </div>
            <div className="h-56">
              <ServiceTile
                img="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1600&auto=format&fit=crop"
                label="Noleggio auto"
              />
            </div>
          </div>
        </section>

        {/* VIDEO CREATOR */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#6B271A]">Video dei creator</h2>
            <Link to="/creator" className="text-sm font-semibold underline">
              Vedi tutti
            </Link>
          </div>

          {/* mobile scroll */}
          <div className="mt-4 md:hidden">
            <div
              className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {listLatestVideos(24).map((v) => {
                const c = getCreator(v.creatorId);
                const name = v.creatorName || c?.name || "Creator";
                const level = v.level || c?.level || "—";
                const idTo = v.creatorId || v.id;
                const borgo = BORGI_BY_SLUG[v.borgoSlug];

                return (
                  <article
                    key={v.id}
                    className="overflow-hidden rounded-2xl bg-white shadow-xl hover:shadow-2xl transition min-w-[300px] max-w-[300px] flex-shrink-0 snap-start relative"
                  >
                    <div className="aspect-[16/9] overflow-hidden relative">
                      <img
                        src={v.thumbnail || v.cover || FALLBACK_IMG}
                        alt={`Video di ${name}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={onImgErr}
                      />
                      <FavoriteButton id={`vid:${v.id}`} className="absolute top-2 right-2" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-extrabold text-[#6B271A] truncate">{name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF5E0] text-[#6B271A] border border-[#E1B671] shrink-0">
                          {level}
                        </span>
                      </div>
                      {borgo && (
                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                          <MapPin size={16} className="text-[#D54E30]" /> {borgo.name}
                        </div>
                      )}
                      <div className="mt-3 flex items-center justify-end">
                        <Link
                          to={`/chat?to=${encodeURIComponent(idTo)}`}
                          aria-label={`Contatta ${name}`}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#D54E30] text-white"
                        >
                          <User size={18} />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* desktop grid */}
          <div className="mt-4 hidden md:grid grid-cols-4 gap-5">
            {listLatestVideos(24)
              .slice(0, 4)
              .map((v) => {
                const c = getCreator(v.creatorId);
                const name = v.creatorName || c?.name || "Creator";
                const level = v.level || c?.level || "—";
                const idTo = v.creatorId || v.id;
                const borgo = BORGI_BY_SLUG[v.borgoSlug];

                return (
                  <article
                    key={v.id}
                    className="overflow-hidden rounded-2xl bg-white shadow-xl hover:shadow-2xl transition relative"
                  >
                    <div className="aspect-[16/9] overflow-hidden relative">
                      <img
                        src={v.thumbnail || v.cover || FALLBACK_IMG}
                        alt={`Video di ${name}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={onImgErr}
                      />
                      <FavoriteButton id={`vid:${v.id}`} className="absolute top-2 right-2" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-extrabold text-[#6B271A] truncate">{name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF5E0] text-[#6B271A] border border-[#E1B671] shrink-0">
                          {level}
                        </span>
                      </div>
                      {borgo && (
                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                          <MapPin size={16} className="text-[#D54E30]" /> {borgo.name}
                        </div>
                      )}
                      <div className="mt-3 flex items-center justify-end">
                        <Link
                          to={`/chat?to=${encodeURIComponent(idTo)}`}
                          aria-label={`Contatta ${name}`}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#D54E30] text-white"
                        >
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
            <a href="#" className="text-sm font-semibold underline">
              Vedi tutti
            </a>
          </div>
          <div
            className="mt-3 flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {BORGI_INDEX.map((b) => (
              <BorgoCard key={b.slug} b={b} />
            ))}
          </div>
        </section>

        {/* PROSSIMI EVENTI */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#6B271A]">Prossimi eventi</h2>
            <a href="#" className="text-sm font-semibold underline">
              Vedi tutti
            </a>
          </div>
          <div
            className="mt-4 md:hidden flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x snap-mandatory"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
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

        {/* ESPERIENZE */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#6B271A]">Esperienze</h2>
            <Link to="/borghi/viggiano/esperienze" className="text-sm font-semibold underline">
              Vedi tutte
            </Link>
          </div>
          <div
            className="mt-4 flex gap-5 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {ESPERIENZE_QA.map((ex) => (
              <ExperienceCard key={ex.id} {...ex} />
            ))}
          </div>
        </section>

        {/* PRODOTTI TIPICI */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#6B271A]">Prodotti tipici</h2>
            <a href="#" className="text-sm font-semibold underline">
              Vedi tutti
            </a>
          </div>
          <div
            className="mt-4 flex gap-5 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
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
            ].map((p, i) => (
              <article
                key={i}
                className="overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition bg-white min-w-[280px] max-w-[280px] relative"
              >
                <div className="relative h-40 w-full">
                  <img
                    loading="lazy"
                    src={p.img}
                    alt={p.title}
                    className="h-40 w-full object-cover"
                    onError={onImgErr}
                  />
                  <FavoriteButton id={`prod:${p.title}`} className="absolute top-2 left-2" />
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#D54E30] text-white border border-[#6B271A] whitespace-nowrap">
                    da {p.priceFrom}
                  </span>
                </div>
                <div className="p-4 text-left space-y-2">
                  <h3 className="text-base font-extrabold text-[#6B271A] leading-snug line-clamp-2">
                    {p.title}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600 gap-2">
                    <MapPin size={16} className="text-[#D54E30]" /> {p.origin}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* NEWSLETTER */}
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
              <input className="flex-1 md:w-80 border rounded-xl px-3 py-2" placeholder="La tua email" />
              <button className="px-4 py-2 rounded-xl bg-[#D54E30] text-white font-semibold">
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
