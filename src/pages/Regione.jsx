import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { MapPin, Star, Camera } from "lucide-react";

/* ====================== CONFIGURAZIONE ====================== */
const API =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, "") ||
  "https://ilborghista-backend.onrender.com";

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
  lombardia: "Lombardia",
  sicilia: "Sicilia",
  sardegna: "Sardegna",
  marche: "Marche",
  umbria: "Umbria",
};

const REGION_COVER = {
  basilicata:
    "https://upload.wikimedia.org/wikipedia/commons/b/b5/Calanchi_di_Aliano_03.jpg",
  puglia:
    "https://upload.wikimedia.org/wikipedia/commons/d/d0/Polignano_a_Mare%2C_Puglia%2C_Italy.jpg",
  campania:
    "https://upload.wikimedia.org/wikipedia/commons/a/a8/Costiera_Amalfitana_-_panorama_da_Ravello.jpg",
  lazio:
    "https://upload.wikimedia.org/wikipedia/commons/2/23/Lago_di_Bolsena_veduta_dal_Belvedere_di_Montefiascone.jpg",
  abruzzo:
    "https://upload.wikimedia.org/wikipedia/commons/7/7e/Santo_Stefano_di_Sessanio_-_Abruzzo_-_Italy.jpg",
  calabria:
    "https://upload.wikimedia.org/wikipedia/commons/f/f2/Scilla_Calabria_Italy_2015.jpg",
  toscana:
    "https://upload.wikimedia.org/wikipedia/commons/9/9b/Tuscany_Landscape_Val_d%27Orcia_Siena_Italy.jpg",
  veneto:
    "https://upload.wikimedia.org/wikipedia/commons/1/14/Burano_-_Veneto_-_Italy.jpg",
  piemonte:
    "https://upload.wikimedia.org/wikipedia/commons/9/9f/Alba%2C_Langhe%2C_Piemonte%2C_Italy.jpg",
  lombardia:
    "https://upload.wikimedia.org/wikipedia/commons/6/64/Lago_di_Como_dal_Belvedere_di_Brunate.jpg",
  sicilia:
    "https://upload.wikimedia.org/wikipedia/commons/5/5b/Taormina%2C_Sicily.jpg",
  sardegna:
    "https://upload.wikimedia.org/wikipedia/commons/9/9b/Cala_Goloritz%C3%A9_-_Sardinia%2C_Italy.jpg",
  marche:
    "https://upload.wikimedia.org/wikipedia/commons/7/7c/Corinaldo_-_Marche%2C_Italy.jpg",
  umbria:
    "https://upload.wikimedia.org/wikipedia/commons/7/73/Spello_Umbria_Italy.jpg",
};

const REGION_SUBTITLE = {
  basilicata: "Borghi tra monti e calanchi",
  puglia: "Mare, trulli e tradizioni senza tempo",
  campania: "Terra di sapori e meraviglie",
  lazio: "Borghi tra storia e natura",
  abruzzo: "Dove la montagna incontra il mare",
  calabria: "Un cuore antico affacciato sul mare",
  toscana: "Arte, colline e borghi senza tempo",
  veneto: "Tra lagune, ville e montagne",
  piemonte: "Colline, vini e borghi eleganti",
  lombardia: "Laghetti alpini e città d’arte",
  sicilia: "Un’isola di luce e cultura millenaria",
  sardegna: "Mare cristallino e tradizioni autentiche",
  marche: "Dalle colline al mare, un’anima gentile",
  umbria: "Cuore verde d’Italia e terra di borghi mistici",
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
          {subtitle}
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
        <div className="absolute top-3 left-3 bg-white/90 px-3 py-1.5 rounded-lg shadow text-[#6B271A] font-semibold text-base">
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
  const subtitle = REGION_SUBTITLE[slug] || `Scopri i borghi più belli della ${label}`;

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
              b.attributes?.cover?.data?.attributes?.url ||
              b.attributes?.cover?.data?.attributes?.formats?.medium?.url ||
              b.attributes?.cover?.data?.attributes?.formats?.small?.url ||
              null;

            return {
              id: b.id,
              slug: b.attributes?.slug || "",
              nome: b.attributes?.nome || "Borgo senza nome",
              payoff: b.attributes?.payoff || "",
              regione: b.attributes?.regione || "",
              categoria: b.attributes?.categoria || "",
              feedback: b.attributes?.feedback || 0,
              galleryCount: b.attributes?.gallery?.data?.length || 0,
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
      <Hero image={cover} title={label} subtitle={subtitle} />

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
