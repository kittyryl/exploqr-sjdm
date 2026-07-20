import {
  Church,
  Mountain,
  Droplet,
  Tent,
  Flag,
  Trees,
  Waves,
  Eye,
  type LucideIcon,
} from "lucide-react";
import type { CategoryKey, Spot } from "@/lib/types";
import type { UIKey } from "@/lib/i18n";

interface CategoryTokens {
  fill: string;
  accent: string;
  tint: string;
  btnFg: string;
  block: string;
  blockFg: string;
  icon: LucideIcon;
}

// Category design tokens — the single source of truth for category color
// and iconography across the map markers, detail card, list, and chips.
//
// The color values are CSS variables (defined in app/globals.css) rather than
// hex: components apply them as inline styles, and only a variable can resolve
// per-theme without a JS media query that would break hydration.
//
//   fill   — saturated identity color; the same in both themes. Carries no
//            text: white on it measures 3.4–3.9:1, under AA. Markers, dots,
//            and the icon watermark only.
//   accent — legible text/icon color, dark on paper and light on ink
//   tint   — the quiet surface `accent` is meant to sit on
//   btnFg  — text color for a solid `accent` button, flipping with it
//   block  — saturated card-sized surface that *does* carry text (`blockFg`).
//            Theme-constant, like the scrim: a spot tile with no photo reads
//            as a color block in both modes.
//   blockFg — text/icon color on `block`
//
// Display names are not here: they're translatable, so they live in the
// `cat.<key>` entries of lib/i18n.js and are resolved with t() at render.
export const CATEGORIES: Record<CategoryKey, CategoryTokens> = {
  religious: {
    fill: "var(--cat-religious-fill)",
    accent: "var(--cat-religious-accent)",
    tint: "var(--cat-religious-tint)",
    btnFg: "var(--cat-religious-btn-fg)",
    block: "var(--cat-religious-block)",
    blockFg: "var(--cat-block-fg)",
    icon: Church,
  },
  nature: {
    fill: "var(--cat-nature-fill)",
    accent: "var(--cat-nature-accent)",
    tint: "var(--cat-nature-tint)",
    btnFg: "var(--cat-nature-btn-fg)",
    block: "var(--cat-nature-block)",
    blockFg: "var(--cat-block-fg)",
    icon: Mountain,
  },
  // Public open space — the city's river esplanade, family parks, eco-park.
  // Deliberately a separate hue from `nature` rather than a second green: a
  // landscaped urban park and a waterfall in the Sierra Madre are different
  // trips, and two greens on one map read as one category.
  parks: {
    fill: "var(--cat-parks-fill)",
    accent: "var(--cat-parks-accent)",
    tint: "var(--cat-parks-tint)",
    btnFg: "var(--cat-parks-btn-fg)",
    block: "var(--cat-parks-block)",
    blockFg: "var(--cat-block-fg)",
    icon: Trees,
  },
  resorts: {
    fill: "var(--cat-resorts-fill)",
    accent: "var(--cat-resorts-accent)",
    tint: "var(--cat-resorts-tint)",
    btnFg: "var(--cat-resorts-btn-fg)",
    block: "var(--cat-resorts-block)",
    blockFg: "var(--cat-block-fg)",
    icon: Waves,
  },
  leisure: {
    fill: "var(--cat-leisure-fill)",
    accent: "var(--cat-leisure-accent)",
    tint: "var(--cat-leisure-tint)",
    btnFg: "var(--cat-leisure-btn-fg)",
    block: "var(--cat-leisure-block)",
    blockFg: "var(--cat-block-fg)",
    icon: Flag,
  },
};

// Per-spot icon overrides (spot.icon string → lucide component).
const ICON_OVERRIDES: Record<string, LucideIcon> = {
  droplet: Droplet,
  tent: Tent,
  eye: Eye,
};

// Resolve the icon component for a spot: its override if set, else its
// category's default icon.
export function spotIcon(spot: Spot): LucideIcon {
  return (spot.icon && ICON_OVERRIDES[spot.icon]) || CATEGORIES[spot.category].icon;
}

type TFn = (key: UIKey, vars?: Record<string, string | number>) => string;

// "Graceville" → "Brgy. Graceville". Left alone when the field already names
// the barangay itself ("Area C, Brgy. Paradise"), which the template would
// otherwise render as "Brgy. Area C, Brgy. Paradise".
export function barangayLabel(spot: Spot, t: TFn): string {
  return /brgy\.|barangay/i.test(spot.barangay)
    ? spot.barangay
    : t("spot.barangay", { name: spot.barangay });
}

// Format a lat/lng pair as a topo-style waypoint datum, e.g.
// "14.7935° N, 121.0667° E".
export function formatCoords(lat: number, lng: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lng).toFixed(4)}° ${ew}`;
}

export function directionsUrl(spot: Spot): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`;
}

// "https://www.cattlecreek.ph/rates" → "cattlecreek.ph". A bare hostname is
// the readable part of a URL; the rest is noise in a 12px mono line.
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
