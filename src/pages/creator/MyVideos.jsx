// src/pages/creator/MyVideos.jsx
import { Link } from "react-router-dom";
import TopBar from "../../components/TopBar";
import { listMyVideos, deleteVideo, publishVideo } from "../../lib/creatorVideos";
import { getCurrentUser } from "../../lib/store";
import { Trash2, Edit3, PlayCircle, Eye, Globe2 } from "lucide-react";

const C = { gold: "#E1B671" };

export default function MyVideos() {
  const me = getCurrentUser();
  const mine = listMyVideos(me?.id || "guest");

  return (
    <div className="min-h-dvh bg-[#FFF9ED]">
      <TopBar variant="generic" />
      <main className="max-w-4xl mx-auto px-4 pt-16 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold">I miei video</h1>
          <Link to="/creator/studio" className="rounded-xl border px-3 py-2" style={{ borderColor: C.gold }}>
            Nuovo video
          </Link>
        </div>

        {!mine.length && <p className="text-sm text-neutral-600">Non hai ancora creato video.</p>}

        <ul className="grid gap-3">
          {mine.map(v => (
            <li key={v.id} className="rounded-xl border p-3" style={{ borderColor: C.gold, background: "#FFF3DD" }}>
              <div className="flex items-center gap-3">
                {v.thumbnailUrl ? (
                  <img src={v.thumbnailUrl} alt="" className="w-24 h-14 object-cover rounded-lg border" style={{ borderColor: C.gold }} />
                ) : (
                  <div className="w-24 h-14 grid place-items-center rounded-lg border text-xs text-neutral-500" style={{ borderColor: C.gold }}>
                    nessuna miniatura
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-medium">{v.title || "Senza titolo"}</div>
                  <div className="text-xs text-neutral-600">
                    {v.status} • {v.targetType === "poi" ? `POI ${v.targetPoiId}` : `Borgo ${v.targetSlug}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/creator/studio/${v.id}`} className="rounded-xl border px-3 py-1.5 text-sm" style={{ borderColor: C.gold }}>
                    <Edit3 className="inline w-4 h-4 -mt-0.5 mr-1" /> Modifica
                  </Link>
                  {v.status !== "published" && (
                    <button
                      className="rounded-xl border px-3 py-1.5 text-sm"
                      style={{ borderColor: C.gold }}
                      onClick={() => { publishVideo(v.id); window.location.reload(); }}
                    >
                      <Globe2 className="inline w-4 h-4 -mt-0.5 mr-1" /> Pubblica
                    </button>
                  )}
                  <button
                    className="rounded-xl border px-3 py-1.5 text-sm text-red-600"
                    style={{ borderColor: "#DC2626" }}
                    onClick={() => { if (confirm("Eliminare?")) { deleteVideo(v.id); window.location.reload(); } }}
                  >
                    <Trash2 className="inline w-4 h-4 -mt-0.5 mr-1" /> Elimina
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
