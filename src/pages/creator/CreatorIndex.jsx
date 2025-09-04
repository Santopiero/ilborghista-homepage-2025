// src/pages/creator/CreatorIndex.jsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listCreators } from "../../lib/store";

export default function CreatorIndex() {
  const [region, setRegion] = useState("");
  const [qCats, setQCats] = useState("");

  // Prendi i creator così come sono nello store (id stabili!)
  const creators = useMemo(() => listCreators(), []);

  const filtered = creators.filter(c => {
    const okRegion = region ? (c.region || "").toLowerCase().includes(region.toLowerCase()) : true;
    const okCats = qCats
      ? (c.categories || []).some(cat => cat.toLowerCase().includes(qCats.toLowerCase()))
      : true;
    return okRegion && okCats;
  });

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-extrabold text-[#6B271A]">I nostri Creator</h1>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          className="border rounded-xl px-3 py-2"
          placeholder="Filtra per regione..."
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        />
        <input
          className="border rounded-xl px-3 py-2"
          placeholder="Filtra per categoria..."
          value={qCats}
          onChange={(e) => setQCats(e.target.value)}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((c) => (
          <article key={c.id} className="overflow-hidden shadow-xl rounded-2xl bg-white">
            <div className="h-48 w-full bg-gray-100">
              {c.hero ? (
                <img src={c.hero} alt={c.name} className="w-full h-full object-cover" />
              ) : null}
            </div>
            <div className="p-4">
              <div className="text-lg font-extrabold text-[#6B271A]">{c.name}</div>
              <div className="text-sm text-gray-700">{c.region || "-"}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(c.categories || []).map((cat, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full text-[11px] bg-[#FAF5E0] text-[#6B271A] border border-[#E1B671]">
                    {cat}
                  </span>
                ))}
              </div>

              <div className="mt-4">
                {/* USA SEMPRE l'ID già salvato nello store */}
                <Link
                  to={`/creator/${c.id}`}
                  className="text-[#6B271A] font-semibold underline"
                >
                  Vedi profilo
                </Link>
              </div>
            </div>
          </article>
        ))}

        {filtered.length === 0 && (
          <div className="text-sm text-gray-600">Nessun creator trovato con i filtri selezionati.</div>
        )}
      </div>
    </main>
  );
}
