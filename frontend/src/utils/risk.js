export function nivelRiesgo(score) {
  if (score >= 65) return { label: "Crítico", variant: "critico" };
  if (score >= 40) return { label: "Moderado", variant: "moderado" };
  return { label: "Estable", variant: "estable" };
}

export function claseScore(score) {
  if (score >= 65) return "text-red-600";
  if (score >= 40) return "text-coop-orange-dark";
  return "text-coop-green-dark";
}
