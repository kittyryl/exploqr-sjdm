"use client";

import { Loader2, Navigation, X } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { formatDistance } from "@/lib/geo";
import { formatDuration, type RouteState } from "@/lib/routing";
import { useLocale } from "@/components/providers/LocaleProvider";

interface RouteInfoPillProps {
  route: RouteState;
  onReopen: (spotId: string) => void;
  onClear: () => void;
}

// Floating card over the map, styled like the map-shell's corner survey-ticks.
// Doubles as the way back into the spot's modal, since requesting directions
// closes it to reveal the route underneath — without this, closing the modal
// would otherwise be a dead end.
export default function RouteInfoPill({ route, onReopen, onClear }: RouteInfoPillProps) {
  const { t, text } = useLocale();
  const cat = CATEGORIES[route.spot.category];
  const name = text(route.spot.name);

  const label = route.arrived
    ? t("directions.arrived")
    : route.durationMin != null
      ? t("directions.pill", {
          distance: formatDistance(route.distanceKm),
          duration: formatDuration(route.durationMin),
          name,
        })
      : t("directions.pillNoDuration", { distance: formatDistance(route.distanceKm), name });

  return (
    <div className="absolute left-3 top-3 z-[1000] flex items-center gap-1.5 rounded-full border border-line bg-surface/95 py-1.5 pl-3 pr-1.5 shadow-md backdrop-blur">
      <button
        type="button"
        onClick={() => onReopen(route.spot.id)}
        className="flex items-center gap-1.5 font-mono text-xs text-ink"
      >
        {route.loading ? (
          <Loader2 size={13} className="animate-spin" aria-hidden="true" style={{ color: cat.accent }} />
        ) : (
          <Navigation size={13} aria-hidden="true" style={{ color: cat.accent }} />
        )}
        <span aria-live="polite">{label}</span>
      </button>
      <button
        type="button"
        onClick={onClear}
        aria-label={t("directions.pillClose")}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-ink/50 hover:bg-ink/8 hover:text-ink"
      >
        <X size={12} aria-hidden="true" />
      </button>
    </div>
  );
}
