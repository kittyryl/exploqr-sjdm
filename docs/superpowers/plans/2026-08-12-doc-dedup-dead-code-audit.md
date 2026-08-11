# Doc Dedup & Dead-Code Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cross-reference two under-linked doc sections, fix a stale self-contradiction in README.md, and produce a reviewed dead-code report via `knip`.

**Architecture:** Two independent, non-code doc edits to existing files, followed by a read-only CLI audit. No application code, build config, or runtime behavior changes anywhere in this plan.

**Tech Stack:** Markdown docs; `knip` (via `npx`, not installed as a dependency) for the dead-code pass.

## Global Constraints

- Do not delete or rewrite any existing testing-procedure content in `.claude/skills/verify/SKILL.md` — every item in its "Flows worth driving" list is already correctly scoped to testing steps only (see spec's Correction section). Only *add* one-line pointers.
- Do not add `knip` to `package.json` — this is a one-off audit via `npx knip`, per user decision.
- Do not delete any file or export knip flags — this plan produces a reviewed report only; deletions are a separate, future decision.

---

### Task 1: Cross-reference links + Positron/Voyager fix

**Files:**
- Modify: `C:\projects\ExploQR\.claude\skills\verify\SKILL.md:45` (item 11, PWA/offline)
- Modify: `C:\projects\ExploQR\.claude\skills\verify\SKILL.md:49` (item 14, Dark mode)
- Modify: `C:\projects\ExploQR\README.md:10` (Stack section, basemap name)

**Interfaces:** None — pure prose edits, no code, no build step, nothing downstream depends on exact wording.

- [x] **Step 1: Add the PWA/offline pointer**

In `.claude/skills/verify/SKILL.md`, item 11 currently starts:

```
11. PWA/offline (run against `npm run start`, not `next dev` — the service worker only registers when `NODE_ENV=production`): load `/` once, check ...
```

Change the start of that line to prepend the pointer, keeping everything after `next dev`) unchanged:

```
11. PWA/offline (see README.md § Offline / installable for what this caches and why; run against `npm run start`, not `next dev` — the service worker only registers when `NODE_ENV=production`): load `/` once, check ...
```

- [x] **Step 2: Add the dark-mode pointer**

In the same file, item 14 currently starts:

```
14. Dark mode: spawn a context with `colorScheme: "dark"`. `document.body` background must be `rgb(20, 25, 23)`; ...
```

Change the start of that line to:

```
14. Dark mode (see README.md § Theming for why these are the constants): spawn a context with `colorScheme: "dark"`. `document.body` background must be `rgb(20, 25, 23)`; ...
```

- [x] **Step 3: Fix the Positron/Voyager contradiction**

In `README.md`, line 10 currently reads:

```
- [react-leaflet](https://react-leaflet.js.org) + Leaflet with free [CARTO Positron](https://carto.com/basemaps) tiles (no API key)
```

Change `CARTO Positron` to `CARTO Voyager` (keep the same link and the rest of the line unchanged):

```
- [react-leaflet](https://react-leaflet.js.org) + Leaflet with free [CARTO Voyager](https://carto.com/basemaps) tiles (no API key)
```

This makes it agree with the dedicated "The basemap" section (README.md, around line 90-94), which already correctly describes Voyager and explains why Positron was rejected.

- [x] **Step 4: Review the diff**

Run: `git diff .claude/skills/verify/SKILL.md README.md`

Expected: exactly three changed lines (two in SKILL.md, one in README.md), each a single-phrase insertion/word-swap — no other content touched, no lines removed.

- [x] **Step 5: Commit**

```bash
git add .claude/skills/verify/SKILL.md README.md
git commit -m "$(cat <<'EOF'
Cross-reference verify skill test items to README, fix stale basemap name

verify/SKILL.md's PWA/offline and dark-mode test items asserted specific
values with no pointer to the README sections explaining why those are
the right values. Also fixes README's Stack section still naming CARTO
Positron when the dedicated basemap section (and the actual code) uses
Voyager.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Dead-code audit with knip

**Files:**
- Read-only: entire repo (knip scans the whole project)
- Create (optional, for the record): none required — findings are reported in chat, not written to a file, unless Task 2 Step 3 turns up enough volume to warrant it

**Interfaces:** None — this task produces a report for human review, not code changes.

- [x] **Step 1: Run knip**

```bash
npx knip
```

Expected: knip runs (first invocation may take ~30-60s to fetch), then prints a report grouped by category — typically "Unused files", "Unused dependencies", "Unused exports", "Unused exported types", etc.

If knip errors because it can't find a config and refuses to guess (unlikely for a standard Next.js App Router layout, but possible), run `npx knip --include files,dependencies,exports` to scope it to the safe default checks instead of debugging a custom config — a custom `knip.json` is out of scope for this plan.

- [x] **Step 2: Filter known false-positive categories before presenting results**

Cross off any finding that falls into these buckets before reporting anything as an actual candidate for removal — these are structurally expected to show up in a Next.js App Router project and are not real dead code:

- Anything under `app/` matching Next.js special-file conventions: `page.tsx`, `layout.tsx`, `route.ts`, `manifest.ts`, `opengraph-image.tsx`, `icon.tsx`, `apple-icon.tsx`, `not-found.tsx`, `error.tsx`, `loading.tsx` — these are called by the framework via file-path convention, not by import, so knip's import-graph analysis can't see their usage.
- Anything under `.claude/`, `docs/`, `graphify-out/`, `scripts/` — these aren't part of the app bundle knip should be judging for "unused" in a shipped-code sense.
- `next.config.mjs`, `postcss.config.mjs`, `eslint.config.mjs` and similar tool-config entry points — read by their respective tools directly, not imported.

- [x] **Step 3: Present the filtered findings**

List what's left after filtering, grouped the same way knip grouped them (unused files / unused dependencies / unused exports), each with its file path. Do not delete or modify anything based on this list — it's the deliverable of this task. A follow-up decision (separate from this plan) determines what's actually safe to remove.

- [x] **Step 4: No commit for this task**

Nothing changes on disk from Task 2 — skip the commit step. If Step 3's findings are extensive enough that the user wants them preserved, offer to write them to `docs/superpowers/plans/2026-08-12-knip-findings.md` as a follow-up, but don't create that file unprompted.
