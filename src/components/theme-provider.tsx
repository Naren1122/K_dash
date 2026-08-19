"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark";

type ThemeProviderState = {
  theme: Theme;
  mounted: boolean;
  toggleTheme: () => void;
};

const initialState: ThemeProviderState = {
  theme: "light",
  mounted: false,
  toggleTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always start with "light" so server and client first-render match
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // After hydration, read the stored theme and apply it
  useEffect(() => {
    const stored = localStorage.getItem("kanban_theme") as Theme | null;
    if (stored === "dark") {
      setThemeState("dark");
      document.documentElement.classList.add("dark");
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme, mounted]);

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setThemeState(nextTheme);
    localStorage.setItem("kanban_theme", nextTheme);
  }

  return (
    <ThemeProviderContext.Provider value={{ theme, mounted, toggleTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeProviderContext);
