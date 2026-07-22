# Ecosystem Safari Build-out — Design Spec

Date: 2026-07-21
Status: Approved (brainstorming complete; all four sections approved by the user).

## Purpose

Turn "Sky's Science Safari" (Ecosystem Safari) into a real, playable, **professional,
educational, and FUN** game. Today ~2,300 lines of genuine simulation and educational content
exist but are never wired to anything the player can use: the `EcosystemSafariGame` controller
is 100% placeholder no-ops (blank canvas), and the visible "game" is a disconnected fake demo
in `index.html` (hardcoded species list, random-walk health, draggable species with no drop
targets). This spec rebuilds the game layer on top of the working model, as a set of **guided
puzzle-levels**.

## Chosen direction (decided during brainstorming)

- **Core loop:** guided puzzle-levels (clear goal, gentle retry, a satisfying win), NOT an open
  sandbox for v1.
- **Presentation:** a canvas **animated habitat** (species as animated **emoji creatures**)
  paired with **DOM controls** (species palette, live population panel, health meter, Sky's tips).
- **Interaction:** **tap-to-add** species (mobile-first; drag-with-no-drop-targets was the
  broken old design).
- **Architecture (Approach A):** keep the four working modules as a reusable "model" layer;
  **rewrite** the controller to **extend `BaseGame`**; add a small `LevelManager`.

## Architecture & how it slots in

A normal `BaseGame` game (like Bubble Pop / Color Palette), with the existing modules as the
model layer.

```text
games/ecosystem-safari/
  index.html              → rewritten: standard BaseGame mount (hero + game container);
                            the fake inline demo script is deleted.
  EcosystemSafariGame.js  → REWRITTEN: extends BaseGame. Owns render loop, tap interaction,
                            the sim tick, and the level/phase flow.
  LevelManager.js         → NEW: ordered level definitions + goal evaluation + progression.
  levels.js               → NEW: the level content (data array; see Level model).
  EcosystemEngine.js      → KEEP (model): real population/predator-prey/symbiosis/health sim.
  SpeciesManager.js       → KEEP (model): 11 species; fix the shark 'fish' placeholder.
  HabitatBuilder.js       → KEEP (model): v1 uses grassland/forest/ocean (full rosters);
                            desert/arctic left in place but unused (their species don't exist).
  DiscoveryJournal.js     → KEEP (model): wired for fun-facts, contextual hints, recap.
  ecosystemSafari.css     → KEEP/extend for the DOM controls.
  test-validation.js      → DELETE (mock-based; tests nothing real; misleading).
```

**Data flow (one authoritative model, one render pass):** the game loads a level (habitat +
starting species + goal), then each sim tick calls `engine.update()`, reads one
`engine.getEcosystemState()` snapshot, and uses it to (a) drive the animated creatures + meters
and (b) let `LevelManager` evaluate win/lose. Player taps call `engine.addSpecies(...)`. No
parallel fake state.

**What `BaseGame` provides:** state machine (ready → playing → paused → complete), canvas setup
+ resize, `prefers-reduced-motion`, mobile/touch handling, the aria-live feedback region,
pause/restart/help chrome. We build gameplay, not plumbing.

**Docs:** correct `VALIDATION_REPORT.md` and `README.md` "fully playable" claims to match reality
as part of the work.

## The guided-levels loop

**A level is a small ecological puzzle with one teaching goal.** Data-driven so levels are just
list entries. Level model:

```js
{
  id: 'meadow-food-chain',
  title: 'Build a Meadow',
  habitat: 'grassland',                                // must exist in HabitatBuilder
  intro: "Sky: Every living thing needs energy. Plants catch it from the sun — let's start there!",
  starting: [{ species: 'grass', population: 40 }],    // pre-placed, already animating
  palette: ['rabbit', 'deer', 'bacteria'],             // species the player may add this level
  goal: { type: 'survive', requires: ['grass', 'rabbit'], durationSec: 30 },
  challenge: null,                                      // or { type: 'drought', atSec: 15 }
  lesson: 'food-chains',                               // DiscoveryJournal recap key
  hint: 'Grass is a producer. What animal eats grass?',
}
```

**Goal types** (evaluated by `LevelManager` against an ecosystem-state snapshot):

- `survive` — the `requires` species are all present and non-extinct continuously for
  `durationSec`.
- `reachHealth` — ecosystem health ≥ `healthTarget` (held for a short confirm window).
- `noExtinctions` — no species in `requires` goes extinct while a `challenge` plays out.
- `biodiversity` — at least `minSpecies` species remain alive (used for the drought level).

**Loop inside a level:** Sky states the goal → the habitat animates with the starting
creatures → player taps species from the palette to add them → the engine ticks live (creatures
multiply/thin; population panel + health meter move) → `LevelManager` checks the goal every
tick → **win** = celebration + a "You discovered: …" fun-fact recap → advance. If a required
species goes extinct or the timer expires without meeting the goal, it's a gentle
**"Oops — the food web broke! [hint] Try again"** (retry the same level), never a harsh
game-over.

**v1 level arc (5 levels, one concept each, escalating; all runnable on the real engine +
existing species):**

1. **Build a Meadow** (grassland) — *food chains*: add a herbivore so energy flows from grass up.
2. **Predator & Prey** (grassland) — *balance*: rabbits overgraze; add a hawk so grass survives.
3. **The Cleanup Crew** (forest) — *decomposers*: nutrients run low; add bacteria to recycle them.
4. **Ocean Balance** (ocean) — *marine food web*: build a stable seaweed → turtle → shark web.
5. **Survive the Drought** (grassland) — *resilience/limiting factors*: a stable ecosystem is hit
   by the engine's `drought` challenge; keep biodiversity above the line.

Progression is linear; completed levels persist via `BaseGame`'s localStorage progress. Each
level's `lesson` maps to a `DiscoveryJournal` lesson for its recap.

## Render & interaction

**Canvas — a living habitat.** A per-habitat backdrop drawn with gradients/simple shapes
(grassland, forest, ocean; reusing Bubble Pop's clean gradient style — no art assets). Species
render as **animated emoji creatures** whose on-screen count tracks the engine population
(e.g. population ~40 → a handful of 🐰, capped at ~10–12 for readability with a small count
badge for the true number). Producers (🌿🌳) sit rooted along the ground; animals gently
wander/bob; blooms pop creatures in, extinctions fade them out. Ecosystem health subtly tints
the scene (lush ↔ washed-out). All creature motion is gated behind `prefers-reduced-motion`
(creatures still appear/disappear, just hold still).

Species → emoji: 🌿 grass, 🌳 oak_tree, 🪸 seaweed, 🐰 rabbit, 🦌 deer, 🐢 sea_turtle,
🦅 hawk, 🐺 wolf, 🦈 shark, 🦠 bacteria, 🐝 bee. (Final emoji chosen at build time; this is the
intended set.)

**Interaction — tap, don't drag:**

- **Tap a species in the palette → it is added** (`engine.addSpecies`) and its creatures spawn;
  tapping again nudges its population up.
- **Tap a creature → a fun-fact card** ("🐰 Rabbit — a herbivore. Fun fact: …") from
  `SpeciesManager`/`DiscoveryJournal`.

**DOM controls around the canvas:**

- **Goal banner + timer** ("Keep grass & rabbits alive — 0:30").
- **Sky's tip bar** — an `aria-live` speech area for the intro, live contextual hints, and
  praise; doubles as the screen-reader narration.
- **Species palette** — the level's allowed species as big tappable emoji buttons.
- **Live population panel** — one row per present species (emoji + live count + a bar that
  visibly rises/falls). Chosen over a scrolling time-graph for v1: clearer for young kids and
  naturally accessible via the text counts.
- **Health meter** — a green/yellow/red bar (like Bubble Pop's timer bar).
- Pause / Restart level / Help from the `BaseGame` chrome.

## Educational integration

Three touchpoints, all sourced from existing content:

- **Sky's tips** — intro framing; live contextual hints via
  `DiscoveryJournal.getContextualHints()` (reasons about missing trophic levels, low health,
  isolated species); praise on success.
- **Tap-a-creature fun-facts** — from `SpeciesManager`'s three facts per species.
- **End-of-level recap** — a "You discovered: *food chains*!" card pulling the level's `lesson`
  from `DiscoveryJournal`, tying play to concept. Mid-level discovery pop-ups
  (`DiscoveryJournal.checkDiscoveries`) are a light optional bonus.

## Accessibility (first-class in this repo)

- Sky's tip bar / goal / win-lose are the `aria-live` narration; the **live population panel is
  text counts**, so dynamics are readable by screen readers, not only visible.
- Palette items are real `<button>`s with aria-labels ("Add Rabbit, a herbivore"). Because
  canvas creatures cannot hold focus, **tapping a population-panel row shows the same fun-fact
  card** as tapping a creature — a keyboard/SR path to every species.
- `prefers-reduced-motion` gates creature wandering; focus moves to the goal heading on each new
  level; health is shown with text + colour (never colour alone).

## Data fixes (small, in the model)

- `SpeciesManager`: `shark.prey` lists a nonexistent `'fish'` → repoint to `sea_turtle` (a real
  ocean species) so sharks have valid prey.
- `HabitatBuilder`: `desert`/`arctic` reference species that don't exist → not used in v1 (data
  left in place, deferred to v2 when those species are added).
- A test asserts no level references a species/habitat/lesson key that doesn't resolve.

## Testing

- **Vitest** (model, no DOM):
  - Level-definition integrity: every `starting`/`palette` species exists in `SpeciesManager`,
    every `habitat` in `HabitatBuilder`, every `lesson` in `DiscoveryJournal`; `goal` objects are
    well-formed for their `type`.
  - `LevelManager` win/lose evaluation against hand-built ecosystem-state snapshots for each goal
    type (`survive`, `reachHealth`, `noExtinctions`, `biodiversity`).
  - Engine-wiring sanity: a producer + herbivore persists (neither extinct) over N ticks; adding
    a predator reins in an overgrazing prey population.
  - The shark-prey fix (`getPrey('shark')` returns a real species).
- **Playwright** (real browser): load Level 1 → tap to add rabbit → sim runs → goal met → recap
  → advance to Level 2; reduced-motion emulation still completes the level; mobile viewport
  (390px) playable; tapping a population-panel row shows a fact card.

## MVP boundary (v1)

5 guided levels · 3 habitats (grassland/forest/ocean) · tap-to-add · animated emoji habitat ·
live population panel + health meter · Sky tips + fun-facts + end-of-level recap · extends
`BaseGame` · linear progression persisted. Simple `BaseGame` tones for feedback. **No new
audio or art assets.**

## Explicitly v2 / out of scope

Free sandbox mode; difficulty tiers; additional challenge levels; hidden challenges / Easter
eggs; achievements; desert/arctic habitats (need new species); scrolling time-series population
graph; custom art and sound.

## Next step

Transition to the writing-plans skill to produce the implementation plan from this spec.
