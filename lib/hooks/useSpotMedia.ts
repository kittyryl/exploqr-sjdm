"use client";

import { useState } from "react";
import { useImageFallbackMap } from "@/lib/hooks/useImageFallback";
import type { Spot } from "@/lib/types";

// Keeps track of all the photo and panorama state for one spot's detail
// popup. The cover photo at the top and the gallery further down both need
// this same state, so it lives here instead of inside either one.
export function useSpotMedia(spot: Spot) {
  const images = spot.images || [];
  const hasPano = Boolean(spot.pano360);

  // `active` is which photo the zoomed-in viewer is showing; it only matters
  // once that viewer is open. The 360 panorama is separate and not part of this.
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [panoOpen, setPanoOpen] = useState(false);
  const { failedMap, markFailed, checkOnMount } = useImageFallbackMap();

  const total = images.length;
  const isEmpty = total === 0 && !hasPano;

  // The cover photo: the first photo, or a flat frame from the 360 panorama if
  // that's all the spot has, so the banner is never blank when there's imagery.
  const coverSrc = images[0] ?? spot.pano360 ?? null;

  // Opens the zoomed-in photo viewer. Always closes the 360 viewer first, so
  // the two full-screen views never show at the same time.
  const openLightboxAt = (index: number) => {
    setActive(index);
    setPanoOpen(false);
    setLightboxOpen(true);
  };

  const openPano = () => {
    setLightboxOpen(false);
    setPanoOpen(true);
  };

  // Moves to the next or previous photo in the zoomed-in viewer; the panorama isn't part of this.
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
