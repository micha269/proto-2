import { useEffect, useState } from "react";
import axios from "axios";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import { formatearMoneda, formatearFecha } from "../../utils/format.js";
import { claseScore, nivelRiesgo } from "../../utils/risk.js";

const API_BASE = import.meta.env.VITE_API_URL || "";

function fila(label, valor, { destacado = false, alerta = false } = {}) {
  if (valor === null || valor === undefined || valor === "") return null;
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
      <dt className="text-gray-500 shrink-0">{label}</dt>
      <dd
        className={`text-right font-medium ${
          alerta ? "text-red-600" : destacado ? "text-slate-900 font-bold" : "text-slate-800"
        }`}
      >
        {valor}
      </dd>
    </div>
  );
}

function seccion(titulo, children) {
  return (
    <section className="rounded-xl border border-coop-green/15 bg-white p-4">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-coop-green-darker">{titulo}</h3>
      <dl className="text-sm">{children}</dl>
    </section>
  );
}

function disparador(socio) {
  if (socio.dias_mora > 0) return `Mora activa: ${socio.dias_mora} días`;
  if (socio.calificacion) return `Calificación ${socio.calificacion}`;
  if (socio.probabilidad_mora >= 65) return "Score crítico — contacto preventivo urgente";
  if (socio.probabilidad_mora >= 40) return "Patrón de riesgo moderado";
  return "Monitoreo estándar";
}

export default function FichaSocioModal({ socio, abierto, onCerrar }) {
  const [datos, setDatos] = useState(socio);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!abierto || !socio) return;

    setDatos(socio);
    setError("");
    setCargando(true);

    const controller = new AbortController();
    axios
      .get(`${API_BASE}/api/socio/${encodeURIComponent(socio.token_seguridad)}/`, {
        signal: controller.signal,
        timeout: 30000,
      })
      .then(({ data }) => setDatos(data))
      .catch((err) => {
        if (!axios.isCancel(err)) {
          setError("No se pudo actualizar desde el servidor. Se muestran datos de la lista.");
        }
      })
      .finally(() => setCargando(false));

    return () => controller.abort();
  }, [abierto, socio]);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [abierto, onCerrar]);

  if (!abierto || !socio) return null;

  const s = datos || socio;
  const riesgo = nivelRiesgo(s.probabilidad_mora);
  const c = s.credito || {};
  const a = s.ahorro || {};
  const ratioAhorro =
    s.monto_credito > 0 ? ((s.saldo_disponible ?? 0) / s.monto_credito) * 100 : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ficha-socio-titulo"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        aria-label="Cerrar ficha"
        onClick={onCerrar}
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-coop-mint shadow-2xl">
        <div className="border-b border-coop-green/20 bg-gradient-to-r from-coop-green-dark to-coop-green-darker px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-white/80">Ficha resumida</p>
              <h2 id="ficha-socio-titulo" className="mt-1 truncate text-xl font-bold">
                {s.nombre_anon}
              </h2>
              <p className="mt-1 font-mono text-xs text-white/70 break-all">{s.token_seguridad}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <Badge variant={riesgo.variant}>{riesgo.label}</Badge>
              <span className={`text-3xl font-bold tabular-nums ${claseScore(s.probabilidad_mora)}`}>
                {Math.round(s.probabilidad_mora)}%
              </span>
              <span className="text-xs text-white/80">Score IA mora</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {cargando && (
            <p className="text-center text-sm text-gray-500">Actualizando datos del socio…</p>
          )}
          {error && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {error}
            </p>
          )}

          {seccion(
            "Análisis de riesgo",
            <>
              {fila("Disparador conductual", disparador(s))}
              {fila("Días de mora", s.dias_mora > 0 ? `${s.dias_mora} días` : "Al día", {
                alerta: s.dias_mora > 0,
              })}
              {fila("Calificación", s.calificacion || c.calificacion)}
              {fila("Tipo de cartera", s.tipo_cartera || c.tipo_cartera)}
              {fila("Estado operación", s.estado_op || c.estado_op)}
            </>
          )}

          {seccion(
            "Crédito vigente",
            <>
              {fila("Monto crédito", formatearMoneda(s.monto_credito), { destacado: true })}
              {fila("Saldo capital", formatearMoneda(c.saldo_capital ?? s.saldo_capital))}
              {fila("Saldo vencido", formatearMoneda(c.saldo_vencido), { alerta: (c.saldo_vencido ?? 0) > 0 })}
              {fila("Saldo por vencer", formatearMoneda(c.saldo_por_vencer))}
              {fila("Cuotas en atraso", c.nro_cuotas_atra ?? "—", {
                alerta: (c.nro_cuotas_atra ?? 0) > 0,
              })}
              {fila("Tasa interés vigente", c.tasa_int_vig != null ? `${c.tasa_int_vig}%` : null)}
              {fila("Plazo / cuotas", c.plazo != null ? `${c.plazo} meses · ${c.nro_cuotas ?? "—"} cuotas` : null)}
              {fila("Día de pago", c.dia_pago)}
              {fila("Fecha concesión", c.fecha_concesion_op)}
              {fila("Fecha fin", c.fecha_fin_op)}
              {fila("Último pago", c.fecha_ult_pag)}
              {fila("Fecha corte", s.fecha_corte || c.fecha_corte)}
            </>
          )}

          {seccion(
            "Ahorros",
            <>
              {fila("Saldo disponible", formatearMoneda(s.saldo_disponible ?? a.saldo_disponible), {
                destacado: true,
              })}
              {fila(
                "Cobertura vs crédito",
                ratioAhorro != null ? `${ratioAhorro.toFixed(1)}% del crédito` : null,
                { alerta: ratioAhorro != null && ratioAhorro < 5 }
              )}
              {fila("Fecha corte ahorro", a.fecha_corte_ahorro)}
            </>
          )}

          {seccion(
            "Ubicación y perfil",
            <>
              {fila("Agencia / oficina", s.nro_oficina ?? c.nro_oficina)}
              {fila("Ingresos socio", c.ingresos_socio != null ? formatearMoneda(c.ingresos_socio) : null)}
              {fila("Egresos socio", c.egresos_socio != null ? formatearMoneda(c.egresos_socio) : null)}
              {fila("Créditos activos (hist.)", c.nro_creditos)}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-coop-green/15 bg-white px-6 py-4">
          <p className="text-xs text-gray-500">
            Cooperativa Tulcán · RISK-CORE · {formatearFecha()}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(s.token_seguridad);
              }}
            >
              Copiar ID
            </Button>
            <Button size="sm" onClick={onCerrar}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
