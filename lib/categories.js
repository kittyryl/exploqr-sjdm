import { Church, Mountain, Droplet, Tent, Flag } from "lucide-react";

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
export const CATEGORIES = {
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
const ICON_OVERRIDES = {
  droplet: Droplet,
  tent: Tent,
};

// Resolve the icon component for a spot: its override if set, else its
// category's default icon.
export function spotIcon(spot) {
  return ICON_OVERRIDES[spot.icon] || CATEGORIES[spot.category].icon;
}

// "Graceville" → "Brgy. Graceville". Left alone when the field already names
// the barangay itself ("Area C, Brgy. Paradise"), which the template would
// otherwise render as "Brgy. Area C, Brgy. Paradise".
export function barangayLabel(spot, t) {
  return /brgy\.|barangay/i.test(spot.barangay)
    ? spot.barangay
    : t("spot.barangay", { name: spot.barangay });
}

// Format a lat/lng pair as a topo-style waypoint datum, e.g.
// "14.7935° N, 121.0667° E".
export function formatCoords(lat, lng) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lng).toFixed(4)}° ${ew}`;
}

export function directionsUrl(spot) {
  return `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`;
}
