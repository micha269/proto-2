import Card from "../ui/Card.jsx";

function gradienteConico(segmentos) {
  if (!segmentos.length) return "conic-gradient(#e5e7eb 0% 100%)";
  let acum = 0;
  const stops = segmentos
    .filter((s) => s.valor > 0)
    .map((s) => {
      const fin = acum + s.porcentaje;
      const stop = `${s.color} ${acum}% ${fin}%`;
      acum = fin;
      return stop;
    });
  return `conic-gradient(${stops.join(", ")})`;
}

export function GraficoPastel({
  titulo,
  subtitulo,
  segmentos = [],
  cargando,
  unidad = "socios",
  tamano = 200,
}) {
  const total = segmentos.reduce((s, x) => s + x.valor, 0);

  return (
    <Card>
      <h3 className="mb-1 text-sm font-semibold text-slate-800">{titulo}</h3>
      {subtitulo && <p className="mb-4 text-xs text-gray-500">{subtitulo}</p>}
      {cargando ? (
        <div className="flex h-56 items-center justify-center text-sm text-gray-400">Generando gráfico…</div>
      ) : total === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-gray-400">Sin datos en la muestra</div>
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <div
            className="relative shrink-0 rounded-full shadow-inner"
            style={{
              width: tamano,
              height: tamano,
              background: gradienteConico(segmentos),
            }}
            role="img"
            aria-label={titulo}
          >
            <div
              className="absolute flex flex-col items-center justify-center rounded-full bg-white shadow-sm"
              style={{
                inset: "22%",
              }}
            >
              <span className="text-lg font-bold text-slate-800">
                {unidad === "socios"
                  ? total.toLocaleString("es-EC")
                  : new Intl.NumberFormat("es-EC", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(total)}
              </span>
              <span className="text-[10px] text-gray-500">{unidad}</span>
            </div>
          </div>

          <ul className="w-full flex-1 space-y-2.5">
            {segmentos.map((seg) => (
              <li key={seg.id} className="flex items-center gap-2 text-sm">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: seg.color }}
                />
                <span
                  className="min-w-0 flex-1 truncate text-gray-700"
                  title={seg.labelCompleto || seg.label}
                >
                  {seg.label}
                </span>
                <span className="shrink-0 font-semibold text-slate-800">{seg.porcentaje}%</span>
                <span className="shrink-0 text-xs text-gray-400">
                  ({seg.valor.toLocaleString("es-EC")})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

export function HistogramaVertical({
  titulo,
  subtitulo,
  datos = [],
  cargando,
  altura = 208,
  colorBarras,
}) {
  const max = Math.max(...datos.map((d) => d.cantidad), 1);

  return (
    <Card>
      <h3 className="mb-1 text-sm font-semibold text-slate-800">{titulo}</h3>
      {subtitulo && <p className="mb-4 text-xs text-gray-500">{subtitulo}</p>}
      {cargando ? (
        <div className="flex items-center justify-center text-sm text-gray-400" style={{ height: altura }}>
          Cargando…
        </div>
      ) : (
        <div className="relative px-1" style={{ height: altura + 48 }}>
          <div
            className="absolute left-0 right-0 border-b border-dashed border-gray-200"
            style={{ bottom: 56, top: 8 }}
          />
          <div
            className="absolute left-0 border-l border-gray-200 text-[9px] text-gray-400"
            style={{ bottom: 56, top: 8, width: 28 }}
          >
            <span className="absolute -top-0.5 left-1">{max}</span>
            <span className="absolute left-1 top-1/2 -translate-y-1/2">{Math.round(max / 2)}</span>
            <span className="absolute bottom-0 left-1">0</span>
          </div>
          <div
            className="ml-8 flex items-end justify-between gap-1.5"
            style={{ height: altura, paddingBottom: 0 }}
          >
            {datos.map((banda) => (
              <div key={banda.key} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[10px] font-semibold text-slate-600">{banda.cantidad}</span>
                <div
                  className={`w-full max-w-10 rounded-t transition-all ${colorBarras || banda.color}`}
                  style={{
                    height: `${Math.max((banda.cantidad / max) * (altura - 24), banda.cantidad > 0 ? 6 : 2)}px`,
                    backgroundColor: banda.fill,
                  }}
                  title={`${banda.label}: ${banda.porcentaje}% (${banda.cantidad})`}
                />
                <span className="max-w-full truncate text-center text-[9px] leading-tight text-gray-500">
                  {banda.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export function HistogramaHorizontal({ titulo, subtitulo, datos = [], cargando }) {
  const max = Math.max(...datos.map((d) => d.cantidad), 1);

  return (
    <Card>
      <h3 className="mb-1 text-sm font-semibold text-slate-800">{titulo}</h3>
      {subtitulo && <p className="mb-4 text-xs text-gray-500">{subtitulo}</p>}
      {cargando ? (
        <div className="flex h-48 items-center justify-center text-sm text-gray-400">Cargando…</div>
      ) : (
        <ul className="space-y-3">
          {datos.map((banda) => (
            <li key={banda.key}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-slate-700">{banda.label}</span>
                <span className="text-gray-500">
                  {banda.cantidad} · {banda.porcentaje}%
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.max((banda.cantidad / max) * 100, banda.cantidad > 0 ? 4 : 0)}%`,
                    backgroundColor: banda.fill || "#3DAA4A",
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
