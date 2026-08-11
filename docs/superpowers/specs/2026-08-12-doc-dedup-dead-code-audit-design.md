# Doc Dedup & Dead-Code Audit — Design

## Context

A graphify knowledge-graph pass over the repo surfaced two concrete, low-risk findings worth acting on:

1. **Duplicated documentation.** `.claude/skills/verify/SKILL.md` and `README.md` independently describe the same two things — the PWA/offline behavior (service worker + manifest) and the paper/ink/line role-token theming system — with no cross-reference between them. Left alone, the two will drift out of sync as either one is updated.
2. **Unverified dead-code signal.** The graph's "isolated node" report (158 nodes) turned out to be a structural-extraction artifact — TypeScript `Props`/response-type interfaces, internal constants, and same-file helper functions that AST extraction doesn't wire up with usage edges — not real dead code. A genuine unused-export/file audit needs a purpose-built tool instead.

Everything else the graph flagged (low-cohesion "communities") was ruled out during brainstorming as parsing artifacts (`package.json`/`tsconfig.json` field lists) or normal loosely-coupled component structure, not actionable refactor targets.

## Scope

**In scope:**
- Consolidate the two duplicated doc sections so there's one source of truth each.
- Run `knip` once to get a real unused-code report and review it.

**Out of scope:**
- Splitting any component/community — no code file is actually overstuffed; ruled out in brainstorming.
- Deleting anything knip flags without human review first.
- Adding knip as a permanent dependency — this is a one-off audit via `npx`.

## Design

### 1. Doc consolidation

`README.md` stays canonical for describing *what* each feature is and *why* — no changes needed there.

`.claude/skills/verify/SKILL.md` changes for its two affected sections:
- **PWA/offline verification flow**: drop the paragraph re-describing what the service worker/manifest do. Replace with a one-line pointer ("see README.md § Offline/installable PWA for what this does") followed by the existing testing steps (how to verify it in a browser), unchanged.
- **Dark-mode theme-constant verification**: same pattern — drop the re-description of the paper/ink/line token system, point to README.md § theming, keep the verification steps.

No other section of either file changes. This is a pure doc edit — zero code or behavior change.

### 2. Dead-code audit

Run `npx knip` at the repo root. This is read-only against the report; nothing is deleted as part of this step.

Expected noise to filter out when reviewing results, since this is a Next.js App Router project:
- Route handlers and special files (`app/**/route.ts`, `app/layout.tsx`, `app/manifest.ts`, `app/opengraph-image.tsx`) are framework entry points — knip may flag them as "unused" since Next.js calls them by convention, not by import.
- Files under `.claude/` and `docs/` aren't part of the app bundle and should be excluded from consideration even if knip's default config scans them.

After the run, present the filtered findings (file path + reason) back for a manual decide-what-to-remove pass — no automatic deletion.

## Testing

- Doc changes: visually diff both files before/after to confirm no verification steps were lost, only the descriptive prose moved/linked.
- knip audit: no app behavior changes in this step, so no functional testing needed — the deliverable is the reviewed report itself.
