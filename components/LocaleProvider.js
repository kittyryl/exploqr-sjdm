"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_STORAGE_KEY,
  t,
  text,
} from "@/lib/i18n";

const LocaleContext = createContext(null);

// The page is fully static, so the locale can't be read on the server without
// making it dynamic — it comes from localStorage after mount instead. A reader
// with Tagalog saved sees English for one frame; that's the trade for keeping
// the whole app prerendered, and it's invisible next to the map's own load.
export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);

  useEffect(() => {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved && LOCALES.includes(saved)) setLocaleState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function setLocale(next) {
    if (!LOCALES.includes(next)) return;
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
    setLocaleState(next);
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

// Returns the active locale plus pre-bound helpers, so callers write
// `t("filter.all")` instead of threading `locale` through every call.
export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  const { locale, setLocale } = ctx;
  return {
    locale,
    setLocale,
    t: (key, vars) => t(locale, key, vars),
    text: (value) => text(value, locale),
  };
}
