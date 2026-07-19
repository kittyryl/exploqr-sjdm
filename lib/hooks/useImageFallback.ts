"use client";

import { useEffect, useState } from "react";

// Every photo in this app is hotlinked from Wikimedia Commons; a dead URL
// should read as a designed gap, not a broken-image glyph. Shared by
// SpotList, SpotMedia, and PhotoLightbox.
//
// The grid is server-rendered, so a photo can fail while the HTML is still
// parsing — before React attaches onError, which then never fires. `checkOnMount`
// re-checks the settled state once the element exists, so a pre-hydration
// failure still registers; pass it as the image's `ref`.
//
// `resetKey` re-arms the failure flag when it changes — pass the thing that
// identifies "a different image now occupies this slot" (e.g. PhotoLightbox's
// index). Omit it for a component instance that's never reused for a
// different image (e.g. one grid tile per spot).
export function useImageFallback(resetKey?: unknown) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const checkOnMount = (img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  };

  return { failed, onError: () => setFailed(true), checkOnMount };
}

// Same idea, but for a component that shows one of several images at a time
// (SpotMedia's thumbnail strip) — failure is keyed by src so it sticks to
// the photo that failed rather than whichever slot happens to be active.
export function useImageFallbackMap() {
  const [failedMap, setFailedMap] = useState<Record<string, boolean>>({});

  const markFailed = (src: string) => setFailedMap((f) => ({ ...f, [src]: true }));
  const checkOnMount = (src: string) => (img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth === 0) markFailed(src);
  };

  return { failedMap, markFailed, checkOnMount };
}
