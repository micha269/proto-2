import { nivelRiesgo } from "./risk.js";

export const BANDAS_HISTOGRAMA = [
  { key: "0-25", label: "0–25%", min: 0, max: 25, color: "bg-emerald-400" },
  { key: "25-40", label: "25–40%", min: 25, max: 40, color: "bg-coop-green" },
  { key: "40-65", label: "40–65%", min: 40, max: 65, color: "bg-coop-orange" },
  { key: "65-100", label: "65–100%", min: 65, max: 100.01, color: "bg-red-500" },
];

export function filtrarSociosPredictivo(socios, filtros) {
  const { tipoRiesgo, rangoScore, soloMora, calificacion } = filtros;

  return socios.filter((socio) => {
    const score = socio.probabilidad_mora ?? 0;
    const riesgo = nivelRiesgo(score).variant;

    if (tipoRiesgo !== "todos" && riesgo !== tipoRiesgo) return false;
    if (rangoScore === "alto" && score < 65) return false;
    if (rangoScore === "medio" && (score < 40 || score >= 65)) return false;
    if (rangoScore === "bajo" && score >= 40) return false;
    if (soloMora === "si" && !(socio.dias_mora > 0)) return false;
    if (soloMora === "no" && socio.dias_mora > 0) return false;
    if (calificacion !== "todas") {
      const cal = (socio.calificacion || "").trim().toUpperCase();
      if (cal !== calificacion.toUpperCase()) return false;
    }
    return true;
  });
}

export function histogramaScores(socios) {
  const conteo = Object.fromEntries(BANDAS_HISTOGRAMA.map((b) => [b.key, 0]));
  for (const socio of socios) {
    const score = socio.probabilidad_mora ?? 0;
    const banda = BANDAS_HISTOGRAMA.find((b) => score >= b.min && score < b.max);
    if (banda) conteo[banda.key] += 1;
  }
  const total = socios.length || 1;
  return BANDAS_HISTOGRAMA.map((b) => ({
    ...b,
    cantidad: conteo[b.key],
    porcentaje: Math.round((conteo[b.key] / total) * 100),
  }));
}

export function metricasPredictivo(socios, escenarioStressPct = 15) {
  const n = socios.length;
  if (!n) {
    return {
      scorePromedio: 0,
      tasaAlerta: 0,
      tasaMoraReal: 0,
      capitalEnRiesgo: 0,
      proyeccionStress: 0,
      criticos: 0,
      moderados: 0,
      estables: 0,
    };
  }

  let sumaScore = 0;
  let alertas = 0;
  let conMora = 0;
  let capitalRiesgo = 0;
  let criticos = 0;
  let moderados = 0;
  let estables = 0;

  for (const socio of socios) {
    const score = socio.probabilidad_mora ?? 0;
    sumaScore += score;
    if (score >= 40 || socio.dias_mora > 0) alertas += 1;
    if (socio.dias_mora > 0) conMora += 1;
    if (score >= 40) capitalRiesgo += socio.monto_credito || 0;

    const v = nivelRiesgo(score).variant;
    if (v === "critico") criticos += 1;
    else if (v === "moderado") moderados += 1;
    else estables += 1;
  }

  const tasaAlerta = (alertas / n) * 100;
  const factor = 1 + escenarioStressPct / 100;

  return {
    scorePromedio: sumaScore / n,
    tasaAlerta,
    tasaMoraReal: (conMora / n) * 100,
    capitalEnRiesgo: capitalRiesgo,
    proyeccionStress: Math.min(tasaAlerta * factor, 100),
    criticos,
    moderados,
    estables,
  };
}

export function concentracionPorAgencia(socios, limite = 8) {
  const mapa = new Map();

  for (const socio of socios) {
    const codigo = String(socio.nro_oficina ?? socio.credito?.nro_oficina ?? "—");
    if (!mapa.has(codigo)) {
      mapa.set(codigo, { codigo, total: 0, alertas: 0, sumaScore: 0 });
    }
    const item = mapa.get(codigo);
    item.total += 1;
    item.sumaScore += socio.probabilidad_mora ?? 0;
    if ((socio.probabilidad_mora ?? 0) >= 40 || socio.dias_mora > 0) {
      item.alertas += 1;
    }
  }

  return [...mapa.values()]
    .map((item) => ({
      ...item,
      tasaAlerta: item.total ? (item.alertas / item.total) * 100 : 0,
      scorePromedio: item.total ? item.sumaScore / item.total : 0,
    }))
    .sort((a, b) => b.tasaAlerta - a.tasaAlerta)
    .slice(0, limite);
}

export function topSociosRiesgo(socios, limite = 10) {
  return [...socios]
    .sort((a, b) => {
      const diff = (b.probabilidad_mora ?? 0) - (a.probabilidad_mora ?? 0);
      if (diff !== 0) return diff;
      return (b.dias_mora ?? 0) - (a.dias_mora ?? 0);
    })
    .slice(0, limite);
}

export function calificacionesDisponibles(socios) {
  const set = new Set();
  for (const s of socios) {
    const cal = (s.calificacion || "").trim();
    if (cal) set.add(cal.toUpperCase());
  }
  return [...set].sort();
}

export const BANDAS_DIAS_MORA = [
  { key: "0", label: "Al día (0 d)", min: 0, max: 1, color: "bg-coop-green", fill: "#3DAA4A" },
  { key: "1-30", label: "1–30 días", min: 1, max: 31, color: "bg-amber-400", fill: "#F39237" },
  { key: "31-90", label: "31–90 días", min: 31, max: 91, color: "bg-orange-500", fill: "#ea580c" },
  { key: "90+", label: "Más de 90 d", min: 91, max: Infinity, color: "bg-red-500", fill: "#ef4444" },
];

export const BANDAS_MONTO_CREDITO = [
  { key: "bajo", label: "< $5.000", min: 0, max: 5000, color: "bg-coop-green", fill: "#3DAA4A" },
  { key: "medio", label: "$5k – $15k", min: 5000, max: 15000, color: "bg-coop-orange", fill: "#F39237" },
  { key: "alto", label: "$15k – $50k", min: 15000, max: 50000, color: "bg-orange-500", fill: "#ea580c" },
  { key: "muy-alto", label: "> $50.000", min: 50000, max: Infinity, color: "bg-red-500", fill: "#ef4444" },
];

export const BANDAS_RATIO_AHORRO = [
  { key: "critico", label: "< 5% crédito", min: 0, max: 0.05, color: "bg-red-500", fill: "#ef4444" },
  { key: "bajo", label: "5% – 20%", min: 0.05, max: 0.2, color: "bg-coop-orange", fill: "#F39237" },
  { key: "medio", label: "20% – 50%", min: 0.2, max: 0.5, color: "bg-amber-400", fill: "#fbbf24" },
  { key: "saludable", label: "> 50%", min: 0.5, max: Infinity, color: "bg-coop-green", fill: "#3DAA4A" },
];

function _histogramaDesdeBandas(socios, bandas, obtenerValor) {
  const conteo = Object.fromEntries(bandas.map((b) => [b.key, 0]));
  for (const socio of socios) {
    const valor = obtenerValor(socio);
    const banda = bandas.find((b) => valor >= b.min && valor < b.max);
    if (banda) conteo[banda.key] += 1;
  }
  const total = socios.length || 1;
  return bandas.map((b) => ({
    ...b,
    cantidad: conteo[b.key],
    porcentaje: Math.round((conteo[b.key] / total) * 100),
  }));
}

export function histogramaDiasMora(socios) {
  return _histogramaDesdeBandas(socios, BANDAS_DIAS_MORA, (s) => Math.max(0, s.dias_mora ?? 0));
}

export function histogramaMontosCredito(socios) {
  return _histogramaDesdeBandas(socios, BANDAS_MONTO_CREDITO, (s) => s.monto_credito ?? 0);
}

export function histogramaRatioAhorro(socios) {
  return _histogramaDesdeBandas(socios, BANDAS_RATIO_AHORRO, (s) => {
    const credito = s.monto_credito || 0;
    const ahorro = s.saldo_disponible ?? 0;
    if (credito <= 0) return 1;
    return ahorro / credito;
  });
}

function _aPorcentajes(segmentos) {
  const total = segmentos.reduce((s, x) => s + x.valor, 0) || 1;
  return segmentos.map((s) => ({
    ...s,
    porcentaje: Math.round((s.valor / total) * 100),
  }));
}

export function pastelRiesgo(stats) {
  return _aPorcentajes([
    { id: "critico", label: "Crítico", valor: stats.criticos, color: "#ef4444" },
    { id: "moderado", label: "Moderado", valor: stats.moderados, color: "#F39237" },
    { id: "estable", label: "Estable", valor: stats.estables, color: "#3DAA4A" },
  ]).filter((s) => s.valor > 0);
}

export function pastelMora(socios) {
  const conMora = socios.filter((s) => (s.dias_mora ?? 0) > 0).length;
  const alDia = socios.length - conMora;
  return _aPorcentajes([
    { id: "mora", label: "Con mora", valor: conMora, color: "#ef4444" },
    { id: "aldia", label: "Al día", valor: alDia, color: "#3DAA4A" },
  ]).filter((s) => s.valor > 0);
}

export function pastelCalificacion(socios, limite = 6) {
  const mapa = new Map();
  for (const s of socios) {
    const cal = (s.calificacion || "Sin cal.").trim().toUpperCase() || "SIN CAL.";
    mapa.set(cal, (mapa.get(cal) || 0) + 1);
  }
  const colores = ["#3DAA4A", "#1F6B3D", "#F39237", "#ea580c", "#ef4444", "#6366f1", "#8b5cf6"];
  const items = [...mapa.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limite)
    .map(([label, valor], i) => ({
      id: label,
      label,
      valor,
      color: colores[i % colores.length],
    }));
  return _aPorcentajes(items);
}

export function pastelTipoCartera(socios, limite = 5) {
  const mapa = new Map();
  for (const s of socios) {
    const tipo = (s.tipo_cartera || "Sin tipo").trim() || "Sin tipo";
    mapa.set(tipo, (mapa.get(tipo) || 0) + 1);
  }
  const colores = ["#3DAA4A", "#F39237", "#1F6B3D", "#ef4444", "#0ea5e9", "#a855f7"];
  const items = [...mapa.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limite)
    .map(([label, valor], i) => ({
      id: label,
      label: label.length > 18 ? `${label.slice(0, 16)}…` : label,
      labelCompleto: label,
      valor,
      color: colores[i % colores.length],
    }));
  return _aPorcentajes(items);
}

export function pastelCapitalPorRiesgo(socios) {
  let critico = 0;
  let moderado = 0;
  let estable = 0;
  for (const s of socios) {
    const monto = s.monto_credito || 0;
    const v = nivelRiesgo(s.probabilidad_mora ?? 0).variant;
    if (v === "critico") critico += monto;
    else if (v === "moderado") moderado += monto;
    else estable += monto;
  }
  return _aPorcentajes([
    { id: "c", label: "Capital crítico", valor: critico, color: "#ef4444" },
    { id: "m", label: "Capital moderado", valor: moderado, color: "#F39237" },
    { id: "e", label: "Capital estable", valor: estable, color: "#3DAA4A" },
  ]).filter((s) => s.valor > 0);
}
