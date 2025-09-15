// src/components/TopBar.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, Menu, X, LogIn, Users, MessageCircle, Smartphone,
  Info, HandHeart,
} from "lucide-react";

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true);

/**
 * TopBar riutilizzabile:
 * - slug (opz) per aggiungere voci “Info” e “Sostieni il borgo”
 * - user (opz) per cambiare le voci del menu (loggato / ospite)
 */
export default function TopBar({ slug, user }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");

  const infoHref = slug ? `/borghi/${slug}/info` : "/info";
  const donateHref = slug ? `/borghi/${slug}/sostieni` : "/sostieni";

  const onSubmit = (e) => {
    e.preventDefault();
    const to = q
      ? `/cerca?q=${encodeURIComponent(q)}${slug ? `&borgo=${encodeURIComponent(slug)}` : ""}`
      : `/cerca`;
    setSearchOpen(false);
    navigate(to);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
          <Link to="/" aria-label="Vai alla home di Il Borghista" className="inline-flex items-center">
            <span className="text-lg font-extrabold tracking-tight text-[#6B271A]">Il Borghista</span>
          </Link>

          {/* Ricerca desktop */}
          <form onSubmit={onSubmit} className="relative hidden w-[46%] md:block">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cerca luoghi, eventi, esperienze…"
              className="w-full rounded-full border px-4 py-2 pl-9 text-sm outline-none focus:border-[#6B271A]"
            />
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          </form>

          <div className="flex items-center gap-2">
            {/* Ricerca mobile */}
            <button
              aria-label="Apri la ricerca"
              onClick={() => setSearchOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white md:hidden"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Hamburger */}
            <button
              aria-label="Apri il menu"
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Ricerca mobile */}
        {searchOpen && (
          <div className="border-t bg-white md:hidden">
            <form onSubmit={onSubmit} className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
              <div className="relative">
                <input
                  type="search"
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cerca…"
                  className="w-full rounded-xl border px-4 py-2 pl-9 text-sm outline-none focus:border-[#6B271A]"
                />
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              </div>
            </form>
          </div>
        )}
      </header>

      {/* Drawer menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <nav className="absolute right-0 top-0 h-full w-80 max-w-[85%] bg-white shadow-xl" aria-label="Menu principale">
            <div className="flex items-center justify-between border-b p-4">
              <span className="text-base font-bold text-[#6B271A]">Menu</span>
              <button
                aria-label="Chiudi menu"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ul className="p-2">
              {/* Login / Profilo */}
              {!user ? (
                <li>
                  <Link
                    to="/auth"
                    className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-neutral-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    <LogIn className="h-4 w-4" /> Accedi / Registrati
                  </Link>
                </li>
              ) : (
                <>
                  <li>
                    <Link
                      to="/profilo"
                      className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-neutral-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Users className="h-4 w-4" /> Il mio profilo
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/i-miei-itinerari"
                      className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-neutral-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Users className="h-4 w-4" /> I miei itinerari
                    </Link>
                  </li>
                </>
              )}

              {/* Info & Sostieni (se slug è presente, quindi pagina borgo) */}
              {slug && (
                <>
                  <li className="sm:hidden">
                    <Link
                      to={infoHref}
                      className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-neutral-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Info className="h-4 w-4" /> Info
                    </Link>
                  </li>
                  <li className="sm:hidden">
                    <Link
                      to={donateHref}
                      className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-neutral-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      <HandHeart className="h-4 w-4" /> Sostieni il borgo
                    </Link>
                  </li>
                </>
              )}

              <li>
                <Link
                  to="/creator"
                  className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-neutral-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <Users className="h-4 w-4" /> I nostri creator
                </Link>
              </li>

              <li>
                <Link
                  to="/contatti"
                  className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-neutral-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <MessageCircle className="h-4 w-4" /> Contattaci
                </Link>
              </li>

              {/* Installa app (solo mobile e se non già A2HS) */}
              {typeof window !== "undefined" && !isStandalone() && (
                <li className="mt-1 sm:hidden">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      window.__openInstallModal?.();
                    }}
                    className="w-full flex items-center gap-2 rounded-lg px-3 py-3 bg-[#0b3a53] text-white font-medium hover:opacity-90"
                  >
                    <Smartphone className="h-4 w-4" /> Installa l’app
                  </button>
                </li>
              )}

              <li className="mt-2 border-t pt-2">
                <Link
                  to="/registrazione-creator"
                  className="flex items-center justify-center rounded-xl bg-[#D54E30] px-4 py-2 font-semibold text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  Diventa Creator del Borgo
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
