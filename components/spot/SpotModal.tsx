"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, X } from "lucide-react";
import SpotDetailCard from "@/components/spot/SpotDetailCard";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Spot } from "@/lib/types";

// The panel animates two different ways by viewport, matching the layout: on
// mobile it's a full-screen takeover that slides up from the bottom edge like a
// pushed page; on desktop it's a centered dialog that pops in with a small
// scale + rise. AnimatePresence drives both the enter and the *exit* — the
// close used to be an instant unmount (soft in, hard cut out), which read as
// unfinished. reducedMotion="user" from the page-level MotionConfig drops these
// transforms for anyone who's asked their OS for less movement, replacing the
// old `animation: none` CSS guarantee.
const BACKDROP = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};
const PANEL_MOBILE = {
  initial: { y: "100%" },
  animate: { y: 0 },
  exit: { y: "100%" },
};
const PANEL_DESKTOP = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 8 },
};
// The mobile sheet keeps the original spring-ish sheet easing; the desktop pop
// is a shorter ease-out. Both mirror the durations the CSS used before.
const PANEL_MOBILE_TRANSITION = { duration: 0.28, ease: [0.32, 0.72, 0, 1] as const };
const PANEL_DESKTOP_TRANSITION = { duration: 0.2, ease: "easeOut" as const };

interface SpotModalProps {
  spot: Spot | null;
  onClose: () => void;
  distanceKm?: number;
}

// Full spot view: a full-screen page takeover on mobile (a bottom sheet
// still left the map peeking through cramped margins — this gives photos
// and text the room they need), a centered dialog over the dimmed map on
// desktop, where there's room to spare and the map-behind context is nice.
export default function SpotModal({ spot, onClose, distanceKm }: SpotModalProps) {
  const { t, text } = useLocale();
  const panelRef = useRef<HTMLDivElement>(null);

  // Which enter/exit the panel uses is a layout fact, not a style one, so it
  // can't ride Tailwind's responsive classes — Motion animates inline
  // transforms. This component is always mounted, so the query resolves well
  // before any spot is ever opened.
  const [isDesktop, setIsDesktop] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 640px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Keyed on open/closed rather than on `spot`: stepping between spots keeps
  // the modal open, and re-running the trap would forget the list row that
  // focus belongs back on.
  useFocusTrap(panelRef, Boolean(spot));

  useEffect(() => {
    if (!spot) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [spot, onClose]);

  const titleId = spot ? `spot-modal-title-${spot.id}` : undefined;

  return (
    <AnimatePresence>
      {spot && (
        <motion.div
          key="spot-modal-backdrop"
          variants={BACKDROP}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="fixed inset-0 z-50 bg-scrim/45 backdrop-blur-[2px] sm:flex sm:items-center sm:justify-center sm:p-6"
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            // Stable key so stepping between spots swaps the content in place
            // rather than replaying the whole open animation each step.
            key="spot-modal-panel"
            ref={panelRef}
            variants={isDesktop ? PANEL_DESKTOP : PANEL_MOBILE}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={
              isDesktop ? PANEL_DESKTOP_TRANSITION : PANEL_MOBILE_TRANSITION
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            // sm:relative, not sm:static: this panel is the positioning
            // anchor for the close button's `absolute right-3 top-3` below.
            // `static` and `relative` are identical for layout/sizing — the
            // only difference is `relative` anchors absolute descendants —
            // but with `static` the button skipped this panel entirely and
            // anchored to the fixed backdrop instead, landing in the
            // viewport's corner rather than the modal's.
            className="absolute inset-0 flex h-full w-full flex-col overflow-y-auto bg-surface outline-none sm:relative sm:h-auto sm:max-h-[88vh] sm:w-full sm:max-w-2xl sm:rounded-[20px] sm:shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-line bg-surface/95 px-3 py-3 backdrop-blur sm:hidden">
              <button
                type="button"
                onClick={onClose}
                aria-label={t("modal.back")}
                className="tactile flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <ArrowLeft size={18} aria-hidden="true" />
              </button>
              <span
                aria-hidden="true"
                className="min-w-0 flex-1 truncate font-mono text-xs uppercase tracking-widest text-ink/70"
              >
                {text(spot.name)}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={t("modal.close")}
              // bg-scrim, not the ink-tinted treatment the mobile back button
              // uses: this button floats directly over SpotHero's photo, which
              // can be any brightness, so it needs its own opaque-enough
              // backing rather than one that depends on a light `surface`
              // background behind it.
              className="tactile absolute right-3 top-3 z-10 hidden h-8 w-8 items-center justify-center rounded-full bg-scrim/80 text-white backdrop-blur-sm transition-colors hover:bg-scrim/95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:flex"
            >
              <X size={16} aria-hidden="true" />
            </button>

            {/* No padding wrapper: the detail card leads with a full-bleed
                hero and pads its own body. */}
            <SpotDetailCard
              spot={spot}
              titleId={titleId}
              distanceKm={distanceKm}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
