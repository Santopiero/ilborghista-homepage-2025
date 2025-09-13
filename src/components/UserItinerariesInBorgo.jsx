import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { listPublishedNear } from "../lib/itineraries";
import { getImageBlob } from "../lib/imageStore";
import { MapPin, Calendar } from "lucide-react";

const C = { primaryDark: "#6B271A", gold: "#E1B671" };

function useQS() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

/**
 * Legge i filtri dalla querystring della pagina:
 *  - ?raggio=25 (km)   -> include borghi vicini
 *  - ?tipologia=Natura -> confrontata con stop.category
 *  - ?compagnia=famiglie -> confrontata con it.audiences
 *  - ?durata=weekend   -> match su it.duration
 *
 * Rende le card nello stesso stile base (border, titolo, meta, summary).
 */
export default function UserItinerariesInBorgo() {
  const { slug } = useParams();
  const qs = useQS();

  const radiusKm = Number(qs.get("raggio") || 0);
  const tipologia = (qs.get("tipologia") || "").toLowerCase();
  const compagnia = (qs.get("compagnia") || "").toLowerCase();
  const durataQS = (qs.get("durata") || "").toLowerCase();

  const [items, setItems] = useState([]);
  const [covers, setCovers] = useState({}); // id -> objectURL

  // base: per raggio
  useEffect(() => {
    setItems(listPublishedNear(slug, radiusKm));
  }, [slug, radiusKm]);

  // filtri (tipologia/compagnia/durata)
  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (tipologia) {
        const has = (it.stops || []).some(
          (s) => (s.category || "").toLowerCase() === tipologia
        );
        if (!has) return false;
      }
      if (compagnia) {
        const aud = (it.audiences || []).map((a) => String(a).toLowerCase());
        if (!aud.includes(compagnia)) return false;
      }
      if (durataQS) {
        if (!(it.duration || "").toLowerCase().includes(durataQS)) return false;
      }
      return true;
    });
  }, [items, tipologia, compagnia, durataQS]);

  // cover: prima foto della gallery
  useEffect(() => {
    let disposed = false;
    (async () => {
      const map = {};
      for (const it of filtered) {
        const k = it.galleryKeys?.[0];
        if (!k) continue;
        const b = await getImageBlob(k);
        if (b) map[it.id] = URL.createObjectURL(b);
      }
      if (!disposed) {
        setCovers((prev) => {
          Object.values(prev).forEach((u) => u && URL.revokeObjectURL(u));
          return map;
        });
      }
    })();
    return () => {
      disposed = true;
      setCovers((prev) => {
        Object.values(prev).forEach((u) => u && URL.revokeObjectURL(u));
        return {};
      });
    };
  }, [JSON.stringify(filtered.map((i) => i.galleryKeys?.[0] || ""))]);

  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border p-4 text-sm" style={{ borderColor: C.gold, color: C.primaryDark }}>
        Nessun itinerario utente pubblicato con i filtri correnti.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((it) => (
        <article key={it.id} className="rounded-xl overflow-hidden border hover:shadow-sm transition" style={{ borderColor: C.gold }}>
          <div className="aspect-[4/3] bg-gray-100">
            {covers[it.id] ? (
              <img src={covers[it.id]} alt={it.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-gray-400 text-sm">Nessuna foto</div>
            )}
          </div>
          <div className="p-3">
            {/* Badge sorgente per distinguerle da partner */}
            <div className="text-[10px] inline-flex items-center gap-1 border px-2 py-[1px] rounded-full mb-1" style={{ borderColor: C.gold, color: C.primaryDark }}>
              Utenti {Number.isFinite(it.distanceKm) ? <span className="ml-1 opacity-70">· {Math.round(it.distanceKm)} km</span> : null}
            </div>

            <h3 className="font-semibold line-clamp-2" style={{ color: C.primaryDark }}>
              {it.title || "Senza titolo"}
            </h3>

            <div className="mt-1 text-xs flex items-center gap-2 text-gray-600">
              <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{it.mainBorgoSlug}</span>
              {it.duration && <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{it.duration}</span>}
            </div>

            {it.summary && (
              <p className="mt-2 text-sm line-clamp-3" style={{ color: C.primaryDark }}>
                {it.summary}
              </p>
            )}

            {/* Apri la tua anteprima/dettaglio */}
            <Link to={`/itinerari/${it.id}/edit?preview=1`} className="inline-block mt-2 text-xs underline">
              Apri
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
