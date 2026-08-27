"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  Calculator,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileText,
  Kanban,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Plus,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { signOut } from "@/app/actions";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/brands", label: "Brands", icon: Building2 },
  { href: "/creators", label: "Creators", icon: Sparkles },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/calculator", label: "Calculator", icon: Calculator },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/finance", label: "Finance", icon: DollarSign },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

const COLLAPSE_KEY = "nexus:sidebar-collapsed";

function Logo({ collapsed }) {
  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500 text-sm font-bold text-slate-950">
        N
      </span>
      {!collapsed && (
        <span className="truncate text-sm font-semibold tracking-tight text-white">
          Nexus Pipeline
        </span>
      )}
    </div>
  );
}

function NavLinks({ pathname, onNavigate }) {
  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
      {NAV.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
              active
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
          >
            <Icon size={16} className="shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      // localStorage unavailable — default to expanded
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // ignore — this is just a UI convenience
      }
      return next;
    });
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3 md:hidden">
        <Logo collapsed={false} />
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-slate-800 bg-slate-950 py-3">
            <div className="flex items-center justify-between px-3 pb-3">
              <Logo collapsed={false} />
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            <div className="space-y-1 px-2 pt-2">
              <Link
                href="/log"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 rounded-md bg-amber-500 px-2.5 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400"
              >
                <Plus size={16} /> Add
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                >
                  <LogOut size={16} /> Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div
        className={`hidden shrink-0 flex-col border-r border-slate-800 bg-slate-950 py-3 transition-[width] md:flex ${
          collapsed ? "w-16" : "w-56"
        }`}
      >
        <div className="flex items-center justify-between px-3 pb-3">
          <Logo collapsed={collapsed} />
        </div>

        <NavLinks pathname={pathname} />

        <div className="space-y-1 px-2 pt-2">
          <Link
            href="/log"
            title="Add"
            className="flex items-center gap-2.5 rounded-md bg-amber-500 px-2.5 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400"
          >
            <Plus size={16} className="shrink-0" />
            {!collapsed && "Add"}
          </Link>

          <form action={signOut}>
            <button
              type="submit"
              title="Sign out"
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            >
              <LogOut size={16} className="shrink-0" />
              {!collapsed && "Sign out"}
            </button>
          </form>

          <button
            onClick={toggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-slate-500 hover:bg-slate-900 hover:text-slate-300"
          >
            {collapsed ? (
              <ChevronRight size={16} className="shrink-0" />
            ) : (
              <>
                <ChevronLeft size={16} className="shrink-0" /> Collapse
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
