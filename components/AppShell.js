import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions";
import { displayName } from "@/lib/constants";

const ROLE_LABEL = {
  logger: "Logger",
  closer: "Closer",
  admin: "Admin",
};

export default function AppShell({ profile, subtitle, children }) {
  const name = displayName(profile) || "Signed in";

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
          <div className="hidden text-right sm:block">
            <p className="truncate text-xs text-slate-300">{name}</p>
            <p className="text-[10px] uppercase tracking-wide text-amber-500">
              {ROLE_LABEL[profile?.role] || "No role"}
            </p>
          </div>
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
