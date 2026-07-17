"use client";

import { LOCALES, LOCALE_LABELS } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";

// Segmented EN/TL switch. Sits in the header next to the wordmark — small,
// since most visitors will never touch it, but always visible rather than
// buried, because the ones who need it need it immediately.
export default function LocaleToggle() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      className="inline-flex shrink-0 overflow-hidden rounded-full border border-line"
      role="group"
      aria-label={t("lang.switch")}
    >
      {LOCALES.map((code) => {
        const isActive = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={isActive}
            title={LOCALE_LABELS[code]}
            className={`px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink ${
              isActive
                ? "bg-ink text-paper"
                : "bg-transparent text-ink/70 hover:text-ink"
            }`}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
