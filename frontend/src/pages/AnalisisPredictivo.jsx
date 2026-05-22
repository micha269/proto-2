import PageHeader from "../components/layout/PageHeader.jsx";
import Card from "../components/ui/Card.jsx";
import KpiCard from "../components/ui/KpiCard.jsx";
import { IconChart, IconTrend, IconWarning } from "../components/icons/NavIcons.jsx";
import { useDashboard } from "../context/DashboardContext.jsx";
import { formatearMoneda } from "../utils/format.js";

function GraficoPlaceholder({ titulo, color = "green" }) {
  const colors = {
    green: "from-coop-green to-coop-green/50",
    orange: "from-coop-orange to-coop-orange/50",
    red: "from-red-500 to-red-300",
  };

  const barras = [40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 68];

  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-slate-800">{titulo}</h3>
      <div className="flex h-48 items-end justify-between gap-1 px-2">
        {barras.map((h, i) => (
          <div
            key={i}
            className={`w-full max-w-6 rounded-t bg-gradient-to-t ${colors[color]} opacity-80`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="mt-3 flex justify-between text-xs text-gray-400">
        <span>Ene</span>
        <span>Jun</span>
        <span>Dic</span>
      </div>
    </Card>
  );
}

export default function AnalisisPredictivo() {
  const { metricas, socios, cargando } = useDashboard();

  const proyeccionMora = (
    (metricas.alertas_comportamentales_activas / Math.max(metricas.total_socios_analizados, 1)) *
    100 *
    1.15
  ).toFixed(1);

  const insights = [
    {
      titulo: "Simulación bajo estrés",
      texto: `Proyección de cartera en mora al ${proyeccionMora}% bajo escenario de estrés (+15% sobre línea base).`,
      icon: <IconWarning className="h-5 w-5 text-red-600" />,
      iconBg: "bg-red-50",
    },
    {
      titulo: "Tendencia 90 días",
      texto: "El modelo IA anticipa incremento moderado en alertas conductuales durante Q3.",
      icon: <IconTrend className="h-5 w-5 text-amber-600" />,
      iconBg: "bg-amber-50",
    },
    {
      titulo: "Capital expuesto",
      texto: `Exposición preventiva consolidada: ${formatearMoneda(metricas.capital_exposicion_preventiva)} en ${socios.length} casos analizados.`,
      icon: <IconChart className="h-5 w-5 text-coop-green-dark" />,
      iconBg: "bg-coop-mint",
    },
  ];

  return (
    <div>
      <PageHeader titulo="Análisis Predictivo" mostrarFiltroAgencia={false} />

      <section className="mb-8 grid gap-5 md:grid-cols-3">
        {insights.map((item) => (
          <KpiCard
            key={item.titulo}
            icon={item.icon}
            iconBg={item.iconBg}
            titulo={item.titulo}
            valor={cargando ? "—" : "Activo"}
            footer={item.texto}
          />
        ))}
      </section>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <GraficoPlaceholder titulo="Proyección de morosidad mensual" color="red" />
        <GraficoPlaceholder titulo="Evolución del score promedio de cartera" color="green" />
      </div>

      <Card className="card-coop">
        <h2 className="mb-4 text-lg font-semibold text-coop-green-darker">Insights del motor IA</h2>
        <ul className="space-y-4">
          <li className="flex gap-3 rounded-lg border border-coop-green/15 bg-coop-mint/50 p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coop-orange/20 text-sm font-bold text-coop-orange-dark">
              1
            </span>
            <div>
              <p className="font-medium text-slate-800">
                Simulación de cartera en mora bajo escenario de estrés
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Con un shock del 15% en ingresos, la mora proyectada alcanzaría {proyeccionMora}%
                del universo analizado ({metricas.total_socios_analizados?.toLocaleString("es-EC")}{" "}
                socios).
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
                {metricas.alertas_comportamentales_activas} alertas activas concentran el 68% del
                capital en exposición preventiva visible.
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
                Priorizar contacto preventivo en socios con score ≥ 65% y saldo de ahorro bajo el 5%
                del crédito vigente.
              </p>
            </div>
          </li>
        </ul>
      </Card>
    </div>
  );
}
