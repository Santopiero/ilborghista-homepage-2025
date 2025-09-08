// src/pages/Registrazione.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Building2, Store, Users, Video } from "lucide-react";

export default function Registrazione() {
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

      {/* Intro */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-gray-700 text-base md:text-lg">
          Scegli il profilo con cui vuoi registrarti su{" "}
          <span className="font-semibold text-[#6B271A]">Il Borghista</span>.
          Puoi promuovere il tuo borgo, far crescere la tua attività,
          pubblicare contenuti come <span className="font-semibold">Creator</span>,
          oppure salvare esperienze come utente.
        </p>
      </section>

      {/* Quattro card */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        {/* 🔧 Mobile: 2 colonne | Desktop: 4 colonne */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
          {/* BORGO */}
          <article className="rounded-3xl overflow-hidden shadow-xl bg-white ring-1 ring-[#E1B671]/60">
            <div className="w-full overflow-hidden h-36 sm:h-44 md:h-56">
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
          <article className="rounded-3xl overflow-hidden shadow-xl bg-white ring-1 ring-[#E1B671]/60">
            <div className="w-full overflow-hidden h-36 sm:h-44 md:h-56">
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
          <article className="rounded-3xl overflow-hidden shadow-xl bg-white ring-1 ring-[#E1B671]/60">
            <div className="w-full overflow-hidden h-36 sm:h-44 md:h-56">
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
          <article className="rounded-3xl overflow-hidden shadow-xl bg-white ring-1 ring-[#E1B671]/60">
            <div className="w-full overflow-hidden h-36 sm:h-44 md:h-56">
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
      </section>
    </main>
  );
}
