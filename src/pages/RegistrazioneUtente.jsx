// src/pages/RegistrazioneUtente.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function RegistrazioneUtente() {
  /* =======================
     Stato profilo & util
  ======================= */
  const [profile, setProfile] = React.useState(() => {
    try {
      const raw = localStorage.getItem("ib_user_profile");
      return raw ? JSON.parse(raw) : { points: 0, streak: 0, lastLogin: null, avatar: "", name: "" };
    } catch {
      return { points: 0, streak: 0, lastLogin: null, avatar: "", name: "" };
    }
  });

  const saveProfile = React.useCallback((next) => {
    setProfile(next);
    try { localStorage.setItem("ib_user_profile", JSON.stringify(next)); } catch {}
  }, []);

  // Livelli
  const USER_LEVELS = React.useMemo(() => ([
    { name: "Curioso", at: 0 },
    { name: "Esploratore", at: 50 },
    { name: "Ambasciatore", at: 150 },
    { name: "Custode", at: 300 },
    { name: "Leggenda 🏆", at: 600 },
  ]), []);

  const levelIndex = React.useMemo(() => {
    let idx = 0;
    for (let i = 0; i < USER_LEVELS.length; i++) if (profile.points >= USER_LEVELS[i].at) idx = i;
    return idx;
  }, [profile.points, USER_LEVELS]);

  const nextLevel = USER_LEVELS[levelIndex + 1] || USER_LEVELS[USER_LEVELS.length - 1];
  const prevThreshold = USER_LEVELS[levelIndex]?.at ?? 0;
  const nextThreshold = nextLevel?.at ?? prevThreshold;
  const remainingToNext = Math.max(0, nextThreshold - profile.points);
  const levelProgress = Math.min(100, Math.round(((profile.points - prevThreshold) / Math.max(1, nextThreshold - prevThreshold)) * 100));

  // Toast
  const [toast, setToast] = React.useState({ show: false, text: "", kind: "success" });
  const showToast = React.useCallback((text, kind = "success") => {
    setToast({ show: true, text, kind });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast({ show: false, text: "", kind }), 2200);
  }, []);

  // Confetti (canvas-confetti se presente; fallback canvas)
  const canvasRef = React.useRef(null);
  const prefersReduced = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const fireConfetti = React.useCallback((opts = {}) => {
    if (prefersReduced) return;
    const { burst = 150, spread = 70 } = opts;
    if (typeof window !== "undefined" && typeof window.confetti === "function") {
      window.confetti({ particleCount: Math.min(300, burst), spread, origin: { y: 0.2 } });
      return;
    }
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const W = (canvas.width = rect.width * (window.devicePixelRatio || 1));
    const H = (canvas.height = rect.height * (window.devicePixelRatio || 1));
    const colors = ["#E1B671", "#6B271A", "#0D4D4D", "#FF7A59", "#2DD4BF", "#60A5FA"];
    const max = Math.min(300, burst);
    const rad = (d) => (d * Math.PI) / 180;
    const parts = Array.from({ length: max }).map(() => {
      const angle = rad(-spread / 2 + Math.random() * spread);
      const speed = 6 + Math.random() * 6;
      return {
        x: W / 2, y: H * 0.25,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 4,
        g: 0.18 + Math.random() * 0.2,
        life: 60 + Math.random() * 50,
        size: 3 + Math.random() * 4,
        color: colors[(Math.random() * colors.length) | 0],
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.2, alpha: 1,
      };
    });
    let frame = 0, raf;
    const step = () => {
      frame++; ctx.clearRect(0, 0, W, H);
      parts.forEach((p) => {
        if (p.life <= 0) return;
        p.life--; p.x += p.vx; p.y += p.vy; p.vy += p.g; p.rot += p.vr; p.alpha = Math.max(0, p.life / 110);
        ctx.globalAlpha = p.alpha; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color; ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2); ctx.restore();
      });
      ctx.globalAlpha = 1;
      if (frame < 180 && parts.some((p) => p.life > 0)) raf = requestAnimationFrame(step);
      else { cancelAnimationFrame(raf); ctx.clearRect(0, 0, W, H); }
    };
    step();
  }, [prefersReduced]);

  // Award points: solo quando decidi di assegnarli (es. approvazione)
  const awardPoints = React.useCallback((delta) => {
    const prevPoints = profile.points;
    const newPoints = prevPoints + delta;
    const prevIdx = levelIndex;
    const next = { ...profile, points: newPoints };
    saveProfile(next);
    // confetti se level-up
    let newIdx = 0;
    for (let i = 0; i < USER_LEVELS.length; i++) if (newPoints >= USER_LEVELS[i].at) newIdx = i;
    if (newIdx > prevIdx) fireConfetti({ burst: 180, spread: 85 });
  }, [profile, levelIndex, USER_LEVELS, saveProfile, fireConfetti]);

  /* =======================
     Check-in (+2)
  ======================= */
  const DAILY_POINTS = 2;
  const todayStr = new Date().toISOString().slice(0, 10);
  const isSameDay = profile.lastLogin === todayStr;

  const doDailyCheckin = () => {
    if (isSameDay) return showToast("Check-in: +2 punti guadagnati oggi!");
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yStr = y.toISOString().slice(0, 10);
    const nextStreak = profile.lastLogin === yStr ? (profile.streak + 1) : 1;
    saveProfile({ ...profile, streak: nextStreak, lastLogin: todayStr });
    awardPoints(DAILY_POINTS);
    showToast("Check-in: +2 punti guadagnati oggi!");
  };

  const onAvatarChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const dataUrl = typeof r.result === "string" ? r.result : "";
      saveProfile({ ...profile, avatar: dataUrl });
      showToast("Foto profilo aggiornata.");
    };
    r.readAsDataURL(f);
  };

  /* =======================
     Preferiti (read-only dai “cuori”) + quick add
  ======================= */
  const FAVORITE_KEYS = ["ib_favorites", "ib_user_favorites", "ib_global_favorites", "ilborghista_favorites", "ilb_favorites"];
  const normalizeFav = (it) => {
    if (!it) return null;
    const id = String(it.id ?? it.slug ?? it.code ?? it.pk ?? cryptoRandom());
    const title = it.title ?? it.name ?? it.borgoName ?? it.label ?? "Preferito";
    const image = it.image ?? it.cover ?? it.thumbnail ?? it.pic ?? "";
    const href = it.href ?? it.link ?? it.url ?? (it.slug ? `/borghi/${it.slug}` : "");
    const type = it.type ?? (it.partner ? "Esperienza" : it.date ? "Evento" : it.price ? "Prodotto" : it.borgoName || it.slug ? "Borgo" : "Altro");
    const meta = it.price ? `da ${it.price} €` : it.date ? it.date : it.location || "";
    return { id, title, image, href, type, meta };
  };
  const readGlobalFavorites = React.useCallback(() => {
    let all = [];
    for (const k of FAVORITE_KEYS) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) all = all.concat(arr);
        }
      } catch {}
    }
    if (Array.isArray(window.__IB_FAVORITES)) all = all.concat(window.__IB_FAVORITES);
    const norm = all.map(normalizeFav).filter(Boolean);
    const m = new Map();
    norm.forEach((f) => m.set(`${f.id}|${f.title}`, f));
    return Array.from(m.values());
  }, []);
  const [favorites, setFavorites] = React.useState(() => readGlobalFavorites());
  React.useEffect(() => {
    const onStorage = (e) => {
      if (!e || !e.key || !FAVORITE_KEYS.includes(e.key)) return;
      setFavorites(readGlobalFavorites());
    };
    window.addEventListener("storage", onStorage);
    const int = setInterval(() => setFavorites(readGlobalFavorites()), 1500);
    return () => { window.removeEventListener("storage", onStorage); clearInterval(int); };
  }, [readGlobalFavorites]);

  const [openFavModal, setOpenFavModal] = React.useState(false);
  const addQuickFavorite = (name) => {
    const item = { id: cryptoRandom(), title: name.trim(), image: "", href: "", type: "Borgo", meta: "" };
    try {
      const arr = JSON.parse(localStorage.getItem("ib_user_favorites") || "[]");
      arr.unshift(item);
      localStorage.setItem("ib_user_favorites", JSON.stringify(arr));
    } catch {}
    setFavorites(readGlobalFavorites());
    // ❌ Niente punti per i preferiti (anti-scam)
    showToast("Preferito aggiunto!");
  };

  /* =======================
     Modali (Feedback / Evento)
  ======================= */
  const [openFeedback, setOpenFeedback] = React.useState(false);
  const [openEvent, setOpenEvent] = React.useState(false);

  const pushToLS = (key, item) => {
    try {
      const arr = JSON.parse(localStorage.getItem(key) || "[]");
      arr.unshift(item);
      localStorage.setItem(key, JSON.stringify(arr));
    } catch {}
  };

  /* =======================
     Render
  ======================= */
  return (
    <main className="min-h-screen bg-[#FFF8E6] relative">
      {/* Canvas confetti */}
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[60]" />

      {/* Header + Toggle */}
      <header className="border-b border-[#E1B671]/40 bg-[#FFF8E6]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-4 flex items-center justify-between">
          <Link to="/" className="text-lg sm:text-xl font-extrabold text-[#6B271A]">Il Borghista</Link>
          <div className="flex items-center rounded-xl overflow-hidden border border-[#E1B671]">
            <span className="px-3 py-1.5 text-sm font-semibold bg-[#6B271A] text-white">Utente</span>
            <Link to="/creator/me" className="px-3 py-1.5 text-sm font-semibold text-[#6B271A] hover:bg-[#FFF1D1]">
              Creator
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-4 sm:p-6 lg:p-8">
        {/* Header motivante */}
        <section className="text-center">
          <h1 className="text-lg sm:text-xl font-black text-[#6B271A]">
            Ciao {profile.name?.trim() || "viaggiatore"}! Oggi puoi aiutare il tuo borgo a farsi conoscere.
          </h1>
          <p className="text-sm sm:text-base text-[#6B271A]/80">
            Ti mancano <b>{remainingToNext}</b> punti per diventare <b>{nextLevel?.name}</b>.
          </p>

          {/* 3 Bottoni azione principali */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setOpenFavModal(true)}
              className="min-h-11 w-full rounded-xl bg-white border border-[#E1B671] px-4 py-3 text-[#6B271A] font-semibold hover:bg-[#FFF1D1]"
            >
              ❤️ Aggiungi preferito
            </button>
            <button
              onClick={() => setOpenEvent(true)}
              className="min-h-11 w-full rounded-xl bg-white border border-[#E1B671] px-4 py-3 text-[#6B271A] font-semibold hover:bg-[#FFF1D1]"
            >
              📅 Segnala evento <span className="opacity-70">( +10 se approvato )</span>
            </button>
            <button
              onClick={() => setOpenFeedback(true)}
              className="min-h-11 w-full rounded-xl bg-white border border-[#E1B671] px-4 py-3 text-[#6B271A] font-semibold hover:bg-[#FFF1D1]"
            >
              💬 Lascia feedback <span className="opacity-70">( +5 se approvato )</span>
            </button>
          </div>
        </section>

        {/* Layout: mobile 1 col, desktop 2 col */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Colonna 1: Profilo + Progress + Check-in + Roadmap */}
          <section className="rounded-2xl border border-[#E1B671]/50 bg-white p-4 sm:p-5 shadow-sm">
            {/* Avatar + info */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#6B271A]">Il tuo profilo</h2>
                <p className="text-sm text-[#6B271A]/70">Carica una foto, effettua il check-in e guadagna punti.</p>
              </div>
              <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-[#E1B671]">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Avatar utente" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-[#6B271A]/40 text-xs">Nessuna foto</div>
                )}
                <label title="Carica foto profilo" className="absolute -bottom-1 -right-1 bg-white border rounded-full p-1 shadow cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
                  <span className="text-xs" role="img" aria-label="carica">📷</span>
                </label>
              </div>
            </div>

            {/* Progress bar unica */}
            <div className="mt-4 space-y-2">
              <ProgressBar value={levelProgress} />
              <p className="text-sm text-[#6B271A]/80 text-center">
                Sei al <b>{levelProgress}%</b> del prossimo livello.
              </p>
              <p className="text-xs text-[#6B271A]/70 text-center">
                Mancano <b>{remainingToNext}</b> punti per raggiungere il livello <b>{nextLevel?.name}</b>.
              </p>
            </div>

            {/* Roadmap livelli: dove sei e dove puoi arrivare */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-[#6B271A]/80">
                <span>Livello attuale: <b>{USER_LEVELS[levelIndex]?.name}</b></span>
                <span>Punti totali: <b>{profile.points}</b></span>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {USER_LEVELS.map((l, i) => {
                  const active = i === levelIndex;
                  return (
                    <div key={l.name} className={`rounded-lg border text-center p-2 ${active ? "border-[#6B271A] bg-[#FFF1D1]" : "border-[#E1B671]/60 bg-[#FFFDF7]"}`}>
                      <div className="text-[11px] font-semibold text-[#6B271A] leading-tight">{l.name}</div>
                      <div className="text-[10px] text-[#6B271A]/70">≥ {l.at} pt</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Streak + Check-in */}
            <div className="mt-4 text-sm text-[#6B271A]/80">
              <div className="flex items-center justify-between">
                <span>🔥 Streak</span>
                <span><b>{profile.streak}</b> {profile.streak === 1 ? "giorno" : "giorni"}</span>
              </div>
              <button
                onClick={doDailyCheckin}
                className={`mt-3 min-h-11 w-full rounded-xl font-semibold text-white ${isSameDay ? "bg-[#6B271A]/60 cursor-not-allowed" : "bg-[#6B271A] hover:opacity-95"}`}
              >
                {isSameDay ? "Check-in: +2 punti guadagnati oggi!" : "Esegui check-in (+2)"}
              </button>
            </div>

            {/* Regole/anti-scam */}
            <div className="mt-4 rounded-xl border border-[#E1B671]/60 bg-[#FFFDF7] p-3 text-xs text-[#6B271A]">
              <b>Come si guadagnano i punti</b><br />
              • Check-in: +2 al giorno.<br />
              • Feedback/Evento: punti assegnati <b>dopo approvazione</b> dell’admin (niente premi facili).<br />
              • Preferiti: <b>0 punti</b>.
            </div>
          </section>

          {/* Colonna 2: Preferiti */}
          <section className="rounded-2xl border border-[#E1B671]/50 bg-white p-4 sm:p-5 shadow-sm">
            <h2 className="text-lg sm:text-xl font-bold text-[#6B271A] text-center md:text-left">I tuoi preferiti</h2>

            {favorites.length === 0 ? (
              <div className="mt-4">
                <p className="text-center text-[#6B271A]/80">
                  Salva i borghi che ami ❤️ e crea la tua mappa dei luoghi del cuore.
                </p>
                {/* Due card finte con cuore lampeggiante */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-[#E1B671]/40 bg-[#FFFDF7]">
                      <div className="aspect-[16/9] bg-gradient-to-br from-[#FFF1D1] to-white relative">
                        <span className="absolute right-2 top-2 text-2xl animate-pulse select-none">❤️</span>
                      </div>
                      <div className="p-3">
                        <div className="h-3 w-1/2 bg-[#FFF1D1] rounded mb-2" />
                        <div className="h-3 w-1/3 bg-[#FFF1D1] rounded" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 text-center">
                  <Link to="/borghi" className="inline-flex min-h-11 px-5 rounded-xl bg-[#6B271A] text-white font-semibold hover:opacity-95">
                    Scopri borghi
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {favorites.map((f) => (
                  <article key={`${f.id}-${f.title}`} className="rounded-xl border border-[#E1B671]/40 bg-[#FFFDF7] overflow-hidden">
                    <div className="relative aspect-[16/9] bg-[#FFF1D1]">
                      {f.image ? (
                        <img src={f.image} alt={f.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-[#6B271A]/40 text-sm">Nessuna immagine</div>
                      )}
                      {f.meta && (
                        <span className="absolute top-2 right-2 text-xs px-2 py-1 rounded-full bg-white/90 text-[#6B271A] shadow">
                          {f.meta}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-[#6B271A] line-clamp-2">{f.title}</h3>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white text-[#6B271A]/80 border border-[#E1B671]/70">
                          {f.type}
                        </span>
                      </div>
                      {f.href ? (
                        <a href={f.href} className="mt-2 inline-flex text-sm text-[#6B271A] underline hover:no-underline">Apri</a>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Modali */}
      {openFavModal && (
        <QuickFavoriteModal
          onClose={() => setOpenFavModal(false)}
          onSubmit={(name) => { addQuickFavorite(name); setOpenFavModal(false); }}
        />
      )}

      {openFeedback && (
        <FeedbackModal
          onClose={() => setOpenFeedback(false)}
          onSubmit={(payload) => {
            // Salva in revisione (niente punti immediati)
            pushToLS("ib_user_feedbacks", { id: cryptoRandom(), status: "pending", createdAt: Date.now(), ...payload });
            fireConfetti({ burst: 140, spread: 70 }); // azione importante
            showToast("Feedback inviato, grazie! In revisione.");
            setOpenFeedback(false);
          }}
        />
      )}

      {openEvent && (
        <EventModal
          onClose={() => setOpenEvent(false)}
          onSubmit={(payload) => {
            // Salva in revisione (niente punti immediati)
            pushToLS("ib_user_events", { id: cryptoRandom(), status: "pending", createdAt: Date.now(), ...payload });
            fireConfetti({ burst: 160, spread: 80 }); // azione importante
            showToast("Evento inviato, in revisione.");
            setOpenEvent(false);
          }}
        />
      )}

      {/* Toast */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 z-[70] rounded-xl px-4 py-3 shadow
          ${toast.kind === "error" ? "bg-red-50 text-red-800 border border-red-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"}`}>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{toast.kind === "error" ? "Errore" : "Ok"}</span>
            <span className="opacity-80">{toast.text}</span>
            <button onClick={() => setToast({ show: false, text: "", kind: "success" })} className="ml-2 opacity-60 hover:opacity-100">✕</button>
          </div>
        </div>
      )}
    </main>
  );
}

/* =======================
   Componenti secondari
======================= */

function cryptoRandom() {
  try { return Math.random().toString(36).slice(2) + crypto.getRandomValues(new Uint32Array(1))[0].toString(36); }
  catch { return Math.random().toString(36).slice(2); }
}

/* Progress bar memoizzata */
const ProgressBar = React.memo(function ProgressBar({ value = 0 }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="w-full h-2 sm:h-2.5 bg-[#FFF1D1] rounded-full overflow-hidden">
      <div
        className="h-full bg-[#6B271A] rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
});

/* Modal base – scroll fix, mobile-first */
function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-0 p-4 sm:p-6 grid place-items-center">
        <section className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-[#E1B671]/50 max-h-[90vh] flex flex-col">
          <div className="px-5 py-4 border-b flex items-center justify-between shrink-0">
            <h3 className="text-lg sm:text-xl font-bold text-[#6B271A]">{title}</h3>
            <button onClick={onClose} aria-label="Chiudi" className="rounded-lg px-2 py-1 hover:bg-gray-50">✕</button>
          </div>
          <div className="p-4 sm:p-5 overflow-y-auto overscroll-contain grow">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}

/* Quick Favorite: input semplice (no punti) */
function QuickFavoriteModal({ onClose, onSubmit }) {
  const [name, setName] = React.useState("");
  const submit = (e) => { e.preventDefault(); if (!name.trim()) return; onSubmit?.(name); };
  return (
    <Modal title="Aggiungi ai preferiti" onClose={onClose}>
      <form onSubmit={submit} className="grid gap-3">
        <p className="text-sm text-[#6B271A]/80">
          Puoi salvare col cuore durante la navigazione oppure aggiungerne uno ora:
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-[#E1B671] px-3 py-2 outline-none focus:ring-2 focus:ring-[#E1B671]/40"
          placeholder="Es. Viggiano"
        />
        <div className="flex items-center gap-2 pt-1">
          <button type="submit" className="min-h-11 px-4 rounded-xl bg-[#6B271A] text-white font-semibold hover:opacity-95">
            Salva preferito
          </button>
          <button type="button" onClick={onClose} className="min-h-11 px-4 rounded-xl border text-[#6B271A] hover:bg-[#FFF1D1]">
            Annulla
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* Modal Feedback (punti se approvato) */
function FeedbackModal({ onClose, onSubmit }) {
  const [form, setForm] = React.useState({ borgo: "", attivita: "", text: "" });
  const submit = (e) => { e.preventDefault(); if (!form.borgo.trim()) return; onSubmit?.({ ...form }); };
  return (
    <Modal title="Lascia un feedback" onClose={onClose}>
      <form onSubmit={submit} className="grid gap-3">
        <div>
          <label className="block text-sm font-semibold text-[#6B271A] mb-1">Borgo <span className="text-red-600">*</span></label>
          <input
            type="text"
            value={form.borgo}
            onChange={(e) => setForm({ ...form, borgo: e.target.value })}
            className="w-full rounded-xl border border-[#E1B671] px-3 py-2 outline-none focus:ring-2 focus:ring-[#E1B671]/40"
            placeholder="Es. Viggiano (PZ)"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#6B271A] mb-1">Attività (facoltativa)</label>
          <input
            type="text"
            value={form.attivita}
            onChange={(e) => setForm({ ...form, attivita: e.target.value })}
            className="w-full rounded-xl border border-[#E1B671] px-3 py-2 outline-none focus:ring-2 focus:ring-[#E1B671]/40"
            placeholder="Nome attività / luogo specifico"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#6B271A] mb-1">Il tuo feedback</label>
          <textarea
            rows="4"
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            className="w-full rounded-xl border border-[#E1B671] px-3 py-2 outline-none focus:ring-2 focus:ring-[#E1B671]/40"
            placeholder="Scrivi qui la tua opinione…"
          />
        </div>
        <p className="text-xs text-[#6B271A]/70">
          Grazie! Il tuo contributo è in <b>revisione</b>. I punti verranno assegnati se approvato.
        </p>
        <div className="flex items-center gap-2 pt-2">
          <button type="submit" className="min-h-11 px-4 rounded-xl bg-[#6B271A] text-white font-semibold hover:opacity-95">Invia feedback</button>
          <button type="button" onClick={onClose} className="min-h-11 px-4 rounded-xl border text-[#6B271A] hover:bg-[#FFF1D1]">Annulla</button>
        </div>
      </form>
    </Modal>
  );
}

/* Modal Evento (scroll fix + poster non tagliato) */
function EventModal({ onClose, onSubmit }) {
  const [form, setForm] = React.useState({
    titolo: "",
    dal: "",
    al: "",
    comune: "",
    tipologia: "Evento culturale",
    tipologiaAltro: "",
    descrizione: "",
    indirizzo: "",
    posterDataUrl: "",
  });

  const TIPI = [
    "Concerto / Live Music",
    "Evento culturale",
    "Sagra / Festival gastronomico",
    "Mercato / Fiera",
    "Altro (specifica)",
  ];

  const onPoster = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setForm((s) => ({ ...s, posterDataUrl: typeof r.result === "string" ? r.result : "" }));
    r.readAsDataURL(f);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.titolo.trim() || !form.dal || !form.comune.trim()) return;
    const payload = {
      ...form,
      al: form.al || form.dal,
      indirizzo: form.indirizzo?.trim() ? form.indirizzo.trim() : "Centro storico",
      tipologia:
        form.tipologia === "Altro (specifica)" && form.tipologiaAltro.trim()
          ? form.tipologiaAltro.trim()
          : form.tipologia,
    };
    onSubmit?.(payload);
  };

  return (
    <Modal title="Segnala evento" onClose={onClose}>
      <form onSubmit={submit} className="grid gap-3">
        <div>
          <label className="block text-sm font-semibold text-[#6B271A] mb-1">Titolo evento <span className="text-red-600">*</span></label>
          <input
            type="text"
            value={form.titolo}
            onChange={(e) => setForm({ ...form, titolo: e.target.value })}
            className="w-full rounded-xl border border-[#E1B671] px-3 py-2 outline-none focus:ring-2 focus:ring-[#E1B671]/40"
            placeholder="Festa della Madonna 2025"
            required
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-[#6B271A] mb-1">Dal <span className="text-red-600">*</span></label>
            <input
              type="date"
              value={form.dal}
              onChange={(e) => setForm({ ...form, dal: e.target.value })}
              className="w-full rounded-xl border border-[#E1B671] px-3 py-2 outline-none focus:ring-2 focus:ring-[#E1B671]/40"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#6B271A] mb-1">Al</label>
            <input
              type="date"
              value={form.al}
              onChange={(e) => setForm({ ...form, al: e.target.value })}
              className="w-full rounded-xl border border-[#E1B671] px-3 py-2 outline-none focus:ring-2 focus:ring-[#E1B671]/40"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#6B271A] mb-1">Comune + Provincia <span className="text-red-600">*</span></label>
          <input
            type="text"
            value={form.comune}
            onChange={(e) => setForm({ ...form, comune: e.target.value })}
            className="w-full rounded-xl border border-[#E1B671] px-3 py-2 outline-none focus:ring-2 focus:ring-[#E1B671]/40"
            placeholder="Viggiano (PZ)"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#6B271A] mb-1">Tipo</label>
          <select
            value={form.tipologia}
            onChange={(e) => setForm({ ...form, tipologia: e.target.value })}
            className="w-full rounded-xl border border-[#E1B671] px-3 py-2 outline-none focus:ring-2 focus:ring-[#E1B671]/40 bg-white"
          >
            {TIPI.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>

        {form.tipologia === "Altro (specifica)" && (
          <div>
            <label className="block text-sm font-semibold text-[#6B271A] mb-1">Specifica</label>
            <input
              type="text"
              value={form.tipologiaAltro}
              onChange={(e) => setForm({ ...form, tipologiaAltro: e.target.value })}
              className="w-full rounded-xl border border-[#E1B671] px-3 py-2 outline-none focus:ring-2 focus:ring-[#E1B671]/40"
              placeholder="Es. Rievocazione storica"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-[#6B271A] mb-1">Descrizione</label>
          <textarea
            rows="4"
            value={form.descrizione}
            onChange={(e) => setForm({ ...form, descrizione: e.target.value })}
            className="w-full rounded-xl border border-[#E1B671] px-3 py-2 outline-none focus:ring-2 focus:ring-[#E1B671]/40"
            placeholder="Dettagli utili: orari, navette, prezzo, contatti…"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#6B271A] mb-1">Indirizzo preciso</label>
          <input
            type="text"
            value={form.indirizzo}
            onChange={(e) => setForm({ ...form, indirizzo: e.target.value })}
            className="w-full rounded-xl border border-[#E1B671] px-3 py-2 outline-none focus:ring-2 focus:ring-[#E1B671]/40"
            placeholder='Es. "Centro storico" se non specificato'
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#6B271A] mb-1">Locandina evento (consigliata)</label>
          <input type="file" accept="image/*" onChange={onPoster} />
          {form.posterDataUrl && (
            <div className="mt-2 w-full rounded-xl overflow-auto border max-h-80">
              <img src={form.posterDataUrl} alt="Locandina" className="w-full h-auto object-contain" />
            </div>
          )}
        </div>

        <p className="text-xs text-[#6B271A]/70">
          Evento inviato, in <b>revisione</b>. I punti verranno assegnati se approvato.
        </p>

        <div className="flex items-center gap-2 pt-2">
          <button type="submit" className="min-h-11 px-4 rounded-xl bg-[#6B271A] text-white font-semibold hover:opacity-95">Invia evento</button>
          <button type="button" onClick={onClose} className="min-h-11 px-4 rounded-xl border text-[#6B271A] hover:bg-[#FFF1D1]">Annulla</button>
        </div>
      </form>
    </Modal>
  );
}
