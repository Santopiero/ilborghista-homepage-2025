// src/pages/creator/Onboarding.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getCurrentUser,
  getMyCreatorProfile,
  updateCreator,
  listBorghi,
  listPoiByBorgo,
  listVideosByCreator,
  addVideo,
  saveVideoFile,
  getVideoObjectURL,
} from "../../lib/store";
import {
  Upload,
  CheckCircle2,
  MapPin,
  Landmark,
  Store,
  Camera,
  BadgeCheck,
  Flame,
  User,
  Video,
  ExternalLink,
  ChevronDown,
  Copy,
  Eye,
} from "lucide-react";

/* ---------- Utils ---------- */
function getYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v") || "";
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
  } catch {}
  return "";
}

function YouTubeEmbed({ url, title }) {
  const vid = getYouTubeId(url);
  if (!vid) return null;
  return (
    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
      <iframe
        title={title || "Anteprima YouTube"}
        src={`https://www.youtube.com/embed/${vid}`}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function ProgressBar({ value = 0 }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-[#0D4D4D]"
        style={{ width: `${pct}%` }}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

function Toast({ kind = "success", text, onClose }) {
  if (!text) return null;
  const base =
    kind === "error"
      ? "bg-red-50 text-red-800 border border-red-200"
      : "bg-emerald-50 text-emerald-800 border border-emerald-200";
  return (
    <div className={`fixed bottom-4 right-4 z-50 rounded-xl px-4 py-3 shadow ${base}`}>
      <div className="flex items-center gap-2">
        {kind === "error" ? (
          <span className="font-semibold">Errore</span>
        ) : (
          <span className="font-semibold">Fatto</span>
        )}
        <span className="opacity-80">{text}</span>
        <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">✕</button>
      </div>
    </div>
  );
}

/* ---------- Pagina ---------- */
export default function Onboarding() {
  const navigate = useNavigate();

  // Header toggle: route area utente (puoi cambiare se diverso nel tuo router)
  const USER_AREA_ROUTE = "/registrazione-utente";

  // Stato utente / profilo creator
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // Gamification (fallback se mancano dati)
  const levelName = profile?.levelName || "Esploratore";
  const points = profile?.points ?? 0;
  const nextLevelAt = profile?.nextLevelAt ?? 100;
  const streak = profile?.streak ?? 0;
  const progress = useMemo(() => {
    if (!nextLevelAt) return 0;
    return Math.min(100, (points / nextLevelAt) * 100);
  }, [points, nextLevelAt]);

  // Master data
  const [borghi, setBorghi] = useState([]);
  const [poi, setPoi] = useState([]);

  // Upload state
  const [mode, setMode] = useState("youtube"); // 'youtube' | 'file'
  const [title, setTitle] = useState("");
  const [borgoId, setBorgoId] = useState("");
  const [poiId, setPoiId] = useState("");
  const [ytUrl, setYtUrl] = useState("");
  const [file, setFile] = useState(null);
  const [publishNow, setPublishNow] = useState(true);
  const [loading, setLoading] = useState(false);

  // My videos
  const [videos, setVideos] = useState([]);

  // UI
  const [toast, setToast] = useState({ kind: "success", text: "" });

  useEffect(() => {
    (async () => {
      try {
        const me = await getCurrentUser();
        setUser(me || null);
        const p = await getMyCreatorProfile();
        setProfile(p || null);
        const b = await listBorghi();
        setBorghi(Array.isArray(b) ? b : []);
        const list = await listVideosByCreator();
        setVideos(Array.isArray(list) ? list : []);
      } catch (e) {
        setToast({ kind: "error", text: "Impossibile caricare i dati iniziali." });
        console.error(e);
      }
    })();
  }, []);

  // Carica POI quando scelgo un borgo
  useEffect(() => {
    (async () => {
      if (!borgoId) {
        setPoiId("");
        setPoi([]);
        return;
      }
      try {
        const p = await listPoiByBorgo(borgoId);
        setPoi(Array.isArray(p) ? p : []);
      } catch (e) {
        console.error(e);
        setPoi([]);
      }
    })();
  }, [borgoId]);

  async function handleSubmit(e) {
    e?.preventDefault?.();
    if (!title.trim()) return setToast({ kind: "error", text: "Inserisci un titolo." });
    if (!borgoId) return setToast({ kind: "error", text: "Seleziona un borgo." });
    if (mode === "youtube" && !getYouTubeId(ytUrl)) {
      return setToast({ kind: "error", text: "Inserisci un link YouTube valido." });
    }
    if (mode === "file" && !file) {
      return setToast({ kind: "error", text: "Seleziona un file video." });
    }

    setLoading(true);
    try {
      let payload = {
        title: title.trim(),
        borgoId,
        poiId: poiId || null,
        status: publishNow ? "published" : "draft",
        source: mode, // 'youtube' | 'file'
      };

      if (mode === "youtube") {
        payload.youtubeUrl = ytUrl.trim();
      } else {
        // carica file e ottieni URL locale/firmato
        const saved = await saveVideoFile(file);
        payload.fileUrl = saved?.url || null;
      }

      const created = await addVideo(payload);
      if (created) {
        setToast({ kind: "success", text: publishNow ? "Video pubblicato!" : "Bozza salvata." });
        // reset form
        setTitle("");
        setBorgoId("");
        setPoiId("");
        setYtUrl("");
        setFile(null);
        setPublishNow(true);
        // refresh lista
        const list = await listVideosByCreator();
        setVideos(Array.isArray(list) ? list : []);
      } else {
        setToast({ kind: "error", text: "Non è stato possibile salvare il video." });
      }
    } catch (err) {
      console.error(err);
      setToast({ kind: "error", text: "Errore durante il salvataggio del video." });
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text) {
    if (!text) return;
    navigator.clipboard?.writeText(text).then(
      () => setToast({ kind: "success", text: "Link copiato negli appunti." }),
      () => setToast({ kind: "error", text: "Impossibile copiare il link." })
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* TopBar essenziale */}
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="text-lg sm:text-xl font-extrabold text-[#0D4D4D]">
            Il Borghista
          </Link>

          {/* Toggle Creator/Utente */}
          <div className="flex items-center rounded-xl border bg-white overflow-hidden">
            <button
              className="px-3 py-1.5 text-sm font-medium bg-[#0D4D4D] text-white"
              aria-pressed="true"
            >
              Creator
            </button>
            <button
              className="px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
              onClick={() => navigate(USER_AREA_ROUTE)}
              title="Vai alla tua area utente"
            >
              Utente
            </button>
          </div>

          {/* Azioni rapide (profilo/logout opzionali) */}
          <div className="flex items-center gap-2">
            {user?.name && (
              <span className="hidden sm:flex items-center gap-1 text-sm text-gray-600">
                <User className="w-4 h-4" />
                {user.name}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Contenuto */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid md:grid-cols-2 gap-6">
        {/* Colonna sinistra: Gamification + Badges */}
        <section className="rounded-2xl border bg-white shadow-sm">
          <div className="p-5 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937]">Gamification</h2>
              <span className="inline-flex items-center gap-1 text-sm text-[#0D4D4D]">
                <BadgeCheck className="w-4 h-4" />
                {levelName}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Punti</span>
                <span>
                  <b>{points}</b> / {nextLevelAt}
                </span>
              </div>
              <ProgressBar value={progress} />
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>Streak: <b>{streak}</b> giorni</span>
              </div>
            </div>
          </div>

          <div className="p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Badge recenti</h3>
            <div className="flex flex-wrap gap-2">
              {(profile?.badges?.length ? profile.badges : ["Esploratore", "Raccontastorie"]).map(
                (b, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 rounded-full bg-[#EEF6F6] text-[#0D4D4D]"
                  >
                    {typeof b === "string" ? b : b?.name || "Badge"}
                  </span>
                )
              )}
            </div>
          </div>
        </section>

        {/* Colonna destra: Upload / Pubblica */}
        <section className="rounded-2xl border bg-white shadow-sm">
          <div className="p-5 border-b">
            <h2 className="text-lg sm:text-xl font-bold text-[#1F2937]">Carica e pubblica video</h2>
            <p className="text-sm text-gray-600 mt-1">
              Scegli se inserire un <b>link YouTube</b> oppure caricare un <b>file video</b>. Prima
              di pubblicare assegna il <b>borgo</b> e, se vuoi, l’<b>attività</b>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Mode switch */}
            <div className="inline-flex rounded-xl border overflow-hidden">
              <button
                type="button"
                onClick={() => setMode("youtube")}
                className={`px-3 py-1.5 text-sm font-medium ${
                  mode === "youtube" ? "bg-[#0D4D4D] text-white" : "hover:bg-gray-50"
                }`}
              >
                Link YouTube
              </button>
              <button
                type="button"
                onClick={() => setMode("file")}
                className={`px-3 py-1.5 text-sm font-medium ${
                  mode === "file" ? "bg-[#0D4D4D] text-white" : "hover:bg-gray-50"
                }`}
              >
                File video
              </button>
            </div>

            {/* Titolo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Es. Tramonto a Viggiano – consigli e spot"
                className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-[#0D4D4D]/20"
              />
            </div>

            {/* Borgo + POI */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Borgo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <select
                    value={borgoId}
                    onChange={(e) => setBorgoId(e.target.value)}
                    className="w-full rounded-xl border pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-[#0D4D4D]/20 bg-white"
                  >
                    <option value="">Seleziona borgo…</option>
                    {borghi.map((b) => (
                      <option key={b.id || b.value} value={b.id || b.value}>
                        {b.name || b.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attività (opzionale)
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <select
                    value={poiId}
                    onChange={(e) => setPoiId(e.target.value)}
                    className="w-full rounded-xl border pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-[#0D4D4D]/20 bg-white"
                    disabled={!poi.length}
                  >
                    <option value="">Nessuna</option>
                    {poi.map((p) => (
                      <option key={p.id || p.value} value={p.id || p.value}>
                        {p.name || p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Mode specific input + preview */}
            {mode === "youtube" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link YouTube</label>
                <input
                  type="url"
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=XXXXXXXXXXX"
                  className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-[#0D4D4D]/20"
                />
                {getYouTubeId(ytUrl) && (
                  <div className="mt-3">
                    <YouTubeEmbed url={ytUrl} title={title} />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File video</label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer hover:bg-gray-50">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">Seleziona file</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                  <span className="text-sm text-gray-600 truncate">
                    {file ? file.name : "Nessun file selezionato"}
                  </span>
                </div>
                {file && (
                  <div className="mt-3 aspect-video w-full rounded-xl overflow-hidden bg-black grid place-items-center text-white/80 text-sm">
                    Anteprima file caricata
                  </div>
                )}
              </div>
            )}

            {/* Pubblica subito */}
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm text-gray-700">Pubblica subito</label>
              <button
                type="button"
                onClick={() => setPublishNow((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  publishNow ? "bg-[#0D4D4D]" : "bg-gray-300"
                }`}
                aria-pressed={publishNow}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                    publishNow ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Azioni */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0D4D4D] text-white px-4 py-2 font-medium hover:opacity-90 disabled:opacity-60"
              >
                <Camera className="w-4 h-4" />
                {loading ? "Salvataggio..." : publishNow ? "Pubblica video" : "Salva bozza"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitle("");
                  setBorgoId("");
                  setPoiId("");
                  setYtUrl("");
                  setFile(null);
                  setPublishNow(true);
                }}
                className="rounded-xl border px-4 py-2 font-medium hover:bg-gray-50"
              >
                Annulla
              </button>
            </div>
          </form>
        </section>

        {/* RIGA INTERA: I miei video */}
        <section className="md:col-span-2 rounded-2xl border bg-white shadow-sm">
          <div className="p-5 border-b flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-[#1F2937]">I miei video</h2>
            <Link
              to="/creator"
              className="text-sm text-[#0D4D4D] hover:underline inline-flex items-center gap-1"
            >
              Panoramica creator <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-5">
            {!videos?.length ? (
              <div className="rounded-xl border border-dashed p-6 text-center text-gray-600">
                Non hai ancora caricato video. Caricane uno e scegli se pubblicarlo o salvarlo in bozza.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {videos.map((v) => {
                  const isDraft = v.status === "draft";
                  const thumb =
                    v.source === "youtube"
                      ? `https://i.ytimg.com/vi/${getYouTubeId(v.youtubeUrl)}/hqdefault.jpg`
                      : v.fileUrl || getVideoObjectURL?.(v) || v.thumbnail;

                  return (
                    <article key={v.id} className="rounded-2xl border overflow-hidden bg-white shadow-sm">
                      <div className="relative aspect-video bg-gray-100">
                        {thumb ? (
                          <img src={thumb} alt={v.title || "Video"} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-gray-400 text-sm">Anteprima</div>
                        )}
                        <span
                          className={`absolute top-2 left-2 text-xs px-2 py-1 rounded-full shadow ${
                            isDraft ? "bg-yellow-50 text-yellow-800 border border-yellow-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {isDraft ? "Bozza" : "Pubblicato"}
                        </span>
                      </div>

                      <div className="p-3">
                        <h3 className="font-semibold text-[#111827] line-clamp-2">{v.title || "Video senza titolo"}</h3>
                        <p className="mt-1 text-xs text-gray-500">
                          {v.borgoName || "Borgo"} {v.poiName ? `· ${v.poiName}` : ""}
                        </p>

                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setToast({
                                kind: "success",
                                text: "Azione di pubblicazione simulata. Collega qui la tua API.",
                              })
                            }
                            className="flex-1 rounded-xl bg-[#EEF6F6] text-[#0D4D4D] px-3 py-2 text-sm font-medium hover:bg-[#E3F0F0]"
                          >
                            {isDraft ? "Pubblica" : "Metti in bozza"}
                          </button>
                          {v.source === "youtube" && v.youtubeUrl && (
                            <a
                              href={v.youtubeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 inline-flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              Apri
                            </a>
                          )}
                          {(v.publicUrl || v.youtubeUrl || v.fileUrl) && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(v.publicUrl || v.youtubeUrl || v.fileUrl)}
                              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 inline-flex items-center gap-1"
                            >
                              <Copy className="w-4 h-4" />
                              Copia link
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      <Toast kind={toast.kind} text={toast.text} onClose={() => setToast({ ...toast, text: "" })} />
    </main>
  );
}
