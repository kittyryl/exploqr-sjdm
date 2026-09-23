"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";

export interface MediaThumbnailItem {
  src: string;
  caption?: string;
}

export type MediaThumbnailInput = string | MediaThumbnailItem;

interface MediaThumbnailBarProps {
  items: MediaThumbnailInput[];
  activeIndex: number;
  onSelect: (index: number) => void;
  type?: "photos" | "pano";
  spotName?: string;
}

// Strip of small preview pictures shown at the bottom of the photo lightbox
// or 360° viewer. Keeps photos and 360° views strictly separate. Supports
// captions on thumbnails (e.g. "Entrance", "Outside look").
export default function MediaThumbnailBar({
  items,
  activeIndex,
  onSelect,
  type = "photos",
}: MediaThumbnailBarProps) {
  const { t } = useLocale();
  const activeRef = useRef<HTMLButtonElement>(null);
  const [failedMap, setFailedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeIndex]);

  if (items.length === 0) return null;

  const isPano = type === "pano";

  return (
    <nav
      aria-label={isPano ? t("spot.view360") : t("spot.photos")}
      className="flex max-w-full items-center gap-2 overflow-x-auto rounded-2xl border border-white/15 bg-black/60 px-3 py-2 shadow-2xl backdrop-blur-md"
    >
      {items.map((item, i) => {
        const src = typeof item === "string" ? item : item.src;
        const caption = typeof item === "string" ? undefined : item.caption;
        const isActive = activeIndex === i;

        return (
          <button
            key={`${src}-${i}`}
            ref={isActive ? activeRef : undefined}
            type="button"
            onClick={() => onSelect(i)}
            aria-label={
              caption
                ? caption
                : isPano
                ? items.length > 1
                  ? `${t("media.panoThumbLabel")} ${i + 1}`
                  : t("media.panoThumbLabel")
                : t("media.thumbLabel", { index: i + 1 })
            }
            aria-current={isActive ? "true" : undefined}
            className={`tactile group relative shrink-0 overflow-hidden rounded-lg transition-all focus-visible:outline-2 focus-visible:outline-white ${
              caption
                ? "h-14 w-20 sm:h-16 sm:w-24"
                : "h-12 w-12 sm:h-14 sm:w-14"
            } ${
              isActive
                ? "scale-105 opacity-100 shadow-md ring-2 ring-white"
                : "border border-white/20 opacity-70 hover:scale-102 hover:opacity-100"
            }`}
          >
            {failedMap[src] ? (
              <span className="flex h-full w-full items-center justify-center bg-white/10 text-white/60">
                <ImageOff size={16} aria-hidden="true" />
              </span>
            ) : (
              <>
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes={caption ? "96px" : "56px"}
                  className="object-cover"
                  onError={() => setFailedMap((prev) => ({ ...prev, [src]: true }))}
                />
                {caption && (
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center bg-gradient-to-t from-black/90 via-black/55 to-transparent px-1 pb-1 pt-3">
                    <span className="truncate font-sans text-[10px] font-semibold tracking-wide text-white drop-shadow-sm sm:text-[11px]">
                      {caption}
                    </span>
                  </span>
                )}
              </>
            )}
          </button>
        );
      })}
    </nav>
  );
}
