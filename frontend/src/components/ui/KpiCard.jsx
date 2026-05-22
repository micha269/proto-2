import Card from "./Card.jsx";

export default function KpiCard({
  icon,
  titulo,
  valor,
  valorTitulo,
  footer,
  iconBg = "bg-coop-mint",
  footerClass = "",
}) {
  return (
    <Card className="card-coop relative min-w-0 overflow-hidden">
      <div className={`mb-4 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
        {icon}
      </div>
      <p className="text-sm font-medium text-coop-green-dark/80">{titulo}</p>
      <p
        className="mt-1 min-w-0 max-w-full text-[clamp(1.125rem,2.2vw,1.75rem)] font-bold leading-tight tracking-tight text-coop-green-darker tabular-nums"
        title={valorTitulo}
      >
        {valor}
      </p>
      {footer && (
        <p className={`mt-2 line-clamp-2 text-xs text-gray-500 ${footerClass}`}>{footer}</p>
      )}
    </Card>
  );
}
