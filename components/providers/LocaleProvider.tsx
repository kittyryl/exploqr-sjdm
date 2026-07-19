"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_STORAGE_KEY,
  t,
  text,
  type UIKey,
} from "@/lib/i18n";
import { usePersistentChoice } from "@/lib/hooks/usePersistentChoice";
import type { Locale, LocaleText } from "@/lib/types";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
}

interface UseLocaleResult extends LocaleContextValue {
  t: (key: UIKey, vars?: Record<string, string | number>) => string;
  text: (value: LocaleText | null | undefined) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

// The page is fully static, so the locale can't be read on the server without
// making it dynamic — it comes from localStorage after mount instead. A reader
// with Tagalog saved sees English for one frame; that's the trade for keeping
// the whole app prerendered, and it's invisible next to the map's own load.
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = usePersistentChoice(
    LOCALE_STORAGE_KEY,
    LOCALES,
    DEFAULT_LOCALE
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

// Returns the active locale plus pre-bound helpers, so callers write
// `t("filter.all")` instead of threading `locale` through every call.
// Memoized on `locale` so consumers that list `t`/`text` in a dependency
// array (useMemo/useCallback) don't invalidate on every unrelated re-render.
export function useLocale(): UseLocaleResult {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  const { locale, setLocale } = ctx;
  return useMemo(
    () => ({
      locale,
      setLocale,
      t: (key: UIKey, vars?: Record<string, string | number>) => t(locale, key, vars),
      text: (value: LocaleText | null | undefined) => text(value, locale),
    }),
    [locale, setLocale]
  );
}
