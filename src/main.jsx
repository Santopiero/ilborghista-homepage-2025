// src/main.jsx
import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

// --- ErrorBoundary minimal per catturare errori di render/lazy ---
class RouteErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state = { error: null }; }
  static getDerivedStateFromError(error){ return { error }; }
  componentDidCatch(error, info){ console.error("Route error:", error, info); }
  render(){
    if (this.state.error) {
      return (
        <main style={{ padding: 16 }}>
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: 12, borderRadius: 8 }}>
            <b>Errore di pagina:</b> {String(this.state.error?.message || this.state.error)}
            <div style={{ fontSize: 12, marginTop: 8 }}>
              Controlla la rotta che hai aperto: probabilmente un import non valido
              (es. icona non esistente) o un file con sintassi errata.
            </div>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

// --- Lazy imports (caricati solo quando si entra nella rotta) ---
const HomepageMockup = lazy(() => import("./HomepageMockup.jsx"));
const Registrazione = lazy(() => import("./pages/Registrazione.jsx"));
const RegistrazioneBorgo = lazy(() => import("./pages/RegistrazioneBorgo.jsx"));
const RegistrazioneAttivita = lazy(() => import("./pages/RegistrazioneAttivita.jsx"));
const RegistrazioneUtente = lazy(() => import("./pages/RegistrazioneUtente.jsx"));

// Attività
const Dormire = lazy(() => import("./pages/attivita/Dormire.jsx"));
const Mangiare = lazy(() => import("./pages/attivita/Mangiare.jsx"));
const Artigiani = lazy(() => import("./pages/attivita/Artigiani.jsx"));
const Trasporti = lazy(() => import("./pages/attivita/Trasporti.jsx"));

// Fallback di caricamento
function Fallback() {
  return <div style={{ padding: 16 }}>Caricamento…</div>;
}

function App() {
  return (
    <BrowserRouter>
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

            {/* Landing registrazione Attività */}
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

            {/* Redirect di cortesia */}
            <Route path="/dormire" element={<Navigate to="/registrazione-attivita/dormire" replace />} />
            <Route path="/mangiare" element={<Navigate to="/registrazione-attivita/mangiare" replace />} />
            <Route path="/artigiani" element={<Navigate to="/registrazione-attivita/artigiani" replace />} />
            <Route path="/trasporti" element={<Navigate to="/registrazione-attivita/trasporti" replace />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
    </BrowserRouter>
  );
}

const root = document.getElementById("root");
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
