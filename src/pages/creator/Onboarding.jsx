// src/pages/creator/Onboarding.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
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
  Store,
  BadgeCheck,
  Flame,
  User,
  Camera,
  ExternalLink,
  Copy,
  Eye,
  Crown,
  Award,
  Compass,
  Map as MapIcon,
  Star,
  Image as ImageIcon,
  Layers,
  PenTool,
  HelpCircle,
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
        <span className="font-semibold">{kind === "error" ? "Errore" : "Fatto"}</span>
        <span className="opacity-80">{text}</span>
        <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">✕</button>
      </div>
    </div>
  );
}

/* ---------- Pagina ---------- */
export default function Onboarding() {
  const navigate = useNavigate();
  const USER_AREA_ROUTE = "/registrazione-utente";

  // Stato utente / profilo
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // Gamification
  const userLevelNames = ["Viaggiatore", "Esploratore", "Narratore", "Ambasciatore", "Top Creator"];
  const userLevelIcons = [MapIcon, Compass, Star, Award, Crown];

  const creatorLevelNames = ["Creator", "Content Builder", "Story Architect", "Content Master", "Top Creator"];
  const creatorLevelIcons = [Camera, Layers, PenTool, Award, Crown];

  // Toggle visualizzazione livelli
  const [levelsView, setLevelsView] = useState("creator"); // 'user' | 'creator'

  // Dati profilo
  const currentLevelName = profile?.levelName || (levelsView === "creator" ? "Creator" : "Esploratore");
  const points = profile?.points ?? 0;
  const nextLevelAt = profile?.nextLevelAt ?? 100;
  const streak = profile?.streak ?? 0;
  const progress = useMemo(() => (nextLevelAt ? Math.min(100, (points / nextLevelAt) * 100) : 0), [points, nextLevelAt]);

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState("");

  // Master data
  const [borghi, setBorghi] = useState([]);
  const [poi, setPoi] = useState([]);

  // Upload video
  const [mode, setMode] = useState("youtube"); // 'youtube' | 'file'
  const [title, setTitle] = useState("");
  const [borgoId, setBorgoId] = useState("");
  const [poiId, setPoiId] = useState("");
  const [poiQuery, setPoiQuery] = useState(""); // ricerca rapida attività
  const [ytUrl, setYtUrl] = useState("");
  const [file, setFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const [publishNow, setPublishNow] = useState(true);
  const [loading, setLoading] = useState(false);

  // Video list
  const [videos, setVideos] = useState([]);
  const [videoFilter, setVideoFilter] = useState("all"); // all | published | draft | pending

  // UI
  const [toast, setToast] = useState({ kind: "success", text: "" });

  // Drag & drop refs
  const dropRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const me = await getCurrentUser();
        setUser(me || null);
        const p = await getMyCreatorProfile();
        setProfile(p || null);
        if (p?.avatarUrl) setAvatarPreview(p.avatarUrl);
        const b = await listBorghi();
        setBorghi(Array.isArray(b) ? b : []);
        const list = await listVideosByCreator();
        setVideos(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
        setToast({ kind: "error", text: "Impossibile caricare i dati iniziali." });
      }
    })();
  }, []);

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
        setPoi([]);
      }
    })();
  }, [borgoId]);

  // Filtra attività in base a ricerca
  const filteredPoi = useMemo(() => {
    if (!poiQuery.trim()) return poi;
    const q = poiQuery.trim().toLowerCase();
    return poi.filter((p) => (p.name || p.label || "").toLowerCase().includes(q));
  }, [poi, poiQuery]);

  // Avatar upload
  async function handleAvatarChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result;
        setAvatarPreview(typeof dataUrl === "string" ? dataUrl : "");
        try {
          await updateCreator({ avatarDataUrl: dataUrl });
          setToast({ kind: "success", text: "Foto profilo aggiornata." });
          const p = await getMyCreatorProfile();
          setProfile(p || null);
        } catch (err) {
          setToast({ kind: "error", text: "Salvataggio avatar non riuscito." });
        }
      };
      reader.readAsDataURL(f);
    } catch (err) {
      setToast({ kind: "error", text: "Errore nella lettura del file immagine." });
    }
  }

  // Drag & drop handlers
  function onDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }
  function onDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }
  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const f = e.dataTransfer?.files?.[0];
    if (f && f.type.startsWith("video/")) {
      setMode("file");
      setFile(f);
      const url = URL.createObjectURL(f);
      setFilePreviewUrl(url);
    }
  }

  // File picker change
  function onFileChange(e) {
    const f = e.target.files?.[0];
    setFile(f || null);
    setFilePreviewUrl(f ? URL.createObjectURL(f) : "");
  }

  async function handleSubmit(e) {
    e?.preventDefault?.();
    if (!title.trim()) return setToast({ kind: "error", text: "Inserisci un titolo." });
    if (!borgoId) return setToast({ kind: "error", text: "Seleziona un borgo." });
    if (mode === "youtube" && !getYouTubeId(ytUrl)) {
      return setToast({ kind: "error", text: "Inserisci un link YouTube valido." });
    }
    if (mode === "file" && !file) {
      return setToast({ kind: "error", text: "Seleziona o trascina un file video." });
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        borgoId,
        poiId: poiId || null,
        status: publishNow ? "published" : "draft",
        source: mode, // 'youtube' | 'file'
      };

      if (mode === "youtube") {
        payload.youtubeUrl = ytUrl.trim();
      } else {
        let uploadedUrl = "";
        try {
          const saved = await saveVideoFile(file);
          uploadedUrl = saved?.url || "";
        } catch {}
        if (!uploadedUrl) {
          uploadedUrl = getVideoObjectURL?.({ file }) || filePreviewUrl || URL.createObjectURL(file);
        }
        payload.fileUrl = uploadedUrl;
        payload.filename = file?.name || undefined;
        payload.mimeType = file?.type || undefined;
      }

      const created = await addVideo(payload);
      if (created && created.id) {
        setToast({
          kind: "success",
          text: publishNow
            ? "🎥 Video caricato! È ora visibile sul tuo profilo (o in attesa di approvazione se previsto)."
            : "Bozza salvata! La trovi nella sezione I miei video.",
        });
        // reset form
        setTitle("");
        setBorgoId("");
        setPoiId("");
        setPoiQuery("");
        setYtUrl("");
        setFile(null);
        setFilePreviewUrl("");
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

  // Filtri video
  const displayedVideos = useMemo(() => {
    if (videoFilter === "all") return videos;
    if (videoFilter === "published") return videos.filter((v) => v.status === "published");
    if (videoFilter === "draft") return videos.filter((v) => v.status === "draft");
    if (videoFilter === "pending") return videos.filter((v) => v.status === "pending");
    return videos;
  }, [videos, videoFilter]);

  // Determina livelli attivi (toggle)
  const activeLevelNames = levelsView === "creator" ? creatorLevelNames : userLevelNames;
  const activeLevelIcons = levelsView === "creator" ? creatorLevelIcons : userLevelIcons;
  const currentLevelIndex = Math.max(
    0,
    activeLevelNames.findIndex((n) => n.toLowerCase() === currentLevelName.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-white">
      {/* TopBar */}
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="text-lg sm:text-xl font-extrabold text-[#0D4D4D]">
            Il Borghista
          </Link>

          {/* Toggle Creator/Utente (route) */}
          <div className="flex items-center rounded-xl border bg-white overflow-hidden">
            <button className="px-3 py-1.5 text-sm font-medium bg-[#0D4D4D] text-white" aria-pressed="true">
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid md:grid-cols-2 gap-6">
        {/* LEFT: 1. Gamification */}
        <section className="rounded-2xl border bg-white shadow-sm">
          <div className="p-5 border-b flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937]">1. Gamification</h2>
              <p className="mt-1 text-sm text-gray-700 font-semibold">Partecipa e accumula punti</p>
              <p className="mt-1 text-sm text-gray-600">
                Partecipa alla community interagendo con i contenuti: lascia recensioni, segnala eventi e completa missioni.
                <br />
                Sblocca badge esclusivi e scala la classifica regionale e nazionale.
              </p>
            </div>

            {/* Avatar upload */}
            <div className="shrink-0">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar creator" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-gray-400">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                <label
                  title="Carica foto profilo"
                  className="absolute -bottom-1 -right-1 bg-white border rounded-full p-1 shadow cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Toggle livelli + stepper */}
          <div className="p-5 space-y-5">
            <div className="inline-flex rounded-xl border overflow-hidden">
              <button
                type="button"
                onClick={() => setLevelsView("user")}
                className={`px-3 py-1.5 text-sm font-medium ${
                  levelsView === "user" ? "bg-[#0D4D4D] text-white" : "hover:bg-gray-50"
                }`}
              >
                Livelli Utente
              </button>
              <button
                type="button"
                onClick={() => setLevelsView("creator")}
                className={`px-3 py-1.5 text-sm font-medium ${
                  levelsView === "creator" ? "bg-[#0D4D4D] text-white" : "hover:bg-gray-50"
                }`}
              >
                Livelli Creator
              </button>
            </div>

            {/* Stepper 5 livelli */}
            <div className="flex items-center justify-between gap-2">
              {activeLevelNames.map((lvl, idx) => {
                const Icon = activeLevelIcons[idx] || Star;
                const active = idx <= currentLevelIndex;
                return (
                  <div key={lvl} className="flex flex-col items-center gap-1 w-full">
                    <div
                      className={`w-9 h-9 rounded-full grid place-items-center border ${
                        active ? "bg-[#0D4D4D] text-white border-[#0D4D4D]" : "bg-white text-gray-500"
                      }`}
                      title={lvl}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[11px] text-center leading-tight ${active ? "text-[#0D4D4D]" : "text-gray-500"}`}>
                      {lvl}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Progress + streak con micro-testo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Livello attuale: <b>{currentLevelName}</b>
                </span>
                <span>
                  Punti: <b>{points}</b> / {nextLevelAt}
                </span>
              </div>
              <ProgressBar value={progress} />
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>Streak: <b>{streak}</b> giorni</span>
                <span className="inline-flex items-center gap-1 text-xs text-gray-500" title="Accedi ogni giorno per aumentare la tua serie di accessi consecutivi e guadagnare bonus punti.">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Suggerimento
                </span>
              </div>
            </div>

            {/* Missioni dedicate ai creator */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Missioni da creator</h3>
              <ul className="grid sm:grid-cols-3 gap-2">
                <li className="text-xs text-gray-700 rounded-xl border px-3 py-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Carica 1 nuovo video questa settimana
                </li>
                <li className="text-xs text-gray-700 rounded-xl border px-3 py-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Condividi un video sui social
                </li>
                <li className="text-xs text-gray-700 rounded-xl border px-3 py-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Raggiungi 100 visualizzazioni su un video
                </li>
              </ul>
            </div>

            {/* Badge recenti */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Badge recenti</h3>
              <div className="flex flex-wrap gap-2">
                {(profile?.badges?.length ? profile.badges : ["Esploratore", "Raccontastorie"]).map((b, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-full bg-[#EEF6F6] text-[#0D4D4D]">
                    {typeof b === "string" ? b : b?.name || "Badge"}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT: 2. Carica i tuoi video (drag & drop + anteprima) */}
        <section className="rounded-2xl border bg-white shadow-sm">
          <div className="p-5 border-b">
            <h2 className="text-lg sm:text-xl font-bold text-[#1F2937]">2. Carica i tuoi video</h2>
            <p className="mt-1 text-sm text-gray-700 font-semibold">Racconta il tuo borgo con un video</p>
            <p className="mt-1 text-sm text-gray-600">
              Carica i tuoi video o inserisci un link YouTube per mostrare la bellezza del borgo o di un’attività locale.
              <br />
              Più video pubblichi, più punti guadagni e più visibilità ottieni.
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

            {/* Borgo + Attività (con ricerca) */}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Attività (opzionale)</label>
                <input
                  type="text"
                  value={poiQuery}
                  onChange={(e) => setPoiQuery(e.target.value)}
                  placeholder="Cerca attività…"
                  className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-[#0D4D4D]/20 mb-2"
                  disabled={!poi.length}
                />
                <div className="relative">
                  <Store className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <select
                    value={poiId}
                    onChange={(e) => setPoiId(e.target.value)}
                    className="w-full rounded-xl border pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-[#0D4D4D]/20 bg-white"
                    disabled={!poi.length}
                  >
                    <option value="">Nessuna</option>
                    {filteredPoi.map((p) => (
                      <option key={p.id || p.value} value={p.id || p.value}>
                        {p.name || p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Input specifici + anteprima */}
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

                {/* Drag & Drop area */}
                <div
                  ref={dropRef}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`rounded-xl border-2 border-dashed px-4 py-6 text-center cursor-pointer ${
                    isDragging ? "border-[#0D4D4D] bg-[#EEF6F6]" : "border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => dropRef.current?.querySelector("input[type=file]")?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6 text-gray-600" />
                    <p className="text-sm text-gray-600">
                      Trascina qui il tuo video oppure <span className="font-medium">clicca per selezionarlo</span>.
                    </p>
                    <input type="file" accept="video/*" onChange={onFileChange} className="hidden" />
                  </div>
                </div>

                {/* Preview */}
                {filePreviewUrl && (
                  <div className="mt-3">
                    <video src={filePreviewUrl} controls className="w-full aspect-video rounded-xl bg-black" />
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
                  setPoiQuery("");
                  setYtUrl("");
                  setFile(null);
                  setFilePreviewUrl("");
                  setPublishNow(true);
                }}
                className="rounded-xl border px-4 py-2 font-medium hover:bg-gray-50"
              >
                Annulla
              </button>
            </div>
          </form>
        </section>

        {/* FULL: 3. I miei video (filtri + stats) */}
        <section className="md:col-span-2 rounded-2xl border bg-white shadow-sm">
          <div className="p-5 border-b flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#1F2937]">I miei video</h2>
            <div className="flex items-center gap-2">
              {["all", "published", "draft", "pending"].map((f) => (
                <button
                  key={f}
                  onClick={() => setVideoFilter(f)}
                  className={`px-3 py-1.5 text-sm rounded-xl border ${
                    videoFilter === f ? "bg-[#0D4D4D] text-white border-[#0D4D4D]" : "hover:bg-gray-50"
                  }`}
                >
                  {f === "all" && "Tutti"}
                  {f === "published" && "Pubblicati"}
                  {f === "draft" && "In bozza"}
                  {f === "pending" && "In attesa"}
                </button>
              ))}
            </div>
            <Link to="/creator" className="text-sm text-[#0D4D4D] hover:underline inline-flex items-center gap-1">
              Panoramica creator <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-5">
            {!videos?.length ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-gray-600">
                <div className="mx-auto mb-3 w-24 h-24 rounded-full bg-[#EEF6F6] grid place-items-center">
                  <Camera className="w-10 h-10 text-[#0D4D4D]" />
                </div>
                <p className="font-semibold">Non hai ancora caricato video.</p>
                <p className="text-sm">
                  Mostra la bellezza dei borghi: <b>il primo video ti farà guadagnare 5 punti!</b>
                </p>
              </div>
            ) : !displayedVideos.length ? (
              <div className="rounded-xl border border-dashed p-6 text-center text-gray-600">
                Nessun video per questo filtro.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedVideos.map((v) => {
                  const isDraft = v.status === "draft";
                  const isPending = v.status === "pending";
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
                            isPending
                              ? "bg-blue-50 text-blue-800 border border-blue-200"
                              : isDraft
                              ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {isPending ? "In attesa" : isDraft ? "Bozza" : "Pubblicato"}
                        </span>
                      </div>

                      <div className="p-3">
                        <h3 className="font-semibold text-[#111827] line-clamp-2">{v.title || "Video senza titolo"}</h3>
                        <p className="mt-1 text-xs text-gray-500">
                          {v.borgoName || "Borgo"} {v.poiName ? `· ${v.poiName}` : ""}
                        </p>

                        {/* Stats */}
                        <p className="mt-2 text-xs text-gray-600">
                          👁️ {typeof v.views === "number" ? v.views : "—"} · ❤️ {typeof v.likes === "number" ? v.likes : "—"}
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
