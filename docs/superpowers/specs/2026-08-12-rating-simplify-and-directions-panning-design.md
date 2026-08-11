# Rating Simplification & Free Panning During Directions

## Context

Two small, unrelated UX fixes bundled together because both were requested in the same pass:

1. The "rate this spot" form collects a name and comment, but the individual review list was already removed from the UI (Aug 9), so those fields are collected and never shown anywhere. Only the aggregate rating (average hearts + count) is displayed.
2. The explore map locks panning to the San Jose del Monte city boundary (`maxBounds` + `maxBoundsViscosity={1.0}`) at all times. While directions are active, this rubber-bands the map back whenever a visitor tries to pan near the boundary, making it hard to freely look around the route or destination.

## 1. Simplify spot ratings to stars-only

**Goal:** the rating form asks only for a star (heart) rating — no name, no comment.

**Changes:**

- `components/spot/RateOverlay.tsx` — remove the "Your name" and "Comment" `<label>`/`<input>`/`<textarea>` blocks. The form becomes: heart picker → submit button → status message.
- `components/spot/SpotReviews.tsx` — `handleSubmit` stops reading `name`/`comment` from `FormData`. The Supabase upsert sends only `spot_id`, `device_id`, `hearts`, `updated_at` (plus `onConflict`).
- `lib/i18n.ts` — remove the now-unused keys: `review.name`, `review.name.placeholder`, `review.comment`, `review.comment.placeholder`.
- No change to `lib/types.ts` (`Review.name` / `Review.comment` stay as `string | null`) or the Supabase schema — those columns simply stop receiving new data going forward. This is a UI-only change.
- Honeypot bot-check field, focus trap, success/error states, and the "edit your own review" flow (via `own`) are unaffected.

## 2. Free panning during directions

**Goal:** while a route is active, the visitor can pan anywhere; once directions are cleared, the map reverts to being locked to the city boundary.

**Changes:**

- `components/spot/SpotMap.tsx` — add a small helper component following the existing pattern used by `FitToSpots` and `FullscreenResize` (a component that calls `useMap()` and syncs external state to the Leaflet instance via `useEffect`):

  ```tsx
  function RouteBoundsGuard({ routeActive, bounds }: { routeActive: boolean; bounds: L.LatLngBounds }) {
    const map = useMap();
    useEffect(() => {
      map.setMaxBounds(routeActive ? undefined : bounds);
    }, [routeActive, bounds, map]);
    return null;
  }
  ```

- Render it inside `MapContainer` alongside the other helper components, passing `routeActive={route != null}` and `bounds={cityBounds}` (the existing memoized value).
- `MapContainer`'s own `maxBounds={cityBounds}` prop stays as the initial value (applies before the guard's first effect run); `maxBoundsViscosity={1.0}` is unaffected since it only matters when bounds are actually set.
- `map.setMaxBounds(undefined)` fully removes the panning restriction. Passing `cityBounds` again (when the route clears) re-applies it, and Leaflet immediately pans the view back inside those bounds if the visitor had panned outside while directions were active — restoring the normal browsing constraint.
- No changes to `FitToSpots` — it still auto-fits the view when directions start or the road route resolves; this only changes what happens after that, when the visitor manually drags the map.

## Testing

- Manual: open a spot, submit a rating — confirm only the heart picker shows, submission succeeds, and the aggregate average/count updates.
- Manual: click "Edit your review" on a spot you've already rated — confirm it opens directly to the heart picker (no stale name/comment fields).
- Manual: click "Get Directions" on a spot, then drag the map toward/past the city boundary — confirm it pans freely. Clear the route (or select a new spot without directions) and confirm the boundary lock resumes.
- `npm run lint` / `npx tsc --noEmit` for type/lint correctness (no automated test suite covers these UI paths).
