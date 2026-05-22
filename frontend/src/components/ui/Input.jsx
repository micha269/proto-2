export default function Input({ label, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>}
      <input
        className={`w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-gray-400 focus:border-coop-orange focus:ring-2 focus:ring-coop-orange/25 ${className}`}
        {...props}
      />
    </label>
  );
}
