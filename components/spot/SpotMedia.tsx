"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Camera, ImageOff, ZoomIn } from "lucide-react";
import PhotoLightbox from "@/components/spot/PhotoLightbox";
import { useImageFallbackMap } from "@/lib/hooks/useImageFallback";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Spot } from "@/lib/types";

// Pannellum needs the browser; only load the viewer when a 360° is opened.
const Pano360Viewer = dynamic(() => import("@/components/spot/Pano360Viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-ink/[.04] font-mono text-xs text-ink/70">
      Loading 360°…
    </div>
  ),
});

type ActiveMedia = number | "pano";

// Photo/360 panel for a spot: main view, thumbnail switcher, and the
// photographer credit that the Commons licenses require us to keep visible.
export default function SpotMedia({ spot }: { spot: Spot }) {
  const { t, text } = useLocale();
  const images = spot.images || [];
  const hasPano = Boolean(spot.pano360);
  const [active, setActive] = useState<ActiveMedia>(hasPano && images.length === 0 ? "pano" : 0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // Every photo is hotlinked from Wikimedia; a dead URL should read as a
  // gap, not a broken-image glyph. Keyed by src so a failure sticks to the
  // one photo rather than the slot it happened to be in.
  const { failedMap, markFailed, checkOnMount } = useImageFallbackMap();

  if (images.length === 0 && !hasPano) {
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
  const showThumbs = images.length + (hasPano ? 1 : 0) > 1;

  return (
    <figure>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-ink/[.04]">
        {active === "pano" ? (
          // hasPano guarantees pano360 is set whenever "pano" can be selected.
          <Pano360Viewer src={spot.pano360!} title={text(spot.name)} />
        ) : activeImage && failedMap[activeImage.src] ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink/70">
            <ImageOff size={20} aria-hidden="true" />
            <span className="font-mono text-[11px] uppercase tracking-widest">
              {t("media.failed")}
            </span>
          </div>
        ) : activeImage ? (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="group relative h-full w-full cursor-zoom-in"
            aria-label={t("media.zoomLabel", {
              name: text(spot.name),
              index: (active as number) + 1,
              total: images.length,
            })}
          >
            <Image
              src={activeImage.src}
              alt={t("media.alt", {
                name: text(spot.name),
                index: (active as number) + 1,
                total: images.length,
              })}
              fill
              sizes="(min-width: 768px) 320px, 100vw"
              ref={checkOnMount(activeImage.src)}
              onError={() => markFailed(activeImage.src)}
              className="object-cover"
            />
            <span className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-scrim/80 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <ZoomIn size={11} aria-hidden="true" />
              {t("media.zoom")}
            </span>
          </button>
        ) : null}
      </div>

      {showThumbs && (
        <div className="mt-2 flex gap-2">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={t("media.thumbLabel", { index: i + 1 })}
              aria-pressed={active === i}
              className={`h-11 w-14 shrink-0 overflow-hidden rounded-lg border transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                active === i
                  ? "border-ink"
                  : "border-line opacity-70 hover:opacity-100"
              }`}
            >
              {failedMap[img.src] ? (
                <span className="flex h-full w-full items-center justify-center bg-ink/[.04] text-ink/40">
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
          {hasPano && (
            <button
              type="button"
              onClick={() => setActive("pano")}
              aria-pressed={active === "pano"}
              className={`flex h-11 shrink-0 items-center rounded-lg border px-3 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                active === "pano"
                  ? "border-ink bg-ink text-paper"
                  : "border-line text-ink/70 hover:border-ink/40"
              }`}
            >
              360°
            </button>
          )}
        </div>
      )}

      {activeImage && !failedMap[activeImage.src] && (
        <figcaption className="mt-1.5 font-mono text-[10px] text-ink/70">
          {t("media.credit")}{" "}
          <a
            href={activeImage.page}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-ink/20 underline-offset-2 hover:text-ink/70"
          >
            {activeImage.credit}
          </a>{" "}
          · {activeImage.license} · Wikimedia Commons
        </figcaption>
      )}

      {lightboxOpen && active !== "pano" && (
        <PhotoLightbox
          images={images}
          index={active}
          spotName={text(spot.name)}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => setActive((i) => (((i as number) - 1 + images.length) % images.length))}
          onNext={() => setActive((i) => (((i as number) + 1) % images.length))}
        />
      )}
    </figure>
  );
}
