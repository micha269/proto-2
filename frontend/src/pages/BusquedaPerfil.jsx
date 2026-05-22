import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/layout/PageHeader.jsx";
import Card from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Select from "../components/ui/Select.jsx";
import Input from "../components/ui/Input.jsx";
import { useDashboard } from "../context/DashboardContext.jsx";
import { formatearMoneda } from "../utils/format.js";
import { nivelRiesgo } from "../utils/risk.js";

export default function BusquedaPerfil() {
  const [termino, setTermino] = useState("");
  const [agencia, setAgencia] = useState("todas");
  const [tipoRiesgo, setTipoRiesgo] = useState("todos");
  const [rangoScore, setRangoScore] = useState("todos");

  const { socios, agencias, cargando, setSearchTerm, setOficina } = useDashboard();

  useEffect(() => {
    setSearchTerm(termino);
  }, [termino, setSearchTerm]);

  useEffect(() => {
    setOficina(agencia === "todas" ? "" : agencia);
  }, [agencia, setOficina]);

  const resultados = useMemo(() => {
    return socios.filter((socio) => {
      const score = socio.probabilidad_mora;
      const riesgo = nivelRiesgo(score).variant;

      if (tipoRiesgo !== "todos" && riesgo !== tipoRiesgo) return false;
      if (rangoScore === "alto" && score < 65) return false;
      if (rangoScore === "medio" && (score < 40 || score >= 65)) return false;
      if (rangoScore === "bajo" && score >= 40) return false;
      if (agencia !== "todas") {
        const oficina = String(socio.nro_oficina ?? socio.credito?.nro_oficina ?? "");
        if (oficina !== agencia) return false;
      }
      return true;
    });
  }, [socios, tipoRiesgo, rangoScore, agencia]);

  return (
    <div>
      <PageHeader
        titulo="Búsqueda de Perfil"
        mostrarFiltroAgencia={false}
      />

      <Card className="mb-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Buscador avanzado</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Token o identificador"
            placeholder="Ej: 908239, SOCIO_CRYPT..."
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
          />
          <Select
            label={`Agencia (${agencias.length} en BD)`}
            value={agencia}
            onChange={(e) => setAgencia(e.target.value)}
            options={[
              { value: "todas", label: "Todas las agencias" },
              ...agencias.map((item) => ({
                value: item.codigo,
                label: `${item.label} (${item.socios?.toLocaleString("es-EC")} socios)`,
              })),
            ]}
          />
          <Select
            label="Tipo de Riesgo"
            value={tipoRiesgo}
            onChange={(e) => setTipoRiesgo(e.target.value)}
            options={[
              { value: "todos", label: "Todos" },
              { value: "critico", label: "Crítico" },
              { value: "moderado", label: "Moderado" },
              { value: "estable", label: "Estable" },
            ]}
          />
          <Select
            label="Rango de Score"
            value={rangoScore}
            onChange={(e) => setRangoScore(e.target.value)}
            options={[
              { value: "todos", label: "Todos los rangos" },
              { value: "alto", label: "65 – 100" },
              { value: "medio", label: "40 – 64" },
              { value: "bajo", label: "0 – 39" },
            ]}
          />
        </div>
      </Card>

      <p className="mb-4 text-sm text-gray-500">
        {cargando ? "Buscando..." : `${resultados.length} perfiles encontrados`}
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {resultados.map((socio) => {
          const riesgo = nivelRiesgo(socio.probabilidad_mora);
          return (
            <Card key={socio.token_seguridad} className="hover:shadow-md transition">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{socio.nombre_anon}</p>
                  <p className="font-mono text-xs text-gray-500">{socio.token_seguridad}</p>
                </div>
                <Badge variant={riesgo.variant}>{riesgo.label}</Badge>
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Score IA</dt>
                  <dd className="font-bold text-slate-800">{socio.probabilidad_mora}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Crédito</dt>
                  <dd>{formatearMoneda(socio.monto_credito)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Días mora</dt>
                  <dd className={socio.dias_mora > 0 ? "text-red-600 font-semibold" : ""}>
                    {socio.dias_mora}
                  </dd>
                </div>
                {socio.calificacion && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Calificación</dt>
                    <dd>{socio.calificacion}</dd>
                  </div>
                )}
                {socio.credito?.nro_oficina != null && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Oficina</dt>
                    <dd>{socio.credito.nro_oficina}</dd>
                  </div>
                )}
                {socio.credito?.tasa_int_vig != null && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Tasa vigente</dt>
                    <dd>{socio.credito.tasa_int_vig}%</dd>
                  </div>
                )}
              </dl>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4 w-full"
                onClick={() => window.alert(`Ficha completa: ${socio.nombre_anon}`)}
              >
                Ver ficha resumida
              </Button>
            </Card>
          );
        })}
      </div>

      {!cargando && resultados.length === 0 && (
        <Card className="text-center text-gray-500 py-12">
          No hay socios que coincidan con los filtros seleccionados.
        </Card>
      )}
    </div>
  );
}
