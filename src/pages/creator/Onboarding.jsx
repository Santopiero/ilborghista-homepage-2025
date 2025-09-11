// src/pages/Onboarding.jsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SuggestItineraryBtn from "../../components/SuggestItineraryBtn";
import {
  Menu, X, LogOut, Flag, MessageCircle, Upload, Youtube,
  BarChart2, Clock, ChevronRight, Crown, List, Bell,
  Compass, Map, Star, Medal, Trophy, Film
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
   GAMIFICATION (5 livelli a icone)
======================= */
const LEVELS = [
  { key: 1, name: "Curioso",       min: 0,   max: 100,  Icon: Compass },
  { key: 2, name: "Esploratore",   min: 101, max: 250,  Icon: Map },
  { key: 3, name: "Viaggiatore",   min: 251, max: 500,  Icon: Star },
  { key: 4, name: "Ambasciatore",  min: 501, max: 900,  Icon: Medal },
  { key: 5, name: "Il Borghista",  min: 901, max: 999999, Icon: Crown },
];
const POINTS = { checkin: 2, event: 5, feedback: 3, video: 20 };
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
   PAGE (mobile-first)
======================= */
export default function Onboarding() {
  const [menuOpen, setMenuOpen] = useState(false);

  // stato utente
  const [user, setUser] = useState({
    name: "Piero",
    points: 0,
    feedbackGiven: 0,
    eventsReported: 0,
    videosPublished: 0,
    region: "Basilicata",
    streakDays: 0,
    isCreator: false,
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
  const goToVideoUpload = () => { setCreatorOpen(true); document.getElementById("creator-tools")?.scrollIntoView({ behavior: "smooth" }); };

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
      {/* HEADER MOBILE-FIRST */}
      <header className="sticky top-0 z-40 border-b" style={{ borderColor: C.gold, backgroundColor: "rgba(250,245,224,0.96)", backdropFilter: "blur(6px)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="text-lg sm:text-xl font-semibold tracking-tight" style={{ color: C.primaryDark }}>Il Borghista</div>
          <button onClick={() => setMenuOpen(true)} className="ml-2 rounded-lg border bg-white p-2 hover:opacity-90" style={{ borderColor: C.gold }}>
            <Menu className="h-5 w-5" style={{ color: C.primaryDark }} />
          </button>
        </div>
      </header>

      {/* MENU A PANINO (a destra) */}
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85%] overflow-y-auto border-l bg-white p-4 shadow-xl" style={{ borderColor: C.gold }}>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-base font-semibold" style={{ color: C.primaryDark }}>Menu</div>
              <button onClick={() => setMenuOpen(false)} className="rounded-lg p-2 hover:bg-neutral-100">
                <X className="h-5 w-5" style={{ color: C.primaryDark }} />
              </button>
            </div>

            <nav className="space-y-1">
              <MenuItem icon={Bell} label="Notifiche" />
              <MenuItem icon={List} label="I miei contenuti" />
              <div className="my-2 border-t" style={{ borderColor: C.light }} />
              <MenuItem icon={Trophy} label="Livelli & Obiettivi" />
              {/* stepper livelli nel menu */}
              <div className="ml-8 mt-1 flex items-center gap-3">
                {LEVELS.map((l) => {
                  const active = l.name === level.name;
                  const Icon = l.Icon;
                  return (
                    <div key={l.key} className="flex flex-col items-center text-xs" style={{ color: C.primaryDark }}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border"
                           title={l.name}
                           style={{
                             borderColor: active ? C.primary : C.gold,
                             backgroundColor: active ? C.primary : "#fff",
                             color: active ? "#fff" : C.primaryDark,
                           }}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="mt-1 opacity-70">{l.key}</span>
                    </div>
                  );
                })}
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
      <main className="mx-auto max-w-6xl px-4 py-6 lg:grid lg:grid-cols-3 lg:gap-6">
        {/* COLONNA UTENTE (sempre prima su mobile) */}
        <section className="lg:col-span-2 space-y-6">
          {/* Greeting + progress + livelli icone + preferiti + azioni */}
          <div className="rounded-2xl border bg-white p-4 sm:p-6" style={{ borderColor: C.gold }}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-base sm:text-lg font-semibold" style={{ color: C.primaryDark }}>
                  Ciao {user.name}! <span className="opacity-80">({level.name})</span>
                </h2>
                <p className="text-sm" style={{ color: C.primaryDark }}>
                  Mancano <b>{toNext}</b> pt per diventare <b>{next ? next.name : level.name}</b>.
                </p>
              </div>
              <div className="hidden sm:block">
                <div className="mt-1 h-2 w-40 sm:w-56 overflow-hidden rounded-full" style={{ backgroundColor: C.light }}>
                  <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: C.primary }} />
                </div>
                <div className="mt-1 text-right text-xs" style={{ color: C.primaryDark }}>{user.points} pt totali</div>
              </div>
            </div>

            {/* livelli a icone (compatti) */}
            <div className="mt-4 flex items-center justify-between">
              {LEVELS.map((l) => {
                const active = l.name === level.name;
                const Icon = l.Icon;
                return (
                  <div key={l.key} className="flex flex-col items-center">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full border"
                      title={l.name}
                      style={{
                        borderColor: active ? C.primary : C.gold,
                        backgroundColor: active ? C.primary : "#fff",
                        color: active ? "#fff" : C.primaryDark,
                      }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="mt-1 text-[10px] sm:text-xs" style={{ color: C.primaryDark }}>
                      {l.key}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Preferiti */}
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
              <QuickBtn icon={Film} label="Carica video (+20)" onClick={goToVideoUpload} />
            </div>

            {/* Prossimi obiettivi (badge sezione rimossa) */}
            <div className="mt-4">
              <div className="mb-2 text-sm font-medium" style={{ color: C.primaryDark }}>Prossimi obiettivi</div>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center justify-between rounded-lg border px-3 py-2"
                    style={{ borderColor: C.gold, backgroundColor: C.cream, color: C.primaryDark }}>
                  <span>Passa a “{next ? next.name : level.name}”</span>
                  <span>{toNext} pt</span>
                </li>
                <li className="flex items-center justify-between rounded-lg border px-3 py-2"
                    style={{ borderColor: C.gold, backgroundColor: C.cream, color: C.primaryDark }}>
                  <span>Pubblica un video</span>
                  <span>+{POINTS.video} pt</span>
                </li>
              </ul>
            </div>
          </div>

          {/* CTA CREATOR */}
          {!user.isCreator && !creatorOpen && (
            <div className="overflow-hidden rounded-2xl border p-6 sm:p-8"
                 style={{ borderColor: C.gold, background: `linear-gradient(90deg, ${C.primary} 0%, ${C.primaryDark} 100%)` }}>
              <div className="grid items-center gap-6 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <h3 className="text-lg sm:text-xl font-semibold text-white">Carica il tuo primo video e diventa Creator</h3>
                  <p className="mt-1 text-white/90 text-sm">Racconta i tuoi borghi, ottieni <b>+20 punti</b> subito.</p>
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
              <div id="creator-tools" className="rounded-2xl border bg-white p-4 sm:p-6" style={{ borderColor: C.gold }}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold" style={{ color: C.primaryDark }}>Strumenti da Creator</h3>
                  <div className="flex gap-2 text-xs" style={{ color: C.primaryDark }}>
                    <Pill icon={Film}>Video: {stats.total}</Pill>
                    <Pill icon={BarChart2}>Visualizzazioni: {stats.views}</Pill>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  {/* Form upload (semplificato) */}
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
                      <BtnPrimary onClick={addAsPublished}>Pubblica (+20)</BtnPrimary>
                    </div>
                  </div>

                  {/* Statistiche base */}
                  <div className="space-y-3">
                    <div className="rounded-xl border p-3 text-sm" style={{ borderColor: C.gold, backgroundColor: C.cream, color: C.primaryDark }}>
                      <div className="mb-2 font-medium">Statistiche base</div>
                      <RowStat icon={Film} label="Video totali" value={stats.total} />
                      <RowStat icon={BarChart2} label="Visualizzazioni" value={stats.views} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Riquadri Creator */}
              <div className="grid gap-4 md:grid-cols-3">
                <ContentColumn title="Bozze" items={videos.drafts} empty="Nessuna bozza." />
                <ContentColumn title="Programmato" items={videos.scheduled} empty="Nessun video programmato." />
                <ContentColumn title="Pubblicati" items={videos.published} empty="Nessun video pubblicato." showPoints />
              </div>
            </>
          )}

          {/* CTA in fondo: Suggerisci Itinerario (solo qui, non in alto) */}
          <div className="pt-2">
            <SuggestItineraryBtn className="w-full sm:w-auto" />
          </div>
        </section>

        {/* COLONNA DX: attività + classifiche */}
        <aside className="mt-6 space-y-6 lg:mt-0">
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
   UI HELPERS
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
      {counter && <div className="mt-1 text-right text-xs" style={{ color: C.primaryDark }}>{(value||"").length}/{maxLength}</div>}
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
