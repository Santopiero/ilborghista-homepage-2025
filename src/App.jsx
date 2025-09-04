// src/App.jsx
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

/* =======================
   Error boundary minimale
   ======================= */
class RouteErrorBoundary extends React.Component {
  constructor(p) {
    super(p);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("Route error:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <main style={{ padding: 16 }}>
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: 12,
              borderRadius: 8,
            }}
          >
            <b>Errore di pagina:</b>{" "}
            {String(this.state.error?.message || this.state.error)}
            <div style={{ fontSize: 12, marginTop: 8 }}>
              Controlla la rotta che hai aperto: probabilmente un import non
              valido o un file con sintassi errata.
            </div>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

/* =======================
   Fallback di caricamento
   ======================= */
function Fallback() {
  return <div style={{ padding: 16 }}>Caricamento…</div>;
}

/* =======================
   Lazy imports (senza estensione)
   ======================= */

// Home
const HomepageMockup = lazy(() => import("./HomepageMockup"));

// Registrazioni principali
const Registrazione = lazy(() => import("./pages/Registrazione"));
const RegistrazioneBorgo = lazy(() => import("./pages/RegistrazioneBorgo"));
const RegistrazioneAttivita = lazy(() => import("./pages/RegistrazioneAttivita"));
const RegistrazioneUtente = lazy(() => import("./pages/RegistrazioneUtente"));

// Attività (registrazione attività per categorie)
const Dormire = lazy(() => import("./pages/attivita/Dormire"));
const Mangiare = lazy(() => import("./pages/attivita/Mangiare"));
const Artigiani = lazy(() => import("./pages/attivita/Artigiani"));
const Trasporti = lazy(() => import("./pages/attivita/Trasporti"));

// Creator - elenco, profilo pubblico, auth e onboarding
const CreatorIndex = lazy(() => import("./pages/creator/CreatorIndex"));
const CreatorProfile = lazy(() => import("./pages/creator/CreatorProfile"));
const CreatorAuth = lazy(() => import("./pages/creator/Auth"));
const CreatorOnboarding = lazy(() => import("./pages/creator/Onboarding")); // usato anche per /creator/me

// Chat (thread 1:1 creator-azienda)
const Thread = lazy(() => import("./pages/chat/Thread"));

// Ricerca & Dettagli POI/Borgo
const SearchResults = lazy(() => import("./pages/SearchResults"));
const POIDetail = lazy(() => import("./pages/POIDetail"));
const HomeBorgo = lazy(() => import("./pages/HomeBorgo"));

/* =======================
   Router
   ======================= */
export default function App() {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<Fallback />}>
        <Routes>
          {/* Home */}
          <Route
            path="/"
            element={
              <RouteErrorBoundary>
                <HomepageMockup />
              </RouteErrorBoundary>
            }
          />

          {/* Registrazioni principali */}
          <Route
            path="/registrazione-comune"
            element={
              <RouteErrorBoundary>
                <Registrazione />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/registrazione-borgo"
            element={
              <RouteErrorBoundary>
                <RegistrazioneBorgo />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/registrazione-utente"
            element={
              <RouteErrorBoundary>
                <RegistrazioneUtente />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/registrazione-attivita"
            element={
              <RouteErrorBoundary>
                <RegistrazioneAttivita />
              </RouteErrorBoundary>
            }
          />

          {/* Attività > categorie */}
          <Route
            path="/registrazione-attivita/dormire"
            element={
              <RouteErrorBoundary>
                <Dormire />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/registrazione-attivita/mangiare"
            element={
              <RouteErrorBoundary>
                <Mangiare />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/registrazione-attivita/artigiani"
            element={
              <RouteErrorBoundary>
                <Artigiani />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/registrazione-attivita/trasporti"
            element={
              <RouteErrorBoundary>
                <Trasporti />
              </RouteErrorBoundary>
            }
          />

          {/* Redirect cortesia categorie */}
          <Route path="/dormire" element={<Navigate to="/registrazione-attivita/dormire" replace />} />
          <Route path="/mangiare" element={<Navigate to="/registrazione-attivita/mangiare" replace />} />
          <Route path="/artigiani" element={<Navigate to="/registrazione-attivita/artigiani" replace />} />
          <Route path="/trasporti" element={<Navigate to="/registrazione-attivita/trasporti" replace />} />

          {/* Creator: login/registrazione */}
          <Route
            path="/registrazione-creator"
            element={
              <RouteErrorBoundary>
                <CreatorAuth />
              </RouteErrorBoundary>
            }
          />

          {/* Creator: Onboarding + alias area personale */}
          <Route
            path="/creator/onboarding"
            element={<Navigate to="/creator/me" replace />}
          />
          <Route
            path="/creator/me"
            element={
              <RouteErrorBoundary>
                <CreatorOnboarding />
              </RouteErrorBoundary>
            }
          />

          {/* Creator: pubblico */}
          <Route
            path="/creator"
            element={
              <RouteErrorBoundary>
                <CreatorIndex />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/creator/:id"
            element={
              <RouteErrorBoundary>
                <CreatorProfile />
              </RouteErrorBoundary>
            }
          />

          {/* Legacy route upload → porta allo step 2 dell’onboarding */}
          <Route path="/creator/upload" element={<Navigate to="/creator/me?step=2" replace />} />

          {/* Chat */}
          <Route
            path="/chat/:threadId"
            element={
              <RouteErrorBoundary>
                <Thread />
              </RouteErrorBoundary>
            }
          />

          {/* Ricerca & Dettagli */}
          <Route
            path="/cerca"
            element={
              <RouteErrorBoundary>
                <SearchResults />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/poi/:slug"
            element={
              <RouteErrorBoundary>
                <POIDetail />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/borghi/:slug"
            element={
              <RouteErrorBoundary>
                <HomeBorgo />
              </RouteErrorBoundary>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}
