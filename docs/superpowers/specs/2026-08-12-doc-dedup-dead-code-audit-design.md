# Doc Dedup & Dead-Code Audit — Design

## Context

A graphify knowledge-graph pass over the repo surfaced findings worth acting on. The original premise for item 1 below (that `verify/SKILL.md` re-describes features README already covers) did **not** survive reading the actual files — see "Correction" below. The scope here reflects what's actually true of the files, not the graph's synthetic node labels.

1. **Related-but-uncrossreferenced docs.** `.claude/skills/verify/SKILL.md`'s PWA/offline (item 11) and dark-mode (item 14) test flows assert specific values (`rgb(20, 25, 23)`, `navigator.serviceWorker.getRegistration()`) without explaining *why* those are the right values — that explanation only lives in `README.md`, and nothing links the two. This isn't duplication to prune, it's a missing cross-reference to add.
2. **Stale self-contradiction in README.** Line 10 (Stack section) says the basemap is CARTO Positron; the dedicated "The basemap" section (line 90+) says Voyager and explains at length why Positron was rejected. One of these is wrong — Voyager is current (matches `components/spot/SpotMap.tsx` and the graph). Line 10 is stale.
3. **Unverified dead-code signal.** The graph's "isolated node" report (158 nodes) turned out to be a structural-extraction artifact — TypeScript `Props`/response-type interfaces, internal constants, and same-file helper functions that AST extraction doesn't wire up with usage edges — not real dead code. A genuine unused-export/file audit needs a purpose-built tool instead.

Everything else the graph flagged (low-cohesion "communities") was ruled out during brainstorming as parsing artifacts (`package.json`/`tsconfig.json` field lists) or normal loosely-coupled component structure, not actionable refactor targets.

### Correction (post-brainstorm, pre-plan)

The original design assumed `verify/SKILL.md` re-describes the PWA/offline and theming *features* the way README does, and needed pruning down to just testing steps. Reading the actual file shows every item in its "Flows worth driving" list — including 11 and 14 — is **already** pure testing procedure (exact pixel values, API assertions, no architecture explanation). There was nothing to prune. The real, smaller opportunity is adding cross-reference links, plus the Positron/Voyager fix found along the way.

## Scope

**In scope:**
- Add one-line cross-reference pointers from SKILL.md items 11 and 14 to the README sections that explain the values they assert.
- Fix README's Positron/Voyager self-contradiction (line 10).
- Run `knip` once to get a real unused-code report and review it.

**Out of scope:**
- Pruning/rewriting SKILL.md's testing content — it's already correctly scoped.
- Any other README staleness beyond the one contradiction found (e.g. it also still describes `.js`/`.jsx` files though the codebase is now TypeScript — noted, not fixed here, since it wasn't part of what the graph flagged and is a much bigger doc pass).
- Splitting any component/community — no code file is actually overstuffed; ruled out in brainstorming.
- Deleting anything knip flags without human review first.
- Adding knip as a permanent dependency — this is a one-off audit via `npx`.

## Design

### 1. Cross-reference links + Positron/Voyager fix

`.claude/skills/verify/SKILL.md`, two one-line additions (no deletions):
- Item 11 (PWA/offline, line 45): prepend a pointer — "See README.md § Offline / installable for what this caches and why." — before the existing testing steps, unchanged.
- Item 14 (Dark mode, line 49): prepend a pointer — "See README.md § Theming for why these are the constants." — before the existing testing steps, unchanged.

`README.md` line 10 (Stack section): change "CARTO Positron" to "CARTO Voyager" so it agrees with the dedicated Basemap section instead of contradicting it.

No other section of either file changes. This is a pure doc edit — zero code or behavior change.

### 2. Dead-code audit

Run `npx knip` at the repo root. This is read-only against the report; nothing is deleted as part of this step.

Expected noise to filter out when reviewing results, since this is a Next.js App Router project:
- Route handlers and special files (`app/**/route.ts`, `app/layout.tsx`, `app/manifest.ts`, `app/opengraph-image.tsx`) are framework entry points — knip may flag them as "unused" since Next.js calls them by convention, not by import.
- Files under `.claude/` and `docs/` aren't part of the app bundle and should be excluded from consideration even if knip's default config scans them.

After the run, present the filtered findings (file path + reason) back for a manual decide-what-to-remove pass — no automatic deletion.

## Testing

- Doc changes: visually diff both files before/after to confirm both files gained only the pointer text, with no testing steps or prose removed.
- knip audit: no app behavior changes in this step, so no functional testing needed — the deliverable is the reviewed report itself.
