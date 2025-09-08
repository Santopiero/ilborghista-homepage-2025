// src/pages/Registrazione.jsx
import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { Building2, Store, Users, Video, ArrowLeft, ArrowRight } from "lucide-react";

export default function Registrazione() {
  const scrollerRef = useRef(null);

  function slide(dir = 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector("[data-card]");
    const w = card ? card.getBoundingClientRect().width : 300;
    const gap = 16;
    el.scrollBy({ left: dir * (w + gap) * 2, behavior: "smooth" });
  }

  const HERO_URL =
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2000&auto=format&fit=crop";

  return (
    <main className="min-h-screen bg-white">
      {/* Header semplice */}
      <header className="border-b bg-[#FAF5E0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <Link to="/" className="text-[#6B271A] font-semibold hover:underline">
            ← Torna alla Home
          </Link>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#6B271A]">
            Registrazione
          </h1>
          <div className="w-28" />
        </div>
      </header>

      {/* Hero fotografico orizzontale */}
      <section className="w-full">
        <div
          className="relative w-full h-44 sm:h-56 md:h-72 lg:h-80"
          style={{
            backgroundImage: `url(${HERO_URL})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/10 to-transparent" />
        </div>
      </section>

      {/* Intro con termini in bold */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-gray-700 text-base md:text-lg">
          Scegli il profilo con cui vuoi registrarti su{" "}
          <span className="font-semibold text-[#6B271A]">Il Borghista</span>. Puoi promuovere il tuo{" "}
          <span className="font-semibold">borgo</span>, far crescere la tua{" "}
          <span className="font-semibold">attività</span>, pubblicare contenuti come{" "}
          <span className="font-semibold">Creator</span>, oppure come{" "}
          <span className="font-semibold">utente</span>, godendo della bellezza, salvare esperienze,
          segnalare eventi e lasciare feedback utili alla community.
        </p>
      </section>

      {/* Card a scorrimento orizzontale */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div className="relative">
          <div
            ref={scrollerRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth"
          >
            {/* BORGO */}
            <article
              data-card
              className="min-w-[260px] sm:min-w-[320px] md:min-w-[360px] max-w-[90%] md:max-w-[360px] snap-start rounded-3xl overflow-hidden shadow-xl bg-white ring-1 ring-[#E1B671]/60"
            >
              <div className="w-full overflow-hidden h-40 sm:h-48 md:h-56">
                <img
                  src="https://images.unsplash.com/photo-1586448184757-c29a99f1f2c7?q=80&w=1400&auto=format&fit=crop"
                  alt="Borgo italiano"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-4 sm:p-5 md:p-6">
                <div className="flex items-center gap-2 text-[#6B271A] font-extrabold text-base sm:text-lg">
                  <Building2 size={20} />
                  BORGO
                </div>
                <p className="mt-2 text-gray-700 text-sm sm:text-base">
                  Dai visibilità al tuo comune con un portale turistico dedicato e completo.
                </p>
                <Link
                  to="/registrazione-borgo"
                  className="mt-3 sm:mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D54E30] text-white font-semibold hover:bg-[#c2452b]"
                >
                  Registra il tuo borgo
                </Link>
              </div>
            </article>

            {/* ATTIVITÀ */}
            <article
              data-card
              className="min-w-[260px] sm:min-w-[320px] md:min-w-[360px] max-w-[90%] md:max-w-[360px] snap-start rounded-3xl overflow-hidden shadow-xl bg-white ring-1 ring-[#E1B671]/60"
            >
              <div className="w-full overflow-hidden h-40 sm:h-48 md:h-56">
                <img
                  src="https://images.unsplash.com/photo-1542744173-05336fcc7ad4?q=80&w=1400&auto=format&fit=crop"
                  alt="Attività locale"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-4 sm:p-5 md:p-6">
                <div className="flex items-center gap-2 text-[#6B271A] font-extrabold text-base sm:text-lg">
                  <Store size={20} />
                  ATTIVITÀ
                </div>
                <p className="mt-2 text-gray-700 text-sm sm:text-base">
                  Promuovi la tua attività locale e raggiungi nuovi clienti nel tuo borgo.
                </p>
                <Link
                  to="/registrazione-attivita"
                  className="mt-3 sm:mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D54E30] text-white font-semibold hover:bg-[#c2452b]"
                >
                  Registra la tua attività
                </Link>
              </div>
            </article>

            {/* CREATOR */}
            <article
              data-card
              className="min-w-[260px] sm:min-w-[320px] md:min-w-[360px] max-w-[90%] md:max-w-[360px] snap-start rounded-3xl overflow-hidden shadow-xl bg-white ring-1 ring-[#E1B671]/60"
            >
              <div className="w-full overflow-hidden h-40 sm:h-48 md:h-56">
                <img
                  src="https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1400&auto=format&fit=crop"
                  alt="Creator che realizza un video"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-4 sm:p-5 md:p-6">
                <div className="flex items-center gap-2 text-[#6B271A] font-extrabold text-base sm:text-lg">
                  <Video size={20} />
                  CREATOR
                </div>
                <p className="mt-2 text-gray-700 text-sm sm:text-base">
                  Pubblica video e contenuti dei borghi, guadagna visibilità e punti sulla piattaforma.
                </p>
                <Link
                  to="/registrazione-creator"
                  className="mt-3 sm:mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D54E30] text-white font-semibold hover:bg-[#c2452b]"
                >
                  Diventa creator
                </Link>
              </div>
            </article>

            {/* UTENTE */}
            <article
              data-card
              className="min-w-[260px] sm:min-w-[320px] md:min-w-[360px] max-w-[90%] md:max-w-[360px] snap-start rounded-3xl overflow-hidden shadow-xl bg-white ring-1 ring-[#E1B671]/60"
            >
              <div className="w-full overflow-hidden h-40 sm:h-48 md:h-56">
                <img
                  src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1400&auto=format&fit=crop"
                  alt="Coppia che pianifica un viaggio"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-4 sm:p-5 md:p-6">
                <div className="flex items-center gap-2 text-[#6B271A] font-extrabold text-base sm:text-lg">
                  <Users size={20} />
                  UTENTE
                </div>
                <p className="mt-2 text-gray-700 text-sm sm:text-base">
                  Scopri borghi, eventi ed esperienze uniche. Organizza il tuo viaggio perfetto.
                </p>
                <Link
                  to="/registrazione-utente"
                  className="mt-3 sm:mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D54E30] text-white font-semibold hover:bg-[#c2452b]"
                >
                  Registrati come utente
                </Link>
              </div>
            </article>
          </div>

          {/* Frecce (desktop) */}
          <button
            onClick={() => slide(-1)}
            className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 bg-white border rounded-full p-2 shadow hover:bg-gray-50"
            aria-label="Scorri indietro"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => slide(1)}
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 bg-white border rounded-full p-2 shadow hover:bg-gray-50"
            aria-label="Scorri avanti"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Utility: nascondo scrollbar orizzontali per un look pulito */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}
