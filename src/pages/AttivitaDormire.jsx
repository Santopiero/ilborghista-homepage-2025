// src/pages/AttivitaDormire.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function AttivitaDormire() {
  // stato molto semplice solo per la preview
  const [form, setForm] = useState({
    nome: "",
    stelle: "3",
    descrizione: "",
    prezzo: "",
    via: "",
    citta: "",
    provincia: "",
    email: "",
    telefono: "",
    sito: "",
    servizi: {
      colazione: false,
      parcheggio: false,
      wifi: true,
      pet: false,
      accessibile: false,
      aria: true,
      piscina: false,
      spa: false,
    },
    fotoPreview: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleServizioToggle(key) {
    setForm((f) => ({ ...f, servizi: { ...f.servizi, [key]: !f.servizi[key] } }));
  }

  function handleFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setForm((f) => ({ ...f, fotoPreview: url }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // qui invierai i dati al backend quando lo avrai
    alert("Registrazione inviata! 🎉");
  }

  const tagServizi = Object.entries(form.servizi)
    .filter(([, v]) => v)
    .map(([k]) => k);

  return (
    <div className="bg-[#FDF8F2] min-h-screen">
      {/* header breadcrumb */}
      <div className="border-b border-[#E7D6B8] bg-[#F7EBD7]">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-2 text-sm">
          <Link to="/registrazione-attivita" className="text-[#6B271A] hover:underline">
            ← Torna a “Registra la tua Attività”
          </Link>
          <span className="text-[#9C7A43]">/</span>
          <span className="text-[#6B271A] font-semibold">Dormire</span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-extrabold text-[#6B271A]">
          Registra la tua Attività: <span className="text-[#A5562A]">Dormire</span>
        </h1>
        <p className="mt-2 text-[#6B271A]/80">
          Pochi campi essenziali per essere subito visibile su <strong>Il Borghista</strong>.
          A destra vedi l’<em>anteprima live</em> della tua card.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* COLONNA FORM */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 space-y-8"
            noValidate
          >
            {/* STEP 1 — Info base */}
            <section className="rounded-2xl border border-[#E7D6B8] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#6B271A]">
                1) Info di base
              </h2>
              <p className="text-sm text-[#6B271A]/70">
                Nome della struttura, categoria, breve descrizione e prezzo base.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#6B271A]">
                    Nome struttura *
                  </label>
                  <input
                    name="nome"
                    value={form.nome}
                    onChange={handleChange}
                    required
                    placeholder="Es. B&B La Torre Antica"
                    className="mt-1 w-full rounded-xl border border-[#E7D6B8] bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E1B671]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6B271A]">
                    Stelle
                  </label>
                  <select
                    name="stelle"
                    value={form.stelle}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-[#E7D6B8] bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E1B671]"
                  >
                    <option value="1">★</option>
                    <option value="2">★★</option>
                    <option value="3">★★★</option>
                    <option value="4">★★★★</option>
                    <option value="5">★★★★★</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6B271A]">
                    Prezzo base / notte (EUR) *
                  </label>
                  <input
                    name="prezzo"
                    value={form.prezzo}
                    onChange={handleChange}
                    required
                    type="number"
                    min="0"
                    placeholder="Es. 90"
                    className="mt-1 w-full rounded-xl border border-[#E7D6B8] bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E1B671]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#6B271A]">
                    Descrizione breve (max 180 caratteri)
                  </label>
                  <textarea
                    name="descrizione"
                    value={form.descrizione}
                    onChange={handleChange}
                    rows={3}
                    maxLength={180}
                    placeholder="Racconta in due righe cosa rende speciale il tuo alloggio…"
                    className="mt-1 w-full rounded-xl border border-[#E7D6B8] bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E1B671]"
                  />
                  <div className="mt-1 text-right text-xs text-[#6B271A]/60">
                    {form.descrizione.length}/180
                  </div>
                </div>
              </div>
            </section>

            {/* STEP 2 — Contatti & posizione */}
            <section className="rounded-2xl border border-[#E7D6B8] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#6B271A]">
                2) Contatti & posizione
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#6B271A]">
                    Indirizzo (via e n°)
                  </label>
                  <input
                    name="via"
                    value={form.via}
                    onChange={handleChange}
                    placeholder="Via Roma 10"
                    className="mt-1 w-full rounded-xl border border-[#E7D6B8] bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E1B671]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6B271A]">
                    Città
                  </label>
                  <input
                    name="citta"
                    value={form.citta}
                    onChange={handleChange}
                    placeholder="Es. Arnad"
                    className="mt-1 w-full rounded-xl border border-[#E7D6B8] bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E1B671]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6B271A]">
                    Provincia
                  </label>
                  <input
                    name="provincia"
                    value={form.provincia}
                    onChange={handleChange}
                    placeholder="AO"
                    className="mt-1 w-full rounded-xl border border-[#E7D6B8] bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E1B671]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6B271A]">
                    Telefono
                  </label>
                  <input
                    name="telefono"
                    value={form.telefono}
                    onChange={handleChange}
                    placeholder="+39 ..."
                    className="mt-1 w-full rounded-xl border border-[#E7D6B8] bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E1B671]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6B271A]">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="info@struttura.it"
                    className="mt-1 w-full rounded-xl border border-[#E7D6B8] bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E1B671]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6B271A]">
                    Sito web
                  </label>
                  <input
                    name="sito"
                    value={form.sito}
                    onChange={handleChange}
                    placeholder="https://"
                    className="mt-1 w-full rounded-xl border border-[#E7D6B8] bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E1B671]"
                  />
                </div>
              </div>
            </section>

            {/* STEP 3 — Servizi */}
            <section className="rounded-2xl border border-[#E7D6B8] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#6B271A]">3) Servizi</h2>
              <p className="text-sm text-[#6B271A]/70">
                Seleziona solo ciò che offri realmente.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {[
                  ["wifi", "Wi-Fi"],
                  ["colazione", "Colazione inclusa"],
                  ["parcheggio", "Parcheggio"],
                  ["aria", "Aria condizionata"],
                  ["accessibile", "Accesso disabili"],
                  ["pet", "Pet-friendly"],
                  ["piscina", "Piscina"],
                  ["spa", "Spa / Wellness"],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 rounded-xl border border-[#E7D6B8] bg-white px-3 py-2 text-[#6B271A]"
                  >
                    <input
                      type="checkbox"
                      checked={form.servizi[key]}
                      onChange={() => handleServizioToggle(key)}
                      className="h-4 w-4 rounded border-[#E7D6B8] text-[#E1B671] focus:ring-[#E1B671]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </section>

            {/* STEP 4 — Foto & invio */}
            <section className="rounded-2xl border border-[#E7D6B8] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#6B271A]">
                4) Foto & invio
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-[#6B271A]">
                    Foto copertina (1 immagine)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFoto}
                    className="mt-1 block w-full text-sm text-[#6B271A]"
                  />
                  <p className="mt-1 text-xs text-[#6B271A]/60">
                    JPG o PNG · consigliato 1600×900
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="rounded-xl bg-[#6B271A] px-5 py-3 font-semibold text-white shadow hover:opacity-95"
                >
                  Salva e invia
                </button>
                <Link
                  to="/registrazione-attivita"
                  className="rounded-xl border border-[#E7D6B8] bg-white px-5 py-3 font-semibold text-[#6B271A] hover:bg-[#FAF5E0]"
                >
                  Annulla
                </Link>
              </div>
            </section>
          </form>

          {/* COLONNA PREVIEW */}
          <aside className="lg:sticky lg:top-8">
            <div className="rounded-2xl border border-[#E7D6B8] bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#9C7A43]">
                Anteprima card
              </h3>

              <div className="overflow-hidden rounded-2xl border border-[#F0E6D1]">
                <div className="aspect-[16/9] bg-[#F7EBD7]">
                  {form.fotoPreview ? (
                    <img
                      src={form.fotoPreview}
                      alt="Anteprima"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#9C7A43]">
                      Nessuna foto
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-[#6B271A]">
                      {form.nome || "Nome struttura"}
                    </h4>
                    <div className="text-[#E1B671] text-sm">
                      {"★".repeat(Number(form.stelle || 3))}
                    </div>
                  </div>

                  <p className="mt-1 text-sm text-[#6B271A]/80 line-clamp-2">
                    {form.descrizione || "Breve descrizione della struttura…"}
                  </p>

                  {!!tagServizi.length && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {tagServizi.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-[#E7D6B8] bg-[#FAF5E0] px-2 py-0.5 text-xs text-[#6B271A]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-[#6B271A]/70">
                      {form.citta ? `${form.citta} (${form.provincia || ""})` : "Località"}
                    </span>
                    <span className="text-base font-extrabold text-[#6B271A]">
                      {form.prezzo ? `€ ${form.prezzo}/notte` : "€ —/notte"}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs text-[#6B271A]/60">
                L’anteprima è indicativa; l’aspetto finale si adatta al layout del sito.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
