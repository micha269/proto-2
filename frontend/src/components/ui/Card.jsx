export default function Card({ children, className = "", padding = "p-6" }) {
  return (
    <article
      className={`rounded-xl border border-gray-100 bg-white shadow-sm ${padding} ${className}`}
    >
      {children}
    </article>
  );
}
