# Ecosystem Safari — Status Notes

## Summary

Ecosystem Safari v1 is a **5-level guided game** built on `BaseGame`
(`components/games/BaseGame.js`). It reuses four model modules
(`EcosystemEngine.js`, `SpeciesManager.js`, `HabitatBuilder.js`, `DiscoveryJournal.js`) as its
simulation and content layer, driven by `LevelManager.js` and the level definitions in
`levels.js`. See `README.md` for the file structure and what each module does.

## What v1 actually covers

- 5 fixed levels across 3 habitats (grassland, forest, ocean) — see `levels.js` for the exact
  goals, starting species, and hints.
- A real population-dynamics simulation (logistic growth, predator-prey interactions) drives
  each level rather than a scripted outcome.
- Win conditions: survive a duration with required species alive, reach a health target and
  hold it, avoid extinctions, or keep a minimum number of species alive through a challenge
  event (e.g. drought).
- Accessible controls (pause/restart/help), `aria-live` regions for goal/tip/win/lose state.

## Known limitations / not yet built

- **Sandbox mode**, **difficulty tiers**, and **achievements** are not implemented — v2 ideas
  only, tracked in `README.md`.
- **Desert and arctic habitats** are defined in `HabitatBuilder.js` but no level uses them; their
  species rosters are placeholders, not real content.
- No automated end-to-end test coverage specific to this game beyond the repo's existing unit
  suite; there is no `test-validation.js` script for this game.

## How to verify manually

1. Serve the repo root (`npm run serve` or `python3 -m http.server 3000`).
2. Open `/games/ecosystem-safari/`.
3. Play through a level: add the palette species Sky suggests, watch populations update, confirm
   the win overlay appears when the goal is met and the lose overlay appears on ecosystem
   collapse.
