import { describe, it, expect } from 'vitest';
import { animalsContent } from '../../data/animalsContent.js';
import { mascots } from '../../data/mascotsContent.js';

describe('animalsContent', () => {
  it('has the 7 mascot animals', () => {
    expect(animalsContent).toHaveLength(7);
  });

  it('every entry maps to a real mascot with a matching species', () => {
    for (const a of animalsContent) {
      const m = mascots[a.subject];
      expect(m, a.subject).toBeTruthy();
      expect(a.species, a.subject).toBe(m.species);
    }
  });

  it('species are unique', () => {
    const species = animalsContent.map(a => a.species);
    expect(new Set(species).size).toBe(species.length);
  });

  it('every entry has non-empty facts and a valid reaction', () => {
    for (const a of animalsContent) {
      expect(a.facts.length, a.species).toBeGreaterThanOrEqual(3);
      a.facts.forEach(f => expect(typeof f, a.species).toBe('string'));
      expect(a.reaction.emoji, a.species).toBeTruthy();
      expect(['wiggle', 'bob'], a.species).toContain(a.reaction.animation);
    }
  });

  it('every quiz question has answer within options', () => {
    for (const a of animalsContent) {
      expect(a.quiz.length, a.species).toBe(3);
      a.quiz.forEach(q => {
        expect(q.options.length, a.species).toBeGreaterThanOrEqual(3);
        expect(q.options, `${a.species}: ${q.question}`).toContain(q.answer);
      });
    }
  });
});
