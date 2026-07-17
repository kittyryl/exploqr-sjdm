"use client";

import { createContext, useContext, useEffect, useState } from "react";

export const THEMES = ["light", "dark", "system"];
const DEFAULT_THEME = "system";
const THEME_STORAGE_KEY = "exploqr-theme";

const ThemeContext = createContext(null);

// Mirrors LocaleProvider: the page is fully static, so the saved choice
// comes from localStorage after mount rather than SSR — same one-frame
// trade already accepted for locale. "system" removes `data-theme` entirely
// so the `prefers-color-scheme` block in globals.css keeps driving the
// no-JS, no-flash default; only an explicit light/dark choice sets the
// attribute and overrides it.
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(DEFAULT_THEME);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && THEMES.includes(saved)) setThemeState(saved);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme]);

  function setTheme(next) {
    if (!THEMES.includes(next)) return;
    localStorage.setItem(THEME_STORAGE_KEY, next);
    setThemeState(next);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
