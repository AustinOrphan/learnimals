# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> Note: this changelog was dormant between mid-2025 and 2026-07. The work of
> that period (character generation system, ten additional games, ten
> additional subjects, docs restructuring) landed without entries; see git
> history for the record. Entries resume with the 2026-07-17 repair effort.

## [Unreleased] - 2026-07-17 repair effort

### Fixed

- Playwright e2e suite made runnable end to end (testDir, config wiring,
  smoke-spec target, dual @playwright/test instances via install-links);
  verified 30/30 across five browser projects locally and green in CI
- All subject navigation links (navbar, homepage, manifest shortcuts,
  service-worker precache, game exit links) pointed at nonexistent
  `shared/` pages; now target the real per-subject pages; SW cache bumped
  to v5 (the dead precache entries were breaking service-worker install)
- Root `index.html` replaced: was a stale migration-celebration page with
  no navigation; now redirects to the app homepage
- Subject-page hero heading promoted to `h1` (pages had no h1 at all)
- Two syntax-broken source files repaired (CharacterValidator duplicated
  method body, CharacterFactory stray brace) — they had made `vitest
related` crash and blocked every pre-commit
- `npm run serve` served the wrong document root with the wrong python
  binary; now serves the repo root on port 3000
- Test-infrastructure repairs: mock property descriptors, fs-mock default
  export, missing fixture constant, announce()/supportsWebP guards, named
  class exports for ThemeManager and EnhancedProgressTracker, FormComponent
  ES export, component barrel restricted to real ES modules
- `src/config/storage.js` reconstructed (was imported by the progress
  feature but existed only on abandoned branches); case-mismatched
  AchievementSystem import fixed (broke on Linux)

### Changed

- CI made honest: `ci.yml` rewritten (the old 1,034-line version never
  parsed and never ran); four dead workflows deleted; three aspirational
  workflows (Pages deploy, K8s rolling deploy, production monitoring)
  gated to manual dispatch; the remaining workflows repaired to check out
  the private e2e-core sibling, serve the correct docroot, and test real
  URLs
- Test scripts made honest: `test:e2e` now runs the Playwright suite (the
  old jsdom "e2e" suite was never runnable and is removed),
  `test:accessibility` runs the real 22-file suite, `test:all` runs
  everything, `test:visual` removed (its directory never existed)
- Node standardized on 20.15.1 (`.nvmrc`) across Dockerfile, Makefile,
  workflows, and docs; `engines` added to package.json
- `@austinorphan/e2e-core` published to a private GitHub repository and
  fixed to emit valid ESM; installed as a copy via `install-links`

### Removed

- 91 tracked junk files: iCloud-conflict duplicates, root debug-harness
  copies, stale generated output, dead configs, `-old` files
- The never-completed Vite migration (config, guide, demo page, alias
  example, its test)
- ~105 uncommitted-deletion stragglers from the 2025-08 cleanup, finally
  landed

## [1.0.0] - 2024-01-01

### Added

- Initial release of Learnimals educational platform
- Math, Science, Reading, and Art sections
- Interactive Bubble Pop game
- PWA support with offline capabilities
- Theme switching (light/dark mode)
- Responsive design for all devices
- Animal character guides for each subject
