import { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";

export function usePredictivoCompleto(filtros) {
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    setSincronizando(false);
    try {
      const params = {
        tipo_riesgo: filtros.tipoRiesgo || "todos",
        rango_score: filtros.rangoScore || "todos",
        solo_mora: filtros.soloMora || "todos",
        calificacion: filtros.calificacion || "todas",
      };
      if (filtros.oficina) params.oficina = filtros.oficina;

      const { data, status } = await axios.get(`${API_BASE}/api/dashboard/predictivo/resumen/`, {
        params,
        timeout: 180000,
        validateStatus: (s) => s === 200 || s === 503 || s === 404,
      });

      if (status === 404) {
        setError(
          "Endpoint predictivo no encontrado. Reinicie el backend (.\\start-backend.ps1) para cargar la API nueva."
        );
        setResumen(null);
        return;
      }

      if (status === 503 || data.sincronizando) {
        setSincronizando(true);
        setResumen(null);
        return;
      }

      setResumen(data);
      setSincronizando(false);
    } catch (err) {
      setResumen(null);
      setError(
        err?.response?.data?.detalle ||
          err?.response?.data?.error ||
          "No se pudo calcular el análisis sobre el universo completo."
      );
    } finally {
      setCargando(false);
    }
  }, [
    filtros.oficina,
    filtros.tipoRiesgo,
    filtros.rangoScore,
    filtros.soloMora,
    filtros.calificacion,
  ]);

  useEffect(() => {
    const timer = setTimeout(cargar, 350);
    return () => clearTimeout(timer);
  }, [cargar]);

  return { resumen, cargando, sincronizando, error, recargar: cargar };
}
