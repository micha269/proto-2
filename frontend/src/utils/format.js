export function formatearMoneda(valor, { compact = false } = {}) {
  const numero = Number(valor) || 0;

  if (compact && Math.abs(numero) >= 1_000_000) {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 2,
    }).format(numero);
  }

  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numero);
}

export function formatearFecha(fecha = new Date()) {
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(fecha);
}
