"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { t, text, type UIKey } from "@/lib/i18n";

interface UseLocaleResult {
  t: (key: UIKey, vars?: Record<string, string | number>) => string;
  text: (value: string | null | undefined) => string;
}

// There's only one language now (English), so this context no longer holds
// any switchable state — it exists purely so every spot/detail component can
// keep calling `useLocale()` for `t`/`text` without threading them as props.
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
