"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";

interface MediaThumbnailBarProps {
  items: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
  type?: "photos" | "pano";
  spotName?: string;
}

// Strip of small preview pictures shown at the bottom of the photo lightbox
// or 360° viewer. Keeps photos and 360° views strictly separate.
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
      {items.map((src, i) => {
        const isActive = activeIndex === i;

        return (
          <button
            key={src}
            ref={isActive ? activeRef : undefined}
            type="button"
            onClick={() => onSelect(i)}
            aria-label={
              isPano
                ? items.length > 1
                  ? `${t("media.panoThumbLabel")} ${i + 1}`
                  : t("media.panoThumbLabel")
                : t("media.thumbLabel", { index: i + 1 })
            }
            aria-current={isActive ? "true" : undefined}
            className={`tactile group relative h-12 w-12 shrink-0 overflow-hidden rounded-lg transition-all focus-visible:outline-2 focus-visible:outline-white sm:h-14 sm:w-14 ${
              isActive
                ? "scale-105 opacity-100 shadow-md ring-2 ring-white"
                : "border border-white/20 opacity-60 hover:scale-102 hover:opacity-100"
            }`}
          >
            {failedMap[src] ? (
              <span className="flex h-full w-full items-center justify-center bg-white/10 text-white/60">
                <ImageOff size={16} aria-hidden="true" />
              </span>
            ) : (
              <Image
                src={src}
                alt=""
                fill
                sizes="56px"
                className="object-cover"
                onError={() => setFailedMap((prev) => ({ ...prev, [src]: true }))}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
