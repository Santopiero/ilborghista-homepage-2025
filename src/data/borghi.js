// src/data/borghi.js

// Dizionario completo per singolo borgo (usato da HomeBorgo.jsx come "meta")
export const BORGI_BY_SLUG = {
  viggiano: {
    slug: "viggiano",

    // --- campi legacy (compatibilità col tuo codice attuale) ---
    name: "Viggiano",                 // nome "pulito" (senza parentesi)
    region: "Basilicata",
    province: "Potenza",

    // --- campi normalizzati usati dalla pagina ---
    displayName: "Viggiano (PZ)",     // se vuoi mostrare il nome con provincia
    regione: "Basilicata",
    provincia: "PZ",

    hero: "https://images.unsplash.com/photo-1520974735194-6c1f1c1d0b35?q=80&w=1600&auto=format&fit=crop",

    // HERO → galleria con nome foto + swipe/frecce/contatore
    gallery: [
      { src: "https://picsum.photos/id/1018/1600/900", name: "Veduta dal Belvedere" },
      { src: "https://picsum.photos/id/1025/1600/900", name: "Santuario" },
      { src: "https://picsum.photos/id/1036/1600/900", name: "Centro storico" },
    ],

    // Sezione “In breve” gestibile da backend
    shortInfo: {
      text: "Capitale dell’arpa: natura, tradizione e musica.",
      gallery: [
        { src: "https://picsum.photos/id/1043/800/500", name: "Panorama" },
        { src: "https://picsum.photos/id/1050/800/500", name: "Museo dell’Arpa" },
      ],
    },

    // opzionale: descrizione testuale (se vuoi sovrascrivere quella di default)
    // description: "Qui una descrizione più estesa del borgo…",
  },

  otranto: {
    slug: "otranto",
    name: "Otranto",
    region: "Puglia",
    province: "Lecce",

    displayName: "Otranto (LE)",
    regione: "Puglia",
    provincia: "LE",

    hero: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
    // gallery/shortInfo sono opzionali: la pagina gestisce i fallback
  },

  erice: {
    slug: "erice",
    name: "Erice",
    region: "Sicilia",
    province: "Trapani",

    displayName: "Erice (TP)",
    regione: "Sicilia",
    provincia: "TP",

    hero: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop",
  },

  spello: {
    slug: "spello",
    name: "Spello",
    region: "Umbria",
    province: "Perugia",

    displayName: "Spello (PG)",
    regione: "Umbria",
    provincia: "PG",

    hero: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?q=80&w=1600&auto=format&fit=crop",
  },
};

// Lista per “Borghi vicini” e altre viste indicizzate.
// Mantiene le CHIAVI che avevi (region/province e name con parentesi).
export const BORGI_INDEX = Object.values(BORGI_BY_SLUG).map((b) => ({
  slug: b.slug,
  name: b.displayName || `${b.name}${b.provincia ? ` (${b.provincia})` : ""}`,
  region: b.region || b.regione,
  province: b.province || b.provincia,
  hero: b.hero || (Array.isArray(b.gallery) && b.gallery[0]?.src) || "",
}));
