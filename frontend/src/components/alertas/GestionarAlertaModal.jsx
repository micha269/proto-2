import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import Select from "../ui/Select.jsx";
import FichaSocioModal from "../socio/FichaSocioModal.jsx";
import { formatearMoneda } from "../../utils/format.js";
import {
  ESTADOS_VALIDOS,
  guardarEstadoAlerta,
  obtenerEstadoAlerta,
} from "../../utils/alertasStore.js";
import { claseScore, nivelRiesgo } from "../../utils/risk.js";

function disparadorAlerta(socio) {
  if (socio.dias_mora > 0) return `Mora de ${socio.dias_mora} días detectada`;
  if (socio.calificacion) return `Calificación ${socio.calificacion} · score ${socio.probabilidad_mora}%`;
  return `Score de riesgo elevado (${socio.probabilidad_mora}%)`;
}

export default function GestionarAlertaModal({ socio, abierto, onCerrar, onGuardado }) {
  const [estado, setEstado] = useState("Pendiente");
  const [notas, setNotas] = useState("");
  const [guardadoOk, setGuardadoOk] = useState(false);
  const [verFicha, setVerFicha] = useState(false);

  useEffect(() => {
    if (!abierto || !socio) return;
    const prev = obtenerEstadoAlerta(socio.token_seguridad);
    setEstado(prev.estado);
    setNotas(prev.notas);
    setGuardadoOk(false);
  }, [abierto, socio]);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !verFicha) onCerrar();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [abierto, onCerrar, verFicha]);

  if (!abierto || !socio) return null;

  const riesgo = nivelRiesgo(socio.probabilidad_mora);

  const aplicarAccion = (nuevoEstado) => {
    setEstado(nuevoEstado);
    guardar(nuevoEstado);
  };

  const guardar = (estadoFinal = estado) => {
    guardarEstadoAlerta(socio.token_seguridad, { estado: estadoFinal, notas });
    setGuardadoOk(true);
    onGuardado?.({ token: socio.token_seguridad, estado: estadoFinal, notas });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <button
          type="button"
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
          aria-label="Cerrar"
          onClick={onCerrar}
        />

        <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="border-b border-coop-orange/30 bg-gradient-to-r from-coop-orange to-coop-orange-dark px-6 py-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/85">Gestión de alerta</p>
            <h2 className="mt-1 text-xl font-bold">{socio.nombre_anon}</h2>
            <p className="font-mono text-xs text-white/75 break-all">{socio.token_seguridad}</p>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {guardadoOk && (
              <p className="rounded-lg border border-coop-green/30 bg-coop-mint px-3 py-2 text-sm text-coop-green-darker">
                Alerta actualizada correctamente. Visible en Centro de Alertas.
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-2">
                <Badge variant={riesgo.variant}>{riesgo.label}</Badge>
                <span className={`text-2xl font-bold ${claseScore(socio.probabilidad_mora)}`}>
                  {Math.round(socio.probabilidad_mora)}%
                </span>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p>Crédito: {formatearMoneda(socio.monto_credito, { compact: true })}</p>
                <p className={socio.dias_mora > 0 ? "font-semibold text-red-600" : ""}>
                  Mora: {socio.dias_mora > 0 ? `${socio.dias_mora} días` : "Al día"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Disparador conductual</p>
              <p className="mt-1 text-sm text-slate-800">{disparadorAlerta(socio)}</p>
            </div>

            <Select
              label="Estado de la alerta"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              options={ESTADOS_VALIDOS.map((e) => ({ value: e, label: e }))}
            />

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Notas del analista</span>
              <textarea
                rows={3}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej: Contacto telefónico, compromiso de pago, seguimiento en 7 días…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-coop-orange focus:ring-2 focus:ring-coop-orange/25"
              />
            </label>

            <p className="text-xs text-gray-500">Acciones rápidas</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => aplicarAccion("Resuelta")}>
                Resolver
              </Button>
              <Button size="sm" onClick={() => aplicarAccion("Escalada")}>
                Escalar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => aplicarAccion("En Revisión")}>
                En revisión
              </Button>
              <Button size="sm" variant="danger" onClick={() => aplicarAccion("Falso Positivo")}>
                Falso positivo
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 bg-gray-50/80 px-6 py-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => setVerFicha(true)}>
                Ver ficha
              </Button>
              <Link
                to="/centro-alertas"
                className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold text-coop-green-darker hover:bg-coop-mint"
                onClick={onCerrar}
              >
                Ir a Centro de Alertas →
              </Link>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={onCerrar}>
                Cancelar
              </Button>
              <Button size="sm" onClick={() => guardar()}>
                Guardar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <FichaSocioModal socio={socio} abierto={verFicha} onCerrar={() => setVerFicha(false)} />
    </>
  );
}
