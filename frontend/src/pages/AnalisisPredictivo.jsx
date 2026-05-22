import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/layout/PageHeader.jsx";
import Card from "../components/ui/Card.jsx";
import KpiCard from "../components/ui/KpiCard.jsx";
import Badge from "../components/ui/Badge.jsx";
import Select from "../components/ui/Select.jsx";
import {
  GraficoPastel,
  HistogramaHorizontal,
  HistogramaVertical,
} from "../components/charts/PredictivoCharts.jsx";
import { IconChart, IconTrend, IconWarning } from "../components/icons/NavIcons.jsx";
import { useDashboard } from "../context/DashboardContext.jsx";
import { usePredictivoCompleto } from "../hooks/usePredictivoCompleto.js";
import { formatearMoneda } from "../utils/format.js";
import { claseScore, nivelRiesgo } from "../utils/risk.js";

export default function AnalisisPredictivo() {
  const [agencia, setAgencia] = useState("todas");
  const [tipoRiesgo, setTipoRiesgo] = useState("todos");
  const [rangoScore, setRangoScore] = useState("todos");
  const [soloMora, setSoloMora] = useState("todos");
  const [calificacion, setCalificacion] = useState("todas");
  const [escenarioStress, setEscenarioStress] = useState(15);

  const { metricas, agencias: agenciasCtx, cargando: cargandoGlobal, setOficina, sincronizando: syncCtx } =
    useDashboard();
  const oficinaFiltro = agencia === "todas" ? "" : agencia;

  const { resumen, cargando: cargandoResumen, sincronizando: syncResumen, error: errorResumen } =
    usePredictivoCompleto({
      oficina: oficinaFiltro,
      tipoRiesgo,
      rangoScore,
      soloMora,
      calificacion,
    });

  useEffect(() => {
    setOficina(oficinaFiltro);
  }, [oficinaFiltro, setOficina]);

  const agencias = resumen?.agencias?.length ? resumen.agencias : agenciasCtx;
  const metricasGlobales = resumen?.metricas_globales || metricas;
  const m = resumen?.metricas;

  const proyeccionStress = useMemo(() => {
    if (!m) return 0;
    return Math.min(m.tasa_alerta * (1 + escenarioStress / 100), 100);
  }, [m, escenarioStress]);

  const cargando = cargandoGlobal || cargandoResumen;
  const sincronizando = syncCtx || syncResumen;

  const totalAnalizados = resumen?.total_analizados ?? 0;
  const totalUniversoOficina =
    resumen?.total_universo_oficina ?? metricasGlobales?.total_socios_analizados ?? 0;
  const tasaGlobal =
    metricasGlobales.total_socios_analizados > 0
      ? (
          (metricasGlobales.alertas_comportamentales_activas /
            metricasGlobales.total_socios_analizados) *
          100
        ).toFixed(1)
      : "—";

  const califs = resumen?.calificaciones_disponibles ?? [];
  const histograma = resumen?.histogramas?.score ?? [];
  const histMora = resumen?.histogramas?.dias_mora ?? [];
  const histMontos = resumen?.histogramas?.montos ?? [];
  const histAhorro = resumen?.histogramas?.ahorro_ratio ?? [];
  const pastelSeg = resumen?.pasteles?.riesgo ?? [];
  const pastelMoraDatos = resumen?.pasteles?.mora ?? [];
  const pastelCal = resumen?.pasteles?.calificacion ?? [];
  const pastelTipo = resumen?.pasteles?.tipo_cartera ?? [];
  const pastelCap = resumen?.pasteles?.capital_riesgo ?? [];
  const porAgencia = resumen?.por_agencia ?? [];
  const topRiesgo = resumen?.top_riesgo ?? [];

  const onAgenciaChange = (valor) => setAgencia(valor);

  const limpiarFiltros = () => {
    setTipoRiesgo("todos");
    setRangoScore("todos");
    setSoloMora("todos");
    setCalificacion("todas");
    setEscenarioStress(15);
  };

  const hayFiltrosActivos =
    tipoRiesgo !== "todos" ||
    rangoScore !== "todos" ||
    soloMora !== "todos" ||
    calificacion !== "todas" ||
    escenarioStress !== 15;

  return (
    <div>
      <PageHeader
        titulo="Análisis Predictivo"
        mostrarFiltroAgencia
        agencias={agencias}
        agencia={agencia}
        onAgenciaChange={onAgenciaChange}
      />

      {sincronizando && (
        <p className="mb-4 rounded-lg border border-coop-green/30 bg-coop-mint px-4 py-3 text-sm text-coop-green-darker">
          Sincronizando cartera con Supabase… El cálculo sobre todos los socios comenzará al terminar (puede tardar
          unos segundos).
        </p>
      )}

      {cargandoResumen && !sincronizando && totalAnalizados === 0 && (
        <p className="mb-4 rounded-lg border border-coop-orange/30 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Calculando gráficos sobre el universo completo ({totalUniversoOficina?.toLocaleString("es-EC") || "…"}{" "}
          socios)…
        </p>
      )}

      {errorResumen && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {errorResumen}
        </p>
      )}

      {resumen?.universo_completo && !cargandoResumen && (
        <p className="mb-4 rounded-lg border border-coop-green/25 bg-coop-mint/60 px-4 py-2 text-sm text-coop-green-darker">
          <strong>Universo completo:</strong> {totalAnalizados.toLocaleString("es-EC")} socios analizados
          {agencia !== "todas"
            ? ` en agencia ${agencia} (de ${Number(totalUniversoOficina).toLocaleString("es-EC")} en esa oficina)`
            : ` de ${Number(totalUniversoOficina).toLocaleString("es-EC")} en la cooperativa`}
          . Sin límite de muestra.
        </p>
      )}

      <Card className="mb-6 card-coop">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-coop-green-darker">Filtros de análisis</h2>
            <p className="text-sm text-gray-500">
              Todos los gráficos usan el 100% de la cartera en caché
              {totalUniversoOficina
                ? ` · ${totalUniversoOficina.toLocaleString("es-EC")} socios en alcance`
                : ""}
              {agencia !== "todas" ? ` · agencia ${agencia}` : ""}
            </p>
          </div>
          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="text-sm font-medium text-coop-orange-dark hover:underline"
            >
              Restablecer filtros
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Select
            label="Nivel de riesgo"
            value={tipoRiesgo}
            onChange={(e) => setTipoRiesgo(e.target.value)}
            options={[
              { value: "todos", label: "Todos los niveles" },
              { value: "critico", label: "Crítico (≥65%)" },
              { value: "moderado", label: "Moderado (40–64%)" },
              { value: "estable", label: "Estable (<40%)" },
            ]}
          />
          <Select
            label="Banda de score"
            value={rangoScore}
            onChange={(e) => setRangoScore(e.target.value)}
            options={[
              { value: "todos", label: "Todas las bandas" },
              { value: "alto", label: "Alto (≥65%)" },
              { value: "medio", label: "Medio (40–64%)" },
              { value: "bajo", label: "Bajo (<40%)" },
            ]}
          />
          <Select
            label="Mora vigente"
            value={soloMora}
            onChange={(e) => setSoloMora(e.target.value)}
            options={[
              { value: "todos", label: "Todos" },
              { value: "si", label: "Con días de mora" },
              { value: "no", label: "Sin mora" },
            ]}
          />
          <Select
            label="Calificación"
            value={calificacion}
            onChange={(e) => setCalificacion(e.target.value)}
            options={[
              { value: "todas", label: "Todas" },
              ...califs.map((c) => ({ value: c, label: c })),
            ]}
          />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Escenario de estrés (+{escenarioStress}%)
            </span>
            <input
              type="range"
              min={0}
              max={30}
              step={5}
              value={escenarioStress}
              onChange={(e) => setEscenarioStress(Number(e.target.value))}
              className="mt-2 w-full accent-coop-orange"
            />
            <span className="text-xs text-gray-500">Shock sobre tasa de alerta del universo filtrado</span>
          </label>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          <strong>{totalAnalizados.toLocaleString("es-EC")}</strong> socios cumplen los filtros actuales. Tasa global
          de alertas (cooperativa): <strong>{tasaGlobal}%</strong>.
        </p>
      </Card>

      <section className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<IconChart className="h-5 w-5 text-coop-green-dark" />}
          iconBg="bg-coop-mint"
          titulo="Score promedio"
          valor={cargando || !m ? "—" : `${m.score_promedio.toFixed(1)}%`}
          footer="Media sobre todos los socios filtrados"
        />
        <KpiCard
          icon={<IconWarning className="h-5 w-5 text-red-600" />}
          iconBg="bg-red-50"
          titulo="Tasa de alerta"
          valor={cargando || !m ? "—" : `${m.tasa_alerta.toFixed(1)}%`}
          footer={`${m?.criticos?.toLocaleString("es-EC") ?? 0} críticos · ${m?.moderados?.toLocaleString("es-EC") ?? 0} moderados`}
        />
        <KpiCard
          icon={<IconTrend className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50"
          titulo="Proyección bajo estrés"
          valor={cargando || !m ? "—" : `${proyeccionStress.toFixed(1)}%`}
          footer={
            m
              ? `Simulación +${escenarioStress}% sobre ${m.tasa_alerta.toFixed(1)}% (universo completo)`
              : "Esperando datos del universo completo…"
          }
        />
        <KpiCard
          icon={<IconDollarKpi />}
          iconBg="bg-coop-mint"
          titulo="Capital en riesgo"
          valor={cargando || !m ? "—" : formatearMoneda(m.capital_en_riesgo, { compact: true })}
          footer={`Mora real: ${m?.tasa_mora_real?.toFixed(1) ?? 0}% · cartera ${formatearMoneda(metricasGlobales.capital_exposicion_preventiva, { compact: true })}`}
        />
      </section>

      <h2 className="mb-4 text-lg font-semibold text-coop-green-darker">Diagramas de pastel</h2>
      <div className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <GraficoPastel
          titulo="Pastel — nivel de riesgo"
          subtitulo={`${totalAnalizados.toLocaleString("es-EC")} socios — universo completo`}
          segmentos={pastelSeg}
          cargando={cargando}
        />
        <GraficoPastel
          titulo="Pastel — mora vigente"
          subtitulo="Al día vs. con días de mora (toda la cartera filtrada)"
          segmentos={pastelMoraDatos}
          cargando={cargando}
        />
        <GraficoPastel
          titulo="Pastel — calificación crediticia"
          subtitulo="Composición por calificación"
          segmentos={pastelCal}
          cargando={cargando}
        />
        <GraficoPastel
          titulo="Pastel — tipo de cartera"
          subtitulo="Segmentos principales de cartera"
          segmentos={pastelTipo}
          cargando={cargando}
        />
        <GraficoPastel
          titulo="Pastel — capital por riesgo"
          subtitulo="Monto de crédito por nivel predictivo"
          segmentos={pastelCap}
          cargando={cargando}
          unidad="USD"
        />
      </div>

      <h2 className="mb-4 text-lg font-semibold text-coop-green-darker">Histogramas</h2>
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <HistogramaVertical
          titulo="Histograma — score de riesgo (%)"
          subtitulo={`Frecuencia en ${totalAnalizados.toLocaleString("es-EC")} socios`}
          datos={histograma}
          cargando={cargando}
        />
        <HistogramaVertical
          titulo="Histograma — días de mora"
          subtitulo="Antigüedad de mora en toda la cartera filtrada"
          datos={histMora}
          cargando={cargando}
        />
        <HistogramaVertical
          titulo="Histograma — monto de crédito"
          subtitulo="Distribución por rangos de exposición"
          datos={histMontos}
          cargando={cargando}
        />
        <HistogramaHorizontal
          titulo="Histograma horizontal — cobertura de ahorro"
          subtitulo="Ratio ahorro disponible / crédito vigente"
          datos={histAhorro}
          cargando={cargando}
        />
        <HistogramaHorizontal
          titulo="Histograma horizontal — score por banda"
          subtitulo="Vista alternativa de la distribución de riesgo"
          datos={histograma}
          cargando={cargando}
        />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-1 text-sm font-semibold text-slate-800">Concentración por agencia</h3>
          <p className="mb-4 text-xs text-gray-500">Top agencias por tasa de alerta (universo completo)</p>
          {cargando ? (
            <p className="text-sm text-gray-400">Cargando…</p>
          ) : porAgencia.length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos para los filtros seleccionados.</p>
          ) : (
            <ul className="space-y-3">
              {porAgencia.map((item) => (
                <li key={item.codigo}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-slate-700">Agencia {item.codigo}</span>
                    <span className="text-gray-500">
                      {item.alertas}/{item.total} alertas · score {item.scorePromedio}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-coop-orange to-red-500"
                      style={{ width: `${Math.min(item.tasaAlerta, 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="card-coop overflow-hidden">
          <h3 className="mb-1 text-lg font-semibold text-coop-green-darker">Top 10 — mayor riesgo predictivo</h3>
          <p className="mb-4 text-xs text-gray-500">Global en el universo filtrado (no muestra parcial)</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-coop-green/20 text-xs uppercase text-gray-500">
                  <th className="pb-2 pr-3">Socio</th>
                  <th className="pb-2 pr-3">Score</th>
                  <th className="pb-2 pr-3">Mora</th>
                  <th className="pb-2">Crédito</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">
                      Cargando ranking…
                    </td>
                  </tr>
                ) : topRiesgo.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">
                      No hay socios con estos filtros.
                    </td>
                  </tr>
                ) : (
                  topRiesgo.map((socio) => {
                    const riesgo = nivelRiesgo(socio.probabilidad_mora);
                    return (
                      <tr key={socio.token_seguridad} className="border-b border-gray-100 last:border-0">
                        <td className="py-2.5 pr-3 font-medium text-slate-800">{socio.nombre_anon}</td>
                        <td className={`py-2.5 pr-3 font-bold ${claseScore(socio.probabilidad_mora)}`}>
                          {Math.round(socio.probabilidad_mora)}%
                          <Badge variant={riesgo.variant} className="ml-2">
                            {riesgo.label}
                          </Badge>
                        </td>
                        <td className={`py-2.5 pr-3 ${socio.dias_mora > 0 ? "font-semibold text-red-600" : "text-gray-500"}`}>
                          {socio.dias_mora > 0 ? `${socio.dias_mora} d` : "—"}
                        </td>
                        <td className="py-2.5 text-gray-700">{formatearMoneda(socio.monto_credito, { compact: true })}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="card-coop">
        <h2 className="mb-4 text-lg font-semibold text-coop-green-darker">Insights del motor IA</h2>
        <ul className="space-y-4">
          <li className="flex gap-3 rounded-lg border border-coop-green/15 bg-coop-mint/50 p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coop-orange/20 text-sm font-bold text-coop-orange-dark">
              1
            </span>
            <div>
              <p className="font-medium text-slate-800">Simulación bajo escenario de estrés</p>
              <p className="mt-1 text-sm text-gray-600">
                Con un shock del {escenarioStress}% sobre la tasa de alerta actual (
                {m?.tasa_alerta?.toFixed(1) ?? "—"}%), la mora/alerta proyectada alcanzaría{" "}
                <strong>{proyeccionStress.toFixed(1)}%</strong> en{" "}
                <strong>{totalAnalizados.toLocaleString("es-EC")}</strong> socios
                {agencia !== "todas" ? ` de agencia ${agencia}` : " de toda la cooperativa"}.
              </p>
            </div>
          </li>
          <li className="flex gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
              2
            </span>
            <div>
              <p className="font-medium text-slate-800">Concentración de riesgo</p>
              <p className="mt-1 text-sm text-gray-600">
                {m?.criticos?.toLocaleString("es-EC")} socios críticos y {m?.moderados?.toLocaleString("es-EC")}{" "}
                moderados concentran {formatearMoneda(m?.capital_en_riesgo, { compact: true })} en créditos con score ≥
                40% o mora activa. Cooperativa completa:{" "}
                {metricasGlobales.alertas_comportamentales_activas?.toLocaleString("es-EC")} alertas sobre{" "}
                {metricasGlobales.total_socios_analizados?.toLocaleString("es-EC")} socios.
              </p>
            </div>
          </li>
          <li className="flex gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
              3
            </span>
            <div>
              <p className="font-medium text-slate-800">Recomendación operativa</p>
              <p className="mt-1 text-sm text-gray-600">
                {porAgencia[0]
                  ? `Priorizar agencia ${porAgencia[0].codigo} (tasa de alerta ${porAgencia[0].tasaAlerta}%). `
                  : ""}
                Contacto preventivo en socios con score ≥ 65% y ahorro menor al 5% del crédito vigente.
                {histograma.find((h) => h.key === "65-100")?.cantidad > 0 &&
                  ` ${histograma.find((h) => h.key === "65-100").cantidad.toLocaleString("es-EC")} casos en banda crítica.`}
              </p>
            </div>
          </li>
        </ul>
      </Card>
    </div>
  );
}

function IconDollarKpi() {
  return (
    <svg className="h-5 w-5 text-coop-green-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 12v-2m9-4a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
