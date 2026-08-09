# Feedback Form Photo Attachments Implementation Plan

> **Superseded (2026-08-09).** Built on the design spec's now-disproved
> assumption that Web3Forms' free plan carries real file attachments —
> `attachment` turned out to be a **PRO-subscription-only feature**. Photos
> now upload browser-direct to a Supabase Storage bucket (`feedback-photos`)
> and travel as links in the Web3Forms `photos` field instead. See
> `supabase/schema.sql` and `components/home/FeedbackForm.tsx` for what
> actually shipped. Do not execute the plan below.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let visitors attach up to 3 optional photos to the feedback form, sent to the City Tourism Office through the existing keyless Web3Forms integration.

**Architecture:** `components/home/FeedbackForm.tsx` switches its Web3Forms submission from a JSON body to a `multipart/form-data` `FormData` body (required for Web3Forms to accept real file attachments), appending each picked file under a repeated `attachment` field. A new `photos: { file: File; url: string }[]` state array drives a file input + thumbnail-preview strip, with client-side validation (image-only, ≤5MB each, ≤3 total) and object-URL cleanup.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind utility classes + the project's existing `fb-*` CSS classes in `app/globals.css`. No new dependencies.

## Global Constraints

- No new backend, API route, or storage service — photos ride in the same client-side `fetch` to `https://api.web3forms.com/submit` that the form already uses.
- Max **3** photos per submission; max **5MB** (`5 * 1024 * 1024` bytes) per file; images only (`file.type.startsWith("image/")`).
- All new user-facing copy goes through `lib/i18n.ts` (`t("...")`) — no hardcoded strings in JSX, matching every other string in this file.
- Reuse the existing `fb-field` / `fb-panel` / `fb-submit` visual language (see `app/globals.css:857-890`) rather than inventing a new visual style for the photo control.
- This repo has no automated test framework (confirmed by the `verify` skill) — verification per task is `npm run build` (type-check + production build) and, for the final task, a manual Playwright pass against system Chrome per the `verify` skill. Do not add `playwright` (or any test framework) as a project dependency.
- Design spec: `docs/superpowers/specs/2026-07-27-feedback-photo-attachments-design.md`.

---

## File Structure

- **Modify `lib/i18n.ts`** — add 5 new `feedback.photos.*` keys to the existing flat `UI` dictionary.
- **Modify `app/globals.css`** — add a `.fb-field-file` rule (styles the native `::file-selector-button`) next to the existing `.fb-field` block.
- **Modify `components/home/FeedbackForm.tsx`** — add `photos` state, selection/validation/removal handlers, the file input + thumbnail JSX, and switch `handleSubmit`'s network call to multipart `FormData`.

No new files — this is a single component with a small, cohesive addition; splitting it into a separate sub-component would add an interface boundary this component doesn't need (the photo state and the submit logic are tightly coupled, since photos are appended into the same `FormData` as the text fields at submit time).

---

## Task 1: i18n strings for the photo field

**Files:**
- Modify: `lib/i18n.ts:136` (right after the existing `"feedback.config"` line, before the closing `} as const;` of the `feedback.*` block — check the current file for the exact last `feedback.*` key, since other work may have touched this file since this plan was written)

**Interfaces:**
- Produces: five new `UIKey` string literals — `"feedback.photos"`, `"feedback.photos.remove"`, `"feedback.photos.errorType"`, `"feedback.photos.errorSize"`, `"feedback.photos.errorCount"` — consumed by Task 3.

- [ ] **Step 1: Add the new keys**

Open `lib/i18n.ts` and find the existing feedback block:

```ts
  "feedback.config": "Feedback isn't configured yet. Add your Web3Forms key to enable it.",
```

Add these five lines immediately after it (still inside the `UI` object, before its closing brace):

```ts
  "feedback.photos": "Photos (optional)",
  "feedback.photos.remove": "Remove photo",
  "feedback.photos.errorType": "Only image files can be attached.",
  "feedback.photos.errorSize": "Photos must be under 5MB.",
  "feedback.photos.errorCount": "Up to 3 photos.",
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: build succeeds (this only adds dictionary entries — nothing consumes them yet, so nothing can fail beyond a syntax error).

- [ ] **Step 3: Commit**

```bash
git add lib/i18n.ts
git commit -m "Add i18n strings for feedback photo attachments"
```

---

## Task 2: File-input styling

**Files:**
- Modify: `app/globals.css` (add after the existing `.fb-field:focus` rule, currently at `app/globals.css:880-884`)

**Interfaces:**
- Produces: a `.fb-field-file` CSS class, consumed by Task 3's JSX (applied alongside the existing `.fb-field` class on the new `<input type="file">`).

- [ ] **Step 1: Add the CSS**

Find this existing block:

```css
.fb-field:focus {
  outline: none;
  border-color: var(--teal);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--teal) 22%, transparent);
}
```

Add immediately after it:

```css
/* Native file inputs don't take the same padding/border treatment as text
   inputs — .fb-field still gives the control's own box the right paper/line
   look, and this styles the browser-drawn "choose files" button inside it
   to match the app's teal accent instead of the OS default. */
.fb-field-file::file-selector-button {
  margin-right: 12px;
  border: none;
  border-radius: 8px;
  padding: 7px 12px;
  background: var(--teal);
  color: white;
  font: inherit;
  font-size: 12.5px;
  cursor: pointer;
  transition: opacity 0.15s;
}
.fb-field-file::file-selector-button:hover {
  opacity: 0.9;
}
.fb-field-file:disabled::file-selector-button {
  cursor: default;
  opacity: 0.6;
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: build succeeds (pure CSS addition, unused until Task 3 wires up the input).

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "Add file-input styling for feedback photo attachments"
```

---

## Task 3: Photo picker UI (state, validation, thumbnails — no submission wiring yet)

**Files:**
- Modify: `components/home/FeedbackForm.tsx`

**Interfaces:**
- Consumes: `t("feedback.photos" | "feedback.photos.remove" | "feedback.photos.errorType" | "feedback.photos.errorSize" | "feedback.photos.errorCount")` from Task 1; `.fb-field-file` CSS class from Task 2.
- Produces: `photos` state (`{ file: File; url: string }[]`) and a `clearPhotos()` function — both consumed by Task 4's `handleSubmit` rewrite.

- [ ] **Step 1: Add imports and constants**

At the top of `components/home/FeedbackForm.tsx`, change:

```tsx
import { useState, type FormEvent } from "react";
```

to:

```tsx
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
```

Below the existing `const ACCESS_KEY = ...` line, add:

```tsx
const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

type Photo = { file: File; url: string };
```

- [ ] **Step 2: Add photo state and handlers inside the component**

Inside `export default function FeedbackForm() {`, right after the existing:

```tsx
  const [status, setStatus] = useState<Status>("idle");
```

add:

```tsx
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
```

Then, after the `configured` line and before `handleSubmit`, add:

```tsx
  // Object URLs are only valid for the life of this component — revoke
  // every outstanding one on unmount so the browser can free the memory.
  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearPhotos() {
    setPhotos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return [];
    });
  }

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = ""; // let the same file be re-picked later if removed
    if (picked.length === 0) return;

    if (picked.some((f) => !f.type.startsWith("image/"))) {
      setPhotoError(t("feedback.photos.errorType"));
      return;
    }
    if (picked.some((f) => f.size > MAX_PHOTO_BYTES)) {
      setPhotoError(t("feedback.photos.errorSize"));
      return;
    }

    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setPhotoError(t("feedback.photos.errorCount"));
      return;
    }

    const accepted = picked.slice(0, room);
    setPhotoError(accepted.length < picked.length ? t("feedback.photos.errorCount") : null);
    setPhotos((prev) => [
      ...prev,
      ...accepted.map((file) => ({ file, url: URL.createObjectURL(file) })),
    ]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== index);
    });
  }
```

- [ ] **Step 3: Add the JSX — file input, error, and thumbnail strip**

In the returned JSX, find the message field block:

```tsx
          <label className="flex flex-col gap-1.5 font-mono text-[10.5px] uppercase tracking-widest text-ink/65">
            {t("feedback.message")}
            <textarea
              name="message"
              rows={4}
              required
              disabled={status === "success"}
              placeholder={t("feedback.message.placeholder")}
              className="fb-field resize-y rounded-xl px-3.5 py-3 font-sans text-[15px] normal-case tracking-normal text-ink placeholder:text-ink/40"
            />
          </label>
```

Immediately after that `</label>` and before the `<div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">` submit row, insert:

```tsx
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1.5 font-mono text-[10.5px] uppercase tracking-widest text-ink/65">
              {t("feedback.photos")}
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={status === "success"}
                onChange={handlePhotoChange}
                className="fb-field fb-field-file rounded-xl px-3.5 py-2.5 font-sans text-[13px] normal-case tracking-normal text-ink/70"
              />
            </label>

            {photoError ? (
              <p className="text-[12.5px]" style={{ color: "var(--cat-leisure-accent)" }}>
                {photoError}
              </p>
            ) : null}

            {photos.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {photos.map((p, i) => (
                  <li
                    key={p.url}
                    className="relative h-14 w-14 overflow-hidden rounded-lg border border-line"
                  >
                    <Image src={p.url} alt="" fill unoptimized sizes="56px" className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      disabled={status === "success"}
                      aria-label={t("feedback.photos.remove")}
                      className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink/70 text-[10px] leading-none text-white"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
```

Add the `Image` import at the top of the file (needed for the thumbnail above — this codebase always uses `next/image`, never a raw `<img>`, per every other photo-rendering component such as `components/spot/SpotPhotoStrip.tsx`):

```tsx
import Image from "next/image";
```

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: build succeeds with no type errors. (`handleSubmit` still sends the old JSON body without photos at this point — that's fixed in Task 4. This task only needs to compile and render correctly.)

- [ ] **Step 5: Commit**

```bash
git add components/home/FeedbackForm.tsx
git commit -m "Add photo picker UI to feedback form"
```

---

## Task 4: Submit photos with the form (multipart Web3Forms submission)

**Files:**
- Modify: `components/home/FeedbackForm.tsx:26-64` (the `handleSubmit` function from Task 3's file)

**Interfaces:**
- Consumes: `photos` state and `clearPhotos()` from Task 3.
- Produces: none (this is the leaf task — `handleSubmit` is not called by anything else in this file beyond the `<form onSubmit={...}>` wiring, which already exists).

- [ ] **Step 1: Replace the JSON submission with multipart FormData**

Replace the current `handleSubmit` body:

```tsx
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!configured || status === "sending") return;

    const form = e.currentTarget;
    const data = new FormData(form);
    // Honeypot: a real person never fills this hidden field. If it's set,
    // treat the submit as a bot and drop it while showing "success".
    if (data.get("botcheck")) {
      setStatus("success");
      form.reset();
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: "New ExploQR SJDM feedback",
          from_name: "ExploQR SJDM",
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }
```

with:

```tsx
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!configured || status === "sending") return;

    const form = e.currentTarget;
    const data = new FormData(form);
    // Honeypot: a real person never fills this hidden field. If it's set,
    // treat the submit as a bot and drop it while showing "success".
    if (data.get("botcheck")) {
      setStatus("success");
      form.reset();
      clearPhotos();
      return;
    }

    // Web3Forms only accepts real file attachments over multipart/form-data
    // (its JSON endpoint has no attachment support), so this always submits
    // as FormData — whether or not photos are attached — rather than
    // branching between two request shapes.
    const body = new FormData();
    body.append("access_key", ACCESS_KEY ?? "");
    body.append("subject", "New ExploQR SJDM feedback");
    body.append("from_name", "ExploQR SJDM");
    body.append("name", String(data.get("name") ?? ""));
    body.append("email", String(data.get("email") ?? ""));
    body.append("message", String(data.get("message") ?? ""));
    photos.forEach((p) => body.append("attachment", p.file, p.file.name));

    setStatus("sending");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        // No Content-Type header: the browser sets the correct
        // multipart/form-data boundary automatically for a FormData body.
        headers: { Accept: "application/json" },
        body,
      });
      const json = await res.json();
      if (json.success) {
        setStatus("success");
        form.reset();
        clearPhotos();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: build succeeds with no type errors.

- [ ] **Step 3: Commit**

```bash
git add components/home/FeedbackForm.tsx
git commit -m "Submit feedback photos to Web3Forms as multipart attachments"
```

---

## Task 5: End-to-end verification

**Files:** none (verification only — no code changes)

**Interfaces:** none

This task exercises every behavior from the design spec's Testing section against the real running app. Do **not** let a real submission reach Web3Forms during this pass — intercept the network request so no test email is sent to the actual City Tourism Office inbox.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` (background)
Expected: server comes up (check the port it prints, e.g. `http://localhost:3000` or the project's usual `3010` if that's still configured).

- [ ] **Step 2: Drive the form with Playwright (ad hoc script, not a committed test file)**

Use the `verify` skill's browser-driving approach (matching how prior work in this repo verified the search feature — an ad hoc Playwright script via `playwright-core`, not a project dependency) to check, in order:

1. Load the home page, scroll to the feedback form.
2. Pick 2 valid small JPEG/PNG files via the file input → confirm 2 thumbnails render, no error message shown.
3. Pick 1 more valid file → confirm 3rd thumbnail renders (now at the `MAX_PHOTOS` cap).
4. Attempt to pick a 4th file → confirm the `feedback.photos.errorCount` message ("Up to 3 photos.") appears and the thumbnail strip still shows only 3.
5. Click a thumbnail's "×" button → confirm that thumbnail disappears and the count drops to 2, and no console errors/warnings appear (confirms `URL.revokeObjectURL` didn't throw).
6. Pick a non-image file (e.g. a `.txt`) → confirm the `feedback.photos.errorType` message appears and no new thumbnail is added.
7. Pick a >5MB image (generate a throwaway oversized PNG for the test, e.g. via a quick Node script writing random bytes with a `.png` name) → confirm the `feedback.photos.errorSize` message appears and no new thumbnail is added.
8. Intercept `POST https://api.web3forms.com/submit` (Playwright route interception) to fulfill with `{"success": true}` instead of hitting the real API. Fill name/email/message, keep the 2 remaining photos attached, submit. Confirm: the intercepted request's `Content-Type` header starts with `multipart/form-data`, the request body includes 2 `attachment` parts, and the UI shows the existing success state (`"Sent ✓"` / `feedback.success` text).
9. Confirm the thumbnail strip is empty after the success state (i.e., `clearPhotos()` ran).

- [ ] **Step 3: Fix any issues found, re-run Task 3/4's build check, and re-verify**

If any check in Step 2 fails, fix the relevant code from Task 3 or 4, re-run `npm run build`, and repeat only the failing checks from Step 2.

- [ ] **Step 4: Run project-wide lint**

Run: `npm run lint`
Expected: no new lint errors from the changed files.

- [ ] **Step 5: Report results — no commit needed**

This task is verification only; Tasks 1–4 already committed the actual changes. Summarize the Step 2 results (pass/fail per check) instead of committing.
