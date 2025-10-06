import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

/**
 * Landing registrazione attività
 * - 4 card cliccabili (nessun bottone dentro)
 * - Mobile: scroll orizzontale con snap
 * - Desktop: griglia 4 colonne sulla stessa riga
 * - Testo bianco centrato su ogni immagine (niente icone)
 * - Hero e messaggi chiari per uso anche in sponsorizzate
 */
export default function RegistrazioneAttivita() {
  const categories = [
    {
      key: "dormire",
      title: "Dormire",
      to: "/registrazione-attivita/dormire",
      img: "https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?q=80&w=1600&auto=format&fit=crop",
    },
    {
      key: "mangiare",
      title: "Mangiare & Bere",
      to: "/registrazione-attivita/mangiare",
      img: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=1600&auto=format&fit=crop",
    },
    {
      key: "artigiani",
      title: "Artigiani",
      to: "/registrazione-attivita/artigiani",
      img: "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=1600&auto=format&fit=crop",
    },
    {
      key: "trasporti",
      title: "Trasporti",
      to: "/registrazione-attivita/trasporti",
      img: "https://images.unsplash.com/photo-1465447142348-e9952c393450?q=80&w=1600&auto=format&fit=crop",
    },
  ];

  return (
    <main className="bg-white text-[#2a1d17]">
      {/* BARRA INDIETRO */}
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[#6B271A] font-semibold hover:text-[#D54E30] transition"
        >
          <ChevronLeft size={18} /> Indietro
        </Link>
      </div>

      {/* TESTATA */}
      <section className="pt-8 text-center px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#6B271A] leading-tight">
          Registra la tua <span className="text-[#E1B671]">attività</span>
        </h1>
        <p className="mt-3 text-lg md:text-xl text-zinc-700 max-w-3xl mx-auto">
          Promuovi la tua realtà locale, raccontati su Il Borghista e raggiungi
          nuovi clienti nel tuo borgo.
        </p>
      </section>

      {/* CARD CLICCABILI */}
      <section className="mt-10">
        <div className="mx-auto max-w-6xl px-4">
          {/* Mobile: scroll orizzontale con snap */}
          <div className="flex gap-4 overflow-x-auto md:hidden snap-x snap-mandatory pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">
            {categories.map((c) => (
              <Link
                key={c.key}
                to={c.to}
                className="group relative min-w-[270px] snap-start overflow-hidden rounded-2xl shadow-md ring-1 ring-zinc-100 hover:ring-[#E1B671]/40 transition-all"
              >
                <img
                  src={c.img}
                  alt={c.title}
                  className="h-60 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {/* overlay per contrasto */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/20" />
                {/* testo bianco centrato */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3
                    className="text-white text-xl font-extrabold tracking-wide text-center px-3"
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}
                  >
                    {c.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: griglia 4 colonne */}
          <div className="hidden md:grid md:grid-cols-4 md:gap-6">
            {categories.map((c) => (
              <Link
                key={c.key}
                to={c.to}
                className="group relative overflow-hidden rounded-2xl shadow-md ring-1 ring-zinc-100 hover:ring-[#E1B671]/40 transition-all"
              >
                <img
                  src={c.img}
                  alt={c.title}
                  className="h-60 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3
                    className="text-white text-xl font-extrabold tracking-wide text-center px-3"
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}
                  >
                    {c.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BLOCCO CHIARIFICATORE (per sponsorizzate) */}
      <section className="mt-12 px-4">
        <div className="mx-auto max-w-5xl grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-[#FBE6C0] bg-[#FFF6E6] p-6 shadow-sm">
            <h4 className="font-bold text-[#6B271A] mb-1">Iscrizione semplice</h4>
            <p className="text-sm text-zinc-700">
              Pochi passaggi, nessun costo nascosto. Puoi modificare i dati in qualsiasi momento.
            </p>
          </div>
          <div className="rounded-2xl border border-[#FBE6C0] bg-[#FFF6E6] p-6 shadow-sm">
            <h4 className="font-bold text-[#6B271A] mb-1">Visibilità reale</h4>
            <p className="text-sm text-zinc-700">
              Sei su una piattaforma dedicata ai borghi: utenti in target e SEO curata.
            </p>
          </div>
          <div className="rounded-2xl border border-[#FBE6C0] bg-[#FFF6E6] p-6 shadow-sm">
            <h4 className="font-bold text-[#6B271A] mb-1">Supporto umano</h4>
            <p className="text-sm text-zinc-700">
              Ti aiutiamo noi se hai dubbi sulla categoria o sui contenuti da inserire.
            </p>
          </div>
        </div>
      </section>

      {/* HERO “BORGO” */}
      <section className="mt-14 md:mt-20">
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
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="inline-block bg-white/10 px-4 py-2 text-2xl md:text-4xl font-extrabold text-white backdrop-blur-sm rounded">
                Fai brillare la tua attività nel cuore del borgo
              </h2>
              <p className="mt-4 inline-block bg-black/30 px-4 py-2 text-sm md:text-base text-white/90 backdrop-blur-sm rounded">
                Scegli la categoria sopra e inizia: è rapido e intuitivo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-16 border-t border-zinc-100">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-zinc-500">
          © {new Date().getFullYear()} Il Borghista — Tutti i diritti riservati.
        </div>
      </footer>
    </main>
  );
}
