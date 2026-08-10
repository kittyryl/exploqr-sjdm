# In-App Directions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "Get directions" button's external Google Maps link with an in-app route drawn on the existing Leaflet map — a real driving route where possible, straight-line fallback otherwise — plus a floating pill showing distance and travel time.

**Architecture:** A new pure `lib/routing.ts` module wraps OSRM's public routing API behind one `fetchRoute()` function that never throws (returns `null` on any failure). `app/page.tsx` owns all route state (the single source of truth shared between the map and the modal, since they're sibling components) and a `handleDirections(spot)` orchestrator. `SpotMap.tsx` gains a `route` prop it draws as a `Polyline`; a new sibling `RouteInfoPill.tsx` overlays the map with distance/time and a way back into the spot's modal.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Leaflet via `react-leaflet` v5, Tailwind CSS v4, `lucide-react` icons. OSRM's free public demo routing server (`router.project-osrm.org`, no API key). Full spec: `docs/superpowers/specs/2026-08-10-in-app-directions-design.md`.

## Global Constraints

- **No test framework in this repo** (`package.json` has no jest/vitest/playwright). Pure logic with genuine edge-case risk (`lib/routing.ts`'s response parsing and duration formatting) gets a committed plain-Node test file using only `node:assert/strict`, run via `node <file>.test.mjs`. This works by importing the `.ts` source directly — confirmed Node 24's built-in type-stripping runs plain interface/type-annotated `.ts` files with zero config, the same pattern this repo used for `lib/hours.ts` pre-TypeScript-migration. Do **not** add a new test framework dependency.
- UI work is verified via `npx tsc --noEmit`, `npx eslint <changed files>`, and a real browser check (this project's established `verify` skill pattern) — not a committed UI test suite.
- This project ships English-only UI copy now (`lib/i18n.ts`'s header comment) — new strings go in the single `UI` dictionary, consumed via the existing `t()`/`useLocale()`, never hardcoded in JSX.
- Follow this repo's comment style: comments explain non-obvious *why*, never *what*. Don't add comments restating the code.
- Run `npx tsc --noEmit` and `npx eslint <changed files>` after every task that touches app code — both must be clean before committing.
- No new state-management library or global store — route state lives in `app/page.tsx`'s existing `useState`/`useRef` alongside `userLocation`, matching how that file already owns `selectedId`, `category`, etc.

---

## File Structure

- **Create:** `lib/routing.ts` — `RouteResult`/`RouteState` types, `parseOsrmResponse()`, `formatDuration()`, `fetchRoute()`.
- **Test:** `lib/routing.test.mjs` — plain Node test for `parseOsrmResponse()`/`formatDuration()` (pure, no network).
- **Modify:** `lib/i18n.ts` — add `directions.pill`, `directions.pillNoDuration`, `directions.pillClose`, `directions.arrived`.
- **Modify:** `lib/categories.ts` — remove `directionsUrl()` (dead code once `SpotActions` stops linking out).
- **Create:** `components/spot/RouteInfoPill.tsx` — floating map overlay: distance/time, reopen-on-click, clear button.
- **Modify:** `components/spot/SpotActions.tsx` — "Get directions" becomes a button (`onDirections`/`directionsLoading` props) instead of an external link.
- **Modify:** `components/spot/SpotDetailCard.tsx` — thread `onDirections`/`directionsLoading` through to `SpotActions`.
- **Modify:** `components/spot/SpotModal.tsx` — thread `onDirections`/`directionsLoading` through to `SpotDetailCard`.
- **Modify:** `components/spot/SpotMap.tsx` — add `route` prop; render a `Polyline`; make `FitToSpots` route-aware.
- **Modify:** `app/page.tsx` — route state, session cache, in-flight-request cancellation, `requestLocation()` (extracted from `handleNearMe`), `handleDirections()`, clearing effects, wires `RouteInfoPill` + the new props into the tree.

---

### Task 1: `lib/routing.ts` — OSRM client and pure formatting logic

**Files:**
- Create: `lib/routing.ts`
- Test: `lib/routing.test.mjs`

**Interfaces:**
- Consumes: `UserLocation` (`{ lat: number; lng: number }`), `Spot` from `lib/types.ts`.
- Produces:
  - `interface RouteResult { coords: [number, number][]; distanceKm: number; durationMin: number }`
  - `interface RouteState { spot: Spot; coords: [number, number][] | null; distanceKm: number; durationMin: number | null; arrived: boolean; loading: boolean }`
  - `parseOsrmResponse(data: unknown): RouteResult | null`
  - `formatDuration(min: number): string`
  - `fetchRoute(from: UserLocation, to: UserLocation, signal: AbortSignal): Promise<RouteResult | null>`

- [ ] **Step 1: Write the failing test file `lib/routing.test.mjs`**

```js
import { parseOsrmResponse, formatDuration } from "./routing.ts";
import assert from "node:assert/strict";

const ok = parseOsrmResponse({
  code: "Ok",
  routes: [
    {
      geometry: { coordinates: [[121.05, 14.81], [121.06, 14.82]] },
      distance: 2500,
      duration: 300,
    },
  ],
});
assert.deepEqual(
  ok,
  { coords: [[14.81, 121.05], [14.82, 121.06]], distanceKm: 2.5, durationMin: 5 },
  "parses a successful OSRM response, flipping [lng,lat] pairs to [lat,lng]"
);

assert.equal(parseOsrmResponse({ code: "NoRoute", routes: [] }), null, "non-Ok code returns null");
assert.equal(parseOsrmResponse({ code: "Ok", routes: [] }), null, "empty routes array returns null");
assert.equal(parseOsrmResponse(null), null, "null input returns null");
assert.equal(parseOsrmResponse({}), null, "malformed input returns null");

assert.equal(formatDuration(5), "5 min", "sub-hour duration");
assert.equal(formatDuration(45), "45 min", "just under an hour");
assert.equal(formatDuration(90), "1h 30min", "over an hour with a remainder");
assert.equal(formatDuration(120), "2h", "exact hour, no remainder shown");

console.log("All routing assertions passed");
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `node lib/routing.test.mjs`
Expected: fails with a module-not-found error for `./routing.ts` (it doesn't exist yet).

- [ ] **Step 3: Write `lib/routing.ts`**

```ts
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
```

- [ ] **Step 4: Run the test again, confirm it passes**

Run: `node lib/routing.test.mjs`
Expected: prints `All routing assertions passed` and exits 0.

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit && npx eslint lib/routing.ts`
Expected: both clean.

- [ ] **Step 6: Commit**

```bash
git add lib/routing.ts lib/routing.test.mjs
git commit -m "Add OSRM routing client with straight-line-safe parsing"
```

---

### Task 2: i18n strings + `RouteInfoPill` component

**Files:**
- Modify: `lib/i18n.ts`
- Create: `components/spot/RouteInfoPill.tsx`

**Interfaces:**
- Consumes: `RouteState` from Task 1; `CATEGORIES` from `lib/categories.ts`; `formatDistance` from `lib/geo.ts`; `formatDuration` from `lib/routing.ts`; `useLocale()` from `components/providers/LocaleProvider.tsx`.
- Produces: `export default function RouteInfoPill({ route, onReopen, onClear }: { route: RouteState; onReopen: (spotId: string) => void; onClear: () => void }): JSX.Element`

- [ ] **Step 1: Add the new UI strings to `lib/i18n.ts`**

Insert immediately after the existing `"spot.directions": "Get directions",` line (currently line 57):

```ts
  "directions.pill": "{distance} · {duration} to {name}",
  "directions.pillNoDuration": "{distance} to {name}",
  "directions.pillClose": "Clear route",
  "directions.arrived": "You're right next to it!",
```

(`pillNoDuration` covers both "still fetching the real route" and "OSRM failed, standing on the fallback" — the pill's loading spinner icon is what distinguishes those two visually, so the text doesn't need to.)

- [ ] **Step 2: Create `components/spot/RouteInfoPill.tsx`**

```tsx
"use client";

import { Loader2, Navigation, X } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { formatDistance } from "@/lib/geo";
import { formatDuration, type RouteState } from "@/lib/routing";
import { useLocale } from "@/components/providers/LocaleProvider";

interface RouteInfoPillProps {
  route: RouteState;
  onReopen: (spotId: string) => void;
  onClear: () => void;
}

// Floating card over the map, styled like the map-shell's corner survey-ticks.
// Doubles as the way back into the spot's modal, since requesting directions
// closes it to reveal the route underneath — without this, closing the modal
// would otherwise be a dead end.
export default function RouteInfoPill({ route, onReopen, onClear }: RouteInfoPillProps) {
  const { t, text } = useLocale();
  const cat = CATEGORIES[route.spot.category];
  const name = text(route.spot.name);

  const label = route.arrived
    ? t("directions.arrived")
    : route.durationMin != null
      ? t("directions.pill", {
          distance: formatDistance(route.distanceKm),
          duration: formatDuration(route.durationMin),
          name,
        })
      : t("directions.pillNoDuration", { distance: formatDistance(route.distanceKm), name });

  return (
    <div className="absolute left-3 top-3 z-[1000] flex items-center gap-1.5 rounded-full border border-line bg-surface/95 py-1.5 pl-3 pr-1.5 shadow-md backdrop-blur">
      <button
        type="button"
        onClick={() => onReopen(route.spot.id)}
        className="flex items-center gap-1.5 font-mono text-xs text-ink"
      >
        {route.loading ? (
          <Loader2 size={13} className="animate-spin" aria-hidden="true" style={{ color: cat.accent }} />
        ) : (
          <Navigation size={13} aria-hidden="true" style={{ color: cat.accent }} />
        )}
        <span aria-live="polite">{label}</span>
      </button>
      <button
        type="button"
        onClick={onClear}
        aria-label={t("directions.pillClose")}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-ink/50 hover:bg-ink/8 hover:text-ink"
      >
        <X size={12} aria-hidden="true" />
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npx eslint lib/i18n.ts components/spot/RouteInfoPill.tsx`
Expected: both clean. (`RouteInfoPill` isn't imported anywhere yet, so this only checks the file compiles standalone — full integration is verified in Task 6.)

- [ ] **Step 4: Commit**

```bash
git add lib/i18n.ts components/spot/RouteInfoPill.tsx
git commit -m "Add directions i18n strings and RouteInfoPill component"
```

---

### Task 3: `SpotActions` — directions link becomes a button

**Files:**
- Modify: `components/spot/SpotActions.tsx`
- Modify: `lib/categories.ts:116-118` (remove `directionsUrl`)

**Interfaces:**
- Consumes: nothing new from other tasks (props are plain callback/boolean, decoupled from `RouteState`).
- Produces: `SpotActions` now requires `onDirections: (spot: Spot) => void` and `directionsLoading: boolean` props — callers must supply both (Task 4 wires these).

- [ ] **Step 1: Remove `directionsUrl` from `lib/categories.ts`**

Delete these lines (116-118):

```ts
export function directionsUrl(spot: Spot): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`;
}
```

- [ ] **Step 2: Rewrite `components/spot/SpotActions.tsx`**

```tsx
"use client";

import { Loader2, Navigation, Rotate3d } from "lucide-react";
import { CATEGORIES, formatCoords } from "@/lib/categories";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { SpotMediaState } from "@/lib/hooks/useSpotMedia";
import type { Spot } from "@/lib/types";

const ACTION =
  "flex flex-1 items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none motion-reduce:hover:translate-y-0 disabled:cursor-not-allowed disabled:hover:translate-y-0";

// Buttons for what to do next: get directions or look around first. The
// coordinates sit above them since they're just a reference, not a button.
export default function SpotActions({
  spot,
  media,
  onDirections,
  directionsLoading,
}: {
  spot: Spot;
  media: SpotMediaState;
  onDirections: (spot: Spot) => void;
  directionsLoading: boolean;
}) {
  const { t } = useLocale();
  const cat = CATEGORIES[spot.category];

  return (
    <div>
      <p className="mb-2.5 font-mono text-[11px] uppercase tracking-widest text-ink/70">
        {formatCoords(spot.lat, spot.lng)}
      </p>
      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => onDirections(spot)}
          disabled={directionsLoading}
          className={`${ACTION} disabled:opacity-60`}
          style={{ background: cat.accent, color: cat.btnFg }}
        >
          {directionsLoading ? (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          ) : (
            <Navigation size={15} aria-hidden="true" />
          )}
          {t("spot.directions")}
        </button>
        {/* Always shown, but greyed out and disabled if this spot has no
            360° view yet, so people know the feature exists. */}
        <button
          type="button"
          onClick={media.openPano}
          disabled={!media.hasPano}
          title={media.hasPano ? undefined : t("spot.no360")}
          className={`${ACTION} border border-line bg-surface text-ink hover:bg-ink/4 disabled:border-dashed disabled:bg-transparent disabled:text-ink/40 disabled:hover:bg-transparent`}
        >
          <Rotate3d size={15} aria-hidden="true" />
          {media.hasPano ? t("spot.view360") : t("spot.no360")}
        </button>
      </div>
    </div>
  );
}
```

(`disabled:cursor-not-allowed`/`disabled:hover:translate-y-0` moved into the shared `ACTION` constant since both buttons are disableable now and neither changes the button's *color* — but `disabled:opacity-60` stays scoped to the directions button alone, so the 360° button keeps its existing distinct disabled look — dashed border, faded text — unchanged from before this task.)

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npx eslint lib/categories.ts components/spot/SpotActions.tsx`
Expected: `tsc` will show errors in `SpotDetailCard.tsx` (missing the two new required props) — that's expected until Task 4. Confirm the *only* new errors are in `SpotDetailCard.tsx` about `onDirections`/`directionsLoading`, and that `SpotActions.tsx`/`lib/categories.ts` themselves have no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/categories.ts components/spot/SpotActions.tsx
git commit -m "Turn Get Directions into an in-app button instead of a Google Maps link"
```

---

### Task 4: Thread `onDirections`/`directionsLoading` through the modal chain

**Files:**
- Modify: `components/spot/SpotDetailCard.tsx`
- Modify: `components/spot/SpotModal.tsx`

**Interfaces:**
- Consumes: `SpotActions`'s new `onDirections`/`directionsLoading` props (Task 3).
- Produces: `SpotDetailCard` and `SpotModal` both require the same two new props — `app/page.tsx` (Task 6) supplies them.

- [ ] **Step 1: Update `components/spot/SpotDetailCard.tsx`**

Change the props interface and pass-through:

```tsx
interface SpotDetailCardProps {
  spot: Spot;
  titleId?: string;
  distanceKm?: number;
  onDirections: (spot: Spot) => void;
  directionsLoading: boolean;
}

export default function SpotDetailCard({
  spot,
  titleId,
  distanceKm,
  onDirections,
  directionsLoading,
}: SpotDetailCardProps) {
```

And update the `SpotActions` call:

```tsx
        <SpotActions
          spot={spot}
          media={media}
          onDirections={onDirections}
          directionsLoading={directionsLoading}
        />
```

- [ ] **Step 2: Update `components/spot/SpotModal.tsx`**

Change the props interface:

```tsx
interface SpotModalProps {
  spot: Spot | null;
  onClose: () => void;
  distanceKm?: number;
  onDirections: (spot: Spot) => void;
  directionsLoading: boolean;
}

export default function SpotModal({
  spot,
  onClose,
  distanceKm,
  onDirections,
  directionsLoading,
}: SpotModalProps) {
```

And update the `SpotDetailCard` call:

```tsx
            <SpotDetailCard
              spot={spot}
              titleId={titleId}
              distanceKm={distanceKm}
              onDirections={onDirections}
              directionsLoading={directionsLoading}
            />
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npx eslint components/spot/SpotDetailCard.tsx components/spot/SpotModal.tsx`
Expected: `tsc` now shows an error in `app/page.tsx` (missing the two new props on `<SpotModal>`) — expected until Task 6. The two files just changed should have no errors of their own.

- [ ] **Step 4: Commit**

```bash
git add components/spot/SpotDetailCard.tsx components/spot/SpotModal.tsx
git commit -m "Thread directions callback through the spot modal chain"
```

---

### Task 5: `SpotMap` — draw the route

**Files:**
- Modify: `components/spot/SpotMap.tsx`

**Interfaces:**
- Consumes: `RouteState` from `lib/routing.ts` (Task 1).
- Produces: `SpotMap`'s props gain a required `route: RouteState | null` field.

- [ ] **Step 1: Add imports**

Add `Polyline` to the existing `react-leaflet` import (line 6-15), and import the new type:

```tsx
import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  Polyline,
  CircleMarker,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
```

```tsx
import type { RouteState } from "@/lib/routing";
```

- [ ] **Step 2: Make `FitToSpots` route-aware**

Replace the existing `FitToSpots` function *and its leading comment* (lines 99-117, starting at `// Zooms and centers the map to fit all visible spots...`) with:

```tsx
// Zooms and centers the map to fit all visible spots (and the visitor's
// location, if known) — or, while a route is active, zooms to just that
// route instead, so the two endpoints aren't lost among every other pin.
function FitToSpots({
  spots,
  userLocation,
  route,
}: {
  spots: Spot[];
  userLocation: UserLocation | null;
  route: RouteState | null;
}) {
  const map = useMap();
  const key = useMemo(() => {
    if (route) {
      return `route:${route.spot.id}:${route.arrived ? "arrived" : (route.coords?.length ?? "pending")}`;
    }
    return (
      spots.map((s) => s.id).join(",") +
      (userLocation ? `|${userLocation.lat},${userLocation.lng}` : "")
    );
  }, [spots, userLocation, route]);

  useEffect(() => {
    if (route) {
      if (route.arrived) {
        map.setView([route.spot.lat, route.spot.lng], 17, { animate: true });
        return;
      }
      const points: [number, number][] =
        route.coords ??
        (userLocation
          ? [[userLocation.lat, userLocation.lng], [route.spot.lat, route.spot.lng]]
          : [[route.spot.lat, route.spot.lng]]);
      map.fitBounds(L.latLngBounds(points), { padding: [56, 56] });
      return;
    }
    if (spots.length === 0) return;
    const points: [number, number][] = spots.map((s) => [s.lat, s.lng]);
    if (userLocation) points.push([userLocation.lat, userLocation.lng]);
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [48, 48] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}
```

- [ ] **Step 3: Add `route` to `SpotMapProps` and the component signature**

```tsx
interface SpotMapProps {
  spots: Spot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  userLocation: UserLocation | null;
  route: RouteState | null;
}

export default function SpotMap({ spots, selectedId, onSelect, userLocation, route }: SpotMapProps) {
```

- [ ] **Step 4: Pass `route` to `FitToSpots` and render the `Polyline`**

Replace the existing `<FitToSpots spots={spots} userLocation={userLocation} />` line with:

```tsx
      <FitToSpots spots={spots} userLocation={userLocation} route={route} />
      {route && !route.arrived && (
        <Polyline
          positions={
            route.coords ??
            (userLocation
              ? [[userLocation.lat, userLocation.lng], [route.spot.lat, route.spot.lng]]
              : [])
          }
          pathOptions={{
            color: CATEGORIES[route.spot.category].accent,
            weight: 4,
            opacity: 0.85,
            dashArray: route.coords ? undefined : "8 8",
          }}
        />
      )}
```

(Placed right after `FitToSpots`, before the `userLocation` `CircleMarker` block, so the route line renders under the user/spot markers in paint order.)

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit && npx eslint components/spot/SpotMap.tsx`
Expected: `tsc` still shows the pre-existing `app/page.tsx` error (missing props on `<SpotMap>` now too, plus `<SpotModal>` from Task 4) — expected until Task 6. `SpotMap.tsx` itself must be clean.

- [ ] **Step 6: Commit**

```bash
git add components/spot/SpotMap.tsx
git commit -m "Draw the active route on the map with a route-aware fit-to-bounds"
```

---

### Task 6: `app/page.tsx` — route orchestration

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `fetchRoute`, `RouteResult`, `RouteState` (Task 1); `RouteInfoPill` (Task 2); `SpotActions`/`SpotDetailCard`/`SpotModal`'s `onDirections`/`directionsLoading` props (Tasks 3-4); `SpotMap`'s `route` prop (Task 5).
- Produces: nothing consumed by later tasks — this is the integration point.

- [ ] **Step 1: Add imports**

```tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
```

(`useRef` is new — the rest of that import line is unchanged.) Also add:

```tsx
import { fetchRoute, type RouteResult, type RouteState } from "@/lib/routing";
import RouteInfoPill from "@/components/spot/RouteInfoPill";
```

- [ ] **Step 2: Add route state, cache, and abort ref**

Directly below the existing `const [locationError, setLocationError] = useState<string | null>(null);` line:

```tsx
  const [route, setRoute] = useState<RouteState | null>(null);
  const routeCacheRef = useRef(new Map<string, RouteResult>());
  const routeAbortRef = useRef<AbortController | null>(null);
```

- [ ] **Step 3: Extract `requestLocation()` and rewrite `handleNearMe`**

Replace the entire existing `handleNearMe` `useCallback` block with:

```tsx
  // Wraps the geolocation call as a promise so both the "Near Me" toggle and
  // the directions flow share one path for requesting/recording location and
  // its error states, instead of two copies of the same getCurrentPosition
  // call drifting apart over time.
  const requestLocation = useCallback((): Promise<UserLocation> => {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        const message = t("nearme.unsupported");
        setLocationError(message);
        reject(new Error(message));
        return;
      }
      setLocating(true);
      setLocationError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(next);
          setLocating(false);
          resolve(next);
        },
        (err) => {
          const message =
            err.code === err.PERMISSION_DENIED ? t("nearme.denied") : t("nearme.failed");
          setLocationError(message);
          setLocating(false);
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, [t]);

  // "Near me" only asks for your location when tapped, not automatically
  // when the page loads.
  const handleNearMe = useCallback(() => {
    if (userLocation) {
      setUserLocation(null);
      setLocationError(null);
      return;
    }
    requestLocation().catch(() => {
      // requestLocation already recorded the error in locationError; nothing
      // further to do here.
    });
  }, [userLocation, requestLocation]);
```

- [ ] **Step 4: Add `handleDirections` and `handleClearRoute`**

Add after `handleNearMe`:

```tsx
  // Resolves the visitor's location (asking for it if needed), closes the
  // modal so the map is visible, then draws a route: a real OSRM road route
  // when available, a dashed straight line immediately and as a fallback.
  const handleDirections = useCallback(
    async (spot: Spot) => {
      routeAbortRef.current?.abort();

      let origin = userLocation;
      if (!origin) {
        try {
          origin = await requestLocation();
        } catch {
          return;
        }
      }

      setSelectedId(null);
      if (window.matchMedia("(max-width: 639px)").matches) {
        document.getElementById("explore-map")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      const straightLineKm = distanceKm(origin, spot);
      if (straightLineKm < 0.2) {
        setRoute({ spot, coords: null, distanceKm: straightLineKm, durationMin: null, arrived: true, loading: false });
        return;
      }

      const cacheKey = `${spot.id}:${origin.lat.toFixed(3)},${origin.lng.toFixed(3)}`;
      const cached = routeCacheRef.current.get(cacheKey);
      if (cached) {
        setRoute({ spot, coords: cached.coords, distanceKm: cached.distanceKm, durationMin: cached.durationMin, arrived: false, loading: false });
        return;
      }

      setRoute({ spot, coords: null, distanceKm: straightLineKm, durationMin: null, arrived: false, loading: true });

      const controller = new AbortController();
      routeAbortRef.current = controller;
      const result = await fetchRoute(origin, spot, controller.signal);
      if (controller.signal.aborted) return;

      if (result) {
        routeCacheRef.current.set(cacheKey, result);
        setRoute({ spot, coords: result.coords, distanceKm: result.distanceKm, durationMin: result.durationMin, arrived: false, loading: false });
      } else {
        setRoute((current) => (current && current.spot.id === spot.id ? { ...current, loading: false } : current));
      }
    },
    [userLocation, requestLocation]
  );

  const handleClearRoute = useCallback(() => {
    routeAbortRef.current?.abort();
    setRoute(null);
  }, []);
```

- [ ] **Step 5: Add the two route-clearing effects**

Add near the other `useEffect`s (after the `selectedId` URL-sync effect is fine):

```tsx
  // A route pointing at a spot that's been filtered/searched away would
  // otherwise linger with no destination pin visible.
  useEffect(() => {
    if (route && !visible.some((s) => s.id === route.spot.id)) setRoute(null);
  }, [visible, route]);

  // No origin, no route.
  useEffect(() => {
    if (!userLocation) setRoute(null);
  }, [userLocation]);
```

(These go after `visible` is defined via `useMemo` — see existing code around line 129 — so place them below that, not above.)

- [ ] **Step 6: Wire `route` into `SpotMap`, add `RouteInfoPill`, give the map shell an id**

Update the inner map wrapper (currently `<div className="rise-in relative z-0 h-[440px] overflow-hidden rounded-2xl border border-line sm:h-[560px]">`) to add `id="explore-map"`:

```tsx
            <div id="explore-map" className="rise-in relative z-0 h-[440px] overflow-hidden rounded-2xl border border-line sm:h-[560px]">
              <SpotMap
                spots={orderedVisible}
                selectedId={selectedId}
                onSelect={setSelectedId}
                userLocation={userLocation}
                route={route}
              />
              {route && (
                <RouteInfoPill route={route} onReopen={setSelectedId} onClear={handleClearRoute} />
              )}
              {orderedVisible.length === 0 && (
                <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center">
                  <p className="rounded-full border border-line bg-surface/95 px-4 py-2 font-mono text-xs text-ink/65 shadow-sm">
                    {t("search.empty")}
                  </p>
                </div>
              )}
            </div>
```

- [ ] **Step 7: Wire `onDirections`/`directionsLoading` into `SpotModal`**

```tsx
      <SpotModal
        spot={selected}
        onClose={() => setSelectedId(null)}
        distanceKm={selected && distances ? distances[selected.id] : undefined}
        onDirections={handleDirections}
        directionsLoading={locating}
      />
```

- [ ] **Step 8: Type-check, lint, and build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all three clean. This is the first point where the whole tree type-checks end to end — every prop threaded in Tasks 3-5 is now actually supplied.

- [ ] **Step 9: Commit**

```bash
git add app/page.tsx
git commit -m "Wire up in-app directions: route state, geolocation reuse, map + pill integration"
```

---

### Task 7: End-to-end browser verification

**Files:** none (verification only).

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` (leave running; use a separate terminal/background process for the remaining steps).

- [ ] **Step 2: Invoke the `verify` skill (or drive the browser directly) and walk through this checklist**

- Open the app, click a spot pin to open its modal, click "Get directions" *before* granting location: the browser's geolocation permission prompt appears; denying it shows the existing "Location access was denied." text under the Near Me toggle, the modal stays open, no crash.
- Grant location this time: the modal closes, a dashed straight line appears immediately between the blue "you are here" dot and the spot, then — once OSRM responds — it swaps to a solid road-following line with a plausible distance/time in the top-left pill (e.g. "3.2 km · 8 min to Wawa Dam").
- Click the pill's text: the spot's modal reopens.
- Click the pill's × : the route and pill disappear, no modal opens.
- Pick a spot very close to the mocked location (or use the browser devtools' geolocation override to place yourself within ~200m of a spot) and request its directions: pill reads "You're right next to it!", no line is drawn.
- Request directions for one spot, then — while it's still loading — immediately request directions for a different spot: only the second spot's route ends up shown (open the Network tab and confirm only one OSRM response is applied to state; the first is aborted, visible as a cancelled request).
- Close the second spot's route, reopen its modal, and click "Get directions" again without moving: the route/pill appear with no new OSRM request in the Network tab (served from the session cache).
- With a route showing, click the "Near Me" toggle to turn location off: the route and pill clear.
- With a route showing, use the search box or a category filter to hide the destination spot: the route and pill clear.
- Toggle dark mode (theme switcher) with a route showing: the solid/dashed line stays visibly legible against both the light and dark map tiles.
- Resize to a mobile viewport (or use device emulation), request directions from the modal: the page scrolls the map into view after the modal closes.

- [ ] **Step 3: Report results**

If every item above passes, the feature is done. If anything fails, note exactly which checklist item and what was observed instead — do not mark this task complete with a failing item.
