export default function ComingSoonPage({ title }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-10 text-center">
      <p className="text-sm font-medium text-neutral-300">{title}</p>
      <p className="mt-1 text-sm text-neutral-500">
        This section is coming in a later phase of the Nexus Pipeline build-out.
      </p>
    </div>
  );
}
