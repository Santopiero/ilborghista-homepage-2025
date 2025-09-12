// src/pages/creator/Onboarding.jsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SuggestItineraryBtn from "../../components/SuggestItineraryBtn";
import {
  Menu, X, LogOut, Flag, MessageCircle, Upload, Youtube,
  BarChart2, Clock, ChevronRight, Crown, List, Bell,
  Compass, Map, Star, Medal, Trophy, Film,
  Image as ImageIcon, Globe, Link2, MapPin
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

  // creator: profilo pubblico + upload
  const [creatorOpen, setCreatorOpen] = useState(false);

  // profilo creator (per anteprima pubblica)
  const [creatorProfile, setCreatorProfile] = useState({
    coverUrl: "",
    avatarUrl: "",
    displayName: "santopiero",
    bio: "",
    region: "Basilicata",
    traits: [], // es: ["Natura","Food","Storie locali"]
    socials: { website: "", youtube: "", instagram: "", tiktok: "" },
  });

  const TRAIT_OPTS = [
    "Natura", "Food", "Storie locali", "Cammini", "Arte & Cultura", "Family friendly", "Drone", "Vlog"
  ];

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

  /* ================= HEADER ================= */
  return (
    <div className="min-h-screen" style={{ backgroundColor: C.cream }}>
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
              {/* Notifiche nel menu (come richiesto) */}
              <MenuItem icon={Bell} label="Notifiche" />

              {/* I miei contenuti → apri panoramica itinerari */}
              <MenuItem icon={List} label="I miei contenuti" to="/itinerari" />

              <div className="my-2 border-t" style={{ borderColor: C.light }} />
              <MenuItem icon={Trophy} label="Livelli & Obiettivi" />

              {/* Stepper livelli compatto anche nel menu */}
              <div className="ml-8 mt-2 flex items-center gap-3">
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
        {/* COLONNA UTENTE */}
        <section className="lg:col-span-2 space-y-6">
          {/* Riquadro utente */}
          <div className="rounded-2xl border bg-white p-4 sm:p-6" style={{ borderColor: C.gold }}>
            {/* Header card + progress */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-base sm:text-lg font-semibold" style={{ color: C.primaryDark }}>
                  Ciao {user.name}! <span className="opacity-80">({level.name})</span>
                </h2>
                <p className="text-sm" style={{ color: C.primaryDark }}>
                  Mancano <b>{toNext}</b> pt per diventare <b>{next ? next.name : level.name}</b>.
                </p>
              </div>
              {/* progress desktop */}
              <div className="hidden sm:block">
                <div className="mt-1 h-2 w-44 sm:w-56 overflow-hidden rounded-full" style={{ backgroundColor: C.light }}>
                  <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: C.primary }} />
                </div>
                <div className="mt-1 text-right text-xs" style={{ color: C.primaryDark }}>{user.points} pt totali</div>
              </div>
            </div>

            {/* Livelli a icone — mobile ok, desktop più compatti */}
            <div className="mt-4 flex items-center justify-center gap-2 md:gap-2 lg:gap-2">
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
                    <span className="mt-1 text-[10px] sm:text-[11px]" style={{ color: C.primaryDark }}>
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

            {/* Prossimi obiettivi + BARRA ROSSA + BTN Suggerisci itinerario (interno card) */}
            <div className="mt-5">
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

              {/* barra rossa + bottone dentro lo stesso riquadro */}
              <div className="mt-4 rounded-xl p-3"
                   style={{ background: `linear-gradient(90deg, ${C.primary} 0%, ${C.primaryDark} 100%)` }}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="text-white/90 text-sm">
                    Hai un’idea di percorso tra borghi? Suggeriscilo alla community.
                  </div>
                  {/* bottone (versione con componente; se non l’hai, sostituisci con Link) */}
                  <SuggestItineraryBtn className="w-full sm:w-auto" />
                </div>
              </div>
            </div>
          </div>

          {/* CTA CREATOR (se non attivo) */}
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

          {/* SEZIONE CREATOR (profilo pubblico + upload) */}
          {(user.isCreator || creatorOpen) && (
            <>
              {/* ===== Profilo Creator (con anteprima pubblica) ===== */}
              <div className="rounded-2xl border bg-white p-4 sm:p-6" style={{ borderColor: C.gold }}>
                <h3 className="text-base font-semibold mb-3" style={{ color: C.primaryDark }}>Profilo Creator</h3>

                <div className="grid gap-4 lg:grid-cols-3">
                  {/* form */}
                  <div className="lg:col-span-2 space-y-3">
                    <Input label="Nome pubblico" value={creatorProfile.displayName}
                           onChange={(v)=>setCreatorProfile(p=>({...p,displayName:v}))} placeholder="es. santopiero" />

                    <Textarea label="Bio sintetica" value={creatorProfile.bio}
                              onChange={(v)=>setCreatorProfile(p=>({...p,bio:v}))}
                              placeholder="Racconto i borghi con focus su natura, cammini e sapori." maxLength={180} counter />

                    <Input label="Regione" value={creatorProfile.region}
                           onChange={(v)=>setCreatorProfile(p=>({...p,region:v}))} placeholder="Basilicata" icon={<MapPin className="h-4 w-4" style={{color:C.primaryDark}} />} />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input label="Cover URL" value={creatorProfile.coverUrl}
                             onChange={(v)=>setCreatorProfile(p=>({...p,coverUrl:v}))} placeholder="https://…" icon={<ImageIcon className="h-4 w-4" style={{color:C.primaryDark}} />} />
                      <Input label="Avatar URL" value={creatorProfile.avatarUrl}
                             onChange={(v)=>setCreatorProfile(p=>({...p,avatarUrl:v}))} placeholder="https://…" icon={<ImageIcon className="h-4 w-4" style={{color:C.primaryDark}} />} />
                    </div>

                    <div>
                      <Label>Caratteristiche (per card pubblico)</Label>
                      <div className="flex flex-wrap gap-2">
                        {TRAIT_OPTS.map(t => {
                          const active = (creatorProfile.traits||[]).includes(t);
                          return (
                            <button key={t} type="button"
                              onClick={()=>setCreatorProfile(p=>{
                                const set = new Set(p.traits||[]);
                                set.has(t) ? set.delete(t) : set.add(t);
                                return {...p, traits: Array.from(set)};
                              })}
                              className="px-3 py-1.5 rounded-2xl text-sm border"
                              style={{
                                borderColor: active ? C.primary : C.gold,
                                backgroundColor: active ? C.primary : "#fff",
                                color: active ? "#fff" : C.primaryDark,
                              }}>
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input label="Sito web" value={creatorProfile.socials.website}
                             onChange={(v)=>setCreatorProfile(p=>({...p,socials:{...p.socials,website:v}}))} placeholder="https://il-mi-sito.it" icon={<Globe className="h-4 w-4" style={{color:C.primaryDark}} />} />
                      <Input label="YouTube" value={creatorProfile.socials.youtube}
                             onChange={(v)=>setCreatorProfile(p=>({...p,socials:{...p.socials,youtube:v}}))} placeholder="https://youtube.com/…" icon={<Youtube className="h-4 w-4" style={{color:C.primaryDark}} />} />
                      <Input label="Instagram" value={creatorProfile.socials.instagram}
                             onChange={(v)=>setCreatorProfile(p=>({...p,socials:{...p.socials,instagram:v}}))} placeholder="https://instagram.com/…" icon={<Link2 className="h-4 w-4" style={{color:C.primaryDark}} />} />
                      <Input label="TikTok" value={creatorProfile.socials.tiktok}
                             onChange={(v)=>setCreatorProfile(p=>({...p,socials:{...p.socials,tiktok:v}}))} placeholder="https://tiktok.com/@…" icon={<Link2 className="h-4 w-4" style={{color:C.primaryDark}} />} />
                    </div>

                    <div className="flex gap-2">
                      <BtnPrimary onClick={()=>setUser(u=>({...u,isCreator:true}))}>Salva profilo</BtnPrimary>
                      <Link to="/creator/me" className="rounded-xl border px-4 py-2 text-sm hover:opacity-90"
                            style={{ borderColor: C.gold, color: C.primaryDark }}>
                        Vedi profilo pubblico
                      </Link>
                    </div>
                  </div>

                  {/* Anteprima pubblica (coerente con card creator) */}
                  <div>
                    <PublicCreatorCard
                      profile={creatorProfile}
                      stats={{ videos: stats.total, views: stats.views }}
                      palette={C}
                    />
                  </div>
                </div>
              </div>

              {/* ===== Strumenti upload video ===== */}
              <div id="creator-tools" className="rounded-2xl border bg-white p-4 sm:p-6" style={{ borderColor: C.gold }}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold" style={{ color: C.primaryDark }}>Strumenti da Creator</h3>
                  <div className="flex gap-2 text-xs" style={{ color: C.primaryDark }}>
                    <Pill icon={Film}>Video: {stats.total}</Pill>
                    <Pill icon={BarChart2}>Visualizzazioni: {stats.views}</Pill>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  {/* form */}
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
function MenuItem({ icon: Icon, label, href, to, danger }) {
  const Comp = to ? Link : (href ? "a" : "button");
  const props = to ? { to } : href ? { href } : {};
  return (
    <Comp {...props}
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

/* --- Form components --- */
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
function Textarea({ label, value, onChange, placeholder, maxLength=180, counter=false }) {
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

/* --- Card anteprima pubblica creator --- */
function PublicCreatorCard({ profile, stats, palette }) {
  const cover = profile.coverUrl || "https://images.unsplash.com/photo-1533750349088-cd871a92f312?q=80&w=1200&auto=format&fit=crop";
  const avatar = profile.avatarUrl || "https://placehold.co/80x80?text=%20";
  const traits = profile.traits || [];
  const socials = profile.socials || {};
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: palette.gold }}>
      <div className="bg-neutral-100 relative">
        <div className="aspect-[3/1] w-full">
          <img src={cover} alt="cover" className="w-full h-full object-cover" />
        </div>
        <div className="absolute left-4 -bottom-6 h-16 w-16 rounded-full ring-4" style={{ ringColor: "#fff", backgroundColor: "#fff" }}>
          <img src={avatar} alt="avatar" className="h-16 w-16 rounded-full object-cover" />
        </div>
      </div>

      <div className="pt-8 px-4 pb-4">
        <div className="font-semibold" style={{ color: palette.primaryDark }}>{profile.displayName || "creator"}</div>

        <div className="mt-2 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 text-xs rounded-full px-2 py-1"
                style={{ backgroundColor: palette.cream, color: palette.primaryDark, border: `1px solid ${palette.gold}` }}>
            <Film className="w-3 h-3" /> {stats.videos || 0} video
          </span>
          <span className="inline-flex items-center gap-1 text-xs rounded-full px-2 py-1"
                style={{ backgroundColor: palette.cream, color: palette.primaryDark, border: `1px solid ${palette.gold}` }}>
            <BarChart2 className="w-3 h-3" /> {stats.views || 0} views
          </span>
        </div>

        {profile.bio && <p className="mt-2 text-sm" style={{ color: palette.primaryDark }}>{profile.bio}</p>}

        <div className="mt-2 flex flex-wrap gap-1">
          {traits.map((t) => (
            <span key={t} className="text-xs rounded-full border px-2 py-0.5"
                  style={{ borderColor: palette.gold, color: palette.primaryDark }}>
              {t}
            </span>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <a href={socials.website || "#"} className="rounded-xl border px-3 py-2 text-sm text-center hover:bg-neutral-50"
             style={{ borderColor: palette.gold, color: palette.primaryDark }}>
            <div className="inline-flex items-center gap-2 justify-center"><Globe className="w-4 h-4" /> Sito</div>
          </a>
          <a href={socials.youtube || "#"} className="rounded-xl border px-3 py-2 text-sm text-center hover:bg-neutral-50"
             style={{ borderColor: palette.gold, color: palette.primaryDark }}>
            <div className="inline-flex items-center gap-2 justify-center"><Youtube className="w-4 h-4" /> YouTube</div>
          </a>
          <a href={socials.instagram || "#"} className="rounded-xl border px-3 py-2 text-sm text-center hover:bg-neutral-50"
             style={{ borderColor: palette.gold, color: palette.primaryDark }}>
            <div className="inline-flex items-center gap-2 justify-center"><Link2 className="w-4 h-4" /> Instagram</div>
          </a>
          <a href={socials.tiktok || "#"} className="rounded-xl border px-3 py-2 text-sm text-center hover:bg-neutral-50"
             style={{ borderColor: palette.gold, color: palette.primaryDark }}>
            <div className="inline-flex items-center gap-2 justify-center"><Link2 className="w-4 h-4" /> TikTok</div>
          </a>
        </div>

        <div className="mt-3 flex gap-2">
          <button className="flex-1 rounded-xl px-4 py-2 text-sm text-white"
                  style={{ backgroundColor: palette.primary }}>
            Contatta
          </button>
          <button className="rounded-xl border px-4 py-2 text-sm"
                  style={{ borderColor: palette.gold, color: palette.primaryDark }}>
            Vedi profilo
          </button>
        </div>
      </div>
    </div>
  );
}
