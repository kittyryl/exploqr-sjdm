import type { UserLocation } from "@/lib/types";

// Straight-line distance between two map points, in kilometers (accounts for the Earth's curve).
const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function distanceKm(a: UserLocation, b: UserLocation): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

// Builds a Google Maps redirect URL for a spot. Uses custom URL if present,
// otherwise searches by the real place name and city so Google Maps opens the
// registered location card (photos, reviews, hours) rather than a raw coordinate pin.
export function googleMapsUrl(spot: {
  lat: number;
  lng: number;
  name?: string;
  barangay?: string;
  address?: string;
  googleMapsUrl?: string;
}): string {
  if (spot.googleMapsUrl) return spot.googleMapsUrl;
  if (spot.name) {
    const cleanName = spot.name.replace(/\bSM Starmall\b/i, "Starmall");
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${cleanName}, San Jose del Monte, Bulacan`
    )}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`;
}


