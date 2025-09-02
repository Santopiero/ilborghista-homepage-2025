// src/pages/RegistrazioneAttivita/Dormire.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, MapPin, Upload, Trash2, Plus,
  Save, CheckCircle2, Euro, User, Image, Home, Camera
} from "lucide-react";

/* =========================================================
   BOZZA (localStorage) + UTIL
========================================================= */
const KEY = "draft-attivita";
const defaultDraft = {
  tipo: "dormire",
  nome: "",
  descrizioneBreve: "",
  descrizione: "",
  categoriaStruttura: "B&B",
  checkin: "15:00",
  checkout: "10:00",
  indirizzo: "",
  cap: "",
  comune: "",
  provincia: "",
  regione: "",
  coordinate: { lat: "", lng: "" },
  avatar: null,
  gallery: [],
  camere: [],
  servizi: {
    wifi: false, colazione: false, parcheggio: false, ariaCondizionata: false, animali: false,
    bagnoPrivato: true, asciugamani: true, phon: true
  },
  policy: { cancellazione: "Flessibile", fumo: "Vietato", bambini: "Ammessi" },
  prezzi: { tassaSoggiorno: false, prezzoNotte: "", prezzoPulizie: "", minimoNotti: 1 },
};

function useDraft() {
  const [draft, setDraft] = useState(() => {
    const saved = localStorage.getItem(KEY);
    return saved ? JSON.parse(saved) : defaultDraft;
  });
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(draft)); }, [draft]);
  const reset = () => { localStorage.removeItem(KEY); setDraft(defaultDraft); };
  return { draft, setDraft, reset };
}

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
function Dropzone({ onFiles, multiple = true }) {
  const ref = useRef(null);
  const onDrop = async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    onFiles(files);
  };
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="border-2 border-dashed rounded-xl p-6 text-center hover:bg-[#FAF5E0]/40"
    >
      <div className="flex flex-col items-center gap-2">
        <Upload />
        <div className="font-semibold">Trascina qui le tue foto</div>
        <div className="text-sm text-gray-600">oppure clicca per selezionarle</div>
        <input
          type="file"
          multiple={multiple}
          className="hidden"
          onChange={(e) => onFiles(Array.from(e.target.files || []))}
          ref={(el) => (ref.current = el)}
        />
        <button
          type="button"
          className="mt-2 px-3 py-1.5 rounded-lg border font-semibold"
          onClick={() => ref.current?.click()}
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

/* =========================================================
   COMPONENTI VISUAL: STEPPER, PROGRESS, PREVIEW
========================================================= */
const steps = [
  { id: 1, label: "Dati" },
  { id: 2, label: "Localizzazione" },
  { id: 3, label: "Foto" },
  { id: 4, label: "Camere" },
  { id: 5, label: "Servizi" },
  { id: 6, label: "Prezzi" },
  { id: 7, label: "Riepilogo" },
];

function ProgressBar({ step }) {
  const pct = (step - 1) / (steps.length - 1) * 100;
  return (
    <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-[#D54E30] transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
function Stepper({ step, setStep, completed }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-2">
        {steps.map((s, i) => {
          const isActive = s.id === step;
          const isDone = completed.has(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={`rounded-xl border px-2 py-2 text-sm font-semibold flex items-center justify-center gap-2
                ${isActive ? "border-[#D54E30] text-[#D54E30] bg-[#FAF5E0]"
                           : isDone ? "border-green-500/40 text-green-700 bg-green-50"
                                    : "border-neutral-200 text-neutral-700 bg-white hover:bg-neutral-50"}`}
              title={s.label}
            >
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{s.id}</span>
            </button>
          );
        })}
      </div>
      <ProgressBar step={step} />
    </div>
  );
}

function PreviewSidebar({ draft }) {
  const cover = draft.avatar || "https://images.unsplash.com/photo-1520974735194-6c1f1c1d0b35?q=80&w=1200&auto=format&fit=crop";
  return (
    <aside className="sticky top-4 space-y-4">
      <div className="rounded-2xl border overflow-hidden shadow-sm bg-white">
        <div className="h-36 w-full relative">
          <img src={cover} alt="" className="h-36 w-full object-cover" />
          <div className="absolute top-2 left-2 flex items-center gap-2 px-2 py-1 rounded-full bg-white/90 text-xs font-semibold">
            <Home size={14}/> {draft.categoriaStruttura || "Categoria"}
          </div>
        </div>
        <div className="p-4 space-y-2">
          <div className="text-lg font-extrabold text-[#6B271A]">{draft.nome || "Nome struttura"}</div>
          <div className="text-sm text-gray-700 flex items-center gap-2">
            <MapPin size={16}/>
            {draft.comune ? `${draft.comune}${draft.provincia ? " ("+draft.provincia+")" : ""}` : "Località"}
          </div>
          {draft.descrizioneBreve ? (
            <p className="text-sm text-gray-700">{draft.descrizioneBreve}</p>
          ) : (
            <p className="text-sm text-gray-500 italic">Anteprima descrizione breve…</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border p-4 bg-white">
        <div className="text-sm font-semibold text-[#6B271A] mb-2">Consigli rapidi</div>
        <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
          <li>Usa un <b>avatar</b> luminoso e orizzontale.</li>
          <li>Scrivi una <b>descrizione breve</b> concreta (≤160 caratteri).</li>
          <li>Aggiungi almeno <b>4 foto</b> di spazi diversi.</li>
        </ul>
      </div>
    </aside>
  );
}

/* =========================================================
   PAGINA: DORMIRE (WIZARD)
========================================================= */
export default function Dormire() {
  const { draft, setDraft, reset } = useDraft();
  const [step, setStep] = useState(1);

  // quali step consideriamo "completati" per lo stepper
  const completed = useMemo(() => {
    const done = new Set();
    if (draft.nome && draft.descrizioneBreve) done.add(1);
    if (draft.indirizzo && draft.comune && draft.provincia) done.add(2);
    if (draft.avatar) done.add(3);
    if (draft.camere.length) done.add(4);
    done.add(5); // opzionale
    done.add(6); // opzionale
    if (done.has(1) && done.has(2) && done.has(3)) done.add(7);
    return done;
  }, [draft]);

  // VALIDAZIONE MINIMA
  const errors = useMemo(() => {
    const e = {};
    if (step >= 1) {
      if (!draft.nome?.trim()) e.nome = "Inserisci il nome dell’attività";
      if (!draft.descrizioneBreve?.trim()) e.descrizioneBreve = "Inserisci una descrizione breve";
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
  const next = () => setStep((s) => Math.min(s + 1, maxStep));
  const prev = () => setStep((s) => Math.max(s - 1, 1));
  const skippable = step !== 1 && step !== 3;

  const submit = () => {
    console.log("SUBMIT PAYLOAD:", draft);
    alert("Richiesta inviata! Ti contatteremo per la verifica.");
    reset();
    setStep(1);
  };

  /* ============ UI ============ */
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* Top bar */}
      <nav className="flex items-center justify-between mb-4">
        <Link to="/registrazione-attivita" className="inline-flex items-center gap-2 text-[#6B271A] font-semibold">
          <ChevronLeft /> Indietro
        </Link>
        <div className="text-sm text-gray-600">Step <span className="font-semibold">{step}</span> / {maxStep}</div>
      </nav>

      {/* Stepper */}
      <Stepper step={step} setStep={setStep} completed={completed} />

      {/* Grid: Form + Preview */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_360px] gap-6">
        {/* ==== COLONNA SINISTRA: FORM ==== */}
        <div className="space-y-6">
          {/* STEP 1 — Dati principali */}
          {step === 1 && (
            <Section title="Dati principali">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Nome attività" error={errors.nome}>
                  <input className="w-full border rounded-xl px-3 py-2"
                         value={draft.nome}
                         onChange={(e)=>setDraft({...draft, nome:e.target.value})}
                         placeholder="Es. B&B La Terrazza sul Borgo" />
                </Field>
                <Field label="Categoria">
                  <select className="w-full border rounded-xl px-3 py-2"
                          value={draft.categoriaStruttura}
                          onChange={(e)=>setDraft({...draft, categoriaStruttura:e.target.value})}>
                    <option>B&B</option><option>Affittacamere</option><option>Agriturismo</option><option>Hotel</option><option>Casa Vacanze</option>
                  </select>
                </Field>
                <Field label="Check-in (orario)">
                  <input className="w-full border rounded-xl px-3 py-2"
                         value={draft.checkin}
                         onChange={(e)=>setDraft({...draft, checkin:e.target.value})}
                         placeholder="15:00" />
                </Field>
                <Field label="Check-out (orario)">
                  <input className="w-full border rounded-xl px-3 py-2"
                         value={draft.checkout}
                         onChange={(e)=>setDraft({...draft, checkout:e.target.value})}
                         placeholder="10:00" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Descrizione breve" hint="Massimo 160 caratteri" error={errors.descrizioneBreve}>
                    <input className="w-full border rounded-xl px-3 py-2"
                           value={draft.descrizioneBreve}
                           maxLength={160}
                           onChange={(e)=>setDraft({...draft, descrizioneBreve:e.target.value})}
                           placeholder="Camere luminose con vista sul centro storico." />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Descrizione completa">
                    <textarea className="w-full border rounded-xl px-3 py-2 min-h-[120px]"
                              value={draft.descrizione}
                              onChange={(e)=>setDraft({...draft, descrizione:e.target.value})}
                              placeholder="Racconta punti di forza, posizione, esperienze vicine..." />
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
                         placeholder="Via Roma, 12" />
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
                         placeholder="Es. Viggiano" />
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
                           placeholder="Es. 40.319" />
                  </Field>
                  <Field label="Longitudine">
                    <input className="w-full border rounded-xl px-3 py-2"
                           value={draft.coordinate.lng}
                           onChange={(e)=>setDraft({...draft, coordinate:{...draft.coordinate, lng:e.target.value}})}
                           placeholder="Es. 15.905" />
                  </Field>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border p-4 flex items-center gap-3 text-gray-600">
                <MapPin /> Anteprima mappa disponibile al salvataggio (integrazione provider mappe in step successivi).
              </div>
            </Section>
          )}

          {/* STEP 3 — Foto & Media */}
          {step === 3 && (
            <Section title="Foto & Media">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <Field label="Foto profilo (avatar)" error={errors.avatar}>
                    <Dropzone multiple={false} onFiles={async (files)=>{
                      if (!files[0]) return;
                      const b64 = await toBase64(files[0]);
                      setDraft({...draft, avatar:b64});
                    }} />
                    {draft.avatar ? (
                      <div className="mt-3">
                        <img src={draft.avatar} alt="avatar" className="w-40 h-40 object-cover rounded-xl border" />
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-2"><Camera size={14}/> Consigliato: 1200×800, JPG leggero</p>
                    )}
                  </Field>
                </div>
                <div>
                  <Field label="Galleria (drag & drop)">
                    <Dropzone onFiles={async (files)=>{
                      const arr = [];
                      for (const f of files) arr.push(await toBase64(f));
                      setDraft({...draft, gallery:[...draft.gallery, ...arr]});
                    }} />
                    {draft.gallery?.length ? (
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {draft.gallery.map((src, i)=>(
                          <div key={i} className="relative">
                            <img src={src} className="w-full h-20 object-cover rounded-lg border" />
                            <button
                              type="button"
                              className="absolute -top-2 -right-2 bg-white border rounded-full p-1 shadow"
                              onClick={()=>{
                                const g=[...draft.gallery]; g.splice(i,1);
                                setDraft({...draft, gallery:g});
                              }}
                              aria-label="rimuovi foto"
                            ><Trash2 size={14}/></button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-2"><Image size={14}/> Carica più foto per aumentare la fiducia.</p>
                    )}
                  </Field>
                </div>
              </div>
            </Section>
          )}

          {/* STEP 4 — Camere */}
          {step === 4 && (
            <Section
              title="Camere"
              right={
                <button type="button" onClick={()=>{
                  const id = crypto.randomUUID();
                  const nuova = { id, nome:`Camera ${draft.camere.length+1}`, letti:{matrimoniale:1,singolo:0}, bagni:1, mq:16, descrizione:"", foto:[] };
                  setDraft({...draft, camere:[...draft.camere, nuova]});
                }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-semibold">
                  <Plus size={16}/> Aggiungi camera
                </button>
              }
            >
              {!draft.camere.length ? (
                <div className="text-gray-700">Aggiungi le prime camere (nome, letti, bagni, mq, descrizione, foto).</div>
              ) : (
                <div className="space-y-4">
                  {draft.camere.map((c,idx)=>(
                    <div key={c.id} className="rounded-xl border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-[#6B271A]">{c.nome}</div>
                        <button className="text-[#D54E30] text-sm" onClick={()=>{
                          const cs = draft.camere.filter(x=>x.id!==c.id);
                          setDraft({...draft, camere:cs});
                        }}>Rimuovi</button>
                      </div>
                      <div className="grid sm:grid-cols-4 gap-3">
                        <Field label="Nome">
                          <input className="w-full border rounded-xl px-3 py-2" value={c.nome}
                            onChange={(e)=>{
                              const cs=[...draft.camere]; cs[idx]={...c, nome:e.target.value}; setDraft({...draft, camere:cs});
                            }} />
                        </Field>
                        <Field label="Matrimoniali">
                          <input type="number" min="0" className="w-full border rounded-xl px-3 py-2" value={c.letti.matrimoniale}
                            onChange={(e)=>{
                              const cs=[...draft.camere]; cs[idx]={...c, letti:{...c.letti, matrimoniale: Number(e.target.value)}}; setDraft({...draft, camere:cs});
                            }} />
                        </Field>
                        <Field label="Singoli">
                          <input type="number" min="0" className="w-full border rounded-xl px-3 py-2" value={c.letti.singolo}
                            onChange={(e)=>{
                              const cs=[...draft.camere]; cs[idx]={...c, letti:{...c.letti, singolo: Number(e.target.value)}}; setDraft({...draft, camere:cs});
                            }} />
                        </Field>
                        <Field label="Bagni">
                          <input type="number" min="0" className="w-full border rounded-xl px-3 py-2" value={c.bagni}
                            onChange={(e)=>{
                              const cs=[...draft.camere]; cs[idx]={...c, bagni:Number(e.target.value)}; setDraft({...draft, camere:cs});
                            }} />
                        </Field>
                        <Field label="Metri quadri">
                          <input type="number" min="0" className="w-full border rounded-xl px-3 py-2" value={c.mq}
                            onChange={(e)=>{
                              const cs=[...draft.camere]; cs[idx]={...c, mq:Number(e.target.value)}; setDraft({...draft, camere:cs});
                            }} />
                        </Field>
                        <div className="sm:col-span-3">
                          <Field label="Descrizione">
                            <input className="w-full border rounded-xl px-3 py-2" value={c.descrizione}
                              onChange={(e)=>{
                                const cs=[...draft.camere]; cs[idx]={...c, descrizione:e.target.value}; setDraft({...draft, camere:cs});
                              }} />
                          </Field>
                        </div>
                        <div className="sm:col-span-4">
                          <Field label="Foto camera">
                            <Dropzone onFiles={async (files)=>{
                              const arr=[];
                              for (const f of files){ arr.push(await toBase64(f)); }
                              const cs=[...draft.camere]; cs[idx]={...c, foto:[...(c.foto||[]), ...arr]}; setDraft({...draft, camere:cs});
                            }} />
                            {c.foto?.length ? (
                              <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                                {c.foto.map((src, i)=>(
                                  <div key={i} className="relative">
                                    <img src={src} className="w-28 h-20 object-cover rounded-lg border" />
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </Field>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* STEP 5 — Servizi & Policy */}
          {step === 5 && (
            <Section title="Servizi & Policy">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <div className="font-semibold text-[#6B271A] mb-2">Servizi</div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(draft.servizi).map(([k,v])=>(
                      <label key={k} className="flex items-center gap-2 border rounded-lg px-3 py-2">
                        <input type="checkbox" checked={v} onChange={(e)=>setDraft({...draft, servizi:{...draft.servizi, [k]:e.target.checked}})} />
                        <span className="capitalize">{k.replace(/([A-Z])/g,' $1')}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-[#6B271A] mb-2">Policy</div>
                  <div className="grid gap-3">
                    <Field label="Cancellazione">
                      <select className="w-full border rounded-xl px-3 py-2"
                        value={draft.policy.cancellazione}
                        onChange={(e)=>setDraft({...draft, policy:{...draft.policy, cancellazione:e.target.value}})}>
                        <option>Flessibile</option><option>Moderata</option><option>Rigida</option>
                      </select>
                    </Field>
                    <Field label="Fumo">
                      <select className="w-full border rounded-xl px-3 py-2"
                        value={draft.policy.fumo}
                        onChange={(e)=>setDraft({...draft, policy:{...draft.policy, fumo:e.target.value}})}>
                        <option>Vietato</option><option>Consentito nelle aree esterne</option>
                      </select>
                    </Field>
                    <Field label="Bambini">
                      <select className="w-full border rounded-xl px-3 py-2"
                        value={draft.policy.bambini}
                        onChange={(e)=>setDraft({...draft, policy:{...draft.policy, bambini:e.target.value}})}>
                        <option>Ammessi</option><option>Non ammessi</option>
                      </select>
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
                <Field label="Prezzo medio/notte (camera doppia)">
                  <div className="flex items-center gap-2">
                    <Euro className="text-gray-600" />
                    <input className="w-full border rounded-xl px-3 py-2"
                      value={draft.prezzi.prezzoNotte}
                      onChange={(e)=>setDraft({...draft, prezzi:{...draft.prezzi, prezzoNotte:e.target.value}})}
                      placeholder="Es. 85" />
                  </div>
                </Field>
                <Field label="Costo pulizie (una tantum)">
                  <div className="flex items-center gap-2">
                    <Euro className="text-gray-600" />
                    <input className="w-full border rounded-xl px-3 py-2"
                      value={draft.prezzi.prezzoPulizie}
                      onChange={(e)=>setDraft({...draft, prezzi:{...draft.prezzi, prezzoPulizie:e.target.value}})}
                      placeholder="Es. 25" />
                  </div>
                </Field>
                <Field label="Soggiorno minimo (notti)">
                  <input type="number" min="1" className="w-full border rounded-xl px-3 py-2"
                    value={draft.prezzi.minimoNotti}
                    onChange={(e)=>setDraft({...draft, prezzi:{...draft.prezzi, minimoNotti:Number(e.target.value)}})} />
                </Field>
                <Field label="Applichi tassa di soggiorno?">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={draft.prezzi.tassaSoggiorno}
                      onChange={(e)=>setDraft({...draft, prezzi:{...draft.prezzi, tassaSoggiorno:e.target.checked}})} />
                    <span>Sì</span>
                  </label>
                </Field>
              </div>
            </Section>
          )}

          {/* STEP 7 — Riepilogo */}
          {step === 7 && (
            <Section title="Riepilogo">
              <div className="space-y-4 text-sm">
                <div><span className="font-semibold">Nome:</span> {draft.nome || "—"}</div>
                <div><span className="font-semibold">Categoria:</span> {draft.categoriaStruttura}</div>
                <div><span className="font-semibold">Indirizzo:</span> {draft.indirizzo || "—"}, {draft.comune || "—"}{draft.provincia ? ` (${draft.provincia})` : ""}</div>
                <div><span className="font-semibold">Servizi:</span> {Object.entries(draft.servizi).filter(([k,v])=>v).map(([k])=>k).join(", ") || "—"}</div>
                <div><span className="font-semibold">Camere:</span> {draft.camere.length}</div>
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
                <button onClick={next} disabled={!canNext} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D54E30] text-white font-semibold disabled:opacity-50">
                  Avanti <ChevronRight />
                </button>
              ) : (
                <button onClick={submit} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D54E30] text-white font-semibold">
                  Invia richiesta
                </button>
              )}
            </div>
          </footer>
        </div>

        {/* ==== COLONNA DESTRA: PREVIEW ==== */}
        <div className="hidden md:block">
          <PreviewSidebar draft={draft} />
        </div>
      </div>
    </main>
  );
}
