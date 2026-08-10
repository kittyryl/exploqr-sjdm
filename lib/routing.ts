import type { Spot, UserLocation } from "@/lib/types";

export interface RouteResult {
  coords: [number, number][]; // [lat, lng], road-following path
  distanceKm: number;
  durationMin: number;
}

// UI-facing route state, held by app/page.tsx and passed down to the map and
// the info pill. `coords: null` means "no road geometry yet" — either still
// loading, or OSRM failed and we're standing on the straight-line fallback.
export interface RouteState {
  spot: Spot;
  coords: [number, number][] | null;
  distanceKm: number;
  durationMin: number | null;
  arrived: boolean; // true when distanceKm < 0.2 — no line is drawn at all
  loading: boolean;
}

interface OsrmRoute {
  geometry?: { coordinates?: [number, number][] };
  distance?: number;
  duration?: number;
}
interface OsrmResponse {
  code?: string;
  routes?: OsrmRoute[];
}

// OSRM returns [lng, lat] pairs and meters/seconds; everything downstream of
// this app expects [lat, lng] (Leaflet's order) and km/minutes.
export function parseOsrmResponse(data: unknown): RouteResult | null {
  const res = data as OsrmResponse | null;
  if (!res || res.code !== "Ok" || !res.routes?.length) return null;
  const route = res.routes[0];
  const coordinates = route.geometry?.coordinates;
  if (!coordinates?.length || route.distance == null || route.duration == null) return null;
  return {
    coords: coordinates.map(([lng, lat]) => [lat, lng]),
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
  };
}

export function formatDuration(min: number): string {
  const rounded = Math.round(min);
  if (rounded < 60) return `${rounded} min`;
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// Never throws — every failure mode (network error, timeout, abort, a
// malformed or non-Ok response) collapses to null so callers can fall back
// to the straight-line distance they already have, uniformly.
export async function fetchRoute(
  from: UserLocation,
  to: UserLocation,
  signal: AbortSignal
): Promise<RouteResult | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.any([signal, AbortSignal.timeout(6000)]),
    });
    if (!res.ok) return null;
    return parseOsrmResponse(await res.json());
  } catch {
    return null;
  }
}
