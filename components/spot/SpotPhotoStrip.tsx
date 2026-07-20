"use client";

import Image from "next/image";
import { Camera, ImageOff } from "lucide-react";
import SectionTitle from "@/components/spot/SectionTitle";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { SpotMediaState } from "@/lib/hooks/useSpotMedia";
import type { Spot } from "@/lib/types";

const THUMB =
  "h-11 w-14 shrink-0 overflow-hidden rounded-lg border transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

// Picks which media the hero shows. The 360° panorama leads the strip when a
// spot has one, mirroring its place at the head of the media sequence.
//
// The photographer credit lives here rather than on the hero: the Wikimedia
// Commons licences require it stay visible, and white-on-photo at the bottom
// of the hero would collide with the title.
export default function SpotPhotoStrip({
  spot,
  media,
}: {
  spot: Spot;
  media: SpotMediaState;
}) {
  const { t } = useLocale();
  const {
    images,
    hasPano,
    total,
    isEmpty,
    active,
    panoOpen,
    failedMap,
    markFailed,
    checkOnMount,
  } = media;

  if (isEmpty) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-line px-4 py-3 text-ink/70">
        <Camera size={16} aria-hidden="true" />
        <span className="font-mono text-[11px] uppercase tracking-widest">
          {t("media.none")}
        </span>
      </div>
    );
  }

  const activeImage = active === "pano" ? null : images[active];
  const panoSelected = active === "pano";

  // Attribution follows what's on screen. With a photo selected that's one
  // image; while the panorama holds the hero the thumbnails are still showing
  // every photo, and the Commons licences want each of those credited — so
  // fall back to the distinct contributors behind the strip.
  const credited = activeImage
    ? [activeImage]
    : images.filter(
        (img, i) =>
          !failedMap[img.src] &&
          images.findIndex((o) => o.credit === img.credit && o.license === img.license) === i
      );

  return (
    <section>
      {total > 1 && (
        <>
          <SectionTitle>{t("spot.photos")}</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {hasPano && (
              <button
                type="button"
                onClick={media.openPano}
                aria-label={t("media.panoThumbLabel")}
                aria-pressed={panoSelected}
                className={`relative ${THUMB} ${
                  panoSelected ? "border-ink" : "border-line opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={spot.pano360!}
                  alt=""
                  width={56}
                  height={44}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center bg-scrim/70 py-px font-mono text-[8px] font-medium uppercase tracking-wider text-white">
                  360°
                </span>
              </button>
            )}
            {images.map((img, i) => (
              <button
                key={img.src}
                type="button"
                onClick={() => media.selectImage(i)}
                aria-label={t("media.thumbLabel", { index: i + 1 })}
                aria-pressed={!panoOpen && active === i}
                className={`${THUMB} ${
                  !panoOpen && active === i
                    ? "border-ink"
                    : "border-line opacity-70 hover:opacity-100"
                }`}
              >
                {failedMap[img.src] ? (
                  <span className="flex h-full w-full items-center justify-center bg-ink/4 text-ink/40">
                    <ImageOff size={14} aria-hidden="true" />
                  </span>
                ) : (
                  <Image
                    src={img.src}
                    alt=""
                    width={56}
                    height={44}
                    ref={checkOnMount(img.src)}
                    onError={() => markFailed(img.src)}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {credited
        .filter((img) => !failedMap[img.src])
        .map((img) => (
          <p key={img.src} className="mt-2 font-mono text-[10px] text-ink/70">
            {t("media.credit")}{" "}
            <a
              href={img.page}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-ink/20 underline-offset-2 hover:text-ink/70"
            >
              {img.credit}
            </a>{" "}
            · {img.license} · Wikimedia Commons
          </p>
        ))}
    </section>
  );
}
