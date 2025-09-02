// src/pages/RegistrazioneAttivita.jsx
import React from "react";
import { Link } from "react-router-dom";

/**
 * Landing registrazione attività
 * - 4 card cliccabili (nessun bottone dentro)
 * - Mobile: scroll orizzontale con snap
 * - Desktop: griglia 4 colonne sulla stessa riga
 * - Hero "borgo" posizionata sotto le card
 */
export default function RegistrazioneAttivita() {
  const categories = [
    {
      key: "dormire",
      title: "Dormire",
      // >>> rotta assoluta corretta per il tuo main.jsx
      to: "/registrazione-attivita/dormire",
      img:
        "https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?q=80&w=1600&auto=format&fit=crop",
    },
    {
      key: "mangiare",
      title: "Mangiare & Bere",
      to: "/registrazione-attivita/mangiare",
      img:
        "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=1600&auto=format&fit=crop",
    },
    {
      key: "artigiani",
      title: "Artigiani",
      to: "/registrazione-attivita/artigiani",
      img:
        "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=1600&auto=format&fit=crop",
    },
    {
      key: "trasporti",
      title: "Trasporti",
      to: "/registrazione-attivita/trasporti",
      img:
        "https://images.unsplash.com/photo-1465447142348-e9952c393450?q=80&w=1600&auto=format&fit=crop",
    },
  ];

  return (
    <main className="bg-white text-[#2a1d17]">
      {/* TESTATA SEMPLICE */}
      <section className="pt-12 md:pt-16">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#6B271A]">
            Registra la tua <span className="text-[#E1B671]">attività</span>
          </h1>
          <p className="mt-2 text-base md:text-lg text-zinc-700">
            Scegli la categoria che ti rappresenta e inizia a raccontarti su Il
            Borghista.
          </p>
        </div>
      </section>

      {/* CARD CLICCABILI */}
      <section className="mt-6 md:mt-8">
        {/* Mobile: flex con scroll orizzontale / Desktop: griglia 4 colonne */}
        <div className="mx-auto max-w-6xl px-4">
          {/* mobile */}
          <div className="flex gap-4 overflow-x-auto pb-2 md:hidden snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">
            {categories.map((c) => (
              <Link
                key={c.key}
                to={c.to}
                className="group relative block min-w-[260px] snap-start overflow-hidden rounded-2xl shadow-sm ring-1 ring-zinc-100 hover:ring-[#E1B671]/40 transition-all"
                aria-label={`Registra una struttura - categoria: ${c.title}`}
              >
                <img
                  src={c.img}
                  alt={c.title}
                  className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#6B271A] shadow-sm">
                    {c.title}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* desktop */}
          <div className="hidden md:grid md:grid-cols-4 md:gap-6">
            {categories.map((c) => (
              <Link
                key={c.key}
                to={c.to}
                className="group relative block overflow-hidden rounded-2xl shadow-sm ring-1 ring-zinc-100 hover:ring-[#E1B671]/40 transition-all"
                aria-label={`Registra una struttura - categoria: ${c.title}`}
              >
                <img
                  src={c.img}
                  alt={c.title}
                  className="h-60 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#6B271A] shadow-sm">
                    {c.title}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HERO “BORGO” SOTTO LE CARD (solo titolo + sottotitolo) */}
      <section className="mt-10 md:mt-14">
        <div
          className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl"
          style={{ aspectRatio: "21/5" }}
        >
          <img
            src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=2400&auto=format&fit=crop"
            alt="Borgo italiano"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="mx-auto max-w-4xl px-4 text-center">
              <h2 className="inline-block bg-white/10 px-4 py-2 text-2xl md:text-4xl font-extrabold text-white backdrop-blur-sm rounded">
                Sei pronto a raccontare la tua attività?
              </h2>
              <p className="mt-3 inline-block bg-black/40 px-3 py-1 text-sm md:text-base text-white/90 backdrop-blur-sm rounded">
                Inizia da{" "}
                <span className="font-semibold text-[#E1B671]">Dormire</span>:
                è attivo e super veloce.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER SEMPLICE */}
      <footer className="mt-10 md:mt-16 border-t border-zinc-100">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-zinc-500">
          © {new Date().getFullYear()} Il Borghista — Tutti i diritti riservati.
        </div>
      </footer>
    </main>
  );
}
