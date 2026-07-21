"use client";

import { Navigation, Rotate3d } from "lucide-react";
import { CATEGORIES, directionsUrl, formatCoords } from "@/lib/categories";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { SpotMediaState } from "@/lib/hooks/useSpotMedia";
import type { Spot } from "@/lib/types";

const ACTION =
  "flex flex-1 items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none motion-reduce:hover:translate-y-0";

// What to do next: get there, or look around first. The waypoint sits above
// them because it's a reference, not an action — it used to head the card,
// where it outranked the spot's own name.
export default function SpotActions({
  spot,
  media,
}: {
  spot: Spot;
  media: SpotMediaState;
}) {
  const { t } = useLocale();
  const cat = CATEGORIES[spot.category];

  return (
    <div>
      <p className="mb-2.5 font-mono text-[11px] uppercase tracking-widest text-ink/70">
        {formatCoords(spot.lat, spot.lng)}
      </p>
      <div className="flex flex-wrap gap-2.5">
        <a
          href={directionsUrl(spot)}
          target="_blank"
          rel="noopener noreferrer"
          className={ACTION}
          style={{ background: cat.accent, color: cat.btnFg }}
        >
          <Navigation size={15} aria-hidden="true" />
          {t("spot.directions")}
        </a>
        {/* Always shown so the panorama is a discoverable feature; disabled
            and greyed when this spot has no 360° yet, rather than vanishing. */}
        <button
          type="button"
          onClick={media.openPano}
          disabled={!media.hasPano}
          title={media.hasPano ? undefined : t("spot.no360")}
          className={`${ACTION} border border-line bg-surface text-ink hover:bg-ink/4 disabled:cursor-not-allowed disabled:border-dashed disabled:bg-transparent disabled:text-ink/40 disabled:hover:translate-y-0 disabled:hover:bg-transparent`}
        >
          <Rotate3d size={15} aria-hidden="true" />
          {media.hasPano ? t("spot.view360") : t("spot.no360")}
        </button>
      </div>
    </div>
  );
}
