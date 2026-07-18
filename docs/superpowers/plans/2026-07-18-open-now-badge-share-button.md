# Open/Closed Badge + Share Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Open now"/"Closed now" badge to the spot detail modal (computed from a new structured `openHours` field) and a share button (native share sheet with clipboard fallback) to the same modal.

**Architecture:** A pure, dependency-free time-window function (`lib/hours.js`) evaluated against a new optional per-spot `openHours` field, rendered as a small badge in the existing hours line of `SpotDetailCard.js`. The share button reuses the URL the app already keeps in sync at `window.location.href` (no new URL-building code) and lives in `SpotModal.js` next to the existing close/back controls.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, `lucide-react` icons, plain `Intl.DateTimeFormat` (no date library). Full spec: `docs/superpowers/specs/2026-07-18-open-now-badge-share-button-design.md`.

## Global Constraints

- **No test framework in this repo.** `package.json` has no jest/vitest/playwright as a dependency — verification is via a throwaway Node script during development (deleted before committing, never checked in) for the pure `lib/hours.js` logic, plus a Playwright-driven browser check (this project's established `verify` skill pattern) for final end-to-end confirmation. Do **not** add a new test framework dependency for this work.
- Every new user-facing string gets both an `en` and `tl` entry in `lib/i18n.js`, consumed via the existing `t()` (for UI strings) — never hardcoded text in JSX.
- "Open now" must be evaluated in the `Asia/Manila` timezone regardless of the visitor's own browser/OS timezone.
- No new toast/notification system — the share button's "Copied!" state is local component state (`useState` + `setTimeout`), nothing global.
- Match this repo's existing comment style: comments explain non-obvious *why*, never *what*. Don't add comments that just restate the code.
- Run `npx eslint <changed files>` and `npm run build` after every task that touches app code — both must be clean before committing.

---

## File Structure

- **Create:** `lib/hours.js` — one pure exported function, `isOpenNow(openHours, now)`.
- **Modify:** `data/spots.js` — add an `openHours` object to each of the 6 spots.
- **Modify:** `lib/i18n.js` — add `status.open`, `status.closed`, `share.button`, `share.copied` to both the `en` and `tl` dictionaries.
- **Modify:** `components/SpotDetailCard.js` — import `isOpenNow`, compute status, render the badge next to the existing hours line.
- **Modify:** `components/SpotModal.js` — import `Share2`/`Check` icons, add `copied` state and a `handleShare` function, add the share button to both the desktop and mobile header chrome.

---

### Task 1: `lib/hours.js` — open/closed time-window logic

**Files:**
- Create: `lib/hours.js`
- Test: throwaway Node script (not committed — see Global Constraints)

**Interfaces:**
- Produces: `isOpenNow(openHours: { open: string, close: string, closedDays?: number[] } | undefined, now?: Date) => boolean | null`
  - `open`/`close` are `"HH:MM"` 24-hour strings, evaluated in `Asia/Manila`.
  - `closedDays`: weekday indices, `0` = Sunday … `6` = Saturday.
  - Returns `null` when `openHours` is falsy (no data → no badge).
  - Interval is half-open: `open` is inclusive, `close` is exclusive.

- [ ] **Step 1: Write `lib/hours.js`**

```js
// "Open now" is evaluated in Asia/Manila regardless of the visitor's own
// timezone — the spot is in Bulacan, and someone browsing from abroad
// still needs "open now" to mean open now *there*, not wherever their
// device's clock is set.
const MANILA_TZ = "Asia/Manila";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function manilaParts(date) {
  // hourCycle: "h23" avoids the well-known Intl quirk where hour12:false
  // can still yield "24" for midnight in some environments.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MANILA_TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const weekdayShort = parts.find((p) => p.type === "weekday").value;
  const hour = parts.find((p) => p.type === "hour").value;
  const minute = parts.find((p) => p.type === "minute").value;

  return {
    weekday: WEEKDAYS.indexOf(weekdayShort),
    hhmm: `${hour}:${minute}`,
  };
}

export function isOpenNow(openHours, now = new Date()) {
  if (!openHours) return null;
  const { open, close, closedDays = [] } = openHours;
  const { weekday, hhmm } = manilaParts(now);
  if (closedDays.includes(weekday)) return false;
  // "HH:MM" strings zero-padded to the same length compare correctly as
  // plain strings — no need to parse into minutes.
  return hhmm >= open && hhmm < close;
}
```

- [ ] **Step 2: Write and run a throwaway verification script**

Create a temporary file `_check-hours.mjs` in the project root (same folder as `lib/`) with:

```js
import { isOpenNow } from "./lib/hours.js";
import assert from "node:assert/strict";

// Manila is UTC+8 with no DST, so a UTC timestamp at hour 04:00 is always
// noon in Manila on the same calendar day — this lets the script find a
// UTC weekday that's guaranteed to equal the Manila weekday, without
// relying on hand-checked calendar facts.
function manilaNoonOnWeekday(targetWeekday) {
  const d = new Date(Date.UTC(2026, 0, 1, 4, 0));
  while (d.getUTCDay() !== targetWeekday) d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

function atManilaTime(noonDate, hh, mm) {
  const d = new Date(noonDate);
  d.setUTCHours(hh - 8, mm, 0, 0); // Manila = UTC + 8h, so UTC hour = Manila hour - 8
  return d;
}

const monday = manilaNoonOnWeekday(1);
const tuesday = manilaNoonOnWeekday(2);
const sunday = manilaNoonOnWeekday(0);

const padrePio = { open: "06:00", close: "17:00", closedDays: [1] };
const grotto = { open: "05:00", close: "20:00" };

assert.equal(isOpenNow(padrePio, atManilaTime(monday, 10, 0)), false, "closed all day Monday (closedDays)");
assert.equal(isOpenNow(padrePio, atManilaTime(tuesday, 10, 0)), true, "open Tuesday mid-window");
assert.equal(isOpenNow(padrePio, atManilaTime(tuesday, 18, 0)), false, "closed Tuesday after close");
assert.equal(isOpenNow(padrePio, atManilaTime(tuesday, 5, 0)), false, "closed Tuesday before open");
assert.equal(isOpenNow(padrePio, atManilaTime(tuesday, 6, 0)), true, "open exactly at open time (inclusive)");
assert.equal(isOpenNow(padrePio, atManilaTime(tuesday, 17, 0)), false, "closed exactly at close time (exclusive)");
assert.equal(isOpenNow(grotto, atManilaTime(sunday, 12, 0)), true, "open-daily spot open on Sunday too");
assert.equal(isOpenNow(undefined, atManilaTime(tuesday, 10, 0)), null, "no openHours -> null");

console.log("All isOpenNow assertions passed");
```

Run: `node _check-hours.mjs`

Expected output: `All isOpenNow assertions passed`

If any assertion throws, fix `lib/hours.js` (not the script) and re-run until it passes.

- [ ] **Step 3: Delete the throwaway script**

```bash
rm _check-hours.mjs
```

- [ ] **Step 4: Lint and commit**

```bash
npx eslint lib/hours.js
git add lib/hours.js
git commit -m "Add isOpenNow time-window helper for the open/closed badge"
```

---

### Task 2: `data/spots.js` — add `openHours` to all 6 spots

**Files:**
- Modify: `data/spots.js`

**Interfaces:**
- Consumes: none (data-only change).
- Produces: `spot.openHours` on all 6 spot objects, matching the shape `lib/hours.js` (Task 1) expects.

- [ ] **Step 1: Add `openHours` next to each spot's existing `hours` field**

Grotto (`id: "grotto"`) — add immediately after its `hours` line:

```js
    hours: { en: "Open daily", tl: "Bukas araw-araw" },
    openHours: { open: "05:00", close: "20:00" },
```

Padre Pio (`id: "padrepio"`) — add immediately after its `hours` block:

```js
    hours: {
      en: "Tue–Sun, 6 AM–5 PM (closed Mondays)",
      tl: "Martes–Linggo, 6 AM–5 PM (sarado tuwing Lunes)",
    },
    openHours: { open: "06:00", close: "17:00", closedDays: [1] },
```

Mt. Balagbag (`id: "balagbag"`) — add immediately after its `hours` block:

```js
    hours: {
      en: "Daytime trekking recommended",
      tl: "Inirerekomenda ang pag-a-trek sa maghapon",
    },
    openHours: { open: "06:00", close: "17:00" },
```

Kaytitinga Falls (`id: "kaytitinga"`) — add immediately after its `hours` line:

```js
    hours: { en: "Daytime only", tl: "Sa maghapon lamang" },
    openHours: { open: "07:00", close: "16:00" },
```

Tungkong Mangga (`id: "tungkongmangga"`) — add immediately after its `hours` line:

```js
    hours: { en: "Varies by activity", tl: "Depende sa aktibidad" },
    openHours: { open: "07:00", close: "18:00" },
```

Cattle Creek (`id: "cattlecreek"`) — add immediately after its `hours` line:

```js
    hours: { en: "6 AM–5 PM daily", tl: "6 AM–5 PM araw-araw" },
    openHours: { open: "06:00", close: "17:00" },
```

- [ ] **Step 2: Verify all 6 spots got the field**

```bash
grep -c "openHours:" data/spots.js
```

Expected output: `6`

- [ ] **Step 3: Lint, build, and commit**

```bash
npx eslint data/spots.js
npm run build
git add data/spots.js
git commit -m "Add structured openHours to all 6 spots"
```

---

### Task 3: `lib/i18n.js` — new translation keys

**Files:**
- Modify: `lib/i18n.js`

**Interfaces:**
- Produces: `t("status.open")`, `t("status.closed")`, `t("share.button")`, `t("share.copied")` — resolvable in both `en` and `tl`.

- [ ] **Step 1: Add the four keys to the `en` dictionary**

In the `en` object, add near the existing `spot.*` keys (after `"spot.website": "Visit website",`):

```js
    "status.open": "Open now",
    "status.closed": "Closed now",

    "share.button": "Share",
    "share.copied": "Link copied!",
```

- [ ] **Step 2: Add the same four keys to the `tl` dictionary**

In the `tl` object, add in the equivalent position (after `"spot.website": "Bisitahin ang website",`):

```js
    "status.open": "Bukas ngayon",
    "status.closed": "Sarado ngayon",

    "share.button": "Ibahagi",
    "share.copied": "Nakopya ang link!",
```

- [ ] **Step 3: Lint, build, and commit**

```bash
npx eslint lib/i18n.js
npm run build
git add lib/i18n.js
git commit -m "Add status/share translation keys (en, tl)"
```

---

### Task 4: `components/SpotDetailCard.js` — render the badge

**Files:**
- Modify: `components/SpotDetailCard.js`

**Interfaces:**
- Consumes: `isOpenNow` from `lib/hours.js` (Task 1), `spot.openHours` from `data/spots.js` (Task 2), `t("status.open")`/`t("status.closed")` from `lib/i18n.js` (Task 3).

- [ ] **Step 1: Import `isOpenNow`**

At the top of `components/SpotDetailCard.js`, add to the existing imports (after the `formatDistance` import):

```js
import { isOpenNow } from "@/lib/hours";
```

- [ ] **Step 2: Compute the status inside the component**

Inside `export default function SpotDetailCard({ spot, titleId, distanceKm }) {`, right after the existing `const Icon = spotIcon(spot);` line, add:

```js
  const openStatus = isOpenNow(spot.openHours);
```

- [ ] **Step 3: Render the badge next to the hours line**

Find this existing block:

```jsx
              <p className="flex items-center gap-1.5 font-mono text-xs text-ink/70">
                <Clock size={14} aria-hidden="true" />
                {text(spot.hours)}
              </p>
```

Replace it with:

```jsx
              <p className="flex items-center gap-1.5 font-mono text-xs text-ink/70">
                <Clock size={14} aria-hidden="true" />
                {text(spot.hours)}
                {openStatus != null && (
                  <span
                    className={`ml-1 flex items-center gap-1 ${openStatus ? "" : "text-ink/60"}`}
                    style={openStatus ? { color: CATEGORIES.nature.accent } : undefined}
                  >
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor: openStatus ? CATEGORIES.nature.accent : "currentColor",
                      }}
                    />
                    {openStatus ? t("status.open") : t("status.closed")}
                  </span>
                )}
              </p>
```

(`CATEGORIES` is already imported in this file — no new import needed for it.)

- [ ] **Step 4: Lint and build**

```bash
npx eslint components/SpotDetailCard.js
npm run build
```

- [ ] **Step 5: Manual check in the browser**

```bash
npm run dev -- --port 3020
```

Open `http://localhost:3020/?spot=padrepio` and `http://localhost:3020/?spot=grotto` — both should show a badge next to the hours line (green dot + "Open now", or muted dot + "Closed now", depending on the real current time in Manila). Stop the dev server (Ctrl+C or kill the background process) when done.

- [ ] **Step 6: Commit**

```bash
git add components/SpotDetailCard.js
git commit -m "Show open/closed badge on spot detail card"
```

---

### Task 5: `components/SpotModal.js` — share button

**Files:**
- Modify: `components/SpotModal.js`

**Interfaces:**
- Consumes: `t("share.button")`/`t("share.copied")` from `lib/i18n.js` (Task 3), `text(spot.name)` (already available via `useLocale()` in this file).
- Produces: nothing consumed elsewhere — self-contained UI addition.

- [ ] **Step 1: Add the new icon imports**

Change:

```js
import { ArrowLeft, X } from "lucide-react";
```

to:

```js
import { ArrowLeft, Check, Share2, X } from "lucide-react";
```

- [ ] **Step 2: Add `copied` state**

Inside `export default function SpotModal({ spot, onClose, distanceKm }) {`, right after the existing `const panelRef = useRef(null);` line, add:

```js
  const [copied, setCopied] = useState(false);
```

- [ ] **Step 3: Add the share handler**

Right after the `titleId` line (`const titleId = spot ? ... : undefined;`), add:

```js
  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: text(spot.name), url });
      } catch (e) {
        if (e.name !== "AbortError") throw e; // user closing the native share sheet isn't an error
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
```

- [ ] **Step 4: Add the desktop share button**

Find this existing block:

```jsx
            <button
              type="button"
              onClick={onClose}
              aria-label={t("modal.close")}
              className="absolute right-3 top-3 z-10 hidden h-8 w-8 items-center justify-center rounded-full bg-ink/5 text-ink/70 transition-colors hover:bg-ink/10 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:flex"
            >
              <X size={16} aria-hidden="true" />
            </button>
```

Add the share button immediately before it (so it sits to the left of the close button):

```jsx
            <button
              type="button"
              onClick={handleShare}
              aria-label={copied ? t("share.copied") : t("share.button")}
              className="absolute right-14 top-3 z-10 hidden h-8 w-8 items-center justify-center rounded-full bg-ink/5 text-ink/70 transition-colors hover:bg-ink/10 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:flex"
            >
              {copied ? (
                <Check size={16} aria-hidden="true" />
              ) : (
                <Share2 size={16} aria-hidden="true" />
              )}
            </button>
```

- [ ] **Step 5: Add the mobile share button**

Find this existing block:

```jsx
              <span
                aria-hidden="true"
                className="truncate font-mono text-xs uppercase tracking-widest text-ink/70"
              >
                {text(spot.name)}
              </span>
```

Replace it with (adds `min-w-0 flex-1` so the name still truncates correctly now that a sibling button follows it, and adds the share button after):

```jsx
              <span
                aria-hidden="true"
                className="min-w-0 flex-1 truncate font-mono text-xs uppercase tracking-widest text-ink/70"
              >
                {text(spot.name)}
              </span>
              <button
                type="button"
                onClick={handleShare}
                aria-label={copied ? t("share.copied") : t("share.button")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                {copied ? (
                  <Check size={18} aria-hidden="true" />
                ) : (
                  <Share2 size={18} aria-hidden="true" />
                )}
              </button>
```

- [ ] **Step 6: Lint and build**

```bash
npx eslint components/SpotModal.js
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add components/SpotModal.js
git commit -m "Add share button to spot modal (native share + clipboard fallback)"
```

---

### Task 6: End-to-end verification (Playwright, this project's established pattern)

**Files:** none (verification only, no commits expected unless it surfaces a bug to fix)

**Interfaces:**
- Consumes: the running production build (Tasks 1–5 complete).

- [ ] **Step 1: Build and start a production server**

```bash
npm run build
npm run start -- --port 3021 &
```

Wait for `Ready in` in the output before continuing.

- [ ] **Step 2: Write and run a Playwright check**

Use `playwright-core` exactly as this project's `verify` skill (`.claude/skills/verify/SKILL.md`) already does elsewhere in this codebase — install `playwright-core` in a scratch directory (not the repo) if not already present, and launch with `chromium.launch({ channel: "chrome", headless: true })`.

Check, against `http://localhost:3021`:

1. `?spot=padrepio` — the modal shows a badge. Confirm its text is exactly `t("status.open")` or `t("status.closed")` (i.e. "Open now" or "Closed now" in English) — never a raw i18n key.
2. `?spot=tungkongmangga` — same check (a spot with an estimated, not confirmed, `openHours` — should still render, since the UI doesn't distinguish them).
3. Share button, `navigator.share` present (stub it: `page.addInitScript(() => { window.navigator.share = (data) => { window.__sharedWith = data; return Promise.resolve(); } })` before `goto`): click the share button, then assert `window.__sharedWith` was called with `{ title, url }` where `url` contains `?spot=`.
4. Share button, `navigator.share` absent (stub it to `undefined` the same way, or run in a context that doesn't define it): click the share button, assert `navigator.clipboard.readText()` (grant `clipboard-read`/`clipboard-write` permissions on the context) returns the current page URL, and that the button's accessible name/icon changes to the "copied" state immediately after the click.
5. No `pageerror` events fired during any of the above (attach the listener before `goto`, per this project's own `verify` skill guidance).

- [ ] **Step 3: Stop the production server**

Find and kill the process started in Step 1 (check `netstat`/`Get-Process` for the port-3021 listener, as done earlier in this project's sessions — don't kill any other dev server that might already be running on a different port).

- [ ] **Step 4: If Step 2 surfaced a real bug, fix it and repeat from Step 1 of the relevant earlier task** (Task 1 for badge logic, Task 4 for badge rendering, Task 5 for share button) — then re-run this task's Step 2 before considering the plan complete.

---

## Self-Review Notes

- **Spec coverage:** data model (Task 2) ✓, `lib/hours.js` logic incl. Manila timezone (Task 1) ✓, badge UI incl. color choice from spec's self-review clarification (Task 4) ✓, share button placement + behavior incl. `AbortError` handling (Task 5) ✓, new i18n keys for both features (Task 3) ✓, end-to-end verification per the spec's "Testing / verification" section (Task 6) ✓. Grid-tile badge and live-polling are explicitly out of scope per the spec — no task implements them, correctly.
- **Type consistency:** `isOpenNow(openHours, now)` signature (Task 1) matches every call site (`isOpenNow(spot.openHours)` in Task 4, `isOpenNow(padrePio, atManilaTime(...))` in Task 1's own script). `openHours` shape (`{ open, close, closedDays? }`) is identical between Task 1's JSDoc-equivalent interface comment, Task 2's data, and Task 1's test fixtures.
- **No placeholders:** every step above has literal, complete code — no "TODO"/"similar to Task N"/"add error handling" left unexpanded.
