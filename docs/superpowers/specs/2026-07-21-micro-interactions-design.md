# Micro-Interactions Design

**Date:** 2026-07-21
**Status:** Approved

## Goal

Make the app feel noticeably more alive and enjoyable to use, without changing
its information architecture or the Field Guide Editorial visual identity
(warm paper/ink, category colors, mono/display type). Every control currently
does the functionally-correct thing with the minimum motion required (a color
swap, a fade); this pass adds tactile, characterful feedback throughout —
buttons that feel pressed, toggles that slide, photos that zoom from where
they were tapped — while staying tasteful enough for a city tourism guide,
not a game.

## Non-goals

- No sound effects (no audio infra in the app today; also an accessibility
  concern for a public tourism tool).
- No custom cursor (accessibility/perf risk for low payoff).
- No new features, routes, or content — this is a pass over existing
  interactions only.
- No change to the underlying interaction model (what's clickable, what
  opens what) — only how it *feels* to click it.

## Approach

The codebase already draws a line between two animation systems, and this
design keeps that line rather than introducing a third:

- **CSS keyframes/transitions** for simple, stateless, discrete-state
  feedback (the existing pin drop/pulse, tooltip fade, `rise-in` — see
  `app/globals.css`).
- **Motion (`motion/react`)** for anything with real shared-layout behavior,
  gesture tracking, or a mount/unmount exit (the existing `SpotModal`
  open/close, its `AnimatePresence`).

New work follows the same split: a hover/press feedback utility and simple
keyframes go in CSS; the segmented-toggle slide, the count-up stats, the QR
tilt, and the shared-element photo zoom go through Motion, because each of
those needs either gesture tracking, a value that animates over time, or a
FLIP-style transition between two different DOM positions.

Every new animation respects reduced motion the same way the existing ones
do: CSS additions get a `@media (prefers-reduced-motion: reduce)` override
in `globals.css` (matching the existing block at the bottom of that file);
Motion additions rely on the page-level `<MotionConfig reducedMotion="user">`
that already wraps `app/page.tsx` and `SpotModal`, or check
`window.matchMedia("(prefers-reduced-motion: reduce)")` directly where the
effect isn't a Motion animation (the QR tilt, the count-up).

## Areas of change

### 1. Buttons & toggles

**Tactile press, everywhere.** `PILL_BUTTON_BASE` (`lib/styles.ts`) — used by
`CategoryFilter` chips and `NearMeToggle` — gains a small hover lift and an
`:active` press-down via a new shared CSS utility class (`.tactile` or
folded directly into the existing constant): scale up slightly on hover,
scale down on press, with a quick spring-feeling easing
(`cubic-bezier(0.34, 1.56, 0.64, 1)`, the same curve already used for the
marker's selected-pop transition). The modal's close/back icon buttons and
the lightbox's close/prev/next buttons get the same treatment for
consistency — every clickable circle or pill in the app presses the same way.

**Category chips get a select-pop.** On the frame a chip becomes active, it
gets a brief scale overshoot (100% → 108% → 100%) via a CSS animation class
toggled on the active chip, echoing the marker's own selected-pop so the
chip and the pins it filters feel like the same design language.

**Segmented toggles slide instead of snapping.** `SegmentedToggle` (shared by
`ThemeToggle` and `LocaleToggle`) currently swaps `bg-ink`/`text-paper`
instantly between options. It gets a `motion.div` "highlight" element
positioned behind the active option's label, driven by Motion's `layoutId`
shared-layout animation — switching Light→Dark or EN→TL visibly slides the
highlight across rather than jumping.

*Implementation note:* both `ThemeToggle` and `LocaleToggle` are mounted
**twice simultaneously** in the page header (one copy shown on mobile via
`sm:hidden`, one on desktop via `hidden sm:flex` — see `app/page.tsx`). A
literal shared `layoutId` string would collide between those two
simultaneously-rendered copies. `SegmentedToggle` must generate a
per-instance-unique id (via React's `useId()`) and scope the `layoutId` to
it, so the mobile and desktop copies each animate independently.

**Near Me gets a success bloom.** The moment a location lock succeeds (the
existing `userLocation` state in `app/page.tsx` transitions from `null` to
set), the button gets a one-shot pulse ring — the same visual language as
the map's `.spot-marker-pulse` keyframe, reused as a new `.locate-pulse`
class — so finding yourself on the map feels like a small event, not a
silent state change.

### 2. Map & pins

- **Pin hover wiggle.** Pins are raw HTML (`markerIcon()` in `SpotMap.tsx`
  builds a `divIcon` via `renderToStaticMarkup`), so this is CSS-only: a
  small `:hover` rotation (±3°) on `.spot-marker__dot`, layered onto the
  existing transition already declared there, giving a pin a little life
  before it's clicked.
- **Zoom controls get the tactile press** from Leaflet's own `.leaflet-bar a`
  buttons, matching the rest of the app's buttons (small hover/press scale
  added to the existing rule in `globals.css`).
- **Barangay hover is explicitly out of scope.** `BarangayLayer` sets
  `interactive={false}` on every polygon on purpose — the code comment notes
  that letting a barangay capture pointer events risks swallowing clicks
  meant for a pin underneath. Adding a hover effect would mean reversing
  that tradeoff for a cosmetic gain; not worth it here.

### 3. Spot modal & photos

- **Thumbnail hover/press.** `SpotPhotoStrip`'s `THUMB` buttons get the same
  tactile hover lift + press scale as the rest of the app's buttons.
- **Shared-element photo zoom.** This is the centerpiece of the pass. Today,
  `PhotoLightbox` opens as a plain fade (`.overlay-fade-in`) unrelated to
  where the photo was on screen. Instead, the photo's container — in both
  `SpotHero` (the big photo) and `SpotPhotoStrip` (each thumbnail) — is
  wrapped in a `motion.div` sharing a `layoutId` keyed by the image's `src`.
  `PhotoLightbox`'s image container uses the same `layoutId` for the photo
  currently showing. Because the thumbnail strip and hero stay mounted
  behind the lightbox (it's a fixed overlay, not a route change), Motion can
  FLIP-animate the photo growing from wherever it was tapped into its
  full-screen position, and shrink back on close. Stepping to the next/prev
  photo inside the lightbox crossfades between two `layoutId`s rather than
  re-running the open animation.
- **360° entry flourish.** Switching into the panorama (`SpotHero`'s
  `panoOpen` branch) gets a brief scale/opacity entrance on the viewer
  container, so the transition into "look-around mode" reads as a deliberate
  shift rather than an instant content swap.

### 4. Home top bar

- **QR card tilt.** On desktop/pointer-capable viewports only
  (`matchMedia("(hover: hover) and (pointer: fine)")`), the QR card in
  `HomeTopBar` tracks the pointer and applies a subtle 3D tilt
  (`rotateX`/`rotateY`, a few degrees max) via Motion's `useMotionValue` +
  `useTransform`, giving it a "physical card catching the light" feel. Skips
  entirely on touch and under reduced motion — it's a hover-only flourish,
  never a functional requirement.
- **Stat count-up.** The four stat values in `HomeTopBar` (destination count,
  category count, `360°`, `100%`) animate from 0 up to their final value
  once on mount, using Motion's `useSpring`/`animate` on a numeric motion
  value formatted back into each tile's display string (`"{n}"`,
  `"{n}°"`, `"{n}%"`). Under reduced motion, or if JS hasn't hydrated yet,
  the final value renders immediately — this is a first-impression flourish,
  not information that should ever be allowed to look broken.

## Testing

No test framework in this repo (confirmed by the existing `verify` skill) —
verification is `npm run build`/`npm run lint` plus a Playwright pass against
system Chrome: confirm each new interaction fires (hover/press states,
segmented-toggle slide, chip pop, locate pulse, marker wiggle, shared-element
photo zoom open/close/step, 360° entry, QR tilt gated to pointer-capable
contexts, stat count-up), and confirm a `reducedMotion: "reduce"` Playwright
context collapses every new animation to its resting/final state with no
lingering transform.

## Open risks / decisions carried into the plan

- The shared-element photo zoom is the most technically involved piece
  (three components coordinating one `layoutId` scheme) — the implementation
  plan should sequence it as its own task with room to verify the FLIP
  transition actually measures correctly across `next/image`'s `fill` layout
  (wrap the *container* div in `motion.div`, not the `<Image>` itself, matching
  how `SpotModal` already wraps content rather than animating a raw element).
- `SegmentedToggle`'s per-instance `layoutId` (via `useId()`) is a
  correctness requirement, not a nice-to-have — without it the mobile/desktop
  toggle pair will visibly glitch into each other.
