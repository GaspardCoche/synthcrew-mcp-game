import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import AppImmersive from "./AppImmersive.jsx";
import Layout from "./components/Layout";
import Bridge from "./pages/Bridge";
import Quarters from "./pages/Quarters";
import Armory from "./pages/Armory";
import OpsRoom from "./pages/OpsRoom";
import Log from "./pages/Log";
import Integrations from "./pages/Integrations";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<AppImmersive />} />
        <Route path="/classic/*" element={<Layout />}>
          <Route index element={<Bridge />} />
          <Route path="quarters" element={<Quarters />} />
          <Route path="armory" element={<Armory />} />
          <Route path="ops" element={<OpsRoom />} />
          <Route path="log" element={<Log />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="*" element={<Navigate to="/classic" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
