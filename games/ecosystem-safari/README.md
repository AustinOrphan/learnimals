# Sky's Ecosystem Safari

An educational game where players build small food webs and keep them balanced while learning
about species relationships, population dynamics, and conservation with Sky the Parrot.

## What v1 ships

Ecosystem Safari v1 is a **5-level guided game** built on the shared `BaseGame` class
(`components/games/BaseGame.js`), the same foundation used by the other Learnimals games. Each
level (`levels.js`) is a small ecological puzzle with one teaching goal — add the right species,
watch a real population-dynamics simulation run, and hit a win condition (survive, reach a
health target, avoid extinctions, or keep enough biodiversity through a challenge event).

Levels cover three habitats: **grassland**, **forest**, and **ocean**. `LevelManager.js` drives
progression between them.

### Reused model layer

The v1 game reuses four model modules originally written for a broader sandbox concept. They
are real and load in the shipped game, but only the slice of their functionality that a guided
level needs is exercised in practice:

- **`EcosystemEngine.js`** — population dynamics (logistic growth with carrying capacity),
  predator-prey interactions, environmental factors, and ecosystem health scoring.
- **`SpeciesManager.js`** — the species database (grass, rabbit, hawk, bacteria, oak tree, deer,
  wolf, bee, seaweed, sea turtle, shark, etc.) with trophic levels and educational facts.
- **`HabitatBuilder.js`** — habitat definitions and environmental parameters. It defines five
  habitat types (grassland, forest, ocean, desert, arctic); v1 levels only use the first three.
- **`DiscoveryJournal.js`** — the contextual hint/lesson content shown during levels (`lesson`
  keys referenced from `levels.js`, e.g. `food_chains`, `biodiversity`, `limiting_factors`,
  `conservation`).

## File structure

```text
games/ecosystem-safari/
├── EcosystemSafariGame.js      # Main game controller (extends BaseGame)
├── LevelManager.js             # Drives the 5-level progression
├── levels.js                   # Level definitions (goals, starting species, hints)
├── EcosystemEngine.js          # Population-dynamics simulation engine
├── SpeciesManager.js           # Species database and logic
├── HabitatBuilder.js           # Habitat/environment definitions
├── DiscoveryJournal.js         # Lesson content shown during levels
├── ecosystemSafari.css         # Game styling
├── index.html                  # Game page
└── README.md                   # This documentation
```

## Playing

Open `/games/ecosystem-safari/` (served from the repo root). Sky introduces each level's goal,
you tap species in the palette to add them to the habitat, and the engine simulates population changes
in real time. A level is won by meeting its goal (e.g. surviving a set duration with the required
species alive, or reaching a health target) and lost if the food web collapses.

## Accessibility

- Keyboard-operable controls (pause, restart, help)
- `aria-live` regions for the goal, tip, and win/lose overlays
- Reduced-motion handling in the simulation loop

## v2 ideas (not implemented)

The following are documented as future direction, not current functionality:

- **Sandbox mode** — free-form ecosystem building outside the guided levels
- **Difficulty tiers** — adjustable challenge beyond the fixed 5 levels
- **Achievements** — a dedicated achievement/reward system for this game
- **Desert and arctic habitats** — `HabitatBuilder.js` already defines these; no levels use them
  yet, and the desert/arctic species rosters referenced there are placeholders
- Additional species, multiplayer collaboration, and classroom/teacher tooling

## Integration with Learnimals

- Uses the shared theme system (CSS variables, light/dark mode)
- Loaded via the shared navbar/theme bootstrap scripts, same as other game pages
- Reachable from the Science subject page (`/subjects/science/`); not currently listed in
  `config/gameRegistry.js`
