import { useState, useRef } from "react";
import {
  MapPin, Clock, Heart, Search, ChevronRight, ChevronLeft,
  Star, User, Car, Gift, Utensils, Send
} from "lucide-react";

export default function HomepageMockup() {
  const HERO_IMAGE_URL = "https://images.unsplash.com/photo-1520974735194-6c1f1c1d0b35?q=80&w=1600&auto=format&fit=crop";
  const FALLBACK_IMG   = "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop";
  const handleImgError = (e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG; };

  const [expanded, setExpanded] = useState(false);
  const servicesRef = useRef(null);

  // === Component: riutilizzabile per caroselli con dots ===
  // --- Sostituisci questo blocco ---
const ImageCarousel = ({ images, className = "" }) => {
  const [active, setActive] = useState(0);
  const ref = useRef(null);

  const onScroll = (e) => {
    const w = e.currentTarget.clientWidth;
    const idx = Math.round(e.currentTarget.scrollLeft / w);
    setActive(idx);
  };

  const goTo = (i) => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    setActive(i);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        ref={ref}
        className="flex w-full h-full overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth"
        onScroll={onScroll}
      >
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            loading="lazy"
            className="min-w-full h-full object-cover flex-shrink-0 snap-center"
            onError={(e)=> (e.currentTarget.src = FALLBACK_IMG)}
          />
        ))}
      </div>

      {/* barra + dots cliccabili */}
      <div className="absolute inset-x-0 bottom-0 z-20">
        <div className="pointer-events-none bg-gradient-to-t from-black/40 to-transparent h-6 w-full" />
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`w-2.5 h-2.5 rounded-full ring-1 ring-black/10 ${
                i === active ? "bg-[#D54E30]" : "bg-white/80"
              }`}
              aria-label={`Vai all'immagine ${i + 1} di ${images.length}`}
              aria-current={i === active ? "true" : "false"}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
// --- fine blocco ---


  // === COMPONENTI UI ===
  const ServiceTile = ({ img, label, icon: Icon, count }) => (
    <a href="#" className="group relative w-40 h-24 sm:w-44 sm:h-28 rounded-2xl overflow-hidden shadow-lg ring-1 ring-[#E1B671]/60 hover:ring-[#D54E30] transition">
      <img loading="lazy" src={img} alt={label} className="absolute inset-0 w-full h-full object-cover duration-300 group-hover:scale-105" onError={handleImgError} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
      <div className="absolute top-2 left-2 flex items-center gap-2">
        {Icon ? <Icon size={18} className="text-white drop-shadow" /> : null}
        {typeof count !== "undefined" ? (
          <span className="text-[11px] font-semibold text-white bg-[#D54E30]/90 rounded-full px-2 py-0.5 shadow">{count}</span>
        ) : null}
      </div>
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white">
        <span className="font-extrabold drop-shadow">{label}</span>
        <span className="opacity-0 group-hover:opacity-100 text-[12px] bg-white/25 backdrop-blur px-2 py-0.5 rounded-full transition">Scopri →</span>
      </div>
    </a>
  );

  const BorgoTile = ({ img, name }) => (
    <a href="#" className="group snap-center">
      <div className="w-40 h-24 sm:w-48 sm:h-28 rounded-xl overflow-hidden shadow-md">
        <img loading="lazy" src={img} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition" onError={handleImgError} />
      </div>
      <div className="mt-2 text-sm font-semibold text-[#6B271A]">{name}</div>
    </a>
  );

  // ===== Card: Sagra (3 foto + dots) =====
  const CardSagra = () => (
    <article className="overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition bg-white">
      <div className="h-40 w-full relative">
        <ImageCarousel
          className="h-40 w-full"
          images={[
            "https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?q=80&w=1200&auto=format&fit=crop"
          ]}
        />
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-green-600 text-white border border-green-700 shadow-sm">In corso</span>
        <div className="absolute bottom-2 right-2 w-20 h-28 bg-white rounded-md shadow-md border border-neutral-200 overflow-hidden">
          <img src="https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=800&auto=format&fit=crop" alt="Locandina" className="w-full h-full object-contain" onError={handleImgError} />
        </div>
      </div>
      <div className="p-4 text-left space-y-2">
        <div className="flex flex-col items-start gap-1">
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-[#FAF5E0] text-[#D54E30] border border-[#E1B671]">Sagra</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF5E0] text-[#6B271A] border border-[#E1B671]">28 AGO – 5 SET 2025</span>
          <button className="mt-1 self-end rounded-full border border-gray-200 p-1 hover:bg-gray-50" aria-label="Aggiungi ai preferiti" data-event="favorite_click"><Heart size={18} className="text-[#D54E30]" /></button>
        </div>
        <h3 className="text-base font-extrabold text-[#6B271A] leading-snug">52ª Festa del Lard d’Arnad D.O.P. 2025</h3>
        <div className="flex items-center text-sm text-gray-600 gap-2"><MapPin size={16} className="text-[#D54E30]" /> Arnad (AO) | Valle d'Aosta</div>
        <div className="flex items-center text-sm text-gray-600 gap-2"><Clock size={16} className="text-[#6B271A]" /> Tutti i giorni dalle 17:00</div>
      </div>
    </article>
  );

  // ===== Card: Sagra ANNULLATA (3 foto + dots) =====
  const CardSagraAnnullata = () => (
    <article className="overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition bg-white">
      <div className="h-40 w-full relative">
        <ImageCarousel
          className="h-40 w-full"
          images={[
            "https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1501426026826-31c667bdf23d?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1514511547904-6f585f3f5d5b?q=80&w=1200&auto=format&fit=crop"
          ]}
        />
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-[#D54E30] text-white border border-[#6B271A] shadow-sm">Annullata</span>
        <div className="absolute bottom-2 right-2 w-20 h-28 bg-white rounded-md shadow-md border border-neutral-200 overflow-hidden">
          <img src="https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=800&auto=format&fit=crop" alt="Locandina" className="w-full h-full object-contain" style={{ filter: "saturate(0.85) grayscale(0.1) opacity(0.95)" }} onError={handleImgError} />
        </div>
      </div>
      <div className="p-4 text-left space-y-2">
        <div className="flex flex-col items-start gap-1">
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-[#FAF5E0] text-[#D54E30] border border-[#E1B671]">Sagra</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF5E0] text-[#6B271A] border border-[#E1B671]">28 AGO – 5 SET 2025</span>
          <button className="mt-1 self-end rounded-full border border-gray-200 p-1 hover:bg-gray-50" aria-label="Aggiungi ai preferiti" data-event="favorite_click"><Heart size={18} className="text-[#D54E30]" /></button>
        </div>
        <h3 className="text-base font-extrabold text-[#6B271A] leading-snug">52ª Festa del Lard d’Arnad D.O.P. 2025</h3>
        <div className="flex items-center text-sm text-gray-600 gap-2"><MapPin size={16} className="text-[#D54E30]" /> Arnad (AO) | Valle d'Aosta</div>
        <div className="flex items-center text-sm text-gray-600 gap-2"><Clock size={16} className="text-[#6B271A]" /> Evento annullato</div>
      </div>
    </article>
  );

  // ===== Card: Concerto (3 foto + dots) =====
  const CardConcerto = () => (
    <article className="overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition bg-white">
      <ImageCarousel
        className="h-40 w-full"
        images={[
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1200&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?q=80&w=1200&auto=format&fit=crop"
        ]}
      />
      <div className="p-4 text-left space-y-2">
        <div className="flex flex-col items-start gap-1">
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-[#FAF5E0] text-[#6B271A] border border-[#E1B671]">Concerto</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF5E0] text-[#6B271A] border border-[#E1B671]">28 AGO 2025</span>
          <button className="mt-1 self-end rounded-full border border-gray-200 p-1 hover:bg-gray-50" aria-label="Aggiungi ai preferiti" data-event="favorite_click"><Heart size={18} className="text-[#D54E30]" /></button>
        </div>
        <h3 className="text-base font-extrabold text-[#6B271A] leading-snug">Apulia Suona 2025</h3>
        <div className="flex items-center text-sm text-gray-600 gap-2"><MapPin size={16} className="text-[#D54E30]" /> Barletta (BT) | Puglia</div>
        <div className="flex items-center text-sm text-gray-600 gap-2"><Clock size={16} className="text-[#6B271A]" /> Ore 21:00</div>
      </div>
    </article>
  );

  // ===== Card: Fiera (3 foto + dots) =====
  const CardFiera = () => (
    <article className="overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition bg-white">
      <div className="h-40 w-full relative">
        <ImageCarousel
          className="h-40 w-full"
          images={[
            "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1520975922323-2155a3b6f2b6?q=80&w=1200&auto=format&fit=crop"
          ]}
        />
        <div className="absolute bottom-2 right-2 w-20 h-28 bg-white rounded-sm shadow-md border border-neutral-200 overflow-hidden rotate-1">
          <img src="https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop" alt="Poster" className="w-full h-full object-contain" onError={handleImgError} />
          <span className="absolute -top-2 left-3 w-10 h-3 bg-[#E1B671] rotate-[-6deg] rounded-[2px]" />
        </div>
      </div>
      <div className="p-4 text-left space-y-2">
        <div className="flex flex-col items-start gap-1">
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-[#FAF5E0] text-[#6B271A] border border-[#E1B671]">Fiera</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF5E0] text-[#6B271A] border border-[#E1B671]">29 AGO 2025</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">Date non confermate</span>
          <button className="mt-1 self-end rounded-full border border-gray-200 p-1 hover:bg-gray-50" aria-label="Aggiungi ai preferiti" data-event="favorite_click"><Heart size={18} className="text-[#D54E30]" /></button>
        </div>
        <h3 className="text-base font-extrabold text-[#6B271A] leading-snug">Edizione 2025 – Fiera di Santa Maria</h3>
        <div className="flex items-center text-sm text-gray-600 gap-2"><MapPin size={16} className="text-[#D54E30]" /> Calcinate (BG) | Lombardia</div>
        <div className="flex items-center text-sm text-gray-600 gap-2"><Clock size={16} className="text-[#6B271A]" /> Date non confermate</div>
      </div>
    </article>
  );

  // ===== ExperienceCard (usa ImageCarousel) =====
  const ExperienceCard = ({ images, title, location, region, meta, priceFrom }) => (
    <article className="overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition bg-white">
      <ImageCarousel className="h-40 w-full" images={images} />
      <div className="p-4 text-left space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-[#FAF5E0] text-[#6B271A] border border-[#E1B671]">Esperienza</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#D54E30] text-white border border-[#6B271A] whitespace-nowrap">da {priceFrom}</span>
        </div>
        <h3 className="text-base font-extrabold text-[#6B271A] leading-snug">{title}</h3>
        <div className="flex items-center text-sm text-gray-600 gap-2"><MapPin size={16} className="text-[#D54E30]" /> {location} | {region}</div>
        {meta ? <div className="flex items-center text-sm text-gray-600 gap-2"><Clock size={16} className="text-[#6B271A]" /> {meta}</div> : null}
      </div>
    </article>
  );

  const ProductCard = ({ img, title, origin, priceFrom }) => (
    <article className="overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition bg-white min-w-[280px] max-w-[280px]">
      <div className="h-40 w-full">
        <img loading="lazy" src={img} alt={title} className="h-40 w-full object-cover" onError={handleImgError} />
      </div>
      <div className="p-4 text-left space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-[#FAF5E0] text-[#6B271A] border border-[#E1B671]">Prodotto tipico</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#D54E30] text-white border border-[#6B271A] whitespace-nowrap">da {priceFrom}</span>
        </div>
        <h3 className="text-base font-extrabold text-[#6B271A] leading-snug">{title}</h3>
        <div className="flex items-center text-sm text-gray-600 gap-2"><MapPin size={16} className="text-[#D54E30]" /> {origin}</div>
      </div>
    </article>
  );

  const HeroHeader = () => (
    <section className="relative">
      <div className="absolute inset-0">
        <img src={HERO_IMAGE_URL} alt="Hero Il Borghista" className="w-full h-full object-cover" onError={handleImgError} />
        <div className="absolute inset-0 bg-black/30" />
      </div>
      <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 text-center text-white">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight drop-shadow-md">UFF Trova cosa fare vicino a te</h1>
        <p className="mt-3 text-base md:text-lg drop-shadow">Eventi, esperienze e borghi in tutta Italia. Cerca e parti.</p>
        <div className="mt-6 bg-white/95 backdrop-blur rounded-2xl p-3 md:p-4 inline-block w-full md:w-auto shadow-lg">
          <form className="flex flex-col gap-3 md:flex-row md:items-center" onSubmit={(e)=>e.preventDefault()} aria-label="Ricerca">
            <label className="flex items-center gap-2 border rounded-xl px-3 py-3 w-full md:w-96 bg-white" htmlFor="query">
              <Search size={18} className="text-[#6B271A]" />
              <input id="query" className="w-full outline-none" placeholder="Cerca eventi, esperienze o borghi" aria-label="Cosa cerchi" />
            </label>
            <button className="ml-0 md:ml-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D54E30] text-white font-semibold self-center md:self-auto" data-event="search_submit">
              <Search size={18}/> Cerca
            </button>
          </form>
          <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3 justify-center">
            <button className="px-3 py-1.5 rounded-full bg-[#D54E30] text-white text-sm font-semibold whitespace-nowrap" data-event="shortcut_weekend">Questo weekend</button>
            <button className="px-3 py-1.5 rounded-full bg-[#FAF5E0] text-[#6B271A] text-sm font-semibold border border-[#E1B671] whitespace-nowrap" data-event="shortcut_nearby">Vicino a me</button>
            <button className="px-3 py-1.5 rounded-full bg-[#FAF5E0] text-[#6B271A] text-sm font-semibold border border-[#E1B671] whitespace-nowrap" data-event="shortcut_family">Con bambini</button>
          </div>
          <div className="text-sm text-gray-700 mt-2">Sei un Comune? <a href="#" className="font-semibold underline text-[#6B271A]">Scopri i nostri servizi</a></div>
        </div>
      </div>
    </section>
  );

  return (
    <>
      <main className="space-y-12">
        {/* TOP NAV */}
        <header className="bg-white/90 backdrop-blur border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <a href="#" className="text-xl font-extrabold text-[#6B271A]">il borghista</a>
            <div className="flex items-center gap-3">
              <a href="#" className="inline-flex items-center gap-2 rounded-xl border border-[#E1B671] text-[#6B271A] px-3 py-2 font-semibold hover:bg-[#FAF5E0]" data-event="auth_click">
                <User size={18} /> Accedi / Registrati
              </a>
            </div>
          </div>
        </header>

        {/* HERO */}
        <HeroHeader />

        {/* SERVIZI RAPIDI */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-lg font-extrabold text-[#6B271A]">Servizi</h2>
          <div className="relative mt-3">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-white to-transparent rounded-l-2xl" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white to-transparent rounded-r-2xl" />
            <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pr-10" ref={servicesRef}>
              <ServiceTile img="https://images.unsplash.com/photo-1532635224-4786e6e86e18?q=80&w=900&auto=format&fit=crop" label="Esperienze" icon={Utensils} count={238} />
              <ServiceTile img="https://images.unsplash.com/photo-1615141982883-c7ad0f24f0ff?q=80&w=900&auto=format&fit=crop" label="Prodotti tipici" icon={Gift} count={120} />
              <ServiceTile img="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=900&auto=format&fit=crop" label="Noleggio auto" icon={Car} count={46} />
              <ServiceTile img="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=900&auto=format&fit=crop" label="Invia cartoline" icon={Send} count={80} />
            </div>
            {/* Arrow controls */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 hidden md:flex gap-2">
              <button onClick={()=>servicesRef.current?.scrollBy({left:-320, behavior:'smooth'})} className="rounded-full bg-white shadow-lg ring-1 ring-[#E1B671] w-9 h-9 flex items-center justify-center hover:bg-[#FAF5E0]" aria-label="precedente"><ChevronLeft size={18} className="text-[#6B271A]"/></button>
            </div>
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 hidden md:flex gap-2">
              <button onClick={()=>servicesRef.current?.scrollBy({left:320, behavior:'smooth'})} className="rounded-full bg-white shadow-lg ring-1 ring-[#E1B671] w-9 h-9 flex items-center justify-center hover:bg-[#FAF5E0]" aria-label="successivo"><ChevronRight size={18} className="text-[#6B271A]"/></button>
            </div>
          </div>
        </section>

        {/* BORGHIDASCOPRIRE */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-lg font-extrabold text-[#6B271A]">Borghi da scoprire…</h2>
          <div className="mt-3 flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory">
            <BorgoTile img="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1000&auto=format&fit=crop" name="Montemurro" />
            <BorgoTile img="https://images.unsplash.com/photo-1543340713-8a9d77e147bd?q=80&w=1000&auto=format&fit=crop" name="Staiti" />
            <BorgoTile img="https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?q=80&w=1000&auto=format&fit=crop" name="Corleto Perticara" />
            <BorgoTile img="https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=1000&auto=format&fit=crop" name="Viggiano" />
            <BorgoTile img="https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1000&auto=format&fit=crop" name="Civita" />
            <BorgoTile img="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1000&auto=format&fit=crop" name="Otranto" />
            <BorgoTile img="https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1000&auto=format&fit=crop" name="Erice" />
            <BorgoTile img="https://images.unsplash.com/photo-1467269204594-9661b134dd2b?q=80&w=1000&auto=format&fit=crop" name="Spello" />
          </div>
        </section>

        {/* PROSSIMI EVENTI & SAGRE */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#6B271A]">Prossimi eventi e sagre</h2>
            <a href="#" className="text-sm font-semibold underline flex items-center gap-1">Vedi tutti <ChevronRight size={16}/></a>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-[#FAF5E0] text-[#6B271A] font-semibold">Quando: Questo weekend ✕</span>
              <span className="px-2.5 py-1 rounded-full bg-[#FAF5E0] text-[#6B271A] font-semibold">Distanza: 50 km ✕</span>
            </div>
            <button className="text-sm font-semibold underline shrink-0" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} data-event="toggle_view">
              {expanded ? "Mostra meno" : "Guarda tutti"}
            </button>
          </div>

          {expanded ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <CardSagra />
              <CardConcerto />
              <CardFiera />
              <CardSagraAnnullata />
              <CardConcerto />
              <CardFiera />
              <CardSagra />
              <CardConcerto />
            </div>
          ) : (
            <div className="mt-4 flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">
              <div className="min-w-[280px] max-w-[280px] flex-shrink-0"><CardSagra /></div>
              <div className="min-w-[280px] max-w-[280px] flex-shrink-0"><CardSagraAnnullata /></div>
              <div className="min-w-[280px] max-w-[280px] flex-shrink-0"><CardFiera /></div>
              <div className="min-w-[280px] max-w-[280px] flex-shrink-0"><CardConcerto /></div>
            </div>
          )}
        </section>

        {/* ESPERIENZE CONSIGLIATE */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#6B271A]">Esperienze consigliate</h2>
            <a href="#" className="text-sm font-semibold underline flex items-center gap-1">Vedi tutte <ChevronRight size={16}/></a>
          </div>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">
            {[
              { images:["https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=1200&auto=format&fit=crop","https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop","https://images.unsplash.com/photo-1468596238068-7eee4927c4a2?q=80&w=1200&auto=format&fit=crop"], title:"Trekking al tramonto", location:"Arnad (AO)", region:"Valle d'Aosta", meta:"Durata 4h · Difficoltà media", priceFrom:"€25"},
              { images:["https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop","https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop","https://images.unsplash.com/photo-1493558103817-58b2924bce98?q=80&w=1200&auto=format&fit=crop"], title:"Giro in barca alle calette", location:"Otranto (LE)", region:"Puglia", meta:"Durata 2h · Attrezzatura inclusa", priceFrom:"€35"},
              { images:["https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop","https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop","https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?q=80&w=1200&auto=format&fit=crop"], title:"Cooking class lucana", location:"Matera (MT)", region:"Basilicata", meta:"Durata 3h · Piccoli gruppi", priceFrom:"€59"},
              { images:["https://images.unsplash.com/photo-1473625247510-8ceb1760943f?q=80&w=1200&auto=format&fit=crop","https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop","https://images.unsplash.com/photo-1520975922323-2155a3b6f2b6?q=80&w=1200&auto=format&fit=crop"], title:"E-bike tra i vigneti", location:"Neive (CN)", region:"Piemonte", meta:"Durata 2h", priceFrom:"€29"},
              { images:["https://images.unsplash.com/photo-1529429612778-cff757df97dd?q=80&w=1200&auto=format&fit=crop","https://images.unsplash.com/photo-1472396961693-142e6e269027?q=80&w=1200&auto=format&fit=crop","https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop"], title:"Passeggiata fotografica", location:"Erice (TP)", region:"Sicilia", meta:"Durata 3h", priceFrom:"€22"},
              { images:["https://images.unsplash.com/photo-1470770903676-69b98201ea1c?q=80&w=1200&auto=format&fit=crop","https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1200&auto=format&fit=crop","https://images.unsplash.com/photo-1473186505569-9c61870c11f9?q=80&w=1200&auto=format&fit=crop"], title:"Kayak al tramonto", location:"Santa Teresa (SS)", region:"Sardegna", meta:"Durata 2h", priceFrom:"€40"},
              { images:["https://images.unsplash.com/photo-1453747063559-36695c8771bd?q=80&w=1200&auto=format&fit=crop","https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?q=80&w=1200&auto=format&fit=crop","https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop"], title:"Tour guidato del borgo", location:"Spello (PG)", region:"Umbria", meta:"Durata 1.5h", priceFrom:"€12"},
              { images:["https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop","https://images.unsplash.com/photo-1520975922323-2155a3b6f2b6?q=80&w=1200&auto=format&fit=crop","https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop"], title:"Parapendio panoramico", location:"Monte Baldo (VR)", region:"Veneto", meta:"Durata 30' in volo", priceFrom:"€89"}
            ].map((e,i)=> (
              <div key={i} className="min-w-[280px] max-w-[280px] flex-shrink-0">
                <ExperienceCard {...e} />
              </div>
            ))}
          </div>
        </section>

        {/* PRODOTTI TIPICI */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#6B271A]">Prodotti tipici</h2>
            <a href="#" className="text-sm font-semibold underline flex items-center gap-1">Vedi tutti <ChevronRight size={16}/></a>
          </div>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">
            {[
              {img:"https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=1200&auto=format&fit=crop", title:"Formaggio di malga", origin:"Asiago (VI) | Veneto", priceFrom:"€7"},
              {img:"https://images.unsplash.com/photo-1505575972945-280b8f1e5d16?q=80&w=1200&auto=format&fit=crop", title:"Salumi tipici", origin:"Norcia (PG) | Umbria", priceFrom:"€9"},
              {img:"https://images.unsplash.com/photo-1514515411904-65fa19574d07?q=80&w=1200&auto=format&fit=crop", title:"Olio EVO del Garda", origin:"Garda (VR) | Veneto", priceFrom:"€6"},
              {img:"https://images.unsplash.com/photo-1543352634-8730a9c79dc5?q=80&w=1200&auto=format&fit=crop", title:"Vino Montepulciano", origin:"Montepulciano (SI) | Toscana", priceFrom:"€12"},
              {img:"https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?q=80&w=1200&auto=format&fit=crop", title:"Pasta artigianale", origin:"Gragnano (NA) | Campania", priceFrom:"€3"},
              {img:"https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=1200&auto=format&fit=crop", title:"Miele millefiori", origin:"Zafferana (CT) | Sicilia", priceFrom:"€5"},
              {img:"https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop", title:"Confetture del borgo", origin:"Civita (CS) | Calabria", priceFrom:"€4"},
              {img:"https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop", title:"Box degustazione", origin:"Italia", priceFrom:"€19"}
            ].map((p,i)=> (
              <ProductCard key={i} {...p} />
            ))}
          </div>
        </section>

        {/* TRUST / NEWSLETTER */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl bg-[#FAF5E0] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Star className="text-[#6B271A]" />
              <div>
                <div className="text-[#6B271A] font-extrabold">Non perdere i prossimi eventi</div>
                <div className="text-gray-700 text-sm">Iscriviti: inviamo solo segnalazioni utili</div>
              </div>
            </div>
            <form className="flex w-full md:w-auto gap-2" onSubmit={(e)=>e.preventDefault()}>
              <input className="flex-1 md:w-80 border rounded-xl px-3 py-2" placeholder="La tua email" aria-label="Email"/>
              <button className="px-4 py-2 rounded-xl bg-[#D54E30] text-white font-semibold" data-event="newsletter_subscribe">Iscrivimi</button>
            </form>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-8 border-t">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-sm text-gray-600 flex flex-col md:flex-row items-center justify-between gap-2">
            <div>© {new Date().getFullYear()} IlBorghista</div>
            <div className="flex gap-4">
              <a href="#" className="hover:underline">Privacy</a>
              <a href="#" className="hover:underline">Contatti</a>
              <a href="#" className="hover:underline">Lavora con noi</a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
