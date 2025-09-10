// src/HomepageMockup.jsx
import { useEffect, useMemo, useRef, useState } from "react";
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
  Crosshair,
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
   NOTIFICHE (badge + pannello)
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
   CONSTANTS (Regioni)
============================================================================= */
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

/* =============================================================================
   PAGE
============================================================================= */
export default function HomepageMockup() {
  const navigate = useNavigate();

  // ---------------- Topbar Search Overlay ----------------
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebounced(query.trim()), 300);
    return () => debounceTimer.current && clearTimeout(debounceTimer.current);
  }, [query]);

  const suggestions = useMemo(() => {
    if (!debounced) return [];
    const q = debounced.toLowerCase();
    // Semplici suggerimenti: borghi che matchano
    return BORGI_INDEX.filter(
      (b) => b.name?.toLowerCase().includes(q) || b.slug?.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [debounced]);

  function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query.trim()) return;
    const target = searchNavigateTarget(query);
    if (target.type === "borgo") navigate(`/borghi/${target.slug}`);
    else if (target.type === "poi") navigate(`/borghi/${target.slug}/poi/${target.poiId}`);
    else navigate(`/cerca?q=${encodeURIComponent(query)}`);
    setSearchOpen(false);
  }

  // ---------------- Menu ----------------
  const [menuOpen, setMenuOpen] = useState(false);
  useBodyLock(menuOpen || searchOpen);

  // ---------------- Signup toast ----------------
  const [signupSuccess, setSignupSuccess] = useState(false);
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("grazie") === "1") {
        setSignupSuccess(true);
        url.searchParams.delete("grazie");
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      }
    } catch {}
  }, []);

  // ---------------- Geolocalizzazione ----------------
  const LOC_KEY = "ilborghista:userLoc:v1";
  const [userLoc, setUserLoc] = useState(() => {
    try {
      const raw = localStorage.getItem(LOC_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [geoToast, setGeoToast] = useState("");

  const DEFAULT_RADIUS_KM = 50;
  function saveLoc(loc) {
    try {
      localStorage.setItem(LOC_KEY, JSON.stringify(loc));
    } catch {}
  }
  async function handleGeolocate() {
    // usa localStorage se disponibile
    if (userLoc?.lat && userLoc?.lng) {
      // toggle: se già presente, ri-applica e chiude eventuali toast
      setGeoToast("");
      return;
    }
    if (!("geolocation" in navigator)) {
      setGeoToast(
        "Geolocalizzazione non disponibile sul dispositivo. Abilita il GPS o inserisci manualmente la località."
      );
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          radiusKm: DEFAULT_RADIUS_KM,
          ts: Date.now(),
        };
        setUserLoc(loc);
        saveLoc(loc);
        setGeoToast("");
        // Qui potresti attivare un refresh dei blocchi ordinati per distanza
        window.__ilb_addNotif?.("Posizione attivata", `Raggio impostato a ${DEFAULT_RADIUS_KM} km`);
      },
      (err) => {
        console.warn("Geolocation error", err);
        setGeoToast(
          "Permesso negato. Per attivare la posizione, abilita i permessi del browser (Impostazioni → Privacy/Posizione) e riprova."
        );
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  }
  function clearLocation() {
    setUserLoc(null);
    try {
      localStorage.removeItem(LOC_KEY);
    } catch {}
  }

  // ---------------- Region Filter (URL + localStorage) ----------------
  const REG_KEY = "ilborghista:regionFilter:v1";
  const [activeRegion, setActiveRegion] = useState(() => {
    try {
      const url = new URL(window.location.href);
      const fromUrl = url.searchParams.get("reg");
      if (fromUrl) return fromUrl;
      const raw = localStorage.getItem(REG_KEY);
      return raw || "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (activeRegion) url.searchParams.set("reg", activeRegion);
      else url.searchParams.delete("reg");
      window.history.replaceState({}, "", url.pathname + "?" + url.searchParams.toString());
      localStorage.setItem(REG_KEY, activeRegion || "");
    } catch {}
  }, [activeRegion]);

  function toggleRegion(slug) {
    setActiveRegion((prev) => (prev === slug ? "" : slug));
  }

  // ---------------- Supporto Push ----------------
  const supportsPush =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  // ---------------- Dati mock UI ----------------
  const HERO_IMAGE_URL =
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1500&auto=format&fit=crop";

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
      poster: "https://www.ilborghista.it/immaginiutente/borgo_eventi/493.png",
      title: "La festa della Madonna Nera",
      dateText: "9–10 agosto 2025",
      placeText: "Viggiano (PZ) · Santuario",
      detailsText: "Ore 21:00 · Navette gratuite",
      type: "Sagra",
      href: "#",
    },
    {
      poster: "https://www.ilborghista.it/immaginiutente/borgo_eventi/421.jpg",
      title: "Sapori in Piazza",
      dateText: "15 agosto 2025",
      placeText: "Viggiano (PZ) · Centro storico",
      detailsText: "Ingresso libero",
      type: "Sagra",
      href: "#",
    },
    {
      poster: "https://www.ilborghista.it/immaginiutente/borgo_eventi/4896.JPG",
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

  // ---------------- Subcomponents ----------------
  const BorgoCard = ({ b }) => {
    const extra = BORGI_EXTRA[b.slug] || {};
    const name = extra.borgoName || b.name;
    const title = extra.title || b.title || b.tagline || `Scopri ${name}`;
    const currentEvent = extra.currentEvent;
    const hasRating =
      typeof extra.ratingAvg === "number" &&
      typeof extra.ratingCount === "number" &&
      extra.ratingCount > 0;

    // Filtra per regione se selezionata
    if (activeRegion && b.regionSlug && b.regionSlug !== activeRegion) return null;

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

  // ---------------- HERO ----------------
  const HeroHeader = () => (
    <section className="relative">
      <img
        src={HERO_IMAGE_URL}
        alt="Hero Il Borghista"
        className="absolute inset-0 w-full h-full object-cover"
        onError={onImgErr}
      />
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative max-w-6xl mx-auto px-6 pt-14 pb-20 text-center text-white">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight drop-shadow-md">
          Trova cosa fare nei borghi d’Italia
        </h1>
        <p className="mt-3 text-base md:text-lg drop-shadow">
          Eventi, esperienze e luoghi autentici. Senza fronzoli.
        </p>
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
        {/* TOP BAR (sticky) */}
        <header className="bg-white/90 backdrop-blur border-b sticky top-0 z-[60]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="text-xl font-extrabold text-[#6B271A]" aria-label="Home">
              Il Borghista
            </Link>

            {/* Azioni centrali: lente (apre overlay) + geolocate */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Cerca"
                onClick={() => setSearchOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6B271A]"
              >
                <SearchIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Usa la mia posizione"
                onClick={handleGeolocate}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6B271A]"
                title="Usa la mia posizione"
              >
                <Crosshair className="h-5 w-5" />
              </button>
            </div>

            {/* Lato destro: campanella + menu */}
            <div className="flex items-center gap-2">
              <NotificationsBell />
              <button
                aria-label="Apri il menu"
                onClick={() => setMenuOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6B271A]"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Chip filtri attivi: Vicino a te */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              {userLoc?.lat && userLoc?.lng && (
                <span
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FAF5E0] text-[#6B271A] border border-[#E1B671] text-sm"
                  role="status"
                  aria-label={`Filtro: vicino a te entro ${userLoc.radiusKm || DEFAULT_RADIUS_KM} km`}
                >
                  <Crosshair className="w-4 h-4" />
                  <span>Vicino a te · {userLoc.radiusKm || DEFAULT_RADIUS_KM} km</span>
                  <button
                    className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-black/5"
                    aria-label="Rimuovi filtro posizione"
                    onClick={clearLocation}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
            </div>
          </div>
        </header>

        {/* SEARCH OVERLAY (fascia ricerca) */}
        {searchOpen && (
          <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Ricerca">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSearchOpen(false)} />
            <div className="absolute left-1/2 -translate-x-1/2 top-6 w-[92vw] max-w-2xl bg-white rounded-2xl shadow-2xl ring-1 ring-black/10">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 p-3">
                <SearchIcon className="w-5 h-5 text-[#6B271A]" aria-hidden="true" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cerca eventi, esperienze o borghi"
                  aria-label="Cosa cerchi"
                  className="flex-1 outline-none text-gray-900 placeholder:text-gray-500 caret-[#6B271A]"
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Svuota"
                    onClick={() => setQuery("")}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-[#D54E30] text-white font-semibold"
                >
                  Cerca
                </button>
              </form>

              {/* Suggerimenti (debounce 300ms) — niente pillole predefinite */}
              <div className="max-h-[50vh] overflow-auto border-t">
                {debounced && suggestions.length === 0 && (
                  <div className="p-4 text-sm text-neutral-600">Nessun risultato per “{debounced}”.</div>
                )}
                {suggestions.length > 0 && (
                  <ul className="divide-y">
                    {suggestions.map((b) => (
                      <li key={b.slug}>
                        <Link
                          to={`/borghi/${b.slug}`}
                          onClick={() => setSearchOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50"
                        >
                          <MapPin className="w-4 h-4 text-[#D54E30]" />
                          <span className="font-semibold text-[#6B271A]">{b.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Drawer menu — montato FUORI dal <header> */}
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
                      to="/registrazione"
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

              {/* “Diventa Creator” SOLO qui */}
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

        {/* GEO Fallback toast */}
        {geoToast && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 text-sm">
              ⚠️ {geoToast}
            </div>
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

        {/* SEZIONE REGIONI (tra Ricerca e Servizi) */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6">
          <h2 className="sr-only">Regioni</h2>
          {/* Mobile: carosello orizzontale con snap */}
          <div className="md:hidden relative">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent rounded-l-2xl" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent rounded-r-2xl" />
            <div
              className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1"
              style={{ WebkitOverflowScrolling: "touch" }}
              role="toolbar"
              aria-label="Filtra per Regione"
            >
              {REGIONS.map((r) => {
                const active = activeRegion === r.slug;
                return (
                  <button
                    key={r.slug}
                    onClick={() => toggleRegion(r.slug)}
                    aria-pressed={active}
                    className={`snap-start px-3 py-1.5 rounded-full text-sm border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6B271A] ${
                      active
                        ? "bg-[#6B271A] text-white border-[#6B271A]"
                        : "bg-white text-[#6B271A] border-[#E1B671]"
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Desktop: griglia compatta */}
          <div
            className="hidden md:grid grid-cols-5 lg:grid-cols-6 gap-2"
            role="toolbar"
            aria-label="Filtra per Regione"
          >
            {REGIONS.map((r) => {
              const active = activeRegion === r.slug;
              return (
                <button
                  key={r.slug}
                  onClick={() => toggleRegion(r.slug)}
                  aria-pressed={active}
                  className={`px-3 py-2 rounded-full text-sm border text-left truncate focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6B271A] ${
                    active
                      ? "bg-[#6B271A] text-white border-[#6B271A]"
                      : "bg-white text-[#6B271A] border-[#E1B671]"
                  }`}
                  title={r.label}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* Azione per azzerare filtro (se attivo) */}
          {activeRegion && (
            <div className="mt-2">
              <button
                onClick={() => setActiveRegion("")}
                className="text-sm underline text-neutral-700"
                aria-label="Rimuovi filtro regione"
              >
                Rimuovi filtro regione
              </button>
            </div>
          )}
        </section>

        {/* SERVIZI (invariata; il tuo store può adattare in base a posizione/regione) */}
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
                  img="https://images.unsplash.com/photo-1675843894930-2b7f07d3f3e5?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0"
                  label="Esperienze"
                />
              </div>
              <div className="min-w-[66%]">
                <ServiceTile
                  img="https://images.unsplash.com/photo-1631379578550-7038263db699?q=80&w=1174&auto=format&fit=crop&ixlib=rb-4.1.0"
                  label="Prodotti tipici"
                />
              </div>
              <div className="min-w-[66%]">
                <ServiceTile
                  img="https://plus.unsplash.com/premium_photo-1661288451211-b61d32db1d11?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0"
                  label="Noleggio auto"
                />
              </div>
            </div>
          </div>
          <div className="mt-5 hidden md:grid grid-cols-3 gap-6">
            <div className="h-56">
              <ServiceTile
                img="https://images.unsplash.com/photo-1675843894930-2b7f07d3f3e5?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0"
                label="Esperienze"
              />
            </div>
            <div className="h-56">
              <ServiceTile
                img="https://images.unsplash.com/photo-1631379578550-7038263db699?q=80&w=1174&auto=format&fit=crop&ixlib=rb-4.1.0"
                label="Prodotti tipici"
              />
            </div>
            <div className="h-56">
              <ServiceTile
                img="https://plus.unsplash.com/premium_photo-1661288451211-b61d32db1d11?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0"
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
