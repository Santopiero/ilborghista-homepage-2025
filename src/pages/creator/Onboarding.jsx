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
import { Upload, CheckCircle2, MapPin, Landmark, Store } from "lucide-react";

/* ---------- Utils ---------- */
function getYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v") || "";
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
  } catch {}
  return "";
}

/* Embed YouTube sicuro */
function YouTubeEmbed({ url, title }) {
  const id = getYouTubeId(url);
  if (!id) return null;
  return (
    <div className="aspect-video w-full">
      <iframe
        className="w-full h-full rounded-xl"
        src={`https://www.youtube.com/embed/${id}`}
        title={title || "Anteprima YouTube"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

/* Player locale per file caricati */
function LocalVideo({ localMediaId }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let alive = true;
    let tmp = null;
    (async () => {
      const obj = await getVideoObjectURL(localMediaId);
      if (alive) { tmp = obj; setUrl(obj); }
    })();
    return () => { alive = false; if (tmp) URL.revokeObjectURL(tmp); };
  }, [localMediaId]);

  if (!url) return <div className="aspect-video w-full rounded-xl bg-gray-100" />;
  return <video src={url} className="w-full rounded-xl" controls preload="metadata" />;
}

/* Mini player: rileva tipo dal contenuto (no hook condizionali) */
function VideoUnit({ v }) {
  if (v?.youtubeUrl) return <YouTubeEmbed url={v.youtubeUrl} title={v.title} />;
  if (v?.localMediaId) return <LocalVideo localMediaId={v.localMediaId} />;
  return null;
}

export default function Onboarding() {
  const nav = useNavigate();
  const user = getCurrentUser();
  const me = getMyCreatorProfile();

  useEffect(() => {
    if (!user || !me) nav("/registrazione-creator", { replace: true });
  }, []); // eslint-disable-line

  if (!me) return null;

  // ---------------- Stepper ----------------
  const [step, setStep] = useState(1); // 1=Profilo, 2=Upload, 3=Portfolio, 4=Gamification

  // ---------------- Profilo ----------------
  const ALL_TAGS = [
    "Food","Outdoor","Storia/Arte","Family","Eventi/Sagre",
    "Hotel/B&B","Nightlife","Drone","Short-form","Long-form",
  ];

  const [form, setForm] = useState(() => ({
    id: me.id,
    name: me.name || "",
    region: me.region || "",
    bio: me.bio || "",
    avatar:
      me.avatar ||
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=800&auto=format&fit=crop",
    categories: me.categories || [],
    links: me.links || { instagram: "", tiktok: "", youtube: "" },
  }));

  function toggleTag(tag) {
    setForm(f => {
      const has = f.categories.includes(tag);
      return { ...f, categories: has ? f.categories.filter(t => t !== tag) : [...f.categories, tag] };
    });
  }

  function saveProfile(next = false) {
    const cleaned = {
      id: form.id,
      name: form.name.trim(),
      region: form.region.trim(),
      bio: form.bio.trim(),
      avatar: form.avatar.trim(),
      categories: form.categories,
      links: {
        instagram: form.links.instagram?.trim() || "",
        tiktok: form.links.tiktok?.trim() || "",
        youtube: form.links.youtube?.trim() || "",
      },
    };
    updateCreator(cleaned);
    if (next) setStep(2);
  }

  // ---------------- Upload video ----------------
  const borghi = useMemo(() => listBorghi(), []);
  const [modeUpload, setModeUpload] = useState("embed"); // "embed" | "file"
  const [borgoSlug, setBorgoSlug] = useState(borghi[0]?.slug || "");
  const [poiId, setPoiId] = useState("");
  const [titleVideo, setTitleVideo] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [okMsg, setOkMsg] = useState("");

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

  function resetUpload() {
    setModeUpload("embed");
    setBorgoSlug(borghi[0]?.slug || "");
    setPoiId("");
    setTitleVideo("");
    setYoutubeUrl("");
    setFile(null);
    setOkMsg("");
    setProgress(0);
    setSaving(false);
  }

  async function submitUpload(e) {
    e.preventDefault();

    // fallback: leggo anche dal form nel DOM
    const fd = new FormData(e.currentTarget);
    const borgoFromForm = (fd.get("borgoSlug") || "").toString().trim();
    const poiFromForm   = (fd.get("poiId") || "").toString().trim();
    const chosenBorgo   = borgoSlug || borgoFromForm;
    const chosenPoi     = (poiId || poiFromForm) || null;

    if (!chosenBorgo) { alert("Seleziona il borgo."); return; }

    try {
      setSaving(true);

      // progress soft: avanza al 90% durante il salvataggio file
      let intervalId = null;
      if (modeUpload === "file") {
        setProgress(5);
        intervalId = setInterval(() => {
          setProgress(p => (p < 90 ? p + Math.max(1, Math.floor(Math.random()*5)) : p));
        }, 200);
      }

      let localMediaId = null;
      if (modeUpload === "embed") {
        if (!youtubeUrl) { alert("Inserisci il link YouTube."); setSaving(false); return; }
      } else {
        if (!file) { alert("Seleziona un file video."); setSaving(false); return; }
        localMediaId = await saveVideoFile(file);
      }

      const v = addVideo({
        title: titleVideo || "Video",
        youtubeUrl: modeUpload === "embed" ? youtubeUrl : null,
        localMediaId: modeUpload === "file" ? localMediaId : null,
        borgoSlug: chosenBorgo,
        poiId: chosenPoi,
        creatorId: me.id,
      });

      if (intervalId) clearInterval(intervalId);
      setProgress(100);

      setMyVideos(prev => [v, ...prev]);
      setOkMsg("Video pubblicato! È visibile nella Home del borgo e, se hai indicato un’attività, anche sulla sua scheda.");
      setTimeout(() => { resetUpload(); setStep(3); }, 350);
    } catch (err) {
      console.error(err);
      alert(err?.message || "Errore durante il caricamento.");
      setSaving(false);
    }
  }

  // ---------------- Portfolio ----------------
  const [myVideos, setMyVideos] = useState(() =>
    me ? listVideosByCreator(me.id) : []
  );
  useEffect(() => {
    if (me?.id) setMyVideos(listVideosByCreator(me.id));
  }, [me?.id]);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="text-sm">
        <Link to="/creator" className="underline">← Torna all’elenco creator</Link>
      </div>

      {/* Stepper */}
      <nav className="flex items-center gap-2 text-sm">
        {['Profilo','Carica video','Portfolio','Gamification'].map((lbl, idx) => (
          <React.Fragment key={idx}>
            <button onClick={() => setStep(idx+1)} className={`px-3 py-1.5 rounded-lg border ${step===idx+1 ? "bg-[#FAF5E0] border-[#E1B671]" : "bg-white"}`}>{idx+1}. {lbl}</button>
            {idx<3 && <span>›</span>}
          </React.Fragment>
        ))}
      </nav>

      {/* STEP 1 – PROFILO */}
      {step === 1 && (
        <section className="rounded-2xl border bg-white p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="md:w-1/3">
              <img
                src={form.avatar}
                alt={form.name || "Avatar"}
                className="w-full h-44 object-cover rounded-xl"
                onError={(e) => { e.currentTarget.src = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2Sy4iYug7a7qTf9wrCac4Fo4zbFI1Cdn8QA&s"; }}
              />
              <p className="text-[11px] text-gray-500 mt-2">Suggerimento: usa un primo piano nitido (min 400×400px).</p>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <div className="text-sm font-semibold mb-1">Nome</div>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Es. Maria Rossi (obbligatorio)"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <div className="text-sm font-semibold mb-1">Regione</div>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Es. Basilicata"
                  value={form.region}
                  onChange={(e) => setForm(f => ({ ...f, region: e.target.value }))}
                />
              </div>
              <div>
                <div className="text-sm font-semibold mb-1">Bio</div>
                <textarea
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder='Es. "Creo mini‑guide dei borghi con consigli su cosa vedere e dove mangiare".'
                  value={form.bio}
                  onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))}
                />
              </div>
              <div>
                <div className="text-sm font-semibold mb-1">Avatar (URL)</div>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="https://…"
                  value={form.avatar}
                  onChange={(e) => setForm(f => ({ ...f, avatar: e.target.value }))}
                />
              </div>

              <div>
                <div className="text-sm font-semibold mb-1">Categorie (tag)</div>
                <div className="flex flex-wrap gap-2">
                  {ALL_TAGS.map((t) => (
                    <button key={t} type="button" onClick={() => toggleTag(t)}
                      className={`text-[12px] px-2 py-1 rounded-full border ${form.categories.includes(t) ? "bg-[#FAF5E0] border-[#E1B671]" : "bg-white"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => saveProfile(false)} className="px-4 py-2 rounded-xl border">Salva</button>
                <button onClick={() => saveProfile(true)} className="px-4 py-2 rounded-xl bg-[#D54E30] text-white font-semibold">Salva e continua</button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* STEP 2 – CARICA VIDEO */}
      {step === 2 && (
        <section className="rounded-2xl border bg-white p-4 space-y-6">
          <h2 className="text-lg font-extrabold text-[#6B271A]">Carica il tuo video</h2>

          {okMsg && (
            <div className="rounded-xl border bg-green-50 text-green-800 px-4 py-3 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> {okMsg}
            </div>
          )}

          <form onSubmit={submitUpload} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
              <input
                value={titleVideo}
                onChange={(e) => setTitleVideo(e.target.value)}
                placeholder="Es. Panoramica del borgo al tramonto"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Borgo <span className="text-red-600">*</span></label>
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-gray-600" />
                  <select
                    name="borgoSlug"
                    value={borgoSlug || ""}
                    onChange={(e) => { setBorgoSlug(e.target.value); setPoiId(""); }}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    {!borgoSlug && <option value="">— Seleziona —</option>}
                    {borghi.map(b => <option key={b.slug} value={b.slug}>{b.name}</option>)}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Il video apparirà nella Home del borgo.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attività (opzionale)</label>
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-gray-600" />
                  <select
                    name="poiId"
                    value={poiId || ""}
                    onChange={(e) => setPoiId(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">— Nessuna —</option>
                    {poiOptions.map(p => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <button type="button" className={`px-3 py-1.5 rounded-lg border ${modeUpload === "embed" ? "bg-[#FAF5E0] border-[#E1B671] text-[#6B271A]" : "bg-white"}`} onClick={() => setModeUpload("embed")}>
                Da link (YouTube)
              </button>
              <button type="button" className={`px-3 py-1.5 rounded-lg border ${modeUpload === "file" ? "bg-[#FAF5E0] border-[#E1B671] text-[#6B271A]" : "bg-white"}`} onClick={() => setModeUpload("file")}>
                Da file (upload)
              </button>
            </div>

            {modeUpload === "embed" ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link YouTube <span className="text-red-600">*</span></label>
                  <input
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Incolla l’URL completo del video.</p>
                </div>
                {/* Anteprima YouTube in fase di upload */}
                {getYouTubeId(youtubeUrl) && (
                  <div className="mt-2">
                    <YouTubeEmbed url={youtubeUrl} title={titleVideo || "Anteprima YouTube"} />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seleziona file video <span className="text-red-600">*</span></label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm"
                />
                <p className="text-[11px] text-gray-500 mt-1">Formati consigliati: MP4/H.264. Max consigliato 500MB.</p>

                {/* Anteprima immediata del file scelto */}
                {filePreview && (
                  <div className="mt-3">
                    <video src={filePreview} className="w-full rounded-lg" controls />
                  </div>
                )}

                {/* Barra di caricamento quando si salva */}
                {saving && (
                  <div className="mt-3">
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-2 bg-[#6B271A]" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Caricamento in corso… ({progress}%)</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-[#6B271A] text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-60">
                <Upload className="w-4 h-4" /> {saving ? "Pubblico..." : "Pubblica video"}
              </button>
              <button type="button" onClick={() => setStep(3)} className="px-4 py-2 rounded-lg border">Vai al portfolio</button>
            </div>
          </form>
        </section>
      )}

      {/* STEP 3 – PORTFOLIO */}
      {step === 3 && (
        <section className="rounded-2xl border bg-white p-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <h2 className="text-lg font-extrabold text-[#6B271A]">Portfolio video</h2>
            <button onClick={() => setStep(2)} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#D54E30] text-white font-semibold shadow hover:opacity-95">
              <Upload className="w-4 h-4" /> Carica un altro video
            </button>
          </div>

          <div className="mt-4 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {myVideos.map((v) => (
              <article key={v.id} className="rounded-xl border bg-white overflow-hidden">
                <VideoUnit v={v} />
                <div className="p-3 space-y-1">
                  <div className="font-semibold text-[#6B271A]">{v.title}</div>
                  <div className="text-xs text-gray-600">
                    Borgo: <span className="font-medium">{v.borgoSlug}</span>
                    {v.poiId ? <> · Attività: <span className="font-medium">{v.poiId}</span></> : null}
                  </div>
                </div>
              </article>
            ))}
            {myVideos.length === 0 && (
              <div className="text-sm text-gray-600">
                Nessun video caricato. <button onClick={() => setStep(2)} className="underline">Carica ora</button>.
              </div>
            )}
          </div>
        </section>
      )}

      {/* STEP 4 – GAMIFICATION (placeholder) */}
      {step === 4 && (
        <section className="rounded-2xl border bg-white p-4">
          <h2 className="text-lg font-extrabold text-[#6B271A]">Gamification</h2>
          <p className="text-sm text-gray-600">Guadagna badge e contatti, scala i livelli e raggiungi <strong>Top Creator</strong> per riscattare un’esperienza da <strong>200€</strong>.</p>
        </section>
      )}
    </main>
  );
}
