/**
 * Referencia de clases Tailwind usadas en la app (ayuda al escaneo en v4).
 */
export const TAILWIND_SAFELIST = [
  "flex", "grid", "hidden", "block", "min-h-screen", "min-w-0", "flex-1", "flex-wrap",
  "items-center", "items-start", "items-end", "justify-between", "gap-1", "gap-2", "gap-3", "gap-4", "gap-5", "gap-6",
  "space-y-1", "space-y-2", "space-y-4", "divide-y", "divide-gray-100",
  "w-5", "h-5", "w-8", "h-8", "w-10", "h-10", "w-64", "w-full", "min-w-[280px]", "max-w-2xl", "max-w-7xl", "max-h-[65vh]",
  "ml-64", "p-0", "p-4", "p-5", "p-6", "p-8", "px-3", "px-4", "px-5", "px-6", "py-2", "py-2.5", "py-3", "py-4", "py-5", "py-12", "mb-1", "mb-2", "mb-3", "mb-4", "mb-5", "mb-6", "mb-8", "mt-1", "mt-2", "mt-3", "mt-4", "mt-8", "md:col-span-2", "md:grid-cols-2", "md:grid-cols-3", "lg:grid-cols-2", "xl:grid-cols-3", "lg:grid-cols-2",
  "bg-white", "bg-gray-50", "bg-gray-100", "bg-slate-50", "bg-coop-green", "bg-coop-green-dark", "bg-coop-green-darker", "bg-coop-orange", "bg-coop-orange-dark", "bg-coop-mint", "bg-coop-orange/20", "bg-red-50", "bg-amber-50", "bg-emerald-50", "bg-emerald-100", "bg-amber-100", "bg-red-100",
  "text-white", "text-white/85", "text-white/50", "text-white/40", "text-white/25", "text-white/90", "text-slate-800", "text-slate-700", "text-slate-600", "text-slate-500", "text-gray-400", "text-gray-500", "text-gray-600", "text-coop-green", "text-coop-green-dark", "text-coop-green-darker", "text-coop-orange", "text-coop-orange-dark", "text-red-600", "text-amber-600", "text-amber-700", "text-emerald-600", "text-emerald-700",
  "text-xs", "text-sm", "text-lg", "text-xl", "text-2xl", "text-3xl",
  "min-w-0", "max-w-full", "shrink-0", "leading-tight", "tracking-tight", "tabular-nums", "line-clamp-2", "overflow-hidden",
  "font-medium", "font-semibold", "font-bold", "font-mono", "uppercase", "tracking-wide", "leading-tight",
  "rounded-lg", "rounded-xl", "rounded-2xl", "rounded-full",
  "border", "border-t", "border-b", "border-l", "border-white/10", "border-gray-50", "border-gray-100", "border-gray-200", "border-coop-green/15", "border-coop-green/20", "border-coop-green/30", "border-coop-green/35", "border-red-200", "border-amber-200",
  "shadow-sm", "shadow-md", "shadow-lg", "overflow-hidden", "overflow-x-auto",
  "fixed", "inset-y-0", "left-0", "z-40", "z-50", "sticky", "top-0",
  "transition", "hover:bg-white/10", "hover:bg-gray-50", "hover:bg-gray-200", "hover:bg-coop-mint", "hover:bg-coop-mint/60", "hover:shadow-md", "hover:bg-emerald-50", "hover:bg-red-50",
  "focus:border-coop-orange", "focus:ring-2", "focus:ring-coop-orange/25", "outline-none",
  "cursor-pointer", "shrink-0", "opacity-80", "animate-pulse",
  "from-coop-green", "to-coop-green/50", "from-coop-orange", "to-coop-orange/50", "from-amber-500", "to-amber-300", "from-red-500", "to-red-300", "bg-gradient-to-t",
  "pointer-events-none", "absolute", "relative", "-mb-px", "pl-10", "pr-4",
].join(" ");

export default function TailwindSafelist() {
  return <div className={TAILWIND_SAFELIST} aria-hidden="true" style={{ display: "none" }} />;
}
