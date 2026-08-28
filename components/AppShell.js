import Sidebar from "@/components/Sidebar";

export default function AppShell({ subtitle, children }) {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
          {subtitle && <p className="mb-4 text-sm text-neutral-400">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
