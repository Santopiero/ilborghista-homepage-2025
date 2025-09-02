import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, MapPin, Upload, Trash2, Save, CheckCircle2,
  Image, Camera, Clock, FileText, Video as VideoIcon, GripVertical, Plus, Hammer
} from "lucide-react";

/* ======== BOZZA (localStorage) ======== */
const KEY = "draft-attivita-artigiani";
const defaultDraft = {
  tipo: "artigiani",
  nome: "",
  descrizioneBreve: "",
  descrizione: "",
  categoria: "Ceramica",          // Ceramica / Tessile / Legno / Metalli / Vetro / Pelle / Carta / Altro
  tecniche: [],                   // es. Tornio, Incisione...
  materiali: [],                  // es. Argilla, Ulivo...
  prodottiIconici: "",
  suAppuntamento: true,

  // Localizzazione
  indirizzo: "", cap: "", comune: "", provincia: "", regione: "",
  coordinate: { lat: "", lng: "" },

  // Media
  avatar: null,
  gallery: [],
  videos: [],     // {name,type,size,url}
  mediaOrder: [],
  mediaTitles: {},

  // Servizi
  servizi: {
    visiteInBottega: true,
    workshop: false,
    personalizzazioni: true,
    spedizioni: true,
    pagamentiDigitali: true,
  },

  // Prezzi/Info
  prezzi: {
    fascia: "€€", // €,€€,€€€,€€€€
  },
};

function useDraft() {
  const [draft, setDraft] = useState(() => {
    const saved = localStorage.getItem(KEY);
    return saved ? JSON.parse(saved) : defaultDraft;
  });
  useEffect(() => {
    const toSave = JSON.stringify(draft, (k, v) => (k === "videos" ? [] : v));
    localStorage.setItem(KEY, toSave);
  }, [draft]);
  const reset = () => { localStorage.removeItem(KEY); setDraft(defaultDraft); };
  return { draft, setDraft, reset };
}

/* ======== UI helper ======== */
function Section({ title, children, right }) {
  return (
    <section className="bg-white rounded-2xl border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[#6B271A] font-extrabold">{title}</h3>{right}
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
  const onDrop = (e) => { e.preventDefault(); onFiles(Array.from(e.dataTransfer.files || [])); };
  return (
    <div onDragOver={(e) => e.preventDefault()} onDrop={onDrop}
         className="border-2 border-dashed rounded-xl p-6 text-center hover:bg-[#FAF5E0]/40">
      <div className="flex flex-col items-center gap-2">
        <Upload />
        <div className="font-semibold">Trascina qui i file</div>
        <div className="text-sm text-gray-600">oppure clicca per selezionarli</div>
        <input type="file" ref={inputRef} accept={accept} multiple={multiple} className="hidden"
               onChange={(e) => onFiles(Array.from(e.target.files || []))}/>
        <button type="button" className="mt-2 px-3 py-1.5 rounded-lg border font-semibold"
                onClick={() => inputRef.current?.click()}>
          Scegli file
        </button>
      </div>
    </div>
  );
}
const toBase64 = (file)=> new Promise((res, rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); });
const revokeURL = (u)=>{ try { URL.revokeObjectURL(u); } catch {} };

/* ======== Stepper + Preview ======== */
const steps = [
  { id: 1, label: "Dati" },
  { id: 2, label: "Localizzazione" },
  { id: 3, label: "Media" },
  { id: 4, label: "Servizi" },
  { id: 5, label: "Riepilogo" },
];
function Stepper({ step, setStep, completed }) {
  const pct = ((step - 1) / (steps.length - 1)) * 100;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-2">
        {steps.map(s=>{
          const isActive=s.id===step, isDone=completed.has(s.id);
          return (
            <button key={s.id} type="button" onClick={()=>setStep(s.id)}
              className={`rounded-xl border px-2 py-2 text-sm font-semibold
              ${isActive?"border-[#D54E30] text-[#D54E30] bg-[#FAF5E0]"
                :isDone?"border-green-500/40 text-green-700 bg-green-50"
                :"border-neutral-200 text-neutral-700 bg-white hover:bg-neutral-50"}`}>
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
function PreviewSidebar({ draft }) {
  const cover = draft.avatar || "https://images.unsplash.com/photo-1529612700005-e35377bf1415?q=80&w=1200&auto=format&fit=crop";
  return (
    <aside className="sticky top-4 space-y-4">
      <div className="rounded-2xl border overflow-hidden shadow-sm bg-white">
        <div className="h-36 relative">
          <img src={cover} alt="" className="h-36 w-full object-cover"/>
          <div className="absolute top-2 left-2 inline-flex items-center gap-2 px-2 py-1 rounded-full bg-white/90 text-xs font-semibold">
            <Hammer size={14}/> {draft.categoria || "Artigiano"}
          </div>
        </div>
        <div className="p-4 space-y-2">
          <div className="text-lg font-extrabold text-[#6B271A]">{draft.nome || "Nome bottega"}</div>
          <div className="text-sm text-gray-700 flex items-center gap-2">
            <MapPin size={16}/>
            {draft.comune ? `${draft.comune}${draft.provincia ? " ("+draft.provincia+")" : ""}` : "Località"}
          </div>
          <p className="text-sm text-gray-700 line-clamp-3">
            {draft.descrizioneBreve || "Anteprima descrizione breve…"}
          </p>
        </div>
      </div>
    </aside>
  );
}

/* ======== Media Manager (slot + titoli + drag&drop) ======== */
function buildMediaMap(draft){
  const map = {};
  if (draft.avatar) map["avatar"] = { type:"image", src:draft.avatar, title:draft.mediaTitles?.avatar || "Cover" };
  draft.gallery.forEach((src,i)=>{ const k=`g-${i}`; map[k]={type:"image",src,title:draft.mediaTitles?.[k]||""}; });
  (draft.videos||[]).forEach((v,i)=>{ const k=`v-${i}`; map[k]={type:"video",src:v.url,title:draft.mediaTitles?.[k]||(v.name||"")}; });
  return map;
}
function buildSlotsFromOrder(draft, slots){
  const map=buildMediaMap(draft), keys=Object.keys(map), seen=new Set(), out=[];
  for(const k of draft.mediaOrder||[]){ if(k===null){out.push(null);continue;} if(map[k]&&!seen.has(k)){out.push({key:k,...map[k]});seen.add(k);} else out.push(null); }
  for(const k of keys){ if(!seen.has(k)) out.push({key:k,...map[k]}); }
  while(out.length<slots) out.push(null);
  return out.slice(0,slots);
}
function MediaGrid({ draft, setDraft, slots=8 }){
  const [items,setItems]=useState(()=>buildSlotsFromOrder(draft,slots));
  const [slotCount,setSlotCount]=useState(slots);
  useEffect(()=>{ setItems(buildSlotsFromOrder(draft,slotCount)); },[draft.avatar,draft.gallery,draft.videos,draft.mediaOrder,slotCount]);

  const persist = (next)=> {
    const order = next.map(it=>it?.key ?? null);
    const titles = {...(draft.mediaTitles||{})};
    next.forEach(it=>{ if(it?.key) titles[it.key]=it.title||""; });
    setDraft({...draft, mediaOrder:order, mediaTitles:titles});
  };
  const onDragStart=(e,from)=>e.dataTransfer.setData("text/plain",String(from));
  const onDragOver=(e)=>e.preventDefault();
  const onDrop=(e,to)=>{ e.preventDefault(); const from=parseInt(e.dataTransfer.getData("text/plain"),10); if(Number.isNaN(from)||from===to) return;
    setItems(arr=>{ const next=[...arr]; const tmp=next[from]; next[from]=next[to]; next[to]=tmp; persist(next); return next; });
  };
  const updateTitle=(i,t)=>setItems(arr=>{ const n=[...arr]; if(n[i]) n[i]={...n[i],title:t}; persist(n); return n; });
  const clearSlot=(i)=>setItems(arr=>{ const n=[...arr]; n[i]=null; persist(n); return n; });
  const addSlot=()=>setSlotCount(c=>c+1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((it,idx)=>(
          <div key={idx} className="group relative rounded-2xl border bg-white overflow-hidden"
               draggable onDragStart={(e)=>onDragStart(e,idx)} onDragOver={onDragOver} onDrop={(e)=>onDrop(e,idx)}>
            <div className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 bg-white/90 px-2 py-0.5 rounded-full text-xs font-semibold">
              <GripVertical size={14} className="text-zinc-600"/> Slot {idx+1}
            </div>
            <div className="h-32 w-full bg-zinc-50 flex items-center justify-center">
              {it ? (it.type==="video"
                ? <video className="h-full w-full object-cover" controls playsInline><source src={it.src} type="video/mp4"/></video>
                : <img src={it.src} alt={it.title||`media_${idx+1}`} className="h-full w-full object-cover"/>)
                : <div className="text-zinc-500 text-sm">Vuoto</div>}
            </div>
            <div className="p-3 border-t space-y-2">
              <input value={it?.title||""} onChange={(e)=>updateTitle(idx,e.target.value)}
                     placeholder="Titolo (opzionale)" className="w-full border rounded-lg px-2 py-1 text-sm"/>
              <div className="flex items-center justify-between text-xs text-zinc-600">
                <span>Posizione: {idx+1}</span>
                {it ? <button className="inline-flex items-center gap-1 text-[#D54E30]" onClick={()=>clearSlot(idx)}>
                  <Trash2 size={14}/> Rimuovi
                </button> : <span className="text-zinc-400">—</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center">
        <button onClick={addSlot} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-semibold">
          <Plus size={16}/> Aggiungi slot
        </button>
      </div>
    </div>
  );
}

/* ======== Pagina ======== */
export default function Artigiani(){
  const { draft, setDraft, reset } = useDraft();
  const [step, setStep] = useState(1);

  useEffect(()=>()=>{ (draft.videos||[]).forEach(v=>v?.url && revokeURL(v.url)); },[]);

  const completed = useMemo(()=>{
    const d=new Set();
    if(draft.nome && draft.descrizioneBreve && draft.categoria) d.add(1);
    if(draft.indirizzo && draft.comune && draft.provincia) d.add(2);
    if(draft.avatar) d.add(3);
    d.add(4);
    if(d.has(1) && d.has(2)) d.add(5);
    return d;
  },[draft]);
  const errors = useMemo(()=>{
    const e={};
    if(step>=1){
      if(!draft.nome?.trim()) e.nome="Inserisci il nome della bottega";
      if(!draft.descrizioneBreve?.trim()) e.descrizioneBreve="Inserisci una descrizione breve";
      if(!draft.categoria?.trim()) e.categoria="Seleziona una categoria";
    }
    if(step>=2){
      if(!draft.indirizzo?.trim()) e.indirizzo="Indirizzo obbligatorio";
      if(!draft.comune?.trim()) e.comune="Comune obbligatorio";
      if(!draft.provincia?.trim()) e.provincia="Provincia obbligatoria";
    }
    if(step>=3){ if(!draft.avatar) e.avatar="Foto profilo/cover consigliata"; }
    return e;
  },[draft,step]);

  const canNext = Object.keys(errors).length===0;
  const next = ()=> setStep(s=> Math.min(s+1, 5));
  const prev = ()=> setStep(s=> Math.max(s-1, 1));
  const skippable = step!==1 && step!==3;

  const submit = ()=>{
    console.log("SUBMIT ARTIGIANI:", draft);
    alert("Richiesta inviata! Ti contatteremo per la verifica.");
    (draft.videos||[]).forEach(v=>v?.url && revokeURL(v.url));
    reset(); setStep(1);
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <nav className="flex items-center justify-between mb-4">
        <Link to="/registrazione-attivita" className="inline-flex items-center gap-2 text-[#6B271A] font-semibold">
          <ChevronLeft/> Indietro
        </Link>
        <div className="text-sm text-gray-600">Step <span className="font-semibold">{step}</span> / 5</div>
      </nav>

      <h1 className="text-2xl font-extrabold text-[#6B271A]">Registra la tua bottega</h1>
      <p className="text-gray-700 mb-4">Racconta materiali, tecniche e prodotti iconici.</p>

      <Stepper step={step} setStep={setStep} completed={completed}/>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_360px] gap-6">
        {/* FORM */}
        <div className="space-y-6">
          {step===1 && (
            <Section title="Dati principali">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Nome bottega" error={errors.nome}>
                  <input className="w-full border rounded-xl px-3 py-2" value={draft.nome}
                         onChange={(e)=>setDraft({...draft, nome:e.target.value})}
                         placeholder="Es. Bottega Ceramiche Rossi"/>
                </Field>
                <Field label="Categoria" error={errors.categoria}>
                  <select className="w-full border rounded-xl px-3 py-2" value={draft.categoria}
                          onChange={(e)=>setDraft({...draft, categoria:e.target.value})}>
                    {["Ceramica","Tessile","Legno","Metalli","Vetro","Pelle","Carta","Altro"].map(x=><option key={x}>{x}</option>)}
                  </select>
                </Field>

                <Field label="Tecniche (pillole)">
                  <div className="flex gap-2 overflow-x-auto md:flex-wrap md:overflow-visible -mx-1 px-1 no-scrollbar snap-x snap-mandatory">
                    {["Tornio","Incisione","Intaglio","Soffiatura","Cucitura","Intreccio"].map(t=>{
                      const on = draft.tecniche.includes(t);
                      return (
                        <button key={t} type="button" onClick={()=>{
                          const set=new Set(draft.tecniche); on?set.delete(t):set.add(t);
                          setDraft({...draft, tecniche:[...set]});
                        }}
                        className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full border text-sm font-semibold snap-start
                          ${on?"bg-[#D54E30] text-white border-[#6B271A]":"bg-[#FAF5E0] text-[#6B271A] border-[#E1B671]"}`}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field label="Materiali (pillole)">
                  <div className="flex gap-2 overflow-x-auto md:flex-wrap md:overflow-visible -mx-1 px-1 no-scrollbar snap-x snap-mandatory">
                    {["Argilla","Legno d’ulivo","Rame","Vetro","Lana","Pelle","Carta"].map(m=>{
                      const on = draft.materiali.includes(m);
                      return (
                        <button key={m} type="button" onClick={()=>{
                          const set=new Set(draft.materiali); on?set.delete(m):set.add(m);
                          setDraft({...draft, materiali:[...set]});
                        }}
                        className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full border text-sm font-semibold snap-start
                          ${on?"bg-[#D54E30] text-white border-[#6B271A]":"bg-[#FAF5E0] text-[#6B271A] border-[#E1B671]"}`}>
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field label="Prodotti iconici">
                  <input className="w-full border rounded-xl px-3 py-2" value={draft.prodottiIconici}
                         onChange={(e)=>setDraft({...draft, prodottiIconici:e.target.value})}
                         placeholder="Es. piatti smaltati, taglieri in ulivo…"/>
                </Field>

                <Field label="Disponibilità">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={draft.suAppuntamento}
                           onChange={(e)=>setDraft({...draft, suAppuntamento:e.target.checked})}/>
                    <span>Visita su appuntamento</span>
                  </label>
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Descrizione breve" hint="Max 160 caratteri" error={errors.descrizioneBreve}>
                    <input className="w-full border rounded-xl px-3 py-2" maxLength={160}
                           value={draft.descrizioneBreve}
                           onChange={(e)=>setDraft({...draft, descrizioneBreve:e.target.value})}
                           placeholder="Maestri ceramisti con forno a legna e smalti naturali."/>
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field label="Descrizione completa">
                    <textarea className="w-full border rounded-xl px-3 py-2 min-h-[120px]"
                              value={draft.descrizione}
                              onChange={(e)=>setDraft({...draft, descrizione:e.target.value})}
                              placeholder="Racconta storia, tecniche e percorso di visita…"/>
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
                <div className="sm:col-span-2 grid sm:grid-cols-2 gap-4">
                  <Field label="Latitudine">
                    <input className="w-full border rounded-xl px-3 py-2" value={draft.coordinate.lat}
                           onChange={(e)=>setDraft({...draft, coordinate:{...draft.coordinate, lat:e.target.value}})} placeholder="40.xxxx"/>
                  </Field>
                  <Field label="Longitudine">
                    <input className="w-full border rounded-xl px-3 py-2" value={draft.coordinate.lng}
                           onChange={(e)=>setDraft({...draft, coordinate:{...draft.coordinate, lng:e.target.value}})} placeholder="15.xxxx"/>
                  </Field>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border p-4 flex items-center gap-3 text-gray-600">
                <MapPin/> Anteprima mappa disponibile in un’integrazione successiva.
              </div>
            </Section>
          )}

          {step===3 && (
            <Section title="Foto & Media">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <Field label="Foto profilo (cover)" error={errors.avatar}>
                    <Dropzone multiple={false} accept="image/*" onFiles={async(files)=>{
                      if(!files[0]) return; const b64=await toBase64(files[0]);
                      setDraft({...draft, avatar:b64});
                    }}/>
                    {draft.avatar ? (
                      <div className="mt-3"><img src={draft.avatar} alt="avatar" className="w-40 h-40 object-cover rounded-xl border"/></div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-2"><Camera size={14}/> Consigliato: 1200×800, JPG leggero</p>
                    )}
                  </Field>
                </div>
                <div>
                  <Field label="Galleria (drag & drop)">
                    <Dropzone accept="image/*" onFiles={async(files)=>{
                      const arr=[]; for(const f of files) arr.push(await toBase64(f));
                      const newGallery=[...draft.gallery,...arr];
                      const start=draft.gallery.length;
                      const newKeys = arr.map((_,i)=>`g-${start+i}`);
                      const nextOrder=[...(draft.mediaOrder||[]), ...newKeys];
                      setDraft({...draft, gallery:newGallery, mediaOrder:nextOrder});
                    }}/>
                    {!draft.gallery?.length && <p className="text-xs text-gray-500 mt-2"><Image size={14} className="inline mr-1"/>Inserisci banco, laboratorio, prodotti.</p>}
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Video (MP4 / WebM)" hint="Clip brevi 10–30s">
                    <Dropzone accept="video/mp4,video/webm" onFiles={async(files)=>{
                      const vids=[]; for(const f of files){ vids.push({name:f.name,type:f.type,size:f.size,url:URL.createObjectURL(f)}); }
                      const start=(draft.videos||[]).length;
                      const keys=vids.map((_,i)=>`v-${start+i}`);
                      const nextOrder=[...(draft.mediaOrder||[]), ...keys];
                      setDraft({...draft, videos:[...(draft.videos||[]),...vids], mediaOrder:nextOrder});
                    }}/>
                    {!draft.videos?.length && <p className="text-xs text-gray-500 mt-2"><VideoIcon size={14} className="inline mr-1"/>Mostra lavorazione o showroom.</p>}
                  </Field>
                </div>
              </div>

              <div className="mt-6">
                <Field label="Ordina media e imposta titolo" hint="Trascina le card per riordinare">
                  <MediaGrid draft={draft} setDraft={setDraft} slots={8}/>
                </Field>
              </div>
            </Section>
          )}

          {step===4 && (
            <Section title="Servizi">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(draft.servizi).map(([k,v])=>(
                    <label key={k} className="flex items-center gap-2 border rounded-lg px-3 py-2">
                      <input type="checkbox" checked={v}
                             onChange={(e)=>setDraft({...draft, servizi:{...draft.servizi, [k]:e.target.checked}})}/>
                      <span className="capitalize">{k.replace(/([A-Z])/g,' $1')}</span>
                    </label>
                  ))}
                </div>
                <div className="grid gap-3">
                  <Field label="Fascia prezzo">
                    <select className="w-full border rounded-xl px-3 py-2" value={draft.prezzi.fascia}
                            onChange={(e)=>setDraft({...draft, prezzi:{...draft.prezzi, fascia:e.target.value}})}>
                      {["€","€€","€€€","€€€€"].map(x=><option key={x}>{x}</option>)}
                    </select>
                  </Field>
                </div>
              </div>
            </Section>
          )}

          {step===5 && (
            <Section title="Riepilogo">
              <div className="space-y-3 text-sm">
                <div><span className="font-semibold">Bottega:</span> {draft.nome || "—"}</div>
                <div><span className="font-semibold">Categoria:</span> {draft.categoria}</div>
                <div><span className="font-semibold">Tecniche:</span> {draft.tecniche.join(", ") || "—"}</div>
                <div><span className="font-semibold">Materiali:</span> {draft.materiali.join(", ") || "—"}</div>
                <div><span className="font-semibold">Fascia prezzo:</span> {draft.prezzi.fascia}</div>
                <div><span className="font-semibold">Indirizzo:</span> {draft.indirizzo || "—"}, {draft.comune || "—"}{draft.provincia ? ` (${draft.provincia})` : ""}</div>
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
              {skippable && step<5 && (
                <button type="button" onClick={next} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold">
                  Salta per ora
                </button>
              )}
              <button type="button" onClick={()=>alert("Bozza salvata in locale.")} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold">
                <Save size={16}/> Salva bozza
              </button>
              {step<5 ? (
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

        {/* PREVIEW */}
        <div className="hidden md:block">
          <PreviewSidebar draft={draft}/>
        </div>
      </div>
    </main>
  );
}
