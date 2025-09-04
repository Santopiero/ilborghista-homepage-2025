// src/data/borghi.js
export const BORGI_INDEX = [
  { slug: "viggiano", name: "Viggiano (PZ)", region: "Basilicata", province: "Potenza",
    hero: "https://images.unsplash.com/photo-1520974735194-6c1f1c1d0b35?q=80&w=1600&auto=format&fit=crop" },
  { slug: "otranto", name: "Otranto (LE)", region: "Puglia", province: "Lecce",
    hero: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop" },
  { slug: "erice", name: "Erice (TP)", region: "Sicilia", province: "Trapani",
    hero: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop" },
  { slug: "spello", name: "Spello (PG)", region: "Umbria", province: "Perugia",
    hero: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?q=80&w=1600&auto=format&fit=crop" },
];

export const BORGI_BY_SLUG = Object.fromEntries(BORGI_INDEX.map(b => [b.slug, b]));
