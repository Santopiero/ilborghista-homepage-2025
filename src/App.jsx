import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pagine principali
import HomepageMockup from "./HomepageMockup.jsx";
import Registrazione from "./pages/Registrazione.jsx";

// Registrazioni
import RegistrazioneBorgo from "./pages/RegistrazioneBorgo.jsx";
import RegistrazioneAttivita from "./pages/RegistrazioneAttivita.jsx";
import RegistrazioneUtente from "./pages/RegistrazioneUtente.jsx";

// Attività: categorie (tutta la cartella “attivita”)
import Dormire from "./pages/attivita/Dormire.jsx";
import Mangiare from "./pages/attivita/Mangiare.jsx";
import Artigiani from "./pages/attivita/Artigiani.jsx";
import Trasporti from "./pages/attivita/Trasporti.jsx";

export default function App() {
  return (
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
        <Route path="/registrazione-attivita/artigiani" element={<Artigiani />} />
        <Route path="/registrazione-attivita/trasporti" element={<Trasporti />} />

        {/* Redirect di cortesia */}
        <Route path="/dormire" element={<Navigate to="/registrazione-attivita/dormire" replace />} />
        <Route path="/mangiare" element={<Navigate to="/registrazione-attivita/mangiare" replace />} />
        <Route path="/artigiani" element={<Navigate to="/registrazione-attivita/artigiani" replace />} />
        <Route path="/trasporti" element={<Navigate to="/registrazione-attivita/trasporti" replace />} />

        {/* Fallback */}
        <Route path="*" element={<HomepageMockup />} />
      </Routes>
    </BrowserRouter>
  );
}
