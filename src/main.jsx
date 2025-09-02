// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

/* Pagine principali */
import HomepageMockup from "./HomepageMockup.jsx";
import Registrazione from "./pages/Registrazione.jsx";

/* Registrazioni */
import RegistrazioneBorgo from "./pages/RegistrazioneBorgo.jsx";
import RegistrazioneAttivita from "./pages/RegistrazioneAttivita.jsx";
import RegistrazioneUtente from "./pages/RegistrazioneUtente.jsx";

/* Attività: categorie (stessa cartella) */
import Dormire from "./pages/attivita/Dormire.jsx";
import Mangiare from "./pages/attivita/Mangiare.jsx";

/* rotta di debug */
function Ping() {
  return <div style={{ padding: 16 }}>✅ Router OK</div>;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route path="/" element={<HomepageMockup />} />

        {/* Registrazioni principali */}
        <Route path="/registrazione-comune" element={<Registrazione />} />
        <Route path="/registrazione-borgo" element={<RegistrazioneBorgo />} />
        <Route path="/registrazione-utente" element={<RegistrazioneUtente />} />

        {/* Landing registrazione Attività */}
        <Route path="/registrazione-attivita" element={<RegistrazioneAttivita />} />

        {/* Attività > categorie */}
        <Route path="/registrazione-attivita/dormire" element={<Dormire />} />
        <Route path="/registrazione-attivita/mangiare" element={<Mangiare />} />

        {/* Redirect di cortesia */}
        <Route path="/dormire" element={<Navigate to="/registrazione-attivita/dormire" replace />} />
        <Route path="/mangiare" element={<Navigate to="/registrazione-attivita/mangiare" replace />} />

        {/* Debug router */}
        <Route path="/_ping" element={<Ping />} />

        {/* Fallback */}
        <Route path="*" element={<HomepageMockup />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
