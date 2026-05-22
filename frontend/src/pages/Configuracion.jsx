import { useState } from "react";
import PageHeader from "../components/layout/PageHeader.jsx";
import Card from "../components/ui/Card.jsx";
import Tabs from "../components/ui/Tabs.jsx";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";

const TABS = [
  { id: "riesgo", label: "Parámetros de Riesgo" },
  { id: "notificaciones", label: "Notificaciones" },
  { id: "usuarios", label: "Usuarios" },
];

export default function Configuracion() {
  const [tab, setTab] = useState("riesgo");
  const [umbrales, setUmbrales] = useState({
    base: 12,
    mora: 45,
    descapitalizacion: 35,
    critico: 65,
    moderado: 40,
  });
  const [notificaciones, setNotificaciones] = useState({
    email: true,
    whatsapp: true,
    push: false,
  });

  const guardar = () => {
    window.alert("Configuración guardada correctamente.");
  };

  return (
    <div>
      <PageHeader titulo="Configuración" mostrarFiltroAgencia={false} />

      <Card>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />

        <div className="mt-6">
          {tab === "riesgo" && (
            <div className="grid gap-6 md:grid-cols-2 max-w-2xl">
              <Input
                label="Probabilidad base (%)"
                type="number"
                value={umbrales.base}
                onChange={(e) => setUmbrales({ ...umbrales, base: Number(e.target.value) })}
              />
              <Input
                label="Incremento por días de mora (%)"
                type="number"
                value={umbrales.mora}
                onChange={(e) => setUmbrales({ ...umbrales, mora: Number(e.target.value) })}
              />
              <Input
                label="Incremento por descapitalización (%)"
                type="number"
                value={umbrales.descapitalizacion}
                onChange={(e) =>
                  setUmbrales({ ...umbrales, descapitalizacion: Number(e.target.value) })
                }
              />
              <Input
                label="Umbral riesgo crítico (%)"
                type="number"
                value={umbrales.critico}
                onChange={(e) => setUmbrales({ ...umbrales, critico: Number(e.target.value) })}
              />
              <Input
                label="Umbral riesgo moderado (%)"
                type="number"
                value={umbrales.moderado}
                onChange={(e) => setUmbrales({ ...umbrales, moderado: Number(e.target.value) })}
              />
              <p className="md:col-span-2 text-sm text-gray-500">
                Estos umbrales alimentan el motor predictivo del dashboard y las etiquetas de
                riesgo en tiempo real.
              </p>
            </div>
          )}

          {tab === "notificaciones" && (
            <div className="max-w-md space-y-4">
              {[
                { key: "email", label: "Alertas por correo electrónico" },
                { key: "whatsapp", label: "WhatsApp preventivo automático" },
                { key: "push", label: "Notificaciones push en panel" },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3"
                >
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                  <input
                    type="checkbox"
                    checked={notificaciones[key]}
                    onChange={(e) =>
                      setNotificaciones({ ...notificaciones, [key]: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-coop-orange focus:ring-coop-orange"
                  />
                </label>
              ))}
            </div>
          )}

          {tab === "usuarios" && (
            <div className="max-w-2xl">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-gray-500">
                    <th className="pb-3 pr-4">Usuario</th>
                    <th className="pb-3 pr-4">Rol</th>
                    <th className="pb-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { nombre: "María Tulcán", rol: "Analista de Riesgo", activo: true },
                    { nombre: "Carlos Vega", rol: "Supervisor Cartera", activo: true },
                    { nombre: "Ana Morales", rol: "Operador Alertas", activo: false },
                  ].map((u) => (
                    <tr key={u.nombre} className="border-b border-gray-50">
                      <td className="py-3 font-medium text-slate-800">{u.nombre}</td>
                      <td className="py-3 text-gray-600">{u.rol}</td>
                      <td className="py-3">
                        <span
                          className={`text-xs font-semibold ${u.activo ? "text-emerald-600" : "text-gray-400"}`}
                        >
                          {u.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-8 flex gap-3">
            <Button onClick={guardar}>Guardar cambios</Button>
            <Button variant="secondary">Restablecer valores</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
