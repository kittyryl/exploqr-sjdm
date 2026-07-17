---
name: verify
description: Build, launch, and drive ExploQR SJDM to verify changes end-to-end in a real browser.
---

# Verifying ExploQR SJDM

Next.js (App Router, JS) + react-leaflet single-page app. No tests; verification is runtime observation in a browser.

## Build & launch

```bash
npm run build            # catches SSR/window mistakes with Leaflet
npm run dev -- --port 3010   # dev server (run in background)
npm run start -- --port 3011 # production server — required to test the service worker/PWA install flow, which is disabled in dev on purpose
```

LAN access (phone testing): the dev server allowlists `192.168.*.*`/`10.*.*.*` via `allowedDevOrigins` in `next.config.mjs`. Without it, hitting the dev server from any non-localhost origin hangs on "Loading map…" forever and nothing is clickable — the HMR websocket gets blocked, which cascades into the dynamically-imported map chunk never resolving. This is dev-only; production has no such restriction. Reproduce/verify with Playwright by actually navigating to the machine's real LAN IP (`ipconfig`/`hostname -I`), not by faking headers — the block is keyed off the real Host/Origin.

## Drive it

Playwright against system Chrome — install `playwright-core` in the scratchpad (not the repo) and launch with `chromium.launch({ channel: "chrome", headless: true })`. No browser download needed.

Selectors that matter:
- Markers: `.spot-marker` (count = visible spots); each has an inner `div[aria-label="<spot name>"]` for clicking. Hover shows `.leaflet-tooltip.spot-tooltip`.
- Spot modal: `[role="dialog"]`; title is `[role="dialog"] h2`. Close control differs by viewport: mobile (<640px) is `button[aria-label="Back to map"]` (full-screen page), desktop (≥640px) is `button[aria-label="Close"]` (centered dialog) — the other one is present in the DOM but `display:none`, so check `.isVisible()`, not just presence.
- Chips: `nav[aria-label='Filter spots by category'] button`.
- Spot tiles: `section[aria-label='More spots'] li` (6), each wrapping a `button` (heading text is "All spots"). A tile with a photo has an `img`; a tile without one has no `img` and an inline `background` of that category's `block` color. **Exactly 4 have photos, 2 don't** (Padre Pio, Tungkong Mangga) — that ratio is the design's load-bearing case, not an accident.
- Photo lightbox: full-screen overlay `.z-\[60\]`; close `button[aria-label="Close zoomed photo"]`; nav `button[aria-label="Previous photo"]` / `[aria-label="Next photo"]`.
- Near me: the toggle is `button[aria-pressed]` with text "Near me"/"Locating…" — note `aria-pressed` also matches the active category chip, so scope with `.getByText()` or count 2 when both are active. Distance badges live in the list rows and in the modal (text containing "away").
- Attribution: `.leaflet-control-attribution` must contain "© OpenStreetMap contributors © CARTO" (license requirement).

## Flows worth driving

1. Load `/` → 6 markers, map-first landing, **no modal open**, no `?spot=` in URL.
2. Hover a marker → tooltip with spot name appears.
3. Click a marker → spot view opens: full-screen page (<640px, dialog `boundingBox()` equals viewport size, no backdrop-click-to-close since nothing's exposed) or centered dialog (≥640px, `boundingBox()` width < viewport width, map dimmed and visible behind it), title matches, URL becomes `?spot=<id>`.
4. Click "Nature" chip while a spot view from a now-filtered-out spot is open → it closes (selection isn't forced to a fallback spot anymore — map-first means "no selection" is a valid state); counts on chips are Religious 2 / Nature 3 / Leisure 1.
5. Click an "All spots" list row → same spot view opens.
6. Inside it, click the main photo → lightbox opens on top; Esc closes **only** the lightbox (spot view stays open) — verifies the capture-phase Escape isolation in PhotoLightbox.
7. Esc, the back arrow (mobile) / × (desktop), or backdrop click (desktop only) closes it → URL drops `?spot=` entirely, back to map-first.
8. Deep link `/?spot=balagbag` → Mt. Balagbag view open directly on load; bogus id → nothing open (map-first), not a fallback selection.
9. 375px viewport → full-screen page with a sticky back-arrow header, no horizontal scroll.
10. Near me (needs a Playwright context with `geolocation` + `permissions: ["geolocation"]` set at `browser.newContext()` — granting mid-session via `context.grantPermissions` after `goto` is unreliable): click the toggle → blue "you are here" dot appears on the map, list re-sorts nearest-first with a "X km"/"X m" badge per row, open modal shows "X km away". Click again → location clears, order/badges revert. A context with no geolocation permission granted (`grantPermissions([])`) → clicking shows an inline "Location access was denied." message instead of hanging.
11. PWA/offline (run against `npm run start`, not `next dev` — the service worker only registers when `NODE_ENV=production`): load `/` once, check `navigator.serviceWorker.getRegistration()` resolves with `active: true`. **Reload once more while still online** (the very first navigation happens before the SW controls the page, so nothing is cached yet — this warm reload is what actually primes the cache). Then `context.setOffline(true)` and reload again → page still renders with all 6 markers. `curl http://localhost:3011/manifest.webmanifest` should return valid JSON with 3 icons; `/icon`, `/apple-icon` should both 200 as `image/png`.
12. Install banner: spawn a context with an iPhone `userAgent` → banner shows "Add to Home Screen" instructions with no "Install" button (iOS has no `beforeinstallprompt`). Click Dismiss → banner gone, and stays gone after reload (`localStorage["exploqr-install-dismissed"]`).

13. Keyboard/focus: open a spot from a list row, press Tab ~30x → focus never leaves `[role=dialog]` (`lib/useFocusTrap.js`); Esc → focus returns to the row that opened it. Open the lightbox and Tab → focus stays in `.z-\[60\]`, not the modal behind it (only the topmost overlay traps; the trap stack is what makes that work).
14. Dark mode: spawn a context with `colorScheme: "dark"`. `document.body` background must be `rgb(20, 25, 23)`; `.map-dim-mask` computed `fill` must equal the body background. Basemap is **`rastertiles/voyager` in light and `dark_all` in dark** — Voyager has no dark sibling, so this is not a symmetric pair (an older suite asserting `light_all` is stale, not a regression). Two things must stay **dark in both themes**, both because they're constants rather than `ink`, which inverts into white glare: the lightbox scrim (`bg-scrim/95`) and every category `block`. `.spot-panel` is *not* one of them — it's a 3.5% `ink` wash that flips with the theme, and its alpha should stay under 0.1 (an opaque dark band was tried and rejected).

15. Language: the toggle is `getByRole("group", {name: /Language/})` with `button[name="en"|"tl"]`. Clicking **tl** must set `document.documentElement.lang`, persist `localStorage["exploqr-locale"]`, survive a reload — and, since the `tl` dictionary is empty, render **English fallback everywhere** rather than blanks. Assert no raw keys leak (regex the body text for `/\b(hero|filter|cat|nearme|spot|media)\.[a-z]+/`); a key rendering literally is the failure mode this design invites. To prove the override path actually works, temporarily add one `tl` entry, check it renders, then revert.

16. Spot grid: `/` shows 6 tiles — 4 photos, 2 category blocks. Blocking `**/_next/image**` must turn **all 6** into blocks with zero broken-image glyphs (`img.complete && img.naturalWidth === 0`), since a dead photo and an absent photo are the same state by design. White text on a block must measure ≥4.5:1 (the nature block's `.opacity-85` meta line is the tightest in the app at 4.7:1 — re-measure it before touching those colors). The category pill inverts between tile types: `block` bg on a photo, white bg on a block. The hero headline has 4 category-colored `span`s that are also the map legend; each must clear AA on paper in both themes.

17. Motion: on load, `h1 span` animation delays must read `0.08s, 0.15s, 0.22s, 0.29s` (headline nouns in reading order) and the map container `0.5s`. Exactly **one** `.spot-marker-pulse` exists — only on the selected pin — so assert it with a deep link (`/?spot=grotto`); clicking a tile and pressing Escape *clears the selection*, and the pulse correctly disappears. Under a `reducedMotion: "reduce"` context, `.rise-in` and `.spot-tile` must compute `animationName: none`, the pulse `display: none`, and tiles must still be **`opacity: 1`** — the reveal is what un-hides them, so reduced motion has to un-hide them itself or the grid stays blank.
18. Tile motion ([Motion](https://motion.dev), `components/SpotList.js`) — **sample on an interval, never at one guessed instant**; every flake here has been a single `waitForTimeout` landing beside a ~90–180ms animation while the page was fine.
    - *Reveal*: grid is below the fold, so it's `whileInView`, not load-triggered. Before scrolling, tiles sit at `opacity: 0`; after `scrollIntoView`, a frame ~220ms in looks like `[96, 87, 66, 29, 0, 0]` — that spread is what proves a stagger rather than one fade.
    - *Exit*: filter to Nature and sample every 25ms. Leaving tiles go `position: absolute` (that's `mode="popLayout"`) with opacity falling, for ~90ms, then unmount. Catching *zero* such frames means exit is broken — the usual cause is `SpotTile` not passing `ref` through to `motion.li`, which stops `popLayout` measuring it and drops the tile instantly, with no error anywhere.
    - *Reorder*: this is why the dependency exists. Grant `geolocation` at `newContext` (14.8397, 121.0564 is beside Cattle Creek), click Near me, and within ~90ms the tiles should carry non-`none` transforms while sliding to their sorted positions.
    - *Reduced motion*: a `reducedMotion: "reduce"` context must leave tiles at `opacity: 1` without scrolling. `<MotionConfig reducedMotion="user">` in `app/page.js` is what guarantees it.

## Gotchas

- Full-page screenshots render the `position: sticky` header at its **scrolled** offset, so it appears floating over the middle of the map in any capture taken after a click that scrolled the page. That's a Playwright artifact, not a layout bug — scroll to top before capturing if it matters.
- **Never run `npm run build` while `next dev` is live on the same `.next`.** The dev server then serves a *stale stylesheet* — new CSS custom properties silently resolve to empty, so inline `style={{ background: "var(--cat-nature-block)" }}` renders transparent while the class-based layout looks perfectly fine. It reads exactly like a broken component. Tell-tale: `getComputedStyle(el).backgroundColor` is `rgba(0, 0, 0, 0)` and `getPropertyValue("--your-token")` returns `""`. Fix: kill dev, `rm -rf .next`, restart. Check a token actually reached the browser before debugging the component.
- Contrast probes that report a suspiciously round, uniform number (everything at `16:1`) are usually measuring against a **transparent** background that the canvas then composites over white — i.e. the probe is broken, not the page passing. Always print the resolved `bg` next to the ratio so a phantom `rgba(0, 0, 0, 0)` is visible.
- `schema.js` **cannot pass on clean data** — it asserts on fixture values (`₱500 green fee`, `0917 123 4567`, `example-golf.ph`) that are intentionally not in the repo. A timeout there is expected, not a regression; add the fixture to one spot to run it, then revert.
- To test the photo-failure fallbacks ("Photo unavailable" / category icon), block **`**/_next/image**`**, not `upload.wikimedia.org`. Photos go through `next/image`, so the browser never requests Wikimedia — the optimizer fetches it server-side. Blocking the Wikimedia host from Playwright intercepts nothing and the test passes while asserting nothing.
- Measuring color contrast: Tailwind v4 emits `oklab()` for opacity modifiers (`text-ink/70`), so regexing digits out of `getComputedStyle().color` produces garbage ratios. Paint the color onto a 1x1 canvas over an opaque backdrop and read the pixel back — that also composites alpha the way the page does.
- `fee` / `contact` / `website` are unset on every spot today, so those rows render nowhere. To exercise them, add the fields to one spot temporarily — and revert: no invented fees or phone numbers belong in `data/spots.js`.
- Photo panel: the main image is now a `<button>` (for the zoom affordance), so its `<img>` is `page.locator('figure button').first().locator('img')` — a bare `figure img` also matches the thumbnails.
- The image optimizer compiles on first request in dev, so the first `figure button img` can take >1s to appear. Wait on the locator rather than a fixed short timeout, or the first run of a suite flakes while later ones pass. To test the 360° viewer, temporarily set `pano360: "https://pannellum.org/images/alma.jpg"` on a spot (revert after); the 360° thumb-button renders a `figure canvas` when working. The 360° view has no zoom/lightbox (only static photos do).
- `SpotModal` and `PhotoLightbox` both listen for Escape; `PhotoLightbox` registers its listener with `{capture: true}` and calls `stopPropagation()` so closing the lightbox doesn't also close the modal underneath. If you add more stacked overlays, follow the same pattern.
- Body scroll is locked by `SpotModal` only (`document.body.style.overflow`); `PhotoLightbox` deliberately does not touch it, since it only ever opens while the modal already has the lock. Don't add a second lock/unlock in the lightbox — the two would race on close order.
- If `next dev` reports "Another next dev server is already running", verify against that server's port instead of killing it — it may be the user's.

- The map is locked to the city: `minZoom={11}` + `maxBounds` (data/sjdmBoundary.js). Zoom-out disables (`.leaflet-disabled`) after ~1 step from the initial fit — that's correct behavior, not a bug. Expect 2 paths in `.leaflet-overlay-pane` (outside-dim mask + dashed boundary).

- The floating black "N" circle in screenshots is the Next.js dev-tools badge (dev mode only).
- Give the map ~400–600ms after filter changes before counting markers (fitBounds animation).
- Marker page errors surface as `pageerror` — attach listeners before `goto`.
- `ServiceWorkerRegister` is a no-op under `next dev` on purpose (`process.env.NODE_ENV !== "production"` guard) — a caching SW fighting Turbopack's HMR would be a worse bug than the one it's meant to fix. Always use `npm run start` for anything SW/offline/install-related.
- `public/sw.js` has no precache list — offline only works for things already requested once while the SW was active (see flow 11). Don't expect the very first-ever visit to work offline; that's expected, not a bug.
