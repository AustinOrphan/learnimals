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
