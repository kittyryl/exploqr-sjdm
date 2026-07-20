# Spot-details modal: port the live site's layout

Date: 2026-07-20
Status: approved

## Problem

The deployed static prototype at <https://exploqrsjdm.netlify.app/> presents a spot's
details as a hero-led card: a full-bleed photo with the category and title overlaid,
then a two-column grid of practical facts, amenity pills, a photo strip, and a row of
actions. This repo presents the same information as a side-by-side card — a media
column on the right, and a left column that mixes coordinates, title, description, and
a single wrapped row of hours, fee, contact, website, and the directions button.

The prototype's layout reads better: it leads with the photo, and it gives each fact a
labelled cell instead of burying it in a run-on row. We are adopting that layout.

We are not adopting the prototype's implementation. It is a single 43 KB HTML file with
inline CSS on a fixed cream/forest palette, a static photo strip, and a `360° View`
button whose handler is `alert('Ito ang lalagyan ng aktwal na 360° panoramic viewer')`.
This repo has a real `Pano360Viewer`, a lightbox that pages across the whole media
sequence, per-category theming, dark mode, two locales, and a focus trap. All of that
survives the port.

## Scope

In scope: the contents of the spot-details modal, and the component boundaries needed
to express it.

Out of scope: `SpotModal`'s shell behaviour (backdrop, mobile takeover, Motion, focus
trap), `PhotoLightbox`, `Pano360Viewer`, the map, the list, and the category system.

## Design

### Component boundaries

`SpotDetailCard` has exactly one consumer, `SpotModal`, so restructuring it affects
nothing else. The new layout has five visually distinct sections, and the media state
they share has to outlive any one of them, so the state moves into a hook and each
section becomes a presentational component.

| File | Responsibility | Change |
| --- | --- | --- |
| `components/spot/SpotModal.tsx` | backdrop, mobile takeover, Motion, focus trap, Escape, close button | behaviour unchanged; panel classes retuned (see Layout) |
| `components/spot/SpotDetailCard.tsx` | composition only — calls the hook, orders the five sections | rewritten |
| `components/spot/SpotHero.tsx` | still image, scrim, category tag, title, barangay/distance | new |
| `components/spot/SpotFactGrid.tsx` | the 2×2 fact grid | new |
| `components/spot/SpotAmenities.tsx` | section title and pill row | new |
| `components/spot/SpotPhotoStrip.tsx` | thumbnails and the Wikimedia credit line | new |
| `components/spot/SpotActions.tsx` | directions and 360° buttons | new |
| `lib/hooks/useSpotMedia.ts` | media state machine | new |
| `components/spot/SpotMedia.tsx` | — | deleted, split into the hook, the hero, and the strip |
| `components/spot/PhotoLightbox.tsx` | | unchanged |
| `components/spot/Pano360Viewer.tsx` | | unchanged |

### The media state machine

`SpotMedia` currently owns `active`, `lightboxOpen`, and the image-failure map, and
renders the main panel, thumbnail strip, credit, and lightbox as one contiguous block.
The new layout separates the main panel (now the hero, at the top of the modal) from
the thumbnail strip (now below the description, fact grid, and amenities). One state
machine, two distant consumers.

`useSpotMedia(spot)` takes that state and returns:

```ts
{
  images: SpotImage[];
  hasPano: boolean;
  total: number;
  active: number | "pano";
  setActive: (m: number | "pano") => void;
  lightboxOpen: boolean;
  openLightbox: () => void;
  closeLightbox: () => void;
  step: (dir: 1 | -1) => void;
  failedMap: Record<string, boolean>;
  markFailed: (src: string) => void;
  checkOnMount: (src: string) => RefCallback<HTMLImageElement>;
}
```

`step` keeps its existing rule verbatim: the sequence is `[360°, ...photos]` when the
spot has a panorama, and landing on the 360° slot closes the lightbox and switches
`active` to `"pano"`, because a panorama cannot render inside the flat photo lightbox.

`SpotDetailCard` calls the hook once. The hero, the strip, the actions, and the
lightbox all read the same object. The `360° View` action is `setActive("pano")`.

### The hero is always a still image

The hero carries a gradient scrim, the category tag, and the title on top of it, and
`SpotModal`'s close button floats over its top-right corner. A live Pannellum canvas
underneath all of that would fight the overlay: drag-to-look would collide with the
text, and a moving WebGL scene makes the title hard to read.

So the hero renders a static `next/image` — the panorama's own URL when the spot has
one, otherwise the first photo. Clicking it activates the real thing: `setActive("pano")`
for panorama spots, `openLightbox()` for photo-only spots. The interactive viewer lives
in the strip and the lightbox, where nothing is layered over it.

The hero image is above the fold, so it must not lazy-load. **Next.js 16 deprecated
`priority` in favour of `preload`**; this uses `loading="eager"` on the hero image.
`next/dynamic` with `ssr: false` is unchanged in this version, so `Pano360Viewer`'s
existing dynamic import carries over as written.

### Layout

Modal shell moves to `rounded-[20px] max-w-2xl max-h-[88vh]`, matching the prototype.

Hero: `h-[190px]`, `object-cover`, a `linear-gradient(0deg, scrim/50, transparent 60%)`
overlay, contents bottom-aligned at `p-5`. The category tag is a pill carrying **the
category icon and its label**. The prototype's tag reads `Relihiyoso · Stop 1`; this
repo has no tour ordering, so `Stop N` is dropped, and the freed space takes the icon
from `spotIcon()`. That preserves the `ICON_OVERRIDES` artwork, which is why the
standalone 56 px icon box is removed rather than kept. Title is
`font-display text-2xl text-white`, followed by a muted line of barangay and, when the
visitor has shared their location, distance.

Body at `p-6`, in order: description, fact grid, amenities, photo strip, actions.
Coordinates move from the top of the card to a muted mono line just above the actions.

### Facts, and one deliberate deviation

Four cells: entrance fee, operating hours, website, contact. The open/closed status dot
folds into the operating-hours value.

The prototype prints `N/A` into empty cells. This repo does the opposite deliberately —
`SpotDetailCard` today notes that each detail *"is optional and simply absent until
someone confirms it locally — an empty row would be worse than no row."* That rule wins:
empty cells are omitted and the grid reflows. `hours` is non-optional in `Spot`, so the
grid is never empty.

### Styling

The layout is expressed in the repo's existing Tailwind tokens, not the prototype's
palette. Fact cards use `surface` and `line`; the category tag and the primary button
use the spot's `accent` and `btnFg`. Dark mode keeps working and each category keeps
its own colour, neither of which the prototype supports.

### Data and content

`Spot` gains `amenities?: LocaleText[]`. The field is backfilled for the spots in
`data/spots.ts`; the amenities section is omitted entirely for spots without it.

New keys, added to both the `en` and `tl` blocks of `lib/i18n.ts`: `spot.hours`,
`spot.amenities`, `spot.photos`, `spot.view360`, `media.heroLabel`. The existing
`spot.fee`, `spot.contact`, `spot.website`, and `spot.directions` become the fact-cell
labels and action labels.

### Accessibility

The Wikimedia Commons licences require the photographer credit to stay visible; it
moves beneath the photo strip and tracks the active image. `SpotModal` keeps its focus
trap, `aria-modal`, and `aria-labelledby`. Thumbnails keep `aria-pressed`. The hero
button gets its own `aria-label` via `media.heroLabel`. Page-level
`MotionConfig reducedMotion="user"` continues to govern all animation.

## Verification

1. `npx tsc --noEmit`
2. `npm run build`
3. The `verify` skill, driving a real browser, on both a panorama spot and a
   photo-only spot:
   - hero click opens the viewer (panorama) or the lightbox (photo-only)
   - thumbnails switch the active media; the lightbox pages across the full sequence
   - the `360° View` action opens `Pano360Viewer`
   - Escape closes the modal and focus returns to the originating list row
   - the mobile full-screen takeover and its sticky back header still work
   - dark mode and a second category render correctly
   - a spot missing fee/website/contact reflows the grid without empty cells
