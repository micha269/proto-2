import { Outlet } from "react-router-dom";
import { DashboardProvider } from "../../context/DashboardContext.jsx";
import Sidebar from "./Sidebar.jsx";

export default function AppLayout() {
  return (
    <DashboardProvider>
      <div className="min-h-screen">
        <Sidebar />
        <main className="app-main">
          <div className="app-topbar flex items-center gap-3">
            <img
              src="/logo-cooptulcan.png"
              alt=""
              aria-hidden
              className="h-8 w-auto max-w-[140px] rounded bg-white/95 object-contain px-1.5 py-0.5"
            />
            <span>Panel de riesgo transaccional · RISK-CORE</span>
          </div>
          <div className="app-content">
            <Outlet />
          </div>
        </main>
      </div>
    </DashboardProvider>
  );
}
