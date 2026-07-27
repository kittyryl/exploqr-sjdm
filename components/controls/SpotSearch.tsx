"use client";

import { Search, X } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";

interface SpotSearchProps {
  value: string;
  onChange: (value: string) => void;
}

// Free-text filter that sits between the map heading and the map itself.
// Combines with CategoryFilter (AND logic) in page.js's visibleIn — typing
// here narrows the same `visible` set the category chips narrow, so the map's
// existing FitToSpots re-fits to whatever matches without any new "fly to"
// logic.
export default function SpotSearch({ value, onChange }: SpotSearchProps) {
  const { t } = useLocale();

  return (
    <div className="relative">
      <Search
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("search.placeholder")}
        aria-label={t("search.label")}
        className="fb-field w-full rounded-2xl py-2.5 pl-10 pr-9 font-sans text-[14px] text-ink placeholder:text-ink/45 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t("search.clear")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink/70"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
