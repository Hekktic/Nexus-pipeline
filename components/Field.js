export default function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-400">
        {label} {required && <span className="text-slate-300">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
