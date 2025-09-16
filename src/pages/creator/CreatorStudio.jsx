// src/pages/creator/CreatorStudio.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Upload, Youtube, Image as ImageIcon, Calendar, MapPin, BarChart2,
  Link as LinkIcon, Trash2, Clock, ChevronDown
} from "lucide-react";

import TopBar from "../../components/TopBar";
import { BORGI_INDEX } from "../../lib/store";
import {
  createVideoDraft, getVideo, updateVideo, publishVideo, scheduleVideo,
  countMyStats, deleteVideo
} from "../../lib/creatorVideos";
import { getCurrentUser, listPoiByBorgo } from "../../lib/store";

const C = {
  primary: "#D54E30",
  primaryDark: "#6B271A",
  cream: "#FAF5E0",
  light: "#F4F4F4",
  gold: "#E1B671",
  danger: "#DC2626",
};

export default function CreatorStudio() {
  const nav = useNavigate();
  const user = getCurrentUser();
  const userId = user?.id || "guest";

  // draft id opzionale in URL: /creator/studio/:id?
  const { id } = useParams();

  const [video, setVideo] = useState(null);
  const [pois, setPois] = useState([]);
  const [saving, setSaving] = useState(false);
  const [when, setWhen] = useState(""); // schedule
  const stats = countMyStats(userId);

  // INIT
  useEffect(() => {
    let v = id ? getVideo(id) : null;
    if (!v) v = createVideoDraft(userId);
    setVideo(v);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, userId]);

  // CARICA POI per il borgo selezionato
  useEffect(() => {
    if (!video?.targetSlug) { setPois([]); return; }
    const list = listPoiByBorgo(video.targetSlug) || [];
    setPois(list);
  }, [video?.targetSlug]);

  // AUTOSAVE
  useEffect(() => {
    if (!video?.id) return;
    const t = setInterval(() => {
      setSaving(true);
      updateVideo(video.id, video);
      setSaving(false);
    }, 2000);
    return () => clearInterval(t);
  }, [video?.id, JSON.stringify(video)]);

  function setField(key, value) {
    setVideo(prev => ({ ...prev, [key]: value }));
  }

  function setTarget(type) {
    if (type === "borgo") {
      setVideo(prev => ({ ...prev, targetType: "borgo", targetPoiId: "" }));
    } else {
      setVideo(prev => ({ ...prev, targetType: "poi" }));
    }
  }

  function validateMinimal() {
    if (!video?.title?.trim()) return "Inserisci un titolo.";
    if (!video?.targetSlug) return "Seleziona un borgo.";
    if (!video?.sourceType || (video.sourceType === "url" && !video.url) || (video.sourceType === "file" && !video.fileKey)) {
      return "Aggiungi un URL o un file video.";
    }
    if (video.targetType === "poi" && !video.targetPoiId) return "Seleziona un POI.";
    return "";
  }

  function handlePublish() {
    const err = validateMinimal();
    if (err) { alert(err); return; }
    publishVideo(video.id);
    // redirect nella “destinazione pubblicazione”
    if (video.targetType === "borgo") {
      nav(`/borghi/${encodeURIComponent(video.targetSlug)}`);
    } else {
      nav(`/borghi/${encodeURIComponent(video.targetSlug)}/poi/${encodeURIComponent(video.targetPoiId)}`);
    }
  }

  function handleSchedule() {
    const err = validateMinimal();
    if (err) { alert(err); return; }
    if (!when) { alert("Imposta data/ora per programmare."); return; }
    scheduleVideo(video.id, new Date(when).toISOString());
    alert("Video programmato!");
  }

  function handleDelete() {
    if (!window.confirm("Eliminare questa bozza?")) return;
    deleteVideo(video.id);
    nav("/creator/miei-contenuti");
  }

  if (!video) {
    return (
      <div className="min-h-dvh">
        <TopBar variant="generic" />
        <div className="pt-16 grid place-items-center text-sm">Caricamento…</div>
      </div>
    );
  }

  const borgoOptions = (BORGI_INDEX || []).map(b => ({ value: b.slug, label: b.name }));

  return (
    <div className="min-h-dvh bg-[#FFF9ED]">
      <TopBar variant="generic" />
      <main className="mx-auto max-w-4xl px-4 pt-16 pb-10">
        <div className="rounded-2xl border-2 shadow-sm p-4 sm:p-6" style={{ borderColor: C.gold, background: "#FFF3DD" }}>
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <h2 className="font-semibold" style={{ color: C.primaryDark }}>Strumenti da Creator</h2>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm" style={{ borderColor: C.gold }}>
                <BarChart2 className="w-4 h-4" /> Video: {stats.videosTotal}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm" style={{ borderColor: C.gold }}>
                <BarChart2 className="w-4 h-4" /> Visualizzazioni: {stats.viewsTotal}
              </span>
            </div>
          </div>

          {/* Statistiche base box */}
          <div className="mt-3 grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-4">
              {/* LEFT: form */}
              <div className="space-y-3">
                <input
                  value={video.title || ""}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="Titolo"
                  className="w-full rounded-xl border px-3 py-2"
                  style={{ borderColor: C.gold }}
                />
                <div>
                  <textarea
                    value={video.description || ""}
                    onChange={(e) => setField("description", e.target.value.slice(0,140))}
                    placeholder="Descrizione (max 140)"
                    className="w-full rounded-xl border px-3 py-2 min-h-[88px]"
                    style={{ borderColor: C.gold }}
                  />
                  <div className="text-xs text-neutral-600 text-right">{(video.description || "").length}/140</div>
                </div>

                {/* Target */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <label className="text-sm" style={{ color: C.primaryDark }}>Borgo</label>
                    <select
                      value={video.targetSlug || ""}
                      onChange={(e) => setField("targetSlug", e.target.value)}
                      className="rounded-xl border px-3 py-2"
                      style={{ borderColor: C.gold }}
                    >
                      <option value="">Seleziona borgo…</option>
                      {borgoOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  <div className="grid gap-1">
                    <label className="text-sm" style={{ color: C.primaryDark }}>POI (opzionale)</label>
                    <select
                      disabled={!video.targetSlug}
                      value={video.targetPoiId || ""}
                      onChange={(e) => { setTarget(e.target.value ? "poi" : "borgo"); setField("targetPoiId", e.target.value); }}
                      className="rounded-xl border px-3 py-2 disabled:bg-neutral-100"
                      style={{ borderColor: C.gold }}
                    >
                      <option value="">Seleziona un POI…</option>
                      {pois.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Media source */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <label className="text-sm block mb-1" style={{ color: C.primaryDark }}>URL YouTube/Vimeo</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70"><Youtube className="w-4 h-4" /></span>
                      <input
                        value={video.sourceType === "url" ? (video.url || "") : ""}
                        onChange={(e) => { setField("sourceType", "url"); setField("url", e.target.value); }}
                        placeholder="https://youtube.com/…"
                        className="w-full rounded-xl border pl-9 pr-3 py-2"
                        style={{ borderColor: C.gold }}
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="text-sm block mb-1" style={{ color: C.primaryDark }}>Oppure Upload file</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70"><Upload className="w-4 h-4" /></span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setField("sourceType", "file");
                          setField("fileKey", f.name + ":" + Date.now()); // key simbolica (in reale: salva blob su IndexedDB)
                          // miniatura demo
                          if (!video.thumbnailUrl) setField("thumbnailUrl", "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1600&auto=format&fit=crop");
                        }}
                        className="w-full rounded-xl border pl-9 pr-3 py-2"
                        style={{ borderColor: C.gold }}
                      />
                    </div>
                  </div>
                </div>

                {/* Thumbnail */}
                <div className="grid gap-1">
                  <span className="text-sm" style={{ color: C.primaryDark }}>Miniatura (auto)</span>
                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: C.gold }}>
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt="thumbnail" className="w-full h-auto object-cover" />
                    ) : (
                      <div className="aspect-video grid place-items-center text-neutral-500">
                        <ImageIcon className="w-6 h-6" />
                        <span className="text-xs mt-1">Nessuna miniatura</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Azioni */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => alert("Bozza salvata")}
                    className="px-4 py-2 rounded-xl border"
                    style={{ borderColor: C.gold, color: C.primaryDark }}
                  >
                    Bozza
                  </button>

                  <div className="inline-flex items-center gap-2">
                    <input
                      type="datetime-local"
                      value={when}
                      onChange={(e) => setWhen(e.target.value)}
                      className="rounded-xl border px-3 py-2"
                      style={{ borderColor: C.gold }}
                    />
                    <button
                      type="button"
                      onClick={handleSchedule}
                      className="px-4 py-2 rounded-xl border"
                      style={{ borderColor: C.gold }}
                    >
                      Programma
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handlePublish}
                    className="px-4 py-2 rounded-xl text-white"
                    style={{ background: C.primary }}
                  >
                    Pubblica (+20)
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    className="ml-auto px-4 py-2 rounded-xl border"
                    style={{ borderColor: C.danger, color: C.danger }}
                  >
                    <Trash2 className="inline w-4 h-4 -mt-0.5 mr-1" /> Elimina
                  </button>
                </div>

                {saving && <div className="text-xs text-neutral-600">Salvataggio…</div>}
              </div>

              {/* RIGHT: stats box */}
              <aside className="rounded-xl border p-3 h-fit" style={{ borderColor: C.gold, background: "#FFF1E2" }}>
                <div className="font-semibold mb-2" style={{ color: C.primaryDark }}>Statistiche base</div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Video totali</span><span className="font-medium">{stats.videosTotal}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Visualizzazioni</span><span className="font-medium">{stats.viewsTotal}</span>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
