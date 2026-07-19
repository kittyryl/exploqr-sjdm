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

// Mirrors LocaleProvider: the page is fully static, so the saved choice
// comes from localStorage after mount rather than SSR — same one-frame
// trade already accepted for locale. "system" removes `data-theme` entirely
// so the `prefers-color-scheme` block in globals.css keeps driving the
// no-JS, no-flash default; only an explicit light/dark choice sets the
// attribute and overrides it.
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
