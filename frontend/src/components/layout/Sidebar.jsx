import { NavLink } from "react-router-dom";
import {
  IconHome,
  IconSearch,
  IconBell,
  IconChart,
  IconSettings,
} from "../icons/NavIcons.jsx";

const navItems = [
  { to: "/", label: "Panel Principal", icon: IconHome, end: true },
  { to: "/busqueda-perfil", label: "Búsqueda de Perfil", icon: IconSearch },
  { to: "/centro-alertas", label: "Centro de Alertas", icon: IconBell },
  { to: "/analisis-predictivo", label: "Análisis Predictivo", icon: IconChart },
  { to: "/configuracion", label: "Configuración", icon: IconSettings },
];

export default function Sidebar() {
  return (
    <aside className="app-sidebar">
      <div className="app-sidebar-brand px-4 py-4">
        <img
          src="/logo-cooptulcan.png"
          alt="Cooperativa de Ahorro y Crédito Tulcán Ltda."
          className="mx-auto h-auto w-full max-h-[5.5rem] rounded-lg bg-white object-contain p-2 shadow-sm"
          width={220}
          height={88}
        />
      </div>

      <p className="px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">
        RISK-CORE
      </p>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-coop-orange text-white shadow-sm"
                  : "text-white/85 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <p className="border-t border-white/10 px-5 py-4 text-xs text-white/40">
        Sembrando un futuro juntos
        <br />
        <span className="text-white/25">v1.0.0</span>
      </p>
    </aside>
  );
}
