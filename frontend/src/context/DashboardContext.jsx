import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";
const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [metricas, setMetricas] = useState({
    total_socios_analizados: 0,
    alertas_comportamentales_activas: 0,
    capital_exposicion_preventiva: 0,
  });
  const [socios, setSocios] = useState([]);
  const [agencias, setAgencias] = useState([]);
  const [paginacion, setPaginacion] = useState(null);
  const [universoBd, setUniversoBd] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [error, setError] = useState("");
  const [modo, setModo] = useState("");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [oficina, setOficina] = useState("");
  const [perfilTipoRiesgo, setPerfilTipoRiesgo] = useState("todos");
  const [perfilRangoScore, setPerfilRangoScore] = useState("todos");
  const [pageSize, setPageSize] = useState(50);
  const cancelRef = useRef(null);

  const aplicarRespuesta = useCallback((data) => {
    setMetricas(data.metricas || {});
    setSocios(data.socios || []);
    setAgencias(data.agencias || []);
    setPaginacion(data.paginacion || null);
    setUniversoBd(data.universo_bd || null);
    setModo(data.modo || "");
    setConectado(true);
    setSincronizando(false);
    setError("");
  }, []);

  const cargar = useCallback(async () => {
    if (cancelRef.current) cancelRef.current.abort();
    const controller = new AbortController();
    cancelRef.current = controller;

    setCargando(true);
    setError("");
    try {
      const busqueda = searchTerm.trim();
      const params = {
        page,
        page_size: busqueda ? 200 : pageSize,
      };
      if (busqueda) params.search = busqueda;
      if (oficina && oficina !== "todas") params.oficina = oficina;
      if (perfilTipoRiesgo && perfilTipoRiesgo !== "todos") params.tipo_riesgo = perfilTipoRiesgo;
      if (perfilRangoScore && perfilRangoScore !== "todos") params.rango_score = perfilRangoScore;

      const { data, status } = await axios.get(`${API_BASE}/api/dashboard/analisis/`, {
        params,
        timeout: 60000,
        signal: controller.signal,
        validateStatus: (s) => s === 200 || s === 503,
      });

      if (status === 503 || data.sincronizando) {
        setSincronizando(true);
        setConectado(true);
        setError("");
        return false;
      }

      aplicarRespuesta(data);
      return true;
    } catch (err) {
      if (axios.isCancel(err)) return false;
      setConectado(false);
      setSocios([]);
      setAgencias([]);
      setPaginacion(null);
      const detalle = err?.response?.status ? `HTTP ${err.response.status}` : "sin respuesta";
      const msgBackend = err?.response?.data?.detalle || err?.response?.data?.error;
      setError(
        msgBackend ||
          `No se pudo conectar al backend (127.0.0.1:8000 · ${detalle}). Ejecute .\\start-backend.ps1`
      );
      return false;
    } finally {
      if (!controller.signal.aborted) setCargando(false);
    }
  }, [page, pageSize, searchTerm, oficina, perfilTipoRiesgo, perfilRangoScore, aplicarRespuesta]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, oficina, perfilTipoRiesgo, perfilRangoScore, pageSize]);

  useEffect(() => {
    let activo = true;
    let timer;

    const ejecutar = async () => {
      if (!activo) return;
      const listo = await cargar();
      if (!activo) return;
      if (!listo) {
        timer = setTimeout(ejecutar, 4000);
      }
    };

    const debounce = setTimeout(ejecutar, 300);
    return () => {
      activo = false;
      clearTimeout(debounce);
      clearTimeout(timer);
      if (cancelRef.current) cancelRef.current.abort();
    };
  }, [cargar]);

  const value = {
    metricas,
    socios,
    agencias,
    paginacion,
    universoBd,
    page,
    setPage,
    searchTerm,
    setSearchTerm,
    oficina,
    setOficina,
    perfilTipoRiesgo,
    setPerfilTipoRiesgo,
    perfilRangoScore,
    setPerfilRangoScore,
    pageSize,
    setPageSize,
    cargando,
    sincronizando,
    conectado,
    error,
    modo,
    recargar: cargar,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard debe usarse dentro de DashboardProvider");
  }
  return ctx;
}
