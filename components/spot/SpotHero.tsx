"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { ImageOff, LocateFixed, MapPin, Minimize2, ZoomIn } from "lucide-react";
import { CATEGORIES, spotIcon, barangayLabel } from "@/lib/categories";
import { formatDistance } from "@/lib/geo";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { SpotMediaState } from "@/lib/hooks/useSpotMedia";
import type { Spot } from "@/lib/types";

// Pannellum needs the browser; only load the viewer when a 360° is opened.
const Pano360Viewer = dynamic(() => import("@/components/spot/Pano360Viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-ink/4 font-mono text-xs text-ink/70">
      Loading 360°…
    </div>
  ),
});

interface SpotHeroProps {
  spot: Spot;
  media: SpotMediaState;
  titleId?: string;
  distanceKm?: number;
}

// The banner that opens the detail panel, and the panel's main media surface:
// it shows whatever the thumbnail strip has selected, and becomes the live
// 360° viewer in place when a panorama is entered.
//
// Outside 360° mode it is deliberately a *still*. The title, the category
// pill, and the modal's close button all sit on top of this, and drag-to-look
// on a live Pannellum canvas would fight all three — so entering the panorama
// hides the overlay instead of layering over it.
export default function SpotHero({ spot, media, titleId, distanceKm }: SpotHeroProps) {
  const { t, text } = useLocale();
  const cat = CATEGORIES[spot.category];
  const Icon = spotIcon(spot);
  const {
    images,
    hasPano,
    isEmpty,
    active,
    panoOpen,
    failedMap,
    markFailed,
    checkOnMount,
  } = media;

  // The panorama doubles as its own cover art, the same way it leads the
  // thumbnail strip. Its equirectangular framing crops oddly, but it is the
  // truest single image of a spot we have.
  const stillSrc = active === "pano" ? spot.pano360 : images[active]?.src;
  const failed = Boolean(stillSrc && failedMap[stillSrc]);
  const showStill = Boolean(stillSrc) && !failed;
  const photoIndex = active === "pano" ? null : active;

  // The still photo and PhotoLightbox's photo share this id so Motion can
  // FLIP the photo between them. Exactly one of the two ever claims it:
  // this hero holds it while the lightbox is closed, and hands it off
  // (sets its own layoutId to undefined) the instant the lightbox opens —
  // see PhotoLightbox for the other half of the hand-off.
  const photoLayoutId = `spot-photo-${spot.id}`;

  return (
    <div className="relative h-47.5 shrink-0 overflow-hidden bg-ink/4">
      {panoOpen && hasPano ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <Pano360Viewer src={spot.pano360!} title={text(spot.name)} />
          <button
            type="button"
            onClick={media.closePano}
            aria-label={t("media.exit360")}
            className="tactile absolute left-3 top-3 z-3 flex h-8 w-8 items-center justify-center rounded-full bg-scrim/80 text-white backdrop-blur-sm transition-colors hover:bg-scrim/95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Minimize2 size={15} aria-hidden="true" />
          </button>
        </motion.div>
      ) : showStill ? (
        <motion.div
          layoutId={media.lightboxOpen ? undefined : photoLayoutId}
          className="absolute inset-0"
        >
          <Image
            src={stillSrc!}
            alt={
              photoIndex == null
                ? t("media.panoLabel", { name: text(spot.name) })
                : t("media.alt", {
                    name: text(spot.name),
                    index: photoIndex + 1,
                    total: images.length,
                  })
            }
            fill
            sizes="(min-width: 640px) 42rem, 100vw"
            loading="eager"
            ref={checkOnMount(stillSrc!)}
            onError={() => markFailed(stillSrc!)}
            className="object-cover"
          />
        </motion.div>
      ) : failed ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink/70">
          <ImageOff size={22} aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-widest">
            {t("media.failed")}
          </span>
        </div>
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ background: cat.tint, color: cat.accent }}
          aria-hidden="true"
        >
          <Icon size={56} strokeWidth={1.5} />
        </div>
      )}

      {!panoOpen && (
        <>
          {/* Keeps the white type legible over whatever the photo happens to be. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-t from-scrim/75 via-scrim/25 to-transparent"
          />
          {!isEmpty && !failed && (
            <button
              type="button"
              onClick={() => (active === "pano" ? media.openPano() : media.openLightbox())}
              aria-label={
                active === "pano"
                  ? t("media.panoLabel", { name: text(spot.name) })
                  : t("media.zoomLabel", {
                      name: text(spot.name),
                      index: (photoIndex ?? 0) + 1,
                      total: images.length,
                    })
              }
              className="group absolute inset-0 z-1 cursor-zoom-in focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
            >
              <span className="pointer-events-none absolute right-3 top-3 flex items-center gap-1 rounded-full bg-scrim/80 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <ZoomIn size={11} aria-hidden="true" />
                {active === "pano" ? "360°" : t("media.zoom")}
              </span>
            </button>
          )}
        </>
      )}

      {/* Sits above the click target so the text never swallows the click. In
          360° mode it stays mounted but hidden — the dialog's aria-labelledby
          points at this heading. */}
      <div
        className={
          panoOpen
            ? "sr-only"
            : "pointer-events-none absolute inset-x-0 bottom-0 z-2 p-5"
        }
      >
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider"
          style={{ background: cat.accent, color: cat.btnFg }}
        >
          <Icon size={12} strokeWidth={2.5} aria-hidden="true" />
          {t(`cat.${spot.category}`)}
        </span>
        <h2
          id={titleId}
          className="mt-2 font-display text-xl font-bold leading-snug text-white sm:text-2xl"
        >
          {text(spot.name)}
        </h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80">
          <span className="flex items-center gap-1">
            <MapPin size={14} aria-hidden="true" />
            {barangayLabel(spot, t)}
          </span>
          {distanceKm != null && (
            <span className="flex items-center gap-1">
              <LocateFixed size={14} aria-hidden="true" />
              {t("spot.distance", { distance: formatDistance(distanceKm) })}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
