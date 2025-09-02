// src/pages/RegistrazioneAttivita/Mangiare.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, MapPin, Upload, Trash2, Save, CheckCircle2,
  Euro, Image, Camera, UtensilsCrossed, Clock, FileText, Video as VideoIcon, Heart
} from "lucide-react";

/* ====================== BOZZA (localStorage) ====================== */
const KEY = "draft-attivita-ristorazione";
const defaultDraft = {
  tipo: "ristorazione",
  nome: "",
  descrizioneBreve: "",
  descrizione: "",
  tipologia: "Ristorante", // Ristorante/Trattoria/Pizzeria/Bar/Enoteca/Street Food/Agriturismo
  cucina: [],               // ["Mediterranea","Locale","Vegetariana",...]
  specialita: "",
  fasciaPrezzo: "€€",       // €, €€, €€€, €€€€
  coperti: "",
  prenotazioneConsigliata: true,
  giorniChiusura: [],       // ["Lun","Mar",...]
  orari: [{ dal:"12:00", al:"15:00" }, { dal:"19:00", al:"23:00" }],

  // Localizzazione
  indirizzo: "", cap: "", comune: "", provincia: "", regione: "",
  coordinate: { lat: "", lng: "" },

  // Media
  avatar: null,    // cover (base64)
  gallery: [],     // immagini locali (base64)
  menuFiles: [],   // immagini/pdf del menù (base64 + meta)
  videos: [],      // [{ name, type, size, url }]  <-- Object URL (non in localStorage)

  // Servizi
  servizi: {
    tavoliEsterni: false, salaInterna: true, accessibile: false,
    kidsFriendly: true, petFriendly: true,
    vegOpzioni: true, glutenFree: false, lactoFree: false,
    wiFi: false, parcheggio: false, delivery: false, takeaway: true,
    pagamentoCarte: true, pagamentoDigitale: true
  },

  // Policy/Info
  policy: {
    dressCode: "Informale",
    eventiPrivati: false,
    musicaDalVivo: false
  },

  // Prezzi
  prezzi: {
    prezzoMedioPersona: "", // es. 25
    coperto: "",            // es. 2
  },
};

function useDraft() {
  const [draft, setDraft] = useState(() => {
    const saved = localStorage.getItem(KEY);
    return saved ? JSON.parse(saved) : defaultDraft;
  });

  // Salva su localStorage escludendo i video (che usano Object URL)
  useEffect(() => {
    const toSave = JSON.stringify(draft, (k, v) => (k === "videos" ? [] : v));
    localStorage.setItem(KEY, toSave);
  }, [draft]);

  const reset = () => { localStorage.removeItem(KEY); setDraft(defaultDraft); };
  return { draft, setDraft, reset };
}

/* ====================== UI helper ====================== */
function Section({ title, children, right }) {
  return (
    <section className="bg-white rounded-2xl border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[#6B271A] font-extrabold">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}
function Field({ label, children, hint, error }) {
  return (
    <label className="block">
      <div className="text-sm font-semibold text-[#6B271A] mb-1">{label}</div>
      {children}
      {hint ? <div className="text-xs text-gray-500 mt-1">{hint}</div> : null}
      {error ? <div className="text-xs text-[#D54E30] mt-1">{error}</div> : null}
    </label>
  );
}
function Dropzone({ onFiles, accept, multiple = true }) {
  const inputRef = useRef(null);
  const onDrop = (e) => {
    e.preventDefault();
    onFiles(Array.from(e.dataTransfer.files || []));
  };
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="border-2 border-dashed rounded-xl p-6 text-center hover:bg-[#FAF5E0]/40"
    >
      <div className="flex flex-col items-center gap-2">
        <Upload />
        <div className="font-semibold">Trascina qui i file</div>
        <div className="text-sm text-gray-600">oppure clicca per selezionarli</div>
        <input
          type="file"
          ref={inputRef}
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => onFiles(Array.from(e.target.files || []))}
        />
        <button
          type="button"
          className="mt-2 px-3 py-1.5 rounded-lg border font-semibold"
          onClick={() => inputRef.current?.click()}
        >
          Scegli file
        </button>
      </div>
    </div>
  );
}
function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
function revokeURL(url) {
  try { URL.revokeObjectURL(url); } catch {}
}

/* === CHIP (pill responsive, non comprimibile) === */
function ChipButton({ active, children, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        `shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full border text-sm font-semibold ` +
        (active
          ? "bg-[#D54E30] text-white border-[#6B271A]"
          : "bg-[#FAF5E0] text-[#6B271A] border-[#E1B671] hover:bg-[#F3E7C3]") +
        (className ? ` ${className}` : "")
      }
    >
      {children}
    </button>
  );
}

/* ====================== Stepper + Preview ====================== */
const steps = [
  { id: 1, label: "Dati" },
  { id: 2, label: "Localizzazione" },
  { id: 3, label: "Media" },
  { id: 4, label: "Menù" },
  { id: 5, label: "Servizi" },
  { id: 6, label: "Prezzi" },
  { id: 7, label: "Riepilogo" },
];

function Stepper({ step, setStep, completed }) {
  const pct = ((step - 1) / (steps.length - 1)) * 100;

  return (
    <div className="space-y-3">
      {/* mobile: riga scrollabile, desktop: griglia 7 colonne */}
      <div className="md:hidden -mx-1 px-1 flex gap-2 overflow-x-auto no-scrollbar">
        {steps.map((s) => {
          const isActive = s.id === step;
          const isDone = completed.has(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={`shrink-0 whitespace-nowrap rounded-xl border px-3 py-2 text-sm font-semibold
                ${isActive ? "border-[#D54E30] text-[#D54E30] bg-[#FAF5E0]"
                          : isDone ? "border-green-500/40 text-green-700 bg-green-50"
                                   : "border-neutral-200 text-neutral-700 bg-white hover:bg-neutral-50"}`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="hidden md:grid md:grid-cols-7 md:gap-2">
        {steps.map(s => {
          const isActive = s.id === step;
          const isDone = completed.has(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={`rounded-xl border px-2 py-2 text-sm font-semibold
                ${isActive ? "border-[#D54E30] text-[#D54E30] bg-[#FAF5E0]"
                           : isDone ? "border-green-500/40 text-green-700 bg-green-50"
                                    : "border-neutral-200 text-neutral-700 bg-white hover:bg-neutral-50"}`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
        <div className="h-full bg-[#D54E30] transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PreviewSidebar({ draft }) {
  const cover = draft.avatar || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop";
  return (
    <aside className="sticky top-4 space-y-4">
      <div className="rounded-2xl border overflow-hidden shadow-sm bg-white">
        <div className="h-36 w-full relative">
          <img src={cover} alt="" className="h-36 w-full object-cover" />
          <div className="absolute top-2 left-2 flex items-center gap-2 px-2 py-1 rounded-full bg-white/90 text-xs font-semibold">
            <UtensilsCrossed size={14}/> {draft.tipologia || "Ristorazione"}
          </div>
        </div>
        <div className="p-4 space-y-2">
          <div className="text-lg font-extrabold text-[#6B271A]">{draft.nome || "Nome attività"}</div>
          <div className="text-sm text-gray-700 flex items-center gap-2">
            <MapPin size={16}/>
            {draft.comune ? `${draft.comune}${draft.provincia ? " ("+draft.provincia+")" : ""}` : "Località"}
          </div>
          {draft.descrizioneBreve
            ? <p className="text-sm text-gray-700">{draft.descrizioneBreve}</p>
            : <p className="text-sm text-gray-500 italic">Anteprima descrizione breve…</p>}
          <div className="text-xs text-gray-600 flex items-center gap-2 pt-1">
            <Clock size={14}/> Orari tipici: {draft.orari?.filter(x=>x.dal&&x.al).map(x=>`${x.dal}-${x.al}`).join(" / ") || "—"}
          </div>
          {draft.videos?.length ? (
            <div className="text-xs text-gray-600 pt-1">🎬 {draft.videos.length} video</div>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border p-4 bg-white">
        <div className="text-sm font-semibold text-[#6B271A] mb-2">Consigli rapidi</div>
        <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
          <li>Avatar nitido del locale/piatti firma.</li>
          <li>Indica <b>fascia prezzo</b> e <b>orari</b> chiari.</li>
          <li>Carica il <b>menù</b> (PDF o immagini).</li>
        </ul>
      </div>
    </aside>
  );
}

/* ====================== Pagina ====================== */
export default function Mangiare() {
  const { draft, setDraft, reset } = useDraft();
  const [step, setStep] = useState(1);

  // libera gli Object URL dei video quando si smonta la pagina
  useEffect(() => {
    return () => {
      (draft.videos || []).forEach(v => v?.url && revokeURL(v.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const completed = useMemo(() => {
    const d = new Set();
    if (draft.nome && draft.descrizioneBreve && draft.tipologia) d.add(1);
    if (draft.indirizzo && draft.comune && draft.provincia) d.add(2);
    if (draft.avatar) d.add(3);
    if (draft.menuFiles.length) d.add(4);
    d.add(5); d.add(6);
    if (d.has(1) && d.has(2)) d.add(7);
    return d;
  }, [draft]);

  const errors = useMemo(() => {
    const e = {};
    if (step >= 1) {
      if (!draft.nome?.trim()) e.nome = "Inserisci il nome dell’attività";
      if (!draft.descrizioneBreve?.trim()) e.descrizioneBreve = "Inserisci una descrizione breve";
      if (!draft.tipologia?.trim()) e.tipologia = "Seleziona una tipologia";
    }
    if (step >= 2) {
      if (!draft.indirizzo?.trim()) e.indirizzo = "Indirizzo obbligatorio";
      if (!draft.comune?.trim()) e.comune = "Comune obbligatorio";
      if (!draft.provincia?.trim()) e.provincia = "Provincia obbligatoria";
    }
    if (step >= 3) {
      if (!draft.avatar) e.avatar = "Foto profilo/cover consigliata";
    }
    return e;
  }, [draft, step]);

  const canNext = Object.keys(errors).length === 0;
  const maxStep = 7;
  const next = () => setStep(s => Math.min(s + 1, maxStep));
  const prev = () => setStep(s => Math.max(s - 1, 1));
  const skippable = step !== 1 && step !== 3;

  const submit = () => {
    console.log("SUBMIT RISTORAZIONE:", draft);
    alert("Richiesta inviata! Ti contatteremo per la verifica.");
    // libera eventuali URL video prima del reset
    (draft.videos || []).forEach(v => v?.url && revokeURL(v.url));
    reset();
    setStep(1);
  };

  /* ====================== Render ====================== */
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* Top bar */}
      <nav className="flex items-center justify-between mb-4">
        <Link to="/registrazione-attivita" className="inline-flex items-center gap-2 text-[#6B271A] font-semibold">
          <ChevronLeft /> Indietro
        </Link>
        <div className="text-sm text-gray-600">Step <span className="font-semibold">{step}</span> / {maxStep}</div>
      </nav>

      <h1 className="text-2xl font-extrabold text-[#6B271A]">Crea profilo Mangiare &amp; Bere</h1>
      <p className="text-gray-700 mb-4">Compila i campi essenziali. Potrai completare i dettagli anche in un secondo momento.</p>

      <Stepper step={step} setStep={setStep} completed={completed} />

      {/* Grid: Form + Preview */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_360px] gap-6">
        {/* === FORM === */}
        <div className="space-y-6">
          {/* STEP 1 — Dati principali */}
          {step === 1 && (
            <Section title="Dati principali">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Nome attività" error={errors.nome}>
                  <input className="w-full border rounded-xl px-3 py-2"
                         value={draft.nome}
                         onChange={(e)=>setDraft({...draft, nome:e.target.value})}
                         placeholder="Es. Trattoria del Borgo" />
                </Field>

                <Field label="Tipologia" error={errors.tipologia}>
                  <select className="w-full border rounded-xl px-3 py-2"
                          value={draft.tipologia}
                          onChange={(e)=>setDraft({...draft, tipologia:e.target.value})}>
                    {["Ristorante","Trattoria","Pizzeria","Bar","Enoteca","Street Food","Agriturismo"].map(t=>(
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Cucina (selezione rapida)">
                  {/* mobile: scroll orizzontale, desktop: wrap */}
                  <div className="flex gap-2 overflow-x-auto md:flex-wrap md:overflow-visible -mx-1 px-1">
                    {["Locale","Mediterranea","Di mare","Carne","Vegetariana","Vegana","Senza glutine","Pasticceria"].map(tag=> {
                      const active = draft.cucina.includes(tag);
                      return (
                        <ChipButton
                          key={tag}
                          active={active}
                          onClick={()=>{
                            const set = new Set(draft.cucina);
                            active ? set.delete(tag) : set.add(tag);
                            setDraft({...draft, cucina: Array.from(set)});
                          }}
                        >
                          {tag}
                        </ChipButton>
                      );
                    })}
                  </div>
                </Field>

                <Field label="Specialità della casa">
                  <input className="w-full border rounded-xl px-3 py-2"
                         value={draft.specialita}
                         onChange={(e)=>setDraft({...draft, specialita:e.target.value})}
                         placeholder="Es. Orecchiette al sugo, dolci tipici…" />
                </Field>

                <Field label="Fascia prezzo">
                  <select className="w-full border rounded-xl px-3 py-2"
                          value={draft.fasciaPrezzo}
                          onChange={(e)=>setDraft({...draft, fasciaPrezzo:e.target.value})}>
                    {["€","€€","€€€","€€€€"].map(x=> <option key={x}>{x}</option>)}
                  </select>
                </Field>

                <Field label="Coperti">
                  <input type="number" min="0" className="w-full border rounded-xl px-3 py-2"
                         value={draft.coperti}
                         onChange={(e)=>setDraft({...draft, coperti:e.target.value})}
                         placeholder="Es. 40" />
                </Field>

                <div className="sm:col-span-2 grid sm:grid-cols-2 gap-4">
                  <Field label="Orario (pranzo)">
                    <div className="flex gap-2">
                      <input className="w-full border rounded-xl px-3 py-2" value={draft.orari[0]?.dal}
                             onChange={(e)=>{ const o=[...draft.orari]; o[0]={...o[0], dal:e.target.value}; setDraft({...draft, orari:o}); }}
                             placeholder="12:00" />
                      <span className="self-center">–</span>
                      <input className="w-full border rounded-xl px-3 py-2" value={draft.orari[0]?.al}
                             onChange={(e)=>{ const o=[...draft.orari]; o[0]={...o[0], al:e.target.value}; setDraft({...draft, orari:o}); }}
                             placeholder="15:00" />
                    </div>
                  </Field>
                  <Field label="Orario (cena)">
                    <div className="flex gap-2">
                      <input className="w-full border rounded-xl px-3 py-2" value={draft.orari[1]?.dal}
                             onChange={(e)=>{ const o=[...draft.orari]; o[1]={...o[1], dal:e.target.value}; setDraft({...draft, orari:o}); }}
                             placeholder="19:00" />
                      <span className="self-center">–</span>
                      <input className="w-full border rounded-xl px-3 py-2" value={draft.orari[1]?.al}
                             onChange={(e)=>{ const o=[...draft.orari]; o[1]={...o[1], al:e.target.value}; setDraft({...draft, orari:o}); }}
                             placeholder="23:00" />
                    </div>
                  </Field>
                </div>

                <Field label="Giorni di chiusura">
                  {/* mobile: scroll orizzontale, desktop: wrap */}
                  <div className="flex gap-2 overflow-x-auto md:flex-wrap md:overflow-visible -mx-1 px-1">
                    {["Lun","Mar","Mer","Gio","Ven","Sab","Dom"].map(g=>{
                      const active = draft.giorniChiusura.includes(g);
                      return (
                        <ChipButton
                          key={g}
                          active={active}
                          onClick={()=>{
                            const set = new Set(draft.giorniChiusura);
                            active ? set.delete(g) : set.add(g);
                            setDraft({...draft, giorniChiusura: Array.from(set)});
                          }}
                        >
                          {g}
                        </ChipButton>
                      );
                    })}
                  </div>
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Descrizione breve" hint="Max 160 caratteri" error={errors.descrizioneBreve}>
                    <input className="w-full border rounded-xl px-3 py-2"
                           value={draft.descrizioneBreve}
                           maxLength={160}
                           onChange={(e)=>setDraft({...draft, descrizioneBreve:e.target.value})}
                           placeholder="Cucina locale con prodotti tipici del territorio." />
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field label="Descrizione completa">
                    <textarea className="w-full border rounded-xl px-3 py-2 min-h-[120px]"
                              value={draft.descrizione}
                              onChange={(e)=>setDraft({...draft, descrizione:e.target.value})}
                              placeholder="Racconta l’esperienza, i piatti firma, la carta vini..." />
                  </Field>
                </div>
              </div>
            </Section>
          )}

          {/* STEP 2 — Localizzazione */}
          {step === 2 && (
            <Section title="Localizzazione">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Indirizzo" error={errors.indirizzo}>
                  <input className="w-full border rounded-xl px-3 py-2"
                         value={draft.indirizzo}
                         onChange={(e)=>setDraft({...draft, indirizzo:e.target.value})}
                         placeholder="Via Roma, 10" />
                </Field>
                <Field label="CAP">
                  <input className="w-full border rounded-xl px-3 py-2"
                         value={draft.cap}
                         onChange={(e)=>setDraft({...draft, cap:e.target.value})}
                         placeholder="00000" />
                </Field>
                <Field label="Comune" error={errors.comune}>
                  <input className="w-full border rounded-xl px-3 py-2"
                         value={draft.comune}
                         onChange={(e)=>setDraft({...draft, comune:e.target.value})}
                         placeholder="Es. Montemurro" />
                </Field>
                <Field label="Provincia" error={errors.provincia}>
                  <input className="w-full border rounded-xl px-3 py-2"
                         value={draft.provincia}
                         onChange={(e)=>setDraft({...draft, provincia:e.target.value})}
                         placeholder="Es. PZ" />
                </Field>
                <Field label="Regione">
                  <input className="w-full border rounded-xl px-3 py-2"
                         value={draft.regione}
                         onChange={(e)=>setDraft({...draft, regione:e.target.value})}
                         placeholder="Es. Basilicata" />
                </Field>
                <div className="sm:col-span-2 grid sm:grid-cols-2 gap-4">
                  <Field label="Latitudine">
                    <input className="w-full border rounded-xl px-3 py-2"
                           value={draft.coordinate.lat}
                           onChange={(e)=>setDraft({...draft, coordinate:{...draft.coordinate, lat:e.target.value}})}
                           placeholder="40.319" />
                  </Field>
                  <Field label="Longitudine">
                    <input className="w-full border rounded-xl px-3 py-2"
                           value={draft.coordinate.lng}
                           onChange={(e)=>setDraft({...draft, coordinate:{...draft.coordinate, lng:e.target.value}})}
                           placeholder="15.905" />
                  </Field>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border p-4 flex items-center gap-3 text-gray-600">
                <MapPin /> Anteprima mappa disponibile al salvataggio (integrazione provider mappe in step successivi).
              </div>
            </Section>
          )}

          {/* STEP 3 — Foto & Media (avatar + galleria + video) */}
          {step === 3 && (
            <Section title="Foto & Media">
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Avatar */}
                <div>
                  <Field label="Foto profilo (cover)" error={errors.avatar}>
                    <Dropzone multiple={false} accept="image/*" onFiles={async (files)=>{
                      if (!files[0]) return;
                      const b64 = await toBase64(files[0]);
                      setDraft({...draft, avatar:b64});
                    }}/>
                    {draft.avatar ? (
                      <div className="mt-3">
                        <img src={draft.avatar} alt="avatar" className="w-40 h-40 object-cover rounded-xl border" />
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-2"><Camera size={14}/> Consigliato: 1200×800, JPG leggero</p>
                    )}
                  </Field>
                </div>

                {/* Galleria immagini */}
                <div>
                  <Field label="Galleria (drag & drop)">
                    <Dropzone accept="image/*" onFiles={async (files)=>{
                      const arr=[]; for (const f of files) arr.push(await toBase64(f));
                      setDraft({...draft, gallery:[...draft.gallery, ...arr]});
                    }}/>
                    {draft.gallery?.length ? (
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {draft.gallery.map((src,i)=>(
                          <div key={i} className="relative">
                            <img src={src} className="w-full h-20 object-cover rounded-lg border"/>
                            <button type="button" className="absolute -top-2 -right-2 bg-white border rounded-full p-1 shadow"
                              onClick={()=>{ const g=[...draft.gallery]; g.splice(i,1); setDraft({...draft, gallery:g}); }}
                              aria-label="rimuovi foto"><Trash2 size={14}/></button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-2"><Image size={14}/> Piatti, sala, esterni: almeno 6 foto.</p>
                    )}
                  </Field>
                </div>

                {/* Video */}
                <div className="sm:col-span-2">
                  <Field label="Video (MP4 / WebM)" hint="Suggerimento: clip brevi 10–30s, max ~20MB ciascuno">
                    <Dropzone
                      accept="video/mp4,video/webm"
                      onFiles={async (files) => {
                        const videos = [];
                        for (const f of files) {
                          const url = URL.createObjectURL(f); // Object URL per preview (no localStorage)
                          videos.push({ name: f.name, type: f.type, size: f.size, url });
                        }
                        setDraft({ ...draft, videos: [...(draft.videos || []), ...videos] });
                      }}
                    />
                    {draft.videos?.length ? (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {draft.videos.map((v, i) => (
                          <div key={i} className="border rounded-xl p-3">
                            <div className="text-sm font-semibold mb-2 truncate flex items-center gap-2">
                              <VideoIcon size={16} /> {v.name}
                            </div>
                            <video controls className="w-full h-40 object-cover rounded-lg border bg-black">
                              <source src={v.url} type={v.type} />
                            </video>
                            <div className="flex justify-between items-center mt-2 text-xs text-gray-600">
                              <span>{(v.size / (1024 * 1024)).toFixed(1)} MB</span>
                              <button
                                type="button"
                                className="text-[#D54E30] font-semibold"
                                onClick={() => {
                                  const arr = [...draft.videos];
                                  const [removed] = arr.splice(i, 1);
                                  if (removed?.url) revokeURL(removed.url);
                                  setDraft({ ...draft, videos: arr });
                                }}
                              >
                                Rimuovi
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                        <VideoIcon size={14}/> Carica brevi clip del locale, dei piatti o dell’atmosfera.
                      </p>
                    )}
                  </Field>
                </div>
              </div>
            </Section>
          )}

          {/* STEP 4 — Menù (PDF o Immagini) */}
          {step === 4 && (
            <Section title="Menù">
              <Field label="Carica il menù (PDF o immagini)">
                <Dropzone accept=".pdf,image/*" onFiles={async (files)=>{
                  const out=[];
                  for (const f of files) {
                    const b64 = await toBase64(f);
                    out.push({ name: f.name, type: f.type, data: b64 });
                  }
                  setDraft({...draft, menuFiles: [...draft.menuFiles, ...out]});
                }}/>
              </Field>
              {draft.menuFiles?.length ? (
                <div className="mt-3 grid sm:grid-cols-2 gap-3">
                  {draft.menuFiles.map((m,i)=>(
                    <div key={i} className="border rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm">
                        {m.type?.includes("pdf") ? <FileText/> : <Image/>}
                        <span className="font-semibold">{m.name || `file_${i+1}`}</span>
                      </div>
                      <button className="text-[#D54E30]" onClick={()=>{
                        const arr=[...draft.menuFiles]; arr.splice(i,1); setDraft({...draft, menuFiles:arr});
                      }}>Rimuovi</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-2">Suggerimento: aggiungi anche un <b>menù degustazione</b> se disponibile.</p>
              )}
            </Section>
          )}

          {/* STEP 5 — Servizi */}
          {step === 5 && (
            <Section title="Servizi & Info">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <div className="font-semibold text-[#6B271A] mb-2">Servizi</div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(draft.servizi).map(([k,v])=>(
                      <label key={k} className="flex items-center gap-2 border rounded-lg px-3 py-2">
                        <input type="checkbox" checked={v}
                          onChange={(e)=>setDraft({...draft, servizi:{...draft.servizi, [k]:e.target.checked}})} />
                        <span className="capitalize">{k.replace(/([A-Z])/g,' $1')}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-[#6B271A] mb-2">Policy/Info</div>
                  <div className="grid gap-3">
                    <Field label="Dress code">
                      <select className="w-full border rounded-xl px-3 py-2"
                        value={draft.policy.dressCode}
                        onChange={(e)=>setDraft({...draft, policy:{...draft.policy, dressCode:e.target.value}})}>
                        <option>Informale</option><option>Smart casual</option><option>Elegante</option>
                      </select>
                    </Field>
                    <Field label="Eventi privati">
                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={draft.policy.eventiPrivati}
                          onChange={(e)=>setDraft({...draft, policy:{...draft.policy, eventiPrivati:e.target.checked}})} />
                        <span>Disponibili</span>
                      </label>
                    </Field>
                    <Field label="Musica dal vivo">
                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={draft.policy.musicaDalVivo}
                          onChange={(e)=>setDraft({...draft, policy:{...draft.policy, musicaDalVivo:e.target.checked}})} />
                        <span>Talvolta</span>
                      </label>
                    </Field>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* STEP 6 — Prezzi */}
          {step === 6 && (
            <Section title="Prezzi">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Prezzo medio a persona">
                  <div className="flex items-center gap-2">
                    <Euro className="text-gray-600" />
                    <input className="w-full border rounded-xl px-3 py-2"
                      value={draft.prezzi.prezzoMedioPersona}
                      onChange={(e)=>setDraft({...draft, prezzi:{...draft.prezzi, prezzoMedioPersona:e.target.value}})}
                      placeholder="Es. 25" />
                  </div>
                </Field>
                <Field label="Coperto (facoltativo)">
                  <div className="flex items-center gap-2">
                    <Euro className="text-gray-600" />
                    <input className="w-full border rounded-xl px-3 py-2"
                      value={draft.prezzi.coperto}
                      onChange={(e)=>setDraft({...draft, prezzi:{...draft.prezzi, coperto:e.target.value}})}
                      placeholder="Es. 2" />
                  </div>
                </Field>
              </div>
            </Section>
          )}

          {/* STEP 7 — Riepilogo */}
          {step === 7 && (
            <Section title="Riepilogo">
              <div className="space-y-3 text-sm">
                <div><span className="font-semibold">Nome:</span> {draft.nome || "—"}</div>
                <div><span className="font-semibold">Tipologia:</span> {draft.tipologia}</div>
                <div><span className="font-semibold">Cucina:</span> {draft.cucina?.join(", ") || "—"}</div>
                <div><span className="font-semibold">Orari:</span> {draft.orari?.filter(x=>x.dal&&x.al).map(x=>`${x.dal}-${x.al}`).join(" / ") || "—"}</div>
                <div><span className="font-semibold">Fascia prezzo:</span> {draft.fasciaPrezzo}</div>
                <div><span className="font-semibold">Prezzo medio:</span> {draft.prezzi.prezzoMedioPersona ? `€ ${draft.prezzi.prezzoMedioPersona}` : "—"}</div>
                <div><span className="font-semibold">Indirizzo:</span> {draft.indirizzo || "—"}, {draft.comune || "—"}{draft.provincia ? ` (${draft.provincia})` : ""}</div>
                <div className="flex items-center gap-2 text-green-700"><CheckCircle2 /> Pronto per l’invio</div>
              </div>
            </Section>
          )}

          {/* NAV BOTTOM */}
          <footer className="flex items-center justify-between">
            <button onClick={prev} disabled={step===1} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold disabled:opacity-40">
              <ChevronLeft /> Indietro
            </button>

            <div className="flex items-center gap-2">
              {skippable && step < 7 && (
                <button type="button" onClick={next} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold">
                  Salta per ora
                </button>
              )}
              <button type="button" onClick={()=>alert("Bozza salvata in locale.")} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold">
                <Save size={16}/> Salva bozza
              </button>
              {step < 7 ? (
                <button
                  onClick={next}
                  disabled={!canNext}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D54E30] text-white font-semibold disabled:opacity-50"
                >
                  Avanti <ChevronRight />
                </button>
              ) : (
                <button
                  onClick={submit}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D54E30] text-white font-semibold"
                >
                  Invia richiesta
                </button>
              )}
            </div>
          </footer>
        </div>

        {/* === PREVIEW === */}
        <div className="hidden md:block">
          <PreviewSidebar draft={draft} />
        </div>
      </div>
    </main>
  );
}
