import { useDashboard } from "../context/DashboardContext.jsx";

/** Alias del contexto compartido (una sola carga para toda la app). */
export function useDashboardData() {
  return useDashboard();
}
