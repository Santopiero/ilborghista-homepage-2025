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
          Scegli il profilo con cui vuoi registrarti su{" "}
          <span className="font-semibold text-[#6B271A]">Il Borghista</span>: promuovi il tuo{" "}
          <span className="font-semibold">borgo</span>, fai crescere la tua{" "}
          <span className="font-semibold">attività</span>, pubblica come{" "}
          <span className="font-semibold">Creator</span> o esplora da{" "}
          <span className="font-semibold">utente</span> salvando esperienze, eventi e feedback.
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
            <article
              data-card
              className="min-w-[260px] sm:min-w-[320px] md:min-w-[360px] max-w-[90%] md:max-w-[360px] snap-start rounded-3xl overflow-hidden shadow-xl bg-white ring-1 ring-[#E1B671]/60"
            >
              <div className="w-full overflow-hidden h-40 sm:h-48 md:h-56">
                <img
                  src="https://media.istockphoto.com/id/1454275264/it/foto/arcidosso.jpg?s=2048x2048&w=is&k=20&c=b9Px_El6XNdGbNSgZ4VT36yYiQzHQrvIdTCvjb8Ptsk="
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
                  src="https://images.unsplash.com/photo-1534650075489-3baecec1e8b1?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
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
                  src="https://images.unsplash.com/photo-1673767296863-c00f139e4be8?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
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
                  src="https://media.istockphoto.com/id/1346146237/it/foto/ragazza-adolescente-madre-e-nonna-stanno-visitando-la-bellissima-citt%C3%A0-di-valldemossa-maiorca.jpg?s=2048x2048&w=is&k=20&c=ZJLmMy8do469viYOxDPxLMWvC-zK813omrP4juZ1u48="
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
