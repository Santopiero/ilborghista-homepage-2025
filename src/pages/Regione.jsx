import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { MapPin, Star, Camera, Heart } from "lucide-react";

/* ====================== CONFIGURAZIONE ====================== */
const API =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, "") ||
  "http://localhost:1337";

const REGION_LABELS = {
  basilicata: "Basilicata",
  puglia: "Puglia",
  campania: "Campania",
  lazio: "Lazio",
  abruzzo: "Abruzzo",
  calabria: "Calabria",
  toscana: "Toscana",
  veneto: "Veneto",
  piemonte: "Piemonte",
};

const REGION_COVER = {
  basilicata:
    "https://upload.wikimedia.org/wikipedia/commons/b/b5/Calanchi_di_Aliano_03.jpg",
  puglia:
    "https://upload.wikimedia.org/wikipedia/commons/d/d0/Polignano_a_Mare%2C_Puglia%2C_Italy.jpg",
};

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop";

const onImgErr = (e) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = FALLBACK_IMG;
};

/* ====================== COMPONENTI ====================== */
function Hero({ image, title, subtitle }) {
  return (
    <section className="relative h-[38vh] md:h-[48vh]">
      <img
        src={image || FALLBACK_IMG}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover"
        onError={onImgErr}
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative max-w-6xl mx-auto h-full px-4 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white drop-shadow">
          {title}
        </h1>
        <p className="mt-2 text-white/95 text-base sm:text-lg drop-shadow">
          {subtitle || `Scopri i borghi più belli della ${title}`}
        </p>
      </div>
    </section>
  );
}

function BorgoCard({ b }) {
  return (
    <Link
      to={`/borghi/${b.slug || b.id}`}
      className="group overflow-hidden rounded-2xl bg-white shadow hover:shadow-2xl transition block"
    >
      <div className="relative aspect-[16/9]">
        <img
          src={b.coverUrl || FALLBACK_IMG}
          alt={b.nome}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.05] duration-300"
          onError={onImgErr}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        <div className="absolute bottom-3 left-3 bg-white/90 px-3 py-1.5 rounded-lg shadow text-[#6B271A] font-semibold text-base">
          {b.nome}
        </div>
      </div>

      <div className="p-3 space-y-1">
        {b.payoff && (
          <p className="text-[#6B271A] font-medium text-sm italic">{b.payoff}</p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-1 text-[#D54E30]">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(b.feedback || 0)
                    ? "fill-[#D54E30]"
                    : "opacity-30"
                }`}
              />
            ))}
          </div>
          {b.galleryCount > 0 && (
            <div className="flex items-center gap-1">
              <Camera className="w-4 h-4 text-[#6B271A]" />
              <span>{b.galleryCount}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
          <MapPin className="w-4 h-4 text-[#D54E30]" />
          <span>{b.regione}</span>
        </div>
      </div>
    </Link>
  );
}

/* ====================== PAGINA REGIONE ====================== */
export default function Regione() {
  const { slug } = useParams();
  const label = REGION_LABELS[slug] || slug;
  const cover = REGION_COVER[slug] || FALLBACK_IMG;

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        const qs = new URLSearchParams({
          "filters[regione][$eqi]": label,
          "pagination[pageSize]": "100",
        }).toString();

        const apiUrl = `${API}/api/borgos?${qs}&populate[cover]=true&populate[gallery]=true`;
        console.log("➡️ Fetching:", apiUrl);

        const res = await axios.get(apiUrl);
        console.log("✅ Dati ricevuti:", res.data);

        const items =
          res.data?.data?.map((b) => {
            const coverUrl =
              b.cover?.formats?.medium?.url ||
              b.cover?.url ||
              b.cover?.formats?.small?.url ||
              null;

            return {
              id: b.id,
              slug: b.slug || "",
              nome: b.nome || "Borgo senza nome",
              payoff: b.payoff || "",
              regione: b.regione || "",
              categoria: b.categoria || "",
              feedback: b.feedback || 0,
              preferito: false,
              galleryCount: b.gallery?.length || 0,
              coverUrl: coverUrl ? `${API}${coverUrl}` : null,
            };
          }) || [];

        setList(items);
      } catch (e) {
        console.error("❌ Errore nel caricamento:", e.response?.data || e);
        setError("Errore nel caricamento dei borghi");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, label]);

  const filtered = useMemo(() => list, [list]);

  return (
    <main className="pb-12">
      <Hero image={cover} title={label} subtitle="Borghi tra monti e calanchi" />

      <section className="max-w-6xl mx-auto px-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-[#6B271A]">
            Borghi in {label}
          </h2>
          <span className="text-sm text-gray-600">
            {loading ? "Caricamento…" : `${filtered.length} risultati`}
          </span>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm">
            Nessun borgo trovato per questa regione.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((b) => (
            <BorgoCard key={b.id} b={b} />
          ))}
        </div>
      </section>
    </main>
  );
}
