"use client";

import { useEffect, useState } from "react";

// Mirrors the OS-level "reduce motion" setting the rest of the app already
// respects via `<MotionConfig reducedMotion="user">` — that config only
// covers Motion's own generated animations (variants, layout), so an effect
// driven by a manually-computed value (a pointer-tracked tilt, a count-up)
// needs to check this directly. Same shape as SpotMap's usePrefersDark.
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
