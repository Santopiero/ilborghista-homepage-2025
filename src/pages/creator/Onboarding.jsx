// src/pages/CreatorMe.jsx
import React from "react";
import { Link } from "react-router-dom";

/* ====== PALETTE: Creator diversa dall’area Utente ====== */
const brand = {
  primary: "#0D4D4D",     // teal profondo
  accent: "#14B8A6",      // teal/emerald acceso
  bg: "#F0FDFA",          // teal-50
  soft: "#ECFEFF",        // cyan-50
  sand: "#FFFDF7",
};

/* ====== Livelli Creator ====== */
const CREATOR_LEVELS = [
  { name: "Creator", at: 0 },
  { name: "Content Builder", at: 100 },
  { name: "Story Architect", at: 250 },
  { name: "Content Master", at: 500 },
  { name: "Top Creator 🏆", at: 900 },
];

/* keyframes locali per micro-animazioni */
const Keyframes = () => (
  <style>{`
    @keyframes pop { 0%{transform:scale(.9);opacity:.6} 60%{transform:scale(1.04);opacity:1} 100%{transform:scale(1)} }
    .anim-pop { animation: pop .28s ease-out both; }
    .transition-smooth { transition: all .4s cubic-bezier(.2,.8,.2,1); }
  `}</style>
);

export default function CreatorMe() {
  /* =========================
   * Stato & persistenza
   * ========================= */
  const [me, setMe] = React.useState(() => {
    try {
      const raw = localStorage.getItem("ib_creator_profile");
      return raw ? JSON.parse(raw) : { name: "", avatar: "", points: 0, videos: [] };
    } catch { return { name: "", avatar: "", points: 0, videos: [] }; }
  });
  const saveMe = (next) => { setMe(next); try { localStorage.setItem("ib_creator_profile", JSON.stringify(next)); } catch {} };

  /* =========================
   * Livello corrente
   * ========================= */
  const levelIndex = React.useMemo(() => {
    let i = 0; for (let k = 0; k < CREATOR_LEVELS.length; k++) if (me.points >= CREATOR_LEVELS[k].at) i = k; return i;
  }, [me.points]);
  const level = CREATOR_LEVELS[levelIndex];
  const nextLevel = CREATOR_LEVELS[levelIndex + 1] || CREATOR_LEVELS[CREATOR_LEVELS.length - 1];
  const prevTh = level.at, nextTh = nextLevel.at;
  const progress = Math.min(100, Math.round(((me.points - prevTh) / Math.max(1, nextTh - prevTh)) * 100));
  const remaining = Math.max(0, nextTh - me.points);

  /* =========================
   * Confetti + popup celebrate
   * ========================= */
  const canvasRef = React.useRef(null);
  const prefersReduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  const fireConfetti = React.useCallback((opts = {}) => {
    if (prefersReduced) return;
    const { burst = 180, spread = 80, originY = 0.2 } = opts;
    if (typeof window !== "undefined" && typeof window.confetti === "function") {
      window.confetti({ particleCount: Math.min(300, burst), spread, origin: { y: originY } });
      return;
    }
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d");
    const rect = c.getBoundingClientRect();
    const W = (c.width = rect.width * (window.devicePixelRatio || 1));
    const H = (c.height = rect.height * (window.devicePixelRatio || 1));
    const colors = [brand.accent, brand.primary, "#06B6D4", "#22D3EE", "#10B981", "#60A5FA"];
    const rad = (d) => (d * Math.PI) / 180;
    const n = Math.min(300, burst);
    const parts = Array.from({ length: n }).map(() => {
      const angle = rad(-spread / 2 + Math.random() * spread);
      const speed = 6 + Math.random() * 6;
      return {
        x: W / 2, y: H * originY,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - Math.random() * 4,
        g: .18 + Math.random() * .2, life: 60 + Math.random() * 50,
        size: 3 + Math.random() * 4, rot: Math.random() * Math.PI, vr: (Math.random() - .5) * .2,
        color: colors[(Math.random() * colors.length) | 0], alpha: 1,
      };
    });
    let raf; const step = () => {
      ctx.clearRect(0, 0, W, H); let alive = false;
      for (const p of parts) {
        if (p.life <= 0) continue; alive = true; p.life--;
        p.x += p.vx; p.y += p.vy; p.vy += p.g; p.rot += p.vr; p.alpha = Math.max(0, p.life / 110);
        ctx.save(); ctx.globalAlpha = p.alpha; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color; ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2); ctx.restore();
      }
      if (alive) raf = requestAnimationFrame(step);
    }; step(); return () => cancelAnimationFrame(raf);
  }, [prefersReduced]);

  const [celebrate, setCelebrate] = React.useState({ show: false, title: "", subtitle: "" });
  const openCelebrate = (title, subtitle = "") => {
    setCelebrate({ show: true, title, subtitle });
    clearTimeout(openCelebrate._t);
    openCelebrate._t = setTimeout(() => setCelebrate({ show: false, title: "", subtitle: "" }), 2200);
  };

  /* =========================
   * Award points + level-up
   * ========================= */
  const awardPoints = (delta, reason = "") => {
    const before = me.points; const prevIdx = levelIndex;
    const next = { ...me, points: before + delta }; saveMe(next);
    openCelebrate(`+${delta} punti`, reason || "Ottimo!");
    let newIdx = 0; for (let i = 0; i < CREATOR_LEVELS.length; i++) if (next.points >= CREATOR_LEVELS[i].at) newIdx = i;
    fireConfetti({ burst: newIdx > prevIdx ? 220 : 150, spread: newIdx > prevIdx ? 90 : 75 });
    if (newIdx > prevIdx) openCelebrate("🎉 Level up!", `Sei ora ${CREATOR_LEVELS[newIdx].name}`);
  };

  /* =========================
   * Badge (locked/unlocked + anim)
   * ========================= */
  const computeBadges = React.useCallback((pts) => ([
    { key: "builder",  label: "Content Builder",  need: 100, color: "#DBEAFE", icon: "🧱" },
    { key: "architect",label: "Story Architect", need: 250, color: "#D1FAE5", icon: "🧩" },
    { key: "master",   label: "Content Master",  need: 500, color: "#FEF3C7", icon: "🧠" },
    { key: "top",      label: "Top Creator",     need: 900, color: "#FEE2E2", icon: "🏆" },
  ].map(b => ({ ...b, unlocked: pts >= b.need }))), []);
  const badges = computeBadges(me.points);
  const prevUnlocked = React.useRef(badges.filter(b=>b.unlocked).map(b=>b.key).join(","));
  const [justUnlocked, setJustUnlocked] = React.useState({});
  React.useEffect(() => {
    const now = badges.filter(b=>b.unlocked).map(b=>b.key).join(",");
    if (now !== prevUnlocked.current) {
      const newly = badges.filter(b=>b.unlocked && !prevUnlocked.current.includes(b.key))
                          .reduce((acc,b)=> (acc[b.key]=true, acc),{});
      setJustUnlocked(newly); setTimeout(()=>setJustUnlocked({}),700);
      prevUnlocked.current = now;
    }
  }, [badges]);

  /* =========================
   * Missioni AUTOMATICHE
   * upload → share → 100 views
   * ========================= */
  const [missions, setMissions] = React.useState(() => {
    try { const raw = localStorage.getItem("ib_creator_missions_v2"); if (raw) return JSON.parse(raw); } catch {}
    return [
      { id:"upload", title:"Carica 1 video",         goal:1,   progress:0, reward:40, unlocked:true,  done:false },
      { id:"share",  title:"Condividi un video",     goal:1,   progress:0, reward:20, unlocked:false, done:false },
      { id:"views",  title:"Raggiungi 100 visual",   goal:100, progress:0, reward:60, unlocked:false, done:false },
    ];
  });
  const persistMissions = (next) => { setMissions(next); try { localStorage.setItem("ib_creator_missions_v2", JSON.stringify(next)); } catch {} };

  const completeIfNeeded = (nextList, id) => {
    const m = nextList.find(x => x.id === id);
    if (m && !m.done && m.progress >= m.goal) {
      m.done = true;
      awardPoints(m.reward, `Missione completata: ${m.title}`);
      // sblocca la successiva
      const order = ["upload","share","views"];
      const idx = order.indexOf(id);
      const nextId = order[idx+1];
      const n = nextList.find(x=>x.id===nextId);
      if (n) n.unlocked = true;
    }
  };

  // trigger avanzamento missione "upload" quando aggiungi video
  const markUpload = () => {
    const next = missions.map(m => m.id==="upload" ? { ...m, progress: Math.min(m.goal, m.progress+1) } : m);
    completeIfNeeded(next,"upload"); persistMissions(next);
  };
  // trigger avanzamento missione "share" quando usi share
  const markShare = () => {
    const next = missions.map(m => m.id==="share" ? { ...m, progress: Math.min(m.goal, m.progress+1) } : m);
    completeIfNeeded(next,"share"); persistMissions(next);
  };
  // aggiorna missione "views" in tempo reale (max views su qualsiasi video)
  React.useEffect(() => {
    const maxViews = me.videos.reduce((acc,v)=> Math.max(acc, v.views||0), 0);
    setMissions(cur => {
      const next = cur.map(m => m.id==="views"
        ? { ...m, progress: m.unlocked ? Math.min(m.goal, maxViews) : 0 }
        : m
      );
      completeIfNeeded(next,"views"); return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.videos]);

  // Barra riassuntiva missioni
  const missionsTotal = missions.length;
  const missionsDone = missions.filter(m=>m.done).length;
  const missionsPct = Math.round((missionsDone / Math.max(1, missionsTotal)) * 100);

  /* =========================
   * Video: stato + helper
   * ========================= */
  const [tab, setTab] = React.useState("Tutti"); // "Pubblicati" | "In bozza" | "In attesa"
  const setVideos = (arr) => saveMe({ ...me, videos: arr });
  const addVideo = (v) => setVideos([{ ...v, id: cryptoId(), createdAt: Date.now() }, ...me.videos]);

  const filtered = React.useMemo(() => {
    if (tab === "Tutti") return me.videos;
    return me.videos.filter(v => v.status === tab);
  }, [tab, me.videos]);

  // incremento views “soft” sui pubblicati (simula traffico) + persistenza
  React.useEffect(() => {
    const int = setInterval(() => {
      setMe(prev => {
        const vids = [...prev.videos];
        const publishedIdx = vids.map((v,i)=>({v,i})).filter(x=>x.v.status==="Pubblicati");
        if (!publishedIdx.length) return prev;
        const pick = publishedIdx[(Math.random()*publishedIdx.length)|0].i;
        vids[pick] = { ...vids[pick], views: Math.min(9999, (vids[pick].views||0)+1) };
        const next = { ...prev, videos: vids }; try { localStorage.setItem("ib_creator_profile", JSON.stringify(next)); } catch {}
        return next;
      });
    }, 6000);
    return () => clearInterval(int);
  }, []);

  /* =========================
   * Upload form
   * ========================= */
  const [form, setForm] = React.useState({
    mode: "youtube", // "youtube" | "file"
    title: "", borgo: "", attivita: "",
    ytUrl: "", fileDataUrl: "",
    publishNow: false,
  });

  const ytId = React.useMemo(() => {
    const m = form.ytUrl.match(/(?:v=|\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    return m ? m[1] : "";
  }, [form.ytUrl]);

  const absorbFile = (file) => {
    const r = new FileReader();
    r.onload = () => setForm(s => ({ ...s, fileDataUrl: typeof r.result === "string" ? r.result : "" }));
    r.readAsDataURL(file);
  };
  const onDrop = (e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) absorbFile(f); };
  const onFile = (e) => { const f = e.target.files?.[0]; if (f) absorbFile(f); };

  const submitVideo = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.borgo.trim()) return;
    if (form.mode === "youtube" && !ytId) return;
    const base = {
      title: form.title.trim(),
      borgo: form.borgo.trim(),
      attivita: form.attivita.trim(),
      status: form.publishNow ? "Pubblicati" : "In attesa",
      views: 0, likes: 0,
      thumb: form.mode === "youtube" ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : form.fileDataUrl,
      source: form.mode === "youtube" ? { type: "youtube", id: ytId, url: form.ytUrl.trim() } : { type: "file", dataUrl: form.fileDataUrl },
    };
    addVideo(base);
    // auto-missione: upload
    markUpload();
    // punti immediati per l’azione
    awardPoints(20, "Video caricato");
    // reset form
    setForm({ mode:"youtube", title:"", borgo:"", attivita:"", ytUrl:"", fileDataUrl:"", publishNow:false });
  };

  /* =========================
   * Share video (auto mission)
   * ========================= */
  const shareVideo = async (v) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: v.title, url: v.source?.url || window.location.href });
      } else {
        await navigator.clipboard?.writeText(v.source?.url || window.location.href);
      }
      openCelebrate("Condivisione riuscita", "Grazie per far conoscere il borgo!");
      markShare();
      fireConfetti({ burst: 150, spread: 75 });
    } catch {}
  };

  /* =========================
   * Render
   * ========================= */
  return (
    <main className="min-h-screen" style={{ background: brand.bg }}>
      <Keyframes />
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[60]" />

      {/* Popup celebrate */}
      {celebrate.show && (
        <div className="fixed inset-0 z-[65] grid place-items-center">
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative mx-4 rounded-2xl bg-white shadow-2xl border anim-pop"
               style={{ borderColor: brand.accent }}>
            <div className="p-5 text-center max-w-sm">
              <div className="text-3xl mb-1">🎉</div>
              <div className="text-lg font-bold" style={{ color: brand.primary }}>{celebrate.title}</div>
              {celebrate.subtitle && <div className="mt-1 text-sm" style={{ color: `${brand.primary}CC` }}>{celebrate.subtitle}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Header con toggle aree (differenze evidenti) */}
      <header className="border-b sticky top-0 z-50 backdrop-blur"
              style={{ borderColor: `${brand.accent}66`, backgroundColor: `${brand.soft}CC` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="text-lg sm:text-xl font-extrabold" style={{ color: brand.primary }}>
            Il Borghista
          </Link>
          <div className="flex items-center rounded-xl overflow-hidden border"
               style={{ borderColor: brand.accent }}>
            <Link to="/registrazione-utente"
                  className="px-3 py-1.5 text-sm font-semibold"
                  style={{ color: brand.primary, background: brand.soft }}>
              Utente
            </Link>
            <span className="px-3 py-1.5 text-sm font-semibold text-white"
                  style={{ background: brand.primary }}>Creator</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero */}
        <section className="text-center">
          <h1 className="text-xl sm:text-2xl font-black" style={{ color: brand.primary }}>
            Area Creator · Ispirare con le tue storie.
          </h1>
          <p className="text-sm sm:text-base mt-1" style={{ color: `${brand.primary}CC` }}>
            Ti mancano <b>{remaining}</b> punti per diventare <b>{nextLevel.name}</b>.
          </p>
        </section>

        {/* Layout mobile-first: 1 col → 2 col su md */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* ===== SINISTRA: Gamification, Badge, Missioni ===== */}
          <section className="rounded-2xl p-4 sm:p-5 shadow-sm border bg-white transition-smooth"
                   style={{ borderColor: `${brand.accent}80` }}>
            {/* Profilo compatto */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold" style={{ color: brand.primary }}>La tua progressione</h2>
                <p className="text-sm" style={{ color: `${brand.primary}B3` }}>
                  Pubblica video e fai crescere la tua voce: la community ti aspetta.
                </p>
              </div>
              <AvatarUpload me={me} saveMe={saveMe} accent={brand.accent} />
            </div>

            {/* Barra livello */}
            <div className="mt-4 space-y-2">
              <Progress value={progress} primary={brand.primary} hint={brand.soft} />
              <p className="text-center text-sm" style={{ color: `${brand.primary}CC` }}>
                Livello attuale: <b>{level.name}</b> · Punti: <b>{me.points}</b>
              </p>
              <p className="text-center text-xs" style={{ color: `${brand.primary}99` }}>
                Mancano <b>{remaining}</b> punti per <b>{nextLevel.name}</b>.
              </p>
            </div>

            {/* Badge (locked in grigio, unlock animato) */}
            <div className="mt-4">
              <h3 className="text-sm font-bold" style={{ color: brand.primary }}>Badge</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {badges.map((b) => (
                  <span key={b.key}
                        className={`px-2 py-1 rounded-full text-xs border ${b.unlocked ? "anim-pop" : "opacity-40 grayscale"}`}
                        style={{ background: b.unlocked ? b.color : "#F3F4F6", color: brand.primary, borderColor: `${brand.accent}66` }}>
                    <span className="mr-1">{b.icon}</span>{b.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Missioni automatiche */}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold" style={{ color: brand.primary }}>Missioni</h3>
                <div className="text-xs px-2 py-1 rounded-full"
                     style={{ background: brand.soft, color: brand.primary, border:`1px solid ${brand.accent}55` }}>
                  {missionsDone}/{missionsTotal} completate
                </div>
              </div>
              <Progress value={missionsPct} primary={brand.accent} hint="#E6FFFB" />

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {missions.map((m, idx) => {
                  const pct = Math.round((m.progress / m.goal) * 100);
                  return (
                    <article key={m.id}
                      className="rounded-xl border p-3 bg-white transition-smooth"
                      style={{ borderColor: `${brand.accent}80`, opacity: m.unlocked ? 1 : .6 }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold" style={{ color: brand.primary }}>{idx+1}. {m.title}</div>
                          <div className="text-xs mt-0.5" style={{ color: `${brand.primary}99` }}>
                            Ricompensa: <b>+{m.reward} pt</b>
                          </div>
                        </div>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border`}
                              style={{ background: m.done ? "#ECFDF5" : brand.sand, borderColor: `${brand.accent}66`, color: brand.primary }}>
                          {m.done ? "Completata" : m.unlocked ? `${m.progress}/${m.goal}` : "Bloccata"}
                        </span>
                      </div>
                      <div className="mt-2">
                        <Progress value={pct} primary={brand.primary} hint={brand.soft} />
                      </div>
                      {!m.unlocked && (
                        <p className="mt-2 text-xs" style={{ color: `${brand.primary}80` }}>
                          Si sblocca completando la missione precedente.
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ===== DESTRA: Caricamento video ===== */}
          <section className="rounded-2xl p-4 sm:p-5 shadow-sm border bg-white transition-smooth"
                   style={{ borderColor: `${brand.accent}80` }}>
            <h2 className="text-lg sm:text-xl font-bold" style={{ color: brand.primary }}>
              1) Carica il tuo video
            </h2>
            <p className="text-sm mt-1" style={{ color: `${brand.primary}B3` }}>
              Emoziona chi guarda: racconta un gesto, un suono, una luce del tuo borgo. Ogni storia può ispirare un viaggio ✨
            </p>

            {/* Switch modalità */}
            <div className="mt-3 flex gap-2">
              {["youtube", "file"].map((m) => (
                <button key={m}
                        onClick={() => setForm(s => ({ ...s, mode: m }))}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-smooth"
                        style={{
                          background: form.mode === m ? brand.primary : brand.soft,
                          color: form.mode === m ? "white" : brand.primary
                        }}>
                  {m === "youtube" ? "Link YouTube" : "File video"}
                </button>
              ))}
            </div>

            <form onSubmit={submitVideo} className="mt-3 grid gap-3">
              <input className="rounded-xl border px-3 py-2 outline-none focus:ring-2"
                     style={{ borderColor: brand.accent }}
                     placeholder="Titolo (es. Tramonto a Viggiano – consigli e spot)"
                     value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} />
              <div className="grid sm:grid-cols-2 gap-3">
                <input className="rounded-xl border px-3 py-2 outline-none focus:ring-2"
                       style={{ borderColor: brand.accent }}
                       placeholder="Borgo (obbligatorio)" required
                       value={form.borgo} onChange={(e)=>setForm({...form,borgo:e.target.value})} />
                <input className="rounded-xl border px-3 py-2 outline-none focus:ring-2"
                       style={{ borderColor: brand.accent }}
                       placeholder="Attività (opzionale)"
                       value={form.attivita} onChange={(e)=>setForm({...form,attivita:e.target.value})} />
              </div>

              {form.mode === "youtube" ? (
                <input className="rounded-xl border px-3 py-2 outline-none focus:ring-2"
                       style={{ borderColor: brand.accent }}
                       placeholder="Link YouTube (https://youtu.be/...)"
                       value={form.ytUrl} onChange={(e)=>setForm({...form,ytUrl:e.target.value})} />
              ) : (
                <div onDrop={onDrop} onDragOver={(e)=>e.preventDefault()}
                     className="rounded-xl border-2 border-dashed grid place-items-center text-center p-6"
                     style={{ borderColor: brand.accent, background: brand.sand }}>
                  <div>
                    <div className="text-3xl">📤</div>
                    <p className="text-sm" style={{ color: brand.primary }}>Trascina qui il tuo video</p>
                    <p className="text-xs" style={{ color: `${brand.primary}99` }}>oppure</p>
                    <label className="inline-block mt-2 px-3 py-1.5 rounded-lg font-semibold cursor-pointer"
                           style={{ background: brand.primary, color: "white" }}>
                      Scegli file
                      <input type="file" accept="video/*" className="hidden" onChange={onFile} />
                    </label>
                  </div>
                  {form.fileDataUrl && (
                    <div className="mt-3 w-full rounded-lg overflow-hidden border"
                         style={{ borderColor: brand.accent }}>
                      <div className="aspect-video bg-[#000]/5 grid place-items-center text-sm" style={{ color: brand.primary }}>
                        Video pronto per l’upload
                      </div>
                    </div>
                  )}
                </div>
              )}

              <label className="inline-flex items-center gap-2 text-sm select-none">
                <input type="checkbox" checked={form.publishNow}
                       onChange={(e)=>setForm({...form,publishNow:e.target.checked})} />
                Pubblica subito (altrimenti “In attesa”)
              </label>

              <button type="submit"
                      className="min-h-11 rounded-xl font-semibold transition-smooth hover:opacity-95"
                      style={{ background: brand.primary, color: "white" }}>
                🎬 Pubblica video
              </button>

              <p className="text-xs text-center" style={{ color: `${brand.primary}99` }}>
                Al caricamento ottieni un bonus, poi completa le missioni per accelerare la crescita.
              </p>
            </form>
          </section>
        </div>

        {/* ===== I MIEI VIDEO ===== */}
        <section className="mt-6 rounded-2xl p-4 sm:p-5 shadow-sm border bg-white transition-smooth"
                 style={{ borderColor: `${brand.accent}80` }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-bold" style={{ color: brand.primary }}>I miei video</h2>
            <div className="flex gap-2">
              {["Tutti","Pubblicati","In bozza","In attesa"].map(t => (
                <button key={t} onClick={()=>setTab(t)}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-smooth"
                        style={{
                          background: tab===t ? brand.primary : brand.soft,
                          color: tab===t ? "white" : brand.primary
                        }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="mt-4 grid place-items-center text-center rounded-2xl border p-6"
                 style={{ borderColor: brand.accent, background: brand.sand }}>
              <div className="text-4xl mb-2">📹</div>
              <p className="text-sm" style={{ color: brand.primary }}>
                Non hai ancora pubblicato video.
              </p>
              <p className="text-xs" style={{ color: `${brand.primary}99` }}>
                Carica il tuo primo contenuto per avvicinarti al prossimo livello!
              </p>
              <a href="#" onClick={(e)=>{e.preventDefault(); window.scrollTo({top:0,behavior:"smooth"});}}
                 className="mt-3 inline-flex px-4 py-2 rounded-xl font-semibold transition-smooth"
                 style={{ background: brand.primary, color: "white" }}>
                Carica il primo video
              </a>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filtered.map(v => (
                <article key={v.id}
                         className="group rounded-xl border overflow-hidden bg-white transition-shadow hover:shadow-md"
                         style={{ borderColor: `${brand.accent}66` }}>
                  <div className="relative aspect-video bg-[#000]/5">
                    {v.thumb
                      ? <img src={v.thumb} alt={v.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-smooth" />
                      : <div className="w-full h-full grid place-items-center text-sm" style={{ color: brand.primary }}>Nessuna anteprima</div>}
                    <span className="absolute top-2 left-2 text-[11px] px-2 py-0.5 rounded-full bg-white/90 border"
                          style={{ borderColor: `${brand.accent}80`, color: brand.primary }}>
                      {v.status}
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold line-clamp-2" style={{ color: brand.primary }}>{v.title}</h3>
                    <p className="text-xs mt-1" style={{ color: `${brand.primary}99` }}>
                      {v.borgo}{v.attivita ? ` · ${v.attivita}` : ""}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-xs" style={{ color: `${brand.primary}B3` }}>
                      <span>👁️ {v.views || 0}</span>
                      <div className="flex items-center gap-2">
                        {v.source?.url && (
                          <button onClick={()=>shareVideo(v)}
                                  className="px-2 py-1 rounded-lg border text-xs transition-smooth hover:opacity-90"
                                  style={{ borderColor: brand.accent, color: brand.primary }}>
                            Condividi
                          </button>
                        )}
                        <button onClick={()=>{
                                  setVideos(me.videos.map(x=>x.id===v.id?{...x, likes:(x.likes||0)+1}:x));
                                  awardPoints(2,"Apprezzamento ricevuto");
                                }}
                                className="px-2 py-1 rounded-lg text-xs transition-smooth"
                                style={{ background: brand.soft, color: brand.primary }}>
                          👍 {v.likes || 0}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* ===== Support components ===== */
function AvatarUpload({ me, saveMe, accent }) {
  const onChange = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => saveMe({ ...me, avatar: typeof r.result === "string" ? r.result : "" }); r.readAsDataURL(f);
  };
  return (
    <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2" style={{ borderColor: accent }}>
      {me.avatar
        ? <img src={me.avatar} alt="Avatar" className="w-full h-full object-cover" />
        : <div className="w-full h-full grid place-items-center text-xs text-black/30">Nessuna foto</div>}
      <label className="absolute -bottom-1 -right-1 bg-white border rounded-full p-1 shadow cursor-pointer"
             style={{ borderColor: accent }}>
        <input type="file" accept="image/*" className="hidden" onChange={onChange} />
        <span className="text-xs" role="img" aria-label="carica">📷</span>
      </label>
    </div>
  );
}

function Progress({ value = 0, primary = "#000", hint = "#eee" }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="w-full h-2 sm:h-2.5 rounded-full overflow-hidden" style={{ background: hint }}>
      <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${pct}%`, background: primary }} />
    </div>
  );
}

function cryptoId() {
  try { return Math.random().toString(36).slice(2) + crypto.getRandomValues(new Uint32Array(1))[0].toString(36); }
  catch { return Math.random().toString(36).slice(2); }
}
