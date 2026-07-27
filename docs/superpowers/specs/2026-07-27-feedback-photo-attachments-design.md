# Feedback Form Photo Attachments Design

**Date:** 2026-07-27
**Status:** Approved

## Goal

Let visitors attach photos to the feedback form (`components/home/FeedbackForm.tsx`)
so a report like "this bench is broken" or "found an unlisted spot" can carry
visual proof, without adding any backend or storage service — the form stays
a direct, keyless-server submission to Web3Forms, the same architecture it
uses today.

## Non-goals

- No new backend, API route, or image storage/CDN. Photos ride along in the
  same Web3Forms submission as the rest of the message.
- No image compression/resizing pipeline — files are sent as-is, just
  size-capped client-side.
- No drag-and-drop upload zone — a standard file input is enough for this
  form's scale and audience.
- No gallery/lightbox for the picked photos before sending — small thumbnails
  are enough to confirm "yes, that's the right file."

## Approach

Web3Forms' JSON endpoint (what `handleSubmit` currently posts to) does not
carry real file attachments — only `multipart/form-data` does. So the
submission body changes from a hand-built JSON object to a `FormData`
instance, with each picked file appended under a repeated `attachment` field
(Web3Forms' documented convention for multiple files in one submission). The
`fetch` call keeps the same URL and `Accept: application/json` header, but
drops the `Content-Type: application/json` header — the browser sets the
correct multipart boundary header automatically when the body is `FormData`.
Text fields (`access_key`, `subject`, `from_name`, `name`, `email`,
`message`) move onto the same `FormData` object via `.append()`. This is a
single code path (used whether or not photos are attached) rather than
branching between JSON and FormData, keeping `handleSubmit` simple.

This preserves the existing "no server of our own" design documented in the
file's header comment — the public Web3Forms access key still rides in
`NEXT_PUBLIC_WEB3FORMS_KEY` and is inlined at build, exactly as today.

## UI & state

- **New state**: `photos: File[]` (component-local, alongside the existing
  `status` state), plus a small helper to generate/revoke `URL.createObjectURL`
  previews for each file (revoked on removal and on unmount, to avoid leaking
  object URLs).
- **New field**: below the message `<textarea>`, a labeled file input —
  `type="file"`, `accept="image/*"`, `multiple` — styled consistently with
  the existing `fb-field` inputs (reusing that class where it fits a file
  input, or a matching variant if the native file-picker chrome doesn't take
  the same treatment cleanly). Label text: "Photos (optional)".
- **Thumbnail strip**: once one or more files are picked, a row of small
  (~56px) rounded thumbnails appears under the input, each showing the
  object-URL preview and a small "×" remove button (`aria-label` via a new
  i18n string). Disabled/hidden once `status === "success"`, matching how the
  rest of the form locks after a successful send.
- **Selection logic** (`onChange` of the file input):
  1. Reject non-`image/*` files — show the existing inline error slot's
     styling with a new message, and drop the offending file(s) from the
     selection.
  2. Reject any file over **5MB** — same inline error treatment, dropped
     from selection.
  3. Cap the total at **3 photos** — if the user's new selection would push
     the count past 3, only the first N up to the cap are kept and an inline
     note explains the limit. Re-selecting the file input replaces that
     input's own pending selection each time (native file input behavior),
     so the cap check runs against `photos.length + newFiles.length`.
  4. Valid files are appended to `photos` and the file input is reset
     (`e.target.value = ""`) so the same file can be re-picked later if
     removed.
- **Errors are inline and non-blocking**: picking a bad file doesn't set the
  form's `status` to `"error"` (that stays reserved for submission failures)
  — it's a small transient message near the photo field, separate from the
  submit-row status text at the bottom of the form.
- **Submit button stays enabled/disabled exactly as today** — photo
  validity doesn't gate submission; only `configured`/`sending`/`success`
  do, same as now. A pending invalid-file message just means those files
  were never added to `photos` in the first place.
- **On successful submit**: `form.reset()` already clears the native inputs;
  additionally reset `photos` to `[]` and revoke any outstanding object URLs.
- **On failed submit**: photos are left as-is so the visitor doesn't have to
  re-pick them before retrying.

## i18n

New keys added to `lib/i18n.ts` next to the existing `feedback.*` block:

- `feedback.photos` — field label ("Photos (optional)")
- `feedback.photos.remove` — remove-thumbnail `aria-label` ("Remove photo")
- `feedback.photos.errorType` — "Only image files can be attached."
- `feedback.photos.errorSize` — "Photos must be under 5MB."
- `feedback.photos.errorCount` — "Up to 3 photos."

## Testing

No test framework in this repo (per the `verify` skill) — verification is
`npm run build`/`npm run lint` plus a Playwright pass against system Chrome:
pick 1–3 valid images and confirm thumbnails render and the submit succeeds
(mocking or inspecting the Web3Forms request to confirm it's multipart with
`attachment` fields present); attempt a non-image file and an oversized file
and confirm each is rejected with its inline message and never reaches
`photos` state; attempt a 4th photo and confirm the cap message appears and
the 4th file isn't added; remove a thumbnail and confirm its object URL is
revoked (no console warnings) and the slot disappears; submit successfully
and confirm `photos` clears along with the rest of the form.

## Open risks / decisions carried into the plan

- Web3Forms' actual attachment size/count ceiling on the free tier isn't
  independently verified in this repo — the 5MB/3-photo caps above are a
  reasonable client-side guard, but the plan should double check Web3Forms'
  current published limits before finalizing those numbers, and surface a
  clear `feedback.error`-style message if the API rejects a submission for
  exceeding a server-side limit we didn't anticipate.
- Styling the native file input to match `fb-field` may need a small
  wrapper (native file inputs don't fully respect arbitrary padding/border
  styling the same way text inputs do) — the plan should treat this as a
  small design-polish task, not assume a one-line class swap.
