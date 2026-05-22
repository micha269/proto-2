const STORAGE_KEY = "cooptech_alertas_gestion";

const ESTADOS_VALIDOS = [
  "Pendiente",
  "En Revisión",
  "Resuelta",
  "Escalada",
  "Falso Positivo",
];

function leerMapa() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function guardarMapa(mapa) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapa));
  } catch {
    /* ignore quota */
  }
}

export function obtenerEstadoAlerta(token) {
  if (!token) return { estado: "Pendiente", notas: "", actualizado: null };
  const mapa = leerMapa();
  const item = mapa[token];
  if (!item) return { estado: "Pendiente", notas: "", actualizado: null };
  return {
    estado: ESTADOS_VALIDOS.includes(item.estado) ? item.estado : "Pendiente",
    notas: item.notas || "",
    actualizado: item.actualizado || null,
  };
}

export function guardarEstadoAlerta(token, { estado, notas }) {
  if (!token) return;
  const mapa = leerMapa();
  mapa[token] = {
    estado: ESTADOS_VALIDOS.includes(estado) ? estado : "Pendiente",
    notas: (notas || "").trim(),
    actualizado: new Date().toISOString(),
  };
  guardarMapa(mapa);
  window.dispatchEvent(new CustomEvent("cooptech-alertas-actualizadas", { detail: { token } }));
}

export function estadoInicialDesdeSocio(socio) {
  const guardado = obtenerEstadoAlerta(socio?.token_seguridad);
  if (guardado.actualizado) return guardado.estado;
  if ((socio?.probabilidad_mora ?? 0) >= 65 || (socio?.dias_mora ?? 0) > 0) return "Pendiente";
  return "En Revisión";
}

export { ESTADOS_VALIDOS };
