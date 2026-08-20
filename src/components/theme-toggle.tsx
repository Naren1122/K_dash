"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, mounted, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-2xs transition-all duration-200 focus:outline-none cursor-pointer ${
        isDark
          ? "border-amber-500/50 bg-gradient-to-r from-amber-950/60 to-slate-800 text-amber-300 hover:border-amber-400 hover:shadow-xs hover:shadow-amber-500/20"
          : "border-sky-200 bg-gradient-to-r from-sky-50 to-indigo-50/50 text-sky-800 hover:border-sky-300 hover:shadow-xs hover:shadow-sky-500/20"
      }`}
      title={isDark ? "Switch to Bright Mode" : "Switch to Dark Mode"}
      aria-label="Toggle dark mode"
    >
      {!mounted ? (
        // Render a stable placeholder during SSR to avoid hydration mismatch
        <>
          <Moon className="h-4 w-4 text-sky-600" />
          <span className="hidden sm:inline">Dark</span>
        </>
      ) : isDark ? (
        <>
          <Sun className="h-4 w-4 text-amber-400 animate-spin-slow" />
          <span className="hidden sm:inline">Bright</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 text-sky-600" />
          <span className="hidden sm:inline">Dark</span>
        </>
      )}
    </button>
  );
}
