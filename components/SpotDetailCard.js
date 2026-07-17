"use client";

import {
  Clock,
  Globe,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  Ticket,
} from "lucide-react";
import {
  CATEGORIES,
  spotIcon,
  formatCoords,
  directionsUrl,
  barangayLabel,
} from "@/lib/categories";
import { formatDistance } from "@/lib/geo";
import SpotMedia from "@/components/SpotMedia";
import { useLocale } from "@/components/LocaleProvider";

// "https://www.cattlecreek.ph/rates" → "cattlecreek.ph". A bare hostname is
// the readable part of a URL; the rest is noise in a 12px mono line.
function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// Detail content for a spot: category-tinted icon box, name, badge,
// waypoint coordinates, description, hours, directions button, and photos.
// Rendered inside SpotModal, which supplies the surrounding card chrome.
// `distanceKm` is optional — set when the visitor has shared their location.
export default function SpotDetailCard({ spot, titleId, distanceKm }) {
  const { t, text } = useLocale();
  if (!spot) return null;
  const cat = CATEGORIES[spot.category];
  const Icon = spotIcon(spot);

  return (
    <article className="spot-card">
      <div className="flex flex-col gap-5 md:flex-row">
        <div className="min-w-0 md:order-2 md:w-[320px] md:shrink-0">
          <SpotMedia spot={spot} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-5 sm:flex-row">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl sm:h-16 sm:w-16"
            style={{ background: cat.tint, color: cat.accent }}
            aria-hidden="true"
          >
            <Icon size={28} strokeWidth={2} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink/70">
              {formatCoords(spot.lat, spot.lng)}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <h2
                id={titleId}
                className="font-display text-xl font-bold leading-snug text-ink sm:text-2xl"
              >
                {text(spot.name)}
              </h2>
              <span
                className="rounded-full px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider"
                style={{ background: cat.tint, color: cat.accent }}
              >
                {t(`cat.${spot.category}`)}
              </span>
            </div>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink/70">
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

            <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-ink/80">
              {text(spot.description)}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
              <p className="flex items-center gap-1.5 font-mono text-xs text-ink/70">
                <Clock size={14} aria-hidden="true" />
                {text(spot.hours)}
              </p>
              {/* The practical details. Each is optional and simply absent
                  until someone confirms it locally — an empty row would be
                  worse than no row. */}
              {spot.fee && (
                <p className="flex items-center gap-1.5 font-mono text-xs text-ink/70">
                  <Ticket size={14} aria-hidden="true" />
                  <span className="sr-only">{t("spot.fee")}: </span>
                  {text(spot.fee)}
                </p>
              )}
              {spot.contact && (
                <a
                  href={`tel:${spot.contact.replace(/\s+/g, "")}`}
                  aria-label={t("spot.contact", { number: spot.contact })}
                  className="flex items-center gap-1.5 font-mono text-xs text-ink/70 underline decoration-ink/20 underline-offset-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <Phone size={14} aria-hidden="true" />
                  {spot.contact}
                </a>
              )}
              {spot.website && (
                <a
                  href={spot.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("spot.website")}
                  className="flex items-center gap-1.5 font-mono text-xs text-ink/70 underline decoration-ink/20 underline-offset-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <Globe size={14} aria-hidden="true" />
                  {hostOf(spot.website)}
                </a>
              )}
              <a
                href={directionsUrl(spot)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                style={{ background: cat.accent, color: cat.btnFg }}
              >
                <Navigation size={15} aria-hidden="true" />
                {t("spot.directions")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
