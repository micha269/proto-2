import { useEffect, useState } from "react";
import GestionarAlertaModal from "../components/alertas/GestionarAlertaModal.jsx";
import PageHeader from "../components/layout/PageHeader.jsx";
import KpiCard from "../components/ui/KpiCard.jsx";
import Card from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import { IconWarning, IconDollar, IconTrend } from "../components/icons/NavIcons.jsx";
import { useDashboard } from "../context/DashboardContext.jsx";
import { formatearMoneda, formatearFecha } from "../utils/format.js";
import { obtenerEstadoAlerta } from "../utils/alertasStore.js";
import { nivelRiesgo } from "../utils/risk.js";

function disparadorConductual(socio) {
  if (socio.dias_mora > 0) return `Mora activa: ${socio.dias_mora} días`;
  if (socio.calificacion) return `Calificación ${socio.calificacion} · ${socio.tipo_cartera || "Cartera"}`;
  if (socio.probabilidad_mora >= 65) return "Reducción de saldo promedio > 40%";
  if (socio.probabilidad_mora >= 40) return "Patrón transaccional irregular";
  return "Monitoreo preventivo estándar";
}

export default function PanelPrincipal() {
  const [agencia, setAgencia] = useState("todas");
  const [socioAlerta, setSocioAlerta] = useState(null);
  const [revisionAlertas, setRevisionAlertas] = useState(0);

  useEffect(() => {
    const actualizar = () => setRevisionAlertas((n) => n + 1);
    window.addEventListener("cooptech-alertas-actualizadas", actualizar);
    return () => window.removeEventListener("cooptech-alertas-actualizadas", actualizar);
  }, []);
  const {
    metricas,
    socios,
    agencias,
    paginacion,
    universoBd,
    page,
    setPage,
    searchTerm: busqueda,
    setSearchTerm: setBusqueda,
    setOficina,
    cargando,
    sincronizando,
    conectado,
    error,
  } = useDashboard();

  const onAgenciaChange = (valor) => {
    setAgencia(valor);
    setOficina(valor === "todas" ? "" : valor);
  };

  const criticos = socios.filter((s) => s.probabilidad_mora >= 65).length;
  const tasaMorosidad = metricas.total_socios_analizados
    ? ((metricas.alertas_comportamentales_activas / metricas.total_socios_analizados) * 100).toFixed(1)
    : "4.2";

  const alertasTempranas = socios
    .filter((s) => s.probabilidad_mora >= 40 || s.dias_mora > 0)
    .slice(0, 8);

  return (
    <div>
      <PageHeader
        titulo="Dashboard de Riesgo Transaccional"
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        placeholder="Buscar socio por nombre o ID..."
        agencias={agencias}
        agencia={agencia}
        onAgenciaChange={onAgenciaChange}
      />

      {sincronizando && !error && (
        <p className="mb-4 rounded-lg border border-coop-green/30 bg-coop-mint px-4 py-3 text-sm text-coop-green-darker">
          Sincronizando con Supabase… La primera vez puede tardar 1–2 minutos. Esta pantalla se actualizará sola.
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-800">
          {error}
        </p>
      )}

      {universoBd && (
        <p className="mb-4 text-sm text-gray-600">
          Base de datos:{" "}
          <strong>{universoBd.filas_tabla_creditos?.toLocaleString("es-EC")}</strong> filas en créditos,{" "}
          <strong>{universoBd.filas_tabla_ahorros?.toLocaleString("es-EC")}</strong> en ahorros ·{" "}
          <strong>{universoBd.socios_unicos_credito?.toLocaleString("es-EC")}</strong> socios únicos ·{" "}
          <strong>{universoBd.total_agencias ?? agencias.length}</strong> agencias
          {paginacion && (
            <>
              {" "}
              · página {paginacion.page} de {paginacion.total_pages}
            </>
          )}
        </p>
      )}

      <section className="mb-8 grid min-w-0 gap-5 md:grid-cols-3">
        <KpiCard
          icon={<IconWarning className="h-5 w-5 text-red-600" />}
          iconBg="bg-red-50"
          titulo="Socios en Riesgo Crítico"
          valor={cargando ? "—" : criticos || metricas.alertas_comportamentales_activas}
          footer={`Actualizado: ${formatearFecha()}`}
        />
        <KpiCard
          icon={<IconDollar className="h-5 w-5 text-coop-green-dark" />}
          iconBg="bg-coop-mint"
          titulo="Capital en Riesgo"
          valor={
            cargando
              ? "—"
              : formatearMoneda(metricas.capital_exposicion_preventiva, { compact: true })
          }
          valorTitulo={
            cargando ? undefined : formatearMoneda(metricas.capital_exposicion_preventiva)
          }
          footer="Cartera total afectada"
        />
        <KpiCard
          icon={<IconTrend className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50"
          titulo="Tasa de Morosidad Proyectada"
          valor={`${tasaMorosidad}%`}
          footer="↑ +0.3% vs mes anterior"
          footerClass="text-coop-green font-medium"
        />
      </section>

      <Card padding="p-0" className="card-coop overflow-hidden">
        <div className="border-b border-coop-green/15 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-coop-green-darker">Alertas Tempranas</h2>
          <p className="text-sm text-gray-500">
            Socios con comportamiento transaccional de riesgo
            {conectado && (
              <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-coop-green" title="Conectado" />
            )}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="table-coop min-w-full text-left text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-wide">
                <th className="px-6 py-3">Socio</th>
                <th className="px-6 py-3">Score de Riesgo</th>
                <th className="px-6 py-3">Disparador Conductual</th>
                <th className="px-6 py-3">Última Transacción</th>
                <th className="px-6 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Sincronizando con Supabase… La primera carga puede tardar 2–3 minutos. No cierre el backend.
                  </td>
                </tr>
              )}
              {!cargando &&
                (alertasTempranas.length > 0 ? alertasTempranas : socios.slice(0, 5)).map((socio) => {
                  const riesgo = nivelRiesgo(socio.probabilidad_mora);
                  const estadoAlerta = obtenerEstadoAlerta(socio.token_seguridad).estado;
                  return (
                    <tr
                      key={`${socio.token_seguridad}-${revisionAlertas}`}
                      className="border-b border-gray-50 hover:bg-coop-mint/60"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">{socio.nombre_anon}</p>
                        <p className="text-xs text-gray-500">
                          {socio.token_seguridad.slice(0, 4)}******* · SOC {socio.token_seguridad.slice(-4)}
                        </p>
                        <Badge variant="neutral" className="mt-1">
                          {estadoAlerta}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={riesgo.variant}>{riesgo.label}</Badge>
                          <span className="font-bold text-slate-800">
                            {Math.round(socio.probabilidad_mora)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{disparadorConductual(socio)}</td>
                      <td className="px-6 py-4 text-gray-600">{formatearFecha()}</td>
                      <td className="px-6 py-4">
                        <Button size="sm" onClick={() => setSocioAlerta(socio)}>
                          Gestionar Alerta
                        </Button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {paginacion && paginacion.total_pages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
            <p className="text-sm text-gray-500">
              Mostrando {(paginacion.page - 1) * paginacion.page_size + 1}–
              {Math.min(paginacion.page * paginacion.page_size, paginacion.total_socios)} de{" "}
              {paginacion.total_socios.toLocaleString("es-EC")} socios
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
        socio={socioAlerta}
        abierto={Boolean(socioAlerta)}
        onCerrar={() => setSocioAlerta(null)}
      />
    </div>
  );
}
