"use client";

import { Sun, Monitor, Moon } from "lucide-react";
import { THEMES } from "@/components/ThemeProvider";
import { useTheme } from "@/components/ThemeProvider";
import { useLocale } from "@/components/LocaleProvider";

const ICONS = { light: Sun, system: Monitor, dark: Moon };

// Light/system/dark switch, styled to match LocaleToggle — the two sit
// side by side in the header as the app's global preference controls.
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useLocale();

  return (
    <div
      className="inline-flex shrink-0 overflow-hidden rounded-full border border-line"
      role="group"
      aria-label={t("theme.switch")}
    >
      {THEMES.map((mode) => {
        const isActive = mode === theme;
        const Icon = ICONS[mode];
        return (
          <button
            key={mode}
            type="button"
            onClick={() => setTheme(mode)}
            aria-pressed={isActive}
            title={t(`theme.${mode}`)}
            className={`px-1.5 py-1 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink ${
              isActive
                ? "bg-ink text-paper"
                : "bg-transparent text-ink/70 hover:text-ink"
            }`}
          >
            <Icon size={14} aria-hidden="true" />
            <span className="sr-only">{t(`theme.${mode}`)}</span>
          </button>
        );
      })}
    </div>
  );
}
