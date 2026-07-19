"use client";

import { useMemo } from "react";
import { CATEGORIES } from "@/lib/categories";
import { PILL_BUTTON_BASE, PILL_BUTTON_INACTIVE } from "@/lib/styles";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { CategoryKey, Spot } from "@/lib/types";

export type CategoryFilterKey = "all" | CategoryKey;

interface CategoryFilterProps {
  spots: Spot[];
  active: CategoryFilterKey;
  onChange: (key: CategoryFilterKey) => void;
}

// Filter chips: "All spots" plus one chip per category, each with a count.
// An active category chip fills with that category's `block` color, so the
// control states which filter is on in the same color the tiles and pins
// already use. "All spots" has no color of its own and stays ink.
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
    <div className="relative -mx-4 min-w-0 px-4 sm:mx-0 sm:px-0">
      <nav
        aria-label={t("filter.label")}
        className="no-scrollbar flex gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible"
      >
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
                  ? {
                      background: chip.block,
                      borderColor: chip.block,
                      color: chip.blockFg,
                    }
                  : undefined
              }
              className={`${PILL_BUTTON_BASE} ${
                isActive
                  ? chip.block
                    ? ""
                    : "border-ink bg-ink text-paper"
                  : PILL_BUTTON_INACTIVE
              }`}
            >
              {/* The dot names the category color; once the chip *is* that
                  color, the dot is repeating itself. */}
              {chip.dot && !isActive && (
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full"
                  style={{ background: chip.dot }}
                />
              )}
              {chip.label}
              {/* Full opacity on an active chip: the muted /70 that works on
                  paper drops white on the leisure block under AA. */}
              <span className={isActive ? "" : "text-ink/70"}>{chip.count}</span>
            </button>
          );
        })}
      </nav>
      {/* Hints that the chip rail scrolls further right, on mobile only */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-paper to-transparent sm:hidden"
      />
    </div>
  );
}
