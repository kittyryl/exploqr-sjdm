# In-App Directions with Route Line & Distance

## Problem

The "Get directions" button on a spot's detail card currently just links out to
Google Maps in a new tab (`directionsUrl()` in `lib/categories.ts`, used by
`components/spot/SpotActions.tsx`). The visitor leaves the app to see the
route. We already draw our own Leaflet map (`components/spot/SpotMap.tsx`)
and already know the visitor's location when they've used "Near Me"
(`lib/geo.ts`'s `distanceKm`/`formatDistance`, wired up in `app/page.tsx`).

We want "Get directions" to draw a real road route on our own map instead,
with the distance and travel time shown alongside it, so visitors never have
to leave the page.

## Goals

- Clicking "Get directions" draws an actual road-following route (not just a
  straight line) from the visitor's location to the spot, on our existing map.
- Shows distance and estimated travel time.
- Degrades gracefully: if location is unavailable or the routing call fails,
  the feature still shows *something* useful rather than erroring out.
- No new paid dependency — no API key exists in `.env.local` for a mapping
  provider today, and we're not asking the user to set one up for this.

## Non-goals

- Turn-by-turn navigation, live rerouting, or walking/cycling profile
  selection. Driving-only for every spot in this pass (see "Travel mode"
  below).
- Multi-stop routes.
- Replacing "Near Me" sorting or the existing straight-line distance shown in
  the spot hero (`SpotHero`'s `distanceKm` prop) — that stays as is.

## Routing provider

We'll call [OSRM's public demo server](https://router.project-osrm.org)
(`driving` profile, `overview=full&geometries=geojson`). It's free and
keyless, which fits this project (no routing API key exists today), but it's
a shared demo endpoint without an uptime guarantee — acceptable here because
every failure mode degrades to a straight line rather than breaking the
feature (see "Fallback behavior"). If it turns out to flake under real
traffic, swapping in a paid provider is a small, isolated change since all
routing goes through one function.

New file `lib/routing.ts`:

```ts
export interface RouteResult {
  coords: [number, number][]; // [lat, lng], road-following path
  distanceKm: number;
  durationMin: number;
}

// Returns null on any failure (network error, timeout, non-OK response) —
// callers fall back to the straight-line distance they already have.
export async function fetchRoute(
  from: UserLocation,
  to: UserLocation,
  signal: AbortSignal
): Promise<RouteResult | null>
```

Implementation: `fetch` with the passed-in `AbortSignal` plus a ~6s timeout
guard, `driving/{from.lng},{from.lat};{to.lng},{to.lat}`. Parse
`routes[0].geometry.coordinates` ([lng,lat] pairs — flip to [lat,lng] for
Leaflet), `routes[0].distance` (meters → km), `routes[0].duration`
(seconds → minutes). Any thrown error, abort, or `data.code !== "Ok"`
returns `null`.

## State (`app/page.tsx`)

```ts
interface RouteState {
  spot: Spot;
  coords: [number, number][] | null; // null = straight-line fallback; ignored when arrived
  distanceKm: number;
  durationMin: number | null; // null when using fallback or arrived
  arrived: boolean;           // true when distanceKm < 0.2 — no line is drawn at all
  loading: boolean;
}

const [route, setRoute] = useState<RouteState | null>(null);
const routeCache = useRef(new Map<string, RouteResult>());
const routeAbortRef = useRef<AbortController | null>(null);
```

Storing the full `Spot` (not just its id) means the pill can render the name
and the destination's category accent color without an extra lookup, and
stays valid even in the render right before the filter-clears-it effect
below runs.

**`requestLocation()`** — extracted from the body of the existing
`handleNearMe`, returning `Promise<UserLocation>`. Sets `locating`/
`locationError` exactly as `handleNearMe` does today; rejects if the visitor
denies/lacks geolocation. Both `handleNearMe` and the new `handleDirections`
call this, so there's one geolocation code path, not two.

**`handleDirections(spot: Spot)`**:
1. `routeAbortRef.current?.abort()` — cancel any in-flight request from a
   previous call so a stale response can't land after a newer one.
2. Resolve location: use `userLocation` if already known, else
   `await requestLocation()`. If it rejects (denied/unsupported/failed), stop
   — the existing `locationError` text under the Near Me toggle already
   explains why, no new error UI needed.
3. Close the modal (`setSelectedId(null)`) and, on mobile viewports, smooth
   scroll the map shell into view (`document.getElementById(...)
   .scrollIntoView({ behavior: "smooth" })` — reduced-motion visitors get an
   instant jump since this isn't a Motion-driven transition).
4. Compute straight-line `distanceKm` via the existing `distanceKm()` helper.
   If `< 0.2` (200m), set `route = { spot, coords: null, distanceKm,
   durationMin: null, arrived: true, loading: false }` and stop — no fetch,
   no line drawn, the pill shows "you're right next to it!" copy instead.
5. Check `routeCache` for key `` `${spot.id}:${lat.toFixed(3)},${lng.toFixed(3)}` ``.
   If present, use it immediately (`loading: false`), no network call.
6. Otherwise set `route = { spot, coords: null, distanceKm, durationMin: null,
   arrived: false, loading: true }` (dashed straight line shows immediately
   while the real route loads, so the map isn't blank), create a new
   `AbortController`, call `fetchRoute`. On success, cache the result and
   update `route` with `coords`/real `distanceKm`/`durationMin`, `loading:
   false`. On `null` (any failure), just clear `loading` — the straight-line
   fallback already in state stands as the final answer.

**Clearing effects**: a `useEffect` clears `route` when `route.spot.id` is no
longer in `visible` (category/search filtered it out) or when `userLocation`
becomes `null` (Near Me toggled off — the route has no origin anymore).

## Map (`components/spot/SpotMap.tsx`)

- New `route: RouteState | null` prop.
- `Polyline` from `react-leaflet`, rendered only when `route && !route.arrived`:
  `positions={route.coords ?? [userLocation, spotLatLng]}`, colored with the
  destination spot's category `accent`, `dashArray` set when `route.coords`
  is `null` (fallback/loading) and unset for a real route. Nothing is drawn
  in the `arrived` case — there's no meaningful line for "you're standing on
  it."
- `FitToSpots` becomes route-aware: when `route` is set and not `arrived`,
  fit bounds to just the route's points (or the two endpoints, for the
  fallback/loading case); when `route` is `arrived`, fit tightly to just the
  spot itself; when `route` clears, it goes back to fitting all visible
  spots exactly as it does today.
- New `RouteInfoPill` rendered inside the map shell (corner-tick visual
  language, matching the existing `map-shell` frame): a `<button>` showing
  `"{formatted distance} · {formatted duration} to {spot.name}"` (or the
  arrived copy), `aria-live="polite"` on the text node so it's announced when
  it appears/updates. Clicking the button body calls `onSelect(spot.id)`
  (reopens that spot's modal — since closing the modal to show the route
  would otherwise be a dead end). A separate small × control calls a new
  `onClearRoute` prop, which does *not* reopen the modal.

## Button (`components/spot/SpotActions.tsx`)

`"Get directions"` changes from `<a href={directionsUrl(spot)} target="_blank">`
to `<button onClick={() => onDirections(spot)} disabled={directionsLoading}>`,
showing the same `Loader2` spinner treatment `NearMeToggle` uses today while
`directionsLoading` (location resolving or route fetching) is true. New
`onDirections`/`directionsLoading` props thread through
`SpotDetailCard` → `SpotModal` → `app/page.tsx`.

`directionsUrl()` in `lib/categories.ts` becomes dead code once this ships —
remove it.

## Travel mode

Driving profile only, for every spot, in this pass. A couple of spots (e.g.
Mt. Balagbag) are hike/trail destinations where a driving route to a
trailhead somewhat misrepresents the trip — but that's a data-modeling
question (which spots count as "trail-style"?) that deserves its own pass
rather than riding along here. Worth a follow-up once this ships.

## i18n (`lib/i18n.ts`)

New keys (English-only, per the existing single-language setup):

```
"directions.pill": "{distance} · {duration} to {name}"
"directions.pillClose": "Clear route"
"directions.arrived": "You're right next to it!"
```

`durationMin` is formatted inline (not a shared helper) as `"{n} min"` under
60, else `"{h}h {m}min"` — mirrors the existing `formatDistance` style in
`lib/geo.ts` of small pure formatting functions.

## Error handling summary

| Failure | Behavior |
|---|---|
| Geolocation denied/unsupported/failed | No route drawn; existing `locationError` text explains why under the Near Me toggle. Directions button stops loading. |
| OSRM fetch fails, times out, or returns non-OK | Falls back to the straight-line distance + dashed line already computed client-side. No error text shown. |
| Spot filtered out of view while route is active | Route clears automatically. |
| Near Me toggled off while route is active | Route clears automatically (no origin). |

## Testing plan

Manual, via the `verify` skill, in a real browser:
- Get directions with location not yet granted → geolocation prompt fires,
  denial shows the existing near-me error text, no crash.
- Get directions with location already known → dashed straight line appears
  immediately, then (once OSRM responds) swaps to a solid road route with
  correct-looking distance/time in the pill.
- Click the pill → reopens that spot's modal. Click × → clears the route
  without reopening.
- Request directions to a spot within ~200m of the mocked location → "You're
  right next to it!" copy, no route line.
- Switch directions between two different spots quickly → only the
  second spot's route ends up showing (no stale overwrite).
- Reopen directions to the same spot without moving → route appears
  instantly from cache (verify via network tab: no second OSRM request).
- Toggle Near Me off while a route is showing → route clears.
- Filter/search away the destination spot while its route is showing →
  route clears.
- Check both light and dark map tile themes for line legibility.
- Mobile viewport: confirm the map scrolls into view when the modal closes
  for directions.
