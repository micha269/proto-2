export default function Select({ label, options = [], className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>}
      <select
        className={`w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-coop-orange focus:ring-2 focus:ring-coop-orange/25 ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
