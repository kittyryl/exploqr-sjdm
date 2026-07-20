# A standalone front page, split from the map

Date: 2026-07-21
Status: approved

## Problem

`app/page.tsx` is currently both the landing page and the map experience: header with
category filter and near-me toggle, colored-noun headline, then the Leaflet map
directly below. A first-time visitor — most often someone who has just scanned a QR
code on-site — lands straight into an interactive map with no pitch: what the app is,
how many destinations it covers, that it's free, that it needs no install.

We're splitting this into two pages: a front page that makes the pitch (stats, a QR
code for sharing the app itself, a preview of featured destinations) and a `/map` page
that is today's map experience, unchanged.

## Scope

In scope: a new `app/page.tsx` (front page) and a new `app/map/page.tsx` (today's map
experience, relocated). New `components/home/*` components. New i18n keys (English +
Tagalog) for all new copy. One new dependency for QR rendering.

Out of scope: the map, spot modal, category filter, near-me toggle, and all other
existing components — these move to `/map` with no behavior changes. No new "featured"
data field (see Featured destinations, below).

## Design

### Routing

| Route | Contents |
| --- | --- |
| `app/page.tsx` | New front page: hero, stat grid, QR card, featured destinations, footer. |
| `app/map/page.tsx` | Today's `Home` component body, unchanged: header (wordmark, category filter, near-me, theme/locale toggles), colored headline, map, spot modal, `?spot=` deep link. |

The `?spot=<id>` deep-link mechanic keeps working exactly as today, just under
`/map?spot=<id>` instead of `/?spot=<id>`. Nothing about that mechanic changes — only
its route.

### Front page layout

Top to bottom:

1. **Header** — `Wordmark`, `ThemeToggle`, `LocaleToggle` only. No category filter or
   near-me toggle; those are `/map` concerns.
2. **Hero** — existing eyebrow (`hero.eyebrow`) and the colored-noun headline
   (`hero.word.*`) stay, since they're a good hook and double as a map-legend preview.
   Below them, a new richer paragraph (`front.hero.body`) replaces the terse
   `hero.title` copy: *"{count} shrines, waterfalls, resorts, and parks across San Jose
   del Monte — each one mapped, photographed, and previewable in 360°. No download
   required: scan the code below and the whole guide opens in your phone's browser."*
   `{count}` is `spots.length`, passed via `t()`'s `vars` param (the existing
   `t: (key, vars?) => string` signature already supports this) — the same computed
   number used in the stat grid, kept in sync by construction. Primary CTA button,
   **"Explore the Map →"**, links to `/map`.
3. **Stat grid** — 2×2, styled after the existing `SpotFactGrid` cell pattern:
   - Destinations count, computed as `spots.length`
   - Category count, computed as `Object.keys(CATEGORIES).length`
   - **360°** — Virtual Tour Preview (capability badge, not a per-spot count)
   - **100%** — Free & Mobile-Friendly
4. **QR card** — its own block, sized for a QR to actually stay scannable (not a stat
   tile). Encodes `window.location.origin`, computed client-side after mount (this
   component is `"use client"` already, consistent with the rest of the app's
   SSR-incompatible bits — see `SpotMap`'s loading fallback for precedent). Copy:
   *"One scan. No app to install — just point your camera and go."*
5. **Featured destinations** — see below.
6. **Footer** — the existing `Footer` component, unchanged.

### Featured destinations: selection

No new data field. Selection walks `spots` in file order and keeps the first spot seen
per unique `category`, stopping once every category in `CATEGORIES` has one entry. With
today's 5 categories this yields exactly 5 cards, each a different category — inherently
varied, and it never needs updating as destinations are added. Each card links to
`/map?spot={id}`.

### New components (`components/home/`)

| File | Responsibility |
| --- | --- |
| `components/home/HomeHero.tsx` | Eyebrow, colored headline, body paragraph, CTA button |
| `components/home/StatGrid.tsx` | The 2×2 stat/feature tile grid |
| `components/home/QRCard.tsx` | QR code (client-computed origin) + scan copy |
| `components/home/FeaturedDestinations.tsx` | Category-diverse spot preview cards |

### i18n

All new copy gets an English key and a Tagalog mirror in `lib/i18n.ts`, following the
existing fallback pattern (missing `tl` keys fall back to `en`). Proper nouns (spot
names, "SJDM") stay untranslated, matching existing convention.

### Dependency

Adds `react-qr-code` (SVG-based QR rendering — no canvas, no hydration mismatch risk,
themeable via `currentColor` so it can pick up `--ink`/`--paper` in both themes).

## Testing

Manual verification via the `verify` skill: confirm the front page renders with correct
live-computed stats, the QR code decodes to the deployed origin, the CTA and featured
cards navigate to the right `/map` URLs (including deep-linking a spot's modal open),
and the map page behaves identically to today's `/` in both light and dark themes and
both locales.
