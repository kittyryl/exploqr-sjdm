"use client";

import { useState } from "react";
import { useImageFallbackMap } from "@/lib/hooks/useImageFallback";
import type { Spot } from "@/lib/types";

// The media state for one spot, shared across the detail modal. The hero at the
// top of the panel is a *static* cover; the photo gallery further down is where
// a visitor actually opens imagery — tapping a photo zooms it in the lightbox,
// and the 360° panorama sits at the end of the gallery and opens its own
// full-screen viewer. The hero and the gallery sit far apart in the panel, so
// this state can't live inside either of them.
export function useSpotMedia(spot: Spot) {
  const images = spot.images || [];
  const hasPano = Boolean(spot.pano360);

  // `active` is the photo index the lightbox is showing; it's meaningless until
  // the lightbox opens. The panorama is a separate mode, never an index.
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [panoOpen, setPanoOpen] = useState(false);
  const { failedMap, markFailed, checkOnMount } = useImageFallbackMap();

  const total = images.length;
  const isEmpty = total === 0 && !hasPano;

  // The hero's static cover: the first photo, or the panorama's flat frame when
  // a spot has only a 360°, so the banner is never a blank category tile while
  // any imagery exists.
  const coverSrc = images[0]?.src ?? spot.pano360 ?? null;

  // Open the lightbox on a specific photo. Always leaves 360° mode first, so
  // the two full-screen overlays are never stacked.
  const openLightboxAt = (index: number) => {
    setActive(index);
    setPanoOpen(false);
    setLightboxOpen(true);
  };

  const openPano = () => {
    setLightboxOpen(false);
    setPanoOpen(true);
  };

  // Paging inside the lightbox — photos only; the panorama isn't part of it.
  const step = (dir: 1 | -1) => {
    if (total === 0) return;
    setActive((i) => (i + dir + total) % total);
  };

  return {
    images,
    hasPano,
    total,
    isEmpty,
    coverSrc,
    active,
    lightboxOpen,
    openLightboxAt,
    closeLightbox: () => setLightboxOpen(false),
    panoOpen,
    openPano,
    closePano: () => setPanoOpen(false),
    step,
    failedMap,
    markFailed,
    checkOnMount,
  };
}

export type SpotMediaState = ReturnType<typeof useSpotMedia>;
