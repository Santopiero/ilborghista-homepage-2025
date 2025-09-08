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
      return raw ? JSON.parse(raw) : { points: 0, streak: 0, lastLogin: null, avatar: "" };
    } catch {
      return { points: 0, streak: 0, lastLogin: null, avatar: "" };
    }
  });

  // Livelli utente (progressione gamificata)
  const USER_LEVELS = [
    { name: "Curioso", at: 0 },
    { name: "Esploratore", at: 50 },
    { name: "Ambasciatore", at: 150 },
    { name: "Custode", at: 300 },
    { name: "Leggenda 🏆", at: 600 },
  ];
  const currentLevelIndex = React.useMemo(
    () => Math.max(0, USER_LEVELS.findIndex(l => profile.points >= l.at && (USER_LEVELS.findIndex(ll => profile.points >= ll.at) === USER_LEVELS.indexOf(l)))),
    [profile.points]
  );
  const nextLevel = USER_LEVELS[currentLevelIndex + 1] || USER_LEVELS[USER_LEVELS.length - 1];
  const prevThreshold = USER_LEVELS[currentLevelIndex]?.at ?? 0;
  const nextThreshold = nextLevel?.at ?? prevThreshold;
  const levelProgress = Math.min(100, Math.round(((profile.points - prevThreshold) / Math.max(1, nextThreshold - prevThreshold)) * 100));

  // Preferiti (read-only: tutto ciò che l’utente ha “messo a cuore”)
  const FAVORITE_KEYS = ["ib_favorites", "ib_user_favorites", "ib_global_favorites", "ilborghista_favorites", "ilb_favorites"];
  const normalizeFav = (it) => {
    if (!it) return null;
    const id = String(it.id ?? it.slug ?? it.code ?? it.pk ?? cryptoRandom());
    const title = it.title ?? it.name ?? it.borgoName ?? it.label ?? "Preferito";
    const image = it.image ?? it.cover ?? it.thumbnail ?? it.pic ?? "";
    const href =
      it.href ??
      it.link ??
      it.url ??
      (it.slug ? `/borghi/${it.slug}` : "");
    const type = it.type ?? (it.partner ? "Esperienza" : it.date ? "Evento" : it.price ? "Prodotto" : it.borgoName || it.slug ? "Borgo" : "Altro");
    const meta = it.price ? `da ${it.price} €` : it.date ? it.date : it.location || "";
    return { id, title, image, href, type, meta };
  };
  const readGlobalFavorites = () => {
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
  };
  const [favorites, setFavorites] = React.useState(() => readGlobalFavorites());
  React.useEffect(() => {
    const onStorage = (e) => {
      if (!e || !e.key || !FAVORITE_KEYS.includes(e.key)) return;
      setFavorites(readGlobalFavorites());
    };
    window.addEventListener("storage", onStorage);
    const int = setInterval(() => setFavorites(readGlobalFavorites()), 1500);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(int);
    };
  }, []);

  // Persistenza profilo
  const saveProfile = (next) => {
    setProfile(next);
    try { localStorage.setItem("ib_user_profile", JSON.stringify(next)); } catch {}
  };

  // Toast
  const [toast, setToast] = React.useState({ show: false, text: "", kind: "success" });
  function showToast(text, kind = "success") {
    setToast({ show: true, text, kind });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast({ show: false, text: "", kind }), 2400);
  }

  /* =======================
     Avatar + Check-in
  ======================= */
  const onAvatarChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      saveProfile({ ...profile, avatar: dataUrl });
      showToast("Foto profilo aggiornata.");
    };
    reader.readAsDataURL(f);
  };

  const DAILY_POINTS = 1;
  const todayStr = new Date().toISOString().slice(0, 10);
  const isSameDay = profile.lastLogin === todayStr;
  const doDailyCheckin = () => {
    if (isSameDay) return showToast("Hai già effettuato il check-in oggi.");
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yStr = y.toISOString().slice(0, 10);
    const nextStreak = profile.lastLogin === yStr ? (profile.streak + 1) : 1;
    saveProfile({
      ...profile,
      points: profile.points + DAILY_POINTS,
      streak: nextStreak,
      lastLogin: todayStr
    });
    showToast(`Check-in completato! +${DAILY_POINTS} punto${DAILY_POINTS > 1 ? "i" : ""}.`);
  };

  /* =======================
     Modali ancorate (Feedback / Evento)
  ======================= */
  const [openFeedback, setOpenFeedback] = React.useState(false);
  const [openEvent, setOpenEvent] = React.useState(false);

  // Persistenze invii (stato "pending")
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
    <main className="min-h-screen bg-[#FFF8E6]">
      {/* Header + Toggle */}
      <header className="border-b border-[#E1B671]/40 bg-[#FFF8E6]/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-5xl p-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-extrabold text-[#6B271A]">Il Borghista</Link>
          <div className="flex items-center rounded-xl overflow-hidden border border-[#E1B671]">
            <span className="px-3 py-1.5 text-sm font-semibold bg-[#6B271A] text-white">Utente</span>
            <Link to="/creator/me" className="px-3 py-1.5 text-sm font-semibold text-[#6B271A] hover:bg-[#FFF1D1]">
              Creator
            </Link>
          </div>
        </div>
      </header>

      {/* Floating Actions ancorate */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-3">
        <button
          onClick={() => setOpenFeedback(true)}
          className="rounded-full shadow px-4 py-3 text-white bg-[#6B271A] hover:opacity-95"
          aria-label="Lascia un feedback"
        >
          💬 Lascia un feedback
        </button>
        <button
          onClick={() => setOpenEvent(true)}
          className="rounded-full shadow px-4 py-3 text-white bg-[#6B271A] hover:opacity-95"
          aria-label="Segnala evento"
        >
          📅 Segnala evento
        </button>
      </div>

      <div className="mx-auto max-w-5xl p-6 space-y-8">
        {/* Back link + Title */}
        <div>
          <Link to="/registrazione-comune" className="text-[#6B271A] hover:underline">
            ← Torna alla scelta profilo
          </Link>
          <h1 className="mt-3 text-3xl font-black text-[#6B271A]">Area <span className="text-[#E1B671]">Utente</span></h1>
          <p className="mt-2 text-[#6B271A]/80">Gestisci il tuo profilo, partecipa alla community e scopri i tuoi contenuti salvati.</p>
        </div>

        {/* Layout */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Colonna SX: Profilo + Gamification */}
          <section className="rounded-2xl border border-[#E1B671]/50 bg-white p-5 shadow-sm">
            {/* Avatar */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#6B271A]">Il tuo profilo</h2>
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

            {/* Livelli (stepper) */}
            <div className="mt-5">
              <div className="flex items-center justify-between gap-2">
                {USER_LEVELS.map((l, idx) => {
                  const active = idx <= currentLevelIndex;
                  return (
                    <div key={l.name} className="flex flex-col items-center gap-1 w-full">
                      <div className={`w-9 h-9 rounded-full grid place-items-center border ${active ? "bg-[#6B271A] text-white border-[#6B271A]" : "bg-white text-[#6B271A]/60"}`}>
                        {idx + 1}
                      </div>
                      <span className={`text-[11px] text-center leading-tight ${active ? "text-[#6B271A]" : "text-[#6B271A]/60"}`}>
                        {l.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Progress */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm text-[#6B271A]/80">
                  <span>Livello attuale: <b>{USER_LEVELS[currentLevelIndex]?.name}</b></span>
                  {currentLevelIndex < USER_LEVELS.length - 1 ? (
                    <span>Punti: <b>{profile.points}</b> / {nextThreshold}</span>
                  ) : (
                    <span>Punti: <b>{profile.points}</b></span>
                  )}
                </div>
                <div className="h-3 rounded-full bg-[#FFF1D1] overflow-hidden">
                  <div className="h-full bg-[#6B271A]" style={{ width: `${levelProgress}%` }} />
                </div>
              </div>

              {/* Streak + micro-testo */}
              <div className="mt-3 text-sm text-[#6B271A]/80">
                <div className="flex items-center justify-between">
                  <span>🔥 Streak</span>
                  <span><b>{profile.streak}</b> giorni</span>
                </div>
                <p className="mt-1 text-xs text-[#6B271A]/70">
                  Accedi ogni giorno per aumentare la tua serie di accessi consecutivi e guadagnare bonus punti.
                </p>
                <button
                  onClick={doDailyCheckin}
                  className="mt-3 inline-flex items-center justify-center rounded-xl bg-[#6B271A] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                >
                  {isSameDay ? "Check-in eseguito oggi" : "Esegui check-in (+1)"}
                </button>
              </div>

              {/* CTA motivante */}
              {currentLevelIndex < USER_LEVELS.length - 1 && (
                <div className="mt-4 rounded-xl border border-[#E1B671]/60 bg-[#FFFDF7] p-3 text-sm text-[#6B271A]">
                  Vuoi raggiungere il livello successivo? <b>Continua a partecipare</b> e lascia il tuo contributo alla community!
                </div>
              )}
            </div>

            {/* Missioni rapide */}
            <div className="mt-6">
              <h3 className="text-sm font-bold text-[#6B271A]">Missioni rapide</h3>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                <li className="rounded-xl border border-[#E1B671]/60 bg-[#FFFDF7] px-3 py-2 text-sm">⭐ Lascia una recensione ad un borgo</li>
                <li className="rounded-xl border border-[#E1B671]/60 bg-[#FFFDF7] px-3 py-2 text-sm">📅 Segnala un evento locale</li>
                <li className="rounded-xl border border-[#E1B671]/60 bg-[#FFFDF7] px-3 py-2 text-sm">❤️ Aggiungi un borgo ai preferiti</li>
                <li className="rounded-xl border border-[#E1B671]/60 bg-[#FFFDF7] px-3 py-2 text-sm">🧭 Esplora “Borghi da scoprire”</li>
              </ul>
            </div>
          </section>

          {/* Colonna DX: Preferiti (solo "cuori") */}
          <section className="rounded-2xl border border-[#E1B671]/50 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-[#6B271A]">I tuoi preferiti</h2>
            {favorites.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-[#E1B671]/50 p-6 text-center text-[#6B271A]/80">
                Nessun preferito ancora. Durante la navigazione, tocca il <b>cuore</b> su borghi, esperienze o eventi per salvarli qui.
              </div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                        <a href={f.href} className="mt-2 inline-flex text-sm text-[#6B271A] underline hover:no-underline">
                          Apri
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Modali ancorate (renderate in fondo alla pagina) */}
          {openFeedback && (
            <FeedbackModal
              onClose={() => setOpenFeedback(false)}
              onSubmit={(payload) => {
                pushToLS("ib_user_feedbacks", { id: cryptoRandom(), status: "pending", createdAt: Date.now(), ...payload });
                showToast('Grazie per il tuo contributo! Il tuo feedback sarà revisionato dal nostro team e, se approvato, verrà pubblicato a breve.');
                setOpenFeedback(false);
              }}
            />
          )}

          {openEvent && (
            <EventModal
              onClose={() => setOpenEvent(false)}
              onSubmit={(payload) => {
                pushToLS("ib_user_events", { id: cryptoRandom(), status: "pending", createdAt: Date.now(), ...payload });
                showToast('Grazie! Il tuo evento è stato inviato e sarà revisionato dal nostro team. Se approvato, verrà pubblicato a breve.');
                setOpenEvent(false);
              }}
            />
          )}
        </div>
      </div>

      {/* Toast */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 z-50 rounded-xl px-4 py-3 shadow ${toast.kind === "error" ? "bg-red-50 text-red-800 border border-red-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"}`}>
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

/* ----- Modal base ----- */
function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-0 p-4 grid place-items-center">
        <section className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-[#E1B671]/50">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#6B271A]">{title}</h3>
            <button onClick={onClose} aria-label="Chiudi" className="rounded-lg px-2 py-1 hover:bg-gray-50">✕</button>
          </div>
          <div className="p-5">{children}</div>
        </section>
      </div>
    </div>
  );
}

/* ----- Modal: Feedback ----- */
function FeedbackModal({ onClose, onSubmit }) {
  const [form, setForm] = React.useState({
    borgo: "",
    attivita: "",
    text: "",
  });

  const submit = (e) => {
    e.preventDefault();
    if (!form.borgo.trim()) return;
    onSubmit?.({ ...form }); // status "pending" aggiunto nel chiamante
  };

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
          Alla conferma il feedback va in stato <b>“In revisione”</b> e sarà pubblicato se approvato.
        </p>

        <div className="flex items-center gap-2 pt-2">
          <button type="submit" className="rounded-xl bg-[#6B271A] px-4 py-2 text-sm font-semibold text-white hover:opacity-95">
            Invia feedback
          </button>
          <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm font-semibold text-[#6B271A] hover:bg-[#FFF1D1]">
            Annulla
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ----- Modal: Segnala evento ----- */
function EventModal({ onClose, onSubmit }) {
  const [form, setForm] = React.useState({
    titolo: "",
    dal: "",
    al: "",
    comune: "",
    tipologia: "Sagra / Festival gastronomico",
    tipologiaAltro: "",
    descrizione: "",
    indirizzo: "",
    posterDataUrl: "",
  });

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
      al: form.al || form.dal, // se un solo giorno, coincide
      indirizzo: form.indirizzo?.trim() ? form.indirizzo.trim() : "Centro storico",
      tipologia:
        form.tipologia === "Altro (specifica)" && form.tipologiaAltro.trim()
          ? form.tipologiaAltro.trim()
          : form.tipologia,
    };
    onSubmit?.(payload); // stato "pending" aggiunto dal chiamante
  };

  const TIPI = [
    "Concerto / Live Music",
    "Evento culturale",
    "Sagra / Festival gastronomico",
    "Mercato / Fiera",
    "Altro (specifica)",
  ];

  return (
    <Modal title="Segnala evento" onClose={onClose}>
      <form onSubmit={submit} className="grid gap-3">
        {/* Titolo */}
        <div className="sm:col-span-2">
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

        {/* Date */}
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

        {/* Comune (con provincia) */}
        <div>
          <label className="block text-sm font-semibold text-[#6B271A] mb-1">Comune (Provincia) <span className="text-red-600">*</span></label>
          <input
            type="text"
            value={form.comune}
            onChange={(e) => setForm({ ...form, comune: e.target.value })}
            className="w-full rounded-xl border border-[#E1B671] px-3 py-2 outline-none focus:ring-2 focus:ring-[#E1B671]/40"
            placeholder="Viggiano (PZ)"
            required
          />
        </div>

        {/* Tipologia */}
        <div>
          <label className="block text-sm font-semibold text-[#6B271A] mb-1">Tipologia evento</label>
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
            <label className="block text-sm font-semibold text-[#6B271A] mb-1">Tipologia (altro)</label>
            <input
              type="text"
              value={form.tipologiaAltro}
              onChange={(e) => setForm({ ...form, tipologiaAltro: e.target.value })}
              className="w-full rounded-xl border border-[#E1B671] px-3 py-2 outline-none focus:ring-2 focus:ring-[#E1B671]/40"
              placeholder="Es. Rievocazione storica"
            />
          </div>
        )}

        {/* Descrizione */}
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

        {/* Indirizzo */}
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

        {/* Poster */}
        <div>
          <label className="block text-sm font-semibold text-[#6B271A] mb-1">Locandina evento (consigliata)</label>
          <input type="file" accept="image/*" onChange={onPoster} />
          {form.posterDataUrl && (
            <div className="mt-2 w-full rounded-xl overflow-hidden border">
              <img src={form.posterDataUrl} alt="Locandina" className="w-full object-cover" />
            </div>
          )}
        </div>

        <p className="text-xs text-[#6B271A]/70">
          Alla conferma l’evento va in stato <b>“In revisione”</b> e sarà pubblicato se approvato.
        </p>

        <div className="flex items-center gap-2 pt-2">
          <button type="submit" className="rounded-xl bg-[#6B271A] px-4 py-2 text-sm font-semibold text-white hover:opacity-95">
            Invia evento
          </button>
          <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm font-semibold text-[#6B271A] hover:bg-[#FFF1D1]">
            Annulla
          </button>
        </div>
      </form>
    </Modal>
  );
}
