"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { Compass, Maximize2, X } from "lucide-react";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { useLocale } from "@/components/providers/LocaleProvider";
import MediaThumbnailBar from "@/components/spot/MediaThumbnailBar";
import type { PanoItem } from "@/lib/types";

// The 360 viewer only works in the browser, so it's loaded only once this overlay opens.
const Pano360Viewer = dynamic(() => import("@/components/spot/Pano360Viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center font-mono text-xs text-white/70">
      Loading 360°…
    </div>
  ),
});

interface PanoOverlayProps {
  src?: string;
  panos?: (string | PanoItem)[];
  activeIndex?: number;
  onSelectPano?: (index: number) => void;
  title: string;
  onClose: () => void;
}

// Full-screen 360° viewer. When there are multiple 360° views, renders a
// thumbnail strip at the bottom dedicated solely to 360° panoramas.
export default function PanoOverlay({
  src,
  panos = [],
  activeIndex = 0,
  onSelectPano,
  title,
  onClose,
}: PanoOverlayProps) {
  const { t } = useLocale();
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, true);

  const rawList: (string | PanoItem)[] =
    panos.length > 0 ? panos : src ? [src] : [];
  const defaultCaptions = ["Entrance", "Outside look"];
  const expandedList =
    rawList.length === 1 ? [rawList[0], rawList[0]] : rawList;

  const panoList: PanoItem[] = expandedList.map((item, idx) => {
    if (typeof item === "string") {
      return {
        src: item,
        caption: defaultCaptions[idx] || `View ${idx + 1}`,
      };
    }
    return {
      src: item.src,
      caption: item.caption || defaultCaptions[idx] || `View ${idx + 1}`,
    };
  });

  const [internalIndex, setInternalIndex] = useState(activeIndex);
  const currentIndex = onSelectPano ? activeIndex : internalIndex;

  const handleSelect = useCallback(
    (idx: number) => {
      if (!onSelectPano) {
        setInternalIndex(idx);
      } else {
        onSelectPano(idx);
      }
    },
    [onSelectPano]
  );

  const currentItem = panoList[currentIndex] ?? panoList[0];
  const currentSrc = currentItem?.src ?? src;

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (e.key === "ArrowLeft" && panoList.length > 1) {
        e.stopPropagation();
        const next = (currentIndex - 1 + panoList.length) % panoList.length;
        handleSelect(next);
      } else if (e.key === "ArrowRight" && panoList.length > 1) {
        e.stopPropagation();
        const next = (currentIndex + 1) % panoList.length;
        handleSelect(next);
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose, currentIndex, panoList.length, handleSelect]);

  if (!currentSrc) return null;

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

      {/* Caption & Tooltip explaining the top-left Full view (fullscreen) and Gyro controls */}
      <div
        title={t("media.controlsHint")}
        className="pointer-events-none absolute left-14 top-3.5 z-10 flex max-w-[calc(100vw-110px)] items-center gap-1.5 rounded-full border border-white/15 bg-black/65 px-2.5 py-1 text-[10px] font-medium text-white/90 shadow-md backdrop-blur-md sm:left-22 sm:top-9 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-[11px]"
      >
        {currentItem?.caption && (
          <>
            <span className="max-w-[70px] truncate font-semibold text-white sm:max-w-none">
              {currentItem.caption}
            </span>
            <span className="text-white/30" aria-hidden="true">
              ·
            </span>
          </>
        )}
        <span className="flex items-center gap-1">
          <Maximize2 size={11} className="shrink-0 text-white/70 sm:size-3" aria-hidden="true" />
          <span className="truncate">{t("media.fullView")}</span>
        </span>
        <span className="text-white/30" aria-hidden="true">
          ·
        </span>
        <span className="flex items-center gap-1">
          <Compass size={11} className="shrink-0 text-white/70 sm:size-3" aria-hidden="true" />
          <span className="truncate">{t("media.gyroMotion")}</span>
        </span>
      </div>

      <div
        className={`absolute inset-0 p-3 sm:p-8 ${
          panoList.length > 0 ? "pb-24 sm:pb-28" : ""
        }`}
      >
        <div className="h-full w-full overflow-hidden rounded-xl">
          <Pano360Viewer key={currentSrc} src={currentSrc} title={title} />
        </div>
      </div>

      {panoList.length > 0 && (
        <div className="pointer-events-none absolute bottom-4 left-0 right-0 z-20 flex justify-center px-4 sm:bottom-6">
          <div
            className="pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <MediaThumbnailBar
              items={panoList}
              activeIndex={currentIndex}
              onSelect={handleSelect}
              type="pano"
              spotName={title}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
