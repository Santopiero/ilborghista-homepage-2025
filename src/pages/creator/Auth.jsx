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
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const eMail = email.trim().toLowerCase();
    if (!eMail || !pw) {
      alert("Inserisci email e password.");
      return;
    }
    try {
      setBusy(true);

      // 1) “Login” locale
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

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-extrabold text-[#6B271A]">
        Accedi / Registrati come Creator
      </h1>
      <p className="mt-2 text-gray-700">
        Con il tuo profilo Creator puoi caricare video, essere contattato dalle
        aziende e comparire nelle schede dei borghi e delle attività.
      </p>

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

      <form onSubmit={onSubmit} className="mt-6 space-y-4 max-w-xl">
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
              className="w-full border rounded-lg px-3 py-2 pr-20"
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm underline"
            >
              {showPw ? "Nascondi" : "Mostra"}
            </button>
          </div>
        </label>

        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-[#6B271A] text-white font-semibold disabled:opacity-60"
        >
          {busy ? "Attendere…" : mode === "login" ? "Entra" : "Crea account"}
        </button>
      </form>

      <div className="mt-6">
        <Link to="/" className="underline">
          Torna alla Home
        </Link>
      </div>
    </main>
  );
}
