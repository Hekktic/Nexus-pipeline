import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions";

const NAV = [
  { href: "/log", label: "Log" },
  { href: "/pipeline", label: "Pipeline" },
];

export default function AppShell({ active, subtitle, children }) {
  return (
    <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-5 py-4">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-white">
            Nexus Pipeline
          </h1>
          <p className="truncate text-xs text-slate-400">{subtitle}</p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <nav className="flex gap-1 rounded-md border border-slate-800 bg-slate-950 p-0.5">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  active === item.href
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={signOut}>
            <button
              type="submit"
              title="Sign out"
              className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            >
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </div>

      <div className="p-5">{children}</div>
    </div>
  );
}
