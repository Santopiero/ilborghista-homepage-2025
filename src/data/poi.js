// src/data/poi.js

// Tipi usati per mostrare le 8 voci fisse in HomeBorgo
export const POI_TYPES = {
  "cosa-fare": { label: "Cosa fare" },
  "mangiare-bere": { label: "Mangiare e Bere" },
  "eventi-sagre": { label: "Eventi e Sagre" },
  "artigiani": { label: "Artigiani" },
  "trasporti": { label: "Trasporti" },
  "esperienze-itinerari": { label: "Esperienze e Itinerari" },
  dormire: { label: "Dormire" },
  "prodotti-tipici": { label: "Prodotti tipici" },
};

// POI per demo (Viggiano) — arricchiti con i campi usati da lista/dettaglio.
// NB: manteniamo sia `name` che `title` per compatibilità retro.
export const POI_BY_BORGO = {
  viggiano: [
    {
      id: "monumento-portatori",
      type: "cosa-fare",
      name: "Monumento ai Portatori",
      title: "Monumento ai Portatori",
      category: "Santuari, Chiese e Monumenti",
      images: [
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?q=80&w=1600&auto=format&fit=crop",
      ],
      locationName: "Viggiano (PZ)",
      address: "Viale della Rinascita, 77, 85059 Viggiano PZ",
      lat: 40.3316,
      lng: 15.8717,
      duration: "30–45 min",
      priceFrom: null,
      rating: 4.8,
      tags: ["Family-friendly", "Accessibile"],
      description:
        "Maestoso **monumento in bronzo** a grandezza naturale (2016) dell’artista Felice Lovisco. Simbolo storico-artistico e culturale per la comunità locale e per i pellegrini della **Madonna Nera**.",
      curiosita: [
        "Collocato all’entrata del paese, è **dedicato ai Portatori**.",
        "I dodici portatori esprimono **fatica, gratitudine, gioia e fede**.",
        "Nelle processioni di maggio e settembre i fedeli trasportano la Madonna a spalla.",
      ],
      info: {
        periodo: "Tutto l’anno (clou: maggio e settembre)",
        parcheggio: "Parcheggi liberi nelle vicinanze",
        accessibilita: "Percorso agevole, sedute vicine",
        costo: "Gratuito",
      },
      video: { youtubeId: "dQw4w9WgXcQ" },
    },
    {
      id: "santuario-madonna-viggiano",
      type: "cosa-fare",
      name: "Santuario della Madonna di Viggiano",
      title: "Santuario della Madonna del Sacro Monte",
      category: "Santuari",
      images: [
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
      ],
      locationName: "Sacro Monte, Viggiano",
      address: "Santuario del Sacro Monte, Viggiano",
      lat: 40.3365,
      lng: 15.8801,
      duration: "1–2 h",
      priceFrom: null,
      rating: 4.9,
      tags: ["Panorami", "Spiritualità"],
      description:
        "Luogo simbolo della devozione lucana con panorami mozzafiato sull’Appennino.",
      curiosita: ["La festa settembrina è tra le più sentite in Basilicata."],
      info: {
        periodo: "Primavera–Autunno",
        parcheggio: "Area nei pressi del santuario",
        accessibilita: "Strada carrabile",
        costo: "Gratuito",
      },
      video: null,
    },
    {
      id: "parco-musica",
      type: "cosa-fare",
      name: "Parco Le Radici della Musica",
      title: "Parco Le Radici della Musica",
      category: "Parchi tematici",
      images: [
        "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1600&auto=format&fit=crop",
      ],
      locationName: "Viggiano",
      address: "Area Parco cittadina",
      lat: 40.333,
      lng: 15.875,
      duration: "45–90 min",
      priceFrom: "da 5 €",
      rating: 4.6,
      tags: ["Bambini", "Didattico"],
      description:
        "Percorso tematico dedicato alla tradizione musicale di Viggiano.",
      curiosita: ["Ideale per famiglie e scuole."],
      info: {
        periodo: "Tutto l’anno",
        parcheggio: "Parcheggio lungo strada",
        accessibilita: "Percorsi pedonali",
        costo: "Eventi a pagamento",
      },
      video: null,
    },

    // Esempi "Mangiare & Bere" (minimi ma compatibili)
    {
      id: "ristorante-del-borgo",
      type: "mangiare-bere",
      name: "Ristorante del Borgo",
      title: "Ristorante del Borgo",
      category: "Ristorante",
      images: [
        "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1600&auto=format&fit=crop",
      ],
      locationName: "Centro storico, Viggiano",
      address: "Piazza XX Settembre, Viggiano",
      lat: 40.332,
      lng: 15.872,
      duration: null,
      priceFrom: "€€",
      rating: 4.4,
      tags: ["Cucina locale"],
      description: "Piatti tipici lucani in un’atmosfera accogliente.",
      curiosita: [],
      info: { costo: "Alla carta" },
      video: null,
    },
    {
      id: "trattoria-la-piazzetta",
      type: "mangiare-bere",
      name: "Trattoria La Piazzetta",
      title: "Trattoria La Piazzetta",
      category: "Trattoria",
      images: [
        "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1600&auto=format&fit=crop",
      ],
      locationName: "Viggiano",
      address: "Via Roma 12, Viggiano",
      lat: 40.334,
      lng: 15.874,
      duration: null,
      priceFrom: "€",
      rating: 4.2,
      tags: ["Economico"],
      description: "Cucina casereccia e porzioni abbondanti.",
      curiosita: [],
      info: { costo: "Alla carta" },
      video: null,
    },
  ],
  // aggiungi altri borghi quando vuoi…
};

// ==== helper immutati per compatibilità con il resto dell’app ====
export function listPoi(slug) {
  return POI_BY_BORGO[slug] || [];
}
export function getPoi(slug, poiId) {
  return (POI_BY_BORGO[slug] || []).find((p) => p.id === poiId) || null;
}
export function listPoiByType(slug, type) {
  return listPoi(slug).filter((p) => p.type === type);
}
