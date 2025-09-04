// src/data/poi.js

// Tipi usati per mostrare le 8 voci fisse in HomeBorgo
export const POI_TYPES = {
  "cosa-fare": { label: "Cosa fare" },
  "mangiare-bere": { label: "Mangiare e Bere" },
  "eventi-sagre": { label: "Eventi e Sagre" },
  "artigiani": { label: "Artigiani" },
  "trasporti": { label: "Trasporti" },
  "esperienze-itinerari": { label: "Esperienze e Itinerari" },
  "dormire": { label: "Dormire" },
  "prodotti-tipici": { label: "Prodotti tipici" },
};

// POI minimi per demo (Viggiano)
export const POI_BY_BORGO = {
  viggiano: [
    { id: "monumento-portatori", name: "Monumento ai Portatori", type: "cosa-fare" },
    { id: "santuario-madonna-viggiano", name: "Santuario della Madonna di Viggiano", type: "cosa-fare" },
    { id: "ristorante-del-borgo", name: "Ristorante del Borgo", type: "mangiare-bere" },
    { id: "trattoria-la-piazzetta", name: "Trattoria La Piazzetta", type: "mangiare-bere" },
  ],
  // aggiungi altri borghi quando vuoi…
};

export function listPoi(slug) { return POI_BY_BORGO[slug] || []; }
export function getPoi(slug, poiId) { return (POI_BY_BORGO[slug] || []).find(p => p.id === poiId) || null; }
export function listPoiByType(slug, type) { return listPoi(slug).filter(p => p.type === type); }
