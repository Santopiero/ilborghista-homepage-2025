// src/pages/MangiareBere.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, Heart, BadgeCheck } from "lucide-react";

import {
  listPoiByBorgo,
  findBorgoBySlug,
  syncBorgoBundle,
  isFavorite,
  toggleFavorite,
} from "../lib/store";
import { BORGI_BY_SLUG } from "../data/borghi";
import PallotteBar from "../components/PallotteBar.jsx";

/* ================= Helpers ================= */
const isFoodDrink = (p) =>
  /(ristor|tratt|osteria|pizzer|bar|caff|café|enotec|pub|agritur)/i.test(
    p.type || p.name || ""
  );

/* ================= Small Favorite Hook ================= */
function useFavorite(type, id, data) {
  const [fav, setFav] = useState(() => {
    try {
      return isFavorite?.(type, id) ?? false;
    } catch {
      return false;
    }
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
      cover:
        "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1500&auto=format&fit=crop",
      fascia: "€€",
      claimable: true,
    },
    {
      id: `claim-${slug}-2`,
      borgoSlug: slug,
      name: "Bar del Borgo",
      location: borgoName,
      cover:
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1500&auto=format&fit=crop",
      fascia: "€",
      claimable: true,
    },
  ];
}

/* ================== CARD attività “Mangiare & Bere” (reale o rivendicabile) ================== */
function EatDrinkCard({ item }) {
  const isClaim = item.claimable === true;
  const href = isClaim
    ? `/registrazione-attivita/mangiare?claim=${encodeURIComponent(item.id)}`
    : `/borghi/${item.borgoSlug}/poi/${item.id}`;

  const [fav, toggleFav] = useFavorite("attivita", item.id, {
    id: item.id,
    title: item.name,
    img: item.cover,
    location: item.location,
    tipo: "mangiare",
  });

  return (
    <Link
      to={href}
      className="overflow-hidden rounded-3xl bg-white shadow-[0_10px_25px_-12px_rgba(0,0,0,0.15)] ring-1 ring-black/5"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-3xl">
        <img
          src={item.cover}
          alt={item.name}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
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
          onClick={(e) => {
            e.preventDefault();
            toggleFav(e);
          }}
          className={`absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full shadow ring-1 ring-black/10 ${
            fav ? "bg-[#D54E30] text-white" : "bg-white/90 text-[#6B271A]"
          }`}
        >
          <Heart className="h-4 w-4" fill={fav ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 font-extrabold text-[#5B2A1F]">
          {item.name}
        </h3>
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
export default function MangiareBere() {
  const { slug } = useParams();

  // Sync bundle del borgo
  const [syncTick, setSyncTick] = useState(0);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await syncBorgoBundle(slug);
      } finally {
        if (mounted) setSyncTick(Date.now());
      }
    })();
    return () => {
      mounted = false;
    };
  }, [slug]);

  const borgo = useMemo(() => findBorgoBySlug(slug), [slug, syncTick]);
  const meta = BORGI_BY_SLUG?.[slug] || null;

  const borgoName = meta?.displayName || borgo?.name || meta?.name || slug;

  // POI ristorazione
  const allPoi = useMemo(() => listPoiByBorgo(slug), [slug, syncTick]);
  const eatDrinkRaw = useMemo(() => allPoi.filter(isFoodDrink), [allPoi]);

  // Trasforma i POI ristorazione in dati per card
  const eatDrinkReal = useMemo(() => {
    return eatDrinkRaw.map((p) => ({
      id: p.id,
      borgoSlug: slug,
      name: p.name || "Attività",
      location: `${borgoName}${p.localita ? " · " + p.localita : ""}`,
      cover:
        p.cover ||
        "https://images.unsplash.com/photo-1528605105345-5344ea20e269?q=80&w=1600&auto=format&fit=crop",
      fascia: p.fascia || "€€",
      claimable: false,
    }));
  }, [eatDrinkRaw, borgoName, slug]);

  // Placeholder rivendicabili
  const claimables = useMemo(
    () => buildClaimableEatDrink(slug, borgoName),
    [slug, borgoName]
  );

  // Assicura almeno 2 schede totali
  const items = useMemo(() => {
    const arr = [...eatDrinkReal];
    if (arr.length < 2) {
      const need = 2 - arr.length;
      arr.push(...claimables.slice(0, Math.max(0, need)));
    }
    return arr.slice(0, 12);
  }, [eatDrinkReal, claimables]);

  return (
    <main className="bg-white">
      {/* PallotteBar fissa sotto la topbar */}
      <PallotteBar activeType="mangiare-bere" />

      <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <header className="mb-2">
          <h1 className="text-2xl font-extrabold text-[#5B2A1F]">
            Mangiare &amp; Bere a {borgoName}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            
          </p>
        </header>

        {items.length ? (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((it) => (
              <EatDrinkCard key={it.id} item={it} />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border bg-[#FAF5E0] p-4 text-sm text-[#5B2A1F]">
            Nessuna attività caricata per ora.
          </div>
        )}
      </section>
    </main>
  );
}
