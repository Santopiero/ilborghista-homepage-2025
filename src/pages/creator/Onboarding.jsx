// src/pages/Onboarding.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, Menu, LogOut, X, Settings, Bell,
  Upload as UploadIcon, Youtube, Image as ImageIcon,
  MapPin, Landmark, Tag, Share2, Eye, Heart, Calendar,
  CheckCircle2, Trophy, BadgeCheck, Film, Layers3
} from "lucide-react";

/* =======================
   PALETTE (area Creator)
======================= */
const brand = {
  primary: "#0D4D4D",
  accent: "#14B8A6",
  bg: "#F0FDFA",
  soft: "#ECFEFF",
  sand: "#FFFDF7",
};

/* =======================
   LIVELLI CREATOR
======================= */
const CREATOR_LEVELS = [
  { name: "Creator", at: 0 },
  { name: "Content Builder", at: 100 },
  { name: "Story Architect", at: 250 },
  { name: "Content Master", at: 500 },
  { name: "Top Creator 🏆", at: 900 },
];

/* =======================
   UTILS
======================= */
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function id() { try { return crypto.randomUUID(); } catch { return Math.random().toString(36).slice(2); } }
function ytIdFromUrl(url) {
  const m = String(url).match(/(?:v=|\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : "";
}
function Toast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 1800); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[70]">
      <div className="rounded-xl px-3.5 py-2 shadow-lg border text-sm bg-white"
           style={{ borderColor: `${brand.accent}66`, color: brand.primary }}>
        {msg}
      </div>
    </div>
  );
}
function Progress({ value = 0, hint = "#E6FFFB", fill = brand.primary }) {
  const pct = clamp(Math.round(value), 0, 100);
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: hint }}>
      <div className="h-2 rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: fill }} />
    </div>
  );
}

/* =======================
   COMPONENT
======================= */
export default function Onboarding() {
  const navigate = useNavigate();

  // Auth (mock)
  const [logged, setLogged] = useState(() => !!localStorage.getItem("ib_token"));
  const logout = () => { localStorage.removeItem("ib_token"); setLogged(false); navigate("/"); };

  // Profile
  const [profile, setProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ib_creator_profile_v2")) || {
        handle: "@creator",
        bio: "Racconto la bellezza dei borghi.",
        avatar: "",
        links: { site: "", ig: "" },
        notify: true,
        points: 0,
      };
    } catch { return { handle: "@creator", bio: "", avatar: "", links: { site:"", ig:"" }, notify: true, points: 0 }; }
  });
  const saveProfile = (p) => {
    setProfile(p);
    try { localStorage.setItem("ib_creator_profile_v2", JSON.stringify(p)); } catch {}
  };

  // Level
  const levelIdx = useMemo(() => CREATOR_LEVELS.reduce((acc, lv, i) => profile.points >= lv.at ? i : acc, 0), [profile.points]);
  const level = CREATOR_LEVELS[levelIdx];
  const nextLevel = CREATOR_LEVELS[levelIdx + 1] || CREATOR_LEVELS[CREATOR_LEVELS.length - 1];
  const progress = ((profile.points - level.at) / Math.max(1, nextLevel.at - level.at)) * 100;

  // Videos
  const [videos, setVideos] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ib_creator_videos")) || []; } catch { return []; }
  });
  const persistVideos = (arr) => { setVideos(arr); try { localStorage.setItem("ib_creator_videos", JSON.stringify(arr)); } catch {} };

  // Tabs (sticky)
  const TABS = ["Tutti", "Pubblicati", "Programmati", "Bozze", "In attesa"];
  const [tab, setTab] = useState("Tutti");
  const filtered = useMemo(() => {
    if (tab === "Tutti") return videos;
    if (tab === "Bozze") return videos.filter(v => v.status === "Bozza");
    return videos.filter(v => v.status === tab);
  }, [videos, tab]);

  // Missions (auto)
  const [missions, setMissions] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ib_creator_missions_v3")) || defaultMissions(); }
    catch { return defaultMissions(); }
  });
  function defaultMissions() {
    return [
      { id: "upload1",   t: "Carica 1 video",      goal: 1,   p: 0, reward: 40, unlocked: true,  done: false },
      { id: "schedule1", t: "Programma 1 video",   goal: 1,   p: 0, reward: 20, unlocked: false, done: false },
      { id: "pub3",      t: "Pubblica 3 video",    goal: 3,   p: 0, reward: 60, unlocked: false, done: false },
      { id: "share1",    t: "Condividi 1 video",   goal: 1,   p: 0, reward: 20, unlocked: false, done: false },
      { id: "views100",  t: "100 visual su 1 vid", goal: 100, p: 0, reward: 80, unlocked: false, done: false },
    ];
  }
  const persistMissions = (next) => { setMissions(next); try { localStorage.setItem("ib_creator_missions_v3", JSON.stringify(next)); } catch {} };

  const unlockNext = (id) => {
    const order = ["upload1", "schedule1", "pub3", "share1", "views100"];
    const idx = order.indexOf(id); const nextId = order[idx + 1];
    return missions.map(m => m.id === nextId ? { ...m, unlocked: true } : m);
  };

  const award = (pts) => saveProfile({ ...profile, points: profile.points + pts });

  const tickMission = (id, inc = 1) => {
    let next = missions.map(m => m.id === id ? { ...m, p: clamp(m.p + inc, 0, m.goal) } : m);
    const m = next.find(x => x.id === id);
    if (m && !m.done && m.p >= m.goal) {
      m.done = true; award(m.reward);
      next = unlockNext(id);
    }
    persistMissions(next);
  };

  // Simulate views growth for published
  useEffect(() => {
    const t = setInterval(() => {
      setVideos(prev => {
        const arr = prev.map(v => v.status === "Pubblicati"
          ? { ...v, views: clamp((v.views || 0) + (Math.random() < 0.5 ? 1 : 0), 0, 99999) }
          : v);
        try { localStorage.setItem("ib_creator_videos", JSON.stringify(arr)); } catch {}
        const maxViews = arr.reduce((mx, v) => Math.max(mx, v.views || 0), 0);
        if (missions.find(m => m.id === "views100")?.unlocked) {
          setMissions(cur => {
            const n = cur.map(m => m.id === "views100" ? { ...m, p: clamp(maxViews, 0, m.goal) } : m);
            const mv = n.find(x => x.id === "views100");
            if (mv && !mv.done && mv.p >= mv.goal) { mv.done = true; award(mv.reward); }
            try { localStorage.setItem("ib_creator_missions_v3", JSON.stringify(n)); } catch {}
            return n;
          });
        }
        // count published to mission pub3
        const pubCount = arr.filter(v => v.status === "Pubblicati").length;
        if (missions.find(m => m.id === "pub3")?.unlocked) {
          setMissions(cur => {
            const n = cur.map(m => m.id === "pub3" ? { ...m, p: clamp(pubCount, 0, m.goal) } : m);
            const mp = n.find(x => x.id === "pub3");
            if (mp && !mp.done && mp.p >= mp.goal) { mp.done = true; award(mp.reward); }
            try { localStorage.setItem("ib_creator_missions_v3", JSON.stringify(n)); } catch {}
            return n;
          });
        }
        return arr;
      });
    }, 4000);
    return () => clearInterval(t);
  }, [missions]);

  // Upload form (compact)
  const [mode, setMode] = useState("youtube"); // youtube | file
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState(""); // 140
  const [borgo, setBorgo] = useState("");
  const [poi, setPoi] = useState("");
  const [tags, setTags] = useState("");
  const [ytUrl, setYtUrl] = useState("");
  const [fileDataUrl, setFileDataUrl] = useState("");
  const ytid = useMemo(() => ytIdFromUrl(ytUrl), [ytUrl]);
  const thumb = mode === "youtube" && ytid ? `https://i.ytimg.com/vi/${ytid}/hqdefault.jpg` : (fileDataUrl || "");

  const onPick = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => setFileDataUrl(typeof r.result === "string" ? r.result : ""); r.readAsDataURL(f);
  };

  const quickAdd = (status) => {
    if (!title.trim() || !borgo.trim()) return toast("Compila titolo e borgo");
    if (mode === "youtube" && !ytid) return toast("Link YouTube non valido");
    const v = {
      id: id(),
      title: title.trim(),
      desc: desc.trim(),
      borgo: borgo.trim(),
      poi: poi.trim(),
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      status, // "Bozza" | "Programmati" | "Pubblicati" | "In attesa"
      createdAt: Date.now(),
      views: 0,
      likes: 0,
      thumb,
      source: mode === "youtube"
        ? { type: "youtube", id: ytid, url: ytUrl.trim() }
        : { type: "file", dataUrl: fileDataUrl },
    };
    const next = [v, ...videos];
    persistVideos(next);

    // Missions auto
    if (status === "Bozza" || status === "In attesa" || status === "Pubblicati") tickMission("upload1");
    if (status === "Programmati") tickMission("schedule1");

    // Points
    award(status === "Pubblicati" ? 25 : status === "Programmati" ? 18 : 12);

    // Reset form
    setTitle(""); setDesc(""); setBorgo(""); setPoi(""); setTags("");
    setYtUrl(""); setFileDataUrl("");

    toast(status === "Bozza" ? "Salvato in Bozze"
      : status === "Programmati" ? "Programmato"
        : status === "Pubblicati" ? "Pubblicato"
          : "Aggiunto");
  };

  // Share
  const share = async (v) => {
    try {
      if (navigator.share && v.source?.url) {
        await navigator.share({ title: v.title, url: v.source.url });
      } else {
        await navigator.clipboard.writeText(v.source?.url || window.location.href);
      }
      tickMission("share1");
      toast("Link copiato");
    } catch {}
  };

  // Likes
  const like = (vid) => {
    const next = videos.map(v => v.id === vid.id ? { ...v, likes: (v.likes || 0) + 1 } : v);
    persistVideos(next);
  };

  // Edit/Delete minimal
  const remove = (vid) => {
    persistVideos(videos.filter(v => v.id !== vid.id));
    toast("Eliminato");
  };

  // Settings side panel
  const [openSettings, setOpenSettings] = useState(false);

  // Drawer menu
  const [openMenu, setOpenMenu] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState("");
  const toast = (m) => { setToastMsg(m); };

  return (
    <main className="min-h-screen" style={{ background: brand.bg }}>
      {/* TOP BAR */}
      <header className="sticky top-0 z-50 border-b backdrop-blur"
              style={{ borderColor: `${brand.accent}55`, backgroundColor: `${brand.soft}CC` }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="font-extrabold tracking-tight text-base sm:text-lg" style={{ color: brand.primary }}>
            Il Borghista
          </Link>
          <div className="flex-1 mx-3 hidden sm:flex">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: `${brand.primary}99` }} />
              <input
                placeholder="Cerca..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border bg-white/80 outline-none"
                style={{ borderColor: `${brand.accent}66`, color: brand.primary }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setOpenSettings(true)}
                    className="p-2 rounded-lg border hidden sm:inline-flex"
                    style={{ borderColor: `${brand.accent}66`, color: brand.primary }}>
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={() => setOpenMenu(true)}
                    className="p-2 rounded-lg border"
                    style={{ borderColor: `${brand.accent}66`, color: brand.primary }}>
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar avatar={profile.avatar} onPick={(src) => saveProfile({ ...profile, avatar: src })} />
            <div>
              <div className="text-lg sm:text-xl font-black" style={{ color: brand.primary }}>
                {profile.handle || "@creator"}
              </div>
              <div className="text-xs sm:text-sm" style={{ color: `${brand.primary}B3` }}>
                {profile.bio || "Bio breve."}
              </div>
            </div>
          </div>
          <button onClick={() => setOpenSettings(true)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold hidden sm:block"
                  style={{ background: brand.primary, color: "white" }}>
            Modifica profilo
          </button>
        </div>

        {/* GAMIFICATION (compatta) */}
        <div className="mt-4 rounded-2xl p-4 bg-white border"
             style={{ borderColor: `${brand.accent}55` }}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold" style={{ color: brand.primary }}>
                  {level.name}
                </span>
                <span className="text-xs" style={{ color: `${brand.primary}99` }}>
                  Punti: <b>{profile.points}</b> / {nextLevel.at}
                </span>
              </div>
              <div className="mt-2">
                <Progress value={progress} />
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Badge mini label="Builder" unlocked={profile.points >= 100} />
              <Badge mini label="Architect" unlocked={profile.points >= 250} />
              <Badge mini label="Master" unlocked={profile.points >= 500} />
              <Badge mini label="Top" unlocked={profile.points >= 900} />
            </div>
          </div>

          {/* Missioni (icone + numeri, no testo lungo) */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
            {missions.map((m, i) => {
              const pct = Math.round((m.p / m.goal) * 100);
              return (
                <div key={m.id}
                     className="rounded-xl border bg-white p-2"
                     style={{ borderColor: `${brand.accent}40`, opacity: m.unlocked ? 1 : .5 }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold" style={{ color: brand.primary }}>{i + 1}</span>
                    {m.done ? <CheckCircle2 className="w-4 h-4" style={{ color: brand.accent }} /> : <Film className="w-4 h-4" style={{ color: brand.primary }} />}
                  </div>
                  <div className="mt-1">
                    <Progress value={pct} hint="#F3F4F6" fill={brand.accent} />
                  </div>
                  <div className="mt-1 text-[11px]" style={{ color: `${brand.primary}99` }}>
                    {m.p}/{m.goal} · +{m.reward}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* UPLOAD RAPIDO */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="rounded-2xl p-4 bg-white border"
                   style={{ borderColor: `${brand.accent}55` }}>
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold" style={{ color: brand.primary }}>
                Upload rapido
              </h2>
              <div className="flex gap-1">
                <button onClick={() => setMode("youtube")}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${mode==="youtube"?"text-white":""}`}
                        style={{ background: mode==="youtube"?brand.primary:brand.soft, color: mode==="youtube"?"white":brand.primary }}>
                  <Youtube className="inline w-4 h-4 mr-1" /> YouTube
                </button>
                <button onClick={() => setMode("file")}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${mode==="file"?"text-white":""}`}
                        style={{ background: mode==="file"?brand.primary:brand.soft, color: mode==="file"?"white":brand.primary }}>
                  <UploadIcon className="inline w-4 h-4 mr-1" /> File
                </button>
              </div>
            </div>

            <div className="mt-3 grid gap-2">
              <input
                className="rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ borderColor: `${brand.accent}66` }}
                placeholder="Titolo"
                value={title} onChange={(e)=>setTitle(e.target.value)}
              />
              <div className="relative">
                <textarea
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none resize-none"
                  style={{ borderColor: `${brand.accent}66` }}
                  placeholder="Descrizione (max 140)"
                  maxLength={140}
                  rows={2}
                  value={desc} onChange={(e)=>setDesc(e.target.value)}
                />
                <span className="absolute bottom-1 right-2 text-[11px]" style={{ color: `${brand.primary}80` }}>
                  {desc.length}/140
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: `${brand.primary}80` }} />
                  <input
                    className="w-full pl-9 rounded-xl border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: `${brand.accent}66` }}
                    placeholder="Borgo"
                    value={borgo} onChange={(e)=>setBorgo(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Landmark className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: `${brand.primary}80` }} />
                  <input
                    className="w-full pl-9 rounded-xl border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: `${brand.accent}66` }}
                    placeholder="POI (opz.)"
                    value={poi} onChange={(e)=>setPoi(e.target.value)}
                  />
                </div>
              </div>

              <div className="relative">
                <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: `${brand.primary}80` }} />
                <input
                  className="w-full pl-9 rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: `${brand.accent}66` }}
                  placeholder="Tag (separa con virgola)"
                  value={tags} onChange={(e)=>setTags(e.target.value)}
                />
              </div>

              {mode === "youtube" ? (
                <div className="relative">
                  <Youtube className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: `${brand.primary}80` }} />
                  <input
                    className="w-full pl-9 rounded-xl border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: `${brand.accent}66` }}
                    placeholder="URL YouTube"
                    value={ytUrl} onChange={(e)=>setYtUrl(e.target.value)}
                  />
                </div>
              ) : (
                <label className="grid place-items-center gap-2 rounded-xl border border-dashed py-6 cursor-pointer"
                       style={{ borderColor: brand.accent, background: brand.sand }}>
                  <ImageIcon className="w-6 h-6" style={{ color: brand.primary }} />
                  <span className="text-sm" style={{ color: brand.primary }}>Carica file video</span>
                  <input type="file" accept="video/*" className="hidden" onChange={onPick} />
                </label>
              )}

              {/* Miniatura */}
              <div className="mt-1">
                <div className="aspect-video rounded-lg overflow-hidden border bg-[#000]/5 grid place-items-center"
                     style={{ borderColor: `${brand.accent}55` }}>
                  {thumb ? (<img src={thumb} alt="thumb" className="w-full h-full object-cover" />)
                    : (<div className="text-xs" style={{ color: `${brand.primary}80` }}>Miniatura</div>)}
                </div>
              </div>

              {/* Azioni */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button onClick={()=>quickAdd("Bozza")}
                        className="rounded-xl py-2 font-semibold text-sm border"
                        style={{ borderColor: `${brand.accent}66`, color: brand.primary, background: brand.soft }}>
                  Bozza
                </button>
                <button onClick={()=>quickAdd("Programmati")}
                        className="rounded-xl py-2 font-semibold text-sm border"
                        style={{ borderColor: `${brand.accent}66`, color: brand.primary, background: brand.sand }}>
                  Programma
                </button>
                <button onClick={()=>quickAdd("Pubblicati")}
                        className="rounded-xl py-2 font-semibold text-sm"
                        style={{ background: brand.primary, color: "white" }}>
                  Pubblica
                </button>
              </div>
            </div>
          </section>

          {/* QUICK STATS / TIP (icone, poco testo) */}
          <section className="rounded-2xl p-4 bg-white border"
                   style={{ borderColor: `${brand.accent}55` }}>
            <div className="grid grid-cols-3 gap-2">
              <Stat icon={<Eye className="w-5 h-5" />} label="Visual" value={videos.reduce((s,v)=>s+(v.views||0),0)} />
              <Stat icon={<Heart className="w-5 h-5" />} label="Like" value={videos.reduce((s,v)=>s+(v.likes||0),0)} />
              <Stat icon={<Layers3 className="w-5 h-5" />} label="Video" value={videos.length} />
            </div>
            <div className="mt-4 rounded-xl p-3 border"
                 style={{ borderColor: `${brand.accent}40`, background: brand.sand }}>
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: brand.primary }}>
                <BadgeCheck className="w-4 h-4" /> Consiglio rapido
              </div>
              <p className="text-xs mt-1" style={{ color: `${brand.primary}99` }}>
                Titolo chiaro + miniature luminose = più click.
              </p>
            </div>
          </section>
        </div>

        {/* I MIEI VIDEO */}
        <section className="mt-5">
          <div className="sticky top-14 z-40 bg-[color:var(--bg,white)]"
               style={{ ["--bg"]: brand.bg }}>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
              {TABS.map(t => (
                <button key={t} onClick={()=>setTab(t)}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap"
                        style={{
                          background: tab===t?brand.primary:brand.soft,
                          color: tab===t?"white":brand.primary
                        }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="mt-3 grid place-items-center text-center rounded-2xl border p-6 bg-white"
                 style={{ borderColor: `${brand.accent}55` }}>
              <div className="text-5xl">🎬</div>
              <div className="mt-2 text-sm" style={{ color: brand.primary }}>Nessun contenuto qui.</div>
              <button onClick={()=>window.scrollTo({ top: 0, behavior: "smooth" })}
                      className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold"
                      style={{ background: brand.primary, color: "white" }}>
                Carica ora
              </button>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filtered.map(v => (
                <article key={v.id}
                         className="group rounded-xl overflow-hidden bg-white border transition hover:shadow-md"
                         style={{ borderColor: `${brand.accent}55` }}>
                  <div className="relative aspect-video bg-[#000]/5">
                    {v.thumb
                      ? <img src={v.thumb} alt={v.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full grid place-items-center text-xs" style={{ color: brand.primary }}>Anteprima</div>}
                    <span className="absolute top-2 left-2 text-[11px] px-2 py-0.5 rounded-full bg-white/90 border"
                          style={{ borderColor: `${brand.accent}55`, color: brand.primary }}>
                      {v.status}
                    </span>
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-semibold line-clamp-2" style={{ color: brand.primary }}>{v.title}</div>
                    <div className="mt-1 text-xs" style={{ color: `${brand.primary}99` }}>
                      {v.borgo}{v.poi ? ` · ${v.poi}` : ""}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs" style={{ color: `${brand.primary}B3` }}>
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {v.views || 0}</span>
                      <div className="flex items-center gap-1.5">
                        {v.source?.url && (
                          <button onClick={()=>share(v)} className="px-2 py-1 rounded-lg border"
                                  style={{ borderColor: `${brand.accent}55`, color: brand.primary }}>
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={()=>like(v)} className="px-2 py-1 rounded-lg"
                                style={{ background: brand.soft, color: brand.primary }}>
                          <Heart className="w-3.5 h-3.5" /> {v.likes || 0}
                        </button>
                        <button onClick={()=>remove(v)} className="px-2 py-1 rounded-lg border"
                                style={{ borderColor: `${brand.accent}55`, color: brand.primary }}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      {/* DRAWER MENU */}
      {openMenu && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setOpenMenu(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-xl border-l p-4"
               style={{ borderColor: `${brand.accent}55` }}>
            <div className="flex items-center justify-between">
              <div className="font-bold" style={{ color: brand.primary }}>Menu</div>
              <button onClick={()=>setOpenMenu(false)} className="p-1 rounded-lg border"
                      style={{ borderColor: `${brand.accent}55`, color: brand.primary }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="mt-4 grid gap-1 text-sm" style={{ color: brand.primary }}>
              <Link className="px-2 py-2 rounded-lg hover:bg-gray-50" to="/">Home</Link>
              <button onClick={()=>setOpenSettings(true)} className="text-left px-2 py-2 rounded-lg hover:bg-gray-50">Impostazioni</button>
              {logged && (
                <button onClick={logout} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50">
                  <LogOut className="w-4 h-4" /> Esci
                </button>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* SIDE SETTINGS */}
      {openSettings && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setOpenSettings(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl border-l"
               style={{ borderColor: `${brand.accent}55` }}>
            <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: `${brand.accent}40` }}>
              <div className="font-bold" style={{ color: brand.primary }}>Impostazioni</div>
              <button onClick={()=>setOpenSettings(false)} className="p-1 rounded-lg border"
                      style={{ borderColor: `${brand.accent}55`, color: brand.primary }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 grid gap-3">
              <div className="grid gap-1">
                <label className="text-xs" style={{ color: `${brand.primary}99` }}>Handle</label>
                <input className="rounded-xl border px-3 py-2 text-sm outline-none"
                       style={{ borderColor: `${brand.accent}66` }}
                       value={profile.handle} onChange={(e)=>saveProfile({ ...profile, handle: e.target.value })} />
              </div>
              <div className="grid gap-1">
                <label className="text-xs" style={{ color: `${brand.primary}99` }}>Bio</label>
                <textarea className="rounded-xl border px-3 py-2 text-sm outline-none resize-none"
                          rows={3}
                          style={{ borderColor: `${brand.accent}66` }}
                          value={profile.bio} onChange={(e)=>saveProfile({ ...profile, bio: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1">
                  <label className="text-xs" style={{ color: `${brand.primary}99` }}>Sito</label>
                  <input className="rounded-xl border px-3 py-2 text-sm outline-none"
                         style={{ borderColor: `${brand.accent}66` }}
                         value={profile.links.site}
                         onChange={(e)=>saveProfile({ ...profile, links: { ...profile.links, site: e.target.value } })} />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs" style={{ color: `${brand.primary}99` }}>Instagram</label>
                  <input className="rounded-xl border px-3 py-2 text-sm outline-none"
                         style={{ borderColor: `${brand.accent}66` }}
                         value={profile.links.ig}
                         onChange={(e)=>saveProfile({ ...profile, links: { ...profile.links, ig: e.target.value } })} />
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-sm select-none">
                <input type="checkbox" checked={profile.notify}
                       onChange={(e)=>saveProfile({ ...profile, notify: e.target.checked })} />
                Notifiche attive
              </label>
              <button onClick={()=>{ toast("Impostazioni salvate"); setOpenSettings(false); }}
                      className="mt-2 rounded-xl py-2 font-semibold"
                      style={{ background: brand.primary, color: "white" }}>
                Salva
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && <Toast msg={toastMsg} onClose={()=>setToastMsg("")} />}
    </main>
  );
}

/* =======================
   SUB COMPONENTS
======================= */
function Avatar({ avatar, onPick }) {
  const pick = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => onPick(typeof r.result === "string" ? r.result : ""); r.readAsDataURL(f);
  };
  return (
    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-2"
         style={{ borderColor: brand.accent }}>
      {avatar
        ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
        : <div className="w-full h-full grid place-items-center text-xs text-black/30">Avatar</div>}
      <label className="absolute -bottom-1 -right-1 bg-white border rounded-full p-1 shadow cursor-pointer"
             style={{ borderColor: brand.accent }}>
        <input type="file" accept="image/*" className="hidden" onChange={pick} />
        <span className="text-xs" role="img" aria-label="carica">📷</span>
      </label>
    </div>
  );
}

function Badge({ label, unlocked, mini = false }) {
  return (
    <span className={`inline-flex items-center ${mini ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs"} rounded-full border`}
          style={{
            background: unlocked ? "#ECFDF5" : "#F3F4F6",
            color: brand.primary,
            borderColor: `${brand.accent}55`,
            opacity: unlocked ? 1 : .6
          }}>
      {unlocked ? <Trophy className="w-3.5 h-3.5 mr-1" /> : <BadgeCheck className="w-3.5 h-3.5 mr-1" />}
      {label}
    </span>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="rounded-xl p-3 border bg-white"
         style={{ borderColor: `${brand.accent}40` }}>
      <div className="flex items-center gap-2">
        <div className="rounded-lg p-2 border" style={{ borderColor: `${brand.accent}55`, color: brand.primary }}>
          {icon}
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: brand.primary }}>{value}</div>
          <div className="text-[11px]" style={{ color: `${brand.primary}99` }}>{label}</div>
        </div>
      </div>
    </div>
  );
}
