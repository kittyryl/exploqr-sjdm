import { barangays } from "@/data/barangays";
import type { Spot } from "@/lib/types";

// How many map colors we use for barangays; the CSS has a matching style for each. See data/barangays.ts.
export const BARANGAY_TINTS = 5;

// Spot data uses casual barangay names (like on a flyer), not always the official spelling.
// These are just spelling fixes, not disagreements about where a spot actually is:
//   - "Sto."/"Sta." are short for Santo/Santa.
//   - "Area C, Brgy. Paradise" means Paradise III, the only Paradise barangay in the city.
const ALIASES: Record<string, string> = {
  "area c, brgy. paradise": "Paradise III",
};

const CANON = new Map(barangays.map((b) => [b.name.toLowerCase(), b.name]));

function normalize(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\bbrgy\.?\b|\bbarangay\b/g, "")
    .replace(/\bsto\.?\b/g, "santo")
    .replace(/\bsta\.?\b/g, "santa")
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Finds the official barangay name for a spot, or null if unsure — better to show nothing than point visitors to the wrong place.
export function resolveBarangay(raw: string): string | null {
  const direct = CANON.get(raw.toLowerCase());
  if (direct) return direct;

  const alias = ALIASES[raw.toLowerCase()];
  if (alias) return alias;

  return CANON.get(normalize(raw)) ?? null;
}

// Only the barangays that actually have a spot in them — labeling all 59 on the map at once would be too cluttered on a phone.
export function barangaysWithSpots(spots: Spot[]): Set<string> {
  const out = new Set<string>();
  for (const s of spots) {
    const name = resolveBarangay(s.barangay);
    if (name) out.add(name);
  }
  return out;
}
