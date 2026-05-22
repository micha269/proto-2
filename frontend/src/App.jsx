import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import TailwindSafelist from "./tailwind-safelist.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";
import PanelPrincipal from "./pages/PanelPrincipal.jsx";
import BusquedaPerfil from "./pages/BusquedaPerfil.jsx";
import CentroAlertas from "./pages/CentroAlertas.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import AnalisisPredictivo from "./pages/AnalisisPredictivo.jsx";
import Configuracion from "./pages/Configuracion.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <TailwindSafelist />
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<PanelPrincipal />} />
          <Route path="busqueda-perfil" element={<BusquedaPerfil />} />
          <Route path="centro-alertas" element={<CentroAlertas />} />
          <Route
            path="analisis-predictivo"
            element={
              <ErrorBoundary>
                <AnalisisPredictivo />
              </ErrorBoundary>
            }
          />
          <Route path="configuracion" element={<Configuracion />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
