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
    expect(lm.evaluateGoal({ goal: survive }, state(80, ['grass', 'rabbit']), 5).status).toBe(
      'playing'
    );
  });
  it('survive: won once required species survive the full duration', () => {
    expect(lm.evaluateGoal({ goal: survive }, state(80, ['grass', 'rabbit']), 20).status).toBe(
      'won'
    );
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
    expect(lm.evaluateGoal({ goal: bio }, state(50, ['grass', 'rabbit', 'hawk']), 30).status).toBe(
      'won'
    );
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
