import { barangays } from "@/data/barangays";
import type { Spot } from "@/lib/types";

// Number of palette slots the generator coloured the map with; the CSS carries
// one `.map-brgy--N` rule per slot. See data/barangays.ts.
export const BARANGAY_TINTS = 5;

// `data/spots.ts` records the barangay as a person would write it on a flyer,
// which is not always the PSA's name for it. Everything here is a spelling or
// specificity gap, not a disagreement about where a spot is:
//   - "Sto."/"Sta." are the everyday contractions of Santo/Santa.
//   - "Area C, Brgy. Paradise" names a subdivision inside the barangay;
//     Paradise III is the only Paradise in the city's 59.
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

// The official barangay name for a spot, or null when it can't be resolved —
// callers treat null as "don't highlight anything" rather than guessing, since
// a wrong highlight points visitors at the wrong part of the city.
export function resolveBarangay(raw: string): string | null {
  const direct = CANON.get(raw.toLowerCase());
  if (direct) return direct;

  const alias = ALIASES[raw.toLowerCase()];
  if (alias) return alias;

  return CANON.get(normalize(raw)) ?? null;
}

// The set of barangays that actually contain a visible destination. These are
// the ones worth labelling before the reader zooms in — 59 names at once is
// noise on a phone.
export function barangaysWithSpots(spots: Spot[]): Set<string> {
  const out = new Set<string>();
  for (const s of spots) {
    const name = resolveBarangay(s.barangay);
    if (name) out.add(name);
  }
  return out;
}
