import { Outlet } from "react-router-dom";
import { DashboardProvider } from "../../context/DashboardContext.jsx";
import Sidebar from "./Sidebar.jsx";

export default function AppLayout() {
  return (
    <DashboardProvider>
      <div className="min-h-screen">
        <Sidebar />
        <main className="app-main">
          <div className="app-topbar">Cooperativa de Ahorro y Crédito Tulcán — Panel de riesgo transaccional</div>
          <div className="app-content">
            <Outlet />
          </div>
        </main>
      </div>
    </DashboardProvider>
  );
}
