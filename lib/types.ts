// Shared domain types. `data/spots.js`'s own header comment documents the
// authoritative shape in prose; this is that shape formalized.

export type Locale = "en" | "tl";

// A UI/content string that's either plain English (treated as the shape
// everything still uses today) or translated per-locale. Missing `tl` falls
// back to `en` — see lib/i18n.js's `text()`.
export type LocaleText = string | { en: string; tl?: string };

export type CategoryKey = "religious" | "nature" | "leisure";

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
}

export interface UserLocation {
  lat: number;
  lng: number;
}
