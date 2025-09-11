// src/pages/creator/Auth.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  setCurrentUser,
  getMyCreatorProfile,
  addCreator,
} from "../../lib/store";

export default function CreatorAuth() {
  const nav = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "signup"

  // LOGIN state
  const [loginRole, setLoginRole] = useState("utente_creator"); // "borgo" | "attivita" | "utente_creator"
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  // SIGNUP state
  const [signupRole, setSignupRole] = useState("utente_creator"); // "attivita" | "utente_creator"
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPw1, setSignupPw1] = useState("");
  const [signupPw2, setSignupPw2] = useState("");
  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [acceptTC, setAcceptTC] = useState(false);
  const [signupErr, setSignupErr] = useState("");

  async function onSubmitLogin(e) {
    e.preventDefault();
    const eMail = email.trim().toLowerCase();
    if (!eMail || !pw) {
      alert("Inserisci email e password.");
      return;
    }

    // Smista in base al ruolo scelto
    if (loginRole === "borgo") {
      nav("/registrazione-borgo");
      return;
    }
    if (loginRole === "attivita") {
      nav("/registrazione-attivita");
      return;
    }

    try {
      setBusy(true);
      // 1) “Login” locale come Utente/Creator (comportamento esistente)
      const user = { id: "u_" + Date.now(), email: eMail, role: "creator" };
      setCurrentUser(user);

      // 2) Se non esiste ancora il profilo creator, crealo
      let me = getMyCreatorProfile();
      if (!me) {
        me = addCreator({
          id: "cr_" + Date.now(),
          userId: user.id,
          name: eMail.split("@")[0] || "Creator",
          region: "",
          bio: "",
          avatar: "https://dummyimage.com/600x400/ddd/555&text=Creator",
          categories: [],
          links: { instagram: "", tiktok: "", youtube: "" },
        });
      }

      // 3) Vai all’onboarding (alias /creator/me)
      nav("/creator/me", { replace: true });
    } finally {
      setBusy(false);
    }
  }

  async function onSubmitSignup(e) {
    e.preventDefault();
    setSignupErr("");

    // Validazioni base
    if (!acceptTC) {
      setSignupErr("Devi accettare i Termini e Condizioni.");
      return;
    }
    if (!signupName.trim()) {
      setSignupErr("Inserisci il nome.");
      return;
    }
    if (!signupEmail.trim()) {
      setSignupErr("Inserisci l'email.");
      return;
    }
    if (signupPw1.length < 8) {
      setSignupErr("La password deve avere almeno 8 caratteri.");
      return;
    }
    if (signupPw1 !== signupPw2) {
      setSignupErr("Le password non coincidono.");
      return;
    }

    // Smista in base alla scelta
    if (signupRole === "attivita") {
      // Flusso attività: dopo la validazione ti porto all'onboarding Attività
      nav("/registrazione-attivita");
      return;
    }

    // Flusso Utente/Creator: manteniamo la tua logica esistente
    const eMail = signupEmail.trim().toLowerCase();
    const user = { id: "u_" + Date.now(), email: eMail, role: "creator" };
    setCurrentUser(user);

    let me = getMyCreatorProfile();
    if (!me) {
      me = addCreator({
        id: "cr_" + Date.now(),
        userId: user.id,
        name: signupName.trim() || eMail.split("@")[0] || "Creator",
        region: "",
        bio: "",
        avatar: "https://dummyimage.com/600x400/ddd/555&text=Creator",
        categories: [],
        links: { instagram: "", tiktok: "", youtube: "" },
      });
    }

    nav("/creator/me", { replace: true });
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-extrabold text-[#6B271A]">
        Accedi / Registrati come Creator
      </h1>
      <p className="mt-2 text-gray-700">
        Con il tuo profilo Creator puoi caricare video, essere contattato dalle
        aziende e comparire nelle schede dei borghi e delle attività.
      </p>

      {/* Toggle Accedi / Crea account */}
      <div className="mt-6 flex gap-2">
        <button
          className={`px-4 py-2 rounded-lg border ${
            mode === "login"
              ? "bg-[#D54E30] text-white border-[#D54E30]"
              : "bg-white"
          }`}
          onClick={() => setMode("login")}
        >
          Accedi
        </button>
        <button
          className={`px-4 py-2 rounded-lg border ${
            mode === "signup"
              ? "bg-[#FAF5E0] border-[#E1B671]"
              : "bg-white"
          }`}
          onClick={() => setMode("signup")}
        >
          Crea account
        </button>
      </div>

      {/* ====== LOGIN ====== */}
      {mode === "login" && (
        <form onSubmit={onSubmitLogin} className="mt-6 space-y-4 max-w-xl">
          {/* Selettore ruolo di accesso */}
          <div>
            <div className="text-sm font-semibold mb-2">Accedi come</div>
            <div className="flex items-center gap-2 flex-wrap">
              <RadioChip
                label="Borgo"
                value="borgo"
                checked={loginRole === "borgo"}
                onChange={() => setLoginRole("borgo")}
              />
              <RadioChip
                label="Attività"
                value="attivita"
                checked={loginRole === "attivita"}
                onChange={() => setLoginRole("attivita")}
              />
              <RadioChip
                label="Utente / Creator"
                value="utente_creator"
                checked={loginRole === "utente_creator"}
                onChange={() => setLoginRole("utente_creator")}
              />
            </div>
          </div>

          <label className="block">
            <div className="text-sm font-semibold mb-1">Email</div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@esempio.it"
              className="w-full border rounded-lg px-3 py-2"
              autoFocus
              required
            />
          </label>

          <label className="block">
            <div className="text-sm font-semibold mb-1">Password</div>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm opacity-70 hover:opacity-100"
                aria-label={showPw ? "Nascondi password" : "Mostra password"}
                title={showPw ? "Nascondi password" : "Mostra password"}
              >
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-[#6B271A] text-white font-semibold disabled:opacity-60"
          >
            {busy ? "Attendere…" : "Entra"}
          </button>
        </form>
      )}

      {/* ====== SIGNUP ====== */}
      {mode === "signup" && (
        <form onSubmit={onSubmitSignup} className="mt-6 space-y-4 max-w-xl">
          {/* Selettore tipo account */}
          <div>
            <div className="text-sm font-semibold mb-2">Crea account come</div>
            <div className="flex items-center gap-2 flex-wrap">
              <RadioChip
                label="Attività"
                value="attivita"
                checked={signupRole === "attivita"}
                onChange={() => setSignupRole("attivita")}
              />
              <RadioChip
                label="Utente / Creator"
                value="utente_creator"
                checked={signupRole === "utente_creator"}
                onChange={() => setSignupRole("utente_creator")}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <div className="text-sm font-semibold mb-1">Nome</div>
              <input
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="Il tuo nome o nome professionale"
                className="w-full border rounded-lg px-3 py-2"
                required
                autoComplete="name"
              />
            </label>

            <label className="block">
              <div className="text-sm font-semibold mb-1">Email</div>
              <input
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                required
                autoComplete="email"
              />
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <div className="text-sm font-semibold mb-1">Password</div>
              <div className="relative">
                <input
                  type={showPw1 ? "text" : "password"}
                  value={signupPw1}
                  onChange={(e) => setSignupPw1(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 pr-10"
                  placeholder="Minimo 8 caratteri"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw1((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm opacity-70 hover:opacity-100"
                  aria-label={showPw1 ? "Nascondi password" : "Mostra password"}
                  title={showPw1 ? "Nascondi password" : "Mostra password"}
                >
                  {showPw1 ? "🙈" : "👁️"}
                </button>
              </div>
            </label>

            <label className="block">
              <div className="text-sm font-semibold mb-1">Ripeti password</div>
              <div className="relative">
                <input
                  type={showPw2 ? "text" : "password"}
                  value={signupPw2}
                  onChange={(e) => setSignupPw2(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 pr-10"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw2((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm opacity-70 hover:opacity-100"
                  aria-label={showPw2 ? "Nascondi password" : "Mostra password"}
                  title={showPw2 ? "Nascondi password" : "Mostra password"}
                >
                  {showPw2 ? "🙈" : "👁️"}
                </button>
              </div>
            </label>
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={acceptTC}
              onChange={(e) => setAcceptTC(e.target.checked)}
            />
            <span>
              Accetto i <span className="underline">Termini e Condizioni</span> e l’Informativa Privacy.
            </span>
          </label>

          {signupErr && (
            <p className="text-sm text-red-600 font-medium">{signupErr}</p>
          )}

          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[#6B271A] text-white font-semibold"
          >
            Crea account
          </button>
        </form>
      )}

      <div className="mt-6">
        <Link to="/" className="underline">
          Torna alla Home
        </Link>
      </div>
    </main>
  );
}

/* ------------ UI helper ------------ */
function RadioChip({ label, value, checked, onChange }) {
  return (
    <label
      className={`cursor-pointer select-none rounded-lg border px-3 py-2 text-sm font-medium ${
        checked ? "bg-[#D54E30] text-white border-[#D54E30]" : "bg-white"
      }`}
    >
      <input
        type="radio"
        name={`radio-${value}`}
        value={value}
        checked={checked}
        onChange={onChange}
        className="hidden"
      />
      {label}
    </label>
  );
}
