const variants = {
  primary: "bg-coop-orange text-white hover:bg-coop-orange-dark shadow-sm",
  secondary: "border border-coop-green/35 bg-white text-coop-green-darker hover:bg-coop-mint",
  danger: "border border-red-200 text-red-600 hover:bg-red-50",
  ghost: "text-coop-green-darker hover:bg-coop-mint",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-lg font-semibold transition ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
