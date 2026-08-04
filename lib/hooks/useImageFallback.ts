"use client";

import { useEffect, useState } from "react";

// Photos are linked from Wikimedia and sometimes go dead — when that happens
// we want a clean placeholder, not a broken-image icon. Shared by the photo
// grid, the spot detail panel, and the full-screen photo viewer.
//
// Photos can appear on the page before the app has fully loaded, so a broken
// photo might fail too early to be caught the normal way. `checkOnMount`
// double-checks each photo once it's on screen, so early failures still get
// caught — pass it as the image's `ref`.
//
// `resetKey` clears the "failed" flag when it changes — pass something that
// changes whenever a different photo takes this slot (like the photo index
// in the full-screen viewer). Skip it if this slot always shows the same photo.
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

// Same idea, but for showing several photos at once (the thumbnail strip).
// Failures are tracked per photo, so the right thumbnail stays marked broken
// even as the active one changes.
export function useImageFallbackMap() {
  const [failedMap, setFailedMap] = useState<Record<string, boolean>>({});

  const markFailed = (src: string) => setFailedMap((f) => ({ ...f, [src]: true }));
  const checkOnMount = (src: string) => (img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth === 0) markFailed(src);
  };

  return { failedMap, markFailed, checkOnMount };
}
