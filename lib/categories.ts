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

export interface CategoryTokens {
  fill: string;
  accent: string;
  tint: string;
  btnFg: string;
  block: string;
  blockFg: string;
  icon: LucideIcon;
}

// Colors and icons for each category, used everywhere: map pins, cards, lists, chips.
//
// Colors are CSS variables (set in app/globals.css) instead of fixed hex codes, so they
// can switch automatically between light and dark mode.
//
//   fill    — the bold pin/dot color. Not for text — too light to read on.
//   accent  — readable text and icon color.
//   tint    — soft background that accent text sits on.
//   btnFg   — text color for a solid accent-colored button.
//   block   — bold solid background block (e.g. a spot with no photo), same in both themes.
//   blockFg — text/icon color on top of block.
//
// Category display names live in lib/i18n.js instead, since they can be translated.
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
  // Parks get their own color instead of reusing nature's green — a city park and a
  // mountain waterfall are different kinds of trips, and two greens would look the same on the map.
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

// Lets a specific spot use a different icon than its category's default.
const ICON_OVERRIDES: Record<string, LucideIcon> = {
  droplet: Droplet,
  tent: Tent,
  eye: Eye,
};

// Use the spot's own icon if it has one, otherwise fall back to its category's icon.
export function spotIcon(spot: Spot): LucideIcon {
  return (spot.icon && ICON_OVERRIDES[spot.icon]) || CATEGORIES[spot.category].icon;
}

type TFn = (key: UIKey, vars?: Record<string, string | number>) => string;

// Adds "Brgy." in front of a barangay name, unless it's already there.
export function barangayLabel(spot: Spot, t: TFn): string {
  return /brgy\.|barangay/i.test(spot.barangay)
    ? spot.barangay
    : t("spot.barangay", { name: spot.barangay });
}

// Formats coordinates like "14.7935° N, 121.0667° E".
export function formatCoords(lat: number, lng: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lng).toFixed(4)}° ${ew}`;
}

// Shows just the site name (like "cattlecreek.ph") instead of the full web address, which is easier to read in small text.
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
