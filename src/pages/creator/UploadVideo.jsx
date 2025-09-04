// src/pages/creator/UploadVideo.jsx
import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getCurrentUser, getCreator, createVideo } from "../../lib/store";

export default function UploadVideo() {
  const { creatorId } = useParams();
  const navigate = useNavigate();
  const me = getCurrentUser();

  // sicurezza: consenti solo al creator stesso
  const isSelf = me?.role === "creator" && (me?.id === creatorId);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [borgoSlug, setBorgoSlug] = useState("");

  if (!isSelf) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="rounded-xl border bg-white p-6">
          <div className="text-lg font-bold text-[#6B271A]">Accesso non consentito</div>
          <p className="mt-2 text-sm text-gray-600">
            Devi essere il creator proprietario per caricare video.
          </p>
          <Link to={`/creator/${creatorId}`} className="mt-4 inline-block underline">
            ← Torna al profilo
          </Link>
        </div>
      </main>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !url) return;
    createVideo({
      title,
      url,
      creatorId,
      borgoSlug: borgoSlug || null,
      entityType: null,
      entityId: null,
    });
    navigate(`/creator/${creatorId}`);
  };

  const c = getCreator(creatorId);

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Link to={`/creator/${creatorId}`} className="underline">← Torna a {c?.name || "creator"}</Link>
      </div>

      <h1 className="text-2xl font-extrabold text-[#6B271A] mb-4">Carica video</h1>

      <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-5 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[#6B271A]">Titolo</label>
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={title}
            onChange={(e)=>setTitle(e.target.value)}
            placeholder="Es. Monte di Viggiano"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#6B271A]">URL (YouTube consigliato)</label>
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={url}
            onChange={(e)=>setUrl(e.target.value)}
            placeholder="https://youtu.be/..."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#6B271A]">Borgo (slug, opzionale)</label>
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={borgoSlug}
            onChange={(e)=>setBorgoSlug(e.target.value)}
            placeholder="viggiano-pz"
          />
          <p className="text-xs text-gray-500 mt-1">
            Se lo compili, il video apparirà anche nella Home Borgo corrispondente.
          </p>
        </div>

        <div className="pt-2">
          <button className="px-4 py-2 bg-[#D54E30] text-white rounded-lg font-semibold">
            Salva video
          </button>
        </div>
      </form>
    </main>
  );
}
