import { Link } from "react-router-dom";
import { Heart, Clock, MapPin } from "lucide-react";
import { useState, useMemo } from "react";

function useFav(id) {
  const KEY = "ib_favs";
  const [fav, setFav] = useState(() => {
    try { return (JSON.parse(localStorage.getItem(KEY)) || []).includes(id); }
    catch { return false; }
  });
  return [
    fav,
    () => {
      try {
        const arr = JSON.parse(localStorage.getItem(KEY)) || [];
        const next = arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];
        localStorage.setItem(KEY, JSON.stringify(next));
        setFav(!fav);
      } catch {}
    },
  ];
}

export default function CosaFareCard({ slug, item }) {
  const href = useMemo(() => `/borghi/${slug}/poi/${item.id}`, [slug, item.id]);
  const [fav, toggleFav] = useFav(`poi:${item.id}`);

  return (
    <div className="relative bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition">
      {/* ❤️ sempre visibile */}
      <button
        onClick={toggleFav}
        className="absolute z-10 top-2 right-2 p-2 rounded-full bg-white/90"
        aria-label="Aggiungi ai preferiti"
        title="Aggiungi ai preferiti"
      >
        <Heart className={`h-5 w-5 ${fav ? "fill-current text-rose-600" : ""}`} />
      </button>

      <Link to={href} className="block">
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={item.images?.[0]}
            alt={item.title || item.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="p-3">
          <div className="text-xs text-gray-500">{item.category}</div>
          <h3 className="mt-1 text-base font-semibold line-clamp-2">
            {item.title || item.name}
          </h3>

          <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {item.locationName}
            </span>
            {item.duration && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {item.duration}
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {item.tags?.slice(0, 2).map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                  {t}
                </span>
              ))}
            </div>
            {item.priceFrom && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100">
                {item.priceFrom}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
