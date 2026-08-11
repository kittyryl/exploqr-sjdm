# Rating Simplification & Free Directions Panning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drop name/comment collection from the spot rating form, and let visitors freely pan the map while directions are active instead of being rubber-banded to the city boundary.

**Architecture:** Two small, independent UI edits in the existing Next.js/React/Leaflet app. No new components, no new dependencies, no backend/schema changes.

**Tech Stack:** Next.js 16 (App Router, TS), React 19, react-leaflet 5 / Leaflet 1.9, Supabase JS client. No automated test runner in this repo (`package.json` has no `test` script) — verification is `tsc`/`eslint` plus manual/Playwright browser observation, per the project's `verify` skill (`.claude/skills/verify/SKILL.md`).

## Global Constraints

- No automated test framework exists — do not add one. Verify via `npx tsc --noEmit`, `npm run lint`, and browser observation (dev server + Playwright against system Chrome, per `.claude/skills/verify/SKILL.md`).
- Rating change is UI-only: `lib/types.ts` (`Review.name`/`Review.comment`) and the Supabase schema are unchanged — only the form and submit payload change.
- Directions panning fix must only affect map behavior while a route is active (`route != null`); normal browsing (no route) keeps the existing city-boundary lock unchanged.
- Follow the existing `SpotMap.tsx` pattern for map-instance side effects: a small component that calls `useMap()` and syncs state via `useEffect` (see `FitToSpots`, `FullscreenResize` already in that file).

---

### Task 1: Simplify the rating form to stars-only

**Files:**
- Modify: `components/spot/RateOverlay.tsx`
- Modify: `components/spot/SpotReviews.tsx`
- Modify: `lib/i18n.ts`

**Interfaces:**
- No exported signatures change. `RateOverlayProps` (in `RateOverlay.tsx`) keeps `own?: Review` — it's now only used to prefill nothing (name/comment fields are gone), but the prop stays since `own` still gates "Post review" vs. "Update your review" button text.
- `SpotReviews.tsx`'s `handleSubmit(e: FormEvent<HTMLFormElement>)` keeps its signature; only its body changes.

- [ ] **Step 1: Remove the name and comment fields from `RateOverlay.tsx`**

  In `components/spot/RateOverlay.tsx`, delete these two `<label>` blocks (currently between the hearts picker `<div>` and the submit button `<div>`):

  ```tsx
          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink/70">
            {t("review.name")}
            <input
              type="text"
              name="name"
              defaultValue={own?.name ?? ""}
              disabled={status === "sending"}
              placeholder={t("review.name.placeholder")}
              className={FIELD}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink/70">
            {t("review.comment")}
            <textarea
              name="comment"
              rows={3}
              defaultValue={own?.comment ?? ""}
              disabled={status === "sending"}
              placeholder={t("review.comment.placeholder")}
              className={`resize-y ${FIELD}`}
            />
          </label>
  ```

  Leave everything else in the file (`FIELD` constant, honeypot checkbox, hearts picker, submit button, status messages) untouched. Since `FIELD` is still used by no other element after this removal... check: it was only used by the two removed inputs. Remove the now-unused `FIELD` constant too:

  ```tsx
  const FIELD =
    "rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-ink/20";
  ```

  (delete this whole line — it has no remaining references after Step 1's field removal).

- [ ] **Step 2: Stop reading/sending name and comment in `SpotReviews.tsx`**

  In `components/spot/SpotReviews.tsx`, find `handleSubmit` and change the upsert call from:

  ```tsx
    const { error } = await supabase.from("reviews").upsert(
      {
        spot_id: spot.id,
        device_id: deviceId,
        name: (data.get("name") as string)?.trim() || null,
        hearts,
        comment: (data.get("comment") as string)?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "spot_id,device_id" }
    );
  ```

  to:

  ```tsx
    const { error } = await supabase.from("reviews").upsert(
      {
        spot_id: spot.id,
        device_id: deviceId,
        hearts,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "spot_id,device_id" }
    );
  ```

  The `data` (`FormData`) variable built two lines above is still used for the `botcheck` honeypot read just above this block — leave that as-is.

- [ ] **Step 3: Remove the unused i18n keys**

  In `lib/i18n.ts`, delete these four lines (they're only referenced from the fields removed in Step 1):

  ```ts
    "review.name": "Your name (optional)",
    "review.name.placeholder": "Juan dela Cruz",
    "review.comment": "Comment (optional)",
    "review.comment.placeholder": "What stood out?",
  ```

- [ ] **Step 4: Typecheck and lint**

  Run:
  ```bash
  npx tsc --noEmit
  npm run lint
  ```
  Expected: both exit 0, no errors referencing `RateOverlay.tsx`, `SpotReviews.tsx`, or `i18n.ts` (in particular, no "unused variable `FIELD`" or dangling `review.name`/`review.comment` key references).

- [ ] **Step 5: Manual verification in a real browser**

  Start the dev server in the background:
  ```bash
  npm run dev -- --port 3010
  ```

  From the scratchpad directory, install Playwright's Chrome driver if not already present (`npm install playwright-core` — do this in the scratchpad, not the repo) and run:

  ```js
  const { chromium } = require("playwright-core");
  (async () => {
    const browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    await page.goto("http://localhost:3010/");
    await page.locator(".spot-marker").first().click();
    await page.getByRole("button", { name: "Rate this spot" }).click();
    const dialog = page.locator('[role="dialog"][aria-labelledby="rate-overlay-title"]');
    await dialog.waitFor({ state: "visible" });
    const nameInput = dialog.locator('input[name="name"]');
    const commentTextarea = dialog.locator('textarea[name="comment"]');
    console.log("name input count:", await nameInput.count());       // expect 0
    console.log("comment textarea count:", await commentTextarea.count()); // expect 0
    console.log("heart buttons count:", await dialog.locator('button[aria-label*="Rate"]').count()); // expect 5
    await browser.close();
  })();
  ```

  Expected output: `name input count: 0`, `comment textarea count: 0`, `heart buttons count: 5`. If Supabase isn't configured in this environment, the "Rate this spot" button won't render (`review.config` message shows instead) — in that case, confirm the config message shows instead of the button, which is existing unrelated behavior, not a regression to chase here.

- [ ] **Step 6: Commit**

  ```bash
  git add components/spot/RateOverlay.tsx components/spot/SpotReviews.tsx lib/i18n.ts
  git commit -m "Simplify spot ratings to stars-only, dropping name/comment fields"
  ```

---

### Task 2: Free map panning while directions are active

**Files:**
- Modify: `components/spot/SpotMap.tsx`

**Interfaces:**
- Consumes: `route: RouteState | null` (already a `SpotMapProps` field, imported from `@/lib/routing`), `cityBounds: L.LatLngBounds` (already computed via `useMemo` in `SpotMap`).
- Produces: a new internal component `RouteBoundsGuard({ routeActive: boolean; bounds: L.LatLngBounds })` — not exported, used only inside `SpotMap.tsx`.

- [ ] **Step 1: Add the `RouteBoundsGuard` component**

  In `components/spot/SpotMap.tsx`, add this new component right after `FullscreenResize` (which follows the same `useMap()` + `useEffect` pattern):

  ```tsx
  // Leaflet's maxBounds normally keeps the map locked to the city, but that
  // fights a visitor trying to look around while navigating. Lifting it
  // while a route is active — and restoring it once directions are cleared —
  // is the only way to do this dynamically, since maxBounds is otherwise
  // fixed at MapContainer init.
  function RouteBoundsGuard({
    routeActive,
    bounds,
  }: {
    routeActive: boolean;
    bounds: L.LatLngBounds;
  }) {
    const map = useMap();
    useEffect(() => {
      map.setMaxBounds(routeActive ? undefined : bounds);
    }, [routeActive, bounds, map]);
    return null;
  }
  ```

- [ ] **Step 2: Render it inside `MapContainer`**

  In the `SpotMap` component's returned JSX, add `<RouteBoundsGuard routeActive={route != null} bounds={cityBounds} />` next to the other helper components (`FitToSpots`, `FullscreenResize`):

  ```tsx
        <FitToSpots spots={spots} userLocation={userLocation} route={route} />
        <FullscreenResize fullscreen={fullscreen} />
        <RouteBoundsGuard routeActive={route != null} bounds={cityBounds} />
  ```

  Leave the `MapContainer`'s own `maxBounds={cityBounds}` and `maxBoundsViscosity={1.0}` props as they are — they still set the correct initial state before `RouteBoundsGuard`'s first effect run, and get overridden dynamically thereafter.

- [ ] **Step 3: Typecheck and lint**

  Run:
  ```bash
  npx tsc --noEmit
  npm run lint
  ```
  Expected: both exit 0, no errors in `SpotMap.tsx`.

- [ ] **Step 4: Manual verification in a real browser**

  Start the dev server if not already running:
  ```bash
  npm run dev -- --port 3010
  ```

  From the scratchpad directory, run (adjust the `geolocation` coordinate — any point inside San Jose del Monte works, e.g. `14.8148, 121.0453`):

  ```js
  const { chromium } = require("playwright-core");
  (async () => {
    const browser = await chromium.launch({ channel: "chrome", headless: true });
    const context = await browser.newContext({
      geolocation: { latitude: 14.8148, longitude: 121.0453 },
      permissions: ["geolocation"],
    });
    const page = await context.newPage();
    await page.goto("http://localhost:3010/");
    await page.locator(".spot-marker").first().click();
    await page.getByRole("button", { name: "Get directions" }).click();
    // Wait for the route to settle (loading spinner replaced by the icon again).
    await page.waitForTimeout(2000);

    const pane = page.locator(".leaflet-map-pane");
    const before = await pane.evaluate((el) => getComputedStyle(el).transform);

    // Drag the map a large distance — before the fix this snaps back
    // (transform barely changes); after the fix it should move freely.
    const map = page.locator(".leaflet-container");
    const box = await map.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 600, box.y + box.height / 2 + 600, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    const after = await pane.evaluate((el) => getComputedStyle(el).transform);
    console.log("before:", before);
    console.log("after:", after);
    console.log("changed:", before !== after);
    await browser.close();
  })();
  ```

  Expected: `changed: true`, and the translation component of `after`'s matrix differs from `before` by roughly the drag distance (a few hundred px), not snapping back to within a few px of `before`. If geolocation permission isn't grantable in this environment, fall back to clicking "Get directions" directly without a location toggle — `handleDirections` in `app/page.tsx` will prompt for location itself; grant it via the context as shown above, since without geolocation the button can't produce a route to test against.

  Then verify the restore path: clear the route (select a different spot without clicking directions, or click the spot again and look for a "clear route" control if present) and confirm a drag by the same distance now snaps back close to `before` — i.e., the city-boundary lock is back.

- [ ] **Step 5: Commit**

  ```bash
  git add components/spot/SpotMap.tsx
  git commit -m "Free map panning while directions are active"
  ```
