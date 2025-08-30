// src/pages/RegistrazioneBorgo.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function RegistrazioneBorgo() {
  const [form, setForm] = useState({
    nomeComune: "",
    provincia: "",
    regione: "",
    referente: "",
    email: "",
    telefono: "",
    sito: "",
    descrizione: "",
    privacy: false,
  });

  function update(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  function submit(e) {
    e.preventDefault();
    alert(`Richiesta inviata!\nComune: ${form.nomeComune}\nEmail: ${form.email}`);
    // TODO: invio a backend / service (quando pronto)
  }

  return (
    <main className="min-h-screen bg-[#FFF8E6]">
      <div className="mx-auto max-w-5xl p-6">
        <Link
          to="/registrazione-comune"
          className="inline-flex items-center text-[#6B271A] hover:underline"
        >
          ← Torna alla scelta profilo
        </Link>

        <header className="mt-4">
          <h1 className="text-3xl md:text-4xl font-black text-[#6B271A]">
            Registra il tuo <span className="text-[#E1B671]">Borgo</span>
          </h1>
          <p className="text-gray-700 mt-2">
            Compila i campi per richiedere l’attivazione della pagina del tuo Comune su Il Borghista.
          </p>
        </header>

        {/* Foto di copertina */}
        <div className="mt-6 overflow-hidden rounded-2xl shadow">
          <img
            src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop"
            alt="Borgo italiano"
            className="w-full h-64 object-cover"
          />
        </div>

        {/* FORM */}
        <form
          onSubmit={submit}
          className="mt-8 grid gap-5 sm:grid-cols-2 bg-white/80 p-6 rounded-2xl shadow"
        >
          <div className="sm:col-span-2 grid gap-5 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome Comune*</label>
              <input
                type="text"
                name="nomeComune"
                value={form.nomeComune}
                onChange={update}
                required
                className="mt-1 w-full rounded-lg border-gray-300 focus:border-[#E1B671] focus:ring-[#E1B671]"
                placeholder="Es. Arnad"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Provincia</label>
              <input
                type="text"
                name="provincia"
                value={form.provincia}
                onChange={update}
                className="mt-1 w-full rounded-lg border-gray-300 focus:border-[#E1B671] focus:ring-[#E1B671]"
                placeholder="Es. AO"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Regione</label>
              <input
                type="text"
                name="regione"
                value={form.regione}
                onChange={update}
                className="mt-1 w-full rounded-lg border-gray-300 focus:border-[#E1B671] focus:ring-[#E1B671]"
                placeholder="Es. Valle d’Aosta"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Referente*</label>
            <input
              type="text"
              name="referente"
              value={form.referente}
              onChange={update}
              required
              className="mt-1 w-full rounded-lg border-gray-300 focus:border-[#E1B671] focus:ring-[#E1B671]"
              placeholder="Nome e cognome"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email*</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={update}
              required
              className="mt-1 w-full rounded-lg border-gray-300 focus:border-[#E1B671] focus:ring-[#E1B671]"
              placeholder="referente@comune.it"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Telefono</label>
            <input
              type="tel"
              name="telefono"
              value={form.telefono}
              onChange={update}
              className="mt-1 w-full rounded-lg border-gray-300 focus:border-[#E1B671] focus:ring-[#E1B671]"
              placeholder="+39 …"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Sito web</label>
            <input
              type="url"
              name="sito"
              value={form.sito}
              onChange={update}
              className="mt-1 w-full rounded-lg border-gray-300 focus:border-[#E1B671] focus:ring-[#E1B671]"
              placeholder="https://www.comune.it"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Descrizione</label>
            <textarea
              name="descrizione"
              value={form.descrizione}
              onChange={update}
              rows={4}
              className="mt-1 w-full rounded-lg border-gray-300 focus:border-[#E1B671] focus:ring-[#E1B671]"
              placeholder="Breve presentazione del borgo (facoltativa)…"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="inline-flex items-center gap-3">
              <input
                type="checkbox"
                name="privacy"
                checked={form.privacy}
                onChange={update}
                className="h-4 w-4 rounded border-gray-300 text-[#6B271A] focus:ring-[#E1B671]"
                required
              />
              <span className="text-sm text-gray-700">
                Ho letto e accetto l’informativa privacy.
              </span>
            </label>
          </div>

          <div className="sm:col-span-2 flex items-center justify-end gap-3">
            <Link
              to="/registrazione-comune"
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Indietro
            </Link>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#6B271A] text-white font-semibold hover:bg-[#581f13]"
            >
              Invia richiesta
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
