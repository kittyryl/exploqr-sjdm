# Open/Closed badge + Share button — design

Date: 2026-07-18

## Motivation

Two small additions to the spot detail modal:

1. An "Open now" / "Closed now" badge, so a visitor deciding whether to go
   somewhere doesn't have to parse a free-text hours string themselves.
2. A share button, so a visitor can hand a specific spot to someone else
   without manually copying the address bar.

Both build on data/mechanisms that already exist in the app (the `hours`
field, the `?spot=<id>` deep link) rather than introducing new systems.

## 1. Open/Closed badge

### Data model

A new optional field, `openHours`, added per spot in `data/spots.js`,
alongside the existing optional fields (`fee`, `contact`, `website`) —
same convention: present only where the information is meaningful, absent
is a valid state.

```js
openHours: { open: "06:00", close: "17:00", closedDays: [1] }
```

- `open` / `close`: 24-hour `"HH:MM"` strings, evaluated in `Asia/Manila`.
- `closedDays`: optional array of weekday indices (`0` = Sunday … `6` =
  Saturday) that are fully closed all day. Omitted entirely when the spot
  is open every day.
- The field is fully independent of the existing free-text `hours` field,
  which keeps rendering unchanged everywhere it does today. `openHours` is
  additive, used only to compute the badge.

Values for the 6 current spots:

| Spot | `openHours` | Basis |
|---|---|---|
| Grotto | `{ open: "05:00", close: "20:00" }` | Estimated — typical PH shrine/church grounds window |
| Padre Pio | `{ open: "06:00", close: "17:00", closedDays: [1] }` | Confirmed — matches existing `hours` text exactly |
| Mt. Balagbag | `{ open: "06:00", close: "17:00" }` | Estimated — closes before typical PH dusk, given it's a trek |
| Kaytitinga Falls | `{ open: "07:00", close: "16:00" }` | Estimated — forest trek, wider safety margin before dark |
| Tungkong Mangga | `{ open: "07:00", close: "18:00" }` | Estimated — general adventure-camp site access window |
| Cattle Creek | `{ open: "06:00", close: "17:00" }` | Confirmed — matches existing `hours` text exactly |

Estimated values are not visually distinguished from confirmed ones in the
UI (explicit product decision — see conversation), but are still chosen to
err toward an earlier close where the activity (trekking, falls) makes
being caught out after dark a real concern, not arbitrary numbers.

### Logic — `lib/hours.js`

One exported function:

```js
export function isOpenNow(openHours, now = new Date())
```

- Returns `null` if `openHours` is not set (defensive — after this change
  all 6 spots have it, but the function stays safe for future spots added
  without it).
- Resolves the current weekday and `HH:MM` specifically in the
  `Asia/Manila` timezone via `Intl.DateTimeFormat` with
  `timeZone: "Asia/Manila"` — deliberately not the visitor's browser
  timezone, since "open now" must describe the spot's local time in
  Bulacan, not wherever the visitor's device happens to be (relevant for
  diaspora Filipinos browsing from abroad).
- Returns `false` if today's weekday is in `closedDays`.
- Otherwise returns whether current `HH:MM` falls within `[open, close)`.
  No overnight-wraparound handling (`close < open`) — none of the current
  data needs it, so it's out of scope rather than dead code.
- `now` param defaults to `new Date()` but is overridable, purely so the
  function is unit-testable without mocking global time.

### UI — `components/SpotDetailCard.js`

A small badge rendered next to the existing hours line (the one with the
`Clock` icon and `text(spot.hours)`), computed once per render (no
`setInterval` — the app doesn't live-update distance either, so this
matches existing precedent):

- `isOpenNow(spot.openHours)` returns `true` → dot + `t("status.open")`
  ("Open now"), colored with the existing `--cat-nature-accent` token
  (already theme-aware light/dark, no new color token needed; reused
  purely for its green hue, not as a category reference — the badge isn't
  styled like the category pill, so there's no visual confusion).
- Returns `false` → dot + `t("status.closed")` ("Closed now"), using the
  same muted `text-ink/60` treatment already used for secondary metadata
  elsewhere in the card (not alarming red — matches the app's restrained
  palette).
- Returns `null` → nothing rendered (won't happen for the current 6 spots
  after this change, but keeps future spots without `openHours` safe).

### New i18n keys (`lib/i18n.js`, both `en` and `tl`)

- `status.open` — "Open now" / "Bukas ngayon"
- `status.closed` — "Closed now" / "Sarado ngayon"

## 2. Share button

### Placement — `components/SpotModal.js`

An icon-only button using the `Share2` icon from `lucide-react`, styled to
match the existing close/back icon buttons:

- Desktop: next to the existing `X` close button (top-right).
- Mobile: in the sticky header, opposite the back arrow.

### Behavior

The page already keeps `window.location.href` in sync with `?spot=<id>`
whenever a spot is open (see the `replaceState` effect in `app/page.js`,
originally built "for future QR codes"). The share button reads that URL
directly at click time — no reconstruction needed.

```js
async function handleShare() {
  const url = window.location.href;
  if (navigator.share) {
    try {
      await navigator.share({ title: text(spot.name), url });
    } catch (e) {
      if (e.name !== "AbortError") throw e; // user cancelling the share sheet isn't an error
    }
    return;
  }
  await navigator.clipboard.writeText(url);
  // flip local component state to show a checkmark + "Copied!" for ~2s,
  // then revert — no new toast/notification system.
}
```

- `navigator.share` path covers most mobile browsers.
- Clipboard fallback covers most desktop browsers.
- No handling for a browser with neither API (effectively none in current
  usage) — out of scope.

### New i18n keys

- `share.button` — "Share" / "Ibahagi" (aria-label on the icon button)
- `share.copied` — "Link copied!" / "Nakopya ang link!"

## Out of scope (explicitly deferred, not forgotten)

- Badge on the grid tiles (`SpotList.js`) — modal-only per the scoping
  decision; tiles are already visually dense across all 6 spots including
  the 2 without photos.
- Live-updating badge while the modal stays open across the open/close
  boundary — computed once on render, consistent with the rest of the app.
- Visually marking estimated vs. confirmed hours — explicit decision to
  treat both the same.
- A generalized toast/notification system — the "Copied!" state is local
  to the share button only.

## Testing / verification

- `lib/hours.js` is pure and synchronous (given an injectable `now`), so
  it's straightforward to exercise with a few fixed timestamps per spot
  (inside/outside window, on a `closedDays` weekday, exactly at the
  open/close boundary) without needing a browser.
- Share button: verify both branches in Playwright — a context where
  `navigator.share` is stubbed to confirm it's called with the right args,
  and a context where it's undefined to confirm the clipboard fallback and
  "Copied!" state.
- Manual/Playwright check that the Manila-timezone resolution is correct
  by comparing against a context with a spoofed non-PH timezone.
