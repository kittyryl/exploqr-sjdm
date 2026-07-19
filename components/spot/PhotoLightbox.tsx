"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { useImageFallback } from "@/lib/hooks/useImageFallback";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { SpotImage } from "@/lib/types";

interface PhotoLightboxProps {
  images: SpotImage[];
  index: number;
  spotName: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

// Full-screen zoom for a spot's photos. Body-scroll locking is left to
// SpotModal (the lightbox only ever opens from inside it); this only owns
// its own Escape/arrow-key handling, captured ahead of the modal's Escape
// listener so closing the lightbox doesn't also close the modal underneath.
export default function PhotoLightbox({
  images,
  index,
  spotName,
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

  const img = images[index];
  if (!img) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("media.alt", { name: spotName, index: index + 1, total: images.length })}
      tabIndex={-1}
      className="overlay-fade-in fixed inset-0 z-[60] flex flex-col items-center justify-center bg-scrim/95 p-4 outline-none backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t("lightbox.close")}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <X size={18} aria-hidden="true" />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label={t("lightbox.prev")}
            className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:left-4"
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
            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-4"
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
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative h-[80vh] w-full max-w-5xl"
        >
          <Image
            src={img.src}
            alt={t("media.alt", { name: spotName, index: index + 1, total: images.length })}
            fill
            sizes="100vw"
            priority
            ref={checkOnMount}
            onError={onError}
            className="object-contain drop-shadow-2xl"
          />
        </div>
      )}
      {!failed && (
        <p
          onClick={(e) => e.stopPropagation()}
          className="mt-3 font-mono text-[11px] text-white/70"
        >
          {img.credit} · {img.license} · Wikimedia Commons
        </p>
      )}
    </div>
  );
}
