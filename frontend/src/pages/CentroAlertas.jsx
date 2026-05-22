import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "../components/layout/PageHeader.jsx";
import GestionarAlertaModal from "../components/alertas/GestionarAlertaModal.jsx";
import Card from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import { useDashboard } from "../context/DashboardContext.jsx";
import { formatearFecha } from "../utils/format.js";
import {
  guardarEstadoAlerta,
  obtenerEstadoAlerta,
  estadoInicialDesdeSocio,
} from "../utils/alertasStore.js";
import { nivelRiesgo } from "../utils/risk.js";

const FILTROS = [
  { id: "todas", label: "Todas" },
  { id: "criticas", label: "Críticas" },
  { id: "moderadas", label: "Moderadas" },
  { id: "revision", label: "En Revisión" },
];

function crearAlertas(socios) {
  return socios
    .filter((s) => s.probabilidad_mora >= 40 || s.dias_mora > 0)
    .map((socio) => {
      const riesgo = nivelRiesgo(socio.probabilidad_mora);
      let categoria = "moderadas";
      if (riesgo.variant === "critico") categoria = "criticas";
      const guardado = obtenerEstadoAlerta(socio.token_seguridad);
      if (guardado.estado === "En Revisión") categoria = "revision";
      if (guardado.estado === "Resuelta" || guardado.estado === "Falso Positivo") categoria = "revision";

      return {
        id: socio.token_seguridad,
        socio,
        categoria,
        estado: guardado.actualizado ? guardado.estado : estadoInicialDesdeSocio(socio),
        notas: guardado.notas,
        disparador:
          socio.dias_mora > 0
            ? `Mora de ${socio.dias_mora} días detectada`
            : `Score de riesgo elevado (${socio.probabilidad_mora}%)`,
        fecha: guardado.actualizado
          ? formatearFecha(new Date(guardado.actualizado))
          : formatearFecha(),
      };
    });
}

export default function CentroAlertas() {
  const [filtro, setFiltro] = useState("todas");
  const [socioGestion, setSocioGestion] = useState(null);
  const [tick, setTick] = useState(0);
  const { socios, cargando, paginacion, page, setPage } = useDashboard();

  const refrescar = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    window.addEventListener("cooptech-alertas-actualizadas", refrescar);
    return () => window.removeEventListener("cooptech-alertas-actualizadas", refrescar);
  }, [refrescar]);

  const alertasLista = useMemo(() => {
    void tick;
    return crearAlertas(socios);
  }, [socios, tick]);

  const lista = useMemo(() => {
    if (filtro === "todas") return alertasLista;
    return alertasLista.filter((a) => a.categoria === filtro);
  }, [alertasLista, filtro]);

  const cambiarEstado = (alerta, nuevoEstado) => {
    guardarEstadoAlerta(alerta.id, { estado: nuevoEstado, notas: alerta.notas });
    refrescar();
  };

  const conteos = useMemo(() => {
    return {
      todas: alertasLista.length,
      criticas: alertasLista.filter((a) => a.categoria === "criticas").length,
      moderadas: alertasLista.filter((a) => a.categoria === "moderadas").length,
      revision: alertasLista.filter((a) => a.categoria === "revision").length,
    };
  }, [alertasLista]);

  return (
    <div>
      <PageHeader titulo="Centro de Alertas" mostrarFiltroAgencia={false} />

      <Card className="mb-6">
        <p className="mb-3 text-sm text-gray-500">
          Gestión de alertas conductuales · {alertasLista.length} en esta página
          {paginacion ? ` (pág. ${page}/${paginacion.total_pages})` : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                filtro === f.id
                  ? "bg-coop-orange text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-coop-mint"
              }`}
            >
              {f.label} ({conteos[f.id] ?? 0})
            </button>
          ))}
        </div>
      </Card>

      <Card padding="p-0" className="overflow-hidden">
        {cargando ? (
          <p className="p-8 text-center text-gray-500">Cargando alertas...</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {lista.map((alerta) => {
              const riesgo = nivelRiesgo(alerta.socio.probabilidad_mora);
              return (
                <li key={alerta.id} className="px-6 py-5 hover:bg-gray-50/50">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-800">{alerta.socio.nombre_anon}</p>
                        <Badge variant={riesgo.variant}>{riesgo.label}</Badge>
                        <Badge variant="neutral">{alerta.estado}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{alerta.disparador}</p>
                      {alerta.notas && (
                        <p className="mt-1 text-sm italic text-gray-500">Nota: {alerta.notas}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-400">
                        {alerta.socio.token_seguridad} · {alerta.fecha}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setSocioGestion(alerta.socio)}>
                        Gestionar
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => cambiarEstado(alerta, "Resuelta")}>
                        Resolver
                      </Button>
                      <Button size="sm" onClick={() => cambiarEstado(alerta, "Escalada")}>
                        Escalar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => cambiarEstado(alerta, "Falso Positivo")}>
                        Falso Positivo
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {!cargando && lista.length === 0 && (
          <p className="p-8 text-center text-gray-500">
            No hay alertas en esta categoría en la página actual. Cambie de página o filtro.
          </p>
        )}

        {paginacion && paginacion.total_pages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
            <p className="text-sm text-gray-500">
              Página {paginacion.page} de {paginacion.total_pages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={!paginacion.has_prev || cargando}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!paginacion.has_next || cargando}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      <GestionarAlertaModal
        socio={socioGestion}
        abierto={Boolean(socioGestion)}
        onCerrar={() => setSocioGestion(null)}
        onGuardado={refrescar}
      />
    </div>
  );
}
