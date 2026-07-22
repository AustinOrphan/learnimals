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
