// src/pages/creator/CreatorMe.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  getCurrentUser,
  getMyCreatorProfile,
  updateCreator,
  listVideosByCreator,
  createThread,
} from "../../lib/store";

function ytId(url) {
  const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/i);
  return m ? m[1] : null;
}

export default function CreatorMe() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const modeFromUrl = params.get("preview") ? "preview" : "edit";

  const user = getCurrentUser();
  const initial = getMyCreatorProfile();

  const [mode, setMode] = useState(modeFromUrl); // "edit" | "preview"
  const [form, setForm] = useState(() => ({
    id: initial?.id || "",
    name: initial?.name || "",
    region: initial?.region || "",
    bio: initial?.bio || "",
    avatar:
      initial?.avatar ||
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=800&auto=format&fit=crop",
    categories: initial?.categories || [], // array di tag
    links: initial?.links || { instagram: "", tiktok: "", youtube: "" },
  }));

  useEffect(() => {
    if (!user || !initial) {
      // non loggato come creator
      nav("/registrazione-creator", { replace: true });
    }
  }, []);

  const myVideos = useMemo(
    () => (initial ? listVideosByCreator(initial.id) : []),
    [initial]
  );

  function toggleTag(tag) {
    setForm((f) => {
      const has = f.categories.includes(tag);
      return {
        ...f,
        categories: has ? f.categories.filter((t) => t !== tag) : [...f.categories, tag],
      };
    });
  }

  function save() {
    const cleaned = {
      name: form.name.trim(),
      region: form.region.trim(),
      bio: form.bio.trim(),
      avatar: form.avatar.trim(),
      categories: form.categories,
      links: {
        instagram: form.links.instagram?.trim() || "",
        tiktok: form.links.tiktok?.trim() || "",
        youtube: form.links.youtube?.trim() || "",
      },
    };
    updateCreator(form.id, cleaned);
    setMode("preview");
  }

  function startChat() {
    const t = createThread({ creatorId: form.id, userId: user.id });
    nav(`/chat/${t.id}`);
  }

  if (!initial) return null;

  const ALL_TAGS = [
    "Food",
    "Outdoor",
    "Storia/Arte",
    "Family",
    "Eventi/Sagre",
    "Hotel/B&B",
    "Nightlife",
    "Drone",
    "Short-form",
    "Long-form",
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="text-sm">
        <Link to="/creator" className="underline">
          ← Torna all’elenco creator
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-extrabold text-[#6B271A]">Il mio profilo creator</h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            className={`px-3 py-1.5 rounded-lg border ${
              mode === "edit" ? "bg-[#FAF5E0] border-[#E1B671]" : "bg-white"
            }`}
            onClick={() => setMode("edit")}
          >
            Modifica profilo
          </button>
          <button
            className={`px-3 py-1.5 rounded-lg border ${
              mode === "preview" ? "bg-[#FAF5E0] border-[#E1B671]" : "bg-white"
            }`}
            onClick={() => setMode("preview")}
          >
            Anteprima pubblica
          </button>
        </div>
      </div>

      {/* CARD HEADER (anteprima) */}
      <section className="rounded-2xl border bg-white overflow-hidden shadow">
        <div className="flex flex-col md:flex-row gap-0">
          <div className="md:w-1/3 p-4">
            <img
              src={form.avatar}
              alt={form.name}
              className="w-full h-44 object-cover rounded-xl"
              onError={(e) => {
                e.currentTarget.src =
                  "https://dummyimage.com/600x400/ddd/555&text=Creator";
              }}
            />
          </div>
          <div className="flex-1 p-4 space-y-2">
            <div className="text-xl font-extrabold text-[#6B271A]">{form.name}</div>
            <div className="text-sm text-gray-600">{form.region || "—"}</div>
            <p className="text-sm">{form.bio || "Aggiungi una bio per presentarti."}</p>
            <div className="flex flex-wrap gap-2">
              {form.categories.map((t) => (
                <span
                  key={t}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-[#FAF5E0] text-[#6B271A] border border-[#E1B671]"
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                className="px-4 py-2 rounded-xl bg-[#D54E30] text-white font-semibold"
                onClick={startChat}
              >
                Contatta per un progetto
              </button>
              <Link
                to={`/creator/${form.id}`}
                className="px-4 py-2 rounded-xl border font-semibold"
                title="Vedi pagina pubblica"
              >
                Vai alla pagina pubblica
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MODIFICA PROFILO */}
      {mode === "edit" && (
        <section className="rounded-2xl border bg-white p-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <div className="text-sm font-semibold mb-1">Nome</div>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="block">
              <div className="text-sm font-semibold mb-1">Regione</div>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={form.region}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
              />
            </label>
            <label className="block md:col-span-2">
              <div className="text-sm font-semibold mb-1">Bio</div>
              <textarea
                className="w-full border rounded-lg px-3 py-2"
                rows={3}
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              />
            </label>
            <label className="block md:col-span-2">
              <div className="text-sm font-semibold mb-1">Avatar (URL)</div>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={form.avatar}
                onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))}
              />
            </label>
          </div>

          <div>
            <div className="text-sm font-semibold mb-1">Categorie (tag)</div>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={`text-[12px] px-2 py-1 rounded-full border ${
                    form.categories.includes(t)
                      ? "bg-[#FAF5E0] border-[#E1B671]"
                      : "bg-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <label className="block">
              <div className="text-sm font-semibold mb-1">Instagram</div>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={form.links.instagram}
                onChange={(e) =>
                  setForm((f) => ({ ...f, links: { ...f.links, instagram: e.target.value } }))
                }
              />
            </label>
            <label className="block">
              <div className="text-sm font-semibold mb-1">TikTok</div>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={form.links.tiktok}
                onChange={(e) =>
                  setForm((f) => ({ ...f, links: { ...f.links, tiktok: e.target.value } }))
                }
              />
            </label>
            <label className="block">
              <div className="text-sm font-semibold mb-1">YouTube</div>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={form.links.youtube}
                onChange={(e) =>
                  setForm((f) => ({ ...f, links: { ...f.links, youtube: e.target.value } }))
                }
              />
            </label>
          </div>

          <div className="pt-2">
            <button className="px-4 py-2 rounded-xl bg-[#D54E30] text-white font-semibold" onClick={save}>
              Salva modifiche
            </button>
          </div>
        </section>
      )}

      {/* PORTFOLIO VIDEO (mostrato sempre) */}
      <section>
        <h2 className="text-lg font-extrabold text-[#6B271A] mb-3">Portfolio video</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {myVideos.map((v) => (
            <article key={v.id} className="rounded-xl border bg-white overflow-hidden">
              <div className="aspect-video">
                {ytId(v.url) ? (
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${ytId(v.url)}`}
                    title={v.title}
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture;"
                    allowFullScreen
                  />
                ) : (
                  <a href={v.url} target="_blank" rel="noreferrer" className="block p-3 text-sm underline">
                    Guarda video
                  </a>
                )}
              </div>
              <div className="p-3 space-y-1">
                <div className="font-semibold text-[#6B271A]">{v.title}</div>
                {/* Nome creator + contatta (anche sul proprio profilo) */}
                <div className="pt-1 flex items-center justify-between">
                  <div className="text-sm text-gray-700">di {form.name}</div>
                  <button
                    onClick={startChat}
                    className="text-sm px-3 py-1.5 rounded-lg bg-[#D54E30] text-white font-semibold"
                  >
                    Contatta
                  </button>
                </div>
              </div>
            </article>
          ))}
          {myVideos.length === 0 && (
            <div className="text-sm text-gray-600">
              Nessun video caricato. <Link to={`/creator/${form.id}/upload-video`} className="underline">Carica ora</Link>.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
