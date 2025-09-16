// src/App.jsx
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ModalInstallApp from "./components/ModalInstallApp";

/* ======================= Error boundary ======================= */
class RouteErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("Route error:", error, info); }
  render() {
    if (this.state.error) {
      return (
        <main style={{ padding: 16 }}>
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: 12, borderRadius: 8 }}>
            <b>Errore di pagina:</b> {String(this.state.error?.message || this.state.error)}
            <div style={{ fontSize: 12, marginTop: 8 }}>
              Controlla la rotta che hai aperto: probabilmente un import non valido o un file con sintassi errata.
            </div>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

function Fallback() { return <div style={{ padding: 16 }}>Caricamento…</div>; }

/* ======================= Lazy imports ======================= */
const HomepageMockup = lazy(() => import("./HomepageMockup"));
const Registrazione = lazy(() => import("./pages/Registrazione"));
const RegistrazioneBorgo = lazy(() => import("./pages/RegistrazioneBorgo"));
const RegistrazioneAttivita = lazy(() => import("./pages/RegistrazioneAttivita"));
// ⛔ rimosso RegistrazioneUtente
const Dormire = lazy(() => import("./pages/attivita/Dormire"));
const Mangiare = lazy(() => import("./pages/attivita/Mangiare"));
const Artigiani = lazy(() => import("./pages/attivita/Artigiani"));
const Trasporti = lazy(() => import("./pages/attivita/Trasporti"));
const CreatorIndex = lazy(() => import("./pages/creator/CreatorIndex"));
const CreatorProfile = lazy(() => import("./pages/creator/CreatorProfile"));
const CreatorAuth = lazy(() => import("./pages/creator/Auth"));
const CreatorOnboarding = lazy(() => import("./pages/creator/Onboarding"));
const Thread = lazy(() => import("./pages/chat/Thread"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const POIDetail = lazy(() => import("./pages/POIDetail"));
const HomeBorgo = lazy(() => import("./pages/HomeBorgo"));
const Regione = lazy(() => import("./pages/Regione.jsx"));
const Esperienze = lazy(() => import("./pages/Esperienze"));
const ItinerariConsigliati = lazy(() => import("./pages/ItinerariConsigliati"));
const ItineraryWizard = lazy(() => import("./pages/ItineraryWizard"));

/* ✅ Layout con Topbar DRY */
const AppLayout = lazy(() => import("./layouts/AppLayout.jsx"));

function SectionPlaceholder({ title, note }) {
  return (
    <main style={{ padding: "24px" }}>
      <h1 style={{ margin: 0, color: "#6B271A" }}>{title}</h1>
      <p style={{ marginTop: 8, color: "#374151" }}>
        {note || "Sezione in preparazione. Questa rotta è attiva per i test di navigazione."}
      </p>
      <div style={{ marginTop: 16 }}>
        <a href="/" style={{ color: "#6B271A", textDecoration: "underline" }}>
          ← Torna alla Home
        </a>
      </div>
    </main>
  );
}

/* ======================= Router ======================= */
export default function App() {
  return (
    <RouteErrorBoundary>
      <ModalInstallApp />

      <Suspense fallback={<Fallback />}>
        <Routes>
          {/* Home (ha già la sua topbar interna) */}
          <Route path="/" element={<RouteErrorBoundary><HomepageMockup /></RouteErrorBoundary>} />

          {/* Registrazioni principali (UI "pulita", fuori layout) */}
          <Route path="/registrazione" element={<RouteErrorBoundary><Registrazione /></RouteErrorBoundary>} />
          <Route path="/registrati" element={<RouteErrorBoundary><Registrazione /></RouteErrorBoundary>} />
          <Route path="/registrazione-comune" element={<RouteErrorBoundary><Registrazione /></RouteErrorBoundary>} />

          <Route path="/registrazione-borgo" element={<RouteErrorBoundary><RegistrazioneBorgo /></RouteErrorBoundary>} />
          {/* retro-compatibilità: vecchia pagina -> auth */}
          <Route path="/registrazione-utente" element={<Navigate to="/auth" replace />} />
          <Route path="/registrazione-attivita" element={<RouteErrorBoundary><RegistrazioneAttivita /></RouteErrorBoundary>} />

          {/* Attività > categorie (fuori layout) */}
          <Route path="/registrazione-attivita/dormire" element={<RouteErrorBoundary><Dormire /></RouteErrorBoundary>} />
          <Route path="/registrazione-attivita/mangiare" element={<RouteErrorBoundary><Mangiare /></RouteErrorBoundary>} />
          <Route path="/registrazione-attivita/artigiani" element={<RouteErrorBoundary><Artigiani /></RouteErrorBoundary>} />
          <Route path="/registrazione-attivita/trasporti" element={<RouteErrorBoundary><Trasporti /></RouteErrorBoundary>} />
          <Route path="/dormire" element={<Navigate to="/registrazione-attivita/dormire" replace />} />
          <Route path="/mangiare" element={<Navigate to="/registrazione-attivita/mangiare" replace />} />
          <Route path="/artigiani" element={<Navigate to="/registrazione-attivita/artigiani" replace />} />
          <Route path="/trasporti" element={<Navigate to="/registrazione-attivita/trasporti" replace />} />

          {/* Creator (pubblico + area creator) */}
          <Route path="/registrazione-creator" element={<RouteErrorBoundary><CreatorAuth /></RouteErrorBoundary>} />
          <Route path="/creator/onboarding" element={<Navigate to="/creator/me" replace />} />
          <Route path="/creator/me" element={<RouteErrorBoundary><CreatorOnboarding /></RouteErrorBoundary>} />
          {/* area dedicata contenuti: usa Onboarding (lista bozze/programmati/pubblicati) */}
          <Route path="/creator/contenuti" element={<RouteErrorBoundary><CreatorOnboarding /></RouteErrorBoundary>} />
          {/* preview profilo pubblico del creator */}
          <Route path="/creator/me/preview" element={<RouteErrorBoundary><CreatorProfile /></RouteErrorBoundary>} />
          <Route path="/creator" element={<RouteErrorBoundary><CreatorIndex /></RouteErrorBoundary>} />
          <Route path="/creator/:id" element={<RouteErrorBoundary><CreatorProfile /></RouteErrorBoundary>} />
          <Route path="/creator/upload" element={<Navigate to="/creator/me?step=2" replace />} />

          {/* Chat */}
          <Route path="/chat/:threadId" element={<RouteErrorBoundary><Thread /></RouteErrorBoundary>} />

          {/* =================== SITO con TOPBAR (DRY) =================== */}
          <Route element={<AppLayout />}>
            {/* Ricerca & dettagli */}
            <Route path="/cerca" element={<RouteErrorBoundary><SearchResults /></RouteErrorBoundary>} />
            <Route path="/borghi/:slug/poi/:id" element={<RouteErrorBoundary><POIDetail /></RouteErrorBoundary>} />
            <Route path="/poi/:slug" element={<RouteErrorBoundary><POIDetail /></RouteErrorBoundary>} />
            <Route path="/borghi/:slug" element={<RouteErrorBoundary><HomeBorgo /></RouteErrorBoundary>} />
            <Route path="/borghi/:slug/esperienze" element={<RouteErrorBoundary><Esperienze /></RouteErrorBoundary>} />
            {/* ✅ Regioni */}
            <Route path="/regioni/:slug" element={<RouteErrorBoundary><Regione /></RouteErrorBoundary>} />

            {/* Itinerari */}
            <Route path="/itinerari" element={<RouteErrorBoundary><ItinerariConsigliati /></RouteErrorBoundary>} />
            <Route path="/itinerari/nuovo" element={<RouteErrorBoundary><ItineraryWizard /></RouteErrorBoundary>} />
            <Route path="/itinerari/:id/edit" element={<RouteErrorBoundary><ItineraryWizard /></RouteErrorBoundary>} />

            {/* Pillole (sezioni del borgo) */}
            <Route path="/borghi/:slug/eventi" element={<RouteErrorBoundary><SectionPlaceholder title="Eventi e Sagre" /></RouteErrorBoundary>} />
            <Route path="/borghi/:slug/prodotti-tipici" element={<RouteErrorBoundary><SectionPlaceholder title="Prodotti Tipici" /></RouteErrorBoundary>} />
            <Route path="/borghi/:slug/artigiani" element={<RouteErrorBoundary><SectionPlaceholder title="Artigiani" /></RouteErrorBoundary>} />
            <Route path="/borghi/:slug/mangiare-bere" element={<RouteErrorBoundary><SectionPlaceholder title="Dove Mangiare" /></RouteErrorBoundary>} />
            <Route path="/borghi/:slug/dormire" element={<RouteErrorBoundary><SectionPlaceholder title="Dove Dormire" /></RouteErrorBoundary>} />
            <Route path="/borghi/:slug/cosa-fare" element={<RouteErrorBoundary><SectionPlaceholder title="Cosa Fare" /></RouteErrorBoundary>} />
            <Route path="/borghi/:slug/info-utili" element={<RouteErrorBoundary><SectionPlaceholder title="Info Utili" /></RouteErrorBoundary>} />
            <Route path="/borghi/:slug/video" element={<RouteErrorBoundary><SectionPlaceholder title="Video del borgo" /></RouteErrorBoundary>} />

            {/* Placeholder per link del menu a panino */}
            <Route path="/notifiche" element={<RouteErrorBoundary><SectionPlaceholder title="Notifiche" /></RouteErrorBoundary>} />
            <Route path="/livelli" element={<RouteErrorBoundary><SectionPlaceholder title="Livelli & Obiettivi" /></RouteErrorBoundary>} />
          </Route>
          {/* ================= FINE SITO con TOPBAR ================= */}

          {/* ✅ Auth utente/creator e onboarding */}
          <Route path="/auth" element={<RouteErrorBoundary><CreatorAuth /></RouteErrorBoundary>} />
          <Route path="/onboarding" element={<Navigate to="/creator/me" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}
