# Micro-Interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every interactive surface in the app feel tactile and characterful — buttons that press, toggles that slide, a pin that wiggles, a QR card that tilts, stats that count up, and a photo that visibly zooms from where it was tapped into the lightbox — without touching the app's information architecture or its Field Guide Editorial visual identity.

**Architecture:** Keeps the split the codebase already draws: CSS keyframes/transitions for simple, stateless, discrete-state feedback (added to `app/globals.css`); Motion (`motion/react`) for anything with gesture tracking, a value that animates over time, or a shared-layout/FLIP transition between two different DOM positions. A new `.tactile` CSS utility gives every pill/icon button in the app the same press feedback. The centerpiece is a shared-layout photo transition between `SpotHero` and `PhotoLightbox`, coordinated via a per-spot Motion `layoutId` that hands off between the two components rather than being claimed by both at once.

**Tech Stack:** Next.js App Router, React 19, Tailwind v4, `motion/react` (already a dependency — confirmed `animate`, `motion`, `useMotionValue`, `useSpring`, `AnimatePresence` are all exported from the installed version).

## Global Constraints

- Every new CSS animation gets a `@media (prefers-reduced-motion: reduce)` override, added to the **existing** consolidated reduced-motion block near the bottom of `app/globals.css` (do not create a second block).
- Every new Motion animation either rides the page-level `<MotionConfig reducedMotion="user">` that already wraps `app/page.tsx` and, through it, `SpotModal`/`SpotDetailCard` (true for anything using `initial`/`animate`/`exit`/`layout`/`layoutId`), or is manually gated by the new `usePrefersReducedMotion()` hook when it drives a value Motion doesn't manage itself (the QR tilt's pointer math, the stat count-up's numeric display).
- No new "featured" data, routes, or content. This plan only changes how existing interactions feel.
- **No test framework exists in this repo** (confirmed by `.claude/skills/verify/SKILL.md`). Every task's verification step is `npm run build` plus a targeted Playwright check against system Chrome, not a unit test suite.
- Design spec: `docs/superpowers/specs/2026-07-21-micro-interactions-design.md`.

### Refinement since the spec

The spec describes the shared-element photo zoom as connecting `SpotHero`, `SpotPhotoStrip`'s thumbnails, and `PhotoLightbox` via a `layoutId` keyed by each image's `src`. Re-reading `components/spot/SpotPhotoStrip.tsx` while writing this plan showed thumbnails are **not** a click target for the lightbox — tapping a thumbnail only calls `media.selectImage(i)`, which changes what the *hero* shows; only the hero's own overlay button calls `media.openLightbox()`. So thumbnails are dropped from the transition (they keep their existing behavior, just gain the same tactile press as every other button), and the hero ↔ lightbox connection uses one **stable per-spot id** (`spot-photo-${spot.id}`) that the two components **hand off** — whichever one is showing owns the id, the other's `layoutId` is `undefined` — rather than both trying to claim the same id from the same image's `src` simultaneously (which Motion does not handle cleanly when both elements are mounted at once, as they are here: the hero stays mounted, dimmed, behind the fixed-position lightbox overlay). Task 7 has the full mechanics.

---

## Playwright setup (used by every task's verification step)

Install once, outside the repo:

```bash
mkdir -p /tmp/pw-scratch && cd /tmp/pw-scratch && npm init -y >/dev/null && npm install playwright-core >/dev/null
```

Start the dev server once, in the background, and leave it running for the whole plan (check first — a dev server may already be running on port 3000; reuse it if so rather than starting a second one):

```bash
cd /path/to/ExploQR && npm run dev -- --port 3010
```

Each task's Playwright check is a small throwaway script run with `node /tmp/pw-scratch/check.js`, launching `chromium.launch({ channel: "chrome", headless: true })` against the running dev server.

---

### Task 1: Tactile press feedback, everywhere

**Files:**
- Modify: `app/globals.css`
- Modify: `lib/styles.ts`
- Modify: `components/controls/SegmentedToggle.tsx`
- Modify: `components/spot/SpotModal.tsx`
- Modify: `components/spot/PhotoLightbox.tsx`
- Modify: `components/spot/SpotPhotoStrip.tsx`

**Interfaces:**
- Produces: a `.tactile` CSS class (defined in `app/globals.css`) that every later task's new buttons should also use.

- [ ] **Step 1: Add the `.tactile` utility to `app/globals.css`**

Find the `.no-scrollbar` rule block:

```css
.no-scrollbar {
  scrollbar-width: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
```

Insert this new block immediately after it (before the `/* Leaflet chrome, tuned to the page */` comment):

```css

/* Shared press feedback for clickable pills/icon buttons across the app —
   PILL_BUTTON_BASE (lib/styles.ts), the segmented toggles, the spot
   modal's close/back buttons, the photo lightbox's controls, and the
   photo strip thumbnails all opt in via this one class, so a press always
   feels the same everywhere rather than just swapping color. */
.tactile {
  transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.tactile:hover {
  transform: scale(1.04);
}
.tactile:active {
  transform: scale(0.94);
}
```

- [ ] **Step 2: Give Leaflet's zoom buttons the same press feedback**

Find the existing Leaflet zoom-button rules:

```css
.leaflet-bar a,
.leaflet-bar a:hover {
  background: var(--surface);
  color: var(--ink);
  border-bottom-color: var(--line);
}
.leaflet-bar a:hover {
  background: color-mix(in srgb, var(--ink) 8%, var(--surface));
}
.leaflet-bar a.leaflet-disabled {
  background: color-mix(in srgb, var(--ink) 4%, var(--surface));
  color: color-mix(in srgb, var(--ink) 35%, transparent);
}
```

Insert this immediately after that block:

```css
.leaflet-bar a:not(.leaflet-disabled) {
  transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.leaflet-bar a:not(.leaflet-disabled):hover {
  transform: scale(1.08);
}
.leaflet-bar a:not(.leaflet-disabled):active {
  transform: scale(0.92);
}
```

- [ ] **Step 3: Cover both new rules under reduced motion**

Find the existing consolidated block:

```css
@media (prefers-reduced-motion: reduce) {
  .rise-in {
    animation: none;
  }
  .spot-marker__drop {
    animation: none;
  }
  .spot-marker__dot {
    transition: none;
  }
  .spot-marker-pulse,
  .spot-marker--selected .spot-marker-pulse {
    display: none;
    animation: none;
  }
  .leaflet-tooltip.spot-tooltip,
  .leaflet-tooltip.spot-tooltip > * {
    animation: none;
  }
}
```

Add these two rules inside it, just before the closing `}`:

```css
  .tactile,
  .tactile:hover,
  .tactile:active {
    transform: none;
  }
  .leaflet-bar a {
    transform: none;
  }
```

- [ ] **Step 4: Apply `.tactile` to `PILL_BUTTON_BASE`**

In `lib/styles.ts`, change:

```ts
export const PILL_BUTTON_BASE =
  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 font-mono text-xs tracking-tight transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
```

to:

```ts
export const PILL_BUTTON_BASE =
  "tactile inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 font-mono text-xs tracking-tight transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
```

This covers `CategoryFilter`'s chips and `NearMeToggle` — both already build their className from this constant.

- [ ] **Step 5: Apply `.tactile` to `SegmentedToggle`'s option buttons**

In `components/controls/SegmentedToggle.tsx`, change:

```tsx
            className={`${optionClassName} transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink ${
              isActive ? "bg-ink text-paper" : "bg-transparent text-ink/70 hover:text-ink"
            }`}
```

to:

```tsx
            className={`tactile ${optionClassName} transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink ${
              isActive ? "bg-ink text-paper" : "bg-transparent text-ink/70 hover:text-ink"
            }`}
```

(Task 3 replaces this file's background/highlight logic further — this step only adds the press feedback now.)

- [ ] **Step 6: Apply `.tactile` to `SpotModal`'s back and close buttons**

In `components/spot/SpotModal.tsx`, change the mobile back button's className from:

```tsx
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
```

to:

```tsx
                className="tactile flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
```

and the desktop close button's className from:

```tsx
              className="absolute right-3 top-3 z-10 hidden h-8 w-8 items-center justify-center rounded-full bg-scrim/80 text-white backdrop-blur-sm transition-colors hover:bg-scrim/95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:flex"
```

to:

```tsx
              className="tactile absolute right-3 top-3 z-10 hidden h-8 w-8 items-center justify-center rounded-full bg-scrim/80 text-white backdrop-blur-sm transition-colors hover:bg-scrim/95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:flex"
```

- [ ] **Step 7: Apply `.tactile` to `PhotoLightbox`'s close/prev/next buttons**

In `components/spot/PhotoLightbox.tsx`, prepend `tactile ` to the className of all three buttons:

Close button — from `className="absolute right-4 top-4 ..."` to `className="tactile absolute right-4 top-4 ..."` (keep everything else in the string unchanged).

Prev button — from `className="absolute left-2 top-1/2 ..."` to `className="tactile absolute left-2 top-1/2 ..."`.

Next button — from `className="absolute right-2 top-1/2 ..."` to `className="tactile absolute right-2 top-1/2 ..."`.

- [ ] **Step 8: Apply `.tactile` to `SpotPhotoStrip`'s thumbnails**

In `components/spot/SpotPhotoStrip.tsx`, change:

```ts
const THUMB =
  "h-11 w-14 shrink-0 overflow-hidden rounded-lg border transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
```

to:

```ts
const THUMB =
  "tactile h-11 w-14 shrink-0 overflow-hidden rounded-lg border transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
```

- [ ] **Step 9: Verify**

```bash
npm run build
```

Expected: build succeeds with no new errors.

Playwright check (`/tmp/pw-scratch/check.js`) against `http://localhost:3010/`:

```js
const { chromium } = require("playwright-core");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto("http://localhost:3010/");

  const chip = page.locator("nav[aria-label='Filter spots by category'] button").first();
  await chip.hover();
  const hoverTransform = await chip.evaluate((el) => getComputedStyle(el).transform);
  console.log("chip hover transform (expect non-none):", hoverTransform);

  await browser.close();
})();
```

Expected: `hoverTransform` is a `matrix(...)` string, not `"none"`.

- [ ] **Step 10: Commit**

```bash
git add app/globals.css lib/styles.ts components/controls/SegmentedToggle.tsx components/spot/SpotModal.tsx components/spot/PhotoLightbox.tsx components/spot/SpotPhotoStrip.tsx
git commit -m "Add tactile press feedback to every button in the app"
```

---

### Task 2: Category chip select-pop

**Files:**
- Modify: `app/globals.css`
- Modify: `components/controls/CategoryFilter.tsx`

**Interfaces:**
- Consumes: nothing from Task 1's code (independent CSS addition).

- [ ] **Step 1: Add the keyframe to `app/globals.css`**

Insert this immediately after the `.tactile:active { transform: scale(0.94); }` rule added in Task 1:

```css
@keyframes chip-select-pop {
  45% {
    transform: scale(1.08);
  }
}
.chip-select-pop {
  animation: chip-select-pop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

- [ ] **Step 2: Cover it under reduced motion**

Add this line to the same consolidated reduced-motion block from Task 1 Step 3, just before its closing `}`:

```css
  .chip-select-pop {
    animation: none;
  }
```

- [ ] **Step 3: Apply the class to the active chip**

In `components/controls/CategoryFilter.tsx`, change:

```tsx
              className={`${PILL_BUTTON_BASE} ${
                isActive
                  ? chip.block
                    ? ""
                    : "border-ink bg-ink text-paper"
                  : PILL_BUTTON_INACTIVE
              }`}
```

to:

```tsx
              className={`${PILL_BUTTON_BASE} ${isActive ? "chip-select-pop" : ""} ${
                isActive
                  ? chip.block
                    ? ""
                    : "border-ink bg-ink text-paper"
                  : PILL_BUTTON_INACTIVE
              }`}
```

- [ ] **Step 4: Verify**

```bash
npm run build
```

Expected: succeeds.

Playwright check: click an inactive category chip, then read its `className` — confirm it now contains `chip-select-pop`.

```js
const { chromium } = require("playwright-core");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto("http://localhost:3010/");

  const natureChip = page.getByRole("button", { name: /Nature/ });
  await natureChip.click();
  const cls = await natureChip.getAttribute("class");
  console.log("has chip-select-pop:", cls.includes("chip-select-pop"));

  await browser.close();
})();
```

Expected: `true`.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css components/controls/CategoryFilter.tsx
git commit -m "Give the active category chip a select-pop"
```

---

### Task 3: Segmented toggle sliding highlight

**Files:**
- Modify: `components/controls/SegmentedToggle.tsx`

**Interfaces:**
- Consumes: `.tactile` class (Task 1), already applied to this file's option buttons.
- Produces: no change to `SegmentedToggle`'s exported props — `ThemeToggle` and `LocaleToggle` need no changes.

- [ ] **Step 1: Replace the file with the sliding-highlight version**

Replace the full contents of `components/controls/SegmentedToggle.tsx` with:

```tsx
"use client";

import { useId, type ReactNode } from "react";
import { motion } from "motion/react";

interface SegmentedToggleOption<T extends string> {
  value: T;
  title?: string;
  content: ReactNode;
}

interface SegmentedToggleProps<T extends string> {
  ariaLabel: string;
  options: SegmentedToggleOption<T>[];
  activeValue: T;
  onChange: (value: T) => void;
  optionClassName: string;
}

// Shared "segmented control" shell for LocaleToggle and ThemeToggle: a
// rounded-full border grouping buttons, with a sliding highlight (a single
// motion.span sharing a layoutId across options) tracking whichever one is
// active, instead of each button just swapping its own background color.
//
// `useId()` scopes the layoutId to this component *instance*: both
// ThemeToggle and LocaleToggle are mounted twice at once in the page header
// (one copy shown on mobile, one on desktop, toggled via Tailwind
// responsive classes rather than unmounting) — a literal shared string
// would make Motion try to animate the highlight between those two
// simultaneously-visible copies.
export default function SegmentedToggle<T extends string>({
  ariaLabel,
  options,
  activeValue,
  onChange,
  optionClassName,
}: SegmentedToggleProps<T>) {
  const uid = useId();

  return (
    <div
      className="inline-flex shrink-0 overflow-hidden rounded-full border border-line"
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const isActive = option.value === activeValue;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            title={option.title}
            className={`tactile relative ${optionClassName} transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink ${
              isActive ? "text-paper" : "text-ink/70 hover:text-ink"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId={`segmented-highlight-${uid}`}
                className="absolute inset-0 z-0 bg-ink"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1">
              {option.content}
            </span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npm run build
```

Expected: succeeds — this is a generic component, so a type error here would show up against both `ThemeToggle` and `LocaleToggle`'s call sites.

Playwright check: switch the theme toggle from one option to another and confirm exactly one `motion.span` highlight exists at a time (no leftover duplicate) and it sits behind the active button's label.

```js
const { chromium } = require("playwright-core");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto("http://localhost:3010/");

  const group = page.getByRole("group", { name: /Theme/i });
  await group.getByRole("button").nth(2).click(); // dark
  await page.waitForTimeout(300);
  const highlights = await group.locator("span.bg-ink").count();
  console.log("highlight count (expect 1):", highlights);

  await browser.close();
})();
```

Expected: `1`.

- [ ] **Step 3: Commit**

```bash
git add components/controls/SegmentedToggle.tsx
git commit -m "Slide the segmented toggle's highlight instead of snapping it"
```

---

### Task 4: Near Me success bloom

**Files:**
- Modify: `app/globals.css`
- Modify: `components/controls/NearMeToggle.tsx`

**Interfaces:**
- Consumes: `PILL_BUTTON_BASE`/`PILL_BUTTON_ACTIVE`/`PILL_BUTTON_INACTIVE` from `lib/styles.ts` (unchanged from Task 1 — `.tactile` already flows through `PILL_BUTTON_BASE`).

- [ ] **Step 1: Add the `.locate-pulse` rule to `app/globals.css`**

Insert this immediately after the `@keyframes marker-pulse { ... }` block (before the `@media (prefers-reduced-motion: reduce)` block that follows it):

```css
/* One-shot celebratory ring for Near Me's successful location lock — same
   visual language as the map's own selected-pin pulse (.spot-marker-pulse),
   reused here because "you've been found" deserves the same small
   flourish. Runs once per lock: NearMeToggle gives the element a fresh
   `key` on each false→true transition, which replays the animation on
   mount rather than looping. */
.locate-pulse {
  position: absolute;
  inset: -6px;
  border-radius: 9999px;
  border: 2px solid currentColor;
  pointer-events: none;
  animation: marker-pulse 0.9s ease-out 1;
}
```

- [ ] **Step 2: Cover it under reduced motion**

Add this to the consolidated reduced-motion block, just before its closing `}`:

```css
  .locate-pulse {
    display: none;
  }
```

- [ ] **Step 3: Replace `components/controls/NearMeToggle.tsx`**

Replace the full file with:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, Loader2 } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import {
  PILL_BUTTON_ACTIVE,
  PILL_BUTTON_BASE,
  PILL_BUTTON_INACTIVE,
} from "@/lib/styles";
import { useLocale } from "@/components/providers/LocaleProvider";

interface NearMeToggleProps {
  active: boolean;
  loading: boolean;
  error: string | null;
  onClick: () => void;
}

// Pill button matching the category chips: idle/active/loading states,
// plus an inline error line (e.g. permission denied) when geolocation fails.
export default function NearMeToggle({ active, loading, error, onClick }: NearMeToggleProps) {
  const { t } = useLocale();
  const wasActive = useRef(active);
  const [burst, setBurst] = useState(0);

  // Fires once per successful location lock (false→true) — not on every
  // re-render while `active` stays true, and not on mount if `active` ever
  // started out true.
  useEffect(() => {
    if (active && !wasActive.current) setBurst((n) => n + 1);
    wasActive.current = active;
  }, [active]);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        aria-pressed={active}
        className={`relative ${PILL_BUTTON_BASE} disabled:opacity-60 ${
          active ? PILL_BUTTON_ACTIVE : PILL_BUTTON_INACTIVE
        }`}
      >
        {burst > 0 && (
          <span
            key={burst}
            aria-hidden="true"
            className="locate-pulse"
            style={{ color: CATEGORIES.nature.fill }}
          />
        )}
        {loading ? (
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
        ) : (
          <LocateFixed size={14} aria-hidden="true" />
        )}
        {loading ? t("nearme.loading") : t("nearme.idle")}
      </button>
      {error && (
        <p
          className="max-w-[220px] text-right font-mono text-[11px] leading-snug"
          style={{ color: CATEGORIES.leisure.accent }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify**

```bash
npm run build
```

Expected: succeeds.

Playwright check (grant geolocation permission at context creation, matching this repo's existing convention for testing Near Me):

```js
const { chromium } = require("playwright-core");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    geolocation: { latitude: 14.8397, longitude: 121.0564 },
    permissions: ["geolocation"],
  });
  const page = await context.newPage();
  await page.goto("http://localhost:3010/");

  await page.getByRole("button", { name: /Near me/i }).click();
  await page.waitForTimeout(200);
  const pulseCount = await page.locator(".locate-pulse").count();
  console.log("locate-pulse present after lock:", pulseCount);

  await browser.close();
})();
```

Expected: `1`.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css components/controls/NearMeToggle.tsx
git commit -m "Give Near Me a one-shot success pulse on location lock"
```

---

### Task 5: Map pin hover wiggle

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- None — pure CSS, no component changes. Pins are raw HTML built by `markerIcon()` in `components/spot/SpotMap.tsx`, already carrying the `.spot-marker__dot` class this targets.

- [ ] **Step 1: Add the hover rule**

Find:

```css
.spot-marker--selected .spot-marker__dot {
  transform: scale(1.18);
  box-shadow: 0 0 0 3px var(--surface),
    0 0 0 6px color-mix(in srgb, currentColor 40%, transparent),
    0 6px 14px rgba(0, 0, 0, 0.35);
}
```

Insert immediately after it:

```css
/* A little life before the click: pins rock slightly on hover. Written as
   full transform values per state (not a bare rotate() layered on top),
   because `transform` doesn't compose across rules — the selected state's
   scale and the hover rotation each need their combined value spelled
   out. */
.spot-marker__dot:hover {
  transform: rotate(-3deg);
}
.spot-marker--selected .spot-marker__dot:hover {
  transform: scale(1.18) rotate(-3deg);
}
```

- [ ] **Step 2: Cover it under reduced motion**

Add to the consolidated reduced-motion block, just before its closing `}`:

```css
  .spot-marker__dot:hover {
    transform: none;
  }
  .spot-marker--selected .spot-marker__dot:hover {
    transform: scale(1.18);
  }
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

Expected: succeeds (this task touches no `.tsx`, so this mainly confirms the CSS file still parses under Tailwind's build).

Playwright check:

```js
const { chromium } = require("playwright-core");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto("http://localhost:3010/");
  await page.waitForTimeout(800); // let markers finish their drop-in

  const pin = page.locator(".spot-marker__dot").first();
  await pin.hover();
  const transform = await pin.evaluate((el) => getComputedStyle(el).transform);
  console.log("pin hover transform (expect non-none):", transform);

  await browser.close();
})();
```

Expected: a `matrix(...)` string, not `"none"`.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "Give map pins a hover wiggle"
```

---

### Task 6: Home top bar — QR tilt and stat count-up

**Files:**
- Create: `lib/hooks/usePrefersReducedMotion.ts`
- Modify: `components/home/HomeTopBar.tsx`
- Modify: `lib/i18n.ts`

**Interfaces:**
- Produces: `usePrefersReducedMotion(): boolean` from `lib/hooks/usePrefersReducedMotion.ts` — a general-purpose hook any later task could also use.

- [ ] **Step 1: Create `lib/hooks/usePrefersReducedMotion.ts`**

```ts
"use client";

import { useEffect, useState } from "react";

// Mirrors the OS-level "reduce motion" setting the rest of the app already
// respects via `<MotionConfig reducedMotion="user">` — that config only
// covers Motion's own generated animations (variants, layout), so an effect
// driven by a manually-computed value (a pointer-tracked tilt, a count-up)
// needs to check this directly. Same shape as SpotMap's usePrefersDark.
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
```

- [ ] **Step 2: Remove the now-unused `front.stat.tour360.value` and `front.stat.free.value` i18n keys**

The stat strip is about to compute and animate these numbers itself (`360`, `100`) rather than reading a pre-formatted string. In `lib/i18n.ts`, in the `EN_UI` object, remove this line:

```ts
  "front.stat.tour360.value": "360°",
```

and this line:

```ts
  "front.stat.free.value": "100%",
```

(keep `front.stat.tour360.label` and `front.stat.free.label` — those are still used). Do the same in the `TL_UI` object below it (remove its matching `"front.stat.tour360.value"` and `"front.stat.free.value"` lines, keep the `.label` ones).

- [ ] **Step 3: Replace `components/home/HomeTopBar.tsx`**

Replace the full file with:

```tsx
"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { animate, motion, useMotionValue, useSpring } from "motion/react";
import QRCode from "react-qr-code";
import { spots } from "@/data/spots";
import { CATEGORIES } from "@/lib/categories";
import { HEADLINE } from "@/lib/heroWords";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { useLocale } from "@/components/providers/LocaleProvider";

// Counts a number up from 0 to `target` once, on mount — a first-impression
// flourish for the stat strip. Renders the final value immediately (no
// animation) when `enabled` is false, so the numbers never look "stuck" for
// anyone who's asked their OS for less motion.
function useCountUp(target: number, enabled: boolean): number {
  const [display, setDisplay] = useState(enabled ? 0 : target);

  useEffect(() => {
    if (!enabled) {
      setDisplay(target);
      return;
    }
    const controls = animate(0, target, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, enabled]);

  return display;
}

// The pitch, the at-a-glance stats, and the QR code in one compact strip
// above the map — a visitor gets the whole "what is this" in one glance
// instead of scrolling several stacked sections to reach the map itself.
export default function HomeTopBar() {
  const { t } = useLocale();
  const [origin, setOrigin] = useState("");
  const categoryCount = Object.keys(CATEGORIES).length;
  const reducedMotion = usePrefersReducedMotion();
  const destinationsCount = useCountUp(spots.length, !reducedMotion);
  const categoriesCount = useCountUp(categoryCount, !reducedMotion);
  const tourDegrees = useCountUp(360, !reducedMotion);
  const freePercent = useCountUp(100, !reducedMotion);

  // The origin is only knowable in the browser, so the code renders empty
  // until mount — the same trade-off the rest of the app makes for anything
  // that touches `window` (see SpotMap's SSR loading fallback).
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Desktop/pointer-capable only: a touch device has no hover to tilt from,
  // and it's skipped outright under reduced motion.
  const [canTilt, setCanTilt] = useState(false);
  useEffect(() => {
    setCanTilt(
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  const cardRef = useRef<HTMLDivElement>(null);
  const rotateXRaw = useMotionValue(0);
  const rotateYRaw = useMotionValue(0);
  const rotateX = useSpring(rotateXRaw, { stiffness: 300, damping: 20 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 300, damping: 20 });

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!canTilt || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateYRaw.set(px * 10);
    rotateXRaw.set(py * -10);
  }
  function handlePointerLeave() {
    rotateXRaw.set(0);
    rotateYRaw.set(0);
  }

  return (
    <section className="rise-in flex flex-col gap-5 border-b border-line pb-6 pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:pt-8">
      <div className="min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink/70">
          {t("hero.eyebrow")}
        </p>
        <h1 className="mt-1.5 max-w-xl font-display text-[26px] font-extrabold leading-[0.98] tracking-[-0.03em] text-ink sm:text-4xl">
          {HEADLINE.map(({ key, category }, i) => (
            <Fragment key={key}>
              <span
                className="rise-in inline-block whitespace-nowrap"
                style={{
                  color: CATEGORIES[category].accent,
                  animationDelay: `${80 + i * 70}ms`,
                }}
              >
                {t(key)}
              </span>{" "}
            </Fragment>
          ))}
        </h1>
        <p
          className="rise-in mt-2.5 max-w-md text-sm leading-relaxed text-ink/80"
          style={{ animationDelay: "300ms" }}
        >
          {t("front.hero.body", { count: spots.length })}
        </p>
        <div
          className="rise-in mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-ink/70"
          style={{ animationDelay: "360ms" }}
        >
          <span>
            <strong className="text-ink">{destinationsCount}</strong> {t("front.stat.destinations")}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            <strong className="text-ink">{categoriesCount}</strong> {t("front.stat.categories")}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            <strong className="text-ink">{tourDegrees}°</strong> {t("front.stat.tour360.label")}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            <strong className="text-ink">{freePercent}%</strong> {t("front.stat.free.label")}
          </span>
        </div>
      </div>

      <div className="rise-in" style={{ animationDelay: "420ms" }}>
        <motion.div
          ref={cardRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          style={{ rotateX, rotateY, transformPerspective: 600 }}
          className="flex shrink-0 items-center gap-3 rounded-xl border border-line bg-surface p-3"
        >
          <div className="rounded-lg border border-line bg-white p-2">
            {/* The QR itself stays literal black-on-white regardless of
                theme — unlike `ink`/`paper`, which invert, a scanner needs
                maximum, reliable contrast. Same reasoning as `--scrim` and
                the category `block` tokens in globals.css: some things are
                theme-constant on purpose. */}
            {origin && (
              <QRCode value={origin} size={84} bgColor="#ffffff" fgColor="#1c2321" />
            )}
          </div>
          <div className="max-w-[9rem]">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink/70">
              {t("front.qr.eyebrow")}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink/80">
              {t("front.qr.body")}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

Note the tilt (`motion.div` with `rotateX`/`rotateY`) is nested *inside* a plain `<div className="rise-in">`, not applied to the same element as the `rise-in` entrance animation — `rise-in` is a CSS keyframe that also writes to `transform`, and layering it on the same element as Motion's own continuous `style.transform` writes would fight over the property during the entrance. Splitting them onto two nested elements avoids that entirely.

- [ ] **Step 4: Verify**

```bash
npm run build
```

Expected: succeeds.

Playwright check — count-up reaches the right final value, and tilt only activates on a pointer-capable viewport:

```js
const { chromium } = require("playwright-core");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  // Desktop: count-up settles at 13, tilt responds to pointer move.
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto("http://localhost:3010/");
    await page.waitForTimeout(1200);
    const text = await page.locator("main").innerText();
    console.log("destinations count settled (expect 13 present):", text.includes("13"));

    // The QR eyebrow <p> is two levels below the tilting motion.div (its
    // parent is the text column div, whose parent is the tilt target).
    const card = page.getByText(/Scan to Explore/i).locator("..").locator("..");
    const before = await card.evaluate((el) => getComputedStyle(el).transform);
    const box = await card.boundingBox();
    await page.mouse.move(box.x + 5, box.y + 5);
    await page.waitForTimeout(300);
    const after = await card.evaluate((el) => getComputedStyle(el).transform);
    console.log("QR tilt responded to pointer (expect before !== after):", before !== after);
  }

  // Reduced motion: count-up renders final value immediately, no mid-animation read needed.
  {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("http://localhost:3010/");
    await page.waitForTimeout(50);
    const text = await page.locator("main").innerText();
    console.log("reduced-motion destinations count immediate (expect 13 present):", text.includes("13"));
  }

  await browser.close();
})();
```

Expected: both `true`. (The QR card locator above is intentionally loose — if it doesn't resolve, locate the card via `page.getByText(/Scan to Explore/i).locator("..").locator("..")` instead and confirm `getComputedStyle` on it reports a non-default `transform` after a `mouse.move` over its bounding box on the desktop viewport only.)

- [ ] **Step 5: Commit**

```bash
git add lib/hooks/usePrefersReducedMotion.ts components/home/HomeTopBar.tsx lib/i18n.ts
git commit -m "Animate the home top bar's stats and tilt the QR card"
```

---

### Task 7: Spot hero & lightbox — shared-element zoom and 360° entry flourish

**Files:**
- Modify: `app/globals.css`
- Modify: `components/spot/SpotHero.tsx`
- Modify: `components/spot/PhotoLightbox.tsx`
- Modify: `components/spot/SpotDetailCard.tsx`

**Interfaces:**
- Consumes: `.tactile` (Task 1, already applied to `PhotoLightbox`'s three buttons).
- Produces: `PhotoLightbox` now requires a `spotId: string` prop — `SpotDetailCard` is the only caller and is updated in this same task.

This is the most technically involved task in the plan — see "Refinement since the spec" above for why the mechanism is a stable per-spot id handed off between components, not a `src`-keyed id shared by three components at once.

- [ ] **Step 1: Remove the now-unused `.overlay-fade-in` CSS**

`PhotoLightbox` is about to animate through Motion instead. Find this section in `app/globals.css`:

```css
/* Spot modal + photo lightbox */
.overlay-fade-in {
  animation: overlay-fade-in 0.18s ease-out;
}

@keyframes overlay-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* The spot modal's own open/close animation now lives in SpotModal.js via
   Motion's AnimatePresence (it needed a real *exit*, which CSS can't drive on
   unmount). Only the shared .overlay-fade-in below remains — the photo
   lightbox still uses it. */
@media (prefers-reduced-motion: reduce) {
  .overlay-fade-in {
    animation: none;
  }
}
```

Replace it with just this comment (no rule left to write — both overlays now animate through Motion):

```css
/* The spot modal's and photo lightbox's open/close animations both live in
   their own components now (SpotModal.tsx, PhotoLightbox.tsx) via Motion's
   AnimatePresence. */
```

- [ ] **Step 2: Replace `components/spot/SpotHero.tsx`**

Replace the full file with:

```tsx
"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { ImageOff, LocateFixed, MapPin, Minimize2, ZoomIn } from "lucide-react";
import { CATEGORIES, spotIcon, barangayLabel } from "@/lib/categories";
import { formatDistance } from "@/lib/geo";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { SpotMediaState } from "@/lib/hooks/useSpotMedia";
import type { Spot } from "@/lib/types";

// Pannellum needs the browser; only load the viewer when a 360° is opened.
const Pano360Viewer = dynamic(() => import("@/components/spot/Pano360Viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-ink/4 font-mono text-xs text-ink/70">
      Loading 360°…
    </div>
  ),
});

interface SpotHeroProps {
  spot: Spot;
  media: SpotMediaState;
  titleId?: string;
  distanceKm?: number;
}

// The banner that opens the detail panel, and the panel's main media surface:
// it shows whatever the thumbnail strip has selected, and becomes the live
// 360° viewer in place when a panorama is entered.
//
// Outside 360° mode it is deliberately a *still*. The title, the category
// pill, and the modal's close button all sit on top of this, and drag-to-look
// on a live Pannellum canvas would fight all three — so entering the panorama
// hides the overlay instead of layering over it.
export default function SpotHero({ spot, media, titleId, distanceKm }: SpotHeroProps) {
  const { t, text } = useLocale();
  const cat = CATEGORIES[spot.category];
  const Icon = spotIcon(spot);
  const {
    images,
    hasPano,
    isEmpty,
    active,
    panoOpen,
    failedMap,
    markFailed,
    checkOnMount,
  } = media;

  // The panorama doubles as its own cover art, the same way it leads the
  // thumbnail strip. Its equirectangular framing crops oddly, but it is the
  // truest single image of a spot we have.
  const stillSrc = active === "pano" ? spot.pano360 : images[active]?.src;
  const failed = Boolean(stillSrc && failedMap[stillSrc]);
  const showStill = Boolean(stillSrc) && !failed;
  const photoIndex = active === "pano" ? null : active;

  // The still photo and PhotoLightbox's photo share this id so Motion can
  // FLIP the photo between them. Exactly one of the two ever claims it:
  // this hero holds it while the lightbox is closed, and hands it off
  // (sets its own layoutId to undefined) the instant the lightbox opens —
  // see PhotoLightbox for the other half of the hand-off.
  const photoLayoutId = `spot-photo-${spot.id}`;

  return (
    <div className="relative h-47.5 shrink-0 overflow-hidden bg-ink/4">
      {panoOpen && hasPano ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <Pano360Viewer src={spot.pano360!} title={text(spot.name)} />
          <button
            type="button"
            onClick={media.closePano}
            aria-label={t("media.exit360")}
            className="tactile absolute left-3 top-3 z-3 flex h-8 w-8 items-center justify-center rounded-full bg-scrim/80 text-white backdrop-blur-sm transition-colors hover:bg-scrim/95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Minimize2 size={15} aria-hidden="true" />
          </button>
        </motion.div>
      ) : showStill ? (
        <motion.div
          layoutId={media.lightboxOpen ? undefined : photoLayoutId}
          className="absolute inset-0"
        >
          <Image
            src={stillSrc!}
            alt={
              photoIndex == null
                ? t("media.panoLabel", { name: text(spot.name) })
                : t("media.alt", {
                    name: text(spot.name),
                    index: photoIndex + 1,
                    total: images.length,
                  })
            }
            fill
            sizes="(min-width: 640px) 42rem, 100vw"
            loading="eager"
            ref={checkOnMount(stillSrc!)}
            onError={() => markFailed(stillSrc!)}
            className="object-cover"
          />
        </motion.div>
      ) : failed ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink/70">
          <ImageOff size={22} aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-widest">
            {t("media.failed")}
          </span>
        </div>
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ background: cat.tint, color: cat.accent }}
          aria-hidden="true"
        >
          <Icon size={56} strokeWidth={1.5} />
        </div>
      )}

      {!panoOpen && (
        <>
          {/* Keeps the white type legible over whatever the photo happens to be. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-t from-scrim/75 via-scrim/25 to-transparent"
          />
          {!isEmpty && !failed && (
            <button
              type="button"
              onClick={() => (active === "pano" ? media.openPano() : media.openLightbox())}
              aria-label={
                active === "pano"
                  ? t("media.panoLabel", { name: text(spot.name) })
                  : t("media.zoomLabel", {
                      name: text(spot.name),
                      index: (photoIndex ?? 0) + 1,
                      total: images.length,
                    })
              }
              className="group absolute inset-0 z-1 cursor-zoom-in focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
            >
              <span className="pointer-events-none absolute right-3 top-3 flex items-center gap-1 rounded-full bg-scrim/80 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <ZoomIn size={11} aria-hidden="true" />
                {active === "pano" ? "360°" : t("media.zoom")}
              </span>
            </button>
          )}
        </>
      )}

      {/* Sits above the click target so the text never swallows the click. In
          360° mode it stays mounted but hidden — the dialog's aria-labelledby
          points at this heading. */}
      <div
        className={
          panoOpen
            ? "sr-only"
            : "pointer-events-none absolute inset-x-0 bottom-0 z-2 p-5"
        }
      >
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider"
          style={{ background: cat.accent, color: cat.btnFg }}
        >
          <Icon size={12} strokeWidth={2.5} aria-hidden="true" />
          {t(`cat.${spot.category}`)}
        </span>
        <h2
          id={titleId}
          className="mt-2 font-display text-xl font-bold leading-snug text-white sm:text-2xl"
        >
          {text(spot.name)}
        </h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80">
          <span className="flex items-center gap-1">
            <MapPin size={14} aria-hidden="true" />
            {barangayLabel(spot, t)}
          </span>
          {distanceKm != null && (
            <span className="flex items-center gap-1">
              <LocateFixed size={14} aria-hidden="true" />
              {t("spot.distance", { distance: formatDistance(distanceKm) })}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Replace `components/spot/PhotoLightbox.tsx`**

Replace the full file with:

```tsx
"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { X, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { useImageFallback } from "@/lib/hooks/useImageFallback";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { SpotImage } from "@/lib/types";

interface PhotoLightboxProps {
  images: SpotImage[];
  index: number;
  spotId: string;
  spotName: string;
  // Whether the surrounding media set has more than one item to page through.
  // Passed in because the cycle can include a 360° panorama, which isn't part
  // of `images` — so `images.length` alone can't decide if arrows should show.
  navigable: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

// Full-screen zoom for a spot's photos. Body-scroll locking is left to
// SpotModal (the lightbox only ever opens from inside it); this only owns
// its own Escape/arrow-key handling, captured ahead of the modal's Escape
// listener so closing the lightbox doesn't also close the modal underneath.
//
// The photo itself shares a layoutId with SpotHero's still image
// (`spot-photo-${spotId}`) — SpotHero hands the id off the moment this opens
// and reclaims it once this unmounts, so Motion FLIPs the photo between the
// hero's position and full-screen in both directions. SpotDetailCard wraps
// this component in AnimatePresence, which is what gives the closing FLIP
// time to play before the DOM node is actually removed. Stepping prev/next
// keeps that outer box's layoutId fixed and just crossfades the image
// inside it, via the nested AnimatePresence below.
export default function PhotoLightbox({
  images,
  index,
  spotId,
  spotName,
  navigable,
  onClose,
  onPrev,
  onNext,
}: PhotoLightboxProps) {
  const { t } = useLocale();
  const panelRef = useRef<HTMLDivElement>(null);
  const { failed, onError, checkOnMount } = useImageFallback(index);

  useFocusTrap(panelRef, true);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.stopPropagation();
        onPrev();
      } else if (e.key === "ArrowRight") {
        e.stopPropagation();
        onNext();
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose, onPrev, onNext]);

  const img = images[index];
  if (!img) return null;

  return (
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("media.alt", { name: spotName, index: index + 1, total: images.length })}
      tabIndex={-1}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-scrim/95 p-4 outline-none backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t("lightbox.close")}
        className="tactile absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <X size={18} aria-hidden="true" />
      </button>

      {navigable && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label={t("lightbox.prev")}
            className="tactile absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:left-4"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            aria-label={t("lightbox.next")}
            className="tactile absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-4"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </>
      )}

      {failed ? (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-white/30 px-8 py-12 text-white/70"
        >
          <ImageOff size={22} aria-hidden="true" />
          <p className="font-mono text-[11px] uppercase tracking-widest">
            {t("media.failed")}
          </p>
        </div>
      ) : (
        <motion.div
          layoutId={`spot-photo-${spotId}`}
          onClick={(e) => e.stopPropagation()}
          className="relative h-[80vh] w-full max-w-5xl"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={img.src}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <Image
                src={img.src}
                alt={t("media.alt", { name: spotName, index: index + 1, total: images.length })}
                fill
                sizes="100vw"
                priority
                ref={checkOnMount}
                onError={onError}
                className="object-contain drop-shadow-2xl"
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
      {!failed && (
        <p
          onClick={(e) => e.stopPropagation()}
          className="mt-3 font-mono text-[11px] text-white/70"
        >
          {img.credit} · {img.license} · Wikimedia Commons
        </p>
      )}
    </motion.div>
  );
}
```

- [ ] **Step 4: Replace `components/spot/SpotDetailCard.tsx`**

Replace the full file with:

```tsx
"use client";

import { AnimatePresence } from "motion/react";
import SpotHero from "@/components/spot/SpotHero";
import SpotFactGrid from "@/components/spot/SpotFactGrid";
import SpotAmenities from "@/components/spot/SpotAmenities";
import SpotPhotoStrip from "@/components/spot/SpotPhotoStrip";
import SpotActions from "@/components/spot/SpotActions";
import PhotoLightbox from "@/components/spot/PhotoLightbox";
import { useSpotMedia } from "@/lib/hooks/useSpotMedia";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Spot } from "@/lib/types";

interface SpotDetailCardProps {
  spot: Spot;
  titleId?: string;
  distanceKm?: number;
}

// Detail content for a spot, led by the photo: hero, description, the
// practical facts, amenities, the media strip, and what to do next. Rendered
// inside SpotModal, which supplies the surrounding chrome.
//
// The media state lives in a hook rather than in any one section, because the
// hero and the strip that drives it sit at opposite ends of the panel with
// three other sections between them. `distanceKm` is set only when the visitor
// has shared their location.
export default function SpotDetailCard({
  spot,
  titleId,
  distanceKm,
}: SpotDetailCardProps) {
  const { text } = useLocale();
  const media = useSpotMedia(spot);

  return (
    <article className="spot-card">
      <SpotHero
        spot={spot}
        media={media}
        titleId={titleId}
        distanceKm={distanceKm}
      />

      <div className="flex flex-col gap-6 p-5 sm:p-6">
        <p className="max-w-prose text-[15px] leading-relaxed text-ink/80">
          {text(spot.description)}
        </p>

        <SpotFactGrid spot={spot} />
        <SpotAmenities spot={spot} />
        <SpotPhotoStrip spot={spot} media={media} />
        <SpotActions spot={spot} media={media} />
      </div>

      {/* AnimatePresence delays PhotoLightbox's actual unmount until its own
          exit animation finishes — required for the shared-layout photo
          transition (see PhotoLightbox) to FLIP back to the hero on close
          instead of just vanishing. */}
      <AnimatePresence>
        {media.lightboxOpen && media.active !== "pano" && (
          <PhotoLightbox
            key="photo-lightbox"
            images={media.images}
            index={media.active}
            spotId={spot.id}
            spotName={text(spot.name)}
            navigable={media.total > 1}
            onClose={media.closeLightbox}
            onPrev={() => media.step(-1)}
            onNext={() => media.step(1)}
          />
        )}
      </AnimatePresence>
    </article>
  );
}
```

- [ ] **Step 5: Verify**

```bash
npm run build
```

Expected: succeeds — pay attention here, since `spotId` is now a required prop on `PhotoLightbox`; a build failure most likely means a call site was missed (there should be exactly one, in `SpotDetailCard`).

Playwright check — open a spot with multiple photos, open the lightbox, confirm it renders at full-screen size (not the hero's small size), step to the next photo, close it, and confirm the hero is back with no leftover full-screen overlay:

```js
const { chromium } = require("playwright-core");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto("http://localhost:3010/?spot=balagbag"); // adjust id if this one has <2 photos
  await page.waitForTimeout(500);

  await page.locator("[role='dialog'] button", { hasText: "" }).first(); // no-op, ensures modal is up
  const heroZoomButton = page.locator("[role='dialog']").getByRole("button", { name: /Zoom|360/i }).first();
  await heroZoomButton.click();
  await page.waitForTimeout(400);

  const lightbox = page.locator("[role='dialog'][aria-modal='true']").last();
  const box = await lightbox.boundingBox();
  console.log("lightbox fills viewport (expect true):", box.width > 1000 && box.height > 700);

  const next = page.getByRole("button", { name: /Next photo/i });
  if (await next.count()) {
    await next.click();
    await page.waitForTimeout(300);
  }

  await page.getByRole("button", { name: /Close/i }).last().click();
  await page.waitForTimeout(400);
  const stillOpen = await page.locator("[role='dialog'][aria-modal='true']").count();
  console.log("lightbox count after close (expect 1, just the spot modal):", stillOpen);

  await browser.close();
})();
```

Expected: `true`, then `1`.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css components/spot/SpotHero.tsx components/spot/PhotoLightbox.tsx components/spot/SpotDetailCard.tsx
git commit -m "Shared-element zoom for the photo lightbox, and a 360 entry flourish"
```

---

### Task 8: Final verification pass

**Files:**
- None expected — this task only fixes real defects found during verification, in whichever files they're found in.

- [ ] **Step 1: Full build and lint**

```bash
npm run build
npm run lint
```

Expected: build succeeds. Lint may show the same pre-existing `set-state-in-effect` warnings this codebase already has in `SpotMap.tsx`, `useImageFallback.ts`, `usePersistentChoice.ts` (confirmed pre-existing, not a regression) — no *new* categories of lint error should appear.

- [ ] **Step 2: Light/dark screenshot pass**

```js
const { chromium } = require("playwright-core");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  for (const scheme of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: scheme });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto("http://localhost:3010/");
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `/tmp/pw-scratch/home-${scheme}.png` });
    console.log(scheme, "console/page errors:", errors);
    await ctx.close();
  }
  await browser.close();
})();
```

Expected: `errors` empty for both. Visually confirm (open the PNGs) the stat numbers show their final settled values, the QR card renders, and nothing looks broken.

- [ ] **Step 3: Reduced-motion collapse check**

```js
const { chromium } = require("playwright-core");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3010/");
  await page.waitForTimeout(300);

  const chip = page.locator("nav[aria-label='Filter spots by category'] button").first();
  const chipTransform = await chip.evaluate((el) => getComputedStyle(el).transform);
  console.log("chip transform under reduced motion (expect none):", chipTransform);

  const text = await page.locator("main").innerText();
  console.log("stat count immediate under reduced motion (expect 13 present):", text.includes("13"));

  await browser.close();
})();
```

Expected: `"none"` and `true`.

- [ ] **Step 4: Full spot-detail flow**

Manually drive (or script) opening a spot with a 360° panorama and at least two photos: confirm the 360° entry flourish plays, confirm the photo lightbox opens/steps/closes cleanly (per Task 7's check), confirm no console errors throughout.

- [ ] **Step 5: Fix any real defects found**

If any of the above surfaces a real defect, fix it, re-verify the specific check that failed, and commit the fix with a clear message describing what was wrong and why. If everything passes, skip to Step 6.

- [ ] **Step 6: Self-review**

Confirm: every new CSS animation has a reduced-motion override in the one consolidated block; every new Motion animation is either covered by `MotionConfig`'s `reducedMotion="user"` or gated by `usePrefersReducedMotion()`; no leftover references to the deleted `.overlay-fade-in`; `PhotoLightbox`'s single call site passes `spotId`.

- [ ] **Step 7: Report**

Summarize what was verified, any fixes made, and confirm the branch is in a clean, working state.
