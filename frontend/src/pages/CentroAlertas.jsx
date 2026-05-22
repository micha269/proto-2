import { useMemo, useState } from "react";
import PageHeader from "../components/layout/PageHeader.jsx";
import Card from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import { useDashboard } from "../context/DashboardContext.jsx";
import { formatearFecha } from "../utils/format.js";
import { nivelRiesgo } from "../utils/risk.js";

const FILTROS = [
  { id: "todas", label: "Todas" },
  { id: "criticas", label: "Críticas" },
  { id: "moderadas", label: "Moderadas" },
  { id: "revision", label: "En Revisión" },
];

const ESTADOS = ["Pendiente", "En Revisión", "Resuelta", "Escalada", "Falso Positivo"];

function crearAlertas(socios) {
  return socios.map((socio, index) => {
    const riesgo = nivelRiesgo(socio.probabilidad_mora);
    let categoria = "moderadas";
    if (riesgo.variant === "critico") categoria = "criticas";
    if (index % 4 === 0) categoria = "revision";

    return {
      id: socio.token_seguridad,
      socio,
      categoria,
      estado: ESTADOS[index % ESTADOS.length],
      disparador:
        socio.dias_mora > 0
          ? `Mora de ${socio.dias_mora} días detectada`
          : `Score de riesgo elevado (${socio.probabilidad_mora}%)`,
      fecha: formatearFecha(),
    };
  });
}

export default function CentroAlertas() {
  const [filtro, setFiltro] = useState("todas");
  const { socios, cargando } = useDashboard();
  const [alertas, setAlertas] = useState([]);

  const alertasBase = useMemo(() => crearAlertas(socios), [socios]);

  const lista = useMemo(() => {
    const fuente = alertas.length ? alertas : alertasBase;
    if (filtro === "todas") return fuente;
    return fuente.filter((a) => a.categoria === filtro);
  }, [alertas, alertasBase, filtro]);

  const cambiarEstado = (id, nuevoEstado) => {
    setAlertas((prev) => {
      const base = prev.length ? prev : alertasBase;
      return base.map((a) => (a.id === id ? { ...a, estado: nuevoEstado } : a));
    });
  };

  return (
    <div>
      <PageHeader titulo="Centro de Alertas" mostrarFiltroAgencia={false} />

      <Card className="mb-6">
        <p className="mb-3 text-sm text-gray-500">Gestión de alertas del día</p>
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
              {f.label}
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
                        <p className="font-semibold text-slate-800">
                          {alerta.socio.nombre_anon}
                        </p>
                        <Badge variant={riesgo.variant}>{riesgo.label}</Badge>
                        <Badge variant="neutral">{alerta.estado}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{alerta.disparador}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {alerta.socio.token_seguridad} · {alerta.fecha}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => cambiarEstado(alerta.id, "Resuelta")}
                      >
                        Resolver
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => cambiarEstado(alerta.id, "Escalada")}
                      >
                        Escalar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => cambiarEstado(alerta.id, "Falso Positivo")}
                      >
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
          <p className="p-8 text-center text-gray-500">No hay alertas en esta categoría.</p>
        )}
      </Card>
    </div>
  );
}
