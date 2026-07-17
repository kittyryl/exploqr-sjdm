# ExploQR SJDM

A tourism guide web page for **San Jose del Monte, Bulacan, Philippines** — an interactive map of the city's tourist spots (pilgrimage shrines, Mt. Balagbag, Kaytitinga Falls, adventure camps, and the Cattle Creek golf course) with details and Google Maps directions for each.

Personal/portfolio project. v1 is fully static: no database, no backend, no auth.

## Stack

- [Next.js](https://nextjs.org) (App Router, plain JavaScript)
- [react-leaflet](https://react-leaflet.js.org) + Leaflet with free [CARTO Positron](https://carto.com/basemaps) tiles (no API key)
- [Tailwind CSS](https://tailwindcss.com) v4
- [lucide-react](https://lucide.dev) icons

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To test on a phone on the same network, open `http://<your-LAN-IP>:3000`. `next.config.mjs` allowlists private LAN origins (`allowedDevOrigins`) — without it, Next's dev server blocks the hot-reload websocket from any non-localhost origin, which silently breaks the page (map stuck on "Loading map…", nothing clickable) even though the HTML loads fine. This restriction is dev-only; production builds aren't affected.

## How it's organized

```
data/spots.js              all spot data (static array — edit here to add spots)
lib/categories.js          category colors + icons (single source of truth)
lib/geo.js                 haversine distance + formatting for "Near me"
components/SpotMap.js      Leaflet map, custom circular markers, hover tooltips, fitBounds, user-location dot
components/SpotModal.js    bottom sheet (mobile) / centered dialog (desktop) for a spot
components/SpotDetailCard.js  content rendered inside the modal
components/SpotMedia.js    photo/360 panel with click-to-zoom
components/PhotoLightbox.js   full-screen photo zoom with prev/next
components/SpotList.js    grid of spot tiles — a photo, or a saturated category block when there's none
components/CategoryFilter.js
components/NearMeToggle.js "Near me" pill: requests geolocation, drives distance sort
components/ServiceWorkerRegister.js  registers public/sw.js (production only)
components/InstallPrompt.js  dismissible "add to home screen" banner
app/manifest.js            web app manifest (name, icons, standalone display)
app/icon.js / app/apple-icon.js  favicon + iOS home-screen icon, generated from the wordmark glyph
public/sw.js                service worker: offline app shell + cached map tiles/photos
app/page.js                selection + filter state, ?spot= deep links
```

## Theming

Three role tokens carry the whole design — `paper`, `ink`, `line` — defined in `app/globals.css` and flipped under `prefers-color-scheme: dark`. Dark mode is not a literal inversion: `paper` becomes a warm near-black, `ink` a warm off-white, and `line` *lightens* (a hairline reads as a rule by contrasting its surface, not by being dark). Because the roles hold, every `text-ink/70` in the app works in both themes and there is not a single `dark:` variant in the codebase.

Three things deliberately do **not** follow the theme:

- **`--scrim`** — the wash behind the modal and lightbox. It used to be `bg-ink/45`, which in dark mode inverts into a white glare panel over your photos. A scrim is dark by definition, so it's its own constant.
- **Category `fill`** — the saturated identity colors (and the logo made of them) are the same in both themes. Their `accent`/`tint` pair does swap, since a color legible on paper is invisible on ink.
- **Category `block`** — the card-sized surface behind white text (photoless spot tiles, active filter chips). A saturated block is a block in both modes.

`block` exists because `fill` can't do that job: white text on the bright fills measures **3.4–3.9:1**, under the AA floor of 4.5. The blocks are deepened versions of the same hues that clear 5:1 with white (measured, not estimated). So the rule is: `fill` carries no text — markers, dots, and the icon watermark only — and anything with words on it uses `block` + `blockFg`.

Category colors live in `lib/categories.js` but their *values* are `var(--cat-*)` references, because components apply them as inline styles — a JS media query there would risk a hydration mismatch, while a CSS variable just resolves correctly on both sides of the render. Two consequences worth knowing: Leaflet writes `pathOptions` colors into SVG presentation attributes, which can't hold `var()`, so the boundary and dim mask are styled via the `.map-boundary` / `.map-dim-mask` CSS rules instead; and the marker halo uses `color-mix()` rather than the old `${fill}55` hex-concatenation, which a variable would break.

Muted text is `/70`. That's the floor for WCAG AA — `/60` composites to 4.2:1 on paper, which looks fine and still fails. Measure before lowering it.

The page background is a **survey graticule** — minor rules every 40px, major every 200px, both under 9% ink. Flat paper read as an unfinished page; grid paper is what a field guide to a mapped city should sit on. It rides the `ink` token, so it inverts with the theme for free.

The spot grid sits on `.spot-panel`, a full-bleed **3.5% ink wash** — deliberately a wash and not an opaque fill, so the graticule reads straight through it and text keeps inheriting `ink`. An opaque dark band was tried here and rejected: it filled the space but read as a slab dropped on the page.

## Motion

One orchestrated page-load sequence rather than effects sprinkled around: eyebrow → the four headline nouns in reading order (70ms apart) → supporting line → Near me → map at 500ms. The headline is what's worth watching arrive, since each word names a category and paints itself in that color.

The spot tiles are **not** part of that sequence, and that's the point: they sit below a 560px map, so a load-triggered entrance finished against an empty viewport and you scrolled down to a grid that had already arrived. They deal themselves in on a stagger when the grid first scrolls into view (`whileInView`, `once: true`).

### Why [Motion](https://motion.dev) is a dependency

The tiles' entrance, exit, reorder, hover and press live in `components/SpotList.js`, not in CSS. It's ~30–35kb gzipped, which is a real tax on an offline-first app, and it buys exactly three things CSS cannot express:

- **`layout`** — when **Near me** re-sorts the grid, tiles travel to their new positions instead of teleporting. The movement *is* the information: you see Cattle Creek overtake the others because it's nearest. This is the reason the dependency is here.
- **`AnimatePresence`** — a tile removed by a filter is already unmounted by React; CSS has nothing left to animate. `mode="popLayout"` pulls the leaver out of grid flow so the survivors close the gap while it fades rather than after.
- **Spring physics** on hover/press, instead of fixed-duration easing.

Two details that will bite if you touch this file:

- `SpotTile` takes **`ref` as a plain prop** (React 19) and must pass it to `motion.li`. `popLayout` measures the exiting tile before popping it out of flow; a component that swallows the ref can't be measured, and the tile is dropped instantly instead of animating out — silently, with no error.
- `<MotionConfig reducedMotion="user">` wraps the page in `app/page.js`. It must sit above every motion component. It's what keeps the accessibility promise now that Motion, not the stylesheet, owns these animations.

The map has exactly **one looping animation** — a ring pulsing around the selected pin (`.spot-marker-pulse`) — and it earns the loop by marking which spot you have open. It's built as a child span rather than a CSS class on the marker because the marker's own `box-shadow` halo is written inline.

Every animation here is off under `prefers-reduced-motion: reduce`. `backwards` fill on the delayed ones is load-bearing: without it an element flashes at full opacity before its delay elapses.

## The basemap

CARTO **Voyager**, not Positron. Positron is built to disappear underneath data, which is right for a dashboard and wrong here — the map *is* the content, and its emptiness made the page look unfinished. Voyager carries the Sierra Madre's green, the road hierarchy, and the reservoirs. Same provider, same attribution, still no API key.

Dark mode stays on `dark_all`: Voyager has no dark sibling, so the pair is deliberately asymmetric (`components/SpotMap.js`). The mask that dims everything outside the city boundary sits at `fillOpacity: 0.5` — enough that the city reads as the subject, not so much that the surrounding terrain turns back into blank page.

## Language (English / Tagalog)

An **EN/TL** toggle sits in the header. The plumbing is complete; **the Tagalog dictionary is empty on purpose**.

Every lookup falls back to English, so the app is fully usable while translation is in progress and a half-finished dictionary is a valid state — translate one string, and only that string changes. Nothing crashes on a missing key and nothing renders blank.

Two places to write translations:

- **UI copy** — the `tl` object in `lib/i18n.js`. Mirror the `en` keys.
- **Spot content** — `name`, `description`, `hours`, and `fee` in `data/spots.js` accept either a plain string (English) or `{ en, tl }`. Both shapes work side by side, so spots convert individually with no migration.

Proper nouns (barangays, most spot names) stay untranslated. The locale is stored in `localStorage["exploqr-locale"]` and applied to `<html lang>` after mount — the page is fully static, so reading it on the server would force dynamic rendering; the cost is one frame of English for a reader who has Tagalog saved.

## Spot details

Beyond `hours`, each spot takes optional `fee`, `contact`, and `website`. **Each renders only when set** — a spot with none of them looks finished rather than broken, so add them as the information is confirmed locally rather than guessing. `contact` becomes a `tel:` link (keep it a real, dialable number) and `website` displays as a bare hostname.

## The hero, the grid, and the missing photos

The headline is painted one noun per category color — purple *Shrines*, green *summits* and *falls*, rust *& fairways* — so it doubles as the map legend: you learn what the pin colors mean before you reach the map. That's the reason each word is its own `hero.word.*` key in `lib/i18n.js` rather than one string. Keep the mapping in `HEADLINE` (`app/page.js`) truthful — a word tinted for a category it doesn't name is just decoration, and worse, a lie.

Below the map, spots are **tiles**. A spot with a photo is a photo; a spot without one is a saturated block of its category color with the category icon bleeding off the edge. The block is not a placeholder apologising for a missing photo — two of the six spots have no photo at all, and treating "no photo" as a first-class state is what lets the grid look finished today while making every photo you add later an upgrade rather than a repair. A photo that 404s lands in exactly the same state, so a dead Wikimedia URL degrades into a designed tile instead of a hole.

There are deliberately **no 01–06 numbers** on the tiles, tempting as they look: the spots aren't a sequence, and with "Near me" sorting on, the numbers would reshuffle and mean even less.

## Interaction model

The map is the landing view — no spot is selected on load. Hovering a pin shows a name preview; clicking a pin (or a tile in the "All spots" grid) opens that spot's detail view: a full-screen page with a back arrow on mobile (a bottom sheet left the map peeking through cramped margins; full-screen gives photos and text the room they need), a centered dialog over the dimmed map on desktop, where there's room to spare. Close via the back arrow / × button, Esc, or (desktop only) clicking the backdrop. Clicking a photo opens a full-screen lightbox on top of that (Esc/←/→, or the on-screen arrows) without closing the spot view underneath.

## Near me

The **Near me** button above the map requests a one-time browser geolocation fix (only on click — never on load). Once granted, a blue dot marks your position on the map, the "All spots" list and map re-sort nearest-first with a distance badge per spot, and the open spot modal shows its own distance. Denying the permission (or an unsupported browser) shows an inline message instead of failing silently; toggling the button off clears the location and reverts to the default order.

## Deep links

The selected spot syncs to the URL, e.g. `/?spot=balagbag`, and opens that spot's modal directly on load. This is the bridge to the planned QR-code feature: each printed QR code will simply encode a spot's deep link.

## Photos & 360° views

Spot photos live in each spot's `images` array in `data/spots.js`. The current photos are freely-licensed images of the actual spots from Wikimedia Commons — the credit + license line shown under each photo is required by those licenses, keep it.

Photos render through `next/image`, so `upload.wikimedia.org` is allowlisted under `images.remotePatterns` in `next.config.mjs` — a new photo host has to be added there or the optimizer will refuse it. Since every photo is hotlinked, a dead URL falls back to a "Photo unavailable" placeholder (or, in the grid, that spot's category block) rather than a broken-image glyph. The grid is server-rendered, so its tiles also re-check `naturalWidth` on mount: an image that fails while the HTML is still parsing errors before React can attach `onError`.

**Padre Pio and the Tungkong Mangga camp have no photo.** That's why the grid is built the way it is. Adding one to either spot needs nothing but a `src` in its `images` array.

Setting a spot's optional `pano360` field to an equirectangular panorama URL adds a **360°** button to its photo panel, rendered with [Pannellum](https://pannellum.org). No spot has a real panorama yet — shoot one with any 360 camera or a panorama app, host the JPEG (e.g. in `public/`), and set the field.

## Offline / installable

The app is installable (web app manifest + icons in `app/manifest.js`, `app/icon.js`, `app/apple-icon.js`) and registers a service worker (`public/sw.js`) **in production builds only** — it's intentionally skipped in `next dev` so it can't cache stale dev chunks and fight Turbopack's HMR.

The service worker has no build-time precache list (Next's hashed filenames aren't known ahead of time without a bundler plugin), so it caches opportunistically: the app shell + `/_next/static/*` on first visit, and map tiles / photos via stale-while-revalidate as they're viewed. Photos are matched as same-origin `/_next/image` requests, since `next/image` proxies them through the optimizer — matching `upload.wikimedia.org` alone would cache nothing and break offline photos silently. That hostname rule is still there for the 360° panoramas, which Pannellum fetches itself. Practically: open the app once with signal (e.g. before heading out), and it keeps working — map, pins, and any photos already viewed — at low-signal spots like Mt. Balagbag or Kaytitinga Falls. First-ever visit still needs a network.

`InstallPrompt` (mounted in `app/layout.js`) shows a small dismissible banner: a real **Install** button on Chrome/Android (via `beforeinstallprompt`), or manual "Share → Add to Home Screen" instructions on iOS Safari, which has no install API. It stays hidden once dismissed (`localStorage`) or if already running standalone.

## Planned for later (v2+)

- **QR code generation** per spot (deep links already work)
- Bilingual (English/Filipino) toggle
- Scan analytics

## Map attribution

Tiles by [CARTO](https://carto.com/attributions), data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
