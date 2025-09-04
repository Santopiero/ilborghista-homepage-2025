// src/pages/creator/CreatorIndex.jsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listCreators } from "../../lib/store";

export default function CreatorIndex() {
  const creators = listCreators();
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("");

  const filtered = useMemo(() => {
    return creators.filter(c =>
      (!region || c.region.toLowerCase().includes(region.toLowerCase())) &&
      (!category || c.category.toLowerCase().includes(category.toLowerCase()))
    );
  }, [creators, region, category]);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#6B271A]">I nostri Creator</h1>
        <Link to="/registrazione-creator" className="text-sm font-semibold underline">Diventa creator</Link>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
        <input className="border rounded-xl px-3 py-2" placeholder="Filtra per regione…" value={region} onChange={e=>setRegion(e.target.value)} />
        <input className="border rounded-xl px-3 py-2" placeholder="Filtra per categoria…" value={category} onChange={e=>setCategory(e.target.value)} />
      </div>

      <div className="mt-4 grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filtered.map(c => (
          <article key={c.id} className="rounded-2xl border bg-white overflow-hidden shadow-sm">
            <div className="h-32 bg-gray-100">
              {c.avatarUrl ? <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover" /> : null}
            </div>
            <div className="p-4 space-y-1">
              <h3 className="font-extrabold text-[#6B271A]">{c.name}</h3>
              <div className="text-sm text-gray-600">{c.region} · {c.category}</div>
              <div className="text-xs text-gray-500">Punti: {c.points ?? 0}</div>
              <div className="pt-2">
                <Link to={`/creator/${c.id}`} className="text-sm font-semibold underline">Vedi profilo</Link>
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="text-sm text-gray-600">Nessun creator trovato. <Link to="/registrazione-creator" className="underline">Aggiungine uno</Link>.</div>
        )}
      </div>
    </main>
  );
}
