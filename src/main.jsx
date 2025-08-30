// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import HomepageMockup from "./HomepageMockup.jsx";
import Registrazione from "./pages/Registrazione.jsx";

import RegistrazioneBorgo from "./pages/RegistrazioneBorgo.jsx";
import RegistrazioneAttivita from "./pages/RegistrazioneAttivita.jsx";
import RegistrazioneUtente from "./pages/RegistrazioneUtente.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomepageMockup />} />
        <Route path="/registrazione-comune" element={<Registrazione />} />

        {/* QUI: usa il componente vero, non il test */}
        <Route path="/registrazione-borgo" element={<RegistrazioneBorgo />} />
        <Route path="/registrazione-attivita" element={<RegistrazioneAttivita />} />
        <Route path="/registrazione-utente" element={<RegistrazioneUtente />} />

        <Route path="*" element={<HomepageMockup />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
