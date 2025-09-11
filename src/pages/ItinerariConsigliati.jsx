import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SuggestItineraryBtn from "../components/SuggestItineraryBtn";
import { listMyItineraries, publish, removeItinerary } from "../lib/itineraries";
import { Heart, Calendar, MapPin, Trash2, Upload } from "lucide-react";
import { getCurrentUser } from "../lib/store";

const TABS = [
  { key: "bozza", label: "Bozze" },
  { key: "in_revisione", label: "In revisione" },
  { key: "pubblicato", label: "Pubblicati" },
  { key: "respinto", label: "Respinti" },
];

export default function ItinerariConsigliati() {
  const user = getCurrentUser() || { id: "guest" };
  const navigate = useNavigate();
  const [tab, setTab] = useState("bozza");

  const items = useMemo(
    () => listMyItineraries(user.id, tab),
    [user.id, tab]
  );

  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg tracking-tight" style={{ color: "#6B271A" }}>
            Il Borghista
          </Link>
          <div className="flex items-center gap-2">
            <SuggestItineraryBtn />
          </div>
        </div>
        <nav className="mx-auto max-w-6xl px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 rounded-2xl text-sm border ${tab === t.key ? "text-white" : ""}`}
                style={{
                  borderColor: tab === t.key ? "#D54E30" : "#E1B671",
                  backgroundColor: tab === t.key ? "#D54E30" : "#FFFFFF",
                  color: tab === t.key ? "#FFFFFF" : "#6B271A",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {items.length === 0 ? (
          <div className="text-center py-16" style={{ color: "#6B271A" }}>
            Nessun itinerario in questa sezione.
            <div className="mt-4"><SuggestItineraryBtn /></div>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((it) => (
              <li key={it.id} className="border rounded-2xl overflow-hidden shadow-sm" style={{ borderColor: "#E1B671" }}>
                <div className="aspect-video bg-gray-100 relative">
                  {it.coverUrl ? (
                    <img src={it.coverUrl} alt={it.title || "Cover"} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">Nessuna cover</div>
                  )}
                  <button className="absolute top-2 right-2 bg-white/90 rounded-full p-2" title="Salva nei preferiti">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold line-clamp-2" style={{ color: "#6B271A" }}>{it.title || "Senza titolo"}</h3>
                  <div className="mt-1 text-sm text-gray-600 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4"/>{it.mainBorgoSlug || "—"}</span>
                    <span className="inline-flex items-center gap-1"><Calendar className="w-4 h-4"/>{it.duration || "—"}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700 line-clamp-2">{it.summary || "Aggiungi una descrizione breve..."}</p>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {it.status === "bozza" && (
                        <>
                          <button onClick={() => navigate(`/itinerari/${it.id}/edit`)}
                                  className="px-3 py-1.5 rounded-xl text-sm border hover:bg-gray-50"
                                  style={{ borderColor: "#E1B671", color: "#6B271A" }}>
                            Modifica
                          </button>
                          <button onClick={() => navigate(`/itinerari/${it.id}/edit?submit=1`)}
                                  className="px-3 py-1.5 rounded-xl text-sm"
                                  style={{ backgroundColor: "#D54E30", color: "#fff" }}>
                            Invia
                          </button>
                        </>
                      )}
                      {it.status === "in_revisione" && (
                        <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "#FFF2CC", color: "#8B6B00" }}>
                          In revisione
                        </span>
                      )}
                      {it.status === "pubblicato" && (
                        <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "#E7F6EC", color: "#1B7F3A" }}>
                          Pubblicato
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {it.status === "bozza" && (
                        <button onClick={() => { publish(it.id); navigate(0); }}
                                className="p-2 rounded-xl border hover:bg-gray-50"
                                title="Pubblica (stub)" style={{ borderColor: "#E1B671" }}>
                          <Upload className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => { if (confirm("Eliminare l’itinerario?")) { removeItinerary(it.id); navigate(0); } }}
                              className="p-2 rounded-xl border hover:bg-gray-50"
                              title="Elimina" style={{ borderColor: "#E1B671" }}>
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
