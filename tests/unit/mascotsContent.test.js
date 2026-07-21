import { describe, it, expect } from 'vitest';
import { mascots } from '../../data/mascotsContent.js';
import config from '../../config.js';

const SUBJECT_KEYS = ['math', 'science', 'reading', 'art', 'coding', 'music', 'geography'];

describe('mascotsContent', () => {
  it('exports a mascot for every subject key', () => {
    expect(Object.keys(mascots).sort()).toEqual([...SUBJECT_KEYS].sort());
  });

  it('every mascot has the fields the app relies on', () => {
    for (const key of SUBJECT_KEYS) {
      const m = mascots[key];
      expect(m.name, key).toBeTruthy();
      expect(m.type, key).toBeTruthy();
      expect(m.species, key).toBeTruthy();
      expect(m.image, key).toMatch(/^\/public\/images\//);
      expect(m.personality.traits.enthusiasm, key).toBeTypeOf('number');
      expect(m.personality.catchphrase, key).toBeTruthy();
    }
  });

  it('config re-exposes the same mascot objects (non-breaking refactor)', () => {
    for (const key of SUBJECT_KEYS) {
      expect(config.subjects[key].character, key).toBe(mascots[key]);
    }
  });
});
