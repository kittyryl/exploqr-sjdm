"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { X, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { useImageFallback } from "@/lib/hooks/useImageFallback";
import { useLocale } from "@/components/providers/LocaleProvider";

interface PhotoLightboxProps {
  images: string[];
  index: number;
  spotId: string;
  spotName: string;
  // Whether there's more than one photo (or a 360 view) to flip through,
  // so we know whether to show the arrows.
  navigable: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

// Full-screen photo view. Escape and arrow keys are handled here first, so
// they only close or move this, not the spot window behind it.
//
// The photo visually grows out of its small thumbnail into full-screen and
// shrinks back the same way when closed. Stepping to the next/previous photo
// just fades between images instead, so the frame stays put.
export default function PhotoLightbox({
  images,
  index,
  spotId,
  spotName,
  navigable,
  onClose,
  onPrev,
  onNext,
}: PhotoLightboxProps) {
  const { t } = useLocale();
  const panelRef = useRef<HTMLDivElement>(null);
  const { failed, onError, checkOnMount } = useImageFallback(index);

  useFocusTrap(panelRef, true);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.stopPropagation();
        onPrev();
      } else if (e.key === "ArrowRight") {
        e.stopPropagation();
        onNext();
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose, onPrev, onNext]);

  const src = images[index];
  if (!src) return null;

  return (
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("media.alt", { name: spotName, index: index + 1, total: images.length })}
      tabIndex={-1}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-scrim/95 p-4 outline-none backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t("lightbox.close")}
        className="tactile absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <X size={18} aria-hidden="true" />
      </button>

      {navigable && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label={t("lightbox.prev")}
            className="tactile absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:left-4"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            aria-label={t("lightbox.next")}
            className="tactile absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-4"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </>
      )}

      {failed ? (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-white/30 px-8 py-12 text-white/70"
        >
          <ImageOff size={22} aria-hidden="true" />
          <p className="font-mono text-[11px] uppercase tracking-widest">
            {t("media.failed")}
          </p>
        </div>
      ) : (
        <motion.div
          layoutId={`spot-photo-${spotId}`}
          onClick={(e) => e.stopPropagation()}
          className="relative h-[80vh] w-full max-w-5xl"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={src}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <Image
                src={src}
                alt={t("media.alt", { name: spotName, index: index + 1, total: images.length })}
                fill
                sizes="100vw"
                priority
                ref={checkOnMount}
                onError={onError}
                className="object-contain drop-shadow-2xl"
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
