import { Link, useParams, useLocation } from "react-router-dom";
import {
  Home, ListChecks, UtensilsCrossed, CalendarDays, Hammer,
  Bus, Route, BedDouble, PackageOpen
} from "lucide-react";

const CATS = [
  { key: "home", type: "home", label: "Home Borgo", Icon: Home, color: "bg-neutral-800" },
  { key: "cosa-fare", type: "cosa-fare", label: "Cosa fare", Icon: ListChecks, color: "bg-green-700" },
  { key: "mangiare-bere", type: "mangiare-bere", label: "Mangiare e Bere", Icon: UtensilsCrossed, color: "bg-rose-600" },
  { key: "eventi-sagre", type: "eventi-sagre", label: "Eventi e Sagre", Icon: CalendarDays, color: "bg-amber-500" },
  { key: "artigiani", type: "artigiani", label: "Artigiani", Icon: Hammer, color: "bg-amber-700" },
  { key: "trasporti", type: "trasporti", label: "Trasporti", Icon: Bus, color: "bg-blue-700" },
  { key: "esperienze-itinerari", type: "esperienze-itinerari", label: "Esperienze e Itinerari", Icon: Route, color: "bg-green-500" },
  { key: "dormire", type: "dormire", label: "Dormire", Icon: BedDouble, color: "bg-pink-500" },
  { key: "prodotti-tipici", type: "prodotti-tipici", label: "Prodotti tipici", Icon: PackageOpen, color: "bg-yellow-700" },
];

export default function PallotteBar({ activeType }) {
  const { slug } = useParams();
  const { pathname } = useLocation();

  const hrefFor = (type) => {
    if (type === "home") return `/borghi/${slug}`;
    if (type === "cosa-fare") return `/borghi/${slug}/cosa-fare`;
    if (type === "mangiare-bere") return `/borghi/${slug}/mangiare-bere`;
    if (type === "eventi-sagre") return `/borghi/${slug}/eventi`;
    if (type === "artigiani") return `/borghi/${slug}/artigiani`;
    if (type === "trasporti") return `/borghi/${slug}/trasporti`;
    if (type === "esperienze-itinerari") return `/borghi/${slug}/esperienze`;
    if (type === "dormire") return `/borghi/${slug}/dormire`;
    return `/borghi/${slug}/prodotti-tipici`;
  };

  return (
    <div className="sticky top-14 z-30 bg-white/90 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-3 py-2 flex gap-3 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATS.map(({ key, type, label, Icon, color }) => {
          const activeByUrl =
            (type === "home" && pathname === `/borghi/${slug}`) ||
            pathname.includes(`/borghi/${slug}/${type}`) ||
            (pathname.includes(`/borghi/${slug}/poi`) && activeType === type);
          const active = activeByUrl || activeType === type;

          return (
            <Link
              key={key}
              to={hrefFor(type)}
              aria-label={label}
              title={label}
              className="flex items-center gap-2 shrink-0"
            >
              <span
                className={[
                  "inline-flex items-center justify-center h-9 w-9 rounded-full text-white transition",
                  color,
                  active ? "ring-2 ring-amber-400 ring-offset-2 scale-105" : "opacity-90 hover:opacity-100",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
              </span>
              {/* etichetta visibile da sm in su */}
              <span className={`hidden sm:inline text-sm ${active ? "font-medium" : "text-gray-700"}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
