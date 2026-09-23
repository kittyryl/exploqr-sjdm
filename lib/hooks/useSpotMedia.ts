"use client";

import { useState } from "react";
import { useImageFallbackMap } from "@/lib/hooks/useImageFallback";
import { type Spot, getSpotPanos } from "@/lib/types";

// Keeps track of all the photo and panorama state for one spot's detail
// popup. The cover photo at the top and the gallery further down both need
// this same state, so it lives here instead of inside either one.
export function useSpotMedia(spot: Spot) {
  const images = spot.images || [];
  const panos = getSpotPanos(spot);
  const hasPano = panos.length > 0;

  // `active` is which photo the zoomed-in viewer is showing; it only matters
  // once that viewer is open. The 360 panorama is separate and not part of this.
  const [active, setActive] = useState(0);
  const [activePano, setActivePano] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [panoOpen, setPanoOpen] = useState(false);
  const { failedMap, markFailed, checkOnMount } = useImageFallbackMap();

  const total = images.length;
  const isEmpty = total === 0 && !hasPano;

  // The cover photo: the first photo, or a flat frame from the 360 panorama if
  // that's all the spot has, so the banner is never blank when there's imagery.
  const coverSrc = images[0] ?? panos[0] ?? null;

  // Opens the zoomed-in photo viewer. Always closes the 360 viewer first, so
  // the two full-screen views never show at the same time.
  const openLightboxAt = (index: number) => {
    setActive(index);
    setPanoOpen(false);
    setLightboxOpen(true);
  };

  const openPano = () => {
    setActivePano(0);
    setLightboxOpen(false);
    setPanoOpen(true);
  };

  const openPanoAt = (index: number) => {
    setActivePano(index);
    setLightboxOpen(false);
    setPanoOpen(true);
  };

  // Moves to the next or previous photo in the zoomed-in viewer; the panorama isn't part of this.
  const step = (dir: 1 | -1) => {
    if (total === 0) return;
    setActive((i) => (i + dir + total) % total);
  };

  const stepPano = (dir: 1 | -1) => {
    if (panos.length === 0) return;
    setActivePano((i) => (i + dir + panos.length) % panos.length);
  };

  return {
    images,
    panos,
    hasPano,
    total,
    isEmpty,
    coverSrc,
    active,
    activePano,
    setActivePano,
    lightboxOpen,
    openLightboxAt,
    closeLightbox: () => setLightboxOpen(false),
    panoOpen,
    openPano,
    openPanoAt,
    closePano: () => setPanoOpen(false),
    step,
    stepPano,
    failedMap,
    markFailed,
    checkOnMount,
  };
}

export type SpotMediaState = ReturnType<typeof useSpotMedia>;
