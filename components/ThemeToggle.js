"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

const THEME_KEY = "nexus:theme";

const THEMES = [
  { value: "mono", label: "Monochrome", swatch: "#ffffff" },
  { value: "blue", label: "Blue", swatch: "#2563eb" },
  { value: "green", label: "Green", swatch: "#059669" },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useState("mono");

  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") || "mono");
  }, []);

  const choose = (value) => {
    setTheme(value);
    if (value === "mono") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", value);
    }
    try {
      localStorage.setItem(THEME_KEY, value);
    } catch {
      // ignore — this is just a UI convenience, falls back to default next load
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {THEMES.map((t) => {
        const active = theme === t.value;
        return (
          <button
            key={t.value}
            onClick={() => choose(t.value)}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
              active
                ? "border-neutral-600 bg-neutral-900 text-white"
                : "border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
            }`}
          >
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-neutral-700"
              style={{ backgroundColor: t.swatch }}
            >
              {active && <Check size={11} className={t.value === "mono" ? "text-neutral-950" : "text-white"} />}
            </span>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
