"use client";

import { spotIcon, barangayLabel, CATEGORIES } from "@/lib/categories";
import { formatDistance } from "@/lib/geo";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Spot } from "@/lib/types";

interface SidebarSpotRowProps {
  spot: Spot;
  distanceKm: number | undefined;
  active: boolean;
  onSelect: (id: string) => void;
}

// One row in the sidebar's spot list: category icon/colour (matches the map
// pin), name, barangay, and distance when Near Me is active. Clicking it
// does exactly what clicking the spot's map pin does.
export default function SidebarSpotRow({ spot, distanceKm, active, onSelect }: SidebarSpotRowProps) {
  const { t, text } = useLocale();
  const Icon = spotIcon(spot);
  const cat = CATEGORIES[spot.category];

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onSelect(spot.id)}
      className={`tactile flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
        active ? "border-ink bg-ink/[.05]" : "border-transparent hover:border-line hover:bg-ink/[.03]"
      }`}
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ background: cat.tint, color: cat.accent }}
      >
        {/* eslint-disable-next-line react-hooks/static-components */}
        <Icon size={15} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-sm font-semibold text-ink">{text(spot.name)}</span>
        <span className="block truncate font-mono text-[11px] text-ink/60">{barangayLabel(spot, t)}</span>
      </span>
      {distanceKm !== undefined && (
        <span className="shrink-0 font-mono text-[11px] text-ink/70">{formatDistance(distanceKm)}</span>
      )}
    </button>
  );
}
