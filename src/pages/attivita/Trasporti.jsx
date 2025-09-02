// src/pages/attivita/Trasporti.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, MapPin, Upload, Trash2, Save, CheckCircle2,
  Image, Camera, Clock, Phone, Euro, Car, Bus, Bike
} from "lucide-react";

/* ======== BOZZA ======== */
const KEY = "draft-attivita-trasporti";
const defaultDraft = {
  tipo: "trasporti",
  nome: "",
  descrizioneBreve: "",
  descrizione: "",
  categoria: "Taxi / NCC",             // Taxi / NCC / Navetta / Noleggio bici / Noleggio auto / Barche
  servizi: [],                         // pillole: Transfer aeroporti, Tour, 24h, Bagagli, Seggiolino, Bike trailer...
  copertura: "Locale",                 // Locale / Provinciale / Regionale
  prenotazione: "Consigliata",         // Obbligatoria / Consigliata / Non necessaria
  contatti: { telefono: "", whatsapp: "", email: "" },

  // Localizzazione
  indirizzo: "", cap: "", comune: "", provincia: "", regione: "",

  // Orari
  orari: [{ dal:"08:00", al:"20:00" }],

  // Media
  avatar: null,
  gallery: [],

  // Tariffe
  tariffe: {
    base: "",     // es. 10
    km: "",       // es. 1.2
    extra: "",    // es. notturno 20%
  }
};

function useDraft(){
  const [draft,setDraft] = useState(()=> {
    const s=localStorage.getItem(KEY);
    return s? JSON.parse(s) : defaultDraft;
  });
  useEffect(()=> localStorage.setItem(KEY, JSON.stringify(draft)), [draft]);
  const reset=()=>{ localStorage.removeItem(KEY); setDraft(defaultDraft); };
  return { draft,setDraft,reset };
}

/* ======== UI helper ======== */
function Section({title, children, right}){ return (
  <section className="bg-white rounded-2xl border p-5 space-y-4">
    <div className="flex items-center justify-between"><h3 className="text-[#6B271A] font-extrabold">{title}</h3>{right}</div>
    {children}
  </section>
);}
function Field({label, children, hint, error}){ return (
  <label className="block">
    <div className="text-sm font-semibold text-[#6B271A] mb-1">{label}</div>
    {children}
    {hint ? <div className="text-xs text-gray-500 mt-1">{hint}</div> : null}
    {error ? <div className="text-xs text-[#D54E30] mt-1">{error}</div> : null}
  </label>
);}
function Dropzone({onFiles, accept, multiple=true}){
  const inputRef=useRef(null);
  const onDrop=(e)=>{ e.preventDefault(); onFiles(Array.from(e.dataTransfer.files||[])); };
  return (
    <div onDragOver={(e)=>e.preventDefault()} onDrop={onDrop}
         className="border-2 border-dashed rounded-xl p-6 text-center hover:bg-[#FAF5E0]/40">
      <div className="flex flex-col items-center gap-2">
        <Upload/><div className="font-semibold">Trascina qui i file</div>
        <div className="text-sm text-gray-600">oppure clicca per selezionarli</div>
        <input type="file" ref={inputRef} accept={accept} multiple={multiple} className="hidden"
               onChange={(e)=>onFiles(Array.from(e.target.files||[]))}/>
        <button type="button" className="mt-2 px-3 py-1.5 rounded-lg border font-semibold" onClick={()=>inputRef.current?.click()}>
          Scegli file
        </button>
      </div>
    </div>
  );
}
const toBase64=(f)=> new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(f); });

/* ======== Stepper ======== */
const steps=[{id:1,label:"Dati"},{id:2,label:"Localizzazione"},{id:3,label:"Orari"},{id:4,label:"Media"},{id:5,label:"Tariffe"},{id:6,label:"Riepilogo"}];
function Stepper({step,setStep,completed}){
  const pct=((step-1)/(steps.length-1))*100;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-6 gap-2">
        {steps.map(s=>{
          const active=s.id===step, done=completed.has(s.id);
          return (
            <button key={s.id} onClick={()=>setStep(s.id)} type="button"
              className={`rounded-xl border px-2 py-2 text-sm font-semibold
                ${active?"border-[#D54E30] text-[#D54E30] bg-[#FAF5E0]":done?"border-green-500/40 text-green-700 bg-green-50":"border-neutral-200 text-neutral-700 bg-white hover:bg-neutral-50"}`}>
              {s.label}
            </button>
          );
        })}
      </div>
      <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
        <div className="h-full bg-[#D54E30]" style={{width:`${pct}%`}}/>
      </div>
    </div>
  );
}

/* ======== Pagina ======== */
export default function Trasporti(){
  const { draft,setDraft,reset } = useDraft();
  const [step,setStep] = useState(1);

  const completed = useMemo(()=>{
    const d=new Set();
    if(draft.nome && draft.descrizioneBreve && draft.categoria) d.add(1);
    if(draft.indirizzo && draft.comune && draft.provincia) d.add(2);
    if(draft.orari?.some(o=>o.dal && o.al)) d.add(3);
    if(draft.avatar) d.add(4);
    if(draft.tariffe.base || draft.tariffe.km) d.add(5);
    if(d.has(1)&&d.has(2)) d.add(6);
    return d;
  },[draft]);
  const errors = useMemo(()=>{
    const e={};
    if(step>=1){
      if(!draft.nome?.trim()) e.nome="Inserisci il nome";
      if(!draft.descrizioneBreve?.trim()) e.descrizioneBreve="Inserisci una descrizione breve";
    }
    if(step>=2){
      if(!draft.indirizzo?.trim()) e.indirizzo="Indirizzo obbligatorio";
      if(!draft.comune?.trim()) e.comune="Comune obbligatorio";
      if(!draft.provincia?.trim()) e.provincia="Provincia obbligatoria";
    }
    if(step>=3){
      const ok=draft.orari?.some(o=>o.dal&&o.al);
      if(!ok) e.orari="Aggiungi almeno una fascia oraria";
    }
    if(step>=4){
      if(!draft.avatar) e.avatar="Foto veicolo o logo consigliata";
    }
    return e;
  },[draft,step]);

  const canNext = Object.keys(errors).length===0;
  const prev=()=>setStep(s=>Math.max(1,s-1));
  const next=()=>setStep(s=>Math.min(6,s+1));
  const skippable = step!==1 && step!==4;

  const submit=()=>{
    console.log("SUBMIT TRASPORTI:", draft);
    alert("Richiesta inviata! Ti contatteremo per la verifica.");
    reset(); setStep(1);
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <nav className="flex items-center justify-between mb-4">
        <Link to="/registrazione-attivita" className="inline-flex items-center gap-2 text-[#6B271A] font-semibold">
          <ChevronLeft/> Indietro
        </Link>
        <div className="text-sm text-gray-600">Step <span className="font-semibold">{step}</span> / 6</div>
      </nav>

      <h1 className="text-2xl font-extrabold text-[#6B271A]">Registra il tuo servizio Trasporti</h1>
      <p className="text-gray-700 mb-4">Taxi/NCC, navette, noleggio bici/auto e altri servizi di mobilità.</p>

      <Stepper step={step} setStep={setStep} completed={completed}/>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_360px] gap-6">
        {/* FORM */}
        <div className="space-y-6">
          {step===1 && (
            <Section title="Dati principali">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Nome attività" error={errors.nome}>
                  <input className="w-full border rounded-xl px-3 py-2" value={draft.nome}
                         onChange={(e)=>setDraft({...draft, nome:e.target.value})} placeholder="Es. NCC Borgo Transfer"/>
                </Field>
                <Field label="Categoria">
                  <select className="w-full border rounded-xl px-3 py-2" value={draft.categoria}
                          onChange={(e)=>setDraft({...draft, categoria:e.target.value})}>
                    {["Taxi / NCC","Navetta","Noleggio bici","Noleggio auto","Barche"].map(x=><option key={x}>{x}</option>)}
                  </select>
                </Field>

                <Field label="Servizi (pillole)">
                  <div className="flex gap-2 overflow-x-auto md:flex-wrap md:overflow-visible -mx-1 px-1 no-scrollbar snap-x snap-mandatory">
                    {["Transfer aeroporti","Tour panoramici","24h","Trasporto bagagli","Seggiolino bimbi","Bike trailer"].map(s=>{
                      const on = draft.servizi.includes(s);
                      return (
                        <button key={s} type="button" onClick={()=>{
                          const set=new Set(draft.servizi); on?set.delete(s):set.add(s);
                          setDraft({...draft, servizi:[...set]});
                        }}
                        className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full border text-sm font-semibold snap-start
                          ${on?"bg-[#D54E30] text-white border-[#6B271A]":"bg-[#FAF5E0] text-[#6B271A] border-[#E1B671]"}`}>
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field label="Copertura">
                  <select className="w-full border rounded-xl px-3 py-2" value={draft.copertura}
                          onChange={(e)=>setDraft({...draft, copertura:e.target.value})}>
                    {["Locale","Provinciale","Regionale"].map(x=><option key={x}>{x}</option>)}
                  </select>
                </Field>

                <Field label="Prenotazione">
                  <select className="w-full border rounded-xl px-3 py-2" value={draft.prenotazione}
                          onChange={(e)=>setDraft({...draft, prenotazione:e.target.value})}>
                    {["Obbligatoria","Consigliata","Non necessaria"].map(x=><option key={x}>{x}</option>)}
                  </select>
                </Field>

                <Field label="Contatti">
                  <div className="grid sm:grid-cols-3 gap-2">
                    <div className="flex items-center gap-2 border rounded-xl px-2">
                      <Phone size={16} className="text-zinc-600"/><input className="w-full py-2" placeholder="Telefono"
                        value={draft.contatti.telefono}
                        onChange={(e)=>setDraft({...draft, contatti:{...draft.contatti, telefono:e.target.value}})}/>
                    </div>
                    <input className="w-full border rounded-xl px-3 py-2" placeholder="WhatsApp"
                      value={draft.contatti.whatsapp}
                      onChange={(e)=>setDraft({...draft, contatti:{...draft.contatti, whatsapp:e.target.value}})}/>
                    <input className="w-full border rounded-xl px-3 py-2" placeholder="Email"
                      value={draft.contatti.email}
                      onChange={(e)=>setDraft({...draft, contatti:{...draft.contatti, email:e.target.value}})}/>
                  </div>
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Descrizione breve" hint="Max 160 caratteri" error={errors.descrizioneBreve}>
                    <input className="w-full border rounded-xl px-3 py-2" maxLength={160}
                           value={draft.descrizioneBreve}
                           onChange={(e)=>setDraft({...draft, descrizioneBreve:e.target.value})}
                           placeholder="Transfer e tour su prenotazione, copertura regionale."/>
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field label="Descrizione completa">
                    <textarea className="w-full border rounded-xl px-3 py-2 min-h-[120px]"
                              value={draft.descrizione}
                              onChange={(e)=>setDraft({...draft, descrizione:e.target.value})}
                              placeholder="Dettaglia flotta, comfort, servizi e condizioni."/>
                  </Field>
                </div>
              </div>
            </Section>
          )}

          {step===2 && (
            <Section title="Localizzazione">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Indirizzo">
                  <input className="w-full border rounded-xl px-3 py-2" value={draft.indirizzo}
                         onChange={(e)=>setDraft({...draft, indirizzo:e.target.value})} placeholder="Via, numero"/>
                </Field>
                <Field label="CAP">
                  <input className="w-full border rounded-xl px-3 py-2" value={draft.cap}
                         onChange={(e)=>setDraft({...draft, cap:e.target.value})} placeholder="00000"/>
                </Field>
                <Field label="Comune">
                  <input className="w-full border rounded-xl px-3 py-2" value={draft.comune}
                         onChange={(e)=>setDraft({...draft, comune:e.target.value})} placeholder="Es. Montemurro"/>
                </Field>
                <Field label="Provincia">
                  <input className="w-full border rounded-xl px-3 py-2" value={draft.provincia}
                         onChange={(e)=>setDraft({...draft, provincia:e.target.value})} placeholder="Es. PZ"/>
                </Field>
                <Field label="Regione">
                  <input className="w-full border rounded-xl px-3 py-2" value={draft.regione}
                         onChange={(e)=>setDraft({...draft, regione:e.target.value})} placeholder="Es. Basilicata"/>
                </Field>
              </div>
              <div className="mt-4 rounded-2xl border p-4 flex items-center gap-3 text-gray-600">
                <MapPin/> Integrazione mappa in step successivi.
              </div>
            </Section>
          )}

          {step===3 && (
            <Section title="Orari di operatività">
              <div className="space-y-3">
                {(draft.orari||[]).map((o,i)=>(
                  <div key={i} className="flex gap-2 items-center">
                    <Clock size={18} className="text-zinc-600"/>
                    <input className="w-32 border rounded-xl px-3 py-2" value={o.dal} placeholder="08:00"
                           onChange={(e)=>{ const arr=[...draft.orari]; arr[i]={...arr[i], dal:e.target.value}; setDraft({...draft, orari:arr}); }}/>
                    <span>–</span>
                    <input className="w-32 border rounded-xl px-3 py-2" value={o.al} placeholder="20:00"
                           onChange={(e)=>{ const arr=[...draft.orari]; arr[i]={...arr[i], al:e.target.value}; setDraft({...draft, orari:arr}); }}/>
                    <button className="ml-2 text-[#D54E30]" onClick={()=>{
                      const arr=[...draft.orari]; arr.splice(i,1); setDraft({...draft, orari:arr});
                    }}>Rimuovi</button>
                  </div>
                ))}
                <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-semibold"
                        onClick={()=>setDraft({...draft, orari:[...(draft.orari||[]), {dal:"",al:""}]})}>
                  Aggiungi fascia
                </button>
                {errors.orari ? <div className="text-xs text-[#D54E30]">{errors.orari}</div> : null}
              </div>
            </Section>
          )}

          {step===4 && (
            <Section title="Foto & Media">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <Field label="Foto profilo (veicolo / logo)" error={errors.avatar}>
                    <Dropzone multiple={false} accept="image/*" onFiles={async(files)=>{
                      if(!files[0]) return; const b64=await toBase64(files[0]); setDraft({...draft, avatar:b64});
                    }}/>
                    {draft.avatar ? (
                      <div className="mt-3"><img src={draft.avatar} className="w-40 h-40 object-cover rounded-xl border" alt="avatar"/></div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-2"><Camera size={14}/> Immagine nitida consigliata</p>
                    )}
                  </Field>
                </div>
                <div>
                  <Field label="Galleria (mezzi/servizi)">
                    <Dropzone accept="image/*" onFiles={async(files)=>{
                      const arr=[]; for(const f of files) arr.push(await toBase64(f));
                      setDraft({...draft, gallery:[...draft.gallery, ...arr]});
                    }}/>
                    {!!draft.gallery?.length && (
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {draft.gallery.map((src,i)=>(
                          <div key={i} className="relative">
                            <img src={src} className="w-full h-20 object-cover rounded-lg border" alt="" />
                            <button type="button" className="absolute -top-2 -right-2 bg-white border rounded-full p-1 shadow"
                                    onClick={()=>{ const g=[...draft.gallery]; g.splice(i,1); setDraft({...draft, gallery:g}); }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Field>
                </div>
              </div>
            </Section>
          )}

          {step===5 && (
            <Section title="Tariffe">
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="Base (partenza)">
                  <div className="flex items-center gap-2">
                    <Euro className="text-gray-600"/>
                    <input className="w-full border rounded-xl px-3 py-2" value={draft.tariffe.base}
                           onChange={(e)=>setDraft({...draft, tariffe:{...draft.tariffe, base:e.target.value}})} placeholder="Es. 10"/>
                  </div>
                </Field>
                <Field label="€/km">
                  <div className="flex items-center gap-2">
                    <Euro className="text-gray-600"/>
                    <input className="w-full border rounded-xl px-3 py-2" value={draft.tariffe.km}
                           onChange={(e)=>setDraft({...draft, tariffe:{...draft.tariffe, km:e.target.value}})} placeholder="Es. 1.2"/>
                  </div>
                </Field>
                <Field label="Extra (note)">
                  <input className="w-full border rounded-xl px-3 py-2" value={draft.tariffe.extra}
                         onChange={(e)=>setDraft({...draft, tariffe:{...draft.tariffe, extra:e.target.value}})} placeholder="Es. notturno +20%"/>
                </Field>
              </div>
            </Section>
          )}

          {step===6 && (
            <Section title="Riepilogo">
              <div className="space-y-3 text-sm">
                <div><span className="font-semibold">Nome:</span> {draft.nome || "—"}</div>
                <div><span className="font-semibold">Categoria:</span> {draft.categoria}</div>
                <div><span className="font-semibold">Copertura:</span> {draft.copertura}</div>
                <div><span className="font-semibold">Prenotazione:</span> {draft.prenotazione}</div>
                <div><span className="font-semibold">Contatti:</span> {draft.contatti.telefono || "—"} • {draft.contatti.email || "—"}</div>
                <div><span className="font-semibold">Tariffe:</span> base €{draft.tariffe.base || "—"} · {draft.tariffe.km ? `${draft.tariffe.km} €/km` : "—"} {draft.tariffe.extra?`· ${draft.tariffe.extra}`:""}</div>
                <div className="flex items-center gap-2 text-green-700"><CheckCircle2/> Pronto per l’invio</div>
              </div>
            </Section>
          )}

          {/* NAV */}
          <footer className="flex items-center justify-between">
            <button onClick={prev} disabled={step===1} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold disabled:opacity-40">
              <ChevronLeft/> Indietro
            </button>
            <div className="flex items-center gap-2">
              {skippable && step<6 && (
                <button type="button" onClick={next} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold">
                  Salta per ora
                </button>
              )}
              <button type="button" onClick={()=>alert("Bozza salvata in locale.")} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold">
                <Save size={16}/> Salva bozza
              </button>
              {step<6 ? (
                <button onClick={next} disabled={!canNext} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D54E30] text-white font-semibold disabled:opacity-50">
                  Avanti <ChevronRight/>
                </button>
              ) : (
                <button onClick={submit} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D54E30] text-white font-semibold">
                  Invia richiesta
                </button>
              )}
            </div>
          </footer>
        </div>

        {/* PREVIEW SEMPLICE */}
        <div className="hidden md:block">
          <aside className="sticky top-4 space-y-4">
            <div className="rounded-2xl border overflow-hidden shadow-sm bg-white">
              <div className="h-36 relative">
                <img src={draft.avatar || "https://images.unsplash.com/photo-1529429612778-cff757df97dd?q=80&w=1200&auto=format&fit=crop"} alt="" className="h-36 w-full object-cover"/>
                <div className="absolute top-2 left-2 inline-flex items-center gap-2 px-2 py-1 rounded-full bg-white/90 text-xs font-semibold">
                  {/* Scelta icona robusta (case-insensitive) */}
                  {(() => {
                    const cat = (draft.categoria || "").toLowerCase();
                    if (cat.includes("bici")) return <Bike size={14} />;
                    if (cat.includes("navetta")) return <Bus size={14} />;
                    if (cat.includes("auto")) return <Car size={14} />;
                    return <Car size={14} />;
                  })()}
                  {draft.categoria}
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="text-lg font-extrabold text-[#6B271A]">{draft.nome || "Nome servizio"}</div>
                <div className="text-sm text-gray-700 flex items-center gap-2">
                  <MapPin size={16}/>
                  {draft.comune ? `${draft.comune}${draft.provincia ? " ("+draft.provincia+")" : ""}` : "Località"}
                </div>
                <p className="text-sm text-gray-700 line-clamp-3">{draft.descrizioneBreve || "Anteprima descrizione breve…"}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
