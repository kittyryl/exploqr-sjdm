// Shared domain types. `data/spots.js`'s own header comment documents the
// authoritative shape in prose; this is that shape formalized.

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

export interface PanoItem {
  src: string;
  caption?: string;
}

export type PanoSource = string | PanoItem;

export interface Spot {
  id: string;
  name: string;
  barangay: string;
  // Full street address as the city tourism office writes it. `barangay` stays
  // separate because the map, the labels, and the list all key off it — this is
  // the human-readable line shown in the detail panel.
  address?: string;
  category: CategoryKey;
  lat: number;
  lng: number;
  description: string;
  hours: string;
  openHours?: OpenHours;
  // Local paths under public/images/spots/.
  images?: string[];
  icon?: string; // key into ICON_OVERRIDES, lib/categories.js
  pano360?: PanoSource | PanoSource[];
  pano360s?: PanoSource[];
  fee?: string;
  contact?: string;
  website?: string;
  // Optional direct Google Maps link. If omitted, falls back to standard
  // Google Maps search by coordinates (https://www.google.com/maps/search/?api=1&query=lat,lng).
  googleMapsUrl?: string;
  // The Facebook page's name, as the tourism office records it. Rendered as
  // plain text unless facebookUrl is also set — most of these have no
  // verified vanity URL, and linking a guessed one could send visitors to an
  // impostor page.
  facebook?: string;
  // Verified URL for the Facebook page above. Only set this when the exact
  // page has been confirmed — never a guessed vanity URL.
  facebookUrl?: string;
  // Short facilities on offer — parking, restrooms, wifi. Rendered as pills in
  // the detail modal; the whole section is omitted when this is absent, since
  // an empty amenities list reads as "none available" rather than "unconfirmed".
  amenities?: string[];
}

export function getSpotPanos(spot: Spot): PanoItem[] {
  let rawList: PanoSource[] = [];
  if (Array.isArray(spot.pano360s) && spot.pano360s.length > 0) {
    rawList = spot.pano360s;
  } else if (Array.isArray(spot.pano360) && spot.pano360.length > 0) {
    rawList = spot.pano360;
  } else if (spot.pano360) {
    rawList = [spot.pano360 as PanoSource];
  }

  if (rawList.length === 0) return [];

  const defaultCaptions = ["Entrance", "Outside look"];
  const expandedList: PanoSource[] =
    rawList.length === 1 ? [rawList[0], rawList[0]] : rawList;

  const results: PanoItem[] = [];
  for (let i = 0; i < expandedList.length; i++) {
    const item = expandedList[i];
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (trimmed) {
        results.push({
          src: trimmed,
          caption: defaultCaptions[i] || `View ${i + 1}`,
        });
      }
    } else if (item && typeof item === "object" && item.src) {
      results.push({
        src: item.src,
        caption: item.caption || defaultCaptions[i] || `View ${i + 1}`,
      });
    }
  }

  return results;
}

export interface UserLocation {
  lat: number;
  lng: number;
}

// A visitor's heart rating + optional comment on a spot. Persisted in
// Supabase (see supabase/schema.sql); `device_id` is an anonymous per-browser
// id (lib/hooks/useDeviceId.ts), not a real account.
export interface Review {
  id: string;
  device_id: string;
  name: string | null;
  hearts: number;
  comment: string | null;
  created_at: string;
}
