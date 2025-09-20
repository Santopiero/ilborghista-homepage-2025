import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Filter, ChevronRight } from "lucide-react";
import CosaFareCard from "../components/CosaFareCard.jsx";
import { POI_BY_BORGO } from "../data/poi.js";

export default function CosaFareList() {
  const { slug } = useParams();
  const allItems = POI_BY_BORGO[slug] || [];
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("tutte");

  const categories = useMemo(() => {
    const set = new Set(allItems.map(i => i.category).filter(Boolean));
    return ["tutte", ...Array.from(set)];
  }, [allItems]);

  const items = useMemo(() => {
    return allItems.filter(i => {
      const text = ((i.title || i.name || "") + " " + (i.description || "")).toLowerCase();
      const matchQ = q ? text.includes(q.toLowerCase()) : true;
      const matchC = cat === "tutte" ? true : i.category === cat;
      return matchQ && matchC;
    });
  }, [allItems, q, cat]);

  return (
    <main className="max-w-6xl mx-auto px-4 pt-14 pb-16">
      <header className="py-3">
        <h1 className="text-2xl font-bold capitalize">Cosa fare a {slug}</h1>
        <p className="text-sm text-gray-600">
          Seleziona un’attività per aprire la scheda di dettaglio.
        </p>
      </header>

      {/* Filtri sticky */}
      <div className="sticky top-14 z-20 bg-white/90 backdrop-blur border-y">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-[240px]">
            <div className="relative flex-1">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cerca attività…"
                className="w-full h-10 rounded-xl border px-3 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Categoria</label>
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="h-10 rounded-xl border px-3 text-sm"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <button className="ml-auto inline-flex items-center gap-2 h-10 px-3 rounded-xl border text-sm">
            <Filter className="h-4 w-4" /> Altri filtri
          </button>
          <span className="text-sm text-gray-600 shrink-0">
            {items.length} risultati
          </span>
        </div>
      </div>

      {/* Grid risultati */}
      <section className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-10">
            Nessuna attività trovata.
          </div>
        ) : (
          items.map((it) => (
            <CosaFareCard key={it.id} slug={slug} item={it} />
          ))
        )}
      </section>

      {/* Link Home Borgo */}
      <div className="mt-8 flex justify-center">
        <Link
          to={`/borghi/${slug}`}
          className="inline-flex items-center gap-1 text-sm px-3 py-2 rounded-xl border hover:bg-gray-50 transition"
        >
          Torna alla Home Borgo <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
