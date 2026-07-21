"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { useLocale } from "@/components/providers/LocaleProvider";

// Pannellum needs the browser; only load the viewer once the overlay opens.
const Pano360Viewer = dynamic(() => import("@/components/spot/Pano360Viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center font-mono text-xs text-white/70">
      Loading 360°…
    </div>
  ),
});

// Full-screen 360° viewer, opened from the last tile of the photo gallery.
// Mirrors PhotoLightbox's chrome and isolation: Escape is captured ahead of the
// modal's own listener so closing the panorama doesn't also close the spot
// modal underneath, and body-scroll locking is left to SpotModal (this only
// ever opens from inside it).
export default function PanoOverlay({
  src,
  title,
  onClose,
}: {
  src: string;
  title: string;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, true);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return (
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("media.panoLabel", { name: title })}
      tabIndex={-1}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="fixed inset-0 z-[60] bg-scrim/95 outline-none"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t("media.exit360")}
        className="tactile absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <X size={18} aria-hidden="true" />
      </button>
      <div className="absolute inset-0 p-3 sm:p-8">
        <div className="h-full w-full overflow-hidden rounded-xl">
          <Pano360Viewer src={src} title={title} />
        </div>
      </div>
    </motion.div>
  );
}
