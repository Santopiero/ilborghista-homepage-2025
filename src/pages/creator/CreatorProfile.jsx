// src/pages/CreatorProfile.jsx
import React, { useMemo, useState } from "react";
import { addVideo, getCurrentUser, listBorghi, listPoiByBorgo } from "../lib/store";
import { Link } from "react-router-dom";
import { Upload, CheckCircle2, Film, MapPin, Landmark, Store } from "lucide-react";

export default function CreatorProfile() {
  const me = getCurrentUser();
  const borghi = useMemo(() => listBorghi(), []);
  const [borgoSlug, setBorgoSlug] = useState(borghi[0]?.slug || "");
  const [poiId, setPoiId] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(null);

  const poiOptions = useMemo(() => (borgoSlug ? listPoiByBorgo(borgoSlug) : []), [borgoSlug]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!me) {
      alert("Devi effettuare l'accesso per caricare un video.");
      return;
    }
    if (!borgoSlug || !youtubeUrl) {
      alert("Seleziona un borgo e inserisci il link YouTube.");
      return;
    }
    setSaving(true);
    try {
      addVideo({
        title: title || "Video",
        youtubeUrl,
        borgoSlug,
        poiId: poiId || null, // se presente: appare anche sulla scheda attività
        creatorId: me.id,
      });
      setOk("Video caricato! Visibile in Home Borgo; se hai indicato un’attività, appare anche sulla sua scheda (icona video).");
      setYoutubeUrl("");
      setTitle("");
      setPoiId("");
    } catch (err) {
      alert(err.message || "Errore durante il caricamento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-[#FAF5E0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <Link to="/" className="text-[#6B271A] font-semibold hover:underline">← Torna alla Home</Link>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#6B271A]">Profilo Creator</h1>
          <div className="w-28" />
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {!me ? (
          <div className="p-6 border rounded-xl bg-yellow-50">
            <p className="font-semibold mb-2">Non sei autenticato</p>
            <p className="text-sm text-gray-700">Accedi per caricare un video e assegnarlo a un borgo o a una specifica attività (ristorante, alloggio, ecc.).</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="p-6 border rounded-2xl">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Upload className="w-5 h-5" /> Carica un video YouTube
              </h2>
              <form onSubmit={onSubmit} className="mt-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titolo (opzionale)</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="es. Cena tipica a Viggiano"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link YouTube</label>
                  <input
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Borgo di pubblicazione</label>
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-gray-600" />
                      <select
                        value={borgoSlug}
                        onChange={(e) => { setBorgoSlug(e.target.value); setPoiId(""); }}
                        className="w-full border rounded-lg px-3 py-2"
                        required
                      >
                        {borghi.map(b => (
                          <option key={b.slug} value={b.slug}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Il video apparirà nella Home del borgo.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Associarlo a una scheda attività? (opzionale)</label>
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-gray-600" />
                      <select
                        value={poiId}
                        onChange={(e) => setPoiId(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                      >
                        <option value="">— Nessuna —</option>
                        {poiOptions.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.type})
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Film className="w-3 h-3" /> Se selezioni un’attività, il video comparirà anche sulla sua scheda con icona video.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-[#6B271A] text-white px-4 py-2 rounded-lg hover:opacity-90"
                >
                  <Upload className="w-4 h-4" />
                  {saving ? "Carico..." : "Carica video"}
                </button>

                {ok && (
                  <p className="text-green-700 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> {ok}
                  </p>
                )}
              </form>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
