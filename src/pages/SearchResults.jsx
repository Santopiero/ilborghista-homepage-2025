// src/pages/SearchResults.jsx
import { useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { searchNavigateTarget, slugify } from "../lib/store";
import { BORGI_INDEX } from "../data/borghi";

export default function SearchResults() {
  const [params] = useSearchParams();
  const q = (params.get("q") || "").trim();
  const navigate = useNavigate();

  // Reindirizzo immediato se la query corrisponde a un borgo o a un POI
  useEffect(() => {
    if (!q) return;
    const target = searchNavigateTarget(q);
    if (target?.type === "borgo") {
      navigate(`/borghi/${target.slug}`, { replace: true });
      return;
    }
    if (target?.type === "poi") {
      navigate(`/borghi/${target.slug}/poi/${target.poiId}`, { replace: true });
      return;
    }
    // Fallback: prova a usare l'indice statico dei borghi
    const s = slugify(q);
    const hit = BORGI_INDEX.find(
      (b) => b.slug === s || slugify(b.name) === s || b.name.toLowerCase().includes(q.toLowerCase())
    );
    if (hit) {
      navigate(`/borghi/${hit.slug}`, { replace: true });
    }
  }, [q, navigate]);

  // Suggerimenti base se non c'è match immediato
  const suggestions = useMemo(() => {
    const t = q.toLowerCase();
    if (!t) return BORGI_INDEX.slice(0, 6);
    return BORGI_INDEX.filter((b) => b.name.toLowerCase().includes(t)).slice(0, 6);
  }, [q]);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-extrabold text-[#6B271A]">Risultati ricerca</h1>
      <p className="text-gray-700 mt-1">
        Query: <span className="font-semibold">{q || "—"}</span>
      </p>

      <section className="mt-6">
        <h2 className="text-lg font-bold text-[#6B271A]">Suggerimenti</h2>
        {suggestions.length === 0 ? (
          <p className="text-gray-600 mt-2">Nessun suggerimento trovato.</p>
        ) : (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {suggestions.map((b) => (
              <Link
                key={b.slug}
                to={`/borghi/${b.slug}`}
                className="block rounded-2xl border hover:shadow-lg transition overflow-hidden bg-white"
              >
                <div className="h-32 w-full">
                  <img
                    src={b.hero}
                    alt={b.name}
                    className="h-32 w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop";
                    }}
                  />
                </div>
                <div className="p-4">
                  <div className="font-bold text-[#6B271A]">{b.name}</div>
                  {b.regione ? (
                    <div className="text-sm text-gray-600">{b.provincia ? `${b.provincia} · ` : ""}{b.regione}</div>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
