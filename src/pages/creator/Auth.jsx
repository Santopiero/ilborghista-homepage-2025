// src/pages/creator/Auth.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as store from "../../lib/store";

/**
 * Wrapper robusto: prova a usare le funzioni presenti nello store, altrimenti cade su fallback.
 */
function useAuthFns() {
  const signInOrCreate =
    store.loginOrRegister ||
    store.signInOrCreate ||
    store.login ||
    store.register ||
    ((email, password) => {
      // fallback minimale: salva un utente fake in localStorage
      const u = { id: "u_" + Date.now().toString(36), email, password };
      try {
        localStorage.setItem("ib_current_user", JSON.stringify(u));
      } catch {}
      return u;
    });

  return { signInOrCreate };
}

export default function CreatorAuth() {
  const navigate = useNavigate();
  const { signInOrCreate } = useAuthFns();

  // Forziamo la simulazione "mai autenticato": svuotiamo sempre l'eventuale utente salvato
  useEffect(() => {
    try {
      localStorage.removeItem("ib_current_user");
    } catch {}
  }, []);

  const [tab, setTab] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSubmit = email.trim() && pwd.trim();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      await Promise.resolve(signInOrCreate(email.trim(), pwd.trim()));
      // dopo login/registrazione vai all'onboarding
      navigate("/creator/onboarding", { replace: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-[#6B271A]">
        Accedi / Registrati come Creator
      </h1>
      <p className="mt-2 text-gray-700">
        Con il tuo profilo Creator puoi caricare video, essere contattato dalle aziende
        e comparire nelle schede dei borghi e delle attività.
      </p>

      {/* Tabs */}
      <div className="mt-6 flex gap-2">
        <button
          className={`px-3 py-2 rounded-lg border ${
            tab === "login"
              ? "bg-[#D54E30] text-white border-[#D54E30]"
              : "bg-white text-[#6B271A] border-[#E1B671]"
          }`}
          onClick={() => setTab("login")}
          type="button"
        >
          Accedi
        </button>
        <button
          className={`px-3 py-2 rounded-lg border ${
            tab === "signup"
              ? "bg-[#D54E30] text-white border-[#D54E30]"
              : "bg-white text-[#6B271A] border-[#E1B671]"
          }`}
          onClick={() => setTab("signup")}
          type="button"
        >
          Crea account
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[#6B271A]">Email</label>
          <input
            type="email"
            required
            className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-[#E1B671]"
            placeholder="nome@esempio.it"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#6B271A]">Password</label>
          <div className="mt-1 relative">
            <input
              type={showPwd ? "text" : "password"}
              required
              className="w-full rounded-xl border px-3 py-2 pr-16 outline-none focus:ring-2 focus:ring-[#E1B671]"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm underline"
              aria-label={showPwd ? "Nascondi password" : "Mostra password"}
            >
              {showPwd ? "Nascondi" : "Mostra"}
            </button>
          </div>
        </div>

        <button
          disabled={!canSubmit || saving}
          className={`px-4 py-2 rounded-xl font-semibold ${
            !canSubmit || saving
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "bg-[#D54E30] text-white"
          }`}
        >
          {saving ? (tab === "signup" ? "Creo account…" : "Accesso…") : "Entra"}
        </button>
      </form>

      <div className="mt-6">
        <Link to="/" className="underline text-[#6B271A]">
          Torna alla Home
        </Link>
      </div>
    </main>
  );
}
