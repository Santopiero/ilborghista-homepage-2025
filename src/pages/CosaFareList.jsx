import { useMemo } from "react";
import { useParams } from "react-router-dom";
import CosaFareCard from "../components/CosaFareCard.jsx";
import { POI_BY_BORGO } from "../data/poi.js";
import PallotteBar from "../components/PallotteBar.jsx";

export default function CosaFareList() {
  const { slug } = useParams();
  const allItems = POI_BY_BORGO[slug] || [];

  const items = useMemo(
    () => allItems.filter((i) => i.type === "cosa-fare"),
    [allItems]
  );

  return (
    <main className="max-w-6xl mx-auto px-4 pt-14 pb-16">
      {/* Pallotte (con casetta Home) */}
      <PallotteBar activeType="cosa-fare" />

      {/* Header */}
      <header className="py-3">
        <h1 className="text-2xl font-bold capitalize">Cosa fare a {slug}</h1>
        <p className="text-sm text-gray-600">Seleziona un’attività per aprire la scheda di dettaglio.</p>
      </header>

      {/* Solo conteggio risultati */}
      <div className="sticky top-[calc(56px+40px)] z-10 bg-white/90 backdrop-blur border-y">
        <div className="max-w-6xl mx-auto px-4 py-2 text-sm text-gray-600">
          {items.length} risultati
        </div>
      </div>

      {/* Griglia */}
      <section className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-10">Nessuna attività trovata.</div>
        ) : (
          items.map((it) => <CosaFareCard key={it.id} slug={slug} item={it} />)
        )}
      </section>
    </main>
  );
}
