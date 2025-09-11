import { useNavigate } from "react-router-dom";

export default function SuggestItineraryBtn({ className = "" }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/itinerari/nuovo")}
      aria-label="Suggerisci un itinerario"
      className={`inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium shadow-sm border active:scale-[0.98] transition hover:opacity-90 ${className}`}
      style={{ backgroundColor: "#D54E30", color: "#fff", borderColor: "#E1B671" }}
    >
      <span className="mr-2 text-lg leading-none">＋</span>
      Suggerisci itinerario
    </button>
  );
}
