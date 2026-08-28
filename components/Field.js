export default function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-neutral-400">
        {label} {required && <span className="link-accent">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
