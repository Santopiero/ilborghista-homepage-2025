// src/pages/RegistrazioneUtente.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function RegistrazioneUtente() {
  // -----------------------
  // Stato profilo (persistenza locale)
  // -----------------------
  const [profile, setProfile] = React.useState(() => {
    try {
      const raw = localStorage.getItem("ib_user_profile");
      return raw ? JSON.parse(raw) : { points: 0, streak: 0, lastLogin: null, avatar: "" };
    } catch {
      return { points: 0, streak: 0, lastLogin: null, avatar: "" };
    }
  });

  // -----------------------
  // Preferiti (solo lettura da “cuori” globali)
  // Legge varie chiavi usate nell’app; deduplica; ascolta storage events
  // -----------------------
  const FAVORITE_KEYS = [
    "ib_favorites",
    "ib_user_favorites",
    "ib_global_favorites",
    "ilborghista_favorites",
    "ilb_favorites",
  ];

  const normalizeFav = (it) => {
    if (!it) return null;
    const id = it.id ?? it.slug ?? it.code ?? it.pk ?? `${(it.title || it.name || "fav")}-${Math.random()}`;
    const title = it.title ?? it.name ?? it.borgoName ?? it.label ?? "Preferito";
    const image = it.image ?? it.cover ?? it.thumbnail ?? it.pic ?? "";
    const href =
      it.href ??
      it.link ??
      it.url ??
      (it.slug ? `/borghi/${it.slug}` : "") ??
      "";
    const type =
      it.type ??
      it.kind ??
      (it.partner ? "Esperienza" : it.date ? "Evento" : it.price ? "Prodotto" : it.borgoName || it.slug ? "Borgo" : "Altro");
    const meta =
      it.price ? `da ${it.price} €` : it.date ? it.date : it.location ? it.location : "";
    return { id: String(id), title, image, href, type, meta };
  };

  const readGlobalFavorites = () => {
    let all = [];
    for (const key of FAVORITE_KEYS) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) all = all.concat(arr);
      } catch {}
    }
    // supporto eventuale store globale su window
    if (Array.isArray(window.__IB_FAVORITES)) {
      all = all.concat(window.__IB_FAVORITES);
    }
    // normalizza + deduplica
    const norm = all.map(normalizeFav).filter(Boolean);
    const map = new Map();
    norm.forEach((x) => {
      const k = `${x.id}|${x.href}|${x.title}`;
      if (!map.has(k)) map.set(k, x);
    });
    return Array.from(map.values());
  };

  const [favorites, setFavorites] = React.useState(() => readGlobalFavorites());

  // ascolta cambi in altre tab/parti dell’app
  React.useEffect(() => {
    const onStorage = (e) => {
      if (e && e.key && !FAVORITE_KEYS.includes(e.key)) return;
      setFavorites(readGlobalFavorites());
    };
    window.addEventListener("storage", onStorage);
    const interval = setInterval(() => setFavorites(readGlobalFavorites()), 1500); // soft-poll per sync interno SPA
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(interval);
    };
  }, []);

  // -----------------------
  // Toast
  // -----------------------
  const [toast, setToast] = React.useState({ show: false, text: "", kind: "success" });
  function showToast(text, kind = "success") {
    setToast({ show: true, text, kind });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast({ show: false, text: "", kind }), 2200);
  }

  // -----------------------
  // Avatar upload
  // -----------------------
  const onAvatarChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      const next = { ...profile, avatar: dataUrl };
      setProfile(next);
      try {
        localStorage.setItem("ib_user_profile", JSON.stringify(next));
      } catch {}
      showToast("Foto profilo aggiornata.");
    };
    reader.readAsDataURL(f);
  };

  // -----------------------
  // Check-in giornaliero
  // -----------------------
  const DAILY_POINTS = 1;
  const todayStr = new Date().toISOString().slice(0, 10);
  const isSameDay = profile.lastLogin === todayStr;

  const doDailyCheckin = () => {
    if (isSameDay) return showToast("Hai già effettuato il check-in oggi.");
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);

    const nextStreak = profile.lastLogin === yStr ? profile.streak + 1 : 1;
    const nextPoints = profile.points + DAILY_POINTS;
    const next = { ...profile, points: nextPoints, streak: nextStreak, lastLogin: todayStr };
    setProfile(next);
    try {
      localStorage.setItem("ib_user_profile", JSON.stringify(next));
    } catch {}
    showToast(`Check-in completato! +${DAILY_POINTS} punto${DAILY_POINTS > 1 ? "i" : ""}.`);
  };

  return (
    <main className="min-h-screen bg-[#FFF8E6]">
      {/* Header + Toggle */}
      <header className="border-b border-[#E1B671]/40 bg-[#FFF8E6]/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-5xl p-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-extrabold text-[#6B271A]">Il Borghista</Link>
          <div className="flex items-center rounded-xl overflow-hidden border border-[#E1B671]">
            <span className="px-3 py-1.5 text-sm font-semibold bg-[#6B271A] text-white">Utente</span>
            {/* 👉 passa direttamente alla dashboard creator */}
            <Link
              to="/creator/me"
              className="px-3 py-1.5 text-sm font-semibold text-[#6B271A] hover:bg-[#FFF1D1]"
            >
              Creator
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl p-6 space-y-8">
        {/* Back link + Title */}
        <div>
          <Link to="/registrazione-comune" className="text-[#6B271A] hover:underline">
            ← Torna alla scelta profilo
          </Link>
          <h1 className="mt-3 text-3xl font-black text-[#6B271A]">
            Area <span className="text-[#E1B671]">Utente</span>
          </h1>
          <p className="mt-2 text-[#6B271A]/80">
            Gestisci il tuo profilo, partecipa alla community e scopri i tuoi contenuti salvati.
          </p>
        </div>

        {/* Layout 2 colonne */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Colonna SX: Profilo + Gamification */}
          <section className="rounded-2xl border border-[#E1B671]/50 bg-white p-5 shadow-sm">
            {/* Avatar + upload */}
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

            {/* Gamification */}
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-sm text-[#6B271A]/80">
                <span>Punti totali</span>
                <span className="font-bold">{profile.points}</span>
              </div>
              <div className="h-3 rounded-full bg-[#FFF1D1] overflow-hidden">
                <div
                  className="h-full bg-[#6B271A]"
                  style={{ width: `${Math.min(100, profile.points % 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm text-[#6B271A]/80">
                <span>Streak</span>
                <span><b>{profile.streak}</b> giorni</span>
              </div>
              <p className="text-xs text-[#6B271A]/70 leading-relaxed">
                Accedi ogni giorno per aumentare la tua serie di accessi consecutivi e guadagnare bonus punti.
              </p>

              <button
                onClick={doDailyCheckin}
                className="mt-2 inline-flex items-center justify-center rounded-xl bg-[#6B271A] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              >
                {isSameDay ? "Check-in eseguito oggi" : `Esegui check-in (+1)`}
              </button>
            </div>

            {/* Missioni utente */}
            <div className="mt-6">
              <h3 className="text-sm font-bold text-[#6B271A]">Missioni rapide</h3>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                <li className="rounded-xl border border-[#E1B671]/60 bg-[#FFFDF7] px-3 py-2 text-sm">
                  ⭐ Lascia una recensione ad un borgo
                </li>
                <li className="rounded-xl border border-[#E1B671]/60 bg-[#FFFDF7] px-3 py-2 text-sm">
                  📅 Segnala un evento locale
                </li>
                <li className="rounded-xl border border-[#E1B671]/60 bg-[#FFFDF7] px-3 py-2 text-sm">
                  ❤️ Aggiungi un borgo ai preferiti
                </li>
                <li className="rounded-xl border border-[#E1B671]/60 bg-[#FFFDF7] px-3 py-2 text-sm">
                  🧭 Esplora “Borghi da scoprire”
                </li>
              </ul>
            </div>
          </section>

          {/* Colonna DX: Preferiti (solo quelli con cuore) */}
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
                        <a
                          href={f.href}
                          className="mt-2 inline-flex text-sm text-[#6B271A] underline hover:no-underline"
                        >
                          Apri
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Segnala evento */}
          <section className="md:col-span-2 rounded-2xl border border-[#E1B671]/50 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-[#6B271A]">Segnala un evento</h2>
            <p className="text-sm text-[#6B271A]/70">Aiutaci a tenere aggiornati i calendari dei borghi.</p>

            <SegnalaEvento onDone={() => showToast("Segnalazione inviata! Grazie 🙌")} />
          </section>

          {/* Feedback */}
          <section className="md:col-span-2 rounded-2xl border border-[#E1B671]/50 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-[#6B271A]">Lascia un feedback</h2>
            <p className="text-sm text-[#6B271A]/70">Condividi un’opinione su un borgo o un’attività.</p>

            <FeedbackForm onDone={() => showToast("Feedback inviato! ⭐")} />
          </section>
        </div>
      </div>

      {/* Toast */}
      {toast.show && (
        <div
          className={`fixed bottom-4 right-4 z-50 rounded-xl px-4 py-3 shadow
            ${toast.kind === "error" ? "bg-red-50 text-red-800 border border-red-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"}`}
        >
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

/* -----------------------
   Componenti secondari
----------------------- */

function SegnalaEvento({ onDone }) {
  const [form, setForm] = React.useState({ title: "", date: "", place: "", details: "" });
  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date.trim() || !form.place.trim()) return;
    // TODO: invia a backend
    setForm({ title: "", date: "", place: "", details: "" });
    onDone?.();
  };
  return (
    <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="block text-sm font-semibold text-[#6B271A] mb-1">Titolo</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-xl border border-[#E1B671] px-3 py-2 outline-none focus:ring-2 focus:ring-[#E1B671]/40"
          placeholder="Es. Festa della Madonna Nera"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#6B271A] mb-1">Data</label>
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="w-full rounded-xl border border-[#E1B671] px-3 py-2 outline-none focus:ring-2 focus:ring-[#E1B671]/40"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#6B271A] mb-1">Luogo</label>
        <input
          type="text"
          value={form.place}
          onChange={(e) => setForm({ ...form, place: e.target.value })}
          className="w-full rounded-xl border border-[#E1B671] px-3 py-2 outline-none focus:ring-2 focus:ring-[#E1B671]/40"
          placeholder="Comune, location"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-semibold text-[#6B271A] mb-1">Dettagli</label>
        <textarea
          rows="3"
          value={form.details}
          onChange={(e) => setForm({ ...form, details: e.target.value })}
          className="w-full rounded-xl border border-[#E1B671] px-3 py-2 outline-none focus:ring-2 focus:ring-[#E1B671]/40"
          placeholder="Orario, navette, prezzo, info utili…"
        />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" className="rounded-xl bg-[#6B271A] px-4 py-2 text-sm font-semibold text-white hover:opacity-95">
          Invia segnalazione
        </button>
      </div>
    </form>
  );
}

function FeedbackForm({ onDone }) {
  const [data, setData] = React.useState({ target: "Borgo", name: "", rating: 0, text: "" });
  const setRating = (v) => setData((s) => ({ ...s, rating: v }));
  const submit = (e) => {
    e.preventDefault();
    if (!data.name.trim() || data.rating < 1) return;
    // TODO: invia a backend
    setData({ target: "Borgo", name: "", rating: 0, text: "" });
    onDone?.();
  };
  return (
    <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
      <div>
        <label className="block text-sm font-semibold text-[#6B271A] mb-1">Target</label>
        <select
          value={data.target}
          onChange={(e) => setData({ ...data, target: e.target.value })}
          className="w-full rounded-xl border border-[#E1B671] px-3 py-2 outline-none focus:ring-2 focus:ring-[#E1B671]/40 bg-white"
        >
          <option>Borgo</option>
          <option>Attività</option>
          <option>Esperienza</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#6B271A] mb-1">Nome</label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          className="w-full rounded-xl border border-[#E1B671] px-3 py-2 outline-none focus:ring-2 focus:ring-[#E1B671]/40"
          placeholder="Es. Viggiano"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-sm font-semibold text-[#6B271A] mb-1">Valutazione</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((v) => (
            <button key={v} type="button" onClick={() => setRating(v)} className="text-2xl" aria-label={`${v} stelle`}>
              {data.rating >= v ? "★" : "☆"}
            </button>
          ))}
        </div>
      </div>

      <div className="sm:col-span-2">
        <label className="block text-sm font-semibold text-[#6B271A] mb-1">Testo</label>
        <textarea
          rows="3"
          value={data.text}
          onChange={(e) => setData({ ...data, text: e.target.value })}
          className="w-full rounded-xl border border-[#E1B671] px-3 py-2 outline-none focus:ring-2 focus:ring-[#E1B671]/40"
          placeholder="Scrivi qui la tua recensione…"
        />
      </div>

      <div className="sm:col-span-2">
        <button type="submit" className="rounded-xl bg-[#6B271A] px-4 py-2 text-sm font-semibold text-white hover:opacity-95">
          Invia feedback
        </button>
      </div>
    </form>
  );
}
