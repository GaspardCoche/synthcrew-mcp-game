import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Bridge from "./pages/Bridge";
import Quarters from "./pages/Quarters";
import Armory from "./pages/Armory";
import OpsRoom from "./pages/OpsRoom";
import Log from "./pages/Log";

export default function App() {
  return (
    <Routes>
      <Route path="/classic/*" element={<Layout />}>
        <Route index element={<Bridge />} />
        <Route path="quarters" element={<Quarters />} />
        <Route path="armory" element={<Armory />} />
        <Route path="ops" element={<OpsRoom />} />
        <Route path="log" element={<Log />} />
        <Route path="*" element={<Navigate to="/classic" replace />} />
      </Route>
    </Routes>
  );
}
