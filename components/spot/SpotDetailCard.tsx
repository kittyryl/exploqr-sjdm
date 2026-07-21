"use client";

import { AnimatePresence } from "motion/react";
import SpotHero from "@/components/spot/SpotHero";
import SpotFactGrid from "@/components/spot/SpotFactGrid";
import SpotAmenities from "@/components/spot/SpotAmenities";
import SpotPhotoStrip from "@/components/spot/SpotPhotoStrip";
import SpotActions from "@/components/spot/SpotActions";
import PhotoLightbox from "@/components/spot/PhotoLightbox";
import { useSpotMedia } from "@/lib/hooks/useSpotMedia";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Spot } from "@/lib/types";

interface SpotDetailCardProps {
  spot: Spot;
  titleId?: string;
  distanceKm?: number;
}

// Detail content for a spot, led by the photo: hero, description, the
// practical facts, amenities, the media strip, and what to do next. Rendered
// inside SpotModal, which supplies the surrounding chrome.
//
// The media state lives in a hook rather than in any one section, because the
// hero and the strip that drives it sit at opposite ends of the panel with
// three other sections between them. `distanceKm` is set only when the visitor
// has shared their location.
export default function SpotDetailCard({
  spot,
  titleId,
  distanceKm,
}: SpotDetailCardProps) {
  const { text } = useLocale();
  const media = useSpotMedia(spot);

  return (
    <article className="spot-card">
      <SpotHero
        spot={spot}
        media={media}
        titleId={titleId}
        distanceKm={distanceKm}
      />

      <div className="flex flex-col gap-6 p-5 sm:p-6">
        <p className="max-w-prose text-[15px] leading-relaxed text-ink/80">
          {text(spot.description)}
        </p>

        <SpotFactGrid spot={spot} />
        <SpotAmenities spot={spot} />
        <SpotPhotoStrip spot={spot} media={media} />
        <SpotActions spot={spot} media={media} />
      </div>

      {/* AnimatePresence delays PhotoLightbox's actual unmount until its own
          exit animation finishes — required for the shared-layout photo
          transition (see PhotoLightbox) to FLIP back to the hero on close
          instead of just vanishing. */}
      <AnimatePresence>
        {media.lightboxOpen && media.active !== "pano" && (
          <PhotoLightbox
            key="photo-lightbox"
            images={media.images}
            index={media.active}
            spotId={spot.id}
            spotName={text(spot.name)}
            navigable={media.total > 1}
            onClose={media.closeLightbox}
            onPrev={() => media.step(-1)}
            onNext={() => media.step(1)}
          />
        )}
      </AnimatePresence>
    </article>
  );
}
