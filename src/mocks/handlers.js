// src/mocks/handlers.js
import { http, HttpResponse, delay } from "msw";
import { BORGI_BY_SLUG, BORGI_INDEX } from "../data/borghi";
import {
  findBorgoBySlug,
  listPoiByBorgo,
  getVideosByBorgo,
  getVideosByPoi,
} from "../lib/store";

/**
 * Piccolo helper di logging in dev
 */
const log = (...args) =>
  (import.meta.env.DEV) && console.log("%c[MSW]", "color:#0aa", ...args);

/**
 * Handlers:
 * - POST /api/newsletter/subscribe
 * - GET  /api/borghi
 * - GET  /api/borghi/:slug
 * - GET  /api/borghi/:slug/poi
 * - GET  /api/borghi/:slug/videos
 * - GET  /api/poi/:id/videos
 * - GET  /api/health
 */
export const handlers = [
  // Newsletter (il tuo frontend la chiama già)
  http.post("/api/newsletter/subscribe", async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    log("POST /api/newsletter/subscribe", body);
    // Simula piccola latenza
    await delay(400);
    // Risposta OK fittizia
    return HttpResponse.json(
      { status: "ok", message: "iscrizione registrata", echo: body },
      { status: 200 }
    );
  }),

  // Elenco borghi (per eventuali viste future)
  http.get("/api/borghi", () => {
    log("GET /api/borghi");
    return HttpResponse.json(BORGI_INDEX, { status: 200 });
  }),

  // Dettaglio borgo
  http.get("/api/borghi/:slug", ({ params }) => {
    const { slug } = params;
    log("GET /api/borghi/:slug", slug);
    const data = BORGI_BY_SLUG?.[slug] || findBorgoBySlug(slug);
    if (!data) return HttpResponse.json({ error: "Not found" }, { status: 404 });
    return HttpResponse.json(data, { status: 200 });
  }),

  // POI del borgo
  http.get("/api/borghi/:slug/poi", ({ params }) => {
    const { slug } = params;
    log("GET /api/borghi/:slug/poi", slug);
    const list = listPoiByBorgo(slug) || [];
    return HttpResponse.json(list, { status: 200 });
  }),

  // Video per borgo
  http.get("/api/borghi/:slug/videos", ({ params }) => {
    const { slug } = params;
    log("GET /api/borghi/:slug/videos", slug);
    const list = getVideosByBorgo(slug) || [];
    return HttpResponse.json(list, { status: 200 });
  }),

  // Video per POI
  http.get("/api/poi/:id/videos", ({ params }) => {
    const { id } = params;
    log("GET /api/poi/:id/videos", id);
    const list = getVideosByPoi(id) || [];
    return HttpResponse.json(list, { status: 200 });
  }),

  // Health check
  http.get("/api/health", () => {
    log("GET /api/health");
    return HttpResponse.json({ ok: true, env: "msw" }, { status: 200 });
  }),
];
