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
    "https://images.unsplash.com/photo-1691524711418-53acf98c84fa?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
  const CTA_BG_URL =
    "https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?q=80&w=2000&auto=format&fit=crop";

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

      {/* Intro (frase ridotta, termini in bold) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <p className="text-gray-700 text-sm md:text-base">
          Promuovi il tuo <span className="font-semibold">Borgo</span>, fai crescere la tua{" "}
          <span className="font-semibold">Attività</span>, pubblica come{" "}
          <span className="font-semibold">Creator</span> o esplora da{" "}
          <span className="font-semibold">Borghista</span>.
        </p>
      </section>

      {/* Card a scorrimento orizzontale */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-10">
        <div className="relative">
          <div
            ref={scrollerRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth"
          >
            {/* BORGO */}
            <Link
              to="/registrazione-borgo"
              aria-label="Registra il tuo borgo"
              className="block focus:outline-none focus-visible:ring-4 focus-visible:ring-[#E1B671]/70 rounded-[1.6rem]"
            >
              <article
                data-card
                className="min-w-[260px] sm:min-w-[320px] md:min-w-[360px] max-w-[90%] md:max-w-[360px] snap-start rounded-3xl overflow-hidden shadow-xl bg-white ring-1 ring-[#E1B671]/60 cursor-pointer hover:shadow-2xl transition-shadow"
              >
                <div className="relative w-full overflow-hidden h-40 sm:h-48 md:h-56">
                  <img
                    src="https://media.istockphoto.com/id/1454275264/it/foto/arcidosso.jpg?s=2048x2048&w=is&k=20&c=b9Px_El6XNdGbNSgZ4VT36yYiQzHQrvIdTCvjb8Ptsk="
                    alt="Borgo italiano"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="flex items-center gap-2 text-white font-extrabold text-2xl">
                      <Building2 size={40} />
                      <span>BORGO</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-5 md:p-6">
                  <p className="mt-2 text-gray-700 text-sm sm:text-base text-center">
                    Dai visibilità al tuo comune con un portale turistico dedicato e completo.
                  </p>
                </div>
              </article>
            </Link>

            {/* ATTIVITÀ */}
            <Link
              to="/registrazione-attivita"
              aria-label="Registra la tua attività"
              className="block focus:outline-none focus-visible:ring-4 focus-visible:ring-[#E1B671]/70 rounded-[1.6rem]"
            >
              <article
                data-card
                className="min-w-[260px] sm:min-w-[320px] md:min-w-[360px] max-w-[90%] md:max-w-[360px] snap-start rounded-3xl overflow-hidden shadow-xl bg-white ring-1 ring-[#E1B671]/60 cursor-pointer hover:shadow-2xl transition-shadow"
              >
                <div className="relative w-full overflow-hidden h-40 sm:h-48 md:h-56">
                  <img
                    src="https://images.unsplash.com/photo-1534650075489-3baecec1e8b1?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Attività locale"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="flex items-center gap-2 text-white font-extrabold text-2xl">
                      <Store size={40} />
                      <span>ATTIVITÀ</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-5 md:p-6">
                  <p className="mt-2 text-gray-700 text-sm sm:text-base text-center">
                    Promuovi la tua attività locale e raggiungi nuovi clienti nel tuo borgo.
                  </p>
                </div>
              </article>
            </Link>

            {/* UTENTE / CREATOR (unificata) */}
            <Link
              to="/registrazione-creator"
              aria-label="Registrati come utente o creator"
              className="block focus:outline-none focus-visible:ring-4 focus-visible:ring-[#E1B671]/70 rounded-[1.6rem]"
            >
              <article
                data-card
                className="min-w-[260px] sm:min-w-[320px] md:min-w-[360px] max-w-[90%] md:max-w-[360px] snap-start rounded-3xl overflow-hidden shadow-xl bg-white ring-1 ring-[#E1B671]/60 cursor-pointer hover:shadow-2xl transition-shadow"
              >
                <div className="relative w-full overflow-hidden h-40 sm:h-48 md:h-56">
                  <img
                    src="https://images.unsplash.com/photo-1673767296863-c00f139e4be8?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Utente e Creator"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="flex items-center gap-3 text-white font-extrabold text-2xl">
                      <Users size={34} />
                      <Video size={34} />
                      <span>UTENTE / CREATOR</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-5 md:p-6">
                  <p className="mt-2 text-gray-700 text-sm sm:text-base text-center">
                    Esplora come Borghista oppure pubblica contenuti come Creator — tutto in un unico profilo.
                  </p>
                </div>
              </article>
            </Link>
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

      {/* CTA finale con foto potente */}
      <section className="w-full">
        <div
          className="relative w-full rounded-none md:rounded-2xl overflow-hidden"
          style={{
            backgroundImage: `url(${CTA_BG_URL})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/35" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-white text-xl md:text-2xl font-extrabold">
              Contribuisci a rendere unico ogni luogo.
            </h2>
            <Link
              to="/registrazione-creator"
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[#E1B671] text-[#6B271A] font-semibold shadow hover:brightness-95"
            >
              Contribuisci ora
            </Link>
          </div>
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
