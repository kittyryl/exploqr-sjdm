"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { usePersistentChoice } from "@/lib/hooks/usePersistentChoice";

export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];
const DEFAULT_THEME: Theme = "system";
const THEME_STORAGE_KEY = "exploqr-theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (next: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// The saved theme choice is only known once the page loads in the browser.
// "System" means follow the device's setting; picking light or dark overrides it.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = usePersistentChoice(
    THEME_STORAGE_KEY,
    THEMES,
    DEFAULT_THEME
  );

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
