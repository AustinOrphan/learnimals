# Ecosystem Safari Build-out Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Ecosystem Safari into a real, playable guided-levels game: reuse the working simulation/content modules, rebuild the controller on `BaseGame`, and add an animated emoji habitat + DOM controls across 5 teaching levels.

**Architecture:** Keep the four real modules (`EcosystemEngine`, `SpeciesManager`, `HabitatBuilder`, `DiscoveryJournal`) as the model layer. Rewrite `EcosystemSafariGame` to extend `BaseGame` (canvas render loop + a11y + mobile + state machine). Add `LevelManager` + `levels.js` for the guided-levels loop. The canvas draws the habitat + emoji creatures whose counts track engine populations; DOM panels (palette, population panel, health, Sky's tips) sit around it. Delete the fake inline demo.

**Tech Stack:** Plain ES modules (no framework/build), `BaseGame` (`components/games/BaseGame.js`), Vitest (jsdom) for model/logic, Playwright for the browser loop. Node 20.15.1.

## Global Constraints

- No framework, no build step, no backend. Static site served from repo root. ES modules; relative imports include the `.js` extension; HTML module scripts use root-absolute `/…` paths.
- Children's app (COPPA/child-safety): all facts and content accurate, kid-friendly, safe.
- Accessibility first-class: Sky's tip bar / goal / outcomes are `aria-live`; the population panel shows **text counts** (screen-reader-readable dynamics); palette items are real `<button>`s with aria-labels; tapping a population-panel **row** gives the same fun-fact card as tapping a canvas creature (keyboard/SR path); all creature motion gated behind `prefers-reduced-motion`; focus moves to the goal heading on each new level; never color-only.
- **No new art or audio assets.** Species render as emoji; feedback uses `BaseGame` tones only.
- Reuse the model modules as-is except the two documented data touch-ups. Do NOT rewrite the engine.
- Model API facts the code MUST honor (verified against source):
  - `engine.addSpecies(speciesObject, initialPopulation)` — pass the full object from `speciesManager.getSpecies(id)`, not an id.
  - `engine.addHabitat(habitat)` reads `habitat.type`; habitats only have `id` → always pass `{ ...habitat, type: habitat.id }`.
  - `engine.update(deltaTime)` — `deltaTime` in **milliseconds**; returns nothing; mutates internal state.
  - `engine.getEcosystemState()` → `{ health:Number(0-100), totalPopulation, biodiversityIndex, temperature, humidity, populations:[{id,name,currentPopulation,trophicLevel,maxPopulation,...}], relationships:[[predatorId,[preyId...]]], environmentalFactors:{...} }`. `populations` items do NOT carry `sprite`/`facts`/`emoji` — join with `speciesManager.getSpecies(id)` for those.
  - `engine.applyChallenge({ type: 'drought'|'flood'|'pollution'|'climate_change'|'disease', ... })` — an **object**, not a string.
  - `speciesManager.getSpecies(id)` → full species object `{id,name,type,trophicLevel,preferredHabitat,prey?,relationships?,facts:[...],sprite:{...},...}` or `null`.
  - `habitatBuilder.selectHabitat(id)` → boolean; then `habitatBuilder.getCurrentHabitat()` → habitat object.
  - Only `grassland` (`grass,rabbit,hawk,bacteria`), `forest` (`oak_tree,deer,wolf,bee,bacteria`), `ocean` (`seaweed,sea_turtle,shark,bacteria`) have complete rosters. Do NOT use `desert`/`arctic`.
  - `discoveryJournal.getContextualHints({ ecosystemHealth, species, isolatedSpecies? })` → array of `{type,title,message,suggestedActions?}` (pass `species = state.populations`).
  - Lesson keys are underscore: `food_chains`, `biodiversity`, `symbiosis`, `limiting_factors`, `adaptation`, `conservation`.
- Style: 2-space indent, single quotes, semicolons; Prettier printWidth 100 (HTML/CSS 120). ESLint clean. Conventional Commits with scope, no emoji in commit messages, and NEVER a `Co-Authored-By` line (per CLAUDE.local.md).
- Commands run from `/home/dev/src/learnimals`. Use local binaries: `node_modules/.bin/vitest run <path>`, `node_modules/.bin/prettier`, `node_modules/.bin/eslint`. Full unit run: `node_modules/.bin/vitest run`. Browser: `python3 -m http.server 3000` from repo root, then Playwright chromium against `http://localhost:3000/games/ecosystem-safari/`. The project e2e config can't load here (e2e-core is CI-only) — verify Playwright locally with a throwaway standalone config, exactly as `e2e/tests/games.spec.ts` was verified; commit only the spec.

## File Structure

```text
games/ecosystem-safari/
  index.html              → rewritten: canvas + DOM control panels + custom Pause/Restart/Help; fake demo deleted
  EcosystemSafariGame.js  → rewritten: extends BaseGame; the whole game
  LevelManager.js         → NEW: levels + goal evaluation + progression
  levels.js               → NEW: the 5 level definitions
  EcosystemEngine.js      → unchanged
  SpeciesManager.js       → 1-line data fix (shark.prey)
  HabitatBuilder.js       → unchanged
  DiscoveryJournal.js     → +1 small ungated accessor (getLessonContent)
  ecosystemSafari.css     → extended for the new DOM controls
  test-validation.js      → DELETED
tests/unit/ecosystem-safari/
  model-fixes.test.js     → NEW (Task 1)
  levels.test.js          → NEW (Task 2)
  levelManager.test.js    → NEW (Task 2)
e2e/tests/
  ecosystem-safari.spec.ts→ NEW (Task 7)
```

**Reference for BaseGame integration:** `games/bubble-pop/BubblePopGameTemplate.js` is a working game that extends `BaseGame` (overrides `update(deltaTime,timestamp)`, `render()`, `onClick(position)`, `onResize(w,h)`, `onGameEnd()`, `onRestart()`; uses `this.state`, `this.addScore()`, `this.setState()`, `this.playSound()`, `this.canvas`/`this.ctx`, `getPointerPosition`). Follow its patterns for the parts this plan doesn't spell out.

---

### Task 1: Model data fixes + ungated lesson accessor

Two tiny, safe model touch-ups with unit tests, isolated from the rest.

**Files:**
- Modify: `games/ecosystem-safari/SpeciesManager.js:244`
- Modify: `games/ecosystem-safari/DiscoveryJournal.js` (add one method)
- Test: `tests/unit/ecosystem-safari/model-fixes.test.js`

**Interfaces:**
- Produces: `getPrey('shark')` returns only real species; `discoveryJournal.getLessonContent(id)` returns a loaded lesson object regardless of unlock state.

- [ ] **Step 1: Write the failing test**

`tests/unit/ecosystem-safari/model-fixes.test.js`:

```js
import { describe, it, expect } from 'vitest';
import SpeciesManager from '../../../games/ecosystem-safari/SpeciesManager.js';
import DiscoveryJournal from '../../../games/ecosystem-safari/DiscoveryJournal.js';

describe('SpeciesManager shark prey fix', () => {
  const sm = new SpeciesManager();
  it('shark prey no longer references the non-existent "fish"', () => {
    expect(sm.getSpecies('shark').prey).not.toContain('fish');
  });
  it('getPrey("shark") returns real species objects only', () => {
    const prey = sm.getPrey('shark');
    expect(prey.length).toBeGreaterThan(0);
    prey.forEach(p => expect(p).not.toBeNull());
    expect(prey.map(p => p.id)).toContain('sea_turtle');
  });
});

describe('DiscoveryJournal.getLessonContent (ungated)', () => {
  const dj = new DiscoveryJournal();
  it('returns a loaded lesson by key without needing an unlock', () => {
    const lesson = dj.getLessonContent('food_chains');
    expect(lesson).toBeTruthy();
    expect(lesson.title).toMatch(/food chain/i);
    expect(lesson.content.summary).toBeTruthy();
  });
  it('returns null for an unknown key', () => {
    expect(dj.getLessonContent('nope')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node_modules/.bin/vitest run tests/unit/ecosystem-safari/model-fixes.test.js`
Expected: FAIL — `getLessonContent` is not a function, and shark prey still contains `'fish'`.

- [ ] **Step 3: Fix `SpeciesManager.js:244`**

Change the shark `prey` line from:

```js
    prey: ['sea_turtle', 'fish'], // fish would be another species we could add
```

to:

```js
    prey: ['sea_turtle'], // sharks hunt sea turtles in this ecosystem
```

- [ ] **Step 4: Add the ungated accessor to `DiscoveryJournal.js`**

Lessons are stored in `this.educationalContent` (a Map keyed by lesson id, populated in `loadEducationalContent()`). `getEducationalContent(id)` is gated behind `unlockedContent`; add an ungated read for recaps. Add this method to the class (near `getEducationalContent`):

```js
  /**
   * Read a loaded lesson by id, ignoring unlock state. Used for end-of-level
   * recaps where we deliberately want to show the concept regardless of triggers.
   * @param {string} lessonId
   * @returns {Object|null} the lesson content object, or null if unknown
   */
  getLessonContent(lessonId) {
    return this.educationalContent.get(lessonId) || null;
  }
```

(If the field is named differently than `educationalContent`, use the actual Map that `loadEducationalContent()` populates — confirm by reading that method first.)

- [ ] **Step 5: Run test to verify it passes**

Run: `node_modules/.bin/vitest run tests/unit/ecosystem-safari/model-fixes.test.js`
Expected: PASS (4 tests).

- [ ] **Step 6: Full unit suite + commit**

Run: `node_modules/.bin/vitest run` → expect the existing baseline still green plus the new file.

```bash
node_modules/.bin/prettier --write games/ecosystem-safari/SpeciesManager.js games/ecosystem-safari/DiscoveryJournal.js tests/unit/ecosystem-safari/model-fixes.test.js
git add games/ecosystem-safari/SpeciesManager.js games/ecosystem-safari/DiscoveryJournal.js tests/unit/ecosystem-safari/model-fixes.test.js
git commit -m "fix(ecosystem-safari): correct shark prey data and add ungated lesson accessor"
```

---

### Task 2: Level definitions + `LevelManager` (pure logic)

The guided-levels data and the goal-evaluation engine — DOM-free and fully unit-testable.

**Files:**
- Create: `games/ecosystem-safari/levels.js`
- Create: `games/ecosystem-safari/LevelManager.js`
- Test: `tests/unit/ecosystem-safari/levels.test.js`, `tests/unit/ecosystem-safari/levelManager.test.js`

**Interfaces:**
- `levels` — default-exported array of level objects (shape below). Palettes/starting species use ONLY each habitat's real roster.
- `LevelManager`:
  - `constructor(levels)` → holds levels; `current` index starts 0.
  - `get length()`, `getLevel(i)`, `get currentLevel()`.
  - `evaluateGoal(level, state, elapsedSec)` → `{ status: 'playing'|'won'|'lost', reason: string }`, where `state` is `engine.getEcosystemState()`.
  - `advance()` → increments current (clamped); `reset()` → current = 0.

- [ ] **Step 1: Create `games/ecosystem-safari/levels.js`**

Rosters honored: grassland = grass,rabbit,hawk,bacteria; forest = oak_tree,deer,wolf,bee,bacteria; ocean = seaweed,sea_turtle,shark,bacteria.

```js
// The 5 guided levels for Ecosystem Safari v1. Each is a small ecological puzzle
// with one teaching goal. Species in `starting`/`palette` must belong to the
// level's habitat roster (grassland/forest/ocean); `lesson` is a DiscoveryJournal
// key (underscore form); `goal.type` is one of survive|reachHealth|noExtinctions|biodiversity.

export const levels = [
  {
    id: 'meadow-food-chain',
    title: 'Build a Meadow',
    habitat: 'grassland',
    intro: "Sky: Every living thing needs energy. Plants catch it from the sun — let's start with grass. What eats grass?",
    starting: [{ species: 'grass', population: 45 }],
    palette: ['rabbit', 'hawk', 'bacteria'],
    goal: { type: 'survive', requires: ['grass', 'rabbit'], durationSec: 25 },
    challenge: null,
    lesson: 'food_chains',
    hint: 'Grass is a producer. Add a rabbit — a herbivore that eats grass.',
  },
  {
    id: 'meadow-predator-prey',
    title: 'Predator & Prey',
    habitat: 'grassland',
    intro: 'Sky: Uh oh — these rabbits are eating ALL the grass! In nature, predators keep things balanced. Who hunts rabbits?',
    starting: [
      { species: 'grass', population: 40 },
      { species: 'rabbit', population: 30 },
    ],
    palette: ['hawk', 'bacteria'],
    goal: { type: 'survive', requires: ['grass', 'rabbit', 'hawk'], durationSec: 30 },
    challenge: null,
    lesson: 'biodiversity',
    hint: 'Add a hawk. It eats rabbits, so the grass gets a chance to grow back.',
  },
  {
    id: 'forest-decomposers',
    title: 'The Cleanup Crew',
    habitat: 'forest',
    intro: "Sky: This forest is stuffed with life, but the soil is running out of nutrients. Something needs to recycle the leftovers...",
    starting: [
      { species: 'oak_tree', population: 30 },
      { species: 'deer', population: 20 },
      { species: 'wolf', population: 6 },
    ],
    palette: ['bacteria', 'bee'],
    goal: { type: 'reachHealth', healthTarget: 70, holdSec: 4, timeoutSec: 40 },
    challenge: null,
    lesson: 'limiting_factors',
    hint: 'Add bacteria — decomposers recycle dead matter back into nutrients the trees need.',
  },
  {
    id: 'ocean-balance',
    title: 'Ocean Balance',
    habitat: 'ocean',
    intro: 'Sky: Dive in! A healthy ocean needs producers, plant-eaters, AND predators. Build a food web that stays in balance.',
    starting: [{ species: 'seaweed', population: 50 }],
    palette: ['sea_turtle', 'shark', 'bacteria'],
    goal: { type: 'survive', requires: ['seaweed', 'sea_turtle', 'shark'], durationSec: 30 },
    challenge: null,
    lesson: 'food_chains',
    hint: 'Seaweed feeds sea turtles, and sharks hunt sea turtles. Add all three and watch the balance.',
  },
  {
    id: 'meadow-drought',
    title: 'Survive the Drought',
    habitat: 'grassland',
    intro: "Sky: Your meadow looks great — but a drought is coming! Diverse ecosystems survive tough times best. Keep as many species alive as you can.",
    starting: [
      { species: 'grass', population: 45 },
      { species: 'rabbit', population: 20 },
      { species: 'hawk', population: 5 },
      { species: 'bacteria', population: 15 },
    ],
    palette: ['rabbit', 'hawk', 'bacteria'],
    goal: { type: 'biodiversity', minSpecies: 3, timeoutSec: 35 },
    challenge: { type: 'drought', atSec: 8 },
    lesson: 'conservation',
    hint: 'Keep at least 3 species alive through the drought. Top up populations that start to crash.',
  },
];

export default levels;
```

- [ ] **Step 2: Write the failing tests**

`tests/unit/ecosystem-safari/levels.test.js`:

```js
import { describe, it, expect } from 'vitest';
import levels from '../../../games/ecosystem-safari/levels.js';
import SpeciesManager from '../../../games/ecosystem-safari/SpeciesManager.js';
import HabitatBuilder from '../../../games/ecosystem-safari/HabitatBuilder.js';
import DiscoveryJournal from '../../../games/ecosystem-safari/DiscoveryJournal.js';

const sm = new SpeciesManager();
const hb = new HabitatBuilder();
const dj = new DiscoveryJournal();

describe('level definitions integrity', () => {
  it('has 5 levels with unique ids', () => {
    expect(levels).toHaveLength(5);
    expect(new Set(levels.map(l => l.id)).size).toBe(5);
  });

  it('every habitat exists and every starting/palette species exists and belongs to that habitat', () => {
    for (const lvl of levels) {
      expect(hb.selectHabitat(lvl.habitat), lvl.id).toBe(true);
      const roster = hb.getCurrentHabitat().compatibleSpecies;
      const used = [...lvl.starting.map(s => s.species), ...lvl.palette];
      for (const id of used) {
        expect(sm.getSpecies(id), `${lvl.id}:${id}`).toBeTruthy();
        expect(roster, `${lvl.id}:${id} not in ${lvl.habitat} roster`).toContain(id);
      }
    }
  });

  it('every lesson key resolves in DiscoveryJournal', () => {
    for (const lvl of levels) {
      expect(dj.getLessonContent(lvl.lesson), lvl.id).toBeTruthy();
    }
  });

  it('every goal is well-formed for its type', () => {
    for (const lvl of levels) {
      const g = lvl.goal;
      expect(['survive', 'reachHealth', 'noExtinctions', 'biodiversity']).toContain(g.type);
      if (g.type === 'survive') {
        expect(Array.isArray(g.requires)).toBe(true);
        expect(g.durationSec).toBeGreaterThan(0);
      }
      if (g.type === 'reachHealth') expect(g.healthTarget).toBeGreaterThan(0);
      if (g.type === 'biodiversity') expect(g.minSpecies).toBeGreaterThan(0);
    }
  });

  it('challenge types (when present) are valid engine challenges', () => {
    const valid = ['drought', 'flood', 'pollution', 'climate_change', 'disease'];
    for (const lvl of levels) {
      if (lvl.challenge) expect(valid).toContain(lvl.challenge.type);
    }
  });
});
```

`tests/unit/ecosystem-safari/levelManager.test.js`:

```js
import { describe, it, expect } from 'vitest';
import LevelManager from '../../../games/ecosystem-safari/LevelManager.js';

// Minimal fake ecosystem-state builder matching engine.getEcosystemState() shape.
const state = (health, present) => ({
  health,
  populations: present.map(id => ({ id, currentPopulation: 10, trophicLevel: 2 })),
});

const survive = { type: 'survive', requires: ['grass', 'rabbit'], durationSec: 20 };
const reach = { type: 'reachHealth', healthTarget: 70, holdSec: 3, timeoutSec: 30 };
const bio = { type: 'biodiversity', minSpecies: 3, timeoutSec: 30 };

describe('LevelManager.evaluateGoal', () => {
  const lm = new LevelManager([{ id: 'a', goal: survive }]);

  it('survive: playing while required species alive and timer not reached', () => {
    expect(lm.evaluateGoal({ goal: survive }, state(80, ['grass', 'rabbit']), 5).status).toBe('playing');
  });
  it('survive: won once required species survive the full duration', () => {
    expect(lm.evaluateGoal({ goal: survive }, state(80, ['grass', 'rabbit']), 20).status).toBe('won');
  });
  it('survive: lost if a required species is missing (extinct)', () => {
    const r = lm.evaluateGoal({ goal: survive }, state(80, ['grass']), 5);
    expect(r.status).toBe('lost');
  });

  it('reachHealth: won only after health held above target for holdSec', () => {
    const lvl = { goal: reach };
    expect(lm.evaluateGoal(lvl, state(75, ['grass']), 1).status).toBe('playing'); // just reached
    expect(lm.evaluateGoal(lvl, state(75, ['grass']), 5).status).toBe('won'); // held long enough
  });
  it('reachHealth: lost on timeout without reaching target', () => {
    expect(lm.evaluateGoal({ goal: reach }, state(40, ['grass']), 31).status).toBe('lost');
  });

  it('biodiversity: lost if species drop below minSpecies', () => {
    expect(lm.evaluateGoal({ goal: bio }, state(50, ['grass', 'rabbit']), 10).status).toBe('lost');
  });
  it('biodiversity: won if minSpecies survive to timeout', () => {
    expect(lm.evaluateGoal({ goal: bio }, state(50, ['grass', 'rabbit', 'hawk']), 30).status).toBe('won');
  });
});

describe('LevelManager progression', () => {
  it('advances and clamps', () => {
    const lm = new LevelManager([{ id: 'a' }, { id: 'b' }]);
    expect(lm.currentLevel.id).toBe('a');
    lm.advance();
    expect(lm.currentLevel.id).toBe('b');
    lm.advance();
    expect(lm.current).toBe(1); // clamped at last
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `node_modules/.bin/vitest run tests/unit/ecosystem-safari/levels.test.js tests/unit/ecosystem-safari/levelManager.test.js`
Expected: FAIL — `LevelManager` does not exist yet (levels.js exists from Step 1). If any `levels.test.js` case fails on a roster mismatch, the level data is wrong — fix the level palette, not the test.

- [ ] **Step 4: Create `games/ecosystem-safari/LevelManager.js`**

```js
// Guided-levels controller logic: holds the ordered levels, tracks progress, and
// decides win/lose from an engine ecosystem-state snapshot. Pure and DOM-free.

export default class LevelManager {
  constructor(levels) {
    this.levels = levels;
    this.current = 0;
    // Transient per-attempt trackers (reset via resetAttempt on each (re)start).
    this._healthHeldSince = null;
  }

  get length() {
    return this.levels.length;
  }

  getLevel(i) {
    return this.levels[i] || null;
  }

  get currentLevel() {
    return this.levels[this.current] || null;
  }

  advance() {
    this.current = Math.min(this.current + 1, this.levels.length - 1);
    this.resetAttempt();
    return this.currentLevel;
  }

  reset() {
    this.current = 0;
    this.resetAttempt();
  }

  resetAttempt() {
    this._healthHeldSince = null;
  }

  /** Which required species are currently alive (present with a positive population). */
  _alive(state) {
    return new Set(state.populations.filter(p => p.currentPopulation > 0.5).map(p => p.id));
  }

  /**
   * @param {Object} level - a level definition
   * @param {Object} state - engine.getEcosystemState()
   * @param {number} elapsedSec - seconds since this attempt started
   * @returns {{status:'playing'|'won'|'lost', reason:string}}
   */
  evaluateGoal(level, state, elapsedSec) {
    const goal = level.goal;
    const alive = this._alive(state);

    switch (goal.type) {
      case 'survive': {
        const missing = goal.requires.filter(id => !alive.has(id));
        if (missing.length) return { status: 'lost', reason: `${missing[0]} died out` };
        if (elapsedSec >= goal.durationSec) return { status: 'won', reason: 'balanced' };
        return { status: 'playing', reason: '' };
      }
      case 'noExtinctions': {
        const missing = goal.requires.filter(id => !alive.has(id));
        if (missing.length) return { status: 'lost', reason: `${missing[0]} died out` };
        if (elapsedSec >= goal.durationSec) return { status: 'won', reason: 'survived' };
        return { status: 'playing', reason: '' };
      }
      case 'reachHealth': {
        if (state.health >= goal.healthTarget) {
          if (this._healthHeldSince == null) this._healthHeldSince = elapsedSec;
          if (elapsedSec - this._healthHeldSince >= goal.holdSec) {
            return { status: 'won', reason: 'healthy' };
          }
        } else {
          this._healthHeldSince = null;
        }
        if (elapsedSec >= goal.timeoutSec) return { status: 'lost', reason: 'ran out of time' };
        return { status: 'playing', reason: '' };
      }
      case 'biodiversity': {
        const count = state.populations.filter(p => p.currentPopulation > 0.5).length;
        if (count < goal.minSpecies) return { status: 'lost', reason: 'too many species died' };
        if (elapsedSec >= goal.timeoutSec) return { status: 'won', reason: 'diverse and resilient' };
        return { status: 'playing', reason: '' };
      }
      default:
        return { status: 'playing', reason: '' };
    }
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node_modules/.bin/vitest run tests/unit/ecosystem-safari/levels.test.js tests/unit/ecosystem-safari/levelManager.test.js`
Expected: PASS. Note: the `reachHealth` "held long enough" test relies on calling `evaluateGoal` twice with increasing `elapsedSec` on the same `LevelManager` instance (the hold-timer is stateful) — the test above does exactly that.

- [ ] **Step 6: Full suite + commit**

```bash
node_modules/.bin/prettier --write games/ecosystem-safari/levels.js games/ecosystem-safari/LevelManager.js tests/unit/ecosystem-safari/levels.test.js tests/unit/ecosystem-safari/levelManager.test.js
node_modules/.bin/vitest run
git add games/ecosystem-safari/levels.js games/ecosystem-safari/LevelManager.js tests/unit/ecosystem-safari/
git commit -m "feat(ecosystem-safari): add level definitions and LevelManager goal logic"
```

---

### Task 3: Controller skeleton + page + live DOM panels (static canvas)

Rewrite the controller to extend `BaseGame`, wire the model, tick the simulation, and drive the DOM panels + goal flow. Canvas draws only the habitat background for now (creatures come in Task 4). Deliverable: load `/games/ecosystem-safari/`, see the habitat backdrop, tap palette species to add them, and watch the population panel + health meter update live as the engine ticks; reaching a goal shows a win, losing shows a retry.

**Files:**
- Rewrite: `games/ecosystem-safari/index.html`
- Rewrite: `games/ecosystem-safari/EcosystemSafariGame.js`
- Extend: `games/ecosystem-safari/ecosystemSafari.css`
- Delete: `games/ecosystem-safari/test-validation.js`

**Interfaces:**
- Consumes: `LevelManager`, `levels`, the four model modules, `BaseGame`.
- Produces: `window.ecosystemGame` (the instance) for tests; DOM ids the tests rely on: `#ecosystem-canvas`, `#eco-goal`, `#eco-timer`, `#eco-tip`, `#eco-palette`, `#eco-population-panel`, `#eco-health-fill`, `#eco-health-label`, plus win/lose overlays `#eco-win`, `#eco-lose`, and buttons `#eco-next`, `#eco-retry`.

- [ ] **Step 1: Rewrite `games/ecosystem-safari/index.html`**

Standard page shell (nav + hero + theme scripts + footer, mirroring `subjects/science/index.html`) with the game layout: a canvas plus DOM control panels, and a `<script type="module">` that instantiates the game. Delete the entire old inline demo. Structure:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Build living ecosystems and keep them in balance with Sky the Parrot!" />
    <title>Sky's Ecosystem Safari - Learnimals</title>
    <link rel="stylesheet" href="/styles/base/styles.css" />
    <link rel="stylesheet" href="/styles/components/navbar.css" />
    <link rel="stylesheet" href="/styles/components/components.css" />
    <link rel="stylesheet" href="/styles/components/themeSwitcher.css" />
    <link rel="stylesheet" href="/games/ecosystem-safari/ecosystemSafari.css" />
    <link rel="stylesheet" href="/styles/components/grown-ups.css" />
    <link rel="icon" href="/public/images/favicon.ico" type="image/x-icon" />
    <link rel="manifest" href="/public/manifest.json" />
  </head>
  <body>
    <div id="navbar-placeholder"></div>
    <main>
      <section class="hero">
        <h1>🦜 Sky's Ecosystem Safari</h1>
        <p>Build a living ecosystem, then keep every species alive and balanced!</p>
      </section>

      <section class="eco-game" aria-label="Ecosystem Safari game">
        <div class="eco-topbar">
          <h2 class="eco-goal" id="eco-goal" tabindex="-1">Loading…</h2>
          <span class="eco-timer" id="eco-timer" aria-hidden="true"></span>
          <div class="eco-controls">
            <button type="button" id="eco-pause">⏸ Pause</button>
            <button type="button" id="eco-restart">🔄 Restart</button>
            <button type="button" id="eco-help">❓ Help</button>
          </div>
        </div>

        <p class="eco-tip" id="eco-tip" aria-live="polite"></p>

        <div class="eco-stage">
          <canvas id="ecosystem-canvas" aria-label="Ecosystem habitat"></canvas>

          <aside class="eco-side">
            <div class="eco-health">
              <span id="eco-health-label">Health: 100%</span>
              <div class="eco-health-bar"><div class="eco-health-fill" id="eco-health-fill"></div></div>
            </div>
            <h3>Populations</h3>
            <ul class="eco-population-panel" id="eco-population-panel"></ul>
          </aside>
        </div>

        <h3>Add species</h3>
        <div class="eco-palette" id="eco-palette"></div>

        <!-- Win / Lose overlays (hidden by default) -->
        <div class="eco-overlay" id="eco-win" hidden>
          <div class="eco-card">
            <h2 id="eco-win-title">Balanced! 🎉</h2>
            <p id="eco-win-lesson"></p>
            <button type="button" id="eco-next">Next level →</button>
          </div>
        </div>
        <div class="eco-overlay" id="eco-lose" hidden>
          <div class="eco-card">
            <h2>Oops — the food web broke!</h2>
            <p id="eco-lose-hint"></p>
            <button type="button" id="eco-retry">Try again</button>
          </div>
        </div>
      </section>
    </main>

    <section class="grown-ups-section">
      <details class="grown-ups">
        <summary>👩‍🏫 For grown-ups: what this practises</summary>
        <div class="grown-ups-content">
          <p>
            Ecosystem Safari teaches food webs, predator–prey balance, decomposers, and ecosystem
            resilience through short, hands-on puzzle levels driven by a real population-dynamics
            simulation.
          </p>
        </div>
      </details>
    </section>

    <footer>
      <p>&copy; 2025 Learnimals. All rights reserved.</p>
      <div class="footer-links">
        <a href="/pages/about.html">About Us</a>
        <a href="/pages/contact.html">Contact</a>
        <a href="/pages/privacy.html">Privacy Policy</a>
        <a href="/pages/profile.html">My Profile</a>
      </div>
    </footer>

    <script type="module">
      import EcosystemSafariGame from '/games/ecosystem-safari/EcosystemSafariGame.js';
      const start = () => {
        window.ecosystemGame = new EcosystemSafariGame('ecosystem-canvas');
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
      else start();
    </script>
    <script defer type="module" src="/themeInitializer.js"></script>
    <script type="module" src="/utils/themeManager.js"></script>
    <script type="module" src="/components/layout/themeSwitcher.js"></script>
    <script defer src="/components/layout/navbarLoader.js"></script>
    <script defer src="/components/component-loader.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Rewrite `games/ecosystem-safari/EcosystemSafariGame.js` (controller core)**

Extends `BaseGame`. This step implements: model wiring, level loading (with the `type: habitat.id` bridge and species-object `addSpecies`), the fixed-timestep sim tick, DOM panel sync, palette building + tap-to-add, goal evaluation → win/lose overlays, Sky's tips, and progression. `render()` fills the habitat background only (creatures arrive in Task 4). Follow `BubblePopGameTemplate` for BaseGame override conventions.

```js
import BaseGame from '../../components/games/BaseGame.js';
import EcosystemEngine from './EcosystemEngine.js';
import SpeciesManager from './SpeciesManager.js';
import HabitatBuilder from './HabitatBuilder.js';
import DiscoveryJournal from './DiscoveryJournal.js';
import LevelManager from './LevelManager.js';
import levels from './levels.js';

// Emoji per species id (no art assets). Producers first, then consumers, decomposer, pollinator.
const SPECIES_EMOJI = {
  grass: '🌿',
  oak_tree: '🌳',
  seaweed: '🪸',
  rabbit: '🐰',
  deer: '🦌',
  sea_turtle: '🐢',
  hawk: '🦅',
  wolf: '🐺',
  shark: '🦈',
  bacteria: '🦠',
  bee: '🐝',
};

// Per-habitat background gradient stops [top, bottom].
const HABITAT_BG = {
  grassland: ['#aee36b', '#5a9a2e'],
  forest: ['#5fa96a', '#20502c'],
  ocean: ['#4facfe', '#0a4d8c'],
};

const SIM_TICK_MS = 500; // engine ticks twice a second

export default class EcosystemSafariGame extends BaseGame {
  constructor(canvasId, options = {}) {
    super(canvasId, { gameType: 'ecosystem', subject: 'science', ...options });

    this.speciesManager = new SpeciesManager();
    this.habitatBuilder = new HabitatBuilder();
    this.discoveryJournal = new DiscoveryJournal();
    this.engine = new EcosystemEngine({});
    this.levelManager = new LevelManager(levels);

    this.creatures = []; // {id, emoji, x, y, driftPhase} — populated in Task 4
    this.state_ = null; // latest engine.getEcosystemState()
    this.elapsedSec = 0;
    this._simAccumMs = 0;
    this._attemptOver = false;
    this._challengeFired = false;

    this.loadCurrentLevel();
    this.wireControls();
    this.start(); // BaseGame: begins the loop, sets state 'playing'
  }

  onInitialized() {
    // BaseGame calls this after canvas/DOM setup. Nothing extra needed here.
  }

  /** Load the LevelManager's current level into the engine + UI. */
  loadCurrentLevel() {
    const level = this.levelManager.currentLevel;
    this.level_ = level;
    this.elapsedSec = 0;
    this._simAccumMs = 0;
    this._attemptOver = false;
    this._challengeFired = false;
    this.levelManager.resetAttempt();

    // Habitat → engine (bridge id → type).
    this.habitatBuilder.selectHabitat(level.habitat);
    const habitat = this.habitatBuilder.getCurrentHabitat();
    this.engine.reset();
    this.engine.addHabitat({ ...habitat, type: habitat.id });
    this.habitatBg = HABITAT_BG[level.habitat] || HABITAT_BG.grassland;

    // Starting species (pass full species objects).
    for (const entry of level.starting) {
      const sp = this.speciesManager.getSpecies(entry.species);
      if (sp) this.engine.addSpecies(sp, entry.population);
    }

    this.state_ = this.engine.getEcosystemState();
    this.rebuildCreatures(); // Task 4 (no-op-safe until then)
    this.buildPalette(level);
    this.updateGoalUI(level);
    this.setTip(level.intro);
    this.syncPanels();
    this.hideOverlays();
    document.getElementById('eco-goal')?.focus();
  }

  /** Build the tappable species palette for this level. */
  buildPalette(level) {
    const palette = document.getElementById('eco-palette');
    if (!palette) return;
    palette.innerHTML = '';
    for (const id of level.palette) {
      const sp = this.speciesManager.getSpecies(id);
      if (!sp) continue;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'eco-palette-item';
      btn.setAttribute('aria-label', `Add ${sp.name}, a ${this.roleLabel(sp)}`);
      btn.innerHTML = `<span class="eco-emoji" aria-hidden="true">${SPECIES_EMOJI[id] || '❓'}</span><span class="eco-name">${sp.name}</span>`;
      btn.addEventListener('click', () => this.addSpeciesByTap(id));
      palette.appendChild(btn);
    }
  }

  roleLabel(sp) {
    return sp.trophicLevel <= 1 ? 'producer' : sp.trophicLevel >= 3 ? 'predator' : sp.trophicLevel === 0 ? 'decomposer' : 'herbivore';
  }

  /** Player taps a species: add it (or nudge its population up if already present). */
  addSpeciesByTap(id) {
    if (this.state !== 'playing' || this._attemptOver) return;
    const sp = this.speciesManager.getSpecies(id);
    if (!sp) return;
    this.engine.addSpecies(sp, 12);
    this.playSound(440, 120);
    this.state_ = this.engine.getEcosystemState();
    this.rebuildCreatures();
    this.syncPanels();
  }

  /** Fixed-timestep simulation, driven by BaseGame's update(deltaTime, timestamp). */
  update(deltaTime, _timestamp) {
    if (this.state !== 'playing' || this._attemptOver) return;

    this.elapsedSec += deltaTime / 1000;
    this._simAccumMs += deltaTime;

    // Fire a scheduled challenge (e.g. drought) once.
    const ch = this.level_.challenge;
    if (ch && !this._challengeFired && this.elapsedSec >= ch.atSec) {
      this.engine.applyChallenge({ type: ch.type });
      this._challengeFired = true;
      this.setTip(`Sky: A ${ch.type} is here! Keep your species alive!`);
    }

    while (this._simAccumMs >= SIM_TICK_MS) {
      this.engine.update(SIM_TICK_MS);
      this._simAccumMs -= SIM_TICK_MS;
    }

    this.state_ = this.engine.getEcosystemState();
    this.updateCreatures(deltaTime); // Task 4 (safe no-op until then)
    this.syncPanels();
    this.maybeHint();

    const verdict = this.levelManager.evaluateGoal(this.level_, this.state_, this.elapsedSec);
    if (verdict.status === 'won') this.winLevel();
    else if (verdict.status === 'lost') this.loseLevel(verdict.reason);
  }

  /** Draw the habitat background. Creatures added in Task 4. */
  render() {
    const { ctx, canvas } = this;
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, this.habitatBg[0]);
    grad.addColorStop(1, this.habitatBg[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.renderCreatures(); // Task 4 (safe no-op until then)
  }

  // --- DOM sync -----------------------------------------------------------
  syncPanels() {
    const s = this.state_;
    if (!s) return;
    const health = Math.round(s.health);
    const fill = document.getElementById('eco-health-fill');
    const label = document.getElementById('eco-health-label');
    if (fill) {
      fill.style.width = `${Math.max(0, Math.min(100, health))}%`;
      fill.style.background = health > 66 ? '#2ecc71' : health > 33 ? '#f1c40f' : '#e74c3c';
    }
    if (label) label.textContent = `Health: ${health}%`;

    const panel = document.getElementById('eco-population-panel');
    if (panel) {
      panel.innerHTML = '';
      for (const p of s.populations) {
        const li = document.createElement('li');
        li.className = 'eco-pop-row';
        const count = Math.round(p.currentPopulation);
        li.innerHTML = `<button type="button" class="eco-pop-btn" aria-label="${p.name}: ${count}. Tap for facts.">
            <span class="eco-emoji" aria-hidden="true">${SPECIES_EMOJI[p.id] || '❓'}</span>
            <span class="eco-pop-count">${count}</span>
            <span class="eco-pop-bar" aria-hidden="true"><span style="width:${Math.min(100, (p.currentPopulation / (p.maxPopulation || 100)) * 100)}%"></span></span>
          </button>`;
        li.querySelector('button').addEventListener('click', () => this.showFactCard(p.id));
        panel.appendChild(li);
      }
    }

    const timer = document.getElementById('eco-timer');
    if (timer) timer.textContent = this.timerText();
  }

  timerText() {
    const g = this.level_.goal;
    const limit = g.durationSec || g.timeoutSec;
    if (!limit) return '';
    return `⏱ ${Math.max(0, Math.ceil(limit - this.elapsedSec))}s`;
  }

  updateGoalUI(level) {
    const el = document.getElementById('eco-goal');
    if (el) el.textContent = this.goalText(level);
  }

  goalText(level) {
    const g = level.goal;
    switch (g.type) {
      case 'survive':
      case 'noExtinctions':
        return `${level.title}: keep ${g.requires.map(id => SPECIES_EMOJI[id] || id).join(' ')} alive for ${g.durationSec}s`;
      case 'reachHealth':
        return `${level.title}: get ecosystem health to ${g.healthTarget}%`;
      case 'biodiversity':
        return `${level.title}: keep at least ${g.minSpecies} species alive`;
      default:
        return level.title;
    }
  }

  setTip(text) {
    const el = document.getElementById('eco-tip');
    if (el) el.textContent = text;
  }

  /** Occasionally surface a contextual hint when things look wrong. */
  maybeHint() {
    if (!this.state_ || this.state_.health >= 50) return;
    if (this._lastHintSec && this.elapsedSec - this._lastHintSec < 6) return;
    const hints = this.discoveryJournal.getContextualHints({
      ecosystemHealth: this.state_.health,
      species: this.state_.populations,
    });
    if (hints.length) {
      this.setTip(`Sky: ${hints[0].message}`);
      this._lastHintSec = this.elapsedSec;
    }
  }

  showFactCard(id) {
    const content = this.speciesManager.getEducationalContent(id);
    if (!content) return;
    const fact = content.facts[Math.floor(Math.random() * content.facts.length)];
    this.setTip(`${SPECIES_EMOJI[id] || ''} ${content.name}: ${fact}`);
  }

  // --- Win / lose ---------------------------------------------------------
  winLevel() {
    this._attemptOver = true;
    this.setState('complete'); // BaseGame state
    this.addScore(100);
    this.playSound(660, 200);
    const lesson = this.discoveryJournal.getLessonContent(this.level_.lesson);
    const lessonEl = document.getElementById('eco-win-lesson');
    if (lessonEl && lesson) lessonEl.textContent = `You discovered: ${lesson.title} — ${lesson.content.summary}`;
    const win = document.getElementById('eco-win');
    if (win) win.hidden = false;
    // Hide "Next" on the final level.
    const next = document.getElementById('eco-next');
    if (next) next.textContent = this.levelManager.current >= this.levelManager.length - 1 ? 'Play again' : 'Next level →';
  }

  loseLevel(reason) {
    this._attemptOver = true;
    this.playSound(180, 300);
    const hintEl = document.getElementById('eco-lose-hint');
    if (hintEl) hintEl.textContent = `${reason ? reason + '. ' : ''}${this.level_.hint}`;
    const lose = document.getElementById('eco-lose');
    if (lose) lose.hidden = false;
  }

  hideOverlays() {
    document.getElementById('eco-win')?.setAttribute('hidden', '');
    document.getElementById('eco-lose')?.setAttribute('hidden', '');
  }

  wireControls() {
    document.getElementById('eco-next')?.addEventListener('click', () => {
      if (this.levelManager.current >= this.levelManager.length - 1) this.levelManager.reset();
      else this.levelManager.advance();
      this.setState('playing');
      this.loadCurrentLevel();
    });
    document.getElementById('eco-retry')?.addEventListener('click', () => {
      this.setState('playing');
      this.loadCurrentLevel();
    });
    document.getElementById('eco-restart')?.addEventListener('click', () => {
      this.setState('playing');
      this.loadCurrentLevel();
    });
    document.getElementById('eco-pause')?.addEventListener('click', () => {
      if (this.state === 'paused') this.resume();
      else this.pause();
    });
    document.getElementById('eco-help')?.addEventListener('click', () => this.setTip(this.level_.hint));
  }

  // --- Task 4 placeholders (no-op until implemented) ----------------------
  rebuildCreatures() {}
  updateCreatures(_dt) {}
  renderCreatures() {}
}
```

- [ ] **Step 3: Extend `ecosystemSafari.css`** for the new layout (`.eco-game`, `.eco-topbar`, `.eco-tip`, `.eco-stage` with `#ecosystem-canvas` + `.eco-side`, `.eco-health-bar`/`.eco-health-fill`, `.eco-population-panel`/`.eco-pop-row`/`.eco-pop-bar`, `.eco-palette`/`.eco-palette-item`, `.eco-overlay`/`.eco-card`). Use semantic theme variables where a background/text is themed; the canvas has fixed habitat colors. Make `.eco-stage` a responsive flex/grid that stacks the side panel under the canvas on narrow screens. Give the canvas a sensible CSS size (e.g. `width:100%; max-width:640px; aspect-ratio: 3 / 2`). Because `BaseGame.resizeCanvas` sizes the buffer to the display box, matching CSS size avoids squish.

- [ ] **Step 4: Delete the dead validation file**

```bash
git rm games/ecosystem-safari/test-validation.js
```

- [ ] **Step 5: Manually verify in the browser**

Start `python3 -m http.server 3000`, open `http://localhost:3000/games/ecosystem-safari/`. Confirm:
- The page loads with the habitat backdrop, the goal banner, Sky's intro tip, an empty-ish population panel showing the starting species with live counts, a health meter, and a species palette.
- Tapping a palette species adds it (a new row appears; counts change).
- The engine ticks: population counts and health move over time on their own.
- Reaching a goal shows the win overlay with a "You discovered…" line; letting a required species die shows the lose overlay with the hint. "Next level" / "Try again" / "Restart" work. No console errors.

- [ ] **Step 6: Lint + commit**

```bash
node_modules/.bin/prettier --write games/ecosystem-safari/index.html games/ecosystem-safari/EcosystemSafariGame.js games/ecosystem-safari/ecosystemSafari.css
node_modules/.bin/eslint games/ecosystem-safari/EcosystemSafariGame.js
git add games/ecosystem-safari/index.html games/ecosystem-safari/EcosystemSafariGame.js games/ecosystem-safari/ecosystemSafari.css
git commit -m "feat(ecosystem-safari): rebuild game on BaseGame with live panels and level flow"
```

---

### Task 4: Animated emoji creatures on the canvas

Bring the habitat to life: render species as emoji creatures whose on-screen count tracks engine populations, with gentle motion gated on reduced-motion, and tap-a-creature fun-facts.

**Files:**
- Modify: `games/ecosystem-safari/EcosystemSafariGame.js` (implement the four Task-3 placeholders + `onClick`)

**Interfaces:**
- Consumes: `this.state_.populations`, `SPECIES_EMOJI`, `this.canvas`/`this.ctx`, `BaseGame.getPointerPosition`.

- [ ] **Step 1: Implement creature model + rendering**

Replace the four placeholder methods and add `onClick`. Mapping: show `clamp(round(pop / SCALE), 0..MAX_PER_SPECIES)` creatures per species (`SCALE = 6`, `MAX_PER_SPECIES = 8`), each a wandering emoji. Producers pinned near the ground; others wander. Cache positions across ticks so counts change without teleporting everything.

```js
  // Tunables
  static SCALE = 6;
  static MAX_PER_SPECIES = 8;

  reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  creatureCountFor(pop) {
    return Math.max(0, Math.min(EcosystemSafariGame.MAX_PER_SPECIES, Math.round(pop / EcosystemSafariGame.SCALE)));
  }

  /** Reconcile the creature list with current populations (add/remove to match counts). */
  rebuildCreatures() {
    if (!this.state_ || !this.canvas) return;
    const byId = {};
    for (const c of this.creatures) (byId[c.id] ??= []).push(c);
    const next = [];
    for (const p of this.state_.populations) {
      const want = this.creatureCountFor(p.currentPopulation);
      const have = byId[p.id] || [];
      for (let i = 0; i < want; i++) {
        next.push(have[i] || this.spawnCreature(p));
      }
    }
    this.creatures = next;
  }

  spawnCreature(p) {
    const w = this.canvas.width || 600;
    const h = this.canvas.height || 400;
    const isProducer = p.trophicLevel <= 1;
    return {
      id: p.id,
      emoji: SPECIES_EMOJI[p.id] || '❓',
      x: 20 + Math.random() * (w - 40),
      y: isProducer ? h - 20 - Math.random() * 40 : 40 + Math.random() * (h - 90),
      isProducer,
      phase: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 0.4,
    };
  }

  updateCreatures(deltaTime) {
    // rebuild counts, then drift (unless reduced motion).
    this.rebuildCreatures();
    if (this.reducedMotion() || !this.canvas) return;
    const w = this.canvas.width;
    for (const c of this.creatures) {
      if (c.isProducer) continue;
      c.phase += deltaTime / 500;
      c.x += c.vx * (deltaTime / 16.67);
      if (c.x < 16 || c.x > w - 16) c.vx *= -1;
    }
  }

  renderCreatures() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '28px serif';
    for (const c of this.creatures) {
      const bob = c.isProducer || this.reducedMotion() ? 0 : Math.sin(c.phase) * 4;
      ctx.fillText(c.emoji, c.x, c.y + bob);
    }
  }

  /** Tap a creature → fun-fact card (BaseGame passes canvas-pixel position). */
  onClick(position) {
    if (!this.creatures.length) return;
    let best = null;
    let bestD = 30 * 30; // within ~30px
    for (const c of this.creatures) {
      const dx = c.x - position.x;
      const dy = c.y - position.y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    if (best) this.showFactCard(best.id);
  }
```

Then in `render()` (already calls `renderCreatures()`) confirm creatures draw over the background. Remove the now-obsolete no-op placeholders from Task 3.

- [ ] **Step 2: Manually verify in the browser**

With the server running, open the game. Confirm: creatures appear for each species; adding a species spawns its emoji; as populations rise/fall the number of creatures changes; animals gently drift, producers stay along the ground; tapping a creature shows its fun-fact in the tip bar. Then toggle reduced motion (`page.emulateMedia({reducedMotion:'reduce'})` in a throwaway Playwright, or OS setting) and confirm creatures still appear/disappear but hold still.

- [ ] **Step 3: Lint + commit**

```bash
node_modules/.bin/prettier --write games/ecosystem-safari/EcosystemSafariGame.js
node_modules/.bin/eslint games/ecosystem-safari/EcosystemSafariGame.js
git add games/ecosystem-safari/EcosystemSafariGame.js
git commit -m "feat(ecosystem-safari): animate emoji creatures that track populations"
```

---

### Task 5: Balance pass — make the 5 levels winnable and fun

The engine is real, so starting populations, `SIM_TICK_MS`, `SCALE`, and goal thresholds must be tuned so each level is *actually* beatable by the intended action and losable by inaction. This task is playtesting + tuning constants in `levels.js` (and, if needed, `SIM_TICK_MS`/`SCALE`), with a scripted sanity check.

**Files:**
- Modify: `games/ecosystem-safari/levels.js` (tune numbers only)
- Possibly modify: `games/ecosystem-safari/EcosystemSafariGame.js` (tick rate / scale constants)
- Test: `tests/unit/ecosystem-safari/balance.test.js`

**Interfaces:** none new — tuning only.

- [ ] **Step 1: Write a headless balance sanity test**

Drives the *model* (engine + LevelManager) without DOM, simulating the intended winning action, asserting each level reaches `won`, and that doing nothing on the survive/predator levels does not trivially win. `tests/unit/ecosystem-safari/balance.test.js`:

```js
import { describe, it, expect } from 'vitest';
import levels from '../../../games/ecosystem-safari/levels.js';
import LevelManager from '../../../games/ecosystem-safari/LevelManager.js';
import EcosystemEngine from '../../../games/ecosystem-safari/EcosystemEngine.js';
import SpeciesManager from '../../../games/ecosystem-safari/SpeciesManager.js';
import HabitatBuilder from '../../../games/ecosystem-safari/HabitatBuilder.js';

const TICK = 500;

function playLevel(level, addPlan) {
  const sm = new SpeciesManager();
  const hb = new HabitatBuilder();
  const engine = new EcosystemEngine({});
  const lm = new LevelManager([level]);
  hb.selectHabitat(level.habitat);
  const habitat = hb.getCurrentHabitat();
  engine.reset();
  engine.addHabitat({ ...habitat, type: habitat.id });
  for (const s of level.starting) engine.addSpecies(sm.getSpecies(s.species), s.population);

  let elapsed = 0;
  let verdict = { status: 'playing' };
  const limit = level.goal.durationSec || level.goal.timeoutSec || 30;
  // apply the winning plan up front (add the species the level expects)
  for (const id of addPlan) engine.addSpecies(sm.getSpecies(id), 12);
  while (elapsed <= limit + 5 && verdict.status === 'playing') {
    if (level.challenge && !engine.__ch && elapsed >= level.challenge.atSec) {
      engine.applyChallenge({ type: level.challenge.type });
      engine.__ch = true;
    }
    engine.update(TICK);
    elapsed += TICK / 1000;
    verdict = lm.evaluateGoal(level, engine.getEcosystemState(), elapsed);
  }
  return verdict.status;
}

describe('level balance (winnable with the intended action)', () => {
  // The addPlan encodes the species the level's hint tells the player to add.
  const plans = {
    'meadow-food-chain': ['rabbit'],
    'meadow-predator-prey': ['hawk'],
    'forest-decomposers': ['bacteria'],
    'ocean-balance': ['sea_turtle', 'shark'],
    'meadow-drought': ['rabbit', 'bacteria'],
  };
  for (const level of levels) {
    it(`${level.id} is winnable`, () => {
      expect(playLevel(level, plans[level.id])).toBe('won');
    });
  }
});
```

- [ ] **Step 2: Run it and tune**

Run: `node_modules/.bin/vitest run tests/unit/ecosystem-safari/balance.test.js`
Expected initially: some levels may FAIL (`lost`/`playing`). Tune `starting` populations, `goal.durationSec`/`healthTarget`/`minSpecies`, and (if the sim moves too fast/slow) `SIM_TICK_MS` in the controller and `TICK` here in lockstep, until all five report `won` with the intended plan. Keep changes to numbers; do not change the engine. This is the "make it fun and fair" step — the goal is that the obvious correct action wins comfortably and inaction fails.

- [ ] **Step 3: Re-verify in the browser** that each level plays well by hand (the intended action wins within the timer; ignoring the problem loses). Adjust numbers if the felt difficulty differs from the headless result.

- [ ] **Step 4: Commit**

```bash
node_modules/.bin/prettier --write games/ecosystem-safari/levels.js games/ecosystem-safari/EcosystemSafariGame.js tests/unit/ecosystem-safari/balance.test.js
node_modules/.bin/vitest run
git add games/ecosystem-safari/levels.js games/ecosystem-safari/EcosystemSafariGame.js tests/unit/ecosystem-safari/balance.test.js
git commit -m "feat(ecosystem-safari): tune the five levels to be fair and winnable"
```

---

### Task 6: Cleanup, nav link, docs, service worker

Make the game reachable and the repo truthful.

**Files:**
- Modify: `components/layout/navbar.html`, `utils/navigationHelper.js` (optional nav link — confirm with product owner; see note)
- Modify: `games/ecosystem-safari/README.md`, `games/ecosystem-safari/VALIDATION_REPORT.md`
- Modify: `public/serviceWorker.js` (precache the real script paths)
- Modify: `config/gameRegistry.js` if it lists an outdated scriptPath/gameClass for this game (verify first)
- Modify: `PLAN.md` (mark the build-out done)

- [ ] **Step 1: Correct the docs.** In `README.md` and `VALIDATION_REPORT.md`, replace the "fully playable / COMPLETE" claims with an accurate description: v1 is a 5-level guided game on `BaseGame`; the engine/species/habitat/journal modules are the model layer; sandbox/difficulty/achievements are v2. Remove references to `test-validation.js`.

- [ ] **Step 2: Service worker.** If `public/serviceWorker.js` precaches ecosystem-safari files, update the list to the shipped modules (`EcosystemSafariGame.js`, `LevelManager.js`, `levels.js`, `EcosystemEngine.js`, `SpeciesManager.js`, `HabitatBuilder.js`, `DiscoveryJournal.js`, `ecosystemSafari.css`) and bump `CACHE_NAME` (e.g. v7 → v8). If it doesn't list this game, skip.

- [ ] **Step 3: Registry.** In `config/gameRegistry.js`, confirm the ecosystem-safari entry's `scriptPath`/`gameClass` match reality (`/games/ecosystem-safari/EcosystemSafariGame.js`, `EcosystemSafariGame`). Fix if stale.

- [ ] **Step 4 (get product owner's yes first): Nav link.** Add `<li><a href="/games/ecosystem-safari/">Ecosystem Safari</a></li>`? The subject nav lists *subjects*, not games; the other games are reached from subject pages, not the navbar. Do NOT add to the main navbar unless the product owner wants games in it. Instead, prefer linking it from the Science subject page's games area (mirroring how the art page links Color Palette). Confirm placement before editing.

- [ ] **Step 5: Update `PLAN.md`** — change the "Ecosystem Safari: engine is empty placeholder methods — build or delete" / "initializes now, deeper gameplay TBD" line to reflect the shipped v1 guided-levels game.

- [ ] **Step 6: Commit**

```bash
node_modules/.bin/prettier --write games/ecosystem-safari/README.md games/ecosystem-safari/VALIDATION_REPORT.md PLAN.md
git add -A games/ecosystem-safari/README.md games/ecosystem-safari/VALIDATION_REPORT.md public/serviceWorker.js config/gameRegistry.js PLAN.md
git commit -m "docs(ecosystem-safari): correct docs, service worker, and registry for the v1 game"
```

---

### Task 7: Playwright end-to-end

Prove the loop works in a real browser and guard it.

**Files:**
- Create: `e2e/tests/ecosystem-safari.spec.ts`

**Interfaces:** consumes `window.ecosystemGame` and the DOM ids from Task 3.

- [ ] **Step 1: Write the spec** (plain `@playwright/test`, alongside `e2e/tests/games.spec.ts`):

```ts
import { test, expect } from '@playwright/test';

test.describe('Ecosystem Safari', () => {
  test('loads the BaseGame version with a habitat, palette, and live panels', async ({ page }) => {
    await page.goto('/games/ecosystem-safari/');
    await page.waitForFunction(() => (window as any).ecosystemGame);
    await expect(page.locator('#ecosystem-canvas')).toBeVisible();
    await expect(page.locator('#eco-palette .eco-palette-item')).not.toHaveCount(0);
    await expect(page.locator('#eco-population-panel .eco-pop-row')).not.toHaveCount(0);
    expect(await page.evaluate(() => (window as any).ecosystemGame.constructor.name)).toBe(
      'EcosystemSafariGame'
    );
  });

  test('tapping a palette species adds it to the ecosystem', async ({ page }) => {
    await page.goto('/games/ecosystem-safari/');
    await page.waitForFunction(() => (window as any).ecosystemGame);
    const before = await page.evaluate(() => (window as any).ecosystemGame.state_.populations.length);
    await page.locator('#eco-palette .eco-palette-item').first().click();
    await expect
      .poll(() => page.evaluate(() => (window as any).ecosystemGame.state_.populations.length))
      .toBeGreaterThan(before);
  });

  test('completing level 1 shows the win overlay with a lesson', async ({ page }) => {
    await page.goto('/games/ecosystem-safari/');
    await page.waitForFunction(() => (window as any).ecosystemGame);
    // Add the intended species, then let the sim run out the survive timer.
    await page.locator('#eco-palette .eco-palette-item').first().click(); // rabbit is first in level 1 palette
    await expect(page.locator('#eco-win')).toBeVisible({ timeout: 40000 });
    await expect(page.locator('#eco-win-lesson')).not.toBeEmpty();
  });

  test('mobile viewport is playable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/games/ecosystem-safari/');
    await page.waitForFunction(() => (window as any).ecosystemGame);
    await expect(page.locator('#ecosystem-canvas')).toBeVisible();
  });
});
```

- [ ] **Step 2: Verify locally** with a throwaway standalone config (project e2e config can't load here), as `games.spec.ts` was verified: repo-local `_eco.config.ts` with `testMatch: 'ecosystem-safari.spec.ts'` and `baseURL: http://localhost:3000`; run `node_modules/.bin/playwright test --config ./_eco.config.ts` with the static server up; iterate until green; delete the temp config. If the level-1 win test is timing-flaky, raise the timeout or reduce level 1's `durationSec` (in coordination with Task 5).

- [ ] **Step 3: Commit** (only the spec):

```bash
node_modules/.bin/prettier --write e2e/tests/ecosystem-safari.spec.ts
git add e2e/tests/ecosystem-safari.spec.ts
git commit -m "test(ecosystem-safari): e2e for load, add-species, win, and mobile"
```

---

## Self-Review

**Spec coverage:**
- Guided puzzle-levels loop → Tasks 2 (LevelManager/levels) + 3 (flow) + 5 (balance). ✓
- Animated emoji habitat + DOM controls → Tasks 3 (panels/background) + 4 (creatures). ✓
- Tap-to-add + tap-a-creature/row facts → Task 3 (palette, pop-row facts) + Task 4 (`onClick`). ✓
- Reuse engine/species/habitat/journal as model → Tasks 1, 3 (correct APIs: object `addSpecies`, `type` bridge, underscore lessons, ungated `getLessonContent`). ✓
- Extends BaseGame → Task 3. ✓
- Live population panel (counts + bars) + health meter → Task 3. ✓
- Sky's tips (aria-live), contextual hints, end-of-level recap → Task 3 (`setTip`, `maybeHint`, `winLevel`). ✓
- Accessibility (aria-live, button palette, pop-row keyboard path to facts, reduced-motion, focus to goal) → Tasks 3 + 4. ✓
- 5 levels across grassland/forest/ocean, correct rosters → Task 2 (roster-integrity test enforces it). ✓
- Data fixes (shark→sea_turtle; desert/arctic unused) → Task 1 + level data. ✓
- Gentle retry, not harsh game-over → Task 3 (`loseLevel` overlay + hint). ✓
- Linear progression persisted → currentLevel/advance; **persistence to localStorage is minimal in this plan** — the plan tracks progression in memory via `LevelManager`; if durable cross-session unlock is required, add a small `localStorage` read/write in `wireControls`/`loadCurrentLevel` (noted as a small add, not a separate task).
- Testing: Vitest (model-fixes, levels, levelManager, balance) + Playwright → Tasks 1,2,5,7. ✓
- No new art/audio (emoji + BaseGame tones) → honored. ✓
- v2 items (sandbox, difficulty, achievements, hidden levels, desert/arctic, time-graph) → out of scope, not present. ✓

**Placeholder scan:** The Task-3 controller intentionally includes no-op `rebuildCreatures/updateCreatures/renderCreatures` that Task 4 replaces — this is a deliberate, documented staging (each task is independently runnable), not an unfilled placeholder. Task 6 has two "confirm with product owner" gates (nav placement, registry accuracy) that are verification steps, not blanks. No "TBD/add error handling/similar to Task N" anywhere; code blocks are complete.

**Type/name consistency:** `state_` (engine snapshot), `level_` (current level), `levelManager`, `evaluateGoal(level,state,elapsedSec)`, `getEcosystemState()` shape, `getLessonContent(id)`, `SPECIES_EMOJI`, and the DOM ids (`#eco-*`) are used identically across Tasks 3–7 and the e2e spec. `addSpecies(object,pop)`, `addHabitat({...,type})`, and underscore lesson keys match the verified model APIs in Global Constraints.

**Open tuning risk (called out, not hidden):** Task 5 exists precisely because the real engine's dynamics may not make every level trivially winnable at first-draft numbers; the balance test + browser playtest are the mechanism to resolve it, and the e2e win-test timeout depends on level 1's tuned `durationSec`.
