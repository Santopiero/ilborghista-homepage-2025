// src/pages/RegistrazioneCreator.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCreator } from "../lib/store";

const CREATOR_CATEGORIES = [
  "Drone / Aerial",
  "Food & Ristorazione",
  "Hotel & Ospitalità",
  "Eventi live",
  "Storytelling / Vlog",
  "Documentarista",
  "Guida / Explainer",
  "Fotografo",
  "Short-form (Reels/TikTok)",
  "ASMR / Natural sound",
];

export default function RegistrazioneCreator() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", bio: "", region: "", categories: [], avatarUrl: "" });

  const toggleCat = (c) =>
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(c) ? f.categories.filter((x) => x !== c) : [...f.categories, c],
    }));

  function onSubmit(e) {
    e.preventDefault();
    const c = createCreator(form);
    nav(`/creator/${c.id}`);
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <h1 className="text-2xl font-extrabold text-[#6B271A]">Registrazione Creator</h1>
      <form onSubmit={onSubmit} className="bg-white border rounded-2xl p-4 space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Nome / Nome professionale</label>
          <input className="w-full border rounded-lg px-3 py-2" value={form.name} onChange={e=>setForm(f=>({ ...f, name: e.target.value }))} required />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Bio (max 300)</label>
          <textarea className="w-full border rounded-lg px-3 py-2" rows={3}
            value={form.bio} onChange={e=>setForm(f=>({ ...f, bio: e.target.value.slice(0,300) }))} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Regione</label>
            <input className="w-full border rounded-lg px-3 py-2" value={form.region} onChange={e=>setForm(f=>({ ...f, region: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Foto profilo (URL)</label>
            <input className="w-full border rounded-lg px-3 py-2" value={form.avatarUrl} onChange={e=>setForm(f=>({ ...f, avatarUrl: e.target.value }))} />
          </div>
        </div>

        <div>
          <div className="block text-sm font-semibold mb-1">Categorie (scegline anche più di una)</div>
          <div className="grid sm:grid-cols-2 gap-2">
            {CREATOR_CATEGORIES.map(c => (
              <label key={c} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.categories.includes(c)} onChange={()=>toggleCat(c)} />
                <span>{c}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button className="px-4 py-2 rounded-xl bg-[#D54E30] text-white font-semibold">Crea profilo</button>
        </div>
      </form>
    </main>
  );
}
