// Shared domain types. `data/spots.js`'s own header comment documents the
// authoritative shape in prose; this is that shape formalized.

export type Locale = "en" | "tl";

// A UI/content string that's either plain English (treated as the shape
// everything still uses today) or translated per-locale. Missing `tl` falls
// back to `en` — see lib/i18n.js's `text()`.
export type LocaleText = string | { en: string; tl?: string };

export type CategoryKey =
  | "religious"
  | "nature"
  | "parks"
  | "resorts"
  | "leisure";

export interface OpenHours {
  open: string; // "HH:MM", 24h
  close: string; // "HH:MM", 24h
  closedDays?: number[]; // 0 (Sun) - 6 (Sat)
}

export interface SpotImage {
  src: string;
  credit: string;
  license: string;
  page: string;
}

export interface Spot {
  id: string;
  name: LocaleText;
  barangay: string;
  // Full street address as the city tourism office writes it. `barangay` stays
  // separate because the map, the labels, and the list all key off it — this is
  // the human-readable line shown in the detail panel.
  address?: string;
  category: CategoryKey;
  lat: number;
  lng: number;
  description: LocaleText;
  hours: LocaleText;
  openHours?: OpenHours;
  images?: SpotImage[];
  icon?: string; // key into ICON_OVERRIDES, lib/categories.js
  pano360?: string;
  fee?: LocaleText;
  contact?: string;
  website?: string;
  // The Facebook page's name, not a URL — that's how the tourism office
  // records it, and most of these have no verified vanity URL. Rendered as
  // plain text, since linking a guessed URL could send visitors to an
  // impostor page.
  facebook?: string;
  // Short facilities on offer — parking, restrooms, wifi. Rendered as pills in
  // the detail modal; the whole section is omitted when this is absent, since
  // an empty amenities list reads as "none available" rather than "unconfirmed".
  amenities?: LocaleText[];
}

export interface UserLocation {
  lat: number;
  lng: number;
}
