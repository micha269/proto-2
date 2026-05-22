import { useEffect, useState } from "react";
import PageHeader from "../components/layout/PageHeader.jsx";
import FichaSocioModal from "../components/socio/FichaSocioModal.jsx";
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
  const [socioFicha, setSocioFicha] = useState(null);

  const {
    socios,
    agencias,
    paginacion,
    cargando,
    sincronizando,
    error,
    setSearchTerm,
    setOficina,
    setPerfilTipoRiesgo,
    setPerfilRangoScore,
    page,
    setPage,
    pageSize,
    setPageSize,
  } = useDashboard();

  useEffect(() => {
    setSearchTerm(termino);
  }, [termino, setSearchTerm]);

  useEffect(() => {
    setOficina(agencia === "todas" ? "" : agencia);
  }, [agencia, setOficina]);

  useEffect(() => {
    setPerfilTipoRiesgo(tipoRiesgo);
  }, [tipoRiesgo, setPerfilTipoRiesgo]);

  useEffect(() => {
    setPerfilRangoScore(rangoScore);
  }, [rangoScore, setPerfilRangoScore]);

  useEffect(() => {
    return () => {
      setPerfilTipoRiesgo("todos");
      setPerfilRangoScore("todos");
      setPageSize(50);
    };
  }, [setPerfilTipoRiesgo, setPerfilRangoScore, setPageSize]);

  const totalFiltrados = paginacion?.total_socios ?? socios.length;
  const inicio = paginacion ? (paginacion.page - 1) * paginacion.page_size + 1 : 0;
  const fin = paginacion
    ? Math.min(paginacion.page * paginacion.page_size, paginacion.total_socios)
    : socios.length;

  const irAPagina = (nueva) => {
    if (!paginacion) return;
    const p = Math.max(1, Math.min(nueva, paginacion.total_pages));
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <PageHeader titulo="Búsqueda de Perfil" mostrarFiltroAgencia={false} />

      {error && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {error}
        </p>
      )}

      {sincronizando && (
        <p className="mb-4 rounded-lg border border-coop-green/30 bg-coop-mint px-4 py-3 text-sm text-coop-green-darker">
          Sincronizando con Supabase… La lista se actualizará al terminar.
        </p>
      )}

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
        <div className="mt-4 max-w-xs">
          <Select
            label="Registros por página"
            value={String(pageSize)}
            onChange={(e) => setPageSize(Number(e.target.value))}
            options={[
              { value: "50", label: "50 por página" },
              { value: "100", label: "100 por página" },
            ]}
          />
        </div>
      </Card>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          {cargando ? (
            "Buscando…"
          ) : (
            <>
              <strong>{totalFiltrados.toLocaleString("es-EC")}</strong> perfiles con los filtros
              {paginacion && paginacion.total_pages > 1 && (
                <>
                  {" "}
                  · mostrando {inicio.toLocaleString("es-EC")}–{fin.toLocaleString("es-EC")}
                </>
              )}
            </>
          )}
        </p>
        {paginacion && paginacion.total_pages > 1 && (
          <p className="text-sm font-medium text-coop-green-darker">
            Página {paginacion.page} de {paginacion.total_pages.toLocaleString("es-EC")}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cargando &&
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="mb-3 h-5 w-2/3 rounded bg-gray-200" />
              <div className="h-24 rounded bg-gray-100" />
            </Card>
          ))}
        {!cargando &&
          socios.map((socio) => {
            const riesgo = nivelRiesgo(socio.probabilidad_mora);
            return (
              <Card key={socio.token_seguridad} className="transition hover:shadow-md">
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
                    <dd className={socio.dias_mora > 0 ? "font-semibold text-red-600" : ""}>
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
                  onClick={() => setSocioFicha(socio)}
                >
                  Ver ficha resumida
                </Button>
              </Card>
            );
          })}
      </div>

      {!cargando && socios.length === 0 && (
        <Card className="py-12 text-center text-gray-500">
          No hay socios que coincidan con los filtros seleccionados.
        </Card>
      )}

      <FichaSocioModal
        socio={socioFicha}
        abierto={Boolean(socioFicha)}
        onCerrar={() => setSocioFicha(null)}
      />

      {paginacion && paginacion.total_pages > 1 && (
        <Card className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              Página <strong>{paginacion.page}</strong> de{" "}
              <strong>{paginacion.total_pages.toLocaleString("es-EC")}</strong> ·{" "}
              {totalFiltrados.toLocaleString("es-EC")} socios en total
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={!paginacion.has_prev || cargando}
                onClick={() => irAPagina(1)}
              >
                Primera
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!paginacion.has_prev || cargando}
                onClick={() => irAPagina(page - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!paginacion.has_next || cargando}
                onClick={() => irAPagina(page + 1)}
              >
                Siguiente
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!paginacion.has_next || cargando}
                onClick={() => irAPagina(paginacion.total_pages)}
              >
                Última
              </Button>
            </div>
          </div>
          {paginacion.total_pages <= 20 && (
            <div className="mt-4 flex flex-wrap gap-1">
              {Array.from({ length: paginacion.total_pages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={cargando}
                  onClick={() => irAPagina(n)}
                  className={`min-w-[2.25rem] rounded-lg px-2 py-1 text-sm font-medium transition ${
                    n === paginacion.page
                      ? "bg-coop-green text-white"
                      : "bg-gray-100 text-slate-700 hover:bg-coop-mint"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
          {paginacion.total_pages > 20 && (
            <p className="mt-3 text-xs text-gray-500">
              Use Primera / Anterior / Siguiente / Última para navegar entre las{" "}
              {paginacion.total_pages.toLocaleString("es-EC")} páginas.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
