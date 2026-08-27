export default function ComingSoonPage({ title }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-10 text-center">
      <p className="text-sm font-medium text-slate-300">{title}</p>
      <p className="mt-1 text-sm text-slate-500">
        This section is coming in a later phase of the Nexus Pipeline build-out.
      </p>
    </div>
  );
}
