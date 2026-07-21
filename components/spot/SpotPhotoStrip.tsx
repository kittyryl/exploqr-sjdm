"use client";

import Image from "next/image";
import { Camera, ImageOff, ZoomIn } from "lucide-react";
import SectionTitle from "@/components/spot/SectionTitle";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { SpotMediaState } from "@/lib/hooks/useSpotMedia";
import type { Spot } from "@/lib/types";

const TILE =
  "tactile group relative aspect-[4/3] overflow-hidden rounded-xl border border-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

// The photo gallery below the fold — this is where a visitor opens the imagery.
// Every photo is a tap-to-zoom tile that opens the lightbox. The 360° panorama
// is NOT here: it lives behind the "360° View" action button (see SpotActions),
// so the gallery stays a clean grid of stills.
export default function SpotPhotoStrip({
  spot,
  media,
}: {
  spot: Spot;
  media: SpotMediaState;
}) {
  const { t, text } = useLocale();
  const { images, failedMap, markFailed, checkOnMount } = media;
  const name = text(spot.name);

  // No photos: only announce "coming soon" when there's truly nothing to show.
  // A spot with just a 360° has no gallery — its panorama opens from the button.
  if (images.length === 0) {
    return media.isEmpty ? (
      <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-line px-4 py-3 text-ink/70">
        <Camera size={16} aria-hidden="true" />
        <span className="font-mono text-[11px] uppercase tracking-widest">
          {t("media.none")}
        </span>
      </div>
    ) : null;
  }

  return (
    <section>
      <SectionTitle>{t("spot.photos")}</SectionTitle>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {images.map((img, i) => (
          <button
            key={img.src}
            type="button"
            onClick={() => media.openLightboxAt(i)}
            aria-label={t("media.zoomLabel", {
              name,
              index: i + 1,
              total: images.length,
            })}
            className={TILE}
          >
            {failedMap[img.src] ? (
              <span className="flex h-full w-full items-center justify-center bg-ink/4 text-ink/40">
                <ImageOff size={16} aria-hidden="true" />
              </span>
            ) : (
              <>
                <Image
                  src={img.src}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 10rem, 45vw"
                  ref={checkOnMount(img.src)}
                  onError={() => markFailed(img.src)}
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-scrim/0 text-white opacity-0 transition-all duration-200 group-hover:bg-scrim/30 group-hover:opacity-100">
                  <ZoomIn size={18} aria-hidden="true" />
                </span>
              </>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
