// src/pages/creator/CreatorProfile.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  addVideo,
  getCurrentUser,
  listBorghi,
  listPoiByBorgo,
  listVideosByCreator,
  saveVideoFile,
  getVideoObjectURL,
} from "../../lib/store";
import { Link } from "react-router-dom";
import { Upload, CheckCircle2, MapPin, Landmark, Store, X } from "lucide-react";

/* --- Player --- */
function VideoUnit({ v }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let alive = true;
    let tmp = null;
    (async () => {
      if (!(v?.uploadType === "file" && v?.localMediaId)) {
        setUrl(null);
        return;
      }
      try {
        const obj = await getVideoObjectURL(v.localMediaId);
        if (alive) {
          tmp = obj;
          setUrl(obj);
        }
      } catch {
        if (alive) setUrl(null);
      }
    })();
    return () => {
      alive = false;
      if (tmp) URL.revokeObjectURL(tmp);
    };
  }, [v?.uploadType, v?.localMediaId]);

  if (v?.uploadType === "embed" && v?.youtubeUrl) {
    try {
      const u = new URL(v.youtubeUrl);
      let id = "";
      if (u.hostname.includes("youtube.com")) id = u.searchParams.get("v") || "";
      else if (u.hostname.includes("youtu.be")) id = u.pathname.slice(1);
      if (!id) return null;
      return (
        <div className="aspect-video w-full">
          <iframe
            className="w-full h-full rounded-xl"
            src={`https://www.youtube.com/embed/${id}`}
            title={v.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      );
    } catch {
      return null;
    }
  }

  if (v?.uploadType === "file" && v?.localMediaId) {
    if (!url) return <div className="aspect-video w-full rounded-xl bg-gray-100" />;
    return <video src={url} className="w-full rounded-xl" controls />;
  }

  return null;
}

export default function CreatorProfile() {
  const me = getCurrentUser();
  const borghi = useMemo(() => listBorghi(), []);
  const [borgoSlug, setBorgoSlug] = useState(borghi[0]?.slug || "");
  const [poiId, setPoiId] = useState("");
  const [title, setTitle] = useState("");

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("embed");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(null);

  const [myVideos, setMyVideos] = useState([]);
  useEffect(() => {
    if (me?.id) setMyVideos(listVideosByCreator(me.id));
  }, [me?.id]);

  const poiOptions = useMemo(
    () => (borgoSlug ? listPoiByBorgo(borgoSlug) : []),
    [borgoSlug]
  );

  useEffect(() => {
    if (file) {
      const u = URL.createObjectURL(file);
      setFilePreview(u);
      return () => URL.revokeObjectURL(u);
    }
    setFilePreview(null);
  }, [file]);

  if (!me) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <p className="text-gray-700">Devi accedere per usare l’area Creator.</p>
        <Link to="/" className="text-[#6B271A] underline">Torna alla Home</Link>
      </main>
    );
  }

  const resetForm = () => {
    setTitle("");
    setYoutubeUrl("");
    setFile(null);
    setPoiId("");
    setMode("embed");
    setSaving(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!borgoSlug) { alert("Seleziona il borgo."); return; }

    try {
      setSaving(true);
      let localMediaId = null;

      if (mode === "embed") {
        if (!youtubeUrl) { alert("Inserisci il link YouTube."); setSaving(false); return; }
      } else {
        if (!file) { alert("Seleziona un file video."); setSaving(false); return; }
        localMediaId = await saveVideoFile(file);
      }

      const v = addVideo({
        title: title || "Video",
        youtubeUrl: mode === "embed" ? youtubeUrl : null,
        localMediaId: mode === "file" ? localMediaId : null,
        borgoSlug,
        poiId: poiId || null,
        creatorId: me.id,
      });

      setOk("Video pubblicato! È visibile nella Home del borgo e, se hai indicato un’attività, anche sulla sua scheda.");
      setMyVideos((prev) => [v, ...prev]);
      setOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert(err?.message || "Errore durante il caricamento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b bg-[#FAF5E0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <Link to="/" className="text-[#6B271A] font-semibold hover:underline">← Torna alla Home</Link>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#6B271A]">La mia area Creator</h1>
          <div className="w-28" />
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#6B271A]">Portfolio video</h2>
            <p className="text-sm text-gray-700">
              Pubblica un nuovo contenuto e collegalo al borgo (e, se vuoi, a una specifica attività).
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#D54E30] text-white font-semibold shadow hover:opacity-95"
          >
            <Upload className="w-4 h-4" /> Carica Video
          </button>
        </div>

        {ok && (
          <div className="mt-4 rounded-xl border bg-green-50 text-green-800 px-4 py-3 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> {ok}
          </div>
        )}

        <div className="mt-8">
          {myVideos.length === 0 ? (
            <div className="text-sm text-gray-600">
              Nessun video caricato. <button onClick={() => setOpen(true)} className="underline">Carica ora</button>.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {myVideos.map((v) => (
                <article key={v.id} className="border rounded-2xl p-4 bg-white">
                  <VideoUnit v={v} />
                  <div className="mt-2">
                    <div className="font-semibold text-[#6B271A]">{v.title}</div>
                    <div className="text-xs text-gray-600">
                      Borgo: <span className="font-medium">{v.borgoSlug}</span>
                      {v.poiId ? <> · Attività: <span className="font-medium">{v.poiId}</span></> : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !saving && setOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold text-[#6B271A]">Carica un video</h3>
              <button className="p-2 rounded-lg hover:bg-gray-100" onClick={() => !saving && setOpen(false)} aria-label="Chiudi">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-4 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Es. Cena tipica a Viggiano"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Borgo <span className="text-red-600">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-gray-600" />
                    <select
                      value={borgoSlug}
                      onChange={(e) => { setBorgoSlug(e.target.value); setPoiId(""); }}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    >
                      {borghi.map((b) => (
                        <option key={b.slug} value={b.slug}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Il video apparirà nella Home del borgo.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attività (opzionale)</label>
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-gray-600" />
                    <select
                      value={poiId}
                      onChange={(e) => setPoiId(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="">— Nessuna —</option>
                      {poiOptions.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-lg border ${mode === "embed" ? "bg-[#FAF5E0] border-[#E1B671] text-[#6B271A]" : "bg-white"}`}
                  onClick={() => setMode("embed")}
                >
                  Da link (YouTube)
                </button>
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-lg border ${mode === "file" ? "bg-[#FAF5E0] border-[#E1B671] text-[#6B271A]" : "bg-white"}`}
                  onClick={() => setMode("file")}
                >
                  Da file (upload)
                </button>
              </div>

              {mode === "embed" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link YouTube <span className="text-red-600">*</span>
                  </label>
                  <input
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seleziona file video <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm"
                  />
                  {filePreview && (
                    <div className="mt-3">
                      <video src={filePreview} className="w-full rounded-lg" controls />
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-[#6B271A] text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-60"
                >
                  <Upload className="w-4 h-4" />
                  {saving ? "Pubblico..." : "Pubblica video"}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => { setOpen(false); resetForm(); }}
                  className="ml-2 px-4 py-2 rounded-lg border"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
