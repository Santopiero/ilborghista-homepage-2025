// src/pages/creator/Onboarding.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getCurrentUser,
  listCreators,
  addCreator,
  updateCreator,
} from "../../lib/store";

const ALL_CATEGORIES = [
  "Drone / Aerial",
  "Guida / Explainer",
  "Documentarista",
  "Fotografo",
  "ASMR / Natural sound",
  "Food & wine",
  "Esperienze outdoor",
];

export default function CreatorOnboarding() {
  const navigate = useNavigate();

  // 1) controllo login
  useEffect(() => {
    const u = getCurrentUser();
    if (!u) navigate("/registrazione-creator", { replace: true });
  }, [navigate]);

  const user = getCurrentUser();

  // 2) carico (o creo) il profilo creator di base
  const existingCreator = useMemo(() => {
    if (!user) return null;
    const all = listCreators();
    return all.find((c) => c.userId === user.id) || null;
  }, [user]);

  const [name, setName] = useState(existingCreator?.name || user?.email?.split("@")[0] || "");
  const [region, setRegion] = useState(existingCreator?.region || "");
  const [bio, setBio] = useState(existingCreator?.bio || "");
  const [avatar, setAvatar] = useState(
    existingCreator?.avatar ||
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=600&auto=format&fit=crop"
  );
  const [categories, setCategories] = useState(existingCreator?.categories || []);
  const [saving, setSaving] = useState(false);

  function toggleCat(cat) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      if (existingCreator) {
        updateCreator(existingCreator.id, {
          name: name.trim(),
          region: region.trim(),
          bio: bio.trim(),
          avatar: avatar.trim(),
          categories,
        });
      } else {
        addCreator({
          id: "cr_" + Date.now().toString(36),
          userId: user.id,
          name: name.trim(),
          region: region.trim(),
          bio: bio.trim(),
          avatar: avatar.trim(),
          categories,
          points: 0,
          createdAt: Date.now(),
        });
      }
      navigate("/creator/me", { replace: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-[#6B271A]">
        Benvenuto Creator — completa il profilo
      </h1>
      <p className="mt-2 text-gray-700">
        Un profilo curato aiuta le aziende e i borghi a capire cosa fai e a contattarti
        per collaborazioni. Puoi modificare tutto anche in seguito.
      </p>

      <form onSubmit={handleSave} className="mt-6 space-y-6">
        {/* Nome */}
        <div>
          <label className="block text-sm font-semibold text-[#6B271A]">Nome/Brand</label>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-[#E1B671]"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Es. ViaggiareBene"
            required
          />
        </div>

        {/* Regione */}
        <div>
          <label className="block text-sm font-semibold text-[#6B271A]">Regione</label>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-[#E1B671]"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="Es. Lazio"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-semibold text-[#6B271A]">Bio</label>
          <textarea
            className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-[#E1B671]"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Racconta in poche righe cosa fai e che tipo di contenuti realizzi…"
          />
        </div>

        {/* Avatar */}
        <div>
          <label className="block text-sm font-semibold text-[#6B271A]">
            Avatar (URL immagine)
          </label>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-[#E1B671]"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://…"
          />
          <div className="mt-2">
            <img
              src={avatar}
              alt="Anteprima avatar"
              className="h-24 w-24 rounded-full object-cover border"
              onError={(e) => (e.currentTarget.src = "https://dummyimage.com/96x96/eaeaea/888&text=Avatar")}
            />
          </div>
        </div>

        {/* Categorie */}
        <div>
          <div className="text-sm font-semibold text-[#6B271A] mb-2">Categorie</div>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map((cat) => (
              <label
                key={cat}
                className={`cursor-pointer px-3 py-1.5 rounded-full border ${
                  categories.includes(cat)
                    ? "bg-[#D54E30] text-white border-[#D54E30]"
                    : "bg-white text-[#6B271A] border-[#E1B671]"
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={categories.includes(cat)}
                  onChange={() => toggleCat(cat)}
                />
                {cat}
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className={`px-5 py-2 rounded-xl font-semibold ${
              saving || !name.trim()
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-[#D54E30] text-white"
            }`}
          >
            {saving ? "Salvataggio…" : "Salva e continua"}
          </button>

          <Link to="/" className="underline text-[#6B271A]">
            Torna alla Home
          </Link>
        </div>
      </form>
    </main>
  );
}
