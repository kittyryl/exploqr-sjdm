"use client";

import { useEffect, useState } from "react";

// Checks the "reduce motion" accessibility setting on the visitor's device.
// Most animations already respect this automatically, but custom effects
// (like a finger-tracked tilt or numbers counting up) have to check it themselves.
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
