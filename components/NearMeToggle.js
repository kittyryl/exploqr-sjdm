"use client";

import { LocateFixed, Loader2 } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { useLocale } from "@/components/LocaleProvider";

// Pill button matching the category chips: idle/active/loading states,
// plus an inline error line (e.g. permission denied) when geolocation fails.
export default function NearMeToggle({ active, loading, error, onClick }) {
  const { t } = useLocale();
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        aria-pressed={active}
        className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 font-mono text-xs tracking-tight transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60 ${
          active
            ? "border-ink bg-ink text-paper"
            : "border-line bg-transparent text-ink hover:border-ink/40"
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
