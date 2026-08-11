"use client";

import { useMemo } from "react";
import { CATEGORIES } from "@/lib/categories";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { CategoryKey, Spot } from "@/lib/types";

export type CategoryFilterKey = "all" | CategoryKey;

interface CategoryFilterProps {
  spots: Spot[];
  active: CategoryFilterKey;
  onChange: (key: CategoryFilterKey) => void;
}

// Vertical list of filter rows for the sidebar. A selected row fills with
// that category's own colour, matching the map; "All spots" has no colour of
// its own, so it just goes dark.
export default function CategoryFilter({ spots, active, onChange }: CategoryFilterProps) {
  const { t } = useLocale();
  const chips = useMemo(
    () => [
      { key: "all" as CategoryFilterKey, label: t("filter.all"), count: spots.length, dot: undefined, block: undefined, blockFg: undefined },
      ...(Object.entries(CATEGORIES) as [CategoryKey, (typeof CATEGORIES)[CategoryKey]][]).map(
        ([key, cat]) => ({
          key: key as CategoryFilterKey,
          label: t(`cat.${key}`),
          count: spots.filter((s) => s.category === key).length,
          dot: cat.fill,
          block: cat.block,
          blockFg: cat.blockFg,
        })
      ),
    ],
    [spots, t]
  );

  return (
    <nav aria-label={t("filter.label")} className="flex flex-col gap-1">
      {chips.map((chip) => {
        const isActive = active === chip.key;
        return (
          <button
            key={chip.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(chip.key)}
            style={
              isActive && chip.block
                ? { background: chip.block, borderColor: chip.block, color: chip.blockFg }
                : undefined
            }
            className={`tactile flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 font-mono text-xs tracking-tight transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
              isActive
                ? chip.block
                  ? ""
                  : "border-ink bg-ink text-paper"
                : "border-line bg-transparent text-ink hover:border-ink/40"
            }`}
          >
            <span className="flex items-center gap-1.5">
              {/* Hide the colour dot once the row itself is that colour — no need to show it twice. */}
              {chip.dot && !isActive && (
                <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: chip.dot }} />
              )}
              {chip.label}
            </span>
            <span className={isActive ? "" : "text-ink/70"}>{chip.count}</span>
          </button>
        );
      })}
    </nav>
  );
}
