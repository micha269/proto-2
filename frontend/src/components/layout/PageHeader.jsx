import { IconSearch } from "../icons/NavIcons.jsx";

export default function PageHeader({
  titulo,
  busqueda = "",
  onBusquedaChange,
  placeholder = "Buscar socio por nombre o ID...",
  mostrarFiltroAgencia = true,
  agencias = [],
  agencia = "todas",
  onAgenciaChange,
}) {
  return (
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <h1 className="page-title text-2xl font-bold">{titulo}</h1>

      <div className="flex flex-wrap items-center gap-3">
        {mostrarFiltroAgencia && onAgenciaChange && (
          <select
            value={agencia}
            onChange={(e) => onAgenciaChange(e.target.value)}
            className="max-w-[220px] rounded-lg border border-coop-green/30 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-coop-orange focus:ring-2 focus:ring-coop-orange/25"
            title={
              agencias.length
                ? `${agencias.length} agencias en la base de datos`
                : "Cargando agencias..."
            }
          >
            <option value="todas">Todas las agencias ({agencias.length || "…"})</option>
            {agencias.map((item) => (
              <option key={item.codigo} value={item.codigo}>
                {item.label} ({item.socios?.toLocaleString("es-EC")})
              </option>
            ))}
          </select>
        )}

        {onBusquedaChange && (
          <div className="relative min-w-[280px]">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-coop-green-dark/50" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => onBusquedaChange(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-lg border border-coop-green/30 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-coop-orange focus:ring-2 focus:ring-coop-orange/25"
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => window.ctAbrirChat && window.ctAbrirChat()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#f0830a",
            color: "#fff",
            border: "none",
            borderRadius: "999px",
            padding: "6px 14px 6px 8px",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(240,131,10,0.35)",
          }}
        >
          <span
            style={{
              width: "28px",
              height: "28px",
              background: "#fff",
              color: "#f0830a",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "700",
            }}
          >
            MT
          </span>
          Asistente IA ▾
        </button>      </div>
    </header>
  );
}
