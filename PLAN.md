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

- **License**: RESOLVED 2026-07-19 — split licensing: MIT for code
  (LICENSE), CC BY-NC-SA 4.0 for creative/educational content
  (LICENSE-CONTENT.md), "Learnimals" name and logo reserved. The early
  contributor (4 commits, May 2025) is OK with the MIT grant and public
  visibility — confirmed 2026-07-19.
- **IndexedDB island**: `src/services/{database,progress,achievements}`
  has zero importers (the live progress path is
  `features/progress/ProgressTracker` + `utils/EnhancedProgressTracker`).
  Delete as dead code, or adopt it as the M3 storage layer.
- **Progress dashboard (old M2.1)**: `src/features/progress/` is dead
  code; `progressDashboard.js` still imports an `authService` that only
  ever existed on abandoned auth branches. The shipped page uses
  `components/ui/GameProgressDashboard.js`. Revive (needs an auth/user
  decision — the app is deliberately serverless) or delete.
- **Deployment**: DONE 2026-07-19 — both repos are PUBLIC (full
  history secrets-audited clean first). E2E_CORE_TOKEN dropped from all
  workflow checkouts; CodeQL restored in security.yml. Remaining:
  enable Pages in repo settings and activate deploy.yml (its \_site
  layout needs rework for root-absolute paths — see the workflow).
  Docker/K8s remain aspirational.
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

## Functional audit (2026-07-19) — what actually works when driven

Six agents drove the real app headless (Playwright) and read intent from
source. Green tests hid the truth: most of the surface is broken or
absent. Verdicts:

- **Genuinely works end to end:** Bubble Pop, Ecosystem Explorer (games);
  Science, Reading (subjects); theme switching; navigation; homepage,
  about, contact; the character-generation ENGINE (factory, storage, SVG
  renderer, customizer, studio, presets — all persist).
- **Partial:** Pizza Party (core fraction loop works; no achievement popup
  or game-over screen — both TODOs); Math, Art (widgets half-work); the
  character-generation UI (engine works, wizard/gallery/canonical page
  broken); Profile (shell works, save is a no-op); PWA (SW registers but
  at wrong scope → inert).
- **Broken but the code exists (revivable):** Element Match, Number Line
  Jump, Word Scramble, Sentence Builder, Color Palette (games); Music,
  Geography (subjects); profile-enhanced, progress-dashboard.
- **Absent / skeleton:** Story Safari (game modules don't exist — only a
  test harness); Ecosystem Safari (engine is empty placeholder methods
  despite elaborate design docs); cooking/environment/history/language/
  physics (no HTML page exists — unreachable); Coding (static "coming
  soon" stub).

### Shared root causes (fixing these cascades across many features)

1. `src/features/progress/ProgressTracker.js` is a mock missing
   `recordActivity()`; `AchievementSystem` missing `checkAchievement()` —
   every BaseGame game throws at `start()`. Blast: Element Match, Number
   Line Jump, Word Scramble, bubblepop-new, Color Palette.
2. Subject `.js` (ESM) loaded as classic `<script>` by the `subject.html`
   template (no `type=module`) → "Unexpected token 'export'". Blast: Math,
   Music, Geography interactivity; also navigationHelper.js and
   BaseComponent.js on many pages.
3. Async `initialize()` vs synchronous `game.start()` race in game demo
   HTML → state stuck at 'ready'. Compounds #1 on several games.
4. `EnhancedProgressTracker` default export is an instance, not the class;
   `progressIntegration.js` `new`s it. Blast: profile-enhanced,
   progress-dashboard. (The named export already exists — fix the import.)
5. `window.userProgress` never assigned (default-export only) → profile
   save + dynamic data are dead.
6. Service worker registers at `/public/` scope, not `/` → page
   uncontrolled, entire PWA layer (offline/install/caching) inert.
7. `createCharacter is not defined` in characterIntegration.js → character
   rendering fails on music/geography.
   Plus individual bugs: pizza-maker `_animationSequence` import typo;
   adventure-quest click-handler deadlock (gated on isPlaying which only Start
   sets); sentence-builder queries #hint-btn before it's created; art
   `clearCanvas` undefined; CharacterWizard `this.init` missing; Character
   Gallery no default export; character-customization.html imports a
   nonexistent module.

### Milestone 3 — remediation, then features

Sequence: (A) land the 7 shared root-cause fixes — highest leverage,
revives ~10 features at once, each verified by re-driving the app. (B)
Individual bug fixes for the revivable games/pages. (C) PRODUCT DECISIONS
(user's call): delete-or-build Story Safari & Ecosystem Safari skeletons;
generate-or-drop the 5 subject-less pages (the generator works); build-or-
label Coding; reconcile Bubble Pop not using BaseGame (it works — leave?).
(D) Only then the character-progress ecosystem feature work. Every fix must
be re-driven in a browser, not just unit-tested — that is how this rot
accumulated.

## Standing rules

- `.nvmrc` (20.15.1) is the single Node truth.
- Serve the repo root; never `src/pages` as docroot.
- Subject pages live at `src/features/subjects/<s>/<s>.html` — never
  link `shared/<s>.html`.
- No file with a `name 2.ext`-style suffix is ever legitimate — it is
  an iCloud conflict artifact.
- Conventional Commits with scope, no emoji.
