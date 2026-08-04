"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { t, text, type UIKey } from "@/lib/i18n";

interface UseLocaleResult {
  t: (key: UIKey, vars?: Record<string, string | number>) => string;
  text: (value: string | null | undefined) => string;
}

// Only English is supported now. This just lets any component grab the text
// helpers without passing them down manually.
const LocaleContext = createContext<UseLocaleResult | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const value = useMemo<UseLocaleResult>(() => ({ t, text }), []);
  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): UseLocaleResult {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  return ctx;
}
