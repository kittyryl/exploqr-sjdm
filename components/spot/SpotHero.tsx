"use client";

import Image from "next/image";
import { ImageOff, LocateFixed, MapPin } from "lucide-react";
import { CATEGORIES, spotIcon, barangayLabel } from "@/lib/categories";
import { formatDistance } from "@/lib/geo";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { SpotMediaState } from "@/lib/hooks/useSpotMedia";
import type { Spot } from "@/lib/types";

interface SpotHeroProps {
  spot: Spot;
  media: SpotMediaState;
  titleId?: string;
  distanceKm?: number;
}

// The detail panel's cover: a still banner carrying the spot's name, category,
// and barangay over its lead photo. It is deliberately static — a visitor opens
// and pages through imagery from the photo gallery further down, not by poking
// the header — so the title never fights a zoom target or a live panorama for
// the same pixels. When a spot has no usable photo, the category tint + icon
// stand in, the same "no photo yet looks designed" fallback the map pins use.
export default function SpotHero({ spot, media, titleId, distanceKm }: SpotHeroProps) {
  const { t, text } = useLocale();
  const cat = CATEGORIES[spot.category];
  const Icon = spotIcon(spot);
  const { coverSrc, failedMap, markFailed, checkOnMount } = media;

  const failed = Boolean(coverSrc && failedMap[coverSrc]);
  const showCover = Boolean(coverSrc) && !failed;

  return (
    <div className="relative h-56 shrink-0 overflow-hidden bg-ink/4 sm:h-64">
      {showCover ? (
        <Image
          src={coverSrc!}
          alt={text(spot.name)}
          fill
          sizes="(min-width: 640px) 42rem, 100vw"
          loading="eager"
          ref={checkOnMount(coverSrc!)}
          onError={() => markFailed(coverSrc!)}
          className="object-cover"
        />
      ) : failed ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink/70">
          <ImageOff size={22} aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-widest">
            {t("media.failed")}
          </span>
        </div>
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ background: cat.tint, color: cat.accent }}
          aria-hidden="true"
        >
          <Icon size={56} strokeWidth={1.5} />
        </div>
      )}

      {/* Keeps the white type legible over whatever the photo happens to be. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-scrim/85 via-scrim/30 to-transparent"
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-2 p-5">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider shadow-sm"
          style={{ background: cat.accent, color: cat.btnFg }}
        >
          <Icon size={12} strokeWidth={2.5} aria-hidden="true" />
          {t(`cat.${spot.category}`)}
        </span>
        <h2
          id={titleId}
          className="mt-2.5 font-display text-2xl font-extrabold leading-[1.05] tracking-[-0.01em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)] sm:text-[30px]"
        >
          {text(spot.name)}
        </h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80">
          <span className="flex items-center gap-1">
            <MapPin size={14} aria-hidden="true" />
            {barangayLabel(spot, t)}
          </span>
          {distanceKm != null && (
            <span className="flex items-center gap-1">
              <LocateFixed size={14} aria-hidden="true" />
              {t("spot.distance", { distance: formatDistance(distanceKm) })}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
