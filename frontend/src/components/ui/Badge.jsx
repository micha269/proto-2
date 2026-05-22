const variants = {
  critico: "bg-red-100 text-red-700",
  moderado: "bg-amber-100 text-amber-700",
  estable: "bg-emerald-100 text-emerald-700",
  revision: "bg-coop-mint text-coop-green-darker",
  neutral: "bg-slate-100 text-slate-600",
};

export default function Badge({ children, variant = "neutral", className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${variants[variant] || variants.neutral} ${className}`}
    >
      {children}
    </span>
  );
}
