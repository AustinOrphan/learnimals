import { describe, it, expect } from 'vitest';
import levels from '../../../games/ecosystem-safari/levels.js';
import LevelManager from '../../../games/ecosystem-safari/LevelManager.js';
import EcosystemEngine from '../../../games/ecosystem-safari/EcosystemEngine.js';
import SpeciesManager from '../../../games/ecosystem-safari/SpeciesManager.js';
import HabitatBuilder from '../../../games/ecosystem-safari/HabitatBuilder.js';

// Must match SIM_TICK_MS in EcosystemSafariGame.js — EcosystemEngine's
// predator-hunting drain is NOT scaled by deltaTime (unlike growth/mortality),
// so the tick rate itself is a balance-relevant constant, not just a
// discretization detail. See the SIM_TICK_MS comment for details.
const TICK = 1000;

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

describe('level balance (inaction does not trivially win)', () => {
  // Levels whose goal is to survive/keep specific species alive, or to reach
  // a health target, should not be winnable by doing nothing — the player
  // must take the hinted action.
  const inactionLevels = [
    'meadow-food-chain',
    'meadow-predator-prey',
    'forest-decomposers',
    'ocean-balance',
    'meadow-drought',
  ];
  for (const level of levels.filter(l => inactionLevels.includes(l.id))) {
    it(`${level.id} is NOT won by doing nothing`, () => {
      expect(playLevel(level, [])).not.toBe('won');
    });
  }
});
