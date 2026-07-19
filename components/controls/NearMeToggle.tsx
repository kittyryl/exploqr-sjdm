"use client";

import { LocateFixed, Loader2 } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import {
  PILL_BUTTON_ACTIVE,
  PILL_BUTTON_BASE,
  PILL_BUTTON_INACTIVE,
} from "@/lib/styles";
import { useLocale } from "@/components/providers/LocaleProvider";

interface NearMeToggleProps {
  active: boolean;
  loading: boolean;
  error: string | null;
  onClick: () => void;
}

// Pill button matching the category chips: idle/active/loading states,
// plus an inline error line (e.g. permission denied) when geolocation fails.
export default function NearMeToggle({ active, loading, error, onClick }: NearMeToggleProps) {
  const { t } = useLocale();
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        aria-pressed={active}
        className={`${PILL_BUTTON_BASE} disabled:opacity-60 ${
          active ? PILL_BUTTON_ACTIVE : PILL_BUTTON_INACTIVE
        }`}
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
        ) : (
          <LocateFixed size={14} aria-hidden="true" />
        )}
        {loading ? t("nearme.loading") : t("nearme.idle")}
      </button>
      {error && (
        <p
          className="max-w-[220px] text-right font-mono text-[11px] leading-snug"
          style={{ color: CATEGORIES.leisure.accent }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
