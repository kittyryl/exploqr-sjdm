"use client";

import { Sun, Monitor, Moon, type LucideIcon } from "lucide-react";
import { THEMES, useTheme, type Theme } from "@/components/providers/ThemeProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import SegmentedToggle from "@/components/controls/SegmentedToggle";

const ICONS: Record<Theme, LucideIcon> = { light: Sun, system: Monitor, dark: Moon };

// Light/system/dark switch, styled to match LocaleToggle — the two sit
// side by side in the header as the app's global preference controls.
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useLocale();

  return (
    <SegmentedToggle
      ariaLabel={t("theme.switch")}
      activeValue={theme}
      onChange={setTheme}
      optionClassName="px-1.5 py-1"
      options={THEMES.map((mode) => {
        const Icon = ICONS[mode];
        return {
          value: mode,
          title: t(`theme.${mode}`),
          content: (
            <>
              <Icon size={14} aria-hidden="true" />
              <span className="sr-only">{t(`theme.${mode}`)}</span>
            </>
          ),
        };
      })}
    />
  );
}
