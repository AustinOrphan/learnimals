# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository. Regenerated 2026-07-17 from a five-agent repository analysis; every claim below was
verified against the actual files or by running the commands.

## Repository Overview

Learnimals is a static educational web app for children. Each school subject (13 subject dirs:
art, coding, cooking, environment, geography, history, language, math, music, physics, reading,
science, + shared) is fronted by an animal character, and 12 games live under
`src/features/games/`. Plain HTML/CSS/JS with ES modules — **no build step, no framework, no
backend**. All persistence is client-side (localStorage + IndexedDB). Solo project by Austin
Orphan (~203 of 217 commits); started May 2025, bursty activity with multi-month dormancies.

### Worktree hub layout (important)

`/Users/austinorphan/src/learnimals/` is a **git worktree hub**, not a normal checkout:

- `.bare/` — the bare repository (`.git` at hub root is a pointer to it)
- `_main/` — **the main checkout; work here.** This file lives at `_main/CLAUDE.md`.
- `cicd/`, `css-modularization/`, `experimental/`, `maintenance/`, `test-coverage/`, etc. —
  eleven per-branch worktrees, **all untouched since 2025-08-19 and effectively abandoned**.
  Notable stranded work: `test-coverage` claims 91% coverage (unmerged),
  `feature/crystal-cave-quest-v2` (branch, no worktree) has 12 unmerged commits.
  `develop`/`hotfix`/`stabilization` point at an orphan "repository repair" commit sharing no
  history with main — placeholders, zero real work.

The hub root has its own stray `package.json`/`pnpm-lock.yaml` (the project itself uses npm +
`package-lock.json`) and dedupe tooling (`DEDUPE_PLAN.md`, `scripts/dedupe_repo.py`,
`dedupe-archive/`) — hub-level artifacts, not part of the app.

## Quick Start

Prerequisites: Node **20.15.1** (`.nvmrc` is canonical — ignore the conflicting 18/24 pins in
`comprehensive-testing.yml` and the Dockerfile), Python 3 for the dev server, and the sibling
checkout `/Users/austinorphan/src/e2e-core` (required by the `file:../../e2e-core` dependency —
`npm ci` fails without it).

```bash
cd /Users/austinorphan/src/learnimals/_main
npm ci

# Serve the repo root on port 3000, then open the real homepage:
npm run serve
# → http://localhost:3000/src/pages/index.html
```

`npm run serve` runs `python3 -m http.server 3000` from the repo root, matching CI (`e2e.yml`)
and the Playwright BASE_URL default. (Fixed 2026-07-17 — it previously served `src/pages` as
the docroot, breaking every root-absolute `/src/...` and `/public/...` URL, and used `python`
instead of `python3`.) Pages must always be served from the repo root. The root `index.html`
redirects to the app homepage `src/pages/index.html` (until 2026-07-17 it was a stale
"migration complete" launcher page with no nav and dead links).

The `@austinorphan/e2e-core` dependency installs as a **copy**, not a symlink
(`install-links=true` in `.npmrc` — required so e2e-core resolves this repo's single
`@playwright/test` instance instead of its own). After editing e2e-core, refresh with
`rm -rf node_modules/@austinorphan/e2e-core && npm install` (a plain `npm install` won't
re-copy while the version number is unchanged).

## Essential Commands (verified)

```bash
# Lint / format (scope: src/ scripts/ tests/)
npm run lint            # eslint (flat config: eslint.config.mjs — the legacy .eslintrc.js is dead)
npm run lint:fix
npm run format          # prettier --write .
npm run lint:md         # markdownlint-cli2
npm run prose:check     # Vale (Microsoft + Google styles)

# Tests (Vitest, jsdom)
npm run test:all                      # full one-shot run (npm test = watch mode in a TTY)
npm run test:unit | test:components | test:integration
npm run test:accessibility            # the 22-file tests/accessibility suite
npm run test:performance | test:security
npx vitest run tests/unit/logger.test.js   # single file
npm run test:watch | test:ui
npm run test:coverage                 # v8, 80% thresholds on all four metrics

# Browser e2e (Playwright — 30 tests across 5 browser projects)
npm run test:e2e                      # full matrix; auto-starts npm run serve via webServer
npm run test:e2e:headed | test:e2e:ui
npx playwright test --config e2e/playwright.config.ts --project=chromium   # one browser
npx playwright install                # download browser binaries after Playwright upgrades

# Scaffolding
npm run generate-subjects -- --subjects=music,geography
npm run list-templates                # built-ins: music, geography, history, language,
                                      # physics, cooking, environment
npm run check:duplicates              # iCloud-conflict detector (see Gotchas)
```

Note: `npm test` alone is watch mode; use `npm run test:all` for one-shot.

### Current test health (verified 2026-07-18)

**Fully green.** Vitest: 1,928/1,928 across all 73 files (~10s). Playwright: 30/30 across
chromium, firefox, webkit, mobile-chrome, mobile-safari. The 2026-07 repair effort fixed 401
failures via fifteen root-cause clusters (see CHANGELOG). Coverage thresholds (80%) are
configured in `vitest.config.js` but not yet gated in CI — calibrate and enable per PLAN.md.

## Architecture

### Component system (no framework)

Class-based components. `src/components/BaseComponent.js` is the root (options, id,
`addEventListener`/`emit`); `EnhancedBaseComponent.js` and `AccessibleComponent.js` extend it.
Concrete components live in typed subdirs: `ui/` (Card, Modal, PWAInstaller, …), `layout/`
(navbarLoader, navigation, themeSwitcher, mobileMenuHandler), `forms/` (FormComponent),
`feedback/` (Toast/Overlay/Progress + ToastManager), `games/` (BaseGame, GameTemplateLoader),
`profile/` (Avatar, AvatarBuilder). `src/components/index.js` is a barrel — **currently broken in
browsers** because `FormComponent.js` has no ES export (only a CJS guard + `window.FormComponent`).

### Subject template system

`src/utils/subjectTemplateLoader.js` fetches `/src/templates/subject.html` at runtime and
replaces `{{subjectName}}`, `{{subjectLower}}`, `{{subjectDescription}}`, `{{characterName}}`,
`{{characterType}}`, `{{heroSubtitle}}`, `{{featureCards}}` — all escaped via
`src/utils/htmlEscape.js` except `featureCards`. Subject pages are thin HTML shells at
`src/features/subjects/<subject>/<subject>.html` whose inline module script builds an options
object and calls `SubjectTemplateLoader.renderTemplate(options)` (see `music/music.html`).
`scripts/generateSubjects.js` scaffolds all of this and regex-patches the `subjects:` block of
`src/config.js`.

### Games

Registry-driven: `src/config/gameRegistry.js` holds an array of game metadata (id, gameClass,
scriptPath, styleSheet, subject, template, options). Games are self-contained modules in
`src/features/games/<game-id>/` (kebab-case) whose main class `extends BaseGame`
(`src/components/games/BaseGame.js` — state machine, score/lives, ProgressTracker +
AchievementSystem integration). Game shell templates: `src/templates/{minimal,game,fullscreen,
mobile,educational}.html`. Page-side entry is `src/utils/GameSystem.js`. Game tuning constants go
in `src/config.js` `games:` — note only bubblePop and wordScramble have entries there today.

### Theme system

`src/utils/themeRegistry.js` (COMMON_COLORS, THEME_COLORS, THEME_DEFINITIONS) →
`src/utils/themeManager.js` (singleton; persists `learnimals-theme-name` /
`learnimals-theme-mode` in localStorage; follows `prefers-color-scheme`) →
`src/components/layout/themeSwitcher.js` (self-initializing UI). `src/themeInitializer.js` is a
deliberately import-free IIFE loaded early to prevent theme flash — keep it dependency-free.
`ModularThemeManager.js` is a newer extension. Style exclusively with semantic CSS variables
(`--text-primary`, `--bg-card`, `--accent-primary`). There is **no `src/styles/themes/`** dir;
theme CSS lives in `src/styles/base/` and `src/styles/components/`.

### Services & storage

`src/services/`: `database/IndexedDBService.js` (singleton `dbService`; DB `learnimals` v1,
schema in `database/schema.js`), `progress/ProgressService.js`, `character/CharacterStorage.js`,
`achievements/AchievementSystem.js`, `accessibility/`, `mobile/`. localStorage via
`src/utils/common.js` `get/setLocalStorage` (JSON-wrapped). `src/config.js` (default-export app
config: game tuning, theme, rich per-subject character definitions) is distinct from
`src/config/` (gameRegistry, educationalMetadataSchema). The `api:` block in config.js
(`/api/progress`, `/api/scores`) and the service worker's `/api/contact` sync have **no server —
nothing serves /api**.

### Page bootstrap

`src/pages/index.html` load order: inline script (JSON-LD + service-worker registration) →
`navbarLoader.js` (fetches `layout/navbar.html` into `#navbar-placeholder`, fires
`navbarLoaded`) → `navigationHelper.js` → `PWAInstaller.js` → `main.js` (confetti only) →
`navigation.js` → `themeManager.js` → `themeSwitcher.js`. PWA: `public/serviceWorker.js`
(cache-first, `learnimals-cache-v5`, offline fallback) + `public/manifest.json`.

## Project Structure

```text
_main/
├── src/
│   ├── components/        # BaseComponent + ui/ layout/ forms/ feedback/ games/ profile/ examples/
│   ├── features/
│   │   ├── subjects/      # 13 subject dirs + shared/; files: <subject>.{html,css,js}
│   │   ├── games/         # 12 game dirs (kebab-case)
│   │   ├── character-generation/, character-showcase/, discovery/, profile/, progress/, user/
│   ├── services/          # accessibility/ achievements/ character/ database/ mobile/ progress/
│   ├── utils/             # 33 modules: logger, htmlEscape, subjectTemplateLoader, theme*…
│   ├── styles/            # base/ + components/ (semantic CSS variables; NO themes/ dir)
│   ├── templates/         # subject.html + game shells (minimal/game/fullscreen/mobile/educational)
│   ├── pages/             # index.html (real homepage), about, contact, profile, games/, demo pages
│   ├── config.js          # app config (subjects/games/theme); generateSubjects rewrites it
│   ├── config/            # gameRegistry.js, educationalMetadataSchema.js
│   ├── data/characterSchema.js
│   ├── main.js            # homepage confetti only
│   └── themeInitializer.js # import-free FOUC guard
├── public/                # manifest.json, serviceWorker.js, images/
├── tests/                 # Vitest jsdom suites (unit/components/integration/accessibility/…)
├── e2e/                   # Playwright browser tests (spec in e2e/tests/, config sets testDir)
├── scripts/               # generateSubjects, checkDuplicates, test-sharding, coverage-report…
├── docs/                  # ~126 md files in 12 categories; components doc: docs/ux-design/components.md
├── docker/  k8s/          # aspirational — see Gotchas
└── .github/workflows/     # 14 workflows
```

Root debris (git-tracked, not part of the app): ~35 `debug-*.html` / `test-*.html` manual
harnesses, `temp_particle.js` (misplaced copy of a pizza-party module), `coverage-report.json`,
and iCloud duplicates (below). Don't take these as patterns to follow.

## Code Style & Conventions

- **ESLint** (`eslint.config.mjs`, flat config — active; `.eslintrc.js` is a dead legacy file):
  2-space indent, single quotes, semicolons required, `prefer-const` warn, unused vars error
  unless `_`-prefixed, `no-console` off. Overrides add Node globals for `scripts/**` and Vitest
  globals for `tests/**`.
- **Prettier** (`.prettierrc.json`): printWidth 100 (HTML/CSS 120, JSON 80), single quotes,
  trailingComma es5, `arrowParens: avoid`, LF.
- **markdownlint** (`.markdownlint.json`): MD013 line length 100, ATX headings.
- **Naming**: PascalCase for class-module files (`Card.js`, `AnimationManager.js`); camelCase for
  function/singleton modules (`logger.js`, `themeManager.js`, `navbarLoader.js`); kebab-case
  feature dirs; subjects use `<subject>.{js,css,html}` in their own dir. Tests: `Name.test.js`
  (Vitest), `*.spec.ts` (Playwright).
- **CSS**: flat kebab-case classes (`.feature-card`, `.modal-close`) — BEM is _not_ the real
  convention despite older docs (~50 of ~2,700 selectors are BEM). Use semantic theme variables,
  never raw colors.
- **Imports**: ES modules everywhere (`"type": "module"`); relative imports always include the
  `.js` extension; HTML module scripts use root-absolute `/src/...` paths. Default-export
  singletons are the norm (`logger`, `themeManager`, `dbService`). The `@/…` aliases work
  **only in Vitest** (`vitest.config.js`) — browser code cannot use them.
- **Commits**: Conventional Commits **with scope**, no emoji — the style of the most recent
  commits (`feat(e2e): …`, `feat(ci): …`). History is mixed (emoji bursts, plain prose); follow
  the current convention.

## Common Tasks

**Add a subject**: prefer `npm run generate-subjects -- --subjects=<name>` for the 7 built-in
templates; otherwise copy the `music/` pattern: shell HTML with inline module script calling
`SubjectTemplateLoader.renderTemplate()`, plus `<subject>.css`/`<subject>.js`, register in
`src/config.js` `subjects:`, add character image `public/images/<subject>-<animal>.png`, add
navbar link in `src/components/layout/navbar.html` + mapping in `src/utils/navigationHelper.js`
(note: existing navbar entries point at dead `shared/` paths — see Gotchas; link the real
`<subject>/<subject>.html` pages).

**Add a component**: `src/components/<type>/ComponentName.js` extending `BaseComponent`,
`export default`, matching stylesheet in `src/styles/components/`, re-export from
`src/components/index.js`, test in both light and dark modes.

**Add a game**: `src/features/games/<game-id>/` with a class extending `BaseGame`, register in
`src/config/gameRegistry.js` (id, gameClass, scriptPath, styleSheet, subject, template,
metadata), pick a shell template from `src/templates/`, optional demo page under
`src/pages/games/`, tuning constants in `src/config.js`.

**Extend themes**: add definitions in `src/utils/themeRegistry.js`; the manager and switcher pick
them up automatically.

## Pre-commit & CI

`.husky/pre-commit`: iCloud-duplicate check (only scans `src/ docs/ tests/`), merge-marker
check, >1MB warning (contains an **interactive `read -r` prompt** — can hang non-TTY commits),
TODO scan, `checkDuplicates.js`, then lint-staged (`eslint --fix` + `vitest related --run` on
src JS; prettier on HTML/CSS; markdownlint + prettier on md).

10 workflows in `.github/workflows/` (overhauled 2026-07-17; four dead ones deleted). Gates:
`ci.yml` (lint + full Vitest on the `.nvmrc` Node) and `e2e.yml` (Playwright 3-browser matrix).
Both check out the private `AustinOrphan/e2e-core` repo as the `file:` sibling and build it —
the `E2E_CORE_TOKEN` secret holds a fine-grained PAT with Contents: Read on that repo, and
every workflow that runs `npm ci` needs that checkout block. Diagnostic: `security.yml` (ZAP,
content/child-safety scans), `accessibility.yml`, `lighthouse.yml`, `pr-checks.yml`.
Dispatch-only until their infrastructure exists: `deploy.yml` (Pages unconfigured),
`deploy-rolling.yml` (no K8s), `monitoring.yml` (no production domain). `release.yml`
self-skips without [release] in the commit message.

## Hidden Context & Gotchas

1. **"e2e" means Playwright, full stop.** `npm run test:e2e` runs the browser suite in
   `e2e/`. The old Vitest-jsdom "e2e" suite (`tests/e2e/`) was never runnable (it imported a
   package that was never installed) and was deleted 2026-07-18.
2. **iCloud duplicate files are a chronic, first-class problem.** The repo once lived in iCloud
   Drive; sync conflicts created `name 2.ext`-style duplicates. Tooling exists
   (`scripts/checkDuplicates.js`, pre-commit check, `docs/development/MAINTENANCE_GUIDE.md`),
   and the 55 git-tracked duplicates were purged 2026-07-18 — but the guards still only scan
   `src/ docs/ tests/` filenames with extensions, so root-level and directory-name dupes can
   slip through again. Never create files with spaces/digits suffixes; treat any
   `name 2.ext`-style filename as a conflict artifact.
3. **Docker/K8s/monitoring are aspirational.** `FUTURE-FEATURES.md` explicitly labels them "not
   currently in active use" (older docs presented them as live). K8s is plain manifests in
   `k8s/{staging,production}/` with `envsubst` — **no Kustomize**. The nginx CSP
   (`script-src 'self'`) would block the inline scripts in `src/pages/index.html` if the Docker
   path were ever used seriously.
4. **Subject-page URLs**: real pages live at `src/features/subjects/<subject>/<subject>.html`
   — never link `shared/<subject>.html` (those pages don't exist; `shared/` holds only
   bubblepop and `*-example` pages). Until 2026-07-17 the navbar, homepage CTA, manifest
   shortcuts, and service-worker precache all pointed at the dead `shared/` paths; all fixed,
   but old habits in docs/examples may still show the wrong pattern.
5. **`src/features/progress/` is dead code pending an M2 decision** (see PLAN.md): nothing
   imports it, `progressDashboard.js` still imports an `authService` that only existed on
   abandoned auth branches, and the shipped dashboard is `components/ui/GameProgressDashboard`.
   Its `config/storage.js` dependency was reconstructed 2026-07-18 as a localStorage adapter.
6. **Vite never happened and its artifacts were deleted 2026-07-18.** `npm run build` remains
   an intentional no-op (static site). The `@/…` aliases live only in `vitest.config.js` —
   browser code cannot use them.
7. **Duplicate/parallel implementations to not "fix" blindly**: two `AchievementSystem.js`
   (BaseGame imports the `features/progress` one; the `services/achievements` IndexedDB island
   has zero importers — deletion candidate in PLAN.md), two `escapeHTML` (`utils/htmlEscape.js`
   is the security-blessed one), `themeManager` vs `ModularThemeManager`. Same-basename test
   files (`tests/unit/X.enhanced.test.js` vs `tests/unit/components/X.enhanced.test.js`) are
   DIFFERENT suites, not copies — consolidation candidates, not deletions.
8. **`.claudeCodeStuffToStashForNow/` is an untracked local parking lot** holding copies of
   analysis artifacts whose deletions were committed 2026-07-18. Leave it untracked; never
   sweep it into a commit.
9. **History quirks**: a repository-corruption event (~2025-07-28) left orphan-rooted
   `develop`/`hotfix` branches; a single 366-file/+118k-line commit (`ecf3ea7`) introduced most
   of the root debris; a backend/auth direction (remote `feature/phase-0.1-user-authentication`…)
   was abandoned — the app is intentionally serverless.
10. **Doc trust order**: README, CHANGELOG, CONTRIBUTING, E2E.md, and PLAN.md were made
    truthful 2026-07-18 — PLAN.md is the single current plan and decision log. The `docs/`
    tree remains a historical archive (excluded from markdownlint); treat its contents as
    period pieces, not current guidance. When in doubt: `package.json`, the configs, PLAN.md,
    and this file's verified notes win.
11. **Security posture**: this is a children's app — `docs/security/COPPA_COMPLIANCE.md` applies;
    XSS prevention via `src/utils/htmlEscape.js` with a dedicated `tests/security/` suite; never
    interpolate unescaped user input into template HTML.
12. `src/utils/logger.js` enables DEBUG only on exact hostnames `localhost`/`127.0.0.1`
    (override with `window.LEARNIMALS_LOG_LEVEL`). Use it instead of bare `console.log` in new
    code.
