import { Link, useParams, useLocation } from "react-router-dom";
import {
  ListChecks, UtensilsCrossed, CalendarDays, Hammer, Bus,
  Route, BedDouble, PackageOpen
} from "lucide-react";

const CATS = [
  { type: "cosa-fare", label: "Cosa fare", Icon: ListChecks, color: "bg-green-700" },
  { type: "mangiare-bere", label: "Mangiare e Bere", Icon: UtensilsCrossed, color: "bg-rose-600" },
  { type: "eventi-sagre", label: "Eventi e Sagre", Icon: CalendarDays, color: "bg-amber-500" },
  { type: "artigiani", label: "Artigiani", Icon: Hammer, color: "bg-amber-700" },
  { type: "trasporti", label: "Trasporti", Icon: Bus, color: "bg-blue-700" },
  { type: "esperienze-itinerari", label: "Esperienze e Itinerari", Icon: Route, color: "bg-green-500" },
  { type: "dormire", label: "Dormire", Icon: BedDouble, color: "bg-pink-500" },
  { type: "prodotti-tipici", label: "Prodotti tipici", Icon: PackageOpen, color: "bg-yellow-700" },
];

export default function PallotteBar({ activeType }) {
  const { slug } = useParams();
  const { pathname } = useLocation();

  return (
    <div className="sticky top-14 z-30 bg-white/90 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-3 py-2 flex gap-3 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATS.map(({ type, label, Icon, color }) => {
          const href =
            type === "cosa-fare" ? `/borghi/${slug}/cosa-fare`
            : type === "mangiare-bere" ? `/borghi/${slug}/mangiare-bere`
            : type === "eventi-sagre" ? `/borghi/${slug}/eventi`
            : type === "artigiani" ? `/borghi/${slug}/artigiani`
            : type === "trasporti" ? `/borghi/${slug}/trasporti`
            : type === "esperienze-itinerari" ? `/borghi/${slug}/esperienze`
            : type === "dormire" ? `/borghi/${slug}/dormire`
            : `/borghi/${slug}/prodotti-tipici`;

          // attivo se il type passato coincide o se l'URL contiene la rotta della categoria
          const urlActive =
            pathname.includes(`/borghi/${slug}/${type}`) ||
            pathname.includes(`/borghi/${slug}/poi`) && activeType === type;
          const active = urlActive || activeType === type;

          return (
            <Link
              key={type}
              to={href}
              aria-label={label}
              title={label}
              className="flex items-center gap-2 shrink-0"
            >
              <span
                className={[
                  "inline-flex items-center justify-center h-8 w-8 rounded-full text-white transition",
                  color,
                  active ? "ring-2 ring-amber-400 ring-offset-2 scale-105" : "opacity-90 hover:opacity-100",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
              </span>
              {/* testo visibile solo da sm in su */}
              <span className={`hidden sm:inline text-sm ${active ? "font-medium" : "text-gray-700"}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
