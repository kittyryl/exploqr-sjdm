"use client";

import { useState } from "react";
import { useImageFallbackMap } from "@/lib/hooks/useImageFallback";
import type { Spot } from "@/lib/types";

// Which item of the media sequence is showing. The 360° panorama isn't an
// index into `images`, so it gets its own tag rather than a magic number.
export type ActiveMedia = number | "pano";

// The media state for one spot, shared by everything that shows or steps
// through it. The detail modal separates the hero (top of the panel) from the
// thumbnail strip (below the description, facts, and amenities) with three
// other sections in between, so this state can't live inside either of them.
//
// The sequence is [360°, ...photos] when the spot has a panorama, which makes
// the panorama both the default view and the lead thumbnail.
export function useSpotMedia(spot: Spot) {
  const images = spot.images || [];
  const hasPano = Boolean(spot.pano360);
  const [active, setActive] = useState<ActiveMedia>(hasPano ? "pano" : 0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // The interactive Pannellum viewer takes over the hero rather than opening
  // in its own overlay: the hero is already the largest media surface in the
  // panel, and a panorama needs every pixel it can get.
  const [panoOpen, setPanoOpen] = useState(false);
  const { failedMap, markFailed, checkOnMount } = useImageFallbackMap();

  const total = images.length + (hasPano ? 1 : 0);
  const isEmpty = total === 0;

  const openPano = () => {
    setActive("pano");
    setLightboxOpen(false);
    setPanoOpen(true);
  };

  // Selecting a photo always leaves 360° mode — otherwise the viewer would sit
  // over the hero while the strip claims a photo is showing.
  const selectImage = (index: number) => {
    setPanoOpen(false);
    setActive(index);
  };

  // Paging across the whole sequence. Landing on the 360° slot closes the zoom
  // and switches to the interactive viewer, since a panorama can't be shown
  // inside the flat photo lightbox. Called only while a photo is open, so
  // `active` is an index here.
  const step = (dir: 1 | -1) => {
    const seq = hasPano ? (active as number) + 1 : (active as number);
    const nextSeq = (seq + dir + total) % total;
    if (hasPano && nextSeq === 0) {
      openPano();
    } else {
      selectImage(hasPano ? nextSeq - 1 : nextSeq);
    }
  };

  return {
    images,
    hasPano,
    total,
    isEmpty,
    active,
    selectImage,
    lightboxOpen,
    openLightbox: () => setLightboxOpen(true),
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
