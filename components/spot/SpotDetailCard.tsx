"use client";

import { AnimatePresence } from "motion/react";
import SpotHero from "@/components/spot/SpotHero";
import SpotFactGrid from "@/components/spot/SpotFactGrid";
import SpotAmenities from "@/components/spot/SpotAmenities";
import SpotPhotoStrip from "@/components/spot/SpotPhotoStrip";
import SpotActions from "@/components/spot/SpotActions";
import SpotReviews from "@/components/spot/SpotReviews";
import PhotoLightbox from "@/components/spot/PhotoLightbox";
import PanoOverlay from "@/components/spot/PanoOverlay";
import { useSpotMedia } from "@/lib/hooks/useSpotMedia";
import { CATEGORIES } from "@/lib/categories";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Spot } from "@/lib/types";

interface SpotDetailCardProps {
  spot: Spot;
  titleId?: string;
  distanceKm?: number;
  onDirections: (spot: Spot) => void;
  directionsLoading: boolean;
}

// Main content for a spot: photo, description, facts, amenities, more
// photos, and next steps. Shown inside the spot pop-up window.
//
// The photo/panorama state is tracked in one shared place because the main
// photo and the strip that controls it sit far apart on the page.
// `distanceKm` is only set if the visitor shared their location.
export default function SpotDetailCard({
  spot,
  titleId,
  distanceKm,
  onDirections,
  directionsLoading,
}: SpotDetailCardProps) {
  const { text } = useLocale();
  const media = useSpotMedia(spot);
  const cat = CATEGORIES[spot.category];

  return (
    <article className="spot-card">
      <SpotHero
        spot={spot}
        media={media}
        titleId={titleId}
        distanceKm={distanceKm}
      />

      <div className="flex flex-col gap-6 p-5 sm:p-6">
        {/* The coloured line matches the map pin's colour, tying the
            description back to how the spot was found. */}
        <p
          className="max-w-prose border-l-2 pl-4 text-[15px] leading-relaxed text-ink/80"
          style={{ borderColor: cat.accent }}
        >
          {text(spot.description)}
        </p>

        <SpotFactGrid spot={spot} />
        <SpotAmenities spot={spot} />
        <SpotPhotoStrip spot={spot} media={media} />
        <SpotActions
          spot={spot}
          media={media}
          onDirections={onDirections}
          directionsLoading={directionsLoading}
        />
        <SpotReviews spot={spot} />
      </div>

      {/* Lets the closing animation finish before the overlay disappears.
          Only one overlay (photo or panorama) is ever open at a time. */}
      <AnimatePresence>
        {media.lightboxOpen && (
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

      <AnimatePresence>
        {media.panoOpen && spot.pano360 && (
          <PanoOverlay
            key="pano-overlay"
            src={spot.pano360}
            title={text(spot.name)}
            onClose={media.closePano}
          />
        )}
      </AnimatePresence>
    </article>
  );
}
