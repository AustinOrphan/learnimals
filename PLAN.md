# Learnimals — Current Plan

Written 2026-07-17. This file supersedes the five earlier planning
documents (`UNIFIED_CLEANUP_MASTER_PLAN`, `ROADMAP_M2`, the
`docs/roadmap/` and `docs/strategic/` roadmaps, and
`COVERAGE_TARGET_PLAN`), which are retained only as historical archive.
When this plan changes, update this file — do not fork a new one.

## Where things stand (verified 2026-07-17)

- App: static, serverless, no build step. Served from the repo root
  (`npm run serve`); homepage `src/pages/index.html`. 13 subjects, 12
  games, character generation, PWA.
- Browser e2e: Playwright suite green — 30 tests × 5 browser projects
  locally, 3-browser matrix green in CI (`e2e.yml`).
- Unit/integration suite: mid-repair. Full-suite baseline before the
  repair effort was 401 failing / 1903 across 40 files; the mechanical
  clusters are fixed and deep-cluster repairs are in progress.
- CI: 10 workflows remain (from 14). `ci.yml` (lint + full Vitest) and
  `e2e.yml` are the gates; security/accessibility/lighthouse are
  diagnostic; deploy/deploy-rolling/monitoring are dispatch-only until
  their infrastructure exists.
- e2e-core: private repo `AustinOrphan/e2e-core`, consumed as a
  `file:../../e2e-core` sibling, installed as a copy (`install-links`).
  CI checks it out with the `E2E_CORE_TOKEN` secret.

## Milestone 1 — a green suite (in progress)

1. Finish the deep test-fix clusters: AccessibleComponent keyboard/ARIA
   contract (~88), ModuleRegistry API (25), EcosystemGame jsdom rewrite
   (15), Modal ESM migration, BundleOptimizer importer injection,
   residual assertion drift.
2. When green: re-enable the coverage run in `ci.yml`
   (`npx vitest run --coverage`) and calibrate the 80% thresholds in
   `vitest.config.js` against reality.
3. Consolidate the confusing same-name test pairs
   (`tests/unit/X.enhanced.test.js` vs `tests/unit/components/…`) —
   they are different suites, not duplicates; merge or rename.

## Milestone 2 — decisions needed (each blocks its own work)

- **License**: README claimed MIT but no LICENSE file exists. Add the
  MIT LICENSE file, or drop the claim entirely.
- **IndexedDB island**: `src/services/{database,progress,achievements}`
  has zero importers (the live progress path is
  `features/progress/ProgressTracker` + `utils/EnhancedProgressTracker`).
  Delete as dead code, or adopt it as the M3 storage layer.
- **Progress dashboard (old M2.1)**: `src/features/progress/` is dead
  code; `progressDashboard.js` still imports an `authService` that only
  ever existed on abandoned auth branches. The shipped page uses
  `components/ui/GameProgressDashboard.js`. Revive (needs an auth/user
  decision — the app is deliberately serverless) or delete.
- **Deployment**: Pages is unconfigured and this is a private repo
  (Pages requires a paid plan). Decide: public repo + Pages, paid plan,
  or no hosted deployment. Docker/K8s remain aspirational
  (`FUTURE-FEATURES.md`) — revisit only with a real cluster.
- **Stranded game work**: `feature/crystal-cave-quest-v2` holds Story
  Safari enhancements and an Ocean Adventure game (game dirs merge
  cleanly; its test fixes are stale). The `experimental` branch holds
  ~30 game/framework proposal docs (WIP-committed 2026-07-17). Salvage
  per-game or archive.
- **Worktree pruning**: all non-main worktrees are clean (uncommitted
  work was WIP-committed to their branches on 2026-07-17) and can be
  removed from the hub: `git worktree remove <name>` for cicd,
  css-modularization, experimental, maintenance, modularization,
  molecule-builder, ocean-adventure, test-coverage. Branches stay.
- **docs/ archive**: 120+ historical plans/reports, excluded from
  markdownlint. Either curate down to living documents or move to a
  `docs/archive/` subtree.

## Milestone 3 — feature direction (after 1 and 2)

The character-driven learning ecosystem from the old M2 roadmap is
still the most coherent direction: progress tracking with character
companions, achievements, profile growth. Build it on whichever storage
layer survives the M2 decision, keeping the serverless constraint.

## Standing rules

- `.nvmrc` (20.15.1) is the single Node truth.
- Serve the repo root; never `src/pages` as docroot.
- Subject pages live at `src/features/subjects/<s>/<s>.html` — never
  link `shared/<s>.html`.
- No file with a `name 2.ext`-style suffix is ever legitimate — it is
  an iCloud conflict artifact.
- Conventional Commits with scope, no emoji.
