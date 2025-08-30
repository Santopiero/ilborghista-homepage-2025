// src/pages/RegistrazioneUtente.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function RegistrazioneUtente() {
  return (
    <main className="min-h-screen bg-[#FFF8E6]">
      <div className="mx-auto max-w-3xl p-6">
        <Link to="/registrazione-comune" className="text-[#6B271A] hover:underline">
          ← Torna alla scelta profilo
        </Link>
        <h1 className="mt-4 text-3xl font-black text-[#6B271A]">
          Registrazione <span className="text-[#E1B671]">Utente</span>
        </h1>
        <p className="mt-2 text-gray-700">
          (Placeholder) Qui andrà la registrazione utente.
        </p>
      </div>
    </main>
  );
}
