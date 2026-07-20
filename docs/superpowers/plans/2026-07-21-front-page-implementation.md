# Standalone Front Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split today's map-first landing page into a standalone, pitch-first front page (hero, live stats, a QR code, featured destinations) at `/`, with today's map experience relocated unchanged to `/map`.

**Architecture:** `app/map/page.tsx` receives today's entire `Home` component body verbatim (header with category filter/near-me, colored headline, Leaflet map, spot modal, `?spot=` deep link) — a pure file move with two small extractions (`Wordmark`, `HEADLINE`) so the new front page can share them. `app/page.tsx` is rewritten from scratch as four new presentational components under `components/home/`, composed in file order: hero → stat grid → QR card → featured destinations. All new copy goes through the existing `t()`/`lib/i18n.ts` bilingual system; nothing is hardcoded English-only.

**Tech Stack:** Next.js App Router (file-system routing, `<Link>` for navigation — confirmed against this repo's `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md` and `04-linking-and-navigating.md`), React 19, Tailwind v4, `motion/react`, new dependency `react-qr-code` (SVG QR rendering, default export `QRCode`, props `value`/`size`/`bgColor`/`fgColor`).

## Global Constraints

- Bilingual: every new user-facing string gets an English key in `EN_UI` and a Tagalog mirror in `TL_UI` (`lib/i18n.ts`), following the existing `{var}` interpolation syntax (`t(key, vars)` replaces `{name}`-style placeholders — see `lib/i18n.ts:203-212`).
- No new "featured" data field — `data/spots.ts` and `lib/types.ts` are not touched.
- Stat numbers are computed from `spots.length` / `Object.keys(CATEGORIES).length`, never hardcoded.
- QR code encodes `window.location.origin`, read client-side after mount (no hardcoded URL, no env var).
- **No test framework exists in this repo** (confirmed: `.claude/skills/verify/SKILL.md` — "No tests; verification is runtime observation in a browser"). Every task's verification step is `npm run build` (catches SSR/`window` mistakes) plus a targeted Playwright check against system Chrome, per that skill's conventions — not a unit test suite.
- Design spec: `docs/superpowers/specs/2026-07-21-front-page-design.md`.

---

## Playwright setup (used by every task's verification step)

Install once, outside the repo:

```bash
mkdir -p /tmp/pw-scratch && cd /tmp/pw-scratch && npm init -y >/dev/null && npm install playwright-core >/dev/null
```

Start the dev server once, in the background, and leave it running for the whole plan:

```bash
cd /path/to/ExploQR && npm run dev -- --port 3010
```

Each task's Playwright check is a small throwaway script run with `node /tmp/pw-scratch/check.js`, launching `chromium.launch({ channel: "chrome", headless: true })` against `http://localhost:3010`.

---

### Task 1: Extract `Wordmark` and `HEADLINE`, move the map experience to `/map`

**Files:**
- Create: `lib/heroWords.ts`
- Create: `components/brand/Wordmark.tsx`
- Create: `app/map/page.tsx`
- Read (not modified yet): `app/page.tsx` — stays as today's map-first landing until Task 3

**Interfaces:**
- Produces: `HEADLINE: { key: UIKey; category: CategoryKey }[]` from `lib/heroWords.ts`, and default-exported `Wordmark` component from `components/brand/Wordmark.tsx` — both consumed by `app/map/page.tsx` (this task) and `components/home/HomeHero.tsx` (Task 3).

- [ ] **Step 1: Create `lib/heroWords.ts`**

```ts
import type { CategoryKey } from "@/lib/types";
import type { UIKey } from "@/lib/i18n";

// The four nouns painted in their category's color, so the headline doubles
// as the map legend. Shared between the front page hero and the map page's
// own header — the noun-to-category mapping has to stay the same truth in
// both places, or the color loses its meaning. Keep one noun per key and
// keep the mapping truthful; a word tinted for a category it doesn't name
// is a lie.
export const HEADLINE: { key: UIKey; category: CategoryKey }[] = [
  { key: "hero.word.shrines", category: "religious" },
  { key: "hero.word.summits", category: "nature" },
  { key: "hero.word.falls", category: "nature" },
  { key: "hero.word.fairways", category: "leisure" },
];
```

- [ ] **Step 2: Create `components/brand/Wordmark.tsx`**

```tsx
import Glyph from "@/components/brand/Glyph";

export default function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <Glyph size={22} />
      <span className="font-display text-lg font-extrabold tracking-tight text-ink">
        ExploQR <span className="font-medium text-ink/70">SJDM</span>
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Create `app/map/page.tsx`** — today's `app/page.tsx` body verbatim, with the local `Wordmark` function and local `HEADLINE` const replaced by imports from the two new files above. Nothing else changes: same state, same effects, same JSX.

```tsx
"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { MotionConfig } from "motion/react";
import { spots } from "@/data/spots";
import { distanceKm } from "@/lib/geo";
import { CATEGORIES } from "@/lib/categories";
import { HEADLINE } from "@/lib/heroWords";
import CategoryFilter, { type CategoryFilterKey } from "@/components/controls/CategoryFilter";
import SpotModal from "@/components/spot/SpotModal";
import NearMeToggle from "@/components/controls/NearMeToggle";
import Wordmark from "@/components/brand/Wordmark";
import LocaleToggle from "@/components/controls/LocaleToggle";
import ThemeToggle from "@/components/controls/ThemeToggle";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Spot, UserLocation } from "@/lib/types";

// Leaflet touches `window`, so the map only ever renders on the client.
// The fallback can't use the locale hook — it renders outside the tree — so
// this one string stays English; it's on screen for a few hundred ms.
const SpotMap = dynamic(() => import("@/components/spot/SpotMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-ink/[.03] font-mono text-xs text-ink/70">
      Loading map…
    </div>
  ),
});

function visibleIn(category: CategoryFilterKey): Spot[] {
  return category === "all"
    ? spots
    : spots.filter((s) => s.category === category);
}

export default function MapPage() {
  const { t } = useLocale();
  // No spot is selected on load — the map is the landing view. Clicking a
  // pin opens that spot in a modal (bottom sheet on mobile, centered dialog
  // on desktop) over the still-visible map.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryFilterKey>("all");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Deep link in: /map?spot=<id> opens that spot's modal on first load.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("spot");
    if (id && spots.some((s) => s.id === id)) setSelectedId(id);
  }, []);

  // Deep link out: keep the URL shareable as the selection changes, and
  // drop the param entirely once the modal is closed.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedId) url.searchParams.set("spot", selectedId);
    else url.searchParams.delete("spot");
    window.history.replaceState(null, "", url);
  }, [selectedId]);

  const handleCategory = useCallback((next: CategoryFilterKey) => {
    setCategory(next);
    const visible = visibleIn(next);
    setSelectedId((current) =>
      current && !visible.some((s) => s.id === current) ? null : current
    );
  }, []);

  // "Near me" toggles on/off; turning on asks the browser for a one-time
  // location fix (a user gesture, not requested on page load).
  const handleNearMe = useCallback(() => {
    if (userLocation) {
      setUserLocation(null);
      setLocationError(null);
      return;
    }
    if (!("geolocation" in navigator)) {
      setLocationError(t("nearme.unsupported"));
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocating(false);
      },
      (err) => {
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? t("nearme.denied")
            : t("nearme.failed")
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [userLocation, t]);

  const visible = useMemo(() => visibleIn(category), [category]);
  const selected = useMemo(
    () => spots.find((s) => s.id === selectedId) || null,
    [selectedId]
  );

  const distances = useMemo(
    () =>
      userLocation
        ? Object.fromEntries(
            visible.map((s) => [s.id, distanceKm(userLocation, s)])
          )
        : null,
    [userLocation, visible]
  );
  const orderedVisible = useMemo(
    () =>
      distances
        ? [...visible].sort((a, b) => distances[a.id] - distances[b.id])
        : visible,
    [distances, visible]
  );

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.3 }}>
      <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-y-2.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-x-6 sm:px-6">
          <div className="flex items-center justify-between gap-2">
            <Wordmark />
            <div className="flex items-center gap-1.5 sm:hidden">
              <ThemeToggle />
              <LocaleToggle />
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <CategoryFilter
              spots={spots}
              active={category}
              onChange={handleCategory}
            />
            <div className="hidden items-center gap-2 sm:flex">
              <ThemeToggle />
              <LocaleToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <section className="pb-5 pt-7 sm:pt-9">
          <p className="rise-in font-mono text-[11px] uppercase tracking-widest text-ink/70">
            {t("hero.eyebrow")}
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
            <h1 className="max-w-xl font-display text-[34px] font-extrabold leading-[0.98] tracking-[-0.03em] text-ink sm:text-5xl">
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
              className="rise-in max-w-xs text-sm leading-relaxed text-ink/70 sm:pb-1.5 sm:text-right"
              style={{ animationDelay: "380ms" }}
            >
              {t("hero.title")}
            </p>
          </div>
        </section>

        <div
          className="rise-in mb-3 flex justify-end"
          style={{ animationDelay: "440ms" }}
        >
          <NearMeToggle
            active={Boolean(userLocation)}
            loading={locating}
            error={locationError}
            onClick={handleNearMe}
          />
        </div>

        <div
          className="rise-in relative z-0 h-[440px] overflow-hidden rounded-2xl border border-line sm:h-[560px]"
          style={{ animationDelay: "500ms" }}
        >
          <SpotMap
            spots={orderedVisible}
            selectedId={selectedId}
            onSelect={setSelectedId}
            userLocation={userLocation}
          />
        </div>

        </div>
      </main>

      <SpotModal
        spot={selected}
        onClose={() => setSelectedId(null)}
        distanceKm={selected && distances ? distances[selected.id] : undefined}
      />
    </MotionConfig>
  );
}
```

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: succeeds with no type errors, two routes listed in the output (`/` and `/map`).

- [ ] **Step 5: Playwright check** — `/map` behaves exactly like today's `/`

```js
// /tmp/pw-scratch/check.js
const { chromium } = require("playwright-core");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  await page.goto("http://localhost:3010/map");
  await page.waitForSelector(".spot-marker");
  const markers = await page.locator(".spot-marker").count();
  console.log("markers:", markers); // expect 13 (all spots, no filter active)
  await page.locator(".spot-marker div[aria-label]").first().click();
  await page.waitForSelector("[role='dialog']");
  console.log("modal opened:", await page.locator("[role='dialog']").isVisible());
  console.log("url has ?spot=:", page.url().includes("?spot="));
  await browser.close();
})();
```

Run: `node /tmp/pw-scratch/check.js`
Expected: `markers: 13`, `modal opened: true`, `url has ?spot=: true`.

- [ ] **Step 6: Commit**

```bash
git add lib/heroWords.ts components/brand/Wordmark.tsx app/map/page.tsx
git commit -m "Move the map experience to /map, extract Wordmark and HEADLINE"
```

---

### Task 2: Add the QR dependency and all new front-page copy

**Files:**
- Modify: `package.json`, `package-lock.json` (via `npm install`)
- Modify: `lib/i18n.ts`

**Interfaces:**
- Produces: npm package `react-qr-code` (default export `QRCode`, props `value: string`, `size?: number`, `bgColor?: string`, `fgColor?: string`) — consumed by `components/home/QRCard.tsx` (Task 5). New `UIKey`s: `front.hero.body`, `front.cta.exploreMap`, `front.stat.destinations`, `front.stat.categories`, `front.stat.tour360.value`, `front.stat.tour360.label`, `front.stat.free.value`, `front.stat.free.label`, `front.qr.eyebrow`, `front.qr.body`, `front.featured.heading` — consumed by Tasks 3–6.

- [ ] **Step 1: Install the dependency**

Run: `npm install react-qr-code`

- [ ] **Step 2: Confirm the package's export shape**

Run: `cat node_modules/react-qr-code/lib/index.d.ts`
Expected: a default export of a component accepting at least `value: string`. If the actual declaration differs from `import QRCode from "react-qr-code"` with props `value`/`size`/`bgColor`/`fgColor`, adjust the import/props used in Task 5's `QRCard.tsx` to match what this file actually declares before proceeding.

- [ ] **Step 3: Add English keys** — in `lib/i18n.ts`, inside the `EN_UI` object, immediately before the closing `} as const;` (after the `install.*` keys):

```ts
  "front.hero.body":
    "{count} shrines, waterfalls, resorts, and parks across San Jose del Monte — each one mapped, photographed, and previewable in 360°. No download required: scan the code below and the whole guide opens in your phone's browser.",
  "front.cta.exploreMap": "Explore the Map",

  "front.stat.destinations": "Tourist Destinations",
  "front.stat.categories": "Destination Categories",
  "front.stat.tour360.value": "360°",
  "front.stat.tour360.label": "Virtual Tour Preview",
  "front.stat.free.value": "100%",
  "front.stat.free.label": "Free & Mobile-Friendly",

  "front.qr.eyebrow": "Scan to Explore",
  "front.qr.body": "One scan. No app to install — just point your camera and go.",

  "front.featured.heading": "Featured Destinations",
```

- [ ] **Step 4: Add Tagalog mirrors** — in `lib/i18n.ts`, inside the `TL_UI` object, immediately before the closing `};` (after the `install.*` keys):

```ts
  "front.hero.body":
    "{count} dambana, talon, resort, at parke sa buong San Jose del Monte — bawat isa ay minapa, may larawan, at mapapanood sa 360°. Walang kailangang i-download: i-scan ang QR code sa ibaba at bubukas agad ang buong gabay sa browser ng iyong telepono.",
  "front.cta.exploreMap": "Tingnan ang Mapa",

  "front.stat.destinations": "Mga Destinasyon",
  "front.stat.categories": "Kategorya ng Lugar",
  "front.stat.tour360.value": "360°",
  "front.stat.tour360.label": "Preview ng Virtual Tour",
  "front.stat.free.value": "100%",
  "front.stat.free.label": "Libre at Mobile-Friendly",

  "front.qr.eyebrow": "I-scan Para Mag-explore",
  "front.qr.body": "Isang scan lang. Walang app na i-i-install — itutok lang ang kamera at handa na.",

  "front.featured.heading": "Mga Tampok na Destinasyon",
```

- [ ] **Step 5: Build check**

Run: `npm run build`
Expected: succeeds (new keys are unused so far, which is not an error — `UIKey` is a union type, not an exhaustiveness check).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json lib/i18n.ts
git commit -m "Add react-qr-code dependency and front-page i18n copy"
```

---

### Task 3: Rewrite `app/page.tsx` as the front-page shell, with the hero

**Files:**
- Create: `components/home/HomeHero.tsx`
- Modify: `app/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `HEADLINE` from `lib/heroWords.ts` (Task 1), `Wordmark` from `components/brand/Wordmark.tsx` (Task 1), `t("front.hero.body", { count })` and `t("front.cta.exploreMap")` from `lib/i18n.ts` (Task 2).
- Produces: default-exported `HomeHero` component (no props) — consumed by `app/page.tsx` in this task and unchanged after.

- [ ] **Step 1: Create `components/home/HomeHero.tsx`**

```tsx
"use client";

import { Fragment } from "react";
import Link from "next/link";
import { spots } from "@/data/spots";
import { CATEGORIES } from "@/lib/categories";
import { HEADLINE } from "@/lib/heroWords";
import { useLocale } from "@/components/providers/LocaleProvider";

// The front page's pitch: the same category-colored headline the map page
// uses (so the color-to-category mapping is learned once, wherever a
// visitor lands first), a richer paragraph naming the live destination
// count, and the one primary action — go to the map.
export default function HomeHero() {
  const { t } = useLocale();

  return (
    <section className="pb-8 pt-10 sm:pt-14">
      <p className="rise-in font-mono text-[11px] uppercase tracking-widest text-ink/70">
        {t("hero.eyebrow")}
      </p>
      <h1 className="mt-3 max-w-2xl font-display text-[38px] font-extrabold leading-[0.98] tracking-[-0.03em] text-ink sm:text-6xl">
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
        className="rise-in mt-5 max-w-xl text-base leading-relaxed text-ink/80 sm:text-lg"
        style={{ animationDelay: "380ms" }}
      >
        {t("front.hero.body", { count: spots.length })}
      </p>
      <Link
        href="/map"
        className="rise-in mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-mono text-sm text-paper transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        style={{ animationDelay: "440ms" }}
      >
        {t("front.cta.exploreMap")} →
      </Link>
    </section>
  );
}
```

- [ ] **Step 2: Rewrite `app/page.tsx`**

```tsx
"use client";

import { MotionConfig } from "motion/react";
import Wordmark from "@/components/brand/Wordmark";
import ThemeToggle from "@/components/controls/ThemeToggle";
import LocaleToggle from "@/components/controls/LocaleToggle";
import HomeHero from "@/components/home/HomeHero";

export default function Home() {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.3 }}>
      <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Wordmark />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LocaleToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <HomeHero />
        </div>
      </main>
    </MotionConfig>
  );
}
```

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: succeeds, no unused-import warnings.

- [ ] **Step 4: Playwright check**

```js
// /tmp/pw-scratch/check.js
const { chromium } = require("playwright-core");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  await page.goto("http://localhost:3010/");
  const body = await page.textContent("body");
  console.log("has count 13:", body.includes("13 shrines"));
  console.log("no map on /:", (await page.locator(".spot-marker").count()) === 0);
  await page.getByRole("link", { name: /Explore the Map/ }).click();
  await page.waitForURL("**/map");
  console.log("CTA navigates to /map:", page.url().endsWith("/map"));
  await browser.close();
})();
```

Run: `node /tmp/pw-scratch/check.js`
Expected: `has count 13: true`, `no map on /: true`, `CTA navigates to /map: true`.

- [ ] **Step 5: Commit**

```bash
git add components/home/HomeHero.tsx app/page.tsx
git commit -m "Add the front-page hero"
```

---

### Task 4: Add the stat grid

**Files:**
- Create: `components/home/StatGrid.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `t("front.stat.destinations")`, `t("front.stat.categories")`, `t("front.stat.tour360.value")`, `t("front.stat.tour360.label")`, `t("front.stat.free.value")`, `t("front.stat.free.label")` (Task 2).
- Produces: default-exported `StatGrid` component (no props).

- [ ] **Step 1: Create `components/home/StatGrid.tsx`**

```tsx
"use client";

import { spots } from "@/data/spots";
import { CATEGORIES } from "@/lib/categories";
import { useLocale } from "@/components/providers/LocaleProvider";

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[10px] border border-line bg-surface px-4 py-4">
      <div className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
        {value}
      </div>
      <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ink/70">
        {label}
      </div>
    </div>
  );
}

// Four facts about the app itself, not about any one spot. The destination
// and category counts are computed rather than typed in, so the tiles never
// drift out of sync with data/spots.ts as destinations are added.
export default function StatGrid() {
  const { t } = useLocale();
  const categoryCount = Object.keys(CATEGORIES).length;

  return (
    <section
      className="rise-in grid grid-cols-2 gap-3"
      style={{ animationDelay: "500ms" }}
    >
      <StatTile value={String(spots.length)} label={t("front.stat.destinations")} />
      <StatTile value={String(categoryCount)} label={t("front.stat.categories")} />
      <StatTile value={t("front.stat.tour360.value")} label={t("front.stat.tour360.label")} />
      <StatTile value={t("front.stat.free.value")} label={t("front.stat.free.label")} />
    </section>
  );
}
```

- [ ] **Step 2: Wire into `app/page.tsx`** — add the import and render it below `<HomeHero />`:

Replace:
```tsx
import HomeHero from "@/components/home/HomeHero";
```
with:
```tsx
import HomeHero from "@/components/home/HomeHero";
import StatGrid from "@/components/home/StatGrid";
```

Replace:
```tsx
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <HomeHero />
        </div>
```
with:
```tsx
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <HomeHero />
          <StatGrid />
        </div>
```

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Playwright check**

```js
// /tmp/pw-scratch/check.js
const { chromium } = require("playwright-core");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  await page.goto("http://localhost:3010/");
  const body = await page.textContent("body");
  console.log("destinations stat:", body.includes("13") && body.includes("Tourist Destinations"));
  console.log("categories stat:", body.includes("5") && body.includes("Destination Categories"));
  console.log("360 stat:", body.includes("360°") && body.includes("Virtual Tour Preview"));
  console.log("free stat:", body.includes("100%") && body.includes("Free & Mobile-Friendly"));
  await browser.close();
})();
```

Run: `node /tmp/pw-scratch/check.js`
Expected: all four lines `true`.

- [ ] **Step 5: Commit**

```bash
git add components/home/StatGrid.tsx app/page.tsx
git commit -m "Add the front-page stat grid"
```

---

### Task 5: Add the QR card

**Files:**
- Create: `components/home/QRCard.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `react-qr-code`'s default-exported `QRCode` component (Task 2), `t("front.qr.eyebrow")`, `t("front.qr.body")` (Task 2).
- Produces: default-exported `QRCard` component (no props).

- [ ] **Step 1: Create `components/home/QRCard.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { useLocale } from "@/components/providers/LocaleProvider";

// The origin is only knowable in the browser, so the code renders empty
// until mount — the same trade-off the rest of the app makes for anything
// that touches `window` (see SpotMap's SSR loading fallback). A few hundred
// ms blank is invisible next to the page's own load.
//
// The QR itself stays literal black-on-white regardless of theme — unlike
// `ink`/`paper`, which invert, a QR scanner needs maximum, reliable
// contrast, not a themed one. Same reasoning as `--scrim` and the category
// `block` tokens in globals.css: some things are theme-constant on purpose.
export default function QRCard() {
  const { t } = useLocale();
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  return (
    <section
      className="rise-in mt-3 flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface px-6 py-8 text-center sm:flex-row sm:text-left"
      style={{ animationDelay: "560ms" }}
    >
      <div className="rounded-xl border border-line bg-white p-3">
        {origin && (
          <QRCode value={origin} size={128} bgColor="#ffffff" fgColor="#1c2321" />
        )}
      </div>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink/70">
          {t("front.qr.eyebrow")}
        </p>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink/80">
          {t("front.qr.body")}
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire into `app/page.tsx`**

Replace:
```tsx
import HomeHero from "@/components/home/HomeHero";
import StatGrid from "@/components/home/StatGrid";
```
with:
```tsx
import HomeHero from "@/components/home/HomeHero";
import StatGrid from "@/components/home/StatGrid";
import QRCard from "@/components/home/QRCard";
```

Replace:
```tsx
          <HomeHero />
          <StatGrid />
        </div>
```
with:
```tsx
          <HomeHero />
          <StatGrid />
          <QRCard />
        </div>
```

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Playwright check**

```js
// /tmp/pw-scratch/check.js
const { chromium } = require("playwright-core");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  await page.goto("http://localhost:3010/");
  await page.waitForTimeout(300); // origin state settles post-mount
  const svg = await page.locator("section:has-text('Scan to Explore') svg").count();
  console.log("QR svg rendered:", svg > 0);
  const valueAttr = await page.evaluate(() => {
    const path = document.querySelector("section svg path, section svg rect");
    return path ? true : false;
  });
  console.log("QR has drawn content:", valueAttr);
  await browser.close();
})();
```

Run: `node /tmp/pw-scratch/check.js`
Expected: `QR svg rendered: true`, `QR has drawn content: true`.

- [ ] **Step 5: Commit**

```bash
git add components/home/QRCard.tsx app/page.tsx
git commit -m "Add the front-page QR card"
```

---

### Task 6: Add featured destinations

**Files:**
- Create: `components/home/FeaturedDestinations.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `CATEGORIES`, `spotIcon`, `barangayLabel` from `lib/categories.ts`, `useImageFallback` from `lib/hooks/useImageFallback.ts`, `t("front.featured.heading")`, `t("cat.<category>")` (existing keys).
- Produces: default-exported `FeaturedDestinations` component (no props). Exports `pickFeatured` for use only within this file (single consumer, matches the codebase's own "one consumer, no interface" convention documented in `docs/superpowers/specs/2026-07-20-spot-modal-port-design.md`).

- [ ] **Step 1: Create `components/home/FeaturedDestinations.tsx`**

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { spots } from "@/data/spots";
import { CATEGORIES, spotIcon, barangayLabel } from "@/lib/categories";
import { useImageFallback } from "@/lib/hooks/useImageFallback";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Spot } from "@/lib/types";

// One spot per category, in data order — inherently varied without a
// "featured" data flag to maintain. Stops once every category in
// CATEGORIES has an entry, so this stays correct as spots.ts grows.
function pickFeatured(all: Spot[]): Spot[] {
  const seen = new Set<string>();
  const picked: Spot[] = [];
  for (const spot of all) {
    if (seen.has(spot.category)) continue;
    seen.add(spot.category);
    picked.push(spot);
    if (seen.size === Object.keys(CATEGORIES).length) break;
  }
  return picked;
}

// Same photo/category-block visual language as the map page's spot tiles
// (components/spot/SpotList.tsx), but a plain Link instead of a
// Motion-animated button — this grid never reorders or filters, so it
// doesn't need that machinery.
function FeaturedCard({ spot }: { spot: Spot }) {
  const { t, text } = useLocale();
  const { failed, onError, checkOnMount } = useImageFallback();
  const cat = CATEGORIES[spot.category];
  const Icon = spotIcon(spot);
  const src = spot.images?.[0]?.src;
  const showPhoto = Boolean(src) && !failed;

  return (
    <Link
      href={`/map?spot=${spot.id}`}
      style={showPhoto ? undefined : { background: cat.block, color: cat.blockFg }}
      className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-xl p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      {showPhoto && src ? (
        <>
          <Image
            src={src}
            alt=""
            fill
            sizes="(min-width: 1024px) 240px, 45vw"
            ref={checkOnMount}
            onError={onError}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            loading="lazy"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
          />
        </>
      ) : (
        <Icon
          size={96}
          strokeWidth={1.5}
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 top-1/2 -translate-y-1/2"
          style={{ color: cat.fill, opacity: 0.55 }}
        />
      )}

      <span
        className="absolute left-3 top-3 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider"
        style={
          showPhoto
            ? { background: cat.block, color: cat.blockFg }
            : { background: cat.blockFg, color: cat.block }
        }
      >
        {t(`cat.${spot.category}`)}
      </span>

      <span className={`relative ${showPhoto ? "text-white" : ""}`}>
        <span className="block font-display text-[13px] font-extrabold leading-tight sm:text-[15px]">
          {text(spot.name)}
        </span>
        <span className="mt-0.5 block text-[10px] opacity-85 sm:text-[11px]">
          {barangayLabel(spot, t)}
        </span>
      </span>
    </Link>
  );
}

export default function FeaturedDestinations() {
  const { t } = useLocale();
  const featured = pickFeatured(spots);

  return (
    <section className="rise-in mb-10 mt-10" style={{ animationDelay: "620ms" }}>
      <h2 className="font-mono text-[11px] uppercase tracking-widest text-ink/70">
        {t("front.featured.heading")}
      </h2>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {featured.map((spot) => (
          <li key={spot.id}>
            <FeaturedCard spot={spot} />
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 2: Wire into `app/page.tsx`**

Replace:
```tsx
import HomeHero from "@/components/home/HomeHero";
import StatGrid from "@/components/home/StatGrid";
import QRCard from "@/components/home/QRCard";
```
with:
```tsx
import HomeHero from "@/components/home/HomeHero";
import StatGrid from "@/components/home/StatGrid";
import QRCard from "@/components/home/QRCard";
import FeaturedDestinations from "@/components/home/FeaturedDestinations";
```

Replace:
```tsx
          <HomeHero />
          <StatGrid />
          <QRCard />
        </div>
```
with:
```tsx
          <HomeHero />
          <StatGrid />
          <QRCard />
          <FeaturedDestinations />
        </div>
```

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Playwright check**

```js
// /tmp/pw-scratch/check.js
const { chromium } = require("playwright-core");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  await page.goto("http://localhost:3010/");
  const cards = await page.locator("section:has-text('Featured Destinations') li a").count();
  console.log("featured card count:", cards); // expect 5, one per category
  const firstHref = await page.locator("section:has-text('Featured Destinations') li a").first().getAttribute("href");
  console.log("href shape:", firstHref?.startsWith("/map?spot="));
  await page.locator("section:has-text('Featured Destinations') li a").first().click();
  await page.waitForSelector("[role='dialog']");
  console.log("opens spot modal on /map:", page.url().includes("/map?spot="));
  await browser.close();
})();
```

Run: `node /tmp/pw-scratch/check.js`
Expected: `featured card count: 5`, `href shape: true`, `opens spot modal on /map: true`.

- [ ] **Step 5: Commit**

```bash
git add components/home/FeaturedDestinations.tsx app/page.tsx
git commit -m "Add featured destinations to the front page"
```

---

### Task 7: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Full build + lint**

Run: `npm run build && npm run lint`
Expected: both succeed with no errors.

- [ ] **Step 2: Light/dark theme check**

```js
// /tmp/pw-scratch/check.js
const { chromium } = require("playwright-core");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  for (const scheme of ["light", "dark"]) {
    const page = await browser.newPage({ colorScheme: scheme });
    await page.goto("http://localhost:3010/");
    await page.screenshot({ path: `/tmp/pw-scratch/front-${scheme}.png`, fullPage: true });
    await page.close();
  }
  await browser.close();
})();
```

Run: `node /tmp/pw-scratch/check.js`, then view both screenshots — confirm the stat grid, QR card, and featured cards all read correctly in both themes (QR card stays literal white/black by design; everything else follows `ink`/`paper`).

- [ ] **Step 3: Locale check**

```js
// /tmp/pw-scratch/check.js
const { chromium } = require("playwright-core");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  await page.goto("http://localhost:3010/");
  await page.getByRole("group", { name: /Language/ }).getByRole("button", { name: "tl" }).click();
  const body = await page.textContent("body");
  console.log("tl hero body:", body.includes("dambana"));
  console.log("tl cta:", body.includes("Tingnan ang Mapa"));
  console.log("no raw keys leak:", !/\bfront\.[a-zA-Z.]+/.test(body));
  await browser.close();
})();
```

Run: `node /tmp/pw-scratch/check.js`
Expected: all three `true`.

- [ ] **Step 4: Production/service-worker sanity check** (per `.claude/skills/verify/SKILL.md`)

Run: `npm run build && npm run start -- --port 3011`, then confirm `/` and `/map` both load correctly under `npm run start` (not just `next dev`), since the front page introduces a new top-level route the service worker's cache needs to see at least once.

- [ ] **Step 5: Update the spec status**

In `docs/superpowers/specs/2026-07-21-front-page-design.md`, no change needed — `Status: approved` already reflects the final state; the plan is the execution record.

- [ ] **Step 6: Final commit** (only if Steps 1–4 surfaced fixes)

```bash
git add -A
git commit -m "Fix issues found in front-page end-to-end verification"
```
