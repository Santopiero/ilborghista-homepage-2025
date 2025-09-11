// src/pages/Dashboard.jsx
import { useMemo, useState } from "react";
import {
  Menu, X, LogOut, Search, Heart, Bell, User as UserIcon,
  Flag, MessageCircle, Camera, Film, Upload, Youtube,
  BarChart2, Star, BadgeCheck, Clock, ChevronRight, Crown, List, Trophy
} from "lucide-react";

/* =======================
   PALETTE (Il Borghista)
======================= */
const C = {
  primary: "#D54E30",
  primaryDark: "#6B271A",
  cream: "#FAF5E0",
  light: "#F4F4F4",
  gold: "#E1B671",
};

/* =======================
   MOCK (Borgo → POI → Attività)
======================= */
const BORGI = [
  {
    slug: "viggiano",
    name: "Viggiano",
    activities: ["Dormire", "Mangiare & Bere", "Cosa fare", "Artigiani", "Cammini", "Musei", "Natura"],
    poi: [
      { id: "remi", name: "Statua di Remì (Piazza del Popolo)" },
      { id: "santuario", name: "Santuario della Madonna Nera" },
      { id: "belvedere", name: "Belvedere del Sacro Monte" },
    ],
  },
  {
    slug: "castelmezzano",
    name: "Castelmezzano",
    activities: ["Dormire", "Mangiare & Bere", "Cosa fare", "Natura", "Cammini"],
    poi: [
      { id: "volo", name: "Volo dell'Angelo" },
      { id: "roccia", name: "Le Dolomiti Lucane (Rocce)" },
    ],
  },
  {
    slug: "pietrapertosa",
    name: "Pietrapertosa",
    activities: ["Dormire", "Mangiare & Bere", "Cosa fare", "Artigiani"],
    poi: [
      { id: "arabat", name: "Quartiere Arabata" },
      { id: "castello", name: "Castello Normanno" },
    ],
  },
];

/* =======================
   GAMIFICATION (5 livelli)
======================= */
const LEVELS = [
  { key: 1, name: "Curioso", min: 0,   max: 100 },
  { key: 2, name: "Esploratore", min: 101, max: 250 },
  { key: 3, name: "Viaggiatore", min: 251, max: 500 },
  { key: 4, name: "Ambasciatore", min: 501, max: 900 },
  { key: 5, name: "Il Borghista", min: 901, max: 999999 },
];
const POINTS = { checkin: 2, event: 5, feedback: 3, photo: 4, video: 20, like: 1 };
const BADGE_RULES = [
  { id: "fotografo_bronzo", label: "Fotografo • Bronzo", type: "photos", threshold: 3 },
  { id: "recensore_bronzo", label: "Recensore • Bronzo", type: "feedback", threshold: 3 },
  { id: "videomaker_bronzo", label: "Videomaker • Bronzo", type: "videos_published", threshold: 1 },
];
const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop";

/* =======================
   HOOK: livello
======================= */
function useLevel(points) {
  const level = useMemo(
    () => LEVELS.find((l) => points >= l.min && points <= l.max) || LEVELS[LEVELS.length - 1],
    [points]
  );
  const next = useMemo(() => LEVELS.find((l) => l.min > level.min) || null, [level]);
  const span = level.max - level.min || 1;
  const pct = Math.round(Math.min(100, Math.max(0, ((points - level.min) / span) * 100)));
  const toNext = next ? Math.max(0, next.min - points) : 0;
  return { level, next, pct, toNext };
}

/* =======================
   PAGE
======================= */
export default function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);

  // stato utente
  const [user, setUser] = useState({
    name: "Piero",
    points: 0,
    photosUploaded: 0,
    feedbackGiven: 0,
    eventsReported: 0,
    videosPublished: 0,
    region: "Basilicata",
    streakDays: 0,
    isCreator: false, // diventa true quando attiva/pubb
  });
  const { level, next, pct, toNext } = useLevel(user.points);

  // preferiti
  const [favorites, setFavorites] = useState([
    { id: "b1", label: "Castelmezzano", thumb: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800&auto=format&fit=crop" },
    { id: "b2", label: "Pietrapertosa", thumb: "https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=800&auto=format&fit=crop" },
  ]);

  // creator
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [selectedBorgoSlug, setSelectedBorgoSlug] = useState("");
  const selectedBorgo = useMemo(() => BORGI.find(b => b.slug === selectedBorgoSlug) || null, [selectedBorgoSlug]);
  const [form, setForm] = useState({
    title: "", description: "", poiId: "", activity: "", tags: "", url: "", fileName: "", thumbnail: FALLBACK_IMG
  });
  const [videos, setVideos] = useState({ drafts: [], scheduled: [], published: [] });

  // classifiche (mock)
  const leaderboardRegional = [
    { name: "Paolo V.", level: "Ambasciatore", points: 740 },
    { name: "Anna S.", level: "Viaggiatore", points: 520 },
    { name: "Giorgio L.", level: "Esploratore", points: 300 },
  ];
  const leaderboardNational = [
    { name: "Lucia R.", level: "Il Borghista", points: 1400 },
    { name: "Marco D.", level: "Ambasciatore", points: 960 },
    { name: "Ilaria F.", level: "Viaggiatore", points: 650 },
  ];

  // stats creator
  const stats = useMemo(() => {
    const all = [...videos.drafts, ...videos.scheduled, ...videos.published];
    return {
      total: all.length,
      views: all.reduce((s, v) => s + (v.views || 0), 0),
      likes: all.reduce((s, v) => s + (v.likes || 0), 0)
    };
  }, [videos]);

  // attività recente
  const [recent, setRecent] = useState([]);
  const pushActivity = (label, points) => {
    setRecent(r => [{ label, points, ts: Date.now() }, ...r].slice(0, 8));
    if (points) setUser(u => ({ ...u, points: u.points + points }));
  };

  // azioni rapide utente
  const doCheckin = () => { setUser(u => ({ ...u, streakDays: u.streakDays + 1 })); pushActivity("Check-in giornaliero", POINTS.checkin); };
  const doReportEvent = () => { setUser(u => ({ ...u, eventsReported: u.eventsReported + 1 })); pushActivity("Segnalazione evento", POINTS.event); };
  const doFeedback = () => { setUser(u => ({ ...u, feedbackGiven: u.feedbackGiven + 1 })); pushActivity("Feedback lasciato", POINTS.feedback); };
  const doPhoto = () => { setUser(u => ({ ...u, photosUploaded: u.photosUploaded + 1 })); pushActivity("Foto caricata", POINTS.photo); };

  // badge + obiettivi
  const unlockedBadges = useMemo(() => {
    const out = [];
    BADGE_RULES.forEach(r => {
      if (r.type === "photos" && user.photosUploaded >= r.threshold) out.push(r);
      if (r.type === "feedback" && user.feedbackGiven >= r.threshold) out.push(r);
      if (r.type === "videos_published" && user.videosPublished >= r.threshold) out.push(r);
    });
    return out;
  }, [user]);
  const nextObjectives = useMemo(() => {
    const items = [];
    if (next) items.push({ label: `Passa a “${next.name}”`, needed: `${toNext} pt` });
    if (user.photosUploaded < 3) items.push({ label: "Sblocca Fotografo • Bronzo", needed: `carica ${3 - user.photosUploaded} foto` });
    if (user.feedbackGiven < 3) items.push({ label: "Sblocca Recensore • Bronzo", needed: `lascia ${3 - user.feedbackGiven} feedback` });
    if (user.videosPublished < 1) items.push({ label: "Sblocca Videomaker • Bronzo", needed: "pubblica 1 video" });
    return items.slice(0, 3);
  }, [next, toNext, user]);

  // creator helpers
  const baseVideoFromForm = () => {
    const borgo = selectedBorgo?.name || "";
    const poiName = selectedBorgo?.poi.find(p => p.id === form.poiId)?.name || "";
    return {
      id: "v_" + Date.now(),
      title: form.title.trim() || "Senza titolo",
      description: form.description.trim(),
      borgo, poiName,
      activity: form.activity || "",
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      url: form.url.trim(),
      fileName: form.fileName,
      thumbnail: form.thumbnail || FALLBACK_IMG,
      views: Math.floor(Math.random() * 500),
      likes: Math.floor(Math.random() * 50),
    };
  };
  const resetForm = () => setForm({ title: "", description: "", poiId: "", activity: "", tags: "", url: "", fileName: "", thumbnail: FALLBACK_IMG });
  const addAsDraft = () => { const v = baseVideoFromForm(); setVideos(vs => ({ ...vs, drafts: [v, ...vs.drafts] })); setUser(u => ({ ...u, isCreator: true })); pushActivity("Video salvato in bozza", 0); resetForm(); };
  const addAsScheduled = () => { const v = baseVideoFromForm(); setVideos(vs => ({ ...vs, scheduled: [v, ...vs.scheduled] })); setUser(u => ({ ...u, isCreator: true })); pushActivity("Video programmato", 0); resetForm(); };
  const addAsPublished = () => { const v = baseVideoFromForm(); setVideos(vs => ({ ...vs, published: [v, ...vs.published] })); setUser(u => ({ ...u, isCreator: true, videosPublished: u.videosPublished + 1, points: u.points + POINTS.video })); pushActivity("Video pubblicato", POINTS.video); resetForm(); };

  // preferiti
  const removeFav = id => setFavorites(f => f.filter(x => x.id !== id));
  const addFavDemo = () => setFavorites(f => [{ id: "f_" + Date.now(), label: "Nuovo preferito", thumb: FALLBACK_IMG }, ...f]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.cream }}>
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b" style={{ borderColor: C.gold, backgroundColor: "rgba(250,245,224,0.92)", backdropFilter: "blur(6px)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <button onClick={() => setMenuOpen(true)} className="mr-2 rounded-lg border bg-white p-2 hover:opacity-90" style={{ borderColor: C.gold }}>
            <Menu className="h-5 w-5" style={{ color: C.primaryDark }} />
          </button>

          <div className="text-xl font-semibold tracking-tight" style={{ color: C.primaryDark }}>Il Borghista</div>

          <div className="hidden flex-1 px-4 md:block">
            <div className="flex items-center gap-2 rounded-full border bg-white px-3 py-2" style={{ borderColor: C.gold }}>
              <Search className="h-4 w-4" style={{ color: C.primaryDark }} />
              <input className="w-full text-sm outline-none" placeholder="Cerca borghi, luoghi, esperienze..." />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5" style={{ color: C.primaryDark }} />
            <Bell className="h-5 w-5" style={{ color: C.primaryDark }} />
            <div className="h-8 w-8 rounded-full" style={{ backgroundColor: C.gold }} />
          </div>
        </div>
      </header>

      {/* MENU A PANINO */}
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85%] overflow-y-auto border-r bg-white p-4 shadow-xl" style={{ borderColor: C.gold }}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full" style={{ backgroundColor: C.gold }} />
                <div>
                  <div className="text-sm">Ciao <b>{user.name}</b></div>
                  <div className="text-xs" style={{ color: C.primaryDark }}>Livello: <b>{level.name}</b> · {user.points} pt</div>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} className="rounded-lg p-2 hover:bg-neutral-100">
                <X className="h-5 w-5" style={{ color: C.primaryDark }} />
              </button>
            </div>

            <nav className="space-y-1">
              <MenuItem icon={UserIcon} label="Il mio profilo" />
              <MenuItem icon={List} label="I miei contenuti" />
              <MenuItem icon={Heart} label="Preferiti" />
              <div className="my-2 border-t" style={{ borderColor: C.light }} />
              <MenuItem icon={Trophy} label="Livelli & Obiettivi" />
              {/* stepper livelli nel menu */}
              <div className="ml-8 mt-1 space-y-1 text-sm" style={{ color: C.primaryDark }}>
                {LEVELS.map(l => (
                  <div key={l.key} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: level.name === l.name ? C.primary : C.gold, opacity: level.name === l.name ? 1 : .6 }} />
                    <span className="flex-1">{l.name}</span>
                    <span className="text-xs opacity-70">{l.min}–{l.max}</span>
                  </div>
                ))}
              </div>
              <div className="my-2 border-t" style={{ borderColor: C.light }} />
              <MenuItem icon={Crown} label="Classifica Regionale" href="#classifiche" />
              <MenuItem icon={BarChart2} label="Classifica Nazionale" href="#classifiche" />
              <div className="my-2 border-t" style={{ borderColor: C.light }} />
              <MenuItem icon={LogOut} label="Esci" danger />
            </nav>
          </div>
        </div>
      )}

      {/* MAIN */}
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-3">
        {/* COLONNA UTENTE (in alto) */}
        <section className="lg:col-span-2 space-y-6">
          {/* Greeting, progress, stepper, preferiti */}
          <div className="rounded-2xl border bg-white p-4 md:p-6" style={{ borderColor: C.gold }}>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold" style={{ color: C.primaryDark }}>
                  Ciao {user.name}! <span className="opacity-80">({level.name})</span>
                </h2>
                <p className="text-sm" style={{ color: C.primaryDark }}>
                  Mancano <b>{toNext}</b> pt per diventare <b>{next ? next.name : level.name}</b>.
                </p>
              </div>
              <div className="hidden md:block">
                <div className="mt-1 h-2 w-56 overflow-hidden rounded-full" style={{ backgroundColor: C.light }}>
                  <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: C.primary }} />
                </div>
                <div className="mt-1 text-right text-xs" style={{ color: C.primaryDark }}>{user.points} pt totali</div>
              </div>
            </div>

            {/* stepper livelli */}
            <div className="mt-4 grid grid-cols-5 gap-2">
              {LEVELS.map(l => (
                <div key={l.key}
                     className="rounded-lg border px-2 py-2 text-center text-xs"
                     style={{
                       borderColor: C.gold,
                       backgroundColor: level.name === l.name ? C.gold : "#FFFFFF",
                       color: C.primaryDark,
                       fontWeight: level.name === l.name ? 700 : 500
                     }}>
                  {l.name}
                </div>
              ))}
            </div>

            {/* Preferiti in alto */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium" style={{ color: C.primaryDark }}>I tuoi preferiti</h3>
                <button onClick={addFavDemo} className="rounded-lg border px-3 py-1.5 text-xs hover:opacity-90" style={{ borderColor: C.gold, color: C.primaryDark }}>
                  Aggiungi preferito demo
                </button>
              </div>
              {favorites.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {favorites.map(f => (
                    <div key={f.id} className="overflow-hidden rounded-xl border" style={{ borderColor: C.gold }}>
                      <div className="aspect-[16/10] w-full">
                        <img src={f.thumb} alt={f.label} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 text-sm" style={{ color: C.primaryDark, backgroundColor: C.cream }}>
                        <span className="truncate">{f.label}</span>
                        <button onClick={() => removeFav(f.id)} className="text-xs underline">Rimuovi</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm" style={{ color: C.primaryDark }}>Nessun preferito. Salva borghi, esperienze, eventi e prodotti tipici.</div>
              )}
            </div>

            {/* Azioni rapide */}
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <QuickBtn icon={Clock} label="Check-in (+2)" onClick={doCheckin} />
              <QuickBtn icon={Flag} label="Segnala evento (+5)" onClick={doReportEvent} />
              <QuickBtn icon={MessageCircle} label="Lascia feedback (+3)" onClick={doFeedback} />
              <QuickBtn icon={Camera} label="Carica foto (+4)" onClick={doPhoto} />
            </div>

            {/* Badge + obiettivi */}
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2 text-sm font-medium" style={{ color: C.primaryDark }}>Badge sbloccati</div>
                {unlockedBadges.length ? (
                  <div className="flex flex-wrap gap-2">
                    {unlockedBadges.slice(0, 3).map(b => (
                      <span key={b.id} className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
                            style={{ borderColor: C.gold, backgroundColor: C.cream, color: C.primaryDark }}>
                        <BadgeCheck className="h-4 w-4" /> {b.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs" style={{ color: C.primaryDark }}>Sblocca i tuoi primi badge con le azioni rapide qui sopra.</div>
                )}
              </div>
              <div>
                <div className="mb-2 text-sm font-medium" style={{ color: C.primaryDark }}>Prossimi obiettivi</div>
                <ul className="space-y-1 text-sm">
                  {nextObjectives.map((o, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg border px-3 py-2"
                        style={{ borderColor: C.gold, backgroundColor: C.cream, color: C.primaryDark }}>
                      <span>{o.label}</span>
                      <span>{o.needed}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* CTA CREATOR */}
          {!user.isCreator && !creatorOpen && (
            <div className="overflow-hidden rounded-2xl border p-6 sm:p-8"
                 style={{ borderColor: C.gold, background: `linear-gradient(90deg, ${C.primary} 0%, ${C.primaryDark} 100%)` }}>
              <div className="grid items-center gap-6 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <h3 className="text-xl font-semibold text-white">Carica il tuo primo video e diventa Creator</h3>
                  <p className="mt-1 text-white/90 text-sm">Racconta i tuoi borghi, ottieni <b>+20 punti</b> e sblocca il badge <b>Videomaker</b>.</p>
                </div>
                <button onClick={() => setCreatorOpen(true)}
                        className="rounded-xl bg-white px-5 py-3 text-sm font-semibold hover:opacity-90"
                        style={{ color: C.primaryDark }}>
                  Inizia ora
                </button>
              </div>
            </div>
          )}

          {/* SEZIONE CREATOR (in basso) */}
          {(user.isCreator || creatorOpen) && (
            <>
              <div className="rounded-2xl border bg-white p-4 md:p-6" style={{ borderColor: C.gold }}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-semibold" style={{ color: C.primaryDark }}>Strumenti da Creator</h3>
                  <div className="flex gap-2 text-xs" style={{ color: C.primaryDark }}>
                    <Pill icon={Film}>Video totali: {stats.total}</Pill>
                    <Pill icon={BarChart2}>Visualizzazioni: {stats.views}</Pill>
                    <Pill icon={Star}>Like totali: {stats.likes}</Pill>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  {/* Form upload */}
                  <div className="lg:col-span-2 space-y-3">
                    <Input value={form.title} onChange={(v)=>setForm(f=>({...f,title:v}))} placeholder="Titolo" />
                    <Textarea value={form.description} onChange={(v)=>setForm(f=>({...f,description:v}))} placeholder="Descrizione (max 140)" maxLength={140} counter />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Select
                        label="Borgo"
                        value={selectedBorgoSlug}
                        onChange={(v)=>{ setSelectedBorgoSlug(v); setForm(f=>({...f, poiId:"", activity:""})); }}
                        options={[{value:"",label:"Seleziona borgo…"}, ...BORGI.map(b=>({value:b.slug,label:b.name}))]}
                      />
                      <Select
                        label="POI (opzionale)"
                        value={form.poiId}
                        onChange={(v)=>setForm(f=>({...f, poiId:v}))}
                        disabled={!selectedBorgo}
                        options={[{value:"",label: selectedBorgo ? "Seleziona un POI…" : "Seleziona prima un borgo"},
                          ...(selectedBorgo?.poi||[]).map(p=>({value:p.id,label:p.name}))]}
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Select
                        label="Attività (opzionale)"
                        value={form.activity}
                        onChange={(v)=>setForm(f=>({...f, activity:v}))}
                        options={[{value:"",label:"—"},...((selectedBorgo?.activities)||[]).map(a=>({value:a,label:a}))]}
                      />
                      <Input label="Tag (opzionali – aiutano la SEO)" value={form.tags} onChange={(v)=>setForm(f=>({...f,tags:v}))} placeholder="es. famiglia, natura, storia" />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input label="URL YouTube" icon={<Youtube className="h-4 w-4" style={{color:C.primaryDark}}/>}
                             value={form.url} onChange={(v)=>setForm(f=>({...f,url:v}))} placeholder="https://youtube.com/..." />
                      <Input label="Oppure Upload file" icon={<Upload className="h-4 w-4" style={{color:C.primaryDark}}/>}
                             value={form.fileName} onChange={(v)=>setForm(f=>({...f,fileName:v}))} placeholder="video.mp4 (demo)" />
                    </div>

                    <div>
                      <Label>Miniatura (auto)</Label>
                      <img src={form.thumbnail} alt="thumbnail"
                           className="aspect-video w-full rounded-xl border object-cover"
                           style={{ borderColor: C.gold }}
                           onError={(e) => (e.currentTarget.src = FALLBACK_IMG)} />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <BtnOutline onClick={addAsDraft}>Bozza</BtnOutline>
                      <BtnOutline onClick={addAsScheduled}>Programma</BtnOutline>
                      <BtnPrimary onClick={addAsPublished}>Pubblica</BtnPrimary>
                    </div>
                  </div>

                  {/* Stats / Tips */}
                  <div className="space-y-3">
                    <div className="rounded-xl border p-3 text-sm" style={{ borderColor: C.gold, backgroundColor: C.cream, color: C.primaryDark }}>
                      <div className="mb-2 font-medium">Statistiche base</div>
                      <RowStat icon={Film} label="Video totali" value={stats.total} />
                      <RowStat icon={BarChart2} label="Visualizzazioni" value={stats.views} />
                      <RowStat icon={Star} label="Like totali" value={stats.likes} />
                    </div>
                    <div className="rounded-xl border p-3 text-sm" style={{ borderColor: C.gold }}>
                      <div className="mb-2 font-medium" style={{ color: C.primaryDark }}>Consigli rapidi</div>
                      <ul className="list-disc space-y-1 pl-5" style={{ color: C.primaryDark }}>
                        <li>Usa il POI per farti trovare nelle mappe del borgo.</li>
                        <li>Titolo chiaro + miniatura luminosa = più click.</li>
                        <li>I tag sono opzionali ma utili per la SEO.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Riquadri Creator (appaiono solo se Creator è attivo) */}
              <div className="grid gap-4 md:grid-cols-3">
                <ContentColumn title="Bozze" items={videos.drafts} empty="Nessuna bozza." />
                <ContentColumn title="Programmato" items={videos.scheduled} empty="Nessun video programmato." />
                <ContentColumn title="Pubblicati" items={videos.published} empty="Nessun video pubblicato." showPoints />
              </div>
            </>
          )}
        </section>

        {/* COLONNA DX: attività + classifiche */}
        <aside className="space-y-6">
          <div className="rounded-2xl border bg-white p-4" style={{ borderColor: C.gold }}>
            <div className="mb-2 text-sm font-medium" style={{ color: C.primaryDark }}>Attività recente</div>
            <ul className="space-y-2 text-sm">
              {recent.length ? recent.map((a, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg border px-3 py-2"
                    style={{ borderColor: C.gold, backgroundColor: C.cream, color: C.primaryDark }}>
                  <span>{a.label}</span>
                  <span>+{a.points} pt</span>
                </li>
              )) : <li style={{ color: C.primaryDark }}>Ancora nessuna attività.</li>}
            </ul>
          </div>

          <div id="classifiche" className="rounded-2xl border bg-white p-4" style={{ borderColor: C.gold }}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold" style={{ color: C.primaryDark }}>Classifiche</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <LeaderboardCard title="Regionale" icon={Crown} items={leaderboardRegional} mePoints={user.points} />
              <LeaderboardCard title="Nazionale" icon={BarChart2} items={leaderboardNational} mePoints={user.points} />
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

/* =======================
   UI HELPERS (niente import doppi)
======================= */
function MenuItem({ icon: Icon, label, href, danger }) {
  const Comp = href ? "a" : "button";
  return (
    <Comp href={href || undefined}
          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-neutral-50 ${danger ? "text-red-600" : ""}`}>
      <span className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${danger ? "text-red-600" : ""}`} />
        {label}
      </span>
      <ChevronRight className="h-4 w-4" />
    </Comp>
  );
}
function QuickBtn({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className="rounded-xl border bg-white px-3 py-2 text-sm hover:opacity-90"
            style={{ borderColor: C.gold, color: C.primaryDark }}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </div>
    </button>
  );
}
function Pill({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
         style={{ borderColor: C.gold, backgroundColor: C.cream, color: C.primaryDark }}>
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </div>
  );
}
function RowStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between text-sm" style={{ color: C.primaryDark }}>
      <span className="flex items-center gap-2"><Icon className="h-4 w-4" /> {label}</span>
      <b>{value}</b>
    </div>
  );
}
function ContentColumn({ title, items, empty, showPoints }) {
  return (
    <div className="rounded-2xl border bg-white p-3" style={{ borderColor: C.gold }}>
      <div className="mb-2 flex items-center justify-between">
        <div className="font-medium" style={{ color: C.primaryDark }}>{title}</div>
        <span className="text-xs" style={{ color: C.primaryDark }}>{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.map(v => <VideoCard key={v.id} v={v} showPoints={showPoints} />)}
        {!items.length && <EmptyCard text={empty} />}
      </div>
    </div>
  );
}
function VideoCard({ v, showPoints = false }) {
  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: C.gold }}>
      <div className="aspect-video w-full bg-neutral-100">
        <img src={v.thumbnail} alt={v.title} className="h-full w-full object-cover"
             onError={(e) => (e.currentTarget.src = FALLBACK_IMG)} />
      </div>
      <div className="p-2">
        <div className="truncate text-sm font-medium" style={{ color: C.primaryDark }}>{v.title}</div>
        <div className="mt-1 flex items-center justify-between text-xs" style={{ color: C.primaryDark }}>
          <span>{v.borgo}{v.poiName ? ` · ${v.poiName}` : ""}</span>
          <span>{v.views} v · {v.likes} ❤</span>
        </div>
        {showPoints && (
          <div className="mt-2 rounded px-2 py-1 text-xs"
               style={{ backgroundColor: C.cream, color: C.primaryDark }}>
            +20 pt (pubblicato)
          </div>
        )}
      </div>
    </div>
  );
}
function EmptyCard({ text }) {
  return (
    <div className="rounded-lg border border-dashed p-6 text-center text-sm"
         style={{ borderColor: C.gold, color: C.primaryDark }}>
      {text}
    </div>
  );
}
function LeaderboardCard({ title, icon: Icon, items, mePoints }) {
  return (
    <div className="rounded-xl border bg-white p-3" style={{ borderColor: C.gold }}>
      <div className="mb-2 flex items-center gap-2" style={{ color: C.primaryDark }}>
        <Icon className="h-4 w-4" />
        <div className="font-medium">{title}</div>
      </div>
      <ol className="space-y-1 text-sm">
        {items.map((p, i) => (
          <li key={i} className="flex items-center justify-between rounded-lg border px-3 py-2"
              style={{ borderColor: C.light, backgroundColor: C.cream, color: C.primaryDark }}>
            <span>{i + 1}. {p.name} · <span className="opacity-80">{p.level}</span></span>
            <b>{p.points}</b>
          </li>
        ))}
        <li className="mt-2 flex items-center justify-between rounded-lg border border-dashed px-3 py-2"
            style={{ borderColor: C.gold, color: C.primaryDark }}>
          <span>Tu</span>
          <b>{mePoints}</b>
        </li>
      </ol>
    </div>
  );
}

/* --- piccoli componenti form con stile coerente --- */
function Label({ children }) { return <label className="mb-1 block text-xs" style={{ color: C.primaryDark }}>{children}</label>; }
function Input({ label, value, onChange, placeholder, icon }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm"
           style={{ borderColor: C.gold, color: C.primaryDark }}>
        {icon}
        <input className="w-full outline-none" value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} />
      </div>
    </div>
  );
}
function Textarea({ label, value, onChange, placeholder, maxLength=140, counter=false }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <textarea value={value} maxLength={maxLength} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none"
        style={{ borderColor: C.gold, color: C.primaryDark }} />
      {counter && <div className="mt-1 text-right text-xs" style={{ color: C.primaryDark }}>{value.length}/{maxLength}</div>}
    </div>
  );
}
function Select({ label, value, onChange, options, disabled }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <select disabled={disabled} value={value} onChange={(e)=>onChange(e.target.value)}
              className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none disabled:bg-neutral-100"
              style={{ borderColor: C.gold, color: C.primaryDark }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
function BtnPrimary({ children, onClick }) {
  return <button onClick={onClick} className="rounded-xl px-4 py-2 text-sm text-white hover:opacity-90" style={{ backgroundColor: C.primary }}>{children}</button>;
}
function BtnOutline({ children, onClick }) {
  return <button onClick={onClick} className="rounded-xl border px-4 py-2 text-sm hover:opacity-90" style={{ borderColor: C.gold, color: C.primaryDark }}>{children}</button>;
}
